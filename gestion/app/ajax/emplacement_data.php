<?php
// Tableau des emplacements (administrateur seulement). POST DataTables (serveur) + entreprise_id, type, statut (tous (défaut) | actifs | inactifs).
// Lignes : id, entreprise_id, entreprise, entreprise_actif, nom, type, code_barres, nb_pieces (pièces en stock), actif.
require_once __DIR__ . '/../action/utilisateur_lib.php';
Admin::exiger();
$in = $_POST + $_GET;
$where = array();
$params = array();
if (isset($in['entreprise_id']) && is_string($in['entreprise_id']) && preg_match('/^[0-9]{1,10}\z/', $in['entreprise_id'])) {
	$where[] = 'e.entreprise_id = :f_ent';
	$params[':f_ent'] = (int) $in['entreprise_id'];
}
if (isset($in['type']) && is_string($in['type']) && isset(TYPES_EMPLACEMENT_FR[$in['type']])) {
	$where[] = 'e.type = :f_type';
	$params[':f_type'] = $in['type'];
}
$statut = (isset($in['statut']) && is_string($in['statut'])) ? $in['statut'] : 'tous';
if ($statut === 'actifs') {
	$where[] = 'e.actif = 1';
} elseif ($statut === 'inactifs') {
	$where[] = 'e.actif = 0';
}
DataTable::repondre($pdo, array(
	'from' => 'emplacements e JOIN entreprises en ON en.id = e.entreprise_id',
	'colonnes' => array(
		'id' => 'e.id',
		'entreprise_id' => 'e.entreprise_id',
		'entreprise' => 'en.nom',
		'entreprise_actif' => 'en.actif',
		'nom' => 'e.nom',
		'type' => 'e.type',
		'code_barres' => "COALESCE(e.code_barres, '')",
		'nb_pieces' => '(SELECT COUNT(*) FROM stock s WHERE s.emplacement_id = e.id AND s.quantite > 0)',
		'actif' => 'e.actif',
	),
	// une seule expression de recherche : le même paramètre nommé ne peut pas être répété (requêtes natives)
	'recherche' => array("CONCAT_WS(' ', e.nom, en.nom, e.code_barres)"),
	'where' => $where,
	'params' => $params,
	'tri_defaut' => array('entreprise', 'asc'),
));
