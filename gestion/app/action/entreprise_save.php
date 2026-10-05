<?php
// Crée ou modifie une entreprise (administrateur seulement). POST JSON : id? (absent = création), code (unique, 10 caractères au plus), nom, adresse, actif?.
// Pas de suppression. Changer « actif » suit les règles de entreprise_activer.php.
require_once __DIR__ . '/entreprise_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	return AdminEntreprise::enregistrer($acteur, Admin::idFacultatif($d), $d);
});
