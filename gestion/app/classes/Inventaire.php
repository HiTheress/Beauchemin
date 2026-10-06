<?php
/**
 * Service d'inventaire : TOUTE modification du stock passe par cette classe.
 *
 * Garanties
 *  - chaque opération est une transaction (tout ou rien) ;
 *  - le stock d'un emplacement ne devient jamais négatif ;
 *  - chaque variation de stock laisse une ligne dans `mouvements` (registre, jamais modifié) ;
 *  - le coût moyen pondéré est tenu par (entreprise, pièce) dans `stock_couts` ;
 *  - les droits (rôle + entreprises accessibles) sont revérifiés ici, pas seulement dans les pages.
 *
 * Protocole de verrous (évite les interblocages) : toute opération traite les pièces par id croissant ;
 * pour chaque pièce, elle verrouille d'abord les lignes `stock_couts` (entreprises par id croissant),
 * puis lit/écrit les lignes `stock`. Une ligne `stock` n'est donc jamais modifiée sans tenir le verrou
 * de coût de son entreprise.
 *
 * Toutes les quantités/coûts entrent et sortent en chaînes décimales exactes ("12.500") ; les calculs
 * internes se font en entiers (voir Dec).
 */
class Inventaire
{
	const RANG = array('employe' => 1, 'gestionnaire' => 2, 'admin' => 3);

	/** Rôle minimum par opération. Un seul endroit à modifier pour changer les droits. */
	const ROLE_MIN = array(
		'consulter'          => 'employe',
		'voir_couts'         => 'gestionnaire',
		'reception'          => 'gestionnaire',
		'transfert'          => 'employe',
		'sortie'             => 'employe',
		'ajustement'         => 'gestionnaire',
		'facture_interne'    => 'gestionnaire',
		'annulation'         => 'gestionnaire',
		'comptage'           => 'employe',
		'comptage_appliquer' => 'gestionnaire',
		'catalogue'          => 'gestionnaire',
		'rapport'            => 'gestionnaire',
		'administration'     => 'admin',
	);

	const MAX_LIGNES = 300;
	const MAX_QTE_LIGNE = 100000;      // unités, par ligne
	const MAX_QTE_TOTALE = 1000000;    // unités d'une même pièce, par entreprise
	const MAX_COUT = 100000;           // $ par unité

	const PREFIXES = array(
		'reception' => 'REC', 'transfert' => 'TRF', 'sortie' => 'SOR',
		'ajustement' => 'AJU', 'facture_interne' => 'FIN',
	);

	const MOTIFS_SORTIE = array(
		'service' => 'Service / réparation',
		'installation' => 'Installation',
		'perte' => 'Perte / bris',
		'retour_fournisseur' => 'Retour au fournisseur',
		'autre' => 'Autre',
	);

	const MOTIFS_AJUSTEMENT = array(
		'comptage' => 'Comptage d\'inventaire',
		'correction' => 'Correction',
		'bris' => 'Bris / perte',
		'autre' => 'Autre',
	);

	/** @var PDO */
	private $pdo;

	public function __construct(PDO $pdo)
	{
		$this->pdo = $pdo;
	}

	// ======================================================================
	//  Droits
	// ======================================================================

	/** @return array{id:int,role:string,entreprises:int[],consultables:int[]} */
	public function utilisateur($userId)
	{
		$st = $this->pdo->prepare('SELECT id, role, actif FROM utilisateurs WHERE id = ?');
		$st->execute(array((int) $userId));
		$u = $st->fetch(PDO::FETCH_ASSOC);
		if (!$u || !$u['actif']) {
			throw new InventaireException('Utilisateur introuvable ou désactivé.');
		}
		// Entreprises « consultables » : celles de l'utilisateur, ACTIVES OU NON (un document ou un mouvement d'une entreprise
		// désactivée reste dans l'historique ; seules les écritures exigent une entreprise active).
		if ($u['role'] === 'admin') {
			$cons = $this->pdo->query('SELECT id FROM entreprises')->fetchAll(PDO::FETCH_COLUMN);
		} else {
			$sc = $this->pdo->prepare('SELECT entreprise_id FROM utilisateur_entreprises WHERE utilisateur_id = ?');
			$sc->execute(array((int) $userId));
			$cons = $sc->fetchAll(PDO::FETCH_COLUMN);
		}
		if ($u['role'] === 'admin') {
			$ids = $this->pdo->query('SELECT id FROM entreprises WHERE actif = 1')->fetchAll(PDO::FETCH_COLUMN);
		} else {
			$st = $this->pdo->prepare('SELECT ue.entreprise_id FROM utilisateur_entreprises ue JOIN entreprises e ON e.id = ue.entreprise_id WHERE ue.utilisateur_id = ? AND e.actif = 1');
			$st->execute(array((int) $userId));
			$ids = $st->fetchAll(PDO::FETCH_COLUMN);
		}
		return array('id' => (int) $u['id'], 'role' => $u['role'], 'entreprises' => array_map('intval', $ids), 'consultables' => array_map('intval', $cons));
	}

	/**
	 * Vérifie le rôle minimum de l'opération et l'accès aux entreprises.
	 * $mode 'toutes' : accès à chacune ; 'une' : accès à au moins une.
	 */
	public function exiger($userId, $operation, array $entrepriseIds = array(), $mode = 'toutes')
	{
		$u = $this->utilisateur($userId);
		$min = self::ROLE_MIN[$operation];
		if (self::RANG[$u['role']] < self::RANG[$min]) {
			throw new InventaireException("Vous n'avez pas la permission d'effectuer cette opération.");
		}
		$entrepriseIds = array_values(array_unique(array_map('intval', $entrepriseIds)));
		if ($entrepriseIds) {
			$lecture = in_array($operation, array('consulter', 'rapport', 'voir_couts'), true);
			$ok = array_intersect($entrepriseIds, $lecture ? $u['consultables'] : $u['entreprises']);
			$bon = ($mode === 'une') ? count($ok) > 0 : count($ok) === count($entrepriseIds);
			if (!$bon) {
				throw new InventaireException("Vous n'avez pas accès à cette entreprise.");
			}
		}
		return $u;
	}

	public function peutVoirCouts($userId)
	{
		$u = $this->utilisateur($userId);
		return self::RANG[$u['role']] >= self::RANG[self::ROLE_MIN['voir_couts']];
	}

	// ======================================================================
	//  Outils internes
	// ======================================================================

	/** Exécute $fn dans une transaction ; réessaie en cas d'interblocage. */
	public function transaction($fn)
	{
		if ($this->pdo->inTransaction()) {
			return $fn();
		}
		for ($essai = 1;; $essai++) {
			$this->pdo->beginTransaction();
			try {
				$r = $fn();
				$this->pdo->commit();
				return $r;
			} catch (Throwable $e) {
				if ($this->pdo->inTransaction()) {
					$this->pdo->rollBack();
				}
				$code = ($e instanceof PDOException && isset($e->errorInfo[1])) ? (int) $e->errorInfo[1] : 0;
				if (($code === 1213 || $code === 1205) && $essai < 4) {
					usleep(50000 * $essai);
					continue;
				}
				throw $e;
			}
		}
	}

	private function un($sql, array $params = array())
	{
		$st = $this->pdo->prepare($sql);
		$st->execute($params);
		return $st->fetch(PDO::FETCH_ASSOC);
	}

	private function tous($sql, array $params = array())
	{
		$st = $this->pdo->prepare($sql);
		$st->execute($params);
		return $st->fetchAll(PDO::FETCH_ASSOC);
	}

	private function exec($sql, array $params = array())
	{
		$st = $this->pdo->prepare($sql);
		$st->execute($params);
		return $st->rowCount();
	}

	private function dateDocument($v)
	{
		$aujourdhui = date('Y-m-d');
		if ($v === null || $v === '') {
			return $aujourdhui;
		}
		if (!is_string($v) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
			throw new InventaireException('Date invalide.', 'date');
		}
		if ($v > $aujourdhui) {
			throw new InventaireException('La date ne peut pas être dans le futur.', 'date');
		}
		if ($v < '2000-01-01') {
			throw new InventaireException('Date trop ancienne.', 'date');
		}
		return $v;
	}

	private function numero($prefixe, $annee)
	{
		$this->exec(
			'INSERT INTO sequences (type, annee, dernier) VALUES (?, ?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE dernier = LAST_INSERT_ID(dernier + 1)',
			array($prefixe, (int) $annee)
		);
		return sprintf('%s-%d-%05d', $prefixe, $annee, (int) $this->pdo->lastInsertId());
	}

	private function emplacement($id, $actifSeulement = true)
	{
		$e = $this->un(
			'SELECT e.id, e.nom, e.type, e.entreprise_id, e.actif, en.nom AS entreprise_nom, en.actif AS entreprise_actif
			   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id WHERE e.id = ?',
			array((int) $id)
		);
		if (!$e) {
			throw new InventaireException('Emplacement introuvable.', 'emplacement_id');
		}
		if ($actifSeulement && (!$e['actif'] || !$e['entreprise_actif'])) {
			throw new InventaireException('L\'emplacement « ' . $e['nom'] . ' » est désactivé.', 'emplacement_id');
		}
		return $e;
	}

