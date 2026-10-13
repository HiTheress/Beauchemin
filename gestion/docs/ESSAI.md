# Essayer le logiciel (environnement d'essai)

Cet environnement d'essai installe tout en **une commande** : le logiciel, sa base de données et des données de démonstration.
Il sert à **tester et à former l'équipe**, pas à la production (pour le serveur définitif, voir [`DEPLOIEMENT.md`](DEPLOIEMENT.md)).

## Ce qu'il faut

Un ordinateur (Windows, Mac ou Linux) avec **Docker** :

* Windows / Mac : installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) (gratuit pour une petite entreprise), puis l'ouvrir une fois.
  Sous Windows, si un message demande une distribution Linux (WSL) : ouvrir PowerShell **en administrateur**, taper `wsl --install`, puis redémarrer l'ordinateur.
* Linux : `sudo apt install docker.io docker-compose-v2` (Ubuntu/Debian).

Il faut aussi le code : décompresser le fichier ZIP fourni (par exemple dans `C:\Beauchemin`), ou `git clone <URL-du-dépôt>`.

## Démarrer

Dans le dossier du projet (celui qui contient `docker-compose.yml`) :

```bash
docker compose up -d --build
```

La première fois, c'est long (quelques minutes : téléchargements et préparation). Ensuite, ouvrir **http://localhost:8080**.

| Compte | Mot de passe | Rôle |
|---|---|---|
| `admin` | `Test-Beauchemin-1` | administrateur : tout, y compris utilisateurs, entreprises, emplacements |
| `gestionnaire1` | `Test-Beauchemin-1` | gestionnaire des deux entreprises : réceptions, factures internes, bilan, coûts |
| `employe1` | `Test-Beauchemin-1` | employé de Beauchemin : transferts, sorties, comptages — ne voit **aucun coût** |

Les données de démonstration (14 pièces, 3 fournisseurs, 6 emplacements dont trois cubes de service, quelques mouvements, deux factures internes et la position de rangement de la plupart des pièces) permettent de tout essayer tout de suite.

## Installer une mise à jour (sans perdre les données)

1. Décompressez le nouveau ZIP **dans le même dossier** que l'ancien (ou arrêtez l'ancien d'abord : `docker compose down` dans l'ancien dossier — sans `-v`). Deux dossiers différents veulent le même port 8080 : l'ancien logiciel resterait affiché.
2. Dans le dossier : `docker compose up -d --build`. La base est mise à jour toute seule ; le stock est gardé.
3. Rechargez la page avec **Ctrl + F5**.
4. Vérifiez : le numéro de **Version** s'affiche en bas du menu de gauche et sous la fenêtre de connexion (par exemple « Version 3ca2433 · 2026-10-13 »). S'il n'a pas changé, l'ancien logiciel tourne encore : `docker ps` montre ce qui roule ; `docker stop <nom>` arrête l'ancien, puis refaites l'étape 2.

## Si le site ne s'ouvre pas (page vide, « ERR_EMPTY_RESPONSE », « ne fonctionne pas »)

1. Dans le dossier du logiciel : `docker compose ps` (les deux services doivent être « Up ») puis `docker compose logs --tail 40 web`. Le journal dit la cause : « ATTENTION : la base de données ne répond pas… », « port is already allocated », une migration en échec…
2. **Port déjà pris** (un autre programme utilise 8080) : `BEA_PORT=8090 docker compose up -d` puis `http://localhost:8090` (PowerShell : `$env:BEA_PORT=8090; docker compose up -d`).
3. **Mot de passe de la base différent de la première installation** (message « refuse la connexion ») ou tout autre état bloqué dans les données d'essai : `docker compose down -v` puis `docker compose up -d --build`. Attention : cela **efface** les données d'essai.
4. Attendez 30 à 60 secondes après le démarrage : la base démarre avant le site.

## Commandes utiles

| Je veux… | Commande |
|---|---|
| arrêter (les données sont gardées) | `docker compose down` |
| redémarrer | `docker compose up -d` |
| **tout effacer** et recommencer à neuf | `docker compose down -v` puis `docker compose up -d --build` |
| partir d'une base **vide** (sans démo) avec mon propre mot de passe administrateur | `DEMO=0 ADMIN_PASSWORD='MotDePasseLong1' docker compose up -d --build` (après `down -v`) — sous Windows PowerShell : `$env:DEMO=0; $env:ADMIN_PASSWORD='MotDePasseLong1'; docker compose up -d --build` |
| voir les messages d'erreur | `docker compose logs web` |
| accéder depuis un autre poste du réseau | `BEA_BIND=0.0.0.0 docker compose up -d` puis `http://adresse-de-l-ordinateur:8080` |
| changer le port | `BEA_PORT=8090 docker compose up -d` |

Le mot de passe et le nom de l'administrateur ne sont lus qu'**au tout premier démarrage** (base vide). Pour les changer ensuite : *Administration → Utilisateurs*.

## À savoir pour les essais

* **Lecteur de codes-barres USB ou Bluetooth** : fonctionne tel quel (il « tape » le code, puis Entrée).
* **Caméra du téléphone** : les navigateurs ne l'autorisent qu'en **HTTPS** (ou sur `localhost`). Sur un réseau local en `http://`, elle ne s'allumera pas ; ce n'est pas un défaut du logiciel. Le serveur définitif sera en HTTPS (voir `DEPLOIEMENT.md`) et la caméra y fonctionnera.
* **Pas de vraies données** si l'essai est accessible depuis le réseau : la connexion n'est pas chiffrée (HTTP) et les mots de passe de démonstration sont connus.
* Les données vivent dans un volume Docker (`bea-donnees`) : elles survivent à l'arrêt et au redémarrage, mais disparaissent avec `docker compose down -v`.

## Scénario d'essai suggéré (30 minutes, 2 ou 3 personnes)

1. **Gestionnaire** : recevoir 10 gicleurs de *Distribution Chauffage Plus* à l'entrepôt de Beauchemin (Réception) ; vérifier le coût moyen sur la fiche de la pièce.
2. **Employé** : transférer 4 gicleurs de l'entrepôt vers un cube de service ; scanner le code d'un cube pour voir son contenu.
3. **Employé** : sortir 2 gicleurs du cube (pièces utilisées chez un client). Pendant ce temps, ouvrir **Plan** sur un autre poste : la tuile du cube se met à jour toute seule ; chercher un gicleur illumine les emplacements qui en ont.
4. **Gestionnaire** : faire une facture interne (Boutique Chaleur prend des pièces chez Beauchemin) ; consulter le **bilan mensuel** et l'exporter.
5. **Gestionnaire** : un **comptage** d'un cube avec le lecteur ; appliquer les écarts.
6. Noter tout ce qui est lent, confus ou manquant : c'est ce qui sera corrigé avant le lancement.
