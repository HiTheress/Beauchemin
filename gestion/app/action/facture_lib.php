<?php
/**
 * Fonctions communes du module « Inter-entreprises et rapports » (factures internes au coût, bilan mensuel,
 * valeur de l'inventaire). Ce fichier n'est pas un endpoint : il est inclus par les endpoints et les pages
 * (require_once). Appelé directement, il répond 404 (après les gardes de init.php : connexion, jeton CSRF).
 *
 * Toute écriture de stock passe par le service Inventaire ; ici on ne fait que
 *   - contrôler le rôle et l'entreprise AVANT le service (réponse 403 plutôt que 400),
 *   - nettoyer et borner les champs texte (message clair plutôt que troncature silencieuse),
 *   - protéger contre le double envoi (jeton à usage unique par saisie, mémorisé dans la session),
 *   - préparer les filtres de la liste, l'aperçu au coût et les exports CSV.
 */
require_once __DIR__ . '/../init.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class Interentreprise
{
	const MAX_NOTE = 2000;
	const MAX_MOTIF = 255;
	const MAX_JETONS = 100;

	/** Tables de la liste des factures internes (toutes les factures ont une destination ; LEFT JOIN par prudence). */
	const FROM_LISTE = 'documents d
		JOIN entreprises en ON en.id = d.entreprise_id
		LEFT JOIN entreprises end_ ON end_.id = d.entreprise_dest_id
		JOIN emplacements e ON e.id = d.emplacement_id
		LEFT JOIN emplacements ed ON ed.id = d.emplacement_dest_id';

	// ------------------------------------------------------------------
	//  Lecture et validation des champs envoyés par le navigateur
	// ------------------------------------------------------------------

	/** Texte facultatif : caractères de contrôle retirés, borné ; erreur claire si trop long. Retourne '' si vide. */
	public static function texte(array $d, $cle, $etiquette, $max, $multiligne = false)
	{
		$v = isset($d[$cle]) ? $d[$cle] : '';
		if ($v === null) {
			$v = '';
		}
		if (!is_scalar($v)) {
			throw new InventaireException('Valeur invalide : ' . $etiquette . '.', $cle);
		}
		$v = (string) $v;
		if (!mb_check_encoding($v, 'UTF-8')) {
			throw new InventaireException($etiquette . ' contient des caractères invalides.', $cle);
		}
		if ($multiligne) {
			$v = str_replace("\r\n", "\n", $v);
			$v = preg_replace('/[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F]/', '', $v);
		} else {
			$v = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $v);
		}
		$v = trim($v);
		if (mb_strlen($v) > $max) {
			throw new InventaireException($etiquette . ' ne peut pas dépasser ' . $max . ' caractères.', $cle);
		}
		return $v;
	}

	/** Identifiant entier positif (0 si absent ou invalide). */
	public static function identifiant(array $d, $cle)
	{
		if (!isset($d[$cle]) || !is_scalar($d[$cle]) || is_bool($d[$cle])) {
			return 0;
		}
		$s = (string) $d[$cle];
		return (ctype_digit($s) && strlen($s) < 10) ? (int) $s : 0;
	}

	/** Entier borné d'un paramètre d'URL ; $defaut si absent ou hors limites. */
	public static function entier(array $src, $cle, $min, $max, $defaut)
	{
		if (!isset($src[$cle]) || !is_scalar($src[$cle]) || is_bool($src[$cle])) {
			return $defaut;
		}
		$s = trim((string) $src[$cle]);
		if ($s === '' || !ctype_digit($s) || strlen($s) > 4) {
			return $defaut;
		}
		$n = (int) $s;
		return ($n >= $min && $n <= $max) ? $n : $defaut;
	}

	/** Booléen d'un champ JSON/formulaire ("true", "1", true…). Une chaîne « false » ou « 0 » donne false. */
	public static function booleen(array $d, $cle)
	{
		return isset($d[$cle]) && filter_var($d[$cle], FILTER_VALIDATE_BOOLEAN);
	}

	/** Date du jour (fuseau du serveur : c'est celui qui valide la date du document). */
	public static function aujourdhui()
	{
		return date('Y-m-d');
	}

	/** Mois en toutes lettres : « février 2026 ». */
	public static function libellePeriode($annee, $mois)
	{
		return MOIS_FR[(int) $mois] . ' ' . (int) $annee;
	}

	// ------------------------------------------------------------------
	//  Droits : refus 403 avant même d'appeler le service (qui revérifie tout)
	// ------------------------------------------------------------------

	/** Rôle minimum de l'opération ($operation = clé de Inventaire::ROLE_MIN). */
	public static function exigerRole($operation)
	{
		global $Ouser;
		if (!$Ouser->aRole(Inventaire::ROLE_MIN[$operation])) {
			json_fail('Vous n\'avez pas la permission d\'effectuer cette opération.', 403);
		}
	}

	/** L'entreprise doit être l'une des entreprises de l'utilisateur. */
	public static function exigerEntreprise($entrepriseId)
	{
		global $Ouser;
		if (!$Ouser->peutAcces((int) $entrepriseId)) {
			json_fail('Vous n\'avez pas accès à cette entreprise.', 403);
		}
	}

	/** Emplacement (id, nom, type, entreprise_id, actif, entreprise_nom) ou null. */
	public static function emplacement($id)
	{
		global $pdo;
		if ((int) $id <= 0) {
			return null;
		}
		$st = $pdo->prepare('SELECT e.id, e.nom, e.type, e.entreprise_id, e.actif, en.nom AS entreprise_nom FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id WHERE e.id = ?');
		$st->execute(array((int) $id));
		$r = $st->fetch();
		return $r ? $r : null;
	}

	// ------------------------------------------------------------------
	//  Facture interne : aperçu au coût, jeton de saisie, préremplissage
	// ------------------------------------------------------------------

	/** Jeton de saisie valide (8 à 64 caractères sûrs) ou null. */
	public static function jeton(array $d)
	{
		if (isset($d['jeton']) && is_string($d['jeton']) && preg_match('/^[A-Za-z0-9_-]{8,64}$/', $d['jeton'])) {
			return $d['jeton'];
		}
		return null;
	}

	/**
	 * Aperçu AU COÛT d'une facture, sans rien écrire : pour chaque pièce, le coût moyen de l'entreprise émettrice
	 * ($emp['entreprise_id'], table stock_couts), le disponible à l'emplacement source, le total de la ligne et le total général.
	 * Les lignes d'une même pièce sont additionnées (comme le fait le service). Les calculs sont des entiers (Dec), comme le service :
	 * le total affiché est donc exactement celui qui sera enregistré.
	 * @return array{lignes:array,total:string,nb_sans_cout:int,nb_insuffisant:int,nb_erreurs:int}
	 */
	public static function apercu(array $emp, $brut)
	{
		global $pdo;
		if (!is_array($brut)) {
			$brut = array();
		}
		if (count($brut) > Inventaire::MAX_LIGNES) {
			throw new InventaireException('Trop de lignes (maximum ' . Inventaire::MAX_LIGNES . ').', 'lignes');
		}
		$eid = (int) $emp['entreprise_id'];

		// 1. lignes normalisées et fusionnées par pièce (ordre de première apparition)
		$par = array();
		foreach (array_values($brut) as $i => $l) {
			$n = $i + 1;
			if (!is_array($l)) {
				throw new InventaireException("Ligne $n invalide.", 'lignes');
			}
			$pid = self::identifiant($l, 'piece_id');
			if ($pid <= 0) {
				throw new InventaireException("Ligne $n : pièce manquante.", 'lignes');
			}
			if (!isset($par[$pid])) {
				$par[$pid] = array('qte' => 0, 'erreur' => null);
			}
			try {
				$q = Dec::parse(isset($l['quantite']) ? $l['quantite'] : '', Dec::QTE, 'lignes');
				if ($q <= 0) {
					$par[$pid]['erreur'] = 'La quantité doit être supérieure à zéro.';
				} else {
					$par[$pid]['qte'] += $q;
				}
			} catch (InventaireException $ex) {
				$par[$pid]['erreur'] = 'Quantité invalide.';
			}
			if (abs($par[$pid]['qte']) > Inventaire::MAX_QTE_LIGNE * 1000) {
				$par[$pid]['erreur'] = 'Quantité trop grande.';
			}
		}
		$sortie = array('lignes' => array(), 'total' => '0.00', 'nb_sans_cout' => 0, 'nb_insuffisant' => 0, 'nb_erreurs' => 0);
		if (!$par) {
			return $sortie;
		}

		// 2. pièces, coûts de l'entreprise émettrice et stock à l'emplacement source (requêtes de lecture, une par table)
		$ids = array_keys($par);
		$in = implode(',', array_fill(0, count($ids), '?'));
		$st = $pdo->prepare("SELECT id, code, nom, unite, actif FROM pieces WHERE id IN ($in)");
		$st->execute($ids);
		$pieces = array();
		foreach ($st->fetchAll() as $r) {
			$pieces[(int) $r['id']] = $r;
		}
		$st = $pdo->prepare("SELECT piece_id, cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id IN ($in)");
		$st->execute(array_merge(array($eid), $ids));
		$couts = array();
		foreach ($st->fetchAll() as $r) {
			$couts[(int) $r['piece_id']] = Dec::parse($r['cout_moyen'], Dec::COUT);
		}
		$st = $pdo->prepare("SELECT piece_id, quantite FROM stock WHERE emplacement_id = ? AND piece_id IN ($in)");
		$st->execute(array_merge(array((int) $emp['id']), $ids));
		$dispos = array();
		foreach ($st->fetchAll() as $r) {
			$dispos[(int) $r['piece_id']] = Dec::parse($r['quantite'], Dec::QTE);
		}

		// 3. résultat par pièce
		$total = 0;
		foreach ($par as $pid => $l) {
			$p = isset($pieces[$pid]) ? $pieces[$pid] : null;
			$erreur = $l['erreur'];
			if ($erreur === null && !$p) {
				$erreur = 'Pièce introuvable.';
			}
			if ($erreur === null && !$p['actif']) {
				$erreur = 'La pièce « ' . $p['code'] . ' » est désactivée.';
			}
			$dispo = isset($dispos[$pid]) ? $dispos[$pid] : 0;
			$cout = isset($couts[$pid]) ? $couts[$pid] : 0;
			$ligne = array(
				'piece_id' => $pid,
				'code' => $p ? $p['code'] : null,
				'nom' => $p ? $p['nom'] : null,
				'unite' => $p ? $p['unite'] : null,
				'quantite' => Dec::fmt($l['qte'], Dec::QTE),
				'disponible' => Dec::fmt($dispo, Dec::QTE),
				'cout_unitaire' => null,
				'total_ligne' => null,
				'sans_cout' => false,
				'insuffisant' => false,
				'erreur' => $erreur,
			);
			if ($erreur !== null) {
				$sortie['nb_erreurs']++;
			} else {
				$tl = Dec::totalLigne($l['qte'], $cout);
				$total += $tl;
				$ligne['cout_unitaire'] = Dec::fmt($cout, Dec::COUT);
				$ligne['total_ligne'] = Dec::fmt($tl, Dec::TOTAL);
				$ligne['sans_cout'] = ($cout === 0);
				$ligne['insuffisant'] = ($l['qte'] > $dispo);
				if ($ligne['sans_cout']) {
					$sortie['nb_sans_cout']++;
				}
				if ($ligne['insuffisant']) {
					$sortie['nb_insuffisant']++;
				}
			}
			$sortie['lignes'][] = $ligne;
		}
		$sortie['total'] = Dec::fmt($total, Dec::TOTAL);
		return $sortie;
	}

	/**
	 * Préremplissage par l'URL (contrat du §10) : &piece_id= (code de la pièce à ajouter, quantité 1) et &emplacement_id=.
	 * @return array{piece_code:string, piece_avert:string, emplacement_id:string}
	 */
	public static function prefill()
	{
		global $pdo;
		$r = array('piece_code' => '', 'piece_avert' => '', 'emplacement_id' => '');
		$p = (isset($_GET['piece_id']) && is_string($_GET['piece_id']) && ctype_digit($_GET['piece_id']) && strlen($_GET['piece_id']) < 10) ? (int) $_GET['piece_id'] : 0;
		if ($p > 0) {
			$st = $pdo->prepare('SELECT code, actif FROM pieces WHERE id = ?');
			$st->execute(array($p));
			$row = $st->fetch();
			if (!$row) {
				$r['piece_avert'] = 'La pièce demandée n\'existe pas.';
			} elseif (!$row['actif']) {
				$r['piece_avert'] = 'La pièce « ' . $row['code'] . ' » est désactivée : elle ne peut pas être ajoutée.';
			} else {
				$r['piece_code'] = $row['code'];
			}
		}
		if (isset($_GET['emplacement_id']) && is_string($_GET['emplacement_id']) && ctype_digit($_GET['emplacement_id']) && strlen($_GET['emplacement_id']) < 10) {
			$r['emplacement_id'] = $_GET['emplacement_id'];
		}
		return $r;
	}

	// ------------------------------------------------------------------
	//  Liste des factures internes : filtres communs à la liste et à ses totaux
	// ------------------------------------------------------------------

	/**
	 * Conditions SQL (et paramètres liés) de la liste des factures internes.
	 * Paramètres : annee (AAAA), mois (1-12), sens ('emises'|'recues'), statut ('valide'|'annule'), q (mots cherchés dans le numéro,
	 * la note et les emplacements). Les entreprises viennent des droits de l'utilisateur et du filtre de la barre du haut,
	 * jamais du navigateur : seules les factures dont l'une de ces entreprises est émettrice ou destinataire sont listées.
	 * @return array{0:string[],1:array}  [conditions, paramètres]
	 */
	public static function filtresListe(array $req)
	{
		$lire = function ($cle) use ($req) {
			return (isset($req[$cle]) && is_scalar($req[$cle]) && !is_bool($req[$cle])) ? trim((string) $req[$cle]) : '';
		};
		$ids = array_map('intval', entreprises_filtre());
		$liste = $ids ? implode(',', $ids) : '0';     // entiers issus des droits de l'utilisateur
		$where = array("d.type = 'facture_interne'");
		$params = array();

		$sens = $lire('sens');
		if ($sens === 'emises') {
			$where[] = "d.entreprise_id IN ($liste)";
		} elseif ($sens === 'recues') {
			$where[] = "d.entreprise_dest_id IN ($liste)";
		} else {
			$where[] = "(d.entreprise_id IN ($liste) OR d.entreprise_dest_id IN ($liste))";
		}

		$statut = $lire('statut');
		if ($statut === 'valide' || $statut === 'annule') {
			$where[] = 'd.statut = :statut';
			$params[':statut'] = $statut;
		} elseif ($statut !== '') {
			$where[] = '1 = 0';
		}

		$annee = $lire('annee');
		$mois = $lire('mois');
		if ($annee !== '') {
			if (!preg_match('/^\d{4}$/', $annee) || (int) $annee < 2000 || (int) $annee > 2100) {
				$where[] = '1 = 0';
			} elseif ($mois !== '') {
				if (!ctype_digit($mois) || (int) $mois < 1 || (int) $mois > 12) {
					$where[] = '1 = 0';
				} else {
					$du = sprintf('%04d-%02d-01', (int) $annee, (int) $mois);
					$where[] = 'd.date_document BETWEEN :du AND :au';
					$params[':du'] = $du;
					$params[':au'] = date('Y-m-t', strtotime($du));
				}
			} else {
				$where[] = 'd.date_document BETWEEN :du AND :au';
				$params[':du'] = sprintf('%04d-01-01', (int) $annee);
				$params[':au'] = sprintf('%04d-12-31', (int) $annee);
			}
		} elseif ($mois !== '') {
			if (!ctype_digit($mois) || (int) $mois < 1 || (int) $mois > 12) {
				$where[] = '1 = 0';
			} else {
				$where[] = 'MONTH(d.date_document) = :mois';
				$params[':mois'] = (int) $mois;
			}
		}

		$terme = mb_substr($lire('q'), 0, 100);
		if ($terme !== '') {
			$i = 0;
			foreach (array_slice(preg_split('/\s+/u', $terme, -1, PREG_SPLIT_NO_EMPTY), 0, 6) as $mot) {
				$ph = ':q' . $i++;
				$where[] = "(CONCAT_WS(' ', d.numero, d.note, e.nom, ed.nom) LIKE $ph)";
				$params[$ph] = '%' . Inventaire::likeEchapper($mot) . '%';
			}
		}
		return array($where, $params);
	}

	// ------------------------------------------------------------------
	//  Bilan mensuel : période et paire d'entreprises (page et export)
	// ------------------------------------------------------------------

	/** @return int[] [année, mois] demandés (mois courant par défaut). */
	public static function periode(array $src)
	{
		return array(
			self::entier($src, 'annee', 2000, 2100, (int) date('Y')),
			self::entier($src, 'mois', 1, 12, (int) date('n')),
		);
	}

	/**
	 * Paire d'entreprises du bilan. Avec deux entreprises actives, la paire est fixe. Avec plus de deux, elle vient de
	 * l'URL (a, b) ; par défaut : l'entreprise courante (ou la première accessible) et la suivante.
	 * @return array{0:int,1:int,2:array}  [A, B, toutes les entreprises actives]
	 */
	public static function paire(array $src)
	{
		global $Ouser;
		$toutes = inventaire()->entreprisesDestination(utilisateur_id());
		$ids = array();
		foreach ($toutes as $e) {
			$ids[] = (int) $e['id'];
		}
		if (count($ids) < 2) {
			throw new InventaireException('Il faut au moins deux entreprises actives pour établir un bilan.');
		}
		if (count($ids) === 2) {
			return array($ids[0], $ids[1], $toutes);
		}
		$acc = array_values(array_intersect($ids, array_map('intval', $Ouser->entreprisesAutorisees())));
		$defautA = entreprise_courante();
		if (!in_array($defautA, $ids, true)) {
			$defautA = $acc ? $acc[0] : $ids[0];
		}
		$a = self::entier($src, 'a', 1, 9999, $defautA);
		if (!in_array($a, $ids, true)) {
			$a = $defautA;
		}
		$b = self::entier($src, 'b', 1, 9999, 0);
		if (!in_array($b, $ids, true) || $b === $a) {
			$b = 0;
			foreach ($ids as $i) {
				if ($i !== $a) {
					$b = $i;
					break;
				}
			}
		}
		return array($a, $b, $toutes);
	}

	// ------------------------------------------------------------------
	//  Valeur de l'inventaire (page et export)
	// ------------------------------------------------------------------

	/**
	 * Valeur du stock par entreprise et par emplacement : les montants viennent du service (valeurInventaire), qui ne liste que les
	 * emplacements actifs ; on y ajoute les emplacements DÉSACTIVÉS qui contiennent encore du stock (sinon la somme des emplacements
	 * ne correspondrait pas au total de l'entreprise) et le nombre de pièces en stock sans coût connu (valeur comptée à 0 $).
	 * @return array{entreprises:array,emplacements:array,sans_cout:array,total:string}
	 */
	public static function valeurComplete(array $entrepriseIds)
	{
		global $pdo;
		$v = inventaire()->valeurInventaire(utilisateur_id(), $entrepriseIds);
		$ids = array();
		$total = 0;
		foreach ($v['entreprises'] as $en) {
			$ids[] = (int) $en['id'];
			$total += Dec::parse($en['valeur'], Dec::TOTAL);
		}
		$out = array('entreprises' => $v['entreprises'], 'emplacements' => array(), 'sans_cout' => array(), 'total' => Dec::fmt($total, Dec::TOTAL));
		if (!$ids) {
			return $out;
		}
		$in = implode(',', array_fill(0, count($ids), '?'));

		$st = $pdo->prepare(
			"SELECT e.id, e.nom, e.type, e.entreprise_id, COALESCE(ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 2), 0) AS valeur,
			        COUNT(CASE WHEN s.quantite > 0 THEN 1 END) AS nb_pieces
			   FROM emplacements e
			   JOIN stock s ON s.emplacement_id = e.id AND s.quantite > 0
			   LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id
			  WHERE e.entreprise_id IN ($in) AND e.actif = 0
			  GROUP BY e.id, e.nom, e.type, e.entreprise_id ORDER BY e.entreprise_id, e.type, e.nom"
		);
		$st->execute($ids);
		$inactifs = array();
		foreach ($st->fetchAll() as $r) {
			$r['actif'] = 0;
			$inactifs[(int) $r['entreprise_id']][] = $r;
		}
		$actifs = array();
		foreach ($v['emplacements'] as $r) {
			$r['actif'] = 1;
			$actifs[(int) $r['entreprise_id']][] = $r;
		}
		foreach ($ids as $eid) {
			foreach (isset($actifs[$eid]) ? $actifs[$eid] : array() as $r) {
				$out['emplacements'][] = $r;
			}
			foreach (isset($inactifs[$eid]) ? $inactifs[$eid] : array() as $r) {
				$out['emplacements'][] = $r;
			}
		}

		$st = $pdo->prepare(
			"SELECT e.entreprise_id, COUNT(DISTINCT s.piece_id) AS n
			   FROM stock s
			   JOIN emplacements e ON e.id = s.emplacement_id
			   LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id
			  WHERE s.quantite > 0 AND e.entreprise_id IN ($in) AND COALESCE(sc.cout_moyen, 0) = 0
			  GROUP BY e.entreprise_id"
		);
		$st->execute($ids);
		foreach ($st->fetchAll() as $r) {
			$out['sans_cout'][(int) $r['entreprise_id']] = (int) $r['n'];
		}
		return $out;
	}

	/**
	 * Pièces en stock des emplacements demandés, avec coût moyen de l'entreprise propriétaire et valeur (arrondie au cent).
	 * Aucun contrôle de droits ici : l'appelant a déjà vérifié les entreprises.
	 */
	public static function lignesValeur(array $emplacementIds)
	{
		global $pdo;
		$emplacementIds = array_values(array_map('intval', $emplacementIds));
		if (!$emplacementIds) {
			return array();
		}
		$in = implode(',', array_fill(0, count($emplacementIds), '?'));
		$st = $pdo->prepare(
			"SELECT e.id AS emplacement_id, e.nom AS emplacement, e.type, e.actif, en.id AS entreprise_id, en.nom AS entreprise,
			        p.id AS piece_id, p.code, p.nom, p.unite, c.nom AS categorie, s.quantite,
			        COALESCE(sc.cout_moyen, 0) AS cout_moyen, ROUND(s.quantite * COALESCE(sc.cout_moyen, 0), 2) AS valeur
			   FROM stock s
			   JOIN emplacements e ON e.id = s.emplacement_id
			   JOIN entreprises en ON en.id = e.entreprise_id
			   JOIN pieces p ON p.id = s.piece_id
			   LEFT JOIN categories c ON c.id = p.categorie_id
			   LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id
			  WHERE s.emplacement_id IN ($in) AND s.quantite > 0
			  ORDER BY en.id, e.type, e.nom, p.code"
		);
		$st->execute($emplacementIds);
		return $st->fetchAll();
	}

	// ------------------------------------------------------------------
	//  Affichage (français) et exports CSV
	// ------------------------------------------------------------------

	/**
	 * Nombre décimal exact (chaîne "1234.5000") -> format fr-CA : espace insécable entre les milliers, virgule décimale.
	 * $decimales null : zéros inutiles retirés ; sinon arrondi (demi vers le haut) à $decimales.
	 * (Remplace fmt_nombre() du noyau, dont le séparateur de milliers est corrompu : voir « Demandes au noyau » du rapport.)
	 */
	public static function nombre($s, $decimales = null)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$s = (string) $s;
		if ($decimales !== null) {
			try {
				$s = Dec::fmt(Dec::parse($s, (int) $decimales), (int) $decimales);
			} catch (InventaireException $ex) {
				return $s;
			}
		}
		if (!preg_match('/^([+-]?)(\d*)(?:\.(\d*))?$/', $s, $m)) {
			return $s;
		}
		$ent = ltrim($m[2], '0');
		$ent = ($ent === '') ? '0' : $ent;
		$frac = isset($m[3]) ? $m[3] : '';
		if ($decimales === null) {
			$frac = rtrim($frac, '0');
		}
		$nul = ($ent === '0' && trim($frac, '0') === '');
		$ent = preg_replace('/\B(?=(\d{3})+(?!\d))/', "\xc2\xa0", $ent);
		return (($m[1] === '-' && !$nul) ? '-' : '') . $ent . ($frac !== '' ? ',' . $frac : '');
	}

	/** Montant : « 1 234,56 $ » (espaces insécables). */
	public static function argent($s, $decimales = 2)
	{
		if ($s === null || $s === '') {
			return '';
		}
		return self::nombre($s, $decimales) . "\xc2\xa0$";
	}

	/** Coût unitaire : 2 à 4 décimales, « 14,50 $ » ou « 52,9714 $ ». */
	public static function cout($s)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$x = self::nombre($s, null);
		$pos = strrpos($x, ',');
		if ($pos === false) {
			$x .= ',00';
		} elseif (strlen($x) - $pos - 1 < 2) {
			$x .= '0';
		}
		return $x . "\xc2\xa0$";
	}

	/** Erreur d'accès à un export : texte brut, code HTTP, fin du script. */
	public static function refuserExport($message, $status = 403)
	{
		while (ob_get_level() > 0) {
			ob_end_clean();
		}
		http_response_code($status);
		header('Content-Type: text/plain; charset=utf-8');
		header('Cache-Control: no-store');
		echo $message;
		exit;
	}

	/** Texte d'une cellule CSV : injection de formule neutralisée (= + - @ tabulation retour de ligne en tête -> apostrophe). */
	public static function csvTexte($v)
	{
		$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $v);
		if ($s !== '' && strpos("=+-@\t\r\n", $s[0]) !== false) {
			$s = "'" . $s;
		}
		return $s;
	}

	/**
	 * Nombre décimal exact (chaîne "1234.5000") -> cellule CSV à virgule décimale, sans séparateur de milliers.
	 * $min / $max : décimales minimales (zéros ajoutés) et maximales (au-delà : tronqué, jamais le cas pour nos échelles).
	 * Une valeur qui n'est pas un nombre propre est traitée comme du texte (donc neutralisée).
	 */
	public static function csvNombre($s, $min = 0, $max = 4)
	{
		$s = (string) $s;
		if (!preg_match('/^(-?)(\d+)(?:\.(\d*))?$/', $s, $m)) {
			return self::csvTexte($s);
		}
		$ent = ltrim($m[2], '0');
		$ent = ($ent === '') ? '0' : $ent;
		$frac = rtrim(isset($m[3]) ? $m[3] : '', '0');
		$frac = substr($frac, 0, $max);
		$frac = str_pad($frac, $min, '0');
		$signe = ($m[1] === '-' && ($ent !== '0' || trim($frac, '0') !== '')) ? '-' : '';
		return $signe . $ent . ($frac !== '' ? ',' . $frac : '');
	}

	/**
	 * Envoie un fichier CSV (UTF-8 avec BOM, séparateur « ; », fin de ligne CRLF) et termine le script.
	 * $lignes : tableau de tableaux de cellules DÉJÀ neutralisées (csvTexte / csvNombre).
	 */
	public static function csvEnvoyer($nomFichier, array $lignes)
	{
		while (ob_get_level() > 0) {
			ob_end_clean();
		}
		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', $nomFichier) . '"');
		header('Cache-Control: no-store');
		header('X-Content-Type-Options: nosniff');
		$out = fopen('php://output', 'w');
		fwrite($out, "\xEF\xBB\xBF");
		foreach ($lignes as $l) {
			$cellules = array();
			foreach ($l as $c) {
				$cellules[] = (string) $c;
			}
			fputcsv($out, $cellules, ';', '"', '', "\r\n");
		}
		fclose($out);
		exit;
	}
}
