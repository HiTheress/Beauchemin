<?php
// Enregistre la place des tuiles du plan (administrateur seulement ; 403 pour tout autre rôle). POST JSON :
// positions:[{emplacement_id, x, y, largeur, hauteur}] — entiers multiples de 20, dans le plan (1600 x 1200), taille 140 x 100 à 600 x 400.
// Tout ou rien : une seule position invalide et rien n'est écrit. Journal : plan.disposition. Réponse : {ok, modifies}.
require_once __DIR__ . '/../ajax/plan_lib.php';
exiger_post();
PlanHttp::executer(function ($plan, $uid) {
	$d = entree();
	return $plan->enregistrer($uid, isset($d['positions']) ? $d['positions'] : null);
});
