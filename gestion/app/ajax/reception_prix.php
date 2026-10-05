<?php
// Coût proposé pour une ligne de réception (gestionnaire+) : prix courant de CE fournisseur pour la pièce,
// sinon coût moyen de l'entreprise de l'emplacement de réception, sinon rien.
// GET : piece_id, fournisseur_id? (facultatif), emplacement_id? (facultatif ; sans lui, pas de coût moyen).
// Réponse : {ok:true, cout:"14.5000"|null, source:"fournisseur"|"moyen"|null}
require_once __DIR__ . '/../action/document_lib.php';
endpoint(function () {
	global $pdo;
	Mouvements::exigerRole('voir_couts');
	$in = $_GET + entree();
	$pid = Mouvements::identifiant($in, 'piece_id');
	$fid = Mouvements::identifiant($in, 'fournisseur_id');
	$eid = Mouvements::identifiant($in, 'emplacement_id');
	Mouvements::exigerEntreprises(array($eid));
	if ($pid <= 0) {
		throw new InventaireException('Pièce introuvable.', 'piece_id');
	}
	if ($fid > 0) {
		$st = $pdo->prepare('SELECT prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ?');
		$st->execute(array($pid, $fid));
		$prix = $st->fetchColumn();
		if ($prix !== false && Dec::parse($prix, Dec::COUT) > 0) {
			return array('cout' => $prix, 'source' => 'fournisseur');
		}
	}
	if ($eid > 0) {
		$st = $pdo->prepare('SELECT sc.cout_moyen FROM stock_couts sc JOIN emplacements e ON e.entreprise_id = sc.entreprise_id WHERE e.id = ? AND sc.piece_id = ?');
		$st->execute(array($eid, $pid));
		$moy = $st->fetchColumn();
		if ($moy !== false && Dec::parse($moy, Dec::COUT) > 0) {
			return array('cout' => $moy, 'source' => 'moyen');
		}
	}
	return array('cout' => null, 'source' => null);
});
