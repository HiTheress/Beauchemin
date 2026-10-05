// Test de bout en bout du module C — Factures internes au coût, bilan mensuel, valeur de l'inventaire.
//   cd gestion && NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8104 DB_NAME=bea_c node tests/e2e/c.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME) puis crée ses propres données :
// il suppose donc un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_c). Il crée aussi les comptes
// « gest_bea » (gestionnaire de l'entreprise 1 seulement) et « gest_tiers » (gestionnaire d'une 3e entreprise) pour vérifier le
// cloisonnement. Les montants attendus sont recalculés par des requêtes SQL indépendantes du service d'inventaire.
const { execFileSync } = require('child_process');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_c';
const RACINE = path.resolve(__dirname, '..', '..');
const XSS1 = '<img src=x onerror=alert(1)>';     // nom de pièce
const XSS2 = '<img src=x onerror=alert(2)>';     // note de facture
const XSS3 = '<img src=x onerror=alert(3)>';     // motif d'annulation
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const dialogues = [];
function suivre(page) {
  page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); });
  return page;
}
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (validation, refus d'accès) sont ignorés. */
// (et les requêtes de lecture abandonnées parce que le test change de page avant leur fin : ERR_ABORTED)
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/requestfailed: \S+\/(factures_internes_data|factures_internes_totaux|valeur_detail|facture_apercu|emplacements_liste|scan_code|pieces_recherche)\.php/.test(e));
const attendre = ms => new Promise(r => setTimeout(r, ms));

// ---- outils : SQL indépendant, PHP, formats -------------------------------------------------------------------
function sql(q) { return execFileSync('mysql', ['-uroot', '-N', '-B', '--default-character-set=utf8mb4', DB, '-e', q], { encoding: 'utf8' }).trim(); }
function lignesSql(q) { const s = sql(q); return s === '' ? [] : s.split('\n').map(l => l.split('\t')); }
function outil(...args) { return execFileSync('php', [path.join(__dirname, 'c-outils.php'), ...args], { encoding: 'utf8', env: { ...process.env, DB_NAME: DB } }).trim(); }
function php(code) { return execFileSync('php', ['-r', 'date_default_timezone_set("America/Toronto"); ' + code], { encoding: 'utf8' }).trim(); }
const norm = t => String(t).replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
/** "1234.5" -> "1 234,50 $" */
const fr = s => { const [e, f = ''] = String(s).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + (f + '00').slice(0, 2) + ' $'; };
const tx = async (p, sel) => norm(await p.textContent(sel));
const num = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));

const AUJ = php('echo date("Y-m-d");');
const PREC = php('echo date("Y-m-d", strtotime("first day of last month"));');       // date rétroactive : 1er jour du mois précédent
const DEMAIN = php('echo date("Y-m-d", strtotime("+1 day"));');
const [A_NOW, M_NOW] = [parseInt(AUJ.slice(0, 4), 10), parseInt(AUJ.slice(5, 7), 10)];
const [A_PREC, M_PREC] = [parseInt(PREC.slice(0, 4), 10), parseInt(PREC.slice(5, 7), 10)];
const finMois = (a, m) => php('echo date("Y-m-t", strtotime("' + a + '-' + String(m).padStart(2, '0') + '-01"));');

/** Compte connecté dans une page (les 3 comptes de démo + ceux que le test crée). */
async function connecterCompte(page, nom) {
  await page.goto(L.BASE + '/login.php');
  await page.fill('input[name=username]', nom);
  await page.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  if (/login\.php/.test(page.url())) throw new Error('Connexion refusée pour ' + nom);
}
async function nouvelleSession(b, nom, viewport) {
  const p = suivre(await L.nouvellePage(b, viewport));
  await connecterCompte(p, nom);
  return p;
}

/** Appel HTTP depuis la page (cookie de session + jeton CSRF de la page) : {status, json, texte}. */
async function api(p, url, body, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, body, opts]) => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const entetes = { 'Accept': 'application/json' };
    const init = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: entetes };
    if (body !== undefined) {
      entetes['Content-Type'] = 'application/json';
      if (!opts.sansJeton && meta) { entetes['X-CSRF-Token'] = meta.content; }
      init.body = JSON.stringify(body);
    }
    const r = await fetch(url, init);
    const texte = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await r.arrayBuffer());   // conserve le BOM UTF-8 pour le vérifier
    let json = null; try { json = JSON.parse(texte); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json, texte, type: r.headers.get('content-type') || '', disposition: r.headers.get('content-disposition') || '' };
  }, [url, body, opts]);
}

const idDoc = numero => sql("SELECT id FROM documents WHERE numero = '" + numero + "'");
const nbFactures = () => parseInt(sql("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne'"), 10);
const stockQte = (piece, emp) => sql('SELECT COALESCE((SELECT quantite FROM stock WHERE piece_id = ' + piece + ' AND emplacement_id = ' + emp + '), 0)');

// ---- parcours de saisie d'une facture ------------------------------------------------------------------------------
async function ouvrirFacture(p, suite) {
  await L.aller(p, 'facture_interne' + (suite || ''));
  await p.waitForFunction(() => { const s = document.querySelector('#emplacement'); return s && !s.disabled && s.options.length > 1; });
}
/** Choisit source, entreprise destinataire et destination à la souris (les listes se chargent en cascade). */
async function choisirTrajet(p, src, ent, dest) {
  await p.selectOption('#emplacement', String(src));
  await p.waitForFunction(() => !document.querySelector('#entreprise-dest').disabled);
  if ((await p.$eval('#entreprise-dest', e => e.value)) !== String(ent)) { await p.selectOption('#entreprise-dest', String(ent)); }
  await p.waitForFunction(([e, d]) => document.querySelector('#entreprise-dest').value === e && !document.querySelector('#destination').disabled && !!document.querySelector('#destination option[value="' + d + '"]'), [String(ent), String(dest)]);
  await p.selectOption('#destination', String(dest));
}
async function ligne(p, code) { return p.$('#lignes tbody tr:has(td.code:text-is("' + code + '"))'); }
async function ajouterAuScan(p, code, qte) {
  await L.scanner(p, '#scan', code);
  await p.waitForSelector('#lignes tbody tr:has(td.code:text-is("' + code + '"))');
  if (qte !== undefined) { await p.fill('#lignes tbody tr:has(td.code:text-is("' + code + '")) input', String(qte)); }
}
async function attendreApercu(p) {
  await p.waitForFunction(() => document.querySelectorAll('#lignes td.ie-attente').length === 0 && document.querySelector('#ie-total').textContent.trim() !== '', null, { timeout: 8000 });
}
async function enregistrer(p) {
  await attendreApercu(p);
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => { const s = document.querySelector('#ie-succes'), e = document.querySelector('#ie-erreur'); return (s && !s.hidden) || (e && !e.hidden); }, null, { timeout: 8000 });
}
const succes = async p => (await p.$eval('#ie-succes', e => e.hidden)) ? null : tx(p, '#ie-succes');
const erreur = async p => (await p.$eval('#ie-erreur', e => e.hidden)) ? null : tx(p, '#ie-erreur');
const numeroDe = t => (/FIN-\d{4}-\d{5}/.exec(t) || [null])[0];

