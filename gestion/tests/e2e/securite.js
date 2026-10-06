// Audit de sécurité automatique de TOUS les endpoints (app/ajax et app/action), sans navigateur.
//   tools/serveur.sh start bea_secu 8800 --neuf
//   DB_NAME=bea_secu BASE_URL=http://127.0.0.1:8800 NODE_PATH=$(npm root -g) node tests/e2e/securite.js
// Vérifie, pour chaque endpoint :
//   1. sans session : jamais de donnée (401, ou refus/redirection pour login/logout)
//   2. POST sans jeton CSRF (session valide) : 403, et rien n'est écrit
//   3. GET sur un endpoint d'écriture : 405 (ou refus), jamais une écriture
//   4. charges malformées (types inattendus, tableaux, JSON invalide, énormes, octets invalides) avec chaque rôle :
//      jamais de 500, jamais de trace PHP dans la réponse, aucun avertissement dans le journal PHP
//   5. un employé n'obtient jamais de succès sur un endpoint réservé (liste des endpoints d'écriture à rôle minimum ci-dessous)
//   6. aucune réponse destinée à l'employé ne contient de champ de coût
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const RACINE = path.resolve(__dirname, '..', '..');
const BASE = L.BASE;
const PORT = new URL(BASE).port || '80';
const JOURNAL = '/tmp/bea-' + PORT + '.log';
const COMPTES = {
  admin: ['admin', 'Test-Beauchemin-1'],
  gestionnaire: ['gestionnaire1', 'Test-Beauchemin-1'],
  employe: ['employe1', 'Test-Beauchemin-1'],
};
// Écritures qui exigent AU MOINS le rôle indiqué (un employé doit être refusé, quel que soit le contenu)
const ROLE_MIN_ECRITURE = {
  reception_save: 'gestionnaire', ajustement_save: 'gestionnaire', facture_save: 'gestionnaire', facture_annuler: 'gestionnaire',
  document_annuler: 'gestionnaire', piece_save: 'gestionnaire', piece_activer: 'gestionnaire', prix_save: 'gestionnaire', prix_supprimer: 'gestionnaire',
  fournisseur_save: 'gestionnaire', fournisseur_activer: 'gestionnaire', categorie_save: 'gestionnaire', categorie_supprimer: 'gestionnaire',
  import_apercu: 'gestionnaire', import_confirmer: 'gestionnaire', import_appliquer: 'gestionnaire',
  utilisateur_save: 'admin', utilisateur_activer: 'admin', utilisateur_mdp: 'admin', utilisateur_deverrouiller: 'admin',
  entreprise_save: 'admin', entreprise_activer: 'admin', emplacement_save: 'admin', emplacement_activer: 'admin',
};
const MOTS_COUT = /"(cout_unitaire|cout_moyen|prix|prix_fournisseurs|valeur|total|total_ligne)"\s*:/;

function cookies(resp) {
  const sc = resp.headers.getSetCookie ? resp.headers.getSetCookie() : [];
  return sc.map(c => c.split(';')[0]).join('; ');
}

async function ouvrirSession(role) {
  let r = await fetch(BASE + '/login.php', { redirect: 'manual' });
  let ck = cookies(r);
  const html = await r.text();
  const tok = (html.match(/name="csrf_token" value="([a-f0-9]+)"/) || [])[1];
  const [u, p] = COMPTES[role];
  r = await fetch(BASE + '/app/action/login.php', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: ck },
    body: new URLSearchParams({ username: u, password: p, admin_login: '1', csrf_token: tok }),
  });
  const ck2 = cookies(r) || ck;
  const idx = await (await fetch(BASE + '/index.php', { headers: { Cookie: ck2 }, redirect: 'manual' })).text();
  const csrf = (idx.match(/name="csrf-token" content="([a-f0-9]+)"/) || [])[1];
  if (!csrf) throw new Error('Connexion impossible pour ' + role);
  return { ck: ck2, csrf };
}

