<?php
// Crée ou modifie un emplacement (administrateur seulement). POST JSON : id? (absent = création), entreprise_id, nom (unique dans l'entreprise),
// type (entrepot|boutique|cube), code_barres (vide à la création = proposé automatiquement ; unique dans tout le système), actif?.
// Refusé : changer l'entreprise d'un emplacement qui a déjà des mouvements, du stock ou des comptages.
require_once __DIR__ . '/emplacement_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	return AdminEmplacement::enregistrer($acteur, Admin::idFacultatif($d), $d);
});
