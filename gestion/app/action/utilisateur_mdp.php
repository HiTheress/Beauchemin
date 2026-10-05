<?php
// Réinitialise le mot de passe d'un utilisateur (administrateur seulement) et déverrouille son compte.
// POST JSON : id, mot_de_passe (au moins 10 caractères ; généré par le navigateur ou saisi). Rien du mot de passe n'est journalisé ni renvoyé.
require_once __DIR__ . '/utilisateur_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	$id = Admin::entier(isset($d['id']) ? $d['id'] : null, 'Utilisateur invalide.');
	return AdminUtilisateur::reinitialiserMotDePasse($acteur, $id, isset($d['mot_de_passe']) ? $d['mot_de_passe'] : null);
});
