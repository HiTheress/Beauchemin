# Règles d'interface (à suivre pour toute nouvelle page)

Objectif : **quelqu'un qui n'a jamais vu le logiciel comprend quoi faire sans lire.** Pas de mode d'emploi à l'écran.

## 1. Pas de texte explicatif
* Aucun paragraphe d'aide sous un titre, sous un champ ou sous un bouton (« Au scanner : … », « Ou … », « Choisissez d'abord … », « Le coût est proposé d'après … »).
* On garde seulement : les **libellés de champs** (courts), les **textes d'invite** (placeholder, 1 à 4 mots), les **messages d'erreur** qui disent quoi faire, les **messages de confirmation** (courts), et les **avertissements d'actions irréversibles** (une phrase).
* Un état vide tient en une ligne et propose l'action (« Aucune pièce. » + bouton « Ajouter une pièce »).
* Si une information est vraiment utile mais rare : une petite icône ⓘ avec une infobulle (`title`), jamais du texte affiché en permanence.

## 2. Une action principale par écran
* La chose que la personne veut faire est **en haut** et **évidente** : un seul bouton principal (`btn-primary`), libellé par un verbe (« Recevoir », « Déplacer », « Enregistrer »).
* Les actions secondaires sont discrètes (`btn-outline-secondary` ou lien). Pas deux boutons principaux dans la même carte.
* Les champs avancés ou rares (n° de facture, note, options) sont **cachés** derrière un lien « Plus d'options ».

## 3. Mots simples
* Verbes d'action courts, comme dans le menu. Pas de jargon (« alias », « ajustement », « empreinte », « EMP-… ») : dire « autre code », « corriger le stock », etc.
* Même mot partout pour la même chose.
* Messages d'erreur : ce qui ne va pas **et** quoi faire (« Choisissez un emplacement. »).

## 4. Scanner d'abord
* Sur une page d'opération, le champ de scan est actif dès l'ouverture ; Entrée ajoute la pièce.
* Les quantités se règlent avec de gros boutons − / + (en plus du champ).
* Après un enregistrement réussi : confirmation courte (toast), l'écran est prêt pour la suite (formulaire vidé, curseur dans le champ de scan).

## 5. Tableaux
* La recherche est en premier. Peu de colonnes par défaut (5 ou 6 au plus), les montants à droite.
* Cliquer sur une ligne ouvre le détail.
* Pas de légende, pas de note de bas de tableau.

## 6. La mascotte (réservoir de propane)
* **Chargement** : si une page met plus de 0,35 s à s'ouvrir, le réservoir rebondit par-dessus la page (rien à faire pour une nouvelle page ; un formulaire traité en JavaScript n'a pas besoin d'indicateur). `data-sans-chargement` sur un formulaire désactive l'indicateur.
* **Cases** : au survol, le réservoir sort de derrière le bord supérieur de la case, près du coin (dessin et mouvement repris du projet Lovable « Hamster Peek Animation » du client). Automatique pour `input.form-control`, `select.custom-select`, `textarea.form-control` ; `data-sans-mascotte` sur un conteneur l'exclut. Une case qui reçoit la classe `is-invalid` (convention déjà utilisée partout) fait sortir le réservoir aux yeux en croix, secoué, quelques secondes.
* **Succès / échec** : on ne code rien de spécial. `toast(message, 'success')` affiche la coche verte, le réservoir content et des confettis ; `toast(message, 'danger')` (ou tout `.alert-danger` qui devient visible, ou une page qui s'ouvre avec un `.alert-danger`) affiche la croix rouge, le réservoir aux yeux en croix secoué et des étoiles, avec « Oups ! » ; plusieurs échecs rapprochés (scans) ne relancent pas l'animation. Un message de succès affiché par la page après une redirection déclenche la coche aussi. Les animations sont décoratives : jamais de texte dans les messages, jamais de clic intercepté ; le message utile reste dans la notification.

## 7. Ce qu'on ne touche jamais
* Les règles métier, les droits, les URL des actions, les identifiants (`id`) utilisés par les scripts et les tests : si on en change un, on met le test à jour dans le même geste.
* Les contrôles de sécurité, les messages d'erreur du serveur, les confirmations d'actions irréversibles.

## 6 bis. Documents (facture interne, réception, déplacement, utilisation, correction du stock, bilan du mois)
* En haut, le bouton principal est **« Télécharger en PDF »** ; « Imprimer » est un bouton secondaire. Aucun texte explicatif à côté.
* Le PDF, l'impression et l'écran montrent le même document (même modèle, mêmes droits : un employé ne voit jamais un prix, un coût ni un total).
* En-tête : logo de l'entreprise qui émet (à gauche), titre en majuscules, numéro, date et statut (à droite) ; filet aux couleurs de cette entreprise.
  Entre deux entreprises : logo émetteur, flèche, logo destinataire. Pas de logo connu : le nom de l'entreprise en gros texte.

## Vocabulaire (titre de page = libellé du menu)

| Page | Menu et titre | | Page | Menu et titre |
|---|---|---|---|---|
| `dashboard` | Accueil | | `documents` | Documents |
| `scanner` | Scanner | | `historique` | Historique |
| `stock` | Stock | | `sous_minimum` | À recommander |
| `transfert` | Déplacer | | `valeur_inventaire` | Valeur du stock |
| `sortie` | Utiliser | | `pieces` | Pièces |
| `comptage` | Compter | | `pieces_import` | Importer des pièces |
| `reception` | Recevoir | | `fournisseurs` | Fournisseurs |
| `ajustement` | Corriger le stock | | `categories` | Catégories |
| `facture_interne` | Nouvelle facture | | `etiquettes` | Étiquettes |
| `factures_internes` | Factures | | `utilisateurs` | Utilisateurs |
| `bilan_mensuel` | Bilan du mois | | `entreprises` | Entreprises |
| `journal` | Journal | | `emplacements` | Emplacements |
| `backup_database` | Sauvegarde | | `profil` | Mon profil |

Les titres qui contiennent un nom (une pièce, un numéro de document) restent tels quels.
