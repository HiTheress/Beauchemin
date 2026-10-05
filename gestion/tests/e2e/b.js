// Test de bout en bout du module B — Mouvements (réception, transfert, sortie, ajustement, documents, détail d'un document).
//   cd gestion && tools/serveur.sh start bea_b 8103 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8103 DB_NAME=bea_b node tests/e2e/b.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), crée ses propres données
// (comptes gestionnaire2 = entreprise 2 seulement, pièces de test) et la remet à zéro à la fin.
// Il suppose donc un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_b) ; le journal PHP est lu
// dans /tmp/bea-<port>.log (port de BASE_URL).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_b';
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const MDP = 'Test-Beauchemin-1';
const XSS_PIECE = '<img src=x onerror=alert(1)>';

const dialogues = [];
const attendre = ms => new Promise(r => setTimeout(r, ms));
function sql(requete) { return execSync('mysql -uroot -N --default-character-set=utf8mb4 ' + DB, { input: requete, cwd: RACINE }).toString().trim(); }
const stock = (piece, emp) => sql('SELECT COALESCE((SELECT quantite FROM stock WHERE piece_id=' + piece + ' AND emplacement_id=' + emp + '), 0)');
const nbDocs = (where) => parseInt(sql('SELECT COUNT(*) FROM documents' + (where ? ' WHERE ' + where : '')), 10);
const num = s => parseFloat(String(s));

function suivre(page) {
  page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); });
  return page;
}
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (validation, refus d'accès) sont ignorés. */
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/ERR_ABORTED/.test(e) && !/requestfailed: \S+\/(documents_data|reception_prix|emplacements_liste)\.php/.test(e));

/** Appel d'API depuis le navigateur (jeton CSRF inclus sauf indication) ; renvoie {status, json, texte}. */
async function appel(p, url, corps, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, corps, opts]) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (!opts.sansJeton) h['X-CSRF-Token'] = jeton;
    const r = await fetch(url, corps === null ? { credentials: 'same-origin' } : { method: opts.methode || 'POST', credentials: 'same-origin', headers: h, body: JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps, opts]);
}
/** Lecture d'un tableau de données DataTables (POST encodé comme le fait le navigateur). */
async function liste(p, champs) {
  return p.evaluate(async (champs) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const r = await fetch('app/ajax/documents_data.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': jeton }, body: new URLSearchParams(champs).toString() });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, champs);
}
async function toastTexte(p) { return p.evaluate(() => (document.getElementById('toasts') || { textContent: '' }).textContent); }
async function viderToasts(p) { await p.evaluate(() => document.querySelectorAll('#toasts .alert').forEach(e => e.remove())); }
/** Lignes du composant : tableau de tableaux (valeur des champs de saisie ou texte de la cellule). */
async function lignes(p) {
  return p.$$eval('#lignes tbody tr', r => r.map(x => [...x.querySelectorAll('td')].map(t => t.querySelector('input') ? t.querySelector('input').value : t.textContent.trim())));
}
async function attendreLignes(p, n) {
  await p.waitForFunction(k => document.querySelectorAll('#lignes tbody tr').length === k, n, { timeout: 8000 });
}
/** Scanne un code (taper + Entrée) et attend n lignes. */
async function scan(p, code, n) { await L.scanner(p, '#scan', code); if (n !== undefined) { await attendreLignes(p, n); } }
async function attendreToast(p, motif) {
  await p.waitForFunction(m => (document.getElementById('toasts') || { textContent: '' }).textContent.indexOf(m) !== -1, motif, { timeout: 6000 });
}
async function erreurSaisie(p) { await p.waitForSelector('#mv-erreur:not([hidden])', { timeout: 6000 }); return (await p.textContent('#mv-erreur')).trim(); }
async function succesSaisie(p) { await p.waitForSelector('#mv-succes:not([hidden])', { timeout: 8000 }); return (await p.textContent('#mv-succes')).replace(/\s+/g, ' ').trim(); }
async function texteNorm(p, sel) { return (await p.textContent(sel)).replace(/[\s ]+/g, ' ').trim(); }
async function optionsTexte(p, sel) { return p.$$eval(sel + ' option', o => o.map(x => x.textContent.trim())); }
/** Attend la fin du chargement du tableau de documents ; renvoie {lignes, info}. */
async function tableau(p) {
  await attendre(450);      // antirebond de la zone de recherche (300 ms)
  await p.waitForFunction(() => { const pr = document.getElementById('table-documents_processing'); return pr && pr.style.display === 'none'; }, null, { timeout: 8000 }).catch(() => {});
  await attendre(200);
  const rows = await p.$$eval('#table-documents tbody tr', r => r.map(x => x.textContent.replace(/[\s ]+/g, ' ').trim()));
  const info = await p.textContent('#table-documents_info');
  return { rows, vide: rows.length === 1 && /Aucun/.test(rows[0]), info: info.trim() };
}
async function ouvrirDocuments(p, query) { await L.aller(p, 'documents' + (query || '')); return tableau(p); }
function remettreAZero() {
  try { execSync('tools/serveur.sh reset ' + DB, { cwd: RACINE, stdio: 'pipe' }); return true; } catch (x) { return false; }
}
function demarrageHorsLigne(code) { return execSync('php -r \'echo password_hash("' + code + '", PASSWORD_DEFAULT);\'').toString(); }

