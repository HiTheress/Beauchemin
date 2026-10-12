<?php
// Plan de l'entrepôt : une tuile par emplacement actif des entreprises que l'utilisateur peut consulter (mêmes entreprises que la page Stock).
// GET ou POST : piece_id? (« où est cette pièce ? » : ajoute `recherche` = quantité de la pièce dans chaque emplacement).
// Réponse : {ok, version, admin, zone, resume:{unites, nb_bas, nb_emplacements}, tuiles:[{id, nom, code, type, type_libelle, entreprise_id, entreprise_code, entreprise_nom,
//            nb_pieces, unites, nb_bas, sig, pos:{x,y,largeur,hauteur}|null}], recherche:{piece, emplacements:[{emplacement_id, quantite}], somme}|null}
// Employé+. Aucun coût, prix ni valeur, pour aucun rôle : les quantités sont des chaînes décimales (« unites », « nb_pieces »).
require_once __DIR__ . '/plan_lib.php';
PlanHttp::executer(function ($plan, $uid) {
	return $plan->donnees($uid, PlanHttp::entier(PlanHttp::requete(), 'piece_id', 'Pièce'));
});
