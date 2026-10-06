# Guide d'utilisation — Inventaire de pièces

Pour le personnel de **Beauchemin** et de **Boutique Chaleur**. Ce logiciel sert à savoir **où sont les pièces** : dans quel entrepôt,
quelle boutique ou quel **cube de service**, et combien il en reste.

## 1. Premiers pas

1. Ouvrez l'adresse du logiciel dans votre navigateur (ordinateur, tablette ou téléphone) et connectez-vous avec votre nom d'utilisateur.
2. En haut à droite, le **sélecteur d'entreprise** montre ce que vous consultez : *Toutes les entreprises*, *Beauchemin* ou *Boutique Chaleur*
   (selon vos droits). Il filtre les listes et les rapports.
3. Le **menu** à gauche s'adapte à votre rôle. Si une page n'y figure pas, c'est que votre rôle ne le permet pas.
4. Changez votre mot de passe dans *Mon profil et mot de passe* (menu en haut à droite) : vos **autres sessions ouvertes sont alors fermées**. Après 5 essais ratés, le compte est bloqué 15 minutes ; le message d'erreur est toujours le même (« Nom d'utilisateur ou mot de passe invalide »), qu'il s'agisse d'un compte inexistant, d'un mauvais mot de passe ou d'un compte bloqué.

| Rôle | Ce qu'il peut faire |
|---|---|
| **Employé** | Chercher/scanner une pièce, voir le stock, **transférer** (entrepôt → cube), **sortir** des pièces utilisées, **compter** un emplacement. Ne voit **aucun prix ni coût**. |
| **Gestionnaire** | Tout ce qui précède + **réceptions**, **ajustements**, **factures internes**, **annulations**, catalogue (pièces, fournisseurs, prix), étiquettes, importation, bilan mensuel et valeur d'inventaire. |
| **Administrateur** | Tout + utilisateurs, entreprises, emplacements, journal d'activité, sauvegardes. |

## 2. Le lecteur de codes-barres

* Un lecteur USB ou Bluetooth fonctionne comme un clavier : il **tape le code puis « Entrée »**. Aucun réglage n'est nécessaire.
* Chaque écran de saisie a un **gros champ de scan** encadré en bleu : le curseur y est déjà. **Scannez**, c'est tout.
  Un **bip aigu** = reconnu ; un **bip grave** + un message rouge = code inconnu ou refusé. Rien n'est jamais ignoré en silence.
* Vous pouvez scanner **très vite, plusieurs pièces de suite** : elles sont mises en file et traitées dans l'ordre. Scanner deux fois la même pièce ajoute 1 à chaque fois.
* Scanner l'**étiquette d'un emplacement** (code commençant par `EMP-`) choisit cet emplacement ou affiche son contenu.
* Pas de lecteur ? Utilisez la **recherche par nom ou par code** sous le champ de scan, ou le bouton **caméra** (téléphone/tablette ; le site doit être en HTTPS).
* Sur une tablette, le bouton clavier du champ de scan évite que le clavier à l'écran s'ouvre à chaque scan.

## 3. Tâches courantes (tout le monde)

### Savoir où est une pièce — *Scanner / Chercher*
Scannez la pièce : une fiche montre sa quantité **par entreprise puis par emplacement** (entrepôt, boutique, cubes) et les boutons d'action
(Transférer, Sortir, fiche complète). Une alerte rouge signale une pièce **sous le minimum**.

### Savoir ce qu'il y a dans un cube — *Scanner / Chercher*
Scannez l'**étiquette du cube** (`EMP-…`) : toutes les pièces et quantités qu'il contient s'affichent. Le bouton *Compter cet emplacement* lance un comptage.

### Charger un cube : transférer — *Transfert*
1. Choisissez la **source** (ex. *Entrepôt principal*) et la **destination** (ex. *Cube 12*) — ou scannez leurs étiquettes.
2. Scannez les pièces (chaque scan = +1) ; corrigez une quantité en cliquant dessus. La colonne **Disponible** montre ce qu'il y a à la source.
3. *Enregistrer*. Un numéro **TRF-AAAA-#####** est créé. Un transfert reste **dans la même entreprise** ; pour passer d'une entreprise à l'autre, c'est une *facture interne*.

