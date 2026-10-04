// Aide commune pour les tests de bout en bout (Playwright + Chromium).
//   NODE_PATH=$(npm root -g) BASE_URL=http://127.0.0.1:8081 node tests/e2e/mon-test.js
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const COMPTES = {
  admin: ['admin', 'Test-Beauchemin-1'],
  gestionnaire: ['gestionnaire1', 'Test-Beauchemin-1'],   // entreprises 1 et 2
  employe: ['employe1', 'Test-Beauchemin-1'],             // entreprise 1 seulement
};

async function lancer() {
  const opts = { args: ['--no-sandbox'] };
  try { return await chromium.launch(opts); }
  catch (e) { return chromium.launch({ ...opts, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
}

/** Ouvre une page et collecte erreurs JS, erreurs console et requêtes échouées (favicon ignoré). */
async function nouvellePage(browser, viewport) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.erreurs = [];
  page.on('pageerror', e => page.erreurs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) page.erreurs.push('console: ' + m.text()); });
  page.on('requestfailed', r => { if (!/favicon/.test(r.url())) page.erreurs.push('requestfailed: ' + r.url()); });
  return page;
}

async function connecter(page, role) {
  const [u, p] = COMPTES[role || 'admin'];
  await page.goto(BASE + '/login.php');
  await page.fill('input[name=username]', u);
  await page.fill('input[name=password]', p);
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  if (/login\.php/.test(page.url())) throw new Error('Connexion refusée pour ' + u);
}

async function aller(page, route) { await page.goto(BASE + '/index.php?page=' + route); await page.waitForLoadState('networkidle'); }

/** Simule un lecteur de codes-barres : tape le code puis Entrée. */
async function scanner(page, selecteur, code) { await page.fill(selecteur, code); await page.press(selecteur, 'Enter'); }

let ok = 0, ko = 0;
function verifier(cond, msg) { if (cond) { ok++; } else { ko++; console.log('  ÉCHEC : ' + msg); } }
function bilan() { console.log((ko ? 'ÉCHECS' : 'OK') + ' — ' + ok + ' vérifications réussies, ' + ko + ' échec(s)'); return ko === 0 ? 0 : 1; }

module.exports = { BASE, lancer, nouvellePage, connecter, aller, scanner, verifier, bilan };
