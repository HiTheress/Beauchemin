<?php
// Tableau serveur (DataTables) des factures internes dont une entreprise de l'utilisateur (filtre de la barre du haut inclus)
// est émettrice OU destinataire. Gestionnaire+ (les montants sont des coûts).
// POST : paramètres DataTables + annee (AAAA), mois (1-12), sens ('emises'|'recues'), statut ('valide'|'annule'), q (recherche :
// numéro, note, emplacements).
// Colonnes (alias) : numero, date, parties, emplacements, total, statut — doivent correspondre à columns[].data côté JS.
require_once __DIR__ . '/../action/facture_lib.php';
endpoint(function () {
	global $pdo;
	Interentreprise::exigerRole('rapport');
	list($where, $params) = Interentreprise::filtresListe(entree() + $_GET);

	$formateurs = array(
		'numero' => function ($l) {
			return '<a class="code font-weight-bold" href="index.php?page=facture_interne_voir&amp;id=' . (int) $l['id'] . '">' . e($l['numero']) . '</a>';
		},
		'date' => function ($l) {
			return e(fmt_date($l['date']));
		},
		'parties' => function ($l) {
			return e($l['parties']) . ' <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> ' . e($l['entreprise_dest']);
		},
		'emplacements' => function ($l) {
			return e($l['emplacements']) . ' <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> ' . e($l['emplacement_dest']);
		},
		'total' => function ($l) {
			return e(Interentreprise::argent($l['total']));
		},
		'statut' => function ($l) {
			return $l['statut'] === 'annule'
				? '<span class="badge badge-danger">ANNULÉE</span>'
				: '<span class="badge badge-success">Valide</span>';
		},
	);

	DataTable::repondre($pdo, array(
		'from' => Interentreprise::FROM_LISTE,
		'colonnes' => array(
			// tri de départ : date décroissante, puis la plus récemment saisie (clé croissante = date et id décroissants)
			'ordre' => '(0 - (TO_DAYS(d.date_document) * 10000000 + CAST(d.id AS SIGNED)))',
			'id' => 'd.id',
			'numero' => 'd.numero',
			'date' => 'd.date_document',
			'parties' => 'en.nom',
			'entreprise_dest' => 'end_.nom',
			'emplacements' => 'e.nom',
			'emplacement_dest' => 'ed.nom',
			'total' => 'd.total',
			'statut' => 'd.statut',
		),
		'where' => $where,           // la recherche (q) est déjà dans les conditions : DataTable ne refiltre pas
		'params' => $params,
		'tri_defaut' => array('ordre', 'asc'),
		'formateurs' => $formateurs,
	));
});
