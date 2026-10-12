# Avis d'origine

Ce logiciel de gestion d'inventaire est dérivé du projet **« Ample – Billing and Inventory Software »**
(auteure : Mayuri K., mayurik.com), obtenu sur SourceCodester :
https://www.sourcecodester.com/php/16741/free-and-open-source-inventory-management-system-php-source-code.html

Le projet d'origine ne fournit pas de fichier de licence et affichait l'avis suivant :
« Ce projet est développé à des fins d'étude académique seulement. Ne jamais vendre ni distribuer
sous votre nom ou votre marque. »

Il est donc destiné ici à un **usage interne seulement**. Ne pas vendre ni redistribuer ce
logiciel avant d'avoir obtenu l'autorisation de l'auteure ou confirmé sa licence.

Les bibliothèques incluses conservent leurs propres licences (MIT pour la plupart) : AdminLTE, Bootstrap, jQuery,
DataTables, Select2, Font Awesome Free, Chart.js, OverlayScrollbars — voir le dossier `plugins/` et `dist/`.
Les pages, la logique métier, le schéma de base de données et les générateurs de codes-barres (Code 128) ont été réécrits pour ce projet.

Les documents en PDF sont produits avec **FPDF 1.9** (Olivier Plathey, licence permissive : voir `app/lib/fpdf/license.txt`), copié tel quel dans `app/lib/fpdf/` avec ses polices de base (`font/*.json`).

Police **Figtree** (The Figtree Project Authors, licence SIL Open Font License 1.1 — voir `assets/fonts/Figtree-OFL.txt`), servie localement.
Les graphiques et widgets (`assets/js/widgets.js`, `assets/css/widgets.css`) sont adaptés d'un « Widget Kit » fourni par le client pour ce projet.
La mascotte (réservoir de propane : `inc/mascotte.php`, `assets/css/mascotte.css`, `assets/js/mascotte.js`) est adaptée d'un dessin HTML fourni par le client ; l'image de la page de connexion (`assets/img/connexion-beauchemin-chaleur.webp`) est aussi fournie par le client.
FPDF 1.9 (Olivier Plathey, licence permissive : `app/lib/fpdf/license.txt`) produit les documents PDF.

La vue 3D de la page Plan utilise **Three.js** (r186, licence MIT, © 2010-2026 three.js authors, https://threejs.org), embarqué dans le fichier unique `assets/js/plan3d.bundle.js` (aucun CDN, aucun fichier de modèle 3D : tout est généré par code). Les sources du bundle sont dans `tools/plan3d/` (hors du dossier servi) ; la licence complète figure en tête du bundle et ci-dessous.

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
L'esprit visuel de la vue 3D (entrepôt à toit en dents de scie, portes de quai, épingles de carte) s'inspire d'une capture de produit fournie par le client ; aucun élément graphique n'en est repris.
Les bâtiments de la vue 3D (boutique Boutique Chaleur, bâtiment Beauchemin, réservoirs de propane) s'inspirent de photographies fournies par le client, redessinées par code (aucune image n'est reprise) ; les logos affichés sur les camions et les enseignes sont les fichiers déjà livrés avec l'application (`assets/img/logo-beauchemin.png`, `assets/img/logo-boutique-chaleur.png`), propriété de leurs entreprises. L'intérieur des emplacements (rayonnages, caisses, showroom) est entièrement généré par code.