async function lignesListe(p, n) {
  await p.waitForFunction(k => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length === k, n, { timeout: 8000 });
}
/** Attend qu'une seule ligne soit affichée et qu'elle contienne $texte (évite de lire l'état précédent du tableau). */
async function uneLigne(p, texte) {
  await p.waitForFunction(n => { const r = document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)'); return r.length === 1 && r[0].textContent.includes(n); }, texte, { timeout: 8000 });
}
async function texteLignesListe(p) { return p.$$eval('#table-factures tbody tr', r => r.map(x => x.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim())); }

// ======================================================================================================================
(async () => {
  execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' });
  const b = await L.lancer();
  const p = suivre(await L.nouvellePage(b));
  await L.connecter(p, 'gestionnaire');

  // ==== 1. Pages de base et données de démonstration =========================================================================
  console.log('1. Pages et liste');
  for (const route of ['factures_internes', 'facture_interne', 'bilan_mensuel', 'valeur_inventaire']) {
    await L.aller(p, route);
    L.verifier(!(await tx(p, '.content-wrapper')).includes('pas la permission') && (await p.$$('.content-wrapper h1')).length === 1, 'page ' + route + ' chargée sans refus');
  }
  await L.aller(p, 'factures_internes');
  await lignesListe(p, 2);
  let t = await texteLignesListe(p);
  L.verifier(t.some(x => x.includes('FIN-2026-00001') && x.includes('Beauchemin') && x.includes('Boutique Chaleur') && x.includes('182,10 $')), 'FIN-2026-00001 listée avec parties et total : ' + t[1]);
  L.verifier(t.some(x => x.includes('FIN-2026-00002') && x.includes('161,10 $')), 'FIN-2026-00002 listée');
  await p.waitForFunction(() => /2 factures valides/.test(document.querySelector('#ie-totaux').textContent));
  L.verifier((await tx(p, '#ie-totaux')).includes('343,20 $'), 'totaux du filtre : 343,20 $ : ' + await tx(p, '#ie-totaux'));
  L.verifier(await p.$eval('#f-annee', e => e.value) === String(A_NOW), 'année courante présélectionnée');

  // ==== 2. Facture au scanner, stock exact, double clic ========================================================================
  console.log('2. Facture avec stock exact (scanner + double clic)');
  await ouvrirFacture(p);
  const dispo13 = sql('SELECT quantite FROM stock WHERE piece_id = 13 AND emplacement_id = 1').replace(/\.?0+$/, '');
  const dest13Avant = parseFloat(stockQte(13, 5));
  const nb0 = nbFactures();
  await L.scanner(p, '#scan', 'EMP-000001');
  await p.waitForFunction(() => document.querySelector('#emplacement').value === '1');
  L.verifier((await p.$$eval('#entreprise-dest option', o => o.map(x => x.value))).indexOf('1') === -1, 'l\'entreprise de la source n\'est pas proposée comme destinataire');
  L.verifier(await p.$eval('#entreprise-dest', e => e.value) === '2', 'la seule autre entreprise est choisie d\'office');
  await p.waitForFunction(() => !!document.querySelector('#destination option[value="5"]'));
  await L.scanner(p, '#scan', 'EMP-000005');                                       // un code de l'autre entreprise = la destination
  await p.waitForFunction(() => document.querySelector('#destination').value === '5');
  L.verifier(await p.$eval('#emplacement', e => e.value) === '1', 'la source reste l\'entrepôt de Beauchemin');
  await L.scanner(p, '#scan', 'P-0013');
  await p.waitForSelector('#lignes tbody tr');
  await p.fill('#lignes tbody tr input', dispo13);
  await attendreApercu(p);
  L.verifier(norm(await p.textContent('#lignes tbody tr td:nth-child(3)')) === dispo13, 'colonne « Disponible » : ' + dispo13);
  await p.press('#lignes tbody tr input', 'Enter');
  L.verifier(await p.evaluate(() => document.activeElement.id) === 'scan', 'Entrée dans la quantité : retour au champ de scan');
  L.verifier(norm(await p.textContent('#lignes td.ie-cout')) === '12,50 $', 'coût unitaire (au coût) en lecture seule : 12,50 $');
  L.verifier((await p.$$('#lignes td.ie-cout input')).length === 0, 'le coût n\'est pas un champ de saisie');
  L.verifier((await tx(p, '#ie-total')).includes(fr(10 * 12.5)), 'total général : ' + await tx(p, '#ie-total'));
  L.verifier((await tx(p, '#lignes thead')).includes('Coût unitaire (au coût)') && (await tx(p, '#lignes thead')).includes('Disponible'), 'colonnes « Disponible » et « Coût unitaire (au coût) »');
  L.verifier(await p.$eval('#ie-avert', e => e.hidden), 'aucun avertissement quand le stock est exact');
  await p.dblclick('#btn-enregistrer');
  await p.waitForFunction(() => !document.querySelector('#ie-succes').hidden);
  await attendre(400);
  const msg1 = await succes(p);
  const num1 = numeroDe(msg1);
  L.verifier(!!num1 && msg1.includes('enregistrée') && msg1.includes('125,00 $'), 'message de succès avec numéro FIN et total : ' + msg1);
  L.verifier((await p.getAttribute('#ie-succes a', 'href')).includes('page=facture_interne_voir&id=' + idDoc(num1)), 'lien vers facture_interne_voir');
  L.verifier(nbFactures() === nb0 + 1, 'un double clic ne crée qu\'une facture');
  L.verifier(parseFloat(stockQte(13, 1)) === 0 && parseFloat(stockQte(13, 5)) === dest13Avant + parseFloat(dispo13), 'stock : source vidée, destination augmentée');
  L.verifier(sql("SELECT total FROM documents WHERE numero = '" + num1 + "'") === '125.00', 'total enregistré 125.00');
  L.verifier((await p.$$('#lignes tbody tr')).length === 0 && await p.$eval('#emplacement', e => e.value) === '1' && await p.$eval('#note', e => e.value) === '', 'formulaire remis à zéro (lignes, note), emplacements conservés');
  L.verifier(await p.evaluate(() => document.activeElement && document.activeElement.id) === 'scan', 'curseur de retour dans le champ de scan');

  // ==== 3. Stock insuffisant ====================================================================================================
  console.log('3. Facture refusée : stock insuffisant');
  await ajouterAuScan(p, 'P-0013', 1);
  await attendreApercu(p);
  L.verifier((await tx(p, '#ie-avert')).includes('Stock insuffisant') && (await tx(p, '#ie-avert')).includes('disponible 0, demandé 1'), 'avertissement de stock insuffisant avant l\'envoi : ' + await tx(p, '#ie-avert'));
  const nb1 = nbFactures();
  await enregistrer(p);
  const e3 = await erreur(p);
  L.verifier(e3 && e3.includes('Stock insuffisant pour « P-0013 — Coude de cheminée 6 po » à « Entrepôt principal » : disponible 0, demandé 1'), 'message du service affiché : ' + e3);
  L.verifier(nbFactures() === nb1, 'aucune facture créée');
  L.verifier(parseFloat(stockQte(13, 1)) === 0, 'stock inchangé');
  await p.click('#lignes tbody tr button');
  await p.waitForFunction(() => document.querySelector('#ie-total').textContent.trim() === '');
  L.verifier((await p.$$('#lignes tbody tr')).length === 0 && await p.$eval('#ie-avert', e => e.hidden), 'ligne retirée : avertissement et total effacés');

  // ==== 4. Entreprise source = destination ===================================================================================
  console.log('4. Même entreprise / entrées invalides');
  let r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 1, emplacement_dest_id: 3, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /entre deux entreprises différentes/.test(r.json.erreur) && /la même entreprise/.test(r.json.erreur), 'même entreprise refusée (français correct) : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, date: DEMAIN, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /dans le futur/.test(r.json.erreur), 'date future refusée : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [] });
  L.verifier(r.status === 400 && /au moins une pièce/.test(r.json.erreur), 'aucune ligne refusée : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 1, quantite: '0' }] });
  L.verifier(r.status === 400 && /supérieure à zéro/.test(r.json.erreur), 'quantité zéro refusée : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, note: 'x'.repeat(2001), lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /2000 caractères/.test(r.json.erreur), 'note trop longue refusée : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 999, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'emplacement source inconnu : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /entreprise destinataire/.test(r.json.erreur), 'entreprise destinataire manquante : ' + r.texte);
  L.verifier(nbFactures() === nb1, 'aucune de ces tentatives n\'a créé de facture');
  const ap = await api(p, 'app/ajax/facture_apercu.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '2' }, { piece_id: 1, quantite: '1,5' }, { piece_id: 2, quantite: 'abc' }, { piece_id: 99999, quantite: '1' }] });
  L.verifier(ap.status === 200 && ap.json.lignes.length === 3 && ap.json.lignes[0].quantite === '3.500' && ap.json.lignes[0].total_ligne === '50.75' && ap.json.total === '50.75', 'aperçu : lignes d\'une même pièce additionnées, total exact : ' + ap.texte.slice(0, 200));
  L.verifier(ap.json.lignes[1].erreur === 'Quantité invalide.' && ap.json.lignes[2].erreur === 'Pièce introuvable.' && ap.json.nb_erreurs === 2, 'aperçu : erreurs par ligne sans planter');
  const avantApercu = sql('SELECT (SELECT COUNT(*) FROM documents) + (SELECT COUNT(*) FROM mouvements) + (SELECT SUM(quantite) FROM stock)');
  await api(p, 'app/ajax/facture_apercu.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '2' }] });
  L.verifier(sql('SELECT (SELECT COUNT(*) FROM documents) + (SELECT COUNT(*) FROM mouvements) + (SELECT SUM(quantite) FROM stock)') === avantApercu, 'l\'aperçu ne modifie rien');
  // idempotence : le même jeton ne crée qu'une facture
  const jeton = 'jeton-' + Date.now();
  const nbJ = nbFactures();
  const j1 = await api(p, 'app/action/facture_save.php', { jeton, emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 5, quantite: '1' }] });
  const j2 = await api(p, 'app/action/facture_save.php', { jeton, emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 5, quantite: '1' }] });
  L.verifier(j1.status === 200 && j2.status === 200 && j2.json.doublon === true && j1.json.numero === j2.json.numero && nbFactures() === nbJ + 1, 'même jeton : une seule facture (doublon signalé)');
  // l'interface : destination absente / date future / quantité invalide
  await ouvrirFacture(p);
  await p.selectOption('#emplacement', '1');
  await p.waitForFunction(() => !document.querySelector('#entreprise-dest').disabled);
  await ajouterAuScan(p, 'P-0001', 1);
  await p.selectOption('#destination', '');
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => !document.querySelector('#ie-erreur').hidden);
  L.verifier((await erreur(p)).includes('Choisissez l\'emplacement de destination'), 'destination obligatoire : ' + await erreur(p));
  L.verifier(await p.$eval('#destination', e => e.classList.contains('is-invalid')), 'champ fautif marqué');
  await choisirTrajet(p, 1, 2, 5);
  await p.fill('#date', DEMAIN);
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => !document.querySelector('#ie-erreur').hidden);
  L.verifier((await erreur(p)).includes('dans le futur'), 'date future refusée à l\'écran : ' + await erreur(p));
  await p.fill('#date', AUJ);
  await p.fill('#lignes tbody tr input', '0');
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => /supérieure à zéro/.test(document.querySelector('#ie-erreur').textContent));
  L.verifier(nbFactures() === nbJ + 1, 'rien d\'enregistré après ces refus');

  // ==== 5. Pièce sans coût connu + XSS ===========================================================================================
  console.log('5. Pièce sans coût connu (et nom de pièce piégé)');
  const idPiege = outil('piece', 'P-0099', XSS1, '1', '5');
  await ouvrirFacture(p);
  await choisirTrajet(p, 1, 2, 5);
  await p.fill('#note', XSS2);
  await p.click('.ie-carte .select2-selection');                      // recherche par nom : la liste déroulante contient le nom piégé
  await p.waitForSelector('.select2-search__field');
  await p.fill('.select2-search__field', 'P-0099');
  await p.waitForSelector('.select2-results__option:has-text("P-0099")');
  L.verifier((await p.$$('.select2-results img')).length === 0 && (await tx(p, '.select2-results')).includes('<img src=x onerror=alert(1)>'), 'liste déroulante : le nom piégé est du texte');
  await p.click('.select2-results__option:has-text("P-0099")');
  await p.waitForSelector('#lignes tbody tr');
  await attendreApercu(p);
  L.verifier(await p.$eval('#lignes tbody tr', e => e.textContent.includes('<img src=x onerror=alert(1)>')), 'le nom piégé est affiché comme du texte');
  L.verifier((await p.$$('#lignes img, .ie-carte img')).length === 0, 'aucune balise <img> injectée dans les lignes');
  L.verifier((await tx(p, '#lignes tbody tr .ie-cout')).includes('Sans coût'), 'ligne marquée « Sans coût »');
  const av = await tx(p, '#ie-avert');
  L.verifier(av.includes('Coût inconnu') && av.includes('« P-0099 »') && av.includes('aucun coût connu') && av.includes('Facturer les pièces sans coût à 0 $'), 'avertissement clair sur le coût inconnu : ' + av);
  L.verifier(!(await p.$eval('#ie-zero-bloc', e => e.hidden)), 'case « Facturer les pièces sans coût à 0 $ » proposée');
  L.verifier((await tx(p, '#ie-total')).includes('0,00 $') && (await tx(p, '#ie-total')).includes('sans coût'), 'total à 0,00 $ avec mention : ' + await tx(p, '#ie-total'));
  const nb2 = nbFactures();
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => !document.querySelector('#ie-erreur').hidden);
  const e5 = await erreur(p);
  L.verifier(e5.includes('aucun coût connu') && e5.includes('Cochez « Facturer les pièces sans coût à 0 $ »'), 'envoi bloqué tant que la case n\'est pas cochée : ' + e5);
  L.verifier(nbFactures() === nb2, 'aucune facture créée');
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: parseInt(idPiege, 10), quantite: '1' }] });
  L.verifier(r.status === 400 && /aucun coût connu/.test(r.json.erreur), 'le serveur refuse aussi (sans la case) : ' + r.texte);
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, permettre_cout_zero: 'false', lignes: [{ piece_id: parseInt(idPiege, 10), quantite: '1' }] });
  L.verifier(r.status === 400 && /aucun coût connu/.test(r.json.erreur) && nbFactures() === nb2, '« false » (texte) n\'autorise pas le coût à zéro');
  await p.evaluate(() => document.querySelector('#ie-zero-bloc').scrollIntoView({ block: 'center' }));   // hors de la barre d'enregistrement collante
  await p.click('label[for="cout-zero"]');
  L.verifier(await p.$eval('#cout-zero', e => e.checked), 'case cochée');
  await p.click('#btn-enregistrer');
  await p.waitForFunction(() => !document.querySelector('#ie-succes').hidden);
  const num5 = numeroDe(await succes(p));
  L.verifier(!!num5 && (await succes(p)).includes('0,00 $') && nbFactures() === nb2 + 1, 'facture à 0 $ enregistrée avec la case cochée : ' + await succes(p));
  L.verifier(sql("SELECT l.cout_unitaire FROM document_lignes l JOIN documents d ON d.id = l.document_id WHERE d.numero = '" + num5 + "'") === '0.0000', 'coût enregistré 0');
  L.verifier(await p.$eval('#cout-zero', e => e.checked) === false && await p.$eval('#ie-zero-bloc', e => e.hidden), 'case décochée et masquée après l\'envoi');
  const id5 = idDoc(num5);
  await L.aller(p, 'facture_interne_voir&id=' + id5);
  L.verifier(dialogues.length === 0 && (await p.$$('#facture img')).length === 0, 'aucun script exécuté, aucune balise injectée sur la facture');
  L.verifier((await tx(p, '#facture')).includes('<img src=x onerror=alert(2)>') && (await tx(p, '#facture')).includes('<img src=x onerror=alert(1)>'), 'note et nom de pièce affichés en texte sur la facture');

  // ==== 6. Factures du mois précédent (date rétroactive) et sens inverse ======================================================
  console.log('6. Factures rétroactives, sens inverse');
  await ouvrirFacture(p);
  await choisirTrajet(p, 1, 2, 5);
  await p.fill('#date', PREC);
  await L.scanner(p, '#scan', '012345678905');                                      // alias de P-0001
  await p.waitForSelector('#lignes tbody tr');
  await p.fill('#lignes tbody tr input', '2');
  await enregistrer(p);
  const numA = numeroDe(await succes(p));
  L.verifier(!!numA && (await succes(p)).includes('29,00 $'), 'facture A (Beauchemin → Chaleur, mois précédent) : ' + await succes(p));
  // préremplissage par l'URL (contrat §10) et coût de l'entreprise ÉMETTRICE
  await ouvrirFacture(p, '&piece_id=9&emplacement_id=2');
  await p.waitForSelector('#lignes tbody tr:has(td.code:text-is("P-0009"))');
  await attendreApercu(p);
  L.verifier(await p.$eval('#emplacement', e => e.value) === '2' && await p.$eval('#lignes tbody tr input', e => e.value) === '1', 'préremplissage : source (&emplacement_id=2) et pièce (&piece_id=9, quantité 1)');
  L.verifier(norm(await p.textContent('#lignes td.ie-cout')) === '53,40 $', 'coût de Chaleur (émettrice) : 53,40 $');
  await p.selectOption('#emplacement', '1');
  await attendreApercu(p);
  L.verifier(norm(await p.textContent('#lignes td.ie-cout')) === '52,9714 $', 'changer de source change le coût : celui de Beauchemin, 4 décimales : ' + norm(await p.textContent('#lignes td.ie-cout')));
  await ouvrirFacture(p, '&piece_id=999999');
  L.verifier((await tx(p, '.content-wrapper .alert-warning:not([hidden])')).includes('La pièce demandée n\'existe pas.') && (await p.$$('#lignes tbody tr')).length === 0, 'préremplissage : pièce inconnue = avertissement');
  sql('UPDATE pieces SET actif = 0 WHERE id = 14');
  await ouvrirFacture(p, '&piece_id=14');
  L.verifier((await tx(p, '.content-wrapper .alert-warning:not([hidden])')).includes('désactivée') && (await p.$$('#lignes tbody tr')).length === 0, 'préremplissage : pièce désactivée = avertissement');
  sql('UPDATE pieces SET actif = 1 WHERE id = 14');
  await ouvrirFacture(p, '&piece_id=abc&emplacement_id=zzz');
  L.verifier((await p.$$('.content-wrapper .alert-warning:not([hidden])')).length === 0, 'préremplissage : valeurs invalides ignorées');
  await ouvrirFacture(p);
  await choisirTrajet(p, 2, 1, 3);                                                   // sens inverse : Chaleur → cube de Beauchemin
  await p.fill('#date', PREC);
  // recherche par nom (Select2) plutôt qu'au scanner
  await p.click('.ie-carte .select2-selection');
  await p.waitForSelector('.select2-search__field');
  await p.fill('.select2-search__field', 'propane');
  await p.waitForSelector('.select2-results__option:has-text("P-0009")');
  await p.click('.select2-results__option:has-text("P-0009")');
  await p.waitForSelector('#lignes tbody tr');
  await enregistrer(p);
  const numB = numeroDe(await succes(p));
  L.verifier(!!numB && (await succes(p)).includes('53,40 $'), 'facture B (Chaleur → Beauchemin, mois précédent, sens inverse) : ' + await succes(p));
  L.verifier(sql("SELECT date_document FROM documents WHERE numero = '" + numA + "'") === PREC && sql("SELECT date_document FROM documents WHERE numero = '" + numB + "'") === PREC, 'dates rétroactives enregistrées');

  // ==== 7. Bilan mensuel ===========================================================================================================
  console.log('7. Bilan mensuel');
  const ym = (a, m) => a + '-' + String(m).padStart(2, '0');
  async function verifierBilan(annee, mois) {
    const d1 = ym(annee, mois) + '-01', d2 = finMois(annee, mois);
    const sommeDocs = (de, vers) => sql("SELECT COALESCE(SUM(total), 0) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND entreprise_id = " + de + ' AND entreprise_dest_id = ' + vers + " AND date_document BETWEEN '" + d1 + "' AND '" + d2 + "'");
    const sommeLignes = (de, vers) => sql("SELECT COALESCE(SUM(l.total_ligne), 0) FROM document_lignes l JOIN documents d ON d.id = l.document_id WHERE d.type = 'facture_interne' AND d.statut = 'valide' AND d.entreprise_id = " + de + ' AND d.entreprise_dest_id = ' + vers + " AND d.date_document BETWEEN '" + d1 + "' AND '" + d2 + "'");
    const ab = sommeDocs(1, 2), ba = sommeDocs(2, 1);
    L.verifier(ab === sommeLignes(1, 2) && ba === sommeLignes(2, 1), 'SQL : total des documents = somme des lignes (' + ab + ' / ' + ba + ')');
    await L.aller(p, 'bilan_mensuel&annee=' + annee + '&mois=' + mois);
    const periode = MOIS[mois - 1] + ' ' + annee;
    L.verifier((await tx(p, '.ie-bilan-titre')).includes(periode), 'titre : ' + periode);
    L.verifier(norm(await p.textContent('#sens-ab .ie-total-sens-montant')) === fr(ab), 'total Beauchemin → Chaleur = ' + fr(ab) + ' : ' + norm(await p.textContent('#sens-ab .ie-total-sens-montant')));
    L.verifier(norm(await p.textContent('#sens-ba .ie-total-sens-montant')) === fr(ba), 'total Chaleur → Beauchemin = ' + fr(ba));
    const net = Math.round((parseFloat(ab) - parseFloat(ba)) * 100) / 100;
    const solde = await tx(p, '#solde');
    if (net > 0) { L.verifier(solde === 'Boutique Chaleur doit ' + fr(net.toFixed(2)) + ' à Beauchemin pour ' + periode, 'solde en grand : ' + solde); }
    else if (net < 0) { L.verifier(solde === 'Beauchemin doit ' + fr((-net).toFixed(2)) + ' à Boutique Chaleur pour ' + periode, 'solde en grand : ' + solde); }
    else { L.verifier(solde.startsWith('Aucun solde pour ' + periode), 'aucun solde : ' + solde); }
    // pièces regroupées : quantité et total par pièce = agrégat SQL indépendant
    for (const [de, vers, id] of [[1, 2, '#sens-ab'], [2, 1, '#sens-ba']]) {
      const attendu = lignesSql("SELECT p.code, SUM(l.quantite), SUM(l.total_ligne) FROM document_lignes l JOIN documents d ON d.id = l.document_id JOIN pieces p ON p.id = l.piece_id WHERE d.type = 'facture_interne' AND d.statut = 'valide' AND d.entreprise_id = " + de + ' AND d.entreprise_dest_id = ' + vers + " AND d.date_document BETWEEN '" + d1 + "' AND '" + d2 + "' GROUP BY p.code ORDER BY p.code");
      const affiche = await p.$$eval(id + ' .ie-bilan-pieces tbody tr', rows => rows.map(r => [...r.cells].map(c => c.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim())));
      L.verifier(attendu.length === affiche.length, id + ' : ' + attendu.length + ' pièces regroupées (affichées : ' + affiche.length + ')');
      attendu.forEach((a, i) => {
        const ok = affiche[i] && affiche[i][0] === a[0] && num(affiche[i][2]) === parseFloat(a[1]) && affiche[i][4] === fr(a[2]);
        L.verifier(ok, id + ' ' + a[0] + ' : quantité ' + a[1] + ', total ' + a[2] + ' (affiché : ' + JSON.stringify(affiche[i]) + ')');
        if (ok && parseFloat(a[1]) > 0) {
          const cm = Math.round(parseFloat(a[2]) / parseFloat(a[1]) * 100) / 100;
          L.verifier(Math.abs(num(affiche[i][3]) - cm) <= 0.01, id + ' ' + a[0] + ' : coût moyen pondéré ≈ ' + cm + ' (affiché ' + affiche[i][3] + ')');
        }
      });
      const nbDocs = parseInt(sql("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND entreprise_id = " + de + ' AND entreprise_dest_id = ' + vers + " AND date_document BETWEEN '" + d1 + "' AND '" + d2 + "'"), 10);
      L.verifier((await p.$$(id + ' .ie-bilan-factures tbody tr')).length === nbDocs, id + ' : ' + nbDocs + ' factures listées');
    }
    return { ab, ba, net };
  }
  const bPrec = await verifierBilan(A_PREC, M_PREC);
  L.verifier(bPrec.ab === '29.00' && bPrec.ba === '53.40', 'mois précédent : 29,00 $ de Beauchemin, 53,40 $ de Chaleur');
  L.verifier((await tx(p, '#solde')) === 'Beauchemin doit 24,40 $ à Boutique Chaleur pour ' + MOIS[M_PREC - 1] + ' ' + A_PREC, 'sens inverse : c\'est Beauchemin qui doit 24,40 $ : ' + await tx(p, '#solde'));
  L.verifier(!!(await p.$('#sens-ab a[href*="facture_interne_voir"]')), 'les numéros de factures du bilan sont des liens');
  L.verifier(!!(await p.$('#lien-annulees-aucune')), 'aucune facture annulée ce mois-ci : mention neutre');
  await verifierBilan(A_NOW, M_NOW);
  L.verifier(await p.$('#b-suiv') === null && !!(await p.$('#b-suiv-off')), 'pas de « mois suivant » au-delà du mois courant');
  await Promise.all([p.waitForNavigation(), p.click('#b-prec')]);
  await p.waitForLoadState('networkidle');
  L.verifier((await tx(p, '.ie-bilan-titre')).includes(MOIS[M_PREC - 1] + ' ' + A_PREC), 'navigation « mois précédent »');
  await Promise.all([p.waitForNavigation(), p.click('#b-suiv')]);
  await p.waitForLoadState('networkidle');
  L.verifier((await tx(p, '.ie-bilan-titre')).includes(MOIS[M_NOW - 1] + ' ' + A_NOW), 'navigation « mois suivant »');
  await Promise.all([p.waitForNavigation(), p.selectOption('#b-mois', String(M_PREC))]);
  await p.waitForLoadState('networkidle');
  L.verifier((await tx(p, '.ie-bilan-titre')).includes(MOIS[M_PREC - 1]) && p.url().includes('mois=' + M_PREC), 'changer le mois dans la liste recharge le bilan');
  L.verifier((await p.$$('#b-a')).length === 0, 'deux entreprises seulement : paire fixe (aucun sélecteur)');
  // mois sans facture
  await L.aller(p, 'bilan_mensuel&annee=2020&mois=3');
  L.verifier((await tx(p, '#solde')).startsWith('Aucun solde pour mars 2020') && (await tx(p, '#solde')).includes('Aucune facture interne valide'), 'mois vide : « Aucun solde » : ' + await tx(p, '#solde'));
  L.verifier((await tx(p, '#sens-ab')).includes('Aucune facture dans ce sens'), 'mois vide : message utile');
  await L.aller(p, 'bilan_mensuel&annee=abc&mois=99');
  L.verifier((await tx(p, '.ie-bilan-titre')).includes(MOIS[M_NOW - 1] + ' ' + A_NOW), 'période invalide : retour au mois courant');

  // ==== 8. Annulation, puis refus d'annulation ==================================================================================
  console.log('8. Annulation et refus d\'annulation');
  const idA = idDoc(numA);
  const stockP1Avant = parseFloat(stockQte(1, 1));
  await L.aller(p, 'facture_interne_voir&id=' + idA);
  await p.click('#btn-annuler');
  await p.waitForSelector('#modal-annuler.show');
  await p.click('#annuler-confirmer');
  L.verifier((await tx(p, '#annuler-erreur')).includes('Indiquez le motif') && sql("SELECT statut FROM documents WHERE id = " + idA) === 'valide', 'motif obligatoire (aucune annulation sans motif)');
  await p.fill('#annuler-motif', XSS3);
  await p.click('#annuler-confirmer');
  await p.waitForURL(u => /ok=annule/.test(u.href));
  await p.waitForLoadState('networkidle');
  L.verifier(sql("SELECT statut FROM documents WHERE id = " + idA) === 'annule', 'facture annulée en base');
  L.verifier(parseFloat(stockQte(1, 1)) === stockP1Avant + 2 && parseFloat(stockQte(1, 5)) === 0, 'stock revenu à la source et retiré de la destination');
  const banniere = await tx(p, '#bandeau-annule');
  L.verifier(banniere.includes('ANNULÉE') && banniere.includes('par') && banniere.includes('gestionnaire1') && /le \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(banniere) && banniere.includes('<img src=x onerror=alert(3)>'), 'bandeau ANNULÉE avec qui, quand et motif (en texte) : ' + banniere);
  L.verifier(!!(await p.$('.ie-filigrane')) && (await tx(p, '.ie-filigrane')) === 'ANNULÉE', 'filigrane ANNULÉE');
  L.verifier((await p.$('#btn-annuler')) === null && (await tx(p, '.alert-success')).includes('annulée'), 'plus de bouton « Annuler » ; confirmation affichée');
  L.verifier(dialogues.length === 0 && (await p.$$('#facture img')).length === 0, 'motif piégé : aucun script exécuté');
  await L.aller(p, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC);
  L.verifier((await tx(p, '#sens-ab .ie-total-sens-montant')) === '0,00 $' && (await tx(p, '#solde')) === 'Beauchemin doit 53,40 $ à Boutique Chaleur pour ' + MOIS[M_PREC - 1] + ' ' + A_PREC, 'le bilan n\'inclut plus la facture annulée : ' + await tx(p, '#solde'));
  L.verifier((await tx(p, '#lien-annulees')).startsWith('1 facture annulée ce mois-ci'), 'lien « factures annulées ce mois-ci » : ' + await tx(p, '#lien-annulees'));
  await Promise.all([p.waitForNavigation(), p.click('#lien-annulees')]);
  await p.waitForLoadState('networkidle');
  await lignesListe(p, 1);
  t = await texteLignesListe(p);
  L.verifier(t[0].includes(numA) && t[0].includes('ANNULÉE'), 'le lien ouvre la liste des factures annulées du mois : ' + t[0]);
  L.verifier(await p.$eval('#f-statut', e => e.value) === 'annule' && await p.$eval('#f-mois', e => e.value) === String(M_PREC), 'filtres préremplis par le lien');
  await p.waitForFunction(() => /1 annulée non comptée/.test(document.querySelector('#ie-totaux').textContent) || /Aucune facture/.test(document.querySelector('#ie-totaux').textContent));

  // refus : la marchandise a déjà été sortie de la destination
  const nbR = nbFactures();
  const rr = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 4, quantite: '2' }] });
  L.verifier(rr.status === 200 && nbFactures() === nbR + 1, 'facture C créée (P-0004 ×2, 218,00 $) : ' + rr.texte);
  outil('sortir', '5', '4', '2');
  await L.aller(p, 'facture_interne_voir&id=' + rr.json.id);
  await p.click('#btn-annuler');
  await p.waitForSelector('#modal-annuler.show');
  await p.fill('#annuler-motif', 'Erreur de saisie');
  await p.click('#annuler-confirmer');
  await p.waitForFunction(() => !document.querySelector('#annuler-erreur').hidden);
  const eAnn = await tx(p, '#annuler-erreur');
  L.verifier(eAnn === 'Stock insuffisant pour « P-0004 — Pompe à mazout Suntec A2VA » à « Boutique Centre-ville » : disponible 0, demandé 2.', 'refus d\'annulation : message du service tel quel : ' + eAnn);
  L.verifier(sql('SELECT statut FROM documents WHERE id = ' + rr.json.id) === 'valide' && !(await p.$eval('#annuler-confirmer', e => e.disabled)), 'la facture reste valide, le bouton est de nouveau actif');
  await p.keyboard.press('Escape');
  r = await api(p, 'app/action/facture_annuler.php', { id: idA, motif: 'encore' });
  L.verifier(r.status === 400 && /déjà annulé/.test(r.json.erreur), 'annuler deux fois : refusé : ' + r.texte);
  r = await api(p, 'app/action/facture_annuler.php', { id: parseInt(idDoc('TRF-2026-00001'), 10), motif: 'test' });
  L.verifier(r.status === 400 && /n'est pas une facture interne/.test(r.json.erreur), 'un transfert ne s\'annule pas ici : ' + r.texte);
  r = await api(p, 'app/action/facture_annuler.php', { id: rr.json.id, motif: '' });
  L.verifier(r.status === 400 && /motif/.test(r.json.erreur), 'motif vide refusé par le serveur');
  r = await api(p, 'app/action/facture_annuler.php', { id: 999999, motif: 'x' });
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'facture inconnue : ' + r.texte);
  // une facture d'un autre type est renvoyée vers document_voir
  await L.aller(p, 'facture_interne_voir&id=' + idDoc('TRF-2026-00001'));
  L.verifier(/page=document_voir&id=/.test(p.url()), 'un autre type de document est redirigé vers document_voir : ' + p.url());
  // la page d'une facture inexistante
  const rInconnu = await p.goto(L.BASE + '/index.php?page=facture_interne_voir&id=999999');
  L.verifier(rInconnu.status() === 404 && (await tx(p, '.content-wrapper')).includes('introuvable'), 'facture inexistante : message clair (404)');

  // ==== 9. Liste des factures : filtres et totaux ==================================================================================
  console.log('9. Liste : filtres, totaux, recherche');
  await L.aller(p, 'factures_internes');
  await p.selectOption('#f-annee', '');
  await p.waitForFunction(() => !!document.querySelector('#ie-totaux strong'));
  const toutes = parseInt(sql("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne'"), 10);
  await p.waitForFunction(n => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length === Math.min(25, n), toutes);
  async function totauxAttendus(where) {
    return { n: sql("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND " + where), s: sql("SELECT COALESCE(SUM(total), 0) FROM documents WHERE type = 'facture_interne' AND statut = 'valide' AND " + where) };
  }
  let att = await totauxAttendus('1 = 1');
  await p.waitForFunction(a => document.querySelector('#ie-totaux').textContent.replace(/[  ]/g, ' ').includes(a), fr(att.s));
  L.verifier((await tx(p, '#ie-totaux')).includes(att.n + ' factures valides') && (await tx(p, '#ie-totaux')).includes('annulée'), 'totaux, toutes années, hors annulées : ' + await tx(p, '#ie-totaux'));
  await p.selectOption('#f-annee', String(A_PREC));
  await p.selectOption('#f-mois', String(M_PREC));
  const dPrec = ym(A_PREC, M_PREC);
  att = await totauxAttendus("date_document BETWEEN '" + dPrec + "-01' AND '" + finMois(A_PREC, M_PREC) + "'");
  await p.waitForFunction(a => document.querySelector('#ie-totaux').textContent.replace(/[  ]/g, ' ').includes(a), fr(att.s));
  const nbPrecTotal = parseInt(sql("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne' AND date_document BETWEEN '" + dPrec + "-01' AND '" + finMois(A_PREC, M_PREC) + "'"), 10);
  await lignesListe(p, nbPrecTotal);
  t = await texteLignesListe(p);
  L.verifier(t.length === 2 && t.some(x => x.includes(numA) && x.includes('ANNULÉE')) && t.some(x => x.includes(numB) && x.includes('Valide')), 'filtre mois/année : les 2 factures rétroactives (une annulée) : ' + JSON.stringify(t));
  L.verifier((await tx(p, '#ie-totaux')).includes('1 facture valide') && (await tx(p, '#ie-totaux')).includes('53,40 $') && (await tx(p, '#ie-totaux')).includes('1 annulée non comptée'), 'ligne de totaux hors annulées : ' + await tx(p, '#ie-totaux'));
  await p.selectOption('#f-statut', 'valide');
  await lignesListe(p, 1);
  await p.selectOption('#f-statut', '');
  await p.selectOption('#f-sens', 'emises');                 // le gestionnaire a les deux entreprises : tout est « émis » par l'une d'elles
  await lignesListe(p, 2);
  await p.click('#f-effacer');
  await p.waitForFunction(n => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length === Math.min(25, n), toutes);
  L.verifier(await p.$eval('#f-annee', e => e.value) === '' && await p.$eval('#f-mois', e => e.value) === '', 'effacer les filtres');
  await p.fill('#f-recherche', numB);
  await uneLigne(p, numB);
  t = await texteLignesListe(p);
  L.verifier(t.length === 1 && t[0].includes(numB), 'recherche par numéro');
  await p.fill('#f-recherche', 'Erreur inconnue zzz');
  await p.waitForSelector('#table-factures .dataTables_empty');
  L.verifier((await tx(p, '#table-factures .dataTables_empty')).includes('Aucune facture interne pour ces filtres'), 'liste vide : message utile');
  await p.fill('#f-recherche', XSS2.slice(0, 12));          // « <img src=x o » : cherché dans la note
  await attendre(700);
  await p.fill('#f-recherche', 'Centre-ville');              // nom d'emplacement
  await p.waitForFunction(() => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length > 2);
  await p.fill('#f-recherche', numB);
  await uneLigne(p, numB);
  await p.click('#table-factures tbody tr td:nth-child(3)');   // clic sur la ligne : ouvre la facture
  await p.waitForURL(u => /facture_interne_voir/.test(u.href));
  L.verifier((await tx(p, '.ie-titre')) === 'FACTURE INTERNE' && (await tx(p, '.ie-meta')).includes(numB), 'un clic sur la ligne ouvre la facture : ' + p.url() + ' | ' + await tx(p, '.ie-meta') + ' | attendu ' + numB);
  // ordre : un tri par date puis par total
  await L.aller(p, 'factures_internes');
  await p.selectOption('#f-annee', '');
  await lignesListe(p, Math.min(25, toutes));
  await p.click('#table-factures thead th:nth-child(5)');
  await p.waitForFunction(() => document.querySelector('#table-factures thead th:nth-child(5)').className.includes('sorting_'));
  await attendre(400);
  const colTotal = (await p.$$eval('#table-factures tbody tr td:nth-child(5)', c => c.map(x => parseFloat(x.textContent.replace(/[  \s$]/g, '').replace(',', '.')))));
  L.verifier(colTotal.length > 1 && colTotal.every((v, i) => i === 0 || colTotal[i - 1] >= v), 'tri par total (décroissant) : ' + JSON.stringify(colTotal));

  // ==== 10. Valeur de l'inventaire ===================================================================================================
  console.log('10. Valeur de l\'inventaire');
  outil('piece', 'P-0098', '=1+1+@SUM(A1)', '1', '3', '2,5');       // nom commençant par « = » : formule à neutraliser dans le CSV
  outil('piece', 'P-0097', 'Cube sans coût', '3', '2');             // pièce en stock sans coût (cube 12 de Beauchemin)
  const valSql = ent => sql("SELECT ROUND(COALESCE(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 0), 2) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id WHERE e.entreprise_id = " + ent);
  await L.aller(p, 'valeur_inventaire');
  const cartes = await p.$$eval('.ie-carte-valeur[data-entreprise]', c => c.map(x => [x.getAttribute('data-entreprise'), x.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()]));
  L.verifier(cartes.length === 2 && cartes[0][1].includes(fr(valSql(1))) && cartes[1][1].includes(fr(valSql(2))), 'valeur par entreprise = SQL indépendant (' + fr(valSql(1)) + ', ' + fr(valSql(2)) + ')');
  const totGen = (parseFloat(valSql(1)) + parseFloat(valSql(2))).toFixed(2);
  L.verifier((await tx(p, '#valeur-total-general')) === fr(totGen), 'total général = ' + fr(totGen));
  const sansCout = ent => sql("SELECT COUNT(DISTINCT s.piece_id) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id WHERE s.quantite > 0 AND e.entreprise_id = " + ent + " AND COALESCE(sc.cout_moyen, 0) = 0");
  L.verifier(sansCout(1) === '2' && sansCout(2) === '1' && cartes[0][1].includes('2 pièces en stock sans coût connu') && cartes[1][1].includes('1 pièce en stock sans coût connu'), 'avertissement : pièces en stock sans coût connu (2 chez Beauchemin, 1 chez Chaleur) : ' + cartes[0][1] + ' | ' + cartes[1][1]);
  for (const emp of [1, 3, 4, 2, 5]) {
    const v = sql("SELECT ROUND(COALESCE(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 0), 2) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id LEFT JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id WHERE s.emplacement_id = " + emp);
    L.verifier((await tx(p, '.ie-ligne-emplacement[data-id="' + emp + '"]')).includes(fr(v)), 'valeur de l\'emplacement ' + emp + ' = ' + fr(v));
  }
  await p.click('.ie-ligne-emplacement[data-id="1"] .ie-voir-detail');
  await p.waitForSelector('#detail-contenu:not([hidden])');
  const nbPiecesE1 = parseInt(sql('SELECT COUNT(*) FROM stock WHERE emplacement_id = 1 AND quantite > 0'), 10);
  await p.waitForFunction(() => document.querySelectorAll('#table-detail tbody tr:not(.dataTables_empty)').length > 0);
  L.verifier((await tx(p, '#detail-nb')).includes(nbPiecesE1 + ' pièces'), 'détail : ' + nbPiecesE1 + ' pièces en stock : ' + await tx(p, '#detail-nb'));
  L.verifier((await tx(p, '#detail-total')) === fr(sql("SELECT ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen,0)), 2) FROM stock s LEFT JOIN stock_couts sc ON sc.entreprise_id = 1 AND sc.piece_id = s.piece_id WHERE s.emplacement_id = 1")), 'détail : total de l\'emplacement');
  L.verifier((await tx(p, '#detail-titre')).includes('Entrepôt principal (Beauchemin)'), 'titre du détail : ' + await tx(p, '#detail-titre'));
  const detail = await p.$$eval('#table-detail tbody tr', rows => rows.map(r => [...r.cells].map(c => c.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim())));
  const attenduDetail = lignesSql("SELECT p.code, s.quantite, COALESCE(sc.cout_moyen, 0), ROUND(s.quantite * COALESCE(sc.cout_moyen, 0), 2) FROM stock s JOIN pieces p ON p.id = s.piece_id LEFT JOIN stock_couts sc ON sc.entreprise_id = 1 AND sc.piece_id = s.piece_id WHERE s.emplacement_id = 1 AND s.quantite > 0 ORDER BY p.code");
  const ligneP13 = detail.find(d => d[0] === 'P-0013');
  L.verifier(!ligneP13, 'P-0013 (stock 0) absent du détail');
  L.verifier(attenduDetail.every(a => { const d = detail.find(x => x[0] === a[0]); return d && d[5] === fr(a[3]) && num(d[3]) === parseFloat(a[1]); }), 'détail : quantité et valeur de chaque pièce = SQL');
  const lP98 = detail.find(d => d[1] === '=1+1+@SUM(A1)');
  L.verifier(!!lP98 && lP98[4] === '2,50 $' && lP98[5] === '7,50 $', 'coût moyen 2,50 $ et valeur 7,50 $ (3 × 2,50) pour la pièce à nom de formule : ' + JSON.stringify(lP98));
  await p.click('#table-detail thead th:nth-child(6)');        // tri par valeur
  await p.waitForFunction(() => /sorting_(asc|desc)/.test(document.querySelector('#table-detail thead th:nth-child(6)').className));
  const vals = await p.$$eval('#table-detail tbody tr td:nth-child(6)', c => c.map(x => parseFloat(x.textContent.replace(/[  \s$]/g, '').replace(',', '.'))));
  L.verifier(vals.length > 2 && (vals.every((v, i) => i === 0 || vals[i - 1] <= v) || vals.every((v, i) => i === 0 || vals[i - 1] >= v)), 'tri par valeur (numérique, pas texte) : ' + JSON.stringify(vals));
  // cube sans coût : badge
  await p.click('.ie-ligne-emplacement[data-id="3"] .ie-voir-detail');
  await p.waitForFunction(() => /Cube 12/.test(document.querySelector('#detail-titre').textContent));
  await p.waitForFunction(() => !!document.querySelector('#table-detail .badge-sans-cout'));
  L.verifier(!!(await p.$('#table-detail .badge-sans-cout')), 'le cube 12 affiche « Sans coût » pour la pièce sans coût connu');
  await p.click('#detail-fermer');
  L.verifier(await p.$eval('#detail-carte', e => e.hidden), 'le détail se referme');
  // emplacement désactivé encore garni : toujours compté, signalé
  sql('UPDATE emplacements SET actif = 0 WHERE id = 4');
  await L.aller(p, 'valeur_inventaire');
  const ligne4 = await tx(p, '.ie-ligne-emplacement[data-id="4"]');
  const valsE1 = await p.$$eval('.ie-ligne-emplacement[data-id="1"], .ie-ligne-emplacement[data-id="3"], .ie-ligne-emplacement[data-id="4"]', r => r.map(x => parseFloat(x.cells[3].textContent.replace(/[\u00a0\u202f\s$]/g, '').replace(',', '.'))));
  L.verifier(ligne4.includes('Désactivé') && ligne4.includes(fr(sql('SELECT ROUND(SUM(s.quantite * sc.cout_moyen), 2) FROM stock s JOIN stock_couts sc ON sc.entreprise_id = 1 AND sc.piece_id = s.piece_id WHERE s.emplacement_id = 4'))), 'emplacement désactivé avec du stock : ligne signalée « Désactivé » avec sa valeur : ' + ligne4);
  L.verifier(Math.abs(valsE1.reduce((a, b) => a + b, 0) - parseFloat(valSql(1))) < 0.05 && (await tx(p, '.ie-carte-valeur[data-entreprise="1"]')).includes(fr(valSql(1))), 'le total de l\'entreprise inclut l\'emplacement désactivé (somme des lignes = total) : ' + valsE1.join(' + ') + ' = ' + valSql(1));
  sql('UPDATE emplacements SET actif = 1 WHERE id = 4');
  // filtre d'entreprise de la barre du haut
  await Promise.all([p.waitForNavigation(), p.selectOption('#entreprise-courante', '1')]);
  await p.waitForSelector('.ie-carte-valeur[data-entreprise="1"]');
  L.verifier((await p.$$('.ie-carte-valeur[data-entreprise="2"]')).length === 0 && (await tx(p, '#valeur-total-general')) === fr(valSql(1)), 'filtre de la barre du haut : Beauchemin seulement, le total général = sa valeur');
  r = await api(p, 'app/ajax/valeur_export.php');
  L.verifier(!/Boutique Centre-ville|Boutique Chaleur/.test(r.texte), 'l\'export respecte le filtre d\'entreprise');
  await Promise.all([p.waitForNavigation(), p.selectOption('#entreprise-courante', '0')]);
  r = await api(p, 'app/ajax/valeur_detail.php?emplacement_id=1');
  L.verifier(r.status === 200 && r.json.ok && r.json.lignes.length === nbPiecesE1 && typeof r.json.total === 'string' && typeof r.json.lignes[0].quantite === 'string' && typeof r.json.lignes[0].cout_moyen === 'string', 'valeur_detail : JSON avec décimaux en chaînes');
  r = await api(p, 'app/ajax/valeur_detail.php?emplacement_id=999');
  L.verifier(r.status === 400, 'valeur_detail : emplacement inconnu = 400');
  r = await api(p, 'app/ajax/valeur_detail.php');
  L.verifier(r.status === 400, 'valeur_detail : emplacement manquant = 400');

  // ==== 11. Exports CSV ===============================================================================================================
  console.log('11. Exports CSV');
  r = await api(p, 'app/ajax/valeur_export.php');
  L.verifier(r.status === 200 && /text\/csv/.test(r.type) && /attachment; filename="valeur-inventaire-/.test(r.disposition), 'valeur_export : en-têtes (CSV, attachment) : ' + r.type + ' | ' + r.disposition);
  L.verifier(r.texte.charCodeAt(0) === 0xFEFF, 'valeur_export : BOM UTF-8');
  L.verifier(r.texte.split('\r\n')[2].split(';').length === 5 && new RegExp('Total général"?;;;;' + fr(totGen).replace(/ \$/, '').replace(/ /g, '')).test(r.texte), 'valeur_export : séparateur « ; » et total général : ' + r.texte.split('\r\n').slice(-3).join(' / '));
  r = await api(p, 'app/ajax/valeur_export.php?mode=pieces');
  L.verifier(r.status === 200 && r.texte.includes("'=1+1+@SUM(A1)") && !/;=1\+1/.test(r.texte), 'valeur_export (pièces) : formule neutralisée par une apostrophe');
  L.verifier(/;2,5;7,5\r?\n|;2,50;7,50\r?\n/.test(r.texte), 'valeur_export (pièces) : virgule décimale : ' + (r.texte.split('\r\n').find(l => l.includes('SUM(A1)')) || ''));
  r = await api(p, 'app/ajax/valeur_export.php?mode=pieces&emplacement_id=3');
  L.verifier(r.status === 200 && r.texte.split('\r\n').filter(l => l.includes('Cube 12')).length === parseInt(sql('SELECT COUNT(*) FROM stock WHERE emplacement_id = 3 AND quantite > 0'), 10), 'valeur_export : un seul emplacement');
  r = await api(p, 'app/ajax/valeur_export.php?mode=pieces');
  L.verifier(r.texte.includes(XSS1), 'valeur_export : le nom piégé est du texte brut dans le CSV (pas du HTML interprété)');
  r = await api(p, 'app/ajax/bilan_export.php?annee=' + A_PREC + '&mois=' + M_PREC);
  L.verifier(r.status === 200 && /text\/csv/.test(r.type) && r.disposition === 'attachment; filename="bilan-' + ym(A_PREC, M_PREC) + '.csv"', 'bilan_export : en-têtes : ' + r.disposition);
  L.verifier(r.texte.charCodeAt(0) === 0xFEFF && r.texte.includes(';') && r.texte.includes('53,40') && r.texte.includes(numB) && !r.texte.includes(numA), 'bilan_export : BOM, séparateur « ; », virgule décimale, facture annulée exclue');
  L.verifier(r.texte.includes('Beauchemin doit à Boutique Chaleur') || r.texte.includes('Beauchemin doit à Boutique Chaleur pour') || /Beauchemin doit à Boutique Chaleur pour/.test(r.texte), 'bilan_export : solde : ' + (r.texte.split('\r\n').find(l => l.startsWith('Solde')) || ''));
  L.verifier(r.texte.split('\r\n').find(l => l.startsWith('Solde')).endsWith(';53,40'), 'bilan_export : montant du solde 53,40');
  r = await api(p, 'app/ajax/bilan_export.php?annee=' + A_NOW + '&mois=' + M_NOW);
  L.verifier(r.status === 200 && r.texte.includes(XSS2) && !r.texte.includes("'<img"), 'bilan_export : note brute (pas de formule) conservée');
  // lien d'export de la page
  await L.aller(p, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC);
  L.verifier((await p.getAttribute('#btn-csv', 'href')).includes('bilan_export.php?annee=' + A_PREC + '&mois=' + M_PREC), 'le bouton « Exporter (CSV) » pointe sur la période affichée');

  // ==== 12. Impression et tablette =====================================================================================================
  console.log('12. Impression et tablette');
  await L.aller(p, 'facture_interne_voir&id=' + id5);
  await p.evaluate(() => { window.__imprime = 0; window.print = () => { window.__imprime++; }; });
  await p.click('#btn-imprimer');
  L.verifier(await p.evaluate(() => window.__imprime) === 1, 'le bouton « Imprimer » de la facture lance l\'impression');
  await L.aller(p, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC);
  await p.evaluate(() => { window.__imprime = 0; window.print = () => { window.__imprime++; }; });
  await p.click('#btn-imprimer');
  L.verifier(await p.evaluate(() => window.__imprime) === 1, 'le bouton « Imprimer » du bilan lance l\'impression');
  await L.aller(p, 'valeur_inventaire');
  await p.evaluate(() => { window.__imprime = 0; window.print = () => { window.__imprime++; }; });
  await p.click('#btn-imprimer');
  L.verifier(await p.evaluate(() => window.__imprime) === 1, 'le bouton « Imprimer » de la valeur de l\'inventaire lance l\'impression');
  await L.aller(p, 'facture_interne_voir&id=' + id5);
  await p.emulateMedia({ media: 'print' });
  const imp = await p.evaluate(() => {
    const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'absent'; };
    return { menu: d('.main-sidebar'), barre: d('.ie-barre'), entete: d('.content-header'), facture: d('#facture'), modal: d('#modal-annuler') };
  });
  L.verifier(imp.menu === 'none' && imp.barre === 'none' && imp.entete === 'none' && imp.facture !== 'none', 'impression : menu, boutons et titre de page masqués, facture visible : ' + JSON.stringify(imp));
  await p.pdf({ path: '/tmp/facture-interne-c.pdf', format: 'Letter' });
  await p.emulateMedia({ media: 'screen' });
  await L.aller(p, 'facture_interne_voir&id=' + idA);
  await p.emulateMedia({ media: 'print' });
  L.verifier(await p.evaluate(() => getComputedStyle(document.querySelector('.ie-filigrane')).display !== 'none'), 'impression : filigrane ANNULÉE conservé');
  await p.emulateMedia({ media: 'screen' });
  const tab = await nouvelleSession(b, 'gestionnaire1', { width: 768, height: 1024 });
  await ouvrirFacture(tab);
  const tailles = {};
  for (const s of ['#emplacement', '#entreprise-dest', '#destination', '#date', '#scan', '#btn-enregistrer']) { tailles[s] = (await (await tab.$(s)).boundingBox()).height; }
  L.verifier(Object.values(tailles).every(h => h >= 43.5), 'tablette : zones cliquables ≥ 44 px : ' + JSON.stringify(tailles));
  L.verifier(await tab.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'tablette : pas de défilement horizontal (facture interne)');
  await choisirTrajet(tab, 1, 2, 5);
  await ajouterAuScan(tab, 'P-0001', 1);
  await attendreApercu(tab);
  L.verifier(await tab.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'tablette : pas de défilement horizontal avec des lignes');
  L.verifier((await (await tab.$('#lignes tbody tr input')).boundingBox()).height >= 39 && await tab.$eval('#lignes tbody tr input', e => e.getAttribute('inputmode')) === 'decimal', 'tablette : champ de quantité décimal et assez haut');
  for (const route of ['factures_internes', 'bilan_mensuel', 'valeur_inventaire', 'facture_interne_voir&id=' + id5]) {
    await L.aller(tab, route);
    L.verifier(await tab.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'tablette : pas de défilement horizontal (' + route + ')');
  }
  L.verifier(reelles(tab).length === 0, 'tablette : aucune erreur console : ' + JSON.stringify(reelles(tab)));

  // ==== 13. Droits : employé, non connecté, jeton CSRF, méthode ==================================================================
  console.log('13. Droits et sécurité');
  const emp = await nouvelleSession(b, 'employe1');
  for (const route of ['factures_internes', 'facture_interne', 'bilan_mensuel', 'valeur_inventaire', 'facture_interne_voir&id=' + id5]) {
    await L.aller(emp, route);
    const corps = await tx(emp, '.content-wrapper');
    L.verifier(corps.includes('pas la permission') && !/FIN-\d|\d,\d\d \$/.test(corps), 'employé refusé sur la page ' + route);
  }
  const POSTS = [
    ['app/ajax/facture_apercu.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '1' }] }],
    ['app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 1, quantite: '1' }] }],
    ['app/action/facture_annuler.php', { id: parseInt(id5, 10), motif: 'x' }],
    ['app/ajax/factures_internes_data.php', { draw: 1, start: 0, length: 25 }],
    ['app/ajax/factures_internes_totaux.php', {}],
  ];
  const nbAvant = nbFactures();
  for (const [u, body] of POSTS) {
    r = await api(emp, u, body);
    L.verifier(r.status === 403 && !/FIN-\d|\d+\.\d\d/.test(r.texte.replace(/Jeton|jeton/g, '')), 'employé : ' + u + ' → 403 sans donnée : ' + r.status);
  }
  for (const u of ['app/ajax/valeur_detail.php?emplacement_id=1', 'app/ajax/valeur_export.php', 'app/ajax/valeur_export.php?mode=pieces', 'app/ajax/bilan_export.php', 'app/ajax/factures_internes_totaux.php']) {
    r = await api(emp, u);
    L.verifier(r.status === 403 && !/\d,\d\d/.test(r.texte) && r.texte.length < 200, 'employé : ' + u + ' → 403, aucune donnée : ' + r.status);
  }
  L.verifier(nbFactures() === nbAvant && sql("SELECT statut FROM documents WHERE id = " + id5) === 'valide', 'l\'employé n\'a rien créé ni annulé');
  // non connecté
  const anon = await b.newContext();
  for (const [u, body] of POSTS) {
    const rep = await anon.request.post(L.BASE + '/' + u, { data: body });
    L.verifier(rep.status() === 401, 'non connecté : ' + u + ' → 401 (' + rep.status() + ')');
  }
  for (const u of ['app/ajax/valeur_export.php', 'app/ajax/bilan_export.php', 'app/ajax/valeur_detail.php?emplacement_id=1']) {
    const rep = await anon.request.get(L.BASE + '/' + u);
    L.verifier(rep.status() === 401, 'non connecté : ' + u + ' → 401 (' + rep.status() + ')');
  }
  await anon.close();
  // CSRF et méthode (gestionnaire connecté)
  for (const [u, body] of POSTS.slice(0, 3)) {
    r = await api(p, u, body, { sansJeton: true });
    L.verifier(r.status === 403 && /Jeton/.test(r.texte), 'sans jeton CSRF : ' + u + ' → 403');
  }
  for (const u of ['app/action/facture_save.php', 'app/action/facture_annuler.php']) {
    r = await api(p, u);
    L.verifier(r.status === 405, 'GET refusé sur ' + u + ' (405) : ' + r.status);
  }
  r = await api(p, 'app/action/facture_lib.php', {});
  L.verifier(r.status === 404, 'la bibliothèque facture_lib.php n\'est pas appelable');

  // ---- gestionnaire d'une seule entreprise ----------------------------------------------------------------------
  outil('utilisateur', 'gest_bea', 'gestionnaire', '1');
  const gb = await nouvelleSession(b, 'gest_bea');
  await ouvrirFacture(gb);
  const optsSrc = await gb.$$eval('#emplacement option', o => o.map(x => x.value).filter(Boolean));
  L.verifier(optsSrc.join(',') === '1,3,4', 'une seule entreprise : seuls ses emplacements sont proposés comme source : ' + optsSrc);
  await gb.selectOption('#emplacement', '1');
  await gb.waitForFunction(() => !document.querySelector('#destination').disabled && document.querySelectorAll('#destination option').length > 1);
  L.verifier(await gb.$eval('#entreprise-dest', e => e.value) === '2' && (await gb.$$eval('#destination option', o => o.map(x => x.value))).includes('5'), 'destinataire : l\'autre entreprise, auto-sélectionnée, avec ses emplacements');
  await L.scanner(gb, '#scan', 'EMP-000002');
  await attendre(600);
  L.verifier((await tx(gb, '#toasts')).includes('Emplacement inconnu, ou d\'une entreprise à laquelle vous n\'avez pas accès'), 'scan d\'un emplacement d\'une entreprise non autorisée : message clair : ' + await tx(gb, '#toasts'));
  r = await api(gb, 'app/action/facture_save.php', { emplacement_id: 2, entreprise_dest_id: 1, emplacement_dest_id: 3, lignes: [{ piece_id: 9, quantite: '1' }] });
  L.verifier(r.status === 403 && /accès à cette entreprise/.test(r.json.erreur), 'source dans l\'entreprise 2 : refusée (403) : ' + r.texte);
  r = await api(gb, 'app/ajax/facture_apercu.php', { emplacement_id: 2, lignes: [{ piece_id: 9, quantite: '1' }] });
  L.verifier(r.status === 403, 'aperçu sur l\'entreprise 2 : refusé (403)');
  r = await api(gb, 'app/ajax/valeur_detail.php?emplacement_id=2');
  L.verifier(r.status === 403 && !/\d,\d\d|\d+\.\d\d/.test(r.texte), 'détail de valeur de l\'entreprise 2 : refusé (403)');
  r = await api(gb, 'app/ajax/valeur_export.php?mode=pieces&emplacement_id=2');
  L.verifier(r.status === 403, 'export du détail de l\'entreprise 2 : refusé (403)');
  await L.aller(gb, 'valeur_inventaire');
  L.verifier((await gb.$$('.ie-carte-valeur[data-entreprise="2"]')).length === 0 && (await gb.$$('.ie-carte-valeur[data-entreprise="1"]')).length === 1, 'valeur : seule son entreprise');
  r = await api(gb, 'app/ajax/valeur_export.php?mode=pieces');
  L.verifier(!/Boutique Centre-ville/.test(r.texte) && /Entrepôt principal/.test(r.texte), 'export de valeur : seule son entreprise');
  await L.aller(gb, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC);
  L.verifier((await tx(gb, '#solde')).includes('Beauchemin doit 53,40 $ à Boutique Chaleur'), 'bilan visible avec une seule entreprise (paire fixe) : ' + await tx(gb, '#solde'));
  await L.aller(gb, 'factures_internes');
  await gb.selectOption('#f-annee', '');
  await gb.waitForFunction(n => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length === Math.min(25, n), nbFactures());
  L.verifier((await gb.$$('#table-factures tbody tr:not(.dataTables_empty)')).length === Math.min(25, nbFactures()), 'liste : toutes les factures où Beauchemin est émetteur ou destinataire');
  // une facture de Beauchemin vers Chaleur par ce gestionnaire (sens émis)
  await ouvrirFacture(gb);
  await choisirTrajet(gb, 1, 2, 5);
  await ajouterAuScan(gb, 'P-0005', 1);
  await enregistrer(gb);
  L.verifier(!!numeroDe(await succes(gb)), 'une facture peut être émise par ce gestionnaire : ' + await succes(gb));
  L.verifier(reelles(gb).length === 0, 'gest_bea : aucune erreur console : ' + JSON.stringify(reelles(gb)));

  // ---- trois entreprises : un utilisateur étranger aux deux autres, choix de la paire ---------------------------------
  console.log('14. Troisième entreprise');
  const ids3 = outil('entreprise', 'TRS', 'Entreprise Tierce', 'EMP-000006').split(' ');
  outil('utilisateur', 'gest_tiers', 'gestionnaire', ids3[0]);
  const gt = await nouvelleSession(b, 'gest_tiers');
  const rv = await gt.goto(L.BASE + '/index.php?page=facture_interne_voir&id=' + id5);
  L.verifier(rv.status() === 403 && (await tx(gt, '.content-wrapper')).includes('pas accès à ce document') && !/\d,\d\d \$/.test(await tx(gt, '.content-wrapper')), 'facture d\'autres entreprises : accès refusé (403), aucun montant');
  r = await api(gt, 'app/action/facture_annuler.php', { id: parseInt(id5, 10), motif: 'intrus' });
  L.verifier(r.status === 403 && sql('SELECT statut FROM documents WHERE id = ' + id5) === 'valide', 'annulation par une entreprise étrangère : refusée (403)');
  r = await api(gt, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 3, emplacement_dest_id: parseInt(ids3[1], 10), lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 403, 'émettre depuis l\'entreprise 1 sans y avoir accès : refusé (403)');
  await L.aller(gt, 'factures_internes');
  await gt.selectOption('#f-annee', '');
  await gt.waitForSelector('#table-factures .dataTables_empty');
  await gt.waitForFunction(() => /Aucune facture/.test(document.querySelector('#ie-totaux').textContent));
  L.verifier((await tx(gt, '#ie-totaux')).includes('Aucune facture'), 'liste vide pour l\'entreprise étrangère : ' + await tx(gt, '#ie-totaux'));
  r = await api(gt, 'app/ajax/bilan_export.php?annee=' + A_PREC + '&mois=' + M_PREC + '&a=1&b=2');
  L.verifier(r.status === 403 && !r.texte.includes('FIN-'), 'export du bilan Beauchemin/Chaleur par l\'entreprise étrangère : refusé (403)');
  await L.aller(gt, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC + '&a=1&b=2');
  L.verifier(!(await tx(gt, '.content-wrapper')).includes('FIN-') && !(await tx(gt, '.content-wrapper')).includes('53,40'), 'bilan Beauchemin/Chaleur : rien n\'est montré à l\'entreprise étrangère');
  await ouvrirFacture(gt);
  L.verifier((await gt.$$eval('#emplacement option', o => o.map(x => x.value).filter(Boolean))).join(',') === ids3[1] && await gt.$eval('#emplacement', e => e.value) === ids3[1], 'entreprise étrangère : seul son emplacement comme source, présélectionné');
  await gt.waitForFunction(() => !document.querySelector('#entreprise-dest').disabled);
  L.verifier((await gt.$$eval('#entreprise-dest option', o => o.map(x => x.value).filter(Boolean))).join(',') === '1,2', 'destinataires possibles : les deux autres entreprises');
  // admin : le bilan propose la paire quand il y a plus de deux entreprises
  const ad = await nouvelleSession(b, 'admin');
  r = await api(ad, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: parseInt(ids3[1], 10), lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 400 && /n'appartient pas à l'entreprise choisie/.test(r.json.erreur), 'destination d\'une autre entreprise que celle choisie : ' + r.texte);
  await L.aller(ad, 'bilan_mensuel&annee=' + A_PREC + '&mois=' + M_PREC);
  L.verifier((await ad.$$('#b-a')).length === 1 && (await ad.$$('#b-b')).length === 1, '3 entreprises : choix de la paire');
  const paireDefaut = [await ad.$eval('#b-a', e => e.value), await ad.$eval('#b-b', e => e.value)];
  L.verifier(paireDefaut.join(',') === '1,2' && (await tx(ad, '#solde')).includes('Beauchemin doit 53,40 $'), 'paire par défaut A = 1, B = 2 : ' + paireDefaut);
  await Promise.all([ad.waitForNavigation(), ad.selectOption('#b-b', '3')]);
  await ad.waitForLoadState('networkidle');
  L.verifier((await tx(ad, '#solde')).startsWith('Aucun solde pour') && (await tx(ad, '.ie-bilan-paire')).includes('Entreprise Tierce') && ad.url().includes('b=3'), 'Beauchemin ↔ Entreprise Tierce : aucun solde : ' + await tx(ad, '#solde'));
  L.verifier((await ad.getAttribute('#b-prec', 'href')).includes('a=1&b=3') && (await ad.getAttribute('#btn-csv', 'href')).includes('a=1&b=3'), 'la paire est conservée dans la navigation et l\'export');
  await ouvrirFacture(ad);
  await ad.selectOption('#emplacement', '1');
  await ad.waitForFunction(() => !document.querySelector('#entreprise-dest').disabled);
  L.verifier((await ad.$$eval('#entreprise-dest option', o => o.map(x => x.value).filter(Boolean))).join(',') === '2,3', 'admin : source Beauchemin → destinataires 2 et 3');
  await choisirTrajet(ad, 1, 3, ids3[1]);
  await ajouterAuScan(ad, 'P-0005', 1);
  await enregistrer(ad);
  const num14 = numeroDe(await succes(ad));
  L.verifier(!!num14, 'facture Beauchemin → Entreprise Tierce : ' + await succes(ad));
  await L.aller(ad, 'bilan_mensuel&annee=' + A_NOW + '&mois=' + M_NOW + '&a=1&b=3');
  L.verifier((await tx(ad, '#solde')).includes('Entreprise Tierce doit 9,80 $ à Beauchemin'), 'bilan de la nouvelle paire : ' + await tx(ad, '#solde'));
  await L.aller(gt, 'factures_internes');
  await gt.selectOption('#f-annee', '');
  await lignesListe(gt, 1);
  L.verifier((await texteLignesListe(gt))[0].includes(num14), 'l\'entreprise destinataire voit la facture qu\'elle a reçue (et seulement celle-là)');
  await L.aller(gt, 'facture_interne_voir&id=' + idDoc(num14));
  L.verifier((await tx(gt, '.ie-titre')) === 'FACTURE INTERNE' && !!(await gt.$('#btn-annuler')), 'la destinataire ouvre la facture et peut l\'annuler');
  L.verifier(reelles(gt).length === 0 && reelles(ad).length === 0, 'aucune erreur console (entreprise tierce, admin) : ' + JSON.stringify(reelles(gt).concat(reelles(ad))));

  // ==== 15. Noms piégés partout =====================================================================================================
  console.log('15. Noms piégés (entreprise, emplacement, catégorie, unité, pièce)');
  const PIEGE = ['<img src=x onerror=alert(11)>', '<img src=x onerror=alert(12)>', '<img src=x onerror=alert(13)>', '<u>m</u>'];
  sql("UPDATE entreprises SET nom = '" + PIEGE[0] + "' WHERE id = 2");
  sql("UPDATE emplacements SET nom = '" + PIEGE[1] + "' WHERE id = 5");
  sql("UPDATE categories SET nom = '" + PIEGE[2] + "' WHERE id = 2");
  sql("UPDATE pieces SET unite = '" + PIEGE[3] + "' WHERE id = 1");
  r = await api(p, 'app/action/facture_save.php', { emplacement_id: 1, entreprise_dest_id: 2, emplacement_dest_id: 5, note: PIEGE[2], lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(r.status === 200 && !!r.json.numero, 'facture créée avec des noms piégés : ' + r.texte.slice(0, 120));
  const idPiege2 = r.json.id;
  await L.aller(p, 'facture_interne_voir&id=' + idPiege2);
  L.verifier((await tx(p, '#facture')).includes(PIEGE[0]) && (await tx(p, '#facture')).includes(PIEGE[1]), 'facture : noms affichés en texte');
  await L.aller(p, 'factures_internes');
  await p.selectOption('#f-annee', '');
  await p.waitForFunction(() => document.querySelectorAll('#table-factures tbody tr:not(.dataTables_empty)').length > 3);
  await L.aller(p, 'bilan_mensuel');
  L.verifier((await tx(p, '.ie-bilan-paire')).includes(PIEGE[0]) && (await tx(p, '#solde')).includes(PIEGE[0]), 'bilan : nom d\'entreprise piégé affiché en texte');
  await L.aller(p, 'valeur_inventaire');
  await p.click('.ie-ligne-emplacement[data-id="1"] .ie-voir-detail');
  await p.waitForSelector('#table-detail tbody tr');
  await p.fill('#detail-contenu input[type=search]', 'P-0001');
  await p.waitForFunction(() => document.querySelectorAll('#table-detail tbody tr').length === 1);
  L.verifier((await tx(p, '#table-detail tbody')).includes(PIEGE[2]) && (await tx(p, '#table-detail tbody')).includes(PIEGE[3]), 'valeur : catégorie et unité piégées affichées en texte');
  await p.click('.ie-ligne-emplacement[data-id="5"] .ie-voir-detail');
  await p.waitForFunction(() => /onerror/.test(document.querySelector('#detail-titre').textContent));
  await ouvrirFacture(p);
  await choisirTrajet(p, 1, 2, 5);
  await ajouterAuScan(p, 'P-0001', 1);
  await attendreApercu(p);
  L.verifier((await tx(p, '#entreprise-dest')).includes(PIEGE[0]) && (await tx(p, '#destination')).includes(PIEGE[1]) && (await tx(p, '#lignes')).includes(PIEGE[3]), 'saisie : noms piégés (entreprise, emplacement, unité) affichés en texte dans les listes et les lignes');
  L.verifier(dialogues.length === 0, 'aucun script exécuté (alert) sur toutes les pages : ' + JSON.stringify(dialogues));
  L.verifier((await p.$$('.content-wrapper img[src="x"], .content-wrapper u')).length === 0, 'aucune balise injectée dans la page de saisie');
  for (const route of ['facture_interne_voir&id=' + idPiege2, 'factures_internes', 'bilan_mensuel', 'valeur_inventaire']) {
    await L.aller(p, route);
    L.verifier((await p.$$('.content-wrapper img[src="x"], .content-wrapper u, .content-wrapper b')).length === 0, 'aucune balise injectée : ' + route);
  }
  sql("UPDATE entreprises SET nom = 'Boutique Chaleur' WHERE id = 2");
  sql("UPDATE emplacements SET nom = 'Boutique Centre-ville' WHERE id = 5");
  sql("UPDATE categories SET nom = 'Contrôles' WHERE id = 2");
  sql("UPDATE pieces SET unite = 'unité' WHERE id = 1");

  // ==== 16. Intégrité et console =====================================================================================================
  console.log('16. Intégrité du stock et console');
  const ecarts = lignesSql('SELECT s.piece_id, s.emplacement_id, s.quantite, COALESCE(m.q, 0) FROM stock s LEFT JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m ON m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id WHERE s.quantite <> COALESCE(m.q, 0)');
  L.verifier(ecarts.length === 0, 'invariant stock = Σ mouvements : ' + JSON.stringify(ecarts));
  L.verifier(sql('SELECT COUNT(*) FROM stock WHERE quantite < 0') === '0', 'aucun stock négatif');
  L.verifier(sql("SELECT COUNT(*) FROM documents d WHERE d.type = 'facture_interne' AND ABS(d.total - (SELECT COALESCE(SUM(l.total_ligne), 0) FROM document_lignes l WHERE l.document_id = d.id)) > 0.001") === '0', 'chaque total de facture = somme de ses lignes');
  L.verifier(parseInt(sql("SELECT COUNT(*) FROM journal WHERE action = 'facture_interne.creee'"), 10) === nbFactures() - 2, 'chaque création de facture est journalisée (hors les 2 factures de démonstration)');
  L.verifier(parseInt(sql("SELECT COUNT(*) FROM journal WHERE action = 'document.annule'"), 10) >= 1 && parseInt(sql("SELECT COUNT(*) FROM journal WHERE action LIKE 'export.%'"), 10) >= 3, 'annulations et exports journalisés');
  L.verifier(dialogues.length === 0, 'aucun script injecté n\'a été exécuté (alert) : ' + JSON.stringify(dialogues));
  L.verifier(reelles(p).length === 0, 'aucune erreur de console (gestionnaire) : ' + JSON.stringify(reelles(p)));
  L.verifier(reelles(emp).length === 0, 'aucune erreur de console (employé) : ' + JSON.stringify(reelles(emp)));
  await b.close();
  execFileSync(path.join(RACINE, 'tools', 'serveur.sh'), ['reset', DB], { cwd: RACINE, stdio: 'ignore' });   // laisse la base de démonstration propre
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
