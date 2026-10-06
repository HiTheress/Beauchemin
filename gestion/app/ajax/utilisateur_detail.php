<?php
// Fiche d'un utilisateur pour le formulaire de modification (administrateur). GET : id.
// Réponse : {utilisateur:{id, nom_utilisateur, nom_complet, role, actif, verrouille, tentatives, verrouille_jusqua, derniere_connexion, entreprise_ids[], empreinte, soi}}
// (valeurs brutes : le JavaScript les place dans des champs, jamais dans du HTML). Jamais de mot de passe.
require_once __DIR__ . '/../action/utilisateur_lib.php';
$acteur = Admin::exiger();
endpoint(function () use ($acteur) {
	global $pdo;
	$in = $_GET + entree();
	$id = Admin::entier(isset($in['id']) ? $in['id'] : null, 'Utilisateur invalide.');
	$st = $pdo->prepare('SELECT id, nom_utilisateur, nom_complet, role, actif, tentatives_echec, verrouille_jusqua, derniere_connexion, (verrouille_jusqua IS NOT NULL AND verrouille_jusqua > NOW()) AS verrouille FROM utilisateurs WHERE id = ?');
	$st->execute(array($id));
	$u = $st->fetch();
	if (!$u) {
		throw new InventaireException('Utilisateur introuvable.');
	}
	$st = $pdo->prepare('SELECT entreprise_id FROM utilisateur_entreprises WHERE utilisateur_id = ? ORDER BY entreprise_id');
	$st->execute(array($id));
	$ent = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
	return array('utilisateur' => array(
		'id' => (int) $u['id'],
		'nom_utilisateur' => $u['nom_utilisateur'],
		'nom_complet' => $u['nom_complet'],
		'role' => $u['role'],
		'actif' => (bool) $u['actif'],
		'verrouille' => (bool) $u['verrouille'],
		'tentatives' => (int) $u['tentatives_echec'],
		'verrouille_jusqua' => $u['verrouille_jusqua'],
		'derniere_connexion' => $u['derniere_connexion'],
		'entreprise_ids' => $ent,
		'empreinte' => AdminUtilisateur::empreinte($u, $ent),      // version de la fiche : renvoyée à l'enregistrement pour détecter une modification simultanée
		'soi' => ((int) $u['id'] === (int) $acteur),
	));
});
