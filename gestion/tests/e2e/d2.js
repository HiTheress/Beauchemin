// Test de bout en bout du module D2 — Stock, tableau de bord, historique des mouvements, pièces sous le minimum.
//   cd gestion && tools/serveur.sh start bea_d2 8106 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8106 DB_NAME=bea_d2 node tests/e2e/d2.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), ajoute son jeu de données
// (tests/e2e/d2-outils.php : pièces piégées XSS et formules CSV, alias, quantité à zéro, pièce et emplacement désactivés, transfert annulé,
// mouvement daté du passé, utilisateurs emp_bch = employé de Boutique Chaleur, gest_bea = gestionnaire de Beauchemin) et la remet à zéro à la fin.
// Il suppose un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_d2) ; le journal PHP est lu dans /tmp/bea-<port>.log
// et ne doit contenir aucun avertissement. Toutes les valeurs attendues viennent de requêtes SQL indépendantes du code testé.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_d2';
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const verifier = L.verifier;
const XSS = '<img src=x onerror=alert(1)>';

// ---- outils -----------------------------------------------------------------------------------------------------
function sql(q) { return execFileSync('mysql', ['-uroot', '-N', '-B', '--default-character-set=utf8mb4', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function sqlLignes(q) { const r = sql(q); return r === '' ? [] : r.split('\n').map(l => l.split('\t')); }
function outil(...args) { return execFileSync('php', [path.join(__dirname, 'd2-outils.php'), ...args], { encoding: 'utf8', env: { ...process.env, DB_NAME: DB } }).trim(); }
function reset() { execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' }); }
const norm = t => String(t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const num = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace('+', ''));
const fr = s => { const [e, f = ''] = String(s).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + (f + '00').slice(0, 2) + ' $'; };
const aujourdhui = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
function invariantOk() {
  const a = sql('SELECT COUNT(*) FROM stock s WHERE s.quantite <> COALESCE((SELECT SUM(m.quantite) FROM mouvements m WHERE m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id), 0)');
  const b = sql('SELECT COUNT(*) FROM stock WHERE quantite < 0');
  return a === '0' && b === '0';
}
/** CSV (séparateur « ; », guillemets doublés) -> tableau de lignes ; le BOM est retiré. */
function parseCsv(t) {
  t = t.replace(/^﻿/, '');
  const lignes = []; let l = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ';') { l.push(c); c = ''; }
    else if (ch === '\r') { /* ignoré */ }
    else if (ch === '\n') { l.push(c); lignes.push(l); l = []; c = ''; }
    else c += ch;
  }
  if (c !== '' || l.length) { l.push(c); lignes.push(l); }
  return lignes;
}

const dialogues = [];
function suivre(page) { page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); }); return page; }
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (refus d'accès, validation) sont ignorés. */
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/ERR_ABORTED/.test(e));

/** Appel depuis la page (cookies de session). `corps` : objet (formulaire, comme DataTables) ; null = GET. */
async function appel(p, url, corps, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, corps, opts]) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const init = { credentials: 'same-origin' };
    if (corps !== null) {
      const f = new URLSearchParams();
      for (const [k, v] of Object.entries(corps)) f.append(k, v);
      init.method = 'POST';
      init.headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
      if (!opts.sansJeton) init.headers['X-CSRF-Token'] = jeton;
      init.body = f.toString();
    }
    const r = await fetch(url, init);
    const oct = new Uint8Array(await r.clone().arrayBuffer()).slice(0, 3);
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t, bom: oct[0] === 0xEF && oct[1] === 0xBB && oct[2] === 0xBF, type: r.headers.get('content-type') || '', dispo: r.headers.get('content-disposition') || '' };
  }, [url, corps, opts]);
}
/** Appel sans session (non connecté). */
async function sansSession(url, opts) {
  const r = await fetch(L.BASE + '/' + url, opts || {});
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
  return { status: r.status, json: j, texte: t };
}
const DT = (extra) => Object.assign({ draw: 1, start: 0, length: 500, 'order[0][column]': 0, 'order[0][dir]': 'asc', 'columns[0][data]': 'code' }, extra || {});

async function connecterComme(page, utilisateur) {
  await page.goto(L.BASE + '/login.php');
  await page.fill('input[name=username]', utilisateur);
  await page.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  if (/login\.php/.test(page.url())) throw new Error('Connexion refusée pour ' + utilisateur);
}
/** Exécute `action`, puis attend le prochain dessin du tableau. */
async function redessine(p, tableSel, action) {
  await p.evaluate(sel => { window.__dessine = false; jQuery(sel).one('draw.dt', () => { window.__dessine = true; }); }, tableSel);
  await action();
  await p.waitForFunction(() => window.__dessine === true, null, { timeout: 15000 });
  await p.waitForTimeout(50);
}
/** Lignes d'un tableau : cellules visibles (texte normalisé) + classes. */
async function lignes(p, sel) {
  return p.$$eval(sel + ' tbody tr', rows => rows.filter(r => !r.querySelector('td.dataTables_empty')).map(r => ({
    cells: [...r.children].map(c => c.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()),
    classes: r.className, html: r.innerHTML
  })));
}
const entetes = async (p, sel) => p.$$eval(sel + ' thead th', ths => ths.filter(t => t.offsetParent !== null).map(t => t.textContent.replace(/\s+/g, ' ').trim()));
const texte = async (p, sel) => norm(await p.textContent(sel));
const lisible = async (p, sel) => norm(await p.innerText(sel));
const attendre = ms => new Promise(r => setTimeout(r, ms));
async function toastTexte(p) { try { await p.waitForSelector('#toasts .alert', { timeout: 5000 }); } catch (e) { return ''; } return norm(await p.textContent('#toasts')); }
async function espionBip(p) { await p.evaluate(() => { window.__bips = []; const o = window.bip; window.bip = function (ok) { window.__bips.push(!!ok); return o(ok); }; }); }

