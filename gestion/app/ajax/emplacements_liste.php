<?php
// Emplacements pour les listes déroulantes.
//   (sans paramètre)           : emplacements actifs des entreprises auxquelles l'utilisateur a accès
//   ?inactifs=1                : y compris les désactivés
//   ?destination_entreprise=ID : emplacements actifs de CETTE entreprise (destination d'une facture interne ; gestionnaire+)
//   ?entreprises_destination=1 : toutes les entreprises actives (destination d'une facture interne ; gestionnaire+)
// Réponse : {ok:true, emplacements:[{id, nom, type, code_barres, entreprise_id, entreprise_nom, entreprise_code}]} ou {entreprises:[{id,code,nom}]}
require_once '../init.php';
endpoint(function () {
	$in = $_GET + entree();
	$inv = inventaire();
	if (!empty($in['entreprises_destination'])) {
		return array('entreprises' => $inv->entreprisesDestination(utilisateur_id()));
	}
	if (!empty($in['destination_entreprise'])) {
		return array('emplacements' => $inv->emplacementsDestination(utilisateur_id(), (int) $in['destination_entreprise']));
	}
	return array('emplacements' => $inv->listeEmplacements(utilisateur_id(), !empty($in['inactifs'])));
});
