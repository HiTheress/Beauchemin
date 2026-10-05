<?php
// Annule un comptage en cours (le stock n'est pas touché). POST : id.
// Employé+ ; droit sur l'entreprise du comptage vérifié par le service. Réponse : {ok:true}
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	$d = entree();
	$id = ScanLib::entier(isset($d['id']) ? $d['id'] : null, 'Comptage invalide.', 'id');
	ScanLib::comptageAccessible($id);   // introuvable = même message qu'un comptage d'une autre entreprise
	inventaire()->comptageAnnuler(utilisateur_id(), $id);
	Journal::ecrire($pdo, utilisateur_id(), 'comptage.annule', 'comptages', $id);
	return array();
});
