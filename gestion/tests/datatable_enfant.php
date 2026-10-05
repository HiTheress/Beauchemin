<?php
// Sous-processus du test DataTable : reçoit les paramètres en JSON (argv[1]) et appelle DataTable::repondre (qui termine le script).
require __DIR__ . '/bootstrap.php';
global $pdo;
$_POST = unserialize(base64_decode($argv[1]), array('allowed_classes' => false));
DataTable::repondre($pdo, array(
	'from' => 'pieces p LEFT JOIN categories c ON c.id = p.categorie_id',
	'colonnes' => array('id' => 'p.id', 'code' => 'p.code', 'nom' => 'p.nom', 'categorie' => 'c.nom'),
	'recherche' => array('p.code', 'p.nom', 'c.nom'),
	'where' => array('p.actif = :actif', "p.code LIKE 'DT-%'"),
	'params' => array(':actif' => 1),
	'tri_defaut' => array('code', 'asc'),
	'formateurs' => array('lien' => function ($l) { return '<a>' . e($l['nom']) . '</a>'; }),
));
