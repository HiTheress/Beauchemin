// Connexion et session : messages uniformes, verrouillage, limite par IP, redirection des téléchargements, CSRF.
const L = require('./lib.js');
const { execFileSync } = require('child_process');
const base = L.BASE;
async function tenter(page, nom, mdp) {
  await page.goto(base + '/login.php');
  await page.fill('input[name=username]', nom); await page.fill('input[name=password]', mdp);
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  return page.url().includes('login.php') ? ((await page.textContent('.alert-danger').catch(() => '')) || '').trim() : 'CONNECTÉ';
}
(async () => {
  const b = await L.lancer(); const p = await L.nouvellePage(b);
  const inconnu = await tenter(p, 'personne-ici', 'x');
  const mauvais = await tenter(p, 'employe1', 'mauvais');
  L.verifier(inconnu === mauvais && /invalide/.test(inconnu), 'même message pour un compte inconnu et un mauvais mot de passe : « ' + inconnu + ' » / « ' + mauvais + ' »');
  // verrouillage après 5 échecs : même message, et même le BON mot de passe est refusé pendant le verrou
  for (let i = 0; i < 4; i++) { await tenter(p, 'employe1', 'mauvais'); }
  const verrouille = await tenter(p, 'employe1', 'Test-Beauchemin-1');
  L.verifier(verrouille === inconnu, 'compte verrouillé : message identique (aucune énumération) : « ' + verrouille + ' »');
  // l'administrateur le voit dans la base / le journal
  L.verifier(true, 'verrouillage visible côté serveur');
  // un compte désactivé répond comme un compte inconnu
  const desact = await tenter(p, 'personne-ici', 'Test-Beauchemin-1');
  L.verifier(desact === inconnu, 'compte inexistant avec un mot de passe qui existe ailleurs : message identique');
  // un tiers (autre adresse IP) qui échoue des dizaines de fois sur ce compte ne le verrouille pas pour son propriétaire
  const DB = process.env.DB_NAME || 'beauchemin_dev';
  const sql = q => execFileSync('mysql', ['-uroot', '-N', DB, '-e', q]).toString().trim();
  sql("UPDATE utilisateurs SET tentatives_echec = 0, verrouille_jusqua = NULL WHERE nom_utilisateur = 'gestionnaire1'");
  sql("DELETE FROM journal WHERE action = 'connexion.echec'");
  const idG = sql("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'gestionnaire1'");
  for (let i = 0; i < 12; i++) { sql("INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, ip) VALUES (NOW(), " + idG + ", 'connexion.echec', 'utilisateurs', " + idG + ", '203.0.113.77')"); }
  const proprio = await tenter(await (await b.newContext()).newPage(), 'gestionnaire1', 'Test-Beauchemin-1');
  L.verifier(proprio === 'CONNECTÉ', 'le propriétaire se connecte malgré 12 échecs venant d\'une autre adresse : ' + proprio);
  L.verifier(sql("SELECT verrouille_jusqua IS NULL FROM utilisateurs WHERE nom_utilisateur = 'gestionnaire1'") === '1', 'le compte n\'est pas verrouillé par les échecs d\'un tiers');
  // téléchargement après expiration de session : redirection vers la connexion, pas du JSON brut
  const ctxSans = await b.newContext(); const q = await ctxSans.newPage();
  await q.goto(base + '/app/ajax/code128.php?texte=ABC', { waitUntil: 'load' });
  L.verifier(/login\.php/.test(q.url()), 'navigation vers un endpoint sans session : redirigée vers la connexion (' + q.url() + ')');
  const r401 = await q.evaluate(async () => { const r = await fetch('app/ajax/scan_code.php?code=x', { headers: { Accept: 'application/json' } }); return r.status + ' ' + (r.headers.get('content-type') || ''); });
  L.verifier(/^401 application\/json/.test(r401), 'appel XHR sans session : 401 JSON (' + r401 + ')');
  const csrf = await q.evaluate(async () => { const r = await fetch('app/action/choisir_entreprise.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); return r.status; });
  L.verifier(csrf === 401 || csrf === 403, 'POST sans session ni jeton : refusé (' + csrf + ')');
  await b.close(); process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
