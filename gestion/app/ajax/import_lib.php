<?php
/**
 * Bibliothèque d'import / export CSV du catalogue (module A2).
 * Ce n'est PAS un endpoint : il est inclus par les endpoints import_*, pieces_import* et pieces_export*.
 *
 * Principes
 *  - le fichier téléversé n'est jamais enregistré ni exécuté : on lit son contenu en mémoire, puis on l'oublie ;
 *  - l'analyse (aperçu) et l'application utilisent LA MÊME fonction d'analyse, et l'application la rejoue entière,
 *    dans la transaction, sur les données courantes de la base : l'aperçu n'est jamais cru sur parole ;
 *  - tout ou rien : une seule transaction ; le stock initial passe par inventaire()->ajuster().
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
	http_response_code(404);
	exit;
}

/** Refus de l'import avec le détail des lignes fautives (affichable par la page). */
class ImportException extends InventaireException
{
	/** @var array */
	public $details = array();
}

final class ImportCatalogue
{
	const MAX_OCTETS = 2097152;     // 2 Mo
	const MAX_LIGNES = 5000;        // lignes de données (hors en-tête)
	const MAX_COLONNES = 60;
	const MAX_JSON_OCTETS = 6291456;   // 6 Mo : corps JSON de la ré-analyse et de la confirmation (le fichier, lui, est limité à 2 Mo)
	const MAX_CELLULE = 5000;       // caractères gardés par cellule (le reste est rejeté par les limites de champ)
	const MAX_ALIAS = 10;           // alias par cellule
	const NOTE_STOCK = 'Stock initial (import)';

	/** Colonnes du modèle, dans l'ordre ; minimum_entreprise_N est inséré avant « emplacement ». */
	const COLONNES_AVANT_MIN = array('code', 'nom', 'categorie', 'unite', 'code_barres', 'description', 'fournisseur', 'prix_fournisseur', 'no_fournisseur');
	const COLONNES_APRES_MIN = array('emplacement', 'quantite', 'cout');
	const SYNONYMES = array(
		'alias' => 'code_barres', 'code_barre' => 'code_barres', 'codes_barres' => 'code_barres',
		'cout_unitaire' => 'cout', 'qte' => 'quantite',
	);
	/** Colonnes de l'export qui n'ont pas d'effet à l'import (le stock n'est jamais modifié). */
	const COLONNES_INFORMATIVES = '/^(actif|quantite_entreprise_\d+|cout_moyen_entreprise_\d+)$/';

	/** @var PDO */
	private $pdo;
	/** @var Inventaire */
	private $inv;
	private $uid;
	private $u;          // utilisateur (rôle + entreprises accessibles)
	private $ctx;
	private $vus;        // code (clé) -> infos de la première ligne du fichier
	private $utilises;   // code ou alias (clé) -> ['no' => ligne, 'piece' => clé du code de la pièce]

	public function __construct(PDO $pdo, Inventaire $inv, $uid)
	{
		$this->pdo = $pdo;
		$this->inv = $inv;
		$this->uid = (int) $uid;
	}

	// ======================================================================
	//  Outils de texte
	// ======================================================================

	public static function sansAccents($s)
	{
		return strtr($s, array(
			'à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ã' => 'a', 'å' => 'a', 'ç' => 'c',
			'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
			'ñ' => 'n', 'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o',
			'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ý' => 'y', 'ÿ' => 'y', 'œ' => 'oe', 'æ' => 'ae', 'ß' => 'ss',
		));
	}

	/** Clé de comparaison d'un nom (même logique que l'unicité de la base : sans casse ni accents). */
	public static function cle($s)
	{
		return trim(preg_replace('/\s+/u', ' ', self::sansAccents(mb_strtolower((string) $s))));
	}

	/** Clé d'un code (la base ignore la casse). */
	public static function cleCode($s)
	{
		return strtoupper((string) $s);
	}

