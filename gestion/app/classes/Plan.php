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
	//  Droits
	// ======================================================================

	/** Utilisateur actif, rôle employé+ : @return array{uid:int,role:string,entreprises:int[]} (entreprises = consultables). */
	private function contexte($userId)
	{
		$u = $this->inv->exiger($userId, 'consulter');
		return array('uid' => (int) $userId, 'role' => $u['role'], 'entreprises' => array_values(array_map('intval', $u['consultables'])));
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
	 * d'emplacements et de leur disposition. Coût : proportionnel au nombre d'emplacements (quelques dizaines), pas aux mouvements.
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
			        COALESCE(BIT_XOR(CRC32(CONCAT_WS('|', t.id, t.nom, t.type, t.actif, t.code_barres, t.entreprise_id, t.en_code, t.en_nom, t.px, t.py, t.pl, t.ph))), 0) AS sig
			   FROM (SELECT e.id, e.nom, e.type, e.actif, e.code_barres, e.entreprise_id, en.code AS en_code, en.nom AS en_nom,
			                pe.x AS px, pe.y AS py, pe.largeur AS pl, pe.hauteur AS ph,
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
		return array(
			'version' => $version,
			'admin' => $ctx['role'] === 'admin',
			'zone' => self::zone(),
			'tuiles' => $this->tuiles($ctx['entreprises']),
			'recherche' => $pieceId === null ? null : $this->recherche($ctx['entreprises'], (int) $pieceId),
		);
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

	/** Où est cette pièce : quantité dans chaque emplacement actif de mes entreprises, et la somme. */
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
				'SELECT s.emplacement_id, s.quantite
				   FROM stock s JOIN emplacements e ON e.id = s.emplacement_id
				  WHERE s.piece_id = ? AND s.quantite > 0 AND e.actif = 1 AND e.entreprise_id IN (' . self::marques($ents) . ')
				  ORDER BY s.emplacement_id',
				array_merge(array($pieceId), $ents)
			) as $s) {
				$par[] = array('emplacement_id' => (int) $s['emplacement_id'], 'quantite' => $s['quantite']);
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
	 * @return array{emplacement:array,nb_pieces:int,unites:string,lignes:array[],tronque:bool}
	 */
	public function contenu($userId, $emplacementId, $q = '')
	{
		$ctx = $this->contexte($userId);
		$e = $ctx['entreprises'] ? $this->lignes(
			'SELECT e.id, e.nom, e.type, e.code_barres, e.entreprise_id, en.code AS entreprise_code, en.nom AS entreprise_nom
			   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
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
		$lignes = array();
		foreach ($rows as $r) {
			$lignes[] = array(
				'piece_id' => (int) $r['piece_id'], 'code' => $r['code'], 'nom' => $r['nom'], 'unite' => $r['unite'],
				'actif' => (bool) $r['actif'], 'quantite' => $r['quantite'], 'bas' => (bool) $r['bas'],
			);
		}
		return array(
			'emplacement' => array(
				'id' => $eid, 'nom' => $e['nom'], 'code' => $e['code_barres'], 'type' => $e['type'],
				'type_libelle' => isset(TYPES_EMPLACEMENT_FR[$e['type']]) ? TYPES_EMPLACEMENT_FR[$e['type']] : $e['type'],
				'entreprise_id' => $ent, 'entreprise_code' => $e['entreprise_code'], 'entreprise_nom' => $e['entreprise_nom'],
			),
			'nb_pieces' => (int) $resume[0]['nb'],
			'unites' => Dec::fmt(Dec::parse($resume[0]['unites'], Dec::QTE), Dec::QTE),
			'lignes' => $lignes,
			'tronque' => $tronque,
		);
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
}
