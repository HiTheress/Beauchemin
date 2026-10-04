# Spécification technique — écrans de gestion d'inventaire (Beauchemin / Boutique Chaleur)

Ce document est la **référence** pour construire les écrans. Le noyau (schéma, service de stock, droits, tests) est
terminé et testé : **on construit dessus, on ne le réécrit pas.**

## 0. Ce que veut le client (leurs mots, résumés)

Deux entreprises dans le même logiciel : **Beauchemin** (mazout/propane, service) et **Boutique Chaleur**. Chacune a son
propre inventaire de **pièces** (entrepôts, boutiques, et **cubes de service** = les camions/fourgonnettes des
techniciens). Une entreprise peut **prendre des pièces dans l'inventaire de l'autre**, ce qui se règle par une
**facture interne au coût** (pas de marge) ; à la fin du mois, un **bilan** montre qui a pris quoi et combien l'un doit à
l'autre. On entre les **prix des pièces chez les fournisseurs**. On **scanne des codes-barres** pour savoir ce qu'on a et
où (inventaire permanent, y compris dans les cubes). **Pas** de facture client, **pas** de vente de carburant, **pas**
d'inventaire de réservoirs. 4 à 10 utilisateurs, hébergé sur un serveur. Interface **100 % en français (Québec)**.

## 1. Environnement de développement (un par module, isolé)

Racine du code web : `gestion/` (le « document root »). Chaque agent travaille sur **sa propre base et son propre port** :

```bash
cd /home/user/Beauchemin/gestion
tools/serveur.sh start bea_<module> <port>        # crée la base de démo si absente, démarre le serveur (journal /tmp/bea-<port>.log)
tools/serveur.sh reset bea_<module>               # remet la base de démo à zéro (le serveur continue)
tools/serveur.sh stop <port>                      # à faire à la fin
```

* **N'utilisez jamais `pkill -f php` / `killall php`** (ça tue les serveurs des autres). Arrêtez seulement votre PID.
* Journal PHP (avertissements, erreurs SQL) : `/tmp/bea-<port>.log` — **doit rester propre** (aucun `Warning`/`Notice`/`Fatal`).
* Comptes de démo (mot de passe `Test-Beauchemin-1`) : `admin` (tout), `gestionnaire1` (entreprises 1 et 2),
  `employe1` (entreprise 1 seulement). Données : 14 pièces (P-0001…P-0014), 3 fournisseurs, emplacements 1–5
  (1 = Entrepôt Beauchemin, 2 = Entrepôt Boutique Chaleur, 3/4 = cubes Beauchemin, 5 = Boutique Centre-ville).
  Codes-barres d'emplacement `EMP-000001`…`EMP-000005`. Alias de code : `012345678905` = P-0001.
