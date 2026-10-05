<?php
// Désactive ou réactive un compte (administrateur seulement). POST JSON : id, actif (booléen).
// Refusé : se désactiver soi-même ; désactiver le dernier administrateur actif. Une désactivation coupe la session ouverte au plus tard à la requête suivante.
require_once __DIR__ . '/utilisateur_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	$id = Admin::entier(isset($d['id']) ? $d['id'] : null, 'Utilisateur invalide.');
	if (!array_key_exists('actif', $d)) {
		throw new InventaireException('Indiquez s\'il faut activer ou désactiver le compte.', 'actif');
	}
	return AdminUtilisateur::modifier($acteur, $id, array('actif' => $d['actif']));
});
