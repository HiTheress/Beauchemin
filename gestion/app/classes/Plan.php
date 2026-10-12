<?php
/**
 * Plan de l'entrepôt : une tuile par emplacement actif (avec ce qu'il contient, en résumé), la place libre de chaque tuile,
 * le contenu détaillé d'une tuile et le jeton de version du « temps réel » (la page le demande toutes les 4 secondes).
 *
 * Principes
 *  - LECTURE seule du stock : jamais d'écriture dans stock, mouvements ni coûts. La seule écriture est la place des tuiles
 *    (table plan_emplacements), réservée à l'administrateur, validée, journalisée, tout ou rien ;
 *  - mêmes entreprises que la page Stock : celles que l'utilisateur peut CONSULTER (y compris une entreprise désactivée) ;
 *  - aucun coût, prix ni valeur n'est lu ni envoyé, pour aucun rôle : un employé reçoit les mêmes champs qu'un gestionnaire ;
 *  - quantités = chaînes décimales exactes ("12.500"), jamais de float ; les clés de réponse disent « unites » et « nb_pieces »
 *    (jamais « total » ni « valeur » : l'audit de sécurité y cherche des montants).
 */
final class PlanRefus extends InventaireException
{
}

final class Plan
{
	const GRILLE = 20;                 // les positions et les tailles sont des multiples de 20 px
	const ZONE_LARGEUR = 1600;         // limites du plan (px)
	const ZONE_HAUTEUR = 1200;
	const TUILE_LARGEUR = 240;         // taille d'une tuile placée automatiquement
	const TUILE_HAUTEUR = 160;
	const LARGEUR_MIN = 140;
	const HAUTEUR_MIN = 100;
	const LARGEUR_MAX = 600;
	const HAUTEUR_MAX = 400;
	const MAX_POSITIONS = 500;         // tuiles par enregistrement
	const MAX_LIGNES = 400;            // pièces envoyées pour le contenu d'une tuile (au-delà : « tronque », la recherche rapide interroge le serveur)
	const MOTS_MAX = 6;
	const ORDRE_TYPES = "FIELD(e.type, 'entrepot', 'boutique', 'cube')";

	/**
	 * Rayonnages d'un emplacement (où sont rangées les pièces), par défaut selon son type : UNE seule définition, ici.
	 * Une allée est une rangée d'étagères (cube : allée 1 = côté gauche, allée 2 = côté droit), une étagère une travée entre deux montants,
	 * un niveau une tablette (niveau 1 = la plus basse). L'administrateur peut la changer par emplacement (plan_emplacements.rayon_*, NULL = défaut).
	 */
	const GEOMETRIE_DEFAUT = array(
		'entrepot' => array('allees' => 4, 'etageres' => 6, 'niveaux' => 4),
		'boutique' => array('allees' => 2, 'etageres' => 4, 'niveaux' => 3),
		'cube' => array('allees' => 2, 'etageres' => 3, 'niveaux' => 3),
	);
	const GEOMETRIE_MAX = array('allees' => 12, 'etageres' => 30, 'niveaux' => 10);   // bornes du réglage (un cube n'a que deux côtés : 2 allées au plus)
	const CUBE_ALLEES_MAX = 2;
	const PAR_POSITION = 3;                                                          // pièces au plus par position pour le rangement automatique

	/** @var PDO */
	private $pdo;
	/** @var Inventaire */
	private $inv;

	public function __construct(PDO $pdo, Inventaire $inv)
	{
		$this->pdo = $pdo;
		$this->inv = $inv;
	}

	/** Limites et tailles du plan, communiquées à la page (une seule source de vérité : ce fichier). */
	public static function zone()
	{
		return array(
			'largeur' => self::ZONE_LARGEUR, 'hauteur' => self::ZONE_HAUTEUR, 'grille' => self::GRILLE,
			'tuile_largeur' => self::TUILE_LARGEUR, 'tuile_hauteur' => self::TUILE_HAUTEUR,
			'largeur_min' => self::LARGEUR_MIN, 'hauteur_min' => self::HAUTEUR_MIN,
			'largeur_max' => self::LARGEUR_MAX, 'hauteur_max' => self::HAUTEUR_MAX,
		);
	}

	// ======================================================================
	//  Rayonnages : dimensions et libellés (fonctions pures)
	// ======================================================================

	/** Bornes du réglage pour un type d'emplacement (un cube n'a que deux côtés). @return array{allees:int,etageres:int,niveaux:int} */
	public static function geometrieLimites($type)
	{
		$m = self::GEOMETRIE_MAX;
		if ($type === 'cube') {
			$m['allees'] = self::CUBE_ALLEES_MAX;
		}
		return $m;
	}

	/** Dimensions par défaut d'un type d'emplacement. @return array{allees:int,etageres:int,niveaux:int} */
	public static function geometrieDefaut($type)
	{
		return isset(self::GEOMETRIE_DEFAUT[$type]) ? self::GEOMETRIE_DEFAUT[$type] : self::GEOMETRIE_DEFAUT['entrepot'];
	}

	/**
	 * Dimensions effectives : la valeur enregistrée (NULL = défaut du type), ramenée dans les bornes du type.
	 * @return array{allees:int,etageres:int,niveaux:int}
	 */
	public static function geometrie($type, $allees = null, $etageres = null, $niveaux = null)
	{
		$g = self::geometrieDefaut($type);
		$m = self::geometrieLimites($type);
		foreach (array('allees' => $allees, 'etageres' => $etageres, 'niveaux' => $niveaux) as $k => $v) {
			if ($v !== null && $v !== '') {
				$g[$k] = max(1, min($m[$k], (int) $v));
			}
		}
		return $g;
	}

	/** « B » (allée 2 d'un entrepôt ou d'une boutique), « Côté gauche » / « Côté droit » (cube). */
	public static function libelleAllee($allee, $type)
	{
		$allee = (int) $allee;
		if ($type === 'cube') {
			return $allee === 1 ? 'Côté gauche' : ($allee === 2 ? 'Côté droit' : 'Côté ' . $allee);
		}
		return $allee >= 1 && $allee <= 26 ? chr(64 + $allee) : (string) $allee;
	}