	/**
	 * Emplacement SOURCE d'une opération : l'utilisateur doit avoir accès à son entreprise, sinon l'emplacement
	 * est présenté comme introuvable (on ne révèle ni son nom ni son état à qui n'y a pas droit).
	 */
	private function emplacementAccessible($userId, $id, $actifSeulement = true)
	{
		$e = $this->un('SELECT entreprise_id FROM emplacements WHERE id = ?', array((int) $id));
		if ($e) {
			$u = $this->utilisateur($userId);
			if (!in_array((int) $e['entreprise_id'], $u['entreprises'], true)) {
				throw new InventaireException('Emplacement introuvable.', 'emplacement_id');
			}
		}
		return $this->emplacement($id, $actifSeulement);
	}

	/** Lignes brutes -> lignes normalisées [piece_id, qte (milli), cout (1/10000)|null], validées. */
	private function lignes($brut, $signe, $cout)
	{
		if (!is_array($brut) || !$brut) {
			throw new InventaireException('Ajoutez au moins une pièce.', 'lignes');
		}
		if (count($brut) > self::MAX_LIGNES) {
			throw new InventaireException('Trop de lignes (maximum ' . self::MAX_LIGNES . ').', 'lignes');
		}
		$out = array();
		foreach (array_values($brut) as $i => $l) {
			$n = $i + 1;
			if (!is_array($l)) {
				throw new InventaireException("Ligne $n invalide.", 'lignes');
			}
			$pid = isset($l['piece_id']) ? (int) $l['piece_id'] : 0;
			if ($pid <= 0) {
				throw new InventaireException("Ligne $n : pièce manquante.", 'lignes');
			}
			$q = Dec::parse(isset($l['quantite']) ? $l['quantite'] : '', Dec::QTE, 'lignes');
			if ($signe === 'positif' && $q <= 0) {
				throw new InventaireException("Ligne $n : la quantité doit être supérieure à zéro.", 'lignes');
			}
			if ($signe === 'signe' && $q === 0) {
				throw new InventaireException("Ligne $n : la variation ne peut pas être zéro.", 'lignes');
			}
			if (abs($q) > self::MAX_QTE_LIGNE * 1000) {
				throw new InventaireException("Ligne $n : quantité trop grande.", 'lignes');
			}
			$c = null;
			if ($cout !== 'aucun' && isset($l['cout_unitaire']) && $l['cout_unitaire'] !== '' && $l['cout_unitaire'] !== null) {
				$c = Dec::parse($l['cout_unitaire'], Dec::COUT, 'lignes');
				if ($c < 0 || $c > self::MAX_COUT * 10000) {
					throw new InventaireException("Ligne $n : coût invalide.", 'lignes');
				}
			}
			if ($cout === 'requis' && $c === null) {
				throw new InventaireException("Ligne $n : le coût unitaire est requis.", 'lignes');
			}
			$out[] = array('piece_id' => $pid, 'qte' => $q, 'cout' => $c);
		}
		return $out;
	}

	/** Additionne les lignes d'une même pièce (transfert, sortie, facture interne). */
	private function fusionner(array $lignes)
	{
		$par = array();
		foreach ($lignes as $l) {
			if (!isset($par[$l['piece_id']])) {
				$par[$l['piece_id']] = $l;
			} else {
				$par[$l['piece_id']]['qte'] += $l['qte'];
			}
		}
		ksort($par);
		foreach ($par as $l) {
			if (abs($l['qte']) > self::MAX_QTE_LIGNE * 1000) {
				throw new InventaireException('Quantité trop grande pour une pièce.', 'lignes');
			}
		}
		return array_values($par);
	}

	private function trierParPiece(array $lignes)
	{
		foreach ($lignes as $i => &$l) {
			$l['_i'] = $i;
		}
		unset($l);
		usort($lignes, function ($a, $b) {
			return ($a['piece_id'] <=> $b['piece_id']) ?: ($a['_i'] <=> $b['_i']);
		});
		return $lignes;
	}

	/** Vérifie que toutes les pièces existent (et sont actives sauf $inactifOk) ; retourne [id => ligne]. */
	private function pieces(array $lignes, $inactifOk = false)
	{
		$ids = array_values(array_unique(array_column($lignes, 'piece_id')));
		$in = implode(',', array_fill(0, count($ids), '?'));
		$rows = $this->tous("SELECT id, code, nom, unite, actif FROM pieces WHERE id IN ($in)", $ids);
		$map = array();
		foreach ($rows as $r) {
			$map[(int) $r['id']] = $r;
		}
		foreach ($ids as $id) {
			if (!isset($map[$id])) {
				throw new InventaireException('Une des pièces est introuvable.', 'lignes');
			}
			if (!$inactifOk && !$map[$id]['actif']) {
				throw new InventaireException('La pièce « ' . $map[$id]['code'] . ' » est désactivée.', 'lignes');
			}
		}
		return $map;
	}

	private function libelle($pieceId)
	{
		$p = $this->un('SELECT code, nom FROM pieces WHERE id = ?', array($pieceId));
		return $p ? $p['code'] . ' — ' . $p['nom'] : '#' . $pieceId;
	}

	// ---- primitives de stock (à appeler dans une transaction) -----------------

	private function verrouillerPiece(array $entrepriseIds, $pieceId)
	{
		$entrepriseIds = array_values(array_unique(array_map('intval', $entrepriseIds)));
		sort($entrepriseIds);
		foreach ($entrepriseIds as $eid) {
			$this->exec('INSERT IGNORE INTO stock_couts (entreprise_id, piece_id, cout_moyen) VALUES (?, ?, 0)', array($eid, $pieceId));
			$this->un('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ? FOR UPDATE', array($eid, $pieceId));
		}
	}

	private function lireCout($eid, $pid)
	{
		$r = $this->un('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ?', array($eid, $pid));
		return $r ? Dec::parse($r['cout_moyen'], Dec::COUT) : 0;
	}

	private function quantiteEntreprise($eid, $pid)
	{
		$r = $this->un(
			'SELECT COALESCE(SUM(s.quantite), 0) AS q FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE e.entreprise_id = ? AND s.piece_id = ?',
			array($eid, $pid)
		);
		return Dec::parse($r['q'], Dec::QTE);
	}

	/**
	 * Varie le stock d'une pièce à un emplacement et écrit le mouvement.
	 * $mode : 'entree' (entrée valorisée à $c, fusionnée dans le coût moyen)
	 *         'entree_moy' (entrée au coût moyen courant, sans le changer)
	 *         'sortie_moy' (sortie au coût moyen courant)
	 *         'sortie_cout' (sortie valorisée à $c ; le coût moyen est recalculé : annulation d'une entrée)
	 * Retourne le coût unitaire (éch. 4) enregistré sur le mouvement.
	 */
	private function bouger($docId, $eid, $pid, $emp, $qte, $mode, $c, $annulation, $userId)
	{
		$this->verrouillerPiece(array($eid), $pid);
		$avg = $this->lireCout($eid, $pid);
		$this->exec('INSERT IGNORE INTO stock (piece_id, emplacement_id, quantite) VALUES (?, ?, 0)', array($pid, $emp));
		$row = $this->un('SELECT quantite FROM stock WHERE piece_id = ? AND emplacement_id = ? FOR UPDATE', array($pid, $emp));
		$cur = Dec::parse($row['quantite'], Dec::QTE);
		$new = $cur + $qte;
		if ($new < 0) {
			$e = $this->un('SELECT nom FROM emplacements WHERE id = ?', array($emp));
			throw new InventaireException(sprintf(
				'Stock insuffisant pour « %s » à %s : disponible %s, demandé %s.',
				$this->libelle($pid), $e ? '« ' . $e['nom'] . ' »' : 'cet emplacement',
				self::nombre(Dec::fmt($cur, Dec::QTE)), self::nombre(Dec::fmt(-$qte, Dec::QTE))
			), 'lignes');
		}
		$Q = $this->quantiteEntreprise($eid, $pid);
		if ($Q + $qte > self::MAX_QTE_TOTALE * 1000) {
			throw new InventaireException('Quantité totale trop élevée pour « ' . $this->libelle($pid) . ' ».', 'lignes');
		}

		$nouvelAvg = $avg;
		switch ($mode) {
			case 'entree':
				$unit = $c;
				$nouvelAvg = Dec::coutMoyenEntree($Q, $avg, $qte, $c);
				break;
			case 'entree_moy':
			case 'sortie_moy':
				$unit = $avg;
				break;
			case 'sortie_cout':
				$unit = $c;
				$nouvelAvg = Dec::coutMoyenRetrait($Q, $avg, -$qte, $c);
				break;
			default:
				throw new LogicException('Mode inconnu : ' . $mode);
		}

		$this->exec('UPDATE stock SET quantite = ? WHERE piece_id = ? AND emplacement_id = ?', array(Dec::fmt($new, Dec::QTE), $pid, $emp));
		if ($nouvelAvg !== $avg) {
			$this->exec('UPDATE stock_couts SET cout_moyen = ? WHERE entreprise_id = ? AND piece_id = ?', array(Dec::fmt($nouvelAvg, Dec::COUT), $eid, $pid));
		}
		$this->exec(
			'INSERT INTO mouvements (document_id, date_mouvement, piece_id, emplacement_id, quantite, cout_unitaire, est_annulation, utilisateur_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			array($docId, date('Y-m-d H:i:s'), $pid, $emp, Dec::fmt($qte, Dec::QTE), Dec::fmt($unit, Dec::COUT), $annulation ? 1 : 0, $userId)
		);
		return $unit;
	}

