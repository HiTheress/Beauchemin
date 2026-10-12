// Test de bout en bout du « Plan de l'entrepôt » (page Plan, temps réel, disposition libre).
//   cd gestion && tools/serveur.sh start bea_plan 8842 --neuf
//   DB_NAME=bea_plan BASE_URL=http://127.0.0.1:8842 NODE_PATH=$(npm root -g) node tests/e2e/plan.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME : elle contient la disposition de démonstration),
// ajoute son jeu de données par SQL (emplacement vide, emplacement désactivé, pièce sans stock, gestionnaire de Boutique Chaleur seulement)
// et la remet à zéro à la fin. Toutes les valeurs attendues viennent de requêtes SQL écrites ici, indépendantes du code testé.
// PLAN_CAPTURES=/dossier : enregistre aussi des captures d'écran (bureau avec et sans recherche, tiroir, modification, téléphone).
// La vue 3D (commutateur, scène, étiquettes, temps réel animé, repli sans WebGL) est testée par tests/e2e/plan3d.js.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_plan';
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const CAPTURES = process.env.PLAN_CAPTURES || '';
const verifier = L.verifier;
const attendre = ms => new Promise(r => setTimeout(r, ms));
// La vue 3D est la vue par défaut sur écran large : ce fichier teste la vue Tuiles (la vue 3D a son propre test : plan3d.js).
const tuilesParDefaut = ctx => ctx.addInitScript(() => { try { localStorage.setItem('beauchemin.plan.vue', 'tuiles'); } catch (e) { /* stockage refusé */ } });
async function nouvellePage(b, vp) { const p = await L.nouvellePage(b, vp); await tuilesParDefaut(p.context()); return p; }