	/** « Allée B, étagère 3, niveau 2 » ou « Côté gauche, étagère 3, niveau 2 » (même texte que l'étiquette de lecteur d'écran du tiroir). */
	public static function libellePosition(array $r, $type)
	{
		return ($type === 'cube' ? '' : 'Allée ') . self::libelleAllee($r['allee'], $type) . ', étagère ' . (int) $r['etagere'] . ', niveau ' . (int) $r['niveau'];
	}

	/** Libellé court des dimensions pour le journal : « 4 allées, 6 étagères, 4 niveaux ». */
	private static function libelleGeometrie(array $g, $type)
	{
		return $g['allees'] . ($type === 'cube' ? ($g['allees'] > 1 ? ' côtés' : ' côté') : ($g['allees'] > 1 ? ' allées' : ' allée'))
			. ', ' . $g['etageres'] . ($g['etageres'] > 1 ? ' étagères' : ' étagère') . ', ' . $g['niveaux'] . ($g['niveaux'] > 1 ? ' niveaux' : ' niveau');
	}

	/** Une position {allee, etagere, niveau} tient-elle dans ces dimensions ? */
	private static function dansGeometrie(array $r, array $g)
	{
		return $r['allee'] >= 1 && $r['allee'] <= $g['allees'] && $r['etagere'] >= 1 && $r['etagere'] <= $g['etageres'] && $r['niveau'] >= 1 && $r['niveau'] <= $g['niveaux'];
	}

	/** Position telle qu'elle voyage dans les réponses : trois entiers. */
	private static function position(array $r)
	{
		return array('allee' => (int) $r['allee'], 'etagere' => (int) $r['etagere'], 'niveau' => (int) $r['niveau']);
	}

	// ======================================================================
	//  Droits
	// ======================================================================

	/**
	 * Utilisateur actif, rôle employé+ : @return array{uid:int,role:string,entreprises:int[],ecriture:int[]}
	 * (entreprises = consultables ; ecriture = entreprises actives où il peut écrire, comme pour toute autre écriture).
	 */
	private function contexte($userId)
	{
		$u = $this->inv->exiger($userId, 'consulter');
		return array('uid' => (int) $userId, 'role' => $u['role'], 'entreprises' => array_values(array_map('intval', $u['consultables'])), 'ecriture' => array_values(array_map('intval', $u['entreprises'])));
	}

	/** Rôle minimum pour une écriture du plan (gestionnaire : rangements ; admin : dimensions). @return array{id:int,role:string,entreprises:int[],consultables:int[]} */
	private function exigerRole($userId, $role)
	{
		$u = $this->inv->utilisateur($userId);
		if (Inventaire::RANG[$u['role']] < Inventaire::RANG[$role]) {
			throw new PlanRefus('Vous n\'avez pas la permission d\'effectuer cette opération.');
		}
		return $u;
	}

	/** "?,?,?" pour un IN (...) ; les valeurs sont liées. */
	private static function marques(array $ids)
	{
		return implode(',', array_fill(0, count($ids), '?'));
	}

	private function lignes($sql, array $params)
	{
		$st = $this->pdo->prepare($sql);
		$st->execute($params);
		return $st->fetchAll(PDO::FETCH_ASSOC);
	}

	// ======================================================================
	//  Version (temps réel)
	// ======================================================================

	/**
	 * Jeton de version du plan pour cet utilisateur : il change dès qu'un mouvement touche un de ses emplacements, qu'un emplacement
	 * est créé, renommé, (dés)activé ou que la disposition change ; il ne change jamais pour l'activité d'une entreprise qu'il ne voit pas.
	 */
	public function version($userId)
	{
		$ctx = $this->contexte($userId);
		return $this->versionPour($ctx['entreprises']);
	}

