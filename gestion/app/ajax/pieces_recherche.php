<?php
// Recherche rapide de pièces (auto-complétion). GET/POST : q (mots séparés par des espaces), limite (1-50, défaut 20).
// Réponse : {ok:true, pieces:[{id, code, nom, unite}]}
require_once '../init.php';
endpoint(function () {
	$in = $_GET + entree();
	$q = (isset($in['q']) && is_string($in['q'])) ? $in['q'] : '';
	return array('pieces' => inventaire()->piecesRecherche(utilisateur_id(), $q, (isset($in['limite']) && is_scalar($in['limite'])) ? (int) $in['limite'] : 20));
});