// ---- outils ------------------------------------------------------------------------------------------------------------
function sql(q) { return execFileSync('mysql', ['-uroot', '-N', '-B', '--default-character-set=utf8mb4', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function lignes(q) { const r = sql(q); return r === '' ? [] : r.split('\n').map(l => l.split('\t')); }
function reset() { execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' }); }
const norm = t => String(t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const fmt = s => norm(new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 3 }).format(parseFloat(s)));
function section(t) { console.log('\n' + t); }
async function capture(p, nom) { if (CAPTURES) { fs.mkdirSync(CAPTURES, { recursive: true }); await p.screenshot({ path: path.join(CAPTURES, nom + '.png') }); } }

/** Ce que le plan doit montrer pour ces entreprises, calculé en SQL : { id: {nom, type, code, ent, nb, unites, bas} }. */
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
function libelle(t) {
  return t.nom + ', ' + (t.nb ? t.nb + ' pièce' + (t.nb > 1 ? 's' : '') + ', ' + fmt(t.unites) + ' unité' + (parseFloat(t.unites) >= 2 ? 's' : '') : 'vide') + (t.bas ? ', ' + t.bas + ' sous le minimum' : '');
}
async function tuiles(p) {
  return p.$$eval('.pl-tuile', els => els.map(e => ({ id: +e.getAttribute('data-id'), label: e.getAttribute('aria-label'), classe: e.className, x: parseInt(e.style.left, 10), y: parseInt(e.style.top, 10), l: parseInt(e.style.width, 10), h: parseInt(e.style.height, 10), marque: e.getAttribute('data-marque') })));
}
const chevauche = (a, b) => a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
async function toastTexte(p, ms) { try { await p.waitForSelector('#toasts .alert', { timeout: ms || 4000 }); } catch (e) { return ''; } return norm(await p.textContent('#toasts')); }
async function viderToasts(p) { await p.evaluate(() => document.querySelectorAll('#toasts .alert').forEach(e => e.remove())); }
async function aller(p, id) { await L.aller(p, 'plan'); await p.waitForSelector('.pl-tuile'); }
/** Appel d'un endpoint depuis la page (cookies et jeton CSRF de la session). */
async function appel(p, url, corps, opts) {
  return p.evaluate(async ([url, corps, opts]) => {
    const h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (!opts || opts.csrf !== false) { h['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]').content; }
    const r = await fetch(url, { method: corps === null ? 'GET' : 'POST', credentials: 'same-origin', headers: h, body: corps === null ? undefined : JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps, opts || null]);
}
const transfert = (p, de, vers, piece, qte) => appel(p, 'app/action/transfert_save.php', { emplacement_id: de, emplacement_dest_id: vers, lignes: [{ piece_id: piece, quantite: String(qte) }] });
function positionsSql() { return lignes('SELECT emplacement_id, x, y, largeur, hauteur FROM plan_emplacements ORDER BY emplacement_id').map(r => r.map(Number)); }
/** Contraste WCAG entre deux couleurs CSS (analysées par un canevas : accepte rgb(), color(srgb …), color-mix résolu). */
async function contraste(p, selecteur, fond) {
  return p.evaluate(([sel, fondForce]) => {
    const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = s => { c.clearRect(0, 0, 1, 1); c.fillStyle = '#000'; c.fillStyle = s; c.fillRect(0, 0, 1, 1); const d = c.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const e = document.querySelector(sel); if (!e) { return null; }
    const cs = getComputedStyle(e);
    let fond = fondForce || cs.backgroundColor, n = e;
    const opaque = s => { c.clearRect(0, 0, 1, 1); c.fillStyle = s; c.fillRect(0, 0, 1, 1); return c.getImageData(0, 0, 1, 1).data[3] === 255; };
    while (!fondForce && !opaque(fond) && n.parentElement) { n = n.parentElement; fond = getComputedStyle(n).backgroundColor; }
    const a = lum(rgb(cs.color)), b = lum(rgb(fond));
    return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
  }, [selecteur, fond || null]);
}

(async () => {
  reset();
  const b = await L.lancer();
  const ctxOpts = { viewport: { width: 1366, height: 800 } };
  let tailleJournal = 0; try { tailleJournal = fs.statSync(JOURNAL).size; } catch (e) { /* pas de journal */ }
  const violationsCsp = [];

  // ===================================================================================================================
  section('1. Administrateur, écran large : menu, tuiles, couleurs, états');
  // ===================================================================================================================
  const a = await nouvellePage(b, { width: 1366, height: 800 });
  a.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) { violationsCsp.push(m.text()); } });
  await L.connecter(a, 'admin');
  await aller(a);
  const titre = norm(await a.textContent('h1'));
  const menu = await a.$$eval('.main-sidebar .nav-sidebar > .nav-item > .nav-link', ls => ls.map(l => ({ t: l.textContent.trim(), href: l.getAttribute('href'), icone: (l.querySelector('i') || {}).className })));
  const iStock = menu.findIndex(m => m.href === 'index.php?page=stock'), iPlan = menu.findIndex(m => m.href === 'index.php?page=plan');
  verifier(titre === 'Plan' && menu[iPlan] && menu[iPlan].t === 'Plan' && titre === menu[iPlan].t, 'le titre de la page est le libellé du menu : « ' + titre + ' »');
  verifier(iPlan === iStock + 1 && /fa-warehouse/.test(menu[iPlan].icone), 'le menu « Plan » vient juste après « Stock », icône entrepôt : ' + JSON.stringify(menu[iPlan]));
  verifier(await a.$eval('.main-sidebar a[href="index.php?page=plan"]', x => x.classList.contains('active') && x.getAttribute('aria-current') === 'page'), 'l\'entrée du menu est allumée sur la page');
  verifier((await a.title()).includes('Plan'), 'le titre de l\'onglet porte « Plan » : ' + await a.title());

  let att = attendu([1, 2]);
  let ts = await tuiles(a);
  verifier(JSON.stringify(ts.map(t => t.id).sort()) === JSON.stringify(Object.keys(att).map(Number).sort()), 'une tuile par emplacement actif de chaque entreprise, et rien d\'autre : ' + ts.map(t => t.id));
  verifier(ts.every(t => t.label === libelle(att[t.id])), 'étiquette de lecteur d\'écran « Nom, N pièces, N unités » juste pour chaque tuile : ' + ts.map(t => t.label).join(' | '));
  verifier(ts.some(t => /^Entrepôt principal, 14 pièces, 238 unités/.test(t.label)), 'exemple : « Entrepôt principal, 14 pièces, 238 unités… »');
  const nomsTuile = await a.$$eval('.pl-tuile', els => els.map(e => ({ id: +e.getAttribute('data-id'), nom: e.querySelector('.pl-nom').textContent, code: e.querySelector('.pl-code').textContent, ent: e.querySelector('.pl-entreprise').textContent, icone: e.querySelector('.pl-icone i').className, chiffres: e.querySelector('.pl-chiffres').textContent })));
  const codes = Object.fromEntries(lignes('SELECT id, code_barres FROM emplacements').map(r => [r[0], r[1]]));
  verifier(nomsTuile.every(n => n.nom === att[n.id].nom && n.code === codes[n.id]), 'chaque tuile montre son nom et son code d\'étiquette');
  verifier(nomsTuile.every(n => n.ent === (att[n.id].ent === 1 ? 'Beauchemin' : 'Boutique Chaleur')), 'chaque tuile nomme son entreprise (deux entrepôts portent le même nom)');
  const icones = { entrepot: /fa-warehouse/, boutique: /fa-store/, cube: /fa-shuttle-van/ };
  verifier(nomsTuile.every(n => icones[att[n.id].type].test(n.icone)), 'icône selon le type : entrepôt, boutique, cube de service');
  verifier(nomsTuile.every(n => new RegExp('^' + att[n.id].nb + ' pièce').test(norm(n.chiffres)) && norm(n.chiffres).includes(fmt(att[n.id].unites) + ' unité')), 'nombre de pièces différentes et total d\'unités affichés : ' + nomsTuile.map(n => norm(n.chiffres)).join(' | '));
  // couleurs : liseré à gauche aux couleurs de l'entreprise de la tuile (BEA vert/cyan, BCH rouge/or)
  const lis = await a.$$eval('.pl-tuile', els => els.map(e => ({ id: +e.getAttribute('data-id'), marque: e.getAttribute('data-marque'), fond: getComputedStyle(e, '::before').backgroundImage, largeur: getComputedStyle(e, '::before').width })));
  verifier(lis.every(l => (att[l.id].code === 'BEA' ? l.marque === 'bea' && /53, 128, 42/.test(l.fond) && /45, 178, 209/.test(l.fond) : l.marque === 'bch' && /200, 22, 29/.test(l.fond) && /201, 162, 77/.test(l.fond)) && parseFloat(l.largeur) >= 6), 'liséré : BEA vert et cyan, BCH rouge et or (couleurs de leur entreprise, même quand l\'entreprise active est « toutes ») : ' + JSON.stringify(lis[0]));
  // pastille d'alerte « sous le minimum » seulement là où il y en a
  const alertes = await a.$$eval('.pl-tuile', els => els.map(e => ({ id: +e.getAttribute('data-id'), n: e.querySelector('.pl-alerte') ? e.querySelector('.pl-alerte').textContent.trim() : '' })));
  verifier(alertes.every(x => (att[x.id].bas ? x.n === String(att[x.id].bas) : x.n === '')) && alertes.some(x => x.n), 'pastille d\'alerte discrète seulement sur les tuiles qui ont des pièces sous le minimum : ' + JSON.stringify(alertes));
  // aucun texte explicatif
  verifier((await a.$$('.content-wrapper .form-text, .content-wrapper p.text-muted, .content-wrapper .alert-info')).length === 0, 'aucun texte d\'aide à l\'écran');
  verifier(await a.$eval('#pl-recherche', x => x.getAttribute('placeholder').split(' ').length <= 4) && await a.evaluate(() => document.activeElement.id) === 'pl-recherche', 'le champ de recherche est actif dès l\'ouverture, invite de 4 mots au plus');
  verifier((await a.locator('.content-wrapper .btn-primary:visible').count()) === 0 && !(await a.isHidden('#pl-modifier')), 'en consultation : aucun bouton principal ; « Modifier le plan » est un bouton secondaire');
  // tuile vide et emplacement désactivé : jeu de données
  sql("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Dépôt vide', 'entrepot', 'EMP-000090'), (2, 'Ancien cube', 'cube', 'EMP-000091')");
  sql("UPDATE emplacements SET actif = 0 WHERE code_barres = 'EMP-000091'");
  await aller(a);
  att = attendu([1, 2]);
  ts = await tuiles(a);
  const idVide = +sql("SELECT id FROM emplacements WHERE code_barres = 'EMP-000090'"), idOff = +sql("SELECT id FROM emplacements WHERE code_barres = 'EMP-000091'");
  const tVide = ts.find(t => t.id === idVide);
  verifier(tVide && /\bpl-vide\b/.test(tVide.classe) && tVide.label === 'Dépôt vide, vide' && !ts.some(t => t.id === idOff), 'emplacement vide : tuile pâle (« vide ») ; emplacement désactivé : pas de tuile');
  verifier(!/\bpl-vide\b/.test(ts.find(t => t.id === 1).classe), 'une tuile avec des pièces n\'est pas pâle');
  verifier(tVide.x % 20 === 0 && tVide.y % 20 === 0, 'la tuile jamais placée garde une place automatique sur la grille de 20 px (' + tVide.x + ', ' + tVide.y + ')');
  verifier(ts.every((t, i) => ts.every((u, j) => i === j || !chevauche(t, u))), 'aucune tuile n\'en recouvre une autre (places enregistrées + place automatique)');
  const basPlace = Math.max(...ts.filter(t => t.id !== idVide).map(t => t.y + t.h));
  verifier(tVide.y >= basPlace, 'la tuile jamais placée vient sous la disposition enregistrée (y ' + tVide.y + ' ≥ ' + basPlace + ')');
  await capture(a, '1-bureau');
  const contrastes = {
    vide: await contraste(a, '.pl-tuile.pl-vide .pl-chiffres'), alerte: await contraste(a, '.pl-alerte'), direct: await contraste(a, '.pl-direct'),
  };
  verifier(Object.values(contrastes).every(c => c !== null && c >= 4.5), 'contrastes AA (≥ 4,5:1) : texte d\'une tuile vide, pastille d\'alerte, « En direct » : ' + JSON.stringify(contrastes));
  verifier(await a.$eval('#pl-direct', x => x.getAttribute('role') === 'status' && x.textContent.trim() === 'En direct'), 'point vert « En direct » avec sa légende (role=status)');

  // ===================================================================================================================
  section('2. Clavier, tactile, impression');
  // ===================================================================================================================
  await a.focus('#pl-recherche');
  for (let i = 0; i < 8 && !(await a.evaluate(() => document.activeElement.classList.contains('pl-tuile'))); i++) { await a.keyboard.press('Tab'); }   // commutateur de vue, « Modifier le plan », puis la première tuile
  const foc = await a.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return { tag: e.tagName, classe: e.className, contour: cs.outlineStyle, largeur: parseFloat(cs.outlineWidth) }; });
  verifier(foc.tag === 'BUTTON' && /pl-tuile/.test(foc.classe) && foc.contour !== 'none' && foc.largeur >= 2, 'au clavier : Tab arrive sur une tuile (un bouton) avec un focus bien visible : ' + JSON.stringify(foc));
  const taille = await a.$$eval('.pl-tuile, #pl-modifier, #pl-direct', els => els.map(e => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)));
  verifier(taille.every(t => t >= 44), 'cibles tactiles ≥ 44 px (tuiles, bouton, indicateur) : minimum ' + Math.min(...taille));
  await a.keyboard.press('Enter');
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(await a.evaluate(() => document.activeElement.id) === 'pl-tiroir-titre' && !(await a.isHidden('#pl-tiroir')), 'Entrée sur une tuile ouvre le tiroir et y place le focus');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  verifier(await a.evaluate(() => document.activeElement.classList.contains('pl-tuile')), 'Échap ferme le tiroir et ramène le focus sur la tuile');
  await a.emulateMedia({ media: 'print' });
  const imp = await a.evaluate(() => { const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'absent'; }; const t = document.querySelector('.pl-tuile'); return { menu: d('.main-sidebar'), barre: d('.pl-barre'), titre: d('.content-header'), position: getComputedStyle(t).position, tiroir: d('#pl-tiroir'), debord: document.documentElement.scrollWidth > innerWidth + 1 }; });
  verifier(imp.menu === 'none' && imp.barre === 'none' && imp.tiroir === 'none' && imp.position === 'relative' && !imp.debord, 'impression : ni menu, ni barre d\'outils, ni tiroir ; les tuiles se rangent en grille : ' + JSON.stringify(imp));
  await a.emulateMedia({ media: 'screen' });

  // ===================================================================================================================
  section('3. Où est cette pièce ? (recherche, scan, halo, bandeau)');
  // ===================================================================================================================
  async function cherche(p, texte) {
    await p.fill('#pl-recherche', texte); await p.press('#pl-recherche', 'Enter');
    await p.waitForFunction(() => document.getElementById('pl-recherche').getAttribute('data-attente') === '0');      // le lecteur a fini de traiter ce code
  }
  const stockPiece = (code) => Object.fromEntries(lignes(`SELECT s.emplacement_id, s.quantite FROM stock s JOIN pieces p ON p.id = s.piece_id JOIN emplacements e ON e.id = s.emplacement_id WHERE p.code = '${code}' AND s.quantite > 0 AND e.actif = 1`));
  async function etatRecherche(p) {
    return p.evaluate(() => ({
      actif: document.getElementById('page-plan').classList.contains('pl-cherche'),
      trouvees: Array.from(document.querySelectorAll('.pl-tuile.pl-trouve')).map(e => ({ id: +e.getAttribute('data-id'), qte: (e.querySelector('.pl-qte') || {}).textContent, opacite: +getComputedStyle(e).opacity, halo: getComputedStyle(e).boxShadow })),
      autres: Array.from(document.querySelectorAll('.pl-tuile:not(.pl-trouve)')).map(e => ({ id: +e.getAttribute('data-id'), opacite: +getComputedStyle(e).opacity, qte: !!e.querySelector('.pl-qte') })),
      bandeau: document.getElementById('pl-bandeau').hidden ? null : document.getElementById('pl-bandeau').textContent.trim(),
      champ: document.getElementById('pl-recherche').value,
    }));
  }
  await cherche(a, 'P-0003');
  await a.waitForSelector('.pl-tuile.pl-trouve');
  await attendre(600);                                              // fin des transitions (0,3 s)
  let st = await etatRecherche(a);
  let sp = stockPiece('P-0003');
  const somme = Object.values(sp).reduce((s, q) => s + parseFloat(q), 0);
  verifier(JSON.stringify(st.trouvees.map(t => t.id).sort()) === JSON.stringify(Object.keys(sp).map(Number).sort()), 'P-0003 : les tuiles qui contiennent la pièce s\'illuminent (et seulement elles) : ' + st.trouvees.map(t => t.id));
  verifier(st.trouvees.every(t => norm(t.qte) === fmt(sp[t.id])) && st.trouvees.every(t => /rgb/.test(t.halo) && /rgb\((53, 128, 42|200, 22, 29)\) 0px 0px 0px 3px/.test(t.halo)), 'chacune porte son halo et la pastille de la bonne quantité : ' + JSON.stringify(st.trouvees.map(t => t.id + ':' + norm(t.qte))));
  verifier(st.actif && st.autres.length > 0 && st.autres.every(t => t.opacite < 0.5 && !t.qte) && st.trouvees.every(t => t.opacite === 1), 'les autres tuiles s\'estompent, sans pastille');
  verifier(/P-0003/.test(st.bandeau) && /Gicleur Delavan/.test(st.bandeau) && norm(st.bandeau).includes(fmt(somme) + ' en stock'), 'le bandeau nomme la pièce et le total (' + fmt(somme) + ') : « ' + norm(st.bandeau) + ' »');
  verifier(st.champ === '' && await a.evaluate(() => document.activeElement.id) === 'pl-recherche', 'le champ est vidé et garde le curseur, prêt pour le scan suivant');
  const lblRech = await a.$eval('.pl-tuile.pl-trouve', e => e.getAttribute('aria-label'));
  verifier(/, contient \d/.test(lblRech) && lblRech.startsWith(att[+(await a.$eval('.pl-tuile.pl-trouve', e => e.getAttribute('data-id')))].nom + ', '), 'l\'étiquette de lecteur d\'écran dit aussi la quantité trouvée : ' + lblRech);
  verifier((await contraste(a, '.pl-trouve .pl-qte')) >= 4.5, 'contraste AA de la pastille de quantité : ' + await contraste(a, '.pl-trouve .pl-qte'));
  await capture(a, '2-bureau-recherche');
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => !document.querySelector('.pl-trouve'));
  await attendre(600);
  st = await etatRecherche(a);
  verifier(!st.actif && st.bandeau === null && st.autres.every(t => t.opacite === 1), 'Échap efface la recherche : plus de halo, plus de bandeau, tout est revenu');
  await cherche(a, 'P-0003'); await a.waitForSelector('.pl-trouve');
  await a.click('#pl-bandeau .pl-croix');
  verifier((await etatRecherche(a)).bandeau === null && !(await a.$('.pl-trouve')), 'la croix du bandeau efface aussi la recherche');
  await cherche(a, 'P-0003'); await a.waitForSelector('.pl-trouve');
  await a.click('#pl-vider');
  verifier((await etatRecherche(a)).bandeau === null && await a.isHidden('#pl-vider'), 'la croix du champ efface aussi la recherche');
  // code-barres fabricant (alias), nom, plusieurs résultats, inconnu, pièce nulle part, code d'emplacement
  await cherche(a, '012345678905'); await a.waitForSelector('.pl-trouve');
  st = await etatRecherche(a); sp = stockPiece('P-0001');
  verifier(/P-0001/.test(st.bandeau) && st.trouvees.every(t => norm(t.qte) === fmt(sp[t.id])) && st.trouvees.length === Object.keys(sp).length, 'un code-barres du fabricant (autre code) retrouve la pièce : ' + norm(st.bandeau));
  await cherche(a, 'Thermocouple'); await a.waitForFunction(() => /Thermocouple/.test(document.getElementById('pl-bandeau').textContent));
  verifier(true, 'le nom exact d\'une pièce la retrouve');
  await a.fill('#pl-recherche', 'ther');
  await a.waitForSelector('#pl-suggestions li', { timeout: 5000 });
  const sug = await a.$$eval('#pl-suggestions li', ls => ls.map(l => l.textContent));
  verifier(sug.length === 2 && await a.getAttribute('#pl-recherche', 'aria-expanded') === 'true', 'taper un bout de nom propose des pièces (' + sug.length + ') : ' + sug.join(' / '));
  await a.press('#pl-recherche', 'ArrowDown'); await a.press('#pl-recherche', 'ArrowDown'); await a.press('#pl-recherche', 'Enter');
  await a.waitForFunction(() => /Thermostat/.test(document.getElementById('pl-bandeau').textContent));
  verifier(await a.isHidden('#pl-suggestions') && await a.$eval('#pl-recherche', x => x.value) === '', 'flèches bas + Entrée choisissent la pièce, la liste se ferme');
  await a.fill('#pl-recherche', 'gicl');
  await a.waitForSelector('#pl-suggestions li');
  await a.click('#pl-suggestions li');
  await a.waitForFunction(() => /Gicleur/.test(document.getElementById('pl-bandeau').textContent));
  verifier(true, 'un clic sur une suggestion choisit la pièce');
  await viderToasts(a);
  await cherche(a, 'ZZZ-INCONNU');
  const inconnu = await toastTexte(a);
  verifier(/Pièce inconnue/.test(inconnu) && /ZZZ-INCONNU/.test(inconnu), 'pièce inconnue : message court dans une notification : « ' + inconnu + ' »');
  verifier(await a.$eval('.alert-danger', x => true).catch(() => false), 'la notification est un message d\'échec (le réservoir de propane aux yeux en croix la montre)');
  sql("INSERT INTO pieces (code, nom, unite) VALUES ('P-VIDE', 'Pièce sans stock', 'unité')");
  await effacerEtChercher(a, 'P-VIDE');
  async function effacerEtChercher(p, t) { await p.keyboard.press('Escape'); await cherche(p, t); await p.waitForFunction(() => !document.getElementById('pl-bandeau').hidden); await attendre(600); }
  st = await etatRecherche(a);
  verifier(/P-VIDE/.test(st.bandeau) && /Aucun emplacement n'en a en stock/.test(st.bandeau) && !st.actif && st.autres.every(t => t.opacite === 1), 'pièce nulle part : « Aucun emplacement n\'en a en stock. », rien n\'est estompé : « ' + norm(st.bandeau) + ' »');
  await a.keyboard.press('Escape');
  await cherche(a, 'EMP-000003');
  await a.waitForSelector('#pl-tiroir.pl-ouvert');
  verifier(norm(await a.textContent('#pl-tiroir-titre')) === 'Cube 12 — Marc', 'scanner l\'étiquette d\'un emplacement ouvre sa tuile : ' + norm(await a.textContent('#pl-tiroir-titre')));
  await a.keyboard.press('Escape');
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);

  // ===================================================================================================================
  section('4. Contenu d\'une tuile (tiroir)');
  // ===================================================================================================================
  const contenuSql = id => lignes(`SELECT p.code, p.nom, s.quantite, p.unite FROM stock s JOIN pieces p ON p.id = s.piece_id WHERE s.emplacement_id = ${id} AND s.quantite > 0 ORDER BY p.nom, p.code`);
  const basSql = id => new Set(lignes(`SELECT p.code FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN pieces p ON p.id = s.piece_id JOIN seuils se ON se.piece_id = s.piece_id AND se.entreprise_id = e.entreprise_id
        WHERE s.emplacement_id = ${id} AND s.quantite > 0 AND p.actif = 1 AND se.minimum > 0
          AND se.minimum > (SELECT SUM(s2.quantite) FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id WHERE s2.piece_id = s.piece_id AND e2.entreprise_id = e.entreprise_id)`).map(r => r[0]));
  await a.click('.pl-tuile[data-id="1"]');
  await a.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne');
  await attendre(400);
  const lig = await a.$$eval('#pl-lignes .pl-ligne', ls => ls.map(l => ({ code: l.querySelector('.code').textContent, nom: l.querySelector('.pl-ligne-nom').textContent.trim(), qte: l.querySelector('.pl-ligne-qte').textContent.trim(), bas: !!l.querySelector('.badge-bas') })));
  const att1 = contenuSql(1);
  verifier(lig.length === att1.length && lig.every((l, i) => l.code === att1[i][0] && l.nom === att1[i][1] && norm(l.qte).startsWith(fmt(att1[i][2]))), 'tiroir : les ' + lig.length + ' pièces de l\'emplacement, triées par nom, avec les bonnes quantités');
  const bas1 = basSql(1);
  verifier(lig.every(l => l.bas === bas1.has(l.code)) && bas1.size > 0, 'pastille « Sous le minimum » sur les bonnes lignes : ' + Array.from(bas1).join(', '));
  const tx = norm(await a.textContent('#pl-tiroir'));
  verifier(norm(await a.textContent('#pl-tiroir-titre')) === 'Entrepôt principal' && /Beauchemin/.test(tx) && /EMP-000001/.test(tx) && /14 pièces/.test(tx) && /238 unités/.test(tx), 'tiroir : nom, entreprise, code d\'étiquette, résumé');
  verifier(!/\$|coût|prix|valeur/i.test(tx), 'tiroir : aucun prix, coût ni valeur à l\'écran');
  verifier(await a.getAttribute('#pl-voir-stock', 'href') === 'index.php?page=stock&emplacement_id=1', 'lien « Voir dans Stock » : ' + await a.getAttribute('#pl-voir-stock', 'href'));
  verifier(await a.getAttribute('#pl-lignes .pl-ligne:first-child .code', 'href') === 'index.php?page=piece_voir&id=' + sql("SELECT id FROM pieces WHERE code = '" + att1[0][0] + "'"), 'le code de chaque ligne mène à la fiche de la pièce');
  await capture(a, '3-bureau-tiroir');
  await a.fill('#pl-filtre', 'gicl');
  verifier(await a.$$eval('#pl-lignes .pl-ligne', ls => ls.filter(l => !l.hidden).map(l => l.querySelector('.code').textContent).join()) === 'P-0003', 'recherche rapide du tiroir : « gicl » ne laisse que P-0003');
  await a.fill('#pl-filtre', 'tuyau cuivre');
  verifier((await a.$$eval('#pl-lignes .pl-ligne', ls => ls.filter(l => !l.hidden).length)) === 1, 'recherche rapide : chaque mot doit être trouvé (« tuyau cuivre »)');
  await a.fill('#pl-filtre', 'zzzz');
  verifier(/Aucune pièce trouvée/.test(await a.textContent('#pl-lignes')), 'recherche rapide sans résultat : une ligne');
  await a.fill('#pl-filtre', 'éLEctrode');
  verifier((await a.$$eval('#pl-lignes .pl-ligne', ls => ls.filter(l => !l.hidden).length)) === 1, 'recherche rapide sans égard à la casse ni aux accents (« éLEctrode »)');
  // un autre clic ouvre l'autre tuile, la recherche rapide repart de zéro ; la pièce cherchée est repérée dans la liste
  await a.click('.pl-tuile[data-id="3"]');
  await a.waitForFunction(() => document.getElementById('pl-tiroir-titre').textContent === 'Cube 12 — Marc');
  await attendre(400);
  verifier(await a.inputValue('#pl-filtre') === '' && (await a.$$('#pl-lignes .pl-ligne')).length === contenuSql(3).length, 'cliquer une autre tuile change le contenu du tiroir (' + contenuSql(3).length + ' pièces)');
  await cherche(a, 'P-0003');
  await a.waitForSelector('#pl-lignes .pl-ligne-trouvee');
  verifier(await a.$eval('#pl-lignes .pl-ligne-trouvee .code', x => x.textContent) === 'P-0003', 'la pièce cherchée est repérée dans la liste du tiroir');
  await a.keyboard.press('Escape');            // ferme le tiroir
  await a.waitForFunction(() => document.getElementById('pl-tiroir').hidden === true);
  await a.keyboard.press('Escape');            // efface la recherche
  await a.click('#pl-tiroir-fermer', { force: true, timeout: 500 }).catch(() => {});
  await a.goto(L.BASE + '/' + (await a.evaluate(() => 'index.php?page=stock&emplacement_id=1')));
  await a.waitForLoadState('networkidle');
  verifier(await a.$eval('#f-emplacement', x => x.value) === '1', 'la page Stock s\'ouvre filtrée sur l\'emplacement (lien « Voir dans Stock »)');

  // ===================================================================================================================
  section('5. Temps réel : un autre poste fait un mouvement, le plan se met à jour tout seul');
  // ===================================================================================================================
  await aller(a);
  const g = await nouvellePage(b, { width: 1366, height: 800 });
  await L.connecter(g, 'gestionnaire');
  await aller(g);
  // l'interrogation : une requête légère toutes les 4 s, jamais deux en même temps
  const reqs = []; let enVol = 0, maxEnVol = 0;
  a.on('request', r => { if (/plan_version\.php$/.test(r.url())) { reqs.push(Date.now()); enVol++; maxEnVol = Math.max(maxEnVol, enVol); } });
  a.on('requestfinished', r => { if (/plan_version\.php$/.test(r.url())) { enVol--; } });
  a.on('requestfailed', r => { if (/plan_version\.php$/.test(r.url())) { enVol--; } });
  const t0 = Date.now();
  while (reqs.length < 3 && Date.now() - t0 < 16000) { await attendre(200); }
  const ecarts = reqs.slice(1).map((t, i) => t - reqs[i]);
  verifier(reqs.length >= 3 && ecarts.every(e => e >= 3500 && e <= 5500) && maxEnVol === 1, 'le jeton de version est interrogé toutes les 4 s, une requête à la fois : écarts ' + ecarts.join(', ') + ' ms');
  const rep = await appel(a, 'app/ajax/plan_version.php?essai=1', null);
  verifier(rep.status === 200 && /^\d+-\d+-\d+$/.test(rep.json.version) && rep.texte.length < 80, 'réponse de plan_version : un jeton court (' + rep.texte.length + ' octets) : ' + rep.texte);
  const avantEt = Object.fromEntries((await tuiles(a)).map(t => [t.id, t.label]));
  const tMouv = Date.now();
  const tr = await transfert(g, 1, 4, 5, 2);                       // gestionnaire : entrepôt 1 -> cube 14, 2 filtres (P-0005)
  verifier(tr.status === 200 && tr.json.ok, 'l\'autre poste déplace 2 pièces P-0005 : entrepôt de Beauchemin -> Cube 14 (' + tr.status + ')');
  await a.waitForFunction(([id, ancien]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== ancien, [4, avantEt[4]], { timeout: 9000, polling: 100 });
  const delai = Date.now() - tMouv;
  const apres = attendu([1, 2]);
  const ts2 = await tuiles(a);
  verifier(delai < 8000, 'la page du premier poste change en ' + delai + ' ms (< 8 s)');
  verifier(ts2.filter(t => [1, 4].includes(t.id)).every(t => t.label === libelle(apres[t.id])) && ts2.find(t => t.id === 4).label !== avantEt[4], 'les deux tuiles touchées montrent les nouvelles quantités : ' + ts2.find(t => t.id === 4).label);
  verifier(ts2.filter(t => ![1, 4].includes(t.id)).every(t => t.label === avantEt[t.id]), 'les autres tuiles n\'ont pas bougé');
  // pulsation : on la voit sur les tuiles dont le contenu a changé (elle dure 1,6 s ; on la guette)
  await transfert(g, 1, 4, 5, 1);
  const pulse = await a.waitForFunction(() => { const p = Array.from(document.querySelectorAll('.pl-tuile.pl-pulse')).map(e => e.getAttribute('data-id')); return p.length ? { ids: p, anim: getComputedStyle(document.querySelector('.pl-tuile.pl-pulse')).animationName } : null; }, null, { timeout: 9000, polling: 50 }).then(h => h.jsonValue());
  verifier(pulse.ids.includes('4') && pulse.ids.includes('1') && !pulse.ids.includes('2') && pulse.anim === 'pl-pulse', 'les tuiles dont le contenu a changé pulsent (animation « ' + pulse.anim + ' »), pas les autres : ' + pulse.ids);
  await a.waitForFunction(() => !document.querySelector('.pl-pulse'), null, { timeout: 4000 });
  verifier(true, 'la pulsation s\'éteint toute seule');
  // mouvement réduit : pas d'animation, mais le repère reste visible
  await a.emulateMedia({ reducedMotion: 'reduce' });
  await transfert(g, 1, 4, 5, 1);
  const pulseR = await a.waitForFunction(() => { const e = document.querySelector('.pl-tuile.pl-pulse'); return e ? { anim: getComputedStyle(e).animationName, ombre: getComputedStyle(e).boxShadow } : null; }, null, { timeout: 9000, polling: 50 }).then(h => h.jsonValue());
  verifier(pulseR.anim === 'none' && /rgb/.test(pulseR.ombre), 'mouvement réduit demandé : aucune animation (animation-name none), un simple contour : ' + JSON.stringify(pulseR));
  await a.emulateMedia({ reducedMotion: 'no-preference' });
  await a.waitForFunction(() => !document.querySelector('.pl-pulse'), null, { timeout: 4000 });
  // tiroir ouvert : il suit aussi
  await a.click('.pl-tuile[data-id="4"]'); await a.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne'); await attendre(300);
  const qAvant = await a.$$eval('#pl-lignes .pl-ligne', ls => Object.fromEntries(ls.map(l => [l.querySelector('.code').textContent, l.querySelector('.pl-ligne-qte').textContent.trim()])));
  await transfert(g, 1, 4, 5, 1);
  await a.waitForFunction(av => { const l = Array.from(document.querySelectorAll('#pl-lignes .pl-ligne')).find(x => x.querySelector('.code').textContent === 'P-0005'); return l && l.querySelector('.pl-ligne-qte').textContent.trim() !== av; }, qAvant['P-0005'], { timeout: 9000, polling: 100 });
  const qApres = contenuSql(4).find(r => r[0] === 'P-0005');
  verifier(norm(await a.$eval('#pl-lignes .pl-ligne[data-piece="5"] .pl-ligne-qte', x => x.textContent)).startsWith(fmt(qApres[2])), 'le tiroir ouvert se met à jour aussi : P-0005 = ' + fmt(qApres[2]));
  await a.keyboard.press('Escape');
  // utilisation (sortie) et correction : même effet
  const avUt = (await tuiles(a)).find(t => t.id === 3).label;
  const ut = await appel(g, 'app/action/sortie_save.php', { emplacement_id: 3, motif: 'service', lignes: [{ piece_id: 3, quantite: '1' }] });
  verifier(ut.status === 200, 'utilisation d\'une pièce du cube 12 par l\'autre poste (' + ut.status + (ut.json && ut.json.erreur ? ' ' + ut.json.erreur : '') + ')');
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [3, avUt], { timeout: 9000, polling: 100 });
  verifier((await tuiles(a)).find(t => t.id === 3).label === libelle(attendu([1, 2])[3]), 'une utilisation (sortie) se voit sur le plan');
  const avCo = (await tuiles(a)).find(t => t.id === 2).label;
  const co = await appel(g, 'app/action/ajustement_save.php', { emplacement_id: 2, motif: 'correction', lignes: [{ piece_id: 9, quantite: '3', cout_unitaire: '50.00' }] });
  verifier(co.status === 200, 'correction du stock par l\'autre poste (' + co.status + (co.json && co.json.erreur ? ' ' + co.json.erreur : '') + ')');
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [2, avCo], { timeout: 9000, polling: 100 });
  verifier((await tuiles(a)).find(t => t.id === 2).label === libelle(attendu([1, 2])[2]), 'une correction du stock se voit sur le plan (tuile de l\'autre entreprise : l\'administrateur voit tout)');
  // un nouvel emplacement apparaît, un autre disparaît, sans recharger
  sql("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (2, 'Cube neuf', 'cube', 'EMP-000092')");
  const idNeuf = +sql("SELECT id FROM emplacements WHERE code_barres = 'EMP-000092'");
  await a.waitForSelector('.pl-tuile[data-id="' + idNeuf + '"]', { timeout: 9000 });
  verifier(true, 'un emplacement créé apparaît sur le plan en direct (sans mouvement de stock)');
  sql("UPDATE emplacements SET actif = 0 WHERE id = " + idNeuf);
  await a.waitForFunction(id => !document.querySelector('.pl-tuile[data-id="' + id + '"]'), idNeuf, { timeout: 9000 });
  verifier(true, 'un emplacement désactivé disparaît du plan en direct');
  sql("DELETE FROM emplacements WHERE id = " + idNeuf);
  // facture interne et annulation
  const fi = await appel(g, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 2, lignes: [{ piece_id: 13, quantite: '1' }] });
  verifier(fi.status === 200, 'facture interne par l\'autre poste (' + fi.status + (fi.json && fi.json.erreur ? ' ' + fi.json.erreur : '') + ')');
  const avAn = (await tuiles(a)).find(t => t.id === 2).label;
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [2, avAn], { timeout: 9000, polling: 100 }).catch(() => {});
  const avAn2 = (await tuiles(a)).find(t => t.id === 2).label;
  const an = await appel(g, 'app/action/facture_annuler.php', { id: fi.json.id, motif: 'essai du plan' });
  verifier(an.status === 200, 'annulation de la facture par l\'autre poste (' + an.status + (an.json && an.json.erreur ? ' ' + an.json.erreur : '') + ')');
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [2, avAn2], { timeout: 9000, polling: 100 });
  verifier((await tuiles(a)).every(t => t.label === libelle(attendu([1, 2])[t.id])), 'facture interne puis annulation : le plan montre à chaque fois l\'état exact du stock');

  // recherche active + mouvement : les quantités illuminées suivent
  await cherche(a, 'P-0005'); await a.waitForSelector('.pl-trouve');
  const qr0 = (await etatRecherche(a)).trouvees.map(t => t.id + ':' + norm(t.qte)).join();
  await transfert(g, 1, 3, 5, 1);
  await a.waitForFunction(q0 => Array.from(document.querySelectorAll('.pl-trouve')).map(e => e.getAttribute('data-id') + ':' + e.querySelector('.pl-qte').textContent.replace(/[  \s]+/g, ' ').trim()).join() !== q0, qr0, { timeout: 9000, polling: 100 });
  sp = stockPiece('P-0005');
  verifier((await etatRecherche(a)).trouvees.every(t => norm(t.qte) === fmt(sp[t.id])), 'la recherche reste active et ses quantités se mettent à jour en direct');
  await a.keyboard.press('Escape');

  // minimums : le jeton de version ne les couvre pas ; la page relit donc tout toutes les minutes (on avance l'horloge de la page de 61 s)
  const avMin = (await tuiles(a)).map(t => t.label).join('|');
  sql('UPDATE seuils SET minimum = 500 WHERE entreprise_id = 1 AND piece_id = 2');         // P-0002 : 12 en stock, minimum 4 -> 500
  await attendre(5500);
  verifier((await tuiles(a)).map(t => t.label).join('|') === avMin, 'un minimum modifié ne change pas le jeton : le plan ne bouge pas tout de suite');
  await a.evaluate(() => { window.__maintenant = Date.now; const r = Date.now.bind(Date); Date.now = () => r() + 61000; });
  await a.waitForFunction(anc => Array.from(document.querySelectorAll('.pl-tuile')).map(e => e.getAttribute('aria-label')).join('|') !== anc, avMin, { timeout: 9000, polling: 100 });
  const apMin = attendu([1, 2]);
  verifier((await tuiles(a)).every(t => t.label === libelle(apMin[t.id])), 'après une minute, la page relit tout (même sans nouveau jeton) : le minimum modifié apparaît (pastille d\'alerte)');
  sql('UPDATE seuils SET minimum = 4 WHERE entreprise_id = 1 AND piece_id = 2');
  await a.evaluate(() => { Date.now = window.__maintenant; });
  await aller(a);

  // ===================================================================================================================
  section('6. Interrogation : onglet caché, retour, coupure réseau');
  // ===================================================================================================================
  const compte = () => reqs.length;
  await a.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await attendre(300);
  const n0 = compte();
  const avCache = (await tuiles(a)).find(t => t.id === 4).label;
  await transfert(g, 1, 4, 5, 1);
  await attendre(9500);
  verifier(compte() === n0 && await a.getAttribute('#page-plan', 'data-sondage') === 'pause', 'onglet caché : aucune interrogation pendant 9,5 s (' + (compte() - n0) + ' requête) ; sondage en pause');
  verifier((await tuiles(a)).find(t => t.id === 4).label === avCache, 'onglet caché : le plan ne bouge pas');
  const tRetour = Date.now();
  await a.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [4, avCache], { timeout: 3000, polling: 50 });
  verifier(Date.now() - tRetour < 3000 && compte() === n0 + 1 && await a.getAttribute('#page-plan', 'data-sondage') === 'actif', 'retour sur l\'onglet : une interrogation tout de suite, le plan se rafraîchit en ' + (Date.now() - tRetour) + ' ms, puis le rythme reprend');
  // coupure réseau : indicateur discret, recul, jamais de pile, reprise automatique
  await viderToasts(a);
  const echecs = []; a.on('requestfailed', r => { if (/plan_version\.php$/.test(r.url())) { echecs.push(Date.now()); } });
  const nAvant = compte();
  await a.context().setOffline(true);
  await a.waitForSelector('#pl-direct.pl-hors-ligne', { timeout: 12000 });
  const hl = await a.evaluate(() => ({ texte: document.getElementById('pl-direct-texte').textContent, role: document.getElementById('pl-direct').getAttribute('role'), anglais: /failed|network|error|fetch/i.test(document.getElementById('page-plan').textContent), toasts: document.querySelectorAll('#toasts .alert').length }));
  verifier(hl.texte === 'Connexion perdue' && !hl.anglais && hl.toasts === 0, 'réseau coupé : indicateur discret « Connexion perdue », sans message technique ni notification : ' + JSON.stringify(hl));
  verifier((await a.$$('.pl-tuile')).length === Object.keys(attendu([1, 2])).length, 'réseau coupé : le plan reste affiché');
  await attendre(21000);
  const nPendant = compte() - nAvant;
  const gaps = echecs.slice(1).map((t, i) => t - echecs[i]);
  verifier(nPendant <= 4 && gaps.length >= 1 && gaps.every((x, i) => i === 0 || x > gaps[i - 1] * 1.4) && maxEnVol === 1, 'réseau coupé : l\'interrogation recule (' + nPendant + ' tentatives en 25 s, écarts ' + gaps.join(', ') + ' ms), jamais de pile de requêtes');
  await a.context().setOffline(false);
  await a.waitForSelector('#pl-direct:not(.pl-hors-ligne)', { timeout: 20000 });
  verifier(await a.$eval('#pl-direct-texte', x => x.textContent) === 'En direct', 'réseau revenu : reprise automatique, « En direct » de nouveau');
  const avRep = (await tuiles(a)).find(t => t.id === 4).label;
  await transfert(g, 1, 4, 5, 1);
  await a.waitForFunction(([id, anc]) => document.querySelector('.pl-tuile[data-id="' + id + '"]').getAttribute('aria-label') !== anc, [4, avRep], { timeout: 10000, polling: 100 });
  verifier(true, 'après la reprise, les mouvements suivants arrivent de nouveau');

  // ===================================================================================================================
  section('7. Employé : aucun prix, aucun bouton de modification, enregistrement refusé');
  // ===================================================================================================================
  const e = await nouvellePage(b, { width: 1366, height: 800 });
  e.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) { violationsCsp.push(m.text()); } });
  await L.connecter(e, 'employe');
  await aller(e);
  const attE = attendu([1]);
  const tsE = await tuiles(e);
  verifier(JSON.stringify(tsE.map(t => t.id).sort()) === JSON.stringify(Object.keys(attE).map(Number).sort()) && tsE.every(t => t.label === libelle(attE[t.id])), 'employé de Beauchemin : seulement les tuiles de Beauchemin (' + tsE.length + '), avec les bonnes quantités');
  verifier((await e.$$('#pl-modifier, #pl-enregistrer, #pl-annuler, #pl-ranger')).length === 0 && await e.getAttribute('#page-plan', 'data-admin') === '0', 'employé : le bouton « Modifier le plan » n\'existe pas');
  const brut = await appel(e, 'app/ajax/plan_data.php?piece_id=5', null);
  verifier(brut.status === 200 && !/"(cout|cout_unitaire|cout_moyen|prix|prix_fournisseurs|valeur|valeur_totale|total|total_ligne|montant)"\s*:/.test(brut.texte) && !/cout|prix|valeur/.test(brut.texte), 'employé : aucune clé de prix, coût ni valeur dans plan_data (réponse brute)');
  const brut2 = await appel(e, 'app/ajax/plan_emplacement.php?emplacement_id=1', null);
  verifier(brut2.status === 200 && !/"(cout|cout_unitaire|cout_moyen|prix|valeur|valeur_totale|total|total_ligne|montant)"\s*:/.test(brut2.texte) && !/cout|prix|valeur/.test(brut2.texte), 'employé : aucune clé de prix, coût ni valeur dans plan_emplacement');
  const rE = await appel(e, 'app/ajax/plan_data.php?piece_id=9', null);
  verifier(rE.json.recherche.emplacements.every(x => attE[x.emplacement_id]) && rE.json.recherche.somme === (Object.keys(stockPiece('P-0009')).filter(k => attE[k]).reduce((s, k) => s + parseFloat(stockPiece('P-0009')[k]), 0)).toFixed(3), 'employé : la recherche d\'une pièce ne compte que le stock de son entreprise (P-0009 est aussi chez Boutique Chaleur)');
  const autre = await appel(e, 'app/ajax/plan_emplacement.php?emplacement_id=2', null);
  verifier(autre.status === 403 && /n'existe pas ou vous n'y avez pas accès/.test(autre.json.erreur), 'employé : le contenu d\'un emplacement de l\'autre entreprise est refusé (403, même message qu\'un emplacement inexistant) : ' + autre.status);
  const inex = await appel(e, 'app/ajax/plan_emplacement.php?emplacement_id=99999', null);
  verifier(inex.status === 403 && inex.json.erreur === autre.json.erreur, 'employé : un emplacement inexistant donne la même réponse (on ne révèle rien)');
  const pos0 = { emplacement_id: 1, x: 0, y: 0, largeur: 240, hauteur: 160 };
  const avantPos = positionsSql().length;
  const sE = await appel(e, 'app/action/plan_save.php', { positions: [pos0] });
  verifier(sE.status === 403 && sE.json.ok === false && positionsSql().length === avantPos, 'employé : l\'enregistrement du plan est refusé par le serveur (403) et rien n\'est écrit : ' + sE.texte);
  const sGest = await appel(g, 'app/action/plan_save.php', { positions: [pos0] });
  verifier(sGest.status === 403 && positionsSql().length === avantPos, 'gestionnaire : refusé aussi (403) : réservé à l\'administrateur');
  const sSans = await appel(a, 'app/action/plan_save.php', { positions: [pos0] }, { csrf: false });
  verifier(sSans.status === 403 && positionsSql().length === avantPos, 'sans jeton de sécurité : refusé (403), même pour l\'administrateur');
  const sGet = await a.evaluate(async () => (await fetch('app/action/plan_save.php', { credentials: 'same-origin' })).status);
  verifier(sGet === 405, 'plan_save n\'accepte que POST (405 en GET)');
  // l'employé ouvre le tiroir : sans prix, quantités justes
  await e.click('.pl-tuile[data-id="3"]'); await e.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne');
  const txE = norm(await e.textContent('#pl-tiroir'));
  verifier(!/\$|coût|prix|valeur/i.test(txE) && (await e.$$('#pl-lignes .pl-ligne')).length === contenuSql(3).length, 'employé : tiroir sans aucun prix ni valeur');
  await e.keyboard.press('Escape');
  // plan identique aux autres rôles : la disposition enregistrée est la même pour tous
  verifier(tsE.filter(t => t.id !== idVide).every(t => { const r = lignes(`SELECT x, y, largeur, hauteur FROM plan_emplacements WHERE emplacement_id = ${t.id}`)[0]; return r && +r[0] === t.x && +r[1] === t.y && +r[2] === t.l && +r[3] === t.h; }), 'la disposition enregistrée est la même pour l\'employé');

  // ===================================================================================================================
  section('8. Gestionnaire d\'une seule entreprise : cloisonnement');
  // ===================================================================================================================
  const hash = execFileSync('php', ['-r', 'echo password_hash("Test-Beauchemin-1", PASSWORD_DEFAULT);'], { encoding: 'utf8' });
  sql("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('gest_bch', 'Gestionnaire BCH', '" + hash + "', 'gestionnaire')");
  sql("INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) SELECT id, 2 FROM utilisateurs WHERE nom_utilisateur = 'gest_bch'");
  const h = await nouvellePage(b, { width: 1366, height: 800 });
  await h.goto(L.BASE + '/login.php');
  await h.fill('input[name=username]', 'gest_bch'); await h.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([h.waitForNavigation(), h.click('button[type=submit]')]);
  await aller(h);
  const attH = attendu([2]);
  const tsH = await tuiles(h);
  verifier(JSON.stringify(tsH.map(t => t.id).sort()) === JSON.stringify(Object.keys(attH).map(Number).sort()) && tsH.every(t => t.label === libelle(attH[t.id]) && t.marque === 'bch'), 'gestionnaire de Boutique Chaleur seulement : ses tuiles et rien de Beauchemin (' + tsH.length + ')');
  verifier((await h.$$('#pl-modifier')).length === 0, 'gestionnaire : pas de bouton « Modifier le plan »');
  const hE = await appel(h, 'app/ajax/plan_emplacement.php?emplacement_id=1', null);
  verifier(hE.status === 403, 'gestionnaire BCH : le contenu d\'un emplacement de Beauchemin est refusé (403)');
  const hR = await appel(h, 'app/ajax/plan_data.php?piece_id=3', null);
  verifier(hR.status === 200 && hR.json.recherche.emplacements.length === Object.keys(stockPiece('P-0003')).filter(k => attH[k]).length && hR.json.tuiles.every(t => t.entreprise_id === 2), 'gestionnaire BCH : la recherche et les tuiles ne montrent que Boutique Chaleur');
  const hVer = await appel(h, 'app/ajax/plan_version.php', null);
  const hVerEmp = await appel(e, 'app/ajax/plan_version.php', null);
  verifier(hVer.json.version !== hVerEmp.json.version, 'les jetons de version de deux entreprises différentes sont distincts');
  const vAvant = (await appel(h, 'app/ajax/plan_version.php', null)).json.version;
  await transfert(e, 1, 3, 1, 1);                                  // l'employé de Beauchemin fait un mouvement
  await attendre(300);
  verifier((await appel(h, 'app/ajax/plan_version.php', null)).json.version === vAvant, 'un mouvement chez Beauchemin ne change pas le jeton de Boutique Chaleur (aucune fuite entre entreprises)');
  const hDonnees = JSON.stringify((await appel(h, 'app/ajax/plan_data.php', null)).json);
  verifier(!/EMP-000001|EMP-000003|EMP-000004|"entreprise_id":1\b/.test(hDonnees), 'aucune trace de Beauchemin dans les données reçues par ce gestionnaire');

  // ===================================================================================================================
  section('9. Administrateur : modifier le plan (souris), enregistrer, annuler, positions invalides');
  // ===================================================================================================================
  await aller(a);
  sql('DELETE FROM plan_emplacements');                           // on repart du rangement automatique
  await aller(a);
  const surfaceAuto = await a.evaluate(() => ({ classe: document.getElementById('pl-surface').className, titres: Array.from(document.querySelectorAll('.pl-groupe')).filter(t => getComputedStyle(t).display !== 'none').map(t => t.textContent.trim()) }));
  verifier(/pl-auto/.test(surfaceAuto.classe) && JSON.stringify(surfaceAuto.titres) === JSON.stringify(['Entrepôts', 'Boutiques', 'Cubes de service']), 'sans disposition enregistrée : rangement automatique, groupé par type (titres : ' + surfaceAuto.titres.join(', ') + ')');
  const tsAuto = await tuiles(a);
  const ordre = tsAuto.slice().sort((p, q) => p.y - q.y || p.x - q.x).map(t => sql(`SELECT CONCAT(type, '|', entreprise_id) FROM emplacements WHERE id = ${t.id}`));
  const rang = { entrepot: 0, boutique: 1, cube: 2 };
  verifier(ordre.every((o, i) => i === 0 || (rang[o.split('|')[0]] > rang[ordre[i - 1].split('|')[0]] || (rang[o.split('|')[0]] === rang[ordre[i - 1].split('|')[0]] && +o.split('|')[1] >= +ordre[i - 1].split('|')[1]))), 'rangement automatique : par type (entrepôts, boutiques, cubes) puis par entreprise : ' + ordre.join(' → '));
  verifier(tsAuto.every(t => t.x % 20 === 0 && t.y % 20 === 0 && t.l === 240 && t.h === 160) && tsAuto.every((t, i) => tsAuto.every((u, j) => i === j || !chevauche(t, u))), 'rangement automatique : sur la grille de 20 px, tuiles de taille standard, sans recouvrement');
  const largeurPlan = await a.$eval('#pl-plan', x => x.clientWidth);
  verifier(await a.evaluate(() => document.getElementById('pl-plan').scrollWidth <= document.getElementById('pl-plan').clientWidth + 1), 'rangement automatique : aucun défilement horizontal (la grille s\'adapte à la largeur ' + largeurPlan + ' px)');

  await a.setViewportSize({ width: 1366, height: 1700 });         // toute la zone est à l'écran : la souris peut aller jusqu'aux limites
  await a.click('#pl-modifier');
  await a.waitForSelector('#pl-enregistrer:visible');
  verifier(await a.isHidden('#pl-modifier') && (await a.locator('.content-wrapper .btn-primary:visible').count()) === 1 && await a.textContent('#pl-enregistrer') === 'Enregistrer' && await a.textContent('#pl-annuler') === 'Annuler', 'mode modification : un seul bouton principal « Enregistrer », et « Annuler »');
  verifier(await a.evaluate(() => document.getElementById('page-plan').classList.contains('pl-edition') && getComputedStyle(document.getElementById('pl-surface')).backgroundImage !== 'none'), 'la grille de 20 px apparaît en fond');
  await capture(a, '4-bureau-modification');
  const depart = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(Object.values(depart).every(t => t.x === tsAuto.find(u => u.id === t.id).x && t.y === tsAuto.find(u => u.id === t.id).y), 'entrer en modification ne déplace aucune tuile');
  // glisser à la souris : le cube 14 (id 4) vers la droite, dans le vide
  async function glisser(p, id, dx, dy, poignee) {
    await p.evaluate(i => document.querySelector('.pl-tuile[data-id="' + i + '"]').scrollIntoView({ block: 'center', behavior: 'instant' }), id);
    const bb = await (await p.$('.pl-tuile[data-id="' + id + '"]')).boundingBox();
    const vp = p.viewportSize(), dedans = (v, max) => Math.max(2, Math.min(max - 2, v));
    const x0 = poignee ? bb.x + bb.width - 10 : bb.x + 40, y0 = poignee ? bb.y + bb.height - 10 : bb.y + 40;
    const x1 = dedans(x0 + dx, vp.width), y1 = dedans(y0 + dy, vp.height);
    await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 5 }); await p.mouse.move(x1, y1, { steps: 5 });
    const pendant = await p.$eval('.pl-tuile[data-id="' + id + '"]', e => e.className);
    await p.mouse.up();
    return pendant;
  }
  const t4 = depart[4];
  const largeurSurface = await a.$eval('#pl-surface', x => parseInt(x.style.width, 10));
  const pend = await glisser(a, 4, 457, 63);                      // pas multiples de 20 : l'accrochage les ramène à la grille
  let apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  const attX = Math.min(Math.round((t4.x + 457) / 20) * 20, Math.floor(largeurSurface / 20) * 20 - t4.l), attY = Math.round((t4.y + 63) / 20) * 20;
  verifier(/pl-deplace/.test(pend) && apr[4].x === attX && apr[4].y === attY && apr[4].x % 20 === 0 && apr[4].y % 20 === 0, 'glisser à la souris : la tuile suit et s\'accroche à la grille de 20 px (' + t4.x + ',' + t4.y + ' → ' + apr[4].x + ',' + apr[4].y + ', attendu ' + attX + ',' + attY + ')');
  verifier(Object.keys(apr).every(i => i === '4' || (apr[i].x === depart[i].x && apr[i].y === depart[i].y)), 'les autres tuiles n\'ont pas bougé');
  // recouvrement : refusé, la tuile revient à sa place
  const avantRec = apr[4];
  const pendRec = await glisser(a, 4, depart[1].x - avantRec.x + 20, depart[1].y - avantRec.y + 20);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[4].x === avantRec.x && apr[4].y === avantRec.y, 'déposer une tuile sur une autre est refusé : elle revient à sa place (' + apr[4].x + ',' + apr[4].y + ')');
  // limites de la zone : bien trop loin à droite et en bas
  const surfL = await a.$eval('#pl-surface', x => parseInt(x.style.width, 10));
  await glisser(a, 4, 6000, 700);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[4].x + apr[4].l <= Math.max(surfL, 1600) && apr[4].x % 20 === 0 && apr[4].y + apr[4].h <= 1200 && apr[4].x >= avantRec.x && apr[4].y === 1200 - apr[4].h && apr[4].x === Math.floor(surfL / 20) * 20 - apr[4].l, 'limites de la zone : tirée très loin, la tuile reste dans le plan (' + apr[4].x + ',' + apr[4].y + ', ' + apr[4].l + 'x' + apr[4].h + ', plan ' + surfL + ' x 1200)');
  await glisser(a, 4, -6000, -3000);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[4].x >= 0 && apr[4].y >= 0, 'limites de la zone : tirée vers le haut et la gauche, elle ne sort pas (' + apr[4].x + ',' + apr[4].y + ')');
  // redimensionner (poignée en bas à droite)
  const t5 = (await tuiles(a)).find(t => t.id === 5);
  await glisser(a, 5, 83, 45, true);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[5].l === Math.round((t5.l + 83) / 20) * 20 && apr[5].h === Math.round((t5.h + 45) / 20) * 20 && apr[5].l % 20 === 0 && apr[5].h % 20 === 0, 'redimensionner à la poignée : la taille suit et s\'accroche (' + t5.l + 'x' + t5.h + ' → ' + apr[5].l + 'x' + apr[5].h + ')');
  await glisser(a, 5, -2000, -1500, true);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[5].l === 140 && apr[5].h === 100, 'taille minimale 140 x 100 respectée (' + apr[5].l + 'x' + apr[5].h + ')');
  await glisser(a, 5, 3000, 1500, true);
  apr = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(apr[5].l <= 600 && apr[5].h <= 400, 'taille maximale 600 x 400 respectée (' + apr[5].l + 'x' + apr[5].h + ')');
  await glisser(a, 5, -3000, -1500, true);
  // clavier : flèches = 20 px, Maj + flèches = taille
  await a.focus('.pl-tuile[data-id="3"]');
  const t3 = (await tuiles(a)).find(t => t.id === 3);
  await a.keyboard.press('ArrowDown'); await a.keyboard.press('ArrowDown');
  const t3b = (await tuiles(a)).find(t => t.id === 3);
  verifier(t3b.y === t3.y + 40 && t3b.x === t3.x, 'au clavier : une flèche déplace la tuile de 20 px (' + t3.y + ' → ' + t3b.y + ')');
  await a.keyboard.press('Shift+ArrowRight');
  verifier((await tuiles(a)).find(t => t.id === 3).l === t3.l + 20, 'au clavier : Maj + flèche change la taille de 20 px');
  // annuler : tout revient
  await a.click('#pl-annuler');
  const apresAnnul = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(Object.keys(depart).every(i => apresAnnul[i].x === depart[i].x && apresAnnul[i].y === depart[i].y && apresAnnul[i].l === depart[i].l && apresAnnul[i].h === depart[i].h) && !(await a.isHidden('#pl-modifier')) && positionsSql().length === 0, '« Annuler » rétablit le plan d\'avant la modification ; rien n\'est écrit');
  // modifier de nouveau, enregistrer, recharger
  await a.click('#pl-modifier');
  await glisser(a, 4, 457, 63);
  await glisser(a, 5, 83, 45, true);
  const voulu = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  await viderToasts(a);
  await a.click('#pl-enregistrer');
  const tEnr = await toastTexte(a);
  verifier(/Plan enregistré/.test(tEnr), 'Enregistrer : notification « ' + tEnr + ' »');
  await a.waitForFunction(() => document.getElementById('pl-modifier').hidden === false);
  const enBase = positionsSql();
  verifier(enBase.length === Object.keys(voulu).length && enBase.every(([id, x, y, l, hh]) => voulu[id].x === x && voulu[id].y === y && voulu[id].l === l && voulu[id].h === hh), 'les positions sont en base : une ligne par emplacement (' + enBase.length + ') : ' + JSON.stringify(enBase.slice(0, 2)));
  verifier(sql("SELECT COUNT(*) FROM journal WHERE action = 'plan.disposition'") === '1' && /Cube 14/.test(sql("SELECT details FROM journal WHERE action = 'plan.disposition'")), 'l\'enregistrement est journalisé (qui, quelles tuiles)');
  await a.reload(); await a.waitForSelector('.pl-tuile');
  const rech = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  verifier(Object.keys(voulu).every(i => rech[i].x === voulu[i].x && rech[i].y === voulu[i].y && rech[i].l === voulu[i].l && rech[i].h === voulu[i].h), 'recharger la page : les tuiles gardent leur position et leur taille');
  verifier(/pl-libre/.test(await a.getAttribute('#pl-surface', 'class')) && (await a.$$('.pl-groupe:visible')).length === 0, 'avec une disposition enregistrée : plus de titres de groupe (disposition libre)');
  const rE2 = await tuiles(e);
  await e.reload(); await e.waitForSelector('.pl-tuile');
  const tsE2 = Object.fromEntries((await tuiles(e)).map(t => [t.id, t]));
  verifier(Object.keys(tsE2).every(i => tsE2[i].x === voulu[i].x && tsE2[i].y === voulu[i].y), 'l\'employé voit la disposition enregistrée par l\'administrateur');
  // une tuile jamais placée garde sa place automatique (sous la disposition) ; mise à jour en direct de la disposition chez l'employé
  sql("DELETE FROM plan_emplacements WHERE emplacement_id = 3");
  await aller(a);
  const sans3 = Object.fromEntries((await tuiles(a)).map(t => [t.id, t]));
  const basSans = Math.max(...Object.values(sans3).filter(t => t.id !== 3).map(t => t.y + t.h));
  verifier(sans3[3].y >= basSans && Object.values(sans3).every((t, i, tous) => tous.every((u, j) => i === j || !chevauche(t, u))) && Object.keys(voulu).filter(i => i !== '3').every(i => sans3[i].x === voulu[i].x && sans3[i].y === voulu[i].y), 'une tuile jamais placée garde une place automatique sous les tuiles placées, sans rien recouvrir (y ' + sans3[3].y + ' ≥ ' + basSans + ')');
  // Tout ranger
  await a.click('#pl-modifier');
  await a.click('#pl-ranger');
  const rangees = Object.values(await tuiles(a));
  verifier(rangees.every(t => t.x % 20 === 0 && t.y % 20 === 0 && t.l === 240 && t.h === 160) && rangees.every((t, i) => rangees.every((u, j) => i === j || !chevauche(t, u))) && positionsSql().length === Object.keys(voulu).length - 1, '« Tout ranger » remet les tuiles en ordre sur la grille, sans rien écrire avant « Enregistrer »');
  await a.click('#pl-annuler');

  // positions invalides refusées par le serveur
  const base = { emplacement_id: 1, x: 0, y: 0, largeur: 240, hauteur: 160 };
  const nb0 = sql('SELECT COUNT(*) FROM plan_emplacements') + '|' + sql('SELECT COALESCE(SUM(x + y + largeur + hauteur), 0) FROM plan_emplacements');
  const cas = [
    [{ ...base, x: 10 }, 'grille'], [{ ...base, x: -20 }, 'sort du plan'], [{ ...base, x: 1500 }, 'sort du plan'], [{ ...base, y: 1100 }, 'sort du plan'],
    [{ ...base, largeur: 100 }, 'Taille invalide'], [{ ...base, hauteur: 800 }, 'Taille invalide'], [{ ...base, x: 20.5 }, 'grille'], [{ ...base, x: 'abc' }, 'grille'],
    [{ ...base, emplacement_id: 99999 }, 'n\'existe plus'], [{ ...base, emplacement_id: idOff }, 'n\'existe plus'], [{ ...base, emplacement_id: 'x' }, 'Emplacement invalide'],
  ];
  const refus = [];
  for (const [p, mot] of cas) {
    const r = await appel(a, 'app/action/plan_save.php', { positions: [p] });
    if (!(r.status === 400 && r.json && r.json.ok === false && r.json.erreur.includes(mot))) { refus.push(JSON.stringify(p) + ' → ' + r.status + ' ' + r.texte.slice(0, 80)); }
  }
  verifier(refus.length === 0, cas.length + ' positions invalides refusées par le serveur (400, message en français) : ' + refus.join(' ; '));
  const r2 = await appel(a, 'app/action/plan_save.php', { positions: [base, { ...base, emplacement_id: 99999 }] });
  verifier(r2.status === 400 && sql('SELECT COUNT(*) FROM plan_emplacements') + '|' + sql('SELECT COALESCE(SUM(x + y + largeur + hauteur), 0) FROM plan_emplacements') === nb0, 'une position valide avec une invalide : tout est refusé, rien n\'est écrit (tout ou rien)');
  verifier((await appel(a, 'app/action/plan_save.php', { positions: [] })).status === 400 && (await appel(a, 'app/action/plan_save.php', {})).status === 400 && (await appel(a, 'app/action/plan_save.php', { positions: 'x' })).status === 400, 'liste vide, absente ou mal formée : refusée (400)');

  // ===================================================================================================================
  section('10. Doigt : tablette (écran tactile), glisser avec de vrais événements tactiles');
  // ===================================================================================================================
  const ct = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  await tuilesParDefaut(ct);
  const tt = await ct.newPage();
  tt.erreurs = []; tt.on('pageerror', x => tt.erreurs.push(x.message)); tt.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) { tt.erreurs.push(m.text()); } });
  await L.connecter(tt, 'admin');
  await aller(tt);
  await tt.evaluate(() => { window.__types = []; document.addEventListener('pointerdown', ev => window.__types.push(ev.pointerType), true); });
  await tt.click('#pl-modifier');
  const cdp = await ct.newCDPSession(tt);
  const avantT = Object.fromEntries((await tuiles(tt)).map(t => [t.id, t]));
  await tt.evaluate(() => document.querySelector('.pl-tuile[data-id="3"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  const bb = await (await tt.$('.pl-tuile[data-id="3"]')).boundingBox();
  const sx = bb.x + 40, sy = bb.y + 40;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + 40 * i, y: sy }] }); await attendre(20); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await attendre(200);
  const apT = (await tuiles(tt)).find(t => t.id === 3);
  const types = await tt.evaluate(() => window.__types);
  verifier(types.includes('touch') && apT.x === Math.round((avantT[3].x + 320) / 20) * 20 && apT.y === avantT[3].y, 'au doigt : de vrais événements tactiles (' + types.join(',') + ') déplacent la tuile et l\'accrochent à la grille (' + avantT[3].x + ',' + avantT[3].y + ' → ' + apT.x + ',' + apT.y + ') ' + JSON.stringify((await tuiles(tt)).map(t => [t.id, t.x, t.y, t.l, t.h])));
  // près du bas de l'écran, la page défile toute seule pendant le glisser (une tablette ne montre pas tout le plan)
  await tt.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await attendre(200);
  const bb6 = await (await tt.$('.pl-tuile[data-id="6"]')).boundingBox();
  const x6 = bb6.x + 40, y6 = bb6.y + 40, bas = tt.viewportSize().height - 12, top6 = parseInt(await tt.$eval('.pl-tuile[data-id="6"]', x => x.style.top), 10);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x6, y: y6 }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x6, y: y6 + (bas - y6) * i / 6 }] }); await attendre(20); }
  await attendre(1500);                                                                 // le doigt reste en bas de l'écran
  const defile = await tt.evaluate(() => ({ y: Math.round(window.scrollY), top: parseInt(document.querySelector('.pl-tuile[data-id="6"]').style.top, 10) }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  verifier(defile.y > 150 && defile.top > top6 + 300, 'au doigt, près du bas de l\'écran : la page défile toute seule et la tuile suit (défilement ' + defile.y + ' px, tuile ' + top6 + ' → ' + defile.top + ')');
  await tt.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  verifier(await tt.evaluate(() => getComputedStyle(document.querySelector('.pl-tuile')).touchAction) === 'none' && await tt.evaluate(() => getComputedStyle(document.querySelector('.pl-poignee')).touchAction) === 'none', 'touch-action: none sur les tuiles en modification (le glisser ne fait pas défiler la page)');
  const poig = await tt.$eval('.pl-poignee', x => { const r = x.getBoundingClientRect(); return Math.min(r.width, r.height); });
  verifier(poig >= 44, 'la poignée de taille est une cible tactile de ' + poig + ' px');
  await tt.click('#pl-annuler');
  verifier(tt.erreurs.length === 0, 'aucune erreur JavaScript sur la tablette : ' + JSON.stringify(tt.erreurs));
  await ct.close();

  // ===================================================================================================================
  section('11. Téléphone 390 px : liste de cartes, pas de glisser-déposer, rien qui déborde');
  // ===================================================================================================================
  const t = await nouvellePage(b, { width: 390, height: 844 });
  await L.connecter(t, 'admin');
  await aller(t);
  const tel = await t.evaluate(() => {
    const ts = Array.from(document.querySelectorAll('.pl-tuile')).map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), pos: getComputedStyle(e).position, droite: r.right }; });
    return { debord: document.documentElement.scrollWidth > innerWidth + 1, sw: document.documentElement.scrollWidth, ts, modifier: getComputedStyle(document.getElementById('pl-modifier')).display, classe: document.getElementById('pl-surface').className,
             groupes: Array.from(document.querySelectorAll('.pl-groupe')).map(g => g.textContent.trim()), recouvre: Array.from(document.querySelectorAll('.pl-tuile')).some((e, i, tous) => tous.some((f, j) => j > i && !(e.getBoundingClientRect().bottom <= f.getBoundingClientRect().top + 1))) };
  });
  verifier(!tel.debord && tel.ts.every(x => x.droite <= 390 && x.w >= 300 && x.h >= 44 && x.pos === 'relative') && new Set(tel.ts.map(x => x.x)).size === 1, 'téléphone : liste de cartes en colonne, sans défilement horizontal (scrollWidth ' + tel.sw + ' ≤ 390)');
  verifier(/pl-liste/.test(tel.classe) && tel.modifier === 'none' && !tel.recouvre, 'téléphone : pas de disposition libre ni de bouton « Modifier le plan », cartes superposées jamais');
  verifier(tel.groupes.includes('Entrepôts') && tel.groupes.includes('Cubes de service'), 'téléphone : cartes groupées par type : ' + tel.groupes.join(', '));
  await capture(t, '5-telephone');
  await t.click('.pl-tuile[data-id="1"]'); await t.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne'); await attendre(350);
  const tir = await t.$eval('#pl-tiroir', x => { const r = x.getBoundingClientRect(); return { l: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), debord: document.documentElement.scrollWidth > innerWidth + 1 }; });
  verifier(tir.l === 390 && tir.x === 0 && tir.h === 844 && !tir.debord, 'téléphone : le tiroir occupe tout l\'écran, sans débordement : ' + JSON.stringify(tir));
  await capture(t, '6-telephone-tiroir');
  const fermer = await t.$eval('#pl-tiroir-fermer', x => { const r = x.getBoundingClientRect(); return Math.min(r.width, r.height); });
  verifier(fermer >= 44, 'téléphone : la croix du tiroir est une cible de ' + fermer + ' px');
  await t.click('#pl-tiroir-fermer');
  await t.fill('#pl-recherche', 'P-0003'); await t.press('#pl-recherche', 'Enter'); await t.waitForSelector('.pl-trouve');
  verifier(!(await t.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) && (await t.$$('.pl-trouve .pl-qte')).length > 0, 'téléphone : la recherche illumine les cartes sans rien déborder');
  const tel2 = await nouvellePage(b, { width: 360, height: 740 });
  await L.connecter(tel2, 'employe');
  await aller(tel2);
  verifier(!(await tel2.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'téléphone 360 px (employé) : aucun défilement horizontal de la page');
  await tel2.click('.pl-tuile[data-id="1"]'); await tel2.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne');
  verifier(!(await tel2.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'téléphone 360 px : tiroir ouvert, aucun défilement horizontal');

  // ===================================================================================================================
  section('12. Journal, XSS, erreurs');
  // ===================================================================================================================
  sql("UPDATE emplacements SET nom = '<img src=x onerror=alert(1)>' WHERE code_barres = 'EMP-000003'");
  sql("UPDATE pieces SET nom = '<img src=x onerror=alert(2)> piégée' WHERE code = 'P-0003'");
  const dialogues = []; a.on('dialog', d => { dialogues.push(d.message()); d.dismiss(); });
  await aller(a);
  await a.waitForTimeout(300);
  await cherche(a, 'P-0003'); await a.waitForSelector('.pl-trouve');
  await a.click('.pl-tuile[data-id="3"]'); await a.waitForSelector('#pl-tiroir.pl-ouvert .pl-ligne');
  const xss = await a.evaluate(() => ({ imgs: document.querySelectorAll('.content-wrapper img[src="x"], #pl-plan img, #pl-tiroir img, #pl-bandeau img, #pl-suggestions img').length, texte: document.querySelector('.pl-tuile[data-id="3"] .pl-nom').textContent, bandeau: document.getElementById('pl-bandeau').textContent }));
  verifier(xss.imgs === 0 && xss.texte === '<img src=x onerror=alert(1)>' && /<img src=x onerror=alert\(2\)> piégée/.test(xss.bandeau) && dialogues.length === 0, 'noms piégés (XSS) : affichés comme du texte dans la tuile, le tiroir et le bandeau, aucun script exécuté');
  await a.fill('#pl-recherche', '<img'); await attendre(500);
  verifier((await a.$$('#pl-suggestions img')).length === 0 && dialogues.length === 0, 'suggestions piégées : aucun élément HTML injecté');
  await a.keyboard.press('Escape'); await a.keyboard.press('Escape');
  sql("UPDATE emplacements SET nom = 'Cube 12 — Marc' WHERE code_barres = 'EMP-000003'");
  sql("UPDATE pieces SET nom = 'Gicleur Delavan 0.75 gph 80° B' WHERE code = 'P-0003'");
  await a.goto(L.BASE + '/index.php?page=journal'); await a.waitForLoadState('networkidle');
  await a.waitForSelector('#table-journal tbody tr');
  const jtxt = norm(await a.textContent('#table-journal'));
  verifier(/Plan de l'entrepôt modifié/.test(jtxt), 'le Journal affiche l\'enregistrement du plan en français : « Plan de l\'entrepôt modifié »');
  const erreursAll = [].concat(a.erreurs, e.erreurs, g.erreurs, h.erreurs, t.erreurs, tel2.erreurs).filter(x => !/Failed to load resource: (net::ERR_|the server responded with a status of 40[0-9])|requestfailed: .*(plan_version|plan_save)\.php/.test(x));
  verifier(erreursAll.length === 0, 'aucune erreur JavaScript ni requête échouée (hors les refus et la coupure réseau provoqués exprès) : ' + JSON.stringify(erreursAll));
  verifier(violationsCsp.length === 0, 'aucune violation de la politique de sécurité (CSP) : ' + JSON.stringify(violationsCsp));
  let nouveau = ''; try { nouveau = fs.readFileSync(JOURNAL, 'utf8').slice(tailleJournal); } catch (x) { nouveau = ''; }
  const fautes = nouveau.split('\n').filter(l => /(PHP )?(Warning|Notice|Fatal|Deprecated|Parse error)|Uncaught|SQLSTATE/i.test(l));
  verifier(fautes.length === 0, 'journal PHP propre : ' + fautes.slice(0, 3).join(' // '));
  verifier(sql('SELECT COUNT(*) FROM stock s WHERE s.quantite <> COALESCE((SELECT SUM(m.quantite) FROM mouvements m WHERE m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id), 0)') === '0', 'invariant : stock = somme des mouvements après tous ces mouvements');

  await b.close();
  reset();
  process.exit(L.bilan());
})().catch(e => { console.error(e); try { reset(); } catch (x) { /* rien */ } process.exit(1); });
