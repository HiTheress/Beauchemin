#!/bin/sh
# Attend la base, crée l'administrateur (et les données de démonstration) au tout premier démarrage, puis lance Apache.
set -e
cd /var/www/html

compter() {
  php -r 'try { $p = new PDO("mysql:host=".getenv("DB_HOST").";dbname=".getenv("DB_NAME"), getenv("DB_USER"), getenv("DB_PASS")); echo (int) $p->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn(); } catch (Throwable $e) { exit(1); }'
}

n=0
until nb="$(compter 2>/dev/null)"; do
  n=$((n + 1))
  if [ "$n" -gt 90 ]; then echo "La base de données ne répond pas." >&2; exit 1; fi
  sleep 1
done

# Migrations (database/migrations/*.sql, idempotentes) : une base créée avec une version plus ancienne du schéma les reçoit ici.
# Avant la démo : demo.php peut déjà s'appuyer sur les tables récentes (plan de l'entrepôt).
php database/migrer.php || echo "Avertissement : une migration de la base a échoué (voir le message ci-dessus)." >&2

if [ "$nb" = "0" ]; then
  php database/create_admin.php "${ADMIN_USER:-admin}" "${ADMIN_PASSWORD:?ADMIN_PASSWORD manquant}" "Administrateur"
  if [ "${DEMO:-0}" = "1" ]; then php database/demo.php; fi
fi

exec "$@"
