<?php
// Fiche d'une entreprise pour le formulaire de modification (administrateur). GET : id.
// Réponse : {entreprise:{id, code, nom, adresse, actif}} (valeurs brutes : le JavaScript les place dans des champs).
require_once __DIR__ . '/../action/utilisateur_lib.php';
Admin::exiger();
endpoint(function () {
	global $pdo;
	$in = $_GET + entree();
	$id = Admin::entier(isset($in['id']) ? $in['id'] : null, 'Entreprise invalide.');
	$st = $pdo->prepare('SELECT id, code, nom, adresse, actif FROM entreprises WHERE id = ?');
	$st->execute(array($id));
	$e = $st->fetch();
	if (!$e) {
		throw new InventaireException('Entreprise introuvable.');
	}
	return array('entreprise' => array('id' => (int) $e['id'], 'code' => $e['code'], 'nom' => $e['nom'], 'adresse' => (string) $e['adresse'], 'actif' => (bool) $e['actif']));
});
