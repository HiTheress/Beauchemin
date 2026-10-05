/* Tableau de bord (module D2) : cartes, 10 derniers documents, pièces les plus sous le minimum.
 * Données : app/ajax/dashboard_data.php (entreprise choisie dans la barre du haut). Un employé ne reçoit aucun montant :
 * les clés `valeur` et `factures` sont absentes de sa réponse (et leurs cartes absentes de sa page).
 * Règles : toute valeur insérée dans innerHTML passe par esc() ; quantités et montants restent des chaînes décimales
 * (parseFloat seulement pour l'affichage et pour décider du signe d'un solde, jamais pour calculer).
 */
(function (w, $) {
  'use strict';

  var racine = document.getElementById('ds-racine');
  if (!racine) { return; }
  var gest = racine.getAttribute('data-gest') === '1';

  function q(id) { return document.getElementById(id); }
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis cliquez sur « Actualiser ».';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  function entier(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function lienPiece(id, code, nom) {
    return '<a href="index.php?page=piece_voir&amp;id=' + entier(id) + '"><span class="code font-weight-bold">' + w.esc(code) + '</span> ' + w.esc(nom) + '</a>';
  }
  /** Montant avec son signe explicite pour un solde. */
  function signe(s) { var n = parseFloat(s); return (n > 0 ? '+' : '') + w.fmtArgent(s); }

  var chargement = 0;   // numéro de la dernière demande : une réponse en retard est ignorée

  function dessiner(r) {
    var c = r.cartes || {};
    q('ds-portee').textContent = 'Entreprise : ' + (r.portee && r.portee.libelle ? r.portee.libelle : '—');

    q('ds-pieces').textContent = w.fmtQte(c.pieces_actives);
    q('ds-pieces-detail').textContent = 'dont ' + w.fmtQte(c.pieces_en_stock) + ' en stock';

    var sous = entier(c.sous_minimum);
    q('ds-sous').textContent = w.fmtQte(sous);
    q('ds-sous-detail').textContent = sous === 0 ? 'Rien à recommander' : (sous === 1 ? '1 pièce à recommander' : sous + ' pièces à recommander');
    // forcer l'état (pas de bascule) : !!sous
    q('ds-carte-sous').classList.remove('ds-alerte');
    if (!!sous) { q('ds-carte-sous').classList.add('ds-alerte'); }

    q('ds-jour').textContent = w.fmtQte(c.mouvements_jour);
    var nd = entier(c.documents_jour);
    q('ds-jour-detail').textContent = nd === 0 ? 'Aucun document aujourd\'hui' : (nd === 1 ? 'dans 1 document' : 'dans ' + nd + ' documents');

    if (gest) {
      var v = r.valeur || [];
      q('ds-valeur').innerHTML = v.length ? v.map(function (x) {
        return '<div class="ds-ligne"><span>' + w.esc(x.nom) + '</span><strong class="nombre">' + w.esc(w.fmtArgent(x.valeur)) + '</strong></div>';
      }).join('') : '<span class="text-muted">Aucune entreprise.</span>';

      var f = r.factures || { lignes: [] };
      q('ds-mois').textContent = f.libelle_mois ? '(' + f.libelle_mois + ')' : '';
      q('ds-factures').innerHTML = f.lignes.length ? f.lignes.map(function (x) {
        var s = parseFloat(x.solde);
        var etat = s > 0 ? 'à recevoir' : (s < 0 ? 'à payer' : 'équilibré');
        var cls = s > 0 ? 'sk-pos' : (s < 0 ? 'sk-neg' : 'text-muted');
        return '<div class="ds-ligne ds-ligne-factures"><span class="ds-ent">' + w.esc(x.nom) + '</span>' +
          '<span>Émis <strong class="nombre">' + w.esc(w.fmtArgent(x.emis)) + '</strong> <small class="text-muted">(' + entier(x.nb_emises) + ')</small></span>' +
          '<span>Reçu <strong class="nombre">' + w.esc(w.fmtArgent(x.recu)) + '</strong> <small class="text-muted">(' + entier(x.nb_recues) + ')</small></span>' +
          '<span>Solde <strong class="nombre ' + cls + '">' + w.esc(signe(x.solde)) + '</strong> <small class="' + cls + '">' + etat + '</small></span></div>';
      }).join('') : '<span class="text-muted">Aucune entreprise.</span>';
    }

    // 10 derniers documents
    var docs = r.derniers_documents || [];
    q('ds-docs-vide').hidden = docs.length > 0;
    q('ds-docs-zone').hidden = docs.length === 0;
    q('ds-docs').innerHTML = docs.map(function (d) {
      var emp = (d.emplacement ? w.esc(d.emplacement) : '') + (d.emplacement_dest ? (d.emplacement ? ' → ' : '→ ') + w.esc(d.emplacement_dest) : '');
      if (d.entreprise_dest) { emp = '<span class="text-muted">' + w.esc(d.entreprise) + ' → ' + w.esc(d.entreprise_dest) + '</span>' + (emp ? '<br>' + emp : ''); }
      return '<tr>' +
        '<td><a class="code font-weight-bold" href="index.php?page=document_voir&amp;id=' + entier(d.id) + '">' + w.esc(d.numero) + '</a></td>' +
        '<td>' + w.esc(d.type_libelle) + '</td>' +
        '<td class="ds-date">' + w.esc(d.date) + '</td>' +
        '<td>' + emp + '</td>' +
        (gest ? '<td class="nombre">' + w.esc(w.fmtArgent(d.total)) + '</td>' : '') +
        '<td>' + (d.statut === 'annule' ? '<span class="badge badge-danger">Annulé</span>' : '<span class="badge badge-success">Valide</span>') + '</td>' +
        '</tr>';
    }).join('');

    // 5 pièces les plus sous le minimum
    var bas = r.plus_bas || [];
    var multi = r.portee && r.portee.ids && r.portee.ids.length > 1;
    q('ds-bas-vide').hidden = bas.length > 0;
    q('ds-bas-zone').hidden = bas.length === 0;
    q('ds-bas').innerHTML = bas.map(function (b) {
      return '<tr><td>' + lienPiece(b.piece_id, b.code, b.nom) + (multi ? '<br><small class="text-muted">' + w.esc(b.entreprise) + '</small>' : '') + '</td>' +
        '<td class="nombre">' + w.esc(w.fmtQte(b.quantite)) + '</td>' +
        '<td class="nombre">' + w.esc(w.fmtQte(b.minimum)) + '</td>' +
        '<td class="nombre"><strong class="sk-neg">' + w.esc(w.fmtQte(b.manque)) + '</strong> <small class="text-muted">' + w.esc(b.unite) + '</small></td></tr>';
    }).join('');
  }

  function charger() {
    var no = ++chargement;
    var bouton = q('ds-actualiser');
    bouton.disabled = true;
    return w.api.get('app/ajax/dashboard_data.php').then(function (r) {
      if (no !== chargement) { return; }
      q('ds-erreur').hidden = true;
      dessiner(r);
    }).catch(function (err) {
      if (no !== chargement) { return; }
      q('ds-erreur').textContent = 'Impossible de charger le tableau de bord. ' + msg(err);
      q('ds-erreur').hidden = false;
      q('ds-portee').textContent = '';
    }).then(function () {
      if (no === chargement) { bouton.disabled = false; }
    });
  }

  q('ds-actualiser').addEventListener('click', function () { charger(); });
  charger();
  // Rafraîchissement automatique toutes les deux minutes (onglet visible seulement)
  setInterval(function () { if (!document.hidden) { charger(); } }, 120000);
})(window, jQuery);
