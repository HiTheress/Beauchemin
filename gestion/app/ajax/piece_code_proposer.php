<?php
// Propose le prochain code interne libre (P-0015…). Gestionnaire+. Réponse : {code}.
require_once __DIR__ . '/../action/piece_lib.php';
endpoint(function () {
	inventaire()->exiger(utilisateur_id(), 'catalogue');
	return array('code' => Catalogue::proposerCode());
});
