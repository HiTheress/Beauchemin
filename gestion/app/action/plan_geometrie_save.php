<?php
// Règle les rayonnages d'un emplacement : administrateur seulement (403 sinon). POST JSON :
//   {emplacement_id, allees, etageres, niveaux}   ou   {emplacement_id, defaut: true}  (retour aux valeurs du type d'emplacement)
// Bornes : 1 à 12 allées (un cube : 2 au plus), 1 à 30 étagères, 1 à 10 niveaux. Les pièces rangées au-delà des nouvelles dimensions redeviennent « à ranger ».
// Journal : plan.geometrie. Réponse : {ok, geometrie:{allees, etageres, niveaux}, personnalisee, retires}.
require_once __DIR__ . '/../ajax/plan_lib.php';
exiger_post();
PlanHttp::executer(function ($plan, $uid) {
	return $plan->enregistrerGeometrie($uid, entree());
});
