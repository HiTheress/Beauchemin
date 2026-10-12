// Mascotte : page de connexion (image, chargement), réservoir qui jette un coup d'œil sur les cases (dessin « Hamster Peek Animation »),
// popup de succès (coche verte) et d'échec (croix rouge). Les animations sont décoratives : elles ne doivent ni intercepter un clic,
// ni ajouter du texte aux messages (textContent intact), ni provoquer d'erreur JS.
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
  await p.hover('#champ-nom'); await p.waitForSelector('.mc-coup.visible'); await attendre(900);
  const surv = await p.evaluate(() => {
    const el = document.querySelector('.mc-coup'), c = el.getBoundingClientRect(), f = document.getElementById('champ-nom').getBoundingClientRect(), t = document.querySelector('.mc-pk').getBoundingClientRect();
    return { dessous: Math.abs(c.bottom - f.top), dansX: c.left >= f.left && c.right <= f.right + 1, centre: Math.abs((c.left + c.width / 2) - (f.left + f.width / 2)) <= 2, petit: c.width <= 64 && c.height <= 64, clics: getComputedStyle(el).pointerEvents, aria: el.getAttribute('aria-hidden'), texte: el.textContent, etat: el.getAttribute('data-etat'),
             sorti: t.top < f.top - 35 };   // le réservoir dépasse bien de derrière la case (au moins 35 px)
  });
  L.verifier(surv.dessous <= 3 && surv.dansX && surv.centre && surv.petit && surv.clics === 'none' && surv.aria === 'true' && surv.texte === '' && !surv.etat && surv.sorti, 'survol d\'une case : le réservoir (petit) sort de derrière le bord supérieur, au milieu de la case, sans clic ni texte : ' + JSON.stringify(surv));
  await p.mouse.move(5, 5); await attendre(300);
  L.verifier(!(await p.$('.mc-coup.visible')), 'quand le curseur quitte la case, le réservoir se cache');
  await p.hover('#champ-mdp'); await p.waitForSelector('.mc-coup.visible');
  L.verifier(await p.evaluate(() => Math.abs(document.querySelector('.mc-coup').getBoundingClientRect().bottom - document.getElementById('champ-mdp').getBoundingClientRect().top) <= 3), 'il passe d\'une case à l\'autre');

  await p.fill('#champ-nom', 'employe1'); await p.fill('#champ-mdp', 'mauvais');
  await Promise.all([p.waitForNavigation(), p.click('#bouton-connexion')]);
  await p.waitForSelector('#retour.mc-retour-echec', { timeout: 3000 });
  const echecCnx = await p.evaluate(() => ({ croix: document.querySelectorAll('#retour .mc-retour-trait').length, tank: !!document.querySelector('#retour .mc-echec .mc-tank'), msg: document.querySelector('.alert-danger').textContent, clics: getComputedStyle(document.getElementById('retour')).pointerEvents }));
  L.verifier(echecCnx.croix === 2 && echecCnx.tank && /invalide/.test(echecCnx.msg) && echecCnx.clics === 'none', 'connexion refusée : popup « Oups ! » avec croix rouge et réservoir aux yeux en croix, message de l\'alerte inchangé : ' + JSON.stringify(echecCnx));

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
  L.verifier(await g.evaluate(() => { const c = document.querySelector('.mc-coup').getBoundingClientRect(), f = document.getElementById('f-nom').getBoundingClientRect(); return Math.abs(c.bottom - f.top) <= 3 && Math.abs((c.left + c.width / 2) - (f.left + f.width / 2)) <= 2; }), 'formulaire : le réservoir jette un coup d\'œil au milieu de la case survolée');
  // case refusée : yeux en croix, réservoir secoué, puis il s'en va tout seul
  await g.evaluate(() => document.getElementById('f-nom').classList.add('is-invalid'));
  await g.waitForFunction(() => document.querySelector('.mc-coup').getAttribute('data-etat') === 'erreur', null, { timeout: 2000 });
  await attendre(400);                                      // fin du fondu entre les yeux et les croix
  const croix = await g.evaluate(() => ({ visage: getComputedStyle(document.querySelector('.mc-pk-visage')).opacity, yeux: getComputedStyle(document.querySelector('.mc-pk-yeux')).opacity }));
  L.verifier(croix.visage === '1' && croix.yeux === '0', 'case refusée : le réservoir a les yeux en croix : ' + JSON.stringify(croix));
  await g.mouse.move(900, 700);
  await g.waitForFunction(() => !document.querySelector('.mc-coup').classList.contains('visible'), null, { timeout: 5000 });
  L.verifier(true, 'case refusée : le réservoir se retire tout seul');
  await g.evaluate(() => document.getElementById('f-nom').classList.remove('is-invalid'));
  // la barre du haut est exclue (le réservoir sortirait de l'écran)
  await g.hover('.main-header select'); await attendre(250);
  L.verifier(!(await g.$('.mc-coup.visible')), 'les cases de la barre du haut n\'ont pas de réservoir');
  await g.mouse.move(900, 700); await attendre(250);

  // succès : coche verte, réservoir content ; le message reste dans la notification ; aucun clic intercepté
  await g.evaluate(() => window.toast('Pièce « P-9999 » enregistrée.', 'success'));
  await g.waitForSelector('#retour');
  const succes = await g.evaluate(() => {
    const r = document.getElementById('retour'), c = r.getBoundingClientRect();
    const sous = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
    return { content: !!r.querySelector('.mc-content'), coche: r.querySelectorAll('.mc-retour-trait').length === 1, aria: r.getAttribute('aria-hidden'), clics: getComputedStyle(r).pointerEvents, traverse: !r.contains(sous), toast: document.getElementById('toasts').textContent.trim() };
  });
  L.verifier(succes.content && succes.coche && succes.aria === 'true' && succes.clics === 'none' && succes.traverse, 'succès : popup avec coche et réservoir content, aria-hidden, les clics le traversent : ' + JSON.stringify(succes));
  L.verifier(succes.toast === 'Pièce « P-9999 » enregistrée.' || succes.toast === '×Pièce « P-9999 » enregistrée.', 'succès : le texte de la notification est inchangé (aucun mot ajouté par la mascotte) : « ' + succes.toast + ' »');
  await g.waitForFunction(() => !document.getElementById('retour'), null, { timeout: 4000 });
  L.verifier(true, 'succès : le popup disparaît tout seul');

  // échec : même carte, croix rouge tracée, réservoir aux yeux en croix secoué, étoiles ; une seule notification, texte inchangé
  await g.evaluate(() => { document.querySelectorAll('#toasts .alert').forEach(e => e.remove()); window.toast('Impossible d\'enregistrer.', 'danger'); });
  await g.waitForSelector('#retour.mc-retour-echec');
  const echec = await g.evaluate(() => {
    const r = document.getElementById('retour'), c = r.getBoundingClientRect();
    const sous = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
    return { n: document.querySelectorAll('#toasts .alert').length, croix: r.querySelectorAll('.mc-retour-trait').length, tank: !!r.querySelector('.mc-echec .mc-tank'), etoiles: r.querySelectorAll('.mc-etoile').length,
             titre: r.querySelector('.mc-retour-titre').textContent, aria: r.getAttribute('aria-hidden'), clics: getComputedStyle(r).pointerEvents, traverse: !r.contains(sous), texte: document.querySelector('#toasts .alert-danger').textContent,
             dansToast: !!document.querySelector('#toasts .mc-coup, #toasts .mc-retour, #toasts svg') };
  });
  L.verifier(echec.n === 1 && echec.croix === 2 && echec.tank && echec.etoiles === 3 && echec.titre === 'Oups !' && echec.aria === 'true' && echec.clics === 'none' && echec.traverse && echec.texte === '×Impossible d\'enregistrer.' && !echec.dansToast, 'échec : popup « Oups ! » (croix rouge, réservoir aux yeux en croix, étoiles), clics traversants, notification inchangée : ' + JSON.stringify(echec));
  // plusieurs échecs de suite (scans) : une seule animation à la fois
  const avant = await g.evaluate(() => { const r = document.getElementById('retour'); r.setAttribute('data-essai', '1'); window.toast('Autre erreur.', 'danger'); return !!document.querySelector('#retour[data-essai="1"]'); });
  L.verifier(avant, 'échecs rapprochés : l\'animation en cours n\'est pas relancée à chaque message');
  await g.waitForFunction(() => !document.getElementById('retour'), null, { timeout: 4000 });
  L.verifier(true, 'échec : le popup disparaît tout seul');

  // messages affichés par la page elle-même (après redirection) ou par un script : mêmes animations
  await g.evaluate(() => document.querySelector('.content-wrapper').insertAdjacentHTML('afterbegin', '<div class="alert alert-success" id="essai-ok" role="status">Fait.</div>'));
  await g.waitForSelector('#retour:not(.mc-retour-echec)', { timeout: 3000 });
  L.verifier(true, 'un message de succès ajouté à la page déclenche aussi la coche');
  await g.waitForFunction(() => !document.getElementById('retour'), null, { timeout: 4000 });
  await attendre(2600);                                    // fin de la pause entre deux animations d'échec
  await g.evaluate(() => document.querySelector('.content-wrapper').insertAdjacentHTML('afterbegin', '<div class="alert alert-danger" id="essai-ko" role="alert" hidden>Oups.</div>'));
  await attendre(300);
  L.verifier(!(await g.$('#retour')), 'une alerte cachée ne déclenche rien');
  await g.evaluate(() => { document.getElementById('essai-ko').hidden = false; });
  await g.waitForSelector('#retour.mc-retour-echec', { timeout: 3000 });
  L.verifier((await g.textContent('#essai-ko')) === 'Oups.', 'une alerte d\'échec qui devient visible déclenche la croix, sans changer son textContent (pas même un espace)');
  await g.waitForFunction(() => !document.getElementById('retour'), null, { timeout: 4000 });
  await attendre(2600);

  // mouvement réduit : pas de confettis ni d'étoiles, le signe reste tracé d'emblée
  await g.emulateMedia({ reducedMotion: 'reduce' });
  await g.evaluate(() => window.toast('Fait.', 'success')); await g.waitForSelector('#retour');
  const reduit = await g.evaluate(() => ({ conf: getComputedStyle(document.querySelector('.mc-conf')).display, trace: getComputedStyle(document.querySelector('.mc-retour-trait')).strokeDashoffset }));
  L.verifier(reduit.conf === 'none' && parseFloat(reduit.trace) === 0, 'mouvement réduit : pas de confettis, coche tracée d\'emblée : ' + JSON.stringify(reduit));
  await g.emulateMedia({ reducedMotion: 'no-preference' });

  // impression : aucune décoration
  await g.evaluate(() => window.toast('Fait.', 'success')); await g.waitForSelector('#retour');
  await g.emulateMedia({ media: 'print' });
  L.verifier(await g.evaluate(() => getComputedStyle(document.getElementById('retour')).display === 'none'), 'impression : le popup n\'apparaît pas sur la feuille');
  L.verifier(g.erreurs.length === 0, 'aucune erreur JavaScript ni requête échouée dans l\'application : ' + JSON.stringify(g.erreurs));

  await b.close(); process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
