var fusion = /[?&]mode=fusion\b/.test(location.search);
var sl = SaisieLignes.creer({ conteneur: '#lignes', scan: '#scan', recherche: fusion ? undefined : '#rech', suggestions: fusion, stepper: fusion, coutColonne: true,
  emplacementSource: function () { return $('#src').val(); },
  coutParDefaut: function (p) { return '10,50'; },
  onEmplacement: function (e) { $('#src').val(e.id); sl.rafraichir(); toast('Emplacement : ' + e.nom, 'info'); },
  onChange: function (l) { $('#sortie').text(JSON.stringify(l) + ' / ' + sl.valider()); } });
if (fusion) { $('#rech').hide(); }