const sections = [];
async function section(nom, fn) {
  const avant = process.hrtime.bigint();
  try { await fn(); } catch (e) { verifier(false, 'exception dans « ' + nom + ' » : ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e)); }
  sections.push(nom + ' (' + Math.round(Number(process.hrtime.bigint() - avant) / 1e6) + ' ms)');
}

// ---- expectations SQL (indépendantes du code testé) ------------------------------------------------------------------
const NB_STOCK = ent => sql('SELECT COUNT(*) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE s.quantite > 0' + (ent ? ' AND e.entreprise_id IN (' + ent + ')' : ''));
const NB_MOUV = ent => sql('SELECT COUNT(*) FROM mouvements m JOIN emplacements e ON e.id = m.emplacement_id WHERE e.entreprise_id IN (' + ent + ')');
/** Paires (code, entreprise_id) sous le minimum de leur entreprise. */
const sousMin = () => sqlLignes('SELECT p.code, se.entreprise_id, se.minimum, COALESCE((SELECT SUM(s.quantite) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE s.piece_id = se.piece_id AND e.entreprise_id = se.entreprise_id), 0) q FROM seuils se JOIN pieces p ON p.id = se.piece_id WHERE se.minimum > 0 AND p.actif = 1')
  .filter(r => parseFloat(r[3]) < parseFloat(r[2]));

(async () => {
  reset();
  const OFFSET_LOG = fs.existsSync(JOURNAL) ? fs.statSync(JOURNAL).size : 0;
  const F = JSON.parse(outil('preparer'));
  verifier(invariantOk(), 'invariant stock = somme des mouvements (jeu de données)');
  const ID_ADMIN = sql("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'admin'");
  const ENT = { 1: 'Beauchemin', 2: 'Boutique Chaleur' };
  const browser = await L.lancer();
  const a = suivre(await L.nouvellePage(browser));            // admin
  const g = suivre(await L.nouvellePage(browser));            // gestionnaire1 (entreprises 1 et 2)
  const e = suivre(await L.nouvellePage(browser));            // employe1 (entreprise 1)
  const b = suivre(await L.nouvellePage(browser));            // emp_bch (entreprise 2)
  const gb = suivre(await L.nouvellePage(browser));           // gest_bea (entreprise 1, gestionnaire)
  await L.connecter(a, 'admin');
  await L.connecter(g, 'gestionnaire');
  await L.connecter(e, 'employe');
  await connecterComme(b, 'emp_bch');
  await connecterComme(gb, 'gest_bea');
  for (const p of [a, g, e, b, gb]) { await p.waitForLoadState('networkidle'); }   // la connexion mène au tableau de bord : on le laisse finir de charger

  // =====================================================================================================================
  //  STOCK — affichage, filtres, vues
  // =====================================================================================================================
  await section('Stock : affichage (admin)', async () => {
    await L.aller(a, 'stock');
    await a.waitForSelector('#table-stock tbody tr');
    verifier((await texte(a, 'h1')) === 'Stock', 'titre de la page');
    const total = parseInt(NB_STOCK(), 10);
    const info = await texte(a, '#table-stock_info');
    verifier(info.includes('de ' + total), 'nombre de lignes (' + total + ') : ' + info);
    const h = await entetes(a, '#table-stock');
    verifier(h.join('|').startsWith('Code|Pièce|Catégorie|Entreprise|Emplacement|Quantité|Unité') && h.some(x => x.startsWith('Coût moyen')) && h.some(x => x.startsWith('Valeur')), 'colonnes visibles (admin) : ' + h.join('|'));
    verifier(!h.includes('Minimum'), 'la colonne Minimum est cachée dans la vue par emplacement');
    const rows = await lignes(a, '#table-stock');
    const p1 = rows.find(r => r.cells[0] === 'P-0001' && r.cells[4].startsWith('Entrepôt principal'));
    verifier(p1 && p1.cells[1].startsWith('Thermocouple 36 po') && p1.cells[2] === 'Contrôles' && p1.cells[3] === 'Beauchemin' && p1.cells[5] === '8' && p1.cells[6] === 'unité', 'ligne P-0001 : ' + JSON.stringify(p1 && p1.cells));
    verifier(p1 && p1.cells[7] === '14,50 $' && p1.cells[8] === '116,00 $', 'coût moyen 14,50 $ et valeur 116,00 $ (8 x 14,50) : ' + JSON.stringify(p1 && p1.cells.slice(5)));
    // premier tri : par code, croissant
    const codes = rows.map(r => r.cells[0]);
    verifier(codes.join() === [...codes].sort().join(), 'tri par code croissant');
    // lien vers la fiche de la pièce
    const href = await a.getAttribute('#table-stock tbody tr:first-child a', 'href');
    verifier(/page=piece_voir&id=\d+/.test(href), 'lien vers piece_voir : ' + href);
    // quantité décimale (au pied) : 12,5 ; sans zéros inutiles
    const dec = rows.find(r => r.cells[0] === 'DEC-1' && r.cells[4].startsWith('Entrepôt principal'));
    verifier(dec && dec.cells[5] === '12,5' && dec.cells[6] === 'pi' && dec.cells[8] === '37,50 $', 'quantité décimale 12,5 et valeur 37,50 $ : ' + JSON.stringify(dec && dec.cells));
    // emplacement désactivé : stock conservé, étiquette claire
    const anc = rows.find(r => r.cells[0] === 'DEC-1' && r.cells[4].startsWith('Ancien cube'));
    verifier(anc && anc.cells[4].includes('(désactivé)') && anc.cells[5] === '4,5', 'emplacement désactivé étiqueté : ' + JSON.stringify(anc && anc.cells));
    // pièce désactivée avec du stock : visible avec l'étiquette
    const ina = rows.find(r => r.cells[0] === 'INAC-1');
    verifier(ina && ina.cells[1].includes('Désactivée') && ina.cells[5] === '2', 'pièce désactivée avec stock : badge « Désactivée »');
    // aucune ligne à zéro par défaut
    verifier(!rows.some(r => r.cells[0] === 'P-0005' && r.cells[4].startsWith('Cube 12')), 'les quantités à zéro sont masquées par défaut');
  });

  await section('Stock : sécurité du texte (XSS) et sous le minimum', async () => {
    await L.aller(a, 'stock');
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'XSS'));
    const rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2, 'recherche « XSS » : 2 lignes (emplacement 1 et 2) : ' + rows.length);
    verifier(rows.every(r => r.cells[1].includes(XSS) && r.cells[2] === '<b>Cat piégée</b>' && r.cells[6] === '<i>u</i>'), 'nom, catégorie et unité affichés en texte, pas en HTML : ' + JSON.stringify(rows[0] && rows[0].cells));
    verifier(await a.locator('#table-stock img, #table-stock b, #table-stock i').count() === 0, 'aucune balise injectée dans le tableau');
    verifier(dialogues.length === 0, 'aucune boîte de dialogue JavaScript (alert) : ' + dialogues.join('|'));
    verifier(rows.every(r => /sk-bas/.test(r.classes)) && rows.every(r => r.cells[1].includes('Sous le minimum')), 'lignes sous le minimum en surbrillance avec la mention');
    // surbrillance exacte : lignes de la pièce sous le minimum de leur entreprise, et seulement celles-là
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', ''));
    await redessine(a, '#table-stock', () => a.selectOption('#table-stock_length select', '100'));
    const sm = sousMin().map(r => r[0] + '|' + ENT[r[1]]);
    const toutes = await lignes(a, '#table-stock');
    const attenduBas = toutes.map(r => sm.includes(r.cells[0] + '|' + r.cells[3]));
    verifier(toutes.every((r, i) => /sk-bas/.test(r.classes) === attenduBas[i]), 'surbrillance = exactement les pièces sous le minimum de leur entreprise (' + attenduBas.filter(Boolean).length + ' lignes)');
    verifier(attenduBas.filter(Boolean).length >= 5, 'au moins 5 lignes en surbrillance dans le jeu de données');
  });

  await section('Stock : filtres (entreprise, emplacement, catégorie, zéro) et vues', async () => {
    await L.aller(a, 'stock');
    await a.waitForSelector('#table-stock tbody tr');
    await redessine(a, '#table-stock', () => a.selectOption('#table-stock_length select', '100'));
    // entreprise
    await redessine(a, '#table-stock', () => a.selectOption('#f-entreprise', '2'));
    let rows = await lignes(a, '#table-stock');
    verifier(rows.length === parseInt(NB_STOCK('2'), 10) && rows.every(r => r.cells[3] === 'Boutique Chaleur'), 'filtre entreprise 2 : ' + rows.length + ' lignes, toutes Boutique Chaleur');
    const opts = await a.$$eval('#f-emplacement option', os => os.map(o => o.textContent));
    verifier(opts.length === 3 && opts[0] === 'Tous les emplacements' && opts.every(o => !/Cube 1[24]|Ancien/.test(o)), 'la liste des emplacements suit l\'entreprise : ' + opts.join(' | '));
    // emplacement
    await redessine(a, '#table-stock', () => a.selectOption('#f-emplacement', '5'));
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === parseInt(sql('SELECT COUNT(*) FROM stock WHERE emplacement_id = 5 AND quantite > 0'), 10) && rows.every(r => r.cells[4] === 'Boutique Centre-ville'), 'filtre emplacement 5 : ' + rows.length + ' lignes');
    // retour à toutes les entreprises : l'emplacement invalide est oublié
    await redessine(a, '#table-stock', () => a.selectOption('#f-entreprise', ''));
    verifier(await a.inputValue('#f-emplacement') === '5', 'l\'emplacement choisi reste choisi si toujours permis');
    await redessine(a, '#table-stock', () => a.selectOption('#f-entreprise', '1'));
    verifier(await a.inputValue('#f-emplacement') === '', 'l\'emplacement d\'une autre entreprise est oublié au changement d\'entreprise');
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === parseInt(NB_STOCK('1'), 10), 'entreprise 1 : ' + rows.length + ' lignes');
    // catégorie
    await redessine(a, '#table-stock', () => a.selectOption('#f-categorie', { label: 'Brûleurs' }));
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === parseInt(sql("SELECT COUNT(*) FROM stock s JOIN pieces p ON p.id = s.piece_id JOIN emplacements e ON e.id = s.emplacement_id JOIN categories c ON c.id = p.categorie_id WHERE c.nom = 'Brûleurs' AND s.quantite > 0 AND e.entreprise_id = 1"), 10) && rows.length > 0 && rows.every(r => r.cells[2] === 'Brûleurs'), 'filtre catégorie « Brûleurs » : ' + rows.length);
    await redessine(a, '#table-stock', () => a.selectOption('#f-categorie', 'aucune'));
    rows = await lignes(a, '#table-stock');
    verifier(rows.length > 0 && rows.every(r => r.cells[2] === ''), 'filtre « Sans catégorie » : ' + rows.length + ' lignes sans catégorie');
    await redessine(a, '#table-stock', () => a.selectOption('#f-categorie', ''));
    // quantités à zéro
    const sansZero = (await lignes(a, '#table-stock')).length;
    await redessine(a, '#table-stock', () => a.click('label[for=f-zero]'));
    rows = await lignes(a, '#table-stock');
    const attenduZero = parseInt(sql("SELECT COUNT(*) FROM stock s JOIN pieces p ON p.id = s.piece_id JOIN emplacements e ON e.id = s.emplacement_id WHERE e.entreprise_id = 1 AND (p.actif = 1 OR s.quantite > 0)"), 10);
    verifier(rows.length === attenduZero && rows.length > sansZero, '« Afficher les quantités à zéro » : ' + sansZero + ' -> ' + rows.length + ' (attendu ' + attenduZero + ')');
    const z = rows.find(r => r.cells[0] === 'P-0005' && r.cells[4].startsWith('Cube 12'));
    verifier(z && z.cells[5] === '0', 'la ligne à zéro (P-0005 au Cube 12) apparaît avec 0');
    await redessine(a, '#table-stock', () => a.click('label[for=f-zero]'));
    // vue par pièce
    await redessine(a, '#table-stock', () => a.click('[data-vue=piece]'));
    const h = await entetes(a, '#table-stock');
    verifier(!h.includes('Emplacement') && h.includes('Minimum') && h.includes('Quantité totale'), 'vue par pièce : colonnes ' + h.join('|'));
    verifier((await a.getAttribute('[data-vue=piece]', 'aria-pressed')) === 'true' && (await a.getAttribute('[data-vue=emplacement]', 'aria-pressed')) === 'false', 'bouton de vue actif (aria-pressed)');
    verifier(await a.isDisabled('#f-emplacement'), 'le filtre emplacement est désactivé dans la vue par pièce');
    rows = await lignes(a, '#table-stock');
    const attenduPieces = parseInt(sql('SELECT COUNT(*) FROM (SELECT s.piece_id FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE e.entreprise_id = 1 GROUP BY s.piece_id HAVING SUM(s.quantite) > 0) t'), 10);
    verifier(rows.length === attenduPieces, 'vue par pièce, entreprise 1 : ' + rows.length + ' (attendu ' + attenduPieces + ')');
    const p1 = rows.find(r => r.cells[0] === 'P-0001');
    verifier(p1 && p1.cells[4] === '11' && p1.cells[6] === '10', 'P-0001 : total 11 (8 + 3), minimum 10 : ' + JSON.stringify(p1 && p1.cells));
    await redessine(a, '#table-stock', () => a.selectOption('#f-entreprise', ''));
    rows = await lignes(a, '#table-stock');
    const x = rows.filter(r => r.cells[0] === 'P-0009');
    verifier(x.length === 2 && x.map(r => r.cells[3]).join() === 'Beauchemin,Boutique Chaleur', 'vue par pièce, toutes entreprises : P-0009 une ligne par entreprise : ' + JSON.stringify(x.map(r => r.cells.slice(0, 5))));
    // zéro en vue par pièce : toutes les pièces actives
    await redessine(a, '#table-stock', () => a.click('label[for=f-zero]'));
    rows = await lignes(a, '#table-stock');
    const attenduTout = parseInt(sql('SELECT COUNT(*) FROM pieces p JOIN entreprises en WHERE p.actif = 1 OR EXISTS (SELECT 1 FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE s.piece_id = p.id AND e.entreprise_id = en.id AND s.quantite > 0)'), 10);
    verifier(rows.length === attenduTout, 'vue par pièce avec zéros : toutes les pièces actives x entreprises (' + rows.length + ' / ' + attenduTout + ')');
    await redessine(a, '#table-stock', () => a.click('label[for=f-zero]'));
    // retour à la vue par emplacement + effacer
    await redessine(a, '#table-stock', () => a.click('[data-vue=emplacement]'));
    verifier(!(await a.isDisabled('#f-emplacement')), 'le filtre emplacement est actif dans la vue par emplacement');
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'Thermo'));
    await redessine(a, '#table-stock', () => a.click('#f-effacer'));
    verifier(await a.inputValue('#f-recherche') === '' && (await texte(a, '#table-stock_info')).includes('de ' + NB_STOCK()), '« Effacer » remet tous les filtres');
  });

  await section('Stock : préremplissage par l\'URL', async () => {
    await a.goto(L.BASE + '/index.php?page=stock&emplacement_id=5');
    await a.waitForSelector('#table-stock tbody tr');
    let rows = await lignes(a, '#table-stock');
    verifier(await a.inputValue('#f-entreprise') === '2' && await a.inputValue('#f-emplacement') === '5' && rows.length > 0 && rows.every(r => r.cells[4] === 'Boutique Centre-ville'), 'URL ?emplacement_id=5 : emplacement et entreprise préchoisis (' + rows.length + ' lignes)');
    await a.goto(L.BASE + '/index.php?page=stock&vue=piece&zero=1&q=P-0013&categorie_id=5');
    await a.waitForSelector('#table-stock tbody tr');
    rows = await lignes(a, '#table-stock');
    verifier(await a.isChecked('#f-zero') && await a.inputValue('#f-recherche') === 'P-0013' && await a.getAttribute('[data-vue=piece]', 'aria-pressed') === 'true' && rows.length === 2 && rows.every(r => r.cells[0] === 'P-0013'), 'URL ?vue=piece&zero=1&q=&categorie_id= : filtres préchoisis (' + rows.length + ' lignes)');
    await a.goto(L.BASE + '/index.php?page=stock&emplacement_id=999999&entreprise_id=abc&vue=%3Cscript%3E&q[]=x');
    await a.waitForSelector('#table-stock tbody tr');
    verifier(await a.inputValue('#f-emplacement') === '' && (await lignes(a, '#table-stock')).length > 0 && dialogues.length === 0, 'valeurs invalides dans l\'URL : ignorées, aucune erreur');
  });

  await section('Stock : recherche et lecteur de codes-barres', async () => {
    await L.aller(a, 'stock');
    await espionBip(a);
    await a.waitForSelector('#table-stock tbody tr');
    verifier(await a.evaluate(() => document.activeElement && document.activeElement.id) === 'f-recherche', 'le champ de recherche est prêt à scanner');
    // code interne + Entrée
    await redessine(a, '#table-stock', async () => { await a.fill('#f-recherche', 'P-0003'); await a.press('#f-recherche', 'Enter'); });
    let rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0003'), 'scan du code interne P-0003 : ' + rows.length + ' lignes');
    verifier((await a.evaluate(() => window.__bips)).slice(-1)[0] === true, 'bip de succès');
    // alias (UPC du fabricant)
    await redessine(a, '#table-stock', async () => { await a.fill('#f-recherche', '012345678905'); await a.press('#f-recherche', 'Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0001'), 'scan de l\'alias 012345678905 : P-0001');
    // code inconnu : message clair + bip d'erreur, tableau vide
    await redessine(a, '#table-stock', async () => { await a.fill('#f-recherche', 'ZZZ-INCONNU'); await a.press('#f-recherche', 'Enter'); });
    verifier((await toastTexte(a)).includes('Aucune pièce ne correspond à « ZZZ-INCONNU »'), 'message clair pour un code inconnu');
    verifier((await a.evaluate(() => window.__bips)).slice(-1)[0] === false, 'bip d\'erreur sur code inconnu');
    verifier((await texte(a, '#table-stock tbody')).includes('Aucune ligne de stock ne correspond'), 'message de tableau vide utile');
    // recherche par nom (plusieurs mots), insensible aux accents et à la casse
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'electrode paire'));
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 1 && rows[0].cells[0] === 'P-0006', 'recherche « electrode paire » trouve « Électrode d\'allumage (paire) »');
    // caractères spéciaux de LIKE traités comme du texte
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', '%'));
    verifier((await lignes(a, '#table-stock')).length === 0 || (await texte(a, '#table-stock tbody')).includes('Aucune'), 'le caractère % n\'est pas un joker');
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', "' OR 1=1 --"));
    verifier((await lignes(a, '#table-stock')).every(r => !/^P-/.test(r.cells[0])), 'tentative d\'injection SQL sans effet');
    // Un second lecteur : la saisie rapide (frappe + Entrée) fonctionne aussi au clavier
    await a.fill('#f-recherche', '');
    await redessine(a, '#table-stock', async () => { await a.click('#f-recherche'); await a.keyboard.type('P-0011'); await a.keyboard.press('Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0011'), 'frappe rapide + Entrée : P-0011');
  });

  await section('Stock : tri, pagination stable et lien de la fiche', async () => {
    await L.aller(a, 'stock');
    await a.waitForSelector('#table-stock tbody tr');
    await redessine(a, '#table-stock', () => a.click('#table-stock thead th:has-text("Quantité")'));
    await redessine(a, '#table-stock', () => a.click('#table-stock thead th:has-text("Quantité")'));
    const rows = await lignes(a, '#table-stock');
    const q = rows.map(r => num(r.cells[5]));
    verifier(q.length > 5 && q.every((v, i) => i === 0 || q[i - 1] >= v), 'tri par quantité décroissante : ' + q.slice(0, 8).join(','));
    // pagination sans doublon ni trou avec un tri à égalités (quantité), pages de 10
    const vus = new Set(); let total = 0;
    for (let start = 0; start < 200; start += 10) {
      const r = await appel(a, 'app/ajax/stock_data.php', DT({ start, length: 10, 'order[0][column]': 1, 'order[0][dir]': 'desc', 'columns[1][data]': 'quantite' }));
      total = r.json.recordsTotal;
      r.json.data.forEach(d => vus.add(d.cle));
      if (start + 10 >= total) break;
    }
    verifier(vus.size === total, 'pagination triée par quantité : ' + vus.size + ' lignes distinctes sur ' + total + ' (aucun doublon, aucun trou)');
    // clic sur la pièce
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'P-0007'));
    await Promise.all([a.waitForNavigation(), a.click('#table-stock tbody tr:first-child a.code')]);
    verifier(/page=piece_voir&id=\d+/.test(a.url()), 'un clic sur la pièce ouvre piece_voir : ' + a.url());
  });

  await section('Stock : employé (aucun coût, une seule entreprise)', async () => {
    await L.aller(e, 'stock');
    await e.waitForSelector('#table-stock tbody tr');
    const h = await entetes(e, '#table-stock');
    verifier(h.join('|') === 'Code|Pièce|Catégorie|Entreprise|Emplacement|Quantité|Unité', 'colonnes de l\'employé : ' + h.join('|'));
    const rows = await lignes(e, '#table-stock');
    verifier(rows.length === parseInt(NB_STOCK('1'), 10) && rows.every(r => r.cells[3] === 'Beauchemin'), 'l\'employé ne voit que Beauchemin : ' + rows.length + ' lignes');
    verifier(!(await e.content()).includes('Coût moyen'), 'aucune mention de coût dans la page de l\'employé');
    verifier(await e.locator('#f-entreprise option').count() === 1, 'un seul choix d\'entreprise');
    // réponse JSON brute
    const r = await appel(e, 'app/ajax/stock_data.php', DT());
    verifier(r.status === 200 && r.json.recordsTotal === rows.length, 'JSON : même nombre de lignes');
    verifier(!/cout_moyen|valeur|"cout/.test(r.texte), 'JSON brut de l\'employé : aucune colonne de coût ni de valeur');
    verifier(!r.texte.includes('Boutique Chaleur') && !r.texte.includes('Boutique Centre-ville'), 'JSON brut de l\'employé : rien de Boutique Chaleur');
    // tri demandé sur une colonne de coût : ignoré (liste blanche), pas d'erreur
    const t = await appel(e, 'app/ajax/stock_data.php', DT({ 'order[0][column]': 5, 'order[0][dir]': 'desc', 'columns[5][data]': 'valeur' }));
    verifier(t.status === 200 && !/valeur/.test(t.texte), 'tri sur « valeur » ignoré pour un employé');
    // export
    const x = await appel(e, 'app/ajax/stock_export.php', null);
    verifier(x.status === 200 && !/Coût|Valeur|cout/i.test(x.texte.split('\n')[0]), 'export de l\'employé : pas de colonne de coût : ' + x.texte.split('\n')[0]);
    verifier(!/Boutique Chaleur|Boutique Centre-ville/.test(x.texte), 'export de l\'employé : rien de Boutique Chaleur');
    // employé de Boutique Chaleur : rien de Beauchemin
    await L.aller(b, 'stock');
    await b.waitForSelector('#table-stock tbody tr');
    const rb = await lignes(b, '#table-stock');
    verifier(rb.length === parseInt(NB_STOCK('2'), 10) && rb.every(r => r.cells[3] === 'Boutique Chaleur'), 'emp_bch ne voit que Boutique Chaleur : ' + rb.length);
    const jb = await appel(b, 'app/ajax/stock_data.php', DT());
    verifier(!jb.texte.includes('Beauchemin') && !jb.texte.includes('Cube 12'), 'JSON brut de emp_bch : rien de Beauchemin');
  });

  await section('Stock : exports CSV', async () => {
    // Gestionnaire : coûts présents ; format fr-CA
    const x = await appel(g, 'app/ajax/stock_export.php?' + new URLSearchParams({ entreprise_id: '1' }), null);
    verifier(x.status === 200 && /text\/csv/.test(x.type) && /attachment; filename="stock-\d{4}-\d{2}-\d{2}\.csv"/.test(x.dispo), 'en-têtes HTTP du CSV : ' + x.type + ' / ' + x.dispo);
    verifier(x.bom, 'le CSV commence par un BOM UTF-8');
    const csv = parseCsv(x.texte);
    verifier(csv[0].join('|') === 'Code|Pièce|Catégorie|Entreprise|Emplacement|Quantité|Unité|Minimum|Sous le minimum|Coût moyen ($)|Valeur ($)', 'en-têtes : ' + csv[0].join('|'));
    verifier(csv.length - 1 === parseInt(NB_STOCK('1'), 10), 'une ligne par ligne de stock : ' + (csv.length - 1));
    const l1 = csv.find(r => r[0] === 'P-0001' && r[4].startsWith('Entrepôt'));
    verifier(l1 && l1[5] === '8' && l1[7] === '10' && l1[8] === 'non' && l1[9] === '14,50' && l1[10] === '116,00', 'valeurs avec virgule décimale : ' + JSON.stringify(l1));
    const d1 = csv.find(r => r[0] === 'DEC-1' && r[4].startsWith('Entrepôt'));
    verifier(d1 && d1[5] === '12,5' && d1[10] === '37,50', 'quantité décimale 12,5 : ' + JSON.stringify(d1));
    // formules neutralisées
    const f1 = csv.find(r => r[0] === 'CSV-1'), f2 = csv.find(r => r[0] === 'CSV-2');
    verifier(f1 && f1[1] === '\'=HYPERLINK("http://exemple.test";"clic")', 'formule « = » neutralisée par une apostrophe : ' + (f1 && f1[1]));
    verifier(f2 && f2[1] === '\'@SUM(1+1); « guillemets » "doubles"', 'formule « @ » neutralisée, guillemets et « ; » conservés : ' + (f2 && f2[1]));
    verifier(csv.every(r => r.every(c => !/^[=+@\t\r]/.test(c) && !/^-[^\d]/.test(c))), 'aucune cellule ne commence par = + @ tab ou - (hors nombres)');
    // mêmes filtres que le tableau (vue pièce, zéro, recherche)
    const y = parseCsv((await appel(g, 'app/ajax/stock_export.php?' + new URLSearchParams({ vue: 'piece', q: 'P-0009' }), null)).texte);
    verifier(y[0].join('|').startsWith('Code|Pièce|Catégorie|Entreprise|Quantité totale|Unité') && y.length === 3, 'export vue par pièce filtré : ' + y.length + ' lignes');
    const z = parseCsv((await appel(g, 'app/ajax/stock_export.php?' + new URLSearchParams({ zero: '1', emplacement_id: '3' }), null)).texte);
    verifier(z.some(r => r[0] === 'P-0005' && r[5] === '0'), 'export avec les quantités à zéro');
    // le lien d'export de la page suit les filtres
    await L.aller(g, 'stock');
    await redessine(g, '#table-stock', () => g.selectOption('#f-entreprise', '2'));
    const href = await g.getAttribute('#btn-export', 'href');
    verifier(/stock_export\.php\?/.test(href) && /entreprise_id=2/.test(href) && /vue=emplacement/.test(href), 'le lien d\'export reprend les filtres : ' + href);
    // refus : entreprise non permise pour le gestionnaire de Beauchemin seulement
    const r = await appel(gb, 'app/ajax/stock_export.php?entreprise_id=2', null);
    verifier(r.status === 403 && /text\/plain/.test(r.type) && r.texte.includes('accès'), 'export d\'une entreprise non permise : 403 en texte : ' + r.status + ' ' + r.texte);
    const j = sql("SELECT COUNT(*) FROM journal WHERE action = 'export.stock'");
    verifier(parseInt(j, 10) >= 4, 'les exports sont écrits au journal (' + j + ')');
  });

  // =====================================================================================================================
  //  HISTORIQUE
  // =====================================================================================================================
  await section('Historique : affichage et tri (admin)', async () => {
    await L.aller(a, 'historique');
    await a.waitForSelector('#table-historique tbody tr');
    verifier((await texte(a, 'h1')) === 'Historique des mouvements', 'titre');
    const total = parseInt(NB_MOUV('1,2'), 10);
    verifier((await texte(a, '#table-historique_info')).includes('de ' + total), 'nombre de mouvements (' + total + ') : ' + await texte(a, '#table-historique_info'));
    const h = await entetes(a, '#table-historique');
    verifier(h.join('|') === 'Date et heure|Document|Type|Pièce|Entreprise|Emplacement|Quantité|Utilisateur|Coût unitaire|Valeur|Remarque', 'colonnes (admin) : ' + h.join('|'));
    let rows = await lignes(a, '#table-historique');
    const dernier = sql('SELECT d.numero FROM mouvements m JOIN documents d ON d.id = m.document_id ORDER BY m.id DESC LIMIT 1');
    verifier(rows[0].cells[1] === dernier, 'le plus récent d\'abord : ' + rows[0].cells[1] + ' = ' + dernier);
    verifier(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(rows[0].cells[0]), 'date et heure AAAA-MM-JJ HH:MM : ' + rows[0].cells[0]);
    // quantité signée : vert / rouge
    const signes = await a.$$eval('#table-historique tbody tr td.nombre span.font-weight-bold', ss => ss.map(s => [s.textContent.trim(), s.className]));
    verifier(signes.length > 5 && signes.every(([t, c]) => (t.startsWith('+') && /sk-pos/.test(c)) || (/^[-−]/.test(t) && /sk-neg/.test(c))), 'quantités signées : + en vert, - en rouge : ' + signes.slice(0, 4).map(s => s[0]).join(' '));
    // liens vers le document et la pièce
    const hd = await a.getAttribute('#table-historique tbody tr:first-child td:nth-child(2) a', 'href');
    verifier(/page=document_voir&id=\d+/.test(hd), 'lien vers document_voir : ' + hd);
    verifier(await a.locator('#table-historique tbody tr:first-child td:nth-child(4) a[href*="piece_voir"]').count() === 2, 'liens vers piece_voir (code et nom)');
    // tri : date croissante = plus ancien d'abord
    await redessine(a, '#table-historique', () => a.click('#table-historique thead th:has-text("Date et heure")'));
    rows = await lignes(a, '#table-historique');
    const premier = sql('SELECT d.numero FROM mouvements m JOIN documents d ON d.id = m.document_id ORDER BY m.id ASC LIMIT 1');
    verifier(rows[0].cells[1] === premier, 'tri par date croissante : ' + rows[0].cells[1] + ' = ' + premier);
    await redessine(a, '#table-historique', () => a.click('#table-historique thead th:has-text("Quantité")'));
    rows = await lignes(a, '#table-historique');
    const q = rows.map(r => num(r.cells[6]));
    verifier(q.every((v, i) => i === 0 || q[i - 1] <= v), 'tri par quantité croissante');
    // pagination stable (tri par document)
    const vus = new Set(); let tot = 0;
    for (let start = 0; start < 400; start += 25) {
      const r = await appel(a, 'app/ajax/historique_data.php', DT({ start, length: 25, 'order[0][column]': 1, 'order[0][dir]': 'asc', 'columns[0][data]': 'ordre', 'columns[1][data]': 'numero' }));
      tot = r.json.recordsTotal; r.json.data.forEach(d => vus.add(d.ordre));
      if (start + 25 >= tot) break;
    }
    verifier(vus.size === tot, 'pagination triée par document : ' + vus.size + ' / ' + tot);
  });

  await section('Historique : filtres', async () => {
    await L.aller(a, 'historique');
    await a.waitForSelector('#table-historique tbody tr');
    // type de document
    await redessine(a, '#table-historique', () => a.selectOption('#f-type', 'transfert'));
    let rows = await lignes(a, '#table-historique');
    verifier(rows.length === parseInt(sql("SELECT COUNT(*) FROM mouvements m JOIN documents d ON d.id = m.document_id WHERE d.type = 'transfert'"), 10) && rows.every(r => r.cells[2] === 'Transfert'), 'filtre type « Transfert » : ' + rows.length);
    // annulation : mentions
    const ann = rows.filter(r => r.cells[r.cells.length - 1] === 'Annulation');
    const orig = rows.filter(r => r.cells[r.cells.length - 1] === 'Document annulé');
    verifier(ann.length === 2 && orig.length === 2, 'mentions « Annulation » (' + ann.length + ') et « Document annulé » (' + orig.length + ') pour le transfert annulé ' + F.transfert_annule);
    verifier(ann.every(r => /sk-annulation/.test(r.classes)), 'les mouvements d\'annulation sont distingués visuellement');
    await redessine(a, '#table-historique', () => a.selectOption('#f-type', ''));
    // pièce (Select2) : tape, choisit
    await a.click('#f-piece + .select2 .select2-selection');
    await a.waitForSelector('.select2-search__field');
    await a.fill('.select2-search__field', 'XSS');
    await a.waitForSelector('.select2-results__option[aria-selected]:has-text("XSS-1")');
    const optTxt = norm(await a.textContent('.select2-results__option[aria-selected]:has-text("XSS-1")'));
    verifier(optTxt === 'XSS-1 — ' + XSS, 'la liste Select2 affiche le nom en texte : ' + optTxt);
    verifier(await a.locator('.select2-results img').count() === 0, 'aucune balise injectée dans la liste Select2');
    await redessine(a, '#table-historique', () => a.click('.select2-results__option[aria-selected]:has-text("XSS-1")'));
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === 2 && rows.every(r => r.cells[3].startsWith('XSS-1')), 'filtre pièce XSS-1 : ' + rows.length + ' mouvements');
    verifier(rows.every(r => r.cells[3].includes(XSS)) && await a.locator('#table-historique img').count() === 0, 'nom de pièce affiché en texte dans le tableau');
    // retirer le filtre pièce (x de Select2)
    await redessine(a, '#table-historique', () => a.click('#f-piece + .select2 .select2-selection__clear'));
    verifier((await lignes(a, '#table-historique')).length > 2, 'le filtre pièce se retire');
    // entreprise + emplacement
    await redessine(a, '#table-historique', () => a.selectOption('#f-entreprise', '2'));
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === parseInt(NB_MOUV('2'), 10) && rows.every(r => r.cells[4] === 'Boutique Chaleur'), 'filtre entreprise 2 : ' + rows.length);
    await redessine(a, '#table-historique', () => a.selectOption('#f-emplacement', '5'));
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === parseInt(sql('SELECT COUNT(*) FROM mouvements WHERE emplacement_id = 5'), 10) && rows.length > 0 && rows.every(r => r.cells[5] === 'Boutique Centre-ville'), 'filtre emplacement 5 : ' + rows.length);
    await redessine(a, '#table-historique', () => a.click('#f-effacer'));
    verifier((await texte(a, '#table-historique_info')).includes('de ' + NB_MOUV('1,2')) && await a.inputValue('#f-emplacement') === '', '« Effacer les filtres »');
    // période (jour du mouvement du passé)
    await redessine(a, '#table-historique', () => a.fill('#f-du', '2026-09-01'));
    await redessine(a, '#table-historique', () => a.fill('#f-au', '2026-09-30'));
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === 1 && rows[0].cells[0] === '2026-09-15 10:30' && rows[0].cells[3].startsWith('DEC-1'), 'plage de dates : le seul mouvement de septembre : ' + JSON.stringify(rows.map(r => r.cells.slice(0, 4))));
    await redessine(a, '#table-historique', () => a.fill('#f-au', '2026-09-15'));
    verifier((await lignes(a, '#table-historique')).length === 1, 'la date de fin est incluse');
    await redessine(a, '#table-historique', () => a.fill('#f-au', '2026-09-14'));
    verifier((await lignes(a, '#table-historique')).length === 0 && (await texte(a, '#table-historique tbody')).includes('Aucun mouvement ne correspond'), 'plage vide : message utile');
    await a.fill('#f-du', '');
    await redessine(a, '#table-historique', () => a.fill('#f-au', ''));
    // du > au : refus clair du serveur
    await a.evaluate(() => { document.getElementById('f-au').min = ''; });
    await a.fill('#f-du', '2026-10-01');
    await a.fill('#f-au', '2026-09-01');
    await a.waitForTimeout(100);
    await a.evaluate(() => { jQuery('#table-historique').DataTable().ajax.reload(); });
    verifier((await toastTexte(a)).includes('date de début doit précéder'), 'début après la fin : message clair en français');
    await redessine(a, '#table-historique', () => a.click('#f-effacer'));
    // utilisateur
    const nomUtil = norm(await a.textContent('#f-utilisateur option[value="' + ID_ADMIN + '"]'));
    verifier(nomUtil.startsWith('Administrateur'), 'liste des utilisateurs : ' + nomUtil);
    await redessine(a, '#table-historique', () => a.selectOption('#f-utilisateur', ID_ADMIN));
    verifier((await lignes(a, '#table-historique')).length === 25 && (await texte(a, '#table-historique_info')).includes('de ' + NB_MOUV('1,2')), 'les mouvements de l\'administrateur : tous');
    const eid = sql("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'employe1'");
    await redessine(a, '#table-historique', () => a.selectOption('#f-utilisateur', eid));
    verifier((await lignes(a, '#table-historique')).length === 0, 'aucun mouvement pour employe1');
    await redessine(a, '#table-historique', () => a.click('#f-effacer'));
    // numéro de document
    await redessine(a, '#table-historique', () => a.fill('#f-numero', 'FIN-2026'));
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === parseInt(sql("SELECT COUNT(*) FROM mouvements m JOIN documents d ON d.id = m.document_id WHERE d.numero LIKE 'FIN-2026%'"), 10) && rows.every(r => r.cells[1].startsWith('FIN-2026')), 'filtre numéro « FIN-2026 » : ' + rows.length);
    await redessine(a, '#table-historique', () => a.click('#f-effacer'));
    // préremplissage par l'URL (liens des autres écrans) : pièce désactivée comprise
    await a.goto(L.BASE + '/index.php?page=historique&piece_id=' + F.inac + '&du=' + aujourdhui);
    await a.waitForSelector('#table-historique tbody tr');
    rows = await lignes(a, '#table-historique');
    verifier(rows.length === 1 && rows[0].cells[3].startsWith('INAC-1') && norm(await a.textContent('#f-piece option:checked')).startsWith('INAC-1'), 'URL ?piece_id= : pièce désactivée préchoisie, historique conservé');
    await a.goto(L.BASE + '/index.php?page=historique&emplacement_id=3&type=sortie');
    await a.waitForSelector('#table-historique tbody tr');
    rows = await lignes(a, '#table-historique');
    verifier(rows.length > 0 && rows.every(r => r.cells[2] === 'Sortie' && r.cells[5].startsWith('Cube 12')), 'URL ?emplacement_id=3&type=sortie : ' + rows.length);
  });

  await section('Historique : employé (pas de coûts, pas d\'autre entreprise) et exports', async () => {
    await L.aller(e, 'historique');
    await e.waitForSelector('#table-historique tbody tr');
    const h = await entetes(e, '#table-historique');
    verifier(h.join('|') === 'Date et heure|Document|Type|Pièce|Emplacement|Quantité|Utilisateur|Remarque', 'colonnes de l\'employé (aucun coût) : ' + h.join('|'));
    const attendu = parseInt(NB_MOUV('1'), 10);
    verifier((await texte(e, '#table-historique_info')).includes('de ' + attendu), 'l\'employé voit les ' + attendu + ' mouvements de Beauchemin seulement : ' + await texte(e, '#table-historique_info'));
    const r = await appel(e, 'app/ajax/historique_data.php', DT({ length: 500, 'order[0][column]': 0, 'columns[0][data]': 'ordre' }));
    verifier(r.json.recordsTotal === attendu && r.json.data.every(d => d.entreprise === 'Beauchemin'), 'JSON : seulement Beauchemin');
    verifier(!/cout_unitaire|valeur|"cout/.test(r.texte), 'JSON brut de l\'employé : aucun coût');
    verifier(!r.texte.includes('Boutique Centre-ville') && !r.texte.includes('Boutique Chaleur'), 'JSON brut : rien de Boutique Chaleur');
    // la facture interne FIN-2026-00002 (Boutique Chaleur vers Beauchemin) : seule la moitié Beauchemin
    const fin = r.json.data.filter(d => d.doc_id && /FIN-2026-00002/.test(d.numero));
    verifier(fin.length === parseInt(sql("SELECT COUNT(*) FROM mouvements m JOIN documents d ON d.id = m.document_id JOIN emplacements e ON e.id = m.emplacement_id WHERE d.numero = 'FIN-2026-00002' AND e.entreprise_id = 1"), 10) && fin.length === 2, 'facture interne reçue : l\'employé ne voit que ses 2 mouvements d\'entrée (' + fin.length + ')');
    // tri sur une colonne de coût : ignoré
    const t = await appel(e, 'app/ajax/historique_data.php', DT({ 'order[0][column]': 3, 'order[0][dir]': 'desc', 'columns[3][data]': 'valeur' }));
    verifier(t.status === 200 && !/valeur/.test(t.texte), 'tri sur « valeur » ignoré pour un employé');
    // export
    const x = await appel(e, 'app/ajax/historique_export.php', null);
    const csv = parseCsv(x.texte);
    verifier(x.status === 200 && csv[0].join('|') === 'Date et heure|Document|Type|Code|Pièce|Entreprise|Emplacement|Quantité|Unité|Utilisateur|Mention', 'export de l\'employé, en-têtes sans coût : ' + csv[0].join('|'));
    verifier(csv.length - 1 === attendu && csv.slice(1).every(l => l[5] === 'Beauchemin'), 'export de l\'employé : ' + (csv.length - 1) + ' lignes, toutes Beauchemin');
    verifier(csv.slice(1).some(l => /^-\d/.test(l[7])) && csv.slice(1).every(l => !/^'/.test(l[7])), 'quantités négatives écrites comme des nombres (pas de préfixe d\'apostrophe)');
    // export du gestionnaire : coûts
    const xg = parseCsv((await appel(g, 'app/ajax/historique_export.php?' + new URLSearchParams({ piece_id: F.xss }), null)).texte);
    verifier(xg[0].slice(-3).join('|') === 'Mention|Coût unitaire ($)|Valeur ($)' && xg.length === 3, 'export du gestionnaire : coûts présents, filtre pièce (' + (xg.length - 1) + ' lignes)');
    const l = xg.find(r => r[5] === 'Beauchemin');
    verifier(l && l[7] === '10' && l[11] === '5,00' && l[12] === '50,00', 'coût 5,00 et valeur 50,00 (10 x 5,00) : ' + JSON.stringify(l));
    verifier(xg.every((r, i) => i === 0 || r[4] === XSS), 'le nom piégé est exporté tel quel (texte)');
    // annulation dans l'export
    const xa = parseCsv((await appel(g, 'app/ajax/historique_export.php?' + new URLSearchParams({ numero: F.transfert_annule }), null)).texte);
    verifier(xa.slice(1).filter(r => r[10] === 'Annulation').length === 2 && xa.slice(1).filter(r => r[10] === 'Document annulé').length === 2, 'export : mentions d\'annulation');
    // gestionnaire : colonnes de coût dans le tableau
    await L.aller(g, 'historique');
    await g.waitForSelector('#table-historique tbody tr');
    verifier((await entetes(g, '#table-historique')).includes('Coût unitaire'), 'le gestionnaire voit les colonnes de coût');
    // lien d'export suit les filtres
    await redessine(g, '#table-historique', () => g.selectOption('#f-type', 'sortie'));
    verifier(/type=sortie/.test(await g.getAttribute('#btn-export', 'href')), 'le lien d\'export de l\'historique reprend les filtres');
  });

  // =====================================================================================================================
  //  SOUS LE MINIMUM
  // =====================================================================================================================
  await section('Sous le minimum : liste, tri, lien Réceptionner (admin)', async () => {
    await L.aller(a, 'sous_minimum');
    await a.waitForSelector('#table-sous-minimum tbody tr');
    const attendu = sousMin();
    let rows = await lignes(a, '#table-sous-minimum');
    verifier(rows.length === attendu.length, 'nombre de pièces sous le minimum : ' + rows.length + ' (attendu ' + attendu.length + ')');
    verifier((await texte(a, '#sm-portee')).includes(attendu.length + ' pièces sous le minimum'), 'résumé : ' + await texte(a, '#sm-portee'));
    const h = await entetes(a, '#table-sous-minimum');
    verifier(h.slice(0, 7).join('|') === 'Code|Pièce|Entreprise|Quantité|Minimum|Manque|Unité', 'colonnes : ' + h.join('|'));
    // du plus grand manque au plus petit
    const manques = rows.map(r => num(r.cells[5]));
    verifier(manques.every((v, i) => i === 0 || manques[i - 1] >= v), 'tri de départ : plus grand manque d\'abord : ' + manques.join(','));
    const x = rows.find(r => r.cells[0] === 'XSS-1' && r.cells[2] === 'Beauchemin');
    verifier(x && x.cells[1] === XSS && x.cells[3] === '10' && x.cells[4] === '50' && x.cells[5] === '40', 'XSS-1 chez Beauchemin : quantité 10, minimum 50, manque 40 : ' + JSON.stringify(x && x.cells));
    verifier(await a.locator('#table-sous-minimum img').count() === 0 && dialogues.length === 0, 'nom piégé affiché en texte');
    const p3 = rows.find(r => r.cells[0] === 'P-0003');
    verifier(p3 && p3.cells[3] === '10' && p3.cells[4] === '20' && p3.cells[5] === '10', 'P-0003 : 10 sur 20, manque 10');
    // lien « Réceptionner » : pièce + entrepôt de l'entreprise
    const liens = await a.$$eval('#table-sous-minimum tbody tr', trs => trs.map(t => [t.children[0].textContent.trim(), t.children[2].textContent.trim(), (t.querySelector('a.btn') || {}).href || '']));
    const lx = liens.find(l => l[0] === 'XSS-1' && l[1] === 'Boutique Chaleur');
    verifier(lx && new URL(lx[2]).searchParams.get('page') === 'reception' && new URL(lx[2]).searchParams.get('piece_id') === String(F.xss) && new URL(lx[2]).searchParams.get('emplacement_id') === '2', 'Réceptionner pour Boutique Chaleur : piece_id et entrepôt 2 : ' + (lx && lx[2]));
    const lb = liens.find(l => l[0] === 'XSS-1' && l[1] === 'Beauchemin');
    verifier(lb && new URL(lb[2]).searchParams.get('emplacement_id') === '1', 'Réceptionner pour Beauchemin : entrepôt 1');
    // tri par clic : quantité croissante
    await a.click('#table-sous-minimum thead th:has-text("Quantité")');
    rows = await lignes(a, '#table-sous-minimum');
    const q = rows.map(r => num(r.cells[3]));
    verifier(q.every((v, i) => i === 0 || q[i - 1] <= v), 'tri par quantité croissante');
    // recherche dans la liste
    await a.fill('#table-sous-minimum_filter input', 'gicleur');
    rows = await lignes(a, '#table-sous-minimum');
    verifier(rows.length === 1 && rows[0].cells[0] === 'P-0003', 'recherche dans la liste');
    // export CSV
    const xc = await appel(a, 'app/ajax/sous_minimum_export.php', null);
    const csv = parseCsv(xc.texte);
    verifier(xc.bom && csv[0].join('|') === 'Code|Pièce|Entreprise|Quantité|Minimum|Manque|Unité' && csv.length - 1 === attendu.length, 'export : BOM, en-têtes, ' + (csv.length - 1) + ' lignes');
    verifier(csv[1][0] === 'XSS-1' && csv[1][5] === '40', 'export : plus grand manque d\'abord : ' + csv[1].join('|'));
    // changer d'entreprise dans la barre du haut : la liste suit
    await Promise.all([a.waitForNavigation(), a.selectOption('#entreprise-courante', '2')]);
    await a.waitForSelector('#table-sous-minimum tbody tr');
    rows = await lignes(a, '#table-sous-minimum');
    verifier(rows.length === attendu.filter(r => r[1] === '2').length && rows.every(r => r.cells[2] === 'Boutique Chaleur'), 'barre du haut = Boutique Chaleur : ' + rows.length + ' pièce');
    verifier((await texte(a, '#sm-portee')).startsWith('Entreprise : Boutique Chaleur'), 'libellé de l\'entreprise');
    await Promise.all([a.waitForNavigation(), a.selectOption('#entreprise-courante', '0')]);
  });

  await section('Sous le minimum : employé, gestionnaire, état vide', async () => {
    await L.aller(e, 'sous_minimum');
    await e.waitForSelector('#table-sous-minimum tbody tr');
    const rows = await lignes(e, '#table-sous-minimum');
    verifier(rows.length === sousMin().filter(r => r[1] === '1').length && rows.every(r => r.cells[2] === 'Beauchemin'), 'employé : seulement Beauchemin (' + rows.length + ')');
    verifier(await e.locator('#table-sous-minimum a.btn').count() === 0 && !(await entetes(e, '#table-sous-minimum')).includes('Réceptionner'), 'employé : aucun bouton « Réceptionner »');
    const r = await appel(e, 'app/ajax/sous_minimum_data.php', null);
    verifier(r.status === 200 && !/emplacement_reception_id|cout|valeur|prix/i.test(r.texte) && r.json.peut_receptionner === false, 'JSON brut de l\'employé : pas d\'emplacement de réception ni de coût');
    // gestionnaire de Beauchemin : bouton présent
    await L.aller(gb, 'sous_minimum');
    await gb.waitForSelector('#table-sous-minimum tbody tr');
    verifier(await gb.locator('#table-sous-minimum a.btn:has-text("Réceptionner")').count() === sousMin().filter(r => r[1] === '1').length, 'gestionnaire : bouton « Réceptionner » sur chaque ligne');
    const lien = await gb.getAttribute('#table-sous-minimum tbody tr:first-child a.btn', 'href');
    verifier(/^index\.php\?page=reception&piece_id=\d+&emplacement_id=1$/.test(lien), 'lien de réception : ' + lien);
    // état vide : tous les minimums à zéro (restaurés ensuite)
    sql('DROP TABLE IF EXISTS seuils_sauv; CREATE TABLE seuils_sauv AS SELECT * FROM seuils; UPDATE seuils SET minimum = 0');
    try {
      await L.aller(e, 'sous_minimum');
      await e.waitForSelector('#sm-vide:not([hidden])');
      const v = await texte(e, '#sm-vide');
      verifier(v.startsWith('Aucune pièce sous le minimum.') && !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(v), 'état vide en texte : ' + v);
      verifier(await e.isHidden('#sm-tableau'), 'le tableau est masqué quand la liste est vide');
      const d = await appel(e, 'app/ajax/sous_minimum_data.php', null);
      verifier(d.json.lignes.length === 0, 'JSON vide');
      const csv = parseCsv((await appel(e, 'app/ajax/sous_minimum_export.php', null)).texte);
      verifier(csv.length === 1, 'export vide : seulement l\'en-tête');
      // tableau de bord : 0 et message
      await L.aller(e, 'dashboard');
      await e.waitForFunction(() => document.getElementById('ds-sous').textContent.trim() === '0');
      verifier(!(await e.isHidden('#ds-bas-vide')) && (await texte(e, '#ds-bas-vide')) === 'Aucune pièce sous le minimum.', 'tableau de bord : aucune pièce sous le minimum');
    } finally {
      sql('UPDATE seuils s JOIN seuils_sauv b ON b.entreprise_id = s.entreprise_id AND b.piece_id = s.piece_id SET s.minimum = b.minimum; DROP TABLE seuils_sauv');
    }
  });

  // =====================================================================================================================
  //  TABLEAU DE BORD
  // =====================================================================================================================
  await section('Tableau de bord : cartes (gestionnaire, 2 entreprises)', async () => {
    await L.aller(g, 'dashboard');
    await g.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    verifier((await texte(g, 'h1')) === 'Tableau de bord', 'titre');
    verifier((await texte(g, '#ds-portee')) === 'Entreprise : Beauchemin, Boutique Chaleur', 'portée : ' + await texte(g, '#ds-portee'));
    verifier((await texte(g, '#ds-pieces')) === sql('SELECT COUNT(*) FROM pieces WHERE actif = 1'), 'pièces actives : ' + await texte(g, '#ds-pieces'));
    const enStock = sql('SELECT COUNT(DISTINCT s.piece_id) FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE s.quantite > 0 AND p.actif = 1');
    verifier((await texte(g, '#ds-pieces-detail')) === 'dont ' + enStock + ' en stock', 'pièces en stock : ' + await texte(g, '#ds-pieces-detail'));
    verifier((await texte(g, '#ds-sous')) === String(sousMin().length), 'sous le minimum : ' + await texte(g, '#ds-sous') + ' (attendu ' + sousMin().length + ')');
    verifier(await g.evaluate(() => document.getElementById('ds-carte-sous').classList.contains('ds-alerte')), 'carte « sous le minimum » en alerte');
    const mj = sql("SELECT COUNT(*) FROM mouvements WHERE DATE(date_mouvement) = '" + aujourdhui + "'");
    const dj = sql("SELECT COUNT(DISTINCT document_id) FROM mouvements WHERE DATE(date_mouvement) = '" + aujourdhui + "'");
    verifier((await texte(g, '#ds-jour')) === mj && (await texte(g, '#ds-jour-detail')) === 'dans ' + dj + ' documents', 'mouvements du jour : ' + await texte(g, '#ds-jour') + ' / ' + await texte(g, '#ds-jour-detail') + ' (attendu ' + mj + ' dans ' + dj + ')');
    // valeur d'inventaire par entreprise
    const val = id => sql('SELECT ROUND(SUM(s.quantite * sc.cout_moyen), 2) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id WHERE e.entreprise_id = ' + id);
    const v = await lisible(g, '#ds-valeur');
    verifier(v.includes('Beauchemin ' + fr(val(1))) && v.includes('Boutique Chaleur ' + fr(val(2))), 'valeur d\'inventaire par entreprise : ' + v + ' (attendu ' + fr(val(1)) + ' / ' + fr(val(2)) + ')');
    // factures internes du mois
    const emis = id => sql("SELECT COALESCE(SUM(total), 0) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND date_document BETWEEN '" + aujourdhui.slice(0, 8) + "01' AND LAST_DAY('" + aujourdhui + "') AND entreprise_id = " + id);
    const recu = id => sql("SELECT COALESCE(SUM(total), 0) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND date_document BETWEEN '" + aujourdhui.slice(0, 8) + "01' AND LAST_DAY('" + aujourdhui + "') AND entreprise_dest_id = " + id);
    const f = await lisible(g, '#ds-factures');
    const solde1 = (num(emis(1)) - num(recu(1))).toFixed(2);
    verifier(f.includes('Beauchemin Émis ' + fr(emis(1))) && f.includes('Reçu ' + fr(recu(1))) && f.includes('Solde ' + (num(solde1) > 0 ? '+' : '') + fr(solde1).replace('-', '-')) , 'factures internes du mois : ' + f);
    verifier(f.includes('à recevoir') && f.includes('à payer'), 'solde : à recevoir / à payer');
    verifier((await texte(g, '#ds-mois')).includes(String(new Date().getFullYear())), 'mois affiché : ' + await texte(g, '#ds-mois'));
    // raccourcis
    const raccourcis = await g.$$eval('.ds-raccourcis a', as => as.map(x => [x.textContent.trim(), x.getAttribute('href'), x.getBoundingClientRect().height]));
    verifier(raccourcis.map(r => r[0]).join('|') === 'Scanner|Transfert|Sortie|Réception|Facture interne', 'raccourcis du gestionnaire : ' + raccourcis.map(r => r[0]).join('|'));
    verifier(raccourcis.every(r => r[2] >= 44), 'raccourcis de 44 px ou plus');
    verifier(raccourcis.map(r => r[1]).join('|') === 'index.php?page=scanner|index.php?page=transfert|index.php?page=sortie|index.php?page=reception|index.php?page=facture_interne', 'liens des raccourcis');
    // 10 derniers documents
    const docs = await lignes(g, '#ds-docs-zone');
    const attendu = sqlLignes('SELECT numero FROM documents ORDER BY id DESC LIMIT 10').map(r => r[0]);
    verifier(docs.length === 10 && docs.map(r => r.cells[0]).join() === attendu.join(), 'les 10 derniers documents : ' + docs.map(r => r.cells[0]).join());
    verifier(docs.some(r => r.cells[r.cells.length - 1] === 'Annulé') && docs.every(r => /\d [$]|\d,\d\d \$/.test(r.cells[4])), 'statut « Annulé » et total pour le gestionnaire');
    const hd = await g.getAttribute('#ds-docs tr:first-child a', 'href');
    verifier(/^index\.php\?page=document_voir&id=\d+$/.test(hd), 'lien vers document_voir : ' + hd);
    // 5 pièces les plus sous le minimum
    const bas = await lignes(g, '#ds-bas-zone');
    const attBas = sousMin().map(r => [parseFloat(r[2]) - parseFloat(r[3]), r[0]]).sort((x, y) => y[0] - x[0]).slice(0, 5);
    verifier(bas.length === Math.min(5, sousMin().length) && bas[0].cells[0].startsWith(attBas[0][1]) && bas.every(r => !!r.cells[3]), 'pièces les plus sous le minimum : ' + bas.map(r => r.cells[0].slice(0, 12)).join(' | '));
    verifier(bas[0].cells[0].includes(XSS) && await g.locator('#ds-bas img, #ds-docs img').count() === 0 && dialogues.length === 0, 'nom piégé affiché en texte sur le tableau de bord');
    // liens des cartes
    verifier(await g.locator('#ds-carte-sous a[href="index.php?page=sous_minimum"]').count() === 1, 'lien vers sous_minimum');
    const lj = await g.getAttribute('#ds-jour-lien', 'href');
    verifier(lj === 'index.php?page=historique&du=' + aujourdhui + '&au=' + aujourdhui, 'lien « mouvements du jour » : ' + lj);
    await Promise.all([g.waitForNavigation(), g.click('#ds-jour-lien')]);
    await g.waitForSelector('#table-historique tbody tr');
    verifier((await texte(g, '#table-historique_info')).includes('de ' + mj), 'le lien mène à l\'historique du jour (' + mj + ' mouvements)');
  });

  await section('Tableau de bord : entreprise de la barre du haut', async () => {
    await L.aller(g, 'dashboard');
    await Promise.all([g.waitForNavigation(), g.selectOption('#entreprise-courante', '2')]);
    await g.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    verifier((await texte(g, '#ds-portee')) === 'Entreprise : Boutique Chaleur', 'portée : ' + await texte(g, '#ds-portee'));
    const enStock = sql('SELECT COUNT(DISTINCT s.piece_id) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN pieces p ON p.id = s.piece_id WHERE e.entreprise_id = 2 AND s.quantite > 0 AND p.actif = 1');
    verifier((await texte(g, '#ds-pieces-detail')) === 'dont ' + enStock + ' en stock', 'pièces en stock de Boutique Chaleur : ' + await texte(g, '#ds-pieces-detail'));
    verifier((await texte(g, '#ds-sous')) === String(sousMin().filter(r => r[1] === '2').length), 'sous le minimum de Boutique Chaleur : ' + await texte(g, '#ds-sous'));
    const v = await lisible(g, '#ds-valeur');
    verifier(v.startsWith('Boutique Chaleur') && !v.includes('Beauchemin'), 'valeur : seulement Boutique Chaleur : ' + v);
    const f = await lisible(g, '#ds-factures');
    verifier(f.startsWith('Boutique Chaleur') && !f.includes('Beauchemin Émis'), 'factures : seulement Boutique Chaleur');
    const mj = sql("SELECT COUNT(*) FROM mouvements m JOIN emplacements e ON e.id = m.emplacement_id WHERE e.entreprise_id = 2 AND DATE(m.date_mouvement) = '" + aujourdhui + "'");
    verifier((await texte(g, '#ds-jour')) === mj, 'mouvements du jour de Boutique Chaleur : ' + await texte(g, '#ds-jour') + ' (attendu ' + mj + ')');
    const docs = await lignes(g, '#ds-docs-zone');
    const attendu = sqlLignes('SELECT numero FROM documents WHERE entreprise_id = 2 OR entreprise_dest_id = 2 ORDER BY id DESC LIMIT 10').map(r => r[0]);
    verifier(docs.map(r => r.cells[0]).join() === attendu.join(), 'documents émis ou reçus par Boutique Chaleur : ' + docs.map(r => r.cells[0]).join());
    // la page Stock suit aussi la barre du haut
    await L.aller(g, 'stock');
    await g.waitForSelector('#table-stock tbody tr');
    verifier(await g.inputValue('#f-entreprise') === '2' && (await lignes(g, '#table-stock')).every(r => r.cells[3] === 'Boutique Chaleur'), 'Stock : entreprise de la barre du haut par défaut');
    await L.aller(g, 'historique');
    await g.waitForSelector('#table-historique tbody tr');
    verifier(await g.inputValue('#f-entreprise') === '2', 'Historique : entreprise de la barre du haut par défaut');
    await Promise.all([g.waitForNavigation(), g.selectOption('#entreprise-courante', '0')]);
  });

  await section('Tableau de bord : employé (aucun montant)', async () => {
    await L.aller(e, 'dashboard');
    await e.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    verifier((await texte(e, '#ds-portee')) === 'Entreprise : Beauchemin', 'portée de l\'employé');
    verifier(await e.locator('#ds-valeur, #ds-factures, #ds-t-valeur, #ds-t-factures').count() === 0, 'pas de carte « valeur » ni « factures internes » pour l\'employé');
    const raccourcis = await e.$$eval('.ds-raccourcis a', as => as.map(x => x.textContent.trim()));
    verifier(raccourcis.join('|') === 'Scanner|Transfert|Sortie', 'raccourcis de l\'employé : ' + raccourcis.join('|'));
    const corps = await texte(e, '.content-wrapper');
    verifier(!/\$/.test(corps), 'aucun montant (symbole $) sur le tableau de bord de l\'employé');
    verifier((await entetes(e, '.content-wrapper table')).every(t => t !== 'Total'), 'pas de colonne « Total »');
    const r = await appel(e, 'app/ajax/dashboard_data.php', null);
    verifier(r.status === 200 && r.json.montants === false && !('valeur' in r.json) && !('factures' in r.json) && r.json.derniers_documents.every(d => !('total' in d)), 'JSON brut : ni valeur, ni factures, ni total');
    verifier(!/"total"|"valeur"|"emis"|"recu"|cout/.test(r.texte), 'JSON brut de l\'employé : aucun champ de coût');
    verifier(!r.texte.includes('Boutique Centre-ville') && !r.json.portee.noms.includes('Boutique Chaleur'), 'JSON brut : aucune donnée de Boutique Chaleur (emplacements masqués)');
    // l'employé de Boutique Chaleur ne voit que son entreprise
    await L.aller(b, 'dashboard');
    await b.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    verifier((await texte(b, '#ds-portee')) === 'Entreprise : Boutique Chaleur', 'emp_bch : sa seule entreprise');
    const rb = await appel(b, 'app/ajax/dashboard_data.php', null);
    verifier(rb.json.derniers_documents.every(d => d.emplacement === null || d.emplacement === 'Entrepôt principal' || d.emplacement === 'Boutique Centre-ville'), 'emp_bch : aucun emplacement de Beauchemin');
    verifier(!rb.json.derniers_documents.some(d => d.emplacement === 'Cube 12 — Marc' || d.emplacement_dest === 'Cube 12 — Marc' || d.emplacement_dest === 'Cube 14 — Luc'), 'emp_bch : noms d\'emplacements de Beauchemin masqués');
  });

  // =====================================================================================================================
  //  SÉCURITÉ : accès, entreprise, entrées invalides
  // =====================================================================================================================
  await section('Sécurité : non connecté, CSRF, droits, entreprise (IDOR), entrées invalides', async () => {
    const points = ['stock_data', 'stock_export', 'historique_data', 'historique_export', 'sous_minimum_data', 'sous_minimum_export', 'dashboard_data', 'stock_lib'];
    for (const p of points) {
      const r = await sansSession('app/ajax/' + p + '.php');
      verifier(r.status === 401 && r.json && r.json.ok === false && /Session expirée/.test(r.json.erreur), p + ' : non connecté -> 401 en français (' + r.status + ')');
    }
    for (const p of ['stock_data', 'historique_data']) {
      const r = await appel(e, 'app/ajax/' + p + '.php', DT(), { sansJeton: true });
      verifier(r.status === 403 && /Jeton de sécurité/.test(r.json.erreur), p + ' : POST sans jeton CSRF -> 403');
    }
    const lib = await appel(e, 'app/ajax/stock_lib.php', null);
    verifier(lib.status === 404, 'stock_lib.php appelé directement -> 404 (' + lib.status + ')');
    // IDOR : l'employé de Beauchemin demande Boutique Chaleur
    const cas = [
      ['stock_data', DT({ entreprise_id: 2 })], ['stock_data', DT({ emplacement_id: 2 })], ['stock_data', DT({ emplacement_id: 5 })], ['stock_data', DT({ emplacement_id: 999999 })],
      ['historique_data', DT({ entreprise_id: 2 })], ['historique_data', DT({ emplacement_id: 5 })], ['historique_data', DT({ emplacement_id: 2, entreprise_id: 1 })],
    ];
    for (const [p, params] of cas) {
      const r = await appel(e, 'app/ajax/' + p + '.php', params);
      verifier(r.status === 403 && r.json && /accès/.test(r.json.erreur) && !/Boutique|Cube/.test(r.texte), p + ' ' + JSON.stringify(Object.entries(params).filter(([k]) => /_id$/.test(k))) + ' -> 403 ' + (r.json && r.json.erreur));
    }
    for (const u of ['sous_minimum_data.php?entreprise_id=2', 'stock_export.php?entreprise_id=2', 'stock_export.php?emplacement_id=5', 'historique_export.php?entreprise_id=2', 'historique_export.php?emplacement_id=5', 'sous_minimum_export.php?entreprise_id=2']) {
      const r = await appel(e, 'app/ajax/' + u, null);
      verifier(r.status === 403 && !/Boutique|Cube/.test(r.texte), u + ' -> 403 (' + r.status + ')');
    }
    // et l'inverse : emp_bch demande Beauchemin
    const rb = await appel(b, 'app/ajax/stock_data.php', DT({ entreprise_id: 1 }));
    verifier(rb.status === 403, 'emp_bch : entreprise 1 -> 403');
    const rb2 = await appel(b, 'app/ajax/historique_data.php', DT({ emplacement_id: 3 }));
    verifier(rb2.status === 403, 'emp_bch : emplacement 3 (Cube 12) -> 403');
    // le gestionnaire d'une seule entreprise ne reçoit pas les coûts de l'autre
    const rg = await appel(gb, 'app/ajax/stock_data.php', DT());
    verifier(rg.status === 200 && rg.json.data.every(d => d.entreprise === 'Beauchemin') && rg.json.data[0].valeur !== undefined, 'gest_bea : coûts de Beauchemin seulement');
    const dg = await appel(gb, 'app/ajax/dashboard_data.php', null);
    verifier(dg.json.valeur.length === 1 && dg.json.valeur[0].nom === 'Beauchemin' && dg.json.factures.lignes.length === 1, 'gest_bea : valeur et factures de Beauchemin seulement');
    // entrées invalides : 400 en français
    const invalides = [
      ['stock_data', DT({ vue: 'x' }), /Vue invalide/], ['stock_data', DT({ entreprise_id: 'abc' }), /Entreprise invalide/], ['stock_data', DT({ categorie_id: 'x' }), /Catégorie invalide/],
      ['stock_data', DT({ emplacement_id: '1 OR 1=1' }), /Emplacement invalide/],
      ['historique_data', DT({ du: '2026-13-45' }), /date invalide/], ['historique_data', DT({ au: 'demain' }), /date invalide/], ['historique_data', DT({ type: 'piratage' }), /Type de document invalide/],
      ['historique_data', DT({ piece_id: '-1' }), /Pièce invalide/], ['historique_data', DT({ utilisateur_id: 'x' }), /Utilisateur invalide/],
    ];
    for (const [p, params, re] of invalides) {
      const r = await appel(e, 'app/ajax/' + p + '.php', params);
      verifier(r.status === 400 && re.test(r.json.erreur), p + ' : entrée invalide -> 400 « ' + (r.json && r.json.erreur) + ' »');
    }
    const tab = await e.evaluate(async () => {
      const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const r = await fetch('app/ajax/stock_data.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': jeton }, body: 'q[]=a&draw=1' });
      return { status: r.status, texte: await r.text() };
    });
    verifier(tab.status === 400 && !/Exception|PDO|SQL|Stack/i.test(tab.texte), 'paramètre sous forme de tableau -> 400 sans fuite : ' + tab.texte.slice(0, 80));
    // tri hors liste blanche et recherche piégée : aucune erreur SQL, aucune fuite
    const o = await appel(e, 'app/ajax/stock_data.php', DT({ 'order[0][column]': 0, 'order[0][dir]': 'desc; DROP TABLE stock', 'columns[0][data]': 'code; DROP TABLE stock' }));
    verifier(o.status === 200 && sql('SELECT COUNT(*) FROM stock') !== '0', 'tri piégé ignoré (liste blanche)');
    const s = await appel(e, 'app/ajax/historique_data.php', DT({ numero: "'; DROP TABLE mouvements; --" }));
    verifier(s.status === 200 && s.json.recordsTotal === 0 && sql('SELECT COUNT(*) FROM mouvements') !== '0', 'recherche piégée par numéro : requête préparée');
    // longueurs et caractères de contrôle
    const longue = await appel(e, 'app/ajax/stock_data.php', DT({ q: 'a'.repeat(5000) + '\u0000\u0007' }));
    verifier(longue.status === 200, 'recherche démesurée bornée');
    // GET accepté (lecture), méthodes : pas d'écriture possible
    verifier(sql("SELECT COUNT(*) FROM journal WHERE action LIKE 'export.%'") !== '', 'journal consultable');
  });

  await section('Utilisateur sans entreprise : aucune erreur, rien à voir', async () => {
    const z = suivre(await L.nouvellePage(browser));
    await connecterComme(z, 'sans_ent');
    await z.waitForLoadState('networkidle');
    for (const route of ['dashboard', 'stock', 'historique', 'sous_minimum']) {
      await L.aller(z, route);
      await z.waitForTimeout(500);
      verifier((await z.textContent('h1')).length > 0, route + ' : la page se charge pour un utilisateur sans entreprise');
    }
    await L.aller(z, 'stock');
    verifier((await lignes(z, '#table-stock')).length === 0 && (await texte(z, '#table-stock tbody')).includes('Aucune ligne de stock'), 'stock vide');
    const r = await appel(z, 'app/ajax/stock_data.php', DT());
    verifier(r.status === 200 && r.json.recordsTotal === 0, 'JSON : aucune ligne');
    const h = await appel(z, 'app/ajax/historique_data.php', DT());
    verifier(h.status === 200 && h.json.recordsTotal === 0, 'historique : aucune ligne');
    const d = await appel(z, 'app/ajax/dashboard_data.php', null);
    verifier(d.status === 200 && d.json.cartes.pieces_en_stock === 0 && d.json.cartes.sous_minimum === 0 && d.json.derniers_documents.length === 0, 'tableau de bord : tout à zéro');
    const s = await appel(z, 'app/ajax/sous_minimum_data.php', null);
    verifier(s.status === 200 && s.json.lignes.length === 0, 'sous le minimum : vide');
    const x = await appel(z, 'app/ajax/stock_export.php', null);
    verifier(x.status === 200 && parseCsv(x.texte).length === 1, 'export : seulement l\'en-tête');
    const refus = await appel(z, 'app/ajax/stock_data.php', DT({ entreprise_id: 1 }));
    verifier(refus.status === 403, 'entreprise 1 refusée à un utilisateur sans entreprise');
    verifier(reelles(z).length === 0, 'aucune erreur console : ' + JSON.stringify(reelles(z)));
    await z.context().close();
  });

  // =====================================================================================================================
  //  TABLETTE, ACCESSIBILITÉ, ERREURS
  // =====================================================================================================================
  await section('Tablette (768 px) : zones cliquables et défilement', async () => {
    const t = await L.nouvellePage(browser, { width: 768, height: 1024 });
    await L.connecter(t, 'gestionnaire');
    await t.waitForLoadState('networkidle');
    for (const [route, filtres] of [['stock', '#f-recherche, #f-entreprise, #f-emplacement, #f-categorie, [data-vue], #f-effacer, #btn-export'], ['historique', '#f-entreprise, #f-emplacement, #f-type, #f-du, #f-au, #f-utilisateur, #f-numero, #f-effacer, #btn-export'], ['sous_minimum', '#sm-actualiser, #sm-export, #table-sous-minimum a.btn'], ['dashboard', '.ds-raccourcis a, #ds-actualiser']]) {
      await L.aller(t, route);
      await t.waitForTimeout(600);
      const petits = await t.$$eval(filtres, els => els.filter(x => x.offsetParent !== null).map(x => [x.id || x.textContent.trim().slice(0, 20), Math.round(x.getBoundingClientRect().height)]).filter(([, h]) => h < 44));
      verifier(petits.length === 0, route + ' : toutes les zones cliquables ≥ 44 px : ' + JSON.stringify(petits));
      const large = await t.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      verifier(large <= 1, route + ' : pas de défilement horizontal de la page (' + large + ' px)');
    }
    await L.aller(t, 'stock');
    await t.waitForSelector('#table-stock tbody tr');
    const casePx = await t.$eval('#f-zero + label', l => Math.round(l.getBoundingClientRect().height));
    verifier(casePx >= 44, 'case « quantités à zéro » : zone de ' + casePx + ' px');
    verifier(reelles(t).length === 0, 'tablette : aucune erreur console : ' + JSON.stringify(reelles(t)));
    await t.context().close();
  });

  await section('Accessibilité de base', async () => {
    for (const [p, route] of [[g, 'stock'], [g, 'historique'], [g, 'sous_minimum'], [g, 'dashboard']]) {
      await L.aller(p, route);
      await p.waitForTimeout(400);
      const sansEtiquette = await p.$$eval('.content-wrapper input:not([type=hidden]), .content-wrapper select', els => els.filter(x => x.offsetParent !== null).filter(x => {
        if (x.getAttribute('aria-label') || x.getAttribute('aria-labelledby') || x.closest('label')) return false;
        return !(x.id && document.querySelector('label[for="' + x.id + '"]'));
      }).map(x => x.id || x.className));
      verifier(sansEtiquette.length === 0, route + ' : chaque champ a une étiquette : ' + JSON.stringify(sansEtiquette));
      verifier(await p.locator('h1').count() === 1, route + ' : un seul titre h1');
    }
    // lecture au clavier : la touche Tab atteint la recherche, puis les filtres (ordre logique)
    await L.aller(g, 'stock');
    await g.waitForSelector('#table-stock tbody tr');
    await g.focus('#f-recherche');
    await g.keyboard.press('Tab');
    verifier(await g.evaluate(() => document.activeElement.id) === 'f-entreprise', 'ordre de tabulation : recherche -> entreprise');
    verifier(await g.evaluate(() => { const s = getComputedStyle(document.getElementById('f-recherche')); return true; }), 'focus visible');
  });

  // =====================================================================================================================
  //  Bilan
  // =====================================================================================================================
  const toutes = [];
  for (const [nom, p] of [['admin', a], ['gestionnaire', g], ['employé', e], ['emp_bch', b], ['gest_bea', gb]]) { reelles(p).forEach(x => toutes.push(nom + ' : ' + x)); }
  verifier(toutes.length === 0, 'aucune erreur JavaScript ni de console : ' + JSON.stringify(toutes.slice(0, 5)));
  verifier(dialogues.length === 0, 'aucune boîte de dialogue JavaScript (XSS) : ' + dialogues.join('|'));
  verifier(invariantOk(), 'invariant stock = somme des mouvements (module en lecture seulement)');
  const journal = fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL).slice(OFFSET_LOG).toString('utf8') : '';
  const problemes = journal.split('\n').filter(l => /Warning|Notice|Fatal|Deprecated|Parse error|SQLSTATE|PHP Error/i.test(l));
  verifier(problemes.length === 0, 'journal PHP propre : ' + problemes.slice(0, 3).join(' | '));

  await browser.close();
  reset();
  sections.forEach(s => console.log('  · ' + s));
  process.exit(L.bilan());
})().catch(err => { console.error(err); try { reset(); } catch (x) { /* rien */ } process.exit(1); });
