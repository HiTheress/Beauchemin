<?php
// Désactive ou réactive une entreprise (administrateur seulement). POST JSON : id, actif (booléen).
// Désactiver est refusé s'il reste du stock dans ses emplacements, si un comptage y est en cours, ou si c'est la dernière entreprise active.
// Une entreprise désactivée disparaît des listes de saisie ; son historique est conservé.
require_once __DIR__ . '/entreprise_lib.php';
exiger_post();
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	$d = entree();
	$id = Admin::entier(isset($d['id']) ? $d['id'] : null, 'Entreprise invalide.');
	if (!array_key_exists('actif', $d)) {
		throw new InventaireException('Indiquez s\'il faut activer ou désactiver l\'entreprise.', 'actif');
	}
	return AdminEntreprise::definirActif($acteur, $id, Admin::booleen($d['actif']));
});
