<?php
// Supprime une catégorie (gestionnaire+), seulement si aucune pièce (même désactivée) n'y est rattachée. POST JSON : id.
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$id = Catalogue::entier(isset($d['id']) ? $d['id'] : 0);
	return $inv->transaction(function () use ($uid, $id) {
		global $pdo;
		$st = $pdo->prepare('SELECT nom FROM categories WHERE id = ? FOR UPDATE');
		$st->execute(array($id));
		$c = $st->fetch();
		if (!$c) {
			throw new InventaireException('Cette catégorie n\'existe plus.');
		}
		$st = $pdo->prepare('SELECT COUNT(*) FROM pieces WHERE categorie_id = ?');
		$st->execute(array($id));
		$n = (int) $st->fetchColumn();
		if ($n > 0) {
			throw new InventaireException('Impossible de supprimer la catégorie « ' . $c['nom'] . ' » : ' . ($n === 1 ? '1 pièce l\'utilise encore' : $n . ' pièces l\'utilisent encore') . '. Changez d\'abord la catégorie de ' . ($n === 1 ? 'cette pièce' : 'ces pièces') . '.');
		}
		$pdo->prepare('DELETE FROM categories WHERE id = ?')->execute(array($id));
		Journal::ecrire($pdo, $uid, 'categorie.supprime', 'categories', $id, array('nom' => $c['nom']));
		return array('supprimee' => true);
	});
});
