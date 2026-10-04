var sl = SaisieLignes.creer({ conteneur: '#lignes', scan: '#scan', recherche: '#rech', coutColonne: true,
  emplacementSource: function () { return $('#src').val(); },
  coutParDefaut: function (p) { return '10,50'; },
  onEmplacement: function (e) { $('#src').val(e.id); sl.rafraichir(); toast('Emplacement : ' + e.nom, 'info'); },
  onChange: function (l) { $('#sortie').text(JSON.stringify(l) + ' / ' + sl.valider()); } });
