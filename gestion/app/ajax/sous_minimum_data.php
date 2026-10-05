<?php
// Pièces sous le minimum (service Inventaire::sousMinimum). Employé+. GET (ou POST) : entreprise_id (facultatif ; 403 si non permise),
// sinon l'entreprise choisie dans la barre du haut, sinon toutes celles de l'utilisateur.
// Réponse : {ok:true, entreprises:[noms], peut_receptionner:bool, lignes:[{entreprise_id, entreprise, piece_id, code, nom, unite,
//   minimum, quantite, manque[, emplacement_reception_id]}]}  (quantités en chaînes décimales ; du plus grand manque au plus petit).
// Aucun coût. emplacement_reception_id (gestionnaire+ seulement) = entrepôt actif de l'entreprise, pour préremplir la réception.
require_once __DIR__ . '/stock_lib.php';
Suivi::executer(function ($ctx) {
	$req = Suivi::requete();
	$demande = Suivi::entier($req, 'entreprise_id', 'Entreprise');
	$ids = Suivi::entreprises($ctx, $demande !== null ? $demande : (entreprise_courante() ?: null));
	$noms = array();
	foreach (inventaire()->listeEntreprises($ctx['uid']) as $en) {
		if (in_array((int) $en['id'], $ids, true)) {
			$noms[] = $en['nom'];
		}
	}
	return array(
		'entreprises' => $noms,
		'peut_receptionner' => $ctx['role'] !== 'employe',
		'lignes' => Suivi::sousMinimum($ctx, $ids),
	);
});
