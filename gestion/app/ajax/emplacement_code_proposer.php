<?php
// Propose le prochain code-barres d'emplacement libre (EMP-######, séquentiel). Administrateur seulement. Lecture seule : rien n'est réservé.
// Réponse : {code:"EMP-000006"}
require_once __DIR__ . '/../action/emplacement_lib.php';
Admin::exiger();
endpoint(function () {
	return array('code' => AdminEmplacement::prochainCode());
});
