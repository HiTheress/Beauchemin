#!/bin/sh
# Attend la base, crée l'administrateur (et les données de démonstration) au tout premier démarrage, puis lance Apache.
set -e
cd /var/www/html

compter() {
  php -r 'try { $p = new PDO("mysql:host=".getenv("DB_HOST").";dbname=".getenv("DB_NAME"), getenv("DB_USER"), getenv("DB_PASS")); echo (int) $p->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn(); } catch (Throwable $e) { fwrite(STDERR, $e->getMessage()); exit(1); }'
}

# Attend la base (60 s au plus). Si elle ne répond pas (mauvais mot de passe : volume créé avec un autre DB_PASS ?), on le DIT dans le journal
# et Apache démarre quand même : la page affiche alors « Erreur de connexion à la base de données » au lieu d'une page vide (ERR_EMPTY_RESPONSE).
n=0
nb=""
until nb="$(compter 2>/tmp/erreur-bd)"; do
  n=$((n + 1))
  if [ "$n" -gt 60 ]; then
    echo "ATTENTION : la base de données ne répond pas ou refuse la connexion : $(cat /tmp/erreur-bd)" >&2
    echo "Si le mot de passe a changé depuis la première installation : « docker compose down -v » puis « docker compose up -d --build » (efface les données d'essai). Voir docs/ESSAI.md." >&2
    nb=""
    break
  fi
  sleep 1
done

if [ -n "$nb" ]; then
  # Migrations (database/migrations/*.sql, idempotentes) : une base créée avec une version plus ancienne du schéma les reçoit ici.
  # Avant la démo : demo.php peut déjà s'appuyer sur les tables récentes (plan de l'entrepôt). Limitée à 2 minutes : jamais de blocage du démarrage.
  timeout 120 php database/migrer.php || echo "Avertissement : une migration de la base a échoué ou a pris trop de temps (voir le message ci-dessus)." >&2

  if [ "$nb" = "0" ]; then
    php database/create_admin.php "${ADMIN_USER:-admin}" "${ADMIN_PASSWORD:?ADMIN_PASSWORD manquant}" "Administrateur"
    if [ "${DEMO:-0}" = "1" ]; then php database/demo.php; fi
  fi
fi

exec "$@"
