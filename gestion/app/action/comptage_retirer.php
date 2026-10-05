<?php
// Retire une pièce d'un comptage en cours (elle ne sera plus comptée). POST : id (comptage), piece_id.
// Employé+ ; droit sur l'entreprise du comptage vérifié par le service. Réponse : {ok:true}
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	$d = entree();
	$id = ScanLib::entier(isset($d['id']) ? $d['id'] : null, 'Comptage invalide.', 'id');
	$pieceId = ScanLib::entier(isset($d['piece_id']) ? $d['piece_id'] : null, 'Pièce invalide.', 'piece_id');
	ScanLib::comptageAccessible($id);   // introuvable = même message qu'un comptage d'une autre entreprise
	inventaire()->comptageRetirer(utilisateur_id(), $id, $pieceId);
	return array();
});
