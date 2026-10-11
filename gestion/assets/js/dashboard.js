/* Accueil (module D2) : deux chiffres (à recommander, aujourd'hui), graphiques, derniers documents.
 * Données : app/ajax/dashboard_data.php (entreprise choisie dans la barre du haut). Un employé ne reçoit aucun montant :
 * les clés `valeur` et `factures` sont absentes de sa réponse (et leurs blocs absents de sa page).
 * Règles : toute valeur insérée dans innerHTML passe par esc() ; quantités et montants restent des chaînes décimales
 * (parseFloat seulement pour l'affichage et pour décider du signe d'un solde, jamais pour calculer).
 */
(function (w, $) {
  'use strict';

  var racine = document.getElementById('ds-racine');
  if (!racine) { return; }
  var gest = racine.getAttribute('data-gest') === '1';
  // L'entreprise AFFICHÉE par la page (0 = toutes) est envoyée au serveur : les chiffres actualisés restent fidèles à l'en-tête, même si
  // l'entreprise de la barre du haut a été changée dans un autre onglet.
  var entreprise = String(parseInt(racine.getAttribute('data-entreprise'), 10) || 0);

  function q(id) { return document.getElementById(id); }
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis cliquez sur « Actualiser ».';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  function entier(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  /** Montant avec son signe explicite pour un solde. */
  function signe(s) { var n = parseFloat(s); return (n > 0 ? '+' : '') + w.fmtArgent(s); }

  var MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function dateCourte(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? (parseInt(m[3], 10) + ' ' + MOIS_COURTS[parseInt(m[2], 10) - 1]) : '';
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (txt !== undefined) { e.textContent = txt; } return e; }

  var graphes = {};   // poignées des graphiques (on les met à jour au lieu de les recréer)
  function graphe(cle, fabrique, options) {
    if (!w.UI) { return; }
    if (graphes[cle]) { graphes[cle].update(options); } else { graphes[cle] = fabrique(options); }
  }
  function nombre(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }   // affichage seulement : jamais pour calculer un montant
  function court(nom, max) { nom = String(nom || ''); return nom.length > max ? nom.slice(0, max - 1) + '…' : nom; }

  /** Graphiques de l'accueil (kit de widgets). Aucun montant pour un employé : la clé `factures` / `valeur` est absente. */
  function dessinerActivite(a, docs, c) {
    if (!a || !w.UI) { return; }
    w.UI.sprite();
    var jours = a.jours || [];
    // Barres en pastille : un jour par colonne, le fond (piste) montre l'échelle
    graphe('act', function (o) { return w.UI.bars('#gr-graph', o); }, {
      height: 170, mode: 'stacked', style: 'pill', yTicks: 4, grid: 'h', label: 'Mouvements par jour',
      xLabels: jours.map(function (j) { return j.lettre; }),
      series: [{ name: 'Mouvements', data: jours.map(function (j) { return entier(j.n); }), color: 'indigo' }]
    });
    q('gr-graph').setAttribute('aria-label', 'Mouvements par jour : ' + jours.map(function (j) { return j.lettre + ' ' + entier(j.n); }).join(', '));
    q('gr-total').textContent = w.fmtQte(a.nombre);

    var lect = q('gr-lectures');
    lect.textContent = '';
    (docs || []).slice(0, 5).forEach(function (d) {
      var l = el('div', 'gr-lecture');
      l.appendChild(el('span', 'gr-temps', dateCourte(d.date)));
      var v = el('a', 'gr-val', d.numero + ' · ' + d.type_libelle + (d.statut === 'annule' ? ' (annulé)' : ''));
      v.href = 'index.php?page=document_voir&id=' + entier(d.id);
      l.appendChild(v);
      lect.appendChild(l);
    });

    // Anneau : part des pièces actives qui ont du stock
    var actives = entier(c.pieces_actives), enStock = entier(c.pieces_en_stock);
    var pct = actives > 0 ? Math.round(100 * enStock / actives) : 0;
    graphe('ring', function (o) { return w.UI.ring('#gr-ring', o); }, { value: pct, color: 'indigo', track: 'indigo-soft', stroke: 12, text: pct + ' %', label: pct + ' % des pièces actives ont du stock' });
    q('gr-ring-txt').textContent = enStock + ' sur ' + actives;

    // Mouvements par type
    var types = a.par_type || [];
    var maxT = 1;
    types.forEach(function (t) { if (entier(t.n) > maxT) { maxT = entier(t.n); } });
    var zoneT = q('gr-types');
    q('gr-types-vide').hidden = types.length > 0;
    zoneT.hidden = types.length === 0;
    if (types.length) {
      var couleurs = ['indigo', 'sky', 'amber', 'green', 'red'];
      w.UI.hbars('#gr-types', { thick: true, max: maxT, rows: types.map(function (t, i) { return { label: t.libelle, value: entier(t.n), color: couleurs[i % couleurs.length] }; }) });
      // le nombre à droite de chaque barre
      Array.prototype.forEach.call(zoneT.querySelectorAll('.hbars__row'), function (ligne, i) { var b = el('b', '', String(entier(types[i].n))); ligne.appendChild(b); });
    }
  }

  /** Factures du mois (graphique et montants dans le même bloc) et valeur par entreprise : gestionnaire+ seulement. */
  function dessinerFinances(r) {
    var f = r.factures || { lignes: [] };
    var lignes = f.lignes || [];
    q('ds-mois').textContent = f.libelle_mois || '';
    if (w.UI && q('gr-fact') && lignes.length) {
      graphe('fact', function (o) { return w.UI.bars('#gr-fact', o); }, {
        height: 150, mode: 'grouped', style: 'solid', yTicks: 4, yAxisWidth: 46, barWidth: 16, label: 'Factures émises et reçues',
        yFormat: function (v) { return v >= 1000 ? (v / 1000) + ' k' : String(v); },
        xLabels: lignes.map(function (x) { return court(x.nom, 12); }),
        series: [{ name: 'Émis', data: lignes.map(function (x) { return nombre(x.emis); }), color: 'indigo' }, { name: 'Reçu', data: lignes.map(function (x) { return nombre(x.recu); }), color: 'sky' }]
      });
    }
    q('ds-factures').innerHTML = lignes.length ? lignes.map(function (x) {
      var s = parseFloat(x.solde);
      var etat = s > 0 ? 'à recevoir' : (s < 0 ? 'à payer' : '');
      var cls = s > 0 ? 'sk-pos' : (s < 0 ? 'sk-neg' : 'text-muted');
      return '<div class="ds-fact"><div class="ds-fact-nom">' + w.esc(x.nom) + '</div><div class="ds-fact-chiffres">' +
        '<span>Émis <strong class="nombre">' + w.esc(w.fmtArgent(x.emis)) + '</strong></span> ' +
        '<span>Reçu <strong class="nombre">' + w.esc(w.fmtArgent(x.recu)) + '</strong></span> ' +
        '<span>Solde <strong class="nombre ' + cls + '">' + w.esc(signe(x.solde)) + '</strong>' + (etat ? ' <small class="' + cls + '">' + etat + '</small>' : '') + '</span></div></div>';
    }).join('') : '<span class="text-muted">Aucune entreprise.</span>';

    var v = r.valeur || [];
    var maxV = 0;
    v.forEach(function (x) { if (nombre(x.valeur) > maxV) { maxV = nombre(x.valeur); } });
    var couleurs = ['indigo', 'sky', 'amber', 'green'];
    q('gr-valeur').innerHTML = v.length ? v.map(function (x, i) {
      var pct = maxV > 0 ? Math.round(100 * nombre(x.valeur) / maxV) : 0;
      return '<div class="progress__row" style="--c:var(--' + couleurs[i % couleurs.length] + ');--v:' + pct + '%"><span>' + w.esc(x.nom) + '</span><b>' + w.esc(w.fmtArgent(x.valeur)) + '</b><i class="bar"></i></div>';
    }).join('') : '<span class="text-muted">Aucune entreprise.</span>';
  }

  var chargement = 0;   // numéro de la dernière demande : une réponse en retard est ignorée

  function dessiner(r) {
    var c = r.cartes || {};
    q('ds-portee').textContent = 'Entreprise : ' + (r.portee && r.portee.libelle ? r.portee.libelle : '—');

    var sous = entier(c.sous_minimum);
    q('ds-sous').textContent = w.fmtQte(sous);
    q('ds-sous-unite').textContent = sous > 1 ? 'pièces' : 'pièce';
    // forcer l'état (pas de bascule) : !!sous
    q('ds-carte-sous').classList.remove('ds-alerte');
    if (!!sous) { q('ds-carte-sous').classList.add('ds-alerte'); }

    var nj = entier(c.mouvements_jour);
    q('ds-jour').textContent = w.fmtQte(nj);
    q('ds-jour-unite').textContent = nj > 1 ? 'mouvements' : 'mouvement';

    dessinerActivite(r.activite, r.derniers_documents, c);
    if (gest) { dessinerFinances(r); }
  }

  function charger() {
    var no = ++chargement;
    var bouton = q('ds-actualiser');
    bouton.disabled = true;
    return w.api.get('app/ajax/dashboard_data.php', { entreprise_id: entreprise }).then(function (r) {
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

  // Rafraîchissement automatique toutes les deux minutes, mais SEULEMENT tant que quelqu'un est là : chaque appel au serveur renouvelle
  // la session. Sans cette garde, un poste laissé ouvert sur le tableau de bord ne se déconnecterait jamais (politique : 8 h d'inactivité).
  // Après 15 minutes sans souris, clavier, toucher ni défilement, on cesse de rafraîchir ; au retour de l'utilisateur, on recharge aussitôt.
  var DELAI_INACTIVITE = 15 * 60 * 1000;
  var derniereActivite = Date.now();
  function activite() {
    var maintenant = Date.now();
    var inactif = (maintenant - derniereActivite) >= DELAI_INACTIVITE;
    derniereActivite = maintenant;
    if (inactif && !document.hidden) { charger(); }   // retour après une longue pause : chiffres à jour tout de suite
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(function (ev) {
    document.addEventListener(ev, activite, { passive: true, capture: true });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { activite(); } });
  setInterval(function () {
    if (!document.hidden && (Date.now() - derniereActivite) < DELAI_INACTIVITE) { charger(); }
  }, 120000);
})(window, jQuery);
