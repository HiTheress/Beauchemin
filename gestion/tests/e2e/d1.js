// Test de bout en bout du module D1 — Scanner / chercher et comptage d'inventaire.
//   cd gestion && tools/serveur.sh start bea_d1 8105 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8105 node tests/e2e/d1.js      (la base est celle du serveur ; DB_NAME=bea_d1 pour la forcer)
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), crée ses propres données
// (compte gest_bea = gestionnaire de l'entreprise 1 seulement ; pièces renommées / désactivées) et la remet à zéro à la fin.
// Il suppose donc un serveur de DÉVELOPPEMENT (base bea_*) : la base ciblée est déduite du serveur du port de BASE_URL, ou donnée par DB_NAME ; le journal PHP est lu
// dans /tmp/bea-<port>.log (port de BASE_URL) et ne doit contenir aucun avertissement.
// Les valeurs attendues (stock, écarts, ajustements) sont recalculées par des requêtes SQL indépendantes du service d'inventaire.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
/** Base ciblée : DB_NAME, sinon celle du serveur de développement qui écoute sur le port de BASE_URL (tools/serveur.sh l'écrit dans son environnement).
 *  Jamais de valeur par défaut : le test remet la base à zéro, il ne doit pas viser une autre base que celle du serveur testé. */
function baseCible() {
  let nom = process.env.DB_NAME || '';
  if (!nom) {
    try {
      const pid = fs.readFileSync('/tmp/bea-' + PORT + '.pid', 'utf8').trim();
      const e = fs.readFileSync('/proc/' + pid + '/environ', 'utf8').split('\0').find(x => x.startsWith('DB_NAME='));
      if (e) { nom = e.slice('DB_NAME='.length); }
    } catch (err) { /* pas de serveur de développement sur ce port */ }
  }
  if (!/^bea_[A-Za-z0-9_]+$/.test(nom)) {
    console.error('Base de développement introuvable pour ' + L.BASE + ' : démarrez le serveur avec tools/serveur.sh start <base> ' + PORT + ' ou définissez DB_NAME=bea_….');
    process.exit(2);
  }
  console.log('Test D1 : serveur ' + L.BASE + ', base ' + nom);
  return nom;
}
const DB = baseCible();
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const XSS = '<img src=x onerror=alert(1)>';
const verifier = L.verifier;

