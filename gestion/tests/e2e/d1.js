// Test de bout en bout du module D1 — Scanner / chercher et comptage d'inventaire.
//   cd gestion && tools/serveur.sh start bea_d1 8105 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8105 DB_NAME=bea_d1 node tests/e2e/d1.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), crée ses propres données
// (compte gest_bea = gestionnaire de l'entreprise 1 seulement ; pièces renommées / désactivées) et la remet à zéro à la fin.
// Il suppose donc un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_d1) ; le journal PHP est lu
// dans /tmp/bea-<port>.log (port de BASE_URL) et ne doit contenir aucun avertissement.
// Les valeurs attendues (stock, écarts, ajustements) sont recalculées par des requêtes SQL indépendantes du service d'inventaire.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_d1';
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
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
    verifier(f.includes('Contrôles') && f.includes('Unité : unité'), 'catégorie et unité');
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
    await e.fill('#cv-table tr[data-piece="' + P3 + '"] .cp-qte', 'abc');
    await e.press('#cv-table tr[data-piece="' + P3 + '"] .cp-qte', 'Enter');
    await e.waitForFunction(() => /invalide/i.test(document.querySelector('#cv-alerte').textContent));
    verifier((await lignesComptage(e)).find(x => x.code === 'P-0003').compte === '2', 'quantité invalide refusée : la valeur précédente revient');
    await e.fill('#cv-table tr[data-piece="' + P3 + '"] .cp-qte', '-4');
    await e.press('#cv-table tr[data-piece="' + P3 + '"] .cp-qte', 'Enter');
    await e.waitForFunction(() => /invalide/i.test(document.querySelector('#cv-alerte').textContent));
    verifier(sql("SELECT quantite_comptee FROM comptage_lignes WHERE comptage_id = " + C1 + " AND piece_id = " + P3) === '2.000', 'quantité négative refusée');
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
      verifier(r1.status === 400 && /accès/.test(r1.json.erreur) && !/P-0010/.test(r1.texte), qui + ' : detail refusé : ' + r1.texte);
      const r2 = await appel(p, 'app/action/comptage_scan.php', { id: C5, code: 'P-0010', mode: 'ajouter', quantite: '1' });
      verifier(r2.status === 400 && /accès/.test(r2.json.erreur), qui + ' : scan refusé : ' + r2.texte);
      const r3 = await appel(p, 'app/action/comptage_retirer.php', { id: C5, piece_id: P9 });
      verifier(r3.status === 400 && /accès/.test(r3.json.erreur), qui + ' : retrait refusé');
      const r4 = await appel(p, 'app/action/comptage_annuler.php', { id: C5 });
      verifier(r4.status === 400 && /accès/.test(r4.json.erreur), qui + ' : annulation refusée');
      const r5 = await appel(p, 'app/action/comptage_appliquer.php', { id: C5, zero_non_scannees: true });
      verifier(r5.status === 400 && /(accès|permission)/.test(r5.json.erreur), qui + ' : application refusée : ' + r5.texte);
      const r6 = await appel(p, 'app/ajax/comptage_apercu.php?id=' + C5, null);
      verifier(r6.status === 400 && /(accès|permission)/.test(r6.json.erreur), qui + ' : aperçu refusé');
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
    const hauteurs = await t.$$eval('#btn-camera, #btn-clavier, #sc-resultat .sc-actions .btn, #sc-resultat .sc-voir-emp', bs => bs.map(b => b.getBoundingClientRect().height));
    verifier(hauteurs.length >= 6 && hauteurs.every(h => h >= 38), 'scanner : zones cliquables ≥ 38 px (' + hauteurs.map(h => Math.round(h)) + ')');
    verifier(await t.evaluate(() => document.querySelector('#scan').getBoundingClientRect().height) >= 44, 'scanner : champ de scan ≥ 44 px');
    verifier(await t.getAttribute('#scan', 'inputmode') === 'none', 'scanner : pas de clavier tactile par défaut');
    await t.click('#btn-clavier');
    verifier(await t.getAttribute('#scan', 'inputmode') === 'text', 'bouton Clavier : le clavier tactile peut s\'afficher');
    await L.scanner(t, '#scan', 'EMP-000003'); await t.waitForSelector('#sc-resultat .sc-fiche-emp');
    await sansDebordement('scanner (emplacement)');
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
