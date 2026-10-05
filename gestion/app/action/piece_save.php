<?php
// Crée ou modifie une pièce (gestionnaire+). POST JSON : id? code nom description categorie_id unite actif? codes[{code,type}] seuils[{entreprise_id,minimum}] confirmer_desactivation?
// Réponse : {ok:true, id, code, cree}. Erreur de validation : 400 {ok:false, erreur, champ}.
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	return Catalogue::enregistrerPiece(entree());
});
