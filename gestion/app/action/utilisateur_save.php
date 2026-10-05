<?php
// Crée ou modifie un utilisateur (administrateur seulement). POST JSON :
//   id? (absent = création), nom_utilisateur, nom_complet, role (admin|gestionnaire|employe), actif?, entreprise_ids[], mot_de_passe (création seulement).
// Garde-fous côté serveur : voir AdminUtilisateur::modifier. Le mot de passe n'est ni journalisé ni renvoyé.
require_once __DIR__ . '/utilisateur_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	$id = Admin::idFacultatif($d);
	if ($id) {
		unset($d['mot_de_passe']);      // le mot de passe d'un compte existant se change par « Réinitialiser le mot de passe »
		return AdminUtilisateur::modifier($acteur, $id, $d);
	}
	return AdminUtilisateur::creer($acteur, $d);
});