async function appeler(url, { methode = 'POST', session = null, csrf = true, corps = null, type = 'application/json', accept = 'application/json' } = {}) {
  const h = { Accept: accept };
  if (session) h.Cookie = session.ck;
  if (session && csrf && methode !== 'GET') h['X-CSRF-Token'] = session.csrf;
  let body;
  if (methode !== 'GET') { h['Content-Type'] = type; body = corps; }
  const r = await fetch(BASE + url, { method: methode, headers: h, body, redirect: 'manual' });
  const t = await r.text();
  return { status: r.status, texte: t, type: r.headers.get('content-type') || '' };
}

function liste(dossier) {
  return fs.readdirSync(path.join(RACINE, 'app', dossier)).filter(f => f.endsWith('.php')).map(f => ({ dossier, nom: f.replace(/\.php$/, ''), fichier: f }));
}

const CHARGES = [
  ['objet vide', '{}', 'application/json'],
  ['tableau', '[]', 'application/json'],
  ['texte', '"texte"', 'application/json'],
  ['JSON invalide', '{"a":', 'application/json'],
  ['types inattendus', JSON.stringify({ id: [1], q: { a: 1 }, code: ['x'], piece_id: 'abc', emplacement_id: -5, quantite: [], lignes: 'x', search: { value: ['a'] }, draw: [1], start: 'x', length: [], order: 'x', columns: 'y', annee: [], mois: {}, entreprise_id: ['1'] }), 'application/json'],
  ['nombres extrêmes', JSON.stringify({ id: 9e99, piece_id: 99999999999999999999, quantite: '1e999', emplacement_id: 1e308, lignes: [{ piece_id: 1, quantite: '999999999999999999' }] }), 'application/json'],
  ['lignes piégées', JSON.stringify({ emplacement_id: 1, lignes: [{ piece_id: [1], quantite: { a: 1 } }, 'x', null, [], { piece_id: 1 }] }), 'application/json'],
  ['formulaire', 'id[]=1&q[a]=2&code=%00&lignes=x', 'application/x-www-form-urlencoded'],
  ['grand texte', JSON.stringify({ nom: 'A'.repeat(300000), q: 'B'.repeat(100000), note: 'é'.repeat(50000) }), 'application/json'],
  ['XSS / SQL', JSON.stringify({ nom: '<img src=x onerror=alert(1)>', q: "' OR 1=1 -- ", code: '"><script>alert(1)</script>', search: { value: "%' UNION SELECT 1 -- " } }), 'application/json'],
];

