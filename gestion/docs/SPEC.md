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
`dashboard, scanner, stock, plan, reception, transfert, sortie, ajustement, facture_interne, comptage, comptage_voir(id),
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
* `plan_emplacements(emplacement_id PK/FK, x, y, largeur, hauteur, modifie_le, modifie_par, rayon_allees, rayon_etageres, rayon_niveaux)` : place libre de la tuile d'un emplacement sur le plan (une ligne par emplacement ; pas de ligne ou x NULL = place automatique) et dimensions de ses rayonnages (NULL = défaut du type). Voir §13.
* `rangements(emplacement_id, piece_id PK/FK en cascade, allee, etagere, niveau, modifie_le, modifie_par)` : **où**, dans un emplacement, se trouve physiquement une pièce. Le stock reste compté par pièce et par emplacement ; le rangement n'est qu'une position (aucun effet sur le stock, les coûts ni les mouvements). Voir §13.
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

Règles à connaître (elles ont changé après la première relecture) :

* **Pièce désactivée** : on ne peut plus la recevoir, l'ajuster à la hausse ni la facturer, mais on peut toujours **vider son stock** (sortie, transfert,
  ajustement négatif, comptage) — un stock ne reste jamais « bloqué ». `piecesRecherche` ne renvoie que les pièces actives.
* **Résultat d'une opération** (`recevoir`, `transferer`, …) : `id`, `numero` et — **seulement pour gestionnaire+** — `total`. Un employé ne reçoit jamais de valeur.
* **Emplacement d'une autre entreprise** : pour l'utilisateur sans accès, il est « introuvable » (on ne révèle ni son nom ni son état). `document()` met à `null`
  `emplacement` / `emplacement_dest` s'ils appartiennent à une entreprise inaccessible. L'annulation d'une facture interne n'explique pas pourquoi le destinataire
  ne peut plus rendre la marchandise si l'utilisateur n'a pas accès à cette entreprise.
* `comptageAppliquer` : si les écarts dépassent `MAX_LIGNES` (300), il crée **plusieurs** ajustements dans la même transaction ; le résultat contient `documents` (liste)
  en plus de `document_id` / `numero` (le premier).
* `definirPrixFournisseur($u,$piece,$fournisseur,$prix,$no,$date,$note)` : `$no` et `$note` à `null` = **inchangés** ; chaîne vide = **effacés**.
* `codeUtilisePar($code, $sauf)` dit **qui** détient un code (`piece` / `alias` / `emplacement`, `libelle`) ; `codeDisponible` en est la version booléenne.
* `trouverParCode` : un emplacement trouvé porte `actif` ; `comptageDetail` : chaque ligne porte l'`actif` de la pièce.
* Le coût moyen d'une entreprise **n'est jamais remis à zéro** par une annulation (si le calcul inverse est impossible, la moyenne actuelle est conservée).

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
`fmtArgent`, `fmtQte` · `bip(true|false)` (silencieux : signale reconnu/refusé, aucun son) · `scanner(input, function (code) {…})` (Entrée/Tab du lecteur ; **file d'attente** : aucun scan n'est perdu même en rafale ; remet le focus au champ quand la file est vide,
sauf si l'utilisateur saisit ailleurs ; retournez `false` ou lancez une erreur pour l'échec ; `data-attente` du champ = scans en attente). Une frappe tombée sur une liste
déroulante, un bouton ou la page est automatiquement redirigée vers le champ de scan (`.scan-input`) de la page · DataTables et Select2 déjà en français.
Le champ de scan : `<div class="scan-box"><input class="form-control scan-input" autocomplete="off" inputmode="none"…></div>`.

### Composant partagé de saisie de lignes (`assets/js/saisie-lignes.js`)

Réception, transfert, sortie, ajustement et facture interne **doivent** l'utiliser (même comportement partout) :
`page_script('assets/js/saisie-lignes.js'); page_script('assets/js/<votre>.js');` puis
`var sl = SaisieLignes.creer({ conteneur:'#lignes', scan:'#scan', recherche:'#recherche', coutColonne:true, emplacementSource:function(){…}, coutParDefaut:function(piece){…}, onEmplacement:function(emp){…}, onChange:function(lignes){…} })`
— `sl.lignes()` (charge utile du service), `sl.valider()`, `sl.vider()`, `sl.focus()`, `sl.rafraichir()`. Lisez l'en-tête du fichier pour toutes les options.
Exemple d'utilisation : `pages/_essai_lignes.php` + `assets/js/_essai_lignes.js` (page d'essai, à ne pas modifier) ; test : `tests/e2e/composant-lignes.js`.
Si le composant a un défaut ou un manque, **ne le modifiez pas** : voir §11 (demande au noyau) et contournez dans votre fichier.

**Thème** : `.btn-danger` est stylé globalement (fond rouge, texte blanc) dans `beauchemin.css` ; le menu latéral fait 285 px (corrigé en mode tablette) ; l'impression
est en format lettre portrait avec marges de 12 mm (les notifications `#toasts` ne s'impriment jamais).

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
  l'emplacement ; pièce inconnue → message clair + cadre rouge (jamais de blocage silencieux). Tout se fait aussi **au clavier et à la souris**.
