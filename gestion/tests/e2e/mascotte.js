// Mascotte : page de connexion (image, chargement), réservoir qui jette un coup d'œil sur les cases, coche de succès, échec.
// Les animations sont décoratives : elles ne doivent ni intercepter un clic, ni ajouter du texte aux messages, ni provoquer d'erreur JS.
const L = require('./lib.js');
const base = L.BASE;
const attendre = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await L.lancer();

  // ---- Connexion : image, aucun débordement, réservoir au survol, échec, chargement ------------------------------
  const p = await L.nouvellePage(b, { width: 1366, height: 800 });
  await p.goto(base + '/login.php');
  const img = await p.$eval('.connexion-image img', i => ({ ok: i.complete && i.naturalWidth === 1254, w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height, alt: i.alt }));
  L.verifier(img.ok && Math.abs(img.w - img.h) < 2 && img.w > 400 && /Beauchemin/.test(img.alt) && /Boutique Chaleur/.test(img.alt), 'connexion : l\'image Beauchemin | Boutique Chaleur est chargée, carrée, avec un texte alternatif : ' + JSON.stringify(img));
  await p.hover('#champ-nom'); await p.waitForSelector('.mc-coup.visible');
  const surv = await p.evaluate(() => {
    const c = document.querySelector('.mc-coup').getBoundingClientRect(), f = document.getElementById('champ-nom').getBoundingClientRect();
    return { dessous: Math.abs(c.bottom - f.top), dansX: c.left >= f.left && c.right <= f.right + 1, clics: getComputedStyle(document.querySelector('.mc-coup')).pointerEvents, aria: document.querySelector('.mc-coup').getAttribute('aria-hidden'), texte: document.querySelector('.mc-coup').textContent.trim() };
  });
  L.verifier(surv.dessous <= 3 && surv.dansX && surv.clics === 'none' && surv.aria === 'true' && surv.texte === '', 'survol d\'une case : le réservoir sort du bord supérieur, dans le coin, sans clic ni texte : ' + JSON.stringify(surv));
  await p.mouse.move(5, 5); await attendre(200);
  L.verifier(!(await p.$('.mc-coup.visible')), 'quand le curseur quitte la case, le réservoir se cache');
  await p.hover('#champ-mdp'); await p.waitForSelector('.mc-coup.visible');
  L.verifier(await p.evaluate(() => Math.abs(document.querySelector('.mc-coup').getBoundingClientRect().bottom - document.getElementById('champ-mdp').getBoundingClientRect().top) <= 3), 'il passe d\'une case à l\'autre');

  await p.fill('#champ-nom', 'employe1'); await p.fill('#champ-mdp', 'mauvais');
  await Promise.all([p.waitForNavigation(), p.click('#bouton-connexion')]);
  const echecCnx = await p.evaluate(() => ({ coin: !!document.querySelector('.connexion-coin .mc-echec'), msg: document.querySelector('.alert-danger').textContent.trim(), dansAlerte: !!document.querySelector('.alert-danger .mc-coin') }));
  L.verifier(echecCnx.coin && !echecCnx.dansAlerte && /invalide/.test(echecCnx.msg) && !/PROPANE/.test(echecCnx.msg), 'connexion refusée : réservoir aux yeux en croix sur la carte, message inchangé : ' + JSON.stringify(echecCnx));

  // chargement : réponse lente du serveur (204 : la page reste là) → la mascotte apparaît, le bouton annonce « Connexion… »
  await p.fill('#champ-nom', 'employe1'); await p.fill('#champ-mdp', 'Test-Beauchemin-1');
  await p.route('**/app/action/login.php', async r => { await attendre(2500); await r.fulfill({ status: 204 }).catch(() => {}); });
  await p.click('#bouton-connexion', { noWaitAfter: true }); await attendre(700);
  const chg = await p.evaluate(() => ({ voile: getComputedStyle(document.getElementById('chargement')).display, bouton: document.getElementById('bouton-connexion').textContent, tank: !!document.querySelector('#chargement .mc-tank') }));
  L.verifier(chg.voile === 'flex' && chg.tank && /Connexion…/.test(chg.bouton), 'connexion lente : le réservoir qui rebondit apparaît : ' + JSON.stringify(chg));
  await p.unroute('**/app/action/login.php');

  // téléphone : pas de défilement horizontal, l'image reste entière
  const t = await L.nouvellePage(b, { width: 390, height: 844 });
  await t.goto(base + '/login.php');
  const tel = await t.evaluate(() => ({ debord: document.documentElement.scrollWidth > innerWidth + 1, img: document.querySelector('.connexion-image img').getBoundingClientRect().width, bouton: document.getElementById('bouton-connexion').getBoundingClientRect().bottom <= innerHeight }));
  L.verifier(!tel.debord && tel.img > 300 && tel.bouton, 'téléphone : aucun défilement horizontal, image et bouton visibles sans défiler : ' + JSON.stringify(tel));
  // (la requête de connexion annulée par notre réponse 204 simulée n'est pas une erreur)
  const erreursCnx = p.erreurs.concat(t.erreurs).filter(e => !/app\/action\/login\.php/.test(e));
  L.verifier(erreursCnx.length === 0, 'aucune erreur JavaScript ni requête échouée sur la connexion : ' + JSON.stringify(erreursCnx));

  // ---- Dans l'application ------------------------------------------------------------------------------------------
  const g = await L.nouvellePage(b, { width: 1366, height: 800 });
  await L.connecter(g, 'gestionnaire');
  await L.aller(g, 'piece_edit');
  await g.hover('#f-nom'); await g.waitForSelector('.mc-coup.visible');
  L.verifier(await g.evaluate(() => { const c = document.querySelector('.mc-coup').getBoundingClientRect(), f = document.getElementById('f-nom').getBoundingClientRect(); return Math.abs(c.bottom - f.top) <= 3 && c.right <= f.right + 1; }), 'formulaire : le réservoir jette un coup d\'œil au coin de la case survolée');
  // la barre du haut est exclue (le réservoir sortirait de l'écran)
  await g.hover('.main-header select'); await attendre(200);
  L.verifier(!(await g.$('.mc-coup.visible')), 'les cases de la barre du haut n\'ont pas de réservoir');
  await g.mouse.move(900, 700); await attendre(200);

  // succès : coche verte, réservoir content ; le message reste dans la notification ; aucun clic intercepté
  await g.evaluate(() => window.toast('Pièce « P-9999 » enregistrée.', 'success'));
  await g.waitForSelector('#retour');
  const succes = await g.evaluate(() => {
    const r = document.getElementById('retour'), c = r.getBoundingClientRect();
    const sous = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
    return { content: !!r.querySelector('.mc-content'), coche: !!r.querySelector('.mc-retour-coche'), aria: r.getAttribute('aria-hidden'), clics: getComputedStyle(r).pointerEvents, traverse: !r.contains(sous), toast: document.getElementById('toasts').textContent.trim() };
  });
  L.verifier(succes.content && succes.coche && succes.aria === 'true' && succes.clics === 'none' && succes.traverse, 'succès : popup avec coche et réservoir content, aria-hidden, les clics le traversent : ' + JSON.stringify(succes));
  L.verifier(succes.toast === 'Pièce « P-9999 » enregistrée.' || succes.toast === '×Pièce « P-9999 » enregistrée.', 'succès : le texte de la notification est inchangé (aucun mot ajouté par la mascotte) : « ' + succes.toast + ' »');
  await g.waitForFunction(() => !document.getElementById('retour'), null, { timeout: 4000 });
  L.verifier(true, 'succès : le popup disparaît tout seul');

  // échec : réservoir aux yeux en croix sur le bord de la notification, une seule notification, texte inchangé
  await g.evaluate(() => { document.querySelectorAll('#toasts .alert').forEach(e => e.remove()); window.toast('Impossible d\'enregistrer.', 'danger'); });
  await attendre(300);
  const echec = await g.evaluate(() => ({ n: document.querySelectorAll('#toasts .alert').length, coin: !!document.querySelector('#toasts .alert-danger > .mc-coin .mc-echec'), texte: document.querySelector('#toasts .alert-danger').textContent.replace('×', '').trim(), aria: document.querySelector('.mc-coin').getAttribute('aria-hidden') }));
  L.verifier(echec.n === 1 && echec.coin && echec.texte === 'Impossible d\'enregistrer.' && echec.aria === 'true', 'échec : réservoir aux yeux en croix sur la notification, texte inchangé : ' + JSON.stringify(echec));

  // messages affichés par la page elle-même (après redirection) ou par un script : mêmes animations
  await g.evaluate(() => document.querySelector('.content-wrapper').insertAdjacentHTML('afterbegin', '<div class="alert alert-success" id="essai-ok" role="status">Fait.</div>'));
  await g.waitForSelector('#retour', { timeout: 3000 });
  L.verifier(true, 'un message de succès ajouté à la page déclenche aussi la coche');
  await g.evaluate(() => document.querySelector('.content-wrapper').insertAdjacentHTML('afterbegin', '<div class="alert alert-danger" id="essai-ko" role="alert" hidden>Oups.</div>'));
  await attendre(200);
  L.verifier(!(await g.$('#essai-ko > .mc-coin')), 'une alerte cachée n\'a pas de réservoir');
  await g.evaluate(() => { document.getElementById('essai-ko').hidden = false; });
  await g.waitForSelector('#essai-ko > .mc-coin', { timeout: 3000 });
  L.verifier((await g.textContent('#essai-ko')).trim() === 'Oups.', 'une alerte d\'échec qui devient visible reçoit le réservoir, sans changer son texte');

  // mouvement réduit : pas de confettis, la coche reste visible
  await g.emulateMedia({ reducedMotion: 'reduce' });
  await g.evaluate(() => window.toast('Fait.', 'success')); await g.waitForSelector('#retour');
  const reduit = await g.evaluate(() => ({ conf: getComputedStyle(document.querySelector('.mc-conf')).display, trace: getComputedStyle(document.querySelector('.mc-retour-coche')).strokeDashoffset }));
  L.verifier(reduit.conf === 'none' && parseFloat(reduit.trace) === 0, 'mouvement réduit : pas de confettis, coche tracée d\'emblée : ' + JSON.stringify(reduit));
  await g.emulateMedia({ reducedMotion: 'no-preference' });

  // impression : aucune décoration
  await g.evaluate(() => window.toast('Fait.', 'success')); await g.waitForSelector('#retour');
  await g.emulateMedia({ media: 'print' });
  L.verifier(await g.evaluate(() => getComputedStyle(document.getElementById('retour')).display === 'none'), 'impression : le popup n\'apparaît pas sur la feuille');
  L.verifier(g.erreurs.length === 0, 'aucune erreur JavaScript ni requête échouée dans l\'application : ' + JSON.stringify(g.erreurs));

  await b.close(); process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