	private function creerDocument($type, array $c, $userId)
	{
		$annee = (int) substr($c['date_document'], 0, 4);
		$numero = $this->numero(self::PREFIXES[$type], $annee);
		$this->exec(
			'INSERT INTO documents (numero, type, date_document, entreprise_id, emplacement_id, emplacement_dest_id, entreprise_dest_id,
			                        fournisseur_id, reference, motif, note, utilisateur_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			array(
				$numero, $type, $c['date_document'], $c['entreprise_id'], $c['emplacement_id'],
				isset($c['emplacement_dest_id']) ? $c['emplacement_dest_id'] : null,
				isset($c['entreprise_dest_id']) ? $c['entreprise_dest_id'] : null,
				isset($c['fournisseur_id']) ? $c['fournisseur_id'] : null,
				self::texte(isset($c['reference']) ? $c['reference'] : null, 100),
				isset($c['motif']) ? $c['motif'] : null,
				self::texte(isset($c['note']) ? $c['note'] : null, 2000),
				$userId,
			)
		);
		return array((int) $this->pdo->lastInsertId(), $numero);
	}

	/** Ajoute une ligne de document ; retourne son total en cents (signé comme la quantité). */
	private function ligneDocument($docId, $pid, $qte, $cout4)
	{
		$total = Dec::totalLigne($qte, $cout4);
		$this->exec(
			'INSERT INTO document_lignes (document_id, piece_id, quantite, cout_unitaire, total_ligne) VALUES (?, ?, ?, ?, ?)',
			array($docId, $pid, Dec::fmt($qte, Dec::QTE), Dec::fmt($cout4, Dec::COUT), Dec::fmt($total, Dec::TOTAL))
		);
		return $total;
	}

	/** Résultat d'une opération : le total (valeur) n'est donné qu'à qui a le droit de voir les coûts. */
	private function resultat($userId, $docId, $numero, $cents)
	{
		$r = array('id' => $docId, 'numero' => $numero);
		if ($this->peutVoirCouts($userId)) {
			$r['total'] = Dec::fmt($cents, Dec::TOTAL);
		}
		return $r;
	}

	private function totalDocument($docId, $cents)
	{
		$this->exec('UPDATE documents SET total = ? WHERE id = ?', array(Dec::fmt($cents, Dec::TOTAL), $docId));
	}

	public static function texte($v, $max)
	{
		if ($v === null) {
			return null;
		}
		$v = trim((string) $v);
		if ($v === '') {
			return null;
		}
		return mb_substr($v, 0, $max);
	}

	/** "12.500" -> "12,5" pour les messages. */
	private static function nombre($s)
	{
		if (strpos($s, '.') !== false) {
			$s = rtrim(rtrim($s, '0'), '.');
		}
		return str_replace('.', ',', $s);
	}

	// ======================================================================
	//  Opérations
	// ======================================================================

	/**
	 * Réception de marchandise d'un fournisseur.
	 * $d : emplacement_id, fournisseur_id?, date?, reference? (no de facture fournisseur), note?,
	 *      maj_prix? (bool : met à jour la liste de prix du fournisseur), lignes[{piece_id, quantite, cout_unitaire}]
	 */
	public function recevoir($userId, array $d)
	{
		return $this->transaction(function () use ($userId, $d) {
			$emp = $this->emplacementAccessible($userId, isset($d['emplacement_id']) ? $d['emplacement_id'] : 0);
			$this->exiger($userId, 'reception', array($emp['entreprise_id']));
			$date = $this->dateDocument(isset($d['date']) ? $d['date'] : null);
			$fid = null;
			if (!empty($d['fournisseur_id'])) {
				$f = $this->un('SELECT id, actif FROM fournisseurs WHERE id = ?', array((int) $d['fournisseur_id']));
				if (!$f || !$f['actif']) {
					throw new InventaireException('Fournisseur introuvable ou désactivé.', 'fournisseur_id');
				}
				$fid = (int) $f['id'];
			}
			$lignes = $this->trierParPiece($this->lignes(isset($d['lignes']) ? $d['lignes'] : null, 'positif', 'requis'));
			$this->pieces($lignes);

			list($docId, $numero) = $this->creerDocument('reception', array(
				'date_document' => $date, 'entreprise_id' => (int) $emp['entreprise_id'], 'emplacement_id' => (int) $emp['id'],
				'fournisseur_id' => $fid, 'reference' => isset($d['reference']) ? $d['reference'] : null,
				'note' => isset($d['note']) ? $d['note'] : null,
			), $userId);

			$total = 0;
			foreach ($lignes as $l) {
				$this->bouger($docId, (int) $emp['entreprise_id'], $l['piece_id'], (int) $emp['id'], $l['qte'], 'entree', $l['cout'], false, $userId);
				$total += $this->ligneDocument($docId, $l['piece_id'], $l['qte'], $l['cout']);
				if ($fid && !empty($d['maj_prix'])) {
					$this->definirPrixInterne($userId, $l['piece_id'], $fid, $l['cout'], null, $date, 'Réception ' . $numero, $docId);
				}
			}
			$this->totalDocument($docId, $total);
			return $this->resultat($userId, $docId, $numero, $total);
		});
	}

	/**
	 * Transfert entre deux emplacements d'une même entreprise (entrepôt -> cube, etc.).
	 * $d : emplacement_id (source), emplacement_dest_id, date?, note?, lignes[{piece_id, quantite}]
	 */
	public function transferer($userId, array $d)
	{
		return $this->transaction(function () use ($userId, $d) {
			$src = $this->emplacementAccessible($userId, isset($d['emplacement_id']) ? $d['emplacement_id'] : 0);
			$dst = $this->emplacement(isset($d['emplacement_dest_id']) ? $d['emplacement_dest_id'] : 0, false);
			if ((int) $src['entreprise_id'] !== (int) $dst['entreprise_id']) {
				throw new InventaireException('Pour passer d\'une entreprise à l\'autre, utilisez une facture interne.', 'emplacement_dest_id');
			}
			if (!$dst['actif']) {
				throw new InventaireException('L\'emplacement « ' . $dst['nom'] . ' » est désactivé.', 'emplacement_dest_id');
			}
			if ((int) $src['id'] === (int) $dst['id']) {
				throw new InventaireException('La source et la destination doivent être différentes.', 'emplacement_dest_id');
			}
			if ((int) $src['entreprise_id'] !== (int) $dst['entreprise_id']) {
				throw new InventaireException('Pour passer d\'une entreprise à l\'autre, utilisez une facture interne.', 'emplacement_dest_id');
			}
			$eid = (int) $src['entreprise_id'];
			$this->exiger($userId, 'transfert', array($eid));
			$date = $this->dateDocument(isset($d['date']) ? $d['date'] : null);
			$lignes = $this->fusionner($this->lignes(isset($d['lignes']) ? $d['lignes'] : null, 'positif', 'aucun'));
			$this->pieces($lignes, true);   // une pièce désactivée garde son stock : on doit pouvoir le déplacer

			list($docId, $numero) = $this->creerDocument('transfert', array(
				'date_document' => $date, 'entreprise_id' => $eid, 'emplacement_id' => (int) $src['id'],
				'emplacement_dest_id' => (int) $dst['id'], 'note' => isset($d['note']) ? $d['note'] : null,
			), $userId);

			$total = 0;
			foreach ($lignes as $l) {
				$c = $this->bouger($docId, $eid, $l['piece_id'], (int) $src['id'], -$l['qte'], 'sortie_moy', null, false, $userId);
				$this->bouger($docId, $eid, $l['piece_id'], (int) $dst['id'], $l['qte'], 'entree_moy', null, false, $userId);
				$total += $this->ligneDocument($docId, $l['piece_id'], $l['qte'], $c);
			}
			$this->totalDocument($docId, $total);
			return $this->resultat($userId, $docId, $numero, $total);
		});
	}

	/**
	 * Sortie de stock : pièces utilisées (service, installation), perdues ou retournées.
	 * $d : emplacement_id, motif (clé de MOTIFS_SORTIE), reference? (no de bon de travail), date?, note?, lignes[{piece_id, quantite}]
	 */
	public function sortir($userId, array $d)
	{
		return $this->transaction(function () use ($userId, $d) {
			$emp = $this->emplacementAccessible($userId, isset($d['emplacement_id']) ? $d['emplacement_id'] : 0);
			$eid = (int) $emp['entreprise_id'];
			$this->exiger($userId, 'sortie', array($eid));
			$motif = isset($d['motif']) ? $d['motif'] : '';
			if (!isset(self::MOTIFS_SORTIE[$motif])) {
				throw new InventaireException('Choisissez un motif de sortie.', 'motif');
			}
			$date = $this->dateDocument(isset($d['date']) ? $d['date'] : null);
			$lignes = $this->fusionner($this->lignes(isset($d['lignes']) ? $d['lignes'] : null, 'positif', 'aucun'));
			$this->pieces($lignes, true);   // idem : on peut sortir (vider) une pièce désactivée

			list($docId, $numero) = $this->creerDocument('sortie', array(
				'date_document' => $date, 'entreprise_id' => $eid, 'emplacement_id' => (int) $emp['id'],
				'motif' => $motif, 'reference' => isset($d['reference']) ? $d['reference'] : null,
				'note' => isset($d['note']) ? $d['note'] : null,
			), $userId);

			$total = 0;
			foreach ($lignes as $l) {
				$c = $this->bouger($docId, $eid, $l['piece_id'], (int) $emp['id'], -$l['qte'], 'sortie_moy', null, false, $userId);
				$total += $this->ligneDocument($docId, $l['piece_id'], $l['qte'], $c);
			}
			$this->totalDocument($docId, $total);
			return $this->resultat($userId, $docId, $numero, $total);
		});
	}

