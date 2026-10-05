<?php
// Crée un comptage d'inventaire (brouillon) pour un emplacement. POST : emplacement_id, note?.
// Employé+ ; l'emplacement doit appartenir à une entreprise de l'utilisateur (vérifié ici et par le service).
// Réponse : {ok:true, id, numero}. S'il y a déjà un comptage en cours à cet emplacement : 400 avec le message du service
// et {existant:{id, numero}} pour que l'écran propose de le reprendre.
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	$d = entree();
	$uid = utilisateur_id();
	$id = ScanLib::entier(isset($d['emplacement_id']) ? $d['emplacement_id'] : null, 'Choisissez un emplacement.', 'emplacement_id');
	ScanLib::emplacementAccessible($id);   // même refus pour « n'existe pas » et « autre entreprise »
	try {
		return inventaire()->creerComptage($uid, $id, isset($d['note']) ? ScanLib::texte($d['note'], 255) : null);
	} catch (InventaireException $ex) {
		$existant = ScanLib::comptageOuvert($id);
		if ($existant && $ex->champ === 'emplacement_id') {
			json_fail($ex->getMessage(), 400, array('champ' => 'emplacement_id', 'existant' => $existant));
		}
		throw $ex;
	}
});
