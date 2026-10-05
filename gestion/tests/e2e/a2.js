// Test de bout en bout du module A2 : étiquettes de codes-barres, import et export CSV.
//   cd gestion && tools/serveur.sh start bea_a2 8102 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8102 node tests/e2e/a2.js
// Variables facultatives :
//   DB_NAME        base du serveur testé (défaut bea_a2) : le test la remet à neuf au départ (sauf A2_SANS_RESET=1) et y ajoute des données de test
//   DECODEUR_DIR   dossier où sont installés zxing-wasm et pngjs (npm install zxing-wasm pngjs) : active la preuve de lisibilité
//                  (décodage du code-barres rendu par Chromium, à l'écran et dans le PDF). Sans lui, ces vérifications sont ignorées.
const L = require('./lib.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const RACINE = path.resolve(__dirname, '..', '..');
const DB = process.env.DB_NAME || 'bea_a2';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-'));
const PORT = (/:(\d+)/.exec(L.BASE) || [])[1];

function sql(q) { return execFileSync('mysql', ['-uroot', '--default-character-set=utf8mb4', '-N', '-B', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function section(t) { console.log('\n== ' + t); }
const ok = L.verifier;

// ---- décodeur de codes-barres (facultatif) ----------------------------------------------------------------
let decodeur = null;
async function chargerDecodeur() {
  const dir = process.env.DECODEUR_DIR;
  if (!dir) { return null; }
  try {
    const nm = path.join(dir, 'node_modules');
    const mod = await import(pathToFileURL(path.join(nm, 'zxing-wasm', 'dist', 'es', 'reader', 'index.js')).href);
    const wasm = fs.readFileSync(path.join(nm, 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm'));
    mod.setZXingModuleOverrides({ wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) });
    const { PNG } = require(path.join(nm, 'pngjs'));
    return {
      /** Tous les Code 128 d'un PNG -> textes triés */
      async lire(fichier) {
        const png = PNG.sync.read(fs.readFileSync(fichier));
        const r = await mod.readBarcodes({ data: new Uint8ClampedArray(png.data), width: png.width, height: png.height, colorSpace: 'srgb' }, { formats: ['Code128'], tryHarder: true, maxNumberOfSymbols: 60 });
        return r.map(x => x.text).sort();
      },
      /** Boîte englobante des pixels sombres, en mm */
      boite(fichier, dpi) {
        const png = PNG.sync.read(fs.readFileSync(fichier)); const { width: w, height: h, data } = png;
        let top = h, left = w, bottom = 0, right = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4] < 128) { if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; }
        const mm = v => v / dpi * 25.4;
        return { left: mm(left), top: mm(top), right: mm(right), bottom: mm(bottom), largeur: mm(w), hauteur: mm(h) };
      },
    };
  } catch (e) { console.log('  (décodeur indisponible : ' + e.message + ')'); return null; }
}
function outil(nom) { try { execFileSync('which', [nom], { stdio: 'ignore' }); return true; } catch (e) { return false; } }

// ---- aides navigateur --------------------------------------------------------------------------------------
async function csrf(page) { return page.getAttribute('meta[name="csrf-token"]', 'content'); }
async function post(page, url, data, avecCsrf) {
  const r = await page.request.post(L.BASE + '/' + url, { headers: avecCsrf === false ? {} : { 'X-CSRF-Token': await csrf(page) }, data });
  let j = null; try { j = await r.json(); } catch (e) { /* non JSON */ }
  return { status: r.status(), json: j };
}
async function televerser(page, url, buffer, nom, champs) {
  const r = await page.request.post(L.BASE + '/' + url, { headers: { 'X-CSRF-Token': await csrf(page) }, multipart: Object.assign({ fichier: { name: nom, mimeType: 'text/csv', buffer } }, champs || {}) });
  let j = null; try { j = await r.json(); } catch (e) { /* non JSON */ }
  return { status: r.status(), json: j };
}
const ANALYSE = (page, buf, nom, champs) => televerser(page, 'app/ajax/import_analyser.php', buf, nom || 'f.csv', champs);
async function appliquerSource(page, source, opts) {
  return post(page, 'app/action/import_appliquer.php', Object.assign({ lignes: source, mode: 'creer', fichier: 'test.csv' }, opts || {}));
}
async function connecterComme(page, utilisateur) {
  await page.goto(L.BASE + '/login.php');
  await page.fill('input[name=username]', utilisateur);
  await page.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
}
const CLICK = (page, sel) => page.$eval(sel, e => e.click());   // cases Bootstrap personnalisées : le <label> recouvre l'<input>

// ---- fichiers pièges ---------------------------------------------------------------------------------------------
const ENT = 'code;nom;categorie;unite;code_barres;description;fournisseur;prix_fournisseur;no_fournisseur;minimum_entreprise_1;minimum_entreprise_2;emplacement;quantite;cout\r\n';
const U8 = s => Buffer.from(s, 'utf8');
function lot(n, prefixe) { let s = ENT; for (let i = 0; i < n; i++) s += `${prefixe}-${String(i).padStart(5, '0')};Pièce en lot ${i};Lot;unité;;;;;;;;;;\r\n`; return U8(s); }
const FICHIERS = {
  bom: Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), U8(ENT + 'N-1001;Valve de sécurité 3/4 po;Plomberie / gaz;unité;987000000011;Valve laiton;Distribution Chauffage Plus;45,90;VS-34;5;2;EMP-000001;10;45,90\r\nN-1002;Brûleur Beckett AFG;Brûleurs;unité;;;;;;2;;EMP-000002;3;312,5\r\nN-1003;Tuyau cuivre 1/2 po;Plomberie / gaz;m;;;Grossiste Gaz du Nord;6.75;;;;EMP-000003;40,5;5,25\r\n')]),
  virgule: U8('code,nom,categorie,unite,emplacement,quantite,cout\n"N-2001","Thermostat Honeywell","Contrôles","unité","EMP-000001","2","64.90"\n"N-2002","Câble 3/8"", noir, 2 m","Contrôles","m","EMP-000001","12.5","1.10"\n'),
  win1252: Buffer.from(ENT + "N-3001;Électrode d'allumage;Brûleurs;paire;;;;;;;;;;\r\nN-3002;Thermocouple « 36 po » à 5 °C;Contrôles;unité;;;;;;;;;;\r\n", 'latin1'),
  guillemets: U8(ENT + 'N-4001;"Pompe ""Suntec"" A2VA";Gicleurs et pompes;unité;;"Ligne 1\nLigne 2; avec point-virgule";;;;;;;;\r\nN-4002;Simple;;;;;;;;;;;;\r\n'),
  formules: U8(ENT + "N-5001;=1+1;;;;;;;;;;;;\r\nN-5002;+33 pièces;;;;=cmd|' /C calc'!A0;;;;;;;;\r\nN-5003;@SUM(A1);;;;;;;;;;;;\r\nN-5004;-5 degrés;;;;;;;;;;;;\r\n"),
  formulesCode: U8(ENT + '=EVIL;nom;;;;;;;;;;;;\r\n+X1;nom;;;;;;;;;;;;\r\n'),
  vides: U8(ENT + '\r\n\r\nN-6001;Pièce A;;;;;;;;;;;;\r\n;;;;;;;;;;;;;\r\n\r\nN-6002;Pièce B;;;;;;;;;;;;\r\n\r\n'),
  doublons: U8(ENT + 'D-1;Pièce un;;;;;;;;;;;;\r\nD-1;Pièce un bis;;;;;;;;;;;;\r\nd-1;Autre;;;;;;;;;;;;\r\nD-2;Alias dup;;;012345678905;;;;;;;;;\r\nD-3;Alias dup2;;;ALIAS-X;;;;;;;;;\r\nD-4;Alias dup3;;;ALIAS-X;;;;;;;;;\r\nP-0001;Existe;;;;;;;;;;;;\r\n'),
  accents: U8(ENT + 'É-100;Accent;;;;;;;;;;;;\r\nA B;Espace;;;;;;;;;;;;\r\nOK-1;Bon;;;;;;;;;;;;\r\n' + 'X'.repeat(41) + ';Trop long;;;;;;;;;;;;\r\n'),
  erreurs: U8(ENT + 'E-1;Cat inconnue;Catégorie fantôme;;;;;;;;;;;\r\nE-2;Fourn inconnu;;;;;Fournisseur fantôme;12;;;;;;\r\nE-3;Emp inconnu;;;;;;;;;;EMP-999999;5;1\r\nE-4;Qte invalide;;;;;;;;;;EMP-000001;abc;1\r\nE-5;Cout invalide;;;;;;;;;;EMP-000001;1;xyz\r\nE-6;Qte negative;;;;;;;;;;EMP-000001;-3;1\r\nE-7;Sans emplacement;;;;;;;;;;;5;1\r\nE-8;Nom ambigu;;;;;;;;;;Entrepôt principal;5;1\r\nE-9;Prix sans four;;;;;;12;;;;;;\r\n'),
  atomique: U8(ENT + 'AT-1;Valide un;;;;;;;;;;;;\r\nAT-2;Valide deux;;;;;;;;;;EMP-000001;4;2\r\nAT-3;Erreur;;;;;;;;;;EMP-999999;4;2\r\n'),
  xss: U8(ENT + 'X-1;<img src=x onerror=alert(1)>;;;;<script>alert(2)</script>;;;;;;;;\r\n'),
  autreEntreprise: U8(ENT + 'IDOR-1;Pièce IDOR;;;;;;;;;;EMP-000002;5;1\r\nIDOR-2;Minimum IDOR;;;;;;;;;7;;;\r\n'),
  trop: U8(ENT + ['TR-1', 'Tuyau 3/8', 'cuivre', 'unité', '', '', '', '', '', '', '', '', '', '', 'extra'].join(';') + '\r\n'),
  binaire: Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D]), Buffer.alloc(300, 7), Buffer.from('IHDR')]),
  vide: Buffer.alloc(0),
  enteteSeul: U8(ENT),
  sansCode: U8('nom;unite\r\nGicleur;unité\r\n'),
  utf16: Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(ENT, 'utf16le')]),
  guillemetOuvert: U8(ENT + 'GO-1;"Jamais fermé;;;;;;;;;;;;\r\nGO-2;x;;;;;;;;;;;;\r\n'),
  commentaires: U8(ENT + '#EXEMPLE-1;Gicleur;;;;;;;;;;;;\r\n#EXEMPLE-2;Joint;;;;;;;;;;;;\r\nC-1;Réelle;;;;;;;;;;;;\r\n'),
  nombres: U8(ENT + 'NB-1;Nombres;;;;;;;;;;EMP-000001;1 234,5;1.234,56\r\nNB-2;Nombres 2;;;;;;;;;;EMP-000001;2,0005;12,50 $\r\n'),
};
function ecrire(nom) { const f = path.join(TMP, nom + '.csv'); fs.writeFileSync(f, FICHIERS[nom]); return f; }

