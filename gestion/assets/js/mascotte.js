/* Mascotte : le réservoir de propane
 *  - jette un coup d'œil par le coin d'une case quand on la survole (on voit le dessus et les yeux) ;
 *  - fait une grande coche verte quand une opération réussit ;
 *  - se fait secouer (yeux en croix) à côté d'un message d'échec.
 * Tout est décoratif : aria-hidden, aucun clic intercepté, aucun texte ajouté. Les messages restent dans les notifications habituelles. */
(function () {
  'use strict';
  var modele = document.getElementById('mc-modele');
  if (!modele || !modele.content) { return; }
  var tactile = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);

  function reservoir() { return modele.content.querySelector('.mc-reservoir').cloneNode(true); }
  function mascotte() { return modele.content.firstElementChild.cloneNode(true); }

  // ---- Coup d'œil au coin d'une case ---------------------------------------------------------------
  var CHAMPS = 'input.form-control, select.form-control, select.custom-select, textarea.form-control, .select2-selection--single';
  var SANS = { hidden: 1, checkbox: 1, radio: 1, file: 1, range: 1, button: 1, submit: 1, reset: 1, image: 1, color: 1 };
  var coup = null, courant = null;

  function creer() {
    coup = document.createElement('div');
    coup.className = 'mc-coup';
    coup.setAttribute('aria-hidden', 'true');
    var glisse = document.createElement('div');
    glisse.className = 'mc-coup-glisse';
    glisse.appendChild(reservoir());
    coup.appendChild(glisse);
    document.body.appendChild(coup);
  }
  function dans(n, c) { return !!(n && c && (n === c || c.contains(n))); }
  function admissible(c) {
    if (!c || c.disabled || (c.type && SANS[c.type]) || c.closest('.main-header, [data-sans-mascotte]')) { return false; }
    var r = c.getBoundingClientRect();
    return r.width >= 90 && r.height >= 28 && r.top >= 40 && r.top < window.innerHeight - 10 && window.getComputedStyle(c).visibility !== 'hidden';
  }
  function cacher() {
    courant = null;
    if (coup) { coup.classList.remove('visible'); }
  }
  function montrer(c) {
    if (!admissible(c)) { cacher(); return; }
    if (courant === c && coup && coup.classList.contains('visible')) { return; }
    if (!coup) { creer(); }
    courant = c;
    var r = c.getBoundingClientRect();
    var decalage = Math.min(34, Math.max(10, r.width * 0.1));
    coup.style.left = Math.round(r.right - decalage - 84) + 'px';
    coup.style.top = Math.round(r.top - 49) + 'px';
    coup.classList.remove('visible');
    void coup.offsetWidth;                 // relance l'animation d'entrée
    coup.classList.add('visible');
  }

  document.addEventListener('mouseover', function (e) {
    if (tactile || !e.target.closest) { return; }
    var c = e.target.closest(CHAMPS);
    if (c) { montrer(c); }
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
    if (tactile && e.target.closest) { var c = e.target.closest(CHAMPS); if (c) { montrer(c); } }
  });
  document.addEventListener('focusout', function () { if (tactile) { cacher(); } });
  window.addEventListener('scroll', cacher, true);
  window.addEventListener('resize', cacher);

  // ---- Succès : coche verte et réservoir content -------------------------------------------------------
  var COULEURS = ['#46b64a', '#2db2d1', '#f2b705', '#044c92', '#8be0a4'];
  var minuteurSucces = null;

  function succes() {
    var vieux = document.getElementById('retour');
    if (vieux) { vieux.remove(); }
    var r = document.createElement('div');
    r.id = 'retour';
    r.className = 'mc-retour';
    r.setAttribute('aria-hidden', 'true');
    r.innerHTML = '<div class="mc-retour-carte"><div class="mc-retour-scene"><div class="mc-retour-badge">'
      + '<svg viewBox="0 0 52 52" focusable="false"><circle class="mc-retour-cercle" cx="26" cy="26" r="23"/><path class="mc-retour-coche" d="M14 27l8 8 16-17"/></svg>'
      + '</div></div><div class="mc-retour-titre">C’est fait !</div></div>';
    var scene = r.querySelector('.mc-retour-scene');
    var m = mascotte();
    m.classList.add('mc-content');
    scene.insertBefore(m, scene.firstChild);
    for (var i = 0; i < 10; i++) {
      var c = document.createElement('i');
      c.className = 'mc-conf';
      c.style.setProperty('--a', (i * 36 + 12) + 'deg');
      c.style.setProperty('--c', COULEURS[i % COULEURS.length]);
      scene.appendChild(c);
    }
    document.body.appendChild(r);
    clearTimeout(minuteurSucces);
    minuteurSucces = setTimeout(function () { r.remove(); }, 1950);
  }

  // ---- Échec : le réservoir, yeux en croix, se fait secouer sur le bord du message ----------------------
  function echec(el) {
    if (!el || el.hasAttribute('data-sans-mascotte')) { return; }
    for (var i = 0; i < el.children.length; i++) { if (el.children[i].classList.contains('mc-coin')) { return; } }
    var coin = document.createElement('div');
    coin.className = 'mc-coin';
    coin.setAttribute('aria-hidden', 'true');
    var glisse = document.createElement('div');
    glisse.className = 'mc-coin-glisse mc-echec';
    glisse.appendChild(reservoir());
    coin.appendChild(glisse);
    el.appendChild(coin);
    el.classList.add('mc-secoue');
    setTimeout(function () { el.classList.remove('mc-secoue'); }, 700);
  }

  // Appelé par w.toast (app.js) pour chaque notification
  window.retourVisuel = function (type, el) {
    if (type === 'success') { succes(); }
    else if (type === 'danger') { echec(el); }
  };

  // ---- Messages déjà affichés par la page (après une redirection) ou affichés plus tard par un script -----
  var vus = (typeof WeakSet === 'function') ? new WeakSet() : null;
  var aTraiter = [];
  var planifie = false;

  function traiter(a) {
    if (!vus || !a || !a.classList) { return; }
    if (!(a.classList.contains('alert-success') || a.classList.contains('alert-danger'))) { return; }
    if (a.closest('#toasts, [data-sans-mascotte]')) { return; }
    var visible = !a.hidden && a.getClientRects().length > 0;
    if (!visible) { vus.delete(a); return; }
    if (vus.has(a) || !a.textContent.trim()) { return; }
    vus.add(a);
    if (a.classList.contains('alert-success')) { succes(); } else { echec(a); }
  }
  function vider() {
    planifie = false;
    var l = aTraiter; aTraiter = [];
    for (var i = 0; i < l.length; i++) { traiter(l[i]); }
  }
  function signaler(n) {
    if (!n) { return; }
    var a = n.nodeType === 1 ? n : n.parentElement;
    a = a && a.closest ? a.closest('.alert-success, .alert-danger') : null;
    if (a && aTraiter.indexOf(a) === -1) { aTraiter.push(a); }
  }
  function planifier() {
    if (!planifie && aTraiter.length) { planifie = true; window.requestAnimationFrame(vider); }
  }

  var existants = document.querySelectorAll('.alert-success, .alert-danger');
  for (var k = 0; k < existants.length; k++) { aTraiter.push(existants[k]); }
  planifie = true;
  window.requestAnimationFrame(vider);

  if (window.MutationObserver) {
    new MutationObserver(function (liste) {
      for (var i = 0; i < liste.length; i++) {
        var m = liste[i];
        if (m.type === 'attributes') { signaler(m.target); }
        else if (m.type === 'characterData') { signaler(m.target); }
        else { signaler(m.target); for (var j = 0; j < m.addedNodes.length; j++) { signaler(m.addedNodes[j]); } }
      }
      planifier();
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  }
})();
