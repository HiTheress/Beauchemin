<?php
// Jeton de version du plan (temps réel) : la page l'interroge toutes les 4 secondes et recharge plan_data.php quand il change.
// Une requête SQL indexée, limitée aux entreprises de l'utilisateur ; la session est relâchée tout de suite (aucun verrou entre deux interrogations).
// Réponse : {ok, version:"<dernier mouvement>-<nb emplacements>-<empreinte>"}. Employé+.
require_once __DIR__ . '/plan_lib.php';
PlanHttp::executer(function ($plan, $uid) {
	global $Ouser;
	if (!$Ouser->aRole('employe')) {
		throw new PlanRefus('Vous n\'avez pas la permission d\'effectuer cette opération.');
	}
	$ents = $Ouser->entreprisesConsultables();    // déjà lues par le contrôle de connexion de init.php : aucune requête de plus
	session_write_close();
	return array('version' => $plan->versionPour($ents));
});
