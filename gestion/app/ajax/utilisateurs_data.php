<?php
// Tableau des utilisateurs (administrateur seulement). POST DataTables (serveur) + statut : tous (défaut) | actifs | inactifs.
// Lignes : id, nom_utilisateur, nom_complet, role, entreprises, actif, derniere_connexion, verrouille (0/1), verrouille_jusqua, tentatives, soi (0/1).
// Aucun mot de passe (ni son empreinte) n'est jamais sélectionné.
require_once __DIR__ . '/../action/utilisateur_lib.php';
$acteur = Admin::exiger();
$in = $_POST + $_GET;
$statut = (isset($in['statut']) && is_string($in['statut'])) ? $in['statut'] : 'tous';
$where = array();
if ($statut === 'actifs') {
	$where[] = 'u.actif = 1';
} elseif ($statut === 'inactifs') {
	$where[] = 'u.actif = 0';
}
$entreprises = "IF(u.role = 'admin', 'Toutes (administrateur)', COALESCE((SELECT GROUP_CONCAT(en.nom ORDER BY en.id SEPARATOR ', ') FROM utilisateur_entreprises ue JOIN entreprises en ON en.id = ue.entreprise_id WHERE ue.utilisateur_id = u.id), ''))";
DataTable::repondre($pdo, array(
	'from' => 'utilisateurs u',
	'colonnes' => array(
		'id' => 'u.id',
		'nom_utilisateur' => 'u.nom_utilisateur',
		'nom_complet' => 'u.nom_complet',
		'role' => 'u.role',
		'entreprises' => $entreprises,
		'actif' => 'u.actif',
		'derniere_connexion' => 'u.derniere_connexion',
		'verrouille' => '(u.verrouille_jusqua IS NOT NULL AND u.verrouille_jusqua > NOW())',
		'verrouille_jusqua' => 'u.verrouille_jusqua',
		'tentatives' => 'u.tentatives_echec',
		'soi' => 'IF(u.id = ' . (int) $acteur . ', 1, 0)',
	),
	// une seule expression de recherche : le même paramètre nommé ne peut pas être répété (requêtes natives)
	'recherche' => array("CONCAT_WS(' ', u.nom_utilisateur, u.nom_complet, " . $entreprises . ')'),
	'where' => $where,
	'tri_defaut' => array('nom_utilisateur', 'asc'),
));
