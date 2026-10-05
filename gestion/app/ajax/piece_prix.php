<?php
// Coûts moyens et prix fournisseurs d'une pièce, avec écart vs coût moyen par entreprise, et historique des prix (gestionnaire+).
// GET : piece_id. Réponse : {couts:[{entreprise_id, nom, cout_moyen|null}], prix:[{fournisseur_id, fournisseur, actif, no_fournisseur, prix, date_prix, note, meilleur, ecarts:{entreprise_id:{ecart, pct}}}],
//                            historique:[{date_prix, fournisseur, prix, utilisateur}], fournisseurs:[{id, nom}] (actifs, pour la fenêtre d'ajout), aujourdhui:'AAAA-MM-JJ' (date du serveur)}
require_once '../init.php';
endpoint(function () {
	global $pdo;
	$inv = inventaire();
	$uid = utilisateur_id();
	$u = $inv->exiger($uid, 'voir_couts');
	$in = $_GET + entree();
	$pid = isset($in['piece_id']) && is_scalar($in['piece_id']) && ctype_digit((string) $in['piece_id']) ? (int) $in['piece_id'] : 0;
	$st = $pdo->prepare('SELECT id FROM pieces WHERE id = ?');
	$st->execute(array($pid));
	if (!$st->fetch()) {
		throw new InventaireException('Pièce introuvable.');
	}
	$ents = $inv->listeEntreprises($uid);
	$couts = array();
	foreach ($ents as $en) {
		$st = $pdo->prepare('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ?');
		$st->execute(array((int) $en['id'], $pid));
		$c = $st->fetchColumn();
		$connu = ($c !== false && Dec::parse($c, Dec::COUT) > 0);
		$couts[] = array('entreprise_id' => (int) $en['id'], 'nom' => $en['nom'], 'cout_moyen' => $connu ? $c : null);
	}
	$st = $pdo->prepare(
		'SELECT pf.fournisseur_id, f.nom AS fournisseur, f.actif, pf.no_fournisseur, pf.prix, pf.date_prix, pf.note
		   FROM prix_fournisseurs pf JOIN fournisseurs f ON f.id = pf.fournisseur_id WHERE pf.piece_id = ? ORDER BY pf.prix, f.nom'
	);
	$st->execute(array($pid));
	$prix = $st->fetchAll();
	$min = null;
	foreach ($prix as $l) {
		$v = Dec::parse($l['prix'], Dec::COUT);
		$min = ($min === null || $v < $min) ? $v : $min;
	}
	foreach ($prix as &$l) {
		$v = Dec::parse($l['prix'], Dec::COUT);
		$l['actif'] = (bool) $l['actif'];
		$l['meilleur'] = (count($prix) > 1 && $v === $min);
		$l['ecarts'] = array();
		foreach ($couts as $c) {
			if ($c['cout_moyen'] === null) {
				continue;
			}
			$cm = Dec::parse($c['cout_moyen'], Dec::COUT);
			$ecart = $v - $cm;
			$l['ecarts'][(string) $c['entreprise_id']] = array(
				'ecart' => Dec::fmt($ecart, Dec::COUT),
				'pct' => Dec::fmt(Dec::divRound($ecart * 1000, $cm), 1),     // pourcentage à une décimale
			);
		}
	}
	unset($l);
	$st = $pdo->prepare(
		'SELECT h.date_prix, h.prix, f.nom AS fournisseur, COALESCE(NULLIF(us.nom_complet, \'\'), us.nom_utilisateur) AS utilisateur
		   FROM prix_fournisseurs_hist h LEFT JOIN fournisseurs f ON f.id = h.fournisseur_id LEFT JOIN utilisateurs us ON us.id = h.utilisateur_id
		  WHERE h.piece_id = ? ORDER BY h.date_prix DESC, h.id DESC LIMIT 100'
	);
	$st->execute(array($pid));
	$fournisseurs = $pdo->query('SELECT id, nom FROM fournisseurs WHERE actif = 1 ORDER BY nom')->fetchAll();
	return array('couts' => $couts, 'prix' => $prix, 'historique' => $st->fetchAll(), 'fournisseurs' => $fournisseurs, 'aujourdhui' => date('Y-m-d'));
});