### Pièces utilisées sur un appel de service — *Sortie (utilisation)*
Choisissez le cube, le **motif** (service, installation, perte/bris, retour au fournisseur, autre), le **numéro de bon de travail**, scannez les pièces utilisées, enregistrez
(**SOR-AAAA-#####**). Le stock du cube baisse tout de suite.

### Compter un emplacement — *Comptage*
1. *Nouveau comptage* : choisissez l'emplacement (ou scannez son étiquette).
2. **Scannez chaque pièce physiquement présente** : chaque scan compte 1. Vous pouvez aussi taper une quantité exacte pour une pièce.
   Par défaut le comptage est **à l'aveugle** (vous ne voyez pas le stock attendu).
3. Un **gestionnaire** applique ensuite le comptage : l'aperçu montre chaque écart (compté − système). **Si le stock ou le comptage change pendant que vous regardez l'aperçu, le logiciel refuse d'appliquer et demande de relire l'aperçu** (on n'applique que ce que vous avez vu). Case *Mettre à 0 les pièces non scannées* : à cocher
   seulement si vous avez compté **tout** l'emplacement. Cela crée un document d'**ajustement**.
   Un employé peut compter mais doit faire approuver par un gestionnaire.

## 4. Gestionnaires

### Recevoir de la marchandise — *Réception*
Fournisseur (facultatif), n° de facture du fournisseur, emplacement de réception, puis les pièces avec **quantité** et **coût unitaire** (préremplis avec le prix du fournisseur
quand il est connu). Case *Mettre à jour les prix de ce fournisseur* pour garder la liste de prix à jour. Le **coût moyen** de la pièce est recalculé automatiquement.

### Corriger un stock — *Ajustement*
Variation positive ou négative d'un emplacement, avec un motif (correction, bris/perte, comptage, autre). Pour charger le **stock de départ** d'un nouvel emplacement,
indiquez un **coût** : il alimente le coût moyen.

### Facture interne au coût — *Facture interne*
Quand une entreprise prend des pièces dans le stock de l'autre :
1. Choisissez l'emplacement **source**, l'**entreprise** et l'**emplacement de destination**, puis scannez les pièces.
2. L'écran montre le **coût unitaire** (le coût moyen de l'entreprise qui fournit) et le **total** — *aucune marge*.
3. *Enregistrer* : le stock sort de l'emplacement source et entre dans l'emplacement de destination ; un numéro **FIN-AAAA-#####** est créé.
   Les pièces sans coût connu sont refusées, sauf si vous cochez *Facturer les pièces sans coût à 0 $*.
La page **Factures internes** les liste ; ouvrez-en une pour l'**imprimer** ou l'**annuler**.

### Bilan de fin de mois — *Bilan mensuel*
Choisissez le mois : pour chaque sens (Beauchemin → Boutique Chaleur et l'inverse) vous voyez **quelles pièces ont été prises, en quelle quantité et à quel coût**, puis le **solde**
(« Boutique Chaleur doit 1 234,56 $ à Beauchemin »). Imprimable et exportable en CSV (ouvrable dans Excel). Les factures **annulées** n'y figurent pas.

### Annuler un document
Ouvrez-le (*Documents* → numéro) puis *Annuler*, avec un motif obligatoire. Le stock est remis comme avant. L'annulation est **refusée** si la marchandise n'est plus là
(déjà utilisée ou déplacée). Un ajustement ne s'annule pas : faites un nouvel ajustement.
**Seule l'entreprise qui a émis le document peut l'annuler.** Une facture interne se défait donc depuis l'entreprise qui l'a émise ; si la marchandise a déjà été utilisée par
l'autre entreprise, l'annulation est refusée (le message n'en révèle pas le détail) — l'autre entreprise peut alors émettre une facture en sens inverse.
Quand on annule une **réception** qui avait mis à jour les prix du fournisseur, le prix précédent est rétabli (sauf si quelqu'un l'a modifié entre-temps).

### Catalogue
* **Pièces** : créer/modifier une pièce (code interne, nom, catégorie, unité, **codes-barres alias** du fabricant, **minimum** par entreprise). Un code déjà pris est refusé avec le nom de
  son détenteur. Le code interne d'une pièce qui a déjà des mouvements ne change plus.
  *Désactiver* une pièce la retire des listes de saisie, mais on peut toujours **vider** son stock restant.
* **Fournisseurs** et **prix** : dans la fiche de la pièce, ajoutez le prix de chaque fournisseur (historique conservé). Dans *Fournisseurs*, « Prix de ce fournisseur » liste ses pièces.
* **Catégories** : une catégorie ne se supprime que si aucune pièce n'y est rangée.
* **Étiquettes code-barres** : choisissez des pièces (ou une catégorie, ou des emplacements), le nombre de copies et le format
  (feuille de 30, rouleau 50 × 25 mm, grande étiquette), puis *Imprimer*.
* **Importer (CSV)** : téléchargez le modèle, remplissez-le (pièces, prix, **stock initial par emplacement avec coût**), puis importez. Un **aperçu** signale chaque erreur avant
  que quoi que ce soit soit écrit ; si une ligne est en erreur, **rien** n'est importé.

### Rapports
* **Sous le minimum** : pièces dont la quantité totale de l'entreprise est inférieure au minimum fixé.
* **Valeur de l'inventaire** : quantité × coût moyen, par entreprise et par emplacement (désactivés encore garnis inclus).
* **Documents** et **Historique des mouvements** : tout ce qui a bougé, qui, quand, avec filtres et exports.

## 5. Administrateurs

* **Utilisateurs** : créer un compte (mot de passe de 10 caractères ou plus, affiché **une seule fois**), choisir le rôle et les entreprises accessibles, désactiver, réinitialiser un mot de passe,
  débloquer un compte. On ne peut ni se désactiver soi-même, ni retirer le dernier administrateur.
* **Entreprises** et **Emplacements** : créer un entrepôt, une boutique ou un **cube de service** ; chacun reçoit un **code d'étiquette** `EMP-…` (imprimable). Un emplacement qui contient
  encore des pièces ne peut pas être désactivé.
* **Journal d'activité** : qui s'est connecté, qui a modifié un prix, un utilisateur, annulé un document… (exportable).
* **Sauvegarde** : téléchargement d'une copie de la base ; les sauvegardes **automatiques nocturnes** se configurent à l'installation (voir `DEPLOIEMENT.md`).
  Une sauvegarde contient les mots de passe chiffrés : gardez-la en lieu sûr.

## 6. Comprendre les chiffres

* **Coût moyen** : chaque entreprise a, pour chaque pièce, un **coût moyen pondéré**. Exemple : 10 pièces reçues à 10 $ puis 10 à 20 $ → coût moyen 15 $.
  Les transferts et les sorties ne le changent pas ; une réception (ou un ajustement avec coût) le met à jour.
* **Facture interne** : l'entreprise qui fournit facture **à son coût moyen** du moment ; l'entreprise qui reçoit enregistre ces pièces **à ce même coût**.
* **Numéros** : REC (réception), TRF (transfert), SOR (sortie), AJU (ajustement), FIN (facture interne), COM (comptage), suivis de l'année et d'un numéro de séquence.
* **Le stock ne peut jamais être négatif** : une sortie ou un transfert trop grand est refusé avec le détail (« disponible 2, demandé 5 »).

## 7. Si quelque chose ne va pas

| Problème | Que faire |
|---|---|
| « Code inconnu » au scan | La pièce n'est pas au catalogue (ou l'étiquette est d'un autre système). Demandez à un gestionnaire de la créer ou d'ajouter ce code comme **alias**. |
| « Stock insuffisant… » | Il n'y a pas assez à cet emplacement : vérifiez l'emplacement choisi, ou faites un comptage. |
| La page dit « Session expirée » | Reconnectez-vous ; vos données non enregistrées ne sont pas gardées. |
| Le scan ne tape rien | Cliquez dans le champ de scan bleu ; vérifiez que le lecteur envoie bien « Entrée » après le code. |
| La connexion est refusée alors que le mot de passe est correct | Le compte ou votre adresse est peut-être verrouillé (15 minutes après plusieurs échecs) : attendez, ou demandez à un administrateur de le déverrouiller (*Administration → Utilisateurs*). Le message d'erreur est volontairement toujours le même. |
| Un chiffre vous semble faux | Ouvrez *Historique des mouvements* pour la pièce : chaque variation y est tracée avec son document et son auteur. |

## 8. Mise en route (liste de contrôle)

1. L'administrateur crée les **emplacements** (entrepôts, boutiques, cubes) et les **utilisateurs**.
2. Il **imprime et colle** les étiquettes d'emplacements.
3. Un gestionnaire **importe** le catalogue et le stock de départ (avec coûts), puis imprime les étiquettes de pièces.
4. Chaque emplacement fait un premier **comptage** pour valider le stock de départ.
5. Fixez les **minimums** des pièces importantes (fiche de la pièce) : la page *Sous le minimum* devient votre liste d'achats.
6. Vérifiez qu'une **sauvegarde** nocturne est en place et **essayez une restauration** une fois.
