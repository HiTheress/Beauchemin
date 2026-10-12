<?php
// Contenu d'une tuile (tiroir du plan) : pièces de l'emplacement, triées par nom.
// GET ou POST : emplacement_id, q? (chaque mot doit se trouver dans le code, le nom ou un code-barres de la pièce).
// Réponse : {ok, emplacement:{id, nom, code, type, type_libelle, entreprise_*}, nb_pieces, unites, lignes:[{piece_id, code, nom, unite, actif, quantite, bas}], tronque}
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
