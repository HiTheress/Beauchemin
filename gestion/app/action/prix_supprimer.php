<?php
// Retire le prix d'une pièce chez un fournisseur (gestionnaire+). L'historique des prix est conservé. POST JSON : piece_id, fournisseur_id.
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$pieceId = Catalogue::entier(isset($d['piece_id']) ? $d['piece_id'] : 0);
	$fid = Catalogue::entier(isset($d['fournisseur_id']) ? $d['fournisseur_id'] : 0);
	return $inv->transaction(function () use ($uid, $pieceId, $fid) {
		global $pdo;
		$st = $pdo->prepare('SELECT pf.prix, f.nom FROM prix_fournisseurs pf JOIN fournisseurs f ON f.id = pf.fournisseur_id WHERE pf.piece_id = ? AND pf.fournisseur_id = ? FOR UPDATE');
		$st->execute(array($pieceId, $fid));
		$l = $st->fetch();
		if (!$l) {
			throw new InventaireException('Ce prix n\'existe plus (il a peut-être déjà été retiré).');
		}
		$pdo->prepare('DELETE FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ?')->execute(array($pieceId, $fid));
		Journal::ecrire($pdo, $uid, 'prix.supprime', 'pieces', $pieceId, array('fournisseur_id' => $fid, 'fournisseur' => $l['nom'], 'prix' => $l['prix']));
		return array('supprime' => true);
	});
});
