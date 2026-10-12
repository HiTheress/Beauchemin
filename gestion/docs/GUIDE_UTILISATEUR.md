# Guide d'utilisation — Inventaire de pièces

Pour le personnel de **Beauchemin** et de **Boutique Chaleur** : savoir **où sont les pièces** (entrepôt, boutique ou cube de service) et combien il en reste.
Les écrans sont faits pour se passer d'explications ; ce guide sert d'aide-mémoire.

## 1. Premiers pas
1. Ouvrez l'adresse du logiciel (ordinateur, tablette ou téléphone) et connectez-vous.
2. En haut à droite, choisissez l'entreprise que vous consultez (*Toutes*, *Beauchemin* ou *Boutique Chaleur*, selon vos droits). L'écran prend les couleurs de l'entreprise choisie.
3. Le **menu** à gauche s'adapte à votre rôle. Changez votre mot de passe dans *Mon profil* (menu en haut à droite).

| Rôle | Ce qu'il peut faire |
|---|---|
| **Employé** | Scanner, voir le stock, **Déplacer**, **Utiliser**, **Compter**. Ne voit **aucun prix ni coût**. |
| **Gestionnaire** | Tout ce qui précède + **Recevoir**, **Corriger le stock**, **Facturation**, catalogue, étiquettes, import, rapports de valeur. |
| **Administrateur** | Tout + utilisateurs, entreprises, emplacements, journal, sauvegarde. |

## 2. Le lecteur de codes-barres
* Un lecteur USB ou Bluetooth « tape » le code puis Entrée : rien à régler. Le champ de scan est actif dès l'ouverture d'un écran.
* Le logiciel ne fait **aucun son** : un cadre **vert** = reconnu ; un cadre **rouge** avec un message (et la croix rouge du réservoir) = code inconnu ou refusé.
* Vous pouvez scanner plusieurs pièces de suite : un scan de plus = +1. Scanner l'étiquette d'un emplacement (`EMP-…`) choisit cet emplacement.
* Sans lecteur : tapez un nom ou un code dans le même champ et choisissez dans la liste, ou utilisez la caméra (le site doit être en HTTPS).

## 3. Tâches de tous les jours
| Je veux… | Menu |
|---|---|
| Savoir où est une pièce, ou ce qu'il y a dans un cube | **Scanner** (scannez la pièce ou l'étiquette du cube) |
| Charger un cube | **Déplacer** : de → vers, scannez, *Déplacer* |
| Noter les pièces utilisées chez un client | **Utiliser** : emplacement, motif, scannez, *Utiliser* |
| Compter un emplacement | **Compter** : emplacement, scannez chaque pièce présente, *Terminer le comptage* |
| Voir tout le stock | **Stock** |

Un transfert reste **dans la même entreprise** ; pour passer d'une entreprise à l'autre, on fait une facture.

### Compter
Le comptage se fait à l'aveugle (le stock attendu est caché). Un **gestionnaire** applique ensuite les corrections après avoir vu les écarts ; si le stock change entre-temps, le logiciel refuse
d'appliquer et demande de relire. *Mettre à 0 les pièces non comptées* : seulement si tout l'emplacement a été compté.

## 4. Gestionnaires
* **Recevoir** : emplacement, fournisseur, pièces avec quantité et coût (proposé d'après le prix du fournisseur). Le **coût moyen** de la pièce est recalculé.
* **Corriger le stock** : variation positive ou négative avec motif. Pour un stock de départ, indiquez un coût.
* **Facturation → Nouvelle facture** : choisissez qui facture à qui, d'où on prend les pièces, où on les met, scannez, *Facturer*. Facture **au coût**, sans marge.
  **Factures** les liste (télécharger en PDF, imprimer ou annuler) ; **Bilan du mois** dit qui doit combien à qui, avec le détail (PDF, imprimable, exportable).
* **Documents** (réception, déplacement, utilisation, correction du stock) : ouvrez un document, *Télécharger en PDF* ou *Imprimer* (logo de l'entreprise, numéro, date, pièces).
* **Annuler un document** : ouvrez-le (Documents → numéro), motif obligatoire. Refusé si la marchandise n'est plus là. Seule l'entreprise qui a émis le document peut l'annuler.
* **Ajouter une pièce** (Catalogue → Pièces → *Ajouter une pièce*) : tapez le **nom**, **scannez le code-barres** de la pièce, choisissez l'**unité** d'un clic, *Enregistrer*. Le code interne se propose tout seul ; les autres champs (minimum, emplacement habituel, autres codes…) sont sous *Plus d'options*.
* **Catalogue** : *Pièces*, *Importer des pièces* (aperçu avant écriture ; une erreur = rien d'importé), *Fournisseurs* (prix dans la fiche de la pièce), *Catégories*, *Étiquettes* (feuille, rouleau ou grande).
* **Rapports** : *Documents*, *Historique*, *À recommander* (pièces sous le minimum), *Valeur du stock*.

## 5. Administrateurs
* **Utilisateurs** : ajouter (mot de passe affiché **une seule fois**), rôle, entreprises, désactiver, réinitialiser, déverrouiller. On ne peut pas désactiver le dernier administrateur.
* **Entreprises**, **Emplacements** (entrepôt, boutique, cube de service ; code d'étiquette `EMP-…`), **Journal** (qui a fait quoi), **Sauvegarde** (téléchargement ; les sauvegardes automatiques se configurent à l'installation, voir `DEPLOIEMENT.md`).

## 6. Comprendre les chiffres
* **Coût moyen** : 10 pièces reçues à 10 $ puis 10 à 20 $ → 15 $. Les déplacements et les sorties ne le changent pas.
* **Numéros** : REC (réception), TRF (déplacement), SOR (utilisation), AJU (correction), FIN (facture), COM (comptage), puis l'année et un numéro.
* **Le stock ne peut jamais être négatif** : une sortie trop grande est refusée (« disponible 2, demandé 5 »).

## 7. Si quelque chose ne va pas
| Problème | Que faire |
|---|---|
| « Code inconnu » | La pièce n'est pas au catalogue : un gestionnaire la crée ou ajoute ce code comme autre code. |
| « Stock insuffisant » | Pas assez à cet emplacement : vérifiez l'emplacement ou faites un comptage. |
| « Session expirée » | Reconnectez-vous. |
| Le scan ne tape rien | Cliquez dans le champ de scan ; vérifiez que le lecteur envoie « Entrée ». |
| Connexion refusée avec le bon mot de passe | Le compte est peut-être verrouillé 15 minutes : attendez ou demandez à un administrateur (*Administration → Utilisateurs*). |
| Un chiffre semble faux | *Rapports → Historique* : chaque variation y est tracée avec son document et son auteur. |

## 8. Mise en route
1. L'administrateur crée les **emplacements** et les **utilisateurs**, puis imprime et colle les étiquettes d'emplacements.
2. Un gestionnaire **importe** le catalogue et le stock de départ (avec coûts), puis imprime les étiquettes de pièces.
3. Chaque emplacement fait un premier **comptage**. Fixez les **minimums** : *À recommander* devient la liste d'achats.
4. Vérifiez qu'une **sauvegarde** nocturne est en place et essayez une restauration une fois.
