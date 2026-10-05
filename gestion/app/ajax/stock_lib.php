<?php
/**
 * Outils communs du module D2 : stock, historique des mouvements, sous le minimum, tableau de bord.
 * Ce fichier n'est pas un endpoint : il est inclus (require_once) par les endpoints stock*, historique*, sous_minimum*, dashboard*
 * et par les pages du module. Appelé directement, il répond 404 (après les gardes de init.php : connexion).
 *
 * Principes
 *  - LECTURE seulement : ce module n'écrit jamais dans le stock ;
 *  - l'entreprise est TOUJOURS rapprochée des droits de l'utilisateur côté serveur (jamais crue sur parole) :
 *    un id d'entreprise ou d'emplacement non permis => 403 « accès refusé » (le même message qu'il existe ou non) ;
 *  - un employé ne reçoit AUCUN coût, ni valeur : les colonnes de coût n'existent tout simplement pas pour lui
 *    (ni dans le SQL, ni dans le JSON, ni dans les exports) ;
 *  - toutes les valeurs du navigateur sont liées (requêtes préparées) ; les listes d'entreprises insérées dans le SQL
 *    sont des entiers issus des droits de l'utilisateur ; les tris passent par la liste blanche de DataTable.
 */
require_once __DIR__ . '/../init.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

/** Accès refusé (rôle ou entreprise) : réponse HTTP 403. */
final class SuiviRefus extends InventaireException
{
}

final class Suivi
{
	const MAX_RECHERCHE = 100;
	const MOTS_MAX = 6;

	// ======================================================================
	//  Exécution des endpoints (JSON ou CSV) : erreurs en français, jamais de fuite
	// ======================================================================

	/** Exécute $fn(contexte) ; 403 si refus, 400 si entrée invalide, 500 générique sinon (journal PHP). $fn peut terminer le script. */
	public static function executer($fn)
	{
		try {
			$ctx = self::contexte();
			$data = $fn($ctx);
			json_ok(is_array($data) ? $data : array());
		} catch (SuiviRefus $ex) {
			json_fail($ex->getMessage(), 403);
		} catch (InventaireException $ex) {
			json_fail($ex->getMessage(), 400, $ex->champ ? array('champ' => $ex->champ) : array());
		} catch (Throwable $ex) {
			error_log('Endpoint ' . (isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '') . ' : ' . $ex);
			json_fail('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
		}
	}

	/** Comme executer() pour un téléchargement : les refus sont du texte brut (le navigateur télécharge un lien, pas du JSON). */
	public static function executerExport($fn)
	{
		try {
			$ctx = self::contexte();
			$fn($ctx);
			exit;
		} catch (SuiviRefus $ex) {
			self::refuserTexte($ex->getMessage(), 403);
		} catch (InventaireException $ex) {
			self::refuserTexte($ex->getMessage(), 400);
		} catch (Throwable $ex) {
			error_log('Export ' . (isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '') . ' : ' . $ex);
			self::refuserTexte('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
		}
	}

	private static function refuserTexte($message, $status)
	{
		if (headers_sent()) {   // le fichier est déjà en cours d'envoi : on ne peut plus changer le code HTTP
			exit;
		}
		while (ob_get_level() > 0) {
			ob_end_clean();
		}
		http_response_code($status);
		header('Content-Type: text/plain; charset=utf-8');
		header('Cache-Control: no-store');
		echo $message;
		exit;
	}

	/** Utilisateur connecté, rôle employé+ vérifié par le service. @return array{uid:int,role:string,couts:bool,entreprises:int[]} */
	public static function contexte()
	{
		$uid = utilisateur_id();
		try {
			$u = inventaire()->exiger($uid, 'consulter');
		} catch (InventaireException $ex) {
			throw new SuiviRefus($ex->getMessage());
		}
		return array(
			'uid' => $uid,
			'role' => $u['role'],
			'couts' => Inventaire::RANG[$u['role']] >= Inventaire::RANG[Inventaire::ROLE_MIN['voir_couts']],
			'entreprises' => array_values(array_map('intval', $u['entreprises'])),
		);
	}

	// ======================================================================
	//  Lecture des paramètres du navigateur (GET ou POST)
	// ======================================================================

	/** Paramètres de la requête : POST puis GET (comme DataTable). */
	public static function requete()
	{
		return $_POST + $_GET;
	}

	/** Texte (jamais un tableau) : espaces et caractères de contrôle retirés, borné. '' si absent. */
	public static function texte(array $req, $cle, $max = 100)
	{
		if (!isset($req[$cle])) {
			return '';
		}
		if (!is_scalar($req[$cle])) {
			throw new InventaireException('Paramètre invalide : ' . $cle . '.');
		}
		$s = preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string) $req[$cle]);
		return mb_substr(trim((string) $s), 0, $max);
	}

