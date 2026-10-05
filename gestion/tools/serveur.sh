#!/usr/bin/env bash
# Serveur de développement isolé (une base + un port par développeur/agent).
#   tools/serveur.sh start <nom_base> <port> [--neuf]   démarre ; crée la base (avec données de démo) si absente ou si --neuf
#   tools/serveur.sh stop  <port>                       arrête SEULEMENT le serveur de ce port
#   tools/serveur.sh reset <nom_base>                   recrée la base de démo sans toucher au serveur
# Journal PHP : /tmp/bea-<port>.log   ·   PID : /tmp/bea-<port>.pid   ·   URL : http://127.0.0.1:<port>
set -euo pipefail
cd "$(dirname "$0")/.."
cmd="${1:?start|stop|reset}"
case "$cmd" in
  start)
    DB="${2:?nom_base}"; PORT="${3:?port}"; NEUF="${4:-}"
    if [ -f "/tmp/bea-$PORT.pid" ] && kill -0 "$(cat /tmp/bea-$PORT.pid)" 2>/dev/null; then kill "$(cat /tmp/bea-$PORT.pid)"; sleep 0.5; fi
    if [ "$NEUF" = "--neuf" ] || ! mysql -uroot -N -e "SELECT 1 FROM information_schema.schemata WHERE schema_name='$DB'" | grep -q 1; then
      tools/nouvelle-base.sh "$DB" --demo
    fi
    : > "/tmp/bea-$PORT.log"
    DB_NAME="$DB" BEA_ENV=test PHP_CLI_SERVER_WORKERS=3 setsid nohup php -S "127.0.0.1:$PORT" tools/router.php > "/tmp/bea-$PORT.log" 2>&1 &
    echo $! > "/tmp/bea-$PORT.pid"
    for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null "http://127.0.0.1:$PORT/login.php" && break; sleep 0.5; done
    echo "Serveur prêt : http://127.0.0.1:$PORT (base $DB) — journal /tmp/bea-$PORT.log"
    ;;
  stop)
    PORT="${2:?port}"
    if [ -f "/tmp/bea-$PORT.pid" ]; then kill "$(cat /tmp/bea-$PORT.pid)" 2>/dev/null || true; rm -f "/tmp/bea-$PORT.pid"; echo "Serveur $PORT arrêté."; fi
    ;;
  reset)
    tools/nouvelle-base.sh "${2:?nom_base}" --demo
    ;;
esac
