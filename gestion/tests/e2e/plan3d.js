// Test de bout en bout de la VUE 3D du Plan (commutateur 3D / Tuiles, scène Three.js, étiquettes, recherche, temps réel, repli, fuites).
//   cd gestion && tools/serveur.sh start bea_plan3d 8843 --neuf
//   DB_NAME=bea_plan3d BASE_URL=http://127.0.0.1:8843 NODE_PATH=$(npm root -g) node tests/e2e/plan3d.js
// Chromium headless dessine WebGL en logiciel (SwiftShader) : on ne tire AUCUNE conclusion de vitesse, on lit le nombre de dessins par image
// et le temps JS par image (attributs data-* discrets de #pl-3d : data-images, data-dessins, data-ms, data-epingles, data-pulses, data-vols, data-zoom, data-azimut...).
// Le test remet la base de démonstration à zéro au début et à la fin ; les valeurs attendues viennent de requêtes SQL écrites ici, indépendantes du code testé.
// PLAN3D_CAPTURES=/dossier : enregistre aussi des captures d'écran (bureau, recherche, sélection, gros plan, tuiles, téléphone, temps réel).
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_plan3d';
const RACINE = path.resolve(__dirname, '..', '..');
const CAPTURES = process.env.PLAN3D_CAPTURES || '';
const CLE_VUE = 'beauchemin.plan.vue';
const verifier = L.verifier;
const attendre = ms => new Promise(r => setTimeout(r, ms));

// ---- outils ------------------------------------------------------------------------------------------------------------
function sql(q) { return execFileSync('mysql', ['-uroot', '-N', '-B', '--default-character-set=utf8mb4', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function lignes(q) { const r = sql(q); return r === '' ? [] : r.split('\n').map(l => l.split('\t')); }
function reset() { execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' }); }
const norm = t => String(t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const fmt = s => norm(new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 3 }).format(parseFloat(s)));
function section(t) { console.log('\n' + t); }
async function capture(p, nom) { if (CAPTURES) { fs.mkdirSync(CAPTURES, { recursive: true }); await p.screenshot({ path: path.join(CAPTURES, nom + '.png') }); } }

/** Ce que le plan doit montrer pour ces entreprises (SQL) : { id: {nom, type, code, ent, nb, unites, bas} }. */
function attendu(entreprises) {
  const ids = entreprises.join(',');
  const base = {};
  lignes(`SELECT e.id, e.nom, e.type, en.code, COUNT(s.piece_id), COALESCE(SUM(s.quantite), 0), e.entreprise_id
            FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id LEFT JOIN stock s ON s.emplacement_id = e.id AND s.quantite > 0
           WHERE e.actif = 1 AND e.entreprise_id IN (${ids}) GROUP BY e.id, e.nom, e.type, en.code, e.entreprise_id ORDER BY e.id`)
    .forEach(([id, nom, type, code, nb, unites, ent]) => { base[id] = { id: +id, nom, type, code, ent: +ent, nb: +nb, unites, bas: 0 }; });
  lignes(`SELECT s.emplacement_id, COUNT(*)
            FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN pieces p ON p.id = s.piece_id
            JOIN seuils se ON se.piece_id = s.piece_id AND se.entreprise_id = e.entreprise_id
           WHERE s.quantite > 0 AND p.actif = 1 AND e.actif = 1 AND se.minimum > 0 AND e.entreprise_id IN (${ids})
             AND se.minimum > (SELECT SUM(s2.quantite) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id)
           GROUP BY s.emplacement_id`).forEach(([id, n]) => { if (base[id]) { base[id].bas = +n; } });
  return base;
}
/** Total d'unités et nombre de pièces sous le minimum (une pièce compte une fois par entreprise), comme les cartes de la vue 3D. */
function resumeSql(entreprises) {
  const ids = entreprises.join(',');
  const unites = sql(`SELECT COALESCE(SUM(s.quantite), 0) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE s.quantite > 0 AND e.actif = 1 AND e.entreprise_id IN (${ids})`);
  const bas = sql(`SELECT COUNT(*) FROM (SELECT DISTINCT e.entreprise_id, s.piece_id FROM stock s
      JOIN emplacements e ON e.id = s.emplacement_id AND e.actif = 1 AND e.entreprise_id IN (${ids}) JOIN pieces p ON p.id = s.piece_id AND p.actif = 1
      JOIN seuils se ON se.entreprise_id = e.entreprise_id AND se.piece_id = s.piece_id AND se.minimum > 0
     WHERE s.quantite > 0 AND (SELECT COALESCE(SUM(s2.quantite), 0) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id) < se.minimum) x`);
  return { unites, bas: +bas };
}
function libelle(t) {
  return t.nom + ', ' + (t.nb ? t.nb + ' pièce' + (t.nb > 1 ? 's' : '') + ', ' + fmt(t.unites) + ' unité' + (parseFloat(t.unites) >= 2 ? 's' : '') : 'vide') + (t.bas ? ', ' + t.bas + ' sous le minimum' : '');
}
function resumeTexte(t) { return t.nb ? t.nb + ' pièce' + (t.nb > 1 ? 's' : '') + ' · ' + fmt(t.unites) + ' unité' + (parseFloat(t.unites) >= 2 ? 's' : '') : 'Vide'; }
const stockPiece = code => Object.fromEntries(lignes(`SELECT s.emplacement_id, s.quantite FROM stock s JOIN pieces p ON p.id = s.piece_id JOIN emplacements e ON e.id = s.emplacement_id WHERE p.code = '${code}' AND s.quantite > 0 AND e.actif = 1`));

async function appel(p, url, corps) {
  return p.evaluate(async ([url, corps]) => {
    const h = { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content };
    const r = await fetch(url, { method: corps === null ? 'GET' : 'POST', credentials: 'same-origin', headers: h, body: corps === null ? undefined : JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps]);
}
const transfert = (p, de, vers, piece, qte) => appel(p, 'app/action/transfert_save.php', { emplacement_id: de, emplacement_dest_id: vers, lignes: [{ piece_id: piece, quantite: String(qte) }] });

/** Sonde injectée dans chaque page : compte les contextes WebGL, les écouteurs (window, document, médias), les observateurs de taille et les violations de CSP. */
function sonde() {
  const S = window.__sonde = { ctx: [], reg: new Map(), obs: 0, csp: [] };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t) { const c = gc.apply(this, arguments); if (c && /webgl/.test(String(t))) { S.ctx.push(c); } return c; };
  const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
  const suivi = t => t === window || t === document || (typeof MediaQueryList !== 'undefined' && t instanceof MediaQueryList);
  const cap = o => (typeof o === 'boolean' ? o : !!(o && o.capture));
  EventTarget.prototype.addEventListener = function (type, f, o) {
    if (suivi(this) && f) { const l = S.reg.get(this) || []; if (!l.some(x => x[0] === type && x[1] === f && x[2] === cap(o))) { l.push([type, f, cap(o)]); } S.reg.set(this, l); }
    return add.apply(this, arguments);
  };
  EventTarget.prototype.removeEventListener = function (type, f, o) {
    if (suivi(this) && S.reg.has(this)) { S.reg.set(this, S.reg.get(this).filter(x => !(x[0] === type && x[1] === f && x[2] === cap(o)))); }
    return rem.apply(this, arguments);
  };
  const RO = window.ResizeObserver;
  if (RO) {
    window.ResizeObserver = class extends RO {
      constructor(cb) { super(cb); this.__n = 0; }
      observe(el, o) { this.__n++; S.obs++; return super.observe(el, o); }
      disconnect() { S.obs -= this.__n; this.__n = 0; return super.disconnect(); }
    };
  }
  // objets WebGL vivants (tampons, textures, programmes, cibles de rendu) : créés moins supprimés
  S.gl = { buffers: 0, textures: 0, programmes: 0, cibles: 0 };
  [window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach(C => {
    if (!C) { return; }
    [['createBuffer', 'deleteBuffer', 'buffers'], ['createTexture', 'deleteTexture', 'textures'], ['createProgram', 'deleteProgram', 'programmes'], ['createFramebuffer', 'deleteFramebuffer', 'cibles']].forEach(([c, d, k]) => {
      const oc = C.prototype[c], od = C.prototype[d], vivants = new WeakSet();
      C.prototype[c] = function () { const o = oc.apply(this, arguments); if (o) { vivants.add(o); S.gl[k]++; } return o; };
      C.prototype[d] = function (o) { if (o && vivants.has(o)) { vivants.delete(o); S.gl[k]--; } return od.apply(this, arguments); };
    });
  });
  document.addEventListener('securitypolicyviolation', e => S.csp.push(e.violatedDirective + ' : ' + e.blockedURI));
}
const mesures = p => p.evaluate(() => {
  const S = window.__sonde, n = Array.from(S.reg.values()).reduce((s, l) => s + l.length, 0);
  return { canevas: document.querySelectorAll('canvas').length, contextes: S.ctx.filter(g => !g.isContextLost()).length, ecouteurs: n, observateurs: S.obs };
});
async function page(b, vp, opts) {
  const p = await L.nouvellePage(b, vp);
  await p.context().addInitScript(sonde);
  if (opts && opts.reduit) { await p.emulateMedia({ reducedMotion: 'reduce' }); }
  p.csp = () => p.evaluate(() => (window.__sonde ? window.__sonde.csp : []));
  return p;
}
async function aller(p, role) { await L.aller(p, 'plan'); }
async function pret3d(p) { await p.waitForSelector('#pl-3d:not([hidden]) canvas.pl3-canevas'); await p.waitForFunction(() => +(document.getElementById('pl-3d').dataset.images || 0) >= 1 && document.querySelectorAll('.pl3-etiquette').length > 0, null, { timeout: 20000 }); await attendre(900); }
const attr = (p, nom) => p.evaluate(n => document.getElementById('pl-3d').getAttribute('data-' + n), nom).then(Number);
async function etiquettes(p) {
  return p.$$eval('.pl3-etiquette', els => els.map(e => ({
    id: +e.getAttribute('data-id'), nom: e.querySelector('.pl3-nom').textContent, chiffres: e.querySelector('.pl3-chiffres').textContent, label: e.getAttribute('aria-label'), marque: e.getAttribute('data-marque'),
    cartons: +e.getAttribute('data-cartons'), bas: e.getAttribute('data-bas'), epingle: e.getAttribute('data-epingle'), classe: e.className, qte: e.querySelector('.pl3-qte').hidden ? null : e.querySelector('.pl3-qte').textContent,
    alerte: e.querySelector('.pl3-alerte').hidden ? null : e.querySelector('.pl3-alerte b').textContent, delta: Array.from(e.querySelectorAll('.pl3-delta')).map(x => x.textContent),
    boite: (r => ({ x: r.x, y: r.y, w: r.width, h: r.height }))(e.getBoundingClientRect()), pointe: parseFloat(e.style.getPropertyValue('--pointe')), focus: document.activeElement === e,
  })));
}
/** Pixels du canevas seul (sans étiquettes ni cartes) : nombre de couleurs, écart-type, pixels bleus d'épingle. */
async function pixels(p) {
  await p.addStyleTag({ content: '.pl3-etiquettes, .pl3-stats, .pl3-outils, .pl-tiroir, .pl3-int, .pl3-carte, .pl3-puces { visibility: hidden !important; }' }).then(async h => {
    const buf = await p.locator('#pl3-scene').screenshot();
    await h.evaluate(x => x.remove());
    p.__dernierePng = buf;
  });
  return p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, couleurs = new Set();
    let s = 0, s2 = 0, bleus = 0, rouges = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11); s += g; s2 += g * g;
      couleurs.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4));
      if (d[i + 2] > 200 && d[i] < 90 && d[i + 1] > 70 && d[i + 1] < 150) { bleus++; }
      if (d[i] > 180 && d[i + 1] < 40 && d[i + 2] < 50) { rouges++; }
    }
    const m = s / n;
    return { couleurs: couleurs.size, ecart: Math.sqrt(s2 / n - m * m), bleus, rouges, l: c.width, h: c.height };
  }, buf64(p));
}
const buf64 = p => p.__dernierePng.toString('base64');
const toastTexte = async (p, ms) => { try { await p.waitForSelector('#toasts .alert', { timeout: ms || 4000 }); } catch (e) { return ''; } return norm(await p.textContent('#toasts')); };

// ---- intérieur d'un emplacement (vue en coupe) ------------------------------------------------------------------------------------
/** Ce que l'intérieur doit montrer (SQL) : une caisse par pièce en stock ; case « allée:étagère:niveau » ou « zone » (à ranger). */
const attenduInt = id => lignes(`SELECT s.piece_id, p.code, p.nom, s.quantite, p.unite, r.allee, r.etagere, r.niveau
    FROM stock s JOIN pieces p ON p.id = s.piece_id LEFT JOIN rangements r ON r.emplacement_id = s.emplacement_id AND r.piece_id = s.piece_id
   WHERE s.emplacement_id = ${id} AND s.quantite > 0 ORDER BY p.code`)
  .map(([piece, code, nom, q, unite, al, et, ni]) => ({ piece: +piece, code, nom, q, unite, cas: al === 'NULL' ? 'zone' : [al, et, ni].join(':') }));
