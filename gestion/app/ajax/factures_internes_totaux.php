<?php
// Totaux du filtre de la liste des factures internes (HORS factures annulées). Gestionnaire+.
// GET/POST : mêmes filtres que factures_internes_data.php (annee, mois, sens, statut, q).
// Réponse : {ok:true, nb_valides, total (chaîne décimale, 2 décimales), nb_annulees}.
require_once __DIR__ . '/../action/facture_lib.php';
endpoint(function () {
	global $pdo;
	Interentreprise::exigerRole('rapport');
	list($where, $params) = Interentreprise::filtresListe(entree() + $_GET);
	$st = $pdo->prepare(
		"SELECT COUNT(CASE WHEN d.statut = 'valide' THEN 1 END) AS nb_valides,
		        COALESCE(SUM(CASE WHEN d.statut = 'valide' THEN d.total END), 0) AS total,
		        COUNT(CASE WHEN d.statut = 'annule' THEN 1 END) AS nb_annulees
		   FROM " . Interentreprise::FROM_LISTE . ' WHERE ' . implode(' AND ', $where)
	);
	$st->execute($params);
	$r = $st->fetch();
	return array(
		'nb_valides' => (int) $r['nb_valides'],
		'total' => Dec::fmt(Dec::parse($r['total'], Dec::TOTAL), Dec::TOTAL),
		'nb_annulees' => (int) $r['nb_annulees'],
	);
});
