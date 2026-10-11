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
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Retirer"]');
  L.verifier((await p.$$('#lignes tbody tr')).length === 1, 'retrait d\'une ligne');
  L.verifier((await p.$$('#lignes tbody tr:nth-child(1) .mv-pas')).length === 0, 'sans l\'option stepper : pas de boutons − / + (comportement d\'origine conservé pour la facture interne)');
  // rafale : 40 scans envoyés dans le même instant (sans attendre) — aucun ne doit être perdu
  await p.evaluate(() => { document.querySelector('#lignes').dispatchEvent(new Event('x')); });
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Retirer"]').catch(() => {});
  await p.evaluate(() => {
    const el = document.querySelector('#scan');
    for (let i = 0; i < 40; i++) { el.value = (i % 2 ? 'P-0001' : '012345678905'); el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); }
  });
  await p.waitForFunction(() => document.querySelector('#scan').getAttribute('data-attente') === '0', null, { timeout: 15000 });
  const qs = await p.$$eval('#lignes tbody tr', r => r.map(x => [x.querySelector('td').textContent, x.querySelector('td:nth-child(4) input').value]));
  const q1 = qs.filter(r => r[0] === 'P-0001').map(r => parseFloat(r[1].replace(',', '.')))[0];
  L.verifier(q1 === 40, 'rafale de 40 scans : 40 unités comptées (file d\'attente, aucune perte) — obtenu ' + q1);
  // le lecteur « tape » dans l'élément qui a le focus : une liste déroulante ne doit pas avaler le code
  const srcAvant = await p.$eval('#src', e => e.value);
  await p.focus('#src'); await p.keyboard.type('P-0003'); await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('#scan').getAttribute('data-attente') === '0', null, { timeout: 8000 });
  L.verifier(await p.$eval('#src', e => e.value) === srcAvant, 'la liste déroulante focalisée n\'a pas changé de valeur sous la frappe du lecteur');
  L.verifier((await p.$$eval('#lignes tbody tr td.code', e => e.map(x => x.textContent))).includes('P-0003'), 'le code scanné depuis une liste déroulante est quand même pris en compte');
  // case à cocher qui garde le focus (ex. « Facturer à 0 $ ») : le code du lecteur doit quand même atteindre le champ de scan
  const avantQ = await p.$$eval('#lignes tbody tr', r => { const x = r.find(t => t.querySelector('td').textContent === 'P-0003'); return x ? parseFloat(x.querySelector('td:nth-child(4) input').value.replace(',', '.')) : 0; });
  await p.evaluate(() => { const c = document.createElement('input'); c.type = 'checkbox'; c.id = 'cb-essai'; document.querySelector('#lignes').parentElement.appendChild(c); });
  await p.click('#cb-essai'); await p.keyboard.type('P-0003'); await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('#scan').getAttribute('data-attente') === '0', null, { timeout: 8000 });
  const apresQ = await p.$$eval('#lignes tbody tr', r => { const x = r.find(t => t.querySelector('td').textContent === 'P-0003'); return x ? parseFloat(x.querySelector('td:nth-child(4) input').value.replace(',', '.')) : 0; });
  L.verifier(apresQ === avantQ + 1 && await p.$eval('#cb-essai', e => e.checked) === true, 'frappe tombée sur une case à cocher : code pris en compte (' + avantQ + ' -> ' + apresQ + ') sans modifier la case');
  // erreur de chargement d'un tableau : message français, jamais le texte technique de DataTables
  await p.evaluate(() => { const t = document.createElement('table'); t.id = 'tt'; t.innerHTML = '<thead><tr><th>a</th></tr></thead>'; document.body.appendChild(t); $(t).DataTable({ serverSide: true, ajax: 'app/ajax/inexistant_zz.php', columns: [{ data: 'a' }] }); });
  await p.waitForSelector('#toasts .alert-danger', { timeout: 8000 });
  const txt = await p.textContent('#toasts');
  L.verifier(/Impossible de charger le tableau/.test(txt) && !/DataTables|datatables\.net/i.test(txt), 'erreur de tableau en français : ' + txt.trim().slice(0, 80));
  L.verifier(await p.$$eval('#lignes input.is-invalid', e => e.length) === 0, 'aucune quantité valide marquée invalide');
  const vraies = p.erreurs.filter(e => !/404/.test(e));   // le 404 vient de notre faux tableau d'essai
  L.verifier(vraies.length === 0, 'aucune erreur console : ' + JSON.stringify(vraies));
  await p.screenshot({ path: '/tmp/composant-lignes.png' });

  // ====== Mode « fusion » : un seul champ qui scanne ET cherche, boutons − / + ======
  await L.aller(p, '_essai_lignes&mode=fusion');
  L.verifier(await p.$eval('#scan', e => e.getAttribute('inputmode')) === 'none' && (await p.$$('.select2-container')).length === 0, 'fusion : champ de scan sans clavier à l\'écran, aucun select2');
  await L.scanner(p, '#scan', 'P-0001'); await p.waitForFunction(() => document.querySelectorAll('#lignes tbody tr').length === 1);
  const qte = () => p.$eval('#lignes tbody tr:nth-child(1) input', e => e.value);
  L.verifier(await qte() === '1' && await p.$eval('#lignes tbody tr:nth-child(1) button[aria-label^="Diminuer"]', b => b.disabled), 'fusion : quantité 1, le bouton − est désactivé (pas de quantité sous 1)');
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Augmenter"]');
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Augmenter"]');
  L.verifier(await qte() === '3' && !(await p.$eval('#lignes tbody tr:nth-child(1) button[aria-label^="Diminuer"]', b => b.disabled)), 'fusion : + + = 3, le bouton − est actif');
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Diminuer"]');
  L.verifier(await qte() === '2' && /"quantite":"2"/.test(await p.textContent('#sortie')), 'fusion : − = 2, le composant relit la valeur : ' + await p.textContent('#sortie'));
  await p.fill('#lignes tbody tr:nth-child(1) input', '1,5');
  await p.click('#lignes tbody tr:nth-child(1) button[aria-label^="Augmenter"]');
  L.verifier(await qte() === '2,5', 'fusion : 1,5 + 1 = 2,5 (virgule conservée) : ' + await qte());
  const hBtn = await p.$$eval('#lignes tbody tr:nth-child(1) .mv-pas button', b => b.map(x => Math.round(x.getBoundingClientRect().height)));
  L.verifier(hBtn.length === 2 && hBtn.every(h => h >= 44), 'fusion : boutons − / + ≥ 44 px (' + hBtn.join(',') + ')');
  // recherche dans le champ de scan : liste de suggestions, clic pour choisir
  await p.fill('#scan', 'gicl');
  await p.waitForSelector('#scan-suggestions:not([hidden]) li:has-text("P-0003")');
  L.verifier(await p.$eval('#scan', e => e.getAttribute('aria-expanded')) === 'true' && await p.$eval('#scan', e => e.getAttribute('role')) === 'combobox', 'fusion : « gicl » ouvre la liste des pièces (combobox accessible)');
  await p.click('#scan-suggestions li:has-text("P-0003")');
  await p.waitForFunction(() => document.querySelectorAll('#lignes tbody tr').length === 2);
  L.verifier(await p.$eval('#scan', e => e.value) === '' && await p.evaluate(() => document.activeElement.id) === 'scan' && await p.$eval('#scan-suggestions', e => e.hidden), 'fusion : choisir une suggestion ajoute la ligne, vide le champ, le garde actif et ferme la liste');
  // flèches + Entrée
  await p.fill('#scan', 'gicl');
  await p.waitForSelector('#scan-suggestions:not([hidden]) li');
  await p.press('#scan', 'ArrowDown');
  L.verifier(await p.$eval('#scan', e => e.getAttribute('aria-activedescendant')) !== null && await p.$eval('#scan-suggestions li[aria-selected="true"]', e => /P-0003/.test(e.textContent)), 'fusion : flèche bas = première suggestion active');
  await p.press('#scan', 'Enter');
  await p.waitForFunction(() => document.querySelector('#lignes tbody tr:nth-child(2) input').value === '2');
  L.verifier(true, 'fusion : flèche + Entrée choisit la suggestion (P-0003 passe à 2)');
  // Entrée sur un nom (pas un code) : la liste s'affiche, rien n'est ajouté, aucune erreur
  await p.evaluate(() => { document.getElementById('toasts') && document.getElementById('toasts').remove(); });
  await p.fill('#scan', 'gicl'); await p.press('#scan', 'Enter');
  await p.waitForSelector('#scan-suggestions:not([hidden]) li:has-text("P-0003")');
  L.verifier((await p.$$('#lignes tbody tr')).length === 2 && !((await p.textContent('#toasts').catch(() => '')) || '').includes('Code inconnu'), 'fusion : Entrée sur un nom affiche la liste (aucune pièce ajoutée au hasard, pas de « Code inconnu »)');
  await p.fill('#scan', 'gicl'); await p.waitForSelector('#scan-suggestions:not([hidden])'); await p.press('#scan', 'Escape');
  L.verifier(await p.$eval('#scan-suggestions', e => e.hidden), 'fusion : Échap ferme la liste');
  // texte inconnu : message d'erreur
  await L.scanner(p, '#scan', 'zzzzqq'); await p.waitForSelector('#toasts .alert-danger:has-text("Code inconnu")');
  L.verifier(await p.$eval('#scan-suggestions', e => e.hidden), 'fusion : texte qui ne correspond à rien : « Code inconnu », liste fermée');
  // un code exact reste prioritaire (scanner) : pas de liste, ligne incrémentée
  await L.scanner(p, '#scan', 'P-0001'); await p.waitForFunction(() => document.querySelector('#lignes tbody tr:nth-child(1) input').value === '3,5');
  L.verifier(await p.$eval('#scan-suggestions', e => e.hidden), 'fusion : un code exact est ajouté directement (scanner), sans liste');
  // clavier à l'écran : un toucher dans le champ l'autorise, le retour au scanner le coupe de nouveau
  await p.click('#scan');
  L.verifier(await p.$eval('#scan', e => e.getAttribute('inputmode')) === 'search', 'fusion : un toucher dans le champ ouvre le clavier (inputmode=search)');
  await p.fill('#scan', 'gicl'); await p.waitForSelector('#scan-suggestions:not([hidden]) li'); await p.click('#scan-suggestions li >> nth=0');
  await p.waitForFunction(() => document.querySelector('#scan').getAttribute('inputmode') === 'none', null, { timeout: 5000 }).catch(() => {});
  L.verifier(await p.$eval('#scan', e => e.getAttribute('inputmode')) === 'none', 'fusion : après le choix, retour au mode scanner (inputmode=none)');
  const vraies2 = p.erreurs.filter(e => !/404/.test(e));
  L.verifier(vraies2.length === 0, 'fusion : aucune erreur console : ' + JSON.stringify(vraies2));
  await p.screenshot({ path: '/tmp/composant-lignes-fusion.png' });

  await b.close(); process.exit(L.bilan());
})().catch(e => { console.error(e); process.exit(1); });