(async () => {
  const sessions = {};
  for (const r of Object.keys(COMPTES)) sessions[r] = await ouvrirSession(r);

  const endpoints = [].concat(liste('ajax'), liste('action'));
  const evite = new Set(['login', 'logout']);     // points d'entrée publics par conception
  console.log('Endpoints : ' + endpoints.length + ' (ajax ' + liste('ajax').length + ', action ' + liste('action').length + ')');
  let tailleJournal = 0;
  try { tailleJournal = fs.statSync(JOURNAL).size; } catch (e) { /* pas de journal */ }

  const anomalies = [];
  const noter = (cond, msg) => { L.verifier(cond, msg); if (!cond) anomalies.push(msg); };

  for (const ep of endpoints) {
    const url = '/app/' + ep.dossier + '/' + ep.fichier;
    const lib = /_lib$/.test(ep.nom) || /^(.*)_lib$/.test(ep.nom);

    // 0. fichiers d'aide : jamais de contenu ni d'erreur à l'appel direct
    if (lib) {
      const r = await appeler(url, { methode: 'GET' });
      noter(r.status < 500 && !/Fatal|Warning|Notice|Stack trace|\.php on line/i.test(r.texte), 'fichier d\'aide ' + ep.fichier + ' : appel direct sans erreur ni trace (' + r.status + ')');
      continue;
    }

    // 1. sans session
    if (!evite.has(ep.nom)) {
      for (const methode of ['GET', 'POST']) {
        const r = await appeler(url, { methode, corps: '{}' });
        noter(r.status === 401 || r.status === 405 || r.status === 403, ep.fichier + ' sans session (' + methode + ') : refusé (' + r.status + ')');
        noter(!MOTS_COUT.test(r.texte) && !/"ok":true/.test(r.texte), ep.fichier + ' sans session (' + methode + ') : aucune donnée (' + r.texte.slice(0, 60) + ')');
      }
    }

    // 2. POST sans jeton CSRF (session valide) : 403
    const sg = sessions.gestionnaire;
    const rc = await appeler(url, { methode: 'POST', session: sg, csrf: false, corps: '{}' });
    if (!evite.has(ep.nom)) noter(rc.status === 403, ep.fichier + ' : POST sans jeton CSRF refusé (' + rc.status + ')');

    // 3. GET sur une écriture : jamais d'effet (405 attendu pour app/action)
    if (ep.dossier === 'action' && !evite.has(ep.nom)) {
      const rg = await appeler(url, { methode: 'GET', session: sg });
      noter(rg.status === 405 || rg.status === 400 || rg.status === 403, ep.fichier + ' : GET sur une écriture refusé (' + rg.status + ')');
    }

    // 4 et 5. charges malformées avec chaque rôle
    for (const role of ['employe', 'gestionnaire', 'admin']) {
      for (const [libelle, corps, type] of CHARGES) {
        if (evite.has(ep.nom)) continue;
        const r = await appeler(url, { methode: 'POST', session: sessions[role], corps, type });
        noter(r.status < 500, ep.fichier + ' [' + role + '] charge « ' + libelle + ' » : pas d\'erreur serveur (' + r.status + ')');
        noter(!/Fatal error|Warning:|Notice:|Deprecated:|Stack trace|\.php on line|SQLSTATE/i.test(r.texte), ep.fichier + ' [' + role + '] « ' + libelle + ' » : aucune trace PHP/SQL dans la réponse');
        if (role === 'employe' && ROLE_MIN_ECRITURE[ep.nom]) {
          noter(!/"ok":true/.test(r.texte), ep.fichier + ' [employé] « ' + libelle + ' » : une écriture réservée n\'aboutit jamais pour un employé');
        }
        if (role === 'employe') {
          noter(!MOTS_COUT.test(r.texte), ep.fichier + ' [employé] « ' + libelle + ' » : aucun champ de coût dans la réponse');
        }
      }
      // appel GET « innocent » pour les lectures : jamais de coût pour l'employé
      if (ep.dossier === 'ajax' && role === 'employe') {
        const r = await appeler(url + '?q=a&code=P-0001&id=1&piece_id=1&emplacement_id=1', { methode: 'GET', session: sessions.employe });
        noter(r.status < 500 && !MOTS_COUT.test(r.texte), ep.fichier + ' [employé] GET : pas d\'erreur serveur ni de coût (' + r.status + ')');
      }
    }
  }

  // journal PHP : aucun avertissement produit par tout cela
  let nouveau = '';
  try { nouveau = fs.readFileSync(JOURNAL, 'utf8').slice(tailleJournal); } catch (e) { nouveau = ''; }
  const fautes = nouveau.split('\n').filter(l => /(PHP )?(Warning|Notice|Fatal|Deprecated|Parse error)|Uncaught|SQLSTATE/i.test(l));
  noter(fautes.length === 0, 'journal PHP propre après ' + endpoints.length + ' endpoints x charges malformées (' + fautes.length + ' ligne(s) fautive(s))' + (fautes.length ? ' : ' + fautes.slice(0, 5).join(' // ') : ''));

  // Intégrité : l'invariant du stock tient après toutes ces attaques
  const { execSync } = require('child_process');
  const DB = process.env.DB_NAME;
  if (DB) {
    const ecart = execSync('mysql -uroot -N ' + DB, { input: 'SELECT COUNT(*) FROM (SELECT s.piece_id FROM stock s LEFT JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m ON m.piece_id = s.piece_id AND m.emplacement_id = s.emplacement_id WHERE s.quantite <> COALESCE(m.q, 0)) t' }).toString().trim();
    noter(ecart === '0', 'invariant : stock = somme des mouvements après l\'audit (écarts : ' + ecart + ')');
    const neg = execSync('mysql -uroot -N ' + DB, { input: 'SELECT COUNT(*) FROM stock WHERE quantite < 0' }).toString().trim();
    noter(neg === '0', 'aucun stock négatif après l\'audit');
  }

  if (anomalies.length) {
    console.log('\n' + anomalies.length + ' anomalie(s) :');
    anomalies.slice(0, 60).forEach(a => console.log('  - ' + a));
  }
  process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
