<?php
// Range automatiquement les pièces qui ont du stock dans un emplacement mais pas de position : dans l'ordre des codes, positions libres remplies dans l'ordre
// allée, étagère, niveau, trois pièces au plus par position. Gestionnaire ou administrateur ayant accès à l'entreprise (403 sinon). POST JSON : {emplacement_id}
// Journal : plan.rangement_auto. Réponse : {ok, nb, restantes} (restantes = pièces encore « à ranger » faute de place).
require_once __DIR__ . '/../ajax/plan_lib.php';
exiger_post();
PlanHttp::executer(function ($plan, $uid) {
	$d = entree();
	return $plan->rangerAuto($uid, isset($d['emplacement_id']) ? $d['emplacement_id'] : null);
});