	/** Nettoie une cellule : sauts de ligne normalisés, caractères de contrôle retirés, espaces rognés, apostrophe de neutralisation retirée. */
	public static function cellule($v)
	{
		$v = (string) $v;
		if (strlen($v) > self::MAX_CELLULE * 4) {
			$v = substr($v, 0, self::MAX_CELLULE * 4);
		}
		$v = str_replace(array("\r\n", "\r", "\t"), array("\n", "\n", ' '), $v);
		$v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $v);
		$r = preg_replace('/^[\s\x{00A0}]+|[\s\x{00A0}]+$/u', '', $v);
		$v = $r === null ? trim($v) : $r;
		if (preg_match("/^'[=+\\-@]/", $v)) {   // l'export ajoute une apostrophe devant = + - @ : on la retire au ré-import
			$v = substr($v, 1);
		}
		if (mb_strlen($v) > self::MAX_CELLULE) {
			$v = mb_substr($v, 0, self::MAX_CELLULE);
		}
		return $v;
	}

	private static function uneLigne($v)
	{
		return trim(preg_replace('/\s+/u', ' ', (string) $v));
	}

	/** Typographie française : espace insécable à l'intérieur de « … » et avant : ; ? ! (jamais de « » ou de « : » seul en début de ligne). */
	public static function typo($t)
	{
		$nb = "\u{00A0}";
		$t = preg_replace('/« +/u', '«' . $nb, (string) $t);
		$t = preg_replace('/ +»/u', $nb . '»', $t);
		return preg_replace('/ +([:;?!])/u', $nb . '$1', $t);
	}

	/** Nom de colonne -> forme normalisée (« Catégorie » -> « categorie », « Code-barres » -> « code_barres »). */
	public static function nomColonne($s)
	{
		$s = self::sansAccents(mb_strtolower(trim((string) $s)));
		$s = trim(preg_replace('/[^a-z0-9]+/', '_', $s), '_');
		return isset(self::SYNONYMES[$s]) ? self::SYNONYMES[$s] : $s;
	}

	// ======================================================================
	//  Lecture du fichier
	// ======================================================================

	/**
	 * Octets -> texte UTF-8. Détecte UTF-8 (avec ou sans BOM) et Windows-1252 ; refuse tout ce qui n'est pas du texte.
	 * @return array{0:string,1:string} [texte, encodage]
	 */
	public static function decoder($octets)
	{
		if ($octets === '' || $octets === false) {
			throw new InventaireException('Le fichier est vide.');
		}
		if (strncmp($octets, "\xFF\xFE", 2) === 0 || strncmp($octets, "\xFE\xFF", 2) === 0) {
			throw new InventaireException('Ce fichier est enregistré en Unicode (UTF-16). Dans Excel, choisissez « CSV UTF-8 (délimité par des virgules) » pour l\'enregistrer.');
		}
		if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $octets)) {
			throw new InventaireException('Ce fichier n\'est pas un fichier texte CSV (il contient des données binaires). Exportez votre tableau en CSV, puis réessayez.');
		}
		if (strncmp($octets, "\xEF\xBB\xBF", 3) === 0) {
			$octets = substr($octets, 3);
		}
		if (mb_check_encoding($octets, 'UTF-8')) {
			return array($octets, 'UTF-8');
		}
		return array(mb_convert_encoding($octets, 'UTF-8', 'Windows-1252'), 'Windows-1252');
	}

	/** Séparateur probable (; ou ,) d'après la première ligne non vide, en ignorant ce qui est entre guillemets. */
	public static function separateur($texte)
	{
		$pv = 0;
		$vir = 0;
		$dansGuillemets = false;
		for ($i = 0, $n = strlen($texte); $i < $n && $i < 20000; $i++) {
			$c = $texte[$i];
			if ($c === '"') {
				$dansGuillemets = !$dansGuillemets;
			} elseif (!$dansGuillemets) {
				if ($c === ';') {
					$pv++;
				} elseif ($c === ',') {
					$vir++;
				} elseif (($c === "\n" || $c === "\r") && ($pv + $vir) > 0) {
					break;
				}
			}
		}
		return $vir > $pv ? ',' : ';';
	}

	/**
	 * Analyse syntaxique CSV (RFC 4180 tolérant) : guillemets, guillemets doublés, retours à la ligne dans une cellule,
	 * fins de ligne \r\n, \n ou \r. Lève une erreur au-delà de 5 000 lignes de données.
	 * @return array{lignes:array,vides:int}  lignes : [ ['no' => n° de ligne du fichier, 'cellules' => [...]], ... ]
	 */
	public static function lireCsv($t, $sep)
	{
		$n = strlen($t);
		$i = 0;
		$no = 1;
		$noEnreg = 1;
		$rec = array();
		$lignes = array();
		$vides = 0;
		$stop = $sep . "\r\n";
		$fin = function () use (&$rec, &$lignes, &$vides, &$noEnreg) {
			$vide = true;
			foreach ($rec as $c) {
				if (trim($c) !== '') {
					$vide = false;
					break;
				}
			}
			if ($vide) {
				$vides++;
			} else {
				if (count($rec) > ImportCatalogue::MAX_COLONNES) {
					throw new InventaireException('Trop de colonnes (maximum ' . ImportCatalogue::MAX_COLONNES . ') à la ligne ' . $noEnreg . '.');
				}
				$lignes[] = array('no' => $noEnreg, 'cellules' => $rec);
				if (count($lignes) > ImportCatalogue::MAX_LIGNES + 1) {   // en-tête + lignes de données
					throw new InventaireException('Le fichier contient plus de ' . number_format(ImportCatalogue::MAX_LIGNES, 0, ',', ' ') . ' lignes de données. Découpez-le en plusieurs fichiers.');
				}
			}
			$rec = array();
		};
		while ($i < $n) {
			if ($rec === array()) {
				$noEnreg = $no;
			}
			if ($t[$i] === '"') {
				$i++;
				$cell = '';
				$ferme = false;
				$noDebut = $no;
				while ($i < $n) {
					$j = strcspn($t, "\"\r\n", $i);
					$cell .= substr($t, $i, $j);
					$i += $j;
					if ($i >= $n) {
						break;
					}
					$c = $t[$i];
					if ($c === '"') {
						if ($i + 1 < $n && $t[$i + 1] === '"') {
							$cell .= '"';
							$i += 2;
							continue;
						}
						$i++;
						$ferme = true;
						break;
					}
					if ($c === "\r" && $i + 1 < $n && $t[$i + 1] === "\n") {
						$i++;
					}
					$cell .= "\n";
					$no++;
					$i++;
				}
				if (!$ferme) {
					throw new InventaireException('Guillemet non fermé : la cellule commencée à la ligne ' . $noDebut . ' n\'est jamais terminée. Vérifiez les guillemets de cette ligne.');
				}
				$j = strcspn($t, $stop, $i);   // texte collé après le guillemet fermant : conservé
				$cell .= substr($t, $i, $j);
				$i += $j;
			} else {
				$j = strcspn($t, $stop, $i);
				$cell = substr($t, $i, $j);
				$i += $j;
			}
			$rec[] = $cell;
			if ($i >= $n) {
				break;
			}
			$c = $t[$i];
			if ($c === $sep) {
				$i++;
				if ($i >= $n) {
					$rec[] = '';
				}
				continue;
			}
			if ($c === "\r" && $i + 1 < $n && $t[$i + 1] === "\n") {
				$i++;
			}
			$i++;
			$fin();
			$no++;
		}
		if ($rec !== array()) {
			$fin();
		}
		return array('lignes' => $lignes, 'vides' => $vides);
	}

	/**
	 * Fichier téléversé ($_FILES['fichier']) -> lignes prêtes à analyser. Le fichier reste dans le dossier temporaire de PHP.
	 * @return array{lignes:array,meta:array}
	 */
	public function lireFichier($f)
	{
		if (!is_array($f) || !isset($f['error'])) {
			throw new InventaireException('Choisissez un fichier CSV à importer.', 'fichier');
		}
		if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
			throw new InventaireException('Le fichier dépasse 2 Mo : découpez-le en plusieurs fichiers.', 'fichier');
		}
		if ($f['error'] === UPLOAD_ERR_NO_FILE) {
			throw new InventaireException('Choisissez un fichier CSV à importer.', 'fichier');
		}
		if ($f['error'] !== UPLOAD_ERR_OK || !isset($f['tmp_name']) || !is_uploaded_file($f['tmp_name'])) {
			throw new InventaireException('Le téléversement du fichier a échoué. Réessayez.', 'fichier');
		}
		$nom = isset($f['name']) ? (string) $f['name'] : '';
		$ext = strtolower(pathinfo($nom, PATHINFO_EXTENSION));
		if ($ext !== 'csv' && $ext !== 'txt') {
			throw new InventaireException('Le fichier doit être un fichier .csv ou .txt. Dans Excel : « Enregistrer sous », puis « CSV UTF-8 ».', 'fichier');
		}
		if ((int) $f['size'] > self::MAX_OCTETS) {
			throw new InventaireException('Le fichier dépasse 2 Mo : découpez-le en plusieurs fichiers.', 'fichier');
		}
		$octets = file_get_contents($f['tmp_name'], false, null, 0, self::MAX_OCTETS + 1);
		if ($octets !== false && strlen($octets) > self::MAX_OCTETS) {
			throw new InventaireException('Le fichier dépasse 2 Mo : découpez-le en plusieurs fichiers.', 'fichier');
		}
		list($texte, $encodage) = self::decoder($octets);
		unset($octets);
		$sep = self::separateur($texte);
		$csv = self::lireCsv($texte, $sep);
		unset($texte);
		if (!$csv['lignes']) {
			throw new InventaireException('Le fichier ne contient aucune donnée.', 'fichier');
		}
		$entete = array_shift($csv['lignes']);
		$cols = self::colonnes($entete['cellules']);
		if (!$csv['lignes']) {
			throw new InventaireException('Le fichier ne contient que l\'en-tête : ajoutez des lignes de données.', 'fichier');
		}
		$lignes = array();
		foreach ($csv['lignes'] as $l) {
			$v = array();
			foreach ($cols['index'] as $idx => $cle) {
				$val = self::cellule(isset($l['cellules'][$idx]) ? $l['cellules'][$idx] : '');
				if ($val !== '') {   // cellules vides omises : le « source » renvoyé au navigateur (puis à la confirmation) reste léger
					$v[$cle] = $val;
				}
			}
			// Cellules en trop (non vides) : colonne mal guillemetée -> données décalées
			$trop = false;
			for ($k = count($cols['entetes']); $k < count($l['cellules']); $k++) {
				if (trim($l['cellules'][$k]) !== '') {
					$trop = true;
					break;
				}
			}
			$ligne = array('no' => $l['no'], 'v' => $v);
			if ($trop) {
				$ligne['trop'] = true;
			}
			$lignes[] = $ligne;
		}
		return array(
			'lignes' => $lignes,
			'meta' => array(
				'fichier' => mb_substr(preg_replace('/[\x00-\x1F\x7F]/', '', basename($nom)), 0, 100),
				'separateur' => $sep, 'encodage' => $encodage, 'nb_lignes' => count($lignes), 'lignes_vides' => $csv['vides'],
				'colonnes' => array_values($cols['index']), 'colonnes_ignorees' => $cols['ignorees'], 'colonnes_informatives' => $cols['informatives'],
			),
		);
	}

	/**
	 * En-têtes -> colonnes reconnues.
	 * @return array{index:array,entetes:array,ignorees:array,informatives:array}  index : position => nom de colonne
	 */
	public static function colonnes(array $entetes)
	{
		$index = array();
		$ignorees = array();
		$info = array();
		$vus = array();
		$valides = array_merge(self::COLONNES_AVANT_MIN, self::COLONNES_APRES_MIN);
		foreach ($entetes as $pos => $brut) {
			$brut = self::cellule($brut);
			if ($brut === '') {
				continue;
			}
			$k = self::nomColonne($brut);
			if (in_array($k, $valides, true) || preg_match('/^minimum_entreprise_[1-9]\d{0,8}$/', $k)) {
				if (isset($vus[$k])) {
					throw new InventaireException('La colonne « ' . $k . ' » apparaît deux fois dans l\'en-tête.', 'fichier');
				}
				$vus[$k] = true;
				$index[$pos] = $k;
			} elseif (preg_match(self::COLONNES_INFORMATIVES, $k)) {
				$info[] = mb_substr($brut, 0, 60);
			} else {
				$ignorees[] = mb_substr($brut, 0, 60);
			}
		}
		if (!isset($vus['code'])) {
			$lus = array();
			foreach ($entetes as $e) {
				if (trim($e) !== '') {
					$lus[] = '« ' . mb_substr(self::cellule($e), 0, 30) . ' »';
				}
				if (count($lus) >= 6) {
					break;
				}
			}
			throw new InventaireException('Colonne « code » introuvable. En-têtes lus : ' . ($lus ? implode(', ', $lus) : 'aucun') . '. Vérifiez le séparateur et utilisez le modèle CSV.', 'fichier');
		}
		return array('index' => $index, 'entetes' => $entetes, 'ignorees' => $ignorees, 'informatives' => $info);
	}

	/** Lignes renvoyées par le navigateur -> lignes normalisées (le serveur revalide tout, ligne par ligne). */
	public static function lignesClient($brut)
	{
		if (!is_array($brut) || !$brut) {
			throw new InventaireException('Aucune ligne à traiter. Analysez d\'abord un fichier.', 'lignes');
		}
		if (count($brut) > self::MAX_LIGNES) {
			throw new InventaireException('Trop de lignes (maximum ' . number_format(self::MAX_LIGNES, 0, ',', ' ') . ').', 'lignes');
		}
		$valides = array_merge(self::COLONNES_AVANT_MIN, self::COLONNES_APRES_MIN);
		$out = array();
		foreach (array_values($brut) as $i => $l) {
			if (!is_array($l) || !isset($l['v']) || !is_array($l['v'])) {
				throw new InventaireException('Ligne ' . ($i + 1) . ' invalide. Analysez de nouveau le fichier.', 'lignes');
			}
			$v = array();
			foreach ($l['v'] as $k => $val) {
				if (is_string($k) && (in_array($k, $valides, true) || preg_match('/^minimum_entreprise_[1-9]\d{0,8}$/', $k)) && (is_string($val) || is_int($val) || is_float($val))) {
					$v[$k] = self::cellule((string) $val);
				}
			}
			$out[] = array('no' => isset($l['no']) ? (int) $l['no'] : $i + 2, 'v' => $v, 'trop' => !empty($l['trop']));
		}
		return $out;
	}

	/** Refuse un corps JSON démesuré AVANT de le lire (sinon un gros corps épuise la mémoire du serveur : réponse 500 vide). */
	public static function exigerTailleCorps()
	{
		$type = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
		$len = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
		if ($len > self::MAX_JSON_OCTETS && stripos($type, 'multipart/form-data') === false) {
			throw new InventaireException('Les données envoyées sont trop volumineuses. Analysez de nouveau le fichier.', 'lignes');
		}
	}

	/** Options de l'import (la page les envoie en JSON ou en champs de formulaire). */
	public static function options(array $d)
	{
		$bool = function ($v) {
			return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'on';
		};
		$mode = isset($d['mode']) ? $d['mode'] : 'creer';
		if ($mode !== 'creer' && $mode !== 'creer_maj') {
			throw new InventaireException('Mode d\'import invalide.', 'mode');
		}
		return array(
			'mode' => $mode,
			'creer_categories' => $bool(isset($d['creer_categories']) ? $d['creer_categories'] : false),
			'creer_fournisseurs' => $bool(isset($d['creer_fournisseurs']) ? $d['creer_fournisseurs'] : false),
		);
	}

	// ======================================================================
	//  Nombres
	// ======================================================================

	/**
	 * Texte -> entier mis à l'échelle (Dec). Accepte « 1 234,56 », « 1234.56 », « 1.234,56 », « 1,234.56 », « 12,50 $ ».
	 * Les séparateurs de milliers (espace, espace insécable ordinaire, fine ou fine insécable, point ou virgule) doivent
	 * séparer des groupes de EXACTEMENT 3 chiffres : « 1.5.2 », « 1,5, » ou « 1 2 3 » sont refusés (jamais lus de travers).
	 * @param bool $arrondi mis à true si des décimales ont été perdues
	 */
	private static function nombre($brut, $echelle, &$arrondi)
	{
		$s = trim(str_replace('$', '', (string) $brut));
		$s = preg_replace('/^[\s\x{00A0}\x{202F}\x{2009}\x{2007}]+|[\s\x{00A0}\x{202F}\x{2009}\x{2007}]+$/u', '', $s);
		$invalide = new InventaireException('Valeur numérique invalide.');
		if ($s === null || !preg_match('/^([+-]?)(.+)$/su', $s, $m)) {
			throw $invalide;
		}
		$signe = $m[1];
		$corps = $m[2];
		$esp = '[ \x{00A0}\x{202F}\x{2009}\x{2007}]';
		$n = null;   // forme normalisée « 1234.56 »
		if (preg_match('/^\d+$/', $corps)) {
			$n = $corps;
		} elseif (preg_match('/^(\d{1,3}(?:' . $esp . '\d{3})+)(?:[.,](\d+))?$/u', $corps, $g)) {         // 1 234 567,5
			$n = preg_replace('/\D/u', '', $g[1]) . (isset($g[2]) ? '.' . $g[2] : '');
		} elseif (preg_match('/^(\d{1,3}(?:\.\d{3})+),(\d+)$/', $corps, $g)) {                          // 1.234.567,5
			$n = str_replace('.', '', $g[1]) . '.' . $g[2];
		} elseif (preg_match('/^(\d{1,3}(?:,\d{3})+)\.(\d+)$/', $corps, $g)) {                          // 1,234,567.5
			$n = str_replace(',', '', $g[1]) . '.' . $g[2];
		} elseif (preg_match('/^\d{1,3}(?:\.\d{3}){2,}$/', $corps) || preg_match('/^\d{1,3}(?:,\d{3}){2,}$/', $corps)) {   // 1.234.567 ou 1,234,567
			$n = preg_replace('/\D/', '', $corps);
		} elseif (preg_match('/^(\d*)[.,](\d+)$/', $corps, $g)) {                                          // 12,5 ou 12.5 ou ,5
			$n = ($g[1] === '' ? '0' : $g[1]) . '.' . $g[2];
		}
		if ($n === null) {
			throw $invalide;
		}
		if (preg_match('/\.(\d+)$/', $n, $d) && strlen($d[1]) > $echelle) {
			$arrondi = true;
		}
		return Dec::parse($signe . $n, $echelle);
	}

	/** Code interne (même règle que la fiche de pièce) : lettres majuscules, chiffres et . - _ /, 1 à 40 caractères. null si permis. */
	private static function erreurCodeInterne($code)
	{
		if (mb_strlen($code) > 40) {
			return 'Code trop long (40 caractères au maximum).';
		}
		if (!preg_match('/^[A-Z0-9.\/_-]+$/', $code)) {
			return 'Code « ' . mb_substr($code, 0, 40) . ' » : caractères non permis (accents, espaces ou symboles spéciaux). Utilisez des lettres sans accent, des chiffres et les symboles . - _ /';
		}
		return null;
	}

	/** Alias (code-barres du fabricant) : ASCII visible, sans espace, 1 à 64 caractères. null si permis. */
	private static function erreurAlias($code)
	{
		if (mb_strlen($code) > 64) {
			return 'Alias trop long (64 caractères au maximum).';
		}
		if (!preg_match('/^[\x21-\x7E]+$/', $code)) {
			return 'Alias « ' . mb_substr($code, 0, 40) . ' » : caractères non permis (accents, espaces ou symboles spéciaux).';
		}
		return null;
	}

	// ======================================================================
	//  Contexte (état de la base)
	// ======================================================================

	/**
	 * Alias (code_barres) d'une ligne : séparés par |, rognés, sans doublon (même logique que l'analyse).
	 * @return string[]
	 */
	private static function aliasDeLigne($txt)
	{
		$liste = array();
		foreach (explode('|', self::uneLigne($txt)) as $x) {
			$x = trim($x);
			if ($x !== '') {
				$liste[] = $x;
			}
		}
		return $liste;
	}

	/** Exécute une requête « WHERE col IN (…) » par paquets (pas de chargement de tout le catalogue en mémoire). */
	private function parPaquets($sql, array $valeurs)
	{
		$valeurs = array_values(array_unique($valeurs));
		foreach (array_chunk($valeurs, 500) as $paquet) {
			$st = $this->pdo->prepare(str_replace('(?)', '(' . implode(',', array_fill(0, count($paquet), '?')) . ')', $sql));
			$st->execute($paquet);
			foreach ($st as $r) {
				yield $r;
			}
		}
	}

	/**
	 * Charge l'état de la base utile à l'analyse de CES lignes : les pièces et alias dont le code figure dans le fichier
	 * (par paquets), puis leurs prix et minimums. Les emplacements, catégories et fournisseurs sont peu nombreux : chargés en entier.
	 */
	private function contexte(array $lignes)
	{
		$this->u = $this->inv->utilisateur($this->uid);
		$c = array(
			'pieces' => array(), 'codes' => array(), 'emp_code' => array(), 'emp_nom' => array(),
			'categories' => array(), 'fournisseurs' => array(), 'prix' => array(), 'seuils' => array(), 'entreprises' => array(),
		);
		foreach ($this->inv->listeEntreprises($this->uid) as $en) {   // noms affichés à la place des numéros d'entreprise
			$c['entreprises'][(int) $en['id']] = (string) $en['nom'];
		}
		$codes = array();
		foreach ($lignes as $L) {
			$v = isset($L['v']) ? $L['v'] : array();
			$code = isset($v['code']) ? strtoupper($v['code']) : '';
			if ($code !== '' && $code[0] !== '#') {
				$codes[] = $code;
			}
			if (!empty($v['code_barres'])) {
				foreach (self::aliasDeLigne($v['code_barres']) as $al) {
					$codes[] = $al;
				}
			}
		}
		$ids = array();
		foreach ($this->parPaquets('SELECT id, code, nom, description, categorie_id, unite, actif FROM pieces WHERE code IN (?)', $codes) as $r) {
			$c['pieces'][self::cleCode($r['code'])] = $r;
			$c['codes'][self::cleCode($r['code'])] = array('type' => 'piece', 'piece_id' => (int) $r['id'], 'libelle' => 'la pièce « ' . $r['code'] . ' »');
			$ids[] = (int) $r['id'];
		}
		foreach ($this->parPaquets('SELECT pc.code, pc.piece_id, p.code AS piece_code FROM pieces_codes pc JOIN pieces p ON p.id = pc.piece_id WHERE pc.code IN (?)', $codes) as $r) {
			$c['codes'][self::cleCode($r['code'])] = array('type' => 'alias', 'piece_id' => (int) $r['piece_id'], 'libelle' => 'la pièce « ' . $r['piece_code'] . ' »');
		}
		foreach ($this->pdo->query('SELECT e.id, e.nom, e.code_barres, e.actif, e.entreprise_id, en.nom AS entreprise_nom, en.actif AS entreprise_actif FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id') as $r) {
			if ($r['code_barres'] !== null && $r['code_barres'] !== '') {
				$c['codes'][self::cleCode($r['code_barres'])] = array('type' => 'emplacement', 'piece_id' => 0, 'libelle' => 'un emplacement');
			}
			if (in_array((int) $r['entreprise_id'], $this->u['entreprises'], true)) {   // seuls les emplacements accessibles sont résolus
				$r['id'] = (int) $r['id'];
				$r['entreprise_id'] = (int) $r['entreprise_id'];
				$r['utilisable'] = $r['actif'] && $r['entreprise_actif'];
				if ($r['code_barres'] !== null && $r['code_barres'] !== '') {
					$c['emp_code'][self::cleCode($r['code_barres'])] = $r;
				}
				$c['emp_nom'][self::cle($r['nom'])][] = $r;
			}
		}
		foreach ($this->pdo->query('SELECT id, nom FROM categories') as $r) {
			$c['categories'][self::cle($r['nom'])] = array('id' => (int) $r['id'], 'nom' => $r['nom']);
		}
		foreach ($this->pdo->query('SELECT id, nom, actif FROM fournisseurs') as $r) {
			$c['fournisseurs'][self::cle($r['nom'])] = array('id' => (int) $r['id'], 'nom' => $r['nom'], 'actif' => (int) $r['actif']);
		}
		foreach ($this->parPaquets('SELECT piece_id, fournisseur_id, prix, no_fournisseur FROM prix_fournisseurs WHERE piece_id IN (?)', $ids) as $r) {
			$c['prix'][(int) $r['piece_id'] . ':' . (int) $r['fournisseur_id']] = $r;
		}
		foreach ($this->parPaquets('SELECT entreprise_id, piece_id, minimum FROM seuils WHERE piece_id IN (?)', $ids) as $r) {
			$c['seuils'][(int) $r['piece_id'] . ':' . (int) $r['entreprise_id']] = $r['minimum'];
		}
		$this->ctx = $c;
	}

	// ======================================================================
	//  Analyse
	// ======================================================================

	/**
	 * Analyse toutes les lignes sur l'état courant de la base. Ne modifie rien.
	 * @param array $lignes  [ ['no'=>n, 'v'=>[colonne=>texte], 'trop'=>bool], ... ]
	 * @return array{resultats:array,totaux:array,plan:array}
	 */
	public function analyser(array $lignes, array $options)
	{
		$this->contexte($lignes);
		$this->vus = array();
		$this->utilises = array();
		$ctx = &$this->ctx;
		$mode = $options['mode'];
		$plan = array('lignes' => array(), 'stock' => array(), 'categories' => array(), 'fournisseurs' => array());
		$resultats = array();
		$tot = array('creer' => 0, 'maj' => 0, 'inchange' => 0, 'ignorer' => 0, 'erreurs' => 0, 'avertissements' => 0,
			'lignes_stock' => 0, 'documents' => 0, 'categories_a_creer' => 0, 'fournisseurs_a_creer' => 0, 'total' => 0);
		$accessibles = array_flip($this->u['entreprises']);

		foreach ($lignes as $L) {
			$v = $L['v'];
			$no = (int) $L['no'];
			$vide = true;
			foreach ($v as $x) {
				if ($x !== '') {
					$vide = false;
					break;
				}
			}
			if ($vide && empty($L['trop'])) {
				continue;
			}
			$tot['total']++;
			$g = function ($k) use ($v) {
				return isset($v[$k]) ? $v[$k] : '';
			};
			$msgs = array();
			$err = function ($t) use (&$msgs) {
				$msgs[] = array('erreur', $t);
			};
			$avert = function ($t) use (&$msgs) {
				$msgs[] = array('avertissement', $t);
			};
			$info = function ($t) use (&$msgs) {
				$msgs[] = array('info', $t);
			};
			$res = array('no' => $no, 'statut' => 'ok', 'action' => 'ignorer', 'code' => $g('code'), 'nom' => $g('nom'), 'categorie' => '', 'stock' => null, 'changements' => array(), 'msgs' => array());
			$ligne = null;   // plan de la ligne (si elle crée / met à jour)

			$code = strtoupper($g('code'));   // les codes internes sont toujours en majuscules (comme la fiche de pièce)
			$res['code'] = $code;
			if (!empty($L['trop'])) {
				$err('La ligne contient plus de cellules que l\'en-tête : un texte contenant le séparateur n\'est probablement pas entre guillemets.');
			}
			if ($code !== '' && $code[0] === '#') {
				$res['action'] = 'ignorer';
				$res['statut'] = 'ignoree';
				$res['msgs'] = array(array('info', self::typo('Ligne en commentaire (code commençant par #) : ignorée.')));
				$tot['ignorer']++;
				$resultats[] = $res;
				continue;
			}
			// ---- code
			$ck = null;
			if ($code === '') {
				$err('Le code est obligatoire.');
			} elseif (($e = self::erreurCodeInterne($code)) !== null) {
				$err($e);
			} else {
				$ck = self::cleCode($code);
			}
			if ($ck === null) {
				$this->clore($res, $msgs, $tot, $resultats);
				continue;
			}
			$existant = isset($ctx['pieces'][$ck]) ? $ctx['pieces'][$ck] : null;
			$extra = false;   // ligne de stock supplémentaire pour une pièce déjà vue dans le fichier
			if (isset($this->vus[$ck])) {
				$deja = &$this->vus[$ck];
				$raison = $this->raisonDoublon($deja, $v);
				if ($raison === null) {
					$extra = true;
					$avert('Code répété (déjà à la ligne ' . $deja['no'] . ') : cette ligne ajoute du stock dans un autre emplacement pour la même pièce.');
				} else {
					$err('Code en double dans le fichier (déjà à la ligne ' . $deja['no'] . ') : ' . $raison);
					unset($deja);
					$this->clore($res, $msgs, $tot, $resultats);
					continue;
				}
				unset($deja);
			} else {
				$this->vus[$ck] = array('no' => $no, 'nouvelle' => $existant === null, 'v' => $v, 'emps' => array());
			}

			// ---- ligne de stock supplémentaire : seulement emplacement / quantité / coût
			if ($extra) {
				$res['action'] = 'stock';
				$res['nom'] = isset($this->vus[$ck]['v']['nom']) && $this->vus[$ck]['v']['nom'] !== '' ? $this->vus[$ck]['v']['nom'] : $res['nom'];
				$stock = $this->analyserStock($v, $ck, $no, $err, $avert);
				if ($stock) {
					$plan['stock'][] = $stock;
					$res['stock'] = $this->stockApercu($stock);
					$tot['lignes_stock']++;
				}
				$this->clore($res, $msgs, $tot, $resultats);
				continue;
			}

			if ($existant && $mode === 'creer') {
				$avert('Le code existe déjà : ligne ignorée (mode « Créer seulement »).');
				$res['action'] = 'ignorer';
				$res['nom'] = $existant['nom'];
				$tot['ignorer']++;
				$this->clore($res, $msgs, $tot, $resultats);
				continue;
			}
			$creation = $existant === null;
			$res['action'] = $creation ? 'creer' : 'maj';
			$pieceId = $creation ? 0 : (int) $existant['id'];
			$champs = array();          // champs à écrire : nom, categorie_id/categorie_cle, unite, description
			$changements = array();

			// ---- nom
			$nom = self::uneLigne($g('nom'));
			if ($nom === '') {
				if ($creation) {
					$err('Le nom est obligatoire pour une nouvelle pièce.');
				}
			} elseif (mb_strlen($nom) > 150) {
				$err('Nom trop long (150 caractères au maximum).');
			} else {
				$champs['nom'] = $nom;
				if (!$creation && $nom !== $existant['nom']) {
					$changements[] = 'nom';
				}
			}
			$res['nom'] = $creation ? $nom : ($nom !== '' ? $nom : $existant['nom']);

			// ---- catégorie
			$catTxt = self::uneLigne($g('categorie'));
			if ($catTxt !== '') {
				if (mb_strlen($catTxt) > 100) {
					$err('Nom de catégorie trop long (100 caractères au maximum).');
				} else {
					$kc = self::cle($catTxt);
					if (isset($ctx['categories'][$kc])) {
						$champs['categorie_cle'] = $kc;
						$res['categorie'] = $ctx['categories'][$kc]['nom'];
						if (!$creation && (int) $existant['categorie_id'] !== $ctx['categories'][$kc]['id']) {
							$changements[] = 'catégorie';
						}
					} elseif (!empty($options['creer_categories'])) {
						$premiere = !isset($plan['categories'][$kc]);
						if ($premiere) {
							$plan['categories'][$kc] = $catTxt;
						}
						$champs['categorie_cle'] = $kc;
						$res['categorie'] = $plan['categories'][$kc];
						if ($premiere) {
							$avert('La catégorie « ' . $catTxt . ' » n\'existe pas : elle sera créée.');
						} else {
							$info('Catégorie « ' . $plan['categories'][$kc] . ' » : créée avec la première ligne qui l\'utilise.');
						}
						if (!$creation) {
							$changements[] = 'catégorie';
						}
					} else {
						$err('Catégorie inconnue : « ' . $catTxt . ' ». Cochez « Créer les catégories manquantes » ou corrigez le fichier.');
					}
				}
			}

			// ---- unité
			$unite = self::uneLigne($g('unite'));
			if ($unite !== '') {
				if (mb_strlen($unite) > 20) {
					$err('Unité trop longue (20 caractères au maximum).');
				} else {
					$champs['unite'] = $unite;
					if (!$creation && $unite !== $existant['unite']) {
						$changements[] = 'unité';
					}
				}
			} elseif ($creation) {
				$champs['unite'] = 'unité';
			}

			// ---- description
			$desc = $g('description');
			if ($desc !== '') {
				if (mb_strlen($desc) > 2000) {
					$err('Description trop longue (2 000 caractères au maximum).');
				} else {
					$champs['description'] = $desc;
					if (!$creation && $desc !== (string) $existant['description']) {
						$changements[] = 'description';
					}
				}
			}

			// ---- code interne : conflit avec un alias ou un emplacement existant / du fichier
			if ($creation && isset($ctx['codes'][$ck])) {
				$c = $ctx['codes'][$ck];
				$err('Le code « ' . $code . ' » est déjà utilisé comme ' . ($c['type'] === 'emplacement' ? 'code d\'emplacement' : 'alias de ' . $c['libelle']) . '.');
			}
			if (isset($this->utilises[$ck]) && $this->utilises[$ck]['piece'] !== $ck) {
				$err('Le code « ' . $code . ' » est déjà utilisé comme alias à la ligne ' . $this->utilises[$ck]['no'] . '.');
			}
			if (!isset($this->utilises[$ck])) {
				$this->utilises[$ck] = array('no' => $no, 'piece' => $ck);
			}

			// ---- alias (code_barres)
			$aliasAjouter = array();
			$alTxt = $g('code_barres');
			if ($alTxt !== '') {
				$liste = array_values(array_filter(array_map('trim', explode('|', self::uneLigne($alTxt))), function ($x) {
					return $x !== '';
				}));
				if (count($liste) > self::MAX_ALIAS) {
					$err('Trop d\'alias (' . self::MAX_ALIAS . ' au maximum par pièce).');
					$liste = array();
				}
				$vusAlias = array();
				foreach ($liste as $al) {
					$ak = self::cleCode($al);
					if (isset($vusAlias[$ak])) {
						continue;
					}
					$vusAlias[$ak] = true;
					if (($e = self::erreurAlias($al)) !== null) {
						$err($e);
						continue;
					}
					if ($ak === $ck) {
						$avert('L\'alias « ' . $al . ' » est identique au code de la pièce : ignoré.');
						continue;
					}
					if (isset($ctx['codes'][$ak])) {
						$c = $ctx['codes'][$ak];
						if ($c['type'] === 'alias' && !$creation && $c['piece_id'] === $pieceId) {
							continue;   // déjà rattaché à cette pièce
						}
						$err('Alias « ' . $al . ' » déjà utilisé par ' . ($c['type'] === 'emplacement' ? 'un code d\'emplacement' : $c['libelle']) . '.');
						continue;
					}
					if (isset($this->utilises[$ak]) && $this->utilises[$ak]['piece'] !== $ck) {
						$err('Alias « ' . $al . ' » déjà utilisé à la ligne ' . $this->utilises[$ak]['no'] . ' du fichier.');
						continue;
					}
					$this->utilises[$ak] = array('no' => $no, 'piece' => $ck);
					$aliasAjouter[] = $al;
				}
				if (!$creation && $aliasAjouter) {
					$changements[] = 'alias (+' . count($aliasAjouter) . ')';
				}
			}

			// ---- prix fournisseur
			$prixPlan = null;
			$fTxt = self::uneLigne($g('fournisseur'));
			$prixTxt = $g('prix_fournisseur');
			$noF = self::uneLigne($g('no_fournisseur'));
			if ($noF !== '' && mb_strlen($noF) > 60) {
				$err('Numéro du fournisseur trop long (60 caractères au maximum).');
				$noF = '';
			}
			if ($prixTxt !== '' || $fTxt !== '' || $noF !== '') {
				if ($prixTxt === '') {
					if ($fTxt !== '' || $noF !== '') {
						$avert('Aucun prix indiqué : le fournisseur et son numéro de pièce sont ignorés.');
					}
				} elseif ($fTxt === '') {
					$err('Indiquez le fournisseur correspondant au prix.');
				} elseif (mb_strlen($fTxt) > 150) {
					$err('Nom de fournisseur trop long (150 caractères au maximum).');
				} else {
					$arrondi = false;
					$prix = null;
					try {
						$prix = self::nombre($prixTxt, Dec::COUT, $arrondi);
						if ($prix < 0 || $prix > Inventaire::MAX_COUT * 10000) {
							throw new InventaireException('hors limites');
						}
					} catch (InventaireException $ex) {
						$err('Prix fournisseur invalide : « ' . mb_substr($prixTxt, 0, 30) . ' » (nombre positif attendu, 100 000 $ au maximum).');
					}
					$kf = self::cle($fTxt);
					$fid = null;
					if (isset($ctx['fournisseurs'][$kf])) {
						$f = $ctx['fournisseurs'][$kf];
						if (!$f['actif']) {
							$err('Le fournisseur « ' . $f['nom'] . ' » est désactivé.');
						} else {
							$fid = $f['id'];
						}
					} elseif (!empty($options['creer_fournisseurs'])) {
						if (!isset($plan['fournisseurs'][$kf])) {
							$plan['fournisseurs'][$kf] = $fTxt;
							$avert('Le fournisseur « ' . $fTxt . ' » n\'existe pas : il sera créé.');
						} else {
							$info('Fournisseur « ' . $plan['fournisseurs'][$kf] . ' » : créé avec la première ligne qui l\'utilise.');
						}
					} else {
						$err('Fournisseur inconnu : « ' . $fTxt . ' ». Cochez « Créer les fournisseurs manquants » ou corrigez le fichier.');
					}
					if ($prix !== null && !$this->aErreurPrix($msgs)) {
						$prixPlan = array('fournisseur_cle' => $kf, 'fournisseur_id' => $fid, 'prix' => Dec::fmt($prix, Dec::COUT), 'no' => $noF !== '' ? $noF : null);
						if (!$creation) {
							$ex = ($fid !== null && isset($ctx['prix'][$pieceId . ':' . $fid])) ? $ctx['prix'][$pieceId . ':' . $fid] : null;
							if ($ex === null || Dec::parse($ex['prix'], Dec::COUT) !== $prix || ($noF !== '' && $noF !== (string) $ex['no_fournisseur'])) {
								$changements[] = 'prix fournisseur';
							} else {
								$prixPlan = null;
							}
						}
					}
				}
			}

			// ---- minimums par entreprise
			$minimums = array();
			foreach ($v as $k => $val) {
				if ($val === '' || !preg_match('/^minimum_entreprise_(\d+)$/', $k, $m)) {
					continue;
				}
				$eid = (int) $m[1];
				if (!isset($accessibles[$eid])) {
					$err('Colonne « ' . $k . ' » : entreprise inconnue ou inaccessible.');
					continue;
				}
				$arrondi = false;
				try {
					$q = self::nombre($val, Dec::QTE, $arrondi);
					if ($q < 0 || $q > Inventaire::MAX_QTE_TOTALE * 1000) {
						throw new InventaireException('hors limites');
					}
					$minimums[$eid] = Dec::fmt($q, Dec::QTE);
					if ($arrondi) {
						$avert('Minimum pour « ' . $this->nomEntreprise($eid) . ' » arrondi à 3 décimales.');
					}
					if (!$creation) {
						$cur = isset($ctx['seuils'][$pieceId . ':' . $eid]) ? Dec::parse($ctx['seuils'][$pieceId . ':' . $eid], Dec::QTE) : null;
						if ($cur === null ? true : $cur !== $q) {
							$changements[] = 'minimum ' . $this->nomEntreprise($eid);
						}
					}
				} catch (InventaireException $ex) {
					$err('Minimum invalide : « ' . mb_substr($val, 0, 30) . ' » (' . $k . ').');
				}
			}

			// ---- stock initial (nouvelle pièce seulement)
			$stock = null;
			if ($g('quantite') !== '' || $g('emplacement') !== '' || $g('cout') !== '') {
				if (!$creation) {
					if ($g('quantite') !== '') {
						$avert('Stock ignoré : la pièce existe déjà et l\'import ne modifie jamais le stock d\'une pièce existante (utilisez une réception ou un ajustement).');
					}
				} else {
					$stock = $this->analyserStock($v, $ck, $no, $err, $avert);
				}
			}

			$erreur = $this->aErreur($msgs);
			if (!$creation) {
				if (!$existant['actif']) {
					$avert('La pièce est désactivée : mise à jour sans la réactiver.');
				}
				$res['changements'] = $changements;
				if (!$changements) {
					$res['action'] = 'inchange';
					$info('Aucun changement.');
				}
			}
			if (!$erreur) {
				if ($res['action'] === 'creer') {
					$tot['creer']++;
				} elseif ($res['action'] === 'maj') {
					$tot['maj']++;
				} else {
					$tot['inchange']++;
				}
				$plan['lignes'][] = array(
					'no' => $no, 'action' => $res['action'], 'code' => $code, 'cle' => $ck, 'piece_id' => $pieceId, 'champs' => $champs,
					'alias' => $aliasAjouter, 'prix' => $prixPlan, 'minimums' => $minimums, 'changements' => $changements,
				);
				if ($stock) {
					$plan['stock'][] = $stock;
					$res['stock'] = $this->stockApercu($stock);
					$tot['lignes_stock']++;
				}
			} elseif ($stock) {
				$res['stock'] = $this->stockApercu($stock);
			}
			$this->clore($res, $msgs, $tot, $resultats);
		}

		// documents prévus : un par emplacement, par tranches de MAX_LIGNES
		$par = array();
		foreach ($plan['stock'] as $s) {
			$par[$s['emp_id']] = (isset($par[$s['emp_id']]) ? $par[$s['emp_id']] : 0) + 1;
		}
		foreach ($par as $n) {
			$tot['documents'] += (int) ceil($n / Inventaire::MAX_LIGNES);
		}
		$tot['categories_a_creer'] = count($plan['categories']);
		$tot['fournisseurs_a_creer'] = count($plan['fournisseurs']);
		return array('resultats' => $resultats, 'totaux' => $tot, 'plan' => $plan);
	}

	/** Nom de l'entreprise (jamais son numéro à l'écran). */
	private function nomEntreprise($id)
	{
		return isset($this->ctx['entreprises'][(int) $id]) ? $this->ctx['entreprises'][(int) $id] : 'entreprise ' . (int) $id;
	}

	private function aErreur(array $msgs)
	{
		foreach ($msgs as $m) {
			if ($m[0] === 'erreur') {
				return true;
			}
		}
		return false;
	}

	private function aErreurPrix(array $msgs)
	{
		foreach ($msgs as $m) {
			if ($m[0] === 'erreur' && (strpos($m[1], 'Prix') === 0 || strpos($m[1], 'Fournisseur') === 0 || strpos($m[1], 'Le fournisseur') === 0)) {
				return true;
			}
		}
		return false;
	}

	/** Termine une ligne : statut, compteurs. */
	private function clore(array &$res, array $msgs, array &$tot, array &$resultats)
	{
		$statut = 'ok';
		foreach ($msgs as $m) {
			if ($m[0] === 'erreur') {
				$statut = 'erreur';
				break;
			}
			if ($m[0] === 'avertissement') {
				$statut = 'avertissement';
			}
		}
		if ($statut === 'erreur') {
			$tot['erreurs']++;
		} elseif ($statut === 'avertissement') {
			$tot['avertissements']++;
		}
		foreach ($msgs as $i => $m) {
			$msgs[$i][1] = self::typo($m[1]);
		}
		$res['statut'] = $statut;
		$res['msgs'] = $msgs;
		$resultats[] = $res;
	}

	/** Pourquoi une deuxième ligne du même code n'est pas une simple ligne de stock supplémentaire (null = elle l'est). */
	private function raisonDoublon(array &$deja, array $v)
	{
		if (!$deja['nouvelle']) {
			return 'la pièce existe déjà ou la première ligne est ignorée.';
		}
		$g = function ($a, $k) {
			return isset($a[$k]) ? $a[$k] : '';
		};
		foreach ($v as $k => $val) {
			if (in_array($k, array('code', 'emplacement', 'quantite', 'cout'), true) || $val === '') {
				continue;
			}
			if (self::cle($val) !== self::cle($g($deja['v'], $k))) {
				return 'les informations de la pièce (« ' . $k . ' ») diffèrent de la première ligne.';
			}
		}
		if ($g($v, 'emplacement') === '' || $g($v, 'quantite') === '') {
			return 'une ligne répétée doit indiquer un emplacement et une quantité.';
		}
		return null;
	}

	/** Emplacement + quantité + coût d'une ligne -> entrée du plan de stock (ou null). Les messages passent par $err/$avert. */
	private function analyserStock(array $v, $ck, $no, $err, $avert)
	{
		$ctx = &$this->ctx;
		$g = function ($k) use ($v) {
			return isset($v[$k]) ? $v[$k] : '';
		};
		$empTxt = $g('emplacement');
		$qTxt = $g('quantite');
		$cTxt = $g('cout');
		if ($qTxt === '') {
			if ($empTxt !== '' || $cTxt !== '') {
				$avert('Emplacement ou coût sans quantité : aucun stock ajouté.');
			}
			return null;
		}
		if ($empTxt === '') {
			$err('Indiquez l\'emplacement du stock initial (code EMP-… ou nom).');
			return null;
		}
		$emp = null;
		$kc = self::cleCode($empTxt);
		if (isset($ctx['emp_code'][$kc])) {
			$emp = $ctx['emp_code'][$kc];
		} else {
			$ks = self::cle($empTxt);
			if (isset($ctx['emp_nom'][$ks])) {
				if (count($ctx['emp_nom'][$ks]) > 1) {
					$noms = array();
					foreach ($ctx['emp_nom'][$ks] as $e) {
						$noms[] = $e['entreprise_nom'];
					}
					$err('Plusieurs emplacements portent le nom « ' . mb_substr($empTxt, 0, 40) . ' » (' . implode(', ', $noms) . ') : utilisez le code EMP-… de l\'emplacement.');
					return null;
				}
				$emp = $ctx['emp_nom'][$ks][0];
			}
		}
		if ($emp === null) {
			$err('Emplacement inconnu ou inaccessible : « ' . mb_substr($empTxt, 0, 40) . ' ».');
			return null;
		}
		if (!$emp['utilisable']) {
			$err('L\'emplacement « ' . $emp['nom'] . ' » est désactivé.');
			return null;
		}
		$arrondi = false;
		try {
			$q = self::nombre($qTxt, Dec::QTE, $arrondi);
		} catch (InventaireException $ex) {
			$err('Quantité invalide : « ' . mb_substr($qTxt, 0, 30) . ' ».');
			return null;
		}
		if ($q < 0) {
			$err('La quantité ne peut pas être négative.');
			return null;
		}
		if ($q === 0) {
			$avert('Quantité 0 : aucun stock ajouté.');
			return null;
		}
		if ($q > Inventaire::MAX_QTE_LIGNE * 1000) {
			$err('Quantité trop grande (100 000 au maximum par ligne).');
			return null;
		}
		if ($arrondi) {
			$avert('Quantité arrondie à 3 décimales.');
		}
		$cout = null;
		if ($cTxt !== '') {
			$a2 = false;
			try {
				$c = self::nombre($cTxt, Dec::COUT, $a2);
				if ($c < 0 || $c > Inventaire::MAX_COUT * 10000) {
					throw new InventaireException('hors limites');
				}
				$cout = Dec::fmt($c, Dec::COUT);
			} catch (InventaireException $ex) {
				$err('Coût invalide : « ' . mb_substr($cTxt, 0, 30) . ' » (nombre positif attendu, 100 000 $ au maximum).');
				return null;
			}
		} else {
			$avert('Aucun coût indiqué : le stock sera valorisé à 0 $ (renseignez la colonne « cout »).');
		}
		if (isset($this->vus[$ck]['emps'][$emp['id']])) {
			$err('Cette pièce a déjà une ligne de stock pour cet emplacement (ligne ' . $this->vus[$ck]['emps'][$emp['id']] . ').');
			return null;
		}
		$this->vus[$ck]['emps'][$emp['id']] = $no;
		return array('no' => $no, 'cle' => $ck, 'emp_id' => $emp['id'], 'emp_nom' => $emp['nom'] . ' (' . $emp['entreprise_nom'] . ')', 'quantite' => Dec::fmt($q, Dec::QTE), 'cout' => $cout);
	}

	private function stockApercu(array $s)
	{
		return array('emplacement' => $s['emp_nom'], 'quantite' => $s['quantite'], 'cout' => $s['cout']);
	}

	// ======================================================================
	//  Application
	// ======================================================================

	/**
	 * Revalide TOUT sur la base courante puis applique en une seule transaction (tout ou rien).
	 * @return array résumé (créées, mises à jour, ignorées, documents…)
	 */
	public function appliquer(array $lignes, array $options, $fichier)
	{
		$uid = $this->uid;
		return $this->inv->transaction(function () use ($lignes, $options, $fichier, $uid) {
			$this->inv->exiger($uid, 'catalogue');
			$a = $this->analyser($lignes, $options);
			$tot = $a['totaux'];
			if ($tot['erreurs'] > 0) {
				$e = new ImportException('Le fichier contient ' . $tot['erreurs'] . ' ligne' . ($tot['erreurs'] > 1 ? 's' : '') . ' en erreur : rien n\'a été importé. Corrigez le fichier puis analysez-le de nouveau.');
				foreach ($a['resultats'] as $r) {
					if ($r['statut'] === 'erreur') {
						$e->details[] = array('no' => $r['no'], 'code' => $r['code'], 'msgs' => $r['msgs']);
						if (count($e->details) >= 50) {
							break;
						}
					}
				}
				throw $e;
			}
			$plan = $a['plan'];
			if (!$plan['lignes'] && !$plan['stock']) {
				throw new InventaireException('Il n\'y a rien à importer : toutes les lignes sont ignorées ou sans changement.');
			}
			$pdo = $this->pdo;
			$ctx = $this->ctx;

			// 1. catégories et fournisseurs manquants
			$catIds = array();
			foreach ($ctx['categories'] as $k => $c) {
				$catIds[$k] = $c['id'];
			}
			foreach ($plan['categories'] as $k => $nom) {
				$catIds[$k] = $this->creerAuBesoin('categories', $nom, 'categorie.cree');
			}
			$fourIds = array();
			foreach ($ctx['fournisseurs'] as $k => $f) {
				$fourIds[$k] = $f['id'];
			}
			foreach ($plan['fournisseurs'] as $k => $nom) {
				$fourIds[$k] = $this->creerAuBesoin('fournisseurs', $nom, 'fournisseur.cree');
			}

			// 2. pièces (catalogue, alias, minimums, prix)
			$ids = array();
			$creees = 0;
			$majs = 0;
			$ignorees = $tot['ignorer'];
			$inchangees = 0;
			$codesCrees = array();
			$codesMaj = array();
			foreach ($plan['lignes'] as $l) {
				$pid = (int) $l['piece_id'];
				$ch = $l['champs'];
				$catId = isset($ch['categorie_cle']) ? $catIds[$ch['categorie_cle']] : null;
				if ($l['action'] === 'creer') {
					if (!$this->inv->codeDisponible($l['code'], 0)) {
						throw new InventaireException('Le code « ' . $l['code'] . ' » vient d\'être pris par un autre utilisateur. Analysez de nouveau le fichier.');
					}
					try {
						$pdo->prepare('INSERT INTO pieces (code, nom, description, categorie_id, unite) VALUES (?, ?, ?, ?, ?)')->execute(array(
							$l['code'], $ch['nom'], isset($ch['description']) ? $ch['description'] : null, $catId, $ch['unite'],
						));
					} catch (PDOException $ex) {
						if (isset($ex->errorInfo[1]) && (int) $ex->errorInfo[1] === 1062) {
							throw new InventaireException('Le code « ' . $l['code'] . ' » vient d\'être créé par un autre utilisateur. Analysez de nouveau le fichier.');
						}
						throw $ex;
					}
					$pid = (int) $pdo->lastInsertId();
					$creees++;
					$codesCrees[] = $l['code'];
					Journal::ecrire($pdo, $uid, 'piece.cree', 'pieces', $pid, array('code' => $l['code'], 'source' => 'import'));
				} elseif ($l['action'] === 'maj') {
					$sets = array();
					$params = array();
					if (isset($ch['nom'])) {
						$sets[] = 'nom = ?';
						$params[] = $ch['nom'];
					}
					if ($catId !== null) {
						$sets[] = 'categorie_id = ?';
						$params[] = $catId;
					}
					if (isset($ch['unite'])) {
						$sets[] = 'unite = ?';
						$params[] = $ch['unite'];
					}
					if (isset($ch['description'])) {
						$sets[] = 'description = ?';
						$params[] = $ch['description'];
					}
					if ($sets) {
						$params[] = $pid;
						$pdo->prepare('UPDATE pieces SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
					}
					$majs++;
					$codesMaj[] = $l['code'];
					Journal::ecrire($pdo, $uid, 'piece.maj', 'pieces', $pid, array('code' => $l['code'], 'champs' => $l['changements'], 'source' => 'import'));
				} else {
					$inchangees++;
					$ignorees++;
				}
				$ids[$l['cle']] = $pid;
				if ($l['action'] === 'inchange') {
					continue;
				}
				foreach ($l['alias'] as $al) {
					if (!$this->inv->codeDisponible($al, $pid)) {
						throw new InventaireException('L\'alias « ' . $al . ' » vient d\'être pris par un autre utilisateur. Analysez de nouveau le fichier.');
					}
					$pdo->prepare('INSERT INTO pieces_codes (piece_id, code, type) VALUES (?, ?, ?)')->execute(array($pid, $al, 'fabricant'));
				}
				foreach ($l['minimums'] as $eid => $min) {
					$pdo->prepare('INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE minimum = VALUES(minimum)')->execute(array((int) $eid, $pid, $min));
				}
				if ($l['prix']) {
					$fid = $l['prix']['fournisseur_id'] !== null ? $l['prix']['fournisseur_id'] : $fourIds[$l['prix']['fournisseur_cle']];
					$this->inv->definirPrixFournisseur($uid, $pid, (int) $fid, $l['prix']['prix'], $l['prix']['no'], null, 'Import du catalogue');
				}
			}
			// pièces déjà dans le catalogue et vues dans le fichier (pour retrouver leur id)
			// 3. stock initial : un document « ajustement » par emplacement (par tranches de MAX_LIGNES lignes)
			$parEmp = array();
			$nomEmp = array();
			foreach ($plan['stock'] as $s) {
				$parEmp[$s['emp_id']][] = $s;
				$nomEmp[$s['emp_id']] = $s['emp_nom'];
			}
			ksort($parEmp);
			$documents = array();
			foreach ($parEmp as $empId => $liste) {
				$tranches = array_chunk($liste, Inventaire::MAX_LIGNES);
				foreach ($tranches as $t => $tranche) {
					$lg = array();
					foreach ($tranche as $s) {
						if (!isset($ids[$s['cle']])) {
							throw new LogicException('Pièce introuvable pour le stock initial : ' . $s['cle']);
						}
						$l = array('piece_id' => $ids[$s['cle']], 'quantite' => $s['quantite']);
						if ($s['cout'] !== null) {
							$l['cout_unitaire'] = $s['cout'];
						}
						$lg[] = $l;
					}
					$note = self::NOTE_STOCK . (count($tranches) > 1 ? ' (partie ' . ($t + 1) . ' de ' . count($tranches) . ')' : '');
					$doc = $this->inv->ajuster($uid, array('emplacement_id' => (int) $empId, 'motif' => 'autre', 'note' => $note, 'lignes' => $lg));
					$documents[] = array('id' => $doc['id'], 'numero' => $doc['numero'], 'emplacement' => $nomEmp[$empId], 'lignes' => count($lg));
				}
			}

			$resume = array(
				'creees' => $creees, 'mises_a_jour' => $majs, 'ignorees' => $ignorees, 'dont_inchangees' => $inchangees,
				'documents' => $documents, 'lignes_stock' => count($plan['stock']),
				'categories_creees' => count($plan['categories']), 'fournisseurs_crees' => count($plan['fournisseurs']),
			);
			Journal::ecrire($pdo, $uid, 'import.catalogue', 'pieces', null, array(
				'fichier' => $fichier, 'mode' => $options['mode'], 'creees' => $creees, 'mises_a_jour' => $majs, 'ignorees' => $ignorees,
				'lignes_stock' => count($plan['stock']), 'documents' => array_slice(array_column($documents, 'numero'), 0, 100),
				'categories_creees' => array_slice(array_values($plan['categories']), 0, 50), 'categories_creees_total' => count($plan['categories']),
				'fournisseurs_crees' => array_slice(array_values($plan['fournisseurs']), 0, 50), 'fournisseurs_crees_total' => count($plan['fournisseurs']),
				'codes_crees' => array_slice($codesCrees, 0, 50), 'codes_maj' => array_slice($codesMaj, 0, 50),
			));
			return $resume;
		});
	}

	/** Crée une catégorie / un fournisseur (nom) ; si un autre utilisateur vient de la créer, reprend la sienne. */
	private function creerAuBesoin($table, $nom, $actionJournal)
	{
		$pdo = $this->pdo;
		try {
			$pdo->prepare('INSERT INTO ' . ($table === 'categories' ? 'categories' : 'fournisseurs') . ' (nom) VALUES (?)')->execute(array($nom));
			$id = (int) $pdo->lastInsertId();
			Journal::ecrire($pdo, $this->uid, $actionJournal, $table, $id, array('nom' => $nom, 'source' => 'import'));
			return $id;
		} catch (PDOException $ex) {
			if (isset($ex->errorInfo[1]) && (int) $ex->errorInfo[1] === 1062) {
				$st = $pdo->prepare('SELECT id FROM ' . ($table === 'categories' ? 'categories' : 'fournisseurs') . ' WHERE nom = ? FOR UPDATE');   // lecture à jour : la ligne vient d\'être validée par un autre
				$st->execute(array($nom));
				$id = $st->fetchColumn();
				if ($id) {
					return (int) $id;
				}
			}
			throw $ex;
		}
	}

	// ======================================================================
	//  CSV en sortie (modèle, export) — conforme au §7.8 de SPEC.md
	// ======================================================================

	/** Neutralise l'injection de formules : une valeur qui commence par = + - @ tabulation ou retour chariot reçoit une apostrophe. */
	public static function neutraliser($v)
	{
		$v = (string) $v;
		if ($v !== '' && strpos("=+-@\t\r", $v[0]) !== false) {
			return "'" . $v;
		}
		return $v;
	}

	/** Une ligne CSV (séparateur ;), cellules neutralisées et guillemetées au besoin, fin de ligne \r\n. */
	public static function csvLigne(array $cellules)
	{
		$out = array();
		foreach ($cellules as $c) {
			$c = self::neutraliser($c);
			if ($c !== '' && (strpbrk($c, ";\"\r\n") !== false || $c[0] === ' ' || substr($c, -1) === ' ')) {
				$c = '"' . str_replace('"', '""', $c) . '"';
			}
			$out[] = $c;
		}
		return implode(';', $out) . "\r\n";
	}

	/** Décimal exact en chaîne ("12.500") -> "12,5" (virgule, sans zéros inutiles, au moins $min décimales). */
	public static function decimalCsv($s, $min = 0)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$s = (string) $s;
		if (strpos($s, '.') !== false) {
			list($e, $f) = explode('.', $s, 2);
			$f = rtrim($f, '0');
			$f = str_pad($f, $min, '0');
			$s = $e . ($f !== '' ? '.' . $f : '');
		}
		return str_replace('.', ',', $s);
	}

	/**
	 * Refus d'un téléchargement (modèle, export). Ces deux adresses s'ouvrent par un lien : le navigateur (Accept: text/html)
	 * reçoit une petite page lisible en français plutôt que du JSON brut ; le JavaScript de la page reçoit du JSON.
	 */
	public static function refuserTelechargement($message, $statut = 403)
	{
		$accept = isset($_SERVER['HTTP_ACCEPT']) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
		if (stripos($accept, 'text/html') === false) {
			json_fail($message, $statut);
		}
		http_response_code($statut);
		header('Content-Type: text/html; charset=utf-8');
		header('Cache-Control: no-store');
		echo '<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Téléchargement impossible</title>'
			. '<style>body{font-family:Arial,Helvetica,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1rem;color:#212529}a{color:#0056b3}</style></head><body>'
			. '<h1 style="font-size:1.4rem">Téléchargement impossible</h1><p>' . e(self::typo($message)) . '</p><p><a href="index.php?page=pieces_import">Retour à l\'importation</a></p></body></html>';
		exit;
	}

	/** En-têtes HTTP d'un téléchargement CSV + BOM UTF-8. */
	public static function entetesCsv($nomFichier)
	{
		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', $nomFichier) . '"');
		header('Cache-Control: no-store');
		echo "\xEF\xBB\xBF";
	}

	/** Colonnes du modèle d'import pour les entreprises données ([id, nom, …]). */
	public static function colonnesModele(array $entreprises)
	{
		$cols = self::COLONNES_AVANT_MIN;
		foreach ($entreprises as $e) {
			$cols[] = 'minimum_entreprise_' . (int) $e['id'];
		}
		return array_merge($cols, self::COLONNES_APRES_MIN);
	}
}
