<?php
// Désactive ou réactive une pièce (gestionnaire+). POST JSON : id, actif (booléen), confirmer (booléen).
// Désactiver une pièce qui a du stock sans confirmer : 400 {champ:'confirmation', erreur:<message montrant le stock restant>}.
// simuler (booléen) : ne change rien, applique seulement la même vérification (pour afficher la bonne confirmation).
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$d = entree();
	$id = Catalogue::entier(isset($d['id']) ? $d['id'] : 0);
	if (!$id) {
		throw new InventaireException('Pièce introuvable.');
	}
	return Catalogue::changerActif($id, !empty($d['actif']) && Catalogue::booleen($d['actif']), !empty($d['confirmer']) && Catalogue::booleen($d['confirmer']), !empty($d['simuler']) && Catalogue::booleen($d['simuler']));
});
