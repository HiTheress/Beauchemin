<?php
// Liste des catégories avec le nombre de pièces (toutes, même désactivées). Tous les rôles (filtre de la liste des pièces).
// Réponse : {categories:[{id, nom, description, nb_pieces}]} (valeurs brutes : le JS échappe).
require_once '../init.php';
endpoint(function () {
	global $pdo;
	inventaire()->exiger(utilisateur_id(), 'consulter');
	$rows = $pdo->query(
		'SELECT c.id, c.nom, c.description, COUNT(p.id) AS nb_pieces FROM categories c LEFT JOIN pieces p ON p.categorie_id = c.id GROUP BY c.id ORDER BY c.nom'
	)->fetchAll();
	foreach ($rows as &$r) {
		$r['id'] = (int) $r['id'];
		$r['nb_pieces'] = (int) $r['nb_pieces'];
	}
	unset($r);
	return array('categories' => $rows);
});
