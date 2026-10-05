// Test de bout en bout du module A1 — Catalogue (pièces, fiche, modification, fournisseurs, catégories, prix, droits).
//   cd gestion && NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8101 DB_NAME=bea_a1 node tests/e2e/a1.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME) puis crée ses propres données :
// il suppose donc un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_a1). Il crée aussi le compte
// « gestionnaire2 » (entreprise 2 seulement) pour vérifier le cloisonnement des entreprises.
const { execSync } = require('child_process');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_a1';
const RACINE = path.resolve(__dirname, '..', '..');
const XSS1 = '<img src=x onerror=alert(1)>';          // nom de pièce
const XSS2 = '<img src=x onerror=alert(2)>';          // nom de fournisseur
const XSS3 = '<img src=x onerror=alert(3)>';          // nom de catégorie

const dialogues = [];
function suivre(page) {
  page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); });
  return page;
}
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (validation, refus d'accès) sont ignorés. */
// (et les requêtes de lecture abandonnées parce que le test change de page ou relance une recherche avant leur fin : ERR_ABORTED,
//  ainsi que celle du test « réseau coupé » qui échoue volontairement)
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/ERR_INTERNET_DISCONNECTED/.test(e) && !/requestfailed: \S+\/(pieces_data|piece_prix|piece_code_proposer)\.php/.test(e));
const attendre = ms => new Promise(r => setTimeout(r, ms));

async function lignes(p, n) {
  await p.waitForFunction(k => document.querySelectorAll('#table-pieces tbody tr:not(.dataTables_empty)').length === k, n, { timeout: 8000 });
}
/** Attend qu'il n'y ait qu'une ligne dont le texte commence par $debut (évite de lire l'état précédent du tableau). */
async function uneLigne(p, debut) {
  await p.waitForFunction(d => { const r = document.querySelectorAll('#table-pieces tbody tr:not(.dataTables_empty)'); return r.length === 1 && r[0].textContent.trim().startsWith(d); }, debut, { timeout: 8000 });
}
async function textes(p, sel) { return p.$$eval(sel, els => els.map(e => e.textContent.trim().replace(/\s+/g, ' '))); }
/** Texte d'un élément avec les espaces (y compris insécables) normalisés. */
async function tx(p, sel) { return (await p.textContent(sel)).replace(/\s+/g, ' ').trim(); }
async function viderToasts(p) { await p.evaluate(() => document.querySelectorAll('#toasts .alert').forEach(e => e.remove())); }
async function toastTexte(p) { return p.evaluate(() => (document.getElementById('toasts') || { textContent: '' }).textContent); }
async function confirmerModal(p, oui) {
  await p.waitForSelector('#modal-confirmer.show');
  const texte = await p.textContent('#modal-confirmer-message');
  await p.click(oui ? '#modal-confirmer-oui' : '#modal-confirmer-non');
  await p.waitForSelector('#modal-confirmer', { state: 'hidden' });
  return texte;
}
/** Appel d'API depuis le navigateur (jeton CSRF inclus sauf indication) ; renvoie {status, json}. */
async function appel(p, url, corps, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, corps, opts]) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (!opts.sansJeton) h['X-CSRF-Token'] = jeton;
    const r = await fetch(url, corps === null ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: h, body: opts.brut ? corps : JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps, opts]);
}
function sql(requete) { return execSync('mysql -uroot -N --default-character-set=utf8mb4 ' + DB, { input: requete, cwd: RACINE }).toString().trim(); }

