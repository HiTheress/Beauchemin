<?php
// Applique un comptage : crée UN document d'ajustement avec les écarts (compté - stock actuel au moment de l'application).
// POST : id, zero_non_scannees (true : les pièces en stock mais non scannées passent à 0).
// Gestionnaire+ (le rôle et l'entreprise sont vérifiés par le service ; un employé reçoit un refus en français).
// Réponse : {ok:true, document_id|null, numero|null, ecarts:int}   (aucun écart : aucun document créé)
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	$d = entree();
	$id = ScanLib::entier(isset($d['id']) ? $d['id'] : null, 'Comptage invalide.', 'id');
	$zero = isset($d['zero_non_scannees']) && ScanLib::booleen($d['zero_non_scannees']);
	$r = inventaire()->comptageAppliquer(utilisateur_id(), $id, $zero);
	Journal::ecrire($pdo, utilisateur_id(), 'comptage.applique', 'comptages', $id, array(
		'document_id' => $r['document_id'], 'numero' => $r['numero'], 'ecarts' => $r['ecarts'], 'non_scannees_a_zero' => $zero,
	));
	return $r;
});
