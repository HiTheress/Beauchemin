/* Mascotte : le réservoir de propane
 *  - jette un coup d'œil par le coin d'une case quand on la survole (dessin et mouvement du projet « Hamster Peek Animation » du client) ;
 *    sur une case en erreur il fait les yeux en croix et se secoue ;
 *  - grande coche verte quand une opération réussit ; grande croix rouge et réservoir secoué quand elle échoue.
 * Tout est décoratif : aria-hidden, aucun clic intercepté, aucun texte ajouté aux messages (leur textContent reste intact). */
(function () {
  'use strict';
  var modele = document.getElementById('mc-modele');
  if (!modele || !modele.content) { return; }
  var tactile = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);

  // Aucun nœud de texte (même un simple retour à la ligne) dans le modèle.
  function nettoyer(n) {
    var f = n.firstChild;
    while (f) {
      var suivant = f.nextSibling;
      if (f.nodeType === 3) { n.removeChild(f); } else if (f.nodeType === 1) { nettoyer(f); }
      f = suivant;
    }
  }
  nettoyer(modele.content);
  function mascotte() { return modele.content.firstElementChild.cloneNode(true); }

  // ---- Coup d'œil au coin d'une case ---------------------------------------------------------------
  var LARGEUR = 88, HAUTEUR = 85;          // le dessin (132 × 128) à l'échelle 2/3
  var DEGRADE_COUVERCLE = '<linearGradient id="mc-pk-couvercle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14806f"/><stop offset=".35" stop-color="#46cdb8"/><stop offset=".65" stop-color="#2fb8a3"/><stop offset="1" stop-color="#12705f"/></linearGradient>';
  var DEGRADE_METAL = '<linearGradient id="mc-pk-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd5da"/><stop offset=".32" stop-color="#ffffff"/><stop offset=".62" stop-color="#f1f3f5"/><stop offset="1" stop-color="#c3cad0"/></linearGradient>';
  var CORPS = 'M12 128V70q0-30 28-30h52q28 0 28 30v58Z';
  var SVG_COUP = '<svg class="mc-pk" viewBox="0 0 132 128" focusable="false"><defs>' + DEGRADE_COUVERCLE + DEGRADE_METAL + '</defs>'
    + '<rect x="41" y="4" width="50" height="11" rx="5" fill="url(#mc-pk-couvercle)"/>'
    + '<rect x="45" y="14" width="42" height="27" fill="url(#mc-pk-metal)"/>'
    + '<path d="' + CORPS + '" fill="url(#mc-pk-metal)"/><path d="' + CORPS + '" fill="none" stroke="rgba(45,38,60,.08)"/>'
    + '<circle cx="24" cy="54" r="6" fill="none" stroke="#e2e6e9" stroke-width="3"/><circle cx="108" cy="54" r="6" fill="none" stroke="#e2e6e9" stroke-width="3"/>'
    + '<g class="mc-pk-yeux"><ellipse cx="57" cy="62" rx="6.5" ry="10.5" fill="#333"/><ellipse cx="83" cy="62" rx="6.5" ry="10.5" fill="#333"/>'
    + '<circle class="mc-pk-eclat" cx="54.5" cy="58" r="2" fill="#fff"/><circle class="mc-pk-eclat" cx="80.5" cy="58" r="2" fill="#fff"/></g>'
    + '<g class="mc-pk-visage"><path d="M51 56 L61 66"/><path d="M61 56 L51 66"/><path d="M79 56 L89 66"/><path d="M89 56 L79 66"/><path d="M61 79 Q70 71 79 79"/></g>'
    + '<g transform="translate(47.6 71.4) scale(0.557)"><path fill="#71c66e" stroke="#71c66e" stroke-width=".5" stroke-linejoin="round" d="M3.7,5.7 H28.8 V27 L13,24.8 C8,20.5 4.2,14 3.7,5.7 Z"/><path fill="#83d1ee" stroke="#83d1ee" stroke-width=".5" stroke-linejoin="round" d="M13,24.8 C8,28.5 4.2,35 3.7,43.8 H28.8 V24 Z"/><path fill="#1cb9ad" d="M13,24.7 C17,22.3 23,20.1 29,19.8 V30.8 C23,30.7 17,28.3 13,24.7 Z"/><path fill="#044c92" fill-rule="evenodd" d="M32.2,6.9 Q32.2,5.5 33.6,5.5 H50.5 C57.5,5.5 61.7,9.3 61.7,14.8 C61.7,18.5 60.3,20.8 58.3,22.6 Q57.6,23.4 58.3,24.2 C60.5,25.8 63.1,28.4 63.1,33.2 C63.1,40 57.2,44 50.5,44 H33.6 Q32.2,44 32.2,42.6 Z M43,14.3 H48.2 C50.3,14.3 51.5,15.3 51.5,17.3 C51.5,19.3 50,20.4 48,20.4 H43 Q42.2,20.4 42.2,19.6 V15.1 Q42.2,14.3 43,14.3 Z M43,29.1 H49.6 C52,29.1 53.3,30.6 53.2,32.4 C53.1,34.4 51.4,35.6 49.2,35.6 H43 Q42.2,35.6 42.2,34.8 V29.9 Q42.2,29.1 43,29.1 Z"/></g>'
    + '</svg>';

  var CHAMPS = 'input.form-control, select.form-control, select.custom-select, textarea.form-control, .select2-selection--single';
  var SANS = { hidden: 1, checkbox: 1, radio: 1, file: 1, range: 1, button: 1, submit: 1, reset: 1, image: 1, color: 1 };
  var coup = null, courant = null, minuteurCoup = null;

  function creer() {
    coup = document.createElement('div');
    coup.className = 'mc-coup';
    coup.setAttribute('aria-hidden', 'true');
    coup.innerHTML = SVG_COUP;
    document.body.appendChild(coup);
  }
  function dans(n, c) { return !!(n && c && (n === c || c.contains(n))); }
  function admissible(c) {
    if (!c || c.disabled || (c.type && SANS[c.type]) || c.closest('.main-header, [data-sans-mascotte]')) { return false; }
    var r = c.getBoundingClientRect();
    return r.width >= 90 && r.height >= 28 && r.top >= HAUTEUR * 0.5 && r.top < window.innerHeight - 10 && window.getComputedStyle(c).visibility !== 'hidden';
  }
  function invalide(c) { return c.classList.contains('is-invalid') || (c.getAttribute && c.getAttribute('aria-invalid') === 'true'); }
  function cacher() {
    clearTimeout(minuteurCoup);
    courant = null;
    if (coup) { coup.classList.remove('visible'); }
  }
  // Rejoue l'entrée depuis le bas (le réservoir est sorti de derrière la case)
  function relancer(etat) {
    coup.classList.add('sans-transition');
    coup.classList.remove('visible');
    coup.removeAttribute('data-etat');
    void coup.offsetWidth;
    coup.classList.remove('sans-transition');
    if (etat) { coup.setAttribute('data-etat', etat); }
    coup.classList.add('visible');
  }
  // etat : 'erreur' (yeux en croix, secoué) ou rien ; auto : s'efface seul après un moment (une case qui vient d'être refusée)
  function montrer(c, etat, auto) {
    if (!admissible(c)) { if (!auto) { cacher(); } return; }
    clearTimeout(minuteurCoup);
    if (!coup) { creer(); }
    var r = c.getBoundingClientRect();
    var decalage = Math.min(40, Math.max(10, r.width * 0.1));
    coup.style.left = Math.round(r.right - decalage - LARGEUR) + 'px';
    coup.style.top = Math.round(r.top - HAUTEUR) + 'px';
    var meme = (courant === c && coup.classList.contains('visible'));
    courant = c;
    if (meme && (coup.getAttribute('data-etat') || '') === (etat || '') && !auto) { return; }
    relancer(etat);
    if (auto) { minuteurCoup = setTimeout(function () { if (courant === c) { cacher(); } }, 2600); }
  }

  document.addEventListener('mouseover', function (e) {
    if (tactile || !e.target.closest) { return; }
    var c = e.target.closest(CHAMPS);
    if (c) { montrer(c, invalide(c) ? 'erreur' : ''); }
  });
  document.addEventListener('mouseout', function (e) {
    if (courant && dans(e.target, courant) && !dans(e.relatedTarget, courant)) { cacher(); }
  });
  document.addEventListener('mousemove', function (e) {            // les yeux suivent le curseur
    if (!courant || !coup) { return; }
    var r = coup.getBoundingClientRect();
    var dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 90));
    coup.style.setProperty('--oeil', dx.toFixed(2));
  }, { passive: true });
  document.addEventListener('focusin', function (e) {              // téléphone et tablette : pas de survol, on se sert de la sélection
    if (tactile && e.target.closest) { var c = e.target.closest(CHAMPS); if (c) { montrer(c, invalide(c) ? 'erreur' : ''); } }
  });
  document.addEventListener('focusout', function () { if (tactile) { cacher(); } });
  window.addEventListener('scroll', cacher, true);
  window.addEventListener('resize', cacher);

  // ---- Popup de retour : succès (coche verte) ou échec (croix rouge) --------------------------------------
  var COULEURS = ['#46b64a', '#2db2d1', '#f2b705', '#044c92', '#8be0a4'];
  var minuteurRetour = null, dernierEchec = 0;

  function popup(type) {
    var echec = (type === 'danger');
    if (echec) {
      if (Date.now() - dernierEchec < 2500) { return; }          // plusieurs échecs de suite (scans) : une seule animation à la fois
      dernierEchec = Date.now();
    }
    var vieux = document.getElementById('retour');
    if (vieux) { vieux.remove(); }
    var r = document.createElement('div');
    r.id = 'retour';
    r.className = 'mc-retour' + (echec ? ' mc-retour-echec' : '');
    r.setAttribute('aria-hidden', 'true');
    var signe = echec
      ? '<path class="mc-retour-trait" d="M17 17L35 35"/><path class="mc-retour-trait mc-retour-trait2" d="M35 17L17 35"/>'
      : '<path class="mc-retour-trait" d="M14 27l8 8 16-17"/>';
    r.innerHTML = '<div class="mc-retour-carte"><div class="mc-retour-scene"><div class="mc-retour-badge">'
      + '<svg viewBox="0 0 52 52" focusable="false"><circle class="mc-retour-cercle" cx="26" cy="26" r="23"/>' + signe + '</svg>'
      + '</div></div><div class="mc-retour-titre">' + (echec ? 'Oups !' : 'C’est fait !') + '</div></div>';
    var scene = r.querySelector('.mc-retour-scene');
    var m = mascotte();
    m.classList.add(echec ? 'mc-echec' : 'mc-content');
    scene.insertBefore(m, scene.firstChild);
    var i, p;
    if (echec) {
      for (i = 0; i < 3; i++) { p = document.createElement('i'); p.className = 'mc-etoile mc-etoile' + (i + 1); scene.appendChild(p); }
    } else {
      for (i = 0; i < 10; i++) {
        p = document.createElement('i');
        p.className = 'mc-conf';
        p.style.setProperty('--a', (i * 36 + 12) + 'deg');
        p.style.setProperty('--c', COULEURS[i % COULEURS.length]);
        scene.appendChild(p);
      }
    }
    document.body.appendChild(r);
    clearTimeout(minuteurRetour);
    minuteurRetour = setTimeout(function () { r.remove(); }, 1950);
  }

  // Appelé par w.toast (app.js) pour chaque notification
  window.retourVisuel = function (type) {
    if (type === 'success' || type === 'danger') { popup(type); }
  };

  // ---- Messages et cases : déjà affichés par la page (après une redirection) ou rendus visibles par un script ----
  var vus = (typeof WeakSet === 'function') ? new WeakSet() : null;
  var aTraiter = [];
  var planifie = false;

  function traiter(a) {
    if (!vus || !a || !a.classList) { return; }
    if (a.classList.contains('is-invalid')) {                                         // case refusée : le réservoir fait les yeux en croix
      if (!vus.has(a)) {
        if (a.matches(CHAMPS) && a.getClientRects().length > 0) { vus.add(a); montrer(a, 'erreur', true); }
      }
      return;
    }
    if (!(a.classList.contains('alert-success') || a.classList.contains('alert-danger'))) { return; }
    if (a.closest('#toasts, [data-sans-mascotte]')) { return; }
    var visible = !a.hidden && a.getClientRects().length > 0;
    if (!visible) { vus.delete(a); return; }
    if (vus.has(a) || !a.textContent.trim()) { return; }
    vus.add(a);
    popup(a.classList.contains('alert-success') ? 'success' : 'danger');
  }
  function vider() {
    planifie = false;
    var l = aTraiter; aTraiter = [];
    for (var i = 0; i < l.length; i++) { traiter(l[i]); }
  }
  function signaler(n) {
    if (!n) { return; }
    var a = n.nodeType === 1 ? n : n.parentElement;
    a = a && a.closest ? a.closest('.alert-success, .alert-danger, .is-invalid') : null;
    if (a && aTraiter.indexOf(a) === -1) { aTraiter.push(a); }
  }
  function planifier() {
    if (!planifie && aTraiter.length) { planifie = true; window.requestAnimationFrame(vider); }
  }
  // une case qui n'est plus refusée peut l'être de nouveau plus tard
  function oublierSiValide(n) {
    if (n && n.nodeType === 1 && vus && vus.has(n) && !n.classList.contains('is-invalid') && !n.classList.contains('alert-success') && !n.classList.contains('alert-danger')) { vus.delete(n); }
  }

  var existants = document.querySelectorAll('.alert-success, .alert-danger');
  for (var k = 0; k < existants.length; k++) { aTraiter.push(existants[k]); }
  planifie = true;
  window.requestAnimationFrame(vider);

  if (window.MutationObserver) {
    new MutationObserver(function (liste) {
      for (var i = 0; i < liste.length; i++) {
        var m = liste[i];
        if (m.type === 'attributes') { oublierSiValide(m.target); signaler(m.target); }
        else if (m.type === 'characterData') { signaler(m.target); }
        else { signaler(m.target); for (var j = 0; j < m.addedNodes.length; j++) { signaler(m.addedNodes[j]); } }
      }
      planifier();
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  }
})();
