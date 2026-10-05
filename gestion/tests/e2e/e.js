// Test de bout en bout du module E — Administration (utilisateurs, entreprises, emplacements, journal, profil, sauvegarde).
//   cd gestion && tools/serveur.sh start bea_e 8107 --neuf
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8107 DB_NAME=bea_e node tests/e2e/e.js
// Le test remet d'abord la base de démonstration à zéro (tools/serveur.sh reset $DB_NAME), crée ses propres comptes et données,
// et la remet à zéro à la fin. Il suppose donc un serveur de DÉVELOPPEMENT branché sur la base $DB_NAME (défaut bea_e) ;
// le journal PHP est lu dans /tmp/bea-<port>.log (port de BASE_URL). Une base « <DB_NAME>_restore » sert à essayer la restauration.
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib.js');

const DB = process.env.DB_NAME || 'bea_e';
const RACINE = path.resolve(__dirname, '..', '..');
const PORT = new URL(L.BASE).port || '80';
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const MDP = 'Test-Beauchemin-1';
const XSS1 = '<img src=x onerror=alert(1)>';
const XSS2 = '<img src=x onerror=alert(2)>';
const XSS3 = '<img src=x onerror=alert(3)>';
const secrets = [];                       // tous les mots de passe utilisés : aucun ne doit se retrouver dans le journal ni dans le journal PHP

const dialogues = [];
const attendre = ms => new Promise(r => setTimeout(r, ms));
function sql(requete) { return execSync('mysql -uroot -N --default-character-set=utf8mb4 ' + DB, { input: requete, cwd: RACINE }).toString().trim(); }
function sqlDb(db, requete) { return execSync('mysql -uroot -N --default-character-set=utf8mb4 ' + db, { input: requete, cwd: RACINE }).toString().trim(); }
function hash(mdp) { return spawnSync('php', ['-r', 'echo password_hash($argv[1], PASSWORD_DEFAULT);', '--', mdp]).stdout.toString(); }
function verifierHash(mdp, h) { return spawnSync('php', ['-r', 'echo password_verify($argv[1], $argv[2]) ? "oui" : "non";', '--', mdp, h]).stdout.toString() === 'oui'; }
/** Compte de test créé directement en base (rapide). entreprises : tableau d'id (vide pour un administrateur). */
function creerCompte(nom, role, entreprises, mdp) {
  mdp = mdp || MDP; secrets.push(mdp);
  sql("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('" + nom + "', 'Compte " + nom + "', '" + hash(mdp) + "', '" + role + "');");
  const id = parseInt(sql("SELECT id FROM utilisateurs WHERE nom_utilisateur = '" + nom + "'"), 10);
  (entreprises || []).forEach(e => sql('INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES (' + id + ', ' + e + ');'));
  return id;
}

function suivre(page) { page.on('dialog', d => { dialogues.push(d.message()); d.dismiss().catch(() => {}); }); return page; }
/** Erreurs de console « réelles » : les 4xx provoqués volontairement (validation, refus d'accès) et les lectures abandonnées sont ignorés. */
const reelles = p => p.erreurs.filter(e => !/status of 40[0-9]/.test(e) && !/ERR_ABORTED/.test(e) && !/ERR_INTERNET_DISCONNECTED/.test(e)
  && !/requestfailed: \S+\.(woff2?|ttf)$/.test(e) && !/requestfailed: \S+page=backup_database/.test(e)      // polices interrompues par un changement de page ; téléchargement de la sauvegarde
  && !/requestfailed: \S+\/(utilisateurs_data|entreprises_data|emplacement_data|journal_data|journal_export|emplacement_code_proposer|emplacement_detail|utilisateur_detail|entreprise_detail)\.php/.test(e));   // lectures abandonnées parce que la page change ou qu'une nouvelle recherche part