	/** Entier strictement positif, ou null si absent / vide / 0 ; sinon erreur 400. */
	public static function entier(array $req, $cle, $libelle)
	{
		$s = self::texte($req, $cle, 20);
		if ($s === '' || $s === '0') {
			return null;
		}
		if (!ctype_digit($s) || strlen($s) > 9) {
			throw new InventaireException($libelle . ' invalide.', $cle);
		}
		return (int) $s;
	}

	/** Date AAAA-MM-JJ valide, ou null si absente ; sinon erreur 400. */
	public static function date(array $req, $cle, $libelle)
	{
		$s = self::texte($req, $cle, 10);
		if ($s === '') {
			return null;
		}
		if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1]) || $s < '2000-01-01') {
			throw new InventaireException($libelle . ' : date invalide (AAAA-MM-JJ).', $cle);
		}
		return $s;
	}

	public static function booleen(array $req, $cle)
	{
		$s = strtolower(self::texte($req, $cle, 10));
		return in_array($s, array('1', 'true', 'on', 'oui'), true);
	}

	/**
	 * Entreprises visées : celle demandée (refusée si l'utilisateur n'y a pas accès), sinon toutes celles qu'il peut voir.
	 * @return int[]
	 */
	public static function entreprises(array $ctx, $demande)
	{
		if ($demande === null) {
			return $ctx['entreprises'];
		}
		if (!in_array((int) $demande, $ctx['entreprises'], true)) {
			throw new SuiviRefus('Vous n\'avez pas accès à cette entreprise.');
		}
		return array((int) $demande);
	}

	/** Emplacement (actif ou non) d'une entreprise permise ; même refus qu'il n'existe pas ou qu'il soit d'une autre entreprise. */
	public static function emplacement(array $ctx, $id)
	{
		global $pdo;
		$st = $pdo->prepare('SELECT id, nom, entreprise_id FROM emplacements WHERE id = ?');
		$st->execute(array((int) $id));
		$e = $st->fetch();
		if (!$e || !in_array((int) $e['entreprise_id'], $ctx['entreprises'], true)) {
			throw new SuiviRefus('Cet emplacement n\'existe pas ou vous n\'y avez pas accès.');
		}
		return $e;
	}

	/** "1,2,3" à insérer tel quel dans un IN (...) : entiers seulement ; '0' si la liste est vide (aucun résultat). */
	public static function listeIds(array $ids)
	{
		$ids = array_values(array_unique(array_map('intval', $ids)));
		return $ids ? implode(',', $ids) : '0';
	}

	/** Mots d'une recherche (au plus MOTS_MAX), chacun devant être trouvé. */
	public static function mots($s)
	{
		return array_slice(preg_split('/\s+/u', trim((string) $s), -1, PREG_SPLIT_NO_EMPTY), 0, self::MOTS_MAX);
	}

	// ======================================================================
	//  STOCK : requête commune au tableau et à l'export CSV
	// ======================================================================

	/**
	 * Filtres validés du stock à partir de la requête du navigateur.
	 * @return array{vue:string,entreprises:int[],emplacement:?int,categorie:?string,zero:bool,q:string}
	 */
	public static function filtresStock(array $ctx, array $req)
	{
		$vue = self::texte($req, 'vue', 20);
		if ($vue !== '' && $vue !== 'emplacement' && $vue !== 'piece') {
			throw new InventaireException('Vue invalide.', 'vue');
		}
		$ents = self::entreprises($ctx, self::entier($req, 'entreprise_id', 'Entreprise'));
		$emp = self::entier($req, 'emplacement_id', 'Emplacement');
		if ($emp !== null) {
			self::emplacement($ctx, $emp);   // refus 403 si hors de mes entreprises
		}
		$cat = self::texte($req, 'categorie_id', 20);
		if ($cat !== '' && $cat !== 'aucune' && (!ctype_digit($cat) || strlen($cat) > 9)) {
			throw new InventaireException('Catégorie invalide.', 'categorie_id');
		}
		return array(
			'vue' => $vue === 'piece' ? 'piece' : 'emplacement',
			'entreprises' => $ents,
			'emplacement' => $emp,
			'categorie' => $cat === '' ? null : $cat,
			'zero' => self::booleen($req, 'zero'),
			'q' => self::texte($req, 'q', self::MAX_RECHERCHE),
		);
	}

	/**
	 * Définition SQL du stock (FROM / colonnes / WHERE / params), la même pour le tableau et pour l'export.
	 *  - vue « emplacement » : une ligne par (pièce, emplacement) ; les lignes à zéro n'existent que si la pièce y a déjà été ;
	 *  - vue « pièce » : une ligne par (pièce, entreprise) avec le total de l'entreprise ; avec « zéro », toutes les pièces actives.
	 * Les colonnes de coût (cout_moyen, valeur) n'existent que si $ctx['couts'].
	 */
	public static function stockRequete(array $ctx, array $f)
	{
		$piece = ($f['vue'] === 'piece');
		$liste = self::listeIds($f['entreprises']);
		$couts = $ctx['couts'];
		$where = array();
		$params = array();

		if ($piece) {
			$from = 'pieces p
				JOIN entreprises en ON en.id IN (' . $liste . ')
				LEFT JOIN (SELECT s.piece_id, e.entreprise_id, SUM(s.quantite) AS q
				             FROM stock s JOIN emplacements e ON e.id = s.emplacement_id
				            WHERE e.entreprise_id IN (' . $liste . ')
				            GROUP BY s.piece_id, e.entreprise_id) t ON t.piece_id = p.id AND t.entreprise_id = en.id
				LEFT JOIN categories c ON c.id = p.categorie_id
				LEFT JOIN seuils se ON se.entreprise_id = en.id AND se.piece_id = p.id'
				. ($couts ? ' LEFT JOIN stock_couts sc ON sc.entreprise_id = en.id AND sc.piece_id = p.id' : '');
			$qte = 'COALESCE(t.q, 0)';
			// une pièce désactivée n'apparaît que si elle a encore du stock
			$where[] = '(p.actif = 1 OR ' . $qte . ' > 0)';
			if (!$f['zero']) {
				$where[] = $qte . ' > 0';
			}
			$colonnes = array(
				'cle' => "CONCAT(p.code, '|', LPAD(en.id, 10, '0'))",
				'piece_id' => 'p.id',
				'code' => 'p.code',
				'nom' => 'p.nom',
				'actif' => 'p.actif',
				'categorie' => 'c.nom',
				'entreprise' => 'en.nom',
				'emplacement' => 'NULL',
				'emp_actif' => 'NULL',
				'quantite' => $qte,
				'unite' => 'p.unite',
				'minimum' => 'se.minimum',
				'total_ent' => $qte,
			);
			if ($couts) {
				$colonnes['cout_moyen'] = 'sc.cout_moyen';
				$colonnes['valeur'] = 'ROUND(' . $qte . ' * sc.cout_moyen, 2)';
			}
		} else {
			$from = 'stock s
				JOIN pieces p ON p.id = s.piece_id
				JOIN emplacements e ON e.id = s.emplacement_id
				JOIN entreprises en ON en.id = e.entreprise_id
				LEFT JOIN categories c ON c.id = p.categorie_id
				LEFT JOIN seuils se ON se.entreprise_id = e.entreprise_id AND se.piece_id = s.piece_id'
				. ($couts ? ' LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id' : '');
			$where[] = 'e.entreprise_id IN (' . $liste . ')';
			$where[] = '(p.actif = 1 OR s.quantite > 0)';
			if (!$f['zero']) {
				$where[] = 's.quantite > 0';
			}
			if ($f['emplacement'] !== null) {
				$where[] = 's.emplacement_id = :emp';
				$params[':emp'] = (int) $f['emplacement'];
			}
			$colonnes = array(
				'cle' => "CONCAT(p.code, '|', LPAD(s.emplacement_id, 10, '0'))",
				'piece_id' => 'p.id',
				'code' => 'p.code',
				'nom' => 'p.nom',
				'actif' => 'p.actif',
				'categorie' => 'c.nom',
				'entreprise' => 'en.nom',
				'emplacement' => 'e.nom',
				'emp_actif' => 'e.actif',
				'quantite' => 's.quantite',
				'unite' => 'p.unite',
				'minimum' => 'se.minimum',
				// total de la pièce dans toute l'entreprise (seulement si un minimum existe) : sert à repérer « sous le minimum »
				'total_ent' => 'CASE WHEN se.minimum > 0 THEN (SELECT COALESCE(SUM(s2.quantite), 0) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id
				                                                 WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id) END',
			);
			if ($couts) {
				$colonnes['cout_moyen'] = 'sc.cout_moyen';
				$colonnes['valeur'] = 'ROUND(s.quantite * sc.cout_moyen, 2)';
			}
		}

		if ($f['categorie'] !== null) {
			if ($f['categorie'] === 'aucune') {
				$where[] = 'p.categorie_id IS NULL';
			} else {
				$where[] = 'p.categorie_id = :cat';
				$params[':cat'] = (int) $f['categorie'];
			}
		}
		// Recherche : chaque mot doit se trouver dans le code, le nom ou un code-barres (alias) de la pièce
		foreach (self::mots($f['q']) as $i => $mot) {
			$like = '%' . Inventaire::likeEchapper($mot) . '%';
			$where[] = '(p.code LIKE :qa' . $i . ' OR p.nom LIKE :qb' . $i . ' OR EXISTS (SELECT 1 FROM pieces_codes pc WHERE pc.piece_id = p.id AND pc.code LIKE :qc' . $i . '))';
			$params[':qa' . $i] = $like;
			$params[':qb' . $i] = $like;
			$params[':qc' . $i] = $like;
		}
		return array('from' => $from, 'colonnes' => $colonnes, 'where' => $where, 'params' => $params);
	}

	/** Vrai si la ligne de stock est sous le minimum de son entreprise (comparaison décimale exacte). */
	public static function sousMinimumLigne(array $l)
	{
		if (!isset($l['minimum']) || $l['minimum'] === null) {
			return false;
		}
		$min = Dec::parse($l['minimum'], Dec::QTE);
		if ($min <= 0) {
			return false;
		}
		$tot = (isset($l['total_ent']) && $l['total_ent'] !== null) ? Dec::parse($l['total_ent'], Dec::QTE) : 0;
		return $tot < $min;
	}

	// ======================================================================
	//  HISTORIQUE : requête commune au tableau et à l'export CSV
	// ======================================================================

	/** @return array{entreprises:int[],piece:?int,emplacement:?int,type:string,du:?string,au:?string,utilisateur:?int,numero:string} */
	public static function filtresHistorique(array $ctx, array $req)
	{
		$ents = self::entreprises($ctx, self::entier($req, 'entreprise_id', 'Entreprise'));
		$emp = self::entier($req, 'emplacement_id', 'Emplacement');
		if ($emp !== null) {
			self::emplacement($ctx, $emp);
		}
		$type = self::texte($req, 'type', 30);
		if ($type !== '' && !isset(TYPES_DOCUMENT_FR[$type])) {
			throw new InventaireException('Type de document invalide.', 'type');
		}
		$du = self::date($req, 'du', 'Date de début');
		$au = self::date($req, 'au', 'Date de fin');
		if ($du !== null && $au !== null && $du > $au) {
			throw new InventaireException('La date de début doit précéder la date de fin.', 'du');
		}
		return array(
			'entreprises' => $ents,
			'piece' => self::entier($req, 'piece_id', 'Pièce'),
			'emplacement' => $emp,
			'type' => $type,
			'du' => $du,
			'au' => $au,
			'utilisateur' => self::entier($req, 'utilisateur_id', 'Utilisateur'),
			'numero' => self::texte($req, 'numero', 30),
		);
	}

	/**
	 * Registre des mouvements d'une ou plusieurs entreprises. Un mouvement appartient à l'entreprise de SON emplacement :
	 * une facture interne n'expose donc, à chaque entreprise, que sa propre moitié.
	 * Les colonnes cout_unitaire et valeur n'existent que si $ctx['couts'].
	 */
	public static function historiqueRequete(array $ctx, array $f)
	{
		// Performance : STRAIGHT_JOIN lit le registre par sa clé (id décroissant = du plus récent au plus ancien) et s'arrête après
		// la page demandée, sans trier tout le registre ; les autres tables sont jointes par LEFT JOIN sur leur clé primaire (les clés
		// étrangères garantissent qu'elles existent) : le comptage les ignore, et les lignes sont les mêmes qu'avec un JOIN.
		$from = 'mouvements m
			STRAIGHT_JOIN emplacements e ON e.id = m.emplacement_id
			LEFT JOIN documents d ON d.id = m.document_id
			LEFT JOIN pieces p ON p.id = m.piece_id
			LEFT JOIN entreprises en ON en.id = e.entreprise_id
			LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id';
		$where = array('e.entreprise_id IN (' . self::listeIds($f['entreprises']) . ')');
		$params = array();
		if ($f['piece'] !== null) {
			$where[] = 'm.piece_id = :piece';
			$params[':piece'] = (int) $f['piece'];
		}
		if ($f['emplacement'] !== null) {
			$where[] = 'm.emplacement_id = :emp';
			$params[':emp'] = (int) $f['emplacement'];
		}
		if ($f['type'] !== '') {
			$where[] = 'd.type = :type';
			$params[':type'] = $f['type'];
		}
		if ($f['du'] !== null) {
			$where[] = 'm.date_mouvement >= :du';
			$params[':du'] = $f['du'] . ' 00:00:00';
		}
		if ($f['au'] !== null) {
			$where[] = 'm.date_mouvement < :au';
			$params[':au'] = date('Y-m-d', strtotime($f['au'] . ' +1 day')) . ' 00:00:00';
		}
		if ($f['utilisateur'] !== null) {
			$where[] = 'm.utilisateur_id = :util';
			$params[':util'] = (int) $f['utilisateur'];
		}
		if ($f['numero'] !== '') {
			$where[] = 'd.numero LIKE :num';
			$params[':num'] = '%' . Inventaire::likeEchapper($f['numero']) . '%';
		}
		$colonnes = array(
			'ordre' => 'm.id',                      // premier : départage tout tri (identifiant unique, chronologique)
			'date' => 'm.date_mouvement',
			'doc_id' => 'd.id',
			'numero' => 'd.numero',
			'type' => 'd.type',
			'doc_statut' => 'd.statut',
			'piece_id' => 'p.id',
			'code' => 'p.code',
			'nom' => 'p.nom',
			'unite' => 'p.unite',
			'entreprise' => 'en.nom',
			'emplacement' => 'e.nom',
			'quantite' => 'm.quantite',
			'utilisateur' => "COALESCE(NULLIF(u.nom_complet, ''), u.nom_utilisateur)",
			'annulation' => 'm.est_annulation',
		);
		if ($ctx['couts']) {
			$colonnes['cout_unitaire'] = 'm.cout_unitaire';
			$colonnes['valeur'] = 'ROUND(m.quantite * m.cout_unitaire, 2)';
		}
		return array('from' => $from, 'colonnes' => $colonnes, 'where' => $where, 'params' => $params);
	}

	/** Utilisateurs qui peuvent figurer dans l'historique de mes entreprises (admins et utilisateurs de ces entreprises). */
	public static function utilisateursVisibles(array $ctx)
	{
		global $pdo;
		$st = $pdo->query("SELECT u.id, COALESCE(NULLIF(u.nom_complet, ''), u.nom_utilisateur) AS nom, u.actif
			  FROM utilisateurs u
			 WHERE u.role = 'admin' OR EXISTS (SELECT 1 FROM utilisateur_entreprises ue WHERE ue.utilisateur_id = u.id AND ue.entreprise_id IN (" . self::listeIds($ctx['entreprises']) . "))
			 ORDER BY nom");
		return $st->fetchAll();
	}

	// ======================================================================
	//  SOUS LE MINIMUM
	// ======================================================================

	/**
	 * Pièces sous le minimum (service Inventaire::sousMinimum) avec le manque calculé en décimal exact,
	 * du plus grand manque au plus petit. Pour un gestionnaire+ : emplacement de réception proposé (entrepôt actif de l'entreprise).
	 * @return array[] {entreprise_id, entreprise, piece_id, code, nom, unite, minimum, quantite, manque[, emplacement_reception_id]}
	 */
	public static function sousMinimum(array $ctx, array $entrepriseIds)
	{
		global $pdo;
		$rows = inventaire()->sousMinimum($ctx['uid'], $entrepriseIds);
		$ent = array();
		if ($ctx['role'] !== 'employe' && $rows) {
			$st = $pdo->query("SELECT entreprise_id, MIN(id) AS id FROM emplacements WHERE actif = 1 AND type = 'entrepot' GROUP BY entreprise_id");
			foreach ($st as $r) {
				$ent[(int) $r['entreprise_id']] = (int) $r['id'];
			}
		}
		$out = array();
		foreach ($rows as $r) {
			$manque = Dec::parse($r['minimum'], Dec::QTE) - Dec::parse($r['quantite'], Dec::QTE);
			$l = array(
				'entreprise_id' => (int) $r['entreprise_id'],
				'entreprise' => $r['entreprise'],
				'piece_id' => (int) $r['piece_id'],
				'code' => $r['code'],
				'nom' => $r['nom'],
				'unite' => $r['unite'],
				'minimum' => $r['minimum'],
				'quantite' => $r['quantite'],
				'manque' => Dec::fmt($manque, Dec::QTE),
				'_manque' => $manque,
			);
			if ($ctx['role'] !== 'employe') {
				$l['emplacement_reception_id'] = isset($ent[(int) $r['entreprise_id']]) ? $ent[(int) $r['entreprise_id']] : null;
			}
			$out[] = $l;
		}
		usort($out, function ($a, $b) {
			return ($b['_manque'] <=> $a['_manque']) ?: strcmp($a['code'], $b['code']) ?: ($a['entreprise_id'] <=> $b['entreprise_id']);
		});
		foreach ($out as &$l) {
			unset($l['_manque']);
		}
		unset($l);
		return $out;
	}

	// ======================================================================
	//  Exports CSV : UTF-8 avec BOM, « ; », virgule décimale, formules neutralisées
	// ======================================================================

	/** Texte pour une cellule CSV : une cellule qui commencerait par = + - @ tabulation ou retour chariot est préfixée d'une apostrophe. */
	public static function csvTexte($v)
	{
		$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $v);
		if ($s !== '' && strpos("=+-@\t\r\n", $s[0]) !== false) {
			$s = "'" . $s;
		}
		return $s;
	}

	/** Nombre décimal exact (chaîne) -> cellule à virgule décimale, sans séparateur de milliers ; non numérique : traité comme du texte. */
	public static function csvNombre($s, $min = 0, $max = 4)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$s = (string) $s;
		if (!preg_match('/^(-?)(\d+)(?:\.(\d*))?$/', $s, $m)) {
			return self::csvTexte($s);
		}
		$ent = ltrim($m[2], '0');
		$ent = ($ent === '') ? '0' : $ent;
		$frac = rtrim(isset($m[3]) ? $m[3] : '', '0');
		$frac = str_pad(substr($frac, 0, $max), $min, '0');
		$signe = ($m[1] === '-' && ($ent !== '0' || trim($frac, '0') !== '')) ? '-' : '';
		return $signe . $ent . ($frac !== '' ? ',' . $frac : '');
	}

	/** Une cellule CSV entre guillemets si nécessaire (séparateur, guillemet, saut de ligne). */
	private static function csvCellule($c)
	{
		$c = (string) $c;
		return preg_match('/[;"\r\n]/', $c) ? '"' . str_replace('"', '""', $c) . '"' : $c;
	}

	/** Début de la réponse CSV : en-têtes HTTP, BOM et ligne d'en-tête. À appeler APRÈS toute validation. */
	public static function csvDebut($nomFichier, array $entetes)
	{
		while (ob_get_level() > 0) {
			ob_end_clean();
		}
		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', $nomFichier) . '"');
		header('Cache-Control: no-store');
		header('X-Content-Type-Options: nosniff');
		echo "\xEF\xBB\xBF";
		self::csvLigne($entetes);
	}

	/** Une ligne de CSV (cellules DÉJÀ neutralisées par csvTexte / csvNombre). */
	public static function csvLigne(array $cellules)
	{
		echo implode(';', array_map(array(__CLASS__, 'csvCellule'), $cellules)) . "\r\n";
	}

	/** Écrit une action d'export dans le journal (qui a exporté quoi). */
	public static function journalExport(array $ctx, $action, array $details = array())
	{
		global $pdo;
		Journal::ecrire($pdo, $ctx['uid'], $action, null, null, $details);
	}
}
