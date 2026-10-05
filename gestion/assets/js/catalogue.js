/* Catalogue : pièces, fiche d'une pièce, modification, fournisseurs, catégories (module A1).
 * Un seul fichier ; la page est reconnue par l'attribut data-catalogue de sa racine :
 *   pieces | piece_voir | piece_edit | fournisseurs | categories
 * Règles : toute valeur insérée dans innerHTML passe par esc() ; les quantités et montants restent des chaînes décimales
 * (la conversion en nombre ne sert qu'à l'affichage) ; les boutons sont désactivés pendant l'envoi.
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-catalogue]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-catalogue');

  // ===================================================================================
  //  Utilitaires communs
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  /** Message d'erreur affichable : jamais de texte technique anglais (api.get / api.post traduisent déjà le réseau coupé ; ceci couvre le reste). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  function nettoyer(s) { return String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim(); }

  function aujourdhui() {
    var d = new Date(), m = d.getMonth() + 1, j = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j;
  }

  /** "14.5000" -> "14,50" (au moins 2 décimales, zéros inutiles retirés au-delà) pour un champ de saisie. */
  function saisieMontant(s) {
    var p = String(s).split('.'), frac = (p[1] || '').replace(/0+$/, '');
    while (frac.length < 2) { frac += '0'; }
    return p[0] + ',' + frac;
  }

  // Les erreurs de chargement des tableaux (session expirée, accès refusé, serveur, réseau) sont gérées une seule fois par le noyau
  // (app.js : événement error.dt). Ici on ne fait que signaler le tableau périmé (voir surveillerChargement).

  /** Libellés français des tableaux : espace insécable comme séparateur de milliers (« 3 014 »), aria-labels de tri en français. */
  var LANG = $.extend(true, {}, w.DT_LANG, {
    thousands: '\u00a0',
    aria: { sortAscending: ' : activer pour trier en ordre croissant', sortDescending: ' : activer pour trier en ordre décroissant' }
  });

  /** Texte sans accents ni majuscules (tri et recherche à la française). */
  function sansAccents(v) { return String(v === null || v === undefined ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  /** Tri français (accents et casse ignorés) pour les tableaux entièrement chargés dans le navigateur. */
  $.fn.dataTable.ext.type.order['fr-asc'] = function (a, b) { return String(a === null ? '' : a).localeCompare(String(b === null ? '' : b), 'fr', { sensitivity: 'base' }); };
  $.fn.dataTable.ext.type.order['fr-desc'] = function (a, b) { return -$.fn.dataTable.ext.type.order['fr-asc'](a, b); };
  /** Recherche française : « electro » trouve « Électro Plus » (le serveur fait de même pour la liste des pièces). */
  $.fn.dataTable.ext.type.search['fr'] = function (d) { return sansAccents(d); };

  /** Branche la recherche d'un tableau chargé dans le navigateur sur le texte sans accents. */
  function rechercheSansAccents(table) {
    var champ = $(table.table().container()).find('.dataTables_filter input');
    champ.off('.DT').on('input.cat search.cat', function () { table.search(sansAccents(this.value)).draw(); });
  }

  /**
   * Un chargement qui échoue (réseau coupé, serveur, accès) ne doit pas laisser les anciennes lignes sous un nouveau filtre :
   * on remplace le contenu par un message. Le message d'erreur lui-même (une seule fois) vient du noyau (error.dt).
   */
  function surveillerChargement(selecteur, colonnes) {
    $(selecteur).on('xhr.dt', function (e, settings, json, xhr) {
      if (json) { return; }
      var etat = (xhr && xhr.status) || 0;
      if (etat === 401) { return; }          // retour à la connexion, géré par le noyau
      if (etat === 0) {
        // Réseau coupé : DataTables ne signale rien (pas de réponse HTTP) ; le message vient d'ici, une seule fois
        // (si le noyau l'a déjà affiché, on ne le répète pas).
        setTimeout(function () {
          var boite = document.getElementById('toasts');
          if (!boite || boite.textContent.indexOf('Connexion impossible au serveur') === -1) { w.toast('Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.', 'danger'); }
        }, 0);
      }
      var td = document.createElement('td');
      td.colSpan = colonnes; td.className = 'text-center text-danger py-4';
      td.textContent = 'Le chargement a échoué : cette liste n\'est pas à jour. Modifiez un filtre ou rechargez la page pour réessayer.';
      var tr = document.createElement('tr'); tr.className = 'cat-echec'; tr.appendChild(td);
      $(selecteur + ' tbody').empty().append(tr);
    });
  }

  /** Remet le focus sur l'élément qui avait ouvert une fenêtre (sinon sur le repli) : la navigation au clavier reprend là où elle était. */
  function memoriserFocus() { var a = document.activeElement; return (a && a !== document.body) ? a : null; }
  function rendreFocus(el, repli) {
    setTimeout(function () {
      var cible = (el && el.isConnected && !el.disabled) ? el : (typeof repli === 'function' ? repli() : repli);
      if (cible && typeof cible.focus === 'function') { cible.focus(); }
    }, 0);
  }
  /** Ouvre une fenêtre modale : premier champ ciblé à l'ouverture, focus rendu à la fermeture. */
  function ouvrirModal(selecteur, premierChamp, repli, declencheur) {
    var avant = declencheur || memoriserFocus();
    $(selecteur).off('shown.bs.modal.cat hidden.bs.modal.cat')
      .one('shown.bs.modal.cat', function () { var c = typeof premierChamp === 'function' ? premierChamp() : (premierChamp ? q(premierChamp) : null); if (c) { c.focus(); } })
      .one('hidden.bs.modal.cat', function () { rendreFocus(avant, repli); })
      .modal('show');
  }

  /** Message d'erreur dans une zone .alert (ou toast si la zone n'existe pas). */
  function alerte(zone, texte) {
    if (!zone) { w.toast(texte, 'danger'); return; }
    zone.textContent = texte;
    zone.hidden = false;
  }

  function effacerErreurs(form) {
    qa('.is-invalid', form).forEach(function (e) { e.classList.remove('is-invalid'); });
    qa('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); e.removeAttribute('aria-describedby'); });
    qa('[data-erreur-pour]', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
  }
  /** Marque un champ en erreur : bordure rouge, aria-invalid et lien vers son message (lu par les lecteurs d'écran). */
  function marquerInvalide(el, zone) {
    if (!el) { return; }
    el.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
    if (zone) { if (!zone.id) { zone.id = 'err-' + String(zone.getAttribute('data-erreur-pour') || Math.random()).replace(/[^a-z0-9_-]/gi, ''); } el.setAttribute('aria-describedby', zone.id); }
  }
  function demarquerInvalide(el) {
    if (!el) { return; }
    el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
  }

  /** Boîte de confirmation (Promise<boolean>). Le message est inséré en texte, jamais en HTML. */
  var confirmationOuverte = false;
  function confirmer(titre, message, libelle, classe, repli) {
    if (confirmationOuverte) { return Promise.resolve(false); }      // double clic : une seule boîte à la fois
    confirmationOuverte = true;
    var declencheur = memoriserFocus();
    return new Promise(function (resolve) {
      var m = document.getElementById('modal-confirmer');
      if (!m) {
        m = document.createElement('div');
        m.id = 'modal-confirmer';
        m.className = 'modal fade';
        m.tabIndex = -1;
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.setAttribute('aria-labelledby', 'modal-confirmer-titre');
        m.innerHTML = '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">' +
          '<div class="modal-header"><h5 class="modal-title" id="modal-confirmer-titre"></h5>' +
          '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>' +
          '<div class="modal-body"><p class="mb-0 cat-desc" id="modal-confirmer-message"></p></div>' +
          '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="modal-confirmer-non">Annuler</button>' +
          '<button type="button" class="btn cat-btn-danger" id="modal-confirmer-oui"></button></div></div></div>';
        document.body.appendChild(m);
      }
      q('#modal-confirmer-titre', m).textContent = titre;
      q('#modal-confirmer-message', m).textContent = message;
      var oui = q('#modal-confirmer-oui', m);
      oui.textContent = libelle || 'Confirmer';
      oui.className = 'btn ' + (classe || 'cat-btn-danger');
      var decision = false;
      oui.onclick = function () { decision = true; $(m).modal('hide'); };
      $(m).off('hidden.bs.modal.confirmer shown.bs.modal.confirmer')
        .on('shown.bs.modal.confirmer', function () { q('#modal-confirmer-non', m).focus(); })
        .one('hidden.bs.modal.confirmer', function () { confirmationOuverte = false; resolve(decision); rendreFocus(declencheur, repli); });
      $(m).modal('show');
    });
  }

  /** Confirmation de désactivation d'une pièce : un seul message, avec le stock restant s'il y en a (vérifié côté serveur, sans rien changer). */
  function confirmerDesactivation(id, code, repli) {
    return api.post('app/action/piece_activer.php', { id: id, actif: false, simuler: true }).then(function (r) {
      if (r && r.confirmation_requise) { return confirmer('Désactiver la pièce ?', r.message, 'Désactiver quand même', 'cat-btn-danger', repli); }
      return confirmer('Désactiver la pièce ?', 'Désactiver « ' + code + ' » ? Elle n\'apparaîtra plus dans les listes de saisie ni dans les réceptions ; son historique est conservé.', 'Désactiver', 'cat-btn-danger', repli);
    });
  }

  /** Désactive les boutons le temps d'une requête ; les réactive seulement en cas d'échec (ou si garder === true). */
  function envoyer(boutons, requete, garder) {
    boutons.forEach(function (b) { if (b) { b.disabled = true; } });
    function libres() { boutons.forEach(function (b) { if (b) { b.disabled = false; } }); }
    return requete().then(function (r) { if (garder) { libres(); } return r; }, function (e) { libres(); throw e; });
  }

  // ===================================================================================
  //  Liste des pièces
  // ===================================================================================
  function initPieces() {
    var champRech = q('#recherche'), minuteur = null;
    var table = $('#table-pieces').DataTable({
      serverSide: true,
      processing: true,
      searching: true,
      search: { search: champRech.value.trim() },        // recherche reçue par l'adresse (?q=) : incluse dans la première requête
      order: [[1, 'asc']],
      dom: '<"row"<"col-sm-12"tr>><"row mt-2"<"col-sm-12 col-md-4"l><"col-sm-12 col-md-3"i><"col-sm-12 col-md-5"p>>',
      ajax: {
        url: 'app/ajax/pieces_data.php',
        type: 'POST',
        data: function (d) {
          d.categorie_id = q('#f-categorie').value;
          d.statut = q('#f-statut').value;
          d.avec_stock = q('#f-stock').checked ? 1 : 0;
        }
      },
      columns: [
        { data: 'code' },
        { data: 'nom' },
        { data: 'categorie', defaultContent: '' },
        { data: 'unite' },
        { data: 'quantite', className: 'nombre', render: function (v, type) { return type === 'display' ? w.fmtQte(v) : v; } },
        { data: 'statut', render: function (v, type) {
            if (type !== 'display') { return v; }
            return parseInt(v, 10) === 1 ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Désactivée</span>';
          } }
      ],
      // le serveur applique les filtres au total : « vide » veut donc toujours dire « rien ne correspond à ces critères »
      language: $.extend({}, LANG, {
        zeroRecords: 'Aucune pièce ne correspond à ces critères.',
        emptyTable: 'Aucune pièce ne correspond à ces critères.'
      }),
      createdRow: function (tr) { tr.classList.add('cliquable'); }
    });
    surveillerChargement('#table-pieces', 6);

    // Un clic sur la ligne ouvre la fiche (zone de clic large pour la tablette)
    $('#table-pieces tbody').on('click', 'tr.cliquable', function (e) {
      if ($(e.target).closest('a, button, input').length) { return; }
      var a = this.querySelector('a.lien-fiche');
      if (a) { w.location.href = a.getAttribute('href'); }
    });

    var tactile = !!(w.matchMedia && w.matchMedia('(pointer: coarse)').matches);   // pas de clavier virtuel intempestif sur tablette
    function focusRecherche() { if (!tactile) { champRech.focus(); } }

    // Après un changement de filtre, le focus revient au champ : le scan suivant n'est pas perdu
    ['#f-categorie', '#f-statut', '#f-stock'].forEach(function (s) {
      q(s).addEventListener('change', function () { table.draw(); focusRecherche(); });
    });

    // Rappel des filtres pour l'impression (les filtres eux-mêmes ne s'impriment pas)
    function texteFiltres() {
      var cat = q('#f-categorie'), st = q('#f-statut');
      var parts = ['Statut : ' + st.options[st.selectedIndex].text.toLowerCase()];
      if (cat.value !== '') { parts.push('Catégorie : ' + cat.options[cat.selectedIndex].text); }
      if (q('#f-stock').checked) { parts.push('Avec stock seulement'); }
      if (champRech.value.trim() !== '') { parts.push('Recherche : « ' + champRech.value.trim() + ' »'); }
      var portee = q('.cat-portee strong');
      if (portee) { parts.push('Entreprises : ' + portee.textContent); }
      return parts.join(' · ');
    }
    table.on('draw', function () { var z = q('#filtres-impression'); if (z) { z.textContent = texteFiltres(); } });

    // Recherche en tapant (code, nom ou alias, côté serveur)
    function filtrer() { table.search(champRech.value.trim()).draw(); }
    var dernierInput = 0;
    champRech.addEventListener('input', function () { dernierInput = Date.now(); clearTimeout(minuteur); minuteur = setTimeout(filtrer, 300); });

    // Lecteur de codes-barres : le code arrive suivi d'Entrée (ou de Tab). On le copie, on vide le champ tout de suite et on traite
    // les scans à la file (aucun scan perdu ni collé au précédent, même en rafale). Un code de pièce ouvre sa fiche ; sinon le texte
    // revient dans le champ, sélectionné, pour que le scan suivant le remplace (et la liste est filtrée dessus).
    var box = champRech.closest('.scan-box'), file = [], enCours = false, navigue = false, minuterieBox = null;
    function marquer(cls) {
      if (!box) { return; }
      box.classList.remove('ok', 'erreur'); void box.offsetWidth; box.classList.add(cls);
      clearTimeout(minuterieBox); minuterieBox = setTimeout(function () { box.classList.remove(cls); }, 900);
    }
    function echec(code, texte) {
      w.bip(false); marquer('erreur');
      if (texte) { w.toast(texte, 'warning'); }
      if (!file.length && champRech.value === '') { champRech.value = code; champRech.select(); filtrer(); }
    }
    function traiter() {
      if (enCours || navigue) { return; }
      var code = file.shift();
      if (code === undefined) { champRech.setAttribute('data-attente', '0'); return; }
      enCours = true;
      champRech.setAttribute('data-attente', String(file.length + 1));
      api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
        if (r.trouve && r.type === 'piece') {
          navigue = true; file.length = 0;
          w.bip(true); marquer('ok');
          w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(r.piece.id);
        } else if (r.trouve && r.type === 'emplacement') {
          echec(code, '« ' + code + ' » est le code de l\'emplacement « ' + r.emplacement.nom + ' », pas d\'une pièce.');
        } else {
          // code inconnu : on filtre quand même (c'est peut-être un bout de nom) ; si rien ne correspond, bip d'erreur et message clair
          if (file.length) { return; }          // d'autres scans attendent : on ne filtre pas sur celui-ci
          if (champRech.value === '') { champRech.value = code; champRech.select(); }
          else if (nettoyer(champRech.value) !== code) { return; }      // la personne tape autre chose : on n'y touche pas
          table.one('draw', function () {
            if (table.page.info().recordsDisplay === 0) { w.bip(false); marquer('erreur'); w.toast('Aucune pièce ne correspond à « ' + code + ' ».', 'warning'); }
            else { marquer('ok'); }
          });
          filtrer();
        }
      }).catch(function (err) { echec(code, msg(err)); })
        .then(function () { enCours = false; traiter(); });
    }
    function soumettre(code) {
      if (file.length >= 500) { w.bip(false); w.toast('Trop de scans en attente : patientez un instant.', 'warning'); return; }
      file.push(code); traiter();
    }
    champRech.addEventListener('keydown', function (e) {
      var enter = (e.key === 'Enter');
      // Tab : suffixe de certains lecteurs. Un Tab tapé par une personne (plus de 200 ms après la dernière touche) reste un Tab normal.
      var tab = (e.key === 'Tab' && !e.shiftKey && champRech.value.trim() !== '' && (Date.now() - dernierInput) < 200);
      if (!enter && !tab) { return; }
      e.preventDefault();
      clearTimeout(minuteur);
      var code = nettoyer(champRech.value);
      if (code === '') { if (enter) { filtrer(); } return; }
      champRech.value = '';
      soumettre(code);
    });
    focusRecherche();
  }

  // ===================================================================================
  //  Fiche d'une pièce
  // ===================================================================================
  function initFiche() {
    var pieceId = racine.getAttribute('data-piece-id');
    var code = racine.getAttribute('data-piece-code');

    var btnAct = q('#btn-activer');
    if (btnAct) {
      btnAct.addEventListener('click', function () {
        var actif = btnAct.getAttribute('data-vers') === '1';
        var pid = parseInt(pieceId, 10);
        function appliquer() {
          return envoyer([btnAct], function () { return api.post('app/action/piece_activer.php', { id: pid, actif: actif, confirmer: true }); })
            .then(function () { w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(pieceId) + '&msg=' + (actif ? 'reactivee' : 'desactivee'); })
            .catch(function (err) { w.toast(msg(err), 'danger'); });
        }
        if (actif) { appliquer(); return; }
        btnAct.disabled = true;      // évite de lancer deux fois la vérification (double clic)
        confirmerDesactivation(pid, code, btnAct).then(function (ok) { btnAct.disabled = false; if (ok) { appliquer(); } },
          function (err) { btnAct.disabled = false; w.toast(msg(err), 'danger'); });
      });
    }

    if (!q('#section-prix')) { return; }   // employé : aucune donnée de coût n'est même demandée

    var etat = null;
    var FPCT = new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

    /** Écart au coût moyen : « +1,25 $ (+9 776,3 %) » ; mêmes signes que les quantités (« + » et « - »), pourcentage au format fr-CA, espace insécable avant « % ». */
    function fmtEcart(e) {
      if (!e) { return '<span class="text-muted">—</span>'; }
      var n = parseFloat(e.ecart), p = Math.abs(parseFloat(e.pct));
      var cls = n < 0 ? 'cat-ecart-bon' : (n > 0 ? 'cat-ecart-mauvais' : '');
      var signe = n > 0 ? '+' : (n < 0 ? '-' : '');
      return '<span class="text-nowrap ' + cls + '">' + signe + esc(w.fmtArgent(String(Math.abs(n)), 4)) + ' (' + signe + esc(FPCT.format(p)) + ' %)</span>';
    }

    function rendre() {
      var cm = etat.couts.map(function (c) {
        return '<span class="mr-4 text-nowrap"><strong>' + esc(c.nom) + '</strong> : ' +
          (c.cout_moyen === null ? '<span class="text-muted">aucun coût connu</span>' : esc(w.fmtArgent(c.cout_moyen, 4))) + '</span>';
      }).join('');
      q('#couts-moyens').innerHTML = '<div class="mb-3"><span class="text-muted mr-2">Coût moyen :</span>' + (cm || '<span class="text-muted">—</span>') + '</div>';

      var zone = q('#prix-contenu');
      if (!etat.prix.length) {
        zone.innerHTML = '<p class="text-muted mb-0">Aucun prix de fournisseur enregistré pour cette pièce. Cliquez sur « Ajouter un prix ».</p>';
      } else {
        // une seule colonne d'écart (une ligne par entreprise) : le tableau tient sur une tablette
        var h = '<table class="table table-sm cat-table mb-0" id="table-prix"><thead><tr><th scope="col">Fournisseur</th><th scope="col" class="cat-th-souple">N° de pièce chez le fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Date du prix</th>';
        if (etat.couts.length) { h += '<th scope="col" class="cat-th-souple cat-ecarts">Écart vs coût moyen</th>'; }
        h += '<th scope="col" class="no-print"><span class="sr-only">Actions</span></th></tr></thead><tbody>';
        etat.prix.forEach(function (l) {
          h += '<tr data-fournisseur="' + esc(l.fournisseur_id) + '"><td class="cat-souple">' + esc(l.fournisseur) +
            (l.actif ? '' : ' <span class="badge badge-secondary">Désactivé</span>') +
            (l.meilleur ? ' <span class="badge badge-success">Meilleur prix</span>' : '') +
            (l.note ? '<div class="small text-muted">' + esc(l.note) + '</div>' : '') + '</td>' +
            '<td class="code">' + esc(l.no_fournisseur || '') + '</td>' +
            '<td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + '</td>' +
            '<td class="text-nowrap">' + esc(l.date_prix) + '</td>';
          if (etat.couts.length) {
            h += '<td class="cat-ecarts">' + etat.couts.map(function (c) {
              var e = l.ecarts[String(c.entreprise_id)];
              return e ? '<div><small class="text-muted">' + esc(c.nom) + '</small> ' + fmtEcart(e) + '</div>' : '';
            }).join('') + (Object.keys(l.ecarts).length ? '' : '<span class="text-muted">—</span>') + '</td>';
          }
          h += '<td class="text-nowrap text-right no-print col-actions">' +
            '<button type="button" class="btn btn-outline-primary btn-sm" data-action="modifier-prix" data-fournisseur="' + esc(l.fournisseur_id) + '" title="Modifier le prix"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier le prix de ' + esc(l.fournisseur) + '</span></button>' +
            '<button type="button" class="btn btn-outline-danger btn-sm" data-action="supprimer-prix" data-fournisseur="' + esc(l.fournisseur_id) + '" title="Retirer le prix"><i class="fas fa-trash" aria-hidden="true"></i><span class="sr-only">Retirer le prix de ' + esc(l.fournisseur) + '</span></button>' +
            '</td></tr>';
        });
        zone.innerHTML = h + '</tbody></table>';
      }

      var hz = q('#hist-contenu');
      if (!etat.historique.length) {
        hz.innerHTML = '<p class="text-muted mb-0">Aucun changement de prix enregistré.</p>';
      } else {
        var t = '<div class="table-responsive"><table class="table table-sm cat-table mb-0" id="table-hist-prix"><thead><tr><th scope="col">Date du prix</th><th scope="col">Fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Utilisateur</th></tr></thead><tbody>';
        etat.historique.forEach(function (l) {
          t += '<tr><td class="text-nowrap">' + esc(l.date_prix) + '</td><td class="cat-souple">' + esc(l.fournisseur || '') + '</td><td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + '</td><td>' + esc(l.utilisateur || '') + '</td></tr>';
        });
        hz.innerHTML = t + '</tbody></table></div>';
      }
    }

    function charger() {
      return api.get('app/ajax/piece_prix.php', { piece_id: pieceId }).then(function (r) { etat = r; rendre(); })
        .catch(function (err) {
          var d = document.createElement('div'); d.className = 'alert alert-danger mb-0'; d.setAttribute('role', 'alert');
          d.textContent = 'Impossible de charger les prix : ' + msg(err);
          var z = q('#prix-contenu'); z.innerHTML = ''; z.appendChild(d);
        });
    }

    // ---- fenêtre d'ajout / modification d'un prix ------------------------------------------------
    var formPrix = q('#form-prix'), selFour = q('#prix-fournisseur'), zoneErr = q('#prix-erreur');
    var modeEdition = false, ligneEditee = null, dateTouchee = false;
    function repliPrix() { return q('#btn-ajouter-prix'); }

    function ouvrirPrix(ligne) {
      effacerErreurs(formPrix);
      montrer(zoneErr, false);
      modeEdition = !!ligne;
      ligneEditee = ligne || null;
      dateTouchee = false;
      selFour.innerHTML = '';
      function option(id, nom) { var o = document.createElement('option'); o.value = String(id); o.textContent = nom; selFour.appendChild(o); }
      if (ligne) {
        option(ligne.fournisseur_id, ligne.fournisseur);
        selFour.disabled = true;
        q('#prix-montant').value = saisieMontant(ligne.prix);
        q('#prix-no').value = ligne.no_fournisseur || '';
        q('#prix-note').value = ligne.note || '';
        q('#modal-prix-titre').textContent = 'Modifier le prix — ' + ligne.fournisseur;
      } else {
        var deja = {};
        etat.prix.forEach(function (l) { deja[String(l.fournisseur_id)] = true; });
        var libres = etat.fournisseurs.filter(function (f) { return !deja[String(f.id)]; });
        if (!libres.length) {
          w.toast(etat.fournisseurs.length ? 'Tous les fournisseurs actifs ont déjà un prix pour cette pièce : modifiez un prix existant, ou créez d\'abord un fournisseur.' : 'Aucun fournisseur actif : créez d\'abord un fournisseur (menu Catalogue > Fournisseurs).', 'warning');
          return;
        }
        option('', '— Choisissez un fournisseur —');
        libres.forEach(function (f) { option(f.id, f.nom); });
        selFour.disabled = false;
        q('#prix-montant').value = '';
        q('#prix-no').value = '';
        q('#prix-note').value = '';
        q('#modal-prix-titre').textContent = 'Ajouter un prix';
      }
      var d = q('#prix-date'), auj = etat.aujourdhui || aujourdhui();      // date du serveur (le fuseau du poste peut différer)
      d.max = auj;
      // Modification : on garde la date du prix (changer la note ou le numéro n'en fait pas un prix « du jour ») ;
      // elle passe à aujourd'hui seulement si le montant change et que la date n'a pas été touchée (voir plus bas).
      d.value = (ligne && ligne.date_prix) ? ligne.date_prix : auj;
      ouvrirModal('#modal-prix', function () { return ligne ? q('#prix-montant') : selFour; }, repliPrix);
    }

    q('#prix-date').addEventListener('change', function () { dateTouchee = true; });
    q('#prix-montant').addEventListener('input', function () {
      if (!ligneEditee || dateTouchee) { return; }
      var saisi = q('#prix-montant').value.trim().replace(/\s*\$\s*$/, '').replace(',', '.'), avant = String(ligneEditee.prix);
      var change = saisi !== '' && !isNaN(parseFloat(saisi)) && parseFloat(saisi) !== parseFloat(avant);
      q('#prix-date').value = change ? (etat.aujourdhui || aujourdhui()) : (ligneEditee.date_prix || (etat.aujourdhui || aujourdhui()));
    });

    q('#btn-ajouter-prix').addEventListener('click', function () { if (etat) { ouvrirPrix(null); } });

    formPrix.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formPrix);
      montrer(zoneErr, false);
      var btn = q('#prix-enregistrer');
      var donnees = {
        piece_id: parseInt(pieceId, 10), fournisseur_id: parseInt(selFour.value, 10) || 0, prix: q('#prix-montant').value.trim(),
        no_fournisseur: q('#prix-no').value.trim(), date: q('#prix-date').value, note: q('#prix-note').value.trim()
      };
      var nomFour = selFour.options[selFour.selectedIndex] ? selFour.options[selFour.selectedIndex].text : '';
      envoyer([btn], function () { return api.post('app/action/prix_save.php', donnees); }, true)
        .then(function (r) {
          $('#modal-prix').modal('hide');
          w.toast('Prix de ' + w.fmtArgent(r.prix, 4) + ' enregistré pour « ' + nomFour + ' ».', 'success');
          return charger();
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          var cible = null;
          if (err.champ === 'fournisseur_id') { cible = selFour; }
          else if (err.champ === 'prix') { cible = q('#prix-montant'); }
          else if (err.champ === 'date') { cible = q('#prix-date'); }
          if (cible) { marquerInvalide(cible, zoneErr); cible.focus(); }
        });
    });

    q('#prix-contenu').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-action]');
      if (!b || !etat) { return; }
      var fid = b.getAttribute('data-fournisseur');
      var ligne = etat.prix.filter(function (l) { return String(l.fournisseur_id) === fid; })[0];
      if (!ligne) { return; }
      if (b.getAttribute('data-action') === 'modifier-prix') { ouvrirPrix(ligne); return; }
      confirmer('Retirer ce prix ?', 'Retirer le prix de « ' + ligne.fournisseur + ' » pour la pièce « ' + code + ' » ? L\'historique des prix est conservé.', 'Retirer le prix', 'cat-btn-danger', repliPrix).then(function (ok) {
        if (!ok) { return; }
        envoyer([b], function () { return api.post('app/action/prix_supprimer.php', { piece_id: parseInt(pieceId, 10), fournisseur_id: parseInt(fid, 10) }); }, true)
          .then(function () { w.toast('Prix de « ' + ligne.fournisseur + ' » retiré.', 'success'); return charger(); })
          .catch(function (err) { w.toast(msg(err), 'danger'); charger(); });
      });
    });

    charger();
  }

  // ===================================================================================
  //  Création / modification d'une pièce
  // ===================================================================================
  function initEdit() {
    var form = q('#form-piece');
    var pieceId = parseInt(form.getAttribute('data-piece-id'), 10) || 0;
    var donnees = JSON.parse(q('#donnees-piece').textContent);
    var alias = (donnees.alias || []).map(function (a) { return { code: a.code, type: a.type }; });
    var NOMS_TYPE = { fabricant: 'Fabricant', fournisseur: 'Fournisseur', autre: 'Autre' };
    var zoneErr = q('#erreur-form');
    var champCode = q('#f-code'), champAlias = q('#f-alias');
    var enCours = false, confirmeDesactivation = false;
    var boutons = [q('#btn-enregistrer'), q('#btn-enregistrer-nouveau')];

    /** Élément de formulaire d'un champ du serveur : name=…, ou le champ de saisie des alias (« codes »). */
    function champDe(champ) { return champ === 'codes' ? champAlias : form.querySelector('[name="' + champ + '"]'); }
    /** Les minimums (seuil_<id>) partagent un seul message sous le tableau. */
    function zoneDe(champ) { return q('[data-erreur-pour="' + (/^seuil_/.test(champ) ? 'seuils' : champ) + '"]', form); }
    function erreurChamp(champ, texte) {
      var zone = zoneDe(champ);
      if (zone) { zone.textContent = texte; zone.hidden = false; }
      marquerInvalide(champDe(champ), zone);
    }
    function effacer(champ) {
      var zone = zoneDe(champ);
      if (zone) { zone.hidden = true; zone.textContent = ''; }
      demarquerInvalide(champDe(champ));
    }

    // ---- code interne -------------------------------------------------------------------------
    champCode.addEventListener('input', function () {
      var a = champCode.selectionStart, b = champCode.selectionEnd;
      champCode.value = champCode.value.toUpperCase();
      try { champCode.setSelectionRange(a, b); } catch (e) { /* champ non texte */ }
      effacer('code');
    });
    champCode.addEventListener('blur', function () {
      var c = nettoyer(champCode.value);
      if (champCode.readOnly || c === '') { return; }
      api.get('app/ajax/piece_code_verifier.php', { code: c, role: 'interne', piece_id: pieceId })
        .then(function (r) { if (!r.disponible) { erreurChamp('code', r.message); } })
        .catch(function () { /* la vérification finale se fait à l'enregistrement */ });
    });
    var btnProp = q('#btn-proposer');
    if (btnProp) {
      btnProp.addEventListener('click', function () {
        envoyer([btnProp], function () { return api.get('app/ajax/piece_code_proposer.php'); }, true)
          .then(function (r) { champCode.value = r.code; effacer('code'); q('#f-nom').focus(); })
          .catch(function (err) { w.toast(msg(err), 'danger'); });
      });
    }
    ['nom', 'description', 'categorie_id', 'unite'].forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      if (el) { el.addEventListener('input', function () { effacer(n); }); el.addEventListener('change', function () { effacer(n); }); }
    });
    qa('.champ-seuil').forEach(function (el) { el.addEventListener('input', function () { demarquerInvalide(el); var z = zoneDe('seuils'); if (z && !qa('.champ-seuil.is-invalid').length) { z.hidden = true; z.textContent = ''; } }); });

    // ---- nouvelle catégorie sans quitter la page ---------------------------------------------------
    var blocCat = q('#bloc-nouvelle-categorie'), champNc = q('#nc-nom'), erreurNc = q('#nc-erreur');
    function ouvrirCat(oui) {
      montrer(blocCat, oui);
      montrer(erreurNc, false);
      if (oui) { champNc.value = ''; champNc.focus(); } else { q('#btn-nouvelle-categorie').focus(); }
    }
    q('#btn-nouvelle-categorie').addEventListener('click', function () { ouvrirCat(true); });
    q('#btn-annuler-categorie').addEventListener('click', function () { ouvrirCat(false); });
    function creerCategorie() {
      var nom = champNc.value.trim();
      if (nom === '') { alerte(erreurNc, 'Le nom de la catégorie est obligatoire.'); return; }
      montrer(erreurNc, false);
      var b = q('#btn-creer-categorie');
      envoyer([b], function () { return api.post('app/action/categorie_save.php', { nom: nom, description: '' }); }, true)
        .then(function (r) {
          var sel = q('#f-categorie');
          var o = document.createElement('option'); o.value = String(r.id); o.textContent = r.nom; sel.appendChild(o);
          sel.value = String(r.id);
          ouvrirCat(false);
          w.toast('Catégorie « ' + r.nom + ' » créée.', 'success');
        })
        .catch(function (err) { alerte(erreurNc, msg(err)); champNc.focus(); });
    }
    q('#btn-creer-categorie').addEventListener('click', creerCategorie);
    champNc.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); creerCategorie(); }
      else if (e.key === 'Escape') { e.preventDefault(); ouvrirCat(false); }
    });

    // ---- codes-barres alias ----------------------------------------------------------------------------
    function rendreAlias() {
      var ul = q('#liste-alias');
      ul.innerHTML = '';
      if (!alias.length) {
        var vide = document.createElement('li'); vide.className = 'text-muted'; vide.textContent = 'Aucun code-barres alias.'; ul.appendChild(vide); return;
      }
      alias.forEach(function (a, i) {
        var li = document.createElement('li');
        var badge = document.createElement('span'); badge.className = 'badge badge-info'; badge.textContent = NOMS_TYPE[a.type] || a.type;
        var c = document.createElement('span'); c.className = 'code'; c.textContent = a.code;
        var bt = document.createElement('button');
        bt.type = 'button'; bt.className = 'btn btn-outline-danger btn-sm';
        bt.setAttribute('aria-label', 'Retirer le code ' + a.code);
        bt.setAttribute('data-retirer', String(i));
        bt.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        bt.addEventListener('click', function () { alias.splice(i, 1); rendreAlias(); effacer('codes'); champAlias.focus(); });
        li.appendChild(badge); li.appendChild(document.createTextNode(' ')); li.appendChild(c); li.appendChild(bt);
        ul.appendChild(li);
      });
    }

    /** Ajoute un alias (Promise<boolean>). Le champ est déjà vidé par l'appelant : un autre scan peut arriver pendant la vérification. */
    function ajouterAlias(code) {
      effacer('codes');
      code = nettoyer(code);
      if (code === '') { return Promise.resolve(false); }
      var cle = code.toLowerCase();
      if (alias.some(function (a) { return a.code.toLowerCase() === cle; })) {
        erreurChamp('codes', 'Le code « ' + code + ' » est déjà dans la liste.'); return Promise.resolve(false);
      }
      if (code.toUpperCase() === nettoyer(champCode.value).toUpperCase()) {
        erreurChamp('codes', 'Le code « ' + code + ' » est déjà le code interne de cette pièce : il n\'a pas besoin d\'alias.'); return Promise.resolve(false);
      }
      return api.get('app/ajax/piece_code_verifier.php', { code: code, role: 'alias', piece_id: pieceId })
        .then(function (r) {
          if (!r.disponible) { erreurChamp('codes', r.message); return false; }
          alias.push({ code: r.code, type: q('#f-alias-type').value });
          rendreAlias();
          return true;
        })
        .catch(function (err) { erreurChamp('codes', msg(err)); return false; });
    }
    // Lecteur de codes-barres : le noyau vide le champ tout de suite et traite les scans à la file (Entrée ou Tab) :
    // deux scans en rafale ne se collent plus en un seul faux code.
    var lecteurAlias = w.scanner(champAlias, ajouterAlias, { focusInitial: false });
    q('#btn-alias').addEventListener('click', function () {
      var c = nettoyer(champAlias.value);
      champAlias.value = '';
      if (c === '') { champAlias.focus(); return; }
      ajouterAlias(c).then(function (ok) { w.bip(!!ok); champAlias.focus(); });
    });
    // Le type se choisit avant de scanner : le focus revient au champ du code (sinon le scan changerait le type par recherche à la frappe)
    // (au clavier, les flèches changent le type à chaque touche : on ne vole pas le focus dans ce cas)
    var typeAuClavier = false, selType = q('#f-alias-type');
    selType.addEventListener('keydown', function () { typeAuClavier = true; });
    selType.addEventListener('pointerdown', function () { typeAuClavier = false; });
    selType.addEventListener('change', function () { if (!typeAuClavier) { champAlias.focus(); } });
    champAlias.addEventListener('input', function () { effacer('codes'); });
    rendreAlias();

    // ---- enregistrement ----------------------------------------------------------------------------------
    function charge() {
      var seuils = qa('.champ-seuil').map(function (i) {
        return { entreprise_id: parseInt(i.getAttribute('data-entreprise'), 10), minimum: i.value.trim() };
      });
      var d = {
        code: nettoyer(champCode.value), nom: q('#f-nom').value.trim(), description: q('#f-description').value,
        categorie_id: q('#f-categorie').value, unite: q('#f-unite').value.trim(),
        codes: alias.map(function (a) { return { code: a.code, type: a.type }; }), seuils: seuils
      };
      if (pieceId) { d.id = pieceId; d.actif = q('#f-actif').checked; d.confirmer_desactivation = confirmeDesactivation; d.empreinte = donnees.empreinte || ''; }
      return d;
    }

    /** Erreur de validation : le message précis sous le champ fautif (marqué en rouge, lié par aria-describedby) ; le bandeau reste court. */
    function montrerErreur(err) {
      var champ = err.champ;
      if (champ === 'empreinte') {
        zoneErr.textContent = msg(err) + ' ';
        var a = document.createElement('a'); a.href = ''; a.className = 'alert-link'; a.textContent = 'Recharger la page';
        zoneErr.appendChild(a); zoneErr.hidden = false;
        zoneErr.scrollIntoView({ block: 'nearest' });
        return;
      }
      var el = champ ? champDe(champ) : null;
      if (el) {
        erreurChamp(champ, msg(err));
        zoneErr.textContent = 'Enregistrement impossible : corrigez le champ signalé en rouge.';
        zoneErr.hidden = false;
        if (typeof el.focus === 'function') { el.focus(); }
      } else {
        alerte(zoneErr, msg(err));
        zoneErr.scrollIntoView({ block: 'nearest' });
      }
    }

    function enregistrer(mode) {
      if (enCours) { return; }
      effacerErreurs(form);
      montrer(zoneErr, false);
      if (nettoyer(champAlias.value) !== '') {
        erreurChamp('codes', 'Un code-barres est saisi mais n\'a pas été ajouté : cliquez sur « Ajouter » (ou effacez-le).');
        champAlias.focus();
        return;
      }
      if (lecteurAlias.attente() > 0) {
        erreurChamp('codes', 'Un code-barres est en cours de vérification : réessayez dans un instant.');
        return;
      }
      enCours = true;
      envoyer(boutons, function () { return api.post('app/action/piece_save.php', charge()); })
        .then(function (r) {
          if (mode === 'nouvelle' && r.cree) { w.location.href = 'index.php?page=piece_edit&cree=' + encodeURIComponent(r.id); }
          else { w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(r.id) + '&msg=' + (r.cree ? 'cree' : 'modifie'); }
        })
        .catch(function (err) {
          enCours = false;
          if (err.champ === 'confirmation' && !confirmeDesactivation) {
            return confirmer('Désactiver la pièce ?', err.message, 'Désactiver quand même', 'cat-btn-danger', q('#btn-enregistrer')).then(function (ok) {
              if (ok) { confirmeDesactivation = true; enregistrer(mode); }
              else { q('#f-actif').checked = true; }
            });
          }
          montrerErreur(err);
        });
    }
    // Décocher « active » sur une pièce active : confirmation (avec le stock restant) avant d'enregistrer
    var actifInitial = form.getAttribute('data-actif') === '1', verification = false;
    function demarrer(mode) {
      if (pieceId && actifInitial && !q('#f-actif').checked && !confirmeDesactivation && !enCours) {
        if (verification) { return; }
        verification = true;
        confirmerDesactivation(pieceId, form.getAttribute('data-piece-code') || nettoyer(champCode.value), q('#btn-enregistrer'))
          .then(function (ok) { verification = false; if (ok) { confirmeDesactivation = true; enregistrer(mode); } else { q('#f-actif').checked = true; } },
            function (err) { verification = false; alerte(zoneErr, msg(err)); });
        return;
      }
      enregistrer(mode);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); demarrer('voir'); });
    var btnNouv = q('#btn-enregistrer-nouveau');
    if (btnNouv) { btnNouv.addEventListener('click', function () { demarrer('nouvelle'); }); }
    if (pieceId) {
      q('#f-actif').addEventListener('change', function () { confirmeDesactivation = false; });
    }

    if (!pieceId) { q('#f-code').focus(); } else { q('#f-nom').focus(); }
  }

  // ===================================================================================
  //  Fournisseurs
  // ===================================================================================
  function initFournisseurs() {
    var formF = q('#form-fournisseur'), zoneErr = q('#fournisseur-erreur');
    var idEdition = 0;
    function repli() { return q('#btn-nouveau'); }
    function texteSur(v, t) { return t === 'display' ? esc(v) : (v || ''); }

    var table = $('#table-fournisseurs').DataTable({
      ajax: {
        url: 'app/ajax/fournisseur_liste.php',
        data: function (d) { d.statut = q('#f-statut').value; },
        dataSrc: 'fournisseurs'
      },
      order: [[0, 'asc']],
      columns: [
        { data: 'nom', type: 'fr', render: function (v, type) {
            if (type !== 'display') { return v; }
            return '<a href="#" class="font-weight-bold" data-action="prix" title="Voir les prix de ce fournisseur">' + esc(v) + '</a>';
          } },
        // Contact et courriel : masqués sous 1200 px (tablette, menu ouvert) pour que les boutons d'action restent à l'écran ; ils se voient dans « Modifier »
        { data: 'contact', type: 'fr', defaultContent: '', className: 'd-none d-xl-table-cell', render: texteSur },
        { data: 'telephone', defaultContent: '', className: 'text-nowrap', render: texteSur },
        { data: 'courriel', type: 'fr', defaultContent: '', className: 'd-none d-xl-table-cell', render: texteSur },
        { data: 'nb_prix', className: 'nombre' },
        { data: 'actif', render: function (v, t) {
            if (t !== 'display') { return v ? 1 : 0; }
            return v ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-secondary">Désactivé</span>';
          } },
        { data: null, orderable: false, searchable: false, className: 'text-nowrap text-right no-print col-actions', render: function (v, t, row) {
            return '<button type="button" class="btn btn-outline-primary btn-sm" data-action="modifier" title="Modifier"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier ' + esc(row.nom) + '</span></button>' +
              '<button type="button" class="btn ' + (row.actif ? 'btn-outline-danger' : 'btn-outline-success') + ' btn-sm" data-action="activer" title="' + (row.actif ? 'Désactiver' : 'Réactiver') + '"><i class="fas ' + (row.actif ? 'fa-ban' : 'fa-undo') + '" aria-hidden="true"></i><span class="sr-only">' + (row.actif ? 'Désactiver ' : 'Réactiver ') + esc(row.nom) + '</span></button>';
          } }
      ],
      language: $.extend({}, LANG, { zeroRecords: 'Aucun fournisseur ne correspond.', emptyTable: 'Aucun fournisseur. Cliquez sur « Nouveau fournisseur » pour commencer.', search: 'Rechercher :' }),
      createdRow: function (tr) { tr.classList.add('cliquable'); }
    });
    rechercheSansAccents(table);
    surveillerChargement('#table-fournisseurs', 7);
    q('#f-statut').addEventListener('change', function () { table.ajax.reload(); });

    // ---- création / modification ------------------------------------------------------------------------
    function ouvrir(f, declencheur) {
      effacerErreurs(formF);
      montrer(zoneErr, false);
      idEdition = f ? f.id : 0;
      q('#modal-fournisseur-titre').textContent = f ? 'Modifier le fournisseur' : 'Nouveau fournisseur';
      q('#fo-nom').value = f ? f.nom : '';
      q('#fo-contact').value = f ? (f.contact || '') : '';
      q('#fo-telephone').value = f ? (f.telephone || '') : '';
      q('#fo-courriel').value = f ? (f.courriel || '') : '';
      q('#fo-adresse').value = f ? (f.adresse || '') : '';
      q('#fo-notes').value = f ? (f.notes || '') : '';
      ouvrirModal('#modal-fournisseur', '#fo-nom', repli, declencheur);
    }
    q('#btn-nouveau').addEventListener('click', function () { ouvrir(null); });

    formF.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formF);
      montrer(zoneErr, false);
      var d = {
        id: idEdition, nom: q('#fo-nom').value.trim(), contact: q('#fo-contact').value.trim(), telephone: q('#fo-telephone').value.trim(),
        courriel: q('#fo-courriel').value.trim(), adresse: q('#fo-adresse').value.trim(), notes: q('#fo-notes').value
      };
      envoyer([q('#fournisseur-enregistrer')], function () { return api.post('app/action/fournisseur_save.php', d); }, true)
        .then(function (r) {
          $('#modal-fournisseur').modal('hide');
          w.toast('Fournisseur « ' + d.nom + ' » ' + (r.cree ? 'créé.' : 'modifié.'), 'success');
          table.ajax.reload(null, false);
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          var map = { nom: '#fo-nom', courriel: '#fo-courriel', contact: '#fo-contact', telephone: '#fo-telephone', adresse: '#fo-adresse', notes: '#fo-notes' };
          if (err.champ && map[err.champ]) { marquerInvalide(q(map[err.champ]), zoneErr); q(map[err.champ]).focus(); }
        });
    });

    // ---- prix de ce fournisseur ----------------------------------------------------------------------------
    function voirPrix(f, declencheur) {
      var zone = q('#prix-fournisseur-contenu');
      q('#modal-prix-fournisseur-titre').textContent = 'Prix de ce fournisseur — ' + f.nom;
      zone.innerHTML = '<span class="text-muted">Chargement…</span>';
      ouvrirModal('#modal-prix-fournisseur', null, repli, declencheur);
      api.get('app/ajax/fournisseur_prix.php', { id: f.id }).then(function (r) {
        if (!r.prix.length) { zone.innerHTML = '<p class="mb-0 text-muted">Aucun prix enregistré pour ce fournisseur. Les prix s\'ajoutent depuis la fiche d\'une pièce.</p>'; return; }
        var h = '<div class="table-responsive"><table class="table table-sm cat-table mb-0" id="table-prix-fournisseur"><thead><tr><th scope="col">Pièce</th><th scope="col" class="cat-th-souple">N° de pièce chez le fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Date du prix</th></tr></thead><tbody>';
        r.prix.forEach(function (l) {
          h += '<tr><td class="cat-souple"><a class="code" href="index.php?page=piece_voir&amp;id=' + esc(l.piece_id) + '">' + esc(l.code) + '</a> ' + esc(l.nom) +
            (l.actif ? '' : ' <span class="badge badge-secondary">Désactivée</span>') + '</td><td class="code">' + esc(l.no_fournisseur || '') + '</td>' +
            '<td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + ' <small class="text-muted">/ ' + esc(l.unite) + '</small></td><td class="text-nowrap">' + esc(l.date_prix) + '</td></tr>';
        });
        zone.innerHTML = h + '</tbody></table></div>';
      }).catch(function (err) {
        var d = document.createElement('div'); d.className = 'alert alert-danger mb-0'; d.setAttribute('role', 'alert'); d.textContent = msg(err);
        zone.innerHTML = ''; zone.appendChild(d);
      });
    }

    $('#table-fournisseurs tbody').on('click', 'tr', function (e) {
      var ligne = table.row(this).data();
      if (!ligne) { return; }
      var b = $(e.target).closest('button[data-action]')[0];
      if (b) {
        var action = b.getAttribute('data-action');
        if (action === 'modifier') { ouvrir(ligne, b); }
        else if (action === 'activer') {
          var activer = !ligne.actif;
          var go = activer ? Promise.resolve(true) : confirmer('Désactiver le fournisseur ?', 'Désactiver « ' + ligne.nom + ' » ? Il n\'apparaîtra plus dans les listes de saisie ; ses prix et son historique sont conservés.', 'Désactiver', 'cat-btn-danger', repli);
          go.then(function (ok) {
            if (!ok) { return; }
            envoyer([b], function () { return api.post('app/action/fournisseur_activer.php', { id: ligne.id, actif: activer }); }, true)
              .then(function () { w.toast('Fournisseur « ' + ligne.nom + ' » ' + (activer ? 'réactivé.' : 'désactivé.'), 'success'); table.ajax.reload(null, false); })
              .catch(function (err) { w.toast(msg(err), 'danger'); });
          });
        }
        return;
      }
      if ($(e.target).closest('a, input').length && !$(e.target).closest('a[data-action="prix"]').length) { return; }
      e.preventDefault();
      voirPrix(ligne, $(this).find('a[data-action="prix"]')[0]);
    });
  }

  // ===================================================================================
  //  Catégories
  // ===================================================================================
  function initCategories() {
    var formC = q('#form-categorie'), zoneErr = q('#categorie-erreur');
    var idEdition = 0;
    function repli() { return q('#btn-nouvelle'); }

    var table = $('#table-categories').DataTable({
      ajax: { url: 'app/ajax/categorie_liste.php', dataSrc: 'categories' },
      order: [[0, 'asc']],
      columns: [
        { data: 'nom', type: 'fr', render: function (v, t) { return t === 'display' ? esc(v) : v; } },
        { data: 'description', type: 'fr', defaultContent: '', render: function (v, t) { return t === 'display' ? esc(v) : (v || ''); } },
        { data: 'nb_pieces', className: 'nombre', render: function (v, t, row) {
            if (t !== 'display') { return v; }
            return v > 0 ? '<a class="cat-lien-cible" href="index.php?page=pieces&amp;statut=toutes&amp;categorie_id=' + esc(row.id) + '" title="Voir ces pièces">' + esc(v) + '</a>' : '0';
          } },
        { data: null, orderable: false, searchable: false, className: 'text-nowrap text-right no-print col-actions', render: function (v, t, row) {
            return '<button type="button" class="btn btn-outline-primary btn-sm" data-action="modifier" title="Modifier"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier ' + esc(row.nom) + '</span></button>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="supprimer" title="Supprimer"><i class="fas fa-trash" aria-hidden="true"></i><span class="sr-only">Supprimer ' + esc(row.nom) + '</span></button>';
          } }
      ],
      language: $.extend({}, LANG, { zeroRecords: 'Aucune catégorie ne correspond.', emptyTable: 'Aucune catégorie. Cliquez sur « Nouvelle catégorie » pour commencer.' })
    });
    rechercheSansAccents(table);
    surveillerChargement('#table-categories', 4);

    function ouvrir(c, declencheur) {
      effacerErreurs(formC);
      montrer(zoneErr, false);
      idEdition = c ? c.id : 0;
      q('#modal-categorie-titre').textContent = c ? 'Modifier la catégorie' : 'Nouvelle catégorie';
      q('#ca-nom').value = c ? c.nom : '';
      q('#ca-description').value = c ? (c.description || '') : '';
      ouvrirModal('#modal-categorie', '#ca-nom', repli, declencheur);
    }
    q('#btn-nouvelle').addEventListener('click', function () { ouvrir(null); });

    formC.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formC);
      montrer(zoneErr, false);
      var d = { id: idEdition, nom: q('#ca-nom').value.trim(), description: q('#ca-description').value.trim() };
      envoyer([q('#categorie-enregistrer')], function () { return api.post('app/action/categorie_save.php', d); }, true)
        .then(function (r) {
          $('#modal-categorie').modal('hide');
          w.toast('Catégorie « ' + r.nom + ' » ' + (r.cree ? 'créée.' : 'modifiée.'), 'success');
          table.ajax.reload(null, false);
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          if (err.champ === 'nom') { marquerInvalide(q('#ca-nom'), zoneErr); q('#ca-nom').focus(); }
        });
    });

    $('#table-categories tbody').on('click', 'button[data-action]', function () {
      var b = this, ligne = table.row($(b).closest('tr')).data();
      if (!ligne) { return; }
      if (b.getAttribute('data-action') === 'modifier') { ouvrir(ligne, b); return; }
      if (ligne.nb_pieces > 0) {
        // message long avec une action à faire : il reste affiché 12 secondes
        w.toast('Impossible de supprimer la catégorie « ' + ligne.nom + ' » : ' + (ligne.nb_pieces === 1 ? '1 pièce l\'utilise encore' : ligne.nb_pieces + ' pièces l\'utilisent encore') + '. Changez d\'abord la catégorie de ' + (ligne.nb_pieces === 1 ? 'cette pièce' : 'ces pièces') + '.', 'warning', 12000);
        return;
      }
      confirmer('Supprimer la catégorie ?', 'Supprimer définitivement la catégorie « ' + ligne.nom + ' » ? Aucune pièce ne l\'utilise.', 'Supprimer', 'cat-btn-danger', repli).then(function (ok) {
        if (!ok) { return; }
        envoyer([b], function () { return api.post('app/action/categorie_supprimer.php', { id: ligne.id }); }, true)
          .then(function () { w.toast('Catégorie « ' + ligne.nom + ' » supprimée.', 'success'); table.ajax.reload(null, false); })
          .catch(function (err) { w.toast(msg(err), 'danger', 12000); table.ajax.reload(null, false); });
      });
    });
  }

  // ===================================================================================
  var INIT = { pieces: initPieces, piece_voir: initFiche, piece_edit: initEdit, fournisseurs: initFournisseurs, categories: initCategories };
  if (INIT[page]) { $(function () { INIT[page](); }); }
})(window, jQuery);
