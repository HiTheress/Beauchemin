# Vue 3D du Plan : sources du bundle

La page **Plan** de `gestion/` a une vue 3D isométrique faite avec **Three.js** (sans React : R3F n'est qu'une couche React par-dessus).
Le navigateur ne charge qu'un seul script classique, **`gestion/assets/js/plan3d.bundle.js`** (≈ 615 Ko, 164 Ko compressé ; objectif < 700 Ko, vérifié par le script de construction), produit à partir des sources de ce dossier.
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
| `scene.js` | rendu à la demande, soleil/ombres, données (un bâtiment par emplacement), cadrage, recherche, sélection, temps réel, rapport pour les étiquettes, `detruire()` |
| `camera.js` | caméra orthographique isométrique et contrôleur maison (souris, doigts, clavier) |
| `batiments.js` | entrepôt (dents de scie, portes de quai), boutique, camion ; palettes de couleurs des entreprises |
| `monde.js` | sol, parcelles, marquages, décor fixe (chariot, cage de propane, cônes, arbres, haies) |
| `remplissage.js` | cartons et palettes en instances (une instance de dessin pour tous), animation d'échelle |
| `effets.js` | anneau qui pulse, cadre de sélection, épingles qui rebondissent, carton qui vole |
| `anim.js`, `geo.js`, `textures.js` | animations, géométries fusionnées (couleurs de sommets), textures dessinées sur canevas |

Tout est généré par code : aucun fichier de modèle 3D, aucune image externe. L'interface (étiquettes, cartes, barre d'outils) est dans `gestion/assets/js/plan3d-ui.js` ; le bundle ne contient aucun texte à afficher.

## Essayer la scène seule

Le bundle ne dépend de rien : une page HTML locale avec un conteneur de taille fixe, `<script src=".../plan3d.bundle.js">` puis
`const v = Plan3D.creer(conteneur, {}); v.definirDonnees(tuiles, rects)` (`tuiles` comme `plan_data.php`, `rects` : `{ id: {x, y, largeur, hauteur} }` en pixels) suffit à voir le rendu.
