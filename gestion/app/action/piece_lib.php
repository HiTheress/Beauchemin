<?php
/**
 * Fonctions communes aux endpoints du catalogue (module A1 : pièces, fournisseurs, catégories, prix).
 * Ce fichier n'est pas un endpoint : il est inclus par les autres (require_once 'piece_lib.php').
 * Appelé directement, il répond 404 (après les gardes de init.php : connexion, jeton CSRF).
 */
require_once __DIR__ . '/../init.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class Catalogue
{
	const TYPES_ALIAS = array('fabricant', 'fournisseur', 'autre');
	const MAX_ALIAS = 30;

	// ------------------------------------------------------------------
	//  Lecture et validation des champs envoyés par le navigateur
	// ------------------------------------------------------------------

	/**
	 * Champ texte : nettoyé (caractères de contrôle), borné, obligatoire ou non.
	 * $etiquette sert aux messages : « Le nom est obligatoire. », « Le nom ne peut pas dépasser 150 caractères. »
	 * Retourne '' si vide.
	 */
	public static function texte(array $d, $cle, $etiquette, $max, $obligatoire = false, $multiligne = false)
	{
		$v = isset($d[$cle]) ? $d[$cle] : '';
		if ($v === null) {
			$v = '';
		}
		if (!is_string($v)) {
			// booléens, nombres, tableaux : refusés (un client mal écrit ne doit pas créer la pièce « 1 » ou « true »)
			throw new InventaireException('Valeur invalide : ' . self::minuscule1($etiquette) . '.', $cle);
		}
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
		if ($v === '' && $obligatoire) {
			throw new InventaireException($etiquette . ' est obligatoire.', $cle);
		}
		if (mb_strlen($v) > $max) {
			$verbe = preg_match('/^(Les|Des) /u', $etiquette) ? 'ne peuvent pas' : 'ne peut pas';
			throw new InventaireException($etiquette . ' ' . $verbe . ' dépasser ' . $max . ' caractères.', $cle);
		}
		return $v;
	}

	private static function minuscule1($s)
	{
		return mb_strtolower(mb_substr($s, 0, 1)) . mb_substr($s, 1);
	}

	/** Entier positif (identifiant) ou 0 si absent/invalide. */
	public static function entier($v)
	{
		if (is_int($v)) {
			return $v > 0 ? $v : 0;
		}
		if (is_string($v) && ctype_digit($v) && strlen($v) < 12) {
			return (int) $v;
		}
		return 0;
	}

	/** Identifiant d'un enregistrement à modifier : 0 si absent (création) ; une valeur présente mais invalide est une erreur (pas de création silencieuse). */
	public static function identifiant(array $d, $cle = 'id')
	{
		if (!isset($d[$cle]) || $d[$cle] === '' || $d[$cle] === 0 || $d[$cle] === '0') {
			return 0;
		}
		$id = self::entier($d[$cle]);
		if ($id <= 0) {
			throw new InventaireException('Identifiant invalide.', $cle);
		}
		return $id;
	}

	/**
	 * Paramètres DataTables nettoyés (types scalaires) et remis dans $_POST : la classe DataTable du noyau convertit certains
	 * champs en chaîne sans vérifier leur type, ce qui produirait des avertissements PHP avec une requête mal formée.
	 * Retourne le tableau nettoyé.
	 */
	public static function requeteDataTable()
	{
		$req = $_POST + $_GET;
		$scalaire = function ($v, $defaut = '') { return is_scalar($v) ? (string) $v : $defaut; };
		$propre = array(
			'draw' => (int) (isset($req['draw']) && is_scalar($req['draw']) ? $req['draw'] : 0),
			'start' => (int) (isset($req['start']) && is_scalar($req['start']) ? $req['start'] : 0),
			'length' => (int) (isset($req['length']) && is_scalar($req['length']) ? $req['length'] : 25),
			'search' => array('value' => $scalaire(isset($req['search']['value']) ? $req['search']['value'] : '')),
		);
		if (isset($req['order'][0]['column']) && is_scalar($req['order'][0]['column'])) {
			$col = (int) $req['order'][0]['column'];
			$propre['order'] = array(array('column' => $col, 'dir' => (isset($req['order'][0]['dir']) && $scalaire($req['order'][0]['dir']) === 'desc') ? 'desc' : 'asc'));
			if (isset($req['columns'][$col]['data']) && is_scalar($req['columns'][$col]['data'])) {
				$propre['columns'] = array($col => array('data' => (string) $req['columns'][$col]['data']));
			}
		}
		foreach (array('categorie_id', 'statut', 'avec_stock') as $k) {
			if (isset($req[$k]) && is_scalar($req[$k])) {
				$propre[$k] = (string) $req[$k];
			}
		}
		$_POST = $propre;
		$_GET = array();
		return $propre;
	}

	public static function booleen($v)
	{
		return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'on';
	}

	/**
	 * Booléen EXPLICITE (true/false, 1/0, « 1 »/« 0 », « true »/« false ») : une valeur absente ou autre est une erreur,
	 * jamais « faux » par défaut (un appel {id:N} ne doit pas désactiver quoi que ce soit).
	 */
	public static function booleenExplicite(array $d, $cle, $libelle)
	{
		$v = array_key_exists($cle, $d) ? $d[$cle] : null;
		if ($v === true || $v === 1 || $v === '1' || $v === 'true') {
			return true;
		}
		if ($v === false || $v === 0 || $v === '0' || $v === 'false') {
			return false;
		}
		throw new InventaireException('La valeur « ' . $libelle . ' » est manquante ou invalide (attendu : vrai ou faux).', $cle);
	}

	/** Code interne : majuscules, A-Z 0-9 . - _ / seulement, 1 à 40 caractères. */
	public static function codeInterne(array $d)
	{
		$c = strtoupper(self::texte($d, 'code', 'Le code interne', 400, true));
		if (mb_strlen($c) > 40) {
			throw new InventaireException('Le code interne ne peut pas dépasser 40 caractères.', 'code');
		}
		if (!preg_match('/^[A-Z0-9.\/_-]{1,40}$/', $c)) {
			throw new InventaireException('Le code interne ne peut contenir que des lettres majuscules (A-Z), des chiffres et les symboles . - _ / (sans espace ni accent).', 'code');
		}
		return $c;
	}

	/** Code-barres alias : ASCII visible, sans espace, 1 à 64 caractères. */
	public static function codeAlias($v)
	{
		if (!is_string($v) && !is_int($v)) {
			throw new InventaireException('Code-barres alias invalide.', 'codes');
		}
		$c = trim((string) $v);
		if ($c === '') {
			throw new InventaireException('Le code-barres alias est vide.', 'codes');
		}
		if (!preg_match('/^[\x21-\x7E]{1,64}$/', $c)) {
			throw new InventaireException('Le code-barres « ' . self::tronque($c) . ' » est invalide : 64 caractères au plus, uniquement des lettres sans accent, des chiffres et des symboles courants, sans espace.', 'codes');
		}
		return $c;
	}

	private static function tronque($s)
	{
		return mb_strlen($s) > 30 ? mb_substr($s, 0, 30) . '…' : $s;
	}

	/** "10.000" -> "10" ; "2.500" -> "2,5" ; "0.000" -> "" (valeur à afficher dans un champ de saisie). */
	public static function nombreSaisie($s)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$s = (string) $s;
		if (strpos($s, '.') !== false) {
			$s = rtrim(rtrim($s, '0'), '.');
		}
		return ($s === '0' || $s === '') ? '' : str_replace('.', ',', $s);
	}

	// ------------------------------------------------------------------
	//  Codes : unicité globale avec message précis
	// ------------------------------------------------------------------

	/** Message précis disant qui utilise déjà $code, ou null si le code est libre. */
	public static function messageCodePris($code, $sauf = 0)
	{
		global $pdo, $Ouser;
		$st = $pdo->prepare('SELECT code, nom FROM pieces WHERE code = ? AND id <> ? LIMIT 1');
		$st->execute(array($code, (int) $sauf));
		if ($r = $st->fetch()) {
			return 'Le code « ' . $code . ' » est déjà le code interne de la pièce « ' . $r['code'] . ' — ' . $r['nom'] . ' ».';
		}
		$st = $pdo->prepare('SELECT p.code, p.nom FROM pieces_codes pc JOIN pieces p ON p.id = pc.piece_id WHERE pc.code = ? AND pc.piece_id <> ? LIMIT 1');
		$st->execute(array($code, (int) $sauf));
		if ($r = $st->fetch()) {
			return 'Le code « ' . $code . ' » est déjà un code-barres alias de la pièce « ' . $r['code'] . ' — ' . $r['nom'] . ' ».';
		}
		$st = $pdo->prepare('SELECT nom, entreprise_id FROM emplacements WHERE code_barres = ? LIMIT 1');
		$st->execute(array($code));
		if ($r = $st->fetch()) {
			// le nom d'un emplacement d'une entreprise inaccessible n'est pas divulgué
			$nom = $Ouser->peutAcces((int) $r['entreprise_id']) ? ' « ' . $r['nom'] . ' »' : ' d\'une autre entreprise';
			return 'Le code « ' . $code . ' » est déjà le code-barres de l\'emplacement' . $nom . '.';
		}
		return null;
	}

	/** Lève une InventaireException précise si $code est déjà pris (par une pièce, un alias ou un emplacement). */
	public static function exigerCodeLibre($code, $sauf, $champ)
	{
		if (!inventaire()->codeDisponible($code, (int) $sauf)) {
			$m = self::messageCodePris($code, $sauf);
			throw new InventaireException($m !== null ? $m : 'Le code « ' . $code . ' » est déjà utilisé.', $champ);
		}
	}

	/** Prochain code P-#### libre. */
	public static function proposerCode()
	{
		global $pdo;
		$max = (int) $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)), 0) FROM pieces WHERE code REGEXP '^P-[0-9]{1,9}$'")->fetchColumn();
		for ($n = $max + 1; $n < $max + 1000; $n++) {
			$c = sprintf('P-%04d', $n);
			if (inventaire()->codeDisponible($c, 0)) {
				return $c;
			}
		}
		throw new InventaireException('Impossible de proposer un code libre.');
	}

	// ------------------------------------------------------------------
	//  Stock restant et activation
	// ------------------------------------------------------------------

	/** Stock en inventaire, par entreprise : [entreprise_id => [nom, quantite (chaîne)]]. Toutes les entreprises. */
	public static function stockParEntreprise($pieceId)
	{
		global $pdo;
		$st = $pdo->prepare(
			'SELECT en.id, en.nom, SUM(s.quantite) AS q FROM stock s
			   JOIN emplacements e ON e.id = s.emplacement_id JOIN entreprises en ON en.id = e.entreprise_id
			  WHERE s.piece_id = ? AND s.quantite > 0 GROUP BY en.id, en.nom ORDER BY en.id'
		);
		$st->execute(array((int) $pieceId));
		$out = array();
		foreach ($st->fetchAll() as $r) {
			$out[(int) $r['id']] = array('nom' => $r['nom'], 'quantite' => $r['q']);
		}
		return $out;
	}

	/** Message de confirmation de désactivation : montre le stock restant (seulement celui des entreprises accessibles). */
	private static function messageStockRestant(array $piece, array $stock)
	{
		global $Ouser;
		$parts = array();
		$autres = false;
		foreach ($stock as $eid => $s) {
			if ($Ouser->peutAcces($eid)) {
				$parts[] = $s['nom'] . ' : ' . fmt_nombre($s['quantite']);
			} else {
				$autres = true;
			}
		}
		if ($autres) {
			$parts[] = 'une autre entreprise (à laquelle vous n\'avez pas accès) : du stock';
		}
		return 'La pièce « ' . $piece['code'] . ' » a encore du stock (' . implode(' ; ', $parts) . '). '
			. 'Désactivée, elle n\'apparaît plus dans les listes de saisie et ne peut plus être reçue ; son stock restant pourra toujours être transféré, sorti ou compté. Son historique est conservé.';
	}

	/**
	 * Active ou désactive une pièce (à appeler dans une transaction, la ligne de la pièce étant verrouillée).
	 * Désactiver une pièce qui a du stock exige $confirmer (sinon exception de champ « confirmation » dont le message montre le stock).
	 */
	public static function appliquerActif(array $piece, $actif, $confirmer)
	{
		global $pdo;
		$id = (int) $piece['id'];
		$stock = array();
		if (!$actif) {
			$stock = self::stockParEntreprise($id);
			if ($stock && !$confirmer) {
				throw new InventaireException(self::messageStockRestant($piece, $stock), 'confirmation');
			}
		}
		$pdo->prepare('UPDATE pieces SET actif = ? WHERE id = ?')->execute(array($actif ? 1 : 0, $id));
		$details = array('code' => $piece['code'], 'nom' => $piece['nom']);
		if ($stock) {
			$details['stock_restant'] = array_map(function ($s) {
				return $s['nom'] . ' : ' . $s['quantite'];
			}, array_values($stock));
		}
		Journal::ecrire($pdo, utilisateur_id(), $actif ? 'piece.reactive' : 'piece.desactive', 'pieces', $id, $details);
	}

	/**
	 * Active/désactive une pièce (endpoint piece_activer).
	 * $simuler : ne change rien ; répond normalement (200) avec confirmation_requise (et le message à montrer, avec le stock restant)
	 * quand la désactivation exigerait une confirmation. Ce n'est pas une erreur : la console du navigateur reste propre.
	 */
	public static function changerActif($pieceId, $actif, $confirmer, $simuler = false)
	{
		$inv = inventaire();
		$inv->exiger(utilisateur_id(), 'catalogue');
		return $inv->transaction(function () use ($pieceId, $actif, $confirmer, $simuler) {
			global $pdo;
			$st = $pdo->prepare('SELECT id, code, nom, actif FROM pieces WHERE id = ? FOR UPDATE');
			$st->execute(array((int) $pieceId));
			$p = $st->fetch();
			if (!$p) {
				throw new InventaireException('Pièce introuvable.');
			}
			if ((int) $p['actif'] === ($actif ? 1 : 0)) {
				return array('id' => (int) $p['id'], 'actif' => (bool) $actif, 'inchange' => true);
			}
			if ($simuler) {
				$stock = $actif ? array() : self::stockParEntreprise((int) $p['id']);
				$exige = (!$actif && !$confirmer && $stock);
				return array(
					'id' => (int) $p['id'], 'actif' => (bool) $actif, 'inchange' => false, 'simulation' => true,
					'confirmation_requise' => (bool) $exige,
					'message' => $exige ? self::messageStockRestant($p, $stock) : null,
				);
			}
			self::appliquerActif($p, $actif, $confirmer);
			return array('id' => (int) $p['id'], 'actif' => (bool) $actif, 'inchange' => false);
		});
	}

	// ------------------------------------------------------------------
	//  Verrou des codes et version d'une pièce
	// ------------------------------------------------------------------

	/**
	 * Exécute $fn en tenant le verrou global des codes (code interne, alias, code d'emplacement : un même espace de noms).
	 * Sans lui, deux enregistrements simultanés pourraient donner le même code à une pièce et à un alias (la vérification
	 * « libre ? » puis l'insertion ne sont pas atomiques, et les trois espaces n'ont que des index UNIQUE séparés).
	 * Le verrou est pris AVANT la transaction et rendu APRÈS le commit : la vérification voit donc tout ce qui est validé.
	 * Le nom du verrou est propre à la base (plusieurs bases de développement peuvent partager un serveur).
	 */
	public static function avecVerrouCodes($fn)
	{
		global $pdo;
		$nom = 'bea_codes_' . substr(md5((string) $pdo->query('SELECT DATABASE()')->fetchColumn()), 0, 20);
		$st = $pdo->prepare('SELECT GET_LOCK(?, 10)');
		$st->execute(array($nom));
		if ((int) $st->fetchColumn() !== 1) {
			throw new InventaireException('Le catalogue est occupé par un autre enregistrement. Réessayez dans un instant.');
		}
		try {
			return $fn();
		} finally {
			try {
				$pdo->prepare('SELECT RELEASE_LOCK(?)')->execute(array($nom));
			} catch (Throwable $e) {
				// connexion perdue : le verrou disparaît avec elle
			}
		}
	}

	/**
	 * Empreinte de ce que le formulaire de modification permet de changer (champs de la pièce, alias, minimums des entreprises
	 * accessibles). Envoyée avec le formulaire et comparée à l'enregistrement : si quelqu'un a modifié la pièce entre-temps,
	 * l'enregistrement est refusé au lieu d'écraser son travail en silence.
	 */
	public static function empreinte($pieceId, array $entreprises)
	{
		global $pdo;
		$st = $pdo->prepare('SELECT code, nom, description, categorie_id, unite, actif FROM pieces WHERE id = ?');
		$st->execute(array((int) $pieceId));
		$p = $st->fetch();
		if (!$p) {
			return '';
		}
		$st = $pdo->prepare('SELECT code, type FROM pieces_codes WHERE piece_id = ? ORDER BY code');
		$st->execute(array((int) $pieceId));
		$alias = array();
		foreach ($st->fetchAll() as $r) {
			$alias[] = array((string) $r['code'], (string) $r['type']);
		}
		$seuils = array();
		$ids = array_values(array_unique(array_map('intval', $entreprises)));
		sort($ids);
		if ($ids) {
			$in = implode(',', array_fill(0, count($ids), '?'));
			$st = $pdo->prepare("SELECT entreprise_id, minimum FROM seuils WHERE piece_id = ? AND entreprise_id IN ($in) AND minimum > 0 ORDER BY entreprise_id");
			$st->execute(array_merge(array((int) $pieceId), $ids));
			foreach ($st->fetchAll() as $r) {
				$seuils[] = array((int) $r['entreprise_id'], Dec::fmt(Dec::parse($r['minimum'], Dec::QTE), Dec::QTE));
			}
		}
		return sha1(json_encode(array(
			(string) $p['code'], (string) $p['nom'], (string) ($p['description'] === null ? '' : $p['description']),
			$p['categorie_id'] === null ? null : (int) $p['categorie_id'], (string) $p['unite'], (int) $p['actif'], $alias, $seuils,
		), JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE));
	}

	// ------------------------------------------------------------------
	//  Enregistrement d'une pièce (création ou modification)
	// ------------------------------------------------------------------

	/**
	 * $d : id? code nom description categorie_id unite actif? codes[{code,type}] seuils[{entreprise_id,minimum}] confirmer_desactivation? empreinte
	 * (empreinte : exigée pour une modification ; voir empreinte()). Tout ou rien (transaction). Retourne [id, code, cree].
	 */
	public static function enregistrerPiece(array $d)
	{
		$inv = inventaire();
		$uid = utilisateur_id();
		$u = $inv->exiger($uid, 'catalogue');

		$id = self::identifiant($d);
		$code = self::codeInterne($d);
		$nom = self::texte($d, 'nom', 'Le nom', 150, true);
		$description = self::texte($d, 'description', 'La description', 5000, false, true);
		$unite = self::texte($d, 'unite', 'L\'unité', 20, true);

		$cat = null;
		if (isset($d['categorie_id']) && $d['categorie_id'] !== '' && $d['categorie_id'] !== null && $d['categorie_id'] !== 0 && $d['categorie_id'] !== '0') {
			$cat = self::entier($d['categorie_id']);
			if ($cat <= 0) {
				throw new InventaireException('Catégorie invalide.', 'categorie_id');
			}
		}

		// Codes-barres alias
		$codes = isset($d['codes']) ? $d['codes'] : array();
		if (!is_array($codes)) {
			throw new InventaireException('Liste de codes-barres invalide.', 'codes');
		}
		if (count($codes) > self::MAX_ALIAS) {
			throw new InventaireException('Trop de codes-barres alias (maximum ' . self::MAX_ALIAS . ').', 'codes');
		}
		$aliasVoulus = array();
		foreach (array_values($codes) as $c) {
			if (!is_array($c)) {
				throw new InventaireException('Code-barres alias invalide.', 'codes');
			}
			$type = isset($c['type']) ? $c['type'] : 'fabricant';
			if (!is_string($type) || !in_array($type, self::TYPES_ALIAS, true)) {
				throw new InventaireException('Type de code-barres invalide (fabricant, fournisseur ou autre).', 'codes');
			}
			$aliasVoulus[] = array('code' => self::codeAlias(isset($c['code']) ? $c['code'] : ''), 'type' => $type);
		}

		// Minimums par entreprise
		$seuilsVoulus = array();
		$seuils = isset($d['seuils']) ? $d['seuils'] : array();
		if (!is_array($seuils) || count($seuils) > 20) {
			throw new InventaireException('Liste de minimums invalide.', 'seuils');
		}
		$nomsEntreprises = array();
		foreach ($inv->listeEntreprises($uid) as $en) {
			$nomsEntreprises[(int) $en['id']] = $en['nom'];
		}
		foreach (array_values($seuils) as $s) {
			if (!is_array($s)) {
				throw new InventaireException('Minimum invalide.', 'seuils');
			}
			$eid = self::entier(isset($s['entreprise_id']) ? $s['entreprise_id'] : 0);
			if ($eid <= 0) {
				throw new InventaireException('Entreprise invalide pour un minimum.', 'seuils');
			}
			$inv->exiger($uid, 'catalogue', array($eid));          // entreprise accessible (sinon refus)
			// le champ fautif (seuil_<id>) et l'entreprise sont nommés : l'écran marque le bon champ
			$de = 'Le minimum de « ' . (isset($nomsEntreprises[$eid]) ? $nomsEntreprises[$eid] : 'cette entreprise') . ' »';
			$brut = isset($s['minimum']) ? $s['minimum'] : '';
			if ($brut === null || (is_string($brut) && trim($brut) === '')) {
				$brut = '0';
			}
			if (!is_string($brut) && !is_int($brut) && !is_float($brut)) {
				throw new InventaireException($de . ' doit être un nombre.', 'seuil_' . $eid);
			}
			try {
				$m = Dec::parse($brut, Dec::QTE, 'seuils');
			} catch (InventaireException $ex) {
				throw new InventaireException($de . ' doit être un nombre (par exemple 10 ou 2,5).', 'seuil_' . $eid);
			}
			if ($m < 0 || $m > Inventaire::MAX_QTE_TOTALE * 1000) {
				throw new InventaireException($de . ' doit être compris entre 0 et ' . number_format(Inventaire::MAX_QTE_TOTALE, 0, ',', ' ') . '.', 'seuil_' . $eid);
			}
			$seuilsVoulus[$eid] = $m;
		}

		$actifVoulu = array_key_exists('actif', $d) ? self::booleen($d['actif']) : null;
		$confirmer = !empty($d['confirmer_desactivation']) && self::booleen($d['confirmer_desactivation']);
		$empreinte = null;
		if ($id) {
			if (!isset($d['empreinte']) || !is_string($d['empreinte']) || $d['empreinte'] === '') {
				throw new InventaireException('La version de la pièce est manquante : rechargez la page, puis refaites votre modification.', 'empreinte');
			}
			$empreinte = $d['empreinte'];
		}
		$entreprisesAcces = $u['entreprises'];

		return self::avecVerrouCodes(function () use ($inv, $uid, $id, $code, $nom, $description, $unite, $cat, $aliasVoulus, $seuilsVoulus, $actifVoulu, $confirmer, $empreinte, $entreprisesAcces) {
		return $inv->transaction(function () use ($uid, $id, $code, $nom, $description, $unite, $cat, $aliasVoulus, $seuilsVoulus, $actifVoulu, $confirmer, $empreinte, $entreprisesAcces) {
			global $pdo;
			$piece = null;
			if ($id) {
				$st = $pdo->prepare('SELECT * FROM pieces WHERE id = ? FOR UPDATE');
				$st->execute(array($id));
				$piece = $st->fetch();
				if (!$piece) {
					throw new InventaireException('Pièce introuvable.');
				}
				if (!hash_equals(self::empreinte($id, $entreprisesAcces), $empreinte)) {
					throw new InventaireException('Cette pièce a été modifiée par quelqu\'un d\'autre depuis l\'ouverture de ce formulaire. Rechargez la page pour voir ses changements, puis refaites votre modification.', 'empreinte');
				}
			}
			if ($cat !== null) {
				$st = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
				$st->execute(array($cat));
				if (!$st->fetch()) {
					throw new InventaireException('Cette catégorie n\'existe plus. Choisissez-en une autre.', 'categorie_id');
				}
			}

			// Code interne : figé dès qu'il y a des mouvements (les étiquettes imprimées resteraient valides)
			$codeFinal = $code;
			if ($piece) {
				$st = $pdo->prepare('SELECT 1 FROM mouvements WHERE piece_id = ? LIMIT 1');
				$st->execute(array($id));
				if ($st->fetch()) {
					// même code (à la casse près) : on garde l'écriture enregistrée ; sinon refus
					if (strtoupper($piece['code']) !== $code) {
						throw new InventaireException('Le code interne ne peut plus être modifié : cette pièce a déjà des mouvements et ses étiquettes imprimées deviendraient invalides. Ajoutez plutôt un code-barres alias.', 'code');
					}
					$codeFinal = $piece['code'];
				}
			}
			self::exigerCodeLibre($codeFinal, $id, 'code');

			// Alias : comparés à l'état final
			$existants = array();
			if ($piece) {
				$st = $pdo->prepare('SELECT id, code, type FROM pieces_codes WHERE piece_id = ? ORDER BY id');
				$st->execute(array($id));
				foreach ($st->fetchAll() as $r) {
					$existants[strtolower($r['code'])] = $r;
				}
			}
			$finaux = array();
			foreach ($aliasVoulus as $a) {
				$cle = strtolower($a['code']);
				if ($cle === strtolower($codeFinal)) {
					throw new InventaireException('Le code « ' . $a['code'] . ' » est déjà le code interne de cette pièce : il n\'a pas besoin d\'alias.', 'codes');
				}
				if (isset($finaux[$cle])) {
					throw new InventaireException('Le code-barres « ' . $a['code'] . ' » est en double dans la liste.', 'codes');
				}
				if (isset($existants[$cle])) {
					$a['code'] = $existants[$cle]['code'];
				} else {
					self::exigerCodeLibre($a['code'], $id, 'codes');
				}
				$finaux[$cle] = $a;
			}

			$cree = !$piece;
			$changements = array();
			try {
				if ($piece) {
					foreach (array('code' => $codeFinal, 'nom' => $nom, 'unite' => $unite) as $k => $v) {
						if ((string) $piece[$k] !== (string) $v) {
							$changements[$k] = array($piece[$k], $v);
						}
					}
					$ancienneDesc = (string) ($piece['description'] === null ? '' : $piece['description']);
					if ($ancienneDesc !== $description) {
						$changements['description'] = array(mb_substr($ancienneDesc, 0, 200), mb_substr($description, 0, 200));
					}
					if (($piece['categorie_id'] === null ? null : (int) $piece['categorie_id']) !== $cat) {
						$changements['categorie_id'] = array($piece['categorie_id'], $cat);
					}
					$pdo->prepare('UPDATE pieces SET code = ?, nom = ?, description = ?, categorie_id = ?, unite = ? WHERE id = ?')
						->execute(array($codeFinal, $nom, $description === '' ? null : $description, $cat, $unite, $id));
				} else {
					$pdo->prepare('INSERT INTO pieces (code, nom, description, categorie_id, unite, actif) VALUES (?, ?, ?, ?, ?, 1)')
						->execute(array($codeFinal, $nom, $description === '' ? null : $description, $cat, $unite));
					$id = (int) $pdo->lastInsertId();
				}

				// Alias : retraits, changements de type, ajouts
				$retires = array();
				$ajoutes = array();
				foreach ($existants as $cle => $r) {
					if (!isset($finaux[$cle])) {
						$pdo->prepare('DELETE FROM pieces_codes WHERE id = ?')->execute(array($r['id']));
						$retires[] = $r['code'];
					}
				}
				foreach ($finaux as $cle => $a) {
					if (isset($existants[$cle])) {
						if ($existants[$cle]['type'] !== $a['type']) {
							$pdo->prepare('UPDATE pieces_codes SET type = ? WHERE id = ?')->execute(array($a['type'], $existants[$cle]['id']));
							$changements['alias_type_' . $a['code']] = array($existants[$cle]['type'], $a['type']);
						}
					} else {
						$pdo->prepare('INSERT INTO pieces_codes (piece_id, code, type) VALUES (?, ?, ?)')->execute(array($id, $a['code'], $a['type']));
						$ajoutes[] = $a['code'];
					}
				}
			} catch (PDOException $ex) {
				if (isset($ex->errorInfo[1]) && (int) $ex->errorInfo[1] === 1062) {
					throw new InventaireException('Ce code est déjà utilisé par une autre pièce, un autre alias ou un emplacement. Vérifiez-le et réessayez.', 'code');
				}
				throw $ex;
			}
			if ($retires) {
				$changements['alias_retires'] = $retires;
			}
			if ($ajoutes) {
				$changements['alias_ajoutes'] = $ajoutes;
			}

			// Minimums
			foreach ($seuilsVoulus as $eid => $m) {
				$st = $pdo->prepare('SELECT minimum FROM seuils WHERE entreprise_id = ? AND piece_id = ? FOR UPDATE');
				$st->execute(array($eid, $id));
				$avant = $st->fetchColumn();
				$avantD = ($avant === false) ? 0 : Dec::parse($avant, Dec::QTE);
				if ($m > 0) {
					$pdo->prepare('INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE minimum = VALUES(minimum)')
						->execute(array($eid, $id, Dec::fmt($m, Dec::QTE)));
				} else {
					$pdo->prepare('DELETE FROM seuils WHERE entreprise_id = ? AND piece_id = ?')->execute(array($eid, $id));
				}
				if ($avantD !== $m) {
					$changements['minimum_entreprise_' . $eid] = array(Dec::fmt($avantD, Dec::QTE), Dec::fmt($m, Dec::QTE));
				}
			}

			if ($cree) {
				$details = array('code' => $codeFinal, 'nom' => $nom);
				if ($ajoutes) {
					$details['alias'] = $ajoutes;
				}
				foreach ($seuilsVoulus as $eid => $m) {
					if ($m > 0) {
						$details['minimum_entreprise_' . $eid] = Dec::fmt($m, Dec::QTE);
					}
				}
				Journal::ecrire($pdo, $uid, 'piece.cree', 'pieces', $id, $details);
			} elseif ($changements) {
				Journal::ecrire($pdo, $uid, 'piece.modifie', 'pieces', $id, array('code' => $codeFinal, 'changements' => $changements));
			}

			// Activation (pièce existante seulement : une pièce créée est toujours active)
			if ($piece && $actifVoulu !== null && (int) $piece['actif'] !== ($actifVoulu ? 1 : 0)) {
				$piece['code'] = $codeFinal;
				$piece['nom'] = $nom;
				self::appliquerActif($piece, $actifVoulu, $confirmer);
			}
			return array('id' => $id, 'code' => $codeFinal, 'cree' => $cree);
		});
		});
	}
}
