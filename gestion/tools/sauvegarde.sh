#!/usr/bin/env bash
# Sauvegarde de la base : compressée, datée, avec rotation. À planifier chaque nuit (cron).
#   tools/sauvegarde.sh [dossier_destination]        défaut : ./sauvegardes (hors du dossier web si possible, ex. /var/backups/beauchemin)
# Variables : GARDER_JOURS (défaut 30). Les accès à la base viennent de app/config/config.local.php (ou DB_HOST/DB_USER/DB_PASS/DB_NAME).
# Les fichiers contiennent les empreintes de mots de passe : ils sont lisibles par leur propriétaire seulement (umask 077).
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
DEST="${1:-./sauvegardes}"
GARDER="${GARDER_JOURS:-30}"
mkdir -p "$DEST"
eval "$(php -r 'require "app/config/config.php"; foreach (array("HOST","USER","NAME","PASS") as $k) { echo "DB_$k=" . escapeshellarg(constant("DATABASE_$k")) . "\n"; }')"
FICHIER="$DEST/beauchemin_$(date +%Y-%m-%d_%H%M%S).sql.gz"
MYSQL_PWD="$DB_PASS" mysqldump --single-transaction --quick --routines --default-character-set=utf8mb4 -h"$DB_HOST" -u"$DB_USER" "$DB_NAME" | gzip -9 > "$FICHIER"
gzip -t "$FICHIER"                       # vérifie que l'archive est lisible
[ "$(zcat "$FICHIER" | grep -c '^CREATE TABLE')" -ge 10 ] || { echo "Sauvegarde suspecte (tables manquantes) : $FICHIER" >&2; exit 1; }
find "$DEST" -name 'beauchemin_*.sql.gz' -mtime +"$GARDER" -delete
echo "Sauvegarde créée : $FICHIER ($(du -h "$FICHIER" | cut -f1))"