	/**
	 * Le jeton lui-même, pour des entreprises déjà vérifiées. UNE requête : le dernier mouvement de chaque emplacement est lu d'un seul accès
	 * dans l'index (emplacement_id, id) — « ORDER BY id DESC LIMIT 1 » avec FORCE INDEX : un MAX(id) corrélé, lui, parcourt tous les
	 * mouvements de l'emplacement (une soixantaine de ms pour 400 000 lignes, contre 0,5 ms ainsi) — plus une empreinte (CRC32 combinés) des quelques lignes
	 * d'emplacements, de leur disposition, de leurs rayonnages et de leurs rangements (un parcours de la clé primaire de `rangements`).
	 * Coût : proportionnel au nombre d'emplacements (quelques dizaines) et de pièces rangées, pas aux mouvements.
	 * Ne couvre pas les minimums ni les noms de pièces (la page relit tout de toute façon chaque minute).
	 */
	public function versionPour(array $entrepriseIds)
	{
		$ids = array_values(array_unique(array_map('intval', $entrepriseIds)));
		if (!$ids) {
			return '0-0-0';
		}
		$r = $this->lignes(
			"SELECT COUNT(*) AS n, COALESCE(MAX(t.dernier), 0) AS dernier,
			        COALESCE(BIT_XOR(CRC32(CONCAT_WS('|', t.id, t.nom, t.type, t.actif, t.code_barres, t.entreprise_id, t.en_code, t.en_nom, t.px, t.py, t.pl, t.ph, t.ra, t.re, t.rn, t.rg))), 0) AS sig
			   FROM (SELECT e.id, e.nom, e.type, e.actif, e.code_barres, e.entreprise_id, en.code AS en_code, en.nom AS en_nom,
			                pe.x AS px, pe.y AS py, pe.largeur AS pl, pe.hauteur AS ph, pe.rayon_allees AS ra, pe.rayon_etageres AS re, pe.rayon_niveaux AS rn,
			                (SELECT COALESCE(BIT_XOR(CRC32(CONCAT_WS('|', r.piece_id, r.allee, r.etagere, r.niveau))), 0) FROM rangements r WHERE r.emplacement_id = e.id) AS rg,
			                (SELECT m.id FROM mouvements m FORCE INDEX (ix_mouv_emplacement_id) WHERE m.emplacement_id = e.id ORDER BY m.id DESC LIMIT 1) AS dernier
			           FROM emplacements e
			           JOIN entreprises en ON en.id = e.entreprise_id
			           LEFT JOIN plan_emplacements pe ON pe.emplacement_id = e.id
			          WHERE e.entreprise_id IN (" . self::marques($ids) . ')) t',
			$ids
		);
		return (int) $r[0]['dernier'] . '-' . (int) $r[0]['n'] . '-' . $r[0]['sig'];
	}

	// ======================================================================
	//  Données du plan
	// ======================================================================

	/**
	 * Tout ce que la page affiche : tuiles (emplacements actifs des entreprises consultables), zone, jeton de version et, si $pieceId est
	 * donné, l'emplacement de cette pièce (« où est cette pièce ? »).
	 * Le jeton est lu AVANT les données : un mouvement qui arrive entre les deux est revu au prochain tour, jamais perdu.
	 * @return array{version:string,admin:bool,zone:array,tuiles:array[],recherche:?array}
	 */
	public function donnees($userId, $pieceId = null)
	{
		$ctx = $this->contexte($userId);
		$version = $this->versionPour($ctx['entreprises']);
		$tuiles = $this->tuiles($ctx['entreprises']);
		return array(
			'version' => $version,
			'admin' => $ctx['role'] === 'admin',
			'zone' => self::zone(),
			'tuiles' => $tuiles,
			'resume' => $this->resume($ctx['entreprises'], $tuiles),
			'recherche' => $pieceId === null ? null : $this->recherche($ctx['entreprises'], (int) $pieceId),
		);
	}

	/**
	 * Les trois chiffres des cartes de la vue 3D : unités en stock (somme des tuiles), pièces sous le minimum (une pièce compte une fois
	 * par entreprise, même règle que la pastille d'alerte des tuiles) et nombre d'emplacements. Quantités seulement : jamais de prix ni de valeur.
	 * @return array{unites:string,nb_bas:int,nb_emplacements:int}
	 */
	private function resume(array $ents, array $tuiles)
	{
		$somme = 0;
		foreach ($tuiles as $t) {
			$somme += Dec::parse($t['unites'], Dec::QTE);
		}
		$bas = 0;
		if ($ents) {
			$in = self::marques($ents);
			$r = $this->lignes(
				"SELECT COUNT(*) AS nb FROM (
				    SELECT DISTINCT e.entreprise_id, s.piece_id
				      FROM stock s
				      JOIN emplacements e ON e.id = s.emplacement_id AND e.actif = 1 AND e.entreprise_id IN ($in)
				      JOIN pieces p ON p.id = s.piece_id AND p.actif = 1
				      JOIN seuils se ON se.entreprise_id = e.entreprise_id AND se.piece_id = s.piece_id AND se.minimum > 0
				     WHERE s.quantite > 0
				       AND (SELECT COALESCE(SUM(s2.quantite), 0) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id
				             WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id) < se.minimum) x",
				$ents
			);
			$bas = (int) $r[0]['nb'];
		}
		return array('unites' => Dec::fmt($somme, Dec::QTE), 'nb_bas' => $bas, 'nb_emplacements' => count($tuiles));
	}

	/** Une tuile par emplacement actif : nom, code d'étiquette, type, entreprise, nb de pièces différentes, unités, pièces sous le minimum, place libre. */
	private function tuiles(array $ents)
	{
		if (!$ents) {
			return array();
		}
		$in = self::marques($ents);
		$rows = $this->lignes(
			"SELECT e.id, e.nom, e.type, e.code_barres, e.entreprise_id, en.code AS entreprise_code, en.nom AS entreprise_nom,
			        pe.x, pe.y, pe.largeur, pe.hauteur,
			        COUNT(s.piece_id) AS nb_pieces, COALESCE(SUM(s.quantite), 0) AS unites,
			        COALESCE(BIT_XOR(CRC32(CONCAT(s.piece_id, ':', s.quantite))), 0) AS sig
			   FROM emplacements e
			   JOIN entreprises en ON en.id = e.entreprise_id
			   LEFT JOIN plan_emplacements pe ON pe.emplacement_id = e.id
			   LEFT JOIN stock s ON s.emplacement_id = e.id AND s.quantite > 0
			  WHERE e.actif = 1 AND e.entreprise_id IN ($in)
			  GROUP BY e.id, e.nom, e.type, e.code_barres, e.entreprise_id, en.code, en.nom, pe.x, pe.y, pe.largeur, pe.hauteur
			  ORDER BY " . self::ORDRE_TYPES . ', e.entreprise_id, e.nom, e.id',
			$ents
		);
		// Pièces « sous le minimum » de chaque emplacement : même règle que la page Stock et que Inventaire::sousMinimum
		// (total de l'entreprise sous le minimum de l'entreprise ; pièce désactivée jamais comptée).
		$bas = array();
		foreach ($this->lignes(
			"SELECT s.emplacement_id, COUNT(*) AS nb
			   FROM stock s
			   JOIN emplacements e ON e.id = s.emplacement_id AND e.actif = 1 AND e.entreprise_id IN ($in)
			   JOIN pieces p ON p.id = s.piece_id AND p.actif = 1
			   JOIN seuils se ON se.entreprise_id = e.entreprise_id AND se.piece_id = s.piece_id AND se.minimum > 0
			  WHERE s.quantite > 0
			    AND (SELECT COALESCE(SUM(s2.quantite), 0) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id
			          WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id) < se.minimum
			  GROUP BY s.emplacement_id",
			$ents
		) as $b) {
			$bas[(int) $b['emplacement_id']] = (int) $b['nb'];
		}
		$out = array();
		foreach ($rows as $r) {
			$id = (int) $r['id'];
			$out[] = array(
				'id' => $id,
				'nom' => $r['nom'],
				'code' => $r['code_barres'],
				'type' => $r['type'],
				'type_libelle' => isset(TYPES_EMPLACEMENT_FR[$r['type']]) ? TYPES_EMPLACEMENT_FR[$r['type']] : $r['type'],
				'entreprise_id' => (int) $r['entreprise_id'],
				'entreprise_code' => $r['entreprise_code'],
				'entreprise_nom' => $r['entreprise_nom'],
				'nb_pieces' => (int) $r['nb_pieces'],
				'unites' => Dec::fmt(Dec::parse($r['unites'], Dec::QTE), Dec::QTE),
				'nb_bas' => isset($bas[$id]) ? $bas[$id] : 0,
				'sig' => (string) $r['sig'],
				'pos' => $r['x'] === null ? null : array('x' => (int) $r['x'], 'y' => (int) $r['y'], 'largeur' => (int) $r['largeur'], 'hauteur' => (int) $r['hauteur']),
			);
		}
		return $out;
	}

	/** Où est cette pièce : quantité et rangement (allée, étagère, niveau, ou null si « à ranger ») dans chaque emplacement actif de mes entreprises, et la somme. */
	private function recherche(array $ents, $pieceId)
	{
		$p = $this->lignes('SELECT id, code, nom, unite, actif FROM pieces WHERE id = ?', array($pieceId));
		if (!$p) {
			throw new InventaireException('Pièce introuvable.', 'piece_id');
		}
		$par = array();
		$somme = 0;
		if ($ents) {
			foreach ($this->lignes(
				'SELECT s.emplacement_id, s.quantite, e.type, pe.rayon_allees, pe.rayon_etageres, pe.rayon_niveaux, r.allee, r.etagere, r.niveau
				   FROM stock s JOIN emplacements e ON e.id = s.emplacement_id
				   LEFT JOIN plan_emplacements pe ON pe.emplacement_id = e.id
				   LEFT JOIN rangements r ON r.emplacement_id = s.emplacement_id AND r.piece_id = s.piece_id
				  WHERE s.piece_id = ? AND s.quantite > 0 AND e.actif = 1 AND e.entreprise_id IN (' . self::marques($ents) . ')
				  ORDER BY s.emplacement_id',
				array_merge(array($pieceId), $ents)
			) as $s) {
				$pos = $s['allee'] === null ? null : self::position($s);
				if ($pos !== null && !self::dansGeometrie($pos, self::geometrie($s['type'], $s['rayon_allees'], $s['rayon_etageres'], $s['rayon_niveaux']))) {
					$pos = null;               // position hors des rayonnages actuels : comme si la pièce était à ranger
				}
				$par[] = array('emplacement_id' => (int) $s['emplacement_id'], 'quantite' => $s['quantite'], 'rangement' => $pos);
				$somme += Dec::parse($s['quantite'], Dec::QTE);
			}
		}
		return array(
			'piece' => array('id' => (int) $p[0]['id'], 'code' => $p[0]['code'], 'nom' => $p[0]['nom'], 'unite' => $p[0]['unite'], 'actif' => (bool) $p[0]['actif']),
			'emplacements' => $par,
			'somme' => Dec::fmt($somme, Dec::QTE),
		);
	}

	// ======================================================================
	//  Contenu d'une tuile
	// ======================================================================

	/**
	 * Pièces d'un emplacement actif d'une entreprise consultable, triées par nom. $q (facultatif) : chaque mot doit se trouver dans le code,
	 * le nom ou un code-barres de la pièce. Refus identique que l'emplacement n'existe pas, soit désactivé ou d'une autre entreprise.
	 * Chaque ligne porte aussi `rangement` ({allee, etagere, niveau} ou null = à ranger) ; la réponse donne `geometrie` (les rayonnages de l'emplacement),
	 * `peut_ranger` (gestionnaire+ avec accès en écriture à l'entreprise), `nb_a_ranger` (pièces actives en stock sans position, toutes lignes comprises,
	 * même si la liste est filtrée ou tronquée) et, pour le réglage de l'administrateur, `geometrie_defaut`, `geometrie_limites`, `geometrie_personnalisee`.
	 * @return array{emplacement:array,nb_pieces:int,unites:string,geometrie:array,lignes:array[],tronque:bool}
	 */
	public function contenu($userId, $emplacementId, $q = '')
	{
		$ctx = $this->contexte($userId);
		$e = $ctx['entreprises'] ? $this->lignes(
			'SELECT e.id, e.nom, e.type, e.code_barres, e.entreprise_id, en.code AS entreprise_code, en.nom AS entreprise_nom,
			        pe.rayon_allees, pe.rayon_etageres, pe.rayon_niveaux
			   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
			   LEFT JOIN plan_emplacements pe ON pe.emplacement_id = e.id
			  WHERE e.id = ? AND e.actif = 1 AND e.entreprise_id IN (' . self::marques($ctx['entreprises']) . ')',
			array_merge(array((int) $emplacementId), $ctx['entreprises'])
		) : array();
		if (!$e) {
			throw new PlanRefus('Cet emplacement n\'existe pas ou vous n\'y avez pas accès.');
		}
		$e = $e[0];
		$eid = (int) $e['id'];
		$ent = (int) $e['entreprise_id'];

		$resume = $this->lignes('SELECT COUNT(*) AS nb, COALESCE(SUM(quantite), 0) AS unites FROM stock WHERE emplacement_id = ? AND quantite > 0', array($eid));
		$where = array('s.emplacement_id = ?', 's.quantite > 0');
		$params = array($ent, $ent, $eid);
		$q = is_string($q) ? mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', $q)), 0, 100) : '';
		$mots = $q === '' ? array() : array_slice(preg_split('/\s+/u', $q, -1, PREG_SPLIT_NO_EMPTY), 0, self::MOTS_MAX);
		foreach ($mots as $mot) {
			$like = '%' . Inventaire::likeEchapper($mot) . '%';
			$where[] = '(p.code LIKE ? OR p.nom LIKE ? OR EXISTS (SELECT 1 FROM pieces_codes pc WHERE pc.piece_id = p.id AND pc.code LIKE ?))';
			array_push($params, $like, $like, $like);
		}
		$rows = $this->lignes(
			'SELECT p.id AS piece_id, p.code, p.nom, p.unite, p.actif, s.quantite,
			        CASE WHEN p.actif = 1 AND se.minimum > 0
			              AND (SELECT COALESCE(SUM(s2.quantite), 0) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id
			                    WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = ?) < se.minimum THEN 1 ELSE 0 END AS bas
			   FROM stock s
			   JOIN pieces p ON p.id = s.piece_id
			   LEFT JOIN seuils se ON se.entreprise_id = ? AND se.piece_id = s.piece_id
			  WHERE ' . implode(' AND ', $where) . '
			  ORDER BY p.nom, p.code
			  LIMIT ' . (self::MAX_LIGNES + 1),
			$params
		);
		$tronque = count($rows) > self::MAX_LIGNES;
		$rows = array_slice($rows, 0, self::MAX_LIGNES);
		$geo = self::geometrie($e['type'], $e['rayon_allees'], $e['rayon_etageres'], $e['rayon_niveaux']);
		$rangements = $this->rangementsDe($eid, $geo, array_column($rows, 'piece_id'));
		$lignes = array();
		foreach ($rows as $r) {
			$lignes[] = array(
				'piece_id' => (int) $r['piece_id'], 'code' => $r['code'], 'nom' => $r['nom'], 'unite' => $r['unite'],
				'actif' => (bool) $r['actif'], 'quantite' => $r['quantite'], 'bas' => (bool) $r['bas'],
				'rangement' => isset($rangements[(int) $r['piece_id']]) ? $rangements[(int) $r['piece_id']] : null,
			);
		}
		$personnalisee = $e['rayon_allees'] !== null || $e['rayon_etageres'] !== null || $e['rayon_niveaux'] !== null;
		return array(
			'emplacement' => array(
				'id' => $eid, 'nom' => $e['nom'], 'code' => $e['code_barres'], 'type' => $e['type'],
				'type_libelle' => isset(TYPES_EMPLACEMENT_FR[$e['type']]) ? TYPES_EMPLACEMENT_FR[$e['type']] : $e['type'],
				'entreprise_id' => $ent, 'entreprise_code' => $e['entreprise_code'], 'entreprise_nom' => $e['entreprise_nom'],
			),
			'nb_pieces' => (int) $resume[0]['nb'],
			'unites' => Dec::fmt(Dec::parse($resume[0]['unites'], Dec::QTE), Dec::QTE),
			'geometrie' => $geo,
			'geometrie_defaut' => self::geometrieDefaut($e['type']),
			'geometrie_limites' => self::geometrieLimites($e['type']),
			'geometrie_personnalisee' => $personnalisee && $geo !== self::geometrieDefaut($e['type']),
			'peut_ranger' => Inventaire::RANG[$ctx['role']] >= Inventaire::RANG['gestionnaire'] && in_array($ent, $ctx['ecriture'], true),
			'nb_a_ranger' => $this->compterARanger($eid, $geo),
			'lignes' => $lignes,
			'tronque' => $tronque,
		);
	}

	// ======================================================================
	//  Rangements : où, dans un emplacement, se trouve chaque pièce
	// ======================================================================

	/**
	 * Positions enregistrées d'un emplacement qui tiennent dans ses rayonnages : [piece_id => {allee, etagere, niveau}].
	 * $pieceIds (facultatif) limite la lecture à ces pièces (les lignes affichées du tiroir).
	 */
	private function rangementsDe($emplacementId, array $geo, ?array $pieceIds = null)
	{
		$out = array();
		if ($pieceIds !== null && !$pieceIds) {
			return $out;
		}
		foreach ($this->lignes(
			'SELECT piece_id, allee, etagere, niveau FROM rangements WHERE emplacement_id = ?' . ($pieceIds === null ? '' : ' AND piece_id IN (' . self::marques($pieceIds) . ')'),
			array_merge(array((int) $emplacementId), $pieceIds === null ? array() : array_map('intval', $pieceIds))
		) as $r) {
			$p = self::position($r);
			if (self::dansGeometrie($p, $geo)) {
				$out[(int) $r['piece_id']] = $p;
			}
		}
		return $out;
	}

	/** Combien de pièces ACTIVES en stock dans l'emplacement n'ont aucune position dans ses rayonnages (une seule requête, quelle que soit la longueur de la liste). */
	private function compterARanger($emplacementId, array $geo)
	{
		$r = $this->lignes(
			'SELECT COUNT(*) AS nb
			   FROM stock s
			   JOIN pieces p ON p.id = s.piece_id AND p.actif = 1
			   LEFT JOIN rangements r ON r.emplacement_id = s.emplacement_id AND r.piece_id = s.piece_id
			        AND r.allee BETWEEN 1 AND ? AND r.etagere BETWEEN 1 AND ? AND r.niveau BETWEEN 1 AND ?
			  WHERE s.emplacement_id = ? AND s.quantite > 0 AND r.piece_id IS NULL',
			array($geo['allees'], $geo['etageres'], $geo['niveaux'], (int) $emplacementId)
		);
		return (int) $r[0]['nb'];
	}

	/**
	 * Pièces ACTIVES qui ont du stock dans l'emplacement mais aucune position valable, dans l'ordre des codes (puis des identifiants) : celles du rangement automatique.
	 * @param array $rangements [piece_id => position] de rangementsDe()
	 * @return int[]
	 */
	private function piecesARanger($emplacementId, array $rangements)
	{
		$ids = array();
		foreach ($this->lignes(
			'SELECT p.id FROM stock s JOIN pieces p ON p.id = s.piece_id AND p.actif = 1 WHERE s.emplacement_id = ? AND s.quantite > 0 ORDER BY p.code, p.id',
			array((int) $emplacementId)
		) as $r) {
			if (!isset($rangements[(int) $r['id']])) {
				$ids[] = (int) $r['id'];
			}
		}
		return $ids;
	}

	// ======================================================================
	//  Disposition libre (administrateur)
	// ======================================================================

	/** Entier envoyé par le navigateur (nombre JSON ou chaîne de chiffres) ; null pour tout le reste (décimal, booléen, texte, tableau…). */
	private static function entier($v)
	{
		if (is_int($v)) {
			return $v;
		}
		if (is_string($v) && preg_match('/^[0-9]{1,6}\z/', $v)) {
			return (int) $v;
		}
		return null;
	}

	/**
	 * Valide la liste envoyée : [{emplacement_id, x, y, largeur, hauteur}, …] ; tout ou rien. Chaque nombre est un entier multiple de 20,
	 * la tuile reste dans le plan (1600 x 1200) et sa taille entre le minimum et le maximum ; pas de doublon.
	 * @return array<int,array{x:int,y:int,largeur:int,hauteur:int}> par identifiant d'emplacement
	 */
	public static function positionsValides($positions)
	{
		if (!is_array($positions) || !$positions) {
			throw new InventaireException('Aucune position à enregistrer.', 'positions');
		}
		if (count($positions) > self::MAX_POSITIONS) {
			throw new InventaireException('Trop de tuiles à la fois.', 'positions');
		}
		$g = self::GRILLE;
		$liste = array();
		foreach ($positions as $p) {
			if (!is_array($p)) {
				throw new InventaireException('Position invalide.', 'positions');
			}
			$id = isset($p['emplacement_id']) ? self::entier($p['emplacement_id']) : null;
			if ($id === null || $id < 1) {
				throw new InventaireException('Emplacement invalide.', 'positions');
			}
			if (isset($liste[$id])) {
				throw new InventaireException('Un emplacement est en double.', 'positions');
			}
			$n = array();
			foreach (array('x', 'y', 'largeur', 'hauteur') as $k) {
				$v = isset($p[$k]) ? self::entier($p[$k]) : null;
				if ($v === null || $v % $g !== 0) {
					throw new InventaireException('Position invalide : les tuiles se placent sur la grille de ' . $g . ' px.', 'positions');
				}
				if ($v < 0) {
					throw new InventaireException('Une tuile sort du plan.', 'positions');
				}
				$n[$k] = $v;
			}
			if ($n['largeur'] < self::LARGEUR_MIN || $n['largeur'] > self::LARGEUR_MAX || $n['hauteur'] < self::HAUTEUR_MIN || $n['hauteur'] > self::HAUTEUR_MAX) {
				throw new InventaireException('Taille invalide : une tuile mesure de ' . self::LARGEUR_MIN . ' x ' . self::HAUTEUR_MIN . ' à ' . self::LARGEUR_MAX . ' x ' . self::HAUTEUR_MAX . ' px.', 'positions');
			}
			if ($n['x'] + $n['largeur'] > self::ZONE_LARGEUR || $n['y'] + $n['hauteur'] > self::ZONE_HAUTEUR) {
				throw new InventaireException('Une tuile sort du plan.', 'positions');
			}
			$liste[$id] = $n;
		}
		return $liste;
	}

	/**
	 * Enregistre la place des tuiles (administrateur seulement). Une ligne par emplacement ; seules les tuiles qui ont changé sont écrites.
	 * Tout est refusé si une seule position est invalide ou si un emplacement n'existe plus, est désactivé ou hors des entreprises permises.
	 * Journal : « plan.disposition » (qui, quelles tuiles). Rien n'est écrit au journal si rien n'a changé.
	 * @return array{modifies:int}
	 */
	public function enregistrer($userId, $positions)
	{
		$u = $this->inv->utilisateur($userId);
		if ($u['role'] !== 'admin') {
			throw new PlanRefus('Cette action est réservée à l\'administrateur.');
		}
		$voulu = self::positionsValides($positions);
		$ents = array_values(array_map('intval', $u['consultables']));
		$ids = array_keys($voulu);

		return $this->inv->transaction(function () use ($userId, $voulu, $ents, $ids) {
			// l'administrateur est revérifié DANS la transaction (il ne peut pas être rétrogradé avant la fin)
			$st = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE id = ? AND role = 'admin' AND actif = 1 LOCK IN SHARE MODE");
			$st->execute(array((int) $userId));
			if (!$st->fetch()) {
				throw new PlanRefus('Cette action est réservée à l\'administrateur.');
			}
			$noms = array();
			if ($ents) {
				foreach ($this->lignes(
					"SELECT e.id, CONCAT(e.nom, ' (', en.nom, ')') AS nom FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
					  WHERE e.actif = 1 AND e.id IN (" . self::marques($ids) . ') AND e.entreprise_id IN (' . self::marques($ents) . ') FOR UPDATE',
					array_merge($ids, $ents)
				) as $r) {
					$noms[(int) $r['id']] = $r['nom'];
				}
			}
			if (count($noms) !== count($ids)) {
				throw new InventaireException('Un emplacement n\'existe plus ou est désactivé. Rechargez le plan.', 'positions');
			}
			$avant = array();
			foreach ($this->lignes('SELECT emplacement_id, x, y, largeur, hauteur FROM plan_emplacements WHERE emplacement_id IN (' . self::marques($ids) . ') FOR UPDATE', $ids) as $r) {
				if ($r['x'] === null) {
					continue;           // ligne qui ne porte que les rayonnages : pas de place enregistrée
				}
				$avant[(int) $r['emplacement_id']] = array('x' => (int) $r['x'], 'y' => (int) $r['y'], 'largeur' => (int) $r['largeur'], 'hauteur' => (int) $r['hauteur']);
			}
			$ecrit = $this->pdo->prepare(
				'INSERT INTO plan_emplacements (emplacement_id, x, y, largeur, hauteur, modifie_par) VALUES (?, ?, ?, ?, ?, ?)
				 ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), largeur = VALUES(largeur), hauteur = VALUES(hauteur), modifie_par = VALUES(modifie_par)'
			);
			$changes = array();
			foreach ($voulu as $id => $n) {
				if (isset($avant[$id]) && $avant[$id] === $n) {
					continue;
				}
				$ecrit->execute(array($id, $n['x'], $n['y'], $n['largeur'], $n['hauteur'], (int) $userId));
				$changes[] = $noms[$id];
			}
			if ($changes) {
				$liste = implode(', ', array_slice($changes, 0, 15)) . (count($changes) > 15 ? ', …' : '');
				Journal::ecrire($this->pdo, (int) $userId, 'plan.disposition', 'plan', null, array('nb_emplacements' => count($changes), 'emplacements' => $liste));
			}
			return array('modifies' => count($changes));
		});
	}

	// ======================================================================
	//  Rangements : enregistrement (gestionnaire+) et rayonnages (administrateur)
	// ======================================================================

	const REFUS_EMPLACEMENT = 'Cet emplacement n\'existe pas ou vous n\'y avez pas accès.';

	/**
	 * L'emplacement ACTIF d'une entreprise où l'utilisateur peut écrire (ligne verrouillée pour la transaction en cours). Refus identique que l'emplacement
	 * n'existe pas, soit désactivé, d'une autre entreprise ou d'une entreprise désactivée : on ne révèle rien.
	 * @return array{id:string,nom:string,type:string,entreprise_id:string,rayon_allees:?string,rayon_etageres:?string,rayon_niveaux:?string}
	 */
	private function emplacementEcriture(array $u, $emplacementId)
	{
		$e = $u['entreprises'] ? $this->lignes(
			'SELECT id, nom, type, entreprise_id FROM emplacements
			  WHERE id = ? AND actif = 1 AND entreprise_id IN (' . self::marques($u['entreprises']) . ') FOR UPDATE',
			array_merge(array((int) $emplacementId), array_map('intval', $u['entreprises']))
		) : array();
		if (!$e) {
			throw new PlanRefus(self::REFUS_EMPLACEMENT);
		}
		// les rayonnages sont lus après le verrou de l'emplacement (tous les écrivains le prennent d'abord) : on voit toujours le dernier état
		$g = $this->lignes('SELECT rayon_allees, rayon_etageres, rayon_niveaux FROM plan_emplacements WHERE emplacement_id = ?', array((int) $emplacementId));
		return $e[0] + ($g ? $g[0] : array('rayon_allees' => null, 'rayon_etageres' => null, 'rayon_niveaux' => null));
	}

	/** Identifiant strictement positif envoyé par le navigateur ; 400 sinon. */
	private static function identifiant($v, $libelle, $champ)
	{
		$n = self::entier($v);
		if ($n === null || $n < 1) {
			throw new InventaireException($libelle . ' invalide.', $champ);
		}
		return $n;
	}

	/**
	 * Pose, modifie ou retire la position d'une pièce dans un emplacement (gestionnaire ou administrateur ayant accès à l'entreprise de l'emplacement).
	 * Entrée : {emplacement_id, piece_id, allee, etagere, niveau} ou {emplacement_id, piece_id, retirer: true}. Entiers stricts, bornes = rayonnages de l'emplacement.
	 * Une seule position par pièce et par emplacement (elle est remplacée) ; plusieurs pièces peuvent partager la même. Pièce existante et active pour poser.
	 * Journal « plan.rangement » (rien si rien ne change). @return array{rangement:?array{allee:int,etagere:int,niveau:int}}
	 */
	public function enregistrerRangement($userId, $d)
	{
		$u = $this->exigerRole($userId, 'gestionnaire');
		$d = is_array($d) ? $d : array();
		$eid = self::identifiant(isset($d['emplacement_id']) ? $d['emplacement_id'] : null, 'Emplacement', 'emplacement_id');
		$pid = self::identifiant(isset($d['piece_id']) ? $d['piece_id'] : null, 'Pièce', 'piece_id');
		$retirer = isset($d['retirer']) && ($d['retirer'] === true || $d['retirer'] === 1 || $d['retirer'] === '1');
		$voulu = null;
		if (!$retirer) {
			$voulu = array();
			foreach (array('allee', 'etagere', 'niveau') as $k) {
				$v = isset($d[$k]) ? self::entier($d[$k]) : null;
				if ($v === null) {
					throw new InventaireException('Choisissez l\'allée, l\'étagère et le niveau.', $k);
				}
				$voulu[$k] = $v;
			}
		}

		return $this->inv->transaction(function () use ($u, $userId, $eid, $pid, $retirer, $voulu) {
			$e = $this->emplacementEcriture($u, $eid);
			$p = $this->lignes('SELECT id, code, actif FROM pieces WHERE id = ?', array($pid));
			if (!$p) {
				throw new InventaireException('Pièce introuvable.', 'piece_id');
			}
			$type = $e['type'];
			$avant = $this->lignes('SELECT allee, etagere, niveau FROM rangements WHERE emplacement_id = ? AND piece_id = ? FOR UPDATE', array($eid, $pid));
			$avant = $avant ? self::position($avant[0]) : null;
			$texteAvant = $avant ? self::libellePosition($avant, $type) : '(aucun)';

			if ($retirer) {
				if ($avant) {
					$st = $this->pdo->prepare('DELETE FROM rangements WHERE emplacement_id = ? AND piece_id = ?');
					$st->execute(array($eid, $pid));
					Journal::ecrire($this->pdo, (int) $userId, 'plan.rangement', 'emplacements', $eid, array('piece_id' => $pid, 'avant' => $texteAvant, 'apres' => '(aucun)'));
				}
				return array('rangement' => null);
			}

			if (!$p[0]['actif']) {
				throw new InventaireException('Cette pièce est désactivée : on ne peut plus la ranger.', 'piece_id');
			}
			$geo = self::geometrie($type, $e['rayon_allees'], $e['rayon_etageres'], $e['rayon_niveaux']);
			if ($voulu['allee'] < 1 || $voulu['allee'] > $geo['allees']) {
				throw new InventaireException($type === 'cube'
					? 'Côté invalide : choisissez le côté gauche' . ($geo['allees'] > 1 ? ' ou le côté droit' : '') . '.'
					: 'Allée invalide : choisissez de A à ' . self::libelleAllee($geo['allees'], $type) . '.', 'allee');
			}
			if ($voulu['etagere'] < 1 || $voulu['etagere'] > $geo['etageres']) {
				throw new InventaireException('Étagère invalide : choisissez de 1 à ' . $geo['etageres'] . '.', 'etagere');
			}
			if ($voulu['niveau'] < 1 || $voulu['niveau'] > $geo['niveaux']) {
				throw new InventaireException('Niveau invalide : choisissez de 1 à ' . $geo['niveaux'] . '.', 'niveau');
			}
			if ($avant !== $voulu) {
				$st = $this->pdo->prepare(
					'INSERT INTO rangements (emplacement_id, piece_id, allee, etagere, niveau, modifie_par) VALUES (?, ?, ?, ?, ?, ?)
					 ON DUPLICATE KEY UPDATE allee = VALUES(allee), etagere = VALUES(etagere), niveau = VALUES(niveau), modifie_par = VALUES(modifie_par)'
				);
				$st->execute(array($eid, $pid, $voulu['allee'], $voulu['etagere'], $voulu['niveau'], (int) $userId));
				Journal::ecrire($this->pdo, (int) $userId, 'plan.rangement', 'emplacements', $eid, array('piece_id' => $pid, 'avant' => $texteAvant, 'apres' => self::libellePosition($voulu, $type)));
			}
			return array('rangement' => $voulu);
		});
	}

	/**
	 * Range automatiquement les pièces ACTIVES qui ont du stock dans l'emplacement mais pas de position : dans l'ordre de leurs codes, les positions libres
	 * se remplissent dans l'ordre allée, étagère, niveau, au plus PAR_POSITION pièces par position (les pièces déjà rangées comptent, même à stock zéro : leur place leur est gardée).
	 * Si toutes les positions sont pleines, les pièces restantes restent « à ranger ». Déterministe. Gestionnaire+ ayant accès à l'entreprise.
	 * Journal « plan.rangement_auto » (rien si rien n'est rangé). @return array{nb:int,restantes:int}
	 */
	public function rangerAuto($userId, $emplacementId)
	{
		$u = $this->exigerRole($userId, 'gestionnaire');
		$eid = self::identifiant($emplacementId, 'Emplacement', 'emplacement_id');

		return $this->inv->transaction(function () use ($u, $userId, $eid) {
			$e = $this->emplacementEcriture($u, $eid);
			$geo = self::geometrie($e['type'], $e['rayon_allees'], $e['rayon_etageres'], $e['rayon_niveaux']);
			$rangements = $this->rangementsDe($eid, $geo);
			$aRanger = $this->piecesARanger($eid, $rangements);
			$pris = array();
			foreach ($rangements as $pos) {
				$k = $pos['allee'] . '-' . $pos['etagere'] . '-' . $pos['niveau'];
				$pris[$k] = isset($pris[$k]) ? $pris[$k] + 1 : 1;
			}
			$st = $this->pdo->prepare(
				'INSERT INTO rangements (emplacement_id, piece_id, allee, etagere, niveau, modifie_par) VALUES (?, ?, ?, ?, ?, ?)
				 ON DUPLICATE KEY UPDATE allee = VALUES(allee), etagere = VALUES(etagere), niveau = VALUES(niveau), modifie_par = VALUES(modifie_par)'
			);
			$nb = 0;
			$total = count($aRanger);
			for ($a = 1; $a <= $geo['allees'] && $nb < $total; $a++) {
				for ($t = 1; $t <= $geo['etageres'] && $nb < $total; $t++) {
					for ($n = 1; $n <= $geo['niveaux'] && $nb < $total; $n++) {
						$k = $a . '-' . $t . '-' . $n;
						for ($libre = self::PAR_POSITION - (isset($pris[$k]) ? $pris[$k] : 0); $libre > 0 && $nb < $total; $libre--) {
							$st->execute(array($eid, $aRanger[$nb], $a, $t, $n, (int) $userId));
							$nb++;
						}
					}
				}
			}
			if ($nb > 0) {
				Journal::ecrire($this->pdo, (int) $userId, 'plan.rangement_auto', 'emplacements', $eid, array('nb_pieces' => $nb, 'restantes' => $total - $nb));
			}
			return array('nb' => $nb, 'restantes' => $total - $nb);
		});
	}

	/**
	 * Règle les rayonnages d'un emplacement (administrateur seulement) : {emplacement_id, allees, etageres, niveaux} ou {emplacement_id, defaut: true}
	 * (retour aux valeurs du type). Entiers dans les bornes (GEOMETRIE_MAX ; un cube : 2 allées au plus). Les pièces rangées au-delà des nouvelles
	 * dimensions redeviennent « à ranger » (leur position est retirée ; le stock, lui, ne change jamais). Journal « plan.geometrie ».
	 * @return array{geometrie:array,personnalisee:bool,retires:int}
	 */
	public function enregistrerGeometrie($userId, $d)
	{
		$u = $this->exigerRole($userId, 'admin');
		$d = is_array($d) ? $d : array();
		$eid = self::identifiant(isset($d['emplacement_id']) ? $d['emplacement_id'] : null, 'Emplacement', 'emplacement_id');
		$defaut = isset($d['defaut']) && ($d['defaut'] === true || $d['defaut'] === 1 || $d['defaut'] === '1');
		$voulu = array();
		if (!$defaut) {
			foreach (array('allees', 'etageres', 'niveaux') as $k) {
				$v = isset($d[$k]) ? self::entier($d[$k]) : null;
				if ($v === null) {
					throw new InventaireException('Indiquez le nombre d\'allées, d\'étagères et de niveaux (des nombres entiers).', $k);
				}
				$voulu[$k] = $v;
			}
		}

		return $this->inv->transaction(function () use ($u, $userId, $eid, $defaut, $voulu) {
			$e = $this->emplacementEcriture($u, $eid);
			$type = $e['type'];
			$def = self::geometrieDefaut($type);
			$max = self::geometrieLimites($type);
			if ($defaut) {
				$voulu = $def;
			} else {
				foreach (array('allees' => 'Allées', 'etageres' => 'Étagères', 'niveaux' => 'Niveaux') as $k => $lib) {
					if ($voulu[$k] < 1 || $voulu[$k] > $max[$k]) {
						throw new InventaireException($lib . ' : choisissez de 1 à ' . $max[$k] . '.', $k);
					}
				}
			}
			$avant = self::geometrie($type, $e['rayon_allees'], $e['rayon_etageres'], $e['rayon_niveaux']);
			$personnalisee = $voulu !== $def;
			$stockeAvant = array($e['rayon_allees'] === null ? null : (int) $e['rayon_allees'], $e['rayon_etageres'] === null ? null : (int) $e['rayon_etageres'], $e['rayon_niveaux'] === null ? null : (int) $e['rayon_niveaux']);
			$stockeApres = $personnalisee ? array($voulu['allees'], $voulu['etageres'], $voulu['niveaux']) : array(null, null, null);
			$retires = 0;
			if ($stockeAvant !== $stockeApres) {
				$st = $this->pdo->prepare(
					'INSERT INTO plan_emplacements (emplacement_id, rayon_allees, rayon_etageres, rayon_niveaux, modifie_par) VALUES (?, ?, ?, ?, ?)
					 ON DUPLICATE KEY UPDATE rayon_allees = VALUES(rayon_allees), rayon_etageres = VALUES(rayon_etageres), rayon_niveaux = VALUES(rayon_niveaux), modifie_par = VALUES(modifie_par)'
				);
				$st->execute(array($eid, $stockeApres[0], $stockeApres[1], $stockeApres[2], (int) $userId));
				// plus aucune place ni dimension particulière : la ligne ne sert plus à rien
				$st = $this->pdo->prepare('DELETE FROM plan_emplacements WHERE emplacement_id = ? AND x IS NULL AND rayon_allees IS NULL AND rayon_etageres IS NULL AND rayon_niveaux IS NULL');
				$st->execute(array($eid));
				// les pièces rangées au-delà des nouvelles dimensions redeviennent « à ranger »
				$st = $this->pdo->prepare('DELETE FROM rangements WHERE emplacement_id = ? AND (allee > ? OR etagere > ? OR niveau > ?)');
				$st->execute(array($eid, $voulu['allees'], $voulu['etageres'], $voulu['niveaux']));
				$retires = $st->rowCount();
				Journal::ecrire($this->pdo, (int) $userId, 'plan.geometrie', 'emplacements', $eid, array(
					'avant' => self::libelleGeometrie($avant, $type), 'apres' => self::libelleGeometrie($voulu, $type), 'retirees' => $retires,
				));
			}
			return array('geometrie' => $voulu, 'personnalisee' => $personnalisee, 'retires' => $retires);
		});
	}
}