	/**
	 * Ajustement manuel du solde d'un emplacement. Lignes à quantité SIGNÉE (variation).
	 * $d : emplacement_id, motif (clé de MOTIFS_AJUSTEMENT), date?, note?, lignes[{piece_id, quantite (±), cout_unitaire? (si +)}]
	 */
	public function ajuster($userId, array $d)
	{
		return $this->transaction(function () use ($userId, $d) {
			$emp = $this->emplacementAccessible($userId, isset($d['emplacement_id']) ? $d['emplacement_id'] : 0);
			$this->exiger($userId, 'ajustement', array($emp['entreprise_id']));
			return $this->ajusterInterne($userId, $emp, $d);
		});
	}

	private function ajusterInterne($userId, array $emp, array $d)
	{
		$eid = (int) $emp['entreprise_id'];
		$motif = isset($d['motif']) ? $d['motif'] : '';
		if (!isset(self::MOTIFS_AJUSTEMENT[$motif])) {
			throw new InventaireException('Choisissez un motif d\'ajustement.', 'motif');
		}
		$date = $this->dateDocument(isset($d['date']) ? $d['date'] : null);
		$lignes = $this->fusionner($this->lignes(isset($d['lignes']) ? $d['lignes'] : null, 'signe', 'optionnel'));
		$pcs = $this->pieces($lignes, true);
		foreach ($lignes as $l) {
			if ($l['qte'] > 0 && !$pcs[$l['piece_id']]['actif']) {
				throw new InventaireException('La pièce « ' . $pcs[$l['piece_id']]['code'] . ' » est désactivée : réactivez-la pour augmenter son stock (on peut seulement la diminuer).', 'lignes');
			}
		}

		list($docId, $numero) = $this->creerDocument('ajustement', array(
			'date_document' => $date, 'entreprise_id' => $eid, 'emplacement_id' => (int) $emp['id'],
			'motif' => $motif, 'note' => isset($d['note']) ? $d['note'] : null,
		), $userId);

		$total = 0;
		foreach ($lignes as $l) {
			if ($l['qte'] > 0 && $l['cout'] !== null) {
				$c = $this->bouger($docId, $eid, $l['piece_id'], (int) $emp['id'], $l['qte'], 'entree', $l['cout'], false, $userId);
			} elseif ($l['qte'] > 0) {
				$c = $this->bouger($docId, $eid, $l['piece_id'], (int) $emp['id'], $l['qte'], 'entree_moy', null, false, $userId);
			} else {
				$c = $this->bouger($docId, $eid, $l['piece_id'], (int) $emp['id'], $l['qte'], 'sortie_moy', null, false, $userId);
			}
			$total += $this->ligneDocument($docId, $l['piece_id'], $l['qte'], $c);
		}
		$this->totalDocument($docId, $total);
		return $this->resultat($userId, $docId, $numero, $total);
	}

	/**
	 * Facture interne : l'entreprise source « vend » des pièces à l'autre, AU COÛT MOYEN de la source.
	 * Le stock sort de l'emplacement source et entre dans l'emplacement de destination.
	 * $d : emplacement_id (source), entreprise_dest_id, emplacement_dest_id, date?, note?,
	 *      permettre_cout_zero? (bool), lignes[{piece_id, quantite}]
	 */
	public function factureInterne($userId, array $d)
	{
		return $this->transaction(function () use ($userId, $d) {
			$src = $this->emplacementAccessible($userId, isset($d['emplacement_id']) ? $d['emplacement_id'] : 0);
			$dst = $this->emplacement(isset($d['emplacement_dest_id']) ? $d['emplacement_dest_id'] : 0);
			$e1 = (int) $src['entreprise_id'];
			$e2 = (int) $dst['entreprise_id'];
			if ($e1 === $e2) {
				throw new InventaireException('Une facture interne se fait entre deux entreprises différentes. Pour la même entreprise, utilisez un transfert.', 'emplacement_dest_id');
			}
			if (!empty($d['entreprise_dest_id']) && (int) $d['entreprise_dest_id'] !== $e2) {
				throw new InventaireException('L\'emplacement de destination n\'appartient pas à l\'entreprise choisie.', 'emplacement_dest_id');
			}
			$this->exiger($userId, 'facture_interne', array($e1));
			$date = $this->dateDocument(isset($d['date']) ? $d['date'] : null);
			$lignes = $this->fusionner($this->lignes(isset($d['lignes']) ? $d['lignes'] : null, 'positif', 'aucun'));
			$this->pieces($lignes);

			list($docId, $numero) = $this->creerDocument('facture_interne', array(
				'date_document' => $date, 'entreprise_id' => $e1, 'emplacement_id' => (int) $src['id'],
				'entreprise_dest_id' => $e2, 'emplacement_dest_id' => (int) $dst['id'],
				'note' => isset($d['note']) ? $d['note'] : null,
			), $userId);

			$total = 0;
			foreach ($lignes as $l) {
				$this->verrouillerPiece(array($e1, $e2), $l['piece_id']);
				$c = $this->lireCout($e1, $l['piece_id']);
				if ($c === 0 && empty($d['permettre_cout_zero'])) {
					throw new InventaireException('La pièce « ' . $this->libelle($l['piece_id']) . ' » n\'a aucun coût connu. Faites d\'abord une réception (ou un ajustement avec coût), ou cochez « Facturer les pièces sans coût à 0 $ ».', 'lignes');
				}
				$this->bouger($docId, $e1, $l['piece_id'], (int) $src['id'], -$l['qte'], 'sortie_moy', null, false, $userId);
				$this->bouger($docId, $e2, $l['piece_id'], (int) $dst['id'], $l['qte'], 'entree', $c, false, $userId);
				$total += $this->ligneDocument($docId, $l['piece_id'], $l['qte'], $c);
			}
			$this->totalDocument($docId, $total);
			return $this->resultat($userId, $docId, $numero, $total);
		});
	}

	/**
	 * Annule un document en passant les écritures inverses. Refusé si le stock à reprendre n'est plus là.
	 * Types annulables : reception, transfert, sortie, facture_interne (un ajustement se corrige par un autre ajustement).
	 */
	public function annuler($userId, $docId, $motif)
	{
		return $this->transaction(function () use ($userId, $docId, $motif) {
			$doc = $this->un('SELECT * FROM documents WHERE id = ? FOR UPDATE', array((int) $docId));
			if (!$doc) {
				throw new InventaireException('Document introuvable.');
			}
			// Seule l'entreprise qui a ÉMIS le document peut l'annuler (pour défaire une facture, l'autre entreprise
			// émet une facture en sens inverse) : on ne laisse pas une entreprise modifier le stock de l'autre.
			$this->exiger($userId, 'annulation', array((int) $doc['entreprise_id']));
			if ($doc['statut'] !== 'valide') {
				throw new InventaireException('Ce document est déjà annulé.');
			}
			if ($doc['type'] === 'ajustement') {
				throw new InventaireException('Un ajustement ne s\'annule pas : corrigez-le avec un nouvel ajustement.');
			}
			$motif = self::texte($motif, 255);
			if ($motif === null) {
				throw new InventaireException('Indiquez le motif de l\'annulation.', 'motif');
			}
			$lignes = $this->tous('SELECT piece_id, quantite, cout_unitaire FROM document_lignes WHERE document_id = ? ORDER BY piece_id, id', array($doc['id']));
			$e1 = (int) $doc['entreprise_id'];
			$e2 = $doc['entreprise_dest_id'] ? (int) $doc['entreprise_dest_id'] : null;
			$src = (int) $doc['emplacement_id'];
			$dst = $doc['emplacement_dest_id'] ? (int) $doc['emplacement_dest_id'] : null;

			foreach ($lignes as $l) {
				$pid = (int) $l['piece_id'];
				$q = Dec::parse($l['quantite'], Dec::QTE);
				$c = Dec::parse($l['cout_unitaire'], Dec::COUT);
				$this->verrouillerPiece($e2 ? array($e1, $e2) : array($e1), $pid);
				switch ($doc['type']) {
					case 'reception':
						$this->bouger($doc['id'], $e1, $pid, $src, -$q, 'sortie_cout', $c, true, $userId);
						break;
					case 'transfert':
						$this->bouger($doc['id'], $e1, $pid, $dst, -$q, 'sortie_moy', null, true, $userId);
						$this->bouger($doc['id'], $e1, $pid, $src, $q, 'entree_moy', null, true, $userId);
						break;
					case 'sortie':
						$this->bouger($doc['id'], $e1, $pid, $src, $q, 'entree', $c, true, $userId);
						break;
					case 'facture_interne':
						try {
							$this->bouger($doc['id'], $e2, $pid, $dst, -$q, 'sortie_cout', $c, true, $userId);
						} catch (InventaireException $ex) {
							// Si l'utilisateur n'a pas accès à l'entreprise destinataire, on ne lui montre ni ses emplacements ni ses quantités.
							if (!in_array($e2, $this->utilisateur($userId)['entreprises'], true)) {
								throw new InventaireException('Annulation impossible : la marchandise facturée n\'est plus entièrement disponible chez le destinataire.');
							}
							throw $ex;
						}
						$this->bouger($doc['id'], $e1, $pid, $src, $q, 'entree', $c, true, $userId);
						break;
				}
			}
			if ($doc['type'] === 'reception' && $doc['fournisseur_id']) {
				$this->restaurerPrixDeReception($userId, $doc);
			}
			$this->exec(
				"UPDATE documents SET statut = 'annule', annule_par = ?, annule_le = ?, motif_annulation = ? WHERE id = ?",
				array($userId, date('Y-m-d H:i:s'), $motif, $doc['id'])
			);
			Journal::ecrire($this->pdo, $userId, 'document.annule', 'documents', (int) $doc['id'], array('numero' => $doc['numero'], 'motif' => $motif));
			return array('id' => (int) $doc['id'], 'numero' => $doc['numero']);
		});
	}

