#!/usr/bin/env bash
# Secours : déverrouille un compte (et, si on le demande, change son mot de passe) quand même l'administrateur est bloqué.
#   tools/deverrouiller.sh <nom_utilisateur>                 remet à zéro les échecs et lève le verrou
#   tools/deverrouiller.sh <nom_utilisateur> <mot_de_passe>  idem + nouveau mot de passe (10 caractères ou plus) ; ferme les sessions ouvertes
# À exécuter sur le serveur, par la personne qui administre la machine.
set -euo pipefail
cd "$(dirname "$0")/.."
U="${1:?Usage: $0 <nom_utilisateur> [nouveau_mot_de_passe]}"
export BEA_USER="$U" BEA_PASS="${2:-}"
php -r '
require "app/config/config.php"; require "app/database/connection.php";
$u = getenv("BEA_USER"); $p = getenv("BEA_PASS");
$st = $pdo->prepare("SELECT id FROM utilisateurs WHERE nom_utilisateur = ?"); $st->execute(array($u)); $id = $st->fetchColumn();
if (!$id) { fwrite(STDERR, "Compte introuvable : $u\n"); exit(1); }
$pdo->prepare("UPDATE utilisateurs SET tentatives_echec = 0, verrouille_jusqua = NULL WHERE id = ?")->execute(array($id));
// lève aussi le refus par adresse : on note la remise à zéro dans le journal (les échecs antérieurs ne comptent plus)
$pdo->prepare("INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, details) VALUES (NOW(), NULL, \"utilisateur.deverrouille\", \"utilisateurs\", ?, ?)")->execute(array($id, json_encode(array("nom_utilisateur" => $u, "via" => "tools/deverrouiller.sh"))));
if ($p !== "") {
	if (strlen($p) < 10) { fwrite(STDERR, "Mot de passe trop court (10 caractères minimum).\n"); exit(1); }
	$pdo->prepare("UPDATE utilisateurs SET mot_de_passe = ?, mdp_version = mdp_version + 1 WHERE id = ?")->execute(array(password_hash($p, PASSWORD_DEFAULT), $id));
	echo "Mot de passe changé et sessions ouvertes fermées pour $u.\n";
}
echo "Compte $u déverrouillé.\n";
'
