<?php
// Tableau des entreprises (administrateur seulement). POST DataTables (serveur) + statut : tous (défaut) | actifs | inactifs.
// Lignes : id, code, nom, adresse, nb_emplacements, nb_pieces (pièces en stock), nb_utilisateurs, actif.
require_once __DIR__ . '/../action/utilisateur_lib.php';
Admin::exiger();
$in = $_POST + $_GET;
$statut = (isset($in['statut']) && is_string($in['statut'])) ? $in['statut'] : 'tous';
$where = array();
if ($statut === 'actifs') {
	$where[] = 'en.actif = 1';
} elseif ($statut === 'inactifs') {
	$where[] = 'en.actif = 0';
}
DataTable::repondre($pdo, array(
	'from' => 'entreprises en',
	'colonnes' => array(
		'id' => 'en.id',
		'code' => 'en.code',
		'nom' => 'en.nom',
		'adresse' => "COALESCE(en.adresse, '')",
		'nb_emplacements' => '(SELECT COUNT(*) FROM emplacements em WHERE em.entreprise_id = en.id AND em.actif = 1)',
		'nb_pieces' => '(SELECT COUNT(DISTINCT s.piece_id) FROM stock s JOIN emplacements em ON em.id = s.emplacement_id WHERE em.entreprise_id = en.id AND s.quantite > 0)',
		'nb_utilisateurs' => "((SELECT COUNT(*) FROM utilisateur_entreprises ue JOIN utilisateurs u ON u.id = ue.utilisateur_id WHERE ue.entreprise_id = en.id AND u.actif = 1 AND u.role <> 'admin') + (SELECT COUNT(*) FROM utilisateurs a WHERE a.role = 'admin' AND a.actif = 1))",
		'actif' => 'en.actif',
	),
	// une seule expression de recherche : le même paramètre nommé ne peut pas être répété (requêtes natives)
	'recherche' => array("CONCAT_WS(' ', en.code, en.nom, en.adresse)"),
	'where' => $where,
	'tri_defaut' => array('id', 'asc'),
));
