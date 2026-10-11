/* Page de connexion : pendant l'envoi, le bouton annonce « Connexion… » et la mascotte (réservoir qui rebondit) apparaît. */
(function () {
  'use strict';
  var form = document.getElementById('form-connexion');
  if (!form) { return; }
  var bouton = document.getElementById('bouton-connexion');
  var voile = document.getElementById('chargement');
  var minuteur = null;
  function arreter() {
    clearTimeout(minuteur);
    document.getElementById('connexion').classList.remove('en-cours');
    if (voile) { voile.classList.remove('visible'); }
    bouton.textContent = 'Se connecter';
    bouton.removeAttribute('aria-busy');
  }
  form.addEventListener('submit', function () {
    document.getElementById('connexion').classList.add('en-cours');
    bouton.textContent = 'Connexion…';        // le bouton n'est pas désactivé : son nom (admin_login) doit partir avec le formulaire
    bouton.setAttribute('aria-busy', 'true');
    if (voile) {
      minuteur = setTimeout(function () { voile.classList.add('visible'); }, 150);
      setTimeout(arreter, 10000);              // sécurité : jamais coincé si le serveur ne répond pas
    }
  });
  // retour arrière (page restaurée depuis la mémoire du navigateur) : on remet l'état de départ
  window.addEventListener('pageshow', function (e) { if (e.persisted) { arreter(); } });
})();
