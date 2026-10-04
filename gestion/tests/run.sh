#!/usr/bin/env bash
# Lance tous les tests sur une base jetable. Usage : tests/run.sh   (MariaDB local, root sans mot de passe)
set -uo pipefail
cd "$(dirname "$0")/.."
DB=beauchemin_test
mysql -uroot -e "DROP DATABASE IF EXISTS $DB; CREATE DATABASE $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" && mysql -uroot $DB < database/schema.sql || exit 2
export DB_NAME=$DB
rc=0
for t in run fuzz concurrence; do
  [ -f tests/$t.php ] || continue
  echo "=== $t ==="; php tests/$t.php || rc=1
done
exit $rc
