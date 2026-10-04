#!/usr/bin/env bash
# Crée une base de test/dev toute neuve : schéma + compte admin (+ données de démo).
# Usage : tools/nouvelle-base.sh <nom_base> [--demo]      (MariaDB local, utilisateur root sans mot de passe)
set -euo pipefail
DB="${1:?Usage: $0 <nom_base> [--demo]}"
cd "$(dirname "$0")/.."
mysql -uroot -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot "$DB" < database/schema.sql
export DB_NAME="$DB"
php database/create_admin.php admin 'Test-Beauchemin-1' 'Administrateur'
if [ "${2:-}" = "--demo" ]; then php database/demo.php; fi