async function appel(p, url, corps, opts) {
  opts = opts || {};
  return p.evaluate(async ([url, corps, opts]) => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (!opts.sansJeton && meta) h['X-CSRF-Token'] = meta.getAttribute('content');
    const r = await fetch(url, corps === null ? { credentials: 'same-origin' } : { method: opts.methode || 'POST', credentials: 'same-origin', headers: h, body: JSON.stringify(corps) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, corps, opts]);
}
/** Lecture d'un tableau DataTables (POST encodé comme le fait le navigateur) : {status, json, texte}. */
async function liste(p, url, champs) {
  return p.evaluate(async ([url, champs]) => {
    const jeton = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': jeton }, body: new URLSearchParams(champs).toString() });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ }
    return { status: r.status, json: j, texte: t };
  }, [url, champs]);
}
async function toastTexte(p) { return p.evaluate(() => (document.getElementById('toasts') || { textContent: '' }).textContent); }
async function viderToasts(p) { await p.evaluate(() => document.querySelectorAll('#toasts .alert').forEach(e => e.remove())); }
async function attendreToast(p, texte) { await p.waitForFunction(t => (document.getElementById('toasts') || { textContent: '' }).textContent.includes(t), texte, { timeout: 8000 }); }
async function tx(p, sel) { return (await p.textContent(sel)).replace(/\s+/g, ' ').trim(); }
async function confirmerModal(p, oui) {
  await p.waitForSelector('#modal-confirmer.show');
  const texte = await p.textContent('#modal-confirmer-message');
  await p.click(oui ? '#modal-confirmer-oui' : '#modal-confirmer-non');
  await p.waitForSelector('#modal-confirmer', { state: 'hidden' });
  return texte;
}
/** Se connecte avec un compte précis (retourne {ok, erreur}). */
async function connecterComme(p, nom, mdp) {
  await p.goto(L.BASE + '/login.php');
  await p.fill('input[name=username]', nom);
  await p.fill('input[name=password]', mdp);
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  if (/login\.php/.test(p.url())) { return { ok: false, erreur: (await p.textContent('.alert-danger').catch(() => '')) || '' }; }
  return { ok: true };
}
/** Attend que le tableau contienne $texte (et que le chargement soit terminé). */
async function attendreTable(p, table, texte) {
  await p.waitForFunction(([t, x]) => { const e = document.querySelector(t); return e && e.textContent.includes(x); }, [table, texte], { timeout: 8000 });
}
async function chercher(p, table, texte) {
  await p.fill('#f-recherche', texte);
  await p.waitForFunction(([t, x]) => {
    const rows = [...document.querySelectorAll(t + ' tbody tr')].filter(r => !r.querySelector('.dataTables_empty'));
    return rows.length === 1 && rows[0].textContent.includes(x);
  }, [table, texte], { timeout: 8000 });
  return p.locator(table + ' tbody tr').first();
}
async function lignesTable(p, table) { return p.$$eval(table + ' tbody tr', trs => trs.map(t => t.innerText.replace(/\s+/g, ' ').trim())); }
const dernierJournal = (action) => sql("SELECT details FROM journal WHERE action = '" + action + "' ORDER BY id DESC LIMIT 1");
const nbJournal = (action) => parseInt(sql("SELECT COUNT(*) FROM journal WHERE action = '" + action + "'"), 10);
function remise() { try { execSync('tools/serveur.sh reset ' + DB, { cwd: RACINE, stdio: 'pipe' }); } catch (e) { console.log('AVERTISSEMENT : remise à zéro impossible (' + String(e.message).split('\n')[0] + ')'); } }

(async () => {
  remise();
  let debutJournal = 0;                     // on ne lit que ce que PHP écrit PENDANT le test
  try { debutJournal = fs.statSync(JOURNAL).size; } catch (e) { debutJournal = 0; }
  const b = await L.lancer();
  const pages = [];
  const nouvelle = async (viewport) => { const p = suivre(await L.nouvellePage(b, viewport)); pages.push(p); return p; };

  // Comptes de test (créés en base) : les entreprises 1 = Beauchemin, 2 = Boutique Chaleur
  creerCompte('sess1', 'gestionnaire', [1]);
  creerCompte('sess2', 'gestionnaire', [1, 2]);
  creerCompte('verrou1', 'employe', [1]);
  creerCompte('mdp1', 'employe', [1], 'Ancien-Mot-2026');
  creerCompte('mdp2', 'employe', [1], 'Ancien-Mot-2027');
  creerCompte('bch1', 'gestionnaire', [2]);

  const a = await nouvelle();
  await L.connecter(a, 'admin');

  // =====================================================================================================================
  console.log('1. Utilisateurs : liste');
  await L.aller(a, 'utilisateurs');
  await attendreTable(a, '#table-utilisateurs', 'gestionnaire1');
  let rows = await lignesTable(a, '#table-utilisateurs');
  L.verifier(rows.length >= 9, 'la liste montre tous les comptes (' + rows.length + ')');
  const ligneAdmin = rows.find(r => r.startsWith('admin'));
  L.verifier(/vous/.test(ligneAdmin) && /Administrateur/.test(ligneAdmin) && /Toutes/.test(ligneAdmin), 'ligne admin : « vous », rôle, toutes les entreprises (' + ligneAdmin + ')');
  const ligneG = rows.find(r => r.startsWith('gestionnaire1'));
  L.verifier(/Gestionnaire/.test(ligneG) && /Beauchemin, Boutique Chaleur/.test(ligneG) && /Actif/.test(ligneG) && /Jamais|20\d\d-/.test(ligneG), 'ligne gestionnaire1 : rôle, entreprises, statut');
  const ligneSoi = a.locator('#table-utilisateurs tbody tr', { has: a.locator('.badge-info') });
  L.verifier(await ligneSoi.locator('button[data-action=desactiver]').count() === 0, 'pas de bouton « Désactiver » sur sa propre ligne');
  let brut = await liste(a, 'app/ajax/utilisateurs_data.php', { draw: '1', start: '0', length: '50' });
  L.verifier(brut.status === 200 && !/mot_de_passe|\$2y\$/.test(brut.texte), 'le JSON de la liste ne contient aucun mot de passe ni empreinte');
  // chaque colonne triable répond sans erreur (alias DataTable = columns[].data)
  const colUtil = ['nom_utilisateur', 'nom_complet', 'role', 'entreprises', 'actif', 'derniere_connexion', 'verrouille'];
  for (let i = 0; i < colUtil.length; i++) {
    for (const dir of ['asc', 'desc']) {
      const r = await liste(a, 'app/ajax/utilisateurs_data.php', { draw: '1', start: '0', length: '50', 'order[0][column]': String(i), 'order[0][dir]': dir, ['columns[' + i + '][data]']: colUtil[i] });
      L.verifier(r.status === 200 && r.json && r.json.data.length >= 9, 'tri utilisateurs par ' + colUtil[i] + ' ' + dir);
    }
  }
  // filtre de statut
  await a.selectOption('#f-statut', 'inactifs');
  await a.waitForFunction(() => /Aucun utilisateur/.test(document.querySelector('#table-utilisateurs').textContent));
  L.verifier(true, 'filtre « Désactivés » : liste vide avec message');
  await a.selectOption('#f-statut', 'tous');
  await attendreTable(a, '#table-utilisateurs', 'gestionnaire1');

  // =====================================================================================================================
  console.log('2. Utilisateurs : création (mot de passe généré, affiché une seule fois)');
  await a.click('#btn-nouveau');
  await a.waitForSelector('#modal-utilisateur.show');
  L.verifier(await a.inputValue('#u-role') === 'employe', 'rôle par défaut : employé (le moins de droits)');
  L.verifier(/Consulte les pièces/.test(await tx(a, '#u-role-aide')), 'explication du rôle employé affichée');
  await a.selectOption('#u-role', 'gestionnaire');
  L.verifier(/Voit les coûts/.test(await tx(a, '#u-role-aide')), 'explication du rôle gestionnaire');
  await a.selectOption('#u-role', 'admin');
  L.verifier(/Accès complet/.test(await tx(a, '#u-role-aide')) && await a.isDisabled('#u-ent-1') && await a.isVisible('#u-entreprises-admin'), 'rôle administrateur : explication, cases d\'entreprise désactivées');
  await a.selectOption('#u-role', 'employe');
  L.verifier(!(await a.isDisabled('#u-ent-1')), 'rôle employé : cases d\'entreprise actives');
  // champs vides
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => !document.querySelector('[data-erreur-pour="nom_utilisateur"]').hidden);
  L.verifier(/obligatoire/.test(await tx(a, '[data-erreur-pour=nom_utilisateur]')), 'nom d\'utilisateur obligatoire (message sous le champ)');
  await a.fill('#u-nom', 'Tech.Un');
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => !document.querySelector('[data-erreur-pour="nom_complet"]').hidden);
  L.verifier(/Le nom complet est obligatoire/.test(await tx(a, '[data-erreur-pour=nom_complet]')), 'nom complet obligatoire');
  await a.fill('#u-complet', 'Technicien Un');
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => !document.querySelector('[data-erreur-pour="entreprise_ids"]').hidden);
  L.verifier(/au moins une entreprise/.test(await tx(a, '[data-erreur-pour=entreprise_ids]')), 'employé sans entreprise refusé');
  await a.check('#u-ent-1', { force: true });
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => !document.querySelector('[data-erreur-pour="mot_de_passe"]').hidden);
  L.verifier(/mot de passe est obligatoire|au moins 10/.test(await tx(a, '[data-erreur-pour=mot_de_passe]')), 'mot de passe obligatoire');
  await a.fill('#u-mdp', 'court');
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => /au moins 10 caractères/.test(document.querySelector('[data-erreur-pour="mot_de_passe"]').textContent));
  L.verifier(true, 'mot de passe de moins de 10 caractères refusé');
  // nom d'utilisateur invalide
  await a.fill('#u-nom', 'tech un!');
  await a.fill('#u-mdp', 'Assez-long-1234');
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => /3 à 50 caractères/.test(document.querySelector('[data-erreur-pour="nom_utilisateur"]').textContent));
  L.verifier(true, 'nom d\'utilisateur avec espace et ponctuation refusé');
  // doublon insensible à la casse
  await a.fill('#u-nom', 'ADMIN');
  await a.click('#utilisateur-enregistrer');
  await a.waitForFunction(() => /déjà utilisé/.test(document.querySelector('[data-erreur-pour="nom_utilisateur"]').textContent));
  L.verifier(true, '« ADMIN » refusé : doublon de « admin » sans égard à la casse');
  await a.fill('#u-nom', 'Tech.Un');
  // générer
  await a.click('#u-mdp-gen');
  const generé = await a.inputValue('#u-mdp');
  L.verifier(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/.test(generé) && !/[0O1lI]/.test(generé), 'mot de passe généré : 4 groupes de 4 caractères sans ambiguïté (' + generé.length + ' caractères)');
  L.verifier(await a.getAttribute('#u-mdp', 'type') === 'text', 'le mot de passe généré est visible');
  await a.click('#u-mdp-gen');
  L.verifier(await a.inputValue('#u-mdp') !== generé, 'chaque génération donne un autre mot de passe');
  await viderToasts(a);
  await a.click('#u-mdp-copier');
  await a.waitForFunction(() => /Copié|Copie automatique impossible/.test((document.getElementById('toasts') || { textContent: '' }).textContent));
  L.verifier(true, 'bouton Copier : retour à l\'utilisateur');
  const mdpTech = await a.inputValue('#u-mdp');
  secrets.push(mdpTech);
  await a.click('#utilisateur-enregistrer');
  await a.waitForSelector('#modal-mdp.show');
  L.verifier(await a.inputValue('#mdp-champ') === mdpTech && await a.getAttribute('#mdp-champ', 'readonly') !== null, 'mot de passe affiché (lecture seule) après la création');
  L.verifier(/Compte créé/.test(await tx(a, '#modal-mdp-titre')) && /ne sera plus affiché/.test(await tx(a, '#mdp-note')), 'message : le mot de passe ne sera plus affiché');
  await a.click('#mdp-fermer');
  await a.waitForSelector('#modal-mdp', { state: 'hidden' });
  await a.waitForFunction(() => document.querySelector('#mdp-champ').value === '');
  L.verifier(true, 'champ du mot de passe vidé à la fermeture');
  L.verifier(!(await a.content()).includes(mdpTech), 'le mot de passe n\'est plus nulle part dans la page');
  await attendreTable(a, '#table-utilisateurs', 'Tech.Un');
  const dbTech = sql("SELECT mot_de_passe, role, actif FROM utilisateurs WHERE nom_utilisateur = 'tech.un'").split('\t');
  L.verifier(/^\$2y\$/.test(dbTech[0]) && verifierHash(mdpTech, dbTech[0]) && dbTech[1] === 'employe' && dbTech[2] === '1', 'empreinte bcrypt vérifiable en base, rôle employé, actif');
  L.verifier(sql("SELECT GROUP_CONCAT(entreprise_id) FROM utilisateur_entreprises WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE nom_utilisateur='tech.un')") === '1', 'entreprise 1 seulement');
  L.verifier(nbJournal('utilisateur.cree') === 1 && !dernierJournal('utilisateur.cree').includes(mdpTech), 'journal : utilisateur.cree sans mot de passe');
  // le nouveau compte se connecte avec le mot de passe affiché
  const t1 = await nouvelle();
  L.verifier((await connecterComme(t1, 'Tech.Un', mdpTech)).ok, 'le nouveau compte se connecte avec le mot de passe généré (nom d\'utilisateur insensible à la casse)');
  await L.aller(t1, 'stock');
  L.verifier(!/pas la permission/.test(await t1.textContent('body')), 'le nouvel employé voit le stock');
  // création d'un deuxième administrateur et d'un gestionnaire par l'API
  let r = await appel(a, 'app/action/utilisateur_save.php', { nom_utilisateur: 'admin2', nom_complet: 'Second Admin', role: 'admin', actif: true, entreprise_ids: [], mot_de_passe: 'Admin-Deux-2026' });
  secrets.push('Admin-Deux-2026');
  L.verifier(r.status === 200 && r.json.ok && r.json.cree && !/Admin-Deux/.test(r.texte), 'création d\'un administrateur (sans entreprise) ; la réponse ne contient pas le mot de passe');
  L.verifier(sql("SELECT COUNT(*) FROM utilisateur_entreprises WHERE utilisateur_id = " + r.json.id) === '0', 'un administrateur n\'a aucune ligne d\'entreprise');

  // =====================================================================================================================
  console.log('3. Utilisateurs : validations côté serveur (API directe)');
  const base = { nom_utilisateur: 'valide.un', nom_complet: 'Valide', role: 'employe', actif: true, entreprise_ids: [1], mot_de_passe: 'Mot-de-passe-OK-1' };
  const essais = [
    [{ nom_utilisateur: 'ab' }, /3 à 50/, 'nom trop court'],
    [{ nom_utilisateur: 'a'.repeat(51) }, /50 caractères/, 'nom trop long'],
    [{ nom_utilisateur: 'jean-françois' }, /3 à 50/, 'nom avec accent'],
    [{ nom_utilisateur: 'b\nob' }, /non permis/, 'saut de ligne dans le nom'],
    [{ nom_utilisateur: '<script>x' }, /3 à 50/, 'nom avec balise'],
    [{ nom_utilisateur: 'Admin' }, /déjà utilisé/, 'doublon « Admin » / « admin »'],
    [{ nom_utilisateur: 'GESTIONNAIRE1' }, /déjà utilisé/, 'doublon en majuscules'],
    [{ nom_complet: '' }, /obligatoire/, 'nom complet vide'],
    [{ nom_complet: 'x'.repeat(101) }, /100 caractères/, 'nom complet trop long'],
    [{ nom_complet: 'a\u0000b' }, /non permis/, 'caractère de contrôle'],
    [{ role: 'root' }, /Choisissez un rôle/, 'rôle inconnu'],
    [{ role: ['admin'] }, /Choisissez un rôle/, 'rôle en tableau'],
    [{ entreprise_ids: [] }, /au moins une entreprise/, 'employé sans entreprise'],
    [{ entreprise_ids: [99] }, /introuvable/, 'entreprise inexistante'],
    [{ entreprise_ids: ['1; DROP TABLE x'] }, /invalide/, 'identifiant d\'entreprise non numérique'],
    [{ entreprise_ids: 'abc' }, /invalide/, 'liste d\'entreprises non valide'],
    [{ mot_de_passe: 'Court-1' }, /au moins 10/, 'mot de passe trop court'],
    [{ mot_de_passe: 'x'.repeat(73) }, /trop long/, 'mot de passe trop long (limite bcrypt)'],
    [{ mot_de_passe: '          ' }, /espaces/, 'mot de passe d\'espaces'],
    [{ mot_de_passe: 'valide.un' }, /au moins 10|identique/, 'mot de passe = nom d\'utilisateur'],
  ];
  for (const [chg, motif, nom] of essais) {
    const rr = await appel(a, 'app/action/utilisateur_save.php', Object.assign({}, base, chg));
    L.verifier(rr.status === 400 && rr.json && rr.json.ok === false && motif.test(rr.json.erreur), 'refus : ' + nom + ' → ' + (rr.json ? rr.json.erreur : rr.status));
  }
  L.verifier(sql("SELECT COUNT(*) FROM utilisateurs WHERE nom_utilisateur LIKE 'valide%' OR nom_utilisateur LIKE 'jean%' OR nom_utilisateur LIKE 'bob%'") === '0', 'aucun compte créé par les essais refusés');
  r = await appel(a, 'app/action/utilisateur_save.php', Object.assign({}, base, { mot_de_passe: 'Mot de passe avec espaces é' }));
  L.verifier(r.status === 200 && r.json.ok, 'un mot de passe avec espaces et accents est accepté tel quel');
  secrets.push('Mot de passe avec espaces é');
  const tvalide = await nouvelle();
  L.verifier((await connecterComme(tvalide, 'valide.un', 'Mot de passe avec espaces é')).ok, '… et permet de se connecter (rien n\'est retiré du mot de passe)');
  r = await appel(a, 'app/action/utilisateur_save.php', { id: r.json.id, mot_de_passe: 'Autre-Mot-De-Passe-9', nom_complet: 'Valide Deux' });
  L.verifier(r.status === 200 && sql("SELECT nom_complet FROM utilisateurs WHERE nom_utilisateur='valide.un'") === 'Valide Deux' && verifierHash('Mot de passe avec espaces é', sql("SELECT mot_de_passe FROM utilisateurs WHERE nom_utilisateur='valide.un'")),
    'utilisateur_save ignore un mot de passe envoyé pour un compte existant (seule la réinitialisation le change)');

  // =====================================================================================================================
  console.log('4. Utilisateurs : modification, garde-fous');
  await L.aller(a, 'utilisateurs');
  let lg = await chercher(a, '#table-utilisateurs', 'Tech.Un');
  await lg.locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-utilisateur.show');
  await a.waitForFunction(() => document.querySelector('#u-nom').value === 'Tech.Un');
  L.verifier(await a.isHidden('#u-mdp-bloc') && await a.isVisible('#u-compte-bloc'), 'modification : pas de champ de mot de passe, boutons de compte visibles');
  L.verifier(await a.isChecked('#u-ent-1') && !(await a.isChecked('#u-ent-2')), 'entreprises cochées reflètent la base');
  await a.fill('#u-complet', 'Technicien Un (modifié)');
  await a.check('#u-ent-2', { force: true });
  await a.selectOption('#u-role', 'gestionnaire');
  await a.click('#utilisateur-enregistrer');
  await a.waitForSelector('#modal-utilisateur', { state: 'hidden' });
  await attendreToast(a, 'enregistré');
  const modif = sql("SELECT role, nom_complet FROM utilisateurs WHERE nom_utilisateur='tech.un'").split('\t');
  L.verifier(modif[0] === 'gestionnaire' && modif[1] === 'Technicien Un (modifié)', 'rôle et nom modifiés en base');
  L.verifier(sql("SELECT GROUP_CONCAT(entreprise_id ORDER BY entreprise_id) FROM utilisateur_entreprises WHERE utilisateur_id=(SELECT id FROM utilisateurs WHERE nom_utilisateur='tech.un')") === '1,2', 'entreprises 1 et 2');
  const jm = dernierJournal('utilisateur.modifie');
  L.verifier(/"role":\["employe","gestionnaire"\]/.test(jm) && /entreprises/.test(jm) && !/mot_de_passe|\$2y\$/.test(jm), 'journal : utilisateur.modifie avec avant/après, sans secret');
  // rétrogradation d'un administrateur (autre) sans entreprise : refusée
  const id2 = sql("SELECT id FROM utilisateurs WHERE nom_utilisateur='admin2'");
  r = await appel(a, 'app/action/utilisateur_save.php', { id: parseInt(id2, 10), role: 'gestionnaire' });
  L.verifier(r.status === 400 && /au moins une entreprise/.test(r.json.erreur), 'rétrograder un administrateur sans lui donner d\'entreprise : refusé');
  L.verifier(sql("SELECT role FROM utilisateurs WHERE id=" + id2) === 'admin', '… et rien n\'a changé');
  // soi-même
  const idAdmin = parseInt(sql("SELECT id FROM utilisateurs WHERE nom_utilisateur='admin'"), 10);
  r = await appel(a, 'app/action/utilisateur_activer.php', { id: idAdmin, actif: false });
  L.verifier(r.status === 400 && /propre compte/.test(r.json.erreur), 'on ne peut pas se désactiver soi-même : ' + (r.json && r.json.erreur));
  r = await appel(a, 'app/action/utilisateur_save.php', { id: idAdmin, role: 'gestionnaire', entreprise_ids: [1] });
  L.verifier(r.status === 400 && /propre rôle/.test(r.json.erreur), 'on ne peut pas se retirer le rôle d\'administrateur : ' + (r.json && r.json.erreur));
  r = await appel(a, 'app/action/utilisateur_save.php', { id: idAdmin, actif: false, role: 'employe', entreprise_ids: [1] });
  L.verifier(r.status === 400 && sql("SELECT CONCAT(role, actif) FROM utilisateurs WHERE id=" + idAdmin) === 'admin1', 'combinaison désactivation + rétrogradation de soi refusée, compte intact');
  r = await appel(a, 'app/action/utilisateur_activer.php', { id: idAdmin, actif: null });
  L.verifier(r.status === 400 && sql("SELECT actif FROM utilisateurs WHERE id=" + idAdmin) === '1', '« actif: null » n\'est jamais interprété comme « désactiver »');
  r = await appel(a, 'app/action/utilisateur_activer.php', { id: idAdmin });
  L.verifier(r.status === 400, 'activer sans valeur : refusé');
  r = await appel(a, 'app/action/utilisateur_activer.php', { id: 9999, actif: false });
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'utilisateur inexistant');
  // dans le formulaire, sa propre ligne : rôle et activation verrouillés
  await L.aller(a, 'utilisateurs');
  await attendreTable(a, '#table-utilisateurs', 'gestionnaire1');
  await a.fill('#f-recherche', 'admin');
  await a.waitForFunction(() => document.querySelectorAll('#table-utilisateurs tbody tr').length === 2);
  await a.locator('#table-utilisateurs tbody tr', { has: a.locator('.badge-info') }).locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-utilisateur.show');
  await a.waitForFunction(() => document.querySelector('#u-nom').value === 'admin');
  L.verifier(await a.isDisabled('#u-role') && await a.isDisabled('#u-actif') && await a.isVisible('#u-actif-aide'), 'sa propre fiche : rôle et activation verrouillés avec explication');
  await a.click('#modal-utilisateur .btn-outline-secondary[data-dismiss=modal]');
  await a.waitForSelector('#modal-utilisateur', { state: 'hidden' });
  // dernier administrateur : admin2 (actif) désactive admin ; ensuite admin2 ne peut plus se désactiver
  const a2 = await nouvelle();
  L.verifier((await connecterComme(a2, 'admin2', 'Admin-Deux-2026')).ok, 'le deuxième administrateur se connecte');
  await L.aller(a2, 'utilisateurs');
  L.verifier(!/pas la permission/.test(await a2.textContent('body')), 'il accède à l\'administration');
  r = await appel(a2, 'app/action/utilisateur_activer.php', { id: parseInt(id2, 10), actif: false });
  L.verifier(r.status === 400 && /propre compte/.test(r.json.erreur), 'admin2 non plus ne peut pas se désactiver');
  r = await appel(a2, 'app/action/utilisateur_activer.php', { id: idAdmin, actif: false });
  L.verifier(r.status === 200, 'admin2 désactive « admin » (il en reste un autre)');
  r = await appel(a, 'app/ajax/utilisateurs_data.php', null, { methode: 'POST' });
  L.verifier(r.status === 401, 'la session de « admin » désactivé est coupée à sa prochaine requête (401)');
  // admin2 est maintenant le seul administrateur actif : il ne peut ni se désactiver ni se rétrograder
  r = await appel(a2, 'app/action/utilisateur_save.php', { id: parseInt(id2, 10), role: 'employe', entreprise_ids: [1] });
  L.verifier(r.status === 400 && /propre rôle|dernier administrateur/.test(r.json.erreur), 'le dernier administrateur actif ne peut pas se rétrograder');
  r = await appel(a2, 'app/action/utilisateur_activer.php', { id: idAdmin, actif: true });
  L.verifier(r.status === 200, 'admin2 réactive « admin »');
  L.verifier(nbJournal('utilisateur.desactive') >= 1 && nbJournal('utilisateur.reactive') >= 1, 'journal : utilisateur.desactive et utilisateur.reactive');
  await a.goto(L.BASE + '/login.php');
  L.verifier((await connecterComme(a, 'admin', MDP)).ok, '« admin » se reconnecte');

  // =====================================================================================================================
  console.log('5. Verrouillage après 5 échecs, déverrouillage');
  const v = await nouvelle();
  for (let i = 0; i < 5; i++) {
    const rr = await connecterComme(v, 'verrou1', 'mauvais-mot-de-passe-' + i);
    L.verifier(!rr.ok && /invalide/.test(rr.erreur), 'échec de connexion ' + (i + 1) + ' : message générique');
  }
  let rr = await connecterComme(v, 'verrou1', MDP);
  L.verifier(!rr.ok && /verrouillé/.test(rr.erreur), 'après 5 échecs, même le bon mot de passe est refusé (compte verrouillé)');
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'verrou1');
  L.verifier(/Oui/.test(await lg.textContent()) && /jusqu'à \d\d:\d\d/.test(await lg.textContent()), 'liste : « Verrouillé ? » = Oui avec l\'heure de fin');
  await lg.locator('button[data-action=deverrouiller]').click();
  await attendreToast(a, 'déverrouillé');
  await a.waitForFunction(() => { const r = [...document.querySelectorAll('#table-utilisateurs tbody tr')].find(x => x.textContent.includes('verrou1')); return r && !/Oui/.test(r.textContent) && !r.querySelector('button[data-action=deverrouiller]'); });
  L.verifier(sql("SELECT CONCAT(tentatives_echec, '/', IFNULL(verrouille_jusqua,'null')) FROM utilisateurs WHERE nom_utilisateur='verrou1'") === '0/null', 'compteur et verrou remis à zéro');
  L.verifier(nbJournal('utilisateur.deverrouille') === 1, 'journal : utilisateur.deverrouille');
  rr = await connecterComme(v, 'verrou1', MDP);
  L.verifier(rr.ok, 'le compte déverrouillé se connecte');
  r = await appel(a, 'app/action/utilisateur_deverrouiller.php', { id: parseInt(sql("SELECT id FROM utilisateurs WHERE nom_utilisateur='verrou1'"), 10) });
  L.verifier(r.status === 400 && /n'est pas verrouillé/.test(r.json.erreur), 'déverrouiller un compte non verrouillé : message clair');
  // échecs partiels visibles
  sql("UPDATE utilisateurs SET tentatives_echec = 3 WHERE nom_utilisateur='verrou1'");
  await a.fill('#f-recherche', ''); await a.fill('#f-recherche', 'verrou1');
  await a.waitForFunction(() => /3 échecs/.test(document.querySelector('#table-utilisateurs').textContent));
  L.verifier(true, 'liste : « 3 échecs » affichés pour un compte non encore verrouillé');
  sql("UPDATE utilisateurs SET tentatives_echec = 0 WHERE nom_utilisateur='verrou1'");

  // =====================================================================================================================
  console.log('6. Réinitialisation du mot de passe');
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'mdp2');
  sql("UPDATE utilisateurs SET verrouille_jusqua = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE nom_utilisateur='mdp2'");
  await lg.locator('button[data-action=mdp]').click();
  await a.waitForSelector('#modal-mdp.show');
  L.verifier(/Réinitialiser/.test(await tx(a, '#modal-mdp-titre')) && /^[A-Za-z2-9-]{19}$/.test(await a.inputValue('#mdp-champ')), 'fenêtre de réinitialisation : mot de passe proposé');
  await a.fill('#mdp-champ', 'court');
  await a.click('#mdp-valider');
  await a.waitForFunction(() => !document.querySelector('#modal-mdp [data-erreur-pour="mot_de_passe"]').hidden);
  L.verifier(/au moins 10/.test(await tx(a, '#modal-mdp [data-erreur-pour=mot_de_passe]')), 'réinitialisation : mot de passe trop court refusé');
  await a.click('#mdp-gen');
  const nouveauMdp = await a.inputValue('#mdp-champ');
  secrets.push(nouveauMdp);
  await a.click('#mdp-valider');
  await a.waitForFunction(() => /réinitialisé/.test(document.querySelector('#modal-mdp-titre').textContent));
  L.verifier(await a.inputValue('#mdp-champ') === nouveauMdp && await a.isHidden('#mdp-valider') && await a.isVisible('#mdp-fermer'), 'résultat : mot de passe affiché une seule fois, bouton Fermer');
  await a.click('#mdp-fermer');
  await a.waitForSelector('#modal-mdp', { state: 'hidden' });
  await a.waitForFunction(() => document.querySelector('#mdp-champ').value === '');
  L.verifier(true, 'champ vidé');
  const t2 = await nouvelle();
  L.verifier(!(await connecterComme(t2, 'mdp2', 'Ancien-Mot-2027')).ok, 'l\'ancien mot de passe ne fonctionne plus');
  L.verifier((await connecterComme(t2, 'mdp2', nouveauMdp)).ok, 'le nouveau fonctionne ; le compte (verrouillé) a été déverrouillé');
  const jr = dernierJournal('utilisateur.mdp_reinitialise');
  L.verifier(/"deverrouille":true/.test(jr) && !jr.includes(nouveauMdp), 'journal : utilisateur.mdp_reinitialise sans le mot de passe');
  r = await appel(a, 'app/action/utilisateur_mdp.php', { id: 9999, mot_de_passe: 'Un-Bon-Mot-De-Passe-1' });
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'réinitialiser un compte inexistant : refusé');
  r = await appel(a, 'app/action/utilisateur_mdp.php', { id: parseInt(sql("SELECT id FROM utilisateurs WHERE nom_utilisateur='mdp2'"), 10), mot_de_passe: 'mdp2' });
  L.verifier(r.status === 400, 'réinitialiser avec un mot de passe trop court : refusé (API)');
  // via la fenêtre de modification
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'mdp2');
  await lg.locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-utilisateur.show');
  await a.waitForFunction(() => document.querySelector('#u-nom').value === 'mdp2');
  await a.click('#u-btn-mdp');
  await a.waitForSelector('#modal-mdp.show');
  L.verifier(/mdp2/.test(await tx(a, '#mdp-texte')), 'depuis la fiche : même fenêtre de réinitialisation');
  await a.click('#mdp-annuler');
  await a.waitForSelector('#modal-mdp', { state: 'hidden' });
  await a.waitForFunction(() => document.querySelector('#mdp-champ').value === '');
  L.verifier(true, 'annulation : champ vidé');

  // =====================================================================================================================
  console.log('7. Désactivation d\'un utilisateur connecté / changement de rôle en cours de session');
  const s1 = await nouvelle();
  L.verifier((await connecterComme(s1, 'sess1', MDP)).ok, 'sess1 (gestionnaire) connecté');
  await L.aller(s1, 'reception');
  L.verifier(!/pas la permission/.test(await s1.textContent('body')), 'sess1 voit la réception');
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'sess1');
  await lg.locator('button[data-action=desactiver]').click();
  const msgConf = await confirmerModal(a, true);
  L.verifier(/sess1/.test(msgConf) && /plus se connecter/.test(msgConf), 'confirmation avant de désactiver : ' + msgConf.slice(0, 60));
  await attendreToast(a, 'désactivé');
  await a.waitForFunction(() => { const r = [...document.querySelectorAll('#table-utilisateurs tbody tr')].find(x => x.textContent.includes('sess1')); return r && /Désactivé/.test(r.textContent); });
  r = await appel(s1, 'app/ajax/scan_code.php?code=P-0001', null);
  L.verifier(r.status === 401, 'requête de sess1 après sa désactivation : 401 (' + r.status + ')');
  await s1.goto(L.BASE + '/index.php?page=stock');
  L.verifier(/login\.php/.test(s1.url()), 'sa prochaine page l\'envoie à la connexion');
  L.verifier(!(await connecterComme(s1, 'sess1', MDP)).ok, 'et il ne peut plus se reconnecter');
  // réactivation depuis la liste
  lg = await chercher(a, '#table-utilisateurs', 'sess1');
  await lg.locator('button[data-action=activer]').click();
  await attendreToast(a, 'réactivé');
  L.verifier((await connecterComme(s1, 'sess1', MDP)).ok, 'après réactivation, il se reconnecte');

  const s2 = await nouvelle();
  L.verifier((await connecterComme(s2, 'sess2', MDP)).ok, 'sess2 (gestionnaire, entreprises 1 et 2) connecté');
  await L.aller(s2, 'reception');
  L.verifier(!/pas la permission/.test(await s2.textContent('body')), 'sess2 voit la réception');
  r = await appel(s2, 'app/ajax/emplacements_liste.php', null);
  L.verifier(r.json.emplacements.some(e => e.entreprise_id === 2), 'sess2 voit les emplacements de l\'entreprise 2');
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'sess2');
  await lg.locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-utilisateur.show');
  await a.waitForFunction(() => document.querySelector('#u-nom').value === 'sess2');
  await a.selectOption('#u-role', 'employe');
  await a.uncheck('#u-ent-2', { force: true });
  await a.click('#utilisateur-enregistrer');
  await a.waitForSelector('#modal-utilisateur', { state: 'hidden' });
  await L.aller(s2, 'reception');
  L.verifier(/pas la permission/.test(await s2.textContent('body')), 'sess2 rétrogradé : la page Réception lui est refusée dès le rechargement');
  r = await appel(s2, 'app/action/reception_save.php', { emplacement_id: 1, lignes: [{ piece_id: 1, quantite: '1', cout_unitaire: '1' }] });
  L.verifier(r.status >= 400 && r.json && r.json.ok === false, 'son appel direct à la réception est refusé côté serveur (' + r.status + ' ' + (r.json && r.json.erreur) + ')');
  r = await appel(s2, 'app/ajax/emplacements_liste.php', null);
  L.verifier(r.json.emplacements.every(e => e.entreprise_id === 1), 'il ne voit plus l\'entreprise 2 (accès retiré en cours de session)');
  L.verifier(!/Administration/i.test(await s2.textContent('.main-sidebar')), 'le menu n\'affiche pas l\'administration');

  // =====================================================================================================================
  console.log('8. Tentatives d\'élévation de privilège');
  const g = await nouvelle();
  await L.connecter(g, 'gestionnaire');
  const e1 = await nouvelle();
  await L.connecter(e1, 'employe');
  const idG = sql("SELECT id FROM utilisateurs WHERE nom_utilisateur='gestionnaire1'");
  const endpointsAdmin = [
    ['app/action/utilisateur_save.php', { nom_utilisateur: 'pirate', nom_complet: 'P', role: 'admin', entreprise_ids: [], mot_de_passe: 'Pirate-Pirate-1' }],
    ['app/action/utilisateur_save.php', { id: parseInt(idG, 10), role: 'admin' }],
    ['app/action/utilisateur_activer.php', { id: idAdmin, actif: false }],
    ['app/action/utilisateur_mdp.php', { id: idAdmin, mot_de_passe: 'Pirate-Pirate-1' }],
    ['app/action/utilisateur_deverrouiller.php', { id: idAdmin }],
    ['app/action/entreprise_save.php', { code: 'PIR', nom: 'Pirate' }],
    ['app/action/entreprise_activer.php', { id: 2, actif: false }],
    ['app/action/emplacement_save.php', { entreprise_id: 1, nom: 'Pirate', type: 'cube', code_barres: 'PIRATE' }],
    ['app/action/emplacement_activer.php', { id: 3, actif: false }],
    ['app/ajax/utilisateurs_data.php', null], ['app/ajax/utilisateur_detail.php?id=1', null], ['app/ajax/entreprises_data.php', null],
    ['app/ajax/entreprise_detail.php?id=1', null], ['app/ajax/emplacement_data.php', null], ['app/ajax/emplacement_detail.php?id=1', null],
    ['app/ajax/emplacement_code_proposer.php', null], ['app/ajax/journal_data.php', null], ['app/ajax/journal_export.php', null],
  ];
  for (const [nom, p] of [['gestionnaire', g], ['employé', e1]]) {
    for (const [url, corps] of endpointsAdmin) {
      const rr2 = url.includes('/ajax/') ? await (url.includes('_data') ? liste(p, url, {}) : appel(p, url, null)) : await appel(p, url, corps);
      L.verifier(rr2.status === 403 && rr2.json && rr2.json.ok === false && /réservée à l'administrateur/.test(rr2.json.erreur), nom + ' : ' + url.replace('app/', '') + ' → 403 (' + rr2.status + ')');
    }
    for (const route of ['utilisateurs', 'entreprises', 'emplacements', 'journal', 'backup_database']) {
      await L.aller(p, route);
      L.verifier(/pas la permission/.test(await p.textContent('.content-wrapper')) && !(await p.$('table')) && !(await p.$('#exportForm')), nom + ' : la page « ' + route + ' » est refusée');
    }
    L.verifier(!/Administration/.test(await p.textContent('.main-sidebar')), nom + ' : pas de menu « Administration »');
  }
  L.verifier(sql("SELECT COUNT(*) FROM utilisateurs WHERE nom_utilisateur='pirate'") === '0' && sql("SELECT role FROM utilisateurs WHERE id=" + idG) === 'gestionnaire' && sql("SELECT COUNT(*) FROM entreprises") === '2', 'aucune de ces tentatives n\'a eu d\'effet');
  // POST de la sauvegarde par un gestionnaire (page protégée, aucun fichier)
  await L.aller(g, 'backup_database');
  const dl = await g.evaluate(async () => { const r = await fetch('index.php?page=backup_database', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'csrf_token=' + document.querySelector('meta[name=csrf-token]').content + '&table[]=utilisateurs' }); return { type: r.headers.get('content-type'), disp: r.headers.get('content-disposition'), texte: await r.text() }; });
  L.verifier(!dl.disp && !/INSERT INTO/.test(dl.texte) && /pas la permission/.test(dl.texte), 'un gestionnaire ne peut pas obtenir la sauvegarde même en POSTant le formulaire');
  // sans connexion : 401 ; sans jeton : 403
  const anon = await nouvelle();
  await anon.goto(L.BASE + '/login.php');
  for (const [url] of endpointsAdmin) {
    const rr2 = await anon.evaluate(async (u) => { const r = await fetch(u, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }); return r.status; }, url);
    L.verifier(rr2 === 401, 'sans connexion : ' + url.replace('app/', '') + ' → 401 (' + rr2 + ')');
  }
  for (const url of ['app/action/utilisateur_save.php', 'app/action/utilisateur_activer.php', 'app/action/utilisateur_mdp.php', 'app/action/utilisateur_deverrouiller.php', 'app/action/entreprise_save.php', 'app/action/entreprise_activer.php', 'app/action/emplacement_save.php', 'app/action/emplacement_activer.php', 'app/action/profil_mdp.php']) {
    const rr2 = await appel(a, url, { id: 1 }, { sansJeton: true });
    L.verifier(rr2.status === 403, 'sans jeton CSRF : ' + url.replace('app/action/', '') + ' → 403 (' + rr2.status + ')');
    const rr3 = await appel(a, url, null, { methode: 'GET' });
    L.verifier(rr3.status === 405, 'GET refusé : ' + url.replace('app/action/', '') + ' → 405 (' + rr3.status + ')');
  }
  for (const f of ['utilisateur_lib.php', 'entreprise_lib.php', 'emplacement_lib.php']) {
    const rr2 = await appel(a, 'app/action/' + f, null);
    L.verifier(rr2.status === 404, 'fichier de fonctions app/action/' + f + ' appelé directement → 404');
  }
  const rj = await appel(a, 'app/ajax/journal_lib.php', null);
  L.verifier(rj.status === 404, 'app/ajax/journal_lib.php appelé directement → 404');
  // données d'un employé : profil seulement
  r = await appel(e1, 'app/action/profil_mdp.php', { actuel: 'x' });
  L.verifier(r.status === 400 && r.json.champ !== undefined, 'l\'employé atteint l\'endpoint du profil (erreur de validation, pas de refus de rôle)');

  // =====================================================================================================================
  console.log('9. Injection dans les noms (XSS et SQL)');
  r = await appel(a, 'app/action/utilisateur_save.php', { nom_utilisateur: 'xss.user', nom_complet: XSS1, role: 'gestionnaire', actif: true, entreprise_ids: [1], mot_de_passe: 'Xss-Mot-De-Passe-1' });
  secrets.push('Xss-Mot-De-Passe-1');
  L.verifier(r.status === 200, 'nom complet avec balise accepté comme texte');
  r = await appel(a, 'app/action/entreprise_save.php', { code: 'XSS', nom: XSS2, adresse: XSS3 });
  L.verifier(r.status === 200, 'entreprise avec balises dans le nom et l\'adresse');
  const idXss = r.json.id;
  r = await appel(a, 'app/action/emplacement_save.php', { entreprise_id: idXss, nom: XSS1, type: 'cube', code_barres: '' });
  L.verifier(r.status === 200, 'emplacement avec balise dans le nom');
  const idEmpXss = r.json.id;
  r = await appel(a, 'app/action/utilisateur_save.php', { nom_utilisateur: "x'; DROP TABLE utilisateurs;--", nom_complet: 'x', role: 'employe', entreprise_ids: [1], mot_de_passe: 'Un-Bon-Mot-De-Passe-1' });
  L.verifier(r.status === 400, 'nom d\'utilisateur de type injection SQL refusé');
  r = await appel(a, 'app/action/entreprise_save.php', { code: "X'); DROP", nom: 'x' });
  L.verifier(r.status === 400, 'code d\'entreprise de type injection SQL refusé');
  const tables = [['utilisateurs', '#table-utilisateurs', XSS1], ['entreprises', '#table-entreprises', XSS2], ['emplacements', '#table-emplacements', XSS1]];
  for (const [route, table, valeur] of tables) {
    await L.aller(a, route);
    await a.waitForSelector(table + ' tbody tr');
    const html = await a.innerHTML(table);
    L.verifier(!/<img/i.test(html) && html.includes('&lt;img'), route + ' : la balise est affichée comme du texte');
    // recherche malveillante : aucune erreur, aucun résultat anormal
    for (const mal of ["' OR '1'='1", "%", "_", "\\", '"; DROP TABLE x;--', '<script>alert(1)</script>']) {
      const rr2 = await liste(a, route === 'utilisateurs' ? 'app/ajax/utilisateurs_data.php' : route === 'entreprises' ? 'app/ajax/entreprises_data.php' : 'app/ajax/emplacement_data.php', { draw: '1', start: '0', length: '10', 'search[value]': mal });
      L.verifier(rr2.status === 200 && rr2.json && Array.isArray(rr2.json.data), route + ' : recherche « ' + mal.slice(0, 12) + ' » sans erreur (' + rr2.status + ')');
      if (mal === "' OR '1'='1" || mal === '"; DROP TABLE x;--') { L.verifier(rr2.json.data.length === 0, route + ' : « ' + mal.slice(0, 8) + '… » ne renvoie rien'); }
    }
  }
  // sélecteurs et en-tête
  await L.aller(a, 'emplacements');
  await a.waitForSelector('#table-emplacements tbody tr');
  const optHtml = await a.innerHTML('#f-entreprise');
  L.verifier(!/<img/i.test(optHtml) && optHtml.includes('&lt;img'), 'liste déroulante des entreprises : nom échappé');
  await a.click('#btn-nouveau');
  await a.waitForSelector('#modal-emplacement.show');
  L.verifier(!/<img/i.test(await a.innerHTML('#em-entreprise')), 'formulaire d\'emplacement : nom d\'entreprise échappé');
  await a.click('#modal-emplacement .btn-outline-secondary[data-dismiss=modal]');
  await a.waitForSelector('#modal-emplacement', { state: 'hidden' });
  await L.aller(a, 'journal');
  await a.waitForSelector('#table-journal tbody tr');
  const jhtml = await a.innerHTML('#table-journal');
  L.verifier(!/<img/i.test(jhtml), 'journal : aucune balise injectée dans le tableau');
  L.verifier(!/<img/i.test(await a.innerHTML('#f-utilisateur')) && !/<img/i.test(await a.innerHTML('#f-entite')), 'journal : listes de filtres échappées');
  const xssUser = await nouvelle();
  L.verifier((await connecterComme(xssUser, 'xss.user', 'Xss-Mot-De-Passe-1')).ok, 'connexion du compte au nom piégé');
  await L.aller(xssUser, 'profil');
  L.verifier(!/<img/i.test(await xssUser.innerHTML('.main-header')) && !/<img/i.test(await xssUser.innerHTML('.content-wrapper')), 'en-tête et profil : nom complet échappé');
  L.verifier((await xssUser.textContent('#profil-nom-complet')).includes(XSS1), 'profil : le nom est affiché comme texte');
  await L.aller(a, 'utilisateurs');
  lg = await chercher(a, '#table-utilisateurs', 'xss.user');
  await lg.locator('button[data-action=desactiver]').click();
  const msgX = await confirmerModal(a, false);
  L.verifier(msgX.includes('xss.user'), 'dialogue de confirmation : texte seulement');
  L.verifier(dialogues.length === 0, 'aucune boîte de dialogue JavaScript (alert) ne s\'est ouverte');

  // =====================================================================================================================
  console.log('10. Entreprises');
  await L.aller(a, 'entreprises');
  await attendreTable(a, '#table-entreprises', 'Boutique Chaleur');
  rows = await lignesTable(a, '#table-entreprises');
  L.verifier(rows.length === 3, 'trois entreprises (dont celle de test XSS) : ' + rows.length);
  const lBea = rows.find(x => x.startsWith('BEA'));
  L.verifier(/^BEA Beauchemin\s+3\s+14\s+\d+\s+Active/.test(lBea), 'ligne BEA : code, nom, 3 emplacements, 14 pièces en stock, statut (' + lBea + ')');
  for (const col of ['code', 'nom', 'adresse', 'nb_emplacements', 'nb_pieces', 'nb_utilisateurs', 'actif']) {
    const i = ['code', 'nom', 'adresse', 'nb_emplacements', 'nb_pieces', 'nb_utilisateurs', 'actif'].indexOf(col);
    const rr2 = await liste(a, 'app/ajax/entreprises_data.php', { draw: '1', start: '0', length: '10', 'order[0][column]': String(i), 'order[0][dir]': 'desc', ['columns[' + i + '][data]']: col });
    L.verifier(rr2.status === 200 && rr2.json.data.length === 3, 'tri entreprises par ' + col);
  }
  await a.click('#btn-nouveau');
  await a.waitForSelector('#modal-entreprise.show');
  await a.click('#entreprise-enregistrer');
  await a.waitForFunction(() => !document.querySelector('#modal-entreprise [data-erreur-pour="code"]').hidden);
  L.verifier(/Le code est obligatoire/.test(await tx(a, '[data-erreur-pour=code]')), 'code obligatoire');
  await a.fill('#en-code', 'bea');
  await a.fill('#en-nom', 'Autre nom');
  await a.click('#entreprise-enregistrer');
  await a.waitForFunction(() => /déjà utilisé/.test(document.querySelector('#modal-entreprise [data-erreur-pour="code"]').textContent));
  L.verifier(true, 'code « bea » refusé : doublon de « BEA » sans égard à la casse');
  L.verifier(await a.getAttribute('#en-code', 'maxlength') === '10', 'le champ limite la saisie à 10 caractères');
  r = await appel(a, 'app/action/entreprise_save.php', { code: 'ABCDEFGHIJK', nom: 'Trop long' });
  L.verifier(r.status === 400 && /10 caractères/.test(r.json.erreur) && sql("SELECT COUNT(*) FROM entreprises WHERE nom='Trop long'") === '0', 'code de 11 caractères refusé par le serveur');
  await a.fill('#en-code', 'a b');
  await a.click('#entreprise-enregistrer');
  await a.waitForFunction(() => /lettres sans accent/.test(document.querySelector('#modal-entreprise [data-erreur-pour="code"]').textContent));
  L.verifier(true, 'code avec espace refusé');
  await a.fill('#en-code', 'tst');
  await a.fill('#en-nom', 'boutique CHALEUR');
  await a.click('#entreprise-enregistrer');
  await a.waitForFunction(() => /porte déjà ce nom/.test(document.querySelector('#modal-entreprise [data-erreur-pour="nom"]').textContent));
  L.verifier(true, 'nom « boutique CHALEUR » refusé : doublon sans égard à la casse');
  await a.fill('#en-nom', 'Entreprise Test');
  await a.fill('#en-adresse', '1 rue du Test, Québec');
  await a.click('#entreprise-enregistrer');
  await a.waitForSelector('#modal-entreprise', { state: 'hidden' });
  await attendreToast(a, 'enregistrée');
  await attendreTable(a, '#table-entreprises', 'Entreprise Test');
  L.verifier(sql("SELECT code FROM entreprises WHERE nom='Entreprise Test'") === 'TST', 'code mis en majuscules (TST)');
  const idTst = parseInt(sql("SELECT id FROM entreprises WHERE code='TST'"), 10);
  L.verifier(/"code":"TST"/.test(dernierJournal('entreprise.cree')), 'journal : entreprise.cree');
  // modification
  await chercher(a, '#table-entreprises', 'TST');
  await a.click('#table-entreprises tbody tr button[data-action=modifier]');
  await a.waitForSelector('#modal-entreprise.show');
  await a.waitForFunction(() => document.querySelector('#en-code').value === 'TST');
  L.verifier(await a.inputValue('#en-adresse') === '1 rue du Test, Québec' && await a.isVisible('#en-actif-groupe') && await a.isChecked('#en-actif'), 'fiche pré-remplie, case « active » visible');
  await a.fill('#en-nom', 'Entreprise Test 2');
  await a.click('#entreprise-enregistrer');
  await a.waitForSelector('#modal-entreprise', { state: 'hidden' });
  await attendreTable(a, '#table-entreprises', 'Entreprise Test 2');
  L.verifier(/"nom":\["Entreprise Test","Entreprise Test 2"\]/.test(dernierJournal('entreprise.modifie')), 'journal : entreprise.modifie avec avant/après');
  // désactivation refusée : stock (Beauchemin)
  await chercher(a, '#table-entreprises', 'Beauchemin');
  await a.click('#table-entreprises tbody tr button[data-action=desactiver]');
  await confirmerModal(a, true);
  await a.waitForSelector('#modal-refus.show');
  const refus = await tx(a, '#modal-refus-message');
  L.verifier(/il reste du stock/.test(refus) && /\(14 pièces\)/.test(refus), 'désactivation refusée : stock restant avec le nombre de pièces (' + refus.slice(0, 120) + ')');
  L.verifier((await a.getAttribute('#modal-refus-lien', 'href')) === 'index.php?page=stock&entreprise_id=1', 'lien vers le stock de l\'entreprise');
  await a.click('#modal-refus .btn-outline-secondary');
  await a.waitForSelector('#modal-refus', { state: 'hidden' });
  L.verifier(sql("SELECT actif FROM entreprises WHERE id=1") === '1', 'Beauchemin est restée active');
  // un utilisateur rattaché seulement à l'entreprise de test
  creerCompte('seul.tst', 'employe', [idTst]);
  creerCompte('seul.deux', 'employe', [idTst, 1]);
  r = await appel(a, 'app/action/emplacement_save.php', { entreprise_id: idTst, nom: 'Dépôt test', type: 'entrepot', code_barres: '' });
  const idEmpTst = r.json.id;
  r = await appel(a, 'app/action/entreprise_activer.php', { id: idTst, actif: false });
  L.verifier(r.status === 200 && r.json.utilisateurs_sans_acces === 1 && r.json.actif === false, 'entreprise vide désactivée ; avertissement : 1 utilisateur sans accès');
  // elle disparaît des listes de saisie, reste dans les données
  r = await appel(g, 'app/ajax/emplacements_liste.php?entreprises_destination=1', null);
  L.verifier(r.json.entreprises.every(x => x.id !== idTst) && r.json.entreprises.length >= 2, 'l\'entreprise désactivée n\'apparaît plus dans les entreprises de destination');
  L.verifier(sql("SELECT COUNT(*) FROM entreprises WHERE id=" + idTst) === '1', 'elle reste en base (aucune suppression)');
  r = await appel(a, 'app/ajax/emplacements_liste.php', null);
  L.verifier(!r.json.emplacements.some(x => x.id === idEmpTst) && r.json.emplacements.some(x => x.id === idEmpXss), 'ses emplacements ne sont plus dans les listes de saisie (ceux des autres entreprises y sont)');
  // création d'un emplacement dans une entreprise désactivée : refusée
  r = await appel(a, 'app/action/emplacement_save.php', { entreprise_id: idTst, nom: 'Dans désactivée', type: 'cube', code_barres: '' });
  L.verifier(r.status === 400 && /désactivée/.test(r.json.erreur), 'on ne crée pas d\'emplacement dans une entreprise désactivée');
  // réactivation par la liste
  await L.aller(a, 'entreprises');
  await chercher(a, '#table-entreprises', 'TST');
  L.verifier(/Désactivée/.test(await a.textContent('#table-entreprises tbody tr')), 'liste : statut « Désactivée »');
  await a.click('#table-entreprises tbody tr button[data-action=activer]');
  await attendreToast(a, 'réactivée');
  L.verifier(sql("SELECT actif FROM entreprises WHERE id=" + idTst) === '1' && nbJournal('entreprise.reactive') === 1 && nbJournal('entreprise.desactive') === 1, 'réactivée ; journal : entreprise.desactive et entreprise.reactive');
  // dernière entreprise active
  sql("UPDATE entreprises SET actif = 0 WHERE id <> 1");
  r = await appel(a, 'app/action/entreprise_activer.php', { id: 1, actif: false });
  L.verifier(r.status === 400 && /dernière entreprise active/.test(r.json.erreur), 'dernière entreprise active : désactivation refusée (' + (r.json && r.json.erreur) + ')');
  sql("UPDATE entreprises SET actif = 1");
  // entreprise 2 : stock aussi ; id inexistant ; valeurs invalides
  r = await appel(a, 'app/action/entreprise_activer.php', { id: 2, actif: false });
  L.verifier(r.status === 400 && /il reste du stock/.test(r.json.erreur), 'Boutique Chaleur : stock restant');
  r = await appel(a, 'app/action/entreprise_activer.php', { id: 999, actif: false });
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'entreprise inexistante');
  r = await appel(a, 'app/action/entreprise_activer.php', { id: 1, actif: 'peut-être' });
  L.verifier(r.status === 400, 'valeur d\'activation invalide');
  r = await appel(a, 'app/action/entreprise_save.php', { id: idTst, code: 'TST', nom: 'Entreprise Test 2', actif: false });
  L.verifier(r.status === 200 && r.json.actif === false && sql("SELECT actif FROM entreprises WHERE id=" + idTst) === '0', 'entreprise_save avec actif=false applique les mêmes règles de désactivation');
  r = await appel(a, 'app/action/entreprise_save.php', { id: 1, code: 'BEA', nom: 'Beauchemin', actif: false });
  L.verifier(r.status === 400 && /il reste du stock/.test(r.json.erreur) && sql("SELECT actif FROM entreprises WHERE id=1") === '1', 'même refus par le formulaire (rien n\'a changé)');
  sql("UPDATE entreprises SET actif = 1");

  // =====================================================================================================================
  console.log('11. Emplacements');
  await L.aller(a, 'emplacements');
  await attendreTable(a, '#table-emplacements', 'Entrepôt principal');
  rows = await lignesTable(a, '#table-emplacements');
  const nbEmp = parseInt(sql('SELECT COUNT(*) FROM emplacements'), 10);
  const nbCube = parseInt(sql("SELECT COUNT(*) FROM emplacements WHERE type='cube'"), 10);
  L.verifier(rows.length === nbEmp && nbEmp === 7, 'sept emplacements (5 de démo + 2 de test) : ' + rows.length);
  const lcube = rows.find(x => x.includes('Cube 12'));
  L.verifier(/Beauchemin/.test(lcube) && /Cube de service/.test(lcube) && /EMP-000003/.test(lcube) && /Actif/.test(lcube), 'ligne du cube 12 : entreprise, type, code, statut (' + lcube + ')');
  L.verifier(/ 4 /.test(' ' + lcube + ' ') || /\s4\s/.test(lcube), 'nombre de pièces en stock du cube 12 (4)');
  const colEmp = ['entreprise', 'nom', 'type', 'code_barres', 'nb_pieces', 'actif'];
  for (let i = 0; i < colEmp.length; i++) {
    for (const dir of ['asc', 'desc']) {
      const rr2 = await liste(a, 'app/ajax/emplacement_data.php', { draw: '1', start: '0', length: '10', 'order[0][column]': String(i), 'order[0][dir]': dir, ['columns[' + i + '][data]']: colEmp[i] });
      L.verifier(rr2.status === 200 && rr2.json.data.length === nbEmp, 'tri emplacements par ' + colEmp[i] + ' ' + dir);
    }
  }
  // filtres + recherche au scanner
  await a.selectOption('#f-type', 'cube');
  await a.waitForFunction(n => document.querySelectorAll('#table-emplacements tbody tr').length === n, nbCube);
  L.verifier(true, 'filtre par type « Cube de service » : ' + nbCube + ' lignes (dont celui de test)');
  await a.selectOption('#f-type', '');
  await a.selectOption('#f-entreprise', '2');
  await a.waitForFunction(() => document.querySelectorAll('#table-emplacements tbody tr').length === 2);
  L.verifier(true, 'filtre par entreprise 2 : 2 lignes');
  await a.selectOption('#f-entreprise', '');
  await a.fill('#f-recherche', 'EMP-000004');
  await a.press('#f-recherche', 'Enter');
  await a.waitForFunction(() => document.querySelectorAll('#table-emplacements tbody tr').length === 1 && /Luc/.test(document.querySelector('#table-emplacements tbody').textContent));
  L.verifier(true, 'code scanné dans la recherche + Entrée : trouve « Cube 14 — Luc »');
  await a.fill('#f-recherche', '');
  await a.waitForFunction(n => document.querySelectorAll('#table-emplacements tbody tr').length === n, nbEmp);
  // création : code proposé
  await a.click('#btn-nouveau');
  await a.waitForSelector('#modal-emplacement.show');
  await a.waitForFunction(() => document.querySelector('#em-code').value !== '');
  const proposé = await a.inputValue('#em-code');
  const attendu = sql("SELECT CONCAT('EMP-', LPAD(MAX(CAST(SUBSTRING(code_barres, 5) AS UNSIGNED)) + 1, 6, '0')) FROM emplacements WHERE code_barres REGEXP '^EMP-[0-9]{6}$'");
  L.verifier(proposé === attendu && /^EMP-\d{6}$/.test(proposé), 'code proposé automatiquement et séquentiel : ' + proposé);
  await a.click('#emplacement-enregistrer');
  await a.waitForFunction(() => !document.querySelector('#modal-emplacement [data-erreur-pour="entreprise_id"]').hidden);
  L.verifier(/Choisissez une entreprise/.test(await tx(a, '[data-erreur-pour=entreprise_id]')), 'entreprise obligatoire');
  await a.selectOption('#em-entreprise', '1');
  await a.click('#emplacement-enregistrer');
  await a.waitForFunction(() => !document.querySelector('#modal-emplacement [data-erreur-pour="nom"]').hidden);
  L.verifier(/Le nom est obligatoire/.test(await tx(a, '[data-erreur-pour=nom]')), 'nom obligatoire');
  await a.fill('#em-nom', 'cube 12 — marc');
  await a.click('#emplacement-enregistrer');
  await a.waitForFunction(() => /déjà un emplacement nommé/.test(document.querySelector('#modal-emplacement [data-erreur-pour="nom"]').textContent));
  L.verifier(true, 'nom en double dans la même entreprise (casse ignorée) : refusé');
  await a.selectOption('#em-entreprise', '2');
  await a.selectOption('#em-type', 'cube');
  await a.click('#emplacement-enregistrer');
  await a.waitForSelector('#modal-emplacement', { state: 'hidden' });
  await attendreToast(a, 'enregistré');
  L.verifier(sql("SELECT CONCAT(entreprise_id, '/', type, '/', code_barres) FROM emplacements WHERE entreprise_id = 2 AND nom='cube 12 — marc'") === '2/cube/' + proposé, 'même nom accepté dans l\'autre entreprise, avec le code proposé');
  L.verifier(/"code_barres":"EMP-/.test(dernierJournal('emplacement.cree')), 'journal : emplacement.cree');
  const idNouv = parseInt(sql("SELECT id FROM emplacements WHERE entreprise_id = 2 AND nom='cube 12 — marc'"), 10);
  // codes : doublons et caractères
  const bE = { entreprise_id: 1, nom: 'Test codes', type: 'cube' };
  const essaisCode = [
    ['EMP-000003', /déjà utilisé/, 'code d\'un autre emplacement'],
    ['emp-000003', /déjà utilisé/, 'même code en minuscules'],
    ['P-0001', /déjà utilisé/, 'code interne d\'une pièce'],
    ['p-0001', /déjà utilisé/, 'code de pièce en minuscules'],
    ['012345678905', /déjà utilisé/, 'code alias (UPC) d\'une pièce'],
    ['CODÉ-1', /1 à 40 caractères/, 'caractère accentué'],
    ['a'.repeat(41), /(1 à 40|64 caractères)/, 'code trop long'],
    ['AB\tCD', /non permis/, 'caractère de contrôle'],
  ];
  for (const [code, motif, nom] of essaisCode) {
    const rr2 = await appel(a, 'app/action/emplacement_save.php', Object.assign({}, bE, { code_barres: code }));
    L.verifier(rr2.status === 400 && motif.test(rr2.json.erreur), 'code-barres refusé : ' + nom + ' (' + (rr2.json && rr2.json.erreur || rr2.status).slice(0, 60) + ')');
  }
  r = await appel(a, 'app/action/emplacement_save.php', Object.assign({}, bE, { type: 'camion', code_barres: 'X1' }));
  L.verifier(r.status === 400 && /type/.test(r.json.erreur), 'type inconnu refusé');
  r = await appel(a, 'app/action/emplacement_save.php', Object.assign({}, bE, { entreprise_id: 99, code_barres: 'X1' }));
  L.verifier(r.status === 400 && /introuvable/.test(r.json.erreur), 'entreprise inexistante refusée');
  r = await appel(a, 'app/action/emplacement_save.php', Object.assign({}, bE, { nom: 'Code % libre _', code_barres: 'ZZ-1 .%_' }));
  L.verifier(r.status === 200, 'code avec espace et signes usuels accepté (ASCII imprimable)');
  // modification : code d'emplacement scannable
  await L.aller(a, 'emplacements');
  await a.fill('#f-recherche', 'cube 12 — marc');
  await a.waitForFunction(() => document.querySelectorAll('#table-emplacements tbody tr').length === 2 && document.querySelector('#table-emplacements tbody').textContent.includes('Boutique Chaleur'));
  const ligneNouv = a.locator('#table-emplacements tbody tr', { hasText: 'Boutique Chaleur' });
  await ligneNouv.locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-emplacement.show');
  await a.waitForFunction(() => document.querySelector('#em-nom').value === 'cube 12 — marc');
  L.verifier(!(await a.isDisabled('#em-entreprise')) && await a.isVisible('#em-actif-groupe'), 'emplacement sans historique : entreprise modifiable');
  L.verifier(await a.isHidden('#em-code-avert'), 'pas d\'avertissement tant que le code est inchangé');
  await a.fill('#em-code', 'CUBE-NOUV-7');
  L.verifier(await a.isVisible('#em-code-avert'), 'avertissement : les étiquettes déjà imprimées ne fonctionneront plus');
  await a.fill('#em-code', '');
  await a.click('#emplacement-enregistrer');
  await a.waitForFunction(() => /obligatoire/.test(document.querySelector('#modal-emplacement [data-erreur-pour="code_barres"]').textContent));
  L.verifier(true, 'modification : code-barres vide refusé');
  await a.click('#em-code-proposer');
  await a.waitForFunction(() => /^EMP-\d{6}$/.test(document.querySelector('#em-code').value));
  await a.fill('#em-code', 'CUBE-NOUV-7');
  await a.fill('#em-nom', 'Cube test');                           // le nom « cube 12 — marc » existe déjà chez Beauchemin
  await a.selectOption('#em-entreprise', '1');                    // changement d'entreprise permis : aucun mouvement
  await a.click('#emplacement-enregistrer');
  await a.waitForSelector('#modal-emplacement', { state: 'hidden' });
  L.verifier(sql("SELECT CONCAT(entreprise_id, '/', code_barres) FROM emplacements WHERE id=" + idNouv) === '1/CUBE-NOUV-7', 'entreprise et code modifiés');
  L.verifier(/"entreprise":\["Boutique Chaleur","Beauchemin"\]/.test(dernierJournal('emplacement.modifie')) && /code_barres/.test(dernierJournal('emplacement.modifie')), 'journal : emplacement.modifie (entreprise et code)');
  r = await appel(g, 'app/ajax/scan_code.php?code=CUBE-NOUV-7', null);
  L.verifier(r.json.trouve && r.json.type === 'emplacement' && r.json.emplacement.id === idNouv, 'le nouveau code est reconnu au scan (scan_code)');
  r = await appel(g, 'app/ajax/scan_code.php?code=EMP-000099', null);
  L.verifier(r.json.trouve === false, 'un code libre n\'est pas reconnu');
  // entreprise d'un emplacement qui a des mouvements : refus
  r = await appel(a, 'app/action/emplacement_save.php', { id: 3, entreprise_id: 2, nom: 'Cube 12 — Marc', type: 'cube', code_barres: 'EMP-000003' });
  L.verifier(r.status === 400 && /déjà des mouvements/.test(r.json.erreur) && sql("SELECT entreprise_id FROM emplacements WHERE id=3") === '1', 'changer l\'entreprise d\'un emplacement qui a des mouvements : refusé');
  await chercher(a, '#table-emplacements', 'EMP-000003');
  await a.locator('#table-emplacements tbody tr', { hasText: 'EMP-000003' }).locator('button[data-action=modifier]').click();
  await a.waitForSelector('#modal-emplacement.show');
  await a.waitForFunction(() => document.querySelector('#em-nom').value === 'Cube 12 — Marc');
  L.verifier(await a.isDisabled('#em-entreprise') && await a.isVisible('#em-entreprise-aide'), 'formulaire : entreprise verrouillée avec explication');
  await a.click('#modal-emplacement .btn-outline-secondary[data-dismiss=modal]');
  await a.waitForSelector('#modal-emplacement', { state: 'hidden' });
  // désactivation refusée : stock restant
  await a.locator('#table-emplacements tbody tr', { hasText: 'EMP-000003' }).locator('button[data-action=desactiver]').click();
  await confirmerModal(a, true);
  await a.waitForSelector('#modal-refus.show');
  const refusE = await tx(a, '#modal-refus-message');
  L.verifier(/il reste 4 pièces en stock/.test(refusE), 'désactivation refusée : « ' + refusE.slice(0, 90) + '… »');
  L.verifier((await a.getAttribute('#modal-refus-lien', 'href')) === 'index.php?page=stock&emplacement_id=3', 'lien vers le stock de cet emplacement');
  await a.click('#modal-refus-lien');
  await a.waitForLoadState('networkidle');
  L.verifier(/page=stock/.test(a.url()) && /emplacement_id=3/.test(a.url()), 'le lien ouvre le stock');
  L.verifier(!/pas la permission|introuvable/i.test(await a.textContent('.content-wrapper')), 'la page de stock s\'affiche');
  // désactiver un emplacement vide, puis réactiver ; message avec formes plurielles via l'API
  await L.aller(a, 'emplacements');
  await chercher(a, '#table-emplacements', 'CUBE-NOUV-7');
  await a.locator('#table-emplacements tbody tr', { hasText: 'CUBE-NOUV-7' }).locator('button[data-action=desactiver]').click();
  await confirmerModal(a, true);
  await attendreToast(a, 'désactivé');
  L.verifier(sql("SELECT actif FROM emplacements WHERE id=" + idNouv) === '0' && nbJournal('emplacement.desactive') === 1, 'emplacement vide désactivé ; journal : emplacement.desactive');
  r = await appel(g, 'app/ajax/emplacements_liste.php', null);
  L.verifier(!r.json.emplacements.some(x => x.id === idNouv), 'il disparaît des listes de saisie');
  r = await appel(g, 'app/ajax/emplacements_liste.php?inactifs=1', null);
  L.verifier(r.json.emplacements.some(x => x.id === idNouv), '… mais reste dans les données (inactifs inclus)');
  await a.locator('#table-emplacements tbody tr', { hasText: 'CUBE-NOUV-7' }).locator('button[data-action=activer]').click();
  await attendreToast(a, 'réactivé');
  L.verifier(sql("SELECT actif FROM emplacements WHERE id=" + idNouv) === '1' && nbJournal('emplacement.reactive') === 1, 'réactivé ; journal : emplacement.reactive');
  r = await appel(a, 'app/action/emplacement_activer.php', { id: 4, actif: false });
  L.verifier(r.status === 400 && /il reste 2 pièces/.test(r.json.erreur), 'API : cube 14 (2 pièces) — « 2 pièces »');
  // comptage en cours
  sql("INSERT INTO comptages (numero, entreprise_id, emplacement_id, statut) VALUES ('COM-TEST-1', 1, " + idNouv + ", 'en_cours')");
  r = await appel(a, 'app/action/emplacement_activer.php', { id: idNouv, actif: false });
  L.verifier(r.status === 400 && /comptage est en cours/.test(r.json.erreur), 'désactivation refusée : comptage en cours');
  sql("DELETE FROM comptages WHERE numero='COM-TEST-1'");
  // étiquette
  await L.aller(a, 'emplacements');
  await chercher(a, '#table-emplacements', 'EMP-000004');
  const href = await a.getAttribute('#table-emplacements tbody tr a[href*="etiquettes"]', 'href');
  L.verifier(href === 'index.php?page=etiquettes&emplacement_id=4', 'bouton « Étiquette » : ' + href);
  await a.click('#table-emplacements tbody tr a[href*="etiquettes"]');
  await a.waitForLoadState('networkidle');
  L.verifier(/page=etiquettes/.test(a.url()) && !/pas la permission/i.test(await a.textContent('.content-wrapper')), 'la page des étiquettes s\'ouvre');
  r = await appel(a, 'app/ajax/emplacement_code_proposer.php', null);
  L.verifier(r.json.ok && /^EMP-\d{6}$/.test(r.json.code), 'proposition de code : ' + r.json.code);

  // =====================================================================================================================
  console.log('12. Journal');
  sql("INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, details, ip) VALUES (NOW(), NULL, 'zzz.inconnue', 'objet_x', 7, '{\"foo_bar\":1,\"liste\":[1,2],\"x\":{\"k1\":true,\"k2\":null},\"role\":\"gestionnaire\",\"changements\":{\"nom\":[\"A\",\"B\"],\"actif\":[1,0]}}', '10.1.2.3')");
  sql("INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, details, ip) VALUES (NOW(), 1, '=cmd|calc', 'pieces', 3, '=1+1 pas du json', '10.1.2.4')");
  sql("INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, details, ip) VALUES ('2020-01-15 10:00:00', 1, 'connexion', 'utilisateurs', 1, NULL, '10.1.2.5')");
  await L.aller(a, 'journal');
  await a.waitForSelector('#table-journal tbody tr');
  const jhtml2 = await a.innerHTML('#table-journal');
  L.verifier(/zzz\.inconnue/.test(jhtml2), 'action inconnue affichée telle quelle');
  const ligneInc = await a.evaluate(() => [...document.querySelectorAll('#table-journal tbody tr')].find(t => t.textContent.includes('zzz.inconnue')).textContent.replace(/\s+/g, ' '));
  L.verifier(/Foo bar : 1/.test(ligneInc) && /Liste : 1, 2/.test(ligneInc) && /Rôle : Gestionnaire/.test(ligneInc) && /Nom : A → B/.test(ligneInc) && /Actif : Oui → Non/.test(ligneInc) && /K1 : Oui ; K2 : \(vide\)/.test(ligneInc), 'détails lisibles en français (clé inconnue, liste, booléens, rôle, avant → après) : ' + ligneInc);
  L.verifier(!/\{"|":/.test(ligneInc), 'pas de JSON brut');
  L.verifier(/=cmd\|calc/.test(jhtml2) && /=1\+1 pas du json/.test(jhtml2), 'détails non JSON affichés tels quels, échappés');
  L.verifier(/Objet_x n° 7|objet_x n° 7/.test(jhtml2), 'entité inconnue affichée telle quelle');
  L.verifier(/href="index\.php\?page=piece_voir&amp;id=3"/.test(jhtml2), 'lien vers la pièce concernée');
  await a.selectOption('#f-action', 'utilisateur.cree');
  await attendreTable(a, '#table-journal', 'Tech.Un');
  const lc = await a.evaluate(() => [...document.querySelectorAll('#table-journal tbody tr')].find(t => t.textContent.includes('Tech.Un') && t.textContent.includes('Utilisateur créé')).textContent.replace(/\s+/g, ' '));
  L.verifier(/Utilisateur créé/.test(lc) && /Nom d'utilisateur : Tech\.Un/.test(lc) && /Rôle : Employé/.test(lc) && /Entreprises : Beauchemin/.test(lc), 'utilisateur.cree : « ' + lc.slice(0, 160) + ' »');
  // filtres
  await a.selectOption('#f-action', 'zzz.inconnue');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length === 1 && document.querySelector('#table-journal tbody').textContent.includes('zzz.inconnue'));
  L.verifier(true, 'filtre par action');
  await a.selectOption('#f-action', '');
  await a.selectOption('#f-utilisateur', 'aucun');
  await a.waitForFunction(() => { const t = document.querySelector('#table-journal tbody').textContent; return t.includes('zzz.inconnue') && !t.includes('Prix fournisseur'); });
  L.verifier(true, 'filtre « Aucun (système ou inconnu) »');
  await a.selectOption('#f-utilisateur', '');
  await a.selectOption('#f-entite', 'utilisateurs');
  await a.waitForFunction(() => { const t = document.querySelector('#table-journal tbody').textContent; return t.includes('Utilisateur n°') && !t.includes('Pièce n°'); });
  L.verifier(true, 'filtre par élément');
  await a.selectOption('#f-entite', '');
  await a.fill('#f-du', '2020-01-01');
  await a.fill('#f-au', '2020-01-31');
  await a.dispatchEvent('#f-au', 'change');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length === 1 && /2020-01-15/.test(document.querySelector('#table-journal tbody').textContent));
  L.verifier(true, 'filtre par dates : une seule entrée, du 2020-01-15 (bornes incluses)');
  await a.fill('#f-au', '2020-01-15');
  await a.dispatchEvent('#f-au', 'change');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length === 1 && /2020-01-15/.test(document.querySelector('#table-journal tbody').textContent));
  L.verifier(true, 'la date de fin est incluse en entier');
  await a.click('#btn-reinitialiser');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length > 5);
  await a.fill('#f-recherche', '10.1.2.3');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length === 1 && /zzz\.inconnue/.test(document.querySelector('#table-journal tbody').textContent));
  L.verifier(true, 'recherche libre (adresse IP)');
  // API : filtres invalides et tri
  r = await liste(a, 'app/ajax/journal_data.php', { draw: '1', du: '2020-13-40' });
  L.verifier(r.status === 400 && /Date de début invalide/.test(r.json.erreur), 'date invalide : 400 en français');
  r = await liste(a, 'app/ajax/journal_data.php', { draw: '1', utilisateur_id: "1' OR '1'='1" });
  L.verifier(r.status === 400, 'filtre utilisateur non numérique : 400');
  r = await liste(a, 'app/ajax/journal_data.php', { draw: '1', action: "x' OR '1'='1", length: '10' });
  L.verifier(r.status === 200 && r.json.data.length === 0, 'filtre d\'action malveillant : aucun résultat, aucune erreur');
  const colJ = ['id', 'utilisateur', 'action', 'entite', 'details', 'ip'];
  for (let i = 0; i < colJ.length; i++) {
    const rr2 = await liste(a, 'app/ajax/journal_data.php', { draw: '1', start: '0', length: '10', 'order[0][column]': String(i), 'order[0][dir]': 'asc', ['columns[' + i + '][data]']: colJ[i] });
    L.verifier(rr2.status === 200 && rr2.json.data.length === 10, 'tri du journal par ' + colJ[i]);
  }
  r = await liste(a, 'app/ajax/journal_data.php', { draw: '3', start: '0', length: '5' });
  L.verifier(r.json.draw === 3 && r.json.data[0].id > r.json.data[1].id, 'le plus récent d\'abord ; draw renvoyé');
  // export CSV par le bouton
  await a.click('#btn-reinitialiser');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length > 5);
  await a.fill('#f-recherche', 'cmd');
  await a.waitForFunction(() => document.querySelectorAll('#table-journal tbody tr').length === 1);
  const [dlg] = await Promise.all([a.waitForEvent('download'), a.click('#btn-exporter')]);
  const fichier = path.join(os.tmpdir(), 'journal-e2e.csv');
  await dlg.saveAs(fichier);
  const csv = fs.readFileSync(fichier);
  L.verifier(dlg.suggestedFilename().startsWith('journal-') && /\.csv$/.test(dlg.suggestedFilename()), 'fichier téléchargé : ' + dlg.suggestedFilename());
  L.verifier(csv[0] === 0xEF && csv[1] === 0xBB && csv[2] === 0xBF, 'CSV en UTF-8 avec BOM');
  const txt = csv.toString('utf8').replace(/^\uFEFF/, '');
  const lignesCsv = txt.trim().split('\r\n');
  L.verifier(lignesCsv[0] === "Date et heure;Utilisateur;Action;Code de l'action;Élément;N° de l'élément;Détails;Adresse IP", 'en-têtes en français séparés par « ; »');
  L.verifier(lignesCsv.length === 2 && lignesCsv[1].includes("'=cmd|calc;'=cmd|calc") && lignesCsv[1].includes("'=1+1 pas du json"), 'formules neutralisées (apostrophe devant = + - @) : ' + lignesCsv[1]);
  L.verifier(/;Pièce;3;/.test(lignesCsv[1]), 'élément en français dans le CSV');
  fs.unlinkSync(fichier);
  // export direct : en-têtes HTTP, filtres, erreurs
  r = await a.evaluate(async () => { const x = await fetch('app/ajax/journal_export.php?action=zzz.inconnue', { credentials: 'same-origin' }); return { s: x.status, d: x.headers.get('content-disposition'), t: x.headers.get('content-type'), b: await x.text() }; });
  L.verifier(r.s === 200 && /^attachment; filename="journal-\d{4}-\d\d-\d\d\.csv"$/.test(r.d) && /text\/csv/.test(r.t), 'export : Content-Disposition: attachment et type text/csv');
  L.verifier(r.b.split('\r\n').filter(Boolean).length === 2 && /Foo bar : 1 \| Liste : 1, 2/.test(r.b), 'export filtré : détails en texte lisible');
  r = await a.evaluate(async () => { const x = await fetch('app/ajax/journal_export.php?du=pas-une-date', { credentials: 'same-origin' }); return { s: x.status, t: await x.text() }; });
  L.verifier(r.s === 400 && /invalide/.test(r.t), 'export : date invalide → 400 en français');
  L.verifier(nbJournal('journal.export') >= 2, 'les exports sont eux-mêmes inscrits au journal');
  // lecture seule : aucun endpoint d'écriture du journal
  r = await appel(a, 'app/action/journal_effacer.php', {});
  L.verifier(r.status === 404, 'aucun point d\'entrée ne permet d\'effacer le journal');

  // =====================================================================================================================
  console.log('13. Profil et changement de mot de passe');
  const pe = await nouvelle();
  L.verifier((await connecterComme(pe, 'mdp1', 'Ancien-Mot-2026')).ok, 'mdp1 connecté');
  await L.aller(pe, 'profil');
  L.verifier(/mdp1/.test(await tx(pe, '#profil-nom-utilisateur')) && /Employé/.test(await tx(pe, '#profil-role')) && /Beauchemin/.test(await tx(pe, '#profil-entreprises')) && !/Boutique/.test(await tx(pe, '#profil-entreprises')), 'infos : nom, rôle, entreprises');
  L.verifier(/Consulte les pièces/.test(await tx(pe, '#profil-role')), 'explication du rôle');
  const cookieAvant = (await pe.context().cookies()).find(c => /PHPSESSID/.test(c.name)).value;
  await pe.click('#profil-enregistrer');
  await pe.waitForFunction(() => !document.querySelector('[data-erreur-pour="actuel"]').hidden);
  L.verifier(/Saisissez votre mot de passe actuel/.test(await tx(pe, '[data-erreur-pour=actuel]')), 'mot de passe actuel obligatoire');
  await pe.fill('#p-actuel', 'Ancien-Mot-2026');
  await pe.fill('#p-nouveau', 'court');
  await pe.click('#profil-enregistrer');
  await pe.waitForFunction(() => !document.querySelector('[data-erreur-pour="nouveau"]').hidden);
  L.verifier(/au moins 10/.test(await tx(pe, '[data-erreur-pour=nouveau]')), 'nouveau mot de passe trop court');
  await pe.fill('#p-nouveau', 'Nouveau-Mot-2026');
  await pe.fill('#p-confirmation', 'Autre-Mot-2026');
  await pe.click('#profil-enregistrer');
  await pe.waitForFunction(() => !document.querySelector('[data-erreur-pour="confirmation"]').hidden);
  L.verifier(/ne correspond pas/.test(await tx(pe, '[data-erreur-pour=confirmation]')), 'confirmation différente');
  r = await appel(pe, 'app/action/profil_mdp.php', { actuel: 'Ancien-Mot-2026', nouveau: 'Ancien-Mot-2026', confirmation: 'Ancien-Mot-2026' });
  L.verifier(r.status === 400 && /différent de l'actuel/.test(r.json.erreur), 'nouveau = actuel refusé');
  r = await appel(pe, 'app/action/profil_mdp.php', { actuel: 'Ancien-Mot-2026', nouveau: 'mdp1', confirmation: 'mdp1' });
  L.verifier(r.status === 400, 'nouveau trop court / = nom d\'utilisateur refusé');
  r = await appel(pe, 'app/action/profil_mdp.php', { actuel: ['x'], nouveau: 'Nouveau-Mot-2026', confirmation: 'Nouveau-Mot-2026' });
  L.verifier(r.status === 400, 'valeur de type tableau refusée sans erreur serveur');
  await pe.fill('#p-actuel', 'Mauvais-Actuel-1');
  await pe.fill('#p-confirmation', 'Nouveau-Mot-2026');
  await pe.click('#profil-enregistrer');
  await pe.waitForFunction(() => !document.querySelector('[data-erreur-pour="actuel"]').hidden);
  L.verifier(/actuel est incorrect/.test(await tx(pe, '[data-erreur-pour=actuel]')) && sql("SELECT tentatives_echec FROM utilisateurs WHERE nom_utilisateur='mdp1'") === '1', 'mot de passe actuel erroné : message clair, échec compté (1)');
  L.verifier(verifierHash('Ancien-Mot-2026', sql("SELECT mot_de_passe FROM utilisateurs WHERE nom_utilisateur='mdp1'")), 'rien n\'a changé en base');
  await pe.fill('#p-actuel', 'Ancien-Mot-2026');
  await pe.click('#profil-enregistrer');
  await pe.waitForFunction(() => !document.querySelector('#profil-succes').hidden);
  L.verifier(/Votre mot de passe a été changé/.test(await tx(pe, '#profil-succes')), 'succès : « ' + await tx(pe, '#profil-succes') + ' »');
  L.verifier(await pe.inputValue('#p-actuel') === '' && await pe.inputValue('#p-nouveau') === '' && await pe.inputValue('#p-confirmation') === '', 'champs vidés après le changement');
  secrets.push('Nouveau-Mot-2026');
  const cookieApres = (await pe.context().cookies()).find(c => /PHPSESSID/.test(c.name)).value;
  L.verifier(cookieAvant !== cookieApres, 'identifiant de session régénéré après le changement');
  await L.aller(pe, 'stock');
  L.verifier(!/login/.test(pe.url()), 'la session reste ouverte après le changement');
  L.verifier(sql("SELECT tentatives_echec FROM utilisateurs WHERE nom_utilisateur='mdp1'") === '0' && nbJournal('profil.mdp_change') === 1 && !dernierJournal('profil.mdp_change').includes('Nouveau'), 'journal : profil.mdp_change sans secret ; échecs remis à zéro');
  const pe2 = await nouvelle();
  L.verifier(!(await connecterComme(pe2, 'mdp1', 'Ancien-Mot-2026')).ok && (await connecterComme(pe2, 'mdp1', 'Nouveau-Mot-2026')).ok, 'l\'ancien mot de passe est refusé, le nouveau fonctionne');
  // l'administrateur et le gestionnaire ont aussi un profil
  await L.aller(a, 'profil');
  L.verifier(/Toutes les entreprises/.test(await tx(a, '#profil-entreprises')) && /Administrateur/.test(await tx(a, '#profil-role')), 'profil de l\'administrateur : toutes les entreprises');
  await L.aller(g, 'profil');
  L.verifier(/Beauchemin, Boutique Chaleur/.test(await tx(g, '#profil-entreprises')), 'profil du gestionnaire');
  // essais répétés du mot de passe actuel : verrouillage
  const pm = await nouvelle();
  L.verifier((await connecterComme(pm, 'verrou1', MDP)).ok, 'verrou1 connecté pour l\'essai de force brute');
  for (let i = 0; i < 5; i++) { r = await appel(pm, 'app/action/profil_mdp.php', { actuel: 'faux-faux-' + i, nouveau: 'Nouveau-Mot-2030', confirmation: 'Nouveau-Mot-2030' }); }
  r = await appel(pm, 'app/action/profil_mdp.php', { actuel: MDP, nouveau: 'Nouveau-Mot-2030', confirmation: 'Nouveau-Mot-2030' });
  L.verifier(r.status === 400 && /verrouillé/.test(r.json.erreur) && verifierHash(MDP, sql("SELECT mot_de_passe FROM utilisateurs WHERE nom_utilisateur='verrou1'")), 'après 5 mots de passe actuels faux : compte verrouillé, même le bon est refusé, mot de passe intact');
  L.verifier(nbJournal('profil.mdp_echec') >= 6, 'journal : profil.mdp_echec');
  sql("UPDATE utilisateurs SET tentatives_echec = 0, verrouille_jusqua = NULL WHERE nom_utilisateur='verrou1'");

  // =====================================================================================================================
  console.log('14. Sauvegarde et restauration');
  await L.aller(a, 'backup_database');
  L.verifier(/empreintes des mots de passe/.test(await tx(a, '#sauvegarde-avertissement')) && /lieu sûr/.test(await tx(a, '#sauvegarde-avertissement')), 'avertissement : le fichier contient les empreintes de mots de passe, à garder en lieu sûr');
  const nbTables = parseInt(sql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='" + DB + "' AND table_type='BASE TABLE'"), 10);
  L.verifier(await a.locator('input.checkbox_table').count() === nbTables && (await tx(a, '#sauvegarde-compte')).startsWith(nbTables + ' tables sur ' + nbTables), 'toutes les tables (' + nbTables + ') cochées par défaut');
  const listerSql = () => execSync('find . \\( -name "*.sql" -o -name "*.sql.gz" -o -name "*.dump" \\) -not -path "./.git/*" | sort', { cwd: RACINE }).toString();
  const sqlAvant = listerSql();
  // sauvegarde partielle : confirmation
  await a.uncheck('input.checkbox_table >> nth=0', { force: true });
  await a.click('#btn-sauvegarde');
  await a.waitForSelector('#modal-confirmer.show');
  L.verifier(/INCOMPLÈTE/.test(await confirmerModal(a, false)), 'sauvegarde partielle : confirmation demandée (et annulable)');
  await a.click('#btn-tout-cocher');
  L.verifier((await tx(a, '#sauvegarde-compte')).startsWith(nbTables + ' tables'), '« Tout cocher »');
  await a.click('#btn-tout-decocher');
  await a.click('#btn-sauvegarde');
  await a.waitForFunction(() => /au moins une table/.test(document.querySelector('#sauvegarde-etat').textContent));
  L.verifier(true, 'aucune table cochée : message en français, rien n\'est envoyé');
  await a.click('#btn-tout-cocher');
  const dernier = sql("SELECT MAX(id) FROM journal");
  const [tel] = await Promise.all([a.waitForEvent('download'), a.click('#btn-sauvegarde')]);
  const sauv = path.join(os.tmpdir(), 'sauvegarde-e2e.sql');
  await tel.saveAs(sauv);
  const dump = fs.readFileSync(sauv, 'utf8');
  L.verifier(/^sauvegarde_beauchemin_\d{4}-\d\d-\d\d_\d{6}\.sql$/.test(tel.suggestedFilename()), 'nom du fichier : ' + tel.suggestedFilename());
  L.verifier(dump.includes('CREATE TABLE `utilisateurs`') && /INSERT INTO `utilisateurs` \([^)]*`mot_de_passe`/.test(dump) && dump.includes("'gestionnaire1'"), 'la table des utilisateurs sort bien (structure et données)');
  L.verifier((dump.match(/\$2y\$/g) || []).length >= 10, 'les empreintes de mots de passe sont dans le fichier (d\'où l\'avertissement)');
  L.verifier(dump.trimEnd().endsWith('-- Fin de la sauvegarde (complète)') && /^-- Sauvegarde Beauchemin/.test(dump) && /CONFIDENTIEL/.test(dump), 'en-tête confidentiel et marque de fin de fichier');
  L.verifier((dump.match(/^CREATE TABLE/gm) || []).length === nbTables, 'toutes les tables sont créées');
  L.verifier(dump.includes("'" + XSS1 + "'") || dump.includes(XSS1.replace(/'/g, "\\'")), 'les valeurs sont écrites entre apostrophes (échappées par PDO::quote), jamais interprétées');
  L.verifier(parseInt(sql("SELECT COUNT(*) FROM journal WHERE action='sauvegarde.telechargee' AND id > " + dernier), 10) === 1, 'journal : sauvegarde.telechargee');
  L.verifier(listerSql() === sqlAvant, 'aucun fichier de sauvegarde n\'a été écrit dans le dossier du site');
  // jeton invalide / tables inconnues
  r = await a.evaluate(async () => { const x = await fetch('index.php?page=backup_database', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'csrf_token=faux&table[]=utilisateurs' }); return { d: x.headers.get('content-disposition'), t: await x.text() }; });
  L.verifier(!r.d && /Jeton de sécurité invalide/.test(r.t) && !/INSERT INTO/.test(r.t), 'jeton CSRF invalide : refusé, aucun fichier');
  r = await a.evaluate(async () => { const j = document.querySelector('meta[name=csrf-token]').content; const x = await fetch('index.php?page=backup_database', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'csrf_token=' + j + '&table[]=' + encodeURIComponent('mysql.user') + '&table[]=' + encodeURIComponent('utilisateurs`; DROP TABLE pieces; --') + '&table[]=information_schema.tables' }); return { d: x.headers.get('content-disposition'), t: await x.text() }; });
  L.verifier(!r.d && /au moins une table/.test(r.t) && sql("SELECT COUNT(*) FROM pieces") === '14', 'noms de tables inconnus ou piégés : ignorés (liste blanche), rien n\'est exécuté');
  r = await a.evaluate(async () => { const j = document.querySelector('meta[name=csrf-token]').content; const x = await fetch('index.php?page=backup_database', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'csrf_token=' + j + '&table[]=entreprises&table[]=mysql.user' }); return { d: x.headers.get('content-disposition'), t: await x.text() }; });
  L.verifier(/attachment/.test(r.d) && /INSERT INTO `entreprises`/.test(r.t) && !/mysql|`user`/.test(r.t.replace(/Sauvegarde Beauchemin/, '')), 'seule la vraie table demandée est exportée (liste blanche)');
  // restauration complète dans une base vide
  const restore = DB + '_restore';
  execSync('mysql -uroot -e "DROP DATABASE IF EXISTS ' + restore + '; CREATE DATABASE ' + restore + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"', { cwd: RACINE });
  execSync('mysql -uroot ' + restore + ' < ' + sauv, { cwd: RACINE, shell: '/bin/bash' });
  const tablesBase = sql("SELECT table_name FROM information_schema.tables WHERE table_schema='" + DB + "' AND table_type='BASE TABLE' ORDER BY table_name").split('\n');
  const tablesRest = sqlDb(restore, "SELECT table_name FROM information_schema.tables WHERE table_schema='" + restore + "' AND table_type='BASE TABLE' ORDER BY table_name").split('\n');
  L.verifier(JSON.stringify(tablesBase) === JSON.stringify(tablesRest), 'restauration : les ' + tablesRest.length + ' tables existent dans la base vide');
  // la sauvegarde a été prise avant l'écriture du journal de sauvegarde : on compare tout sauf le journal et ce qui a bougé depuis
  let identiques = 0, differentes = [];
  for (const t of tablesBase) {
    if (t === 'journal') { continue; }
    const c1 = sql('CHECKSUM TABLE `' + t + '`').split('\t')[1], c2 = sqlDb(restore, 'CHECKSUM TABLE `' + t + '`').split('\t')[1];
    const n1 = sql('SELECT COUNT(*) FROM `' + t + '`'), n2 = sqlDb(restore, 'SELECT COUNT(*) FROM `' + t + '`');
    if (c1 === c2 && n1 === n2) { identiques++; } else { differentes.push(t + ' (' + n1 + ' / ' + n2 + ')'); }
  }
  L.verifier(differentes.length === 0, 'restauration : contenu identique (somme de contrôle) pour ' + identiques + ' tables' + (differentes.length ? ' — différentes : ' + differentes.join(', ') : ''));
  const maxR = sqlDb(restore, 'SELECT MAX(id) FROM journal');
  const empreinteJournal = "SELECT COUNT(*), SUM(CRC32(CONCAT_WS('|', id, date_action, IFNULL(utilisateur_id, ''), action, IFNULL(entite, ''), IFNULL(entite_id, ''), IFNULL(details, ''), IFNULL(ip, '')))) FROM journal WHERE id <= " + maxR;
  L.verifier(sql(empreinteJournal) === sqlDb(restore, empreinteJournal) && /sauvegarde\.telechargee/.test(sqlDb(restore, "SELECT GROUP_CONCAT(DISTINCT action) FROM journal")), 'restauration : journal identique (jusqu\'à l\'entrée n° ' + maxR + ', y compris l\'inscription de la sauvegarde)');
  L.verifier(sql("SELECT GROUP_CONCAT(nom_utilisateur, ':', mot_de_passe ORDER BY id) FROM utilisateurs") === sqlDb(restore, "SELECT GROUP_CONCAT(nom_utilisateur, ':', mot_de_passe ORDER BY id) FROM utilisateurs"), 'restauration : les utilisateurs et leurs empreintes sont identiques');
  L.verifier(sqlDb(restore, "SELECT COUNT(*) FROM stock s JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m ON m.piece_id=s.piece_id AND m.emplacement_id=s.emplacement_id WHERE s.quantite <> m.q") === '0', 'restauration : stock = somme des mouvements (cohérence)');
  L.verifier(sqlDb(restore, "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='" + restore + "' AND constraint_type='FOREIGN KEY'") === sql("SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='" + DB + "' AND constraint_type='FOREIGN KEY'"), 'restauration : les clés étrangères sont rétablies');
  // la base restaurée fonctionne : on s'y connecte avec l'application d'origine (même code, autre base) — comparaison d'un compte
  L.verifier(verifierHash(MDP, sqlDb(restore, "SELECT mot_de_passe FROM utilisateurs WHERE nom_utilisateur='gestionnaire1'")), 'restauration : le mot de passe d\'un compte restauré fonctionne');
  execSync('mysql -uroot -e "DROP DATABASE IF EXISTS ' + restore + '"', { cwd: RACINE });
  fs.unlinkSync(sauv);

  // =====================================================================================================================
  console.log('15. Tablette et clavier');
  const tab = await nouvelle({ width: 768, height: 1024 });
  await L.connecter(tab, 'admin');
  for (const route of ['utilisateurs', 'entreprises', 'emplacements', 'journal', 'profil', 'backup_database']) {
    await L.aller(tab, route);
    await tab.waitForTimeout(300);
    const dep = await tab.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    L.verifier(dep <= 1, 'tablette (768 px) : ' + route + ' sans défilement horizontal de la page (' + dep + ')');
  }
  await L.aller(tab, 'utilisateurs');
  await tab.click('#btn-nouveau');
  await tab.waitForSelector('#modal-utilisateur.show');
  const hauteurs = await tab.evaluate(() => ['#u-nom', '#u-complet', '#u-role', '#utilisateur-enregistrer', '#u-mdp-gen'].map(s => document.querySelector(s).getBoundingClientRect().height));
  L.verifier(hauteurs.every(h => h >= 38), 'tablette : champs et boutons du formulaire assez grands (' + hauteurs.map(Math.round).join('/') + ' px)');
  // clavier seulement : Tab dans le formulaire, Entrée soumet
  await tab.waitForFunction(() => document.activeElement && document.activeElement.id === 'u-nom');   // le champ reçoit le focus à l'ouverture
  await tab.keyboard.type('clavier.seul');
  await tab.keyboard.press('Tab');
  await tab.keyboard.type('Clavier Seulement');
  await tab.keyboard.press('Tab');
  await tab.selectOption('#u-role', 'admin');
  await tab.fill('#u-mdp', 'Clavier-Seulement-1');
  secrets.push('Clavier-Seulement-1');
  await tab.press('#u-mdp', 'Enter');
  await tab.waitForSelector('#modal-mdp.show');
  L.verifier(await tab.inputValue('#mdp-champ') === 'Clavier-Seulement-1', 'création au clavier (Entrée dans le formulaire)');
  await tab.click('#mdp-fermer');
  await tab.waitForSelector('#modal-mdp', { state: 'hidden' });

  // =====================================================================================================================
  console.log('16. Mots de passe absents du journal, journal PHP propre, console propre');
  const toutJournal = sql("SELECT IFNULL(GROUP_CONCAT(IFNULL(details,'') SEPARATOR ' '), '') FROM journal");
  const fuites = secrets.filter(s => toutJournal.includes(s));
  L.verifier(fuites.length === 0, 'aucun des ' + secrets.length + ' mots de passe utilisés ne figure dans le journal d\'audit' + (fuites.length ? ' : ' + fuites.join(', ') : ''));
  let logPhp = '';
  try { logPhp = fs.readFileSync(JOURNAL).slice(debutJournal).toString('utf8'); } catch (e) { logPhp = ''; }
  const problemes = logPhp.split('\n').filter(l => /Warning|Notice|Fatal|Deprecated|Parse error|Stack trace|SQLSTATE|Endpoint /.test(l));
  L.verifier(problemes.length === 0, 'journal PHP propre (' + problemes.length + ' ligne(s) en cause' + (problemes.length ? ' : ' + problemes.slice(0, 3).join(' | ') : '') + ')');
  L.verifier(!secrets.some(s => logPhp.includes(s)), 'aucun mot de passe dans le journal PHP');
  for (const p of pages) {
    const e = reelles(p);
    L.verifier(e.length === 0, 'console propre' + (e.length ? ' : ' + e.slice(0, 3).join(' | ') : ''));
  }
  L.verifier(dialogues.length === 0, 'aucune boîte de dialogue JavaScript pendant tout le test');

  await b.close();
  remise();
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(2); });
