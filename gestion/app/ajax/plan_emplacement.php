<?php
// Contenu d'une tuile (tiroir du plan) : pièces de l'emplacement, triées par nom.
// GET ou POST : emplacement_id, q? (chaque mot doit se trouver dans le code, le nom ou un code-barres de la pièce).
// Réponse : {ok, emplacement:{id, nom, code, type, type_libelle, entreprise_*}, nb_pieces, unites,
//            geometrie:{allees, etageres, niveaux}, geometrie_defaut, geometrie_limites, geometrie_personnalisee, peut_ranger, nb_a_ranger,
//            lignes:[{piece_id, code, nom, unite, actif, quantite, bas, rangement:{allee, etagere, niveau}|null}], tronque}
// `rangement` = où la pièce est rangée dans cet emplacement (null = « à ranger »). Cube : allée 1 = côté gauche, allée 2 = côté droit ; niveau 1 = tablette la plus basse.
// Employé+. 403 si l'emplacement n'existe pas, est désactivé ou appartient à une entreprise inaccessible (même réponse). Aucun coût ni valeur.
require_once __DIR__ . '/plan_lib.php';
PlanHttp::executer(function ($plan, $uid) {
	$in = PlanHttp::requete();
	$id = PlanHttp::entier($in, 'emplacement_id', 'Emplacement');
	if ($id === null) {
		throw new InventaireException('Emplacement invalide.', 'emplacement_id');
	}
	return $plan->contenu($uid, $id, isset($in['q']) && is_string($in['q']) ? $in['q'] : '');
});
