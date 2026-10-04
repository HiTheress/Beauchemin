<?php
// Crée (ou réinitialise le mot de passe d') un compte administrateur.
// Usage : php database/create_admin.php <nom_utilisateur> <mot_de_passe (8+ caractères)> ["Nom complet"]
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
if ($argc < 3 || strlen($argv[2]) < 8) { exit("Usage : php database/create_admin.php <utilisateur> <mot_de_passe (8+ caractères)> [\"Nom complet\"]\n"); }

require __DIR__ . '/../app/config/config.php';
require __DIR__ . '/../app/database/connection.php';

$hash = password_hash($argv[2], PASSWORD_DEFAULT);
$complet = isset($argv[3]) ? $argv[3] : $argv[1];
$st = $pdo->prepare("SELECT id FROM utilisateurs WHERE nom_utilisateur = ?");
$st->execute(array($argv[1]));
if ($id = $st->fetchColumn()) {
	$pdo->prepare("UPDATE utilisateurs SET mot_de_passe = ?, role = 'admin', actif = 1, tentatives_echec = 0, verrouille_jusqua = NULL WHERE id = ?")->execute(array($hash, $id));
	echo "Mot de passe mis à jour pour {$argv[1]} (administrateur).\n";
} else {
	$pdo->prepare("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES (?, ?, ?, 'admin')")->execute(array($argv[1], $complet, $hash));
	echo "Administrateur {$argv[1]} créé.\n";
}
