<?php
// Mémorise l'entreprise active (barre du haut). id = 0 : toutes celles auxquelles l'utilisateur a accès.
require_once '../init.php';
exiger_post();
$id = (int) (entree()['entreprise_id'] ?? 0);
if ($id !== 0 && !$Ouser->peutAcces($id)) {
	json_fail("Vous n'avez pas accès à cette entreprise.", 403);
}
$_SESSION['entreprise_id'] = $id;
json_ok(array('entreprise_id' => $id));
