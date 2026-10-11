/* Indicateur de chargement : si une page met plus de 0,35 s à s'ouvrir, la mascotte (réservoir qui rebondit) apparaît.
 * Déclenché par un clic sur un lien ou l'envoi d'un formulaire ordinaire. Jamais pour les exports, téléchargements ni appels AJAX. */
(function () {
  'use strict';
  var voile = document.getElementById('chargement');
  if (!voile) { return; }
  var minuteur = null, securite = null;

  function montrer() {
    voile.classList.add('visible');
    // sécurité : un téléchargement ne quitte pas la page, le voile ne doit jamais rester coincé
    securite = setTimeout(cacher, 8000);
  }
  function cacher() {
    clearTimeout(minuteur); clearTimeout(securite);
    voile.classList.remove('visible');
  }
  function armer() {
    clearTimeout(minuteur);
    minuteur = setTimeout(montrer, 350);
  }
  function memeSite(url) {
    try { var u = new URL(url, location.href); return u.origin === location.origin ? u : null; } catch (e) { return null; }
  }
  function adresseDePage(u) {
    return !/\/app\/(ajax|action)\//.test(u.pathname) && !/\.(csv|pdf|zip|sql|gz|png|svg|jpg)$/i.test(u.pathname);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self') || a.hasAttribute('data-toggle') || a.hasAttribute('data-widget')) { return; }
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(href)) { return; }
    var u = memeSite(a.href);
    if (!u || !adresseDePage(u)) { return; }
    if (u.pathname === location.pathname && u.search === location.search && u.hash) { return; }   // ancre sur la même page
    armer();
  });
  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented) { return; }          // formulaire traité en JavaScript : pas de rechargement
    var f = e.target;
    if (f.hasAttribute && (f.hasAttribute('data-sans-chargement') || (f.target && f.target !== '_self'))) { return; }
    var u = memeSite(f.action || location.href);
    if (!u || !adresseDePage(u)) { return; }
    armer();
  });
  window.addEventListener('pageshow', cacher);   // retour arrière : on ne garde pas le voile
})();
