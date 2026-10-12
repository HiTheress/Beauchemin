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
  await p.addStyleTag({ content: '.pl3-etiquettes, .pl3-stats, .pl3-outils, .pl-tiroir { visibility: hidden !important; }' }).then(async h => {
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
  verifier(dessG < 160, 'appels de dessin par image : ' + dessG + ' (' + triG + ' triangles) ; temps JavaScript de l\'image : ' + msG + ' ms');
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
  section('12. Erreurs JavaScript et CSP');
  // ===================================================================================================================
  csp.push(...await a.csp());
  verifier(csp.length === 0, 'aucune violation de la politique de sécurité (script-src \'self\', pas de JavaScript en ligne, pas d\'eval) : ' + JSON.stringify(csp));
  verifier(a.erreurs.length === 0, 'aucune erreur JavaScript ni erreur console (administrateur) : ' + JSON.stringify(a.erreurs));

  await b.close();
  reset();
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(2); });
