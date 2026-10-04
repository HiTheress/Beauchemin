<?php
// Crée (ou remplace le mot de passe d') un compte administrateur.
// Usage : php database/create_admin.php <nom_utilisateur> <mot_de_passe>
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
if ($argc < 3 || strlen($argv[2]) < 8) { exit("Usage : php create_admin.php <utilisateur> <mot_de_passe (8+ caractères)>\n"); }

require __DIR__ . '/../app/config/config.php';
require __DIR__ . '/../app/database/connection.php';

$hash = password_hash($argv[2], PASSWORD_DEFAULT);
$st = $pdo->prepare("SELECT id FROM user WHERE username = :u");
$st->execute(array(':u' => $argv[1]));
if ($id = $st->fetchColumn()) {
	$pdo->prepare("UPDATE user SET password = :p, user_role = 'admin' WHERE id = :id")->execute(array(':p' => $hash, ':id' => $id));
	echo "Mot de passe mis à jour pour {$argv[1]}.\n";
} else {
	$pdo->prepare("INSERT INTO user (username, password, user_role) VALUES (:u, :p, 'admin')")->execute(array(':u' => $argv[1], ':p' => $hash));
	echo "Administrateur {$argv[1]} créé.\n";
}
