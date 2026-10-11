/* Documents imprimables : « Imprimé le … » du pied de page = l'heure de l'impression (et non celle du chargement de la page). */
(function () {
  'use strict';
  function deux(n) { return (n < 10 ? '0' : '') + n; }
  window.addEventListener('beforeprint', function () {
    var s = document.getElementById('doc-style-impression');
    if (!s) { return; }
    var d = new Date();
    var quand = d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + ' ' + deux(d.getHours()) + ':' + deux(d.getMinutes());
    s.textContent = '@page { @bottom-right { content: "Imprimé le ' + quand + ' · Page " counter(page) " / " counter(pages); } }';
  });
})();
