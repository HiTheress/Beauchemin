/* Page de connexion : pendant l'envoi, la mascotte accélère et le bouton annonce « Connexion… ». */
(function () {
  'use strict';
  var form = document.getElementById('form-connexion');
  if (!form) { return; }
  var bouton = document.getElementById('bouton-connexion');
  form.addEventListener('submit', function () {
    document.getElementById('connexion').classList.add('en-cours');
    bouton.textContent = 'Connexion…';
    bouton.setAttribute('aria-busy', 'true');
  });
  // retour arrière (page restaurée depuis la mémoire du navigateur) : on remet l'état de départ
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.getElementById('connexion').classList.remove('en-cours');
      bouton.textContent = 'Se connecter';
      bouton.removeAttribute('aria-busy');
    }
  });
})();