	/**
	 * Annulation d'une réception qui avait mis à jour les prix du fournisseur : on remet le prix précédent
	 * (ou on retire la ligne si le fournisseur n'avait pas de prix) — sauf si quelqu'un a changé ce prix depuis.
	 */
	private function restaurerPrixDeReception($userId, array $doc)
	{
		$lignes = $this->tous('SELECT DISTINCT piece_id FROM document_lignes WHERE document_id = ? ORDER BY piece_id', array($doc['id']));
		foreach ($lignes as $l) {
			$pid = (int) $l['piece_id'];
			$h = $this->un('SELECT id, prix FROM prix_fournisseurs_hist WHERE piece_id = ? AND fournisseur_id = ? AND document_id = ? ORDER BY id DESC LIMIT 1', array($pid, $doc['fournisseur_id'], $doc['id']));
			if (!$h) {
				continue;   // cette réception n'a pas modifié le prix
			}
			$cur = $this->un('SELECT id, prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ? FOR UPDATE', array($pid, $doc['fournisseur_id']));
			if (!$cur || Dec::parse($cur['prix'], Dec::COUT) !== Dec::parse($h['prix'], Dec::COUT)) {
				continue;   // le prix a été changé depuis : on n'y touche pas
			}
			$prev = $this->un('SELECT prix, date_prix FROM prix_fournisseurs_hist WHERE piece_id = ? AND fournisseur_id = ? AND id < ? ORDER BY id DESC LIMIT 1', array($pid, $doc['fournisseur_id'], $h['id']));
			if ($prev) {
				$this->exec('UPDATE prix_fournisseurs SET prix = ?, date_prix = ?, note = ? WHERE id = ?', array($prev['prix'], $prev['date_prix'], 'Annulation de ' . $doc['numero'], $cur['id']));
				$this->exec('INSERT INTO prix_fournisseurs_hist (piece_id, fournisseur_id, prix, date_prix, utilisateur_id, document_id) VALUES (?, ?, ?, ?, ?, ?)', array($pid, $doc['fournisseur_id'], $prev['prix'], date('Y-m-d'), $userId, $doc['id']));
			} else {
				$this->exec('DELETE FROM prix_fournisseurs WHERE id = ?', array($cur['id']));
			}
			Journal::ecrire($this->pdo, $userId, 'prix.restaure', 'pieces', $pid, array('fournisseur_id' => (int) $doc['fournisseur_id'], 'document' => $doc['numero']));
		}
	}

	// ======================================================================
	//  Comptage d'inventaire
	// ======================================================================

	public function creerComptage($userId, $emplacementId, $note = null)
	{
		return $this->transaction(function () use ($userId, $emplacementId, $note) {
			$emp = $this->emplacementAccessible($userId, $emplacementId);
			$this->exiger($userId, 'comptage', array($emp['entreprise_id']));
			$ex = $this->un("SELECT numero FROM comptages WHERE emplacement_id = ? AND statut = 'en_cours' LIMIT 1 FOR UPDATE", array($emp['id']));
			if ($ex) {
				throw new InventaireException('Un comptage est déjà en cours à cet emplacement (' . $ex['numero'] . '). Terminez-le ou annulez-le d\'abord.', 'emplacement_id');
			}
			$numero = $this->numero('COM', (int) date('Y'));
			$this->exec(
				'INSERT INTO comptages (numero, entreprise_id, emplacement_id, note, cree_par) VALUES (?, ?, ?, ?, ?)',
				array($numero, $emp['entreprise_id'], $emp['id'], self::texte($note, 255), $userId)
			);
			return array('id' => (int) $this->pdo->lastInsertId(), 'numero' => $numero);
		});
	}

	private function comptageOuvert($comptageId, $userId, $operation)
	{
		$c = $this->un('SELECT * FROM comptages WHERE id = ? FOR UPDATE', array((int) $comptageId));
		if (!$c) {
			throw new InventaireException('Comptage introuvable.');
		}
		$this->exiger($userId, $operation, array($c['entreprise_id']));
		if ($c['statut'] !== 'en_cours') {
			throw new InventaireException('Ce comptage est terminé.');
		}
		return $c;
	}

	/** $mode 'ajouter' : ajoute $quantite à ce qui est déjà compté (un scan = +1) ; 'fixer' : remplace. */
	public function comptageScanner($userId, $comptageId, $pieceId, $quantite = '1', $mode = 'ajouter')
	{
		return $this->transaction(function () use ($userId, $comptageId, $pieceId, $quantite, $mode) {
			$c = $this->comptageOuvert($comptageId, $userId, 'comptage');
			$this->pieces(array(array('piece_id' => (int) $pieceId)), true);   // on doit pouvoir compter une pièce désactivée qui a du stock
			$q = Dec::parse($quantite, Dec::QTE, 'quantite');
			if ($mode === 'ajouter') {
				$ex = $this->un('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ? AND piece_id = ? FOR UPDATE', array($c['id'], (int) $pieceId));
				$q += $ex ? Dec::parse($ex['quantite_comptee'], Dec::QTE) : 0;
			} elseif ($mode !== 'fixer') {
				throw new InventaireException('Mode de comptage invalide.');
			}
			if ($q < 0 || $q > self::MAX_QTE_LIGNE * 1000) {
				throw new InventaireException('Quantité comptée invalide.', 'quantite');
			}
			$this->exec(
				'INSERT INTO comptage_lignes (comptage_id, piece_id, quantite_comptee) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantite_comptee = VALUES(quantite_comptee)',
				array($c['id'], (int) $pieceId, Dec::fmt($q, Dec::QTE))
			);
			return array('piece_id' => (int) $pieceId, 'quantite_comptee' => Dec::fmt($q, Dec::QTE));
		});
	}

	public function comptageRetirer($userId, $comptageId, $pieceId)
	{
		return $this->transaction(function () use ($userId, $comptageId, $pieceId) {
			$c = $this->comptageOuvert($comptageId, $userId, 'comptage');
			$this->exec('DELETE FROM comptage_lignes WHERE comptage_id = ? AND piece_id = ?', array($c['id'], (int) $pieceId));
			return true;
		});
	}

	public function comptageAnnuler($userId, $comptageId)
	{
		return $this->transaction(function () use ($userId, $comptageId) {
			$c = $this->comptageOuvert($comptageId, $userId, 'comptage');
			$this->exec("UPDATE comptages SET statut = 'annule' WHERE id = ?", array($c['id']));
			return true;
		});
	}

	/**
	 * Comptage avec les écarts calculés contre le stock ACTUEL.
	 * @return array{comptage:array,lignes:array}  (cout masqué pour un employé)
	 */
	public function comptageDetail($userId, $comptageId, $inclureNonComptees = false)
	{
		$c = $this->un(
			'SELECT c.*, e.nom AS emplacement_nom, en.nom AS entreprise_nom
			   FROM comptages c JOIN emplacements e ON e.id = c.emplacement_id JOIN entreprises en ON en.id = c.entreprise_id WHERE c.id = ?',
			array((int) $comptageId)
		);
		if (!$c) {
			throw new InventaireException('Comptage introuvable.');
		}
		$this->exiger($userId, 'consulter', array($c['entreprise_id']));
		$rows = $this->tous(
			'SELECT p.id AS piece_id, p.code, p.nom, p.unite, p.actif,
			        COALESCE(cl.quantite_comptee, NULL) AS quantite_comptee, COALESCE(s.quantite, 0) AS quantite_actuelle
			   FROM pieces p
			   LEFT JOIN comptage_lignes cl ON cl.piece_id = p.id AND cl.comptage_id = ?
			   LEFT JOIN stock s ON s.piece_id = p.id AND s.emplacement_id = ?
			  WHERE cl.id IS NOT NULL OR (? = 1 AND s.quantite > 0)
			  ORDER BY p.code',
			array($c['id'], $c['emplacement_id'], $inclureNonComptees ? 1 : 0)
		);
		$lignes = array();
		foreach ($rows as $r) {
			$compte = $r['quantite_comptee'] === null ? null : Dec::parse($r['quantite_comptee'], Dec::QTE);
			$actuel = Dec::parse($r['quantite_actuelle'], Dec::QTE);
			$cible = $compte === null ? 0 : $compte;
			$r['ecart'] = Dec::fmt($cible - $actuel, Dec::QTE);
			$r['compte'] = $compte !== null;
			$lignes[] = $r;
		}
		return array('comptage' => $c, 'lignes' => $lignes);
	}

