<?php
// Désactive ou réactive un emplacement (administrateur seulement). POST JSON : id, actif (booléen).
// Désactiver est refusé s'il reste du stock (le message donne le nombre de pièces) ou si un comptage est en cours.
require_once __DIR__ . '/emplacement_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	$id = Admin::entier(isset($d['id']) ? $d['id'] : null, 'Emplacement invalide.');
	if (!array_key_exists('actif', $d)) {
		throw new InventaireException('Indiquez s\'il faut activer ou désactiver l\'emplacement.', 'actif');
	}
	return AdminEmplacement::definirActif($acteur, $id, Admin::booleen($d['actif']));
});
