# Inventaire de pièces — Beauchemin et Boutique Chaleur

Logiciel web interne pour savoir **où sont les pièces** : entrepôts, boutiques et **cubes de service** de deux entreprises
(Beauchemin — mazout/propane — et Boutique Chaleur), avec inventaire permanent au **code-barres**.

* **Deux entreprises, un seul logiciel** : chacune a ses emplacements et son stock ; chaque utilisateur ne voit que ses entreprises.
* **Inventaire permanent** : réception, transfert (entrepôt → cube), sortie (pièces utilisées), ajustement et **comptage** au lecteur de codes-barres.
* **Coût moyen pondéré** par pièce et par entreprise ; **prix des pièces chez chaque fournisseur** (avec historique).
* **Facture interne au coût** entre les deux entreprises, puis **bilan mensuel** : qui a pris quoi, combien l'un doit à l'autre.
* **Codes-barres** : étiquettes Code 128 imprimables pour les pièces et les emplacements ; lecteurs USB/Bluetooth (ils « tapent » le code) ou caméra du téléphone.
* **Rôles** : employé, gestionnaire, administrateur ; journal d'activité ; sauvegardes.
* Pas de facture client, pas de vente de carburant, pas de suivi de réservoirs : ce n'est qu'un inventaire de pièces.

## Documentation

| Document | Pour qui |
|---|---|
| [`gestion/docs/DEPLOIEMENT.md`](gestion/docs/DEPLOIEMENT.md) | installer le logiciel sur un serveur (HTTPS, sauvegardes, premier administrateur) |
| [`gestion/docs/SPEC.md`](gestion/docs/SPEC.md) | développeurs : architecture, règles métier, API, sécurité, conventions |
| [`gestion/NOTICE.md`](gestion/NOTICE.md) | origine du code (à lire avant toute redistribution) |

## Démarrage rapide (développement)

Prérequis : PHP 8.1+ (`pdo_mysql`, `mbstring`), MariaDB/MySQL.

```bash
cd gestion
tools/serveur.sh start beauchemin_dev 8080     # crée la base avec des données de démo et démarre http://127.0.0.1:8080
# comptes de démo (mot de passe Test-Beauchemin-1) : admin, gestionnaire1, employe1
tools/serveur.sh stop 8080
```

Tests : `tests/run.sh` (scénarios métier, test aléatoire comparé à un modèle indépendant, concurrence multi-processus).
Tests de navigateur : `NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8080 node tests/e2e/<module>.js`.
Audit de sécurité automatique de tous les endpoints (sans session, sans jeton CSRF, rôles, charges malformées) : `tests/e2e/securite.js`.

## Sécurité en bref

Connexion obligatoire sur chaque page et chaque action · jeton CSRF · mots de passe `password_hash` · limitation des essais de connexion (par adresse et par compte) ·
rôle **et** entreprise vérifiés côté serveur · requêtes préparées partout · tout affichage échappé · aucun compte par défaut ·
sessions durcies · ressources chargées localement (aucun CDN) · code interne, configuration et schéma non servis par le web.