// ---- outils -----------------------------------------------------------------------------------------------------
function sql(q) { return execFileSync('mysql', ['-uroot', '-N', '-B', '--default-character-set=utf8mb4', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function outil(...args) { return execFileSync('php', [path.join(__dirname, 'd1-outils.php'), ...args], { encoding: 'utf8', env: { ...process.env, DB_NAME: DB } }).trim(); }
function reset() { execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' }); }
const norm = t => String(t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const attendre = ms => new Promise(r => setTimeout(r, ms));
const idPiece = code => parseInt(sql("SELECT id FROM pieces WHERE code='" + code + "'"), 10);
const stock = (code, emp) => sql("SELECT COALESCE((SELECT s.quantite FROM stock s JOIN pieces p ON p.id=s.piece_id WHERE p.code='" + code + "' AND s.emplacement_id=" + emp + "), 0)");
const num = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
/** "194.30" -> "194,30 $" */
const fr = s => { const [e, f = ''] = String(s).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + (f + '00').slice(0, 2) + ' $'; };
function invariantOk() {
  const ecarts = sql("SELECT COUNT(*) FROM stock s WHERE s.quantite <> COALESCE((SELECT SUM(m.quantite) FROM mouvements m WHERE m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id), 0)");
  const negatifs = sql('SELECT COUNT(*) FROM stock WHERE quantite < 0');
  const orphelins = sql("SELECT COUNT(*) FROM (SELECT m.piece_id, m.emplacement_id FROM mouvements m GROUP BY m.piece_id, m.emplacement_id HAVING SUM(m.quantite) <> COALESCE((SELECT s.quantite FROM stock s WHERE s.piece_id = m.piece_id AND s.emplacement_id = m.emplacement_id), 0)) t");
  return ecarts === '0' && negatifs === '0' && orphelins === '0';
}

const dialogues = [];
function suivre(page) { page.setDefaultTimeout(12000); page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); }); return page; }
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (validation, refus d'accès) sont ignorés, ainsi que les lectures abandonnées par un changement de page. */
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/ERR_ABORTED/.test(e) && !/requestfailed: \S+\/(scanner_code|scanner_contenu|scan_code|comptage_detail|comptage_data|comptage_apercu|emplacements_liste|pieces_recherche)\.php/.test(e));

async function appel(p, url, corps, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, corps, opts]) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (!opts.sansJeton) h['X-CSRF-Token'] = jeton;
    const r = await fetch(url, corps === null ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: h, body: JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps, opts]);
}
async function connecterComme(page, utilisateur) {
  await page.goto(L.BASE + '/login.php');
  await page.fill('input[name=username]', utilisateur);
  await page.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  if (/login\.php/.test(page.url())) throw new Error('Connexion refusée pour ' + utilisateur);
}
/** Attend que la file de scans soit vide (le champ de scan publie data-attente). */
async function fileVide(p) { await p.waitForFunction(() => { const s = document.querySelector('#scan'); return s && s.getAttribute('data-attente') === '0'; }, null, { timeout: 20000 }); }
async function espionBip(p) { await p.evaluate(() => { window.__bips = []; const o = window.bip; window.bip = function (ok) { window.__bips.push(!!ok); return o(ok); }; }); }
/** Les cases à cocher Bootstrap « custom-control » sont masquées : on clique leur étiquette, comme le ferait un utilisateur. */
async function cocher(p, id, etat) { if ((await p.isChecked(id)) !== etat) { await p.click('label[for="' + id.replace('#', '') + '"]'); } }
const focusId = p => p.evaluate(() => document.activeElement && document.activeElement.id);
const texte = async (p, sel) => norm(await p.textContent(sel));
/** Lignes du tableau de comptage : { code: { compte, attendu, ecart } } */
async function lignesComptage(p) {
  return p.$$eval('#cv-table tbody tr', rows => rows.map(r => {
    const t = [...r.children];
    const champ = r.querySelector('input.cp-qte');
    return { code: t[0].textContent.trim(), compte: champ ? champ.value : t[2].textContent.trim(), attendu: (r.querySelector('.cp-attendu') || {}).textContent, ecart: (r.querySelector('td.cp-ecart') || {}).textContent, classe: (r.querySelector('td.cp-ecart') || {}).className };
  }));
}
/** Frappe en rafale comme un lecteur : code, Entrée, code, Entrée… sans pause. */
async function rafale(p, codes) { for (const c of codes) { await p.keyboard.type(c); await p.keyboard.press('Enter'); } }
/** Remplace la caméra et BarcodeDetector par des doublures : un flux animé, et un lecteur qui « voit » window.__camCode. */
async function installerCamera(page) {
  await page.context().addInitScript(() => {
    window.__camStarts = 0; window.__camStops = 0; window.__camCode = '';
    navigator.mediaDevices.getUserMedia = async () => {
      if (window.__camRefus) { const x = new Error('refusé'); x.name = 'NotAllowedError'; throw x; }
      window.__camStarts++;
      const c = document.createElement('canvas'); c.width = 64; c.height = 48;
      const cx = c.getContext('2d'); setInterval(() => { cx.fillStyle = 'rgb(' + Math.floor(Math.random() * 255) + ',50,50)'; cx.fillRect(0, 0, 64, 48); }, 100);
      const s = c.captureStream(10);
      s.getTracks().forEach(t => { const o = t.stop.bind(t); t.stop = () => { window.__camStops++; o(); }; });
      return s;
    };
    window.BarcodeDetector = class { constructor() {} static async getSupportedFormats() { return ['code_128', 'ean_13']; } async detect() { return window.__camCode ? [{ rawValue: window.__camCode }] : []; } };
  });
}
/** Rapport de contraste (WCAG) entre le texte et le fond effectif d'un élément de la page. */
async function contrasteDe(p, sel, pseudo) {
  return p.evaluate(([sel, pseudo]) => {
    const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const parse = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
    const fond = el => { for (let x = el; x; x = x.parentElement) { const c = parse(getComputedStyle(x).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.99)) { return c.slice(0, 3); } } return [255, 255, 255]; };
    const el = document.querySelector(sel); if (!el) { return null; }
    const a = lum(parse(getComputedStyle(el, pseudo || null).color).slice(0, 3)), b = lum(fond(el));
    return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
  }, [sel, pseudo || null]);
}
const sections = [];
async function section(nom, fn) {
  const avant = process.hrtime.bigint();
  try { await fn(); } catch (e) { verifier(false, 'exception dans « ' + nom + ' » : ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e)); }
  sections.push(nom + ' (' + Math.round(Number(process.hrtime.bigint() - avant) / 1e6) + ' ms)');
}

(async () => {
  reset();
  const OFFSET_LOG = fs.existsSync(JOURNAL) ? fs.statSync(JOURNAL).size : 0;
  outil('utilisateur', 'gest_bea', 'gestionnaire', '1');
  const browser = await L.lancer();
  const g = suivre(await L.nouvellePage(browser));            // gestionnaire (entreprises 1 et 2)
  const e = suivre(await L.nouvellePage(browser));            // employé (entreprise 1)
  await L.connecter(g, 'gestionnaire');
  await L.connecter(e, 'employe');
  const pages = [g, e];
  const P1 = idPiece('P-0001'), P3 = idPiece('P-0003'), P5 = idPiece('P-0005'), P7 = idPiece('P-0007'), P9 = idPiece('P-0009'), P11 = idPiece('P-0011');

  // =====================================================================================================================
  //  SCANNER / CHERCHER
  // =====================================================================================================================
  await section('Scanner : fiche d\'une pièce (gestionnaire)', async () => {
    await L.aller(g, 'scanner');
    await espionBip(g);
    verifier(await focusId(g) === 'scan', 'le champ de scan est focalisé au chargement');
    verifier((await texte(g, 'h1')).includes('Scanner / Chercher'), 'titre de la page');
    await L.scanner(g, '#scan', 'P-0001');
    await g.waitForSelector('#sc-resultat .sc-fiche');
    const f = await texte(g, '#sc-resultat');
    verifier(f.includes('P-0001') && f.includes('Thermocouple 36 po'), 'code et nom de la pièce');
    verifier(f.includes('Contrôles') && !f.includes('Unité :'), 'catégorie ; pas de badge « Unité : unité » quand l\'unité est « unité » (constat 36)');
    verifier(/Beauchemin.*Total : 11/.test(f), 'total par entreprise (8 + 3 = 11) : ' + f.slice(0, 300));
    const lignes = await g.$$eval('#sc-resultat tr[data-emplacement]', rs => rs.map(r => [r.children[0].textContent, r.children[1].textContent].map(x => x.replace(/\s+/g, ' ').trim())));
    verifier(lignes.length === 2 && lignes[0][0].startsWith('Entrepôt principal') && lignes[0][1] === '8' && lignes[1][0].startsWith('Cube 12') && lignes[1][1] === '3', 'quantité par emplacement : ' + JSON.stringify(lignes));
    verifier(f.includes('Coût moyen') && f.includes('14,50 $'), 'coût moyen visible pour un gestionnaire');
    verifier(f.includes('Distribution Chauffage Plus') && f.includes('Grossiste Gaz du Nord') && f.includes('15,20 $') && f.includes('Meilleur prix'), 'prix des fournisseurs');
    verifier(f.includes('012345678905') && f.includes('Fabricant'), 'codes-barres alias');
    verifier(await g.locator('#sc-resultat .sc-alerte').count() === 0, 'pas d\'alerte « sous le minimum » pour P-0001 (11 ≥ 10)');
    const href = async nom => g.getAttribute('#sc-resultat .sc-actions a:has-text("' + nom + '")', 'href');
    verifier((await href('Transférer')).includes('page=transfert') && (await href('Transférer')).includes('piece_id=' + P1), 'bouton Transférer avec &piece_id=');
    verifier((await href('Sortir')).includes('page=sortie') && (await href('Sortir')).includes('piece_id=' + P1), 'bouton Sortir avec &piece_id=');
    verifier((await href('Réceptionner')).includes('page=reception') && (await href('Réceptionner')).includes('piece_id=' + P1), 'bouton Réceptionner (gestionnaire) avec &piece_id=');
    verifier((await href('Fiche complète')).includes('page=piece_voir') && (await href('Fiche complète')).includes('id=' + P1), 'bouton Fiche complète');
    verifier(await focusId(g) === 'scan', 'le curseur est revenu dans le champ de scan après le scan');
    verifier((await g.evaluate(() => window.__bips)).slice(-1)[0] === true, 'bip de succès');

    // Code alias (UPC du fabricant)
    await L.scanner(g, '#scan', '012345678905');
    await g.waitForFunction(() => /P-0001/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(true, 'alias');
    // Sous le minimum : P-0003 (10 en stock, minimum 20)
    await L.scanner(g, '#scan', 'P-0003');
    await g.waitForSelector('#sc-resultat .sc-alerte');
    const a = await texte(g, '#sc-resultat .sc-alerte');
    verifier(/Sous le minimum/.test(a) && a.includes('Beauchemin') && a.includes('10 en stock') && a.includes('minimum 20'), 'alerte sous le minimum : ' + a);
    // Code inconnu : message clair + bip d'erreur
    await L.scanner(g, '#scan', 'XXX-INCONNU');
    await g.waitForSelector('#sc-resultat .sc-inconnu');
    verifier((await texte(g, '#sc-resultat .sc-inconnu')).includes('Code inconnu : « XXX-INCONNU »'), 'message de code inconnu');
    verifier((await g.evaluate(() => window.__bips)).slice(-1)[0] === false, 'bip d\'erreur sur code inconnu');
    verifier(await focusId(g) === 'scan', 'focus conservé après un code inconnu');
  });

  await section('Scanner : historique de la session', async () => {
    const n = await g.locator('#sc-hist .sc-hist-item').count();
    verifier(n === 4, 'quatre scans dans l\'historique (' + n + ')');
    verifier((await texte(g, '#sc-hist')).includes('XXX-INCONNU') && (await texte(g, '#sc-hist')).includes('Code inconnu'), 'le code inconnu est dans l\'historique');
    // clic sur une entrée : la fiche revient
    await g.click('#sc-hist button.sc-hist-btn >> nth=2');   // plus ancien : P-0001 (alias reste 2e, P-0003 1re)
    await g.waitForFunction(() => /P-0001/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(await focusId(g) === 'scan', 'focus revenu dans le champ de scan après un clic dans l\'historique');
    await g.reload(); await g.waitForLoadState('networkidle');
    verifier(await g.locator('#sc-hist .sc-hist-item').count() >= 4, 'l\'historique survit au rechargement de la page');
    await g.click('#sc-vider-hist');
    verifier(await g.locator('#sc-hist .sc-hist-btn[data-i]').count() === 0, 'historique effacé');
  });

  await section('Scanner : contenu d\'un emplacement', async () => {
    await L.scanner(g, '#scan', 'EMP-000003');
    await g.waitForSelector('#sc-resultat .sc-fiche-emp');
    const f = await texte(g, '#sc-resultat');
    verifier(f.includes('Cube 12 — Marc') && f.includes('Cube de service') && f.includes('Beauchemin'), 'identité de l\'emplacement');
    const codes = await g.$$eval('#sc-resultat tbody tr', rs => rs.map(r => r.children[0].textContent.trim()));
    verifier(JSON.stringify(codes) === JSON.stringify(['P-0001', 'P-0003', 'P-0005', 'P-0011']), 'liste des pièces du cube : ' + codes);
    verifier(f.includes('4 pièces différentes'), 'nombre de pièces');
    const valeur = sql("SELECT ROUND(SUM(s.quantite * sc.cout_moyen), 2) FROM stock s JOIN stock_couts sc ON sc.entreprise_id = 1 AND sc.piece_id = s.piece_id WHERE s.emplacement_id = 3");
    verifier(f.includes('valeur totale : ' + fr(valeur)), 'valeur totale du cube (' + fr(valeur) + ') visible pour un gestionnaire');
    verifier(await g.locator('#sc-compter').isVisible(), 'bouton « Compter cet emplacement »');
    verifier((await g.getAttribute('#sc-resultat .sc-actions a:has-text("Transférer")', 'href')).includes('emplacement_id=3'), 'lien de transfert depuis l\'emplacement');
    // Choix dans la liste (sans scanner)
    await g.selectOption('#emp-choix', '4');
    await g.waitForFunction(() => /Cube 14/.test((document.querySelector('#sc-resultat .sc-nom') || { textContent: '' }).textContent));
    verifier((await texte(g, '#sc-resultat')).includes('2 pièces différentes'), 'cube 14 choisi dans la liste');
    // Clic sur un code de pièce dans le contenu
    await L.scanner(g, '#scan', 'EMP-000003');
    await g.waitForSelector('#sc-resultat .sc-fiche-emp .sc-voir-piece');
    await g.click('#sc-resultat .sc-voir-piece >> nth=1');
    await g.waitForFunction(() => /P-0003/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(true, 'clic sur une pièce du contenu');
    // Emplacement vide : un emplacement sans stock (cube créé pour l'occasion)
    sql("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Cube vide', 'cube', 'EMP-000099')");
    await L.scanner(g, '#scan', 'EMP-000099');
    await g.waitForSelector('#sc-resultat .sc-vide');
    verifier((await texte(g, '#sc-resultat .sc-vide')).includes('vide'), 'message « emplacement vide »');
  });

  await section('Scanner : recherche texte de secours', async () => {
    await g.click('#page-scanner .select2-selection');
    await g.waitForSelector('.select2-search__field');
    await g.fill('.select2-search__field', 'gicleur');
    await g.waitForSelector('.select2-results__option:has-text("P-0003")');
    verifier((await texte(g, '.select2-results')).includes('Gicleur Delavan'), 'résultats de recherche par nom');
    await g.press('.select2-search__field', 'Enter');
    await g.waitForFunction(() => /P-0003/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(await focusId(g) === 'scan', 'focus revenu dans le champ de scan après la recherche');
    await g.click('#page-scanner .select2-selection');
    await g.waitForSelector('.select2-search__field');
    await g.fill('.select2-search__field', '0123');
    await g.waitForSelector('.select2-results__option:has-text("P-0001")');   // par alias
    verifier(true, 'recherche par code alias');
    await g.click('.select2-results__option:has-text("P-0001")');             // choix à la souris
    await g.waitForFunction(() => /P-0001/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(await focusId(g) === 'scan', 'focus revenu dans le champ de scan après un choix à la souris');
  });

  await section('Scanner : pièce désactivée et XSS', async () => {
    sql("UPDATE pieces SET actif = 0 WHERE code = 'P-0014'");
    await L.scanner(g, '#scan', 'P-0014');
    await g.waitForSelector('#sc-resultat .badge-secondary');
    const f = await texte(g, '#sc-resultat');
    verifier(f.includes('Pièce désactivée'), 'pièce désactivée signalée');
    verifier(await g.locator('#sc-resultat .sc-actions a:has-text("Transférer")').count() === 0 && await g.locator('#sc-resultat .sc-actions a:has-text("Sortir")').count() === 0 && await g.locator('#sc-resultat .sc-actions a:has-text("Réceptionner")').count() === 0, 'aucune action de mouvement sur une pièce désactivée');
    verifier(await g.locator('#sc-resultat .sc-actions a:has-text("Fiche complète")').count() === 1, 'la fiche complète reste accessible');
    // XSS
    sql("UPDATE pieces SET nom = '" + XSS + "' WHERE code = 'P-0005'");
    await L.scanner(g, '#scan', 'P-0005');
    await g.waitForFunction(() => /P-0005/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier(await g.locator('#sc-resultat img').count() === 0 && (await texte(g, '#sc-resultat .sc-nom')) === XSS, 'le nom d\'une pièce est échappé dans la fiche');
    await L.scanner(g, '#scan', 'EMP-000003');
    await g.waitForSelector('#sc-resultat .sc-fiche-emp');
    verifier(await g.locator('#sc-resultat img').count() === 0 && (await texte(g, '#sc-resultat')).includes(XSS), 'le nom d\'une pièce est échappé dans le contenu d\'un emplacement');
    verifier(await g.locator('#sc-hist img').count() === 0, 'le nom d\'une pièce est échappé dans l\'historique');
    await g.click('#page-scanner .select2-selection');
    await g.waitForSelector('.select2-search__field');
    await g.fill('.select2-search__field', 'img');
    await g.waitForSelector('.select2-results__option:has-text("P-0005")');
    verifier(await g.locator('.select2-results img').count() === 0, 'le nom d\'une pièce est échappé dans la recherche');
    await g.keyboard.press('Escape');
    // code scanné hostile : affiché tel quel, jamais interprété
    await L.scanner(g, '#scan', XSS);
    await g.waitForSelector('#sc-resultat .sc-inconnu');
    verifier(await g.locator('#sc-resultat img, #sc-hist img').count() === 0, 'un code scanné hostile est échappé');
  });

  await section('Scanner : rafale de 50 scans', async () => {
    await g.click('#sc-vider-hist');
    const codes = []; for (let i = 0; i < 50; i++) codes.push(['P-0001', 'P-0002', 'P-0003', 'P-0004', 'P-0006'][i % 5]);
    // 1) frappes consécutives (comme un lecteur)  2) 50 événements Entrée dans le même instant
    const t0 = Date.now();
    await rafale(g, codes.slice(0, 25));
    await g.evaluate(c => { const el = document.querySelector('#scan'); c.forEach(code => { el.value = code; el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); }); }, codes.slice(25));
    await fileVide(g);
    const dt = Date.now() - t0;
    const n = await g.locator('#sc-hist .sc-hist-item').count();
    verifier(n === 30, '50 scans en rafale : l\'historique garde les 30 derniers (' + n + ') — aucun plantage ; durée ' + dt + ' ms');
    verifier(dt < 20000, 'la rafale est traitée rapidement (' + dt + ' ms)');
    // Compter exactement : un journal sans trou (le dernier scan est bien affiché)
    verifier((await texte(g, '#sc-hist .sc-hist-item >> nth=0')).includes('P-0006'), 'dernier scan de la rafale affiché en tête');
    verifier(await focusId(g) === 'scan', 'focus conservé après la rafale');
  });

  await section('Scanner : employé (aucun coût, une seule entreprise)', async () => {
    await L.aller(e, 'scanner');
    await L.scanner(e, '#scan', 'P-0001');
    await e.waitForSelector('#sc-resultat .sc-fiche');
    const f = await texte(e, '#sc-resultat');
    verifier(f.includes('Thermocouple 36 po') && f.includes('Total : 11'), 'fiche visible pour un employé');
    verifier(!/Coût moyen|Prix chez|Meilleur prix|\$/.test(f), 'aucun coût ni prix dans la fiche d\'un employé');
    verifier(await e.locator('#sc-resultat .sc-actions a:has-text("Réceptionner")').count() === 0, 'pas de bouton Réceptionner pour un employé');
    verifier(await e.locator('#sc-resultat .sc-actions a:has-text("Transférer")').count() === 1 && await e.locator('#sc-resultat .sc-actions a:has-text("Sortir")').count() === 1, 'Transférer et Sortir disponibles');
    const brut = await appel(e, 'app/ajax/scanner_code.php?code=P-0001', null);
    verifier(brut.status === 200 && !/cout|prix|valeur|fournisseur/i.test(brut.texte), 'JSON de la fiche sans coût ni prix : ' + brut.texte.slice(0, 200));
    // Pièce de l'autre entreprise : seules les quantités de la sienne
    await L.scanner(e, '#scan', 'P-0009');
    await e.waitForFunction(() => /P-0009/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    const f9 = await texte(e, '#sc-resultat');
    verifier(!f9.includes('Boutique Chaleur') && /Total : 14/.test(f9), 'un employé ne voit que les quantités de son entreprise (12 + 2) : ' + f9.slice(0, 200));
    // Contenu d'un cube : sans valeur
    await L.scanner(e, '#scan', 'EMP-000003');
    await e.waitForSelector('#sc-resultat .sc-fiche-emp');
    const fe = await texte(e, '#sc-resultat');
    verifier(fe.includes('4 pièces différentes') && !/valeur|Coût|\$/.test(fe), 'contenu d\'un cube sans valeur pour un employé');
    verifier(await e.locator('#sc-compter').isVisible(), 'un employé peut compter un emplacement');
    const brutE = await appel(e, 'app/ajax/scanner_contenu.php?emplacement_id=3', null);
    verifier(brutE.status === 200 && !/cout|prix|valeur/i.test(brutE.texte), 'JSON du contenu sans coût ni valeur');
    // Emplacement de l'autre entreprise : introuvable, côté scan comme côté serveur (IDOR)
    await L.scanner(e, '#scan', 'EMP-000005');
    await e.waitForSelector('#sc-resultat .sc-inconnu');
    verifier(true, 'EMP-000005 (autre entreprise) inconnu pour l\'employé');
    for (const id of ['5', '2', '999', 'abc', '']) {
      const r = await appel(e, 'app/ajax/scanner_contenu.php?emplacement_id=' + id, null);
      verifier(r.status === 400 && r.json && r.json.ok === false && /Emplacement/.test(r.json.erreur) && !/"lignes"/.test(r.texte), 'scanner_contenu emplacement_id=' + id + ' refusé en français : ' + r.status + ' ' + r.texte.slice(0, 120));
    }
  });

  await section('Scanner : caméra (BarcodeDetector simulé)', async () => {
    const pc = suivre(await L.nouvellePage(browser));
    await installerCamera(pc);
    await L.connecter(pc, 'gestionnaire');
    await L.aller(pc, 'scanner');
    await pc.click('#btn-camera');
    await pc.waitForSelector('#cam-zone video');
    verifier(await pc.evaluate(() => window.__camStarts) === 1, 'la caméra démarre');
    await pc.evaluate(() => { window.__camCode = 'P-0007'; });
    await pc.waitForFunction(() => /P-0007/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent), null, { timeout: 8000 });
    verifier(true, 'un code lu par la caméra affiche la fiche');
    await attendre(2500);   // le même code, toujours devant la caméra, n'est pas relu en boucle
    await pc.evaluate(() => { window.__camCode = ''; });
    const n = await pc.locator('#sc-hist .sc-hist-item').count();
    verifier(n >= 1 && n <= 2, 'le même code n\'est pas lu en boucle (' + n + ' entrée(s) d\'historique)');
    await pc.click('#cam-zone .sc-camera-fermer');
    verifier(await pc.evaluate(() => window.__camStops) >= 1 && await pc.locator('#cam-zone video').count() === 0, 'le flux vidéo est arrêté à la fermeture');
    verifier(await focusId(pc) === 'scan', 'focus revenu dans le champ de scan');
    // la page masquée / quittée arrête aussi le flux
    await pc.click('#btn-camera'); await pc.waitForSelector('#cam-zone video');
    const avant = await pc.evaluate(() => window.__camStops);
    await pc.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    verifier(await pc.evaluate(() => window.__camStops) > avant, 'le flux vidéo est arrêté quand la page est quittée');
    // refus d'accès : message explicite
    await pc.evaluate(() => { window.__camRefus = true; });
    await pc.click('#btn-camera'); await pc.waitForSelector('#cam-zone .sc-camera-msg:has-text("refusé")');
    verifier(true, 'message explicite si l\'accès à la caméra est refusé');
    await pc.click('#cam-zone .sc-camera-fermer');
    // navigateur sans BarcodeDetector : message explicite, pas d'erreur
    await pc.evaluate(() => { delete window.BarcodeDetector; });
    await pc.click('#btn-camera'); await pc.waitForSelector('#cam-zone .sc-camera-msg:has-text("ne sait pas lire les codes-barres")');
    verifier(true, 'message explicite si le navigateur ne sait pas lire les codes-barres');
    verifier(reelles(pc).length === 0, 'console propre (caméra) : ' + JSON.stringify(reelles(pc)));
    await pc.context().close();
  });

  // =====================================================================================================================
  //  COMPTAGE
  // =====================================================================================================================
  let C1, C2, C3, C4, C5;      // identifiants des comptages
  const idComptage = emp => parseInt(sql("SELECT MAX(id) FROM comptages WHERE emplacement_id = " + emp), 10);

  await section('Comptage : création (employé) par la liste', async () => {
    await L.aller(e, 'comptage');
    await e.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    const opts = await e.$$eval('#nouveau-emp option', os => os.map(o => o.textContent.trim()));
    verifier(opts.some(o => o.includes('Cube 12')) && opts.some(o => o.includes('Entrepôt principal')) && !opts.some(o => o.includes('Boutique Centre-ville')), 'la liste ne propose que les emplacements de l\'entreprise de l\'employé : ' + opts);
    verifier(await focusId(e) === 'scan', 'champ de scan focalisé sur la page des comptages');
    await e.click('#btn-nouveau');
    verifier((await texte(e, '#cp-nouveau-msg')).includes('Choisissez'), 'message si aucun emplacement choisi');
    await e.selectOption('#nouveau-emp', '3');
    await e.fill('#nouveau-note', 'Fin de mois');
    await Promise.all([e.waitForURL(/comptage_voir/), e.click('#btn-nouveau')]);
    await e.waitForSelector('#cv-statut');
    C1 = idComptage(3);
    verifier(e.url().includes('id=' + C1), 'le comptage créé s\'ouvre');
    verifier((await texte(e, '#cv-entete')).includes('Cube 12 — Marc') && (await texte(e, '#cv-entete')).includes('Fin de mois') && (await texte(e, '#cv-statut')) === 'En cours', 'en-tête du comptage');
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C1) === 'en_cours' && sql('SELECT note FROM comptages WHERE id = ' + C1) === 'Fin de mois', 'comptage en base');
    verifier(await e.locator('#cv-aveugle').isChecked(), 'comptage à l\'aveugle coché par défaut pour un employé');
    verifier(await focusId(e) === 'scan', 'champ de scan focalisé sur l\'écran de comptage');
    verifier(await e.locator('#btn-appliquer').count() === 0 && (await texte(e, '#btn-approbation')) === 'À faire approuver par un gestionnaire', 'un employé n\'a pas « Appliquer » : « À faire approuver par un gestionnaire »');
    // Un seul comptage ouvert par emplacement : message du service + lien vers l'existant
    await L.aller(e, 'comptage');
    await e.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await e.selectOption('#nouveau-emp', '3');
    await e.click('#btn-nouveau');
    await e.waitForSelector('#cp-nouveau-msg #lien-existant');
    const m = await texte(e, '#cp-nouveau-msg');
    verifier(m.includes('Un comptage est déjà en cours à cet emplacement') && m.includes('COM-') && (await e.getAttribute('#lien-existant', 'href')).includes('id=' + C1), 'second comptage refusé avec lien vers l\'existant : ' + m);
    verifier(sql('SELECT COUNT(*) FROM comptages WHERE emplacement_id = 3') === '1', 'un seul comptage en base pour le cube');
    // même chose en scannant le code de l'emplacement
    await L.scanner(e, '#scan', 'EMP-000003');
    await e.waitForFunction(() => /déjà en cours/.test(document.querySelector('#cp-nouveau-msg').textContent));
    verifier(true, 'scan EMP-… d\'un emplacement déjà en comptage : message');
    await L.scanner(e, '#scan', 'P-0001');
    await e.waitForFunction(() => /est une pièce/.test(document.querySelector('#cp-nouveau-msg').textContent));
    verifier(true, 'scan d\'une pièce sur l\'écran « nouveau comptage » : message clair');
    await L.scanner(e, '#scan', 'EMP-000005');
    await e.waitForFunction(() => /Code inconnu/.test(document.querySelector('#cp-nouveau-msg').textContent));
    verifier(sql('SELECT COUNT(*) FROM comptages') === '1', 'EMP-000005 (autre entreprise) ne crée aucun comptage');
  });

  await section('Comptage : scans, quantité exacte, retrait, erreurs (employé, à l\'aveugle)', async () => {
    await L.aller(e, 'comptage_voir&id=' + C1);
    await e.waitForSelector('#cv-statut');
    await espionBip(e);
    // +1 par scan (5 scans consécutifs identiques + 1 alias)
    await rafale(e, ['P-0001', 'P-0001', 'P-0001', 'P-0001', 'P-0001', '012345678905']);
    await fileVide(e);
    let l = await lignesComptage(e);
    verifier(l.length === 1 && l[0].code === 'P-0001' && l[0].compte === '6', 'six scans (dont un par alias) = 6 : ' + JSON.stringify(l));
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P1) === '6.000', 'quantité enregistrée en base');
    verifier((await e.evaluate(() => window.__bips)).includes(true), 'bip de succès');
    // quantité exacte tapée (« fixer ») : 6 -> 5
    await e.fill('#cv-table tr[data-piece="' + P1 + '"] .cp-qte', '5');
    await e.press('#cv-table tr[data-piece="' + P1 + '"] .cp-qte', 'Enter');
    await e.waitForFunction(id => document.querySelector('#cv-table tr[data-piece="' + id + '"] .cp-qte').getAttribute('data-serveur') === '5.000', P1);
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P1) === '5.000', 'quantité exacte tapée = remplace (fixer)');
    verifier(await focusId(e) === 'scan', 'le curseur revient au champ de scan après une quantité tapée');
    // autres pièces
    await rafale(e, ['P-0003', 'P-0003', 'P-0011', 'P-0007']);
    await fileVide(e);
    await e.fill('#cv-table tr[data-piece="' + P11 + '"] .cp-qte', '2,5');   // virgule décimale
    await e.press('#cv-table tr[data-piece="' + P11 + '"] .cp-qte', 'Enter');
    await e.waitForFunction(id => document.querySelector('#cv-table tr[data-piece="' + id + '"] .cp-qte').getAttribute('data-serveur') === '2.500', P11);
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P11) === '2.500', 'quantité décimale tapée avec une virgule');
    // aveugle : ni colonne « Stock attendu » ni valeurs attendues dans la réponse brute
    verifier(await e.locator('#cv-table .cp-attendu').count() === 0 && !(await texte(e, '#cv-table thead')).includes('attendu'), 'à l\'aveugle : aucun stock attendu à l\'écran');
    const brut = await appel(e, 'app/ajax/comptage_detail.php?id=' + C1 + '&aveugle=1', null);
    verifier(brut.status === 200 && !/quantite_actuelle|ecart|non_comptees"\s*:\s*\[\s*\{/.test(brut.texte) && !/cout|prix|valeur/i.test(brut.texte), 'JSON à l\'aveugle sans stock attendu ni coût : ' + brut.texte.slice(0, 160));
    const brut0 = await appel(e, 'app/ajax/comptage_detail.php?id=' + C1, null);
    verifier(!/quantite_actuelle/.test(brut0.texte), 'sans paramètre, un employé reçoit le comptage à l\'aveugle par défaut');
    // retirer une ligne : confirmation en deux clics
    await e.click('#cv-table tr[data-piece="' + P7 + '"] .cp-retirer');
    verifier(await e.locator('#cv-table tr[data-piece="' + P7 + '"]').count() === 1 && (await texte(e, '#cv-table tr[data-piece="' + P7 + '"] .cp-retirer')) === 'Retirer ?', 'premier clic : demande de confirmation');
    await e.click('#cv-table tr[data-piece="' + P7 + '"] .cp-retirer');
    await e.waitForSelector('#cv-table tr[data-piece="' + P7 + '"]', { state: 'detached' });
    verifier(sql("SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P7) === '0', 'ligne retirée en base');
    // erreurs : code inconnu, emplacement, pièce désactivée, quantité invalide
    const avant = sql('SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = ' + C1);
    await L.scanner(e, '#scan', 'ZZZ-INCONNU');
    await e.waitForSelector('#cv-alerte .alert-danger');
    verifier((await texte(e, '#cv-alerte')).includes('Code inconnu : « ZZZ-INCONNU »'), 'code inconnu : message clair');
    verifier((await e.evaluate(() => window.__bips)).slice(-1)[0] === false, 'bip d\'erreur');
    verifier(await focusId(e) === 'scan', 'focus conservé après une erreur');
    await L.scanner(e, '#scan', 'EMP-000003');
    await e.waitForFunction(() => /est un emplacement, pas une pièce/.test(document.querySelector('#cv-alerte').textContent));
    await L.scanner(e, '#scan', 'P-0014');   // désactivée plus haut
    await e.waitForFunction(() => /désactivée/.test(document.querySelector('#cv-alerte').textContent));
    verifier((await texte(e, '#cv-alerte')).includes('P-0014'), 'pièce désactivée : refusée avec son code');
    const champ3 = '#cv-table tr[data-piece="' + P3 + '"] .cp-qte', erreur3 = '#cv-table tr[data-piece="' + P3 + '"] .cp-erreur-champ';
    await e.fill(champ3, 'abc');
    await e.press(champ3, 'Enter');
    await e.waitForFunction(sel => /n'est pas valide/.test(document.querySelector(sel).textContent), erreur3);
    verifier((await texte(e, erreur3)).includes('« abc » n\'est pas valide : tapez un nombre positif') && await e.getAttribute(champ3, 'aria-invalid') === 'true', 'constat 34 : quantité invalide : message précis SOUS la cellule (aria-invalid) : ' + await texte(e, erreur3));
    verifier(await focusId(e) !== 'scan' && (await e.evaluate(() => document.activeElement.classList.contains('cp-qte'))), 'constat 34 : le curseur reste dans le champ à corriger');
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P3) === '2.000', 'quantité invalide : rien n\'est envoyé');
    await e.fill(champ3, '-4');
    await e.press(champ3, 'Enter');
    await e.waitForFunction(sel => /n'est pas valide/.test(document.querySelector(sel).textContent), erreur3);
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P3) === '2.000', 'quantité négative refusée');
    await e.fill(champ3, '1,2345');
    await e.press(champ3, 'Enter');
    await e.waitForFunction(sel => /trop de décimales/.test(document.querySelector(sel).textContent), erreur3);
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P3) === '2.000', 'constat 34 : « 1,2345 » refusé (pas arrondi en silence)');
    await e.fill(champ3, '2'); await e.press(champ3, 'Enter');   // valeur d'origine : l'erreur s'efface
    await e.waitForFunction(sel => document.querySelector(sel).textContent === '', erreur3);
    await e.fill(champ3, '1 000'); await e.press(champ3, 'Enter');   // espace des milliers accepté
    await e.waitForFunction(id => document.querySelector('#cv-table tr[data-piece="' + id + '"] .cp-qte').getAttribute('data-serveur') === '1000.000', P3);
    await e.fill(champ3, '2'); await e.press(champ3, 'Enter');
    await e.waitForFunction(id => document.querySelector('#cv-table tr[data-piece="' + id + '"] .cp-qte').getAttribute('data-serveur') === '2.000', P3);
    verifier(await focusId(e) === 'scan', 'le curseur revient au champ de scan après une quantité valide');
    verifier(sql('SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = ' + C1) === avant, 'aucune ligne ajoutée par les scans refusés');
    // XSS : le nom de la pièce P-0005 (renommée) dans le comptage et la recherche
    await e.click('#page-comptage-voir .select2-selection');
    await e.waitForSelector('.select2-search__field');
    await e.fill('.select2-search__field', 'img');
    await e.waitForSelector('.select2-results__option:has-text("P-0005")');
    await e.press('.select2-search__field', 'Enter');
    await e.waitForSelector('#cv-table tr[data-piece="' + P5 + '"]');
    verifier(await e.locator('#cv-table img').count() === 0 && (await texte(e, '#cv-table tr[data-piece="' + P5 + '"]')).includes(XSS), 'le nom d\'une pièce est échappé dans le tableau de comptage');
    verifier(await focusId(e) === 'scan', 'focus revenu au champ de scan après la recherche');
    await e.click('#cv-table tr[data-piece="' + P5 + '"] .cp-retirer'); await e.click('#cv-table tr[data-piece="' + P5 + '"] .cp-retirer');
    await e.waitForSelector('#cv-table tr[data-piece="' + P5 + '"]', { state: 'detached' });
    // À faire approuver : message, rien n'est modifié
    await e.click('#btn-approbation');
    verifier((await texte(e, '#cv-alerte')).includes('Seul un gestionnaire peut l\'appliquer'), 'message d\'approbation');
    verifier(sql("SELECT statut FROM comptages WHERE id = " + C1) === 'en_cours' && stock('P-0001', 3) === '3.000', 'rien n\'est modifié par l\'employé');
    // Employé : POST direct d'application refusé
    const r = await appel(e, 'app/action/comptage_appliquer.php', { id: C1, zero_non_scannees: true });
    verifier(r.status === 400 && r.json && /permission/.test(r.json.erreur), 'un employé ne peut pas appliquer un comptage (POST direct) : ' + r.texte);
    const ap = await appel(e, 'app/ajax/comptage_apercu.php?id=' + C1, null);
    verifier(ap.status === 400 && /permission/.test(ap.json.erreur), 'l\'aperçu d\'application est réservé aux gestionnaires');
    verifier(sql("SELECT statut FROM comptages WHERE id = " + C1) === 'en_cours' && stock('P-0001', 3) === '3.000' && sql('SELECT COUNT(*) FROM documents WHERE type = \'ajustement\'') === '0', 'après le POST direct : comptage inchangé, stock inchangé, aucun ajustement');
    verifier(reelles(e).length === 0, 'console propre (employé, comptage) : ' + JSON.stringify(reelles(e)));
  });

  await section('Comptage : rafale de 50 scans (aucune perte) puis annulation par l\'employé', async () => {
    await L.aller(e, 'comptage');
    await e.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await e.selectOption('#nouveau-emp', '1');
    await Promise.all([e.waitForURL(/comptage_voir/), e.click('#btn-nouveau')]);
    await e.waitForSelector('#cv-statut');
    C2 = idComptage(1);
    const stockAvant = sql('SELECT GROUP_CONCAT(CONCAT(piece_id, ":", emplacement_id, ":", quantite) ORDER BY piece_id, emplacement_id) FROM stock');
    const pieces = ['P-0002', 'P-0004', 'P-0006', 'P-0008', 'P-0012'];
    const codes = []; for (let i = 0; i < 50; i++) codes.push(pieces[i % 5]);   // 10 scans de chaque : alternés = aucun regroupement possible
    const t0 = Date.now();
    await rafale(e, codes.slice(0, 25));
    // les 25 suivants : dans le même instant (pire cas : un lecteur plus rapide que le réseau)
    await e.evaluate(c => { const el = document.querySelector('#scan'); c.forEach(code => { el.value = code; el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); }); }, codes.slice(25));
    await fileVide(e);
    const dt = Date.now() - t0;
    const l = await lignesComptage(e);
    const somme = l.reduce((s, x) => s + num(x.compte), 0);
    verifier(l.length === 5 && l.every(x => x.compte === '10') && somme === 50, '50 scans en rafale : aucune perte, 10 par pièce : ' + JSON.stringify(l));
    verifier(sql('SELECT SUM(quantite_comptee) FROM comptage_lignes WHERE comptage_id = ' + C2) === '50.000', 'les 50 scans sont en base');
    verifier(dt < 10000, '50 scans traités en ' + dt + ' ms');
    // Même code 50 fois de suite : regroupé en peu de requêtes, total exact
    const avant = sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + C2 + ' AND piece_id = ' + idPiece('P-0002'));
    await e.evaluate(() => { const el = document.querySelector('#scan'); for (let i = 0; i < 50; i++) { el.value = 'P-0002'; el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); } });
    await fileVide(e);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + C2 + ' AND piece_id = ' + idPiece('P-0002')) === (num(avant) + 50).toFixed(3), '50 scans identiques d\'affilée : +50 exactement');
    // Annulation avec confirmation
    await e.click('#btn-annuler');
    await e.waitForSelector('#modal-annuler.show');
    await e.click('#modal-annuler [data-dismiss="modal"] >> text=Garder le comptage');
    await e.waitForSelector('#modal-annuler.show', { state: 'hidden' });
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C2) === 'en_cours', '« Garder le comptage » : rien n\'est annulé');
    await e.click('#btn-annuler');
    await e.waitForSelector('#modal-annuler.show');
    await e.click('#an-confirmer');
    await e.waitForFunction(() => document.querySelector('#cv-statut') && document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C2) === 'annule', 'comptage annulé en base');
    verifier(sql('SELECT GROUP_CONCAT(CONCAT(piece_id, ":", emplacement_id, ":", quantite) ORDER BY piece_id, emplacement_id) FROM stock') === stockAvant, 'l\'annulation ne touche pas au stock');
    verifier(await e.locator('#cv-saisie').isHidden() && await e.locator('#btn-annuler').count() === 0 && await e.locator('.cp-qte').count() === 0, 'comptage annulé : lecture seule');
    verifier((await texte(e, '#cv-alerte')).includes('annulé'), 'message d\'annulation');
    const r = await appel(e, 'app/action/comptage_scan.php', { id: C2, code: 'P-0002' });
    verifier(r.status === 400 && /terminé/.test(r.json.erreur), 'on ne peut plus scanner dans un comptage annulé : ' + r.texte);
    const r2 = await appel(e, 'app/action/comptage_annuler.php', { id: C2 });
    verifier(r2.status === 400 && /terminé/.test(r2.json.erreur), 'on ne peut pas annuler deux fois');
  });

  await section('Comptage : gestionnaire — stock modifié pendant le comptage, aperçu, application sans « non scannées à 0 »', async () => {
    // Pendant que l'employé comptait le cube 12, 1 thermocouple est parti vers l'entrepôt : le stock actuel est maintenant 2
    outil('transferer', '3', '1', String(P1), '1');
    verifier(stock('P-0001', 3) === '2.000', 'préparation : stock du cube modifié pendant le comptage');
    await L.aller(g, 'comptage_voir&id=' + C1);
    await g.waitForSelector('#cv-statut');
    verifier(!(await g.locator('#cv-aveugle').isChecked()), 'un gestionnaire voit le stock attendu par défaut');
    let l = await lignesComptage(g);
    const par = {}; l.forEach(x => { par[x.code] = x; });
    verifier(l.length === 3 && par['P-0001'].compte === '5' && par['P-0001'].attendu.trim() === '2' && norm(par['P-0001'].ecart) === '+3', 'P-0001 : compté 5, attendu ACTUEL 2, écart +3 : ' + JSON.stringify(par['P-0001']));
    verifier(par['P-0003'].attendu.trim() === '4' && norm(par['P-0003'].ecart) === '-2' && /cp-ecart-neg/.test(par['P-0003'].classe) && /cp-ecart-pos/.test(par['P-0001'].classe), 'écart négatif en rouge, positif en vert : ' + JSON.stringify([par['P-0003'].ecart, par['P-0003'].classe, par['P-0001'].classe]));
    verifier(par['P-0011'].compte === '2,5' && par['P-0011'].attendu.trim() === '20' && norm(par['P-0011'].ecart) === '-17,5', 'écart décimal : ' + JSON.stringify(par['P-0011']));
    const nc = await texte(g, '#cv-non-comptees');
    verifier(!(await g.locator('#cv-non-comptees').isHidden()) && nc.includes('P-0005') && nc.includes('3'), 'pièce en stock pas encore comptée affichée (P-0005, 3)');
    // à l'aveugle (case) : le stock attendu disparaît
    await cocher(g, '#cv-aveugle', true);
    await g.waitForFunction(() => document.querySelectorAll('#cv-table .cp-attendu').length === 0);
    verifier(await g.locator('#cv-non-comptees').isHidden(), 'à l\'aveugle : les pièces non comptées ne sont pas révélées');
    await cocher(g, '#cv-aveugle', false);
    await g.waitForFunction(() => document.querySelectorAll('#cv-table .cp-attendu').length === 3);
    // aperçu
    verifier(await g.locator('#btn-approbation').count() === 0 && (await texte(g, '#btn-appliquer')) === 'Appliquer le comptage', 'bouton « Appliquer le comptage » pour un gestionnaire');
    await g.click('#btn-appliquer');
    await g.waitForSelector('#ap-table');
    const ap = await texte(g, '#ap-corps');
    verifier(ap.includes('stock actuel') && ap.includes('P-0001') && ap.includes('+3') && ap.includes('-2') && ap.includes('-17,5'), 'aperçu : écarts contre le stock actuel : ' + ap.slice(0, 400));
    verifier(await g.locator('#ap-confirmer').isDisabled(), 'confirmation explicite : bouton désactivé tant que la case n\'est pas cochée');
    verifier(await g.locator('#ap-zero-zone').isHidden() && ap.includes('(1 en stock dans cet emplacement)'), 'case « Mettre à 0 les pièces non scannées » décochée par défaut');
    await cocher(g, '#ap-zero', true);
    await g.waitForSelector('#ap-zero-zone', { state: 'visible' });
    verifier((await texte(g, '#ap-zero-zone')).includes('P-0005') && (await texte(g, '#ap-bilan')).includes('4 pièces seront ajustées'), 'la liste des pièces remises à 0 s\'affiche : ' + await texte(g, '#ap-bilan'));
    await cocher(g, '#ap-zero', false);
    verifier((await texte(g, '#ap-bilan')).includes('3 pièces seront ajustées'), 'décochée : 3 ajustements');
    await cocher(g, '#ap-ok', true);
    verifier(!(await g.locator('#ap-confirmer').isDisabled()), 'bouton activé après confirmation');
    await g.click('#ap-confirmer');
    await g.waitForSelector('#lien-ajustement-resultat');
    const numero = await texte(g, '#lien-ajustement-resultat');
    verifier(/^AJU-\d{4}-\d{5}$/.test(numero), 'lien vers le document d\'ajustement : ' + numero);
    // Résultat en base : compté − stock ACTUEL ; les non scannées ne bougent pas
    verifier(stock('P-0001', 3) === '5.000' && stock('P-0003', 3) === '2.000' && stock('P-0011', 3) === '2.500', 'stock du cube = quantités comptées');
    verifier(stock('P-0005', 3) === '3.000', 'pièce non scannée : stock inchangé (case non cochée)');
    const doc = sql("SELECT d.id FROM documents d WHERE d.numero = '" + numero + "' AND d.type = 'ajustement' AND d.emplacement_id = 3 AND d.motif = 'comptage'");
    verifier(doc !== '' && sql('SELECT COUNT(*) FROM documents WHERE type = \'ajustement\'') === '1', 'un seul document d\'ajustement (motif comptage)');
    const lignesDoc = sql("SELECT GROUP_CONCAT(CONCAT(p.code, ':', l.quantite) ORDER BY p.code) FROM document_lignes l JOIN pieces p ON p.id = l.piece_id WHERE l.document_id = " + doc);
    verifier(lignesDoc === 'P-0001:3.000,P-0003:-2.000,P-0011:-17.500', 'lignes de l\'ajustement = écarts contre le stock actuel : ' + lignesDoc);
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C1) === 'applique' && sql('SELECT document_id FROM comptages WHERE id = ' + C1) === doc, 'comptage appliqué et relié au document');
    verifier(await g.locator('#cv-saisie').isHidden() && (await texte(g, '#cv-statut')) === 'Appliqué' && await g.locator('#lien-ajustement').count() === 1, 'le comptage appliqué passe en lecture seule avec le lien du document');
    const lectures = await g.$$eval('#cv-table tbody tr', rs => rs.map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).join('|')));
    verifier(lectures.some(x => x.startsWith('P-0001') && x.endsWith('+3')) && lectures.some(x => x.startsWith('P-0003') && x.endsWith('-2')), 'écarts appliqués affichés : ' + lectures.join(' ; '));
    await Promise.all([g.waitForURL(/document_voir/), g.click('#lien-ajustement-resultat, #lien-ajustement')]);
    verifier((await texte(g, 'body')).includes(numero), 'le lien mène au document d\'ajustement');
    // Déjà appliqué : refus
    const r = await appel(g, 'app/action/comptage_appliquer.php', { id: C1, zero_non_scannees: false });
    verifier(r.status === 400 && /terminé/.test(r.json.erreur), 'on ne peut pas appliquer deux fois');
    verifier(stock('P-0001', 3) === '5.000', 'toujours 5 après le second essai');
    verifier(invariantOk(), 'invariant : stock = somme des mouvements');
  });

  await section('Comptage : créé depuis le scanner, pièce désactivée en cours de route, non scannées remises à 0', async () => {
    await L.aller(g, 'scanner');
    await L.scanner(g, '#scan', 'EMP-000004');
    await g.waitForSelector('#sc-compter');
    await Promise.all([g.waitForURL(/comptage_voir/), g.click('#sc-compter')]);
    await g.waitForSelector('#cv-statut');
    C3 = idComptage(4);
    verifier(g.url().includes('id=' + C3), '« Compter cet emplacement » ouvre le comptage');
    await rafale(g, ['P-0009', 'P-0009', 'P-0009']);   // attendu 2 -> écart +1
    await fileVide(g);
    sql("UPDATE pieces SET actif = 0 WHERE code = 'P-0009'");
    await g.click('#btn-appliquer');
    await g.waitForSelector('#ap-table');
    await cocher(g, '#ap-ok', true);
    verifier(await g.locator('#ap-confirmer').isDisabled() && (await texte(g, '#ap-bloque')).includes('P-0009') && (await texte(g, '#ap-bloque')).includes('désactivée'), 'pièce désactivée : l\'application est bloquée avec un message : ' + await texte(g, '#ap-bloque'));
    sql("UPDATE pieces SET actif = 1 WHERE code = 'P-0009'");
    await g.click('#modal-appliquer [data-dismiss="modal"] >> text=Fermer');
    await g.waitForSelector('#modal-appliquer.show', { state: 'hidden' });
    await g.waitForFunction(() => document.activeElement && document.activeElement.id === 'scan').catch(() => {});
    verifier(await focusId(g) === 'scan', 'focus revenu au champ de scan après la fermeture de l\'aperçu');
    await g.click('#btn-appliquer');
    await g.waitForSelector('#ap-table');
    await cocher(g, '#ap-zero', true);
    const z = await texte(g, '#ap-zero-zone');
    verifier(z.includes('P-0010') && z.includes('3') && (await texte(g, '#ap-bilan')).includes('2 pièces seront ajustées'), 'P-0010 sera remis à 0 : ' + z + ' / ' + await texte(g, '#ap-bilan'));
    await cocher(g, '#ap-ok', true);
    // double clic : un seul ajustement
    await g.dblclick('#ap-confirmer');
    await g.waitForSelector('#lien-ajustement-resultat');
    verifier(stock('P-0009', 4) === '3.000' && stock('P-0010', 4) === '0.000', 'P-0009 = 3 (compté), P-0010 remis à 0 (non scanné)');
    verifier(sql("SELECT COUNT(*) FROM documents WHERE type = 'ajustement' AND emplacement_id = 4") === '1', 'un seul ajustement malgré le double clic');
    const lignesDoc = sql("SELECT GROUP_CONCAT(CONCAT(p.code, ':', l.quantite) ORDER BY p.code) FROM document_lignes l JOIN pieces p ON p.id = l.piece_id JOIN documents d ON d.id = l.document_id WHERE d.emplacement_id = 4 AND d.type = 'ajustement'");
    verifier(lignesDoc === 'P-0009:1.000,P-0010:-3.000', 'lignes de l\'ajustement : ' + lignesDoc);
    // le comptage appliqué montre aussi les pièces remises à 0
    verifier((await texte(g, '#cv-table')).includes('non scannée : remise à 0') && (await texte(g, '#cv-table')).includes('P-0010'), 'le comptage appliqué liste les pièces remises à 0');
    verifier(invariantOk(), 'invariant : stock = somme des mouvements');
    // Comptage sans aucun écart : pas d'ajustement
    await L.aller(g, 'comptage');
    await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000004');
    await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    await rafale(g, ['P-0009', 'P-0009', 'P-0009']);
    await fileVide(g);
    const aju = sql("SELECT COUNT(*) FROM documents WHERE type = 'ajustement'");
    await g.click('#btn-appliquer'); await g.waitForSelector('#ap-table');
    verifier((await texte(g, '#ap-bilan')).includes('Aucun écart') && (await texte(g, '#ap-confirmer')).includes('aucun écart'), 'aucun écart : le bouton le dit');
    await cocher(g, '#ap-ok', true); await g.click('#ap-confirmer');
    await g.waitForFunction(() => /aucun écart/i.test(document.querySelector('#cv-alerte').textContent));
    verifier(sql("SELECT COUNT(*) FROM documents WHERE type = 'ajustement'") === aju, 'aucun écart : aucun document d\'ajustement créé');
    verifier(sql("SELECT statut FROM comptages WHERE emplacement_id = 4 ORDER BY id DESC LIMIT 1") === 'applique', 'le comptage est tout de même terminé');
  });

  await section('Comptage : deux onglets sur le même comptage', async () => {
    await L.aller(g, 'comptage');
    await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000003');
    await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    C4 = idComptage(3);
    const g2 = suivre(await L.nouvellePage(browser));
    await installerCamera(g2);
    await L.connecter(g2, 'gestionnaire');
    await L.aller(g2, 'comptage_voir&id=' + C4);
    await g2.waitForSelector('#cv-statut');
    const g3 = suivre(await L.nouvellePage(browser));      // troisième écran : horloge simulée pour tester le rafraîchissement automatique
    await g3.clock.install();
    await L.connecter(g3, 'gestionnaire');
    await L.aller(g3, 'comptage_voir&id=' + C4);
    await g3.waitForSelector('#cv-statut');
    verifier(await g3.locator('#cv-table tbody tr').count() === 0, 'le troisième écran voit un comptage vide');
    // scans simultanés dans les deux onglets : 3 + 2 = 5, atomique côté serveur
    await Promise.all([rafale(g, ['P-0003', 'P-0003', 'P-0003']), rafale(g2, ['P-0003', 'P-0003'])]);
    await Promise.all([fileVide(g), fileVide(g2)]);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + C4 + ' AND piece_id = ' + P3) === '5.000', 'deux onglets : 3 + 2 = 5, aucun scan perdu');
    await g.click('#btn-actualiser');
    await g.waitForFunction(() => { const i = document.querySelector('#cv-table .cp-qte'); return i && i.value === '5'; });
    verifier(true, '« Actualiser » ramène le total des deux onglets (5)');
    // Caméra sur l'écran de comptage : un code lu = +1, une seule fois
    await g2.click('#btn-camera'); await g2.waitForSelector('#cam-zone video');
    await g2.evaluate(() => { window.__camCode = 'P-0001'; });
    await g2.waitForFunction(id => !!document.querySelector('#cv-table tr[data-piece="' + id + '"]'), P1, { timeout: 8000 });
    await attendre(1200);
    await g2.evaluate(() => { window.__camCode = ''; });
    await fileVide(g2);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + C4 + ' AND piece_id = ' + P1) === '1.000', 'caméra : un code lu devant l\'objectif = +1 exactement');
    await g2.click('#cam-zone .sc-camera-fermer');
    verifier(await g2.evaluate(() => window.__camStops) >= 1 && await g2.locator('#cam-zone video').count() === 0, 'caméra du comptage : flux arrêté à la fermeture');
    // Rafraîchissement automatique : le troisième écran (qui n'a rien touché) rattrape tout seul les deux autres
    await g3.clock.fastForward(16000);
    await g3.waitForFunction(() => document.querySelectorAll('#cv-table tbody tr').length === 2);
    const l3 = await lignesComptage(g3);
    verifier(l3.find(x => x.code === 'P-0003').compte === '5' && l3.find(x => x.code === 'P-0001').compte === '1', 'rafraîchissement automatique : le troisième écran voit P-0003 = 5 et P-0001 = 1 : ' + JSON.stringify(l3));
    // Un onglet applique, l'autre scanne encore : message et passage en lecture seule
    await cocher(g, '#cv-aveugle', true); await cocher(g, '#cv-aveugle', false);
    await g.click('#btn-appliquer'); await g.waitForSelector('#ap-table'); await cocher(g, '#ap-ok', true); await g.click('#ap-confirmer');
    await g.waitForSelector('#lien-ajustement-resultat');
    await L.scanner(g2, '#scan', 'P-0003');
    await g2.waitForFunction(() => /terminé/.test(document.querySelector('#cv-alerte').textContent));
    await g2.waitForFunction(() => document.querySelector('#cv-saisie').classList.contains('d-none'));
    verifier(true, 'le second onglet apprend que le comptage est terminé');
    verifier(stock('P-0003', 3) === '5.000', 'le scan tardif n\'a rien modifié (stock = 5)');
    await g2.context().close(); await g3.context().close();
  });

  await section('Comptage : listes et filtres', async () => {
    await L.aller(e, 'comptage');
    await e.waitForSelector('#table-comptages tbody tr td');
    let n = await e.locator('#table-comptages tbody tr').count();
    verifier(n >= 4, 'l\'employé voit les comptages de son entreprise (' + n + ')');
    await e.selectOption('#f-statut', 'annule');
    await e.waitForFunction(() => document.querySelectorAll('#table-comptages tbody tr').length === 1 && /COM-/.test(document.querySelector('#table-comptages tbody').textContent));
    verifier((await texte(e, '#table-comptages tbody')).includes('Annulé') && (await texte(e, '#table-comptages tbody')).includes('Entrepôt principal'), 'filtre « Annulés »');
    await e.selectOption('#f-statut', 'en_cours');
    await e.waitForFunction(() => /Aucun comptage/.test(document.querySelector('#table-comptages tbody').textContent) || document.querySelectorAll('#table-comptages tbody tr').length >= 1);
    await e.selectOption('#f-statut', 'applique');
    await e.waitForFunction(() => document.querySelectorAll('#table-comptages tbody tr').length === 4 && /AJU-/.test(document.querySelector('#table-comptages tbody').textContent));
    verifier((await e.$$eval('#table-comptages tbody tr td:last-child a', as => as.map(a => a.getAttribute('href')))).every(h => h.includes('document_voir')), 'lien du document d\'ajustement dans la liste');
    await e.selectOption('#f-statut', '');
    await cocher(e, '#f-mes', true);
    // les comptages ont été créés par l'employé (C1, C2) et le gestionnaire (C3, C4, ...) : « mes comptages » = ceux de l'employé
    const mes = sql("SELECT COUNT(*) FROM comptages c JOIN utilisateurs u ON u.id = c.cree_par WHERE u.nom_utilisateur = 'employe1'");
    await e.waitForFunction(m => document.querySelectorAll('#table-comptages tbody tr').length === parseInt(m, 10), mes);
    verifier(true, '« Seulement mes comptages » : ' + mes);
    await cocher(e, '#f-mes', false);
    // recherche
    await e.fill('#table-comptages_filter input', 'Cube 14');
    await e.waitForFunction(() => document.querySelectorAll('#table-comptages tbody tr').length === 2);
    verifier(true, 'recherche par emplacement');
    // Gestionnaire : filtre par entreprise
    await L.aller(g, 'comptage');
    await g.waitForSelector('#table-comptages tbody tr td');
    await g.selectOption('#f-entreprise', '2');
    await g.waitForFunction(() => /Aucun comptage/.test(document.querySelector('#table-comptages tbody').textContent));
    verifier(true, 'le gestionnaire filtre par entreprise (aucun comptage encore pour l\'entreprise 2)');
  });

  await section('Accès : comptage d\'une autre entreprise, droits, protections des endpoints', async () => {
    // Le gestionnaire (entreprises 1 et 2) crée un comptage à l'Entrepôt de Boutique Chaleur (emplacement 2) et y compte une pièce
    await L.aller(g, 'comptage');
    await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000002');
    await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    C5 = idComptage(2);
    await rafale(g, ['P-0010']); await fileVide(g);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + C5) === '1.000', 'comptage de l\'entreprise 2 créé par le gestionnaire');
    const gb = suivre(await L.nouvellePage(browser));
    await connecterComme(gb, 'gest_bea');          // gestionnaire de l'entreprise 1 seulement
    for (const [qui, p] of [['employé', e], ['gestionnaire de l\'entreprise 1', gb]]) {
      await L.aller(p, 'comptage_voir&id=' + C5);
      verifier((await texte(p, '.content-wrapper')).includes('n\'existe pas ou vous n\'y avez pas accès') && await p.locator('#cv-table').count() === 0, qui + ' : page d\'un comptage d\'une autre entreprise refusée');
      const r1 = await appel(p, 'app/ajax/comptage_detail.php?id=' + C5, null);
      verifier(r1.status === 400 && /Comptage introuvable ou non accessible/.test(r1.json.erreur) && !/P-0010/.test(r1.texte), qui + ' : detail refusé : ' + r1.texte);
      const r2 = await appel(p, 'app/action/comptage_scan.php', { id: C5, code: 'P-0010', mode: 'ajouter', quantite: '1' });
      verifier(r2.status === 400 && /Comptage introuvable ou non accessible/.test(r2.json.erreur), qui + ' : scan refusé : ' + r2.texte);
      const r3 = await appel(p, 'app/action/comptage_retirer.php', { id: C5, piece_id: P9 });
      verifier(r3.status === 400 && /Comptage introuvable ou non accessible/.test(r3.json.erreur), qui + ' : retrait refusé');
      const r4 = await appel(p, 'app/action/comptage_annuler.php', { id: C5 });
      verifier(r4.status === 400 && /Comptage introuvable ou non accessible/.test(r4.json.erreur), qui + ' : annulation refusée');
      const r5 = await appel(p, 'app/action/comptage_appliquer.php', { id: C5, zero_non_scannees: true });
      verifier(r5.status === 400 && /Comptage introuvable ou non accessible/.test(r5.json.erreur), qui + ' : application refusée : ' + r5.texte);
      const r6 = await appel(p, 'app/ajax/comptage_apercu.php?id=' + C5, null);
      verifier(r6.status === 400 && /Comptage introuvable ou non accessible/.test(r6.json.erreur), qui + ' : aperçu refusé');
      // constat 18 : un comptage inexistant et un comptage d'une autre entreprise reçoivent EXACTEMENT la même réponse (aucune énumération possible)
      for (const [nom, url, corps] of [['detail', 'app/ajax/comptage_detail.php?id=', null], ['aperçu', 'app/ajax/comptage_apercu.php?id=', null]]) {
        const inex = await appel(p, url + '999999', corps), autre = await appel(p, url + C5, corps);
        verifier(inex.texte === autre.texte && inex.status === autre.status, qui + ' : ' + nom + ' : comptage inexistant et comptage d\'une autre entreprise indiscernables : ' + inex.texte + ' / ' + autre.texte);
      }
      for (const u of ['comptage_scan', 'comptage_retirer', 'comptage_annuler', 'comptage_appliquer']) {
        const inex = await appel(p, 'app/action/' + u + '.php', { id: 999999, code: 'P-0010', piece_id: P9 }), autre = await appel(p, 'app/action/' + u + '.php', { id: C5, code: 'P-0010', piece_id: P9 });
        verifier(inex.texte === autre.texte && inex.status === autre.status, qui + ' : ' + u + ' : comptage inexistant et comptage d\'une autre entreprise indiscernables : ' + inex.texte + ' / ' + autre.texte);
      }
      const r7 = await appel(p, 'app/action/comptage_creer.php', { emplacement_id: 2 });
      verifier(r7.status === 400 && /Emplacement introuvable ou non accessible/.test(r7.json.erreur), qui + ' : création de comptage dans une autre entreprise refusée : ' + r7.texte);
      const r8 = await appel(p, 'app/ajax/scanner_contenu.php?emplacement_id=2', null);
      verifier(r8.status === 400, qui + ' : contenu de l\'emplacement d\'une autre entreprise refusé');
      const liste = await p.evaluate(async () => {
        const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const r = await fetch('app/ajax/comptage_data.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': jeton }, body: 'draw=1&start=0&length=100&entreprise_id=2' });
        return { status: r.status, json: await r.json() };
      });
      verifier(liste.status === 200 && liste.json.recordsFiltered === 0 && liste.json.data.length === 0, qui + ' : le filtre « entreprise 2 » ne montre rien');
      const liste2 = await p.evaluate(async () => {
        const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const r = await fetch('app/ajax/comptage_data.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': jeton }, body: 'draw=1&start=0&length=100' });
        return await r.json();
      });
      verifier(!liste2.data.some(x => /Boutique Chaleur/.test(x.entreprise)), qui + ' : la liste ne contient aucun comptage de l\'entreprise 2');
    }
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C5) === 'en_cours' && sql('SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = ' + C5) === '1' && sql("SELECT COUNT(*) FROM documents WHERE emplacement_id = 2 AND type = 'ajustement'") === '0', 'le comptage de l\'entreprise 2 est resté intact');
    // Non connecté : 401 partout ; sans jeton CSRF : 403 ; GET sur une écriture : 405
    const anon = suivre(await L.nouvellePage(browser));
    await anon.goto(L.BASE + '/login.php');
    const lectures = ['scanner_code.php?code=P-0001', 'scanner_contenu.php?emplacement_id=3', 'comptage_data.php', 'comptage_detail.php?id=' + C1, 'comptage_apercu.php?id=' + C1];
    for (const u of lectures) { const r = await anon.evaluate(async u => { const r = await fetch('app/ajax/' + u, { credentials: 'same-origin' }); return r.status; }, u); verifier(r === 401, 'non connecté : ' + u + ' -> 401 (' + r + ')'); }
    const ecritures = ['comptage_creer', 'comptage_scan', 'comptage_retirer', 'comptage_annuler', 'comptage_appliquer'];
    for (const u of ecritures) {
      const r = await anon.evaluate(async u => (await fetch('app/action/' + u + '.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, u);
      verifier(r === 401, 'non connecté : ' + u + ' -> 401 (' + r + ')');
      const sj = await appel(g, 'app/action/' + u + '.php', { id: C5, emplacement_id: 2, code: 'P-0010', piece_id: P9 }, { sansJeton: true });
      verifier(sj.status === 403, 'sans jeton CSRF : ' + u + ' -> 403 (' + sj.status + ')');
      const get = await appel(g, 'app/action/' + u + '.php', null);
      verifier(get.status === 405, 'GET sur une écriture : ' + u + ' -> 405 (' + get.status + ')');
      const vide = await appel(g, 'app/action/' + u + '.php', {});
      verifier(vide.status === 400 && vide.json && vide.json.ok === false && /[a-zé]/i.test(vide.json.erreur), 'entrée vide : ' + u + ' -> 400 avec message français (' + vide.status + ' ' + vide.texte.slice(0, 80) + ')');
    }
    // Entrées hostiles / invalides : 400 en français, jamais 500
    for (const [u, corps] of [
      ['comptage_scan', { id: C4, code: ['a'], mode: 'ajouter' }], ['comptage_scan', { id: 'x', code: 'P-0001' }], ['comptage_scan', { id: C5, code: 'P-0001', mode: 'bidon' }],
      ['comptage_scan', { id: C5, piece_id: '1 OR 1=1' }], ['comptage_scan', { id: C5, piece_id: 99999 }], ['comptage_scan', { id: C5, code: "' OR '1'='1" }],
      ['comptage_scan', { id: C5, code: 'P-0010', mode: 'fixer', quantite: '1e9' }], ['comptage_scan', { id: C5, code: 'P-0010', mode: 'fixer', quantite: { a: 1 } }],
      ['comptage_creer', { emplacement_id: '3; DROP TABLE stock' }], ['comptage_creer', { emplacement_id: -5 }], ['comptage_retirer', { id: C5, piece_id: 0 }],
    ]) {
      const r = await appel(g, 'app/action/' + u + '.php', corps);
      verifier(r.status === 400 && r.json && r.json.ok === false && !/SQLSTATE|PDO|Stack trace|\.php/.test(r.texte), 'entrée invalide ' + u + ' ' + JSON.stringify(corps) + ' -> 400 sans fuite : ' + r.status + ' ' + r.texte.slice(0, 100));
    }
    verifier(sql('SELECT COUNT(*) FROM stock') !== '0', 'les tables sont intactes après les entrées hostiles');
    await anon.context().close(); await gb.context().close();
    // Nettoyage : le comptage de l'entreprise 2 est annulé par le gestionnaire
    await L.aller(g, 'comptage_voir&id=' + C5);
    await g.waitForSelector('#cv-statut');
    await g.click('#btn-annuler'); await g.waitForSelector('#modal-annuler.show'); await g.click('#an-confirmer');
    await g.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + C5) === 'annule', 'le gestionnaire annule le comptage de l\'entreprise 2');
  });

  await section('Administrateur : accès complet', async () => {
    const a = suivre(await L.nouvellePage(browser));
    await L.connecter(a, 'admin');
    await L.aller(a, 'scanner');
    await L.scanner(a, '#scan', 'EMP-000005');
    await a.waitForSelector('#sc-resultat .sc-fiche-emp');
    const f = await texte(a, '#sc-resultat');
    verifier(f.includes('Boutique Centre-ville') && f.includes('valeur totale') && f.includes('Coût moyen'), 'l\'administrateur voit le contenu et la valeur d\'un emplacement de l\'entreprise 2');
    await L.aller(a, 'comptage');
    await a.waitForSelector('#table-comptages tbody tr td');
    await a.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(a, '#scan', 'EMP-000005');
    await a.waitForURL(/comptage_voir/); await a.waitForSelector('#cv-statut');
    verifier(await a.locator('#btn-appliquer').count() === 1 && !(await a.locator('#cv-aveugle').isChecked()), 'l\'administrateur peut appliquer un comptage et voit le stock attendu');
    await a.click('#btn-annuler'); await a.waitForSelector('#modal-annuler.show'); await a.click('#an-confirmer');
    await a.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(reelles(a).length === 0, 'console propre (administrateur) : ' + JSON.stringify(reelles(a)));
    await a.context().close();
  });

  await section('Tablette (768 × 1024) : mise en page et zones cliquables', async () => {
    const t = suivre(await L.nouvellePage(browser, { width: 768, height: 1024 }));
    await L.connecter(t, 'gestionnaire');
    const sansDebordement = async nom => verifier(await t.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), nom + ' : pas de défilement horizontal');
    await L.aller(t, 'scanner');
    await L.scanner(t, '#scan', 'P-0001'); await t.waitForSelector('#sc-resultat .sc-fiche');
    await sansDebordement('scanner (fiche pièce)');
    const hauteurs = await t.$$eval('#btn-camera, #btn-clavier, #sc-resultat .sc-actions .btn, #sc-resultat .sc-voir-emp, #sc-vider-hist', bs => bs.map(b => b.getBoundingClientRect().height));
    verifier(hauteurs.length >= 7 && hauteurs.every(h => h >= 43.5), 'constats 13/30 : scanner : zones cliquables ≥ 44 px (' + hauteurs.map(h => Math.round(h)) + ')');
    verifier(await t.evaluate(() => document.querySelector('#scan').getBoundingClientRect().height) >= 44, 'scanner : champ de scan ≥ 44 px');
    verifier(await t.getAttribute('#scan', 'inputmode') === 'none', 'scanner : pas de clavier tactile par défaut');
    await t.click('#btn-clavier');
    verifier(await t.getAttribute('#scan', 'inputmode') === 'text', 'bouton Clavier : le clavier tactile peut s\'afficher');
    await L.scanner(t, '#scan', 'EMP-000003'); await t.waitForSelector('#sc-resultat .sc-fiche-emp');
    await sansDebordement('scanner (emplacement)');
    const h3 = await t.$$eval('#sc-resultat .sc-voir-piece, #sc-vider-hist', bs => bs.map(b => [b.getBoundingClientRect().height, b.getBoundingClientRect().width]));
    verifier(h3.length >= 5 && h3.every(([h, w]) => h >= 43.5 && w >= 43.5), 'constats 13/30 : codes cliquables du contenu et bouton « Effacer » ≥ 44 × 44 px (' + JSON.stringify(h3.map(x => x.map(Math.round))) + ')');
    await L.aller(t, 'comptage'); await sansDebordement('liste des comptages');
    await t.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await t.selectOption('#nouveau-emp', '4'); await Promise.all([t.waitForURL(/comptage_voir/), t.click('#btn-nouveau')]);
    await t.waitForSelector('#cv-statut');
    await rafale(t, ['P-0009', 'P-0009']); await fileVide(t);
    await sansDebordement('écran de comptage');
    const h2 = await t.$$eval('#cv-actions .btn, #cv-table .cp-qte, #cv-table .cp-retirer, #cv-aveugle + label', bs => bs.map(b => b.getBoundingClientRect().height));
    verifier(h2.length >= 5 && h2.every(h => h >= 44), 'comptage : zones cliquables ≥ 44 px (' + h2.map(h => Math.round(h)) + ')');
    verifier(await t.getAttribute('#cv-table .cp-qte', 'inputmode') === 'decimal', 'comptage : champs de quantité inputmode=decimal');
    await t.click('#btn-annuler'); await t.waitForSelector('#modal-annuler.show'); await t.click('#an-confirmer');
    await t.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(reelles(t).length === 0, 'console propre (tablette) : ' + JSON.stringify(reelles(t)));
    await t.context().close();
  });

  // =====================================================================================================================
  //  CORRECTIONS DE LA RELECTURE (les numéros renvoient à la liste des constats du module D1)
  // =====================================================================================================================
  const P2 = idPiece('P-0002'), P4 = idPiece('P-0004'), P10 = idPiece('P-0010'), P12 = idPiece('P-0012');
  const POST_JSON = (p, url, corps) => appel(p, url, corps);

  await section('Constats 1 et 6 : un comptage de plus de 300 écarts crée plusieurs ajustements (aperçu, application, lecture)', async () => {
    verifier(outil('masse', '4', '305', '1') === '305', 'préparation : 305 pièces GROS-0001… avec 1 en stock au cube 14');
    const dernierDoc = parseInt(sql('SELECT COALESCE(MAX(id), 0) FROM documents'), 10);
    const restant = sql("SELECT COUNT(*) FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE s.emplacement_id = 4 AND s.quantite > 0 AND p.code NOT LIKE 'GROS-%'");   // pièces du cube 14 qui seront « non scannées »
    const total = 305 + parseInt(restant, 10);
    await L.aller(g, 'comptage');
    await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000004');
    await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    const CG = idComptage(4);
    await g.evaluate(async ([id, n]) => {
      const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const un = async i => {
        const r = await fetch('app/action/comptage_scan.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': jeton }, body: JSON.stringify({ id, code: 'GROS-' + String(i).padStart(4, '0'), mode: 'fixer', quantite: '2', aveugle: 1 }) });
        const j = await r.json(); if (!j.ok) throw new Error('GROS-' + i + ' : ' + j.erreur);
      };
      for (let d = 1; d <= n; d += 20) await Promise.all(Array.from({ length: Math.min(20, n - d + 1) }, (_, k) => un(d + k)));
    }, [CG, 305]);
    verifier(sql('SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = ' + CG) === '305', '305 pièces comptées à 2');
    await g.reload(); await g.waitForSelector('#cv-statut'); await g.waitForFunction(() => document.querySelectorAll('#cv-table tbody tr').length === 305);
    await g.click('#btn-appliquer');
    await g.waitForSelector('#ap-table');
    let bilan = await texte(g, '#ap-bilan');
    verifier(bilan.includes('305 pièces seront ajustées') && bilan.includes('2 documents d\'ajustement') && bilan.includes('300 pièces au plus chacun'), 'l\'aperçu annonce DEUX documents au-delà de 300 écarts : ' + bilan);
    await cocher(g, '#ap-zero', true);
    bilan = await texte(g, '#ap-bilan');
    verifier(restant === '1' && bilan.includes(total + ' pièces seront ajustées') && bilan.includes('2 documents d\'ajustement') && (await texte(g, '#ap-zero-zone')).includes('P-0009'), 'avec « non scannées à 0 » : 305 + ' + restant + ' = ' + total + ' pièces, toujours 2 documents : ' + bilan);
    await cocher(g, '#ap-ok', true);
    verifier(!(await g.locator('#ap-confirmer').isDisabled()) && (await texte(g, '#ap-confirmer')).includes(total + ' ajustements'), 'le bouton annonce ' + total + ' ajustements');
    await g.click('#ap-confirmer');
    await g.waitForSelector('#lien-ajustement-resultat');
    const alerteFin = await texte(g, '#cv-alerte');
    await attendre(300);
    const cSucces = await contrasteDe(g, '#cv-alerte .alert-success');
    verifier(cSucces !== null && cSucces >= 4.5, 'constat 32 : le message vert « Comptage appliqué » est lisible (contraste ' + cSucces + ':1)');
    verifier(/Ajustements AJU-\d{4}-\d{5}, AJU-\d{4}-\d{5}/.test(alerteFin) && alerteFin.includes(total + ' pièces') && await g.locator('#cv-alerte a').count() === 2, 'message final : les DEUX documents d\'ajustement sont liés : ' + alerteFin);
    const docs = sql("SELECT GROUP_CONCAT(n SEPARATOR ',') FROM (SELECT (SELECT COUNT(*) FROM document_lignes l WHERE l.document_id = d.id) AS n FROM documents d WHERE d.type = 'ajustement' AND d.motif = 'comptage' AND d.emplacement_id = 4 AND d.id > " + dernierDoc + " ORDER BY d.id) t");
    verifier(docs === '300,' + (total - 300), 'deux ajustements en base : 300 lignes puis ' + (total - 300) + ' : ' + docs);
    verifier(sql("SELECT COUNT(*) FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE p.code LIKE 'GROS-%' AND s.emplacement_id = 4 AND s.quantite = 2") === '305' && stock('P-0009', 4) === '0.000' && stock('P-0010', 4) === '0.000', 'stock : 305 pièces à 2, non scannées remises à 0');
    verifier(sql("SELECT statut FROM comptages WHERE id = " + CG) === 'applique' && invariantOk(), 'comptage appliqué ; invariant stock = somme des mouvements');
    // lecture après coup : en-tête avec les deux documents, écarts appliqués de TOUTES les lignes (y compris celles du 2e document)
    await g.waitForFunction(() => document.querySelector('#cv-statut') && document.querySelector('#cv-statut').textContent === 'Appliqué');
    const ent = await texte(g, '#cv-entete');
    verifier(/Ajustements/.test(ent) && ent.includes('2 documents') && await g.locator('#cv-entete a').count() === 2, 'l\'en-tête du comptage appliqué liste les deux ajustements : ' + ent);
    const brut = await appel(g, 'app/ajax/comptage_detail.php?id=' + CG, null);
    verifier(brut.json.comptage.documents.length === 2 && brut.json.lignes.length === 305 && brut.json.lignes.every(l => l.ecart_applique === '1.000') && brut.json.remises_a_zero.length === parseInt(restant, 10), 'comptage_detail : 2 documents, 305 lignes à +1 appliqué, ' + restant + ' remise à 0 : ' + brut.texte.slice(0, 200));
    await L.aller(g, 'comptage'); await g.waitForSelector('#table-comptages tbody tr td');
    await g.fill('#table-comptages_filter input', 'Cube 14');
    await g.waitForFunction(() => /et 1 autre/.test(document.querySelector('#table-comptages tbody').textContent));
    verifier(true, 'la liste des comptages signale « et 1 autre » ajustement');
  });

  await section('Constats 2 et 7 : l\'aperçu est lié à l\'application (empreinte) — comptage ou stock modifié entre les deux', async () => {
    // --- (7) un autre utilisateur change une quantité comptée après l'aperçu du gestionnaire
    await L.aller(g, 'comptage'); await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000001'); await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    const CF = idComptage(1);
    await rafale(g, ['P-0002', 'P-0002']); await fileVide(g);
    await g.click('#btn-appliquer'); await g.waitForSelector('#ap-table');
    await cocher(g, '#ap-ok', true);
    verifier(!(await g.locator('#ap-confirmer').isDisabled()), 'aperçu confirmé par le gestionnaire (P-0002 : 2 compté)');
    const r = await appel(e, 'app/action/comptage_scan.php', { id: CF, code: 'P-0004', mode: 'fixer', quantite: '50' });   // l'employé gonfle une quantité APRÈS l'aperçu
    verifier(r.status === 200, 'un autre écran modifie le comptage pendant que l\'aperçu est ouvert');
    await g.click('#ap-confirmer');
    await g.waitForSelector('#ap-changement');
    verifier((await texte(g, '#ap-changement')).includes('a changé depuis l\'aperçu') && sql('SELECT statut FROM comptages WHERE id = ' + CF) === 'en_cours' && stock('P-0004', 1) === '12.000', 'application REFUSÉE : le comptage a changé depuis l\'aperçu, rien n\'est appliqué');
    verifier(!(await g.isChecked('#ap-ok')) && await g.locator('#ap-confirmer').isDisabled(), 'la confirmation est à refaire (case décochée, bouton désactivé)');
    verifier((await texte(g, '#ap-table')).includes('P-0004') && (await texte(g, '#ap-table')).includes('50'), 'l\'aperçu est relu : P-0004 compté 50 apparaît');
    // --- l'empreinte lie aussi l'application à la case « non scannées à 0 » (POST direct)
    const ap1 = await appel(g, 'app/ajax/comptage_apercu.php?id=' + CF, null);
    verifier(ap1.status === 200 && /^[0-9a-f]{64}$/.test(ap1.json.empreinte) && ap1.json.empreinte !== ap1.json.empreinte_zero && ap1.json.max_lignes === 300, 'l\'aperçu renvoie deux empreintes (avec / sans « à 0 ») et la limite par document');
    let b = await appel(g, 'app/action/comptage_appliquer.php', { id: CF, zero_non_scannees: false });
    verifier(b.status === 400 && /Ouvrez l'aperçu/.test(b.json.erreur), 'POST direct SANS empreinte refusé : ' + b.texte);
    b = await appel(g, 'app/action/comptage_appliquer.php', { id: CF, zero_non_scannees: false, empreinte: 'x'.repeat(64) });
    verifier(b.status === 400 && b.json.champ === 'apercu', 'POST direct avec une fausse empreinte refusé : ' + b.texte);
    b = await appel(g, 'app/action/comptage_appliquer.php', { id: CF, zero_non_scannees: false, empreinte: ap1.json.empreinte_zero });
    verifier(b.status === 400 && b.json.champ === 'apercu', 'l\'empreinte « à 0 » ne vaut pas pour une application SANS « à 0 »');
    b = await appel(g, 'app/action/comptage_appliquer.php', { id: CF, zero_non_scannees: false, empreinte: ['a'] });
    verifier(b.status === 400 && /Ouvrez l'aperçu/.test(b.json.erreur), 'empreinte de mauvais type : traitée comme absente');
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + CF) === 'en_cours', 'aucun de ces refus n\'a appliqué le comptage');
    // --- (2) du stock bouge entre l'aperçu et la confirmation : refus aussi, la case « à 0 » reste cochée dans l'aperçu relu
    await cocher(g, '#ap-zero', true); await cocher(g, '#ap-ok', true);
    verifier((await texte(g, '#ap-zero-zone')).includes('P-0001'), 'avant le mouvement : P-0001 sera remis à 0 (non scanné)');
    const sAvant = num(stock('P-0001', 1)), sApres = sAvant - 1;
    outil('transferer', '1', '3', String(P1), '1');   // pendant que l'aperçu est ouvert, un thermocouple quitte l'entrepôt
    await g.click('#ap-confirmer');
    await g.waitForFunction(() => document.querySelector('#ap-changement'));
    await g.waitForFunction(() => document.querySelector('#ap-zero') && document.querySelector('#ap-zero').checked);
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + CF) === 'en_cours' && num(stock('P-0001', 1)) === sApres, 'constat 2 : stock modifié entre l\'aperçu et la confirmation : application refusée, rien n\'est remis à 0');
    verifier(!(await g.isChecked('#ap-ok')) && await g.locator('#ap-zero-zone').isVisible() && (await g.$$eval('#ap-table-zero tr[data-piece="' + P1 + '"] td', tds => tds.slice(1).map(t => t.textContent.trim()).join('|'))) === sApres + '|0', 'l\'aperçu relu garde la case « à 0 » cochée et montre le NOUVEAU stock (P-0001 : ' + sApres + ') : ' + await texte(g, '#ap-table-zero tr[data-piece="' + P1 + '"]'));
    // le gestionnaire confirme maintenant ce qu'il voit : tout est appliqué
    await cocher(g, '#ap-ok', true); await g.click('#ap-confirmer');
    await g.waitForSelector('#lien-ajustement-resultat');
    verifier(stock('P-0001', 1) === '0.000' && stock('P-0002', 1) === '2.000' && stock('P-0004', 1) === '50.000' && sql('SELECT statut FROM comptages WHERE id = ' + CF) === 'applique', 'après confirmation de l\'aperçu à jour : exactement ce qui était affiché est appliqué');
    verifier(invariantOk(), 'invariant : stock = somme des mouvements');
  });

  await section('Constats 3 et 20 : caméra — une étiquette tenue devant l\'objectif compte UNE fois, retirée puis représentée elle recompte', async () => {
    const pc = suivre(await L.nouvellePage(browser));
    await installerCamera(pc);
    await L.connecter(pc, 'gestionnaire');
    await L.aller(pc, 'comptage'); await pc.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(pc, '#scan', 'EMP-000005'); await pc.waitForURL(/comptage_voir/); await pc.waitForSelector('#cv-statut');
    const CC = idComptage(5);
    await pc.click('#btn-camera'); await pc.waitForSelector('#cam-zone video');
    verifier(await pc.getAttribute('#btn-camera', 'aria-expanded') === 'true', 'caméra ouverte : aria-expanded = true');
    await pc.evaluate(() => { window.__camCode = 'P-0012'; });
    await pc.waitForFunction(id => !!document.querySelector('#cv-table tr[data-piece="' + id + '"]'), P12, { timeout: 8000 });
    await attendre(7000);                                            // 7 s devant l'objectif (l'ancien code comptait 4)
    await fileVide(pc);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + CC + ' AND piece_id = ' + P12) === '1.000', 'constat 3 : 7 s devant la caméra = 1 seul article compté');
    verifier((await texte(pc, '#cam-zone')).includes('Lu : P-0012') || (await texte(pc, '#cv-dernier')).includes('P-0012'), 'retour visuel de la lecture');
    await pc.evaluate(() => { window.__camCode = ''; });
    await attendre(1300);                                            // retirée de l'image plus de 0,8 s
    await pc.evaluate(() => { window.__camCode = 'P-0012'; });
    await pc.waitForFunction(id => document.querySelector('#cv-table tr[data-piece="' + id + '"] .cp-qte').getAttribute('data-serveur') === '2.000', P12, { timeout: 8000 });
    await attendre(1500); await pc.evaluate(() => { window.__camCode = ''; }); await fileVide(pc);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + CC + ' AND piece_id = ' + P12) === '2.000', 'constat 3 : un second article présenté après avoir retiré le premier est compté (2)');
    // Un clignotement bref (moins de 0,8 s hors image) ne recompte pas
    await pc.evaluate(() => { window.__camCode = 'P-0012'; }); await attendre(300);
    await pc.evaluate(() => { window.__camCode = ''; }); await attendre(300);
    await pc.evaluate(() => { window.__camCode = 'P-0012'; }); await attendre(1500); await pc.evaluate(() => { window.__camCode = ''; }); await fileVide(pc);
    verifier(sql('SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = ' + CC + ' AND piece_id = ' + P12) === '2.000', 'un détecteur qui clignote (0,3 s hors image) ne multiplie pas les lectures : toujours 2');
    // fermeture par la page masquée / quittée : le bouton revient à « fermé » (aria-expanded)
    await pc.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    verifier(await pc.getAttribute('#btn-camera', 'aria-expanded') === 'false' && await pc.locator('#cam-zone video').count() === 0, 'constat 3 : caméra fermée par la page quittée : aria-expanded repasse à false');
    // même chose sur la page Scanner
    await L.aller(pc, 'scanner'); await pc.click('#btn-camera'); await pc.waitForSelector('#cam-zone video');
    await pc.evaluate(() => { window.__camCode = 'P-0007'; });
    await pc.waitForFunction(() => /P-0007/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent), null, { timeout: 8000 });
    await attendre(3500);
    const nHist = await pc.locator('#sc-hist .sc-hist-item').count();
    verifier(nHist === 1, 'constat 20 (page Scanner) : l\'étiquette tenue 3,5 s n\'est lue qu\'une fois (' + nHist + ' entrée)');
    await pc.evaluate(() => { window.__camCode = ''; });
    await pc.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    verifier(await pc.getAttribute('#btn-camera', 'aria-expanded') === 'false', 'page Scanner : aria-expanded repasse à false');
    await L.aller(pc, 'comptage_voir&id=' + CC);
    await pc.click('#btn-annuler'); await pc.waitForSelector('#modal-annuler.show'); await pc.click('#an-confirmer');
    await pc.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(reelles(pc).length === 0, 'console propre (caméra) : ' + JSON.stringify(reelles(pc)));
    await pc.context().close();
  });

  await section('Constat 4 : réseau coupé et session expirée — messages en français, redirection vers la connexion', async () => {
    const pn = suivre(await L.nouvellePage(browser));
    await L.connecter(pn, 'employe');
    await L.aller(pn, 'comptage'); await pn.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    // création d'un comptage sans réseau (fetch propre à D1)
    await pn.route('**/comptage_creer.php*', rt => rt.abort());
    await pn.selectOption('#nouveau-emp', '3'); await pn.click('#btn-nouveau');
    await pn.waitForFunction(() => /Connexion impossible/.test(document.querySelector('#cp-nouveau-msg').textContent));
    verifier(!/Failed|fetch|NetworkError/i.test(await texte(pn, '#cp-nouveau-msg')) && await pn.isEnabled('#btn-nouveau'), 'création sans réseau : « Connexion impossible… », bouton réactivé : ' + await texte(pn, '#cp-nouveau-msg'));
    await pn.unroute('**/comptage_creer.php*');
    // scanner sans réseau
    await L.aller(pn, 'scanner');
    await pn.route('**/scanner_code.php*', rt => rt.abort());
    await L.scanner(pn, '#scan', 'P-0003');
    await pn.waitForFunction(() => /Connexion impossible/.test(document.querySelector('#sc-resultat').textContent));
    verifier(!/Failed|fetch/i.test(await texte(pn, '#sc-resultat')), 'scanner sans réseau : message français');
    // « Compter cet emplacement » sans réseau
    await pn.unroute('**/scanner_code.php*');
    await L.scanner(pn, '#scan', 'EMP-000003'); await pn.waitForSelector('#sc-compter, #sc-reprendre');
    if (await pn.locator('#sc-compter').count()) {
      await pn.route('**/comptage_creer.php*', rt => rt.abort());
      await pn.click('#sc-compter');
      await pn.waitForFunction(() => /Connexion impossible/.test(document.getElementById('toasts') ? document.getElementById('toasts').textContent : ''));
      verifier(true, '« Compter cet emplacement » sans réseau : toast « Connexion impossible… »');
      await pn.unroute('**/comptage_creer.php*');
    }
    // liste des comptages sans réseau, puis session expirée
    await L.aller(pn, 'comptage'); await pn.waitForSelector('#table-comptages tbody tr');
    await pn.route('**/comptage_data.php*', rt => rt.abort());
    await pn.selectOption('#f-statut', 'annule');
    await pn.waitForFunction(() => /Connexion impossible/.test(document.getElementById('toasts') ? document.getElementById('toasts').textContent : ''));
    const toasts = await texte(pn, '#toasts');
    verifier(!/DataTables|Ajax error|Failed/i.test(toasts), 'liste sans réseau : toast français, jamais « DataTables warning » : ' + toasts);
    await pn.unroute('**/comptage_data.php*');
    await pn.context().clearCookies();
    await pn.selectOption('#f-statut', 'en_cours');
    await pn.waitForURL(/login\.php/, { timeout: 8000 });
    verifier(/login\.php/.test(pn.url()), 'session expirée dans la liste : redirection vers la connexion');
    await pn.context().close();
  });

  await section('Constats 8, 9, 26, 27, 34 : retrait armé, carte « pas encore comptées », bouton d\'approbation, style des boutons', async () => {
    // Un comptage de l'employé au cube 12 ; le gestionnaire le suit en même temps
    await L.aller(e, 'comptage'); await e.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await e.selectOption('#nouveau-emp', '3'); await Promise.all([e.waitForURL(/comptage_voir/), e.click('#btn-nouveau')]);
    await e.waitForSelector('#cv-statut');
    const CE = idComptage(3);
    await rafale(e, ['P-0001', 'P-0002']); await fileVide(e);
    verifier(/P-0002/.test(await texte(e, '#cv-dernier')) && /Compté : 1/.test(await texte(e, '#cv-dernier')) && await e.locator('#cv-dernier.cp-dernier-ok').count() === 1, 'constat 32 : le dernier scan est affiché en grand (code, nom, nouveau total) : ' + await texte(e, '#cv-dernier'));
    await attendre(300);   // fin de la transition de couleur
    verifier(await e.locator('.scan-box.ok').count() === 1 && await e.$eval('.scan-box', b => getComputedStyle(b).backgroundColor) === 'rgb(212, 237, 218)', 'constat 32 : retour visuel net après un scan réussi (cadre vert plein)');
    const ligne1 = '#cv-table tr[data-piece="' + P1 + '"] .cp-retirer';
    // (8) clic dans le COIN du bouton ✕ (et non sur l'icône) : il s'arme, le focus reste sur lui ; un scan qui arrive ne le valide jamais
    await e.click(ligne1, { position: { x: 4, y: 4 } });
    verifier(await e.locator('.cp-retirer.cp-arme').count() === 1 && (await texte(e, ligne1)) === 'Retirer ?', 'constat 8 : premier clic : le bouton passe à « Retirer ? »');
    verifier(await e.evaluate(() => document.activeElement.classList.contains('cp-retirer')), 'constat 8 : le focus reste sur le bouton armé (la cible du clic n\'a pas quitté la page)');
    await attendre(400);   // fin de la transition de couleur de Bootstrap
    const st = await e.$eval(ligne1, b => { const c = getComputedStyle(b); return [c.backgroundColor, c.color]; });
    verifier(['rgb(220, 53, 69)', 'rgb(189, 33, 48)'].includes(st[0]) && st[1] === 'rgb(255, 255, 255)', 'constat 27 : le bouton armé « Retirer ? » est un vrai bouton rouge (fond ' + st[0] + ', texte ' + st[1] + ')');
    await e.keyboard.type('P-0003'); await e.keyboard.press('Enter');     // le lecteur de codes tape alors que le bouton est armé
    await fileVide(e);
    verifier(await e.locator('#cv-table tr[data-piece="' + P1 + '"]').count() === 1 && sql("SELECT COUNT(*) FROM comptage_lignes WHERE comptage_id = " + CE + " AND piece_id = " + P1) === '1', 'constat 8 : un scan pendant l\'armement NE retire PAS la ligne');
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + CE + " AND piece_id = " + idPiece('P-0003')) === '1.000' && await e.locator('.cp-retirer.cp-arme').count() === 0, 'constat 8 : le scan est compté (il n\'est plus tapé dans le bouton) et le bouton est désarmé');
    // le bouton armé retombe seul au bout de quelques secondes
    await e.click(ligne1, { position: { x: 4, y: 4 } });
    await attendre(4400);
    verifier(await e.locator('.cp-retirer.cp-arme').count() === 0 && (await e.$eval(ligne1, b => b.getAttribute('aria-label'))) === 'Retirer P-0001 du comptage', 'constat 8 : l\'armement tombe seul après 4 s');
    // cliquer ailleurs le désarme aussi
    await e.click(ligne1, { position: { x: 4, y: 4 } }); await e.click('h2.card-title >> nth=0');
    verifier(await e.locator('.cp-retirer.cp-arme').count() === 0, 'constat 8 : un clic ailleurs désarme le bouton');

    // (26) bouton « À faire approuver » : le focus retourne au champ de scan
    await e.click('#btn-approbation', { position: { x: 4, y: 4 } });
    verifier((await texte(e, '#cv-alerte')).includes('Seul un gestionnaire') && await focusId(e) === 'scan', 'constat 26 : après « À faire approuver », le curseur est dans le champ de scan');
    await rafale(e, ['P-0004']); await fileVide(e);
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + CE + " AND piece_id = " + P4) === '1.000', 'constat 26 : le scan suivant est compté');

    // (9) le gestionnaire voit « pas encore comptées » se mettre à jour au scan et au retrait
    await L.aller(g, 'comptage_voir&id=' + CE); await g.waitForSelector('#cv-statut');
    await g.waitForFunction(() => !document.querySelector('#cv-non-comptees').classList.contains('d-none'));
    const non = async () => g.$$eval('#cv-non-corps tr', rs => rs.map(r => r.children[0].textContent.trim()));
    const avant = await non(); const nb0 = parseInt(await g.textContent('#cv-nb-non'), 10);
    verifier(avant.includes('P-0005') && nb0 === avant.length, 'constat 9 : P-0005 est dans « pas encore comptées » (' + avant + ')');
    await rafale(g, ['P-0005']); await fileVide(g);
    const apres = await non();
    verifier(!apres.includes('P-0005') && parseInt(await g.textContent('#cv-nb-non'), 10) === nb0 - 1, 'constat 9 : après le scan de P-0005 il sort de la liste et le badge baisse (' + apres + ')');
    await g.click('#cv-table tr[data-piece="' + P5 + '"] .cp-retirer'); await g.click('#cv-table tr[data-piece="' + P5 + '"] .cp-retirer');
    await g.waitForSelector('#cv-table tr[data-piece="' + P5 + '"]', { state: 'detached' });
    const retour = await non();
    verifier(retour.includes('P-0005') && parseInt(await g.textContent('#cv-nb-non'), 10) === nb0, 'constat 9 : la pièce retirée du comptage revient dans « pas encore comptées » (badge ' + nb0 + ')');
    // (27) le bouton de confirmation d'annulation est un vrai bouton rouge
    await g.click('#btn-annuler'); await g.waitForSelector('#modal-annuler.show');
    const st2 = await g.$eval('#an-confirmer', b => { const c = getComputedStyle(b); return [c.backgroundColor, c.color, c.fontSize]; });
    verifier(st2[0] === 'rgb(220, 53, 69)' && st2[1] === 'rgb(255, 255, 255)' && st2[2] === '16px', 'constat 27 : « Annuler le comptage » (modale) : bouton rouge, texte blanc, 16 px (' + st2 + ')');
    await g.click('#modal-annuler [data-dismiss="modal"] >> text=Garder le comptage'); await g.waitForSelector('#modal-annuler.show', { state: 'hidden' });
    // (24, 25) API : code mal formé, « fixer » sans quantité
    let r = await appel(e, 'app/action/comptage_scan.php', { id: CE, code: ['P-0001'] });
    verifier(r.status === 400 && r.json.erreur === 'Scannez ou indiquez une pièce.', 'constat 24 : code en tableau -> « Scannez ou indiquez une pièce. » : ' + r.texte);
    r = await appel(e, 'app/action/comptage_scan.php', { id: CE });
    verifier(r.status === 400 && r.json.erreur === 'Scannez ou indiquez une pièce.', 'constat 24 : aucun code -> même message');
    for (const corps of [{ id: CE, piece_id: P1, mode: 'fixer' }, { id: CE, piece_id: P1, mode: 'fixer', quantite: null }, { id: CE, piece_id: P1, mode: 'fixer', quantite: '' }]) {
      r = await appel(e, 'app/action/comptage_scan.php', corps);
      verifier(r.status === 400 && r.json.erreur === 'Indiquez la quantité comptée.' && r.json.champ === 'quantite', 'constat 25 : « fixer » sans quantité refusé : ' + r.texte);
    }
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + CE + " AND piece_id = " + P1) === '1.000', 'constat 25 : la quantité n\'a pas été fixée à 1 en silence');
    r = await appel(e, 'app/action/comptage_scan.php', { id: CE, piece_id: P1 });
    verifier(r.status === 200 && r.json.ligne.quantite_comptee === '2.000', 'le mode « ajouter » sans quantité reste +1 (défaut)');
    // (21) valeurs en tableau sur les points d'entrée partagés : réponse propre, sans avertissement PHP (le journal est vérifié à la fin)
    r = await appel(g, 'app/ajax/scan_code.php?code[]=x', null);
    verifier(r.status === 200 && r.json && r.json.trouve === false, 'constat 21 : scan_code.php?code[]= -> réponse propre');
    r = await appel(g, 'app/ajax/pieces_recherche.php?q[]=x', null);
    verifier(r.status === 200 && r.json && Array.isArray(r.json.pieces), 'constat 21 : pieces_recherche.php?q[]= -> réponse propre');
    r = await appel(g, 'app/ajax/scanner_code.php?code[]=x', null);
    verifier(r.status === 200 && r.json && r.json.trouve === false, 'scanner_code.php?code[]= -> réponse propre');
  });

  await section('Constats 10, 12, 19 : l\'historique des scans appartient à l\'utilisateur connecté (tablette partagée)', async () => {
    const ph = suivre(await L.nouvellePage(browser));
    await connecterComme(ph, 'gestionnaire1');
    await L.aller(ph, 'scanner');
    await L.scanner(ph, '#scan', 'EMP-000005'); await ph.waitForSelector('#sc-resultat .sc-fiche-emp');
    await L.scanner(ph, '#scan', 'P-0009'); await ph.waitForFunction(() => /P-0009/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    verifier((await texte(ph, '#sc-hist')).includes('Boutique Centre-ville'), 'le gestionnaire voit son historique (emplacement de l\'entreprise 2)');
    await ph.goto(L.BASE + '/app/action/logout.php');
    await connecterComme(ph, 'employe1');
    await L.aller(ph, 'scanner');
    const h1 = await texte(ph, '#sc-hist');
    verifier(!h1.includes('Boutique Centre-ville') && !h1.includes('P-0009') && h1.includes('Aucun scan'), 'constats 10/12/19 : l\'employé qui se connecte après le gestionnaire ne voit AUCUN de ses scans : ' + h1);
    const cles = await ph.evaluate(() => Object.keys(sessionStorage).filter(k => k.indexOf('bea_scanner_historique') === 0));
    verifier(cles.length <= 1 && cles.every(k => /_\d+$/.test(k)), 'la clé de stockage porte l\'identifiant de l\'utilisateur et l\'historique du précédent est purgé : ' + JSON.stringify(cles));
    // ancienne clé commune (avant la correction) : ignorée et supprimée
    await ph.evaluate(() => sessionStorage.setItem('bea_scanner_historique', JSON.stringify([{ type: 'emplacement', id: 5, code: 'EMP-000005', libelle: 'Boutique Centre-ville — 3 pièces', h: '10:00:00' }])));
    await ph.reload(); await ph.waitForLoadState('networkidle');
    verifier(!(await texte(ph, '#sc-hist')).includes('Boutique Centre-ville') && await ph.evaluate(() => sessionStorage.getItem('bea_scanner_historique')) === null, 'l\'ancienne clé commune est supprimée sans être affichée');
    // l'employé garde SON historique d'une connexion à l'autre
    await L.scanner(ph, '#scan', 'P-0001'); await ph.waitForSelector('#sc-resultat .sc-fiche');
    await ph.goto(L.BASE + '/app/action/logout.php'); await connecterComme(ph, 'employe1'); await L.aller(ph, 'scanner');
    verifier((await texte(ph, '#sc-hist')).includes('P-0001'), 'l\'historique d\'un utilisateur lui revient à sa reconnexion');
    await ph.context().close();
  });

  await section('Constats 14, 15, 28, 29, 33, 35, 39 : liste et écran de comptage — disposition, libellés, messages', async () => {
    const CE = idComptage(3);
    const pl = suivre(await L.nouvellePage(browser, { width: 1024, height: 768 }));
    await L.connecter(pl, 'gestionnaire');
    for (const [w, h] of [[768, 1024], [1024, 768], [1280, 900]]) {
      await pl.setViewportSize({ width: w, height: h });
      await L.aller(pl, 'comptage'); await pl.waitForSelector('#table-comptages tbody tr td');
      const m = await pl.evaluate(() => {
        const t = document.querySelector('#table-comptages'), wrap = t.closest('.table-responsive');
        const lien = document.querySelector('#table-comptages a.cp-numero-lien');
        return { table: t.scrollWidth, wrap: wrap.clientWidth, lien: lien.getBoundingClientRect().height, doc: document.documentElement.scrollWidth, win: window.innerWidth, ajust: [...document.querySelectorAll('#table-comptages thead th')].map(x => x.textContent.trim()) };
      });
      verifier(m.table <= m.wrap + 1 && m.doc <= m.win + 1, 'constats 15/28 : liste des comptages sans défilement horizontal à ' + w + ' px (tableau ' + m.table + ' / conteneur ' + m.wrap + ')');
      verifier(m.lien < 30, 'constats 15/28 : le numéro COM-… tient sur une ligne à ' + w + ' px (hauteur ' + Math.round(m.lien) + ')');
      verifier(JSON.stringify(m.ajust) === JSON.stringify(['Numéro', 'Emplacement', 'Statut', 'Commencé le', 'Pièces', 'Ajustement']), 'constat 36 : en-têtes « Commencé le », « Pièces » (' + m.ajust + ')');
      // largeur du texte le plus long de chaque liste (mesuré avec la police du champ) comparée à la largeur utile du champ
      const filtres = await pl.$$eval('#f-statut, #f-entreprise', ss => ss.map(s => {
        const c = document.createElement('canvas').getContext('2d'), st = getComputedStyle(s); c.font = st.font;
        const utile = s.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) - 24;   // 24 px : flèche de la liste
        const plusLong = Math.max(...[...s.options].map(o => c.measureText(o.textContent).width));
        return [plusLong <= utile, s.id + ' ' + Math.round(plusLong) + '/' + Math.round(utile)];
      }));
      verifier(filtres.every(([ok]) => ok), 'constat 15 : les listes de filtre ne sont pas tronquées à ' + w + ' px : ' + JSON.stringify(filtres));
    }
    const aria = await pl.$$eval('#table-comptages thead th[aria-label]', ths => ths.map(t => t.getAttribute('aria-label')));
    verifier(aria.length >= 3 && aria.every(a => !/activate|column|ascending|descending/i.test(a)) && aria.some(a => /activer pour trier/.test(a)), 'constat 14 : libellés d\'accessibilité du tri en français : ' + aria.slice(0, 2));
    verifier((await pl.$$eval('#f-statut option', os => os.map(o => o.textContent.trim()))).join('|') === 'Tous les statuts|En cours|Appliqués|Annulés', 'constat 36 : « Tous les statuts »');
    // (33) un filtre qui ne trouve rien ne prétend pas qu'il n'y a aucun comptage
    await pl.selectOption('#f-entreprise', '2'); await pl.selectOption('#f-statut', 'applique');
    await pl.waitForFunction(() => /ne correspond/.test(document.querySelector('#table-comptages tbody').textContent));
    verifier((await texte(pl, '#table-comptages tbody')) === 'Aucun comptage ne correspond à ces filtres.', 'constat 33 : « Aucun comptage ne correspond à ces filtres. » (et non « pour le moment ») : ' + await texte(pl, '#table-comptages tbody'));
    // (15/29) écran de comptage non à l'aveugle (6 colonnes) : les codes ne se coupent pas
    for (const [w, h] of [[768, 1024], [1024, 768]]) {
      await pl.setViewportSize({ width: w, height: h });
      await L.aller(pl, 'comptage_voir&id=' + CE); await pl.waitForSelector('#cv-table tbody tr td.code');
      const lignes = await pl.$$eval('#cv-table tbody td.code, #cv-non-corps td.code', tds => tds.map(td => { const r = document.createRange(); r.selectNodeContents(td); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; }));
      verifier(lignes.length >= 4 && lignes.every(n => n === 1), 'constats 15/29 : les codes pièce tiennent sur UNE ligne à ' + w + ' px (' + lignes + ')');
    }
    // (39) « Actualiser » est bien à droite de sa carte
    await pl.setViewportSize({ width: 1280, height: 900 });
    await L.aller(pl, 'comptage_voir&id=' + CE); await pl.waitForSelector('#cv-statut');
    const al = await pl.evaluate(() => { const b = document.querySelector('#btn-actualiser').getBoundingClientRect(), h = document.querySelector('#btn-actualiser').closest('.card-header').getBoundingClientRect(); return [b.right, h.right]; });
    verifier(al[1] - al[0] < 40, 'constat 39 : « Actualiser » aligné à droite de la carte (bord ' + Math.round(al[0]) + ' / carte ' + Math.round(al[1]) + ')');
    // (35) changer « non scannées à 0 » oblige à confirmer de nouveau
    await pl.click('#btn-appliquer'); await pl.waitForSelector('#ap-table');
    await cocher(pl, '#ap-ok', true);
    verifier(!(await pl.locator('#ap-confirmer').isDisabled()), 'confirmation donnée : bouton actif');
    await cocher(pl, '#ap-zero', true);
    verifier(!(await pl.isChecked('#ap-ok')) && await pl.locator('#ap-confirmer').isDisabled(), 'constat 35 : cocher « non scannées à 0 » décoche la confirmation et désactive le bouton');
    await cocher(pl, '#ap-ok', true); await cocher(pl, '#ap-zero', false);
    verifier(!(await pl.isChecked('#ap-ok')) && await pl.locator('#ap-confirmer').isDisabled(), 'constat 35 : la décocher aussi');
    await pl.click('#modal-appliquer [data-dismiss="modal"] >> text=Fermer'); await pl.waitForSelector('#modal-appliquer.show', { state: 'hidden' });
    // fin : le comptage de l'employé est annulé
    await pl.click('#btn-annuler'); await pl.waitForSelector('#modal-annuler.show'); await pl.click('#an-confirmer');
    await pl.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(reelles(pl).length === 0, 'console propre (liste et écran de comptage) : ' + JSON.stringify(reelles(pl)));
    await pl.context().close();
  });

  await section('Constats 16, 31, 32, 36, 37, 38 : page Scanner — libellés, accessibilité, focus visible, contrastes, défilement', async () => {
    const ps = suivre(await L.nouvellePage(browser, { width: 1024, height: 768 }));
    await L.connecter(ps, 'gestionnaire');
    await L.aller(ps, 'scanner');
    const contrastes = sels => ps.evaluate(sels => {
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const parse = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
      const fond = el => { for (let x = el; x; x = x.parentElement) { const c = parse(getComputedStyle(x).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.99)) { return c.slice(0, 3); } } return [255, 255, 255]; };
      return sels.map(([sel, pseudo]) => { const el = document.querySelector(sel); if (!el) { return [sel, null]; } const f = parse(getComputedStyle(el, pseudo || null).color).slice(0, 3), b = fond(el); const a = lum(f), c = lum(b); return [sel, Math.round(((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)) * 100) / 100]; });
    }, sels);
    // (36) libellés
    verifier((await texte(ps, '#btn-clavier')) === 'Clavier à l\'écran', 'constat 36 : bouton « Clavier à l\'écran »');
    // (31) champ de scan : état actif visible, état inactif distinct
    const etatScan = () => ps.$eval('#scan', el => { const b = el.closest('.scan-box'), c = getComputedStyle(b); return { ombre: c.boxShadow, bordure: c.borderTopColor, fond: c.backgroundColor, invite: el.getAttribute('placeholder') }; });
    await ps.focus('#scan'); await attendre(400); const actif = await etatScan();
    await attendre(400);
    await ps.evaluate(() => document.activeElement.blur()); await attendre(400); const inactif = await etatScan();
    verifier(actif.ombre !== 'none' && actif.ombre !== inactif.ombre && actif.bordure !== inactif.bordure && actif.fond !== inactif.fond, 'constat 31 : le champ de scan actif se distingue nettement de l\'inactif : ' + JSON.stringify([actif, inactif]));
    verifier(/inactif/.test(inactif.invite) && /Scannez/.test(actif.invite), 'constat 31 : le texte d\'invite dit « Champ inactif » sans le focus');
    await ps.focus('#emp-choix');
    verifier(/rgba\(11, 94, 215/.test(await ps.$eval('#emp-choix', el => getComputedStyle(el).boxShadow)), 'constat 31 : la liste d\'emplacements a un halo de focus visible');
    // fiche d'une pièce (gestionnaire) : accessibilité, libellés, contrastes
    await L.scanner(ps, '#scan', 'P-0001'); await ps.waitForSelector('#sc-resultat .sc-fiche');
    await ps.waitForFunction(() => /Fiche de P-0001/.test(document.querySelector('#sc-annonce').textContent));
    verifier((await ps.textContent('#sc-annonce')).includes('Fiche de P-0001, Thermocouple 36 po'), 'constat 37 : le résultat est annoncé aux lecteurs d\'écran (zone vocale) : ' + await ps.textContent('#sc-annonce'));
    verifier(await ps.getByRole('combobox', { name: /Chercher une pièce par son nom/ }).count() >= 1, 'constat 37 : le champ de recherche a pour nom accessible son étiquette');
    const voir = await ps.$$eval('.sc-voir-emp', bs => bs.map(b => b.getAttribute('aria-label')));
    verifier(voir.length >= 1 && voir.every(a => a.startsWith('Voir le contenu — ')), 'constat 36 : aria-label « Voir le contenu — {emplacement} » (sans élision fautive) : ' + voir);
    const th = await ps.$$eval('#sc-resultat table[aria-label="Prix chez les fournisseurs"] th', ts => ts.map(t => t.textContent.trim()));
    verifier(JSON.stringify(th) === JSON.stringify(['Fournisseur', 'N° fournisseur', 'Prix', 'Date']), 'constat 36 : « N° fournisseur » et « Date » comme dans le catalogue : ' + th);
    const c1 = await contrastes([['#sc-resultat .badge-info'], ['#sc-resultat .badge-success'], ['#scan', '::placeholder']]);
    verifier(c1.every(([, r]) => r !== null && r >= 4.5), 'constat 32 : contrastes ≥ 4,5:1 (catégorie, « Meilleur prix », invite du champ de scan) : ' + JSON.stringify(c1));
    await L.scanner(ps, '#scan', 'P-0003'); await ps.waitForSelector('#sc-resultat .sc-alerte');
    const c2 = await contrastes([['.sc-ent small']]);
    verifier(c2[0][1] >= 4.5, 'constat 32 : « (minimum 20) » lisible : ' + JSON.stringify(c2));
    // (38) le résultat est amené à l'écran (tablette en paysage)
    await L.scanner(ps, '#scan', 'P-0001'); await ps.waitForFunction(() => /P-0001/.test((document.querySelector('#sc-resultat .sc-code') || { textContent: '' }).textContent));
    await attendre(300);
    const haut = await ps.$eval('#sc-resultat .sc-nom', el => el.getBoundingClientRect().top);
    verifier(haut >= 0 && haut < 260, 'constat 38 : à 1024 × 768 le nom de la pièce est amené en haut de l\'écran après le scan (y = ' + Math.round(haut) + ')');
    verifier(await focusId(ps) === 'scan', 'le curseur est toujours dans le champ de scan après le défilement');
    const alEff = await ps.evaluate(() => { const b = document.querySelector('#sc-vider-hist').getBoundingClientRect(), h = document.querySelector('#sc-vider-hist').closest('.card-header').getBoundingClientRect(); return [b.right, h.right]; });
    verifier(alEff[1] - alEff[0] < 40, 'constat 39 : « Effacer » aligné à droite de la carte « Derniers scans » (bord ' + Math.round(alEff[0]) + ' / carte ' + Math.round(alEff[1]) + ')');
    // (16) valeur d'un emplacement : mention de l'arrondi
    await L.scanner(ps, '#scan', 'EMP-000003'); await ps.waitForSelector('#sc-resultat .sc-fiche-emp');
    verifier((await texte(ps, '#sc-resume-emp')).includes('arrondie sur l\'ensemble') && (await texte(ps, '#sc-resume-emp')).includes('quelques sous'), 'constat 16 : la valeur totale dit qu\'elle est arrondie sur l\'ensemble : ' + await texte(ps, '#sc-resume-emp'));
    // (36) pièce désactivée : UN seul message, avec la marche à suivre
    await L.scanner(ps, '#scan', 'P-0014'); await ps.waitForSelector('#sc-resultat .badge-secondary');
    verifier(await ps.locator('#sc-messages .alert').count() === 0 && await ps.locator('#sc-resultat .alert-secondary').count() === 1 && (await texte(ps, '#sc-resultat .alert-secondary')).includes('demandez à un gestionnaire'), 'constat 36 : pièce désactivée : un seul message de désactivation (plus de bandeau jaune redondant), avec la marche à suivre');
    await ps.waitForFunction(() => /désactivée/.test(document.querySelector('#sc-annonce').textContent));
    verifier(true, 'la désactivation est aussi annoncée aux lecteurs d\'écran');
    // constats 32 (suite) : contrastes sur l'écran de comptage (message d'approbation = employé ; badge « Appliqué » ; quantité plus grosse)
    await ps.goto(L.BASE + '/index.php?page=comptage_voir&id=' + C1); await ps.waitForSelector('#cv-statut');
    const c4 = await contrastes([['#cv-statut.badge-success'], ['#cv-nb.badge-info']]);
    verifier(c4.every(([, r]) => r !== null && r >= 4.5), 'constat 32 : badges « Appliqué » et compteur lisibles : ' + JSON.stringify(c4));
    await ps.context().close();
    // quantité comptée plus grosse et alertes lisibles, vues d'un employé
    await L.aller(e, 'comptage'); await e.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await e.selectOption('#nouveau-emp', '3'); await Promise.all([e.waitForURL(/comptage_voir/), e.click('#btn-nouveau')]); await e.waitForSelector('#cv-statut');
    const CQ = idComptage(3);
    await rafale(e, ['P-0001']); await fileVide(e);
    verifier(await e.$eval('#cv-table .cp-qte', el => parseFloat(getComputedStyle(el).fontSize)) >= 16, 'constat 32 : la quantité comptée est en 16 px au moins');
    await e.click('#btn-approbation');
    const cr = await e.evaluate(() => {
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const p = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const a = document.querySelector('#cv-alerte .alert-info'), c = getComputedStyle(a); const x = lum(p(c.color)), y = lum(p(c.backgroundColor));
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    });
    verifier(cr >= 4.5, 'constat 32 : message « À faire approuver » (alert-info) lisible : ' + cr.toFixed(2));
    await e.click('#btn-annuler'); await e.waitForSelector('#modal-annuler.show'); await e.click('#an-confirmer');
    await e.waitForFunction(() => document.querySelector('#cv-statut').textContent === 'Annulé');
    verifier(sql('SELECT statut FROM comptages WHERE id = ' + CQ) === 'annule', 'comptage de contrôle annulé');
  });

  await section('Constat 5 : tablette à 768 px — la barre latérale repliée ne laisse aucune bande visible', async () => {
    const t = suivre(await L.nouvellePage(browser, { width: 768, height: 1024 }));
    await L.connecter(t, 'employe');
    await L.aller(t, 'comptage');
    const m = await t.evaluate(() => { const a = document.querySelector('.main-sidebar').getBoundingClientRect(), b = document.querySelector('[data-widget=pushmenu]').getBoundingClientRect(); const x = document.elementFromPoint(b.left + 3, b.top + b.height / 2); return { droite: a.right, bouton: !!(x && x.closest('[data-widget=pushmenu]')), titre: document.querySelector('h1').getBoundingClientRect().left }; });
    verifier(m.droite <= 1 && m.bouton && m.titre >= 0, 'constat 5 : barre latérale entièrement hors écran (bord droit ' + m.droite + ' px), bouton de menu cliquable sur toute sa largeur, titre entier');
    await t.click('[data-widget=pushmenu]', { position: { x: 3, y: 10 } });
    await t.waitForSelector('body.sidebar-open');
    verifier(await t.locator('.main-sidebar').isVisible(), 'le menu s\'ouvre');
    await t.context().close();
  });

  await section('Pièce désactivée : un comptage peut remettre son stock à 0 (un stock n\'est jamais « bloqué »)', async () => {
    await L.aller(g, 'comptage'); await g.waitForFunction(() => !document.querySelector('#nouveau-emp').disabled);
    await L.scanner(g, '#scan', 'EMP-000005'); await g.waitForURL(/comptage_voir/); await g.waitForSelector('#cv-statut');
    verifier(stock('P-0014', 5) === '1.000' && sql("SELECT actif FROM pieces WHERE code = 'P-0014'") === '0', 'préparation : P-0014 est désactivée et il en reste 1 à la boutique');
    await g.click('#btn-appliquer'); await g.waitForSelector('#ap-bilan');
    await cocher(g, '#ap-zero', true);
    verifier((await texte(g, '#ap-zero-zone')).includes('P-0014') && (await texte(g, '#ap-zero-zone')).includes('désactivée') && await g.locator('#ap-bloque').isHidden(), 'la pièce désactivée figure parmi les pièces remises à 0, sans blocage : ' + await texte(g, '#ap-zero-zone'));
    await cocher(g, '#ap-ok', true);
    verifier(!(await g.locator('#ap-confirmer').isDisabled()), 'l\'application reste possible');
    await g.click('#ap-confirmer'); await g.waitForSelector('#lien-ajustement-resultat');
    verifier(stock('P-0014', 5) === '0.000' && invariantOk(), 'le stock de la pièce désactivée est remis à 0 ; invariant tenu');
  });

  // =====================================================================================================================
  //  Bilan
  // =====================================================================================================================
  verifier(invariantOk(), 'invariant final : stock = somme des mouvements, aucun stock négatif');
  verifier(dialogues.length === 0, 'aucune boîte de dialogue JavaScript (XSS) : ' + JSON.stringify(dialogues));
  for (const p of pages) verifier(reelles(p).length === 0, 'aucune erreur JavaScript ni console : ' + JSON.stringify(reelles(p)));
  const journal = fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, 'utf8').slice(OFFSET_LOG) : '';
  const problemes = journal.split('\n').filter(l => /Warning|Notice|Fatal|Deprecated|Parse error|Stack trace|PDOException|SQLSTATE/i.test(l));
  verifier(problemes.length === 0, 'journal PHP propre : ' + problemes.slice(0, 3).join(' | '));
  await browser.close();
  reset();
  console.log('Sections : ' + sections.join(' ; '));
  process.exit(L.bilan());
})().catch(err => { console.error(err); process.exit(1); });