* Utilisable sur **tablette** (≥ 768 px de large) : zones cliquables ≥ 44 px, champs de saisie de quantité `inputmode="decimal"`.
* Chaque écran gère : chargement, liste vide (message utile), erreur serveur, double clic (désactiver le bouton pendant l'envoi),
  session expirée (déjà géré par `api`), confirmation avant action destructrice (annuler un document, désactiver…).
* Après un succès : message vert avec le **numéro du document** et lien vers lui ; le formulaire se remet à zéro prêt pour le suivant.
* Une page imprimable (facture interne, bilan, étiquettes) se met en page propre avec `@media print` (la coquille masque déjà menu et boutons `.no-print`).
* Documents (facture interne, réception, déplacement, utilisation, correction du stock, bilan du mois) : en-tête avec le logo de l'entreprise émettrice
  (`Marque`, d'après le code BEA/BCH), `assets/css/documents.css` (écran et A4), et un PDF serveur par `app/ajax/document_pdf.php?id=` et `app/ajax/bilan_pdf.php`.
  Le texte vient d'un seul modèle (`DocumentVue`, mêmes droits et mêmes masques que la page) ; `DocumentsPdf` le met en page avec `PdfDocument` (FPDF 1.9 dans `app/lib/fpdf`, jamais servi par le web).
  L'employé ne reçoit aucun montant ni aucune facture interne en PDF.
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
| F Plan de l'entrepôt | `plan` (page), `plan_*` (endpoints), classe `app/classes/Plan.php`, `database/migrations/*`, `database/migrer.php` — JS `plan.js`, CSS `plan.css`, test `tests/e2e/plan.js` |

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

## 13. Plan de l'entrepôt (page `plan`) : temps réel, disposition libre

**Principe.** Une tuile par emplacement **actif** des entreprises que l'utilisateur peut **consulter** (même règle que la page Stock, y compris une entreprise désactivée).
Tout le calcul est dans `app/classes/Plan.php` (testé par `tests/run.php`, sans HTTP) ; les endpoints ne font que valider l'entrée et appeler la classe.
Lecture seule du stock. **Aucun coût, prix ni valeur n'est lu ni envoyé, pour aucun rôle** : un employé reçoit exactement les mêmes champs qu'un gestionnaire
(clés `unites`, `nb_pieces`, `nb_bas`, `somme` : jamais `total`, `valeur`, `prix`, `cout`, que l'audit de sécurité surveille).

| Fichier | Rôle |
|---|---|
| `pages/plan.php` | page (employé+) ; les données de départ sont dans `data-donnees` (aucun JavaScript en ligne : la CSP reste stricte) |
| `app/ajax/plan_data.php` | `?piece_id=` facultatif. `{version, admin, zone, resume:{unites, nb_bas, nb_emplacements}, tuiles:[{id, nom, code, type, type_libelle, entreprise_*, nb_pieces, unites, nb_bas, sig, pos}], recherche:{piece, emplacements:[{emplacement_id, quantite, rangement}], somme}}` (`rangement` : voir « Rangements » ci-dessous). `resume` alimente les cartes de la vue 3D : unités en stock, pièces sous le minimum (une pièce compte une fois par entreprise, même règle que la pastille d'alerte), nombre d'emplacements — des quantités seulement |
| `app/ajax/plan_version.php` | le jeton de version (42 octets) ; la session est relâchée tout de suite |
| `app/ajax/plan_emplacement.php` | `?emplacement_id=&q=` : contenu d'une tuile, trié par nom, 400 pièces au plus (`tronque` : la recherche rapide interroge alors le serveur). 403 identique pour un emplacement inexistant, désactivé ou d'une autre entreprise. Ajoute `geometrie`, `peut_ranger`, `nb_a_ranger` et, par ligne, `rangement` (voir « Rangements ») |
| `app/action/plan_rangement_save.php` | **gestionnaire+** ayant accès à l'entreprise de l'emplacement (403 sinon). `{emplacement_id, piece_id, allee, etagere, niveau}` ou `{emplacement_id, piece_id, retirer: true}` → `{ok, rangement}`. Journal `plan.rangement` |
| `app/action/plan_rangement_auto.php` | même droits. `{emplacement_id}` → `{ok, nb, restantes}` : range les pièces en stock sans position. Journal `plan.rangement_auto` |
| `app/action/plan_geometrie_save.php` | **administrateur seulement**. `{emplacement_id, allees, etageres, niveaux}` ou `{emplacement_id, defaut: true}` → `{ok, geometrie, personnalisee, retires}`. Journal `plan.geometrie` |
| `app/action/plan_save.php` | **administrateur seulement** (403 sinon). `positions:[{emplacement_id, x, y, largeur, hauteur}]` : entiers multiples de 20, tuile dans le plan (1600 x 1200), taille de 140 x 100 à 600 x 400, pas de doublon, emplacements actifs et consultables ; **tout ou rien** ; une ligne par emplacement ; seules les tuiles modifiées sont écrites ; journal `plan.disposition` (rien si rien n'a changé) |
| `app/ajax/plan_lib.php` | outils communs (réponses JSON, 403/400/500), 404 si appelé directement |
| `assets/js/plan3d.bundle.js` | **vue 3D** : scène Three.js (r186) en un seul script classique, construit par `tools/plan3d/` (esbuild) et versionné ; expose `window.Plan3D = { disponible(), creer(conteneur, options) }`. Aucun serveur Node à l'exécution |
| `assets/js/plan3d-ui.js` | interface de la 3D : création/destruction de la scène, étiquettes HTML, cartes, barre d'outils, lecture des changements en direct |
| `assets/css/plan3d.css` | commutateur 3D / Tuiles, scène, étiquettes, cartes, outils, fiche flottante |

**Jeton de version.** `Plan::versionPour($entreprises)` : `<dernier id de mouvement>-<nb d'emplacements>-<empreinte>`, calculé **uniquement** sur les emplacements des entreprises de l'utilisateur
(un mouvement chez l'autre entreprise ne le change pas : aucune fuite). Il change pour toute réception, déplacement, utilisation, correction, comptage appliqué, facture interne et annulation
(chacun laisse au moins un mouvement), et quand un emplacement est créé, renommé, (dés)activé ou déplacé sur le plan, quand ses rayonnages changent et quand une position de rangement est posée, modifiée ou retirée (une empreinte CRC32 des lignes de `rangements` de l'emplacement, lue par la clé primaire : coût proportionnel au nombre de pièces rangées). Il ne couvre pas les minimums ni les noms de pièces : la page relit tout
de toute façon **chaque minute**.

**Coût d'une interrogation** (mesuré avec 400 000 mouvements et 5 emplacements, MariaDB 10.11, serveur de développement PHP) : **une requête SQL**, 0,47 ms ; la requête HTTP complète
`plan_version.php` prend 2,6 ms en moyenne (p95 : 3,5 ms), comme le plus léger des autres endpoints (`emplacements_liste.php` : 2,6 ms) ; `plan_data.php` 4,4 ms ; `plan_emplacement.php` 3,6 ms.
Dix utilisateurs qui laissent la page ouverte = 2,5 interrogations par seconde. Le dernier mouvement de chaque emplacement se lit d'**un seul accès** dans l'index
`ix_mouv_emplacement_id (emplacement_id, id)` (ajouté au schéma et à la migration) avec `ORDER BY id DESC LIMIT 1` et `FORCE INDEX` : un `MAX(id)` corrélé, lui, parcourt tous les
mouvements de l'emplacement (64 ms pour 400 000 lignes, et de plus en plus). Le coût est proportionnel au nombre d'emplacements, jamais au nombre de mouvements. L'empreinte des rangements ajoute environ 0,25 ms par millier de pièces rangées (mesuré : 32 000 positions dans 32 emplacements, `versionPour` passe de 0,57 ms à 8 ms ; pour quelques centaines de pièces, c'est de l'ordre de 0,1 ms).

**Interrogation côté navigateur** (`assets/js/plan.js`) : toutes les 4 s, **une seule requête à la fois** (délai maximal de 8 s), arrêt complet quand l'onglet est caché, interrogation immédiate au retour,
recul exponentiel (4, 8, 16… 30 s) après une erreur réseau et indicateur « Connexion perdue » (jamais de message technique), reprise automatique (événement `online` compris). Quand le jeton change :
relecture de `plan_data.php` (le jeton y est lu **avant** les données : un mouvement arrivé entre-temps est revu au tour suivant) ; les tuiles dont `sig`, `nb_pieces`, `unites` ou `nb_bas` ont changé pulsent
(`prefers-reduced-motion` : simple contour, sans animation). Le tiroir ouvert et la recherche active se mettent à jour aussi.

**Disposition.** Écran large (≥ 768 px) : surface de tuiles positionnées en pixels sur une grille de 20 ; sans aucune place enregistrée, rangement automatique (une rangée par type, entrepôts puis boutiques puis cubes, puis entreprise) avec le titre de chaque groupe ;
dès qu'une place existe, les tuiles non placées se rangent automatiquement **sous** les autres. Téléphone : liste de cartes, sans glisser-déposer. Modification (administrateur) : pointer events (souris, doigt, stylet),
accrochage à 20 px, limites du plan, recouvrement refusé (la tuile revient à sa place), flèches du clavier (Maj : taille), défilement automatique près du bord de l'écran, « Annuler » rétablit, « Tout ranger » range en grille.

**Vue 3D** (`assets/js/plan3d*.js`, `assets/css/plan3d.css`, sources dans `tools/plan3d/src/`). Deux vues des **mêmes données** (une seule lecture de `plan_data.php`, un seul jeton de version) : « 3D » et « Tuiles ». La 3D est la vue par défaut quand WebGL fonctionne et que l'écran fait au moins 768 px ; sinon (téléphone, WebGL absent ou refusé, contexte perdu pour de bon) c'est la vue Tuiles, qui reste la vue accessible au clavier et la seule où l'on **modifie** le plan (le bouton « Modifier le plan » y bascule, puis ramène à la 3D). Le choix est gardé dans `localStorage` (`beauchemin.plan.vue`, toujours dans un `try`). Une création de contexte refusée n'affiche **aucun message**.
* **Scène.** Caméra orthographique isométrique (azimut 45 °, élévation 35 °), contrôleur maison (glisser = déplacer, molette/pincement = zoom vers le pointeur, clic droit/deux doigts = pivoter puis calage sur un pas de 90 °, flèches, +/−, Q/E, Origine quand le canevas a le focus). Un bâtiment par emplacement, posé à sa place enregistrée (1 case de 20 px = 1 mètre), même rangement automatique que les tuiles pour les emplacements jamais placés. Entrepôt : tôle nervurée, toit en dents de scie aux couleurs de l'entreprise (BEA bleu marine + liseré vert/cyan, BCH rouge + liseré or), portes de quai avec palettes visibles ; boutique : vitrine, auvent rayé, enseigne ; cube de service : camion à caisse ouverte et hayon. Décor fixe fusionné (chariot, cage de propane à bouchons turquoise, cônes, arbres, haies) ; sol, parcelles et marquages jaune-orangé s'adaptent à l'étendue.
* **Remplissage.** Niveau = `0,12 + 0,88 · log10(1 + unités) / log10(1001)` (plafonné à 1 ; vide = quai vide ; minimum de 3 cartons si non vide) ; tous les cartons sont **une seule** `InstancedMesh` (et les palettes une autre), l'échelle de chaque carton s'anime de 0 à 1.
* **Rendu à la demande.** `requestAnimationFrame` ne tourne que pendant une interaction ou une animation ; au repos, aucune image. Pixel ratio plafonné à 2, ombres douces (shadow map 2048, 1024 sur téléphone) **recalculées seulement quand la scène change** (pas quand la caméra bouge), soleil lié à la caméra (belle vue sous les quatre orientations), arrêt quand l'onglet est caché, `dispose()` complet (géométries, matériaux, textures, contexte) au changement de vue, perte de contexte gérée (restauration, sinon repli sur Tuiles après 3,5 s). Aucun `eval`, aucun JavaScript en ligne, textures par `CanvasTexture`, aucune image ni modèle externe : la CSP reste stricte.
* **Étiquettes.** Boutons HTML (Tab, Entrée) positionnés à chaque image d'après la projection 3D : nom + « N pièces · N unités », pastille d'alerte rouge pulsante si des pièces sont sous le minimum ; celles qui se chevauchent ou qui sont derrière un bâtiment plus proche sont masquées (priorité à l'emplacement choisi puis à ceux de la recherche) mais redeviennent visibles au focus.
* **Recherche.** Épingle de carte bleue qui tombe en rebondissant sur chaque emplacement trouvé, pastille de quantité sur l'étiquette, autres bâtiments estompés, caméra qui cadre les résultats. **Sélection** : cadre au sol et éclat du bâtiment, recentrage, fiche (le tiroir) qui flotte dans la scène à droite (panneau plein écran sur téléphone).
* **Temps réel.** Au changement du jeton, `plan3d-ui.js` compare l'ancien et le nouvel instantané (unités par emplacement) : anneau lumineux au sol sur les bâtiments touchés, « +3 » vert / « −2 » rouge qui flotte, cartons qui apparaissent/disparaissent, et si un emplacement perd N pendant qu'un autre gagne N, un carton vole en arc de l'un à l'autre (les cartons d'arrivée n'apparaissent qu'à l'atterrissage). Rien ne change = aucune animation. `prefers-reduced-motion` : pas de vol, pas de glissement de caméra, changements immédiats, repère fixe.
* **Bâtiments et logos.** Les logos réels (`assets/img/logo-beauchemin.png`, `assets/img/logo-boutique-chaleur.png`, passés à la scène par `data-logo-bea` / `data-logo-bch` de `#pl3-scene`) sont chargés par la scène (`new Image()` du même domaine, redessinés sur un canevas puis posés en `CanvasTexture` sRGB, filtrage anisotrope et mipmaps) et collés **des deux côtés** de la caisse de chaque camion : Beauchemin = caisse blanche, bande verte et cyan, cabine bleue ; Boutique Chaleur (cube rouge) = caisse blanche, bande rouge et or, cabine rouge ; une entreprise sans logo = camion blanc avec son nom. Tant qu'un logo n'est pas arrivé (ou s'il est introuvable) le nom de l'entreprise reste dessiné à sa place, sans message ni erreur. Les modèles s'inspirent de photos fournies par le client : boutique Boutique Chaleur (revêtement gris, corniche rouge et fronton central, auvents rayés rouges, enseigne « Boutique Chaleur » avec la flamme, cheminée de brique rouge, vitrines du showroom), bâtiment Beauchemin (toit de tôle saumon sur brique beige, entrée vitrée, panneau BEAUCHEMIN, drapeaux en goutte, manche à air), réservoirs de propane couchés derrière une clôture ; l'entrepôt de Beauchemin est un grand entrepôt bleu marine accolé à un bloc de bureaux brique et saumon, celui de Boutique Chaleur un entrepôt à toit rouge ; l'entrepôt neutre garde le modèle générique. Plaques et auvents d'un même bâtiment qui partagent une texture sont fusionnés (un seul dessin).
* **Intérieur d'un emplacement (vue en coupe).** Le bouton « **Voir l'intérieur** » du tiroir (3D seulement), un **double-clic** sur le bâtiment ou « **Voir sur l'étagère** » (tiroir d'un emplacement qui a la pièce cherchée) lisent `plan_emplacement.php` (`geometrie`, `lignes[].rangement`, `peut_ranger`) et remplacent le plan par une coupe : entrepôt (rayonnages à montants bleus, lisses orange et tablettes, allées jaunes, chariot, extincteur, zone « À ranger » près de la porte avec ses palettes au sol), cube de service (caisse du camion en coupe : côté gauche = allée 1, côté droit = allée 2, pièces sans position au sol près du hayon) ou boutique (showroom : foyer au gaz à flamme discrète, poêle à bois noir avec tuyau, foyer en pierre, décorations et panneau « Poêles · Foyers · Décorations » ; arrière-boutique avec comptoir et rayonnages). **Une caisse par pièce en stock, dans SA case** (allée, étagère, niveau), avec son code et sa quantité sur deux faces ; plus de trois pièces dans la même case : les trois premières, puis une plaque « +N » ; plus de stock = caisse plus grosse (plafonnée par la case), une pièce de 150 unités ou plus se double d'un second carton ; les cases vides restent discrètes ; lettres d'allée, numéros d'étagère et de niveau en plaques. Au survol (ou au focus clavier) d'une caisse : fiche flottante (code, nom, quantité, « Allée B · Étagère 3 · Niveau 2 » ou « Côté gauche · … », « Sous le minimum ») et cadre sur la case ; un clic ouvre la ligne de la pièce dans le tiroir. **Recherche** : épingle bleue au-dessus de la caisse, cadre bleu, autres caisses estompées, caméra qui cadre la travée (et la recherche saisie pendant la visite suit). **Temps réel** : le plan relu (jeton de version, qui couvre les rangements) relit aussi l'intérieur visité ; une caisse dont la quantité change pulse et porte « +N » / « −N », les caisses apparaissent, disparaissent et changent de case en douceur (sans animation sous `prefers-reduced-motion`). **Rangement** (gestionnaire+, `peut_ranger`) : une caisse **glissée** dans une autre case (pointer events + lancer de rayon, cadre vert de la case visée, rouge si rien, la zone « À ranger » retire la position) est enregistrée par `plan_rangement_save.php` (CSRF) ; le serveur refuse : la caisse **revient** et le message du serveur s'affiche ; l'employé voit tout sans rien pouvoir déplacer (l'éditeur du tiroir reste l'autre voie, et la seule au clavier). « **Retour au plan** » (flèche, en haut à gauche, remplace les cartes de statistiques), **Échap** (d'abord la fiche, puis la visite) et un fil d'Ariane discret « Plan › Entrepôt principal » ; mêmes commandes de caméra (boutons, souris, doigts, clavier ; élévation 50 ° pour lire les rayonnages l'un derrière l'autre). Accessibilité : une liste de boutons (un par pièce, `aria-label` « code, nom, quantité, Allée B, étagère 3, niveau 2 » ou « à ranger ») suit la scène ; le focus éclaire la caisse. **Performance** : montants, lisses, tablettes, caisses et palettes sont des `InstancedMesh`, tout le décor fixe est fusionné, les étiquettes de caisses sont dessinées sur quelques grands canevas (atlas) et non une texture par caisse ; au repos aucune image (les flammes ne vacillent que quelques secondes après l'entrée ou une interaction) ; **tout est libéré en quittant** (géométries, matériaux, textures, instances, écouteurs : aucune fuite sur 10 visites, vérifié par le test). Sans WebGL ou en Tuiles, aucun bouton d'intérieur : les positions se lisent en texte dans le tiroir.
* **Tests.** `tests/e2e/plan3d.js` lit des compteurs discrets sur `#pl-3d` (`data-images`, `data-dessins`, `data-triangles`, `data-ms`, `data-epingles`, `data-pulses`, `data-vols`, `data-zoom`, `data-azimut`…) et sur les étiquettes (`data-cartons`, `data-epingle`, `data-bas`, `data-logo`) ; dans un intérieur : `data-interieur` (id visité), `data-caisses`, `data-zone`, `data-cachees`, et sur chaque bouton de la liste du clavier `data-piece` et `data-case` (« allée:étagère:niveau » ou « zone ») ; l'événement `pl3-positions` demande les places à l'écran (`data-x`, `data-y`) pour piloter la souris. Aucune API globale de test.

**Rangements (où est chaque pièce dans l'emplacement).** Le stock est compté **par pièce et par emplacement** (rien ne change) ; le rangement n'est qu'une **position** : allée, étagère, niveau. Tout le calcul est dans `Plan.php`.

* **Géométrie des rayonnages** d'un emplacement : `geometrie: { allees, etageres, niveaux }` (entiers ≥ 1). Défauts par type, définis une seule fois (`Plan::GEOMETRIE_DEFAUT`) : entrepôt 4 allées × 6 étagères × 4 niveaux ; boutique 2 × 4 × 3 ; cube de service 2 × 3 × 3. Réglable par l'administrateur, par emplacement (`plan_emplacements.rayon_allees`, `rayon_etageres`, `rayon_niveaux`, NULL = défaut du type) ; bornes 1–12 allées (**un cube : 2 au plus**), 1–30 étagères, 1–10 niveaux (`Plan::GEOMETRIE_MAX`, `Plan::geometrieLimites($type)`). Une allée est une rangée d'étagères (**cube : allée 1 = côté gauche, allée 2 = côté droit**) ; une étagère est une travée (« baie ») entre deux montants, numérotée à partir de 1 ; un niveau est une tablette, **niveau 1 = la plus basse**. Libellés : allées A, B, C… (entrepôt, boutique), « Côté gauche » / « Côté droit » (cube) — `Plan::libelleAllee()`, `Plan::libellePosition()` (« Allée B, étagère 3, niveau 2 »). Régler les rayonnages retire les positions qui sortent des nouvelles dimensions (les pièces redeviennent « à ranger » ; le stock ne change jamais) ; ramener à « défaut » supprime la ligne de `plan_emplacements` si elle n'a pas de place enregistrée (x, y, largeur, hauteur sont donc NULL-ables : une ligne peut ne porter que les rayonnages, la tuile garde alors sa place automatique).
* **Rangement d'une pièce** : table `rangements(emplacement_id, piece_id, allee, etagere, niveau, modifie_le, modifie_par)`, clé primaire `(emplacement_id, piece_id)` (une pièce a **au plus une position par emplacement** ; plusieurs pièces peuvent partager la même : une tablette porte plusieurs petites pièces), clés étrangères en cascade. La position **survit à un stock tombé à zéro** (réapprovisionnement) mais n'est montrée que pour les pièces qui ont du stock dans l'emplacement. Une position hors des rayonnages actuels est ignorée à la lecture (la pièce est « à ranger »).
* **Contrat de lecture** (les noms sont figés ; la vue 3D s'y fie) :
  * `plan_emplacement.php` : `geometrie: {allees, etageres, niveaux}` ; par ligne `rangement: {allee, etagere, niveau}` (trois entiers) ou `null` (= à ranger) et `piece_id` ; en plus `peut_ranger` (gestionnaire+ avec accès en écriture), `nb_a_ranger` (pièces **actives** en stock sans position, indépendant du filtre et de la troncature), `geometrie_defaut`, `geometrie_limites`, `geometrie_personnalisee` (réglage de l'administrateur). Les autres clés ne changent pas ; aucune clé de prix.
  * « Où est cette pièce ? » (`plan_data.php?piece_id=` : c'est lui qui donne la quantité par emplacement ; `scan_code.php` et `pieces_recherche.php` ne servent qu'à retrouver la pièce) : `recherche.emplacements: [{emplacement_id, quantite, rangement: {allee, etagere, niveau} | null}]`, seulement les emplacements où la pièce a du stock.
* **Écriture.** Tous : POST JSON + jeton CSRF, rôle et entreprise vérifiés côté serveur (employé : 403 ; emplacement inconnu, désactivé, d'une autre entreprise ou d'une entreprise désactivée : le **même** 403 neutre). Entiers stricts (nombre JSON ou chaîne de chiffres ; ni décimal, ni booléen, ni tableau), bornes de la géométrie de l'emplacement, 400 avec message français sinon.
  * `plan_rangement_save.php` : `{emplacement_id, piece_id, allee, etagere, niveau}` pose ou remplace ; `{emplacement_id, piece_id, retirer: true}` retire ; pièce existante et **active** pour poser. Réponse `{ok, rangement: {allee, etagere, niveau} | null}`. Journal `plan.rangement` (« Rangement modifié » : pièce, avant, après ; rien si rien ne change).
  * `plan_rangement_auto.php` : `{emplacement_id}` → `{ok, nb, restantes}`. Les pièces actives en stock sans position, **dans l'ordre de leurs codes**, remplissent les positions libres dans l'ordre allée → étagère → niveau, **trois pièces au plus par position** (les pièces déjà rangées comptent, même à stock zéro : leur place leur est gardée). Déterministe ; si toutes les positions sont pleines, les pièces restantes restent « à ranger » (`restantes`). Journal `plan.rangement_auto`.
  * `plan_geometrie_save.php` (administrateur) : `{emplacement_id, allees, etageres, niveaux}` ou `{emplacement_id, defaut: true}` → `{ok, geometrie, personnalisee, retires}`. Journal `plan.geometrie` (« Rayonnages modifiés »).
* **Tiroir** (`assets/js/plan.js`, fonctions du tiroir ; styles dans `plan.css`) : chaque ligne montre une pastille « B · 3 · 2 » (`aria-label` « Allée B, étagère 3, niveau 2 » ; cube : « G · 3 · 2 », « Côté gauche, étagère 3, niveau 2 ») ou « À ranger » (une pièce désactivée sans position n'en porte pas). Gestionnaire+ : un clic sur la pastille ouvre un éditeur (trois listes « Allée » — « Côté » pour un cube —, « Étagère », « Niveau », boutons « Enregistrer » et « Retirer ») ; Échap le ferme ; il survit aux mises à jour en direct. « Ranger automatiquement » (pied du tiroir) n'apparaît que s'il y a des pièces sans position. Employé : positions visibles, rien de modifiable. Administrateur : un bouton de réglage dans l'en-tête du tiroir ouvre « Allées / Étagères / Niveaux » (nombres bornés, « Par défaut », « Enregistrer »). Aucun texte explicatif.
* **Démonstration.** `database/demo.php` pose les positions de la plupart des pièces de chacun des 6 emplacements (pièces d'une même famille voisines ; deux petites pièces partagent une tablette) et laisse deux pièces de l'entrepôt de Beauchemin (P-0006, P-0014) « à ranger » ; il ajoute le cube de service « Cube 21 — Sophie » (Boutique Chaleur, `EMP-000006`), rempli par un déplacement depuis l'entrepôt de Boutique Chaleur.

**Base de données.** Table `plan_emplacements` et index `ix_mouv_emplacement_id` : dans `database/schema.sql` ET dans la migration idempotente `database/migrations/2026-10-12-plan.sql` ; colonnes `rayon_*`, places NULL-ables et table `rangements` : dans `schema.sql` ET dans `database/migrations/2026-10-13-rangements.sql`
(MariaDB et MySQL : la présence d'une colonne se teste dans `information_schema`, jamais `ADD COLUMN IF NOT EXISTS` ; `php database/migrer.php`, exécuté à chaque démarrage par le conteneur Docker ; voir `docs/DEPLOIEMENT.md`). Données de démonstration : `database/demo.php` pose une disposition (deux entrepôts en haut, cubes et boutique dessous).

