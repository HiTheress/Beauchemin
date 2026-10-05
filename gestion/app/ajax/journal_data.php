<?php
// Tableau du journal d'activité (administrateur seulement). POST DataTables (serveur) + filtres :
//   utilisateur_id (n° ou « aucun »), action, entite, du, au (AAAA-MM-JJ). Le plus récent d'abord.
// Lignes : id, date, utilisateur, action (code), action_fr (HTML), element (HTML), details (HTML lisible : jamais de JSON brut), ip.
require_once __DIR__ . '/journal_lib.php';
Admin::exiger();
try {
	list($where, $params) = JournalFr::filtres($_POST + $_GET);
} catch (InventaireException $ex) {
	json_fail($ex->getMessage(), 400, $ex->champ ? array('champ' => $ex->champ) : array());
}
DataTable::repondre($pdo, array(
	'from' => 'journal j LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id',
	'colonnes' => array(
		'id' => 'j.id',
		'date' => 'j.date_action',
		'utilisateur' => "COALESCE(u.nom_utilisateur, '')",
		'action' => 'j.action',
		'entite' => "COALESCE(j.entite, '')",
		'entite_id' => 'j.entite_id',
		'details' => 'j.details',
		'ip' => "COALESCE(j.ip, '')",
	),
	// une seule expression de recherche : le même paramètre nommé ne peut pas être répété (requêtes natives)
	'recherche' => array("CONCAT_WS(' ', j.action, u.nom_utilisateur, j.entite, j.details, j.ip)"),
	'where' => $where,
	'params' => $params,
	'tri_defaut' => array('id', 'desc'),
	'brut' => array('action_fr', 'element', 'details'),
	'formateurs' => array(
		'action_fr' => function ($l) { return e(JournalFr::action($l['action'])); },
		'element' => function ($l) { return JournalFr::elementHtml($l['entite'], $l['entite_id']); },
		'details' => function ($l) { return JournalFr::detailsHtml($l['details']); },
	),
));