(async () => {
  // ---- remise à neuf + données de test ----------------------------------------------------------------------
  if (!process.env.A2_SANS_RESET) {
    execFileSync(path.join(RACINE, 'tools', 'nouvelle-base.sh'), [DB, '--demo'], { stdio: 'ignore' });
  }
  const hash = execFileSync('php', ['-r', 'echo password_hash("Test-Beauchemin-1", PASSWORD_DEFAULT);'], { encoding: 'utf8' }).trim();
  sql(`INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('gest_a2','Gestionnaire A2 (Beauchemin seulement)','${hash}','gestionnaire')`);
  sql(`INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) SELECT id, 1 FROM utilisateurs WHERE nom_utilisateur = 'gest_a2'`);
  sql(`INSERT INTO pieces (code, nom, unite) VALUES ('XSS-1','<img src=x onerror=alert(1)>','unité'),('ACC-É1','Code avec accent','unité'),('LONG-24-CARACTERES-ABCDE','Code de 24 caractères','unité'),('NOM-LONG','Gicleur Delavan haute performance 0,75 gph angle 80 degrés type B pour brûleur résidentiel à mazout léger série professionnelle extra', 'unité')`);
  const idPiece = c => sql(`SELECT id FROM pieces WHERE code = '${c}'`);
  const idXss = idPiece('XSS-1'), idAcc = idPiece('ACC-É1'), idLong = idPiece('LONG-24-CARACTERES-ABCDE'), idNomLong = idPiece('NOM-LONG');
  decodeur = await chargerDecodeur();
  const pdfOk = outil('pdfinfo') && outil('pdftoppm');

  const b = await L.lancer();
  const p = await L.nouvellePage(b);
  const dialogues = [];
  p.on('dialog', d => { dialogues.push(d.message()); d.dismiss(); });

  // ====================================================================================================================
  section('Étiquettes : accès et chargement');
  await L.connecter(p, 'gestionnaire');
  await L.aller(p, 'etiquettes');
  ok((await p.textContent('h1')).includes('Étiquettes code-barres'), 'titre de la page');
  ok(await p.$eval('#et-resume', e => e.textContent.includes('Aucune étiquette')), 'état vide : message utile');
  ok(await p.$eval('#et-imprimer', e => e.disabled), 'Imprimer désactivé sans étiquette');
  ok(await p.$eval('#et-scan', e => e === document.activeElement), 'le curseur est dans le champ de scan');
  ok((await p.$$('#et-categorie option')).length >= 6, 'catégories listées');
  ok((await p.$$('#et-emplacements option')).length === 5, 'les 5 emplacements actifs sont proposés');
  ok(await p.$eval('#et-page-style', e => e.textContent.includes('215.9mm 279.4mm') && e.textContent.includes('margin: 0')), '@page : Lettre, marges nulles');

  section('Étiquettes : préremplissage par l\'URL');
  await p.goto(L.BASE + '/index.php?page=etiquettes&piece_id=1&emplacement_id=3&pieces=2,3');
  await p.waitForSelector('.et-etiquette');
  let codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(JSON.stringify(codes) === JSON.stringify(['P-0001', 'P-0002', 'P-0003', 'EMP-000003']), 'prérempli : P-0001, P-0002, P-0003 et EMP-000003 : ' + codes);
  ok((await p.textContent('#et-resume')).includes('4 étiquettes sur 1 feuille'), 'résumé : 4 étiquettes sur 1 feuille : ' + await p.textContent('#et-resume'));
  ok(await p.$$eval('.et-page .et-etiquette:not(.et-vide)', e => e.length) === 4, '4 étiquettes dans l\'aperçu');
  ok(await p.$$eval('#et-apercu svg', e => e.length) === 4, '4 codes-barres SVG');
  const eti = await p.$$eval('.et-etiquette', e => e.slice(0, 1).map(x => ({ code: x.querySelector('.et-code').textContent, nom: x.querySelector('.et-nom').textContent, droite: x.querySelector('.et-droite').textContent })));
  ok(eti[0].code === 'P-0001' && eti[0].nom === 'Thermocouple 36 po' && eti[0].droite === 'unité', 'contenu : code en clair, nom, unité : ' + JSON.stringify(eti[0]));
  const empEti = await p.$$eval('.et-etiquette', e => { const x = e[3]; return { code: x.querySelector('.et-code').textContent, nom: x.querySelector('.et-nom').textContent, droite: x.querySelector('.et-droite').textContent }; });
  ok(empEti.code === 'EMP-000003' && empEti.droite === 'Beauchemin', 'étiquette d\'emplacement : code EMP et nom de l\'entreprise : ' + JSON.stringify(empEti));
  await p.goto(L.BASE + '/index.php?page=etiquettes&piece_id=99999&emplacement_id=99999&pieces=abc,1');
  ok(await p.$$eval('.alert-warning', e => e.map(x => x.textContent).join('|').includes('introuvable')), 'pièce ou emplacement inconnu : avertissement clair');
  codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(JSON.stringify(codes) === JSON.stringify(['P-0001']), 'seul l\'élément valide est préremplie : ' + codes);

  section('Étiquettes : sélection (scanner, recherche, catégorie, emplacements)');
  await L.aller(p, 'etiquettes');
  await L.scanner(p, '#et-scan', 'P-0004'); await p.waitForTimeout(300);
  await L.scanner(p, '#et-scan', 'EMP-000004'); await p.waitForTimeout(300);
  await L.scanner(p, '#et-scan', '012345678905'); await p.waitForTimeout(300);   // alias de P-0001
  await L.scanner(p, '#et-scan', 'p-0001'); await p.waitForTimeout(300);          // même pièce : +1 copie
  codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(JSON.stringify(codes) === JSON.stringify(['P-0004', 'EMP-000004', 'P-0001']), 'scan : pièce, emplacement et alias : ' + codes);
  ok(await p.$eval('#et-table tbody tr:nth-child(3) input', e => e.value) === '2', 'scanner deux fois la même pièce : 2 copies');
  await L.scanner(p, '#et-scan', 'INCONNU-123'); await p.waitForTimeout(500);
  ok((await p.textContent('#toasts')).includes('Code inconnu'), 'code inconnu : message clair');
  ok(await p.$eval('#et-scan', e => e === document.activeElement), 'le focus reste dans le champ de scan');
  // recherche select2
  await p.click('#et-recherche + .select2 .select2-selection');
  await p.waitForSelector('.select2-search__field');
  await p.fill('.select2-search__field', 'gicl');
  await p.waitForSelector('.select2-results__option:has-text("P-0003")');
  await p.click('.select2-results__option:has-text("P-0003")');
  await p.waitForTimeout(500);
  codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(codes.includes('P-0003'), 'recherche de pièces (select2) : P-0003 ajoutée : ' + codes);
  ok(await p.$eval('#et-recherche', e => e.selectedOptions.length) === 0, 'la sélection se vide après l\'ajout (prête pour la suivante)');
  // catégorie
  await p.selectOption('#et-categorie', { label: 'Contrôles (4)' });
  await p.click('#et-ajouter-categorie'); await p.waitForTimeout(700);
  codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(['P-0001', 'P-0002', 'P-0008', 'P-0012'].every(c => codes.includes(c)), 'toutes les pièces de la catégorie « Contrôles » : ' + codes);
  ok(codes.filter(c => c === 'P-0001').length === 1, 'pas de doublon de ligne');
  // emplacements
  await p.click('#et-emplacements + .select2 .select2-selection');
  await p.waitForSelector('.select2-results__option:text-is("Boutique Centre-ville — EMP-000005")');
  await p.click('.select2-results__option:text-is("Boutique Centre-ville — EMP-000005")');
  await p.waitForTimeout(400);
  ok((await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent))).includes('EMP-000005'), 'emplacement choisi dans la liste');
  await p.click('#et-tous-emplacements'); await p.waitForTimeout(500);
  codes = await p.$$eval('#et-table tbody tr td:nth-child(2)', e => e.map(x => x.textContent));
  ok(['EMP-000001', 'EMP-000002', 'EMP-000003', 'EMP-000004', 'EMP-000005'].every(c => codes.includes(c)), 'tous les emplacements actifs ajoutés');
  await p.waitForTimeout(500);
  ok((await p.$$eval('.et-etiquette:not(.et-vide)', e => e.length)) === codes.length + 1, 'aperçu : une étiquette par copie');   // +1 : P-0001 en 2 copies
  await p.click('#et-vider'); await p.waitForTimeout(500);
  ok(await p.$$eval('#et-table tbody tr', e => e.length) === 0 && await p.$$eval('.et-etiquette', e => e.length) === 0, 'Vider la liste');

  section('Étiquettes : formats, feuille entamée, copies');
  await L.scanner(p, '#et-scan', 'P-0001'); await p.waitForTimeout(500);
  await p.fill('#et-table tbody tr:nth-child(1) input', '31'); await p.waitForTimeout(700);
  ok((await p.textContent('#et-resume')).includes('31 étiquettes sur 2 feuilles'), '31 copies : 2 feuilles : ' + await p.textContent('#et-resume'));
  ok(await p.$$eval('.et-page', e => e.length) === 2, '2 pages dans l\'aperçu');
  await p.fill('#et-table tbody tr:nth-child(1) input', '30'); await p.waitForTimeout(700);
  ok(await p.$$eval('.et-page', e => e.length) === 1, '30 copies : une seule feuille');
  await p.fill('#et-depart', '3'); await p.waitForTimeout(500);
  ok(await p.$$eval('.et-page', e => e.length) === 2 && await p.$$eval('.et-etiquette.et-vide', e => e.length) === 2, 'feuille entamée (case 3) : 2 cases vides et une 2e feuille');
  ok((await p.textContent('#et-resume')).includes('en commençant à la case 3'), 'résumé : case de départ');
  await p.fill('#et-depart', '1');
  await p.fill('#et-table tbody tr:nth-child(1) input', '2'); await p.waitForTimeout(600);
  await p.fill('#et-table tbody tr:nth-child(1) input', 'abc'); await p.waitForTimeout(700);
  ok(await p.$eval('#et-imprimer', e => e.disabled) && (await p.textContent('#et-resume')).includes('copies'), 'copies invalides : message et impression désactivée');
  await p.fill('#et-table tbody tr:nth-child(1) input', '201'); await p.waitForTimeout(700);
  ok(await p.$eval('#et-imprimer', e => e.disabled), '201 copies : refusé');
  await p.fill('#et-table tbody tr:nth-child(1) input', '2'); await p.waitForTimeout(700);
  await p.$eval('#et-format-rouleau', e => e.click()); await p.waitForTimeout(800);
  ok(await p.$$eval('.et-page', e => e.length) === 2 && (await p.textContent('#et-resume')).includes('une étiquette par page'), 'rouleau : une étiquette par page');
  ok(await p.$eval('#et-page-style', e => e.textContent.includes('50mm 25mm')), '@page rouleau : 50 mm × 25 mm');
  ok(await p.$eval('#et-depart-groupe', e => e.style.display === 'none'), 'case de départ masquée hors feuille');
  await p.$eval('#et-format-grande', e => e.click()); await p.waitForTimeout(800);
  ok(await p.$eval('#et-page-style', e => e.textContent.includes('100mm 50mm')), '@page grande : 100 mm × 50 mm');
  await p.$eval('#et-format-feuille30', e => e.click()); await p.waitForTimeout(800);
  ok(await p.$eval('#et-page-style', e => e.textContent.includes('215.9mm 279.4mm')), 'retour au format feuille');
  await p.evaluate(() => { window.__imprime = 0; window.print = () => { window.__imprime++; }; });
  await p.click('#et-imprimer');
  ok(await p.evaluate(() => window.__imprime) === 1, 'Imprimer appelle window.print()');

  section('Étiquettes : XSS, codes non imprimables, noms longs');
  await p.goto(L.BASE + `/index.php?page=etiquettes&pieces=${idXss}`);
  await p.waitForSelector('.et-etiquette');
  const nomXss = await p.$eval('.et-nom', e => e.textContent);
  ok(nomXss === '<img src=x onerror=alert(1)>', 'le nom <img…> s\'affiche comme texte : ' + nomXss);
  ok(await p.$$eval('img[src="x"]', e => e.length) === 0 && dialogues.length === 0, 'aucune balise injectée, aucune alerte JS');
  ok((await p.textContent('#et-table')).includes('<img src=x onerror=alert(1)>'), 'liste : nom échappé');
  await p.goto(L.BASE + `/index.php?page=etiquettes&pieces=1,${idAcc},${idLong}`);
  await p.waitForSelector('#et-refus', { state: 'visible' });
  const refus = await p.textContent('#et-refus');
  ok(refus.includes('ACC-É1') && refus.includes('caractères'), 'code avec accent refusé, message clair : ' + refus.replace(/\s+/g, ' ').slice(0, 160));
  ok(await p.$$eval('.et-etiquette:not(.et-vide)', e => e.length) === 2, 'les codes valides restent imprimables (P-0001 et le code de 24 caractères sur feuille)');
  ok(!(await p.$eval('#et-imprimer', e => e.disabled)), 'impression possible pour les éléments valides');
  ok(await p.$$eval('#et-table tr.table-danger', e => e.length) === 1, 'ligne refusée surlignée');
  await p.$eval('#et-format-rouleau', e => e.click()); await p.waitForTimeout(900);
  const refus2 = await p.textContent('#et-refus');
  ok(refus2.includes('LONG-24-CARACTERES-ABCDE') && refus2.includes('trop long pour ce format'), 'code de 24 caractères trop long pour le rouleau : refus clair');
  const r40 = await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'grande', elements: [{ type: 'piece', id: Number(idLong), copies: 1 }] });
  ok(r40.status === 200 && r40.json.elements[0].ok === true, 'le même code passe sur le grand format');
  await p.goto(L.BASE + `/index.php?page=etiquettes&pieces=${idNomLong}`);
  await p.waitForSelector('.et-etiquette');
  const nomCourt = await p.$eval('.et-nom', e => e.textContent);
  ok(nomCourt.endsWith('…') && nomCourt.length <= 64 && !/\s…$/.test(nomCourt), 'nom long tronqué proprement (mot entier + …) : ' + nomCourt);

  // ====================================================================================================================
  section('Étiquettes : impression (PDF), tailles de page et lisibilité');
  const ids14 = Array.from({ length: 14 }, (_, i) => i + 1).join(',');
  const attendu = { feuille30: [215.9, 279.4], rouleau: [50, 25], grande: [100, 50] };
  const lus = ['P-0001', 'P-0002', 'P-0003', 'P-0004', 'P-0005', 'P-0006', 'P-0007', 'P-0008', 'P-0009', 'P-0010', 'P-0011', 'P-0012', 'P-0013', 'P-0014', 'EMP-000003'].sort();
  if (!pdfOk) { console.log('  (pdfinfo/pdftoppm absents : vérifications PDF ignorées)'); }
  for (const fmt of ['feuille30', 'rouleau', 'grande']) {
    await p.goto(L.BASE + `/index.php?page=etiquettes&pieces=${ids14}&emplacement_id=3`);
    await p.waitForSelector('.et-etiquette');
    await p.$eval('#et-format-' + fmt, e => e.click());
    await p.waitForTimeout(900);
    await p.emulateMedia({ media: 'print' });
    const f = path.join(TMP, fmt + '.pdf');
    await p.pdf({ path: f, preferCSSPageSize: true, printBackground: true });
    await p.emulateMedia({ media: 'screen' });
    if (!pdfOk) { continue; }
    const info = execFileSync('pdfinfo', [f], { encoding: 'utf8' });
    const pages = Number(/Pages:\s+(\d+)/.exec(info)[1]);
    const m = /Page size:\s+([\d.]+) x ([\d.]+) pts/.exec(info);
    const wmm = Number(m[1]) / 72 * 25.4, hmm = Number(m[2]) / 72 * 25.4;
    ok(Math.abs(wmm - attendu[fmt][0]) < 0.6 && Math.abs(hmm - attendu[fmt][1]) < 0.6, `PDF ${fmt} : taille de page ${wmm.toFixed(1)} × ${hmm.toFixed(1)} mm (attendu ${attendu[fmt].join(' × ')})`);
    ok(pages === (fmt === 'feuille30' ? 1 : 15), `PDF ${fmt} : ${pages} page(s) pour 15 étiquettes`);
    if (decodeur) {
      execFileSync('pdftoppm', ['-r', '300', '-png', '-f', '1', '-l', '1', f, path.join(TMP, fmt)]);
      const png = fs.readdirSync(TMP).filter(x => x.startsWith(fmt + '-') && x.endsWith('.png')).sort()[0];
      const lu = await decodeur.lire(path.join(TMP, png));
      if (fmt === 'feuille30') {
        ok(JSON.stringify(lu) === JSON.stringify(lus), 'PDF feuille : les 15 codes-barres sont relus tels quels (P-0001…P-0014, EMP-000003) : ' + lu.join(' '));
        const bx = decodeur.boite(path.join(TMP, png), 300);
        ok(Math.abs(bx.left - 6.35) < 0.4 && Math.abs(bx.top - 14.3) < 0.4, `PDF feuille : contenu à l'échelle 100 % (premier code à ${bx.left.toFixed(2)} / ${bx.top.toFixed(2)} mm, attendu 6,35 / 14,3)`);
      } else {
        ok(lu.length === 1 && lu[0] === 'P-0001', `PDF ${fmt} : 1re étiquette relue : ${lu}`);
        const bx = decodeur.boite(path.join(TMP, png), 300);
        ok(bx.right < bx.largeur - 0.5 && bx.bottom < bx.hauteur - 0.5, `PDF ${fmt} : contenu entièrement dans la page (${bx.right.toFixed(1)} / ${bx.bottom.toFixed(1)} mm)`);
      }
    }
  }
  // 31 étiquettes sur feuille : 2 pages, la dernière sans page blanche en trop
  if (pdfOk) {
    await p.goto(L.BASE + '/index.php?page=etiquettes&piece_id=1');
    await p.waitForSelector('.et-etiquette');
    await p.fill('#et-table tbody tr:nth-child(1) input', '61'); await p.waitForTimeout(800);
    await p.emulateMedia({ media: 'print' });
    await p.pdf({ path: path.join(TMP, 'trois.pdf'), preferCSSPageSize: true });
    await p.emulateMedia({ media: 'screen' });
    ok(Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [path.join(TMP, 'trois.pdf')], { encoding: 'utf8' }))[1]) === 3, 'PDF : 61 étiquettes = 3 feuilles exactement (pas de page blanche)');
  }
  // capture d'écran d'une étiquette rendue par Chromium (aperçu) -> décodage
  if (decodeur) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 4 });
    const q = await ctx.newPage();
    await connecterComme(q, 'gestionnaire1');
    await q.goto(L.BASE + `/index.php?page=etiquettes&pieces=1,${idLong}&emplacement_id=3`);
    await q.waitForSelector('.et-etiquette');
    await q.waitForTimeout(600);
    const els = await q.$$('.et-etiquette');
    const attendus = ['P-0001', 'LONG-24-CARACTERES-ABCDE', 'EMP-000003'];
    const rendus = [els[0], els[1], els[2]];
    for (let i = 0; i < rendus.length; i++) {
      const f = path.join(TMP, 'ecran' + i + '.png');
      await rendus[i].screenshot({ path: f });
      const lu = await decodeur.lire(f);
      ok(lu.length === 1 && lu[0] === attendus[i], `capture d'écran de l'étiquette ${attendus[i]} : code relu « ${lu} »`);
    }
    await ctx.close();
  }

  section('Étiquettes : tablette (768 px)');
  {
    const ctx = await b.newContext({ viewport: { width: 768, height: 1024 } });
    const t = await ctx.newPage(); t.erreurs = [];
    t.on('pageerror', e => t.erreurs.push(e.message)); t.on('console', m => { if (m.type() === 'error') t.erreurs.push(m.text()); });
    await connecterComme(t, 'gestionnaire1');
    await t.goto(L.BASE + '/index.php?page=etiquettes&pieces=1,2,3');
    await t.waitForSelector('.et-etiquette'); await t.waitForTimeout(500);
    ok(await t.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'tablette : pas de défilement horizontal de la page');
    const bb = await t.$eval('.et-page', e => { const r = e.getBoundingClientRect(); return [r.left, r.right]; });
    ok(bb[1] <= 768, 'tablette : la feuille tient dans l\'écran (zoom automatique)');
    const tailles = await t.$$eval('#et-table .btn, #et-ajouter-categorie, #et-imprimer', e => e.map(x => x.getBoundingClientRect().height));
    ok(tailles.every(h => h >= 43.5), 'zones cliquables d\'au moins 44 px : ' + tailles.map(Math.round));
    ok(t.erreurs.length === 0, 'tablette : aucune erreur console : ' + JSON.stringify(t.erreurs));
    await ctx.close();
  }

  // ====================================================================================================================
  section('Étiquettes : contrôle d\'accès et sécurité des endpoints');
  const e1 = await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: 1 }] });
  ok(e1.status === 200 && e1.json.ok && e1.json.elements[0].svg.includes('<svg'), 'gestionnaire : données d\'étiquette');
  const erreurs = [
    [{ format: 'inconnu', elements: [{ type: 'piece', id: 1, copies: 1 }] }, 'Format', 'format inconnu'],
    [{ format: 'feuille30', elements: [] }, 'au moins', 'liste vide'],
    [{ format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: 0 }] }, 'copies', 'copies = 0'],
    [{ format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: 201 }] }, 'copies', 'copies = 201'],
    [{ format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: '1; DROP TABLE pieces' }] }, 'copies', 'copies non numériques'],
    [{ format: 'feuille30', elements: [{ type: 'piece', id: '1 OR 1=1', copies: 1 }] }, 'identifiant', 'id non numérique'],
    [{ format: 'feuille30', elements: [{ type: 'camion', id: 1, copies: 1 }] }, 'type', 'type inconnu'],
    [{ format: 'feuille30', elements: [{ type: 'piece', id: 999999, copies: 1 }] }, 'introuvable', 'pièce inexistante'],
    [{ format: 'feuille30', elements: Array.from({ length: 6 }, (_, i) => ({ type: 'piece', id: i + 1, copies: 200 })) }, 'Trop', 'plus de 1 000 étiquettes'],
  ];
  for (const [corps, mot, nom] of erreurs) {
    const r = await post(p, 'app/ajax/etiquettes_donnees.php', corps);
    ok(r.status === 400 && r.json && r.json.ok === false && r.json.erreur.includes(mot), `entrée invalide (${nom}) : 400 avec message français « ${r.json && r.json.erreur} »`);
  }
  sql("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Emplacement au code trop long', 'cube', '" + 'EMP-' + 'Z'.repeat(45) + "')");
  const idLongEmp = sql("SELECT id FROM emplacements WHERE nom = 'Emplacement au code trop long'");
  const rLong = await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'grande', elements: [{ type: 'emplacement', id: Number(idLongEmp), copies: 1 }] });
  ok(rLong.status === 200 && rLong.json.elements[0].ok === false && rLong.json.elements[0].erreur.includes('dépasse 40 caractères'), 'code de plus de 40 caractères : refusé avec message clair : ' + (rLong.json && rLong.json.elements[0].erreur));
  sql("UPDATE emplacements SET actif = 0 WHERE id = " + idLongEmp);
  const rOff = await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'grande', elements: [{ type: 'emplacement', id: Number(idLongEmp), copies: 1 }] });
  ok(rOff.status === 200 && rOff.json.elements[0].ok === false && rOff.json.elements[0].erreur.includes('désactivé'), 'emplacement désactivé : aucune étiquette');
  sql("UPDATE pieces SET actif = 0 WHERE code = 'NOM-LONG'");
  const rOffP = await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'grande', elements: [{ type: 'piece', id: Number(idNomLong), copies: 1 }] });
  ok(rOffP.status === 200 && rOffP.json.elements[0].ok === false && rOffP.json.elements[0].erreur.includes('désactivée'), 'pièce désactivée : aucune étiquette');
  sql("UPDATE pieces SET actif = 1 WHERE code = 'NOM-LONG'");
  const cat = await p.request.get(L.BASE + '/app/ajax/etiquettes_categorie.php?categorie_id=2');
  const catJ = await cat.json();
  ok(catJ.ok && catJ.pieces.length === 4 && catJ.pieces.every(x => x.id && x.code), 'catégorie : 4 pièces actives');
  const catBad = await p.request.get(L.BASE + '/app/ajax/etiquettes_categorie.php?categorie_id=abc');
  ok(catBad.status() === 400, 'catégorie invalide : 400');
  ok((await p.request.get(L.BASE + '/app/ajax/etiquettes_donnees.php')).status() === 405, 'GET sur un endpoint POST : 405');
  ok((await post(p, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: 1 }] }, false)).status === 403, 'sans jeton CSRF : 403');
  const brut = await fetch(L.BASE + '/app/ajax/etiquettes_donnees.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  ok(brut.status === 401, 'non connecté : 401');
  for (const u of ['app/ajax/pieces_export.php', 'app/ajax/import_modele.php', 'app/ajax/etiquettes_categorie.php?categorie_id=1']) {
    ok((await fetch(L.BASE + '/' + u)).status === 401, 'non connecté : 401 pour ' + u.split('?')[0]);
  }
  ok((await fetch(L.BASE + '/app/ajax/etiquette_lib.php')).status === 404 && (await fetch(L.BASE + '/app/ajax/import_lib.php')).status === 404, 'les bibliothèques ne sont pas des endpoints (404)');
  ok((await p.request.get(L.BASE + '/app/ajax/etiquette_lib.php')).status() === 404 && (await p.request.get(L.BASE + '/app/ajax/import_lib.php')).status() === 404, 'idem une fois connecté (404)');

  // Autre entreprise : gest_a2 n'a accès qu'à Beauchemin (entreprise 1)
  {
    const ctx = await b.newContext();
    const g = await ctx.newPage(); g.erreurs = [];
    g.on('pageerror', e => g.erreurs.push(e.message));
    await connecterComme(g, 'gest_a2');
    await g.goto(L.BASE + '/index.php?page=etiquettes&emplacement_id=2');
    ok((await g.$$eval('.alert-warning', e => e.map(x => x.textContent).join('|'))).includes('inaccessible'), 'emplacement d\'une autre entreprise dans l\'URL : ignoré avec message');
    ok((await g.$$('#et-table tbody tr')).length === 0, 'rien n\'est préchargé');
    ok((await g.$$('#et-emplacements option')).length === 3, 'gestionnaire de Beauchemin : seulement ses 3 emplacements dans la liste');
    const idor = await post(g, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'emplacement', id: 2, copies: 1 }] });
    ok(idor.status === 400 && idor.json.erreur.includes('introuvable ou inaccessible') && !JSON.stringify(idor.json).includes('Chaleur'), 'IDOR : emplacement d\'une autre entreprise refusé sans fuite : ' + JSON.stringify(idor.json));
    const idorOk = await post(g, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'emplacement', id: 3, copies: 1 }] });
    ok(idorOk.status === 200 && idorOk.json.elements[0].code === 'EMP-000003', 'son propre emplacement : accepté');
    const idor2 = await post(g, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'emplacement', id: 99999, copies: 1 }] });
    ok(idor2.status === 400 && idor2.json.erreur === idor.json.erreur, 'emplacement inexistant : même message que l\'emplacement inaccessible');
    await ctx.close();
  }
  // Employé
  {
    const ctx = await b.newContext();
    const e = await ctx.newPage(); e.erreurs = [];
    e.on('pageerror', x => e.erreurs.push(x.message));
    await connecterComme(e, 'employe1');
    for (const route of ['etiquettes', 'pieces_import']) {
      await e.goto(L.BASE + '/index.php?page=' + route);
      ok((await e.textContent('.content-wrapper')).includes('pas la permission'), `employé : page ${route} refusée`);
    }
    const r1 = await post(e, 'app/ajax/etiquettes_donnees.php', { format: 'feuille30', elements: [{ type: 'piece', id: 1, copies: 1 }] });
    ok(r1.status === 400 && r1.json.erreur.includes('permission'), 'employé : étiquettes refusées côté serveur');
    ok((await post(e, 'app/ajax/etiquettes_categorie.php', { categorie_id: 1 })).status === 400, 'employé : catégorie refusée');
    const r2 = await ANALYSE(e, FICHIERS.bom, 'f.csv', { mode: 'creer' });
    ok(r2.status === 400 && r2.json.erreur.includes('permission'), 'employé : analyse d\'import refusée');
    const r3 = await appliquerSource(e, [{ no: 2, v: { code: 'EMP-X', nom: 'Pirate' } }]);
    ok(r3.status === 400 && r3.json.erreur.includes('permission') && sql("SELECT COUNT(*) FROM pieces WHERE code = 'EMP-X'") === '0', 'employé : application d\'import refusée (rien d\'écrit)');
    ok((await e.request.get(L.BASE + '/app/ajax/import_modele.php')).status() === 403, 'employé : modèle refusé');
    await ctx.close();
  }

  sql("DELETE FROM pieces WHERE code = 'ACC-É1'");   // un code non imprimable ne peut de toute façon pas être ré-importé

  // ====================================================================================================================
  section('Import : modèle CSV et page');
  await L.aller(p, 'pieces_import');
  ok((await p.textContent('h1')).includes('Importer des pièces'), 'titre de la page d\'import');
  ok(await p.$eval('#imp-fichier-nom', e => e.textContent.includes('Choisir un fichier')), 'sélecteur de fichier en français');
  const tpl = await p.request.get(L.BASE + '/app/ajax/import_modele.php');
  const tplBuf = await tpl.body();
  ok(tpl.status() === 200 && tplBuf[0] === 0xEF && tplBuf[1] === 0xBB && tplBuf[2] === 0xBF, 'modèle : UTF-8 avec BOM');
  ok((tpl.headers()['content-disposition'] || '').startsWith('attachment'), 'modèle : Content-Disposition attachment');
  const tplLignes = tplBuf.toString('utf8').replace(/^﻿/, '').split('\r\n').filter(Boolean);
  ok(tplLignes[0] === 'code;nom;categorie;unite;code_barres;description;fournisseur;prix_fournisseur;no_fournisseur;minimum_entreprise_1;minimum_entreprise_2;emplacement;quantite;cout', 'modèle : colonnes dans l\'ordre, minimum par entreprise active : ' + tplLignes[0]);
  ok(tplLignes.length === 3 && tplLignes.slice(1).every(l => l.startsWith('#') && l.split(';').length === 14), 'modèle : 2 lignes d\'exemple (commentaires #), 14 colonnes');
  const aImporter = await televerser(p, 'app/ajax/import_analyser.php', tplBuf, 'modele.csv', { mode: 'creer' });
  ok(aImporter.status === 200 && aImporter.json.totaux.ignorer === 2 && aImporter.json.totaux.erreurs === 0 && aImporter.json.totaux.creer === 0, 'le modèle tel quel n\'importe rien (exemples ignorés)');
  {
    const ctx = await b.newContext(); const g = await ctx.newPage();
    await connecterComme(g, 'gest_a2');
    const t2 = (await (await g.request.get(L.BASE + '/app/ajax/import_modele.php')).text()).replace(/^﻿/, '').split('\r\n')[0];
    ok(t2.includes('minimum_entreprise_1') && !t2.includes('minimum_entreprise_2'), 'modèle d\'un gestionnaire limité à Beauchemin : une seule colonne de minimum');
    await ctx.close();
  }

  section('Import : parcours complet à l\'écran (fichier -> aperçu -> confirmation -> résumé)');
  const fBom = ecrire('bom');
  await p.setInputFiles('#imp-fichier', fBom);
  ok(await p.$eval('#imp-fichier-nom', e => e.textContent === 'bom.csv'), 'le nom du fichier choisi s\'affiche');
  await p.click('#imp-analyser');
  await p.waitForSelector('#imp-apercu', { state: 'visible' });
  ok(await p.$$eval('#imp-table tbody tr', e => e.length) === 3, 'aperçu : 3 lignes');
  ok((await p.textContent('#imp-meta')).includes('UTF-8') && (await p.textContent('#imp-meta')).includes('3 lignes lues'), 'aperçu : encodage et nombre de lignes lus');
  ok(await p.$$eval('#imp-table .badge-success', e => e.length) === 3, 'aperçu : 3 pièces à créer');
  ok((await p.textContent('#imp-tuiles')).includes('Erreurs') && await p.$eval('#imp-confirmer', e => !e.disabled), 'aperçu : aucune erreur, confirmation possible');
  ok((await p.textContent('#imp-bilan')).includes('3 documents de stock initial'), 'aperçu : 3 documents de stock initial annoncés : ' + (await p.textContent('#imp-bilan')));
  await p.click('#imp-confirmer');
  await p.waitForSelector('#imp-resultat', { state: 'visible' });
  const resume = await p.textContent('#imp-resume');
  ok(resume.includes('3 pièces créées') && resume.includes('0 pièce mise à jour') && resume.includes('0 ligne ignorée') && resume.includes('3 documents de stock initial créés'), 'résumé : créées / mises à jour / ignorées / documents : ' + resume.replace(/\s+/g, ' '));
  const liens = await p.$$eval('#imp-docs a', e => e.map(x => x.getAttribute('href')));
  ok(liens.length === 3 && liens.every(h => /^index\.php\?page=document_voir&id=\d+$/.test(h)), 'résumé : liens vers les documents : ' + liens);
  ok(sql("SELECT COUNT(*) FROM pieces WHERE code LIKE 'N-100%'") === '3', 'base : 3 pièces créées');
  ok(sql("SELECT GROUP_CONCAT(CONCAT(p.code,':',s.emplacement_id,':',s.quantite) ORDER BY p.code) FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE p.code LIKE 'N-100%'") === 'N-1001:1:10.000,N-1002:2:3.000,N-1003:3:40.500', 'base : stock initial par emplacement');
  ok(sql("SELECT GROUP_CONCAT(CONCAT(p.code,':',c.entreprise_id,':',c.cout_moyen) ORDER BY p.code) FROM stock_couts c JOIN pieces p ON p.id = c.piece_id WHERE p.code LIKE 'N-100%'") === 'N-1001:1:45.9000,N-1002:2:312.5000,N-1003:1:5.2500', 'base : coût moyen alimenté par le coût du fichier');
  ok(sql("SELECT COUNT(*) FROM documents WHERE type = 'ajustement' AND motif = 'autre' AND note = 'Stock initial (import)'") === '3', 'base : un ajustement « Stock initial (import) » par emplacement');
  ok(sql("SELECT GROUP_CONCAT(CONCAT(entreprise_id,':',minimum) ORDER BY entreprise_id) FROM seuils s JOIN pieces p ON p.id = s.piece_id WHERE p.code = 'N-1001'") === '1:5.000,2:2.000', 'base : minimums par entreprise');
  ok(sql("SELECT CONCAT(f.nom,':',pf.prix,':',pf.no_fournisseur) FROM prix_fournisseurs pf JOIN pieces p ON p.id = pf.piece_id JOIN fournisseurs f ON f.id = pf.fournisseur_id WHERE p.code = 'N-1001'") === 'Distribution Chauffage Plus:45.9000:VS-34', 'base : prix fournisseur et numéro');
  ok(sql("SELECT pc.code FROM pieces_codes pc JOIN pieces p ON p.id = pc.piece_id WHERE p.code = 'N-1001'") === '987000000011', 'base : alias de code-barres');
  ok(sql("SELECT COUNT(*) FROM journal WHERE action = 'import.catalogue'") === '1' && sql("SELECT COUNT(*) FROM journal WHERE action = 'piece.cree'") === '3', 'journal : import.catalogue et piece.cree');
  const invariant = "SELECT (SELECT COUNT(*) FROM stock s WHERE s.quantite <> COALESCE((SELECT SUM(m.quantite) FROM mouvements m WHERE m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id), 0)) + (SELECT COUNT(*) FROM mouvements m2 WHERE NOT EXISTS (SELECT 1 FROM stock s2 WHERE s2.piece_id = m2.piece_id AND s2.emplacement_id = m2.emplacement_id))";
  ok(sql(invariant) === '0', 'invariant stock = somme des mouvements');
  // scan : les pièces importées sont trouvées par code interne et par alias
  const sc = await p.request.get(L.BASE + '/app/ajax/scan_code.php?code=987000000011');
  const scJ = await sc.json();
  ok(scJ.trouve && scJ.piece.code === 'N-1001' && scJ.piece.stock[0].quantite === '10.000', 'scan de l\'alias importé : pièce et stock trouvés');

  section('Import : ré-import, modes et mise à jour');
  await L.aller(p, 'pieces_import');
  await p.setInputFiles('#imp-fichier', fBom);
  await p.click('#imp-analyser');
  await p.waitForSelector('#imp-apercu', { state: 'visible' });
  ok(await p.$$eval('#imp-table .badge-secondary', e => e.length) === 3, 'ré-import en mode « Créer seulement » : 3 lignes ignorées');
  ok(await p.$eval('#imp-confirmer', e => e.disabled) && (await p.textContent('#imp-bilan')).includes('rien à importer'), 'rien à importer : confirmation désactivée');
  ok((await p.textContent('#imp-table')).includes('Le code existe déjà'), 'message « code déjà existant »');
  await CLICK(p, '#imp-mode-maj'); await p.waitForTimeout(700);
  ok(await p.$$eval('#imp-table .badge-secondary', e => e.length) === 3 && (await p.textContent('#imp-table')).includes('Aucun changement'), 'mode « mettre à jour » sans modification : 3 lignes sans changement');
  await p.click('#imp-changer');
  ok(await p.$eval('#imp-depart', e => e.style.display !== 'none') && await p.$eval('#imp-apercu', e => e.style.display === 'none'), 'Choisir un autre fichier : retour à l\'étape du fichier');
  const modif = U8(ENT + 'N-1001;Valve de sécurité 3/4 po (renommée);Brûleurs;paire;987000000011|987000000012;;Distribution Chauffage Plus;49,90;VS-34;8;;EMP-000001;999;1\r\nN-1002;;;;;;;;;;;;;\r\n');
  const modifF = path.join(TMP, 'modif.csv'); fs.writeFileSync(modifF, modif);
  await p.setInputFiles('#imp-fichier', modifF);
  await p.click('#imp-analyser');
  await p.waitForSelector('#imp-apercu', { state: 'visible' });
  const txtModif = await p.textContent('#imp-table');
  ok(txtModif.includes('Modifie : nom, catégorie, unité, alias (+1), prix fournisseur, minimum entreprise 1'), 'aperçu de mise à jour : liste des champs modifiés : ' + txtModif.replace(/\s+/g, ' ').slice(0, 300));
  ok(txtModif.includes('Stock ignoré'), 'avertissement : le stock d\'une pièce existante n\'est jamais modifié');
  ok(await p.$eval('#imp-confirmer', e => !e.disabled), 'mise à jour : confirmation possible (avertissement non bloquant)');
  await p.click('#imp-confirmer');
  await p.waitForSelector('#imp-resultat', { state: 'visible' });
  const resume2 = await p.textContent('#imp-resume');
  ok(resume2.includes('1 pièce mise à jour') && resume2.includes('1 ligne ignorée') && resume2.includes('dont 1 sans changement') && resume2.includes('0 pièce créée'), 'résumé de la mise à jour : ' + resume2.replace(/\s+/g, ' '));
  ok(sql("SELECT CONCAT(p.nom,'|',c.nom,'|',p.unite) FROM pieces p JOIN categories c ON c.id = p.categorie_id WHERE p.code = 'N-1001'") === 'Valve de sécurité 3/4 po (renommée)|Brûleurs|paire', 'base : nom, catégorie et unité mis à jour');
  ok(sql("SELECT GROUP_CONCAT(code ORDER BY id) FROM pieces_codes WHERE piece_id = (SELECT id FROM pieces WHERE code = 'N-1001')") === '987000000011,987000000012', 'base : alias ajouté sans retirer l\'ancien');
  ok(sql("SELECT quantite FROM stock WHERE piece_id = (SELECT id FROM pieces WHERE code = 'N-1001') AND emplacement_id = 1") === '10.000', 'base : le stock n\'a pas bougé (jamais modifié par l\'import)');
  ok(sql("SELECT prix FROM prix_fournisseurs WHERE piece_id = (SELECT id FROM pieces WHERE code = 'N-1001')") === '49.9000' && sql("SELECT COUNT(*) FROM prix_fournisseurs_hist WHERE piece_id = (SELECT id FROM pieces WHERE code = 'N-1001')") === '2', 'base : prix mis à jour avec historique');
  ok(sql("SELECT nom FROM pieces WHERE code = 'N-1002'") === 'Brûleur Beckett AFG', 'cellule vide : la valeur existante est conservée');
  ok(sql(invariant) === '0', 'invariant stock = somme des mouvements (après mise à jour)');

  section('Import : fichiers pièges (analyse par l\'API)');
  const an = async (nom, champs) => ANALYSE(p, FICHIERS[nom], nom + '.csv', Object.assign({ mode: 'creer' }, champs || {}));
  let r = await an('virgule');
  ok(r.status === 200 && r.json.meta.separateur === ',' && r.json.totaux.erreurs === 0 && r.json.totaux.creer === 2, 'séparateur « , » détecté, guillemets doublés et virgules dans les cellules');
  ok(r.json.resultats[1].nom === 'Câble 3/8", noir, 2 m' && r.json.resultats[0].stock.cout === '64.9000' && r.json.resultats[1].stock.quantite === '12.500', 'virgule : nom avec guillemet et virgules, décimales à point');
  r = await an('win1252');
  ok(r.status === 200 && r.json.meta.encodage === 'Windows-1252' && r.json.resultats[0].nom === 'Électrode d\'allumage' && r.json.resultats[1].nom === 'Thermocouple « 36 po » à 5 °C', 'Windows-1252 détecté et accents corrects : ' + (r.json && r.json.resultats && r.json.resultats[1].nom));
  r = await an('bom');
  ok(r.status === 200 && r.json.meta.colonnes[0] === 'code' && r.json.meta.encodage === 'UTF-8', 'BOM UTF-8 ignoré : la colonne s\'appelle bien « code »');
  r = await an('guillemets');
  ok(r.status === 200 && r.json.resultats[0].nom === 'Pompe "Suntec" A2VA' && r.json.source[0].v.description === 'Ligne 1\nLigne 2; avec point-virgule' && r.json.resultats[1].no === 4, 'retour à la ligne et « ; » dans une cellule entre guillemets : cellule intacte, numéros de ligne exacts');
  r = await an('formules');
  ok(r.status === 200 && r.json.totaux.erreurs === 0 && r.json.resultats.map(x => x.nom).join('|') === '=1+1|+33 pièces|@SUM(A1)|-5 degrés', 'valeurs commençant par = + @ - : acceptées comme texte (jamais interprétées)');
  r = await an('formulesCode');
  ok(r.json.totaux.erreurs === 2 && r.json.resultats[0].msgs[0][1].includes('caractères non permis'), 'code commençant par = ou + : refusé');
  r = await ANALYSE(p, U8(ENT + 'p-0001;Thermocouple 36 po;;;;;;;;;;;;\r\nn-9001;minuscules;;;;;;;;;;;;\r\n'), 'min.csv', { mode: 'creer_maj' });
  ok(r.json.totaux.erreurs === 0 && r.json.resultats[0].action === 'inchange' && r.json.resultats[0].code === 'P-0001' && r.json.resultats[1].code === 'N-9001', 'codes en minuscules : retrouvés sans tenir compte de la casse et créés en majuscules (comme la fiche de pièce)');
  r = await an('vides');
  ok(r.json.totaux.creer === 2 && r.json.meta.lignes_vides === 5 && r.json.resultats.map(x => x.no).join() === '4,7', 'lignes vides ignorées, numéros de ligne exacts');
  r = await an('doublons');
  const msgsD = r.json.resultats.map(x => x.msgs.map(m => m[1]).join(' '));
  ok(msgsD[1].includes('Code en double') && msgsD[2].includes('Code en double') && r.json.totaux.erreurs === 4, 'codes en double dans le fichier (même casse différente) : erreurs bloquantes');
  ok(msgsD[3].includes('déjà utilisé par la pièce « P-0001 »') && msgsD[5].includes('déjà utilisé à la ligne 6'), 'alias déjà utilisé (base ou fichier) : erreur claire');
  ok(msgsD[6].includes('Le code existe déjà') && r.json.resultats[6].statut === 'avertissement', 'code existant en mode « créer seulement » : avertissement, ligne ignorée');
  r = await an('accents');
  ok(r.json.totaux.erreurs === 3 && r.json.resultats[0].msgs[0][1].includes('caractères non permis') && r.json.resultats[3].msgs[0][1].includes('trop long'), 'accent, espace, 41 caractères dans le code : erreurs');
  r = await an('erreurs');
  const m = r.json.resultats.map(x => x.msgs.map(y => y[1]).join(' '));
  ok(r.json.totaux.erreurs === 9, 'erreurs variées : 9 lignes bloquantes');
  ok(/Catégorie inconnue/.test(m[0]) && /Fournisseur inconnu/.test(m[1]) && /Emplacement inconnu/.test(m[2]) && /Quantité invalide/.test(m[3]) && /Coût invalide/.test(m[4]) && /négative/.test(m[5]) && /Indiquez l'emplacement/.test(m[6]) && /Plusieurs emplacements/.test(m[7]) && /fournisseur correspondant/.test(m[8]), 'messages précis en français pour chaque cas : ' + m.map(x => x.slice(0, 30)).join(' / '));
  r = await an('erreurs', { creer_categories: '1', creer_fournisseurs: '1' });
  ok(r.json.totaux.erreurs === 7 && r.json.totaux.categories_a_creer === 1 && r.json.totaux.fournisseurs_a_creer === 1 && r.json.resultats[0].statut === 'avertissement', 'options « créer les manquants » : devient un avertissement');
  r = await an('commentaires');
  ok(r.json.totaux.ignorer === 2 && r.json.totaux.creer === 1, 'lignes # = commentaires ignorés');
  r = await an('nombres');
  ok(r.json.totaux.erreurs === 0 && r.json.resultats[0].stock.quantite === '1234.500' && r.json.resultats[0].stock.cout === '1234.5600' && r.json.resultats[1].stock.cout === '12.5000' && r.json.resultats[1].msgs.some(x => x[1].includes('arrondie')), 'nombres : « 1 234,5 », « 1.234,56 », « 12,50 $ », arrondi signalé');
  r = await an('trop');
  ok(r.json.totaux.erreurs === 1 && r.json.resultats[0].msgs[0][1].includes('plus de cellules'), 'texte contenant le séparateur sans guillemets : ligne décalée détectée');
  // refus globaux
  for (const [nom, mot, desc] of [['binaire', 'binaires', 'fichier binaire renommé .csv'], ['vide', 'vide', 'fichier vide'], ['enteteSeul', 'en-tête', 'en-tête seul'], ['sansCode', 'code', 'colonne code absente'], ['utf16', 'UTF-16', 'UTF-16'], ['guillemetOuvert', 'Guillemet non fermé', 'guillemet jamais fermé']]) {
    r = await an(nom);
    ok(r.status === 400 && r.json && r.json.ok === false && r.json.erreur.includes(mot), `${desc} : refusé avec message (${r.json && r.json.erreur})`);
  }
  r = await ANALYSE(p, FICHIERS.bom, 'f.xlsx', { mode: 'creer' });
  ok(r.status === 400 && r.json.erreur.includes('.csv'), 'mauvaise extension : refusée');
  r = await ANALYSE(p, FICHIERS.bom, 'f.php.csv', { mode: 'creer' });
  ok(r.status === 200, 'nom de fichier à double extension : traité comme données (jamais exécuté)');
  ok(!fs.existsSync(path.join(RACINE, 'f.php.csv')) && fs.readdirSync(path.join(RACINE, 'app', 'ajax')).every(x => !/\.csv$/.test(x)), 'le fichier n\'est jamais enregistré dans le dossier web');
  r = await ANALYSE(p, lot(5001, 'B'), 'f.csv', { mode: 'creer', creer_categories: '1' });
  ok(r.status === 400 && r.json.erreur.includes('5 000 lignes'), '5 001 lignes : refusé');
  r = await ANALYSE(p, lot(5000, 'B'), 'f.csv', { mode: 'creer', creer_categories: '1' });
  ok(r.status === 200 && r.json.totaux.creer === 5000 && r.json.totaux.erreurs === 0, '5 000 lignes : accepté');
  ok(r.json.totaux.avertissements === 1, 'catégorie à créer : un seul avertissement pour 5 000 lignes (pas de bruit)');
  let gros = ENT; let i = 0; while (gros.length < 3 * 1024 * 1024) { gros += `G-${String(i++).padStart(7, '0')};Pièce ${'x'.repeat(120)};;;;;;;;;;;;\r\n`; }
  r = await ANALYSE(p, U8(gros), 'gros.csv', { mode: 'creer' });
  ok(r.status === 400 && r.json && r.json.erreur.includes('2 Mo'), '3 Mo : refusé avec message');
  r = await post(p, 'app/ajax/import_analyser.php', { lignes: 'pas un tableau', mode: 'creer' });
  ok(r.status === 400, 'JSON invalide : 400');
  r = await post(p, 'app/ajax/import_analyser.php', { lignes: [{ no: 2, v: { code: 'J-1', nom: 'x' } }], mode: 'pirate' });
  ok(r.status === 400 && r.json.erreur.includes('Mode'), 'mode inconnu : refusé');
  r = await post(p, 'app/ajax/import_analyser.php', { lignes: [{ no: 2, v: { code: 'J-1', nom: 'x', evil: '1', 'minimum_entreprise_1; DROP': '1' } }], mode: 'creer' });
  ok(r.status === 200 && r.json.totaux.creer === 1 && r.json.totaux.erreurs === 0, 'colonnes inconnues envoyées en JSON : ignorées');

  section('Import : plusieurs emplacements pour une pièce, tranches de 300 lignes');
  const multi = U8(ENT + 'M-1;Pièce multi;Contrôles;unité;;;;;;;;EMP-000001;5;2\r\nM-1;;;;;;;;;;;EMP-000003;3;2,5\r\nM-1;;;;;;;;;;;EMP-000003;1;2\r\nM-2;Autre;;;;;;;;;;;;\r\nM-2;Autre nom;;;;;;;;;;EMP-000001;1;1\r\n');
  r = await ANALYSE(p, multi, 'multi.csv', { mode: 'creer' });
  const mm = r.json.resultats.map(x => x.msgs.map(y => y[1]).join(' '));
  ok(r.json.totaux.erreurs === 2 && r.json.totaux.lignes_stock === 2 && mm[1].includes('Code répété') && r.json.resultats[1].action === 'stock', 'ligne répétée = stock supplémentaire dans un autre emplacement (avertissement)');
  ok(mm[2].includes('déjà une ligne de stock pour cet emplacement') && mm[4].includes('Code en double') && mm[4].includes('« nom »'), 'même emplacement répété ou informations différentes : erreurs');
  r = await ANALYSE(p, U8(ENT + 'M-1;Pièce multi;Contrôles;unité;;;;;;;;EMP-000001;5;2\r\nM-1;;;;;;;;;;;EMP-000003;3;2,5\r\n'), 'multi.csv', { mode: 'creer' });
  ok(r.json.totaux.erreurs === 0 && r.json.totaux.documents === 2 && r.json.totaux.creer === 1, 'une pièce, deux emplacements : 2 documents prévus');
  r = await appliquerSource(p, r.json.source);
  ok(r.status === 200 && r.json.creees === 1 && r.json.documents.length === 2, 'application : une pièce créée, 2 documents');
  ok(sql("SELECT GROUP_CONCAT(CONCAT(s.emplacement_id,':',s.quantite) ORDER BY s.emplacement_id) FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE p.code = 'M-1'") === '1:5.000,3:3.000', 'base : stock réparti dans les 2 emplacements');
  let s700 = 'code;nom;unite;emplacement;quantite;cout\r\n';
  for (let k = 0; k < 700; k++) { s700 += `S-${String(k).padStart(4, '0')};Pièce stock ${k};unité;EMP-000001;${k % 7 + 1};${(k % 13) + 0.5}\r\n`; }
  r = await ANALYSE(p, U8(s700), 's700.csv', { mode: 'creer' });
  ok(r.json.totaux.erreurs === 0 && r.json.totaux.documents === 3, '700 lignes de stock dans un emplacement : 3 documents prévus (300 lignes au plus par document)');
  r = await appliquerSource(p, r.json.source);
  ok(r.status === 200 && r.json.documents.map(x => x.lignes).join() === '300,300,100' && r.json.documents.every(x => x.emplacement.includes('Beauchemin')), 'application : documents de 300, 300 et 100 lignes');
  ok(sql("SELECT COUNT(*) FROM documents WHERE note LIKE 'Stock initial (import) (partie % de 3)'") === '3' && sql(invariant) === '0', 'notes des tranches et invariant du stock');

  section('Import : XSS dans l\'aperçu');
  await L.aller(p, 'pieces_import');
  const fx = ecrire('xss');
  await p.setInputFiles('#imp-fichier', fx);
  await p.click('#imp-analyser');
  await p.waitForSelector('#imp-apercu', { state: 'visible' });
  ok((await p.textContent('#imp-table')).includes('<img src=x onerror=alert(1)>') && await p.$$eval('#imp-table img', e => e.length) === 0 && dialogues.length === 0, 'nom <img…> affiché comme texte dans l\'aperçu, rien d\'exécuté');
  await p.click('#imp-confirmer');
  await p.waitForSelector('#imp-resultat', { state: 'visible' });
  ok(sql("SELECT nom FROM pieces WHERE code = 'X-1'") === '<img src=x onerror=alert(1)>', 'le nom est stocké tel quel (échappé à l\'affichage)');
  await L.aller(p, 'etiquettes&pieces=' + sql("SELECT id FROM pieces WHERE code = 'X-1'"));
  ok(dialogues.length === 0 && await p.$$eval('img[src="x"]', e => e.length) === 0, 'et reste inoffensif sur la page des étiquettes');

  section('Import : tout ou rien, revalidation côté serveur, droits par entreprise');
  const avant = sql('SELECT COUNT(*) FROM pieces');
  const avantDocs = sql('SELECT COUNT(*) FROM documents');
  const avantMouv = sql('SELECT COUNT(*) FROM mouvements');
  r = await ANALYSE(p, FICHIERS.atomique, 'at.csv', { mode: 'creer' });
  ok(r.json.totaux.erreurs === 1 && r.json.totaux.creer === 2, 'aperçu : 2 valides + 1 erreur');
  r = await appliquerSource(p, r.json.source);
  ok(r.status === 400 && r.json.erreurs && r.json.erreurs.length === 1 && r.json.erreurs[0].code === 'AT-3', 'application refusée : détail de la ligne fautive : ' + JSON.stringify(r.json && r.json.erreurs));
  ok(sql('SELECT COUNT(*) FROM pieces') === avant && sql("SELECT COUNT(*) FROM pieces WHERE code LIKE 'AT-%'") === '0' && sql('SELECT COUNT(*) FROM documents') === avantDocs && sql('SELECT COUNT(*) FROM mouvements') === avantMouv, 'tout ou rien : aucune pièce, aucun document, aucun mouvement créé');
  // l'aperçu n'est pas cru : on envoie des lignes falsifiées directement à l'application
  r = await appliquerSource(p, [{ no: 2, v: { code: 'FAUX-1', nom: 'Falsifiée', emplacement: 'EMP-999999', quantite: '5', cout: '1' } }]);
  ok(r.status === 400 && sql("SELECT COUNT(*) FROM pieces WHERE code = 'FAUX-1'") === '0', 'application : lignes falsifiées revalidées (emplacement inexistant refusé)');
  r = await appliquerSource(p, [{ no: 2, v: { code: 'FAUX-2', nom: 'Falsifiée', quantite: '9999999999999999999' } }]);
  ok(r.status === 400, 'application : quantité démesurée refusée');
  r = await appliquerSource(p, [], {});
  ok(r.status === 400, 'application sans ligne : refusée');
  r = await appliquerSource(p, [{ no: 2, v: { code: 'OK-API', nom: 'Par l\'API' } }], { mode: 'creer', creer_categories: false });
  ok(r.status === 200 && r.json.creees === 1, 'application directe valide : créée');
  r = await appliquerSource(p, [{ no: 2, v: { code: 'OK-API', nom: 'Par l\'API' } }]);
  ok(r.status === 400 && r.json.erreur.includes('rien à importer'), 'double envoi : la 2e application ne crée rien (aucun doublon)');
  ok(sql("SELECT COUNT(*) FROM pieces WHERE code = 'OK-API'") === '1', 'une seule pièce OK-API');
  // double clic dans l'interface : le bouton est désactivé pendant l'envoi
  await L.aller(p, 'pieces_import');
  await p.setInputFiles('#imp-fichier', ecrire('commentaires'));
  await p.click('#imp-analyser');
  await p.waitForSelector('#imp-apercu', { state: 'visible' });
  await p.$eval('#imp-confirmer', e => { e.click(); e.click(); });
  await p.waitForSelector('#imp-resultat', { state: 'visible' });
  ok(sql("SELECT COUNT(*) FROM pieces WHERE code = 'C-1'") === '1', 'double clic sur Confirmer : une seule création');
  // gestionnaire limité à Beauchemin : jamais l'entreprise 2
  {
    const ctx = await b.newContext(); const g = await ctx.newPage();
    await connecterComme(g, 'gest_a2');
    r = await ANALYSE(g, FICHIERS.autreEntreprise, 'idor.csv', { mode: 'creer' });
    const mi = r.json.resultats.map(x => x.msgs.map(y => y[1]).join(' '));
    ok(r.status === 200 && r.json.totaux.erreurs === 2 && mi[0].includes('inconnu ou inaccessible') && mi[1].includes('inconnue ou inaccessible'), 'IDOR import : emplacement et minimum d\'une autre entreprise refusés : ' + mi.join(' / '));
    ok(!JSON.stringify(r.json).includes('Chaleur'), 'IDOR import : aucune donnée de l\'autre entreprise dans la réponse');
    const forge = await appliquerSource(g, [{ no: 2, v: { code: 'IDOR-1', nom: 'Pièce IDOR', emplacement: 'EMP-000002', quantite: '5', cout: '1' } }]);
    ok(forge.status === 400 && sql("SELECT COUNT(*) FROM pieces WHERE code = 'IDOR-1'") === '0' && sql("SELECT COUNT(*) FROM stock WHERE emplacement_id = 2 AND piece_id > 30") === '0', 'IDOR import : application falsifiée refusée, rien d\'écrit');
    const forge2 = await appliquerSource(g, [{ no: 2, v: { code: 'IDOR-3', nom: 'Pièce IDOR 3', emplacement: 'Entrepôt principal', quantite: '5', cout: '1' } }]);
    ok(forge2.status === 200 && sql("SELECT emplacement_id FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE p.code = 'IDOR-3'") === '1', 'nom d\'emplacement ambigu : pour ce gestionnaire, seul Beauchemin est visible (aucune ambiguïté)');
    const ex = await g.request.get(L.BASE + '/app/ajax/pieces_export.php');
    const exT = await ex.text();
    ok(exT.split('\r\n')[0].includes('quantite_entreprise_1') && !exT.split('\r\n')[0].includes('entreprise_2'), 'export d\'un gestionnaire limité : colonnes de Beauchemin seulement');
    await ctx.close();
  }

  section('Export CSV');
  const ex = await p.request.get(L.BASE + '/app/ajax/pieces_export.php');
  const exBuf = await ex.body();
  const exTxt = exBuf.toString('utf8');
  ok(ex.status() === 200 && exBuf[0] === 0xEF && exBuf[1] === 0xBB && exBuf[2] === 0xBF, 'export : UTF-8 avec BOM');
  ok(/^attachment; filename="catalogue-pieces-\d{4}-\d{2}-\d{2}\.csv"$/.test(ex.headers()['content-disposition'] || '') && /text\/csv/.test(ex.headers()['content-type']), 'export : Content-Disposition attachment, type text/csv');
  const exL = exTxt.replace(/^﻿/, '').split('\r\n');
  ok(exL[0].startsWith('code;nom;categorie;unite;code_barres;description;actif;quantite_entreprise_1;quantite_entreprise_2;cout_moyen_entreprise_1;cout_moyen_entreprise_2;minimum_entreprise_1;minimum_entreprise_2'), 'export gestionnaire : colonnes (quantité et coût moyen par entreprise) : ' + exL[0]);
  const l1 = exL.find(x => x.startsWith('P-0001;'));
  ok(/^P-0001;Thermocouple 36 po;Contrôles;unité;012345678905;;oui;/.test(l1) && /;14,50;/.test(l1), 'export : virgule décimale, alias, actif, coût moyen : ' + l1);
  r = await ANALYSE(p, FICHIERS.formules, 'f.csv', { mode: 'creer' });
  await appliquerSource(p, r.json.source);
  const ex2 = (await (await p.request.get(L.BASE + '/app/ajax/pieces_export.php')).text()).replace(/^﻿/, '').split('\r\n');
  const lf = ex2.filter(x => /^N-50/.test(x)).map(x => x.split(';')[1]);
  ok(lf.join('|') === "'=1+1|'+33 pièces|'@SUM(A1)|'-5 degrés", 'export : valeurs commençant par = + @ - neutralisées par une apostrophe : ' + lf);
  ok(ex2.filter(x => /^N-5002/.test(x))[0].split(';')[5] === "'=cmd|' /C calc'!A0", 'export : description commençant par = neutralisée');
  // cellule avec guillemets, « ; » et retour à la ligne : exportée entre guillemets, puis ré-importée à l'identique
  r = await ANALYSE(p, FICHIERS.guillemets, 'g.csv', { mode: 'creer' });
  await appliquerSource(p, r.json.source);
  const ex3 = (await (await p.request.get(L.BASE + '/app/ajax/pieces_export.php')).text()).replace(/^\uFEFF/, '');
  ok(ex3.includes('N-4001;"Pompe ""Suntec"" A2VA";') && ex3.includes('"Ligne 1\nLigne 2; avec point-virgule"'), 'export : guillemets doublés, « ; » et retour à la ligne entre guillemets');
  r = await ANALYSE(p, Buffer.from('\uFEFF' + ex3), 'e.csv', { mode: 'creer_maj' });
  ok(r.json.totaux.erreurs === 0 && r.json.totaux.maj === 0 && r.json.resultats.find(x => x.code === 'N-4001').action === 'inchange', 'ré-import de la cellule multiligne : aucun changement');
  // ré-import de l'export
  r = await ANALYSE(p, Buffer.from(exTxt), 'export.csv', { mode: 'creer_maj' });
  ok(r.status === 200 && r.json.totaux.erreurs === 0 && r.json.totaux.maj === 0 && r.json.totaux.creer === 0 && r.json.totaux.inchange === r.json.totaux.total, 'l\'export se ré-importe tel quel : aucune erreur, aucun changement (' + r.json.totaux.inchange + '/' + r.json.totaux.total + ')');
  ok(r.json.meta.colonnes_informatives.length >= 5, 'colonnes informatives (actif, quantités, coûts) ignorées à l\'import : ' + r.json.meta.colonnes_informatives);
  // export modifié -> mise à jour
  const exMod = exTxt.replace('P-0002;Aquastat Honeywell L8148', 'P-0002;Aquastat Honeywell L8148 (v2)').replace('P-0003;Gicleur Delavan 0.75 gph 80° B;Gicleurs et pompes', 'P-0003;Gicleur Delavan 0.75 gph 80° B;Contrôles');
  r = await ANALYSE(p, Buffer.from(exMod), 'export.csv', { mode: 'creer_maj' });
  ok(r.json.totaux.maj === 2 && r.json.totaux.erreurs === 0, 'export modifié dans le tableur : 2 pièces à mettre à jour');
  // pièces désactivées
  sql("UPDATE pieces SET actif = 0 WHERE code = 'P-0014'");
  ok(!(await (await p.request.get(L.BASE + '/app/ajax/pieces_export.php')).text()).includes('P-0014;') && (await (await p.request.get(L.BASE + '/app/ajax/pieces_export.php?inactives=1')).text()).includes('P-0014;'), 'export : pièces désactivées incluses seulement sur demande');
  r = await ANALYSE(p, Buffer.from((await (await p.request.get(L.BASE + '/app/ajax/pieces_export.php?inactives=1')).text())), 'e.csv', { mode: 'creer_maj' });
  ok(r.json.totaux.erreurs === 0 && r.json.resultats.find(x => x.code === 'P-0014').msgs.some(x => x[1].includes('désactivée')), 'pièce désactivée : mise à jour sans la réactiver (avertissement)');
  sql("UPDATE pieces SET actif = 1 WHERE code = 'P-0014'");
  // employé : aucun coût
  {
    const ctx = await b.newContext(); const e = await ctx.newPage();
    await connecterComme(e, 'employe1');
    const t = await (await e.request.get(L.BASE + '/app/ajax/pieces_export.php')).text();
    const ent = t.split('\r\n')[0];
    ok(!/cout|coût|prix/i.test(ent) && ent.includes('quantite_entreprise_1') && !ent.includes('entreprise_2'), 'export employé : aucune colonne de coût, entreprise 1 seulement : ' + ent);
    ok(!/14,50|78,00|312,5/.test(t), 'export employé : aucun montant dans le fichier');
    await ctx.close();
  }

  section('Journal et état final');
  ok(Number(sql("SELECT COUNT(*) FROM journal WHERE action = 'import.catalogue'")) >= 5, 'journal : chaque import est journalisé');
  ok(sql(invariant) === '0', 'invariant stock = somme des mouvements (fin des tests)');
  ok(sql('SELECT COUNT(*) FROM stock WHERE quantite < 0') === '0', 'aucun stock négatif');
  if (PORT && fs.existsSync(`/tmp/bea-${PORT}.log`)) {
    const log = fs.readFileSync(`/tmp/bea-${PORT}.log`, 'utf8').split('\n').filter(l => /(Warning|Notice|Fatal|Deprecated|Parse error|Stack trace)/.test(l) && !/Accepted|Closing/.test(l));
    ok(log.length === 0, 'journal PHP propre : ' + log.slice(0, 3).join(' / '));
  }
  ok(p.erreurs.length === 0, 'aucune erreur console / JS / requête échouée : ' + JSON.stringify(p.erreurs));
  ok(dialogues.length === 0, 'aucune boîte de dialogue JS inattendue');

  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
