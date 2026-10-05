<?php
// Résout un code scanné (code interne, alias fabricant/fournisseur ou code d'emplacement).
// GET/POST : code.
// Réponse : {ok:true, trouve:false}
//        ou {ok:true, trouve:true, type:'piece', piece:{id, code, nom, unite, categorie, codes[], stock[], totaux[], (prix_fournisseurs[] si gestionnaire)}}
//        ou {ok:true, trouve:true, type:'emplacement', emplacement:{id, nom, type, entreprise_id, entreprise_nom}}
require_once '../init.php';
endpoint(function () {
	$in = $_GET + entree();
	$r = inventaire()->trouverParCode(utilisateur_id(), (isset($in['code']) && is_string($in['code'])) ? $in['code'] : '');
	if ($r === null) {
		return array('trouve' => false);
	}
	return array('trouve' => true) + $r;
});
