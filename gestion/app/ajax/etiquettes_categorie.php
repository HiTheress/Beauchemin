<?php
// Pièces actives d'une catégorie (« toutes les pièces d'une catégorie » des étiquettes). Gestionnaire+.
// GET/POST : categorie_id (0 = pièces sans catégorie).
// Réponse : { ok:true, pieces:[{id, code, nom, unite}], tronque:bool }   (500 pièces au plus)
require_once '../init.php';
require_once __DIR__ . '/etiquette_lib.php';
endpoint(function () {
	inventaire()->exiger(utilisateur_id(), 'catalogue');
	global $pdo;
	$in = $_GET + entree();
	if (!isset($in['categorie_id']) || !(is_string($in['categorie_id']) || is_int($in['categorie_id'])) || !preg_match('/^\d+$/', (string) $in['categorie_id'])) {
		throw new InventaireException('Choisissez une catégorie.', 'categorie_id');
	}
	$cat = (int) $in['categorie_id'];
	if ($cat > 0) {
		$st = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
		$st->execute(array($cat));
		if (!$st->fetchColumn()) {
			throw new InventaireException('Catégorie introuvable.', 'categorie_id');
		}
		$st = $pdo->prepare('SELECT id, code, nom, unite FROM pieces WHERE actif = 1 AND categorie_id = ? ORDER BY code LIMIT ' . (Etiquettes::MAX_ELEMENTS + 1));
		$st->execute(array($cat));
	} else {
		$st = $pdo->query('SELECT id, code, nom, unite FROM pieces WHERE actif = 1 AND categorie_id IS NULL ORDER BY code LIMIT ' . (Etiquettes::MAX_ELEMENTS + 1));
	}
	$pieces = $st->fetchAll(PDO::FETCH_ASSOC);
	$tronque = count($pieces) > Etiquettes::MAX_ELEMENTS;
	if ($tronque) {
		$pieces = array_slice($pieces, 0, Etiquettes::MAX_ELEMENTS);
	}
	foreach ($pieces as &$p) {
		$p['id'] = (int) $p['id'];
	}
	unset($p);
	return array('pieces' => $pieces, 'tronque' => $tronque);
});