(async () => {
  // ---- remise à zéro de la base de démonstration -----------------------------------------------------------------
  try { execSync('tools/serveur.sh reset ' + DB, { cwd: RACINE, stdio: 'pipe' }); }
  catch (e) { console.log('AVERTISSEMENT : remise à zéro impossible (' + String(e.message).split('\n')[0] + ') ; le test suppose la base de démo intacte.'); }
  const hash = execSync("php -r 'echo password_hash(\"Test-Beauchemin-1\", PASSWORD_DEFAULT);'").toString();
  sql("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('gestionnaire2', 'Gestionnaire BCH', '" + hash + "', 'gestionnaire');" +
      "INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) SELECT id, 2 FROM utilisateurs WHERE nom_utilisateur = 'gestionnaire2';");

  const b = await L.lancer();
  const pages = [];
  const nouvelle = async (viewport) => { const p = suivre(await L.nouvellePage(b, viewport)); pages.push(p); return p; };

  // =====================================================================================================================
  //  1. Liste des pièces (gestionnaire)
  // =====================================================================================================================
  console.log('1. Liste des pièces');
  const g = await nouvelle();
  await L.connecter(g, 'gestionnaire');
  await L.aller(g, 'pieces');
  await lignes(g, 14);
  L.verifier((await g.textContent('#table-pieces_info')).includes('14'), 'info « 1 à 14 de 14 »');
  L.verifier((await g.textContent('h1')).trim() === 'Pièces', 'titre de la page');
  const hrefs = await g.$$eval('.cat-actions a', as => as.map(a => [a.textContent.trim(), a.getAttribute('href')]));
  const h = Object.fromEntries(hrefs);
  L.verifier(h['Nouvelle pièce'] === 'index.php?page=piece_edit', 'bouton Nouvelle pièce');
  L.verifier(h['Importer (CSV)'] === 'index.php?page=pieces_import', 'bouton Importer');
  L.verifier(h['Exporter (CSV)'] === 'app/ajax/pieces_export.php', 'bouton Exporter');
  L.verifier(h['Étiquettes'] === 'index.php?page=etiquettes', 'bouton Étiquettes');
  const entetes = await textes(g, '#table-pieces thead th');
  L.verifier(entetes.join('|') === 'Code|Nom|Catégorie|Unité|Quantité totale|Statut', 'colonnes : ' + entetes.join('|'));

  await g.fill('#recherche', 'gicleur'); await uneLigne(g, 'P-0003');
  L.verifier(true, 'recherche par nom');
  await g.fill('#recherche', '012345678905'); await uneLigne(g, 'P-0001');
  L.verifier(true, 'recherche par alias de code-barres');
  await g.fill('#recherche', 'P-001'); await lignes(g, 5);
  await g.fill('#recherche', 'delavan 80'); await uneLigne(g, 'P-0003');
  await g.fill('#recherche', 'thermo'); await lignes(g, 2);       // P-0001 et P-0012 : chaque mot cherché dans le code, le nom ou un alias
  await g.fill('#recherche', 'introuvable-xyz');
  await g.waitForSelector('#table-pieces td.dataTables_empty');
  L.verifier((await g.textContent('#table-pieces td.dataTables_empty')).includes('Aucune pièce ne correspond'), 'message de liste vide');
  await g.fill('#recherche', '50%_'); await g.waitForSelector('#table-pieces td.dataTables_empty');   // jokers LIKE échappés
  await g.fill('#recherche', ''); await lignes(g, 14);

  await g.selectOption('#f-categorie', { label: 'Brûleurs' }); await lignes(g, 2);
  await g.selectOption('#f-categorie', { value: '' }); await lignes(g, 14);
  await g.selectOption('#f-statut', 'inactives'); await g.waitForSelector('#table-pieces td.dataTables_empty');
  await g.selectOption('#f-statut', 'toutes'); await lignes(g, 14);
  await g.selectOption('#f-statut', 'actives'); await lignes(g, 14);

  // tri : Nom décroissant, puis retour
  await g.click('#table-pieces thead th:nth-child(2)'); await g.click('#table-pieces thead th:nth-child(2)');
  await g.waitForFunction(() => /^P-0011/.test(document.querySelector('#table-pieces tbody tr').textContent.trim()), null, { timeout: 8000 });
  L.verifier(true, 'tri par nom décroissant');

  // filtres reçus par l'adresse (liens depuis les catégories, recherche prérenseignée)
  await L.aller(g, 'pieces&q=gicleur');
  L.verifier((await g.inputValue('#recherche')) === 'gicleur', 'recherche prérenseignée par l\'adresse'); await uneLigne(g, 'P-0003');
  await L.aller(g, 'pieces&statut=toutes&categorie_id=1'); await lignes(g, 2);
  L.verifier((await g.inputValue('#f-categorie')) === '1' && (await g.inputValue('#f-statut')) === 'toutes', 'catégorie et statut prérenseignés par l\'adresse');
  await L.aller(g, 'pieces&q=%3Cscript%3Ewindow.__x%3D1%3C%2Fscript%3E&statut=%22%3E&categorie_id=%27'); await g.waitForSelector('#table-pieces td.dataTables_empty');
  L.verifier((await g.evaluate(() => window.__x)) === undefined && (await g.inputValue('#f-statut')) === 'actives', 'paramètres d\'adresse hostiles : sans effet');
  await L.aller(g, 'pieces'); await lignes(g, 14);

  // chaque colonne triable répond sans erreur serveur (alias des colonnes = columns[].data)
  for (const col of [1, 2, 3, 4, 5, 6]) {
    await g.click('#table-pieces thead th:nth-child(' + col + ')');
    await g.waitForTimeout(350); await lignes(g, 14);
  }
  L.verifier(!(await toastTexte(g)).includes('Impossible de charger'), 'tri sur chacune des 6 colonnes : aucune erreur de chargement');

  // scanner : un code exact (interne, alias) ouvre la fiche ; un code d'emplacement avertit
  await L.aller(g, 'pieces');
  await lignes(g, 14);
  await L.scanner(g, '#recherche', 'P-0007');
  await g.waitForURL(/page=piece_voir&id=7/);
  L.verifier((await g.textContent('h1')).includes('P-0007'), 'scan du code interne : ouvre la fiche');
  await L.aller(g, 'pieces'); await lignes(g, 14);
  await L.scanner(g, '#recherche', '012345678905');
  await g.waitForURL(/page=piece_voir&id=1$/);
  L.verifier((await g.textContent('h1')).includes('P-0001'), 'scan d\'un alias : ouvre la fiche de la bonne pièce');
  await L.aller(g, 'pieces'); await lignes(g, 14);
  await L.scanner(g, '#recherche', 'EMP-000003');
  await g.waitForFunction(() => (document.getElementById('toasts') || { textContent: '' }).textContent.includes('Cube 12'), null, { timeout: 5000 });
  L.verifier(/page=pieces/.test(g.url()), 'scan d\'un emplacement : on reste sur la liste avec un avertissement');
  await viderToasts(g);
  await L.scanner(g, '#recherche', 'ZZZ-INCONNU-123');
  await g.waitForFunction(() => (document.getElementById('toasts') || { textContent: '' }).textContent.includes('Aucune pièce ne correspond à « ZZZ-INCONNU-123 »'), null, { timeout: 5000 });
  L.verifier(true, 'scan d\'un code inconnu : message clair (et bip d\'erreur)');
  await g.fill('#recherche', ''); await lignes(g, 14); await viderToasts(g);
  // clic sur une ligne
  await g.click('#table-pieces tbody tr:has-text("P-0005") td:nth-child(2)');
  await g.waitForURL(/page=piece_voir&id=5/);
  L.verifier(true, 'clic sur une ligne : ouvre la fiche');

  // entreprise choisie en haut : P-0009 = 18 pour toutes, 4 pour Boutique Chaleur
  await L.aller(g, 'pieces'); await lignes(g, 14);
  const qteP9 = async () => (await textes(g, '#table-pieces tbody tr:has-text("P-0009") td:nth-child(5)'))[0];
  L.verifier((await qteP9()) === '18', 'quantité totale (toutes entreprises) de P-0009 : ' + await qteP9());
  await Promise.all([g.waitForNavigation(), g.selectOption('#entreprise-courante', '2')]);
  await lignes(g, 14);
  L.verifier((await qteP9()) === '4', 'quantité de P-0009 pour Boutique Chaleur seulement : ' + await qteP9());
  await Promise.all([g.waitForNavigation(), g.selectOption('#entreprise-courante', '0')]);
  await lignes(g, 14);

  // =====================================================================================================================
  //  2. Création d'une pièce
  // =====================================================================================================================
  console.log('2. Création d\'une pièce');
  await L.aller(g, 'piece_edit');
  await g.click('#btn-proposer');
  await g.waitForFunction(() => /^P-\d{4}$/.test(document.getElementById('f-code').value), null, { timeout: 5000 });
  const codeProp = await g.inputValue('#f-code');
  L.verifier(codeProp === 'P-0015', 'proposition du prochain code libre : ' + codeProp);
  // validations : tout vide -> messages précis
  await g.fill('#f-code', ''); await g.click('#btn-enregistrer');
  await g.waitForSelector('#erreur-form:not([hidden])');
  L.verifier((await g.textContent('#erreur-form')).includes('Le code interne est obligatoire'), 'code obligatoire');
  await g.fill('#f-code', 'abc 12'); await g.click('#btn-enregistrer');
  await g.waitForFunction(() => /ne peut contenir que/.test(document.getElementById('erreur-form').textContent));
  L.verifier(await g.inputValue('#f-code') === 'ABC 12', 'le code est mis en majuscules à la frappe');
  await g.fill('#f-code', 'P-0003'); await g.press('#f-code', 'Tab');
  await g.waitForFunction(() => /déjà le code interne de la pièce/.test(document.querySelector('[data-erreur-pour="code"]').textContent), null, { timeout: 5000 });
  L.verifier(true, 'vérification du code en quittant le champ (code déjà pris par une pièce)');
  await g.click('#btn-proposer'); await g.waitForFunction(() => document.getElementById('f-code').value === 'P-0015');
  await g.click('#btn-enregistrer');
  await g.waitForFunction(() => /Le nom est obligatoire/.test(document.getElementById('erreur-form').textContent));
  L.verifier(await g.evaluate(() => document.activeElement.id) === 'f-nom', 'le champ fautif reçoit le focus');
  await g.fill('#f-nom', XSS1);
  await g.fill('#f-description', 'Ligne 1\nLigne 2 <b>gras</b>');
  // catégorie : création rapide sans quitter la page (+ doublon refusé)
  await g.click('#btn-nouvelle-categorie');
  await g.fill('#nc-nom', XSS3); await g.press('#nc-nom', 'Enter');
  await g.waitForFunction(() => document.getElementById('f-categorie').selectedOptions[0].textContent.startsWith('<img'), null, { timeout: 5000 });
  L.verifier((await g.$eval('#f-categorie', s => s.selectedOptions[0].textContent)) === XSS3, 'nouvelle catégorie créée et sélectionnée (sans quitter la page)');
  await g.click('#btn-nouvelle-categorie'); await g.fill('#nc-nom', '  ' + XSS3.toUpperCase() + ' '); await g.click('#btn-creer-categorie');
  await g.waitForSelector('#nc-erreur:not([hidden])');
  L.verifier((await g.textContent('#nc-erreur')).includes('porte déjà ce nom'), 'catégorie en double refusée (casse ignorée)');
  await g.click('#btn-annuler-categorie');
  await g.fill('#f-unite', 'boîte');
  const unites = await g.$$eval('#unites-suggerees option', o => o.map(x => x.value));
  L.verifier(['unité', 'paire', 'm', 'pi', 'kg', 'L', 'boîte', 'rouleau', 'lot'].every(u => unites.includes(u)), 'suggestions d\'unités');
  // réseau coupé : message en français (pas de « Failed to fetch »)
  await g.context().setOffline(true);
  await g.click('#btn-proposer');
  await g.waitForFunction(() => (document.getElementById('toasts') || { textContent: '' }).textContent.includes('Connexion au serveur impossible'), null, { timeout: 5000 });
  await g.context().setOffline(false); await viderToasts(g);
  L.verifier(true, 'réseau coupé : message d\'erreur en français');
  // alias : codes déjà pris (pièce, alias, emplacement), doublons, ajout, retrait
  const alias = async (code) => { await L.scanner(g, '#f-alias', code); await attendre(250); };
  const erreurAlias = () => g.textContent('[data-erreur-pour="codes"]');
  await alias('P-0003');
  L.verifier((await erreurAlias()).includes('déjà le code interne de la pièce « P-0003'), 'alias = code interne d\'une autre pièce : message précis');
  await alias('EMP-000001');
  L.verifier((await erreurAlias()).includes('code-barres de l\'emplacement'), 'alias = code d\'emplacement : message précis');
  await alias('012345678905');
  L.verifier((await erreurAlias()).includes('code-barres alias de la pièce « P-0001'), 'alias = alias d\'une autre pièce : message précis');
  await alias('P-0015');
  L.verifier((await erreurAlias()).includes('déjà le code interne de cette pièce'), 'alias = code interne de la pièce elle-même');
  await alias('A1-UPC-001');
  L.verifier(JSON.stringify(await textes(g, '#liste-alias li')) === JSON.stringify(['Fabricant A1-UPC-001']), 'alias ajouté au scan (Entrée)');
  await alias('a1-upc-001');
  L.verifier((await erreurAlias()).includes('déjà dans la liste'), 'alias en double dans la liste (casse ignorée)');
  await g.fill('#f-alias', 'A1-FOU-9'); await g.selectOption('#f-alias-type', 'fournisseur'); await g.click('#btn-alias');
  await g.waitForFunction(() => document.querySelectorAll('#liste-alias li').length === 2);
  await g.click('#liste-alias li:nth-child(2) button');
  L.verifier((await g.$$('#liste-alias li')).length === 1, 'retrait d\'un alias');
  await g.fill('#f-alias', 'A1-TAB'); await g.press('#f-alias', 'Tab');          // certains lecteurs terminent par Tab
  await g.waitForFunction(() => document.querySelectorAll('#liste-alias li').length === 2);
  await g.click('#liste-alias li:nth-child(2) button');
  const XSSA = '<img/src=x/onerror=alert(5)>';                                         // un alias peut contenir ces caractères : il doit rester inoffensif
  await g.fill('#f-alias', XSSA); await g.selectOption('#f-alias-type', 'autre'); await g.press('#f-alias', 'Enter');
  await g.waitForFunction(() => document.querySelectorAll('#liste-alias li').length === 2);
  L.verifier((await g.$$('#liste-alias img')).length === 0 && (await textes(g, '#liste-alias li'))[1] === 'Autre ' + XSSA, 'alias avec balises : affiché comme texte dans le formulaire');
  await g.fill('#f-alias', 'OUBLIE-1'); await g.click('#btn-enregistrer');
  await g.waitForFunction(() => /n'a pas été ajouté/.test(document.querySelector('[data-erreur-pour="codes"]').textContent));
  L.verifier(true, 'alias saisi mais non ajouté : on prévient avant d\'enregistrer');
  await g.fill('#f-alias', '');
  await g.fill('#seuil-1', '5,5');
  await g.click('#btn-enregistrer');
  await g.waitForURL(/page=piece_voir&id=\d+&msg=cree/);
  const idNouvelle = (g.url().match(/id=(\d+)/) || [])[1];
  L.verifier(!!(await g.$('.alert-success:has-text("a été créée")')), 'message de succès après création');
  L.verifier((await g.textContent('h1')) === 'P-0015 — ' + XSS1, 'le nom (avec balises) s\'affiche comme texte dans le titre');
  L.verifier((await g.$$('img[src="x"]')).length === 0, 'aucune balise injectée (fiche)');
  const dd = await textes(g, 'dl dd');
  L.verifier(dd[2].includes('Ligne 1') && dd[2].includes('<b>gras</b>'), 'description multiligne affichée telle quelle : ' + dd[2]);
  L.verifier(dd[3] === XSS3, 'catégorie affichée comme texte');
  // fiche : codes, aperçu Code 128, stock, minimum
  const codes = await textes(g, '#table-codes tbody tr');
  L.verifier(codes.length === 3 && codes[0].startsWith('Interne P-0015') && codes[1].startsWith('Fabricant A1-UPC-001') && codes[2].includes('Autre ' + XSSA), 'codes interne + alias : ' + codes.join(' / '));
  await g.waitForFunction(() => [...document.querySelectorAll('#table-codes img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 5000 });
  L.verifier((await g.$$('#table-codes img')).length === 3 && (await g.$$('#table-codes img[src="x"]')).length === 0, 'aperçus Code 128 chargés (3), aucune balise injectée par un alias');
  const stockTxt = (await textes(g, '#table-stock tbody tr')).join(' | ');
  L.verifier(stockTxt.includes('Beauchemin (minimum : 5,5) Sous le minimum') && stockTxt.includes('Boutique Chaleur') && stockTxt.includes('Aucun stock'), 'stock vide, minimum et alerte : ' + stockTxt);
  L.verifier(!!(await g.$('a:has-text("Étiquette")[href="index.php?page=etiquettes&piece_id=' + idNouvelle + '"]')), 'bouton Étiquette');
  L.verifier(!!(await g.$('a:has-text("Réception")[href="index.php?page=reception&piece_id=' + idNouvelle + '"]')) && !!(await g.$('a:has-text("Transfert")[href="index.php?page=transfert&piece_id=' + idNouvelle + '"]')) && !!(await g.$('a:has-text("Sortie")[href="index.php?page=sortie&piece_id=' + idNouvelle + '"]')), 'liens rapides Réception / Transfert / Sortie');
  L.verifier((await g.textContent('#table-mouvements, .card:has(h3:has-text("20 derniers mouvements")) .card-body')).includes('Aucun mouvement'), 'aucun mouvement pour une pièce neuve');

  // liste : XSS inoffensif, filtre « avec stock seulement » retire la pièce neuve
  await L.aller(g, 'pieces'); await lignes(g, 15);
  L.verifier((await g.$$('#table-pieces img')).length === 0, 'aucune balise injectée (liste)');
  L.verifier((await textes(g, '#table-pieces tbody tr:has-text("P-0015") td:nth-child(2)'))[0] === XSS1, 'nom affiché comme texte dans la liste');
  await g.click('label[for="f-stock"]'); await lignes(g, 14);
  await g.click('label[for="f-stock"]'); await lignes(g, 15);
  await g.selectOption('#f-categorie', { label: XSS3 }); await uneLigne(g, 'P-0015');   // catégorie créée à l'instant
  await g.selectOption('#f-categorie', { value: 'aucune' }); await g.waitForSelector('#table-pieces td.dataTables_empty');
  await g.selectOption('#f-categorie', { value: '' }); await lignes(g, 15);

  // « Enregistrer et créer une autre »
  await L.aller(g, 'piece_edit');
  await g.fill('#f-code', 'p-0300'); await g.fill('#f-nom', 'Pièce de série A1'); await g.fill('#f-unite', 'lot');
  await g.click('#btn-enregistrer-nouveau');
  await g.waitForURL(/page=piece_edit&cree=\d+/);
  L.verifier(!!(await g.$('.alert-success:has-text("P-0300")')) && (await g.inputValue('#f-code')) === '', 'enregistrer et créer une autre : message + formulaire vierge');
  // double clic sur « Enregistrer » : une seule pièce créée
  await L.aller(g, 'piece_edit');
  await g.fill('#f-code', 'P-0310'); await g.fill('#f-nom', 'Double clic'); await g.fill('#f-unite', 'lot');
  await g.dblclick('#btn-enregistrer');
  await g.waitForURL(/page=piece_voir&id=\d+&msg=cree/);
  L.verifier(sql("SELECT COUNT(*) FROM pieces WHERE code = 'P-0310'") === '1', 'double clic sur Enregistrer : une seule pièce créée');
  await L.aller(g, 'piece_edit');
  await g.fill('#f-code', 'P-0300'); await g.fill('#f-nom', 'Doublon'); await g.fill('#f-unite', 'lot'); await g.click('#btn-enregistrer');
  await g.waitForFunction(() => /déjà le code interne de la pièce « P-0300/.test(document.getElementById('erreur-form').textContent));
  L.verifier(true, 'création avec un code déjà pris : refusée avec le nom de la pièce');

  // =====================================================================================================================
  //  3. Prix des fournisseurs (fiche)
  // =====================================================================================================================
  console.log('3. Prix des fournisseurs');
  await L.aller(g, 'piece_voir&id=' + idNouvelle);
  await g.waitForSelector('#prix-contenu :text("Aucun prix")');
  L.verifier((await g.textContent('#couts-moyens')).includes('aucun coût connu'), 'coût moyen inconnu');
  await g.click('#btn-ajouter-prix');
  await g.waitForSelector('#modal-prix.show');
  await g.fill('#prix-montant', 'abc'); await g.click('#prix-enregistrer');
  await g.waitForSelector('#prix-erreur:not([hidden])');
  L.verifier((await g.textContent('#prix-erreur')).includes('Choisissez un fournisseur') || (await g.textContent('#prix-erreur')).includes('nombre'), 'prix invalide refusé : ' + await g.textContent('#prix-erreur'));
  await g.selectOption('#prix-fournisseur', { label: 'Distribution Chauffage Plus' });
  await g.fill('#prix-montant', 'abc'); await g.click('#prix-enregistrer');
  await g.waitForFunction(() => /doit être un nombre/.test(document.getElementById('prix-erreur').textContent));
  await g.fill('#prix-montant', '12,5 $'); await g.fill('#prix-no', 'ZZ-1'); await g.fill('#prix-note', 'Prix de liste');
  await g.click('#prix-enregistrer');
  await g.waitForSelector('#modal-prix', { state: 'hidden' });
  await g.waitForSelector('#table-prix tbody tr');
  let rp = await textes(g, '#table-prix tbody tr');
  L.verifier(rp.length === 1 && rp[0].includes('Distribution Chauffage Plus') && rp[0].includes('ZZ-1') && rp[0].includes('12,50') && rp[0].includes('Prix de liste'), 'prix ajouté : ' + rp.join(' / '));
  await viderToasts(g);
  await g.click('#btn-ajouter-prix'); await g.waitForSelector('#modal-prix.show');
  const options = await g.$$eval('#prix-fournisseur option', o => o.map(x => x.textContent));
  L.verifier(!options.includes('Distribution Chauffage Plus') && options.includes('Grossiste Gaz du Nord'), 'la liste n\'offre pas un fournisseur déjà tarifé');
  await g.selectOption('#prix-fournisseur', { label: 'Grossiste Gaz du Nord' }); await g.fill('#prix-montant', '10'); await g.click('#prix-enregistrer');
  await g.waitForSelector('#modal-prix', { state: 'hidden' });
  await g.waitForFunction(() => document.querySelectorAll('#table-prix tbody tr').length === 2);
  rp = await textes(g, '#table-prix tbody tr');
  L.verifier(rp[0].includes('Grossiste Gaz du Nord') && rp[0].includes('Meilleur prix') && rp[0].includes('10,00'), 'tri par prix et « Meilleur prix » : ' + rp[0]);
  // modification d'un prix
  await viderToasts(g);
  await g.click('#table-prix tr:has-text("Distribution Chauffage Plus") button[data-action="modifier-prix"]');
  await g.waitForSelector('#modal-prix.show');
  L.verifier((await g.inputValue('#prix-montant')) === '12,50' && (await g.inputValue('#prix-no')) === 'ZZ-1' && await g.$eval('#prix-fournisseur', s => s.disabled), 'modification : champs préremplis, fournisseur verrouillé');
  await g.fill('#prix-montant', '9,25'); await g.fill('#prix-no', ''); await g.click('#prix-enregistrer');
  await g.waitForSelector('#modal-prix', { state: 'hidden' });
  await g.waitForFunction(() => /9,25/.test(document.querySelector('#table-prix tr:nth-child(1)').textContent) || /9,25/.test(document.querySelector('#table-prix').textContent));
  rp = await textes(g, '#table-prix tbody tr');
  L.verifier(rp[0].includes('Distribution Chauffage Plus') && rp[0].includes('9,25') && !rp[0].includes('ZZ-1'), 'prix modifié, numéro effacé, nouvel ordre : ' + rp[0]);
  // historique des prix
  await g.click('#section-historique [data-card-widget="collapse"]');
  await g.waitForSelector('#table-hist-prix', { state: 'visible' });
  const hist = await textes(g, '#table-hist-prix tbody tr');
  L.verifier(hist.length === 3, 'historique : 3 changements de prix (' + hist.length + ')');
  // suppression
  await viderToasts(g);
  await g.click('#table-prix tr:has-text("Grossiste Gaz du Nord") button[data-action="supprimer-prix"]');
  const msgSupp = await confirmerModal(g, true);
  L.verifier(msgSupp.includes('Grossiste Gaz du Nord') && msgSupp.includes('historique'), 'confirmation de retrait du prix : ' + msgSupp);
  await g.waitForFunction(() => document.querySelectorAll('#table-prix tbody tr').length === 1);
  L.verifier(sql("SELECT COUNT(*) FROM prix_fournisseurs WHERE piece_id = " + idNouvelle) === '1' && sql("SELECT COUNT(*) FROM prix_fournisseurs_hist WHERE piece_id = " + idNouvelle) === '3', 'ligne retirée de prix_fournisseurs, historique conservé');
  L.verifier(sql("SELECT COUNT(*) FROM journal WHERE action = 'prix.supprime' AND entite_id = " + idNouvelle) === '1', 'retrait journalisé');
  // écart vs coût moyen (P-0001 : coût moyen Beauchemin 14,50 $)
  await L.aller(g, 'piece_voir&id=1');
  await g.waitForSelector('#table-prix tbody tr');
  rp = await textes(g, '#table-prix tbody tr');
  L.verifier(rp[0].includes('Distribution Chauffage Plus') && rp[0].includes('0,00 $ (0 %)'), 'écart nul (14,50 $ = coût moyen) : ' + rp[0]);
  L.verifier(rp[1].includes('Grossiste Gaz du Nord') && rp[1].includes('+0,70 $ (+4,8 %)'), 'écart +0,70 $ (+4,8 %) : ' + rp[1]);
  L.verifier((await tx(g, '#couts-moyens')).includes('14,50 $') && (await tx(g, '#couts-moyens')).includes('aucun coût connu'), 'coûts moyens par entreprise');
  const mouv = await textes(g, '#table-mouvements tbody tr');
  L.verifier(mouv.length === 4 && (await g.$$('#table-mouvements a[href*="page=document_voir&id="]')).length === 4, 'derniers mouvements avec lien vers le document (' + mouv.length + ')');
  L.verifier(mouv[0].includes('Sortie') && mouv[0].includes('-1'), 'dernier mouvement : la sortie : ' + mouv[0]);
  // stock par entreprise puis par emplacement, avec totaux
  const st = (await textes(g, '#table-stock tbody tr')).join(' | ');
  L.verifier(st.includes('Total : 11 unité') && st.includes('Entrepôt principal Entrepôt 8') && st.includes('Cube 12 — Marc Cube de service 3'), 'stock par emplacement et totaux : ' + st);

  // =====================================================================================================================
  //  4. Modification, code figé, désactivation
  // =====================================================================================================================
  console.log('4. Modification et désactivation');
  await L.aller(g, 'piece_edit&id=1');
  L.verifier(await g.$eval('#f-code', e => e.readOnly), 'code interne en lecture seule (la pièce a des mouvements)');
  L.verifier((await g.$('#btn-proposer')) === null, 'pas de « Proposer un code » pour une pièce avec mouvements');
  L.verifier((await textes(g, '#liste-alias li'))[0] === 'Fabricant 012345678905', 'alias existant affiché');
  L.verifier((await g.inputValue('#seuil-1')) === '10', 'minimum existant affiché');
  await g.fill('#f-nom', 'Thermocouple 36 po (essai)'); await g.fill('#seuil-2', '3');
  await g.click('#btn-enregistrer');
  await g.waitForURL(/page=piece_voir&id=1&msg=modifie/);
  L.verifier((await g.textContent('h1')).includes('(essai)') && !!(await g.$('.alert-success:has-text("modifications")')), 'modification enregistrée');
  L.verifier(sql("SELECT minimum FROM seuils WHERE piece_id = 1 AND entreprise_id = 2") === '3.000', 'minimum de l\'entreprise 2 enregistré');
  // règle côté serveur (même en contournant l'interface)
  let r = await appel(g, 'app/action/piece_save.php', { id: 1, code: 'P-9001', nom: 'Thermocouple', unite: 'unité' });
  L.verifier(r.status === 400 && /ne peut plus être modifié/.test(r.json.erreur) && r.json.champ === 'code', 'code figé refusé par le serveur : ' + (r.json && r.json.erreur));
  L.verifier(sql("SELECT code FROM pieces WHERE id = 1") === 'P-0001', 'le code interne de P-0001 est inchangé');
  r = await appel(g, 'app/action/piece_save.php', { id: 'abc', code: 'P-8001', nom: 'Identifiant invalide', unite: 'unité' });
  L.verifier(r.status === 400 && r.json.champ === 'id' && sql("SELECT COUNT(*) FROM pieces WHERE code = 'P-8001'") === '0', 'identifiant invalide : refusé, aucune pièce créée silencieusement');
  r = await appel(g, 'app/action/piece_save.php', { id: 1, code: 'p-0001', nom: 'Thermocouple 36 po', unite: 'unité', categorie_id: 2, codes: [{ code: '012345678905', type: 'fabricant' }], seuils: [{ entreprise_id: 1, minimum: '10' }, { entreprise_id: 2, minimum: '' }] });
  L.verifier(r.status === 200, 'même code (casse différente) accepté et nom rétabli');
  // pièce sans mouvement : le code peut changer, les alias se modifient
  await L.aller(g, 'piece_edit&id=' + idNouvelle);
  L.verifier(!(await g.$eval('#f-code', e => e.readOnly)), 'code modifiable (aucun mouvement)');
  L.verifier((await g.inputValue('#seuil-1')) === '5,5', 'minimum 5,5 affiché avec la virgule');
  await g.fill('#f-code', 'p-0150'); await g.click('#liste-alias li button'); await g.click('#liste-alias li button');
  await g.fill('#f-alias', 'A1-NOUVEAU'); await g.selectOption('#f-alias-type', 'autre'); await g.press('#f-alias', 'Enter');
  await g.waitForFunction(() => (document.querySelector('#liste-alias li .code') || {}).textContent === 'A1-NOUVEAU');
  await g.click('#btn-enregistrer');
  await g.waitForURL(/page=piece_voir&id=\d+&msg=modifie/);
  const codes2 = await textes(g, '#table-codes tbody tr');
  L.verifier(codes2[0].startsWith('Interne P-0150') && codes2.length === 2 && codes2[1].startsWith('Autre A1-NOUVEAU'), 'code et alias modifiés : ' + codes2.join(' / '));
  L.verifier(Number(sql("SELECT COUNT(*) FROM journal WHERE action = 'piece.modifie' AND entite_id = " + idNouvelle)) === 1, 'modification journalisée');
  // désactivation : pièce avec stock -> confirmation avec le stock restant
  await L.aller(g, 'piece_voir&id=3');
  await g.click('#btn-activer');
  let m = await confirmerModal(g, false);
  L.verifier(m.includes('a encore du stock') && m.includes('Beauchemin : 10') && m.includes('ne peut plus être transféré'), 'confirmation avec le stock restant : ' + m);
  L.verifier(sql("SELECT actif FROM pieces WHERE id = 3") === '1', 'refus de la confirmation : la pièce reste active');
  await g.click('#btn-activer'); await confirmerModal(g, true);
  await g.waitForURL(/page=piece_voir&id=3&msg=desactivee/);
  L.verifier(!!(await g.$('.alert-secondary:has-text("désactivée")')) && (await g.$('.cat-actions a:has-text("Transfert")')) === null, 'pièce désactivée : bandeau, plus de liens de saisie');
  L.verifier(sql("SELECT COUNT(*) FROM journal WHERE action = 'piece.desactive' AND entite_id = 3") === '1', 'désactivation journalisée');
  await L.aller(g, 'pieces'); await lignes(g, Number(sql("SELECT COUNT(*) FROM pieces WHERE actif = 1")));   // 16 pièces dont une désactivée
  L.verifier((await textes(g, '#table-pieces tbody')).join('').indexOf('P-0003') === -1, 'une pièce désactivée disparaît de la liste par défaut');
  await g.selectOption('#f-statut', 'inactives'); await uneLigne(g, 'P-0003');
  L.verifier((await textes(g, '#table-pieces tbody tr'))[0].includes('Désactivée'), 'filtre « Désactivées »');
  await L.aller(g, 'piece_voir&id=3'); await g.click('#btn-activer');
  await g.waitForURL(/page=piece_voir&id=3&msg=reactivee/);
  L.verifier(sql("SELECT actif FROM pieces WHERE id = 3") === '1', 'pièce réactivée');
  // pièce sans stock : confirmation simple ; via le formulaire de modification : confirmation aussi
  await L.aller(g, 'piece_voir&id=' + idNouvelle); await g.click('#btn-activer');
  m = await confirmerModal(g, true);
  L.verifier(m.includes('Désactiver « P-0150 »') && !m.includes('stock'), 'confirmation simple sans stock : ' + m);
  await g.waitForURL(/msg=desactivee/);
  await L.aller(g, 'piece_edit&id=4');
  await g.click('label[for="f-actif"]'); await g.click('#btn-enregistrer');
  m = await confirmerModal(g, false);
  await g.waitForFunction(() => document.getElementById('f-actif').checked, null, { timeout: 5000 });
  L.verifier(m.includes('a encore du stock'), 'formulaire : décocher « active » demande confirmation (annulée : la case est recochée)');
  await g.click('label[for="f-actif"]'); await g.click('#btn-enregistrer'); await confirmerModal(g, true);
  await g.waitForURL(/page=piece_voir&id=4&msg=modifie/);
  L.verifier(sql("SELECT actif FROM pieces WHERE id = 4") === '0', 'désactivation depuis le formulaire');
  r = await appel(g, 'app/action/piece_activer.php', { id: 4, actif: true });
  L.verifier(r.status === 200 && sql("SELECT actif FROM pieces WHERE id = 4") === '1', 'réactivation (API)');
  r = await appel(g, 'app/action/piece_activer.php', { id: 7, actif: false });
  L.verifier(r.status === 400 && r.json.champ === 'confirmation', 'API : désactiver une pièce avec stock exige la confirmation');

  // =====================================================================================================================
  //  5. Fournisseurs
  // =====================================================================================================================
  console.log('5. Fournisseurs');
  await L.aller(g, 'fournisseurs');
  await g.waitForSelector('#table-fournisseurs tbody tr td:not(.dataTables_empty)');
  L.verifier((await g.$$('#table-fournisseurs tbody tr')).length === 3, '3 fournisseurs de démonstration');
  await g.click('#btn-nouveau'); await g.waitForSelector('#modal-fournisseur.show');
  await g.fill('#fo-nom', ''); await g.click('#fournisseur-enregistrer');
  await g.waitForSelector('#fournisseur-erreur:not([hidden])');
  L.verifier((await g.textContent('#fournisseur-erreur')).includes('Le nom est obligatoire'), 'nom du fournisseur obligatoire');
  await g.fill('#fo-nom', XSS2); await g.fill('#fo-contact', 'Paul Roy'); await g.fill('#fo-telephone', '418-555-9999'); await g.fill('#fo-courriel', 'pas-un-courriel');
  await g.click('#fournisseur-enregistrer');
  await g.waitForFunction(() => /courriel n'est pas valide/.test(document.getElementById('fournisseur-erreur').textContent));
  await g.fill('#fo-courriel', 'paul@exemple.ca'); await g.click('#fournisseur-enregistrer');
  await g.waitForSelector('#modal-fournisseur', { state: 'hidden' });
  await g.waitForFunction(() => document.querySelectorAll('#table-fournisseurs tbody tr').length === 4);
  L.verifier((await g.$$('#table-fournisseurs img')).length === 0 && (await textes(g, '#table-fournisseurs tbody tr')).some(t => t.includes(XSS2)), 'fournisseur créé ; son nom (avec balises) est affiché comme texte');
  await viderToasts(g);
  await g.click('#btn-nouveau'); await g.waitForSelector('#modal-fournisseur.show');
  await g.fill('#fo-nom', 'grossiste GAZ du nord'); await g.click('#fournisseur-enregistrer');
  await g.waitForFunction(() => /porte déjà ce nom/.test(document.getElementById('fournisseur-erreur').textContent));
  L.verifier(true, 'nom en double refusé sans égard à la casse');
  await g.click('#modal-fournisseur .btn-outline-secondary'); await g.waitForSelector('#modal-fournisseur', { state: 'hidden' });
  // modification
  await g.click('#table-fournisseurs tbody tr:has-text("Pièces Mazout Express") button[data-action="modifier"]');
  await g.waitForSelector('#modal-fournisseur.show');
  L.verifier((await g.inputValue('#fo-nom')) === 'Pièces Mazout Express' && (await g.inputValue('#fo-telephone')) === '418-555-0103', 'modification : champs préremplis');
  await g.fill('#fo-telephone', '418-555-7777'); await g.fill('#fo-notes', 'Livraison le jeudi'); await g.click('#fournisseur-enregistrer');
  await g.waitForSelector('#modal-fournisseur', { state: 'hidden' });
  await g.waitForFunction(() => document.querySelector('#table-fournisseurs').textContent.includes('418-555-7777'));
  L.verifier(sql("SELECT notes FROM fournisseurs WHERE nom = 'Pièces Mazout Express'") === 'Livraison le jeudi', 'fournisseur modifié');
  // prix de ce fournisseur : un clic ouvre la fenêtre (pièces, prix, lien vers la pièce)
  await viderToasts(g);
  await g.click('#table-fournisseurs tbody tr:has-text("Distribution Chauffage Plus") td:nth-child(2)');
  await g.waitForSelector('#modal-prix-fournisseur.show');
  await g.waitForSelector('#table-prix-fournisseur tbody tr');
  const pf = await textes(g, '#table-prix-fournisseur tbody tr');
  L.verifier(pf.length === 15 && pf[0].includes('P-0001') && pf[0].includes('14,50 $'), 'prix de ce fournisseur : ' + pf.length + ' pièces, ' + pf[0]);
  L.verifier((await g.getAttribute('#table-prix-fournisseur tbody tr a.code', 'href')).includes('page=piece_voir&id='), 'lien vers la fiche de la pièce');
  L.verifier((await g.textContent('#modal-prix-fournisseur-titre')).includes('Distribution Chauffage Plus'), 'titre de la fenêtre des prix');
  await g.click('#modal-prix-fournisseur .btn-outline-secondary'); await g.waitForSelector('#modal-prix-fournisseur', { state: 'hidden' });
  // désactivation / réactivation
  await g.click('#table-fournisseurs tbody tr:has-text("Pièces Mazout Express") button[data-action="activer"]');
  m = await confirmerModal(g, true);
  L.verifier(m.includes('Pièces Mazout Express') && m.includes('prix et son historique sont conservés'), 'confirmation de désactivation du fournisseur');
  await g.waitForFunction(() => !document.querySelector('#table-fournisseurs').textContent.includes('Pièces Mazout Express'));
  await g.selectOption('#f-statut', 'inactifs');
  await g.waitForFunction(() => document.querySelector('#table-fournisseurs').textContent.includes('Pièces Mazout Express') && document.querySelectorAll('#table-fournisseurs tbody tr').length === 1);
  L.verifier(sql("SELECT actif FROM fournisseurs WHERE nom = 'Pièces Mazout Express'") === '0', 'fournisseur désactivé');
  await viderToasts(g);
  await g.click('#table-fournisseurs tbody tr button[data-action="activer"]');
  await g.waitForFunction(() => document.querySelector('#table-fournisseurs td.dataTables_empty'));
  await g.selectOption('#f-statut', 'actifs');
  await g.waitForFunction(() => document.querySelectorAll('#table-fournisseurs tbody tr').length === 4);
  L.verifier(sql("SELECT COUNT(*) FROM journal WHERE action IN ('fournisseur.cree','fournisseur.modifie','fournisseur.desactive','fournisseur.reactive')") === '4', 'écritures de fournisseurs journalisées');
  // un fournisseur désactivé n'est plus offert pour un nouveau prix
  await g.click('#table-fournisseurs tbody tr:has-text("Grossiste Gaz du Nord") button[data-action="activer"]'); await confirmerModal(g, true);
  await g.waitForFunction(() => document.querySelectorAll('#table-fournisseurs tbody tr').length === 3);
  r = await appel(g, 'app/action/prix_save.php', { piece_id: Number(idNouvelle), fournisseur_id: 2, prix: '3' });
  L.verifier(r.status === 400 && r.json.erreur.includes('désactivé'), 'API : pas de nouveau prix chez un fournisseur désactivé : ' + (r.json && r.json.erreur));
  await appel(g, 'app/action/fournisseur_activer.php', { id: 2, actif: true });

  // =====================================================================================================================
  //  6. Catégories
  // =====================================================================================================================
  console.log('6. Catégories');
  await L.aller(g, 'categories');
  await g.waitForSelector('#table-categories tbody tr td:not(.dataTables_empty)');
  L.verifier((await g.$$('#table-categories tbody tr')).length === 6, '5 catégories de démonstration + celle créée à l\'instant');
  L.verifier((await g.$$('#table-categories img')).length === 0, 'nom de catégorie avec balises : affiché comme texte');
  await g.click('#btn-nouvelle'); await g.waitForSelector('#modal-categorie.show');
  await g.fill('#ca-nom', 'Vannes A1'); await g.fill('#ca-description', 'Vannes et robinets'); await g.click('#categorie-enregistrer');
  await g.waitForSelector('#modal-categorie', { state: 'hidden' });
  await g.waitForFunction(() => document.querySelector('#table-categories').textContent.includes('Vannes A1'));
  await viderToasts(g);
  await g.click('#btn-nouvelle'); await g.waitForSelector('#modal-categorie.show');
  await g.fill('#ca-nom', 'brûleurs'); await g.click('#categorie-enregistrer');
  await g.waitForFunction(() => /porte déjà ce nom/.test(document.getElementById('categorie-erreur').textContent));
  L.verifier(true, 'catégorie en double refusée (casse et accents ignorés)');
  await g.click('#modal-categorie .btn-outline-secondary'); await g.waitForSelector('#modal-categorie', { state: 'hidden' });
  await g.click('#table-categories tbody tr:has-text("Vannes A1") button[data-action="modifier"]'); await g.waitForSelector('#modal-categorie.show');
  L.verifier((await g.inputValue('#ca-description')) === 'Vannes et robinets', 'modification : champs préremplis');
  await g.fill('#ca-nom', 'Vannes et robinets A1'); await g.click('#categorie-enregistrer');
  await g.waitForSelector('#modal-categorie', { state: 'hidden' });
  await g.waitForFunction(() => document.querySelector('#table-categories').textContent.includes('Vannes et robinets A1'));
  // suppression : refusée s'il y a des pièces (message clair, aucun appel), permise sinon (avec confirmation)
  await viderToasts(g);
  const nbAvant = Number(sql("SELECT COUNT(*) FROM categories"));
  await g.click('#table-categories tbody tr:has-text("Brûleurs") button[data-action="supprimer"]');
  await g.waitForFunction(() => /Impossible de supprimer la catégorie « Brûleurs » : 2 pièces l'utilisent encore/.test((document.getElementById('toasts') || { textContent: '' }).textContent));
  L.verifier(Number(sql("SELECT COUNT(*) FROM categories")) === nbAvant, 'catégorie avec pièces : suppression refusée avec un message clair');
  r = await appel(g, 'app/action/categorie_supprimer.php', { id: 1 });
  L.verifier(r.status === 400 && /2 pièces l'utilisent encore/.test(r.json.erreur), 'le serveur refuse aussi : ' + (r.json && r.json.erreur));
  await viderToasts(g);
  await g.click('#table-categories tbody tr:has-text("Vannes et robinets A1") button[data-action="supprimer"]');
  m = await confirmerModal(g, true);
  L.verifier(m.includes('Vannes et robinets A1'), 'confirmation de suppression');
  await g.waitForFunction(() => !document.querySelector('#table-categories').textContent.includes('Vannes et robinets A1'));
  L.verifier(Number(sql("SELECT COUNT(*) FROM categories")) === nbAvant - 1, 'catégorie vide supprimée');
  L.verifier(sql("SELECT COUNT(*) FROM journal WHERE action LIKE 'categorie.%'") === '4', 'écritures de catégories journalisées (création rapide, création, modification, suppression)');

  // les noms avec balises restent inoffensifs partout (fenêtre des prix d'un fournisseur, formulaire, listes déroulantes)
  await L.aller(g, 'piece_edit&id=' + idNouvelle);
  L.verifier((await g.inputValue('#f-nom')) === XSS1 && (await g.$$('#f-categorie option')).length >= 6, 'formulaire : le nom avec balises est une valeur, pas du HTML');
  await g.click('#btn-nouvelle-categorie'); await g.fill('#nc-nom', 'Annulée'); await g.press('#nc-nom', 'Escape');
  L.verifier(await g.$eval('#bloc-nouvelle-categorie', e => e.hidden), 'Échap ferme la création rapide de catégorie');

  // =====================================================================================================================
  //  7. Employé : consultation seulement, aucun coût
  // =====================================================================================================================
  console.log('7. Employé');
  const e = await nouvelle();
  await L.connecter(e, 'employe');
  await L.aller(e, 'pieces'); await lignes(e, Number(sql("SELECT COUNT(*) FROM pieces WHERE actif = 1")));   // P-0150 (désactivée) est cachée
  L.verifier((await e.$$('.cat-actions')).length === 0, 'aucun bouton d\'écriture pour l\'employé');
  L.verifier((await qte(e, 'P-0009')) === '14', 'l\'employé ne compte que son entreprise : P-0009 = 14 (et non 18) : ' + await qte(e, 'P-0009'));
  const brut = await appel(e, 'app/ajax/pieces_data.php?draw=1&start=0&length=100', null);
  L.verifier(brut.status === 200 && !/cout|prix|valeur/i.test(brut.texte.replace(/"categorie":"[^"]*"/g, '')), 'JSON de la liste : aucun coût ni prix');
  await L.aller(e, 'piece_voir&id=1');
  const html = await e.content();
  L.verifier(!/section-prix|Coût moyen|Ajouter un prix|Écart vs|Distribution Chauffage|14,50|F1-0001/.test(html), 'fiche de l\'employé : aucun coût ni prix dans le HTML');
  L.verifier((await e.$('#btn-activer')) === null && (await e.$('.cat-actions a:has-text("Modifier")')) === null && (await e.$('.cat-actions a:has-text("Étiquette")')) === null && (await e.$('.cat-actions a:has-text("Réception")')) === null, 'fiche de l\'employé : pas de boutons de gestion');
  L.verifier(!!(await e.$('.cat-actions a:has-text("Transfert")')) && !!(await e.$('.cat-actions a:has-text("Sortie")')), 'l\'employé garde Transfert et Sortie');
  const stE = (await textes(e, '#table-stock tbody tr')).join(' | ');
  L.verifier(stE.includes('Beauchemin') && !stE.includes('Boutique Chaleur'), 'l\'employé ne voit que le stock de son entreprise : ' + stE);
  L.verifier(!!(await e.$('#table-codes img')) && (await e.$$('#table-mouvements tbody tr')).length === 4, 'l\'employé voit les codes et les mouvements');
  for (const page of ['piece_edit', 'piece_edit&id=1', 'fournisseurs', 'categories']) {
    await L.aller(e, page);
    L.verifier((await e.textContent('.alert-danger')).includes('pas la permission'), 'employé refusé sur la page ' + page);
  }
  // endpoints : refus pour l'employé (écriture et lecture de coûts)
  const interdits = [
    ['app/action/piece_save.php', { code: 'P-0777', nom: 'Pirate', unite: 'unité' }],
    ['app/action/piece_activer.php', { id: 1, actif: false, confirmer: true }],
    ['app/action/prix_save.php', { piece_id: 1, fournisseur_id: 1, prix: '1' }],
    ['app/action/prix_supprimer.php', { piece_id: 1, fournisseur_id: 1 }],
    ['app/action/fournisseur_save.php', { nom: 'Pirate' }],
    ['app/action/fournisseur_activer.php', { id: 1, actif: false }],
    ['app/action/categorie_save.php', { nom: 'Pirate' }],
    ['app/action/categorie_supprimer.php', { id: 1 }],
  ];
  for (const [url, corps] of interdits) {
    const x = await appel(e, url, corps);
    L.verifier(x.status === 400 && x.json && x.json.ok === false && /permission/.test(x.json.erreur), 'employé refusé : ' + url + ' (' + x.status + ')');
  }
  for (const url of ['app/ajax/piece_prix.php?piece_id=1', 'app/ajax/fournisseur_liste.php', 'app/ajax/fournisseur_prix.php?id=1', 'app/ajax/piece_code_proposer.php', 'app/ajax/piece_code_verifier.php?code=ABC&role=interne']) {
    const x = await appel(e, url, null);
    L.verifier(x.json && x.json.ok === false && /permission/.test(x.json.erreur) && !/Distribution|14\.5/.test(x.texte), 'employé refusé en lecture : ' + url);
  }
  L.verifier(sql("SELECT COUNT(*) FROM pieces WHERE nom = 'Pirate'") === '0' && sql("SELECT COUNT(*) FROM fournisseurs WHERE nom = 'Pirate'") === '0', 'rien n\'a été écrit par l\'employé');
  // jeton CSRF absent : 403 ; GET sur un endpoint d'écriture : 405
  let x;
  // matrice de tous les points d'entrée : non connecté -> 401 ; écriture sans jeton -> 403 ; GET sur une écriture -> 405
  const ecritures = ['piece_save', 'piece_activer', 'prix_save', 'prix_supprimer', 'fournisseur_save', 'fournisseur_activer', 'categorie_save', 'categorie_supprimer'].map(n => 'app/action/' + n + '.php');
  const lectures = ['pieces_data', 'piece_prix', 'piece_code_verifier', 'piece_code_proposer', 'fournisseur_liste', 'fournisseur_prix', 'categorie_liste'].map(n => 'app/ajax/' + n + '.php');
  const anon = await nouvelle();
  await anon.goto(L.BASE + '/login.php');
  for (const url of ecritures.concat(lectures)) {
    const post = ecritures.includes(url);
    const y = await anon.evaluate(async ([u, post]) => { const r = await fetch(u, post ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}); return r.status; }, [url, post]);
    L.verifier(y === 401, 'non connecté : 401 sur ' + url + ' (' + y + ')');
  }
  for (const url of ecritures) {
    x = await appel(g, url, {}, { sansJeton: true });
    L.verifier(x.status === 403, 'POST sans jeton CSRF : 403 sur ' + url + ' (' + x.status + ')');
    x = await appel(g, url, null);
    L.verifier(x.status === 405, 'GET sur l\'endpoint d\'écriture ' + url + ' : 405 (' + x.status + ')');
  }
  for (const url of ecritures) {
    x = await appel(g, url, '{"mauvais": "json"', { brut: true });   // corps non JSON valide : traité comme vide -> erreur de validation, jamais une erreur serveur
    L.verifier(x.status === 400 || x.status === 405, 'corps invalide : ' + url + ' répond proprement (' + x.status + ')');
  }
  // l'employé peut lire la liste des pièces et des catégories (filtre) mais rien d'autre
  x = await appel(e, 'app/ajax/categorie_liste.php', null);
  L.verifier(x.status === 200 && x.json.ok && x.json.categories.length >= 5, 'employé : liste des catégories (filtre) permise');
  // session expirée : un tableau qui se recharge ramène à la connexion
  const exp = await nouvelle();
  await L.connecter(exp, 'gestionnaire'); await L.aller(exp, 'pieces'); await lignes(exp, Number(sql("SELECT COUNT(*) FROM pieces WHERE actif = 1")));
  await exp.context().clearCookies();
  await Promise.all([exp.waitForURL(/login\.php/, { timeout: 8000 }), exp.selectOption('#f-statut', 'toutes')]);
  L.verifier(/login\.php/.test(exp.url()), 'session expirée : retour à la page de connexion');
  const lib = await g.evaluate(async () => (await fetch('app/action/piece_lib.php')).status);
  g.erreurs = g.erreurs.filter(e => !/piece_lib\.php/.test(e));
  L.verifier(lib === 404, 'la bibliothèque piece_lib.php appelée directement : 404 (' + lib + ')');

  // =====================================================================================================================
  //  8. Gestionnaire d'une seule entreprise (cloisonnement)
  // =====================================================================================================================
  console.log('8. Cloisonnement des entreprises');
  const g2 = await nouvelle();
  await g2.goto(L.BASE + '/login.php');
  await g2.fill('input[name=username]', 'gestionnaire2'); await g2.fill('input[name=password]', 'Test-Beauchemin-1');
  await Promise.all([g2.waitForNavigation(), g2.click('button[type=submit]')]);
  await L.aller(g2, 'piece_voir&id=1');
  const st2 = (await textes(g2, '#table-stock tbody tr')).join(' | ');
  L.verifier(st2.includes('Boutique Chaleur') && !st2.includes('Beauchemin') && !st2.includes('Cube 12'), 'gestionnaire 2 : seulement le stock de Boutique Chaleur : ' + st2);
  await g2.waitForSelector('#table-prix tbody tr');
  L.verifier(!(await g2.textContent('#couts-moyens')).includes('Beauchemin'), 'gestionnaire 2 : pas de coût moyen de Beauchemin');
  let y = await appel(g2, 'app/ajax/piece_prix.php?piece_id=1', null);
  L.verifier(!/Beauchemin|14\.5000/.test(JSON.stringify(y.json.couts)) && Object.keys(y.json.prix[0].ecarts).length === 0, 'gestionnaire 2 : JSON des prix sans l\'entreprise 1');
  await L.aller(g2, 'pieces'); await lignes(g2, Number(sql("SELECT COUNT(*) FROM pieces WHERE actif = 1")));
  L.verifier((await qte(g2, 'P-0001')) === '0' && (await qte(g2, 'P-0009')) === '4', 'gestionnaire 2 : quantités de son entreprise seulement');
  y = await appel(g2, 'app/action/piece_save.php', { id: 1, code: 'P-0001', nom: 'Thermocouple 36 po', unite: 'unité', seuils: [{ entreprise_id: 1, minimum: '99' }] });
  L.verifier(y.status === 400 && /accès à cette entreprise/.test(y.json.erreur), 'gestionnaire 2 ne peut pas fixer le minimum de l\'entreprise 1 : ' + (y.json && y.json.erreur));
  L.verifier(sql("SELECT minimum FROM seuils WHERE piece_id = 1 AND entreprise_id = 1") === '10.000', 'le minimum de l\'entreprise 1 est inchangé');
  y = await appel(g2, 'app/action/piece_save.php', { id: 1, code: 'P-0001', nom: 'Thermocouple 36 po', unite: 'unité', categorie_id: 2, codes: [{ code: '012345678905', type: 'fabricant' }], seuils: [{ entreprise_id: 2, minimum: '7' }] });
  L.verifier(y.status === 200 && sql("SELECT minimum FROM seuils WHERE piece_id = 1 AND entreprise_id = 2") === '7.000' && sql("SELECT minimum FROM seuils WHERE piece_id = 1 AND entreprise_id = 1") === '10.000', 'gestionnaire 2 : son propre minimum est enregistré, celui de l\'autre entreprise reste intact');
  y = await appel(g2, 'app/action/piece_activer.php', { id: 7, actif: false, simuler: true });
  L.verifier(y.status === 400 && y.json.champ === 'confirmation' && /autre entreprise/.test(y.json.erreur) && !/12/.test(y.json.erreur), 'désactivation par le gestionnaire 2 : le stock de l\'autre entreprise est mentionné sans quantité : ' + (y.json && y.json.erreur));
  y = await appel(g2, 'app/ajax/piece_code_verifier.php?code=EMP-000003&role=alias&piece_id=2', null);
  L.verifier(y.json.disponible === false && /autre entreprise/.test(y.json.message) && !/Cube 12/.test(y.json.message), 'le nom d\'un emplacement d\'une autre entreprise n\'est pas divulgué : ' + y.json.message);
  y = await appel(g2, 'app/ajax/piece_code_verifier.php?code=EMP-000002&role=alias&piece_id=2', null);
  L.verifier(y.json.disponible === false && /Entrepôt principal/.test(y.json.message), 'le nom d\'un emplacement de son entreprise est donné : ' + y.json.message);

  // =====================================================================================================================
  //  9. Tablette (768 px) et aucun défaut de console
  // =====================================================================================================================
  console.log('9. Tablette et console');
  const LONG = 'W'.repeat(150);                       // 150 caractères sans espace : ne doit pas faire déborder les pages
  r = await appel(g, 'app/action/piece_save.php', { code: 'P-0400', nom: LONG, description: 'D'.repeat(300), unite: 'lot', codes: [{ code: 'Z'.repeat(64), type: 'autre' }] });
  L.verifier(r.status === 200, 'pièce au nom de 150 caractères et alias de 64 caractères créée');
  const idLong = r.json.id;
  const t = await nouvelle({ width: 768, height: 1024 });
  await L.connecter(t, 'gestionnaire');
  await L.aller(t, 'pieces'); await lignes(t, Number(sql("SELECT COUNT(*) FROM pieces WHERE actif = 1")));
  const hauteurs = await t.evaluate(() => ({
    bouton: document.querySelector('.cat-actions .btn').getBoundingClientRect().height,
    ligne: document.querySelector('#table-pieces tbody tr').getBoundingClientRect().height,
    champ: document.getElementById('recherche').getBoundingClientRect().height,
    debord: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  L.verifier(hauteurs.bouton >= 44 && hauteurs.ligne >= 44 && hauteurs.champ >= 44, 'zones cliquables ≥ 44 px sur tablette : ' + JSON.stringify(hauteurs));
  for (const route of ['pieces', 'piece_voir&id=1', 'piece_edit&id=1', 'piece_edit', 'fournisseurs', 'categories', 'piece_voir&id=' + idLong, 'piece_edit&id=' + idLong]) {
    await L.aller(t, route); await attendre(300);
    const d = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    L.verifier(d <= 1, 'pas de défilement horizontal de la page à 768 px : ' + route + ' (' + d + ')');
  }
  await L.aller(t, 'piece_edit');
  const champs = await t.$$eval('#form-piece input:not([type=checkbox]):not([type=hidden]), #form-piece select, #form-piece button.btn', els => els.filter(e => e.offsetParent !== null).map(e => e.getBoundingClientRect().height));
  L.verifier(champs.every(hh => hh >= 43.5), 'formulaire de pièce : champs et boutons ≥ 44 px (' + champs.filter(hh => hh < 43.5).join(',') + ')');
  const inputmode = await t.$$eval('.champ-seuil', els => els.map(e => e.getAttribute('inputmode')));
  L.verifier(inputmode.every(m => m === 'decimal'), 'minimums : inputmode="decimal"');

  // ---- bilan : XSS, console, journal PHP --------------------------------------------------------------------------
  L.verifier(dialogues.length === 0, 'aucune boîte alert() déclenchée par du contenu injecté : ' + JSON.stringify(dialogues));
  pages.forEach((p, i) => L.verifier(reelles(p).length === 0, 'aucune erreur console/JS (page ' + (i + 1) + ') : ' + JSON.stringify(reelles(p))));
  L.verifier(sql("SELECT COUNT(*) FROM stock s JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m ON m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id WHERE s.quantite <> m.q") === '0', 'invariant : stock = somme des mouvements (le catalogue n\'y touche pas)');
  await b.close();
  process.exit(L.bilan());

  async function qte(p, code) { return (await textes(p, '#table-pieces tbody tr:has-text("' + code + '") td:nth-child(5)'))[0]; }
})().catch(e => { console.error(e); process.exit(1); });