	/**
	 * Applique le comptage : crée UN document « ajustement » (motif comptage) avec les écarts
	 * (compté - stock actuel). $inclureNonComptees : les pièces en stock mais non scannées passent à 0.
	 */
	public function comptageAppliquer($userId, $comptageId, $inclureNonComptees = false)
	{
		return $this->transaction(function () use ($userId, $comptageId, $inclureNonComptees) {
			$c = $this->comptageOuvert($comptageId, $userId, 'comptage_appliquer');
			$emp = $this->emplacement($c['emplacement_id'], false);
			$lignesAj = array();
			$lues = $this->tous('SELECT piece_id, quantite_comptee FROM comptage_lignes WHERE comptage_id = ? ORDER BY piece_id', array($c['id']));
			$vus = array();
			foreach ($lues as $l) {
				$pid = (int) $l['piece_id'];
				$vus[$pid] = true;
				$this->verrouillerPiece(array((int) $c['entreprise_id']), $pid);
				$this->exec('INSERT IGNORE INTO stock (piece_id, emplacement_id, quantite) VALUES (?, ?, 0)', array($pid, $c['emplacement_id']));
				$s = $this->un('SELECT quantite FROM stock WHERE piece_id = ? AND emplacement_id = ? FOR UPDATE', array($pid, $c['emplacement_id']));
				$delta = Dec::parse($l['quantite_comptee'], Dec::QTE) - Dec::parse($s['quantite'], Dec::QTE);
				if ($delta !== 0) {
					$lignesAj[] = array('piece_id' => $pid, 'quantite' => Dec::fmt($delta, Dec::QTE));
				}
			}
			if ($inclureNonComptees) {
				$autres = $this->tous('SELECT piece_id, quantite FROM stock WHERE emplacement_id = ? AND quantite > 0 ORDER BY piece_id', array($c['emplacement_id']));
				foreach ($autres as $s) {
					if (!isset($vus[(int) $s['piece_id']])) {
						$lignesAj[] = array('piece_id' => (int) $s['piece_id'], 'quantite' => '-' . $s['quantite']);
					}
				}
			}
			$resultat = array('document_id' => null, 'numero' => null, 'ecarts' => count($lignesAj), 'documents' => array());
			// Un ajustement est limité à MAX_LIGNES lignes : un grand comptage produit plusieurs ajustements (tout ou rien : même transaction).
			$paquets = array_chunk($lignesAj, self::MAX_LIGNES);
			foreach ($paquets as $i => $paquet) {
				$doc = $this->ajusterInterne($userId, $emp, array(
					'motif' => 'comptage', 'lignes' => $paquet,
					'note' => 'Comptage ' . $c['numero'] . (count($paquets) > 1 ? ' (partie ' . ($i + 1) . ' de ' . count($paquets) . ')' : ''),
				));
				$resultat['documents'][] = array('id' => $doc['id'], 'numero' => $doc['numero']);
				if ($i === 0) {
					$resultat['document_id'] = $doc['id'];
					$resultat['numero'] = $doc['numero'];
				}
			}
			$this->exec(
				"UPDATE comptages SET statut = 'applique', applique_par = ?, applique_le = ?, document_id = ? WHERE id = ?",
				array($userId, date('Y-m-d H:i:s'), $resultat['document_id'], $c['id'])
			);
			return $resultat;
		});
	}

	// ======================================================================
	//  Catalogue : codes et prix fournisseurs
	// ======================================================================

	/**
	 * Qui détient ce code ? null si libre, sinon array('type' => 'piece'|'alias'|'emplacement', 'id' => int, 'libelle' => string).
	 * $sauf : id d'une pièce dont les propres codes sont ignorés (modification d'une pièce).
	 */
	public function codeUtilisePar($code, $sauf = 0)
	{
		$a = $this->un('SELECT id, code, nom FROM pieces WHERE code = ? AND id <> ? LIMIT 1', array($code, (int) $sauf));
		if ($a) {
			return array('type' => 'piece', 'id' => (int) $a['id'], 'libelle' => $a['code'] . ' — ' . $a['nom']);
		}
		$b = $this->un('SELECT pc.piece_id, p.code, p.nom FROM pieces_codes pc JOIN pieces p ON p.id = pc.piece_id WHERE pc.code = ? AND pc.piece_id <> ? LIMIT 1', array($code, (int) $sauf));
		if ($b) {
			return array('type' => 'alias', 'id' => (int) $b['piece_id'], 'libelle' => $b['code'] . ' — ' . $b['nom']);
		}
		$c = $this->un('SELECT e.id, e.nom, en.nom AS entreprise FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id WHERE e.code_barres = ? LIMIT 1', array($code));
		if ($c) {
			return array('type' => 'emplacement', 'id' => (int) $c['id'], 'libelle' => $c['nom'] . ' (' . $c['entreprise'] . ')');
		}
		return null;
	}

	/** Vrai si $code n'est utilisé par aucune pièce (code interne ou alias) ni emplacement, sauf $sauf (id de pièce). */
	public function codeDisponible($code, $sauf = 0)
	{
		return $this->codeUtilisePar($code, $sauf) === null;
	}

	/**
	 * Exécute $fn en tenant un verrou global « codes » : à utiliser pour toute écriture d'un code interne, d'un alias ou d'un
	 * code d'emplacement (le contrôle d'unicité sur trois tables ne peut pas être garanti par un index). Le verrou est pris AVANT
	 * la transaction et relâché APRÈS le commit ; il est ré-entrant pour une même connexion.
	 */
	public function avecVerrouCodes($fn)
	{
		$nom = $this->pdo->quote('bea_codes_' . substr(md5((string) $this->pdo->query('SELECT DATABASE()')->fetchColumn()), 0, 20));
		if ((int) $this->pdo->query("SELECT GET_LOCK($nom, 10)")->fetchColumn() !== 1) {
			throw new InventaireException('Le catalogue est occupé : réessayez dans un instant.');
		}
		try {
			return $fn();
		} finally {
			$this->pdo->query("SELECT RELEASE_LOCK($nom)");
		}
	}

	/** Met à jour (ou crée) le prix d'une pièce chez un fournisseur ; garde l'historique. */
	public function definirPrixFournisseur($userId, $pieceId, $fournisseurId, $prix, $noFournisseur = null, $date = null, $note = null)
	{
		return $this->transaction(function () use ($userId, $pieceId, $fournisseurId, $prix, $noFournisseur, $date, $note) {
			$this->exiger($userId, 'catalogue');
			$p = Dec::parse($prix, Dec::COUT, 'prix');
			if ($p < 0 || $p > self::MAX_COUT * 10000) {
				throw new InventaireException('Prix invalide.', 'prix');
			}
			if (!$this->un('SELECT id FROM pieces WHERE id = ?', array((int) $pieceId))) {
				throw new InventaireException('Pièce introuvable.', 'piece_id');
			}
			$f = $this->un('SELECT id FROM fournisseurs WHERE id = ?', array((int) $fournisseurId));
			if (!$f) {
				throw new InventaireException('Fournisseur introuvable.', 'fournisseur_id');
			}
			return $this->definirPrixInterne($userId, (int) $pieceId, (int) $fournisseurId, $p, $noFournisseur, $this->dateDocument($date), $note);
		});
	}

	private function definirPrixInterne($userId, $pieceId, $fournisseurId, $prix4, $noFournisseur, $date, $note, $documentId = null)
	{
		$ex = $this->un('SELECT id, prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ? FOR UPDATE', array($pieceId, $fournisseurId));
		// null = champ inchangé ; chaîne vide = champ effacé
		$noModifie = ($noFournisseur !== null);
		$ntModifie = ($note !== null);
		$no = self::texte($noFournisseur, 60);
		$nt = self::texte($note, 255);
		$strPrix = Dec::fmt($prix4, Dec::COUT);
		if ($ex) {
			$change = Dec::parse($ex['prix'], Dec::COUT) !== $prix4;
			$this->exec(
				'UPDATE prix_fournisseurs SET prix = ?, date_prix = ?, note = IF(?, ?, note), no_fournisseur = IF(?, ?, no_fournisseur) WHERE id = ?',
				array($strPrix, $date, $ntModifie ? 1 : 0, $nt, $noModifie ? 1 : 0, $no, $ex['id'])
			);
		} else {
			$change = true;
			$this->exec(
				'INSERT INTO prix_fournisseurs (piece_id, fournisseur_id, prix, no_fournisseur, date_prix, note) VALUES (?, ?, ?, ?, ?, ?)',
				array($pieceId, $fournisseurId, $strPrix, $no, $date, $nt)
			);
		}
		if ($change) {
			$this->exec(
				'INSERT INTO prix_fournisseurs_hist (piece_id, fournisseur_id, prix, date_prix, utilisateur_id, document_id) VALUES (?, ?, ?, ?, ?, ?)',
				array($pieceId, $fournisseurId, $strPrix, $date, $userId, $documentId)
			);
			Journal::ecrire($this->pdo, $userId, 'prix.maj', 'pieces', $pieceId, array('fournisseur_id' => $fournisseurId, 'prix' => $strPrix));
		}
		return array('piece_id' => $pieceId, 'fournisseur_id' => $fournisseurId, 'prix' => $strPrix);
	}

