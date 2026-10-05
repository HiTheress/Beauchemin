<?php
// Déverrouille un compte bloqué après trop d'échecs de connexion (administrateur seulement). POST JSON : id.
require_once __DIR__ . '/utilisateur_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	return AdminUtilisateur::deverrouiller($acteur, Admin::entier(isset($d['id']) ? $d['id'] : null, 'Utilisateur invalide.'));
});
