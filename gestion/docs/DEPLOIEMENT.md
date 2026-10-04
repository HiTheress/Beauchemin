# Installation sur un serveur

Guide pas à pas (Ubuntu 24.04 ou Debian 12 ; adaptez les commandes à votre distribution). Prévoyez ~1 heure.
Le logiciel est conçu pour **4 à 10 utilisateurs** : un petit serveur (1 à 2 vCPU, 2 Go de mémoire) suffit largement.

## 1. Logiciels requis

```bash
sudo apt update
sudo apt install -y nginx php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-intl mariadb-server certbot python3-certbot-nginx
# (Apache au lieu de nginx : apt install apache2 libapache2-mod-fcgid ; voir deploy/apache-vhost.conf)
```

* PHP **8.1 ou plus** avec `pdo_mysql` et `mbstring` (obligatoires) ; `intl` est recommandé.
* MariaDB **10.4+** (ou MySQL 8.0.16+).

## 2. Déposer le code

```bash
sudo mkdir -p /var/www/beauchemin
sudo git clone <URL-du-dépôt> /var/www/beauchemin           # ou copier le dossier
sudo chown -R root:www-data /var/www/beauchemin
sudo chmod -R o-rwx /var/www/beauchemin                      # le code n'est lisible que par root et le serveur web
```

La racine web (« document root ») est le dossier **`gestion/`**.

## 3. Base de données (avec un utilisateur dédié — jamais `root`)

```bash
sudo mysql <<'SQL'
CREATE DATABASE beauchemin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'beauchemin'@'localhost' IDENTIFIED BY 'UN-MOT-DE-PASSE-LONG-ET-UNIQUE';
GRANT SELECT, INSERT, UPDATE, DELETE ON beauchemin.* TO 'beauchemin'@'localhost';
SQL
sudo mysql beauchemin < /var/www/beauchemin/gestion/database/schema.sql
```

> Les droits `SELECT, INSERT, UPDATE, DELETE` suffisent au fonctionnement. Pour **importer le schéma** (ci-dessus) on utilise le compte
> administrateur de MariaDB (`sudo mysql`). La page « Sauvegarde » de l'application n'a pas besoin d'autres droits.

## 4. Configuration

```bash
cd /var/www/beauchemin/gestion/app/config
sudo cp config.local.example.php config.local.php
sudo nano config.local.php          # mettre DATABASE_USER 'beauchemin', DATABASE_PASS, DATABASE_NAME 'beauchemin'
sudo chown root:www-data config.local.php && sudo chmod 640 config.local.php
```

`config.local.php` n'est jamais versionné ni servi par le web.

## 5. Premier administrateur

```bash
cd /var/www/beauchemin/gestion
sudo -u www-data php database/create_admin.php nom_admin 'MotDePasseLongEtUnique' 'Nom Complet'
```

Il n'existe **aucun compte par défaut**. Connectez-vous ensuite, puis créez les autres utilisateurs depuis *Administration → Utilisateurs*
(rôles : employé, gestionnaire, administrateur ; chaque utilisateur est rattaché à une ou aux deux entreprises).

## 6. Serveur web, HTTPS et PHP

* **nginx** : `deploy/nginx.conf` → `/etc/nginx/sites-available/beauchemin` (adaptez `server_name`), `ln -s` vers `sites-enabled`, puis
  `sudo certbot --nginx -d inventaire.exemple.com` (certificat HTTPS gratuit, renouvellement automatique), `sudo nginx -t && sudo systemctl reload nginx`.
