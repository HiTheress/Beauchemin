#!/usr/bin/env bash
# Restaure une sauvegarde .sql.gz DANS LA BASE CONFIGURÉE : REMPLACE toutes les données actuelles.
#   tools/restaurer.sh sauvegardes/beauchemin_2026-10-04_020000.sql.gz
# Pour essayer sans risque : DB_NAME=une_base_de_test tools/restaurer.sh fichier.sql.gz   (la base doit exister)
set -euo pipefail
cd "$(dirname "$0")/.."
FICHIER="${1:?Usage: $0 fichier.sql.gz}"
[ -r "$FICHIER" ] || { echo "Fichier illisible : $FICHIER" >&2; exit 1; }
gzip -t "$FICHIER"
eval "$(php -r 'require "app/config/config.php"; foreach (array("HOST","USER","NAME","PASS") as $k) { echo "DB_$k=" . escapeshellarg(constant("DATABASE_$k")) . "\n"; }')"
echo "ATTENTION : toutes les données de la base « $DB_NAME » seront REMPLACÉES par ce fichier."
if [ "${CONFIRMER:-}" != "OUI" ]; then read -r -p "Tapez OUI en majuscules pour continuer : " rep; [ "$rep" = "OUI" ] || { echo "Annulé."; exit 1; }; fi
zcat "$FICHIER" | MYSQL_PWD="$DB_PASS" mysql -h"$DB_HOST" -u"$DB_USER" "$DB_NAME"
echo "Restauration terminée dans « $DB_NAME »."