(async () => {
  // ---- remise à zéro de la base de démonstration + données de test ---------------------------------------------------
  if (!remettreAZero()) { console.log('AVERTISSEMENT : remise à zéro impossible ; le test suppose la base de démo intacte.'); }
  const hash = demarrageHorsLigne(MDP);
  sql("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('gestionnaire2', 'Gestionnaire BCH', '" + hash + "', 'gestionnaire');" +
      "INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) SELECT id, 2 FROM utilisateurs WHERE nom_utilisateur = 'gestionnaire2';");
  const b = await L.lancer();
  const pages = [];
  const nouvelle = async (viewport) => { const p = suivre(await L.nouvellePage(b, viewport)); pages.push(p); return p; };
  const connecterAs = async (nom, viewport) => {
    const p = await nouvelle(viewport);
    await p.goto(L.BASE + '/login.php');
    await p.fill('input[name=username]', nom); await p.fill('input[name=password]', MDP);
    await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
    return p;
  };

  const g = await nouvelle(); await L.connecter(g, 'gestionnaire');
  const e = await nouvelle(); await L.connecter(e, 'employe');
  const g2 = await connecterAs('gestionnaire2');
  // page « sacrifiée » pour les refus provoqués (jeton absent, GET sur un endpoint d'écriture…) : le serveur de développement
  // peut y couper la connexion avant d'avoir lu le corps de la requête ; ces erreurs réseau volontaires ne comptent pas
  const neg = suivre(await L.nouvellePage(b)); await L.connecter(neg, 'gestionnaire');

  // =====================================================================================================================
  console.log('1. Contrôle d\'accès des pages et des endpoints');
  // =====================================================================================================================
  await L.aller(e, 'reception');
  L.verifier((await e.textContent('.content-wrapper')).includes('pas la permission'), 'employé : page reception refusée');
  L.verifier((await e.$$('#btn-enregistrer')).length === 0, 'employé : aucun formulaire de réception dans la page');
  await L.aller(e, 'ajustement');
  L.verifier((await e.textContent('.content-wrapper')).includes('pas la permission') && (await e.$$('#btn-enregistrer')).length === 0, 'employé : page ajustement refusée');
  L.verifier((await e.$$('a[href="index.php?page=reception"]')).length === 0, 'employé : pas de lien Réception dans le menu');
  await L.aller(e, 'transfert'); L.verifier((await e.$$('#btn-enregistrer')).length === 1, 'employé : page transfert accessible');
  await L.aller(e, 'sortie'); L.verifier((await e.$$('#btn-enregistrer')).length === 1, 'employé : page sortie accessible');

  const lignesOk = [{ piece_id: 1, quantite: '1', cout_unitaire: '1' }];
  // sans connexion : 401 (requête sans témoin de session)
  const ctxAnon = await b.newContext();
  const anon = async (url, methode, corps) => {
    const r = await ctxAnon.request.fetch(L.BASE + '/' + url, { method: methode, headers: { 'Content-Type': 'application/json' }, data: corps ? JSON.stringify(corps) : undefined });
    return r.status();
  };
  for (const [u, m] of [['reception_save', 'POST'], ['transfert_save', 'POST'], ['sortie_save', 'POST'], ['ajustement_save', 'POST'], ['document_annuler', 'POST']]) {
    L.verifier(await anon('app/action/' + u + '.php', m, { a: 1 }) === 401, 'non connecté : ' + u + ' répond 401');
  }
  L.verifier(await anon('app/action/document_lib.php', 'GET') === 401, 'non connecté : document_lib.php n\'est pas un endpoint');
  L.verifier(await anon('app/ajax/documents_data.php', 'POST', {}) === 401, 'non connecté : documents_data répond 401');
  L.verifier(await anon('app/ajax/reception_prix.php?piece_id=1', 'GET') === 401, 'non connecté : reception_prix répond 401');
  await ctxAnon.close();

  const libDirect = await neg.evaluate(async () => (await fetch('app/action/document_lib.php', { credentials: 'same-origin' })).status);
  L.verifier(libDirect === 404, 'connecté : document_lib.php appelé directement répond 404');
  // sans jeton CSRF : 403 ; GET sur un endpoint d'écriture : 405
  for (const u of ['reception_save', 'transfert_save', 'sortie_save', 'ajustement_save', 'document_annuler']) {
    const r = await appel(neg, 'app/action/' + u + '.php', { emplacement_id: 1, lignes: lignesOk }, { sansJeton: true });
    L.verifier(r.status === 403 && r.json && /Jeton/.test(r.json.erreur), 'sans jeton CSRF : ' + u + ' refusé (403)');
    const r2 = await neg.evaluate(async (u) => { const r = await fetch('app/action/' + u + '.php', { credentials: 'same-origin' }); return r.status; }, u);
    L.verifier(r2 === 405, 'GET sur ' + u + ' : 405');
  }

  // employé : réception, ajustement, annulation, coûts refusés par POST direct (403 + message en français)
  const refusEmp = [
    ['app/action/reception_save.php', { emplacement_id: 1, lignes: lignesOk }],
    ['app/action/ajustement_save.php', { emplacement_id: 1, motif: 'correction', lignes: [{ piece_id: 1, quantite: '1' }] }],
    ['app/action/document_annuler.php', { id: 1, motif: 'test' }],
  ];
  for (const [u, corps] of refusEmp) {
    const r = await appel(e, u, corps);
    L.verifier(r.status === 403 && /permission/.test(r.json.erreur), 'employé : POST direct ' + u.split('/').pop() + ' refusé (403) : ' + r.status);
  }
  const rp = await appel(e, 'app/ajax/reception_prix.php?piece_id=1&emplacement_id=1', null);
  L.verifier(rp.status === 403 && !/cout"/.test(rp.texte), 'employé : reception_prix refusé, aucun coût dans la réponse');
  L.verifier(nbDocs() === 6, 'aucun document créé par les tentatives refusées (6 documents de démo)');

  // autre entreprise : l'employé (entreprise 1) ne touche pas aux emplacements 2 et 5 (entreprise 2)
  for (const [u, corps] of [
    ['app/action/transfert_save.php', { emplacement_id: 2, emplacement_dest_id: 5, lignes: [{ piece_id: 9, quantite: '1' }] }],
    ['app/action/transfert_save.php', { emplacement_id: 1, emplacement_dest_id: 5, lignes: [{ piece_id: 1, quantite: '1' }] }],
    ['app/action/sortie_save.php', { emplacement_id: 2, motif: 'service', lignes: [{ piece_id: 9, quantite: '1' }] }],
  ]) {
    const r = await appel(e, u, corps);
    L.verifier(r.status === 403 && /acc[eè]s/.test(r.json.erreur), 'employé : ' + u.split('/').pop() + ' sur l\'entreprise 2 refusé (403) : ' + r.status + ' ' + (r.json && r.json.erreur));
  }
  // gestionnaire2 (entreprise 2 seulement) : pas de réception, d'ajustement ni d'annulation sur l'entreprise 1
  for (const [u, corps] of [
    ['app/action/reception_save.php', { emplacement_id: 1, lignes: lignesOk }],
    ['app/action/ajustement_save.php', { emplacement_id: 3, motif: 'correction', lignes: [{ piece_id: 1, quantite: '1' }] }],
    ['app/action/document_annuler.php', { id: 3, motif: 'test' }],
    ['app/action/sortie_save.php', { emplacement_id: 1, motif: 'service', lignes: [{ piece_id: 1, quantite: '1' }] }],
  ]) {
    const r = await appel(g2, u, corps);
    L.verifier(r.status === 403, 'gestionnaire de l\'entreprise 2 : ' + u.split('/').pop() + ' sur l\'entreprise 1 refusé (403) : ' + r.status);
  }
  const rp2 = await appel(g2, 'app/ajax/reception_prix.php?piece_id=1&emplacement_id=1', null);
  L.verifier(rp2.status === 403, 'gestionnaire de l\'entreprise 2 : reception_prix sur un emplacement de l\'entreprise 1 refusé');
  // un employé ne voit pas un document de l'entreprise 2 (document 2 = réception de Boutique Chaleur)
  await L.aller(e, 'document_voir&id=2');
  L.verifier((await e.textContent('.content-wrapper')).includes('pas accès à ce document'), 'employé : document de l\'entreprise 2 refusé : ' + (await texteNorm(e, '.content-wrapper')).slice(0, 120));
  const r403 = await appel(e, 'app/action/document_annuler.php', { id: 2, motif: 'test' });
  L.verifier(r403.status === 403, 'employé : annuler un document de l\'entreprise 2 refusé (403)');
  await L.aller(e, 'document_voir&id=99999');
  L.verifier((await e.textContent('.content-wrapper')).includes('Document introuvable') || (await e.textContent('.content-wrapper')).includes('introuvable'), 'document inexistant : message clair');
  await L.aller(e, 'document_voir&id=abc');
  L.verifier((await e.textContent('.content-wrapper')).includes('introuvable'), 'identifiant de document invalide : message clair');

  // =====================================================================================================================
  console.log('2. Réception (gestionnaire) : scan, coûts proposés, total, enregistrement');
  // =====================================================================================================================
  await L.aller(g, 'reception');
  L.verifier((await g.textContent('h1')).trim() === 'Réception de marchandise', 'titre de la page de réception');
  const groupes = await g.$$eval('#emplacement optgroup', o => o.map(x => x.label));
  L.verifier(groupes.join('|') === 'Beauchemin|Boutique Chaleur', 'emplacements groupés par entreprise : ' + groupes.join('|'));
  L.verifier(await g.$eval('#date', x => x.max) === await g.$eval('#date', x => x.value), 'date par défaut = aujourd\'hui = date maximale');
  L.verifier(await g.evaluate(() => document.activeElement.id) === 'scan', 'le focus est dans le champ de scan');
  L.verifier(await g.$eval('#maj-prix', x => x.disabled), 'case « mettre à jour les prix » désactivée sans fournisseur');
  await L.scanner(g, '#scan', 'EMP-000002');
  await g.waitForFunction(() => document.getElementById('emplacement').value === '2');
  L.verifier(true, 'scan d\'un code EMP-… : choisit l\'emplacement de réception');
  await L.scanner(g, '#scan', 'EMP-000001');
  await g.waitForFunction(() => document.getElementById('emplacement').value === '1');
  await g.selectOption('#fournisseur', '2');   // Grossiste Gaz du Nord (prix P-0001 : 15,20)
  L.verifier(!(await g.$eval('#maj-prix', x => x.disabled)), 'case « mettre à jour les prix » activée avec un fournisseur');
  await scan(g, 'P-0001', 1); await scan(g, 'P-0004', 2);
  await scan(g, '012345678905', 2);                        // alias de P-0001 : +1 sur la même ligne
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input').value === '2');
  await g.waitForFunction(() => { const i = document.querySelectorAll('#lignes tbody tr input[aria-label^="Coût"]'); return i.length === 2 && i[0].value !== '' && i[1].value !== ''; });
  let l = await lignes(g);
  L.verifier(l[0][2] === '2' && l[0][3] === '15,20', 'coût proposé = prix de CE fournisseur : ' + JSON.stringify(l[0]));
  L.verifier(l[1][3] === '109,00', 'sans prix chez ce fournisseur : coût moyen de l\'entreprise : ' + JSON.stringify(l[1]));
  L.verifier((await texteNorm(g, '#mv-total')).includes('139,40'), 'total estimé 2 x 15,20 + 109,00 = 139,40 : ' + await texteNorm(g, '#mv-total'));
  // changer de fournisseur remplace les coûts proposés (non modifiés à la main) ; une saisie manuelle est conservée
  await g.fill('#lignes tbody tr:nth-child(2) input[aria-label^="Coût"]', '100,50');
  await g.selectOption('#fournisseur', '3');               // Pièces Mazout Express : P-0001 sans prix -> coût moyen 14,50
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value === '14,50', null, { timeout: 5000 });
  l = await lignes(g);
  L.verifier(l[0][3] === '14,50' && l[1][3] === '100,50', 'changement de fournisseur : coût non modifié mis à jour, coût saisi à la main conservé : ' + JSON.stringify([l[0][3], l[1][3]]));
  await g.selectOption('#fournisseur', '2');
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value === '15,20', null, { timeout: 5000 });

  // coût obligatoire : vider un coût -> erreur claire, la saisie n'est pas perdue
  await g.fill('#lignes tbody tr:nth-child(1) input[aria-label^="Coût"]', '');
  await g.click('#btn-enregistrer');
  let err = await erreurSaisie(g);
  L.verifier(/coût unitaire/i.test(err) && /P-0001/.test(err), 'coût manquant : message clair : ' + err);
  L.verifier((await lignes(g)).length === 2 && nbDocs() === 6, 'coût manquant : lignes conservées, aucun document créé');
  await g.fill('#lignes tbody tr:nth-child(1) input[aria-label^="Coût"]', '15,20');
  // quantité invalide
  await g.fill('#lignes tbody tr:nth-child(1) input:not([aria-label^="Coût"])', 'abc');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Quantité invalide/.test(err), 'quantité « abc » : message : ' + err);
  await g.fill('#lignes tbody tr:nth-child(1) input:not([aria-label^="Coût"])', '2');
  // emplacement manquant
  await g.selectOption('#emplacement', '');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Choisissez l'emplacement/.test(err) && (await g.$eval('#emplacement', x => x.classList.contains('is-invalid'))), 'emplacement manquant : message et champ surligné : ' + err);
  await g.selectOption('#emplacement', '1');
  L.verifier(await g.$eval('#emplacement', x => !x.classList.contains('is-invalid')) && await g.$eval('#mv-erreur', x => x.hidden), 'le message disparaît quand on corrige');
  // date future (côté navigateur, puis côté serveur)
  const demain = await g.evaluate(() => { const d = new Date(Date.now() + 86400000 * 3); return d.toISOString().slice(0, 10); });
  await g.fill('#date', demain);
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/futur/.test(err), 'date future refusée : ' + err);
  const rDate = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, date: '2999-01-01', lignes: lignesOk });
  L.verifier(rDate.status === 400 && /futur/.test(rDate.json.erreur), 'date future refusée aussi par le serveur : ' + (rDate.json && rDate.json.erreur));
  const rDate2 = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, date: '31/12/2020', lignes: lignesOk });
  L.verifier(rDate2.status === 400 && /Date invalide/.test(rDate2.json.erreur), 'date mal formée refusée : ' + (rDate2.json && rDate2.json.erreur));
  await g.fill('#date', await g.$eval('#date', x => x.max));

  // enregistrement avec mise à jour des prix
  await g.fill('#lignes tbody tr:nth-child(2) input[aria-label^="Coût"]', '100,00');
  await g.fill('#reference', 'FAC-TEST-1');
  await g.fill('#note', 'Première réception de test');
  await g.check('#maj-prix');
  const avant1 = num(stock(1, 1)), avant4 = num(stock(4, 1));
  await g.click('#btn-enregistrer');
  let ok = await succesSaisie(g);
  L.verifier(/Réception REC-\d{4}-\d{5} enregistrée/.test(ok) && /total 130,40/.test(ok), 'message de succès avec numéro et total : ' + ok);
  const lien = await g.$eval('#mv-succes a', a => a.getAttribute('href'));
  L.verifier(/^index\.php\?page=document_voir&id=\d+$/.test(lien), 'lien vers le document : ' + lien);
  L.verifier((await lignes(g)).length === 0 && (await g.inputValue('#note')) === '' && (await g.inputValue('#reference')) === '' && (await g.inputValue('#fournisseur')) === '', 'formulaire remis à zéro');
  L.verifier(await g.evaluate(() => document.activeElement.id) === 'scan', 'le focus revient dans le champ de scan');
  L.verifier((await g.inputValue('#emplacement')) === '1', 'l\'emplacement est conservé pour la saisie suivante');
  L.verifier(num(stock(1, 1)) === avant1 + 2 && num(stock(4, 1)) === avant4 + 1, 'stock mis à jour (+2 et +1)');
  L.verifier(num(sql("SELECT prix FROM prix_fournisseurs WHERE piece_id=4 AND fournisseur_id=2")) === 100, 'prix du fournisseur mis à jour (P-0004 : 100,00)');
  L.verifier(sql("SELECT reference FROM documents WHERE reference='FAC-TEST-1'") === 'FAC-TEST-1' && sql("SELECT fournisseur_id FROM documents WHERE reference='FAC-TEST-1'") === '2', 'référence et fournisseur enregistrés');
  const docRec1 = parseInt(sql("SELECT id FROM documents WHERE reference='FAC-TEST-1'"), 10);

  // double clic : un seul document
  await g.selectOption('#fournisseur', '1');
  await scan(g, 'P-0002', 1);
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== '');
  await g.fill('#reference', 'FAC-DBL-1');
  await g.dblclick('#btn-enregistrer');
  await succesSaisie(g); await attendre(500);
  L.verifier(nbDocs("reference='FAC-DBL-1'") === 1, 'double clic : un seul document créé (' + nbDocs("reference='FAC-DBL-1'") + ')');
  // double envoi rapide du même jeton (deux requêtes en parallèle) : un seul document, même numéro
  const jeton = 'jeton-test-' + Date.now();
  const charge = { jeton, emplacement_id: 1, reference: 'FAC-DBL-2', lignes: [{ piece_id: 2, quantite: '1', cout_unitaire: '78' }] };
  const doubles = await g.evaluate(async (charge) => {
    const t = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const un = () => fetch('app/action/reception_save.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: JSON.stringify(charge) }).then(r => r.json());
    return Promise.all([un(), un(), un()]);
  }, charge);
  L.verifier(doubles.every(r => r.ok) && new Set(doubles.map(r => r.id)).size === 1 && nbDocs("reference='FAC-DBL-2'") === 1, 'trois envois simultanés du même jeton : un seul document (' + nbDocs("reference='FAC-DBL-2'") + ')');
  L.verifier(doubles.filter(r => r.doublon).length === 2, 'les envois en double sont signalés');
  const sans = await appel(g, 'app/action/reception_save.php', { jeton, emplacement_id: 1, reference: 'FAC-DBL-3', lignes: charge.lignes });
  L.verifier(sans.json.ok && sans.json.doublon === true && nbDocs("reference='FAC-DBL-3'") === 0, 'même jeton réutilisé : renvoie le document déjà créé');

  // quantité décimale avec virgule (pièce vendue au mètre) et point
  await scan(g, 'P-0011', 1);
  await g.fill('#lignes tbody tr:nth-child(1) input:not([aria-label^="Coût"])', '1,5');
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== '');
  const m0 = num(stock(11, 1));
  await g.click('#btn-enregistrer'); await succesSaisie(g);
  L.verifier(Math.abs(num(stock(11, 1)) - (m0 + 1.5)) < 1e-9, 'quantité « 1,5 » : +1,500 m en stock (' + stock(11, 1) + ')');
  const rPoint = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 11, quantite: '2.25', cout_unitaire: '4.85' }] });
  L.verifier(rPoint.json.ok && Math.abs(num(stock(11, 1)) - (m0 + 3.75)) < 1e-9, 'quantité « 2.25 » (point) acceptée aussi');
  const rBad = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 11, quantite: '1,5,5', cout_unitaire: '4' }] });
  L.verifier(rBad.status === 400 && /invalide/i.test(rBad.json.erreur), 'quantité « 1,5,5 » refusée par le serveur : ' + (rBad.json && rBad.json.erreur));
  const rNeg = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 11, quantite: '-1', cout_unitaire: '4' }] });
  L.verifier(rNeg.status === 400 && /supérieure à zéro/.test(rNeg.json.erreur), 'quantité négative refusée en réception : ' + (rNeg.json && rNeg.json.erreur));
  const rSans = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 11, quantite: '1' }] });
  L.verifier(rSans.status === 400 && /coût unitaire est requis/.test(rSans.json.erreur), 'coût manquant refusé par le serveur : ' + (rSans.json && rSans.json.erreur));
  const rVide = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [] });
  L.verifier(rVide.status === 400 && /au moins une pièce/.test(rVide.json.erreur) && rVide.json.champ === 'lignes', 'aucune ligne : message et champ fautif');
  const rLong = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, reference: 'x'.repeat(101), lignes: lignesOk });
  L.verifier(rLong.status === 400 && /100 caractères/.test(rLong.json.erreur), 'référence trop longue : message clair (pas de troncature silencieuse)');
  const rNote = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, note: 'n'.repeat(2001), lignes: lignesOk });
  L.verifier(rNote.status === 400 && /2000 caractères/.test(rNote.json.erreur), 'note trop longue : message clair');
  const rFourn = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, fournisseur_id: 'abc', lignes: lignesOk });
  L.verifier(rFourn.status === 400 && rFourn.json.champ === 'fournisseur_id', 'fournisseur illisible : refusé (pas d\'enregistrement sans fournisseur par erreur)');
  const rTab = await appel(g, 'app/action/reception_save.php', { emplacement_id: [1], lignes: lignesOk });
  L.verifier(rTab.status === 400, 'emplacement_id invalide (tableau) : refus propre');
  const rSql = await appel(g, 'app/action/reception_save.php', { emplacement_id: "1 OR 1=1", lignes: lignesOk });
  L.verifier(rSql.status === 400, 'emplacement_id « 1 OR 1=1 » : refus propre');

  // reception_prix
  const px = await appel(g, 'app/ajax/reception_prix.php?piece_id=1&fournisseur_id=2&emplacement_id=1', null);
  L.verifier(px.json.cout === '15.2000' && px.json.source === 'fournisseur', 'reception_prix : prix du fournisseur');
  const px2 = await appel(g, 'app/ajax/reception_prix.php?piece_id=1&fournisseur_id=3&emplacement_id=1', null);
  L.verifier(px2.json.source === 'moyen' && px2.json.cout !== null, 'reception_prix : à défaut, coût moyen');
  sql("INSERT INTO pieces (code, nom) VALUES ('NEUF-1', 'Pièce sans coût')");
  const idNeuf = parseInt(sql("SELECT id FROM pieces WHERE code='NEUF-1'"), 10);
  const px3 = await appel(g, 'app/ajax/reception_prix.php?piece_id=' + idNeuf + '&fournisseur_id=3&emplacement_id=1', null);
  L.verifier(px3.json.cout === null && px3.json.source === null, 'reception_prix : sinon rien (champ laissé vide)');
  const px4 = await appel(g, 'app/ajax/reception_prix.php?piece_id=0', null);
  L.verifier(px4.status === 400, 'reception_prix : pièce invalide refusée');

  // le coût moyen proposé suit l'entreprise de l'emplacement de réception
  await L.aller(g, 'reception');
  await g.selectOption('#emplacement', '1');
  await scan(g, 'P-0009', 1);
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== '');
  const coutBea = await g.inputValue('#lignes tbody tr input[aria-label^="Coût"]');
  await g.selectOption('#emplacement', '2');
  await g.waitForFunction(v => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== v, coutBea, { timeout: 5000 });
  const coutBch = await g.inputValue('#lignes tbody tr input[aria-label^="Coût"]');
  L.verifier(coutBea === '52,9714' && coutBch === '53,40', 'coût moyen proposé selon l\'entreprise de l\'emplacement : ' + coutBea + ' -> ' + coutBch);
  await g.click('#lignes tbody tr button');

  // =====================================================================================================================
  console.log('3. Erreurs métier : pièce désactivée, emplacement désactivé');
  // =====================================================================================================================
  await L.aller(g, 'reception');
  sql("UPDATE pieces SET actif = 0 WHERE code = 'P-0014'");
  await L.scanner(g, '#scan', 'P-0014');
  await attendreToast(g, 'désactivée');
  L.verifier((await lignes(g)).length === 0, 'scan d\'une pièce désactivée : message clair, aucune ligne ajoutée');
  const rDes = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 14, quantite: '1', cout_unitaire: '5' }] });
  L.verifier(rDes.status === 400 && /désactivée/.test(rDes.json.erreur), 'pièce désactivée refusée par le serveur : ' + (rDes.json && rDes.json.erreur));
  await g.click('.select2-selection'); await g.waitForSelector('.select2-search__field'); await g.fill('.select2-search__field', 'Joint de porte');
  await g.waitForFunction(() => (document.querySelector('.select2-results') || { textContent: '' }).textContent.indexOf('Aucun résultat') !== -1, null, { timeout: 6000 });
  L.verifier(true, 'la recherche ne propose pas une pièce désactivée');
  await g.keyboard.press('Escape');
  sql("UPDATE pieces SET actif = 1 WHERE code = 'P-0014'");
  // pièce désactivée entre le scan et l'enregistrement : le serveur refuse, la saisie reste
  await scan(g, 'P-0013', 1);
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== '');
  sql("UPDATE pieces SET actif = 0 WHERE code = 'P-0013'");
  await g.selectOption('#emplacement', '1');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/« P-0013 » est désactivée/.test(err) && (await lignes(g)).length === 1, 'pièce désactivée après le scan : erreur du serveur affichée, saisie conservée : ' + err);
  sql("UPDATE pieces SET actif = 1 WHERE code = 'P-0013'");
  await g.click('#lignes tbody tr button');

  sql("UPDATE emplacements SET actif = 0 WHERE id = 5");
  await L.aller(g, 'reception');
  const optEmp = await g.$$eval('#emplacement option', o => o.map(x => x.value));
  L.verifier(!optEmp.includes('5') && optEmp.includes('2'), 'emplacement désactivé : absent de la liste');
  await L.scanner(g, '#scan', 'EMP-000005');
  await attendreToast(g, 'désactivé');
  L.verifier(await g.$eval('#emplacement', x => x.value) !== '5', 'scan d\'un emplacement désactivé : refusé avec un message');
  const rEmpDes = await appel(g, 'app/action/reception_save.php', { emplacement_id: 5, lignes: lignesOk });
  L.verifier(rEmpDes.status === 400 && /désactivé/.test(rEmpDes.json.erreur), 'emplacement désactivé refusé par le serveur : ' + (rEmpDes.json && rEmpDes.json.erreur));
  sql("UPDATE emplacements SET actif = 1 WHERE id = 5");
  await L.scanner(g, '#scan', 'INCONNU-123');
  await attendreToast(g, 'Code inconnu');
  L.verifier(true, 'code inconnu : message clair');
  await L.scanner(g, '#scan', 'EMP-999999');
  await attendreToast(g, 'Emplacement inconnu');
  L.verifier(true, 'code d\'emplacement inconnu : message clair');

  // =====================================================================================================================
  console.log('4. Transfert');
  // =====================================================================================================================
  await L.aller(g, 'transfert');
  await g.selectOption('#emplacement', '1');
  const destGroupes = await g.$$eval('#destination optgroup', o => o.map(x => x.label));
  const destOpts = await g.$$eval('#destination option', o => o.map(x => x.value));
  L.verifier(destGroupes.join('|') === 'Beauchemin' && !destOpts.includes('1') && !destOpts.includes('2') && !destOpts.includes('5') && destOpts.includes('3') && destOpts.includes('4'),
    'destination : même entreprise que la source, sans la source : ' + destOpts.join(','));
  await g.selectOption('#emplacement', '2');
  const destOpts2 = await g.$$eval('#destination option', o => o.map(x => x.value));
  L.verifier(destOpts2.includes('5') && !destOpts2.includes('3') && !destOpts2.includes('2'), 'source de l\'entreprise 2 : destinations de l\'entreprise 2 seulement : ' + destOpts2.join(','));
  await g.selectOption('#emplacement', '1');
  await g.selectOption('#destination', '3');
  await g.selectOption('#emplacement', '3');
  L.verifier((await g.$$eval('#destination option', o => o.map(x => x.value))).includes('1') && await g.inputValue('#destination') === '', 'si la destination devient la source, elle est retirée de la liste et le choix est vidé');
  await g.selectOption('#emplacement', '1');
  // scan : source déjà choisie -> le code d'emplacement suivant remplit la destination ; autre entreprise refusée
  await L.scanner(g, '#scan', 'EMP-000005'); await attendreToast(g, 'utilisez une facture interne');
  L.verifier(await g.inputValue('#destination') === '', 'scan d\'un emplacement d\'une autre entreprise : refusé avec un message clair');
  await L.scanner(g, '#scan', 'EMP-000001'); await attendreToast(g, 'déjà la source');
  await L.scanner(g, '#scan', 'EMP-000004');
  await g.waitForFunction(() => document.getElementById('destination').value === '4');
  L.verifier(true, 'scan d\'un code EMP-… : remplit la destination');
  await scan(g, 'P-0001', 1); await scan(g, 'P-0009', 2);
  l = await lignes(g);
  const th = await g.$$eval('#lignes thead th', t => t.map(x => x.textContent.trim()));
  L.verifier(th.join('|') === 'Code|Pièce|Disponible|Quantité|', 'colonnes du transfert : ' + th.join('|'));
  L.verifier(num(l[0][2]) === num(stock(1, 1)) && num(l[1][2]) === num(stock(9, 1)), 'colonne « Disponible » = stock à la source : ' + JSON.stringify([l[0][2], l[1][2]]));
  // stock insuffisant : erreur claire, saisie conservée
  await g.fill('#lignes tbody tr:nth-child(1) input', '999');
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr td:nth-child(3)').className.indexOf('text-danger') !== -1);
  L.verifier(true, 'quantité > disponible : la cellule « Disponible » est marquée en rouge');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Stock insuffisant pour « P-0001/.test(err) && /disponible/.test(err), 'stock insuffisant : message clair : ' + err);
  L.verifier((await lignes(g)).length === 2 && (await g.inputValue('#destination')) === '4' && nbDocs("type='transfert'") === 1, 'stock insuffisant : saisie conservée, aucun document créé');
  const s1 = num(stock(1, 1)), s1d = num(stock(1, 4));
  await g.fill('#lignes tbody tr:nth-child(1) input', '2');
  await g.fill('#note', 'Plein de cube de test');
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(/Transfert TRF-\d{4}-\d{5} enregistré\./.test(ok.replace(/ Voir le document/, '')) || /Transfert TRF-\d{4}-\d{5} enregistré/.test(ok), 'succès du transfert : ' + ok);
  L.verifier(num(stock(1, 1)) === s1 - 2 && num(stock(1, 4)) === s1d + 2, 'transfert : -2 à la source, +2 à la destination');
  L.verifier(await g.inputValue('#emplacement') === '1' && await g.inputValue('#destination') === '4' && await g.evaluate(() => document.activeElement.id) === 'scan', 'transfert : source/destination conservées, focus dans le scan');
  const docTrf = parseInt(sql("SELECT MAX(id) FROM documents WHERE type='transfert'"), 10);
  // transfert entre entreprises, source = destination : refusés par le serveur
  const rTE = await appel(g, 'app/action/transfert_save.php', { emplacement_id: 1, emplacement_dest_id: 5, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(rTE.status === 400 && /facture interne/.test(rTE.json.erreur), 'transfert entre entreprises refusé : ' + (rTE.json && rTE.json.erreur));
  const rTS = await appel(g, 'app/action/transfert_save.php', { emplacement_id: 1, emplacement_dest_id: 1, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(rTS.status === 400 && /différentes/.test(rTS.json.erreur), 'transfert source = destination refusé : ' + (rTS.json && rTS.json.erreur));
  const rTD = await appel(g, 'app/action/transfert_save.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '1' }] });
  L.verifier(rTD.status === 400 && rTD.json.champ === 'emplacement_dest_id', 'transfert sans destination : refusé, champ désigné');
  // un employé : transfert dans son entreprise, sans aucun coût visible
  await L.aller(e, 'transfert');
  L.verifier((await e.$$eval('#emplacement optgroup', o => o.map(x => x.label))).join('|') === 'Beauchemin', 'employé : seulement les emplacements de son entreprise');
  await scan(e, 'P-0005', 1);
  L.verifier(!(await e.textContent('.content-wrapper')).match(/Coût|\d\s?\$/), 'employé : aucun coût ni montant dans la page de transfert');
  await e.selectOption('#emplacement', '1'); await e.selectOption('#destination', '3');
  await e.click('#btn-enregistrer'); ok = await succesSaisie(e);
  L.verifier(!/\$/.test(ok), 'employé : le message de succès ne montre aucun montant : ' + ok);
  const rEmpTrf = await appel(e, 'app/action/transfert_save.php', { emplacement_id: 1, emplacement_dest_id: 3, lignes: [{ piece_id: 5, quantite: '1' }] });
  L.verifier(rEmpTrf.json.ok && rEmpTrf.json.total === undefined && !/total/.test(rEmpTrf.texte), 'employé : la réponse JSON de transfert_save ne contient aucun montant : ' + rEmpTrf.texte);

  // =====================================================================================================================
  console.log('5. Sortie');
  // =====================================================================================================================
  await L.aller(g, 'sortie&emplacement_id=3');
  L.verifier(await g.inputValue('#emplacement') === '3', 'prérenseignement &emplacement_id=3');
  const motifs = await optionsTexte(g, '#motif');
  L.verifier(motifs.join('|') === '— Choisissez —|Service / réparation|Installation|Perte / bris|Retour au fournisseur|Autre', 'motifs de sortie : ' + motifs.join('|'));
  await scan(g, 'P-0003', 1);
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/motif/.test(err) && await g.$eval('#motif', x => x.classList.contains('is-invalid')), 'motif manquant : message clair : ' + err);
  await g.selectOption('#motif', 'service');
  await g.fill('#reference', 'BT-77001');
  await g.fill('#lignes tbody tr:nth-child(1) input', '50');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Stock insuffisant pour « P-0003/.test(err) && /Cube 12/.test(err), 'sortie : stock insuffisant : ' + err);
  L.verifier(nbDocs("type='sortie'") === 1 && (await lignes(g)).length === 1 && await g.inputValue('#reference') === 'BT-77001', 'sortie : saisie conservée après l\'erreur');
  const s3 = num(stock(3, 3));
  await g.fill('#lignes tbody tr:nth-child(1) input', '1');
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(/Sortie SOR-\d{4}-\d{5} enregistrée/.test(ok), 'sortie : succès : ' + ok);
  L.verifier(num(stock(3, 3)) === s3 - 1 && sql("SELECT CONCAT(motif,'|',reference) FROM documents WHERE type='sortie' ORDER BY id DESC LIMIT 1") === 'service|BT-77001', 'sortie : stock -1, motif et bon de travail enregistrés');
  L.verifier(await g.inputValue('#motif') === 'service' && await g.inputValue('#reference') === '', 'sortie : motif conservé, bon de travail remis à zéro');
  const rSortie = await appel(g, 'app/action/sortie_save.php', { emplacement_id: 3, motif: 'inventé', lignes: [{ piece_id: 3, quantite: '1' }] });
  L.verifier(rSortie.status === 400 && rSortie.json.champ === 'motif', 'motif inconnu refusé par le serveur');
  const rSortie2 = await appel(g, 'app/action/sortie_save.php', { emplacement_id: 3, motif: 'perte', lignes: [{ piece_id: 3, quantite: '0' }] });
  L.verifier(rSortie2.status === 400, 'quantité zéro refusée');
  await L.aller(e, 'sortie');
  await e.selectOption('#emplacement', '3'); await e.selectOption('#motif', 'installation');
  await scan(e, 'P-0011', 1); await e.fill('#lignes tbody tr:nth-child(1) input', '2,5');
  await e.click('#btn-enregistrer'); ok = await succesSaisie(e);
  L.verifier(/Sortie SOR/.test(ok) && !/\$/.test(ok), 'employé : sortie enregistrée sans montant : ' + ok);
  L.verifier(num(stock(11, 3)) === 17.5, 'employé : sortie de 2,5 m (virgule) : reste ' + stock(11, 3));

  // parcours à la souris et au clavier (sans scanner) : recherche par nom, quantité, Entrée, bouton
  await L.aller(g, 'sortie');
  await g.selectOption('#emplacement', '1'); await g.selectOption('#motif', 'perte');
  await g.click('.select2-selection'); await g.waitForSelector('.select2-search__field'); await g.fill('.select2-search__field', 'gicleur');
  await g.waitForSelector('.select2-results__option:has-text("P-0003")'); await g.click('.select2-results__option:has-text("P-0003")');
  await attendreLignes(g, 1);
  L.verifier(await g.evaluate(() => document.activeElement.id) === 'scan', 'recherche par nom : la ligne est ajoutée et le focus revient dans le champ de scan');
  await g.fill('#lignes tbody tr:nth-child(1) input', '2');
  await g.press('#lignes tbody tr:nth-child(1) input', 'Enter');
  L.verifier(await g.evaluate(() => document.activeElement.id) === 'scan' && nbDocs("type='sortie'") === 3, 'Entrée dans une quantité : retour au champ de scan, rien n\'est enregistré par erreur');
  const sP3 = num(stock(3, 1));
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(/Sortie SOR/.test(ok) && num(stock(3, 1)) === sP3 - 2, 'parcours à la souris : sortie enregistrée (-2)');
  // réseau coupé : message clair, saisie conservée, bouton réactivé ; le renvoi ne crée qu'un seul document
  await L.aller(g, 'sortie');
  await g.selectOption('#emplacement', '1'); await g.selectOption('#motif', 'autre'); await g.fill('#reference', 'BT-HORS-LIGNE');
  await scan(g, 'P-0002', 1);
  const erreursAvant = g.erreurs.length;
  await g.context().setOffline(true);
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  await g.context().setOffline(false);
  g.erreurs.splice(erreursAvant);      // les erreurs réseau volontaires de cette coupure ne comptent pas dans la vérification finale de la console
  L.verifier(/Connexion au serveur impossible/.test(err) && !/Failed|fetch/i.test(err) && (await lignes(g)).length === 1 && !(await g.$eval('#btn-enregistrer', x => x.disabled)), 'réseau coupé : message en français, saisie conservée, bouton réactivé : ' + err);
  L.verifier(nbDocs("reference='BT-HORS-LIGNE'") === 0, 'réseau coupé : rien d\'enregistré');
  await g.click('#btn-enregistrer'); await succesSaisie(g);
  L.verifier(nbDocs("reference='BT-HORS-LIGNE'") === 1, 'le renvoi après la coupure crée un seul document');
  // retrait d'une ligne à la souris
  await scan(g, 'P-0001', 1); await scan(g, 'P-0002', 2);
  await g.click('#lignes tbody tr:nth-child(1) button'); await attendreLignes(g, 1);
  L.verifier((await lignes(g))[0][0] === 'P-0002' && /1 ligne/.test(await g.textContent('#mv-resume')), 'retrait d\'une ligne : liste et résumé à jour');
  await g.click('#lignes tbody tr:nth-child(1) button');

  // =====================================================================================================================
  console.log('6. Ajustement (gestionnaire)');
  // =====================================================================================================================
  await L.aller(g, 'ajustement&piece_id=2&emplacement_id=3');
  l = await lignes(g);
  L.verifier(l.length === 1 && l[0][0] === 'P-0002' && l[0][2] === '1', 'prérenseignement &piece_id=2 : une ligne P-0002, quantité 1 : ' + JSON.stringify(l));
  L.verifier(await g.inputValue('#emplacement') === '3', 'prérenseignement &emplacement_id=3');
  const thA = await g.$$eval('#lignes thead th', t => t.map(x => x.textContent.trim()));
  L.verifier(thA.join('|') === 'Code|Pièce|Quantité|Coût unitaire|Total|', 'colonnes de l\'ajustement : ' + thA.join('|'));
  await scan(g, 'P-0001', 2);
  await g.fill('#lignes tbody tr:nth-child(1) input:not([aria-label^="Coût"])', '2');
  await g.fill('#lignes tbody tr:nth-child(1) input[aria-label^="Coût"]', '80,00');
  await g.fill('#lignes tbody tr:nth-child(2) input:not([aria-label^="Coût"])', '-1');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/motif/.test(err), 'ajustement : motif manquant : ' + err);
  await g.selectOption('#motif', 'correction');
  await g.fill('#lignes tbody tr:nth-child(2) input:not([aria-label^="Coût"])', '0');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/ne peut pas être zéro/.test(err), 'ajustement : variation zéro refusée : ' + err);
  await g.fill('#lignes tbody tr:nth-child(2) input:not([aria-label^="Coût"])', '-999');
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Stock insuffisant pour « P-0001/.test(err) && (await lignes(g)).length === 2, 'ajustement négatif trop grand : stock insuffisant, saisie conservée : ' + err);
  await g.fill('#lignes tbody tr:nth-child(2) input:not([aria-label^="Coût"])', '-1');
  await g.fill('#lignes tbody tr:nth-child(2) input[aria-label^="Coût"]', 'pas-un-coût');   // sans effet sur une ligne négative
  const a2 = num(stock(2, 3)), a1 = num(stock(1, 3));
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(/Ajustement AJU-\d{4}-\d{5} enregistré/.test(ok), 'ajustement : succès : ' + ok);
  L.verifier(num(stock(2, 3)) === a2 + 2 && num(stock(1, 3)) === a1 - 1, 'ajustement : +2 (P-0002) et -1 (P-0001) à Cube 12');
  L.verifier(sql("SELECT cout_unitaire FROM document_lignes l JOIN documents d ON d.id=l.document_id WHERE d.type='ajustement' AND l.piece_id=2 ORDER BY l.id DESC LIMIT 1") === '80.0000', 'ajustement : coût facultatif utilisé pour la ligne positive');
  const docAju = parseInt(sql("SELECT MAX(id) FROM documents WHERE type='ajustement'"), 10);
  const rAju = await appel(g, 'app/action/ajustement_save.php', { emplacement_id: 3, motif: 'comptage', lignes: [{ piece_id: 1, quantite: '+1' }] });
  L.verifier(rAju.json.ok && num(stock(1, 3)) === a1, 'quantité signée « +1 » acceptée par le serveur');

  // =====================================================================================================================
  console.log('7. Liste des documents');
  // =====================================================================================================================
  let t = await ouvrirDocuments(g);
  const entetes = await g.$$eval('#table-documents thead th', x => x.map(c => c.textContent.trim()));
  L.verifier(entetes.join('|') === 'Numéro|Type|Date|Entreprise|Emplacement(s)|Utilisateur|Total|Statut', 'colonnes (gestionnaire) : ' + entetes.join('|'));
  const total1 = nbDocs();
  L.verifier(new RegExp('de ' + total1 + ' documents').test(t.info), 'info : ' + t.info + ' (SQL : ' + total1 + ')');
  L.verifier(/^REC-|^AJU-|^TRF-|^SOR-/.test(t.rows[0]), 'le plus récent d\'abord : ' + t.rows[0].slice(0, 30));
  const premierLien = await g.$eval('#table-documents tbody tr:first-child a', a => a.getAttribute('href'));
  L.verifier(/^index\.php\?page=document_voir&id=\d+$/.test(premierLien), 'le numéro est un lien : ' + premierLien);
  // filtres
  await g.selectOption('#f-type', 'reception'); t = await tableau(g);
  L.verifier(t.rows.length === Math.min(25, nbDocs("type='reception'")) && t.rows.every(r => /Réception/.test(r)), 'filtre par type : ' + t.info);
  await g.selectOption('#f-type', ''); await g.selectOption('#f-entreprise', '2'); t = await tableau(g);
  const nbEnt2 = nbDocs('entreprise_id = 2 OR entreprise_dest_id = 2');
  L.verifier(new RegExp('de ' + nbEnt2 + ' documents').test(t.info), 'filtre par entreprise (émettrice ou destinataire) : ' + t.info + ' (SQL : ' + nbEnt2 + ')');
  await g.selectOption('#f-entreprise', '');
  await g.fill('#f-recherche', 'FAC-88421'); t = await tableau(g);
  L.verifier(t.rows.length === 1 && /REC-/.test(t.rows[0]), 'recherche par référence du fournisseur : ' + t.info);
  await g.fill('#f-recherche', 'Gaz du Nord'); t = await tableau(g);
  L.verifier(t.rows.length >= 2 && t.rows.every(r => /Réception/.test(r)), 'recherche par fournisseur : ' + t.info);
  await g.fill('#f-recherche', 'Plein de cube'); t = await tableau(g);
  L.verifier(t.rows.length >= 2 && !t.vide, 'recherche par note : ' + t.info);
  await g.fill('#f-recherche', 'TRF-2026-00001'); t = await tableau(g);
  L.verifier(t.rows.length === 1, 'recherche par numéro : ' + t.info);
  await g.fill('#f-recherche', "x' OR '1'='1"); t = await tableau(g);
  L.verifier(t.vide, 'recherche avec apostrophes : aucun résultat, aucune erreur');
  await g.fill('#f-recherche', '%'); t = await tableau(g);
  L.verifier(t.vide, 'recherche « % » : le joker est échappé');
  await g.fill('#f-recherche', '');
  await g.selectOption('#f-statut', 'annule'); t = await tableau(g);
  L.verifier(t.vide, 'filtre « Annulés » : aucun document annulé pour l\'instant');
  await g.selectOption('#f-statut', 'valide'); t = await tableau(g);
  L.verifier(!t.vide, 'filtre « Valides »');
  await g.selectOption('#f-statut', '');
  await g.fill('#f-du', '2999-01-01'); t = await tableau(g);
  L.verifier(t.vide, 'plage de dates : rien après 2999');
  await g.fill('#f-du', '2000-01-01'); await g.fill('#f-au', '2000-12-31'); t = await tableau(g);
  L.verifier(t.vide, 'plage de dates : rien en 2000');
  await g.fill('#f-au', await g.$eval('#f-au', x => x.value) && new Date().toISOString().slice(0, 10)); t = await tableau(g);
  L.verifier(!t.vide, 'plage de dates 2000 -> aujourd\'hui : les documents réapparaissent : ' + t.info);
  await g.click('#f-effacer'); t = await tableau(g);
  L.verifier(await g.inputValue('#f-du') === '' && new RegExp('de ' + total1 + ' documents').test(t.info), 'effacer les filtres');
  // tri sur chaque colonne : aucune erreur de chargement
  await viderToasts(g);
  for (let c = 1; c <= 8; c++) { await g.click('#table-documents thead th:nth-child(' + c + ')'); await tableau(g); }
  L.verifier(!(await toastTexte(g)).includes('Impossible de charger'), 'tri sur chacune des 8 colonnes : aucune erreur de chargement');
  await g.click('#table-documents thead th:nth-child(3)'); await tableau(g);
  // préremplissage par l'adresse (filtres) et valeurs hostiles
  t = await ouvrirDocuments(g, '&type=sortie&statut=valide');
  L.verifier(await g.inputValue('#f-type') === 'sortie' && t.rows.every(r => /Sortie/.test(r)), 'filtres reçus par l\'adresse');
  t = await ouvrirDocuments(g, '&type=%27%22%3E&statut=%3Cx%3E&du=pas-une-date&q=%3Cscript%3Ewindow.__y%3D1%3C%2Fscript%3E');
  L.verifier(await g.evaluate(() => window.__y) === undefined && await g.inputValue('#f-type') === '', 'paramètres d\'adresse hostiles : sans effet');
  // clic sur la ligne : ouvre le document
  await L.aller(g, 'documents'); await tableau(g);
  await g.click('#table-documents tbody tr:first-child td:nth-child(4)');
  await g.waitForURL(/page=document_voir&id=\d+/);
  L.verifier(true, 'clic sur une ligne : ouvre le document');

  // employé : colonne « Total » absente (HTML et JSON), documents de son entreprise seulement
  t = await ouvrirDocuments(e);
  const entEmp = await e.$$eval('#table-documents thead th', x => x.map(c => c.textContent.trim()));
  L.verifier(entEmp.join('|') === 'Numéro|Type|Date|Entreprise|Emplacement(s)|Utilisateur|Statut', 'employé : colonnes sans « Total » : ' + entEmp.join('|'));
  L.verifier(!/Total/.test(await e.textContent('.content-wrapper')) && !/\d\s?\$/.test(await e.textContent('#table-documents')), 'employé : aucun montant ni « Total » dans la page des documents');
  const rawEmp = await liste(e, { draw: '1', start: '0', length: '100' });
  L.verifier(rawEmp.status === 200 && !/"total"/.test(rawEmp.texte) && !/\d\s?\$/.test(rawEmp.texte), 'employé : aucun « total » dans le JSON brut');
  const nbEmp = nbDocs('entreprise_id = 1 OR entreprise_dest_id = 1');
  L.verifier(rawEmp.json.recordsTotal === nbEmp && !rawEmp.texte.includes('REC-' + new Date().getFullYear() + '-00002"') && !rawEmp.json.data.some(d => /00002</.test(d.numero) && /REC-/.test(d.numero)), 'employé : documents de l\'entreprise 1 seulement (' + rawEmp.json.recordsTotal + ' sur ' + nbEmp + ')');
  const triTotal = await liste(e, { draw: '2', start: '0', length: '10', 'order[0][column]': '6', 'order[0][dir]': 'desc', 'columns[6][data]': 'total' });
  L.verifier(triTotal.status === 200 && !/"total"/.test(triTotal.texte), 'employé : tri forcé sur « total » : ignoré, rien n\'est révélé');
  const rawG = await liste(g, { draw: '1', start: '0', length: '100' });
  L.verifier(rawG.json.recordsTotal === total1 && /"total"/.test(rawG.texte), 'gestionnaire : le JSON contient « total »');
  const g2liste = await liste(g2, { draw: '1', start: '0', length: '100' });
  L.verifier(g2liste.json.recordsTotal === nbDocs('entreprise_id = 2 OR entreprise_dest_id = 2'), 'gestionnaire de l\'entreprise 2 : ses documents seulement (' + g2liste.json.recordsTotal + ')');
  const forceEnt = await liste(e, { draw: '1', start: '0', length: '100', entreprise_id: '2' });
  L.verifier(forceEnt.json.recordsFiltered === 0 && forceEnt.json.data.length === 0, 'employé : filtre forcé sur l\'entreprise 2 : aucun résultat');
  const injection = await liste(g, { draw: '1', start: '0', length: '10', type: "reception' OR '1'='1", statut: "valide' --", du: "2020-01-01' OR 1=1" });
  L.verifier(injection.status === 200 && injection.json.data.length === 0, 'filtres avec injection SQL : aucun résultat, aucune erreur');

  // session expirée : le tableau renvoie à la page de connexion
  {
    const ctxExp = await b.newContext();
    const pe = suivre(await ctxExp.newPage());
    await pe.goto(L.BASE + '/login.php'); await pe.fill('input[name=username]', 'gestionnaire1'); await pe.fill('input[name=password]', MDP);
    await Promise.all([pe.waitForNavigation(), pe.click('button[type=submit]')]);
    await L.aller(pe, 'documents'); await tableau(pe);
    await ctxExp.clearCookies();
    await pe.selectOption('#f-type', 'sortie');
    await pe.waitForURL(/login\.php/, { timeout: 8000 }).catch(() => {});
    L.verifier(/login\.php/.test(pe.url()), 'session expirée : la liste des documents renvoie à la connexion : ' + pe.url());
    await ctxExp.close();
  }

  // =====================================================================================================================
  console.log('8. Détail d\'un document, annulation, impression');
  // =====================================================================================================================
  await L.aller(g, 'document_voir&id=' + docRec1);
  L.verifier((await g.textContent('h1')).trim().startsWith('REC-'), 'titre = numéro du document');
  const dt = await texteNorm(g, '.mv-entete');
  L.verifier(/Grossiste Gaz du Nord/.test(dt) && /FAC-TEST-1/.test(dt) && /Première réception de test/.test(dt) && /N° de facture du fournisseur/.test(dt), 'en-tête : fournisseur, référence, note : ' + dt);
  const th2 = await g.$$eval('#table-lignes thead th', x => x.map(c => c.textContent.trim()));
  L.verifier(th2.join('|') === 'Code|Pièce|Quantité|Coût unitaire|Total', 'lignes (gestionnaire) avec coûts : ' + th2.join('|'));
  L.verifier(/130,40/.test(await texteNorm(g, '#total-document')), 'total du document : ' + await texteNorm(g, '#total-document'));
  const nbMouv = await g.$$eval('#table-mouvements tbody tr', r => r.length);
  L.verifier(nbMouv === 2, 'mouvements créés : 2 lignes');
  L.verifier((await g.$$('#btn-annuler')).length === 1 && (await g.$$('#btn-imprimer')).length === 1, 'boutons Annuler et Imprimer présents');
  await g.evaluate(() => { window.print = () => { window.__imprime = true; }; });
  await g.click('#btn-imprimer');
  L.verifier(await g.evaluate(() => window.__imprime === true), 'le bouton Imprimer déclenche l\'impression');
  // impression : menu et boutons masqués
  await g.emulateMedia({ media: 'print' });
  L.verifier(await g.$eval('.main-sidebar', x => getComputedStyle(x).display) === 'none' && await g.$eval('#btn-annuler', x => getComputedStyle(x).display) === 'none', 'impression : menu et boutons masqués');
  L.verifier(await g.$eval('.mv-impression-entete', x => getComputedStyle(x).display) !== 'none', 'impression : entête d\'impression visible');
  await g.emulateMedia({ media: 'screen' });

  // annulation : motif obligatoire, fenêtre de confirmation
  const sAvant1 = num(stock(1, 1));
  await g.click('#btn-annuler');
  await g.waitForSelector('#modal-annuler.show');
  L.verifier(/Annuler le document REC-/.test(await texteNorm(g, '#modal-annuler-titre')), 'fenêtre de confirmation ouverte');
  await g.click('#annuler-confirmer');
  L.verifier(/motif/i.test(await texteNorm(g, '#annuler-erreur')) && !(await g.$eval('#annuler-erreur', x => x.hidden)), 'annulation sans motif : message');
  L.verifier(nbDocs("statut='annule'") === 0, 'annulation sans motif : rien d\'annulé');
  await g.fill('#annuler-motif', 'Erreur de saisie <b>test</b>');
  await Promise.all([g.waitForNavigation(), g.click('#annuler-confirmer')]);
  await g.waitForSelector('#bandeau-annule');
  const bandeau = await texteNorm(g, '#bandeau-annule');
  L.verifier(/ANNULÉ/.test(bandeau) && /Erreur de saisie <b>test<\/b>/.test(bandeau) && /gestionnaire1/.test(bandeau) && /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(bandeau), 'badge ANNULÉ avec motif, auteur et date : ' + bandeau);
  L.verifier((await g.$$('#bandeau-annule b')).length === 0, 'le motif est échappé (pas de HTML injecté)');
  L.verifier((await g.$$('#btn-annuler')).length === 0, 'plus de bouton Annuler sur un document annulé');
  L.verifier(num(stock(1, 1)) === sAvant1 - 2, 'annulation : le stock est repris (-2)');
  L.verifier((await g.$$eval('#table-mouvements tbody tr', r => r.length)) === 4 && (await g.$$('#table-mouvements .badge-danger')).length === 2, 'mouvements d\'annulation affichés');
  L.verifier(/ANNULÉ/.test(await g.textContent('.mv-document')), 'badge ANNULÉ dans l\'en-tête du document');
  const dejaAnnule = await appel(g, 'app/action/document_annuler.php', { id: docRec1, motif: 'encore' });
  L.verifier(dejaAnnule.status === 400 && /déjà annulé/.test(dejaAnnule.json.erreur), 'annuler deux fois : refusé : ' + dejaAnnule.json.erreur);
  t = await ouvrirDocuments(g, '&statut=annule');
  L.verifier(t.rows.length === 1 && /ANNULÉ/.test(t.rows[0]), 'la liste montre le document annulé : ' + t.info);
  // annulation refusée si le stock n'est plus là : réception, puis transfert de ces pièces, puis annulation
  const rr = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, reference: 'FAC-ANN-2', lignes: [{ piece_id: 6, quantite: '5', cout_unitaire: '12' }] });
  const idAnn2 = rr.json.id;
  const stockP6 = num(stock(6, 1));
  await appel(g, 'app/action/transfert_save.php', { emplacement_id: 1, emplacement_dest_id: 4, lignes: [{ piece_id: 6, quantite: String(stockP6) }] });   // on vide l'entrepôt de cette pièce
  await L.aller(g, 'document_voir&id=' + idAnn2);
  await g.click('#btn-annuler'); await g.waitForSelector('#modal-annuler.show');
  await g.fill('#annuler-motif', 'Test d\'annulation impossible');
  await g.click('#annuler-confirmer');
  await g.waitForSelector('#annuler-erreur:not([hidden])');
  const errAnn = await texteNorm(g, '#annuler-erreur');
  L.verifier(/Stock insuffisant/.test(errAnn) && await g.$eval('#modal-annuler', x => x.classList.contains('show')), 'annulation impossible : message du service dans la fenêtre, fenêtre ouverte : ' + errAnn);
  L.verifier(sql("SELECT statut FROM documents WHERE id=" + idAnn2) === 'valide', 'annulation impossible : le document reste valide');
  await g.click('#annuler-retour'); await g.waitForSelector('#modal-annuler', { state: 'hidden' });
  // un ajustement ne s'annule pas (pas de bouton, refus du serveur)
  await L.aller(g, 'document_voir&id=' + docAju);
  L.verifier((await g.$$('#btn-annuler')).length === 0 && /ne s'annule pas/.test(await g.textContent('.mv-barre')), 'ajustement : pas de bouton Annuler, explication donnée');
  const annAju = await appel(g, 'app/action/document_annuler.php', { id: docAju, motif: 'x' });
  L.verifier(annAju.status === 400 && /ne s'annule pas/.test(annAju.json.erreur), 'ajustement : annulation refusée par le serveur : ' + annAju.json.erreur);
  L.verifier(/Correction/.test(await texteNorm(g, '.mv-entete')) && /\+2/.test(await texteNorm(g, '#table-lignes')) && /-1/.test(await texteNorm(g, '#table-lignes')), 'ajustement : motif et quantités signées affichés');
  // annulation sans motif / motif trop long par POST direct
  const annSans = await appel(g, 'app/action/document_annuler.php', { id: docTrf, motif: '   ' });
  L.verifier(annSans.status === 400 && annSans.json.champ === 'motif', 'POST direct sans motif : refusé');
  const annLong = await appel(g, 'app/action/document_annuler.php', { id: docTrf, motif: 'm'.repeat(300) });
  L.verifier(annLong.status === 400 && /255/.test(annLong.json.erreur), 'POST direct avec un motif trop long : message clair');
  L.verifier(sql("SELECT statut FROM documents WHERE id=" + docTrf) === 'valide', 'ces refus n\'ont rien annulé');
  // employé : détail sans coût, sans bouton d'annulation, annulation refusée par POST
  await L.aller(e, 'document_voir&id=' + docTrf);
  const htmlEmp = await e.content();
  L.verifier(!/Coût unitaire/.test(htmlEmp) && !/\d\s?\$/.test(await e.textContent('.content-wrapper')), 'employé : détail du document sans coût ni montant');
  L.verifier((await e.$$('#btn-annuler')).length === 0 && (await e.$$('#modal-annuler')).length === 0, 'employé : ni bouton ni fenêtre d\'annulation');
  const empAnn = await appel(e, 'app/action/document_annuler.php', { id: docTrf, motif: 'test' });
  L.verifier(empAnn.status === 403 && sql("SELECT statut FROM documents WHERE id=" + docTrf) === 'valide', 'employé : annulation par POST refusée (403)');
  L.verifier((await e.$$('#table-mouvements')).length === 1, 'employé : voit les mouvements créés (sans coût)');
  // facture interne : gestionnaire redirigé vers le module C ; employé voit le détail sans coûts ni nom de l'autre entreprise
  await neg.goto(L.BASE + '/index.php?page=document_voir&id=5'); await neg.waitForLoadState('networkidle');   // page sacrifiée : le module C est hors de ma portée
  L.verifier(/page=facture_interne_voir&id=5$/.test(neg.url()), 'facture interne : redirection vers facture_interne_voir : ' + neg.url());
  await L.aller(e, 'document_voir&id=5');
  const fin = await texteNorm(e, '.content-wrapper');
  L.verifier(/FIN-/.test(fin) && /Facture interne/.test(fin) && !/Boutique Centre-ville/.test(fin) && /Autre entreprise/.test(fin) && !/\d\s?\$/.test(fin), 'employé : facture interne sans coûts ; l\'emplacement de l\'autre entreprise est masqué');
  await L.aller(e, 'document_voir&id=6');
  const fin2 = await texteNorm(e, '.content-wrapper');
  L.verifier(/FIN-/.test(fin2) && /Autre entreprise/.test(fin2) && /Cube 14/.test(fin2) && !/\d\s?\$/.test(fin2), 'employé : facture reçue de l\'autre entreprise : l\'emplacement émetteur est masqué, le sien est visible : ' + fin2.slice(0, 220));

  // =====================================================================================================================
  console.log('9. Texte hostile (XSS) : réception, listes, détail');
  // =====================================================================================================================
  sql("INSERT INTO pieces (code, nom) VALUES ('XSS-1', '" + XSS_PIECE + "')");
  sql("INSERT INTO fournisseurs (nom) VALUES ('<img src=x onerror=alert(2)>')");
  sql("UPDATE emplacements SET nom = '<b>Cube</b> \"X\" <img src=x onerror=alert(3)>' WHERE id = 4");
  const idX = parseInt(sql("SELECT id FROM fournisseurs WHERE nom LIKE '<img%'"), 10);
  const nbDial = dialogues.length;
  await L.aller(g, 'reception');
  L.verifier((await g.$$eval('#emplacement option', o => o.map(x => x.textContent))).some(x => x.includes('<img src=x onerror=alert(3)>')), 'nom d\'emplacement hostile : affiché en texte dans la liste');
  await g.selectOption('#emplacement', '4');
  await g.selectOption('#fournisseur', String(idX));
  await scan(g, 'XSS-1', 1);
  await g.fill('#lignes tbody tr:nth-child(1) input[aria-label^="Coût"]', '1,00');
  await g.fill('#reference', '<script>window.__x=1</script>');
  await g.fill('#note', '<img src=x onerror=alert(4)> & "note"');
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(await g.evaluate(() => window.__x) === undefined && (await g.$$('#mv-succes img')).length === 0, 'XSS : message de succès inerte');
  await g.click('#mv-succes a');
  await g.waitForURL(/document_voir/);
  const htmlDoc = await g.content();
  L.verifier((await g.$$('.content-wrapper img[src="x"], #table-lignes img')).length === 0 && !/<img src=x onerror=alert\(1\)>/.test(htmlDoc), 'XSS : détail du document inerte (nom de pièce)');
  L.verifier((await texteNorm(g, '.mv-entete')).includes('<script>window.__x=1</script>') && (await texteNorm(g, '.mv-entete')).includes('<img src=x onerror=alert(4)> & "note"'), 'XSS : référence et note affichées en texte');
  t = await ouvrirDocuments(g, '&q=%3Cscript%3E');
  L.verifier(t.rows.length === 1 && (await g.$$('#table-documents img, #table-documents script')).length === 0, 'XSS : liste des documents inerte (recherche de la référence)');
  t = await ouvrirDocuments(g, '');
  L.verifier((await g.$$('#table-documents img, #table-documents b')).length === 0, 'XSS : nom d\'emplacement hostile échappé dans la liste');
  await L.aller(g, 'transfert');
  await g.selectOption('#emplacement', '1');
  await g.$eval('#destination', s => s.value);
  L.verifier((await g.$$('#destination img, #destination b')).length === 0, 'XSS : liste de destination inerte');
  await scan(g, 'XSS-1', 1);
  L.verifier((await g.$$('#lignes img')).length === 0 && (await lignes(g))[0][1] === XSS_PIECE, 'XSS : nom de pièce affiché en texte dans les lignes');
  await g.click('.select2-selection'); await g.waitForSelector('.select2-search__field'); await g.fill('.select2-search__field', 'XSS-1');
  await g.waitForSelector('.select2-results__option');
  L.verifier((await g.$$('.select2-results img')).length === 0, 'XSS : liste de recherche inerte');
  await g.keyboard.press('Escape');
  L.verifier(dialogues.length === nbDial, 'XSS : aucune boîte de dialogue ouverte (' + dialogues.slice(nbDial).join(' / ') + ')');
  sql("UPDATE emplacements SET nom = 'Cube 14 — Luc' WHERE id = 4");

  // =====================================================================================================================
  console.log('10. Préremplissage par l\'adresse');
  // =====================================================================================================================
  await L.aller(g, 'reception&piece_id=9&emplacement_id=2');
  await attendreLignes(g, 1);
  l = await lignes(g);
  L.verifier(l[0][0] === 'P-0009' && l[0][2] === '1', 'reception&piece_id=9 : ligne P-0009, quantité 1');
  L.verifier(await g.inputValue('#emplacement') === '2', 'reception&emplacement_id=2 : emplacement présélectionné');
  await g.waitForFunction(() => document.querySelector('#lignes tbody tr input[aria-label^="Coût"]').value !== '');
  L.verifier(await g.inputValue('#lignes tbody tr input[aria-label^="Coût"]') === '53,40', 'coût proposé pour la pièce préremplie (coût moyen de l\'entreprise 2) : ' + await g.inputValue('#lignes tbody tr input[aria-label^="Coût"]'));
  await L.aller(g, 'transfert&piece_id=1&emplacement_id=3');
  await attendreLignes(g, 1);
  L.verifier(await g.inputValue('#emplacement') === '3' && (await lignes(g))[0][0] === 'P-0001', 'transfert&piece_id&emplacement_id : source et ligne');
  await L.aller(g, 'sortie&piece_id=3&emplacement_id=3'); await attendreLignes(g, 1);
  L.verifier(await g.inputValue('#emplacement') === '3' && (await lignes(g))[0][0] === 'P-0003' && num((await lignes(g))[0][2]) === num(stock(3, 3)), 'sortie&piece_id&emplacement_id : disponible = stock du cube');
  await L.aller(g, 'reception&piece_id=99999&emplacement_id=abc');
  L.verifier((await g.textContent('.content-wrapper')).includes('n\'existe pas') && (await lignes(g)).length === 0, 'piece_id inexistant : avertissement, aucune ligne');
  sql("UPDATE pieces SET actif = 0 WHERE id = 14");
  await L.aller(g, 'reception&piece_id=14');
  L.verifier((await g.textContent('.content-wrapper')).includes('désactivée') && (await lignes(g)).length === 0, 'piece_id désactivée : avertissement, aucune ligne');
  sql("UPDATE pieces SET actif = 1 WHERE id = 14");
  await L.aller(g, 'reception&piece_id=%3Cscript%3E&emplacement_id=%22%3E');
  L.verifier((await lignes(g)).length === 0 && await g.evaluate(() => window.__x) === undefined && !(await g.$$eval('#emplacement option', o => o.some(x => x.value === '">'))), 'paramètres hostiles : ignorés');
  // dernier emplacement mémorisé
  await L.aller(g, 'sortie'); await g.selectOption('#emplacement', '4');
  await L.aller(g, 'sortie');
  L.verifier(await g.inputValue('#emplacement') === '4', 'le dernier emplacement utilisé est mémorisé (localStorage)');
  await L.aller(g, 'sortie&emplacement_id=3');
  L.verifier(await g.inputValue('#emplacement') === '3', 'l\'adresse a priorité sur la mémoire');
  // stockage du navigateur indisponible : la page fonctionne quand même
  const ctxSans = await b.newContext();
  await ctxSans.addInitScript(() => { const bloque = () => { throw new Error('stockage bloqué'); }; Storage.prototype.getItem = bloque; Storage.prototype.setItem = bloque; });
  const pSans = suivre(await ctxSans.newPage()); pSans.erreurs = [];
  pSans.on('pageerror', x => pSans.erreurs.push('pageerror: ' + x.message));
  await pSans.goto(L.BASE + '/login.php'); await pSans.fill('input[name=username]', 'gestionnaire1'); await pSans.fill('input[name=password]', MDP);
  await Promise.all([pSans.waitForNavigation(), pSans.click('button[type=submit]')]);
  await L.aller(pSans, 'sortie'); await pSans.selectOption('#emplacement', '1');
  await scan(pSans, 'P-0002', 1);
  L.verifier(pSans.erreurs.length === 0 && (await lignes(pSans)).length === 1, 'localStorage bloqué : la page de saisie fonctionne sans erreur : ' + JSON.stringify(pSans.erreurs));
  await ctxSans.close();

  // =====================================================================================================================
  console.log('11. 300 lignes et plus');
  // =====================================================================================================================
  sql("INSERT INTO pieces (code, nom) SELECT CONCAT('T-', LPAD(seq, 4, '0')), CONCAT('Pièce de test ', seq) FROM seq_1_to_305");
  const idsT = sql("SELECT MIN(id) FROM pieces WHERE code LIKE 'T-%'");
  const lignes301 = []; for (let i = 0; i < 301; i++) lignes301.push({ piece_id: parseInt(idsT, 10) + i, quantite: '1', cout_unitaire: '1' });
  const r301 = await appel(g, 'app/action/reception_save.php', { emplacement_id: 1, lignes: lignes301 });
  L.verifier(r301.status === 400 && /Trop de lignes \(maximum 300\)/.test(r301.json.erreur), 'serveur : 301 lignes refusées avec un message clair : ' + (r301.json && r301.json.erreur));
  const nbMouvAvant = parseInt(sql('SELECT COUNT(*) FROM mouvements'), 10);
  await L.aller(g, 'ajustement');
  await g.selectOption('#emplacement', '1'); await g.selectOption('#motif', 'autre');
  for (let i = 1; i <= 301; i++) { await L.scanner(g, '#scan', 'T-' + String(i).padStart(4, '0')); if (i % 50 === 0 || i > 298) await attendreLignes(g, i); else await g.waitForFunction(k => document.querySelectorAll('#lignes tbody tr').length >= k, i, { timeout: 8000 }); }
  L.verifier((await lignes(g)).length === 301, 'interface : 301 lignes ajoutées au scanner');
  L.verifier(/301 lignes/.test(await g.textContent('#mv-resume')), 'résumé : ' + await g.textContent('#mv-resume'));
  await g.click('#btn-enregistrer'); err = await erreurSaisie(g);
  L.verifier(/Trop de lignes \(maximum 300\)/.test(err) && (await lignes(g)).length === 301 && parseInt(sql('SELECT COUNT(*) FROM mouvements'), 10) === nbMouvAvant, '301 lignes : message clair, saisie conservée, rien d\'enregistré : ' + err);
  await g.click('#lignes tbody tr:last-child button');
  await g.click('#btn-enregistrer'); ok = await succesSaisie(g);
  L.verifier(/Ajustement AJU/.test(ok) && parseInt(sql('SELECT COUNT(*) FROM mouvements'), 10) === nbMouvAvant + 300, '300 lignes : enregistrées en un seul document (' + (parseInt(sql('SELECT COUNT(*) FROM mouvements'), 10) - nbMouvAvant) + ' mouvements)');
  const idDoc300 = parseInt(sql("SELECT MAX(id) FROM documents"), 10);
  await L.aller(g, 'document_voir&id=' + idDoc300);
  L.verifier((await g.$$eval('#table-lignes tbody tr', r => r.length)) === 300, 'détail : 300 lignes affichées');

  // =====================================================================================================================
  console.log('12. Tablette (768 x 1024), zones cliquables, aucun défilement horizontal');
  // =====================================================================================================================
  const tab = await connecterAs('gestionnaire1', { width: 768, height: 1024 });
  for (const route of ['reception', 'transfert', 'sortie', 'ajustement', 'documents', 'document_voir&id=3']) {
    await L.aller(tab, route); await attendre(400);
    const largeur = await tab.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    L.verifier(largeur[0] <= largeur[1] + 1, 'tablette : ' + route + ' sans défilement horizontal (' + largeur.join(' / ') + ')');
  }
  await L.aller(tab, 'reception');
  const haut = async (sel) => (await tab.$eval(sel, x => x.getBoundingClientRect().height));
  L.verifier(await haut('#btn-enregistrer') >= 44 && await haut('#emplacement') >= 44 && await haut('#date') >= 44 && await haut('#scan') >= 44, 'tablette : bouton et champs ≥ 44 px de haut');
  await scan(tab, 'P-0001', 1);
  L.verifier(await tab.$eval('#lignes tbody tr input', x => x.getAttribute('inputmode')) === 'decimal', 'tablette : quantités en inputmode=decimal');
  L.verifier(await tab.$eval('#lignes tbody tr button', x => x.getBoundingClientRect().height) >= 40, 'tablette : bouton de retrait de ligne assez grand');
  L.verifier(await tab.$eval('#scan', x => x.getAttribute('inputmode')) === 'none', 'le champ de scan n\'ouvre pas le clavier virtuel (inputmode=none)');

  // =====================================================================================================================
  console.log('13. Intégrité, journal PHP, console');
  // =====================================================================================================================
  const ecart = sql('SELECT COUNT(*) FROM (SELECT s.piece_id, s.emplacement_id FROM stock s LEFT JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m ON m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id WHERE s.quantite <> COALESCE(m.q, 0)) t');
  L.verifier(ecart === '0', 'invariant : stock = somme des mouvements (écarts : ' + ecart + ')');
  const negatif = sql('SELECT COUNT(*) FROM stock WHERE quantite < 0');
  L.verifier(negatif === '0', 'aucun stock négatif');
  const dblNum = sql('SELECT COUNT(*) FROM (SELECT numero FROM documents GROUP BY numero HAVING COUNT(*) > 1) t');
  L.verifier(dblNum === '0', 'numéros de documents uniques');
  let journal = '';
  try { journal = fs.readFileSync(JOURNAL, 'utf8'); } catch (x) { journal = ''; }
  const problemes = journal.split('\n').filter(x => /(Warning|Notice|Fatal|Deprecated|Parse error|Uncaught|SQLSTATE)/i.test(x));
  L.verifier(problemes.length === 0, 'journal PHP propre (' + problemes.length + ' ligne(s) fautive(s)) ' + problemes.slice(0, 3).join(' // '));
  for (const [i, p] of pages.entries()) {
    const r = reelles(p);
    L.verifier(r.length === 0, 'console propre (page ' + (i + 1) + ') : ' + JSON.stringify(r.slice(0, 3)));
  }
  await b.close();

  // ---- remise à zéro de la base de démonstration ------------------------------------------------------------------
  if (!remettreAZero()) { console.log('AVERTISSEMENT : remise à zéro finale impossible.'); }
  process.exit(L.bilan());
})().catch(x => { console.error(x); remettreAZero(); process.exit(1); });
