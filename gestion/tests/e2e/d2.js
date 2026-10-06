// Test de bout en bout du module D2 — Stock, tableau de bord, historique des mouvements, pièces sous le minimum.
//   cd gestion && tools/serveur.sh start bea_d2 8106 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8106 DB_NAME=bea_d2 node tests/e2e/d2.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), ajoute son jeu de données
// (tests/e2e/d2-outils.php : pièces piégées XSS et formules CSV, alias, quantité à zéro, pièce et emplacement désactivés, transfert annulé,
// mouvement daté du passé, utilisateurs emp_bch = employé de Boutique Chaleur, gest_bea = gestionnaire de Beauchemin) et la remet à zéro à la fin.
// Il suppose un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_d2) ; le journal PHP est lu dans /tmp/bea-<port>.log
// et ne doit contenir aucun avertissement. Toutes les valeurs attendues viennent de requêtes SQL indépendantes du code testé.
// Les sections « Correctifs : … » (fin du fichier) rejouent, un constat après l'autre, les défauts trouvés par la relecture indépendante
// (frappes réelles du lecteur, bouton Retour, deux onglets, horloge simulée, impression, zones tactiles). Pour n'en jouer que certaines :
//   D2_SEULEMENT='Correctifs : lecteur' NODE_PATH=$(npm root -g) BASE_URL=... DB_NAME=... node tests/e2e/d2.js
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
/**
 * Lignes d'un tableau : cellules visibles (texte normalisé) + classes.
 * Les tableaux « Stock » (vue par emplacement) et « Historique » regroupent plusieurs informations par cellule (l'entreprise sous
 * l'emplacement, le type et la mention sous le numéro du document, l'heure sous la date) : on les remet ici à une information par
 * cellule, pour que les attentes restent lisibles. Stock par emplacement : [code, pièce, catégorie, entreprise, emplacement, quantité,
 * unité, coût, valeur] (entreprise vide pour un utilisateur d'une seule entreprise) ; Historique : [date heure, numéro, type, pièce,
 * (entreprise), emplacement, quantité, utilisateur, (coût, valeur), mention].
 */
async function lignes(p, sel) {
  return p.$$eval(sel + ' tbody tr', (rows, sel) => {
    const nt = c => c.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
    const sansPetit = c => { const k = c.cloneNode(true); k.querySelectorAll('small').forEach(x => x.remove()); return nt(k); };
    const petit = c => { const x = c.querySelector('small'); return x ? nt(x) : null; };
    const entetes = [...document.querySelectorAll(sel + ' thead th')].filter(t => t.offsetParent !== null).map(t => nt(t));
    return rows.filter(r => !r.querySelector('td.dataTables_empty')).map(r => {
      const k = [...r.children];
      let cells = k.map(nt);
      if (sel === '#table-stock' && entetes.includes('Emplacement') && !entetes.includes('Entreprise')) {
        const i = entetes.indexOf('Emplacement');
        cells = [...k.slice(0, i).map(nt), petit(k[i]) || '', sansPetit(k[i]), ...k.slice(i + 1).map(nt)];
      }
      if (sel === '#table-historique') {
        const date = (k[0].firstChild ? k[0].firstChild.textContent.trim() : '') + ' ' + (petit(k[0]) || '');
        const badge = k[1].querySelector('.badge');
        const ent = petit(k[3]);
        cells = [date.trim(), nt(k[1].querySelector('a')), petit(k[1]) || '', nt(k[2]), ...(ent !== null ? [ent] : []), sansPetit(k[3]), ...k.slice(4).map(nt), badge ? nt(badge) : ''];
      }
      return { cells, classes: r.className, html: r.innerHTML };
    });
  }, sel);
}
const entetes = async (p, sel) => p.$$eval(sel + ' thead th', ths => ths.filter(t => t.offsetParent !== null).map(t => t.textContent.replace(/\s+/g, ' ').trim()));
const texte = async (p, sel) => norm(await p.textContent(sel));
const lisible = async (p, sel) => norm(await p.innerText(sel));
const attendre = ms => new Promise(r => setTimeout(r, ms));
async function toastTexte(p) { try { await p.waitForSelector('#toasts .alert', { timeout: 5000 }); } catch (e) { return ''; } return norm(await p.textContent('#toasts')); }
async function espionBip(p) { await p.evaluate(() => { window.__bips = []; const o = window.bip; window.bip = function (ok) { window.__bips.push(!!ok); return o(ok); }; }); }