const qteTexte = (q, unite) => fmt(q) + ' ' + (unite !== 'unité' ? unite : parseFloat(q) >= 2 ? 'unités' : 'unité');
const nomPos = (cas, type) => { const [al, et, ni] = cas.split(':'); return (type === 'cube' ? (al === '1' ? 'Côté gauche' : 'Côté droit') : 'Allée ' + String.fromCharCode(64 + +al)) + ' · Étagère ' + et + ' · Niveau ' + ni; };
const lecteurInt = p => p.evaluate(() => { const c = document.getElementById('pl-3d'); return { id: c.getAttribute('data-interieur'), caisses: +c.getAttribute('data-caisses'), zone: +c.getAttribute('data-zone'), cachees: +c.getAttribute('data-cachees'), epingles: +c.getAttribute('data-epingles'), actifs: +c.getAttribute('data-actifs') }; });
const listeInt = p => p.$$eval('.pl3-clavier-btn', bs => bs.map(b => ({ piece: +b.getAttribute('data-piece'), cas: b.getAttribute('data-case').replace(':cachee', ''), cachee: /cachee/.test(b.getAttribute('data-case')), label: b.getAttribute('aria-label') })));
const memeListe = (li, exp) => JSON.stringify(li.map(x => [x.piece, x.cas]).sort((p, q) => p[0] - q[0])) === JSON.stringify(exp.map(x => [x.piece, x.cas]).sort((p, q) => p[0] - q[0]));
const dedansAttente = p => p.waitForFunction(() => { const c = document.getElementById('pl-3d'); return c.hasAttribute('data-interieur') && c.hasAttribute('data-caisses') && +c.getAttribute('data-images') >= 1; }, null, { timeout: 15000 });
/** Ouvre la fiche de l'emplacement puis « Voir l'intérieur » (le clic passe par le DOM : l'étiquette peut être masquée par une voisine). */
async function entrerInt(p, id) {
  await p.evaluate(i => document.querySelector('.pl3-etiquette[data-id="' + i + '"]').click(), id);
  await p.waitForSelector('#pl-voir-interieur:not([hidden])');
  await p.click('#pl-voir-interieur');
  await dedansAttente(p);
  await attendre(1400);
}
async function sortirInt(p, comment) {
  if (comment === 'retour') { await p.click('#pl3-retour'); } else { await p.keyboard.press('Escape'); }
  await p.waitForFunction(() => !document.getElementById('pl-3d').hasAttribute('data-interieur'), null, { timeout: 8000 });
  await attendre(900);
}
const positionsInt = (p, detail) => p.evaluate(d => document.getElementById('pl-3d').dispatchEvent(new CustomEvent('pl3-positions', { detail: d || {} })), detail || null);
const scene = p => p.$eval('#pl3-scene', x => { const r = x.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
/** Place d'une caisse (pièce) à l'écran, en pixels de la page. */
async function placeCaisse(p, piece) {
  await positionsInt(p);
  const s = await scene(p), b = await p.$eval('.pl3-clavier-btn[data-piece="' + piece + '"]', x => ({ x: +x.getAttribute('data-x'), y: +x.getAttribute('data-y') }));
  return { x: s.x + b.x, y: s.y + b.y };
}
async function placeCase(p, c) { await positionsInt(p, { cellule: c }); const s = await scene(p), q = await p.$eval('#pl-3d', x => ({ x: +x.getAttribute('data-cx'), y: +x.getAttribute('data-cy') })); return { x: s.x + q.x, y: s.y + q.y }; }
async function placeZone(p) { await positionsInt(p, { zone: true }); const s = await scene(p), q = await p.$eval('#pl-3d', x => ({ x: +x.getAttribute('data-cx'), y: +x.getAttribute('data-cy') })); return { x: s.x + q.x, y: s.y + q.y }; }
/** Glisse une caisse vers un point (pointeur : mousedown, déplacements, mouseup). */
async function glisser(p, de, vers) {
  await p.mouse.move(de.x, de.y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(de.x + (vers.x - de.x) * i / 12, de.y + (vers.y - de.y) * i / 12); await attendre(35); }
  await attendre(250); await p.mouse.up();
}

(async () => {
  reset();
  const b = await L.lancer();
  const csp = [];

  // ===================================================================================================================
  section('1. Vue 3D par défaut (administrateur, écran large) : commutateur, scène, étiquettes, cartes');
  // ===================================================================================================================
  const a = await page(b, { width: 1366, height: 800 });
  await L.connecter(a, 'admin');
  await aller(a);
  await pret3d(a);
  verifier(await a.$eval('#pl-vue-3d', x => x.getAttribute('aria-pressed') === 'true') && await a.$eval('#pl-vue-tuiles', x => x.getAttribute('aria-pressed') === 'false'), 'sur écran large avec WebGL : la 3D est la vue par défaut (commutateur sur « 3D »)');
  verifier(await a.isVisible('#pl-3d') && await a.isHidden('#pl-plan') && await a.isHidden('.pl-tuile'), 'la scène est affichée, la vue Tuiles est cachée');
  const sw = await a.$$eval('#pl-vues .pl-vue', bs => bs.map(x => ({ id: x.id, label: x.textContent.trim(), titre: x.title, haut: x.getBoundingClientRect().height, larg: x.getBoundingClientRect().width, icone: !!x.querySelector('i.fas') })));
  verifier(sw.length === 2 && sw.every(x => x.icone && x.haut >= 44 && x.larg >= 44 && x.titre) && sw[0].label === '3D' && sw[1].label === 'Tuiles', 'deux boutons segmentés avec icône, cibles ≥ 44 px, infobulle : ' + JSON.stringify(sw.map(x => x.label)));
  const cv = await a.$$eval('canvas', cs => cs.map(c => ({ role: c.getAttribute('role'), label: c.getAttribute('aria-label'), tab: c.getAttribute('tabindex'), l: c.width, h: c.height })));
  verifier(cv.length === 1 && cv[0].role === 'img' && cv[0].label === 'Vue 3D de l\'entrepôt. La liste des emplacements est disponible dans la vue Tuiles.' && cv[0].tab === '0', 'un seul canevas, role=img, aria-label demandé, focalisable : ' + JSON.stringify(cv[0]));
  const att = attendu([1, 2]);
  let et = await etiquettes(a);
  verifier(JSON.stringify(et.map(e => e.id).sort()) === JSON.stringify(Object.keys(att).map(Number).sort()), 'une étiquette HTML par emplacement, et rien d\'autre : ' + et.map(e => e.id));
  verifier(et.every(e => e.nom === att[e.id].nom && norm(e.chiffres) === resumeTexte(att[e.id])), 'chaque étiquette dit son nom et « N pièces · N unités » : ' + et.map(e => norm(e.chiffres)).join(' | '));
  verifier(et.some(e => norm(e.chiffres) === '14 pièces · 238 unités'), 'exemple : « 14 pièces · 238 unités »');
  verifier(et.every(e => e.label === libelle(att[e.id])), 'aria-label de chaque étiquette = « Nom, N pièces, N unités(, N sous le minimum) »');
  verifier(et.every(e => e.marque === (att[e.id].code === 'BEA' ? 'bea' : 'bch')), 'chaque étiquette porte la marque de SON entreprise (data-marque)');
  const cEnt = await a.$$eval('.pl3-etiquette', els => els.map(e => ({ id: +e.getAttribute('data-id'), ent: getComputedStyle(e).getPropertyValue('--ent').trim() })));
  verifier(cEnt.every(c => (att[c.id].code === 'BEA' ? c.ent === '#35802a' : c.ent === '#c8161d')), 'couleurs : vert pour Beauchemin, rouge pour Boutique Chaleur : ' + JSON.stringify(cEnt));
  verifier(et.every(e => (att[e.id].bas ? e.alerte === String(att[e.id].bas) : e.alerte === null)) && et.some(e => e.alerte), 'pastille d\'alerte rouge seulement sur les emplacements sous le minimum : ' + JSON.stringify(et.map(e => e.id + ':' + e.alerte)));
  const alerteAnim = await a.$eval('.pl3-etiquette:not([data-bas=""]) .pl3-alerte', x => getComputedStyle(x, '::after').animationName);
  verifier(alerteAnim === 'pl3-pouls', 'la pastille d\'alerte pulse (animation « ' + alerteAnim + ' »)');
  // cartes de statistiques (quantités seulement)
  const rs = resumeSql([1, 2]);
  const cartes = await a.$$eval('.pl3-stat', cs => cs.map(c => ({ nom: c.querySelector('.pl3-stat-nom').textContent.trim(), val: c.querySelector('.pl3-stat-val').textContent.trim(), alerte: c.classList.contains('pl3-alerte-carte') })));
  verifier(cartes.length === 3 && cartes[0].nom === 'Unités en stock' && norm(cartes[0].val) === fmt(rs.unites) && cartes[1].nom === 'Sous le minimum' && cartes[1].val === String(rs.bas) && cartes[1].alerte && cartes[2].nom === 'Emplacements' && cartes[2].val === String(Object.keys(att).length),
    'cartes : Unités en stock = ' + fmt(rs.unites) + ', Sous le minimum = ' + rs.bas + ' (couleur d\'alerte), Emplacements = ' + Object.keys(att).length + ' : ' + JSON.stringify(cartes));
  const barre = await a.$$eval('#pl3-outils .pl3-btn', bs => bs.map(x => ({ act: x.getAttribute('data-act'), label: x.getAttribute('aria-label'), texte: x.textContent.trim(), t: Math.min(x.getBoundingClientRect().width, x.getBoundingClientRect().height) })));
  verifier(JSON.stringify(barre.map(x => x.label)) === JSON.stringify(['Zoom avant', 'Zoom arrière', 'Pivoter à gauche', 'Pivoter à droite', 'Recentrer']) && barre.every(x => x.texte === '' && x.t >= 44), 'barre d\'outils : zoom +, zoom −, pivoter à gauche, pivoter à droite, recentrer (aria-label, aucun texte visible, cibles ≥ 44 px)');
  verifier((await a.$$('.content-wrapper .form-text, .content-wrapper p.text-muted, .content-wrapper .alert-info')).length === 0, 'aucun texte d\'aide à l\'écran');
  // la scène produit une image (pixels non uniformes)
  const px = await pixels(a);
  verifier(px.couleurs > 80 && px.ecart > 12, 'le canevas n\'est pas uniforme : ' + px.couleurs + ' couleurs, écart-type ' + px.ecart.toFixed(1));
  verifier(px.rouges > 300, 'on y voit le toit rouge de Boutique Chaleur (pixels rouges : ' + px.rouges + ')');
  // niveau de remplissage visible : plus d'unités = plus de cartons (échelle log), vide = quai vide
  const parU = et.map(e => ({ u: parseFloat(att[e.id].unites), c: e.cartons, type: att[e.id].type, nb: att[e.id].nb })).filter(x => x.nb > 0);
  verifier(parU.every(x => x.c >= 3) && parU.filter(x => x.type === att[1].type).sort((p, q) => p.u - q.u).every((x, i, l) => i === 0 || x.c >= l[i - 1].c), 'cartons visibles : au moins 3 si non vide, et plus d\'unités = pas moins de cartons (même type) : ' + JSON.stringify(parU.map(x => x.type[0] + x.u + '→' + x.c)));
  // rendu à la demande : au repos, aucune image n'est dessinée
  const im0 = await attr(a, 'images'); await attendre(2500);
  const im1 = await attr(a, 'images');
  verifier(im1 === im0, 'au repos : aucune image dessinée en 2,5 s (' + im0 + ' → ' + im1 + ') ; pas de boucle permanente');
  const dessins = await attr(a, 'dessins'), tri = await attr(a, 'triangles'), ms = await attr(a, 'ms');
  console.log('  mesures (5 emplacements) : ' + dessins + ' dessins, ' + tri + ' triangles, ' + ms + ' ms JS par image');
  verifier(dessins > 5 && dessins < 120, 'appels de dessin par image : ' + dessins + ' (' + tri + ' triangles, ' + ms + ' ms de JavaScript pour la dernière image)');
  await capture(a, '1-bureau-3d');

  // ===================================================================================================================
  section('2. Commutateur : Tuiles, mémorisation, retour à la 3D');
  // ===================================================================================================================
  await a.click('#pl-vue-tuiles');
  await a.waitForSelector('.pl-tuile', { state: 'visible' });
  verifier(await a.isHidden('#pl-3d') && await a.isVisible('#pl-plan') && (await a.$$('canvas')).length === 0, 'Tuiles : la vue Tuiles revient, la scène est détruite (aucun canevas)');
  verifier(await a.evaluate(k => localStorage.getItem(k), CLE_VUE) === 'tuiles', 'le choix est mémorisé (localStorage)');
  await capture(a, '5-tuiles');
  await a.reload(); await a.waitForSelector('.pl-tuile', { state: 'visible' });
  verifier(await a.isHidden('#pl-3d') && await a.$eval('#pl-vue-tuiles', x => x.getAttribute('aria-pressed') === 'true'), 'après rechargement : la page reste en Tuiles');
  const tuilesOk = await a.$$eval('.pl-tuile', ts => ts.map(t => t.getAttribute('aria-label')));
  verifier(tuilesOk.length === Object.keys(att).length && tuilesOk.every(l => Object.values(att).some(t => libelle(t) === l)), 'la vue Tuiles est complète (même données)');
  await a.click('#pl-vue-3d'); await pret3d(a);
  verifier((await a.$$('canvas')).length === 1 && await a.isHidden('#pl-plan'), '3D : la scène revient');
  await a.reload(); await pret3d(a);
  verifier(await a.evaluate(k => localStorage.getItem(k), CLE_VUE) === '3d' && await a.isVisible('#pl-3d'), 'après rechargement : la page reste en 3D');
  // le mode « Modifier le plan » est en Tuiles ; en sortir ramène à la 3D
  await a.click('#pl-modifier');
  await a.waitForSelector('.pl-edition .pl-tuile', { state: 'visible' });
  verifier(await a.isHidden('#pl-3d') && await a.isHidden('#pl-vues') && (await a.$$('canvas')).length === 0, '« Modifier le plan » depuis la 3D : bascule en Tuiles (modification en 2D), commutateur masqué, scène détruite');
  await a.click('#pl-annuler');
  await pret3d(a);
  verifier(await a.isVisible('#pl-3d') && await a.isVisible('#pl-vues') && await a.evaluate(k => localStorage.getItem(k), CLE_VUE) === '3d', 'Annuler : retour à la 3D, préférence inchangée');

  // ===================================================================================================================
  section('3. Sélection : étiquette (clic, clavier), bâtiment (picking), fiche');
  // ===================================================================================================================
  const contenuSql = id => lignes(`SELECT p.code, p.nom, s.quantite FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE s.emplacement_id = ${id} AND s.quantite > 0 ORDER BY p.nom, p.code`);
  await a.click('.pl3-etiquette[data-id="1"]');
  await a.waitForSelector('#pl-tiroir.pl-ouvert #pl-lignes .pl-ligne');
  await attendre(900);
  const lig = await a.$$eval('#pl-lignes .pl-ligne', ls => ls.map(l => ({ code: l.querySelector('.code').textContent, qte: l.querySelector('.pl-ligne-qte').textContent.trim() })));
  const c1 = contenuSql(1);
  verifier(lig.length === c1.length && lig.every((l, i) => l.code === c1[i][0] && norm(l.qte).startsWith(fmt(c1[i][2]))), 'clic sur l\'étiquette : la fiche montre les ' + lig.length + ' pièces avec les bonnes quantités');
  verifier(await a.evaluate(() => document.getElementById('pl-tiroir').parentElement.id) === 'pl-3d' && norm(await a.textContent('#pl-tiroir-titre')) === 'Entrepôt principal', 'la fiche flotte dans la scène (à droite) : titre « Entrepôt principal »');
  const sel = await etiquettes(a);
  verifier(sel.find(e => e.id === 1).classe.includes('pl3-actif') && sel.filter(e => e.classe.includes('pl3-actif')).length === 1, 'l\'étiquette choisie est marquée (contour de l\'entreprise)');
  const bar = await a.$eval('#pl3-outils', x => x.getBoundingClientRect().right), fiche = await a.$eval('#pl-tiroir', x => x.getBoundingClientRect().left);
  verifier(bar < fiche, 'la barre d\'outils se range à gauche de la fiche (ne la recouvre pas) : ' + Math.round(bar) + ' < ' + Math.round(fiche));
  await attendre(900);
  await capture(a, '3-selection-fiche');
  const px2 = await pixels(a);
  verifier(px2.couleurs > 80, 'la scène reste dessinée avec la fiche ouverte');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  verifier(await a.evaluate(() => document.activeElement.classList.contains('pl3-etiquette')), 'Échap ferme la fiche et ramène le focus sur l\'étiquette');
  verifier(!(await etiquettes(a)).some(e => e.classe.includes('pl3-actif')), 'la sélection est effacée');
  // clavier : Tab arrive sur une étiquette (bouton), Entrée ouvre la fiche
  await a.focus('#pl-recherche');
  for (let i = 0; i < 12 && !(await a.evaluate(() => document.activeElement.classList.contains('pl3-etiquette'))); i++) { await a.keyboard.press('Tab'); }
  const foc = await a.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e.querySelector('.pl3-corps')); return { tag: e.tagName, id: +e.getAttribute('data-id'), ombre: cs.boxShadow }; });
  verifier(foc.tag === 'BUTTON' && /rgb/.test(foc.ombre) && foc.ombre.includes('6px'), 'au clavier : Tab arrive sur une étiquette (un bouton) avec un focus bien visible : ' + foc.tag + ' ' + foc.id);
  const premiere = (await etiquettes(a))[0].id;
  verifier(foc.id === premiere, 'l\'ordre de Tab suit le plan (de haut en bas, de gauche à droite) : première étiquette = ' + premiere);
  await a.keyboard.press('Enter');
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(+await a.evaluate(() => document.getElementById('pl-voir-stock').getAttribute('href').match(/emplacement_id=(\d+)/)[1]) === foc.id, 'Entrée sur l\'étiquette ouvre sa fiche');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  // clic sur le bâtiment lui-même (picking) : on vise le toit de la boutique (rien devant elle)
  await a.evaluate(() => document.getElementById('pl-recherche').blur());
  const boutiqueId = +sql("SELECT id FROM emplacements WHERE type = 'boutique' AND actif = 1 LIMIT 1");
  const e5 = (await etiquettes(a)).find(e => e.id === boutiqueId);
  const cx = e5.boite.x + e5.pointe, cy = e5.boite.y + e5.boite.h + 14 + 30;
  await a.mouse.move(cx, cy);
  await attendre(250);
  verifier(await a.$eval('canvas.pl3-canevas', c => c.style.cursor) === 'pointer', 'le pointeur devient une main au-dessus d\'un bâtiment');
  const dessAvant = await attr(a, 'images');
  await a.mouse.click(cx, cy);
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  await attendre(500);
  verifier(norm(await a.textContent('#pl-tiroir-titre')) === 'Boutique Centre-ville', 'un clic sur le bâtiment (picking) ouvre sa fiche : ' + norm(await a.textContent('#pl-tiroir-titre')));
  await a.waitForFunction(id => document.querySelector('.pl3-etiquette[data-id="' + id + '"]').classList.contains('pl3-actif'), boutiqueId);
  await attendre(1100);
  const zAvant = await attr(a, 'zoom');
  // un clic dans le vide ferme la fiche (après avoir recentré : le coin en haut à gauche de la scène est vide)
  await a.click('[data-act="centrer"]'); await attendre(1200);
  const bx = await a.$eval('#pl3-scene', x => { const r = x.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await a.mouse.click(bx.x + 60, bx.y + 150);
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true, null, { timeout: 4000 });
  verifier(true, 'un clic dans le vide ferme la fiche');

  // ===================================================================================================================
  section('4. Caméra : boutons, molette, glisser, clic droit, clavier, doigts');
  // ===================================================================================================================
  await a.click('[data-act="centrer"]'); await attendre(1100);
  const z0 = await attr(a, 'zoom'), az0 = await attr(a, 'azimut');
  verifier(Math.abs(az0 - Math.PI / 4) < 0.002, 'vue de départ : azimut 45 ° (' + az0 + ')');
  await a.click('[data-act="plus"]'); await attendre(600);
  const z1 = await attr(a, 'zoom');
  verifier(z1 > z0 * 1.2, 'zoom + : ' + z0 + ' → ' + z1);
  await a.click('[data-act="moins"]'); await a.click('[data-act="moins"]'); await attendre(700);
  const z2 = await attr(a, 'zoom');
  verifier(z2 < z1 / 1.5, 'zoom − : ' + z1 + ' → ' + z2);
  await a.click('[data-act="gauche"]'); await attendre(900);
  const azg = await attr(a, 'azimut');
  verifier(Math.abs(azg - (az0 - Math.PI / 2)) < 0.01, 'pivoter à gauche : un quart de tour (' + az0.toFixed(3) + ' → ' + azg.toFixed(3) + ')');
  await a.click('[data-act="droite"]'); await a.click('[data-act="droite"]'); await attendre(1300);
  const azd = await attr(a, 'azimut');
  verifier(Math.abs(azd - (az0 + Math.PI / 2)) < 0.01, 'pivoter à droite deux fois : deux quarts de tour (' + azd.toFixed(3) + ')');
  await capture(a, '7-pivote');
  await a.click('[data-act="centrer"]'); await attendre(1100);
  verifier(Math.abs(await attr(a, 'azimut') - Math.PI / 4) < 0.002 && Math.abs(await attr(a, 'zoom') - z0) < 0.05, 'recentrer : retour à la vue d\'ensemble');
  const boite = await a.$eval('#pl3-scene', x => { const r = x.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const ccx = boite.x + 70, ccy = boite.y + 150, cwx = boite.x + boite.w / 2, cwy = boite.y + boite.h / 2 + 40;   // (ccx, ccy) : un point sans bâtiment ni étiquette
  // molette (vers le pointeur)
  await a.mouse.move(cwx, cwy); await a.mouse.wheel(0, -400); await attendre(500);
  const zw = await attr(a, 'zoom');
  verifier(zw > z0 * 1.3, 'molette vers l\'avant : zoom ' + z0 + ' → ' + zw);
  await a.mouse.wheel(0, 700); await attendre(500);
  verifier(await attr(a, 'zoom') < zw, 'molette vers l\'arrière : on dézoome');
  for (let i = 0; i < 30; i++) { await a.mouse.wheel(0, 600); }
  await attendre(400);
  const zmin = await attr(a, 'zoom');
  for (let i = 0; i < 40; i++) { await a.mouse.wheel(0, -600); }
  await attendre(400);
  const zmax = await attr(a, 'zoom');
  verifier(zmin > 1 && zmax > zmin * 4 && zmax < 200, 'limites de zoom : de ' + zmin.toFixed(1) + ' à ' + zmax.toFixed(1) + ' pixels par mètre (on ne dézoome pas à l\'infini)');
  await a.click('[data-act="centrer"]'); await attendre(1100);
  // glisser = déplacer
  const avantPos = (await etiquettes(a)).find(e => e.id === 1).boite;
  await a.mouse.move(ccx, ccy); await a.mouse.down(); await a.mouse.move(ccx + 120, ccy + 40, { steps: 6 }); await a.mouse.up();
  await attendre(300);
  const apresPos = (await etiquettes(a)).find(e => e.id === 1).boite;
  verifier(Math.abs((apresPos.x - avantPos.x) - 120) < 12 && Math.abs((apresPos.y - avantPos.y) - 40) < 12, 'glisser = déplacer : l\'étiquette suit la souris (' + Math.round(apresPos.x - avantPos.x) + ', ' + Math.round(apresPos.y - avantPos.y) + ')');
  verifier(await a.isHidden('#pl-tiroir'), 'un glisser n\'est pas un clic (aucune fiche ouverte)');
  // clic droit + glisser = pivoter, puis on retombe sur un pas de 90°
  await a.mouse.move(ccx, ccy); await a.mouse.down({ button: 'right' }); await a.mouse.move(ccx + 190, ccy, { steps: 8 });
  const azPendant = await attr(a, 'azimut');
  await a.mouse.up({ button: 'right' });
  await attendre(900);
  const azApres = await attr(a, 'azimut'), pas = (azApres - Math.PI / 4) / (Math.PI / 2);
  verifier(Math.abs(azPendant - Math.PI / 4) > 0.3 && Math.abs(pas - Math.round(pas)) < 0.01 && Math.round(pas) !== 0, 'clic droit + glisser : la vue pivote puis se cale sur un pas de 90° (pendant ' + azPendant.toFixed(2) + ', après ' + azApres.toFixed(3) + ')');
  // clavier (le canevas a le focus)
  await a.click('[data-act="centrer"]'); await attendre(1100);
  await a.focus('canvas.pl3-canevas');
  const kz = await attr(a, 'zoom');
  await a.keyboard.press('+'); await attendre(500);
  verifier(await attr(a, 'zoom') > kz * 1.2, 'clavier : « + » zoome');
  await a.keyboard.press('-'); await a.keyboard.press('-'); await attendre(600);
  verifier(await attr(a, 'zoom') < kz, 'clavier : « − » dézoome');
  const p0 = (await etiquettes(a)).find(e => e.id === 1).boite;
  await a.keyboard.press('ArrowRight'); await attendre(500);
  const p1 = (await etiquettes(a)).find(e => e.id === 1).boite;
  verifier(p1.x < p0.x - 10, 'clavier : flèche droite déplace la vue (l\'étiquette part vers la gauche : ' + Math.round(p0.x) + ' → ' + Math.round(p1.x) + ')');
  await a.keyboard.press('q'); await attendre(900);
  verifier(Math.abs(await attr(a, 'azimut') - (Math.PI / 4 - Math.PI / 2)) < 0.01, 'clavier : Q pivote à gauche');
  await a.keyboard.press('e'); await a.keyboard.press('e'); await attendre(1300);
  verifier(Math.abs(await attr(a, 'azimut') - (Math.PI / 4 + Math.PI / 2)) < 0.01, 'clavier : E pivote à droite');
  await a.keyboard.press('Home'); await attendre(1100);
  verifier(Math.abs(await attr(a, 'azimut') - Math.PI / 4) < 0.002 && Math.abs(await attr(a, 'zoom') - z0) < 0.05, 'clavier : Origine recentre');
  // doigts (événements pointeur tactiles) : pincement = zoom, deux doigts qui tournent = pivoter, un doigt = déplacer
  const geste = (nom, pas) => a.evaluate(async ([nom, etapes]) => {
    const c = document.querySelector('canvas.pl3-canevas'), r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2 + 30;
    const ev = (type, id, px, py) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: px, clientY: py, bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    const t = () => new Promise(f => setTimeout(f, 30));
    if (nom === 'pincement') {
      ev('pointerdown', 1, x - 40, y); ev('pointerdown', 2, x + 40, y);
      for (let i = 1; i <= etapes; i++) { ev('pointermove', 1, x - 40 - i * 12, y); ev('pointermove', 2, x + 40 + i * 12, y); await t(); }
      ev('pointerup', 1, x - 40 - etapes * 12, y); ev('pointerup', 2, x + 40 + etapes * 12, y);
    } else if (nom === 'rotation') {
      ev('pointerdown', 1, x - 60, y); ev('pointerdown', 2, x + 60, y);
      for (let i = 1; i <= etapes; i++) { const a = i * 0.08; ev('pointermove', 1, x - 60 * Math.cos(a), y - 60 * Math.sin(a)); ev('pointermove', 2, x + 60 * Math.cos(a), y + 60 * Math.sin(a)); await t(); }
      ev('pointerup', 1, x, y); ev('pointerup', 2, x, y);
    } else {
      ev('pointerdown', 1, x, y);
      for (let i = 1; i <= etapes; i++) { ev('pointermove', 1, x + i * 10, y + i * 4); await t(); }
      ev('pointerup', 1, x + etapes * 10, y + etapes * 4);
    }
  }, [nom, pas]);
  const tz = await attr(a, 'zoom');
  await geste('pincement', 8); await attendre(300);
  verifier(await attr(a, 'zoom') > tz * 1.4, 'deux doigts qui s\'écartent : zoom ' + tz + ' → ' + await attr(a, 'zoom'));
  await a.click('[data-act="centrer"]'); await attendre(1100);
  const tp = (await etiquettes(a)).find(e => e.id === 1).boite;
  await geste('glisser', 8); await attendre(300);
  const tp2 = (await etiquettes(a)).find(e => e.id === 1).boite;
  verifier(Math.abs((tp2.x - tp.x) - 80) < 12, 'un doigt qui glisse déplace la vue (' + Math.round(tp2.x - tp.x) + ' px)');
  await a.click('[data-act="centrer"]'); await attendre(1100);
  await geste('rotation', 14); await attendre(1000);
  const azT = await attr(a, 'azimut'), pasT = (azT - Math.PI / 4) / (Math.PI / 2);
  verifier(Math.abs(pasT - Math.round(pasT)) < 0.01 && Math.round(pasT) !== 0, 'deux doigts qui tournent : la vue pivote et se cale sur un pas de 90° (azimut ' + azT.toFixed(3) + ')');
  await a.click('[data-act="centrer"]'); await attendre(1100);

  // ===================================================================================================================
  section('5. Où est cette pièce ? : épingles, estompage, échap');
  // ===================================================================================================================
  async function cherche(p, texte) {
    await p.fill('#pl-recherche', texte); await p.press('#pl-recherche', 'Enter');
    await p.waitForFunction(() => document.getElementById('pl-recherche').getAttribute('data-attente') === '0');
  }
  await cherche(a, 'P-0003');
  await a.waitForSelector('.pl3-trouve');
  await attendre(2300);                                              // les épingles tombent (rebond) puis la caméra se pose
  const sp = stockPiece('P-0003');
  et = await etiquettes(a);
  const trouves = et.filter(e => e.epingle !== null);
  verifier(JSON.stringify(trouves.map(e => e.id).sort()) === JSON.stringify(Object.keys(sp).map(Number).sort()), 'P-0003 : une épingle sur chaque emplacement qui a la pièce (et seulement eux) : ' + trouves.map(e => e.id));
  verifier(trouves.every(e => parseFloat(e.epingle) === parseFloat(sp[e.id]) && norm(e.qte) === fmt(sp[e.id])), 'chaque épingle porte la bonne quantité (pastille) : ' + trouves.map(e => e.id + ':' + norm(e.qte)).join(' '));
  verifier(await attr(a, 'epingles') === trouves.length && await attr(a, 'actifs') === 0, 'la scène compte ' + trouves.length + ' épingle(s) ; les animations sont terminées (data-actifs 0)');
  verifier(et.filter(e => e.epingle === null).every(e => e.classe.includes('pl3-estompe')) && trouves.every(e => !e.classe.includes('pl3-estompe') && e.classe.includes('pl3-trouve')), 'les autres emplacements s\'estompent, les trouvés ressortent');
  const pxr = await pixels(a);
  verifier(pxr.bleus > 120, 'les épingles bleues sont dessinées dans la scène (pixels bleus d\'épingle : ' + pxr.bleus + ')');
  verifier(trouves.every(e => e.boite.x > boite.x - 5 && e.boite.x + e.boite.w < boite.x + boite.w + 5 && e.boite.y > boite.y - 5), 'les étiquettes des emplacements trouvés restent visibles et dans la scène (la caméra a cadré les résultats)');
  verifier(/P-0003/.test(await a.textContent('#pl-bandeau')) && !(await a.isHidden('#pl-vider')), 'le bandeau et la croix existent comme dans la vue Tuiles');
  await capture(a, '2-recherche-epingles');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => !document.querySelector('.pl3-trouve') && document.querySelectorAll('[data-epingle]').length === 0);
  await attendre(900);
  et = await etiquettes(a);
  verifier(et.every(e => e.epingle === null && !e.classe.includes('pl3-estompe')) && await attr(a, 'epingles') === 0, 'Échap efface la recherche : plus d\'épingle, tout est revenu');
  await cherche(a, 'P-0003'); await a.waitForSelector('.pl3-trouve');
  await a.click('#pl-bandeau .pl-croix');
  verifier(!(await a.$('.pl3-trouve')), 'la croix du bandeau efface aussi la recherche');
  sql("INSERT INTO pieces (code, nom, unite) VALUES ('P-VIDE3', 'Pièce sans stock 3D', 'unité')");
  await cherche(a, 'P-VIDE3'); await a.waitForFunction(() => !document.getElementById('pl-bandeau').hidden);
  await attendre(500);
  verifier((await etiquettes(a)).every(e => !e.classe.includes('pl3-estompe') && e.epingle === null) && await attr(a, 'epingles') === 0, 'pièce nulle part : aucune épingle, rien n\'est estompé');
  await a.keyboard.press('Escape');
  // une recherche, puis la fiche d'un emplacement trouvé : la pièce est repérée dans la liste
  await cherche(a, 'P-0003'); await a.waitForSelector('.pl3-trouve'); await attendre(900);
  await a.click('.pl3-trouve');
  await a.waitForSelector('#pl-lignes .pl-ligne-trouvee');
  verifier(await a.$eval('#pl-lignes .pl-ligne-trouvee .code', x => x.textContent) === 'P-0003', 'la fiche ouverte repère la pièce cherchée');
  await a.keyboard.press('Escape'); await a.keyboard.press('Escape');
  await a.waitForFunction(() => !document.querySelector('.pl3-trouve'));

  // ===================================================================================================================
  section('6. Temps réel : un autre poste fait un mouvement, la scène le montre (anneau, +N / −N, carton qui vole)');
  // ===================================================================================================================
  await a.click('[data-act="centrer"]'); await attendre(1200);
  const g = await page(b, { width: 1366, height: 800 });
  await L.connecter(g, 'gestionnaire'); await aller(g); await pret3d(g);
  const att0 = attendu([1, 2]);
  const base = { pulses: await attr(a, 'pulses'), vols: await attr(a, 'vols'), images: await attr(a, 'images') };
  // rien ne change : aucune animation pendant plusieurs interrogations
  await attendre(9000);
  verifier(await attr(a, 'pulses') === base.pulses && await attr(a, 'vols') === base.vols && await attr(a, 'images') === base.images, 'quand rien ne change (9 s, deux interrogations) : aucune impulsion, aucun vol, aucune image dessinée');
  const t0 = Date.now();
  const tr = await transfert(g, 1, 4, 5, 2);                       // gestionnaire : entrepôt 1 -> cube 14, 2 filtres (P-0005)
  verifier(tr.status === 200 && tr.json.ok, 'l\'autre poste déplace 2 pièces P-0005 : entrepôt de Beauchemin -> Cube 14');
  await a.waitForFunction(() => document.querySelector('.pl3-etiquette[data-id="1"] .pl3-delta, .pl3-etiquette[data-id="4"] .pl3-delta'), null, { timeout: 9000, polling: 40 });
  const delai = Date.now() - t0;
  verifier(delai < 8000, 'la scène réagit en ' + delai + ' ms (< 8 s)');
  await a.waitForFunction(() => document.querySelector('.pl3-etiquette[data-id="4"] .pl3-delta'), null, { timeout: 5000, polling: 40 });
  const deltas = await a.evaluate(() => Object.fromEntries(['1', '4'].map(i => [i, Array.from(document.querySelectorAll('.pl3-etiquette[data-id="' + i + '"] .pl3-delta')).map(e => e.textContent + '|' + e.className)])));
  verifier(deltas['1'].some(x => /^−2\|.*pl3-moins/.test(x)) && deltas['4'].some(x => /^\+2\|.*pl3-plus/.test(x)), '« −2 » rouge au-dessus de l\'entrepôt, « +2 » vert au-dessus du cube : ' + JSON.stringify(deltas));
  const animD = await a.$eval('.pl3-etiquette[data-id="4"] .pl3-delta', x => getComputedStyle(x).animationName);
  verifier(animD === 'pl3-flotte', 'le « +2 » flotte puis s\'estompe (animation « ' + animD + ' »)');
  verifier(await attr(a, 'pulses') >= base.pulses + 2 && await attr(a, 'vols') === base.vols + 1, 'anneau lumineux sur les deux bâtiments (' + (await attr(a, 'pulses') - base.pulses) + ' impulsions) et UN carton a volé de l\'un à l\'autre (' + (await attr(a, 'vols') - base.vols) + ')');
  const apres = attendu([1, 2]);
  et = await etiquettes(a);
  verifier(et.filter(e => [1, 4].includes(e.id)).every(e => norm(e.chiffres) === resumeTexte(apres[e.id])) && et.filter(e => ![1, 4].includes(e.id)).every(e => norm(e.chiffres) === resumeTexte(att0[e.id])), 'les étiquettes montrent les nouveaux nombres ; les autres n\'ont pas bougé');
  const cu = await a.$eval('#pl3-delta', x => ({ cache: x.hidden }));
  verifier(cu.cache && norm(await a.textContent('#pl3-unites')) === fmt(resumeSql([1, 2]).unites), 'un déplacement entre deux emplacements ne change pas le total d\'unités (pas de pastille sur la carte)');
  await capture(a, '8-temps-reel');
  await attendre(4500);
  const ap0 = await attr(a, 'images'), ac = await attr(a, 'actifs');
  await attendre(1800);
  verifier(await attr(a, 'images') === ap0 && ac === 0, 'les animations terminées, la scène se tait de nouveau (aucune image en 1,8 s)');
  verifier((await a.$$('.pl3-delta')).length === 0, 'les « +N » ont disparu d\'eux-mêmes');
  // une utilisation (sortie) : le total baisse, la carte le dit
  const ut = await appel(g, 'app/action/sortie_save.php', { emplacement_id: 3, motif: 'service', lignes: [{ piece_id: 3, quantite: '1' }] });
  verifier(ut.status === 200, 'utilisation d\'une pièce du cube 12 par l\'autre poste (' + ut.status + ')');
  await a.waitForFunction(() => document.querySelector('.pl3-etiquette[data-id="3"] .pl3-delta'), null, { timeout: 9000, polling: 40 });
  verifier((await a.$eval('.pl3-etiquette[data-id="3"] .pl3-delta', x => x.textContent)) === '−1' && await attr(a, 'vols') === base.vols + 1, '« −1 » au-dessus du cube 12, sans vol de carton (rien n\'arrive ailleurs)');
  await a.waitForFunction(() => !document.getElementById('pl3-delta').hidden, null, { timeout: 3000 });
  verifier(/^−1$/.test(norm(await a.textContent('#pl3-delta'))) && norm(await a.textContent('#pl3-unites')) === fmt(resumeSql([1, 2]).unites), 'la carte « Unités en stock » montre le total à jour et « −1 »');
  // cartons : le nombre de cartons visibles suit les unités
  const cartAvant = (await etiquettes(a)).find(e => e.id === 1).cartons;
  const [grosPiece, grosQte] = lignes('SELECT piece_id, quantite FROM stock WHERE emplacement_id = 1 ORDER BY quantite DESC LIMIT 1')[0];
  await transfert(g, 1, 3, +grosPiece, Math.floor(parseFloat(grosQte) * 0.7));
  await a.waitForFunction(c => +document.querySelector('.pl3-etiquette[data-id="1"]').getAttribute('data-cartons') !== c, cartAvant, { timeout: 9000, polling: 100 });
  verifier((await etiquettes(a)).find(e => e.id === 1).cartons < cartAvant, 'moins d\'unités = moins de cartons dans l\'entrepôt (' + cartAvant + ' → ' + (await etiquettes(a)).find(e => e.id === 1).cartons + ')');
  await attendre(2500);
  // mouvement réduit : pas de vol, pas de glissement ; les changements restent visibles
  const r = await page(b, { width: 1366, height: 800 }, { reduit: true });
  await L.connecter(r, 'admin'); await aller(r); await pret3d(r);
  const rb = { vols: await attr(r, 'vols'), pulses: await attr(r, 'pulses') };
  await transfert(g, 1, 4, 5, 1);
  await r.waitForFunction(() => document.querySelector('.pl3-etiquette[data-id="4"] .pl3-delta') && document.querySelector('.pl3-etiquette[data-id="1"] .pl3-delta'), null, { timeout: 9000, polling: 40 });
  await attendre(400);
  const dr = await r.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.pl3-delta')).animationName, alerteAnim: getComputedStyle(document.querySelector('.pl3-alerte:not([hidden])'), '::after').animationName }));
  verifier(await attr(r, 'vols') === rb.vols && dr.anim === 'none' && dr.alerteAnim === 'none', 'mouvement réduit demandé : aucun vol de carton, « +N » sans animation, alerte sans pulsation : ' + JSON.stringify(dr));
  verifier(await attr(r, 'pulses') >= rb.pulses + 2, 'mouvement réduit : le repère des bâtiments touchés reste (fixe, sans s\'élargir)');
  const zr = await attr(r, 'zoom');
  await r.click('[data-act="gauche"]'); await attendre(250);
  verifier(Math.abs(await attr(r, 'azimut') - (Math.PI / 4 - Math.PI / 2)) < 0.01, 'mouvement réduit : la caméra pivote immédiatement (pas de glissement)');
  await r.fill('#pl-recherche', 'P-0003'); await r.press('#pl-recherche', 'Enter');
  await r.waitForSelector('.pl3-trouve'); await attendre(300);
  verifier(await attr(r, 'epingles') > 0 && await attr(r, 'actifs') === 0, 'mouvement réduit : les épingles sont posées tout de suite (aucune animation en cours)');
  csp.push(...await r.csp());
  await r.context().close();
  await g.context().close();

  // ===================================================================================================================
  section('7. Perte de contexte WebGL, fuites : 10 allers-retours 3D / Tuiles');
  // ===================================================================================================================
  const perte = await page(b, { width: 1366, height: 800 });
  await L.connecter(perte, 'admin'); await aller(perte); await pret3d(perte);
  const im = await attr(perte, 'images');
  await perte.evaluate(() => { const gl = document.querySelector('canvas.pl3-canevas').getContext('webgl2') || document.querySelector('canvas.pl3-canevas').getContext('webgl'); window.__perdre = gl.getExtension('WEBGL_lose_context'); window.__perdre.loseContext(); });
  await attendre(400);
  await perte.evaluate(() => window.__perdre.restoreContext());
  await perte.waitForFunction(i => +document.getElementById('pl-3d').dataset.images > i, im, { timeout: 8000 });
  await attendre(500);
  verifier(await perte.isVisible('#pl-3d') && (await perte.$$('canvas')).length === 1, 'contexte perdu puis restauré : la scène reprend (image dessinée de nouveau)');
  const pxP = await pixels(perte);
  verifier(pxP.couleurs > 80 && pxP.ecart > 12, 'après restauration, le canevas est de nouveau dessiné');
  await perte.evaluate(() => { window.__perdre.loseContext(); });
  await perte.waitForSelector('#pl-plan:not([hidden]) .pl-tuile', { timeout: 9000 });
  verifier(await perte.isHidden('#pl-3d') && (await perte.$$('canvas')).length === 0 && await perte.evaluate(k => localStorage.getItem(k), CLE_VUE) !== 'tuiles' && (await perte.$$('#toasts .alert')).length === 0, 'contexte perdu sans retour : repli silencieux sur Tuiles (aucun message), la préférence n\'est pas écrasée');
  await perte.context().close();

  const f = await page(b, { width: 1366, height: 800 });
  await L.connecter(f, 'admin'); await aller(f); await pret3d(f);
  await f.click('#pl-vue-tuiles'); await f.waitForSelector('.pl-tuile', { state: 'visible' });
  await f.click('#pl-vue-3d'); await pret3d(f);
  await f.click('#pl-vue-tuiles'); await f.waitForSelector('.pl-tuile', { state: 'visible' });
  await attendre(400);
  const m0 = await mesures(f);
  for (let i = 0; i < 10; i++) {
    await f.click('#pl-vue-3d'); await pret3d(f);
    await f.click('#pl-vue-tuiles'); await f.waitForSelector('.pl-tuile', { state: 'visible' });
  }
  await attendre(600);
  const m1 = await mesures(f);
  verifier(m1.canevas === m0.canevas && m1.canevas === 0, 'après 10 allers-retours : aucun canevas de plus (' + m0.canevas + ' → ' + m1.canevas + ')');
  verifier(m1.contextes === m0.contextes && m1.contextes === 0, 'après 10 allers-retours : aucun contexte WebGL vivant de plus (' + m0.contextes + ' → ' + m1.contextes + ')');
  verifier(m1.ecouteurs === m0.ecouteurs, 'après 10 allers-retours : aucun écouteur (window, document, médias) de plus (' + m0.ecouteurs + ' → ' + m1.ecouteurs + ')');
  verifier(m1.observateurs === m0.observateurs, 'après 10 allers-retours : aucun observateur de taille de plus (' + m0.observateurs + ' → ' + m1.observateurs + ')');
  await f.click('#pl-vue-3d'); await pret3d(f);
  const m2 = await mesures(f);
  verifier(m2.canevas === 1 && m2.contextes === 1, 'en 3D : un canevas, un contexte WebGL vivant (' + JSON.stringify(m2) + ')');
  csp.push(...await f.csp());
  await f.context().close();

  // ===================================================================================================================
  section('8. Téléphone 390 px : Tuiles par défaut, 3D proposée, gestes, pas de modification');
  // ===================================================================================================================
  const t = await page(b, { width: 390, height: 844 });
  await L.connecter(t, 'admin'); await aller(t);
  await t.waitForSelector('.pl-tuile', { state: 'visible' });
  verifier(await t.isHidden('#pl-3d') && await t.isVisible('#pl-vues') && (await t.$$('canvas')).length === 0, 'téléphone : la vue Tuiles est la vue par défaut ; la 3D est proposée par le commutateur');
  verifier(await t.isHidden('#pl-modifier'), 'téléphone : pas de bouton « Modifier le plan »');
  await t.click('#pl-vue-3d'); await pret3d(t);
  verifier(await t.isVisible('#pl-3d') && (await t.$$('canvas')).length === 1 && (await t.$$('.pl3-etiquette')).length === Object.keys(att).length, 'téléphone : la 3D s\'affiche avec ses étiquettes');
  const dbord = await t.evaluate(() => ({ page: document.documentElement.scrollWidth > innerWidth + 1, scene: (r => ({ l: r.width, h: r.height }))(document.getElementById('pl-3d').getBoundingClientRect()) }));
  verifier(!dbord.page && dbord.scene.h >= 400, 'téléphone : rien ne déborde, scène de ' + Math.round(dbord.scene.l) + ' x ' + Math.round(dbord.scene.h) + ' px');
  const bT = await t.$$eval('#pl3-outils .pl3-btn, #pl-vues .pl-vue', bs => bs.map(x => Math.min(x.getBoundingClientRect().width, x.getBoundingClientRect().height)));
  verifier(bT.every(x => x >= 40), 'téléphone : cibles tactiles ≥ 40 px (minimum ' + Math.min(...bT) + ')');
  await t.evaluate(() => window.scrollTo(0, 0));
  await capture(t, '6-telephone-3d');
  const etT = await etiquettes(t);
  const visibles = etT.filter(e => !e.classe.includes('pl3-masque'));
  verifier(visibles.length >= 3 && visibles.every(e => e.boite.x >= -1 && e.boite.x + e.boite.w <= 391), 'téléphone : au moins 3 étiquettes lisibles, aucune ne sort de l\'écran (' + visibles.length + ')');
  // un tap sur une étiquette : la fiche couvre l'écran (panneau de la page)
  await t.click('.pl3-etiquette:not(.pl3-masque)');
  await t.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(await t.evaluate(() => document.getElementById('pl-tiroir').parentElement.id) === 'page-plan' && await t.$eval('#pl-tiroir', x => x.getBoundingClientRect().width) >= 389, 'téléphone : la fiche couvre l\'écran (panneau de la page)');
  await t.keyboard.press('Escape');
  csp.push(...await t.csp());
  await t.context().close();

  // ===================================================================================================================
  section('9. Employé : aucun prix, aucun bouton de modification ; impression');
  // ===================================================================================================================
  const e = await page(b, { width: 1366, height: 800 });
  await L.connecter(e, 'employe'); await aller(e); await pret3d(e);
  const attE = attendu([1]);
  const etE = await etiquettes(e);
  verifier(JSON.stringify(etE.map(x => x.id).sort()) === JSON.stringify(Object.keys(attE).map(Number).sort()) && etE.every(x => norm(x.chiffres) === resumeTexte(attE[x.id])), 'employé de Beauchemin : seulement les emplacements de Beauchemin (' + etE.length + '), avec les bons nombres');
  verifier(await e.isHidden('#pl-modifier') || (await e.$('#pl-modifier')) === null, 'employé : aucun bouton « Modifier le plan »');
  const rsE = resumeSql([1]);
  verifier(norm(await e.textContent('#pl3-unites')) === fmt(rsE.unites) && (await e.textContent('#pl3-bas')).trim() === String(rsE.bas) && (await e.textContent('#pl3-emp')).trim() === String(Object.keys(attE).length), 'employé : les cartes ne comptent que son entreprise (unités ' + fmt(rsE.unites) + ', sous le minimum ' + rsE.bas + ')');
  const jE = await appel(e, 'app/ajax/plan_data.php', null);
  const motsCout = /"(cout|couts|cout_unitaire|cout_moyen|prix|prix_fournisseurs|valeur|valeur_totale|total|total_ligne|montant)"\s*:/;
  verifier(jE.status === 200 && !motsCout.test(jE.texte) && !/cout|prix/.test(jE.texte) && Object.keys(jE.json.resume).sort().join() === 'nb_bas,nb_emplacements,unites', 'employé : plan_data.php (avec le résumé) ne contient aucune clé de prix, coût ni valeur : résumé ' + JSON.stringify(jE.json.resume));
  verifier(!/\$|coût|prix|valeur/i.test(await e.textContent('#pl-3d')), 'employé : aucun prix à l\'écran dans la scène');
  await e.emulateMedia({ media: 'print' });
  const imp = await e.evaluate(() => ({ scene: getComputedStyle(document.getElementById('pl-3d')).display, plan: getComputedStyle(document.getElementById('pl-plan')).display, tuile: getComputedStyle(document.querySelector('.pl-tuile')).position, debord: document.documentElement.scrollWidth > innerWidth + 1 }));
  verifier(imp.scene === 'none' && imp.plan !== 'none' && imp.tuile === 'relative' && !imp.debord, 'impression : la scène 3D disparaît, les tuiles s\'impriment en grille : ' + JSON.stringify(imp));
  csp.push(...await e.csp());
  await e.context().close();

  // ===================================================================================================================
  section('10. Charge : 31 emplacements et des centaines de cartons (mesure du nombre de dessins et du temps JavaScript)');
  // ===================================================================================================================
  const piecesIds = lignes('SELECT id FROM pieces ORDER BY id').map(r => +r[0]);
  const tailles = { entrepot: [340, 180], boutique: [220, 140], cube: [160, 120] };
  let px0 = 0, py0 = 400, hLigne = 0;
  for (let i = 0; i < 26; i++) {
    const ent = 1 + (i % 2), type = i % 4 === 0 ? 'entrepot' : (i % 6 === 1 ? 'boutique' : 'cube'), [lw, lh] = tailles[type];
    sql(`INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (${ent}, 'Charge ${i + 1}', '${type}', 'EMP-CHG-${100 + i}')`);
    const id = +sql(`SELECT id FROM emplacements WHERE code_barres = 'EMP-CHG-${100 + i}'`);
    if (px0 + lw > 1600) { px0 = 0; py0 += hLigne + 20; hLigne = 0; }
    if (py0 + lh <= 1200) { sql(`INSERT INTO plan_emplacements (emplacement_id, x, y, largeur, hauteur) VALUES (${id}, ${px0}, ${py0}, ${lw}, ${lh})`); }
    px0 += lw + 20; hLigne = Math.max(hLigne, lh);
    const nb = 3 + (i * 5) % 9;
    for (let k = 0; k < nb; k++) { sql(`INSERT IGNORE INTO stock (emplacement_id, piece_id, quantite) VALUES (${id}, ${piecesIds[(i + k) % piecesIds.length]}, ${8 + ((i * 7 + k * 13) % 50) * 2})`); }
  }
  const gr = await page(b, { width: 1366, height: 800 });
  await L.connecter(gr, 'admin'); await aller(gr); await pret3d(gr);
  await attendre(1800);
  const nbEmp = +sql('SELECT COUNT(*) FROM emplacements WHERE actif = 1');
  const ecl = await etiquettes(gr);
  const cartonsTot = await attr(gr, 'cartons'), dessG = await attr(gr, 'dessins'), msG = await attr(gr, 'ms'), triG = await attr(gr, 'triangles');
  verifier(ecl.length === nbEmp && nbEmp >= 30, nbEmp + ' emplacements, une étiquette chacun');
  verifier(cartonsTot >= 700, cartonsTot + ' cartons visibles dans la scène (une seule instance de dessin pour tous)');
  console.log('  mesures (31 emplacements) : ' + dessG + ' dessins, ' + triG + ' triangles, ' + msG + ' ms JS par image, ' + cartonsTot + ' cartons visibles');
  verifier(dessG < 300, 'appels de dessin par image : ' + dessG + ' (' + triG + ' triangles) ; temps JavaScript de l\'image : ' + msG + ' ms');
  const masques = ecl.filter(x => x.classe.includes('pl3-masque')).length;
  verifier(masques >= 1 && masques < ecl.length, 'les étiquettes qui se chevauchent sont masquées (' + masques + ' sur ' + ecl.length + ' ; les autres restent lisibles)');
  const lisibles = ecl.filter(x => !x.classe.includes('pl3-masque'));
  let chevauchent = 0;
  lisibles.forEach((p, i) => lisibles.forEach((q, j) => { if (j > i) { const ix = Math.min(p.boite.x + p.boite.w, q.boite.x + q.boite.w) - Math.max(p.boite.x, q.boite.x), iy = Math.min(p.boite.y + p.boite.h, q.boite.y + q.boite.h) - Math.max(p.boite.y, q.boite.y); if (ix > 0 && iy > 0 && ix * iy > 0.2 * Math.min(p.boite.w * p.boite.h, q.boite.w * q.boite.h)) { chevauchent++; } } }));
  verifier(chevauchent === 0, 'aucune paire d\'étiquettes visibles ne se chevauche vraiment');
  const imG = await attr(gr, 'images');
  await gr.mouse.move(700, 500); await gr.mouse.wheel(0, -300); await attendre(700);
  const nImg = (await attr(gr, 'images')) - imG;
  verifier(nImg >= 1 && nImg < 60, 'un zoom dessine ' + nImg + ' image(s) puis la scène se tait');
  await gr.keyboard.press('Escape');
  await gr.fill('#pl-recherche', 'P-0003'); await gr.press('#pl-recherche', 'Enter');
  await gr.waitForFunction(() => document.getElementById('pl-recherche').getAttribute('data-attente') === '0'); await attendre(2500);
  const pins = await attr(gr, 'epingles');
  verifier(pins === Object.keys(stockPiece('P-0003')).length && pins >= 5, 'recherche dans une grande scène : ' + pins + ' épingles aux bons emplacements');
  csp.push(...await gr.csp());
  await gr.context().close();

  // ===================================================================================================================
  section('11. Sans WebGL : repli silencieux sur la vue Tuiles');
  // ===================================================================================================================
  let b2;
  const args = ['--no-sandbox', '--disable-webgl', '--disable-3d-apis', '--disable-gpu'];
  try { b2 = await chromium.launch({ args }); } catch (x) { b2 = await chromium.launch({ args, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
  const sw2 = await page(b2, { width: 1366, height: 800 });
  await L.connecter(sw2, 'admin'); await aller(sw2);
  await sw2.waitForSelector('.pl-tuile', { state: 'visible' });
  const gl = await sw2.evaluate(() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); });
  verifier(!gl, 'ce Chromium n\'a pas WebGL (contrôle du test)');
  verifier(await sw2.isHidden('#pl-3d') && await sw2.isHidden('#pl-vues') && (await sw2.$$('canvas')).length === 0 && (await sw2.$$('.pl-tuile')).length === +sql('SELECT COUNT(*) FROM emplacements WHERE actif = 1'), 'sans WebGL : la vue Tuiles complète, le commutateur et la scène n\'existent pas');
  verifier(await sw2.evaluate(k => localStorage.getItem(k), CLE_VUE) === null && (await sw2.$$('#toasts .alert')).length === 0, 'sans WebGL : aucun message, aucune préférence écrasée');
  await sw2.click('.pl-tuile[data-id="1"]'); await sw2.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(await sw2.evaluate(() => document.getElementById('pl-tiroir').parentElement.id) === 'page-plan', 'sans WebGL : la fiche reste le panneau de la page');
  verifier(await sw2.$eval('#pl-voir-interieur', x => x.hidden) && await sw2.$eval('#pl-voir-etagere', x => x.hidden) && (await sw2.$$('#pl-lignes .pl-pos')).length >= 1, 'sans WebGL : pas de « Voir l\'intérieur » ; les positions (allée · étagère · niveau) se lisent en texte dans la fiche');
  verifier(sw2.erreurs.length === 0, 'sans WebGL : aucune erreur JavaScript ni console : ' + JSON.stringify(sw2.erreurs));
  await b2.close();
  // le contexte est refusé alors que le test de disponibilité avait réussi : repli sans message
  const rf = await page(b, { width: 1366, height: 800 });
  await rf.context().addInitScript(() => {
    const gc = HTMLCanvasElement.prototype.getContext; let n = 0;
    HTMLCanvasElement.prototype.getContext = function (t) { if (/webgl/.test(String(t)) && ++n > 1) { return null; } return gc.apply(this, arguments); };
  });
  await L.connecter(rf, 'admin'); await aller(rf);
  await rf.waitForSelector('.pl-tuile', { state: 'visible' });
  verifier(await rf.isHidden('#pl-3d') && (await rf.$$('canvas')).length === 0 && (await rf.$$('#toasts .alert')).length === 0 && !rf.erreurs.some(m => /pageerror/.test(m)), 'création du contexte refusée : repli silencieux sur Tuiles, aucun message à l\'écran, aucune erreur de page');
  await rf.context().close();

  // ===================================================================================================================
  section('12. Logos réels sur les camions et les bâtiments (Beauchemin, Boutique Chaleur) ; repli si un logo manque');
  // ===================================================================================================================
  reset();                                                          // base de démonstration neuve : les sections précédentes ont ajouté 26 emplacements, des pièces, des mouvements
  await a.context().clearCookies(); await L.connecter(a, 'admin'); await aller(a); await pret3d(a);
  await a.waitForFunction(() => /bea/.test(document.getElementById('pl-3d').getAttribute('data-logos') || '') && /bch/.test(document.getElementById('pl-3d').getAttribute('data-logos') || ''), null, { timeout: 15000 });
  const logosOk = await a.evaluate(async () => {
    const out = {};
    for (const f of ['logo-beauchemin.png', 'logo-boutique-chaleur.png']) { const r = await fetch('assets/img/' + f); out[f] = r.status + ' ' + r.headers.get('content-type'); }
    return out;
  });
  verifier(logosOk['logo-beauchemin.png'] === '200 image/png' && logosOk['logo-boutique-chaleur.png'] === '200 image/png', 'les deux logos réels sont servis par le site (même origine, image/png) : ' + JSON.stringify(logosOk));
  verifier(await a.evaluate(() => document.getElementById('pl-3d').getAttribute('data-logos')) === 'bea,bch', 'les deux logos sont chargés et posés sur les plaques (data-logos = « bea,bch »)');
  const etL = await a.$$eval('.pl3-etiquette', es => es.map(e => ({ id: +e.getAttribute('data-id'), type: e.getAttribute('data-type'), marque: e.getAttribute('data-marque'), logo: e.getAttribute('data-logo') })));
  verifier(etL.filter(e => e.type === 'cube').length >= 3 && etL.filter(e => e.type === 'cube').every(e => e.logo === '1'), 'chaque cube de service (Beauchemin et Boutique Chaleur) porte son logo des deux côtés de la caisse : ' + JSON.stringify(etL.filter(e => e.type === 'cube').map(e => e.id + e.marque + ':' + e.logo)));
  verifier(etL.filter(e => e.type === 'boutique' && e.marque === 'bch').every(e => e.logo === '1'), 'la boutique Boutique Chaleur porte son enseigne avec le logo');
  const pxLogo = await pixels(a);
  // sans les logos (fichiers introuvables) : les plaques gardent le nom dessiné, la scène reste complète, aucune erreur de page
  const fb = await page(b, { width: 1366, height: 800 });
  await fb.route('**/assets/img/logo-*.png', r => r.abort());
  await L.connecter(fb, 'admin'); await aller(fb); await pret3d(fb);
  await attendre(1500);
  verifier((await fb.evaluate(() => document.getElementById('pl-3d').getAttribute('data-logos'))) === '' && (await etiquettes(fb)).length === etL.length, 'logos introuvables : aucun logo chargé, la scène est quand même complète (' + etL.length + ' bâtiments)');
  const pxSans = await pixels(fb);
  verifier(pxSans.couleurs > 80 && pxSans.ecart > 12, 'logos introuvables : la scène reste dessinée (' + pxSans.couleurs + ' couleurs) avec le nom de l\'entreprise écrit sur les plaques');
  const erreursFb = fb.erreurs.filter(m => !/requestfailed|Failed to load resource/.test(m));
  verifier(erreursFb.length === 0 && (await fb.$$('#toasts .alert')).length === 0, 'logos introuvables : aucune erreur JavaScript, aucun message à l\'écran (seule la ressource refusée est signalée par le navigateur) : ' + JSON.stringify(erreursFb));
  csp.push(...await fb.csp());
  await fb.context().close();
  await capture(a, '9-camions-logos');

  // ===================================================================================================================
  section('13. Intérieur : entrer et sortir (bouton, double-clic, Échap, « Retour au plan »), une caisse par pièce, chacune dans sa case');
  // ===================================================================================================================
  await a.reload(); await pret3d(a);
  const tous = attendu([1, 2]);
  // — l'entrepôt principal, en détail
  await a.evaluate(() => document.querySelector('.pl3-etiquette[data-id="1"]').click());
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  const bt = await a.$eval('#pl-voir-interieur', x => ({ visible: !x.hidden, texte: x.textContent.trim(), icone: !!x.querySelector('.fa-door-open'), h: x.getBoundingClientRect().height }));
  verifier(bt.visible && bt.texte === 'Voir l\'intérieur' && bt.icone && bt.h >= 44, 'le tiroir propose « Voir l\'intérieur » (icône de porte ouverte, cible ≥ 44 px) : ' + JSON.stringify(bt));
  verifier(await a.$eval('#pl-voir-etagere', x => x.hidden), 'sans recherche : pas de « Voir sur l\'étagère »');
  const zAvantInt = await attr(a, 'zoom'), azAvantInt = await attr(a, 'azimut');
  await a.click('#pl-voir-interieur');
  await dedansAttente(a); await attendre(1500);
  const exp1 = attenduInt(1), L1 = await lecteurInt(a), li1 = await listeInt(a);
  verifier(L1.id === '1' && await a.isVisible('#pl3-int') && await a.isHidden('#pl3-stats') && await a.isHidden('#pl3-etiquettes') && await a.isHidden('#pl-tiroir'), 'dans l\'intérieur : « Retour au plan » et le fil d\'Ariane remplacent les cartes de statistiques ; les étiquettes et la fiche sont cachées');
  const chrome = await a.evaluate(() => { const r = document.getElementById('pl3-retour'); return { label: r.getAttribute('aria-label'), texte: r.textContent.trim(), h: r.getBoundingClientRect().height, flèche: !!r.querySelector('.fa-arrow-left'), focus: document.activeElement === r, fil: Array.from(document.querySelectorAll('#pl3-int .pl3-fil li')).map(x => x.textContent.trim()), courant: document.getElementById('pl3-fil-nom').getAttribute('aria-current') }; });
  verifier(chrome.label === 'Retour au plan' && chrome.texte === 'Retour au plan' && chrome.h >= 44 && chrome['flèche'] && chrome.focus, '« Retour au plan » : bouton avec flèche, ≥ 44 px, il reçoit le focus à l\'entrée : ' + JSON.stringify(chrome));
  verifier(JSON.stringify(chrome.fil) === JSON.stringify(['Plan', 'Entrepôt principal']) && chrome.courant === 'page', 'fil d\'Ariane discret : « Plan › Entrepôt principal »');
  verifier((await a.$$('canvas')).length === 1 && (await a.getAttribute('canvas.pl3-canevas', 'aria-label')).includes('Intérieur de Entrepôt principal'), 'un seul canevas ; son libellé annonce l\'intérieur');
  verifier(L1.caisses + L1.cachees === exp1.length && li1.length === exp1.length && exp1.length === 14, 'une caisse par pièce en stock : ' + L1.caisses + ' caisse(s) pour ' + exp1.length + ' pièces en stock (SQL)');
  verifier(memeListe(li1, exp1), 'chaque caisse est dans la bonne case (allée:étagère:niveau) selon la base : ' + li1.map(x => x.piece + '→' + x.cas).join(' '));
  verifier(L1.zone === exp1.filter(x => x.cas === 'zone').length && L1.zone >= 2, 'les pièces sans position sont dans la zone « À ranger » (' + L1.zone + ' : ' + exp1.filter(x => x.cas === 'zone').map(x => x.code).join(', ') + ')');
  verifier(li1.every(x => { const e = exp1.find(y => y.piece === x.piece); return x.label.startsWith(e.code + ', ' + e.nom + ', ' + qteTexte(e.q, e.unite) + ', ') && (e.cas === 'zone' ? /à ranger/.test(x.label) : x.label.includes(nomPos(e.cas, 'entrepot').replace(/ · Étagère /, ', étagère ').replace(/ · Niveau /, ', niveau '))); }), 'chaque pièce a une entrée au clavier : « code, nom, quantité, Allée B, étagère 1, niveau 2 » ou « à ranger »');
  const im0i = await attr(a, 'images'); await attendre(2200);
  verifier(await attr(a, 'images') === im0i && (await lecteurInt(a)).actifs === 0, 'au repos, l\'intérieur ne dessine plus rien (rendu à la demande : ' + im0i + ' images)');
  const dI = await attr(a, 'dessins'), tI = await attr(a, 'triangles'), mI = await attr(a, 'ms');
  console.log('  mesures (entrepôt 4 × 6 × 4 = 96 cases, 14 pièces) : ' + dI + ' dessins, ' + tI + ' triangles, ' + mI + ' ms JS par image');
  verifier(dI < 60 && tI < 250000, 'entrepôt de 96 cases : ' + dI + ' appels de dessin, ' + tI + ' triangles par image (rayonnages, caisses et plaques instanciés)');
  await capture(a, '10-interieur-entrepot');
  // — la fiche flottante au survol
  const lis = li1.slice(), bas = lis.find(x => /sous le minimum/.test(x.label)) || lis.find(x => exp1.find(y => y.piece === x.piece).cas !== 'zone'), pos = await placeCaisse(a, bas.piece), e3 = exp1.find(x => x.piece === bas.piece);
  await a.mouse.move(pos.x, pos.y);
  await a.waitForSelector('#pl3-carte:not([hidden])');
  const carte = await a.evaluate(() => { const c = document.getElementById('pl3-carte'); return { code: c.querySelector('.pl3-carte-code').textContent, nom: c.querySelector('.pl3-carte-nom').textContent, qte: c.querySelector('.pl3-carte-qte').textContent, pos: c.querySelector('.pl3-carte-pos').textContent, bas: !c.querySelector('.pl3-carte-bas').hidden, r: c.getBoundingClientRect(), pe: getComputedStyle(c).pointerEvents }; });
  verifier(carte.code === e3.code && carte.nom === e3.nom && norm(carte.qte) === qteTexte(e3.q, e3.unite) && carte.pos === nomPos(e3.cas, 'entrepot') && carte.bas === /sous le minimum/.test(bas.label) && carte.pe === 'none', 'au survol d\'une caisse : fiche avec code, nom, quantité, « ' + carte.pos + ' »' + (carte.bas ? ' et « Sous le minimum »' : '') + ' : ' + JSON.stringify([carte.code, carte.nom, carte.qte]));
  const sB = await scene(a);
  verifier(carte.r.left >= sB.x && carte.r.right <= sB.x + sB.w && carte.r.top >= sB.y && carte.r.bottom <= sB.y + sB.h, 'la fiche reste dans la scène');
  await capture(a, '11-interieur-survol');
  const normal = li1.find(x => !/sous le minimum/.test(x.label) && exp1.find(y => y.piece === x.piece).cas !== 'zone' && x.piece !== bas.piece);
  const pn = await placeCaisse(a, normal.piece);
  await a.mouse.move(pn.x, pn.y); await attendre(400);
  verifier(await a.$eval('#pl3-carte .pl3-carte-bas', x => x.hidden), 'une pièce au-dessus du minimum : pas de pastille « Sous le minimum »');
  await a.mouse.move(sB.x + 60, sB.y + 190); await attendre(400);
  verifier(await a.isHidden('#pl3-carte'), 'le pointeur quitte les caisses : la fiche disparaît');
  // — un clic sur une caisse = sa ligne dans le tiroir
  await a.mouse.click(pn.x, pn.y);
  await a.waitForSelector('#pl-tiroir.pl-ouvert #pl-lignes .pl-ligne-vue');
  verifier(await a.$eval('#pl-lignes .pl-ligne-vue', x => +x.getAttribute('data-piece')) === normal.piece && (await lecteurInt(a)).id === '1', 'un clic sur une caisse ouvre la fiche de la pièce dans le tiroir (la visite continue)');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  verifier((await lecteurInt(a)).id === '1', 'Échap ferme d\'abord la fiche : on reste dans l\'intérieur');
  // — caméra dans l'intérieur : boutons, clavier
  const zi0 = await attr(a, 'zoom'), azi0 = await attr(a, 'azimut');
  await a.click('[data-act="plus"]'); await attendre(600);
  await a.click('[data-act="droite"]'); await attendre(1000);
  verifier(await attr(a, 'zoom') > zi0 * 1.2 && Math.abs(await attr(a, 'azimut') - (azi0 + Math.PI / 2)) < 0.01, 'même caméra dans l\'intérieur : zoom + et pivoter (un quart de tour)');
  const pxi = await pixels(a);
  verifier(pxi.couleurs > 80 && pxi.ecart > 10, 'vue pivotée : l\'intérieur reste dessiné (les parois tournées vers nous s\'effacent) : ' + pxi.couleurs + ' couleurs');
  await a.click('[data-act="centrer"]'); await attendre(1100);
  // — clavier : les pièces sont des boutons ; le focus met la caisse en avant
  await a.focus('.pl3-clavier-btn[data-piece="' + li1[0].piece + '"]');
  await a.waitForSelector('#pl3-carte:not([hidden])');
  verifier(await a.$eval('#pl3-carte .pl3-carte-code', x => x.textContent) === exp1[0].code, 'au clavier : le focus sur une pièce affiche sa fiche et éclaire sa caisse');
  await a.keyboard.press('Enter');
  await a.waitForSelector('#pl-tiroir.pl-ouvert #pl-lignes .pl-ligne-vue');
  verifier(await a.$eval('#pl-lignes .pl-ligne-vue', x => +x.getAttribute('data-piece')) === exp1[0].piece, 'Entrée sur une pièce : sa ligne dans le tiroir');
  await a.keyboard.press('Escape'); await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  // — Échap quitte la visite
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => !document.getElementById('pl-3d').hasAttribute('data-interieur'));
  await attendre(1200);
  const apresInt = await a.evaluate(() => ({ stats: !document.getElementById('pl3-stats').hidden, int: document.getElementById('pl3-int').hidden, etiq: document.querySelectorAll('.pl3-etiquette:not(.pl3-masque)').length, focus: document.activeElement.getAttribute('data-id'), canevas: document.querySelectorAll('canvas').length, caisses: document.getElementById('pl-3d').hasAttribute('data-caisses'), clavier: document.querySelectorAll('.pl3-clavier-btn').length }));
  verifier(apresInt.stats && apresInt.int && apresInt.etiq >= 3 && apresInt.canevas === 1 && !apresInt.caisses && apresInt.clavier === 0, 'Échap : retour au plan (cartes et étiquettes de retour, un seul canevas, plus de liste de caisses) : ' + JSON.stringify(apresInt));
  verifier(apresInt.focus === '1', 'le focus revient sur l\'étiquette de l\'emplacement quitté');
  verifier(Math.abs(await attr(a, 'zoom') - zAvantInt) / zAvantInt < 0.02 && Math.abs(await attr(a, 'azimut') - azAvantInt) < 0.01, 'la vue d\'ensemble est retrouvée comme avant la visite (zoom ' + zAvantInt + ' → ' + await attr(a, 'zoom') + ')');
  // — double-clic sur le bâtiment, puis « Retour au plan »
  const e1 = (await etiquettes(a)).find(x => x.id === 1);
  await a.mouse.dblclick(e1.boite.x + e1.pointe, e1.boite.y + e1.boite.h + 14 + 30);
  await dedansAttente(a);
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true, null, { timeout: 4000 }).catch(() => {});
  verifier((await lecteurInt(a)).id === '1' && await a.isHidden('#pl-tiroir'), 'un double-clic sur le bâtiment entre dans l\'intérieur (la fiche ouverte par le premier clic se referme)');
  await sortirInt(a, 'retour');
  verifier(await a.isVisible('#pl3-stats') && (await a.$$('canvas')).length === 1, '« Retour au plan » : retour au plan');
  // — tous les emplacements : chaque intérieur montre exactement ce que dit la base
  for (const id of Object.keys(tous).map(Number)) {
    const exp = attenduInt(id), type = tous[id].type;
    await entrerInt(a, id);
    const Li = await lecteurInt(a), lii = await listeInt(a);
    verifier(Li.id === String(id) && Li.caisses + Li.cachees === exp.length && memeListe(lii, exp) && Li.zone === exp.filter(x => x.cas === 'zone').length, tous[id].nom + ' (' + type + ', #' + id + ') : ' + exp.length + ' pièces, toutes dans la bonne case, ' + Li.zone + ' à ranger' + (Li.caisses + Li.cachees === exp.length && memeListe(lii, exp) ? '' : ' | scène ' + JSON.stringify(lii.map(x => x.piece + ':' + x.cas)) + ' base ' + JSON.stringify(exp.map(x => x.piece + ':' + x.cas))));
    verifier(lii.every(x => /Côté|Allée|à ranger/.test(x.label)), tous[id].nom + ' : les positions sont dites en toutes lettres (' + (type === 'cube' ? 'côté gauche / côté droit' : 'allée, étagère, niveau') + ')');
    if (type === 'cube') { verifier(lii.every(x => !/Allée/.test(x.label)) && lii.some(x => /Côté (gauche|droit)/.test(x.label)), 'cube de service : côté gauche = allée 1, côté droit = allée 2'); }
    if (type === 'boutique') { await capture(a, '12-interieur-boutique'); }
    if (type === 'cube' && id === 3) { await capture(a, '13-interieur-cube'); }
    await sortirInt(a);
  }

  // ===================================================================================================================
  section('14. Où est cette pièce ? mène à l\'étagère : « Voir sur l\'étagère », épingle bleue dans l\'intérieur, autres caisses estompées');
  // ===================================================================================================================
  await a.reload(); await pret3d(a);
  const cherche2 = async (p, texte) => { await p.fill('#pl-recherche', texte); await p.press('#pl-recherche', 'Enter'); await p.waitForFunction(() => document.getElementById('pl-recherche').getAttribute('data-attente') === '0'); };
  const piecesDe1 = attenduInt(1).filter(x => x.cas !== 'zone');
  const cible = piecesDe1[0];
  await cherche2(a, cible.code);
  await a.waitForSelector('.pl3-trouve'); await attendre(1800);
  await a.evaluate(() => document.querySelector('.pl3-etiquette[data-id="1"]').click());
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  const vis = await a.evaluate(() => ({ etagere: !document.getElementById('pl-voir-etagere').hidden, texte: document.getElementById('pl-voir-etagere').textContent.trim(), interieur: !document.getElementById('pl-voir-interieur').hidden }));
  verifier(vis.etagere && vis.texte === 'Voir sur l\'étagère' && vis.interieur, 'pièce cherchée présente dans l\'emplacement : « Voir sur l\'étagère » apparaît dans le tiroir (avec « Voir l\'intérieur »)');
  const pxExt = await attr(a, 'epingles');
  await a.click('#pl-voir-etagere');
  await dedansAttente(a); await attendre(2600);
  const Lr = await lecteurInt(a);
  verifier(Lr.id === '1' && Lr.epingles === 1, 'la recherche mène dans l\'intérieur : une épingle bleue au-dessus de la caisse de ' + cible.code + ' (épingles : ' + Lr.epingles + ')');
  const pr = await placeCaisse(a, cible.piece), sR = await scene(a);
  verifier(pr.x > sR.x + 80 && pr.x < sR.x + sR.w - 80 && pr.y > sR.y + 60 && pr.y < sR.y + sR.h - 40, 'la caméra a cadré la travée : la caisse cherchée est bien visible (' + Math.round(pr.x - sR.x) + ', ' + Math.round(pr.y - sR.y) + ' dans la scène)');
  const pxPin = await pixels(a);
  verifier(pxPin.bleus > 150, 'l\'épingle et le cadre bleus sont dessinés (pixels bleus : ' + pxPin.bleus + ')');
  const dm = await a.evaluate(() => Array.from(document.querySelectorAll('.pl3-clavier-btn')).length);
  verifier(dm === attenduInt(1).length, 'les autres pièces restent dans la liste du clavier (estompées dans la scène)');
  await capture(a, '14-interieur-recherche');
  // une autre pièce du même emplacement : l'épingle suit ; une pièce qui n'est pas ici : plus d'épingle
  const autre = piecesDe1[1];
  await cherche2(a, autre.code); await attendre(2200);
  verifier((await lecteurInt(a)).id === '1' && (await lecteurInt(a)).epingles === 1, 'une autre recherche pendant la visite : l\'épingle passe à ' + autre.code);
  sql("INSERT INTO pieces (code, nom, unite) VALUES ('P-AILLEURS', 'Pièce rangée ailleurs', 'unité')");
  sql(`INSERT INTO stock (emplacement_id, piece_id, quantite) SELECT 3, id, 5 FROM pieces WHERE code = 'P-AILLEURS'`);
  const absente = 'P-AILLEURS';
  await cherche2(a, absente); await attendre(1500);
  verifier((await lecteurInt(a)).epingles === 0 && (await lecteurInt(a)).id === '1', 'une pièce qui n\'est pas dans cet emplacement : pas d\'épingle (' + absente + ')');
  await a.click('#pl-bandeau .pl-croix'); await attendre(900);
  const pxQ = await pixels(a);
  verifier(pxPin.bleus > pxQ.bleus + 400, 'recherche effacée : l\'épingle disparaît de la scène (pixels bleus ' + pxPin.bleus + ' → ' + pxQ.bleus + ')');
  await sortirInt(a);
  verifier(await attr(a, 'epingles') === 0, 'recherche effacée puis retour au plan : plus d\'épingle');
  // sortir pendant une recherche : les épingles du plan sont toujours là
  await cherche2(a, cible.code); await a.waitForSelector('.pl3-trouve'); await attendre(1500);
  const nbPins = await attr(a, 'epingles');
  await a.evaluate(() => document.querySelector('.pl3-etiquette.pl3-trouve').click());
  await a.waitForSelector('#pl-voir-interieur:not([hidden])');
  await a.click('#pl-voir-interieur'); await dedansAttente(a); await attendre(1500);
  verifier((await lecteurInt(a)).epingles === 1, '« Voir l\'intérieur » pendant une recherche montre aussi l\'épingle');
  await sortirInt(a);
  verifier(await attr(a, 'epingles') === nbPins && nbPins >= 1 && (await a.$$('.pl3-trouve')).length >= 1, 'au retour, les épingles du plan sont revenues (' + nbPins + ')');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => !document.querySelector('.pl3-trouve'));

  // ===================================================================================================================
  section('15. Intérieur en direct : un autre poste déplace du stock, change une position ; « +N / −N », caisses qui apparaissent et disparaissent');
  // ===================================================================================================================
  await a.reload(); await pret3d(a);
  const g2 = await page(b, { width: 1366, height: 800 });
  await L.connecter(g2, 'gestionnaire'); await aller(g2);
  await entrerInt(a, 1);
  const av = attenduInt(1), avantL = await lecteurInt(a);
  const p5 = av.find(x => x.code === 'P-0005'), q5 = parseFloat(p5.q);
  const tr2 = await transfert(g2, 1, 4, p5.piece, 2);
  verifier(tr2.status === 200 && tr2.json.ok, 'l\'autre poste déplace 2 ' + p5.code + ' de l\'entrepôt vers le Cube 14');
  await a.waitForSelector('.pl3-puce[data-delta="−2"]', { state: 'attached', timeout: 9500 });
  verifier(true, '« −2 » apparaît au-dessus de la caisse de ' + p5.code + ' (sans quitter l\'intérieur)');
  const puceFlotte = await a.waitForFunction(() => { const x = document.querySelector('.pl3-puce[data-delta="−2"] .pl3-puce-txt'); return !!x && getComputedStyle(x).animationName === 'pl3-flotte'; }, null, { timeout: 2500, polling: 50 }).then(() => true, () => false);
  const puceCls = await a.evaluate(() => { const x = document.querySelector('.pl3-puce[data-delta="−2"] .pl3-puce-txt'); return x ? x.className : ''; });
  verifier(puceFlotte && (puceCls === '' || /pl3-moins/.test(puceCls)), 'le « −2 » est rouge et flotte puis s\'estompe (animation « pl3-flotte ») : ' + puceCls);
  await attendre(400);
  const lab5 = (await listeInt(a)).find(x => x.piece === p5.piece).label;
  verifier(lab5.includes(qteTexte(String(q5 - 2), p5.unite)), 'la quantité de la caisse est à jour (' + qteTexte(String(q5 - 2), p5.unite) + ') : ' + lab5);
  await a.waitForFunction(() => document.querySelectorAll('.pl3-puce').length === 0, null, { timeout: 6000 });
  verifier(true, 'les « +N / −N » disparaissent d\'eux-mêmes');
  // plus rien ne bouge : la scène se tait
  await attendre(1500);
  const iAv = await attr(a, 'images'); await attendre(1800);
  verifier(await attr(a, 'images') === iAv, 'après l\'animation, la scène se tait de nouveau');
  // une caisse disparaît (tout le stock part), puis revient
  const p13 = av.find(x => x.cas !== 'zone' && x.piece !== p5.piece);
  await transfert(g2, 1, 4, p13.piece, parseFloat(p13.q));
  await a.waitForFunction(p => !document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]'), p13.piece, { timeout: 9500 });
  await attendre(900);
  const apresL = await lecteurInt(a);
  verifier(apresL.caisses + apresL.cachees === av.length - 1, 'toute la quantité de ' + p13.code + ' est partie : sa caisse disparaît (' + (apresL.caisses + apresL.cachees) + ' caisses)');
  await transfert(g2, 4, 1, p13.piece, 3);
  await a.waitForFunction(p => !!document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]'), p13.piece, { timeout: 9500 });
  await attendre(900);
  const retour13 = (await listeInt(a)).find(x => x.piece === p13.piece), exp13 = attenduInt(1).find(x => x.piece === p13.piece);
  verifier(retour13 && retour13.cas === exp13.cas && (await lecteurInt(a)).caisses + (await lecteurInt(a)).cachees === av.length, p13.code + ' revient (3 unités) : nouvelle caisse dans sa case (' + (retour13 && retour13.cas) + ' = base ' + exp13.cas + ')');
  // la position change ailleurs : la caisse change de case
  const pAutre = av.find(x => x.cas !== 'zone' && x.piece !== p5.piece && x.piece !== p13.piece);
  const rsPos = await appel(g2, 'app/action/plan_rangement_save.php', { emplacement_id: 1, piece_id: pAutre.piece, allee: 4, etagere: 6, niveau: 4 });
  verifier(rsPos.status === 200 && rsPos.json.ok, 'l\'autre poste change la position de ' + pAutre.code + ' : ' + pAutre.cas + ' → 4:6:4');
  await a.waitForFunction(p => document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]').getAttribute('data-case') === '4:6:4', pAutre.piece, { timeout: 9500 });
  verifier(memeListe(await listeInt(a), attenduInt(1)), 'la caisse a changé de case sous nos yeux ; toutes les caisses restent dans la case de la base');
  // la pièce part dans la zone « À ranger »
  await appel(g2, 'app/action/plan_rangement_save.php', { emplacement_id: 1, piece_id: pAutre.piece, retirer: true });
  await a.waitForFunction(p => document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]').getAttribute('data-case') === 'zone', pAutre.piece, { timeout: 9500 });
  verifier((await lecteurInt(a)).zone === attenduInt(1).filter(x => x.cas === 'zone').length, 'position retirée : la caisse va dans la zone « À ranger » (' + (await lecteurInt(a)).zone + ' pièces à ranger)');
  // rangement automatique par un autre poste
  const ra = await appel(g2, 'app/action/plan_rangement_auto.php', { emplacement_id: 1 });
  verifier(ra.status === 200 && ra.json.ok, 'l\'autre poste range automatiquement : ' + JSON.stringify(ra.json));
  await a.waitForFunction(() => +document.getElementById('pl-3d').getAttribute('data-zone') === 0, null, { timeout: 9500 });
  verifier(memeListe(await listeInt(a), attenduInt(1)) && (await lecteurInt(a)).zone === attenduInt(1).filter(x => x.cas === 'zone').length, 'rangement automatique : les caisses de la zone gagnent leur case (' + (await lecteurInt(a)).zone + ' restent à ranger)');
  await capture(a, '15-interieur-direct');
  // un emplacement disparaît du plan pendant la visite : retour au plan, sans erreur
  await sortirInt(a);
  // mouvement réduit : « +N » sans animation, aucune transition
  const rd = await page(b, { width: 1366, height: 800 }, { reduit: true });
  await L.connecter(rd, 'admin'); await aller(rd); await pret3d(rd);
  await entrerInt(rd, 1);
  verifier((await lecteurInt(rd)).actifs === 0, 'mouvement réduit : aucune animation en cours dans l\'intérieur');
  await transfert(g2, 1, 4, p5.piece, 1);
  await rd.waitForSelector('.pl3-puce', { state: 'attached', timeout: 9500 });
  verifier(await rd.$eval('.pl3-puce .pl3-puce-txt', x => getComputedStyle(x).animationName) === 'none', 'mouvement réduit : le « −1 » reste en place sans animation');
  await rd.context().close();
  await g2.context().close();

  // ===================================================================================================================
  section('16. Employé : l\'intérieur se lit mais ne se modifie pas ; gestionnaire : glisser-déposer d\'une caisse (enregistrement, refus, retrait)');
  // ===================================================================================================================
  const em = await page(b, { width: 1366, height: 800 });
  const posts = [];
  em.on('request', r => { if (/plan_rangement_(save|auto)/.test(r.url())) { posts.push(r.url()); } });
  await L.connecter(em, 'employe'); await aller(em); await pret3d(em);
  await entrerInt(em, 1);
  const expE = attenduInt(1), liE = await listeInt(em);
  verifier((await lecteurInt(em)).id === '1' && memeListe(liE, expE), 'l\'employé voit l\'intérieur de l\'entrepôt : ' + expE.length + ' pièces, chacune dans sa case');
  const pE = expE.find(x => x.cas !== 'zone'), depE = await placeCaisse(em, pE.piece), destE = await placeCase(em, [3, 3, 3]);
  await glisser(em, depE, destE);
  await attendre(1800);
  verifier(posts.length === 0 && (await listeInt(em)).find(x => x.piece === pE.piece).cas === pE.cas, 'l\'employé ne peut pas déplacer une caisse : aucune requête envoyée, la caisse reste en ' + pE.cas);
  verifier(await em.$eval('canvas.pl3-canevas', c => c.style.cursor) !== 'grabbing', 'aucun curseur de déplacement de caisse pour l\'employé');
  const depE2 = await placeCaisse(em, pE.piece);                  // glisser sans pouvoir ranger = déplacer la vue : la caisse n'est plus au même endroit
  await em.mouse.click(depE2.x, depE2.y);
  await em.waitForSelector('#pl-tiroir.pl-ouvert #pl-lignes .pl-ligne-vue');
  verifier((await em.$$('#pl-lignes button.pl-pos')).length === 0 && await em.$eval('#pl-ranger-auto', x => x.hidden) && (await em.$$('#pl-lignes .pl-pos')).length >= 1, 'employé : la fiche de la pièce montre sa position en lecture seule (aucun éditeur, aucun « Ranger automatiquement »)');
  await em.context().close();

  const gm = await page(b, { width: 1366, height: 800 });
  const reqs = [];
  gm.on('request', r => { if (/plan_rangement_save/.test(r.url())) { reqs.push(JSON.parse(r.postData())); } });
  await L.connecter(gm, 'gestionnaire'); await aller(gm); await pret3d(gm);
  await entrerInt(gm, 1);
  const expG = attenduInt(1), placees = expG.filter(x => x.cas !== 'zone');
  const mobile = placees[0], dep0 = await placeCaisse(gm, mobile.piece);
  const libres = [[3, 3, 3], [4, 5, 2], [2, 6, 4], [1, 5, 4]].filter(c => !expG.some(x => x.cas === c.join(':')));
  const cibleCase = libres[0], dest0 = await placeCase(gm, cibleCase);
  await glisser(gm, dep0, dest0);
  await gm.waitForFunction(p => document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]').getAttribute('data-case') !== null, mobile.piece);
  await attendre(1800);
  const toastOk = await toastTexte(gm, 3000);
  verifier(reqs.length === 1 && reqs[0].piece_id === mobile.piece && reqs[0].emplacement_id === 1 && [reqs[0].allee, reqs[0].etagere, reqs[0].niveau].join(':') === cibleCase.join(':'), 'gestionnaire : glisser ' + mobile.code + ' vers la case ' + cibleCase.join(':') + ' envoie plan_rangement_save.php (' + JSON.stringify(reqs[0]) + ')');
  verifier(sql(`SELECT CONCAT(allee, ':', etagere, ':', niveau) FROM rangements WHERE emplacement_id = 1 AND piece_id = ${mobile.piece}`) === cibleCase.join(':'), 'la base a la nouvelle position (' + cibleCase.join(':') + ')');
  verifier((await listeInt(gm)).find(x => x.piece === mobile.piece).cas === cibleCase.join(':') && memeListe(await listeInt(gm), attenduInt(1)) && /Position enregistrée/.test(toastOk), 'la caisse est dans sa nouvelle case, toutes les autres n\'ont pas bougé ; message « Position enregistrée. »');
  await capture(gm, '16-interieur-deplacement');
  // déposée sur la zone « À ranger » : la position est retirée
  const zn = await placeZone(gm), dep1 = await placeCaisse(gm, mobile.piece);
  await glisser(gm, dep1, zn);
  await gm.waitForFunction(p => document.querySelector('.pl3-clavier-btn[data-piece="' + p + '"]').getAttribute('data-case') === 'zone', mobile.piece, { timeout: 6000 });
  await attendre(900);
  verifier(reqs.length === 2 && reqs[1].retirer === true && sql(`SELECT COUNT(*) FROM rangements WHERE emplacement_id = 1 AND piece_id = ${mobile.piece}`) === '0', 'déposée sur la zone « À ranger » : la position est retirée (requête « retirer », plus de ligne en base)');
  // glisser à côté de tout (dans le vide) : rien ne part
  const vide = await scene(gm), dep2 = await placeCaisse(gm, mobile.piece);
  await glisser(gm, dep2, { x: vide.x + 90, y: vide.y + vide.h - 70 });
  await attendre(1200);
  verifier(reqs.length === 2 && (await listeInt(gm)).find(x => x.piece === mobile.piece).cas === 'zone', 'lâchée dans le vide : la caisse revient où elle était, aucune requête');
  // refus du serveur : la caisse revient et le message du serveur s'affiche
  await gm.route('**/app/action/plan_rangement_save.php', r => r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, erreur: 'Position refusée par le serveur.' }) }));
  const dep3 = await placeCaisse(gm, mobile.piece), dest3 = await placeCase(gm, cibleCase);
  await glisser(gm, dep3, dest3);
  const toastKo = await toastTexte(gm, 4000);
  await attendre(1200);
  verifier(/Position refusée par le serveur/.test(toastKo) && (await listeInt(gm)).find(x => x.piece === mobile.piece).cas === 'zone' && sql(`SELECT COUNT(*) FROM rangements WHERE emplacement_id = 1 AND piece_id = ${mobile.piece}`) === '0', 'refus du serveur : la caisse revient dans la zone, le message du serveur est affiché, la base est inchangée');
  await gm.unroute('**/app/action/plan_rangement_save.php');
  // le gestionnaire voit aussi l'éditeur de position du tiroir (l'autre voie de rangement)
  await gm.mouse.click(dep3.x, dep3.y);
  await gm.waitForSelector('#pl-tiroir.pl-ouvert #pl-lignes .pl-ligne-vue');
  verifier((await gm.$$('#pl-lignes button.pl-pos')).length >= 1, 'gestionnaire : le tiroir propose aussi l\'éditeur de position (Allée, Étagère, Niveau)');
  await gm.context().close();

  // ===================================================================================================================
  section('17. Fuites : 10 allers-retours dans l\'intérieur (aucun canevas, contexte, écouteur ni objet WebGL en plus)');
  // ===================================================================================================================
  const fu = await page(b, { width: 1366, height: 800 });
  await L.connecter(fu, 'admin'); await aller(fu); await pret3d(fu);
  await entrerInt(fu, 1); await sortirInt(fu);                      // un premier tour : tout ce qui se crée une fois est créé
  await entrerInt(fu, 5); await sortirInt(fu);
  const gl0 = await fu.evaluate(() => Object.assign({}, window.__sonde.gl)), mi0 = await mesures(fu);
  for (let i = 0; i < 10; i++) { await entrerInt(fu, i % 2 ? 5 : 1); await sortirInt(fu); }
  const gl1 = await fu.evaluate(() => Object.assign({}, window.__sonde.gl)), mi1 = await mesures(fu);
  verifier(mi1.canevas === 1 && mi0.canevas === 1 && mi1.contextes === mi0.contextes && mi1.contextes === 1, 'après 10 visites : toujours un seul canevas et un seul contexte WebGL vivant (' + JSON.stringify(mi1) + ')');
  verifier(mi1.ecouteurs === mi0.ecouteurs && mi1.observateurs === mi0.observateurs, 'aucun écouteur ni observateur de plus (window / document / médias : ' + mi0.ecouteurs + ' → ' + mi1.ecouteurs + ' ; observateurs ' + mi0.observateurs + ' → ' + mi1.observateurs + ')');
  verifier(gl1.buffers === gl0.buffers && gl1.textures === gl0.textures && gl1.programmes === gl0.programmes && gl1.cibles === gl0.cibles, 'objets WebGL vivants identiques avant et après les 10 visites : ' + JSON.stringify(gl0) + ' → ' + JSON.stringify(gl1));
  const dom = await fu.evaluate(() => ({ btn: document.querySelectorAll('.pl3-clavier-btn').length, puces: document.querySelectorAll('.pl3-puce').length, carte: !document.getElementById('pl3-carte').hidden }));
  verifier(dom.btn === 0 && dom.puces === 0 && !dom.carte, 'au retour : aucune liste de caisses, aucune puce, aucune fiche dans la page');
  // quitter la vue 3D pendant une visite : tout est libéré
  await entrerInt(fu, 1);
  await fu.click('#pl-vue-tuiles');
  await fu.waitForSelector('.pl-tuile', { state: 'visible' });
  const mT = await mesures(fu);
  verifier(mT.canevas === 0 && mT.contextes === 0 && (await fu.evaluate(() => !document.getElementById('page-plan').classList.contains('pl-interieur'))), 'passer en Tuiles pendant une visite détruit la scène (canevas ' + mT.canevas + ', contextes vivants ' + mT.contextes + ')');
  await fu.click('.pl-tuile[data-id="1"]'); await fu.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(await fu.$eval('#pl-voir-interieur', x => x.hidden) && await fu.$eval('#pl-voir-etagere', x => x.hidden), 'vue Tuiles : pas de « Voir l\'intérieur » (les positions s\'y lisent en texte dans la fiche : ' + (await fu.$$('#pl-lignes .pl-pos')).length + ' pastilles)');
  csp.push(...await fu.csp());
  await fu.context().close();

  // ===================================================================================================================
  section('18. Intérieur sur téléphone (390 px) et en grand : 12 allées × 30 étagères × 10 niveaux');
  // ===================================================================================================================
  const ph = await page(b, { width: 390, height: 844 });
  await L.connecter(ph, 'admin'); await aller(ph);
  await ph.click('#pl-vue-3d'); await pret3d(ph);
  await entrerInt(ph, 1);
  const tel = await ph.evaluate(() => { const r = document.getElementById('pl3-retour').getBoundingClientRect(), s = document.getElementById('pl3-scene').getBoundingClientRect(), f = document.querySelector('.pl3-fil').getBoundingClientRect(); return { h: r.height, w: r.width, gauche: r.left, droite: r.right, scene: s.width, fil: f.right, large: document.documentElement.scrollWidth, ecran: window.innerWidth }; });
  verifier(tel.h >= 44 && tel.large <= tel.ecran && tel.fil <= tel.scene + 1 && tel.droite <= tel.scene, 'téléphone : « Retour au plan » (≥ 44 px) et le fil d\'Ariane tiennent dans la scène, aucun défilement horizontal : ' + JSON.stringify(tel));
  verifier((await lecteurInt(ph)).caisses + (await lecteurInt(ph)).cachees === attenduInt(1).length, 'téléphone : les ' + attenduInt(1).length + ' caisses sont là');
  const pxT = await pixels(ph);
  verifier(pxT.couleurs > 60, 'téléphone : l\'intérieur est dessiné');
  await capture(ph, '17-interieur-telephone');
  await sortirInt(ph, 'retour');
  verifier(await ph.isVisible('#pl3-stats'), 'téléphone : « Retour au plan » ramène les cartes');
  await ph.context().close();

  // grand entrepôt : les limites du serveur (12 allées, 30 étagères, 10 niveaux = 3 600 cases), rangé automatiquement
  const big = await page(b, { width: 1366, height: 800 });
  await L.connecter(big, 'admin'); await aller(big); await pret3d(big);
  const rg = await appel(big, 'app/action/plan_geometrie_save.php', { emplacement_id: 1, allees: 12, etageres: 30, niveaux: 10 });
  verifier(rg.status === 200 && rg.json.ok, 'dimensions de l\'entrepôt : 12 × 30 × 10 (' + (rg.status) + ')');
  await appel(big, 'app/action/plan_rangement_auto.php', { emplacement_id: 1 });
  await big.reload(); await pret3d(big);
  await entrerInt(big, 1);
  const expB = attenduInt(1), liB = await listeInt(big), LB = await lecteurInt(big);
  verifier(memeListe(liB, expB) && LB.caisses + LB.cachees === expB.length, 'grand entrepôt (3 600 cases) : ' + expB.length + ' pièces, chacune dans sa case');
  const dB = await attr(big, 'dessins'), tB = await attr(big, 'triangles'), mB = await attr(big, 'ms');
  console.log('  mesures (grand entrepôt 12 × 30 × 10) : ' + dB + ' dessins, ' + tB + ' triangles, ' + mB + ' ms JS par image');
  verifier(dB < 80 && mB < 200, 'grand entrepôt : ' + dB + ' appels de dessin, ' + tB + ' triangles, ' + mB + ' ms de JavaScript par image (rayonnages instanciés)');
  const iB = await attr(big, 'images'); await attendre(2200);
  verifier(await attr(big, 'images') === iB, 'grand entrepôt : au repos, aucune image dessinée');
  await big.mouse.move(683, 450); await big.mouse.wheel(0, -500); await attendre(900);
  verifier(await attr(big, 'images') > iB && (await pixels(big)).couleurs > 60, 'grand entrepôt : le zoom dessine puis la scène se tait');
  await appel(big, 'app/action/plan_geometrie_save.php', { emplacement_id: 1, defaut: true });
  await big.waitForFunction(() => document.querySelectorAll('.pl3-clavier-btn').length > 0, null, { timeout: 12000 });
  await attendre(5000);
  verifier(memeListe(await listeInt(big), attenduInt(1)), 'dimensions remises par défaut ailleurs : l\'intérieur suit et toutes les pièces sont dans une case valide (ou à ranger)');
  csp.push(...await big.csp());
  await big.context().close();

  // ===================================================================================================================
  section('19. Erreurs JavaScript et CSP');
  // ===================================================================================================================
  csp.push(...await a.csp());
  verifier(csp.length === 0, 'aucune violation de la politique de sécurité (script-src \'self\', pas de JavaScript en ligne, pas d\'eval) : ' + JSON.stringify(csp));
  verifier(a.erreurs.length === 0, 'aucune erreur JavaScript ni erreur console (administrateur) : ' + JSON.stringify(a.erreurs));

  await b.close();
  reset();
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(2); });