* **Apache** : `deploy/apache-vhost.conf` (le fichier `gestion/.htaccess` fourni applique les interdictions d'accès).
* **PHP** : copier `deploy/php-production.ini` vers `/etc/php/8.3/fpm/conf.d/90-beauchemin.ini` puis `sudo systemctl reload php8.3-fpm`
  (aucune erreur PHP affichée aux utilisateurs, cookies de session sécurisés, déconnexion après 8 h d'inactivité, fuseau horaire du Québec).
* **HTTPS est obligatoire** : sans lui, les mots de passe circulent en clair et la lecture par **caméra** (téléphone/tablette) est refusée par les navigateurs.

Vérification : `https://inventaire.exemple.com/login.php` s'affiche ; `…/pages/dashboard.php`, `…/app/config/config.php` et `…/database/schema.sql` répondent **404**.

## 7. Sauvegardes (indispensable)

```bash
sudo mkdir -p /var/backups/beauchemin && sudo chown www-data:www-data /var/backups/beauchemin
sudo -u www-data /var/www/beauchemin/gestion/tools/sauvegarde.sh /var/backups/beauchemin      # essai manuel
sudo crontab -u www-data -e
#   0 2 * * *  /var/www/beauchemin/gestion/tools/sauvegarde.sh /var/backups/beauchemin >> /var/log/beauchemin-sauvegarde.log 2>&1
```

* Une sauvegarde compressée est créée chaque nuit à 2 h ; les **30 derniers jours** sont conservés (`GARDER_JOURS=60` pour changer).
* **Copiez-les aussi hors du serveur** (autre machine, stockage infonuagique) : une sauvegarde sur le même disque ne protège pas d'une panne du disque.
  Exemple : `rclone copy /var/backups/beauchemin remote:beauchemin-sauvegardes`.
* Les fichiers contiennent les empreintes de mots de passe : conservez-les en lieu sûr.
* **Restauration** (remplace toutes les données) : `sudo -u www-data /var/www/beauchemin/gestion/tools/restaurer.sh /var/backups/beauchemin/beauchemin_AAAA-MM-JJ_HHMMSS.sql.gz`.
  **Essayez une restauration dans une base de test au moins une fois** avant d'en avoir besoin : `DB_NAME=base_test tools/restaurer.sh fichier.sql.gz`.
* L'administrateur peut aussi télécharger une sauvegarde depuis l'application (*Administration → Sauvegarde*).

## 8. Charger les pièces et le stock de départ

1. *Administration → Emplacements* : créez les entrepôts, boutiques et **cubes de service** de chaque entreprise ; imprimez leurs étiquettes (*Catalogue → Étiquettes*) et collez-les.
2. *Catalogue → Pièces → Importer (CSV)* : téléchargez le modèle, remplissez-le (code, nom, catégorie, prix fournisseur, **stock initial par emplacement avec coût**), importez-le.
   L'aperçu signale chaque erreur avant d'écrire quoi que ce soit.
3. Imprimez les étiquettes de pièces et collez-les sur les bacs/tablettes. Faites un premier **comptage** par emplacement pour valider le stock de départ.

## 9. Mises à jour

```bash
cd /var/www/beauchemin && sudo git pull
# si la mise à jour contient des changements de base de données, un fichier database/migrations/AAAA-MM-JJ-*.sql sera fourni avec ses instructions
sudo systemctl reload php8.3-fpm
```

**Toujours faire une sauvegarde manuelle avant une mise à jour.** Avant de la déployer, la suite de tests peut être lancée sur une base jetable : `TEST_DB=beauchemin_test tests/run.sh`.

## 10. Dépannage

| Symptôme | Piste |
|---|---|
| Page blanche / erreur 500 | `sudo tail -50 /var/log/nginx/error.log` et le journal de PHP-FPM (`/var/log/php8.3-fpm.log`) |
| « Erreur de connexion à la base de données » | `app/config/config.local.php` (utilisateur, mot de passe, nom), service `mariadb` démarré |
| Déconnexions fréquentes | `session.gc_maxlifetime` (voir `php-production.ini`), et HTTPS bien configuré (cookie « secure ») |
| Compte verrouillé | 5 échecs → verrou de 15 min ; un administrateur peut le lever dans *Utilisateurs* |
| Caméra refusée | la page doit être en **HTTPS** et l'accès à la caméra autorisé dans le navigateur |
| Heures décalées | `date.timezone = America/Toronto` (php-production.ini) et heure du serveur à jour (`timedatectl`) |
