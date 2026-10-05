<?php
// Désactive ou réactive un fournisseur (gestionnaire+). Ses prix et son historique sont conservés. POST JSON : id, actif (booléen explicite : true/false).
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$id = Catalogue::entier(isset($d['id']) ? $d['id'] : 0);
	$actif = Catalogue::booleenExplicite($d, 'actif', 'actif');
	return $inv->transaction(function () use ($uid, $id, $actif) {
		global $pdo;
		$st = $pdo->prepare('SELECT id, nom, actif FROM fournisseurs WHERE id = ? FOR UPDATE');
		$st->execute(array($id));
		$f = $st->fetch();
		if (!$f) {
			throw new InventaireException('Fournisseur introuvable.');
		}
		if ((int) $f['actif'] === ($actif ? 1 : 0)) {
			return array('id' => $id, 'actif' => $actif, 'inchange' => true);
		}
		$pdo->prepare('UPDATE fournisseurs SET actif = ? WHERE id = ?')->execute(array($actif ? 1 : 0, $id));
		Journal::ecrire($pdo, $uid, $actif ? 'fournisseur.reactive' : 'fournisseur.desactive', 'fournisseurs', $id, array('nom' => $f['nom']));
		return array('id' => $id, 'actif' => $actif, 'inchange' => false);
	});
});
