<?php
// Pose, modifie ou retire la position (allée, étagère, niveau) d'une pièce dans un emplacement du plan. Gestionnaire ou administrateur ayant accès à l'entreprise
// de l'emplacement (403 pour un employé, un emplacement inconnu, désactivé ou d'une autre entreprise : même réponse). POST JSON :
//   {emplacement_id, piece_id, allee, etagere, niveau}   ou   {emplacement_id, piece_id, retirer: true}
// Entiers dans les rayonnages de l'emplacement ; pièce existante et active pour poser. Le stock ne change jamais. Journal : plan.rangement.
// Réponse : {ok, rangement:{allee, etagere, niveau}|null}.
require_once __DIR__ . '/../ajax/plan_lib.php';
exiger_post();
PlanHttp::executer(function ($plan, $uid) {
	return $plan->enregistrerRangement($uid, entree());
});
