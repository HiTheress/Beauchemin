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
* **Cases** : au survol, le réservoir (petit) sort de derrière le milieu du bord supérieur de la case (dessin et mouvement repris du projet Lovable « Hamster Peek Animation » du client). Automatique pour `input.form-control`, `select.custom-select`, `textarea.form-control` ; `data-sans-mascotte` sur un conteneur l'exclut. Une case qui reçoit la classe `is-invalid` (convention déjà utilisée partout) fait sortir le réservoir aux yeux en croix, secoué, quelques secondes.
* **Succès / échec** : on ne code rien de spécial. `toast(message, 'success')` affiche la coche verte, le réservoir content et des confettis ; `toast(message, 'danger')` (ou tout `.alert-danger` qui devient visible, ou une page qui s'ouvre avec un `.alert-danger`) affiche la croix rouge, le réservoir aux yeux en croix secoué et des étoiles, avec « Oups ! » ; plusieurs échecs rapprochés (scans) ne relancent pas l'animation. Un message de succès affiché par la page après une redirection déclenche la coche aussi. Les animations sont décoratives : jamais de texte dans les messages, jamais de clic intercepté ; le message utile reste dans la notification.

## 6 ter. Plan de l'entrepôt (page `plan`)
* Une tuile = un emplacement (nom, code d'étiquette, icône du type, pièces et unités) ; le liseré est aux couleurs de **son** entreprise. Aucun texte explicatif : le champ « Chercher ou scanner » est actif dès l'ouverture, les tuiles qui ont la pièce s'illuminent (pastille de quantité), les autres s'estompent ; Échap ou la croix efface.
* Le point vert « En direct » dit que la page se met à jour toute seule ; « Connexion perdue » (orange) s'affiche si le réseau coupe, et la reprise est automatique. Les tuiles dont le contenu change pulsent doucement (rien si l'utilisateur demande moins de mouvement).
* **Vue 3D** (par défaut sur écran large) : un commutateur à deux boutons (« 3D » / « Tuiles », icône + mot) en haut ; la scène montre chaque emplacement à sa place, avec une étiquette cliquable (nom, « N pièces · N unités »), trois cartes translucides (« Unités en stock », « Sous le minimum », « Emplacements »), et à droite une barre d'icônes sans texte (zoom +, zoom −, pivoter à gauche, pivoter à droite, recentrer ; infobulles et `aria-label`). Aucun paragraphe d'aide : glisser, molette, clic droit, pincement et flèches se devinent. La recherche pose une épingle bleue sur chaque emplacement trouvé ; un clic sur un bâtiment ou une étiquette ouvre la fiche. Sur téléphone la vue Tuiles reste la vue par défaut ; la 3D s'y choisit avec le commutateur. La modification du plan se fait toujours en Tuiles.
* **Intérieur d'un emplacement (vue 3D en coupe).** Entrée : bouton « **Voir l'intérieur** » (icône de porte ouverte, bouton principal du tiroir ; seulement en 3D), double-clic sur le bâtiment, ou « **Voir sur l'étagère** » quand la pièce cherchée est dans l'emplacement (la recherche mène alors droit à l'étagère : épingle bleue au-dessus de la caisse, cadre bleu, autres caisses estompées). Les cartes de statistiques laissent la place à un bouton « **Retour au plan** » (flèche, en haut à gauche, 44 px) et à un fil d'Ariane discret « Plan › Entrepôt principal » ; **Échap** ferme d'abord la fiche, puis la visite. Rien d'explicatif : on voit des rayonnages, des caisses étiquetées (code et quantité lisibles sur la caisse), des lettres d'allée et des numéros d'étagère et de niveau, une zone jaune « À ranger » près de la porte (palettes au sol) ; dans la boutique, le showroom avec ses foyers et son panneau « Poêles · Foyers · Décorations ». Au survol (ou au focus clavier) d'une caisse : une petite fiche (code, nom, quantité, « Allée B · Étagère 3 · Niveau 2 », pastille rouge « Sous le minimum ») ; un clic ouvre la pièce dans le tiroir. Gestionnaire et administrateur : on **glisse une caisse** dans une autre case (cadre vert = case acceptée, rouge = rien ; la zone « À ranger » retire la position) ; si le serveur refuse, la caisse revient et son message s'affiche ; l'employé voit tout sans rien déplacer. Quand quelqu'un change le stock ou une position, la caisse touchée pulse et affiche « +3 » / « −2 ». Les caméras, boutons et gestes sont ceux du plan ; sous « mouvement réduit », aucune animation. Sans WebGL ou en Tuiles, ni bouton ni scène : les positions se lisent dans le tiroir.
* **Logos et bâtiments.** Les camions de service portent le vrai logo de leur entreprise des deux côtés (Beauchemin : caisse blanche à bande verte ; Boutique Chaleur : caisse blanche à bande rouge et or) ; la boutique, le bâtiment de bureau de Beauchemin et les entrepôts reprennent les couleurs et les détails des photos du client. Si un logo ne se charge pas, le nom de l'entreprise reste écrit à sa place, sans message.
* Un seul bouton principal à la fois : aucun en consultation (« Modifier le plan » est secondaire, administrateur seulement, écran large) ; **Enregistrer** pendant la modification. Sur téléphone : liste de cartes, jamais de glisser-déposer. Aucun prix ni coût, pour aucun rôle.
* **Rangements (tiroir d'un emplacement).** Chaque pièce porte une pastille de position « B · 3 · 2 » (allée B, étagère 3, niveau 2 ; cube : « G · 3 · 2 » = côté gauche) ou une pastille discrète en pointillés « **À ranger** ». Gestionnaire et administrateur : un clic sur la pastille ouvre un petit éditeur sous la ligne (trois listes « Allée » — « Côté » pour un cube —, « Étagère », « Niveau » ; boutons **Enregistrer** et **Retirer**) ; Échap le ferme. Au bas du tiroir, le bouton secondaire « **Ranger automatiquement** » n'apparaît que s'il reste des pièces « À ranger ». L'employé voit les positions sans rien pouvoir changer. Administrateur : un bouton de réglage (icône, infobulle « Rayonnages ») dans l'en-tête du tiroir ouvre trois champs « Allées », « Étagères », « Niveaux » et « Par défaut » ; on garde presque toujours le défaut. Libellés d'allée : lettres A, B, C… (entrepôt, boutique), « Côté gauche » / « Côté droit » (cube). Aucun paragraphe d'aide.

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
| `plan` | Plan | | | |

Mots du Plan : **« À ranger »** (pièce en stock sans position dans l'emplacement), **« Ranger automatiquement »**, « Allée » / « Côté », « Étagère », « Niveau », « Rayonnages » (réglage de l'administrateur) ; on ne dit jamais « baie », « travée », « géométrie » ni « emplacement de rangement » à l'écran.

Les titres qui contiennent un nom (une pièce, un numéro de document) restent tels quels.