	// ======================================================================
	//  Consultation (les coûts ne sont montrés qu'aux gestionnaires et admins)
	// ======================================================================

	public function listeEntreprises($userId)
	{
		$u = $this->utilisateur($userId);
		if (!$u['entreprises']) {
			return array();
		}
		$in = implode(',', array_fill(0, count($u['entreprises']), '?'));
		return $this->tous("SELECT id, code, nom FROM entreprises WHERE id IN ($in) ORDER BY id", $u['entreprises']);
	}

	/** Emplacements actifs des entreprises accessibles (pour les listes déroulantes). */
	public function listeEmplacements($userId, $inclureInactifs = false)
	{
		$u = $this->utilisateur($userId);
		if (!$u['entreprises']) {
			return array();
		}
		$in = implode(',', array_fill(0, count($u['entreprises']), '?'));
		return $this->tous(
			"SELECT e.id, e.nom, e.type, e.code_barres, e.actif, e.entreprise_id, en.nom AS entreprise_nom, en.code AS entreprise_code
			   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
			  WHERE e.entreprise_id IN ($in)" . ($inclureInactifs ? '' : ' AND e.actif = 1') . '
			  ORDER BY en.id, e.type, e.nom',
			$u['entreprises']
		);
	}

	/** Emplacements actifs d'une entreprise quelconque (destination d'une facture interne). */
	public function emplacementsDestination($userId, $entrepriseId)
	{
		$this->exiger($userId, 'facture_interne');
		return $this->tous(
			'SELECT id, nom, type, entreprise_id FROM emplacements WHERE entreprise_id = ? AND actif = 1 ORDER BY type, nom',
			array((int) $entrepriseId)
		);
	}

	/** Toutes les entreprises actives (choix de la destination d'une facture interne). */
	public function entreprisesDestination($userId)
	{
		$this->exiger($userId, 'facture_interne');
		return $this->tous('SELECT id, code, nom FROM entreprises WHERE actif = 1 ORDER BY id');
	}

	/**
	 * Résout un code scanné : pièce (code interne ou alias) ou emplacement.
	 * @return array|null  ['type'=>'piece','piece'=>[...]] | ['type'=>'emplacement','emplacement'=>[...]] | null
	 */
	public function trouverParCode($userId, $code)
	{
		$this->exiger($userId, 'consulter');
		if (!is_string($code)) {
			return null;
		}
		$code = trim($code);
		$code = preg_replace('/[\x00-\x1F\x7F]/u', '', $code);
		if ($code === '' || mb_strlen($code) > 64) {
			return null;
		}
		$p = $this->un(
			'SELECT id FROM pieces WHERE code = ? UNION SELECT piece_id FROM pieces_codes WHERE code = ? LIMIT 1',
			array($code, $code)
		);
		if ($p) {
			return array('type' => 'piece', 'piece' => $this->pieceDetail($userId, (int) $p['id']));
		}
		$e = $this->un(
			'SELECT e.id, e.nom, e.type, e.entreprise_id, e.actif, en.nom AS entreprise_nom FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id WHERE e.code_barres = ?',
			array($code)
		);
		if ($e) {
			$u = $this->utilisateur($userId);
			if (!in_array((int) $e['entreprise_id'], $u['entreprises'], true)) {
				return null;
			}
			return array('type' => 'emplacement', 'emplacement' => $e);
		}
		return null;
	}

	/**
	 * Fiche d'une pièce avec son stock par emplacement (entreprises accessibles seulement).
	 * Champs de coût (cout_moyen, prix fournisseurs) présents seulement pour gestionnaire/admin.
	 */
	public function pieceDetail($userId, $pieceId)
	{
		$u = $this->exiger($userId, 'consulter');
		$couts = self::RANG[$u['role']] >= self::RANG[self::ROLE_MIN['voir_couts']];
		$p = $this->un(
			'SELECT p.id, p.code, p.nom, p.description, p.unite, p.actif, p.categorie_id, c.nom AS categorie
			   FROM pieces p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.id = ?',
			array((int) $pieceId)
		);
		if (!$p) {
			throw new InventaireException('Pièce introuvable.');
		}
		$p['codes'] = $this->tous('SELECT code, type FROM pieces_codes WHERE piece_id = ? ORDER BY id', array($p['id']));
		$p['stock'] = array();
		$p['totaux'] = array();
		if ($u['entreprises']) {
			$in = implode(',', array_fill(0, count($u['entreprises']), '?'));
			$p['stock'] = $this->tous(
				"SELECT e.id AS emplacement_id, e.nom AS emplacement, e.type, e.entreprise_id, en.nom AS entreprise, s.quantite
				   FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN entreprises en ON en.id = e.entreprise_id
				  WHERE s.piece_id = ? AND s.quantite > 0 AND e.entreprise_id IN ($in) ORDER BY en.id, e.type, e.nom",
				array_merge(array($p['id']), $u['entreprises'])
			);
			$tot = array();
			foreach ($p['stock'] as $s) {
				$eid = (int) $s['entreprise_id'];
				if (!isset($tot[$eid])) {
					$tot[$eid] = array('entreprise_id' => $eid, 'entreprise' => $s['entreprise'], 'quantite' => 0);
				}
				$tot[$eid]['quantite'] += Dec::parse($s['quantite'], Dec::QTE);
			}
			foreach ($tot as $t) {
				$t['quantite'] = Dec::fmt($t['quantite'], Dec::QTE);
				if ($couts) {
					$r = $this->un('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ?', array($t['entreprise_id'], $p['id']));
					$t['cout_moyen'] = $r ? $r['cout_moyen'] : '0.0000';
				}
				$p['totaux'][] = $t;
			}
		}
		if ($couts) {
			$p['prix_fournisseurs'] = $this->tous(
				'SELECT pf.fournisseur_id, f.nom AS fournisseur, pf.prix, pf.no_fournisseur, pf.date_prix
				   FROM prix_fournisseurs pf JOIN fournisseurs f ON f.id = pf.fournisseur_id WHERE pf.piece_id = ? ORDER BY pf.prix, f.nom',
				array($p['id'])
			);
		}
		return $p;
	}

	/** Recherche rapide (liste déroulante / auto-complétion) par code, alias ou nom. */
	public function piecesRecherche($userId, $terme, $limite = 20, $inclureInactives = false)
	{
		$this->exiger($userId, 'consulter');
		$terme = is_string($terme) ? $terme : '';
		$mots = mb_check_encoding($terme, 'UTF-8') ? preg_split('/\s+/u', trim($terme), -1, PREG_SPLIT_NO_EMPTY) : array();
		$mots = $mots === false ? array() : $mots;
		$where = $inclureInactives ? array('1 = 1') : array('p.actif = 1');   // (l'historique doit pouvoir retrouver une pièce désactivée)
		$params = array();
		foreach (array_slice($mots, 0, 6) as $m) {
			$like = '%' . self::likeEchapper($m) . '%';
			$where[] = '(p.code LIKE ? OR p.nom LIKE ? OR pc.code LIKE ?)';
			array_push($params, $like, $like, $like);
		}
		$limite = max(1, min(50, (int) $limite));
		return $this->tous(
			'SELECT DISTINCT p.id, p.code, p.nom, p.unite, p.actif FROM pieces p LEFT JOIN pieces_codes pc ON pc.piece_id = p.id
			  WHERE ' . implode(' AND ', $where) . ' ORDER BY p.nom LIMIT ' . $limite,
			$params
		);
	}

	public static function likeEchapper($s)
	{
		return str_replace(array('\\', '%', '_'), array('\\\\', '\\%', '\\_'), $s);
	}