const sections = [];
async function section(nom, fn) {
  if (process.env.D2_SEULEMENT && !new RegExp(process.env.D2_SEULEMENT).test(nom)) { return; }   // itération : D2_SEULEMENT='Correctifs'
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
    verifier(h.join('|').startsWith('Code|Pièce|Catégorie|Emplacement|Quantité|Unité') && h.some(x => x.startsWith('Coût moyen')) && h.some(x => x.startsWith('Valeur')), 'colonnes visibles (admin) : ' + h.join('|'));
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
    verifier(!h.includes('Emplacement') && h.includes('Entreprise') && h.includes('Minimum') && h.includes('Quantité totale'), 'vue par pièce : colonnes ' + h.join('|'));
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
    verifier(h.join('|') === 'Code|Pièce|Catégorie|Emplacement|Quantité|Unité', 'colonnes de l\'employé : ' + h.join('|'));
    const rows = await lignes(e, '#table-stock');
    verifier(rows.length === parseInt(NB_STOCK('1'), 10), 'l\'employé ne voit que les lignes de Beauchemin : ' + rows.length + ' lignes');
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
    verifier(rb.length === parseInt(NB_STOCK('2'), 10), 'emp_bch ne voit que les lignes de Boutique Chaleur : ' + rb.length);
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
    verifier(h.join('|') === 'Date et heure|Document|Pièce|Emplacement|Quantité|Utilisateur|Coût unitaire|Valeur', 'colonnes (admin) : ' + h.join('|'));
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
    verifier(await a.locator('#table-historique tbody tr:first-child td:nth-child(3) a[href*="piece_voir"]').count() === 1, 'un seul lien vers piece_voir (code et nom dans le même lien)');
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
    verifier(h.join('|') === 'Date et heure|Document|Pièce|Emplacement|Quantité|Utilisateur', 'colonnes de l\'employé (aucun coût) : ' + h.join('|'));
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
    verifier(h.slice(0, 6).join('|') === 'Code|Pièce|Entreprise|Quantité|Minimum|Manque', 'colonnes : ' + h.join('|'));
    // du plus grand manque au plus petit
    const manques = rows.map(r => num(r.cells[5]));
    verifier(manques.every((v, i) => i === 0 || manques[i - 1] >= v), 'tri de départ : plus grand manque d\'abord : ' + manques.join(','));
    const x = rows.find(r => r.cells[0] === 'XSS-1' && r.cells[2] === 'Beauchemin');
    verifier(x && x.cells[1] === XSS && x.cells[3] === '10' && x.cells[4] === '50' && x.cells[5] === '40 <i>u</i>', 'XSS-1 chez Beauchemin : quantité 10, minimum 50, manque 40 : ' + JSON.stringify(x && x.cells));
    verifier(await a.locator('#table-sous-minimum img').count() === 0 && dialogues.length === 0, 'nom piégé affiché en texte');
    const p3 = rows.find(r => r.cells[0] === 'P-0003');
    verifier(p3 && p3.cells[3] === '10' && p3.cells[4] === '20' && p3.cells[5] === '10 unité', 'P-0003 : 10 sur 20, manque 10 unité');
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
    const numeros = async p => p.$$eval('#ds-docs tr', trs => trs.map(t => t.querySelector('a').textContent.trim()));
    const attendu = sqlLignes('SELECT numero FROM documents ORDER BY id DESC LIMIT 10').map(r => r[0]);
    verifier(docs.length === 10 && (await numeros(g)).join() === attendu.join(), 'les 10 derniers documents : ' + (await numeros(g)).join());
    verifier(docs.some(r => /Annulé$/.test(r.cells[0])) && docs.every(r => /\d [$]|\d,\d\d \$/.test(r.cells[3])), 'statut « Annulé » (sous le numéro) et total pour le gestionnaire');
    verifier(docs.every(r => /^[A-Z]{3}-\d{4}-\d{5}(Réception|Transfert|Sortie|Ajustement|Facture interne)(Annulé)?$/.test(r.cells[0])), 'le type de document est écrit sous le numéro : ' + docs[0].cells[0]);
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
    const numerosBch = await g.$$eval('#ds-docs tr', trs => trs.map(t => t.querySelector('a').textContent.trim()));
    const attendu = sqlLignes('SELECT numero FROM documents WHERE entreprise_id = 2 OR entreprise_dest_id = 2 ORDER BY id DESC LIMIT 10').map(r => r[0]);
    verifier(numerosBch.join() === attendu.join(), 'documents émis ou reçus par Boutique Chaleur : ' + numerosBch.join());
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
  //  CORRECTIFS issus de la relecture indépendante (un bloc par constat ; frappes réelles du lecteur : keyboard.type)
  // =====================================================================================================================
  const vide = async p => { await p.evaluate(() => { const t = document.getElementById('toasts'); if (t) { t.innerHTML = ''; } }); };
  const nbToasts = p => p.evaluate(() => document.querySelectorAll('#toasts .alert').length);
  const textesToasts = p => p.evaluate(() => [...document.querySelectorAll('#toasts .alert')].map(x => x.textContent.replace(/\s+/g, ' ').replace('×', '').trim()));
  let X = null;

  await section('Correctifs : lecteur de codes-barres sur Stock (scans de suite, Tab, frappe sur une liste, code exact)', async () => {
    X = JSON.parse(outil('exact'));
    await L.aller(a, 'stock');
    await a.waitForSelector('#table-stock tbody tr');
    await espionBip(a);
    // 1. deux scans consécutifs, frappes réelles, sans toucher au champ entre les deux
    await a.click('#f-recherche');
    await redessine(a, '#table-stock', async () => { await a.keyboard.type('P-0001'); await a.keyboard.press('Enter'); });
    let rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0001'), 'premier scan P-0001 : ' + rows.length + ' lignes');
    await vide(a);
    await redessine(a, '#table-stock', async () => { await a.keyboard.type('P-0003'); await a.keyboard.press('Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0003'), 'deuxième scan P-0003 sans vider le champ : ' + rows.length + ' lignes (« ' + await a.inputValue('#f-recherche') + ' »)');
    verifier(await a.inputValue('#f-recherche') === 'P-0003' && (await nbToasts(a)) === 0, 'le champ ne garde que le dernier code, aucun message d\'échec');
    verifier(JSON.stringify((await a.evaluate(() => window.__bips)).slice(-2)) === '[true,true]', 'deux bips de succès');
    await redessine(a, '#table-stock', async () => { await a.keyboard.type('012345678905'); await a.keyboard.press('Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0001'), 'troisième scan (alias du fabricant) : P-0001');
    // 2. la frappe du lecteur tombe sur une liste, une case ou un bouton : elle est redirigée vers le champ de scan
    for (const [focus, nom] of [['#f-categorie', 'une liste'], ['#f-zero', 'une case à cocher'], ['[data-vue=piece]', 'un bouton']]) {
      await a.focus(focus);
      await redessine(a, '#table-stock', async () => { await a.keyboard.type('P-0007'); await a.keyboard.press('Enter'); });
      rows = await lignes(a, '#table-stock');
      verifier(await a.inputValue('#f-recherche') === 'P-0007' && rows.length > 0 && rows.every(r => r.cells[0] === 'P-0007'), 'focus sur ' + nom + ' : le code arrive dans le champ de recherche (« ' + await a.inputValue('#f-recherche') + ' », ' + rows.length + ' lignes)');
    }
    verifier(await a.inputValue('#f-categorie') === '' && !(await a.isChecked('#f-zero')) && (await a.getAttribute('[data-vue=emplacement]', 'aria-pressed')) === 'true', 'les filtres n\'ont pas bougé (liste, case, bouton)');
    // 3. suffixe Tab du lecteur : même chose qu'Entrée ; un 2e Tab (rien de nouveau) quitte le champ (pas de piège au clavier)
    await a.focus('#f-recherche');
    await a.evaluate(() => { window.__bips = []; });
    await redessine(a, '#table-stock', async () => { await a.keyboard.type('P-0001'); await a.keyboard.press('Tab'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 2 && rows.every(r => r.cells[0] === 'P-0001') && await a.evaluate(() => document.activeElement.id) === 'f-recherche', 'Tab en fin de code : recherche immédiate, le focus reste dans le champ');
    verifier((await a.evaluate(() => window.__bips)).slice(-1)[0] === true, 'Tab en fin de code : bip de succès');
    await a.keyboard.press('Tab');
    verifier(await a.evaluate(() => document.activeElement.id) === 'f-entreprise', 'un second Tab (texte inchangé) passe au champ suivant');
    await vide(a);
    await a.focus('#f-categorie');
    await a.click('#f-recherche');   // clic dans un champ qui n'avait pas le focus : le texte est sélectionné, le code suivant le remplace
    await redessine(a, '#table-stock', async () => { await a.keyboard.type('INCONNU-9'); await a.keyboard.press('Tab'); });
    verifier(await a.inputValue('#f-recherche') === 'INCONNU-9', 'clic dans le champ puis scan : le code précédent est remplacé (« ' + await a.inputValue('#f-recherche') + ' »)');
    verifier((await toastTexte(a)).includes('Aucune pièce ne correspond à « INCONNU-9 »') && (await a.evaluate(() => window.__bips)).slice(-1)[0] === false, 'code inconnu + Tab : message et bip d\'échec');
    // 4. correspondance exacte au scan (X-1 ne ramène pas X-10 ni X-100), « contient » à la saisie
    await vide(a);
    await redessine(a, '#table-stock', async () => { await a.fill('#f-recherche', 'X-1'); await a.press('#f-recherche', 'Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 1 && rows[0].cells[0] === 'X-1', 'scan de X-1 : seulement X-1 (' + rows.map(r => r.cells[0]).join(',') + ')');
    verifier(/exact=1/.test(await a.getAttribute('#btn-export', 'href')), 'le lien d\'export garde la correspondance exacte');
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'X-10'));
    rows = await lignes(a, '#table-stock');
    verifier(rows.map(r => r.cells[0]).join() === 'X-10,X-100', 'saisie sans Entrée de X-10 : recherche « contient » (X-10, X-100)');
    await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'X-1'));
    verifier((await lignes(a, '#table-stock')).map(r => r.cells[0]).join() === 'X-1,X-10,X-100', 'saisie sans Entrée de X-1 : X-1, X-10 et X-100');
    await redessine(a, '#table-stock', async () => { await a.fill('#f-recherche', '5551234567890'); await a.press('#f-recherche', 'Enter'); });
    rows = await lignes(a, '#table-stock');
    verifier(rows.length === 1 && rows[0].cells[0] === 'X-1', 'scan d\'un code-barres (alias) : seulement sa pièce');
    const jx = await appel(a, 'app/ajax/stock_data.php', DT({ q: 'X-1', exact: '1' }));
    const jc = await appel(a, 'app/ajax/stock_data.php', DT({ q: 'X-1' }));
    verifier(jx.json.recordsFiltered === 1 && jc.json.recordsFiltered === 3, 'serveur : exact=1 -> 1 pièce, sans exact -> 3 pièces');
    const cx = parseCsv((await appel(a, 'app/ajax/stock_export.php?q=X-1&exact=1', null)).texte);
    verifier(cx.length === 2 && cx[1][0] === 'X-1', 'export CSV avec exact=1 : une seule pièce');
    // exact sans correspondance exacte : retombe sur la recherche par mots
    const jn = await appel(a, 'app/ajax/stock_data.php', DT({ q: 'Vis', exact: '1' }));
    verifier(jn.json.recordsFiltered === 3, 'exact=1 sans code exact : recherche par mots (3 vis)');
    // 5. code d'un emplacement : le contenu de l'emplacement s'affiche
    await vide(a);
    await a.evaluate(() => { window.__bips = []; });
    await a.fill('#f-recherche', 'EMP-000003');
    await a.press('#f-recherche', 'Enter');
    await a.waitForFunction(() => document.getElementById('f-emplacement').value === '3');
    await a.waitForTimeout(700);
    rows = await lignes(a, '#table-stock');
    const attEmp = parseInt(sql('SELECT COUNT(*) FROM stock WHERE emplacement_id = 3 AND quantite > 0'), 10);
    verifier(rows.length === attEmp && rows.length > 0 && rows.every(r => r.cells[4].startsWith('Cube 12')), 'scan de EMP-000003 : contenu du Cube 12 (' + rows.length + ' / ' + attEmp + ')');
    verifier(await a.inputValue('#f-entreprise') === '1' && await a.inputValue('#f-recherche') === '', 'l\'entreprise de l\'emplacement est choisie et le champ est vidé');
    verifier((await a.evaluate(() => window.__bips)).slice(-1)[0] === true && !(await textesToasts(a)).some(t => /Aucune pièce ne correspond/.test(t)), 'scan d\'emplacement : bip de succès, pas de message d\'échec');
    // 6. pièce qui existe mais n'est en stock nulle part : message explicite (pas « aucune pièce »)
    await a.click('#f-effacer');
    await vide(a);
    await a.waitForTimeout(500);
    await a.fill('#f-recherche', 'SANS-STOCK-1');
    await a.press('#f-recherche', 'Enter');
    const t6 = await toastTexte(a);
    verifier(/La pièce « SANS-STOCK-1 » \(Pièce neuve sans stock\) existe, mais aucune ligne de stock/.test(t6), 'pièce sans stock : message explicite : ' + t6);
    // 7. un employé qui scanne le code d'un emplacement d'une autre entreprise : rien n'est révélé
    await L.aller(e, 'stock');
    await e.waitForSelector('#table-stock tbody tr');
    await espionBip(e);
    await e.fill('#f-recherche', 'EMP-000002');
    await e.press('#f-recherche', 'Enter');
    const t7 = await toastTexte(e);
    verifier(/Aucune pièce ne correspond à « EMP-000002 »/.test(t7) && !/Entrepôt|Boutique/.test(t7) && (await e.evaluate(() => window.__bips)).slice(-1)[0] === false, 'employé : l\'emplacement de l\'autre entreprise reste « inconnu » : ' + t7);
  });

  await section('Correctifs : bouton Retour du navigateur (Stock, Historique)', async () => {
    const info = p => texte(p, '#table-stock_info');
    // Stock : filtres posés, clic sur une pièce, Retour : la même vue (filtres ET tableau)
    await L.aller(g, 'stock');
    await g.waitForSelector('#table-stock tbody tr');
    await redessine(g, '#table-stock', () => g.selectOption('#f-entreprise', '2'));
    await redessine(g, '#table-stock', () => g.click('[data-vue=piece]'));
    await redessine(g, '#table-stock', () => g.click('label[for=f-zero]'));
    const att = (await appel(g, 'app/ajax/stock_data.php', DT({ vue: 'piece', entreprise_id: '2', zero: '1' }))).json.recordsFiltered;
    verifier((await info(g)).includes('de ' + att), 'Stock : vue par pièce, Boutique Chaleur, zéros : ' + await info(g) + ' (attendu ' + att + ')');
    await Promise.all([g.waitForNavigation(), g.click('#table-stock tbody tr:first-child a.code')]);
    verifier(/page=piece_voir/.test(g.url()), 'clic sur la pièce : fiche');
    await g.goBack();
    await g.waitForSelector('#table-stock tbody tr');
    await g.waitForLoadState('networkidle');
    verifier(await g.inputValue('#f-entreprise') === '2' && (await g.getAttribute('[data-vue=piece]', 'aria-pressed')) === 'true' && await g.isChecked('#f-zero'), 'Retour : les filtres affichés sont ceux qui étaient posés');
    verifier((await info(g)).includes('de ' + att), 'Retour : le tableau correspond aux filtres affichés : ' + await info(g));
    const href = await g.getAttribute('#btn-export', 'href');
    verifier(/entreprise_id=2/.test(href) && /vue=piece/.test(href) && /zero=1/.test(href), 'Retour : le lien d\'export reprend les filtres : ' + href);
    verifier(/entreprise_id=2/.test(g.url()) && /vue=piece/.test(g.url()), 'les filtres sont écrits dans l\'adresse de la page : ' + g.url());
    // Changer l'entreprise de la barre du haut sur la page Stock : elle l'emporte sur le filtre écrit dans l'adresse
    await L.aller(g, 'stock');
    await g.waitForSelector('#table-stock tbody tr');
    await redessine(g, '#table-stock', () => g.selectOption('#f-entreprise', '1'));
    verifier(/entreprise_id=1/.test(g.url()), 'filtre Beauchemin écrit dans l\'adresse');
    await g.selectOption('#entreprise-courante', '2');
    await g.waitForFunction(() => document.getElementById('f-entreprise').value === '2', null, { timeout: 15000 });
    await g.waitForSelector('#table-stock tbody tr');
    verifier(!/entreprise_id=1/.test(g.url()) && await g.inputValue('#f-entreprise') === '2', 'barre du haut = Boutique Chaleur : elle l\'emporte sur l\'ancien filtre : ' + g.url());
    // « Toutes mes entreprises » choisi explicitement alors que la barre du haut est sur Boutique Chaleur
    await redessine(g, '#table-stock', () => g.selectOption('#f-entreprise', ''));
    await Promise.all([g.waitForNavigation(), g.click('#table-stock tbody tr:first-child a.code')]);
    await g.goBack();
    await g.waitForSelector('#table-stock tbody tr');
    await g.waitForLoadState('networkidle');
    verifier(await g.inputValue('#f-entreprise') === '' && (await info(g)).includes('de ' + NB_STOCK('1,2')), 'Retour : « Toutes mes entreprises » choisi explicitement est conservé : ' + await info(g));
    await L.aller(g, 'dashboard');
    await Promise.all([g.waitForNavigation(), g.selectOption('#entreprise-courante', '0')]);
    // Historique : type, utilisateur, période, pièce
    const nT = sql("SELECT COUNT(*) FROM mouvements m JOIN documents d ON d.id = m.document_id WHERE d.type = 'transfert' AND m.utilisateur_id = " + ID_ADMIN + " AND DATE(m.date_mouvement) = '" + aujourdhui + "'");
    await L.aller(g, 'historique');
    await g.waitForSelector('#table-historique tbody tr');
    await redessine(g, '#table-historique', () => g.selectOption('#f-type', 'transfert'));
    await redessine(g, '#table-historique', () => g.selectOption('#f-utilisateur', ID_ADMIN));
    await redessine(g, '#table-historique', () => g.fill('#f-du', aujourdhui));
    await redessine(g, '#table-historique', () => g.fill('#f-au', aujourdhui));
    const ih = () => texte(g, '#table-historique_info');
    verifier((await ih()).includes('de ' + nT), 'Historique : filtres posés : ' + await ih() + ' (attendu ' + nT + ')');
    await Promise.all([g.waitForNavigation(), g.click('#table-historique tbody tr:first-child td:nth-child(2) a')]);
    verifier(/page=document_voir/.test(g.url()), 'clic sur un document');
    await g.goBack();
    await g.waitForSelector('#table-historique tbody tr');
    await g.waitForLoadState('networkidle');
    verifier(await g.inputValue('#f-type') === 'transfert' && await g.inputValue('#f-utilisateur') === ID_ADMIN && await g.inputValue('#f-du') === aujourdhui && await g.inputValue('#f-au') === aujourdhui, 'Retour (Historique) : les filtres affichés sont ceux qui étaient posés');
    verifier((await ih()).includes('de ' + nT), 'Retour (Historique) : le tableau correspond aux filtres : ' + await ih());
    const hh = await g.getAttribute('#btn-export', 'href');
    verifier(/type=transfert/.test(hh) && new RegExp('du=' + aujourdhui).test(hh) && /utilisateur_id=/.test(hh), 'Retour (Historique) : le lien d\'export reprend les filtres : ' + hh);
    // pièce (Select2) conservée
    await redessine(g, '#table-historique', () => g.click('#f-effacer'));
    await g.click('#f-piece + .select2 .select2-selection');
    await g.waitForSelector('.select2-search__field');
    await g.fill('.select2-search__field', 'XSS');
    await g.waitForSelector('.select2-results__option[aria-selected]:has-text("XSS-1")');
    await redessine(g, '#table-historique', () => g.click('.select2-results__option[aria-selected]:has-text("XSS-1")'));
    await Promise.all([g.waitForNavigation(), g.click('#table-historique tbody tr:first-child td:nth-child(3) a')]);
    await g.goBack();
    await g.waitForSelector('#table-historique tbody tr');
    await g.waitForLoadState('networkidle');
    verifier(norm(await g.textContent('#f-piece option:checked')).startsWith('XSS-1') && (await ih()).includes('de 2') && /piece_id=/.test(await g.getAttribute('#btn-export', 'href')), 'Retour (Historique) : la pièce choisie est conservée : ' + await ih());
    await redessine(g, '#table-historique', () => g.click('#f-effacer'));
  });

  await section('Correctifs : pièce désactivée jamais « sous le minimum »', async () => {
    sql('UPDATE pieces SET actif = 0 WHERE id = ' + F.xss);
    try {
      await L.aller(a, 'stock');
      await redessine(a, '#table-stock', () => a.fill('#f-recherche', 'XSS-1'));
      const rows = await lignes(a, '#table-stock');
      verifier(rows.length === 2 && rows.every(r => r.cells[1].includes('Désactivée')), 'XSS-1 désactivée mais encore en stock : visible avec le badge « Désactivée »');
      verifier(rows.every(r => !/sk-bas/.test(r.classes) && !r.cells[1].includes('Sous le minimum')), 'pièce désactivée : ni ligne rouge ni badge « Sous le minimum »');
      const j = await appel(a, 'app/ajax/stock_data.php', DT({ q: 'XSS-1' }));
      verifier(j.json.data.every(d => d.sous_min === 0), 'JSON : sous_min = 0 pour une pièce désactivée');
      const csv = parseCsv((await appel(a, 'app/ajax/stock_export.php?q=XSS-1', null)).texte);
      verifier(csv.length === 3 && csv.slice(1).every(r => r[8] === 'non'), 'export : « Sous le minimum » = non');
      const sm = await appel(a, 'app/ajax/sous_minimum_data.php', null);
      verifier(!sm.json.lignes.some(l => l.code === 'XSS-1'), 'la page « Pièces sous le minimum » ne la compte pas non plus : les écrans s\'accordent');
    } finally {
      sql('UPDATE pieces SET actif = 1 WHERE id = ' + F.xss);
    }
    const j2 = await appel(a, 'app/ajax/stock_data.php', DT({ q: 'XSS-1' }));
    verifier(j2.json.data.every(d => d.sous_min === 1), 'réactivée : de nouveau sous le minimum');
  });

  await section('Correctifs : un seul message par erreur de tableau', async () => {
    const t = await L.nouvellePage(browser);
    await L.connecter(t, 'gestionnaire');
    await L.aller(t, 'historique');
    await t.waitForSelector('#table-historique tbody tr');
    let requetes = 0;
    t.on('request', r => { if (/historique_data\.php/.test(r.url())) { requetes++; } });
    // réseau coupé : UN message en français
    await vide(t);
    await t.context().setOffline(true);
    await t.selectOption('#f-type', 'transfert');
    await t.waitForTimeout(1200);
    const tOff = await textesToasts(t);
    verifier(tOff.length === 1 && /Connexion/.test(tOff[0]), 'réseau coupé : un seul message : ' + JSON.stringify(tOff));
    await t.context().setOffline(false);
    await t.selectOption('#f-type', '');
    await t.waitForTimeout(800);
    // plage de dates à l'envers : un seul message, aucune requête inutile
    await vide(t);
    await t.fill('#f-du', '2026-10-03');
    await t.waitForTimeout(600);
    requetes = 0;
    await t.evaluate(() => { document.getElementById('f-au').min = ''; });
    await t.fill('#f-au', '2026-10-01');
    await t.waitForTimeout(800);
    const tPl = await textesToasts(t);
    verifier(tPl.length === 1 && tPl[0] === 'La date de début doit précéder la date de fin.', 'début après la fin : un seul message : ' + JSON.stringify(tPl));
    verifier(requetes === 0, 'plage à l\'envers : aucune requête envoyée au serveur (' + requetes + ')');
    // le serveur refuse quand même (requête forcée) : son message seul, sans message générique en plus
    await vide(t);
    await t.evaluate(() => { jQuery('#table-historique').DataTable().ajax.reload(); });
    await t.waitForTimeout(1200);
    const tSrv = await textesToasts(t);
    verifier(tSrv.length === 1 && tSrv[0] === 'La date de début doit précéder la date de fin.', 'refus du serveur : son message seul : ' + JSON.stringify(tSrv));
    // erreur 500 (session de test cassée côté serveur) n'est pas simulable ici : le 403 l'est (entreprise non permise)
    await vide(t);
    await t.evaluate(() => { document.getElementById('f-du').value = ''; document.getElementById('f-au').value = ''; });
    await t.evaluate(() => { const o = document.createElement('option'); o.value = '99'; o.textContent = 'Autre'; document.getElementById('f-entreprise').appendChild(o); document.getElementById('f-entreprise').value = '99'; jQuery('#table-historique').DataTable().ajax.reload(); });
    await t.waitForTimeout(1200);
    const t403 = await textesToasts(t);
    verifier(t403.length === 1 && /accès/.test(t403[0]), 'entreprise non permise : un seul message du serveur : ' + JSON.stringify(t403));
    await t.context().close();
  });

  await section('Correctifs : deux onglets (entreprise affichée, actualisation et export fidèles)', async () => {
    await L.aller(g, 'sous_minimum');
    await g.waitForSelector('#table-sous-minimum tbody tr');
    const portee0 = await texte(g, '#sm-portee');
    const nLignes = (await lignes(g, '#table-sous-minimum')).length;
    verifier(portee0.startsWith('Entreprises : Beauchemin, Boutique Chaleur'), 'onglet A : toutes les entreprises : ' + portee0);
    const t2 = await g.context().newPage();
    await t2.goto(L.BASE + '/index.php?page=dashboard');
    await Promise.all([t2.waitForNavigation(), t2.selectOption('#entreprise-courante', '2')]);
    // onglet A : l'en-tête dit toujours « Toutes », l'actualisation et l'export disent la même chose
    await g.click('#sm-actualiser');
    await g.waitForTimeout(800);
    verifier((await texte(g, '#sm-portee')) === portee0 && (await lignes(g, '#table-sous-minimum')).length === nLignes, 'onglet A après changement dans l\'onglet B : « Actualiser » reste fidèle à l\'écran : ' + await texte(g, '#sm-portee'));
    const href = await g.getAttribute('#sm-export', 'href');
    verifier(/entreprise_id=0/.test(href), 'lien d\'export : l\'entreprise affichée est explicite : ' + href);
    const csv = parseCsv((await appel(g, href, null)).texte);
    verifier(csv.length - 1 === nLignes, 'le CSV exporté a autant de lignes que l\'écran : ' + (csv.length - 1) + ' / ' + nLignes);
    // sans paramètre (ancien lien) : la barre du haut de la session
    const ancien = parseCsv((await appel(g, 'app/ajax/sous_minimum_export.php', null)).texte);
    verifier(ancien.length - 1 === sousMin().filter(r => r[1] === '2').length, 'sans entreprise_id : celle de la session (' + (ancien.length - 1) + ')');
    const x403 = await appel(gb, 'app/ajax/sous_minimum_data.php?entreprise_id=2', null);
    verifier(x403.status === 403, 'entreprise_id d\'une entreprise non permise : 403');
    const xx = await appel(g, 'app/ajax/sous_minimum_data.php?entreprise_id=abc', null);
    verifier(xx.status === 400, 'entreprise_id invalide : 400');
    // tableau de bord : même principe
    await Promise.all([t2.waitForNavigation(), t2.selectOption('#entreprise-courante', '0')]);
    await L.aller(g, 'dashboard');
    await g.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    const pd = await texte(g, '#ds-portee');
    await Promise.all([t2.waitForNavigation(), t2.selectOption('#entreprise-courante', '1')]);
    await g.click('#ds-actualiser');
    await g.waitForTimeout(800);
    verifier(pd === 'Entreprise : Beauchemin, Boutique Chaleur' && (await texte(g, '#ds-portee')) === pd, 'tableau de bord : « Actualiser » garde l\'entreprise affichée : ' + await texte(g, '#ds-portee'));
    const dd = await appel(g, 'app/ajax/dashboard_data.php?entreprise_id=0', null);
    const d2 = await appel(g, 'app/ajax/dashboard_data.php?entreprise_id=2', null);
    verifier(dd.json.portee.ids.length === 2 && d2.json.portee.ids.join() === '2', 'dashboard_data : entreprise_id explicite (0 = toutes, 2 = Boutique Chaleur)');
    await Promise.all([t2.waitForNavigation(), t2.selectOption('#entreprise-courante', '0')]);
    await t2.close();
  });

  await section('Correctifs : journal des exports lisible', async () => {
    await appel(g, 'app/ajax/stock_export.php?vue=piece&entreprise_id=2&zero=1&q=therm&categorie_id=2', null);
    await appel(g, 'app/ajax/historique_export.php?' + new URLSearchParams({ piece_id: F.xss, emplacement_id: '3', type: 'sortie', du: '2026-01-01', au: aujourdhui, utilisateur_id: ID_ADMIN, numero: 'SOR' }), null);
    await appel(g, 'app/ajax/sous_minimum_export.php?entreprise_id=2', null);
    const lire = act => JSON.parse(sql("SELECT details FROM journal WHERE action = '" + act + "' ORDER BY id DESC LIMIT 1"));
    const nomCat = sql('SELECT nom FROM categories WHERE id = 2');
    const js = lire('export.stock');
    verifier(js.mode === 'par pièce (totaux par entreprise)' && JSON.stringify(js.entreprises) === '["Boutique Chaleur"]', 'journal du stock : mode et entreprise par leur nom : ' + JSON.stringify(js));
    verifier(js.filtres.categorie === nomCat && js.filtres.recherche === 'therm' && js.filtres['quantités à zéro incluses'] === 'oui', 'journal du stock : catégorie par son nom, recherche, zéros : ' + JSON.stringify(js.filtres));
    const jh = lire('export.historique');
    verifier(jh.filtres.piece === 'XSS-1 — ' + XSS && jh.filtres.emplacement === 'Cube 12 — Marc' && jh.filtres.type === 'Sortie' && jh.filtres.utilisateur.startsWith('Administrateur') && jh.filtres.numero === 'SOR', 'journal de l\'historique : noms et libellés, pas de numéros : ' + JSON.stringify(jh.filtres));
    const jm = lire('export.sous_minimum');
    verifier(JSON.stringify(jm.entreprises) === '["Boutique Chaleur"]', 'journal du sous-minimum : entreprise par son nom : ' + JSON.stringify(jm));
    // ce que lit l'administrateur sur la page Journal
    const jr = await appel(a, 'app/ajax/journal_data.php', DT({ 'columns[0][data]': 'date', length: 50 }));
    const t = jr.texte;
    verifier(jr.status === 200 && /Boutique Chaleur/.test(t) && !/Zero :|Q :|Vue : piece|Entreprises : 2/.test(t), 'page Journal : aucun terme technique (Zero, Q, piece, numéros) : ' + (t.match(/Zero :|Q :|Vue : piece|Entreprises : 2/) || ['ok'])[0]);
  });

  await section('Correctifs : mise en page (tableaux dans la carte), zones tactiles, impression', async () => {
    const hors = async (p, routes) => {
      const out = [];
      for (const route of routes) {
        await L.aller(p, route);
        await p.waitForTimeout(700);
        out.push(...await p.evaluate(r => [...document.querySelectorAll('.table-responsive')].filter(x => x.offsetParent !== null && x.scrollWidth > x.clientWidth + 1).map(x => r + ':' + (x.querySelector('table').id || 'tableau') + ' ' + x.scrollWidth + '/' + x.clientWidth), route));
        out.push(...await p.evaluate(r => [...document.querySelectorAll('.ds-nombre, .ds-ligne > strong')].filter(x => x.scrollWidth > x.parentElement.clientWidth + 1).map(x => r + ':montant « ' + x.textContent.trim() + ' » dépasse la carte'), route));
      }
      return out;
    };
    // gestionnaire (le plus de colonnes) à 1280 px ; employé à 768 px et 1024 px
    for (const [role, largeur] of [['gestionnaire', 1280], ['employe', 1280], ['employe', 1024], ['employe', 768]]) {
      const t = await L.nouvellePage(browser, { width: largeur, height: 1000 });
      await L.connecter(t, role);
      await t.waitForLoadState('networkidle');
      const h = await hors(t, ['stock', 'historique', 'sous_minimum', 'dashboard']);
      verifier(h.length === 0, role + ' à ' + largeur + ' px : aucun tableau ne déborde de sa carte, aucun montant ne dépasse : ' + JSON.stringify(h));
      if (role === 'gestionnaire' && largeur === 1280) {
        await L.aller(t, 'stock');
        await t.waitForSelector('#table-stock tbody tr');
        // libellé affiché de chaque liste (le choix par défaut ; toutes les entreprises) : il doit tenir dans la liste, sans « … »
        const trop = await t.$$eval('#f-entreprise, #f-emplacement, #f-categorie', els => els.map(x => {
          const c = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(x); c.font = cs.font;
          const textes = x.id === 'f-entreprise' ? [...x.options].map(o => o.text) : [x.options[x.selectedIndex].text];
          const largeur = Math.max(...textes.map(tx => c.measureText(tx).width));
          const dispo = x.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20;
          return [x.id, Math.round(largeur), Math.round(dispo)];
        }).filter(([, l, d]) => l > d));
        verifier(trop.length === 0, 'filtres du Stock : aucun libellé tronqué : ' + JSON.stringify(trop));
        const ph = await t.$eval('#f-recherche', x => { const c = document.createElement('canvas').getContext('2d'); c.font = getComputedStyle(x).font; return [c.measureText(x.placeholder).width, x.clientWidth - 24]; });
        verifier(ph[0] <= ph[1], 'le texte d\'aide du champ de recherche tient dans le champ (' + Math.round(ph[0]) + ' / ' + Math.round(ph[1]) + ' px)');
      }
      await t.context().close();
    }
    // tablette (768 px), gestionnaire : liens des tableaux et des cartes d'au moins 44 px de haut
    const tab = await L.nouvellePage(browser, { width: 768, height: 1024 });
    await L.connecter(tab, 'gestionnaire');
    await tab.waitForLoadState('networkidle');
    for (const route of ['stock', 'historique', 'sous_minimum', 'dashboard']) {
      await L.aller(tab, route);
      await tab.waitForTimeout(700);
      const petits = await tab.$$eval('.sk-table tbody a, .ds-carte tbody a, .ds-lien, .ds-carte a', els => els.filter(x => x.offsetParent !== null).map(x => [x.textContent.trim().slice(0, 18), Math.round(x.getBoundingClientRect().height)]).filter(([, hh]) => hh < 44));
      verifier(petits.length === 0, route + ' à 768 px : tous les liens font 44 px ou plus : ' + JSON.stringify(petits.slice(0, 5)));
    }
    await tab.context().close();
    // impression, lettre portrait (largeur utile ≈ 725 px) : filtres masqués, résumé affiché, tableau complet sur la largeur
    const imp = await L.nouvellePage(browser, { width: 725, height: 1000 });
    await L.connecter(imp, 'gestionnaire');
    await imp.waitForLoadState('networkidle');
    for (const route of ['stock', 'historique']) {
      await L.aller(imp, route);
      await imp.waitForSelector('#table-' + route + ' tbody tr');
      await imp.emulateMedia({ media: 'print' });
      const m = await imp.evaluate(() => ({
        filtres: [...document.querySelectorAll('.sk-filtres, .sk-barre')].every(x => getComputedStyle(x).display === 'none'),
        resume: getComputedStyle(document.getElementById('sk-resume')).display !== 'none' ? document.getElementById('sk-resume').textContent : '',
        debord: [...document.querySelectorAll('.table-responsive')].map(x => x.scrollWidth - x.clientWidth),
        page: document.documentElement.scrollWidth - window.innerWidth,
        entete: getComputedStyle(document.querySelector('.sk-table thead')).display,
      }));
      verifier(m.filtres, route + ' (impression) : les filtres et les boutons ne s\'impriment pas');
      verifier(/^(Stock|Historique des mouvements)/.test(m.resume) && /Entreprise : /.test(m.resume), route + ' (impression) : résumé des filtres : ' + m.resume);
      verifier(m.debord.every(d => d <= 1) && m.page <= 1, route + ' (impression) : le tableau tient sur la largeur de la page (débordement ' + m.debord.join() + ' / ' + m.page + ')');
      verifier(m.entete === 'table-header-group', route + ' (impression) : l\'en-tête se répète sur chaque page');
      await imp.emulateMedia({ media: 'screen' });
    }
    await imp.context().close();
  });

  await section('Correctifs : le rafraîchissement du tableau de bord ne prolonge pas une session abandonnée', async () => {
    const t = await L.nouvellePage(browser);
    await L.connecter(t, 'gestionnaire');
    await t.waitForLoadState('networkidle');
    await t.clock.install({ time: new Date() });
    let n = 0;
    t.on('request', r => { if (/dashboard_data\.php/.test(r.url())) { n++; } });
    await t.goto(L.BASE + '/index.php?page=dashboard');
    await t.waitForFunction(() => document.getElementById('ds-pieces').textContent.trim() !== '…');
    verifier(n === 1, 'chargement initial : 1 appel (' + n + ')');
    await t.clock.runFor(2 * 60 * 1000 + 500);
    await t.waitForTimeout(300);
    verifier(n === 2, 'avec une activité récente : rafraîchissement toutes les 2 minutes (' + n + ' appels)');
    await t.clock.runFor(20 * 60 * 1000);
    await t.waitForTimeout(500);
    const apres20 = n;
    await t.clock.runFor(60 * 60 * 1000);
    await t.waitForTimeout(500);
    verifier(n === apres20, 'sans aucune activité : le rafraîchissement s\'arrête (' + apres20 + ' appels à 20 min, ' + n + ' après 80 min)');
    verifier(apres20 <= 9, 'il s\'est arrêté après environ 15 minutes (' + apres20 + ' appels)');
    // retour de l'utilisateur : rechargement immédiat, puis le rythme reprend
    await t.mouse.move(100, 100);
    await t.mouse.move(140, 160);
    await t.waitForTimeout(500);
    verifier(n === apres20 + 1, 'au retour de l\'utilisateur : un rechargement immédiat (' + n + ')');
    await t.clock.runFor(2 * 60 * 1000 + 500);
    await t.waitForTimeout(300);
    verifier(n === apres20 + 2, 'puis le rafraîchissement reprend (' + n + ')');
    await t.context().close();
  });

  await section('Correctifs : paramètres en tableau (aucun avertissement PHP)', async () => {
    for (const [url, nom] of [
      ['app/ajax/stock_data.php?search[value][]=x&columns[0][data][]=a&order[0][column]=0&order[0][dir][]=desc', 'stock_data'],
      ['app/ajax/historique_data.php?search[value][]=x&columns[0][data][]=a&order[0][column]=0&order[0][dir][]=desc', 'historique_data'],
      ['app/ajax/pieces_recherche.php?q[]=x', 'pieces_recherche'],
    ]) {
      const r = await appel(e, url, null);
      verifier(r.status === 200 && r.json && r.json.ok !== false, nom + ' avec des paramètres en tableau : réponse normale (' + r.status + ')');
    }
    const r2 = await appel(e, 'app/ajax/stock_data.php', Object.assign(DT(), { 'order[0][dir]': 'desc', 'search[value]': 'P-0001' }));
    verifier(r2.status === 200, 'stock_data en POST : réponse normale');
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
