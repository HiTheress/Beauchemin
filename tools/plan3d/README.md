# Vue 3D du Plan : sources du bundle

La page **Plan** de `gestion/` a une vue 3D isométrique faite avec **Three.js** (sans React : R3F n'est qu'une couche React par-dessus).
Le navigateur ne charge qu'un seul script classique, **`gestion/assets/js/plan3d.bundle.js`** (≈ 663 Ko, 181 Ko compressé ; objectif < 700 Ko, vérifié par le script de construction), produit à partir des sources de ce dossier.
**Le serveur d'exploitation ne construit rien** et n'a pas besoin de Node : le bundle est versionné avec le reste. Ce dossier est hors de `gestion/` (jamais servi). La CSP de l'application reste stricte (`script-src 'self'`, aucun JavaScript en ligne, aucun CDN) : pas de module ES ni d'importmap.

## Reconstruire

```bash
cd tools/plan3d
npm install        # three 0.186.1 et esbuild 0.28.2 (versions exactes ; package-lock.json versionné ; node_modules/ ignoré)
npm run build      # écrit ../../gestion/assets/js/plan3d.bundle.js (IIFE minifié, en-tête avec la licence MIT de Three.js)
npm run watch      # reconstruit à chaque modification de src/
```

Puis committer `gestion/assets/js/plan3d.bundle.js`. Pour changer de version de Three.js : `npm install three@<version> --save-exact`, reconstruire, vérifier le poids et passer `tests/e2e/plan3d.js`.
Three.js r186 : `PCFSoftShadowMap` n'existe plus, `PCFShadowMap` donne déjà des ombres douces (c'est ce que la scène utilise).

## Sources (`src/`)

| Fichier | Rôle |
|---|---|
| `index.js` | point d'entrée : `window.Plan3D = { disponible(), creer(conteneur, options) }` |
| `scene.js` | rendu à la demande, soleil/ombres, données (un bâtiment par emplacement), logos (image du même domaine → canevas → texture), cadrage, recherche, sélection, temps réel, entrée et sortie d'un intérieur, rapport pour les étiquettes, `detruire()` |
| `camera.js` | caméra orthographique isométrique et contrôleur maison (souris, doigts, clavier ; élévation variable, crochet `debutGlisse` pour le glisser-déposer d'une caisse) |
| `batiments.js` | entrepôt (dents de scie, portes de quai), boutique, camion (logo des deux côtés de la caisse) ; palettes de couleurs et logos des entreprises |
| `sites.js` | bâtiments inspirés des photos du client : boutique Boutique Chaleur (corniche, fronton, auvents rayés, enseigne, cheminée de brique) et bâtiment Beauchemin (tôle saumon sur brique beige, entrée vitrée, drapeaux, manche à air) |
| `monde.js` | sol, parcelles, marquages, décor fixe (chariot, cage et réservoirs de propane, cônes, arbres, haies) |
| `remplissage.js` | cartons et palettes en instances (une instance de dessin pour tous), animation d'échelle |
| `effets.js` | anneau qui pulse, cadre de sélection, épingles qui rebondissent, carton qui vole |
| `interieur.js` | vue en coupe d'un emplacement : disposition d'après le type et les rayonnages (`geometrie`), murs qui s'effacent selon l'angle, rayonnages en instances, une caisse par pièce dans sa case, zone « À ranger », survol, clic, glisser-déposer, recherche (épingle, estompage, cadrage), mises à jour en direct, libération complète |
| `atlas.js` | étiquettes de caisses, lettres d'allée et numéros dessinés sur quelques grands canevas (un dessin par page d'atlas) |
| `showroom.js` | showroom de la boutique (foyer au gaz, poêle à bois, foyer en pierre, décorations ; flammes à part) |
| `anim.js`, `geo.js`, `textures.js` | animations, géométries fusionnées (couleurs de sommets), textures dessinées sur canevas (murs, toits, briques, enseignes, logos, panneau du showroom) |

Tout est généré par code : aucun fichier de modèle 3D, aucune image externe. L'interface (étiquettes, cartes, barre d'outils) est dans `gestion/assets/js/plan3d-ui.js` ; le bundle ne contient aucun texte à afficher.

## Essayer la scène seule

Le bundle ne dépend de rien : une page HTML locale avec un conteneur de taille fixe, `<script src=".../plan3d.bundle.js">` puis
`const v = Plan3D.creer(conteneur, {}); v.definirDonnees(tuiles, rects)` (`tuiles` comme `plan_data.php`, `rects` : `{ id: {x, y, largeur, hauteur} }` en pixels) suffit à voir le rendu.

## Intérieur d'un emplacement : le contrat avec l'interface

`Plan3D.creer(conteneur, options)` reçoit, en plus de `surRendu`, `surSelection`, `surSurvol`, `surPerte` : `logos` (`{ bea, bch }` : adresses des images), `fmtQte` (formatage des quantités), `surDoubleClic(id)`, `surCaisse(info, x, y, pieceId)` (survol d'une caisse ; `info` = `{ rangement, lignes, zone }` ou `null`), `surCaisseClic(pieceId, info)` et `surRanger(pieceId, destination | null, ok, ko)` (caisse déposée dans une case ; `null` = zone « À ranger » ; `ko()` la fait revenir).
L'objet rendu ajoute `entrerInterieur(id, donnees, { piece })` (`donnees` = réponse de `plan_emplacement.php`), `sortirInterieur()`, `majInterieur(lignes)` (rend `[{ id, delta }]` pour les « +N / −N »), `interieurChercher(pieceId, cadrer)`, `interieurFocus(pieceId)`, `interieurSuivre(ids)`, `interieurInfo()` (cases, places à l'écran). Le bundle ne contient aucun texte d'interface (hors plaques dessinées : codes, quantités, lettres, « À ranger »). Les parois et le décor du rendu ne servent qu'à lire la position : les dimensions viennent de `geometrie`, jamais d'une constante de l'interface.