	/** Valeur du stock (quantité x coût moyen) par entreprise et par emplacement. Gestionnaire+. */
	public function valeurInventaire($userId, array $entrepriseIds = array())
	{
		$u = $this->exiger($userId, 'rapport');
		$ids = $entrepriseIds ? array_values(array_intersect(array_map('intval', $entrepriseIds), $u['consultables'])) : $u['consultables'];
		if (!$ids) {
			return array('entreprises' => array(), 'emplacements' => array());
		}
		$in = implode(',', array_fill(0, count($ids), '?'));
		$ent = $this->tous(
			"SELECT en.id, en.nom, COALESCE(ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 2), 0) AS valeur
			   FROM entreprises en
			   LEFT JOIN emplacements e ON e.entreprise_id = en.id
			   LEFT JOIN stock s ON s.emplacement_id = e.id
			   LEFT JOIN stock_couts sc ON sc.entreprise_id = en.id AND sc.piece_id = s.piece_id
			  WHERE en.id IN ($in) GROUP BY en.id, en.nom ORDER BY en.id",
			$ids
		);
		$emp = $this->tous(
			"SELECT e.id, e.nom, e.type, e.entreprise_id, e.actif, COALESCE(ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 2), 0) AS valeur,
			        COUNT(CASE WHEN s.quantite > 0 THEN 1 END) AS nb_pieces
			   FROM emplacements e
			   LEFT JOIN stock s ON s.emplacement_id = e.id
			   LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id
			  WHERE e.entreprise_id IN ($in) AND (e.actif = 1 OR s.quantite > 0) GROUP BY e.id, e.nom, e.type, e.entreprise_id, e.actif ORDER BY e.entreprise_id, e.type, e.nom",
			$ids
		);
		return array('entreprises' => $ent, 'emplacements' => $emp);
	}

	/** Pièces dont le total dans l'entreprise est sous le minimum fixé (table seuils). */
	public function sousMinimum($userId, array $entrepriseIds = array())
	{
		$u = $this->exiger($userId, 'consulter');
		$ids = $entrepriseIds ? array_values(array_intersect(array_map('intval', $entrepriseIds), $u['entreprises'])) : $u['entreprises'];
		if (!$ids) {
			return array();
		}
		$in = implode(',', array_fill(0, count($ids), '?'));
		return $this->tous(
			"SELECT se.entreprise_id, en.nom AS entreprise, p.id AS piece_id, p.code, p.nom, p.unite, se.minimum, COALESCE(t.q, 0) AS quantite
			   FROM seuils se
			   JOIN pieces p ON p.id = se.piece_id
			   JOIN entreprises en ON en.id = se.entreprise_id
			   LEFT JOIN (SELECT e.entreprise_id, s.piece_id, SUM(s.quantite) AS q FROM stock s JOIN emplacements e ON e.id = s.emplacement_id GROUP BY e.entreprise_id, s.piece_id) t
			          ON t.entreprise_id = se.entreprise_id AND t.piece_id = se.piece_id
			  WHERE se.minimum > 0 AND p.actif = 1 AND COALESCE(t.q, 0) < se.minimum AND se.entreprise_id IN ($in)
			  ORDER BY en.id, p.code",
			$ids
		);
	}

	/**
	 * Un document avec ses lignes. Coûts masqués pour un employé.
	 * @return array{doc:array,lignes:array}
	 */
	public function document($userId, $docId)
	{
		$u = $this->exiger($userId, 'consulter');
		$d = $this->un(
			'SELECT d.*, e.nom AS emplacement, ed.nom AS emplacement_dest, en.nom AS entreprise, end_.nom AS entreprise_dest,
			        f.nom AS fournisseur, u.nom_utilisateur AS utilisateur, ua.nom_utilisateur AS annule_par_nom
			   FROM documents d
			   JOIN emplacements e ON e.id = d.emplacement_id
			   LEFT JOIN emplacements ed ON ed.id = d.emplacement_dest_id
			   JOIN entreprises en ON en.id = d.entreprise_id
			   LEFT JOIN entreprises end_ ON end_.id = d.entreprise_dest_id
			   LEFT JOIN fournisseurs f ON f.id = d.fournisseur_id
			   LEFT JOIN utilisateurs u ON u.id = d.utilisateur_id
			   LEFT JOIN utilisateurs ua ON ua.id = d.annule_par
			  WHERE d.id = ?',
			array((int) $docId)
		);
		if (!$d) {
			throw new InventaireException('Document introuvable.');
		}
		$acces = in_array((int) $d['entreprise_id'], $u['consultables'], true)
			|| ($d['entreprise_dest_id'] && in_array((int) $d['entreprise_dest_id'], $u['consultables'], true));
		if (!$acces) {
			throw new InventaireException("Vous n'avez pas accès à ce document.");
		}
		if (!in_array((int) $d['entreprise_id'], $u['consultables'], true)) {
			$d['emplacement'] = null;   // emplacement d'une autre entreprise : nom non communiqué
		}
		if ($d['entreprise_dest_id'] && !in_array((int) $d['entreprise_dest_id'], $u['consultables'], true)) {
			$d['emplacement_dest'] = null;
		}
		$lignes = $this->tous(
			'SELECT l.id, l.piece_id, p.code, p.nom, p.unite, l.quantite, l.cout_unitaire, l.total_ligne
			   FROM document_lignes l JOIN pieces p ON p.id = l.piece_id WHERE l.document_id = ? ORDER BY l.id',
			array($d['id'])
		);
		if (self::RANG[$u['role']] < self::RANG[self::ROLE_MIN['voir_couts']]) {
			$d['total'] = null;
			foreach ($lignes as &$l) {
				$l['cout_unitaire'] = null;
				$l['total_ligne'] = null;
			}
			unset($l);
		}
		return array('doc' => $d, 'lignes' => $lignes);
	}

	/**
	 * Bilan mensuel des factures internes entre deux entreprises (documents valides seulement).
	 * Pour chaque sens : documents, pièces regroupées (quantité, total, coût moyen) et total.
	 * `solde` : qui doit combien à qui (A->B moins B->A).
	 */
	public function bilanMensuel($userId, $annee, $mois, $entrepriseA, $entrepriseB)
	{
		$a = (int) $entrepriseA;
		$b = (int) $entrepriseB;
		$this->exiger($userId, 'rapport', array($a, $b), 'une');
		$annee = (int) $annee;
		$mois = (int) $mois;
		if ($annee < 2000 || $annee > 2100 || $mois < 1 || $mois > 12 || $a === $b) {
			throw new InventaireException('Période ou entreprises invalides.');
		}
		$du = sprintf('%04d-%02d-01', $annee, $mois);
		$au = date('Y-m-t', strtotime($du));
		$noms = array();
		foreach ($this->tous('SELECT id, nom FROM entreprises WHERE id IN (?, ?)', array($a, $b)) as $r) {
			$noms[(int) $r['id']] = $r['nom'];
		}
		if (count($noms) !== 2) {
			throw new InventaireException('Entreprise introuvable.');
		}

		$sens = function ($de, $vers) use ($du, $au) {
			$docs = $this->tous(
				"SELECT d.id, d.numero, d.date_document, d.total, d.note, e1.nom AS emplacement, e2.nom AS emplacement_dest
				   FROM documents d JOIN emplacements e1 ON e1.id = d.emplacement_id JOIN emplacements e2 ON e2.id = d.emplacement_dest_id
				  WHERE d.type = 'facture_interne' AND d.statut = 'valide' AND d.entreprise_id = ? AND d.entreprise_dest_id = ?
				    AND d.date_document BETWEEN ? AND ? ORDER BY d.date_document, d.id",
				array($de, $vers, $du, $au)
			);
			$pieces = $this->tous(
				"SELECT l.piece_id, p.code, p.nom, p.unite, SUM(l.quantite) AS quantite, SUM(l.total_ligne) AS total, SUM(l.quantite * l.cout_unitaire) AS valeur
				   FROM document_lignes l JOIN documents d ON d.id = l.document_id JOIN pieces p ON p.id = l.piece_id
				  WHERE d.type = 'facture_interne' AND d.statut = 'valide' AND d.entreprise_id = ? AND d.entreprise_dest_id = ?
				    AND d.date_document BETWEEN ? AND ?
				  GROUP BY l.piece_id, p.code, p.nom, p.unite ORDER BY p.code",
				array($de, $vers, $du, $au)
			);
			$tot = 0;
			foreach ($pieces as &$p) {
				$q = Dec::parse($p['quantite'], Dec::QTE);
				$t = Dec::parse($p['total'], Dec::TOTAL);
				$v7 = Dec::parse($p['valeur'], Dec::QTE + Dec::COUT);   // somme(quantité x coût) à l'échelle 7
				$p['cout_moyen'] = $q > 0 ? Dec::fmt(Dec::divRound($v7, $q), Dec::COUT) : '0.0000';
				unset($p['valeur']);
				$tot += $t;
			}
			unset($p);
			return array('documents' => $docs, 'pieces' => $pieces, 'total' => Dec::fmt($tot, Dec::TOTAL));
		};

		$ab = $sens($a, $b);
		$ba = $sens($b, $a);
		$net = Dec::parse($ab['total'], Dec::TOTAL) - Dec::parse($ba['total'], Dec::TOTAL);
		return array(
			'periode' => array('annee' => $annee, 'mois' => $mois, 'du' => $du, 'au' => $au),
			'entreprises' => array($a => $noms[$a], $b => $noms[$b]),
			'a_vers_b' => $ab,
			'b_vers_a' => $ba,
			'solde' => array(
				'montant' => Dec::fmt(abs($net), Dec::TOTAL),
				'debiteur' => $net > 0 ? $b : ($net < 0 ? $a : null),
				'creancier' => $net > 0 ? $a : ($net < 0 ? $b : null),
				'debiteur_nom' => $net > 0 ? $noms[$b] : ($net < 0 ? $noms[$a] : null),
				'creancier_nom' => $net > 0 ? $noms[$a] : ($net < 0 ? $noms[$b] : null),
			),
		);
	}
}