* Tests de navigateur : `NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:<port> node tests/e2e/<module>.js`
  (aide commune : `tests/e2e/lib.js` — Playwright + Chromium déjà installés ; **n'exécutez pas `playwright install`**).
  Les CDN externes sont bloqués dans cet environnement : tout est chargé **localement** (`plugins/`), ne rajoutez
  jamais de `<script src="https://…">`.
* Tests du noyau : `TEST_DB=bea_<module>_t tests/run.sh` (utilisez **votre propre** base de test ; le défaut `beauchemin_test` est réservé au coordinateur).
* Le PHP est 8.3, MariaDB 10.11. Pas de Composer, pas de npm côté serveur : PHP « à plat » comme le reste du projet.

## 2. Organisation des fichiers

```
gestion/
  index.php               routeur : index.php?page=<nom>  ->  pages/<nom>.php  (nom = [a-z0-9_]+)
  inc/header.php sidebar.php footer.php     coquille (menu défini dans sidebar.php)
  pages/<nom>.php         une page = un fichier, inclus DANS la coquille (elle écrit son <div class="content-wrapper">)
  app/ajax/<nom>.php      endpoints de LECTURE (JSON ou DataTables)      — GET ou POST
  app/action/<nom>.php    endpoints d'ÉCRITURE (JSON)                    — POST seulement (exiger_post())
  assets/js/<module>.js   JavaScript de la page (chargé avec page_script('assets/js/<module>.js'))
  assets/css/<module>.css (facultatif) ; sinon un bloc <style> en haut de la page
  app/classes/            NOYAU — ne pas modifier (voir §11)
  tests/e2e/<module>.js   votre test de bout en bout (à livrer)
```

Pages existantes à connaître (noms de routes **figés** : les modules se lient entre eux par ces noms) :
`dashboard, scanner, stock, reception, transfert, sortie, ajustement, facture_interne, comptage, comptage_voir(id),
pieces, piece_voir(id), piece_edit(id?), fournisseurs, categories, etiquettes, documents, document_voir(id),
historique, sous_minimum, factures_internes, facture_interne_voir(id), bilan_mensuel, valeur_inventaire,
utilisateurs, entreprises, emplacements, journal, profil, backup_database`.
Le menu (`inc/sidebar.php`) contient déjà toutes ces entrées avec leur rôle minimum.

## 3. Modèle de données et règles métier (résumé ; le détail est dans `database/schema.sql`)

* `entreprises` (1 = Beauchemin, 2 = Boutique Chaleur) → `emplacements` (type `entrepot|boutique|cube`, `code_barres` unique).
* `pieces` : catalogue **commun** (code interne unique = ce qui s'imprime en Code 128) ; `pieces_codes` = alias scannables
  (UPC fabricant…). Un code (interne, alias ou emplacement) est unique **globalement** : `inventaire()->codeDisponible($code, $sauf_piece_id)`.
* `stock(piece, emplacement)` = solde courant, **jamais négatif**. `mouvements` = registre (jamais modifié).
  Invariant : `stock.quantite = SUM(mouvements.quantite)`.
* `stock_couts(entreprise, pièce)` = **coût moyen pondéré** par entreprise. Réception avec coût → fusionné dans la moyenne.
  Transfert interne et sortie : au coût moyen courant, sans le modifier. **Facture interne : facturée au coût moyen de
  l'entreprise émettrice ; l'entreprise destinataire reçoit au même coût** (fusionné dans sa moyenne).
* `documents` + `document_lignes` : `reception | transfert | sortie | ajustement | facture_interne`, numérotés
  `REC-2026-00001`, `TRF-`, `SOR-`, `AJU-`, `FIN-`. Un document annulé garde ses lignes (`statut='annule'`, mouvements inverses).
* `comptages` : brouillon de comptage d'un emplacement → « appliquer » crée **un** ajustement (écarts = compté − stock actuel).
* `prix_fournisseurs` (prix courant par pièce/fournisseur) + `prix_fournisseurs_hist`. `seuils` (minimum par entreprise).
* `journal` : audit. `utilisateurs` + `utilisateur_entreprises`.
* **Montants** : coûts unitaires à 4 décimales, totaux à 2, quantités à 3 (les pièces vendues au mètre/pied existent). Les
  décimaux voyagent **toujours en chaîne** (`"12.500"`), jamais en float. Entrée utilisateur : virgule ou point acceptés
  (le service les convertit). Formats d'affichage : PHP `fmt_argent($s)`, `fmt_nombre($s)`, `fmt_date($d)` ;
  JS `fmtArgent(s)`, `fmtQte(s)`.
* **Pas de suppression physique** de pièces, fournisseurs, emplacements, entreprises : on **désactive** (`actif = 0`).
  Une pièce/emplacement désactivé n'apparaît plus dans les listes de saisie mais reste dans l'historique et les rapports.

## 4. API PHP disponible

Partout (chargé par `app/init.php`) : `$pdo` (PDO, exceptions, requêtes préparées natives), `$Ouser`, et :

| Fonction | Rôle |
|---|---|
| `e($s)` | échappe pour HTML — **pour toute valeur affichée** |
| `entree()` | données envoyées (corps JSON ou `$_POST`) sous forme de tableau |
| `exiger_post()` | refuse tout sauf POST (405) |
| `endpoint(function () { … return array(...); })` | exécute, renvoie `{"ok":true,…}` ; `InventaireException` → 400 `{"ok":false,"erreur":"…","champ":"…"}` ; autre exception → 500 générique (loguée) |
| `json_ok($data)`, `json_fail($msg, $status)` | réponses JSON directes (terminent le script) |
| `inventaire()` | le service d'inventaire (voir ci-dessous) |
| `utilisateur_id()` | id de l'utilisateur connecté |
| `entreprise_courante()` / `entreprises_filtre()` | entreprise choisie dans la barre du haut (0 = toutes) / liste d'ids à filtrer |
| `$Ouser->aRole('gestionnaire')`, `->is_admin()`, `->peutVoirCouts()`, `->entreprisesAutorisees()`, `->peutAcces($id)` | droits |
| `acces_page('gestionnaire')` | en tête d'une page : affiche « accès refusé » et retourne false → faire `return;` |
| `page_titre($titre, array $fil)`, `page_script($chemin)` | gabarit de page |
| `DataTable::repondre($pdo, array(...))` | réponse « server-side » DataTables **sûre** (tri/recherche/pagination) — voir l'en-tête de `app/classes/DataTable.php` |
| `Journal::ecrire($pdo, $userId, 'action', 'entite', $id, array(...))` | audit |
| `Code128::svg($texte, array('module'=>2,'hauteur'=>60,'texte'=>true))` | code-barres SVG ; endpoint `app/ajax/code128.php?texte=…` |
| `ROLES_FR`, `TYPES_EMPLACEMENT_FR`, `TYPES_DOCUMENT_FR`, `MOIS_FR` | libellés français |

### Service `Inventaire` (`app/classes/Inventaire.php`) — **toute** écriture de stock passe par lui

Chaque méthode prend `$userId` en premier paramètre, vérifie **rôle et entreprise** elle-même, travaille en transaction
et lève `InventaireException` (message en français, affichable) si refusé. Les lignes sont
`array('piece_id'=>int, 'quantite'=>"1,5", 'cout_unitaire'=>"12.34")`.

| Méthode | Rôle min. | Notes |
|---|---|---|
| `recevoir($u, ['emplacement_id','fournisseur_id'?,'date'?,'reference'?,'note'?,'maj_prix'?,'lignes'=>[piece_id,quantite,cout_unitaire]])` | gestionnaire | `maj_prix` = met à jour la liste de prix du fournisseur |
| `transferer($u, ['emplacement_id','emplacement_dest_id','date'?,'note'?,'lignes'=>[piece_id,quantite]])` | employé | même entreprise seulement |
| `sortir($u, ['emplacement_id','motif','reference'?,'date'?,'note'?,'lignes'=>[…]])` | employé | `motif` ∈ `Inventaire::MOTIFS_SORTIE` |
| `ajuster($u, ['emplacement_id','motif','note'?,'lignes'=>[piece_id,quantite(±),cout_unitaire?]])` | gestionnaire | `motif` ∈ `MOTIFS_AJUSTEMENT` |
| `factureInterne($u, ['emplacement_id'(source),'entreprise_dest_id','emplacement_dest_id','date'?,'note'?,'permettre_cout_zero'?,'lignes'=>[piece_id,quantite]])` | gestionnaire | au coût moyen de la source |
| `annuler($u, $docId, $motif)` | gestionnaire | reception/transfert/sortie/facture_interne ; refusé si le stock à reprendre n'est plus là |
| `creerComptage($u,$empId,$note)`, `comptageScanner($u,$id,$pieceId,$qte,'ajouter'|'fixer')`, `comptageRetirer`, `comptageAnnuler`, `comptageDetail($u,$id,$inclureNonComptees)`, `comptageAppliquer($u,$id,$inclureNonComptees)` | employé (appliquer : gestionnaire) | un seul comptage ouvert par emplacement |
| `trouverParCode($u,$code)` | employé | pièce ou emplacement ; `null` si inconnu |
| `pieceDetail($u,$pieceId)`, `piecesRecherche($u,$q,$limite)` | employé | coûts/prix présents **seulement** pour gestionnaire+ |
| `document($u,$docId)` | employé | accès : émetteur ou destinataire ; coûts masqués pour l'employé |
| `listeEntreprises`, `listeEmplacements`, `emplacementsDestination`, `entreprisesDestination` | | pour les listes déroulantes |
| `valeurInventaire($u, $entrepriseIds)`, `sousMinimum($u, $entrepriseIds)`, `bilanMensuel($u,$annee,$mois,$entA,$entB)` | gestionnaire / employé / gestionnaire | voir le code pour la forme des retours |
| `definirPrixFournisseur($u,$pieceId,$fournisseurId,$prix,$noFournisseur?,$date?,$note?)`, `codeDisponible($code,$sauf)` | gestionnaire | historique de prix automatique |
| `transaction(function () { … })` | | à utiliser pour toute écriture multi-étapes **hors** du service |

Si une opération dont vous avez besoin n'existe pas dans le service, **ne bricolez pas des UPDATE sur `stock`** :
voir §11.

## 5. Gabarits

**Page** (`pages/exemple.php`) :

```php
<?php
if (!acces_page('gestionnaire')) { return; }      // rôle minimum de la page
page_script('assets/js/exemple.js');
?>
<div class="content-wrapper">
  <?php page_titre('Titre de la page', array('Section')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body"> … </div></div>
  </div></section>
</div>
```

**Endpoint d'écriture** (`app/action/exemple_save.php`) :

```php
<?php
require_once '../init.php';
exiger_post();
endpoint(function () {
	$d = entree();
	$r = inventaire()->transferer(utilisateur_id(), $d);   // le service valide tout et vérifie les droits
	return $r;                                              // fusionné dans {"ok":true, …}
});
```

Validation d'une écriture **hors service** (catalogue, admin) :

```php
inventaire()->exiger(utilisateur_id(), 'catalogue');                       // rôle (lève InventaireException)
$nom = trim((string) ($d['nom'] ?? ''));
if ($nom === '') { throw new InventaireException('Le nom est obligatoire.', 'nom'); }   // 2e argument = champ fautif
```

**Endpoint DataTables** (`app/ajax/exemple_data.php`) : voir `DataTable.php` ; côté JS :
`$('#t').DataTable({ serverSide: true, processing: true, ajax: { url: 'app/ajax/exemple_data.php', type: 'POST' }, columns: [{data:'code'}, …] })`
(le jeton CSRF est ajouté automatiquement par `app.js`).

## 6. JavaScript commun (`assets/js/app.js`, déjà chargé)

`api.get(url, params)` / `api.post(url, objet)` → Promise (rejette avec `Error(message)`, `e.champ`) ·
`toast(msg, 'success'|'danger'|'warning'|'info')` · `esc(texte)` (**obligatoire** avant tout `innerHTML`) ·
`fmtArgent`, `fmtQte` · `bip(true|false)` · `scanner(input, function (code) {…})` (Entrée/Tab du lecteur ; garde le focus ;
retournez `false` ou lancez une erreur pour le bip d'échec) · DataTables et Select2 déjà en français.
Le champ de scan : `<div class="scan-box"><input class="form-control scan-input" autocomplete="off" inputmode="none"…></div>`.

### Composant partagé de saisie de lignes (`assets/js/saisie-lignes.js`)

Réception, transfert, sortie, ajustement et facture interne **doivent** l'utiliser (même comportement partout) :
`page_script('assets/js/saisie-lignes.js'); page_script('assets/js/<votre>.js');` puis
`var sl = SaisieLignes.creer({ conteneur:'#lignes', scan:'#scan', recherche:'#recherche', coutColonne:true, emplacementSource:function(){…}, coutParDefaut:function(piece){…}, onEmplacement:function(emp){…}, onChange:function(lignes){…} })`
— `sl.lignes()` (charge utile du service), `sl.valider()`, `sl.vider()`, `sl.focus()`, `sl.rafraichir()`. Lisez l'en-tête du fichier pour toutes les options.
Exemple d'utilisation : `pages/_essai_lignes.php` + `assets/js/_essai_lignes.js` (page d'essai, à ne pas modifier) ; test : `tests/e2e/composant-lignes.js`.
Si le composant a un défaut ou un manque, **ne le modifiez pas** : voir §11 (demande au noyau) et contournez dans votre fichier.

## 7. Règles de sécurité (non négociables — un relecteur les vérifiera une par une)

1. **XSS** : toute valeur issue de la base ou de l'utilisateur est échappée (`e()` en PHP, `esc()` en JS, `textContent`).
   `DataTable::repondre` échappe déjà ; les `formateurs` doivent échapper eux-mêmes. Testez avec le nom de pièce
   `<img src=x onerror=alert(1)>` partout où il s'affiche (listes, fiches, étiquettes, impressions, listes déroulantes, toasts).
2. **SQL** : requêtes préparées uniquement ; jamais de concaténation d'une valeur du navigateur. Tri/colonnes : liste blanche (DataTable le fait).
3. **Écritures** : `exiger_post()`, jeton CSRF (automatique via `app.js`/`api.post`), **rôle vérifié côté serveur**
   (cacher un bouton n'est pas un contrôle d'accès), et **entreprise vérifiée** : tout id d'emplacement/entreprise/document venant
   du navigateur doit être rapproché de `$Ouser->entreprisesAutorisees()` (le service le fait ; vos requêtes directes aussi).
   Un employé de l'entreprise 1 ne doit jamais pouvoir lire ni modifier l'entreprise 2 en changeant un id dans l'URL ou le JSON (IDOR).
4. **Coûts** : un employé ne voit **aucun** coût/prix/valeur (ni dans le HTML, ni dans le JSON, ni dans les exports). Vérifiez la réponse brute.
5. **Aucune fuite d'erreur** : jamais `echo $e->getMessage()` pour une erreur SQL/PHP ; `endpoint()` s'en charge.
6. **Pas de suppression physique** ; **pas de secret en dur** ; pas de `eval`, `unserialize`, `exec`, `include` dynamique.
7. **Fichiers téléversés** (import CSV) : taille max 2 Mo, extension et contenu vérifiés, jamais enregistrés dans le dossier web ni exécutés, jamais inclus.
8. **Exports CSV** : neutraliser l'injection de formules (valeur commençant par `= + - @ \t \r` → préfixer d'une apostrophe), UTF-8 avec BOM, séparateur `;` (Excel fr-CA), décimales avec virgule, en-têtes `Content-Disposition: attachment`.
9. Toute modification de catalogue/prix/utilisateur/emplacement/entreprise écrit dans le `journal`.

## 8. Règles d'interface et de langue

* **Français du Québec**, vouvoiement, messages courts et concrets (« Stock insuffisant pour « P-0003 » à « Cube 12 » : disponible 2, demandé 5. »).
  Pas d'anglais visible (sauf noms de produits). Pas de jargon technique dans les messages.
* Dates `AAAA-MM-JJ` (champ `<input type="date">`, `max` = aujourd'hui) ; argent `1 234,56 $` ; quantités sans zéros inutiles.
* **Saisie au scanner d'abord** : sur les écrans de saisie (réception, transfert, sortie, facture interne, comptage), le curseur est
  dans le champ de scan ; scanner une pièce ajoute une ligne (ou fait +1 sur la ligne existante) ; scanner un code `EMP-…` choisit
  l'emplacement ; pièce inconnue → message clair + bip d'erreur (jamais de blocage silencieux). Tout se fait aussi **au clavier et à la souris**.
* Utilisable sur **tablette** (≥ 768 px de large) : zones cliquables ≥ 44 px, champs de saisie de quantité `inputmode="decimal"`.
* Chaque écran gère : chargement, liste vide (message utile), erreur serveur, double clic (désactiver le bouton pendant l'envoi),
  session expirée (déjà géré par `api`), confirmation avant action destructrice (annuler un document, désactiver…).
* Après un succès : message vert avec le **numéro du document** et lien vers lui ; le formulaire se remet à zéro prêt pour le suivant.
* Une page imprimable (facture interne, bilan, étiquettes) se met en page propre avec `@media print` (la coquille masque déjà menu et boutons `.no-print`).
* Accessibilité de base : `<label for>` sur chaque champ, contraste suffisant, focus visible, ordre de tabulation logique.

## 9. Droits (qui voit/fait quoi)

| | Employé | Gestionnaire | Admin |
|---|---|---|---|
| Consulter pièces, stock, scan, documents, historique | ✔ (sans coûts) | ✔ | ✔ |
| Transfert interne, sortie, comptage (créer/scanner) | ✔ | ✔ | ✔ |
| Réception, ajustement, facture interne, annulation, appliquer un comptage | ✘ | ✔ | ✔ |
| Pièces/fournisseurs/catégories/prix/étiquettes (écriture) | ✘ | ✔ | ✔ |
| Bilan, valeur d'inventaire, factures internes (liste) | ✘ | ✔ | ✔ |
| Utilisateurs, entreprises, emplacements, journal, sauvegarde | ✘ | ✘ | ✔ |

Chacun ne voit que **ses** entreprises (`utilisateur_entreprises`) ; l'admin voit tout.

## 10. Contrats entre modules

* Les modules se lient par les routes du §2 (`index.php?page=piece_voir&id=12`). Route supplémentaire : `pieces_import` (import CSV).
* **Préremplissage par l'URL** (les pages de saisie du module B l'acceptent, les autres modules s'y lient) :
  `index.php?page=reception|transfert|sortie|ajustement|facture_interne&piece_id=12` (ajoute la pièce, quantité 1) et
  `&emplacement_id=3` (présélectionne l'emplacement source/réception). `etiquettes` accepte `&piece_id=12` ou `&emplacement_id=3`.
  `comptage_voir&id=…`, `document_voir&id=…`, `piece_voir&id=…`, `facture_interne_voir&id=…`.
* Endpoints partagés déjà fournis : `app/ajax/pieces_recherche.php`, `app/ajax/scan_code.php`, `app/ajax/emplacements_liste.php`, `app/ajax/code128.php`.
* **Un seul module écrit un fichier donné.** Propriété par préfixe de nom de fichier (pages, endpoints `app/ajax|action/`, JS, tests e2e) :

| Module | Préfixes / fichiers |
|---|---|
| A1 Catalogue | `pieces`, `piece_*`, `fournisseur*`, `categorie*`, `prix_*`, `seuil_*` — JS `catalogue.js` |
| A2 Étiquettes et import | `etiquette*`, `import_*`, `pieces_import*`, `pieces_export*` — JS `etiquettes.js`, `import.js` |
| B Mouvements | `reception*`, `transfert*`, `sortie*`, `ajustement*`, `document*` — JS `mouvements.js` |
| C Inter-entreprises et rapports | `facture*`, `bilan*`, `valeur*` — JS `interentreprise.js` |
| D1 Scanner et comptage | `scanner*`, `comptage*` — JS `scan.js`, `comptage.js` |
| D2 Stock, tableau de bord, historique | `stock*`, `dashboard*`, `historique*`, `sous_minimum*` — JS `stock.js`, `dashboard.js` |
| E Administration | `utilisateur*`, `entreprise*`, `emplacement_*`, `emplacements` (page), `journal*`, `profil*`, `pages/backup_database.php` — JS `admin.js` |

Ne créez pas de fichier dans le territoire d'un autre module ; n'en modifiez aucun.

## 11. Fichiers que vous ne modifiez PAS

`app/classes/*`, `app/init.php`, `app/functions.php`, `app/config/*`, `app/database/*`, `inc/*`, `assets/js/app.js`,
`assets/css/beauchemin.css`, `database/schema.sql`, `tests/*.php`, `tests/e2e/lib.js`, `tools/*`.
Besoin d'un changement dans l'un d'eux (nouvelle méthode du service, colonne, fonction utilitaire) ? **N'y touchez pas** :
décrivez-le précisément dans la section « Demandes au noyau » de votre rapport final (quoi, pourquoi, signature proposée) et, si
vous pouvez continuer sans, contournez dans **vos** fichiers. Les demandes sont appliquées par le coordinateur.

## 12. Définition de « terminé » pour un module

1. Toutes vos pages se chargent pour les rôles autorisés, **sans erreur PHP** (journal propre), **sans erreur JS** (console propre).
2. Chaque endpoint : non connecté → 401 ; sans jeton CSRF (POST) → 403 ; mauvais rôle → refus ; mauvaise entreprise → refus ; entrée
   invalide → 400 avec message français ; aucune valeur non échappée.
3. Les parcours principaux fonctionnent **au scanner** (simulé : taper le code + Entrée) et à la souris, en français.
4. Un test `tests/e2e/<module>.js` (Playwright, `tests/e2e/lib.js`) rejoue vos parcours clés et passe ; il vérifie aussi un cas d'erreur
   et un contrôle d'accès (employé refusé / autre entreprise refusée) et la présence d'aucune erreur console.
5. Après vos tests, **`tests/run.sh` passe toujours** (vous n'avez pas cassé le noyau) et l'invariant stock = Σ mouvements tient.
6. Rapport final (court, en français) : fichiers créés, parcours testés (avec résultats), limites connues, **Demandes au noyau**.
