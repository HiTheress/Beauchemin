const L = require('./lib.js');
(async () => {
  const b = await L.lancer(); const p = await L.nouvellePage(b);
  await L.connecter(p, 'gestionnaire'); await L.aller(p, '_essai_lignes');
  await L.scanner(p, '#scan', 'P-0001'); await p.waitForTimeout(300);
  await L.scanner(p, '#scan', '012345678905'); await p.waitForTimeout(300);   // alias du même produit -> +1
  await L.scanner(p, '#scan', 'p-0003'); await p.waitForTimeout(300);
  let rows = await p.$$eval('#lignes tbody tr', r => r.map(x => [...x.querySelectorAll('td')].map(t => t.querySelector('input') ? t.querySelector('input').value : t.textContent.trim())));
  console.log(JSON.stringify(rows));
  L.verifier(rows.length === 2, '2 lignes (même pièce par alias = incrémentée)');
  L.verifier(rows[0][3] === '2', 'quantité 2 après deux scans');
  L.verifier(rows[0][2] === '8' , 'disponible 8 à l\'entrepôt : ' + rows[0][2]);
  L.verifier(rows[0][4] === '10,50', 'coût par défaut');
  await L.scanner(p, '#scan', 'INCONNU'); await p.waitForTimeout(400);
  L.verifier((await p.textContent('#toasts')).includes('Code inconnu'), 'message code inconnu');
  await L.scanner(p, '#scan', 'EMP-000003'); await p.waitForTimeout(300);
  L.verifier(await p.$eval('#src', e => e.value) === '3', 'scan d\'un emplacement change la source');
  await p.fill('#lignes tbody tr:nth-child(1) input >> nth=0', '0'); 
  L.verifier((await p.textContent('#sortie')).includes('supérieure à zéro'), 'validation quantité zéro');
  await p.fill('#lignes tbody tr:nth-child(1) input >> nth=0', '1,5');
  await p.fill('#lignes tbody tr:nth-child(1) input >> nth=1', '2');
  const tot = await p.$eval('#lignes tbody tr:nth-child(1) td:nth-child(6)', e => e.textContent);
  L.verifier(/3,00/.test(tot), 'total ligne 1,5 x 2 = 3,00 : ' + tot);
  // recherche select2
  await p.click('.select2-selection'); await p.waitForSelector('.select2-search__field'); await p.fill('.select2-search__field', 'gicl'); await p.waitForSelector('.select2-results__option:has-text("P-0003")'); await p.click('.select2-results__option:has-text("P-0003")'); await p.waitForTimeout(500);
  L.verifier((await p.$$('#lignes tbody tr')).length === 2, 'recherche ajoute/incrémente (P-0003 déjà là)');
  await p.click('#lignes tbody tr:nth-child(1) button'); 
  L.verifier((await p.$$('#lignes tbody tr')).length === 1, 'retrait d\'une ligne');
  // rafale : 40 scans envoyés dans le même instant (sans attendre) — aucun ne doit être perdu
  await p.evaluate(() => { document.querySelector('#lignes').dispatchEvent(new Event('x')); });
  await p.click('#lignes tbody tr:nth-child(1) button').catch(() => {});
  await p.evaluate(() => {
    const el = document.querySelector('#scan');
    for (let i = 0; i < 40; i++) { el.value = (i % 2 ? 'P-0001' : '012345678905'); el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); }
  });
  await p.waitForFunction(() => document.querySelector('#scan').getAttribute('data-attente') === '0', null, { timeout: 15000 });
  const qs = await p.$$eval('#lignes tbody tr', r => r.map(x => [x.querySelector('td').textContent, x.querySelector('td:nth-child(4) input').value]));
  const q1 = qs.filter(r => r[0] === 'P-0001').map(r => parseFloat(r[1].replace(',', '.')))[0];
  L.verifier(q1 === 40, 'rafale de 40 scans : 40 unités comptées (file d\'attente, aucune perte) — obtenu ' + q1);
  L.verifier(await p.$$eval('#lignes input.is-invalid', e => e.length) === 0, 'aucune quantité valide marquée invalide');
  L.verifier(p.erreurs.length === 0, 'aucune erreur console : ' + JSON.stringify(p.erreurs));
  await p.screenshot({ path: '/tmp/composant-lignes.png' });
  await b.close(); process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
