# Essayer le logiciel (environnement d'essai)

Cet environnement d'essai installe tout en **une commande** : le logiciel, sa base de données et des données de démonstration.
Il sert à **tester et à former l'équipe**, pas à la production (pour le serveur définitif, voir [`DEPLOIEMENT.md`](DEPLOIEMENT.md)).

## Ce qu'il faut

Un ordinateur (Windows, Mac ou Linux) avec **Docker** :

* Windows / Mac : installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) (gratuit pour une petite entreprise), puis l'ouvrir une fois.
* Linux : `sudo apt install docker.io docker-compose-v2` (Ubuntu/Debian).

Il faut aussi le code : `git clone <URL-du-dépôt>` puis `cd Beauchemin` (ou télécharger le dossier en ZIP depuis GitHub et l'ouvrir).

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

Les données de démonstration (14 pièces, 3 fournisseurs, quelques mouvements et deux factures internes) permettent de tout essayer tout de suite.

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
3. **Employé** : sortir 2 gicleurs du cube (pièces utilisées chez un client).
4. **Gestionnaire** : faire une facture interne (Boutique Chaleur prend des pièces chez Beauchemin) ; consulter le **bilan mensuel** et l'exporter.
5. **Gestionnaire** : un **comptage** d'un cube avec le lecteur ; appliquer les écarts.
6. Noter tout ce qui est lent, confus ou manquant : c'est ce qui sera corrigé avant le lancement.
