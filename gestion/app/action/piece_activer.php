<?php
// Désactive ou réactive une pièce (gestionnaire+). POST JSON : id, actif (booléen EXPLICITE : true/false), confirmer (booléen), simuler (booléen).
// Désactiver une pièce qui a du stock sans confirmer : 400 {champ:'confirmation', erreur:<message montrant le stock restant>}.
// simuler : ne change rien ; répond 200 {confirmation_requise, message} (le message montre le stock restant) pour afficher la bonne confirmation.
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$d = entree();
	$id = Catalogue::entier(isset($d['id']) ? $d['id'] : 0);
	if (!$id) {
		throw new InventaireException('Pièce introuvable.');
	}
	$actif = Catalogue::booleenExplicite($d, 'actif', 'actif');
	return Catalogue::changerActif($id, $actif, !empty($d['confirmer']) && Catalogue::booleen($d['confirmer']), !empty($d['simuler']) && Catalogue::booleen($d['simuler']));
});
