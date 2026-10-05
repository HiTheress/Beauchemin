/* Stock, historique des mouvements, pièces sous le minimum (module D2).
 * Un seul fichier ; la page est reconnue par l'attribut data-d2 de sa racine : stock | historique | sous_minimum.
 * Règles : toute valeur insérée dans innerHTML passe par esc() (les tableaux serveur arrivent déjà échappés : on les affiche tels quels,
 * sans les réécrire) ; quantités et montants restent des chaînes décimales (parseFloat seulement pour l'affichage, le tri et le signe) ;
 * les filtres sont des « !!bool » (jamais de bascule sur une valeur non booléenne) ; aucun rappel n'est déclenché pendant la création
 * d'un composant (les écouteurs sont posés APRÈS l'initialisation).
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-d2]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-d2');
  if (page !== 'stock' && page !== 'historique' && page !== 'sous_minimum') { return; }

  // ===================================================================================
  //  Utilitaires communs
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  /** Message affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez.';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  function entier(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  function debounce(fn, ms) {
    var t = null;
    var f = function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); };
    f.annuler = function () { clearTimeout(t); };
    return f;
  }
  function pointeurFin() { return !!(w.matchMedia && w.matchMedia('(pointer: fine)').matches); }
  function nombre(s) { var n = parseFloat(s); return isNaN(n) ? 0 : n; }
  function rQte(d) { return (d === null || d === undefined || d === '') ? '' : w.fmtQte(d); }
  function rArgent(d, dec) { return (d === null || d === undefined || d === '') ? '' : w.fmtArgent(d, dec); }

  // Session expirée pendant le chargement d'un tableau : retour à la connexion (comme api.get / api.post)
  $(document).ajaxError(function (e, xhr) { if (xhr && xhr.status === 401) { w.location.href = 'login.php'; } });

  // Erreurs de DataTables : message en français (le texte de la bibliothèque est technique et en anglais).
  // Les erreurs de chargement sont déjà expliquées par le serveur (voir sur xhr.dt plus bas).
  $.fn.dataTable.ext.errMode = function (settings, aide, message) {
    if (/ajax error|invalid json/i.test(String(message))) { return; }
    w.toast('Impossible d\'afficher le tableau. Rechargez la page ou réessayez dans un instant.', 'danger');
    if (w.console && w.console.error) { w.console.error(message); }
  };

  /**
   * Tableau serveur : sans recherche intégrée (nos propres champs), message d'erreur en français tiré de la réponse du serveur.
   * `onReponse(json)` est appelé à chaque réponse valide (compteurs, retour de scan).
   */
  function tableauServeur(sel, opts, onReponse) {
    var $t = $(sel);
    var t = $t.DataTable($.extend({
      serverSide: true, processing: true, searching: false, autoWidth: false, pageLength: 25
    }, opts));
    $t.on('xhr.dt', function (e, settings, json, xhr) {
      if (json) { if (onReponse) { onReponse(json); } return; }
      if (xhr && xhr.status === 401) { return; }   // géré par ajaxError (retour à la connexion)
      var m = 'Impossible de charger le tableau. Réessayez dans un instant.';
      if (xhr && xhr.status === 0) { m = 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez.'; }
      try { var j = JSON.parse(xhr.responseText); if (j && j.erreur) { m = j.erreur; } } catch (x) { /* réponse non JSON */ }
      w.toast(m, 'danger');
    });
    return t;
  }

  /** Reconstruit la liste des emplacements d'après l'entreprise choisie (les options viennent de la page : texte déjà échappé). */
  function liaisonEmplacements($ent, $emp) {
    var tous = qa('option[data-ent]', $emp).map(function (o) {
      return { id: o.value, ent: o.getAttribute('data-ent'), entNom: o.getAttribute('data-ent-nom') || '', nom: o.getAttribute('data-nom') || o.textContent };
    });
    var multi = !!($ent && $ent.options.length > 2);   // « Toutes » + au moins deux entreprises
    return function () {
      var ent = $ent ? $ent.value : '';
      var courant = $emp.value;
      var h = '<option value="">Tous les emplacements</option>';
      tous.forEach(function (o) {
        if (ent !== '' && o.ent !== ent) { return; }
        h += '<option value="' + w.esc(o.id) + '">' + w.esc(ent === '' && multi ? o.nom + ' — ' + o.entNom : o.nom) + '</option>';
      });
      $emp.innerHTML = h;
      var existe = qa('option', $emp).some(function (o) { return o.value === courant; });
      $emp.value = existe ? courant : '';
    };
  }

  // ===================================================================================
  //  STOCK
  // ===================================================================================
  function pageStock() {
    var couts = racine.getAttribute('data-couts') === '1';
    var defautEnt = racine.getAttribute('data-defaut-entreprise');
    defautEnt = (defautEnt && defautEnt !== '0') ? defautEnt : '';
    var vue = racine.getAttribute('data-vue-initiale') === 'piece' ? 'piece' : 'emplacement';

    var elQ = q('#f-recherche'), elEnt = q('#f-entreprise'), elEmp = q('#f-emplacement'), elCat = q('#f-categorie'), elZero = q('#f-zero');
    var majEmplacements = liaisonEmplacements(elEnt, elEmp);
    majEmplacements();
    var scanEnCours = null;

    function filtres() {
      return {
        vue: vue,
        entreprise_id: elEnt ? elEnt.value : '',
        emplacement_id: vue === 'emplacement' ? elEmp.value : '',
        categorie_id: elCat.value,
        zero: elZero.checked ? 1 : 0,
        q: elQ.value.trim()
      };
    }

    var colonnes = [
      { data: 'code' },
      { data: 'nom' },
      { data: 'categorie', defaultContent: '' },
      { data: 'entreprise' },
      { data: 'emplacement', defaultContent: '', visible: vue === 'emplacement' },
      { data: 'quantite', className: 'nombre', render: function (d) { return w.esc(rQte(d)); } },
      { data: 'unite' },
      { data: 'minimum', className: 'nombre', defaultContent: '', visible: vue === 'piece', render: function (d) { return w.esc(rQte(d)); } }
    ];
    if (couts) {
      colonnes.push({ data: 'cout_moyen', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d, 4)); } });
      colonnes.push({ data: 'valeur', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d)); } });
    }

    var table = tableauServeur('#table-stock', {
      order: [[0, 'asc']],
      columns: colonnes,
      ajax: { url: 'app/ajax/stock_data.php', type: 'POST', data: function (d) { $.extend(d, filtres()); } },
      createdRow: function (row, data) { if (data.sous_min) { row.classList.add('sk-bas'); } },
      language: { zeroRecords: 'Aucune ligne de stock ne correspond à ces filtres. Essayez « Afficher les quantités à zéro » ou cliquez sur « Effacer ».', emptyTable: 'Aucune ligne de stock ne correspond à ces filtres. Essayez « Afficher les quantités à zéro » ou cliquez sur « Effacer ».' }
    }, function (json) {
      if (scanEnCours !== null) {   // retour de scan : bip de succès / d'échec
        var trouve = entier(json.recordsFiltered) > 0;
        w.bip(trouve);
        if (!trouve) { w.toast('Aucune pièce ne correspond à « ' + scanEnCours + ' ».', 'warning'); }
        scanEnCours = null;
      }
    });

    // Lien d'export : mêmes filtres que le tableau
    $(q('#table-stock')).on('preXhr.dt', function () { q('#btn-export').setAttribute('href', 'app/ajax/stock_export.php?' + $.param(filtres())); });
    q('#btn-export').setAttribute('href', 'app/ajax/stock_export.php?' + $.param(filtres()));

    function majVue() {
      qa('[data-vue]', racine).forEach(function (b) {
        var actif = b.getAttribute('data-vue') === vue;
        b.setAttribute('aria-pressed', actif ? 'true' : 'false');
        if (actif) { b.classList.add('active'); } else { b.classList.remove('active'); }
      });
      var piece = vue === 'piece';
      table.column(4).visible(!piece);
      table.column(7).visible(piece);
      $(table.column(5).header()).text(piece ? 'Quantité totale' : 'Quantité');
      elEmp.disabled = piece;
      q('#sk-aide-vue').textContent = piece
        ? 'Une ligne par pièce et par entreprise : le total de tous les emplacements de l\'entreprise. Le filtre « Emplacement » ne s\'applique pas à cet affichage.'
        : 'Une ligne par pièce et par emplacement (entrepôts, boutiques et cubes de service).';
    }
    majVue();

    var recharger = debounce(function () { table.ajax.reload(); }, 300);

    // Écouteurs posés après la création (aucun rappel pendant l'initialisation)
    $(elQ).on('input', recharger);
    $(elQ).on('keydown', function (e) {
      if (e.key !== 'Enter') { return; }
      e.preventDefault();
      recharger.annuler();
      var code = elQ.value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
      if (code === '') { table.ajax.reload(); return; }
      scanEnCours = code;   // retour sonore selon le résultat
      table.ajax.reload();
    });
    if (elEnt) { $(elEnt).on('change', function () { majEmplacements(); table.ajax.reload(); }); }
    $(elEmp).on('change', function () { table.ajax.reload(); });
    $(elCat).on('change', function () { table.ajax.reload(); });
    $(elZero).on('change', function () { table.ajax.reload(); });
    qa('[data-vue]', racine).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-vue') === 'piece' ? 'piece' : 'emplacement';
        if (v === vue) { return; }
        vue = v;
        majVue();
        table.ajax.reload();
      });
    });
    q('#f-effacer').addEventListener('click', function () {
      elQ.value = '';
      if (elEnt) { elEnt.value = defautEnt; if (elEnt.value !== defautEnt) { elEnt.value = ''; } }
      majEmplacements();
      elEmp.value = '';
      elCat.value = '';
      elZero.checked = false;
      table.ajax.reload();
      elQ.focus();
    });
    if (pointeurFin()) { elQ.focus(); }   // souris/clavier + lecteur : prêt à scanner (pas de clavier à l'écran sur tablette)
  }

  // ===================================================================================
  //  HISTORIQUE DES MOUVEMENTS
  // ===================================================================================
  function pageHistorique() {
    var couts = racine.getAttribute('data-couts') === '1';
    var multi = racine.getAttribute('data-multi') === '1';
    var defautEnt = racine.getAttribute('data-defaut-entreprise');
    defautEnt = (defautEnt && defautEnt !== '0') ? defautEnt : '';
    var aujourdhui = racine.getAttribute('data-aujourdhui') || '';

    var elEnt = q('#f-entreprise'), elEmp = q('#f-emplacement'), elType = q('#f-type'), elDu = q('#f-du'), elAu = q('#f-au'),
        elUtil = q('#f-utilisateur'), elNum = q('#f-numero');
    var $piece = $('#f-piece');
    var majEmplacements = liaisonEmplacements(elEnt, elEmp);
    majEmplacements();

    $piece.select2({
      placeholder: 'Toutes les pièces', allowClear: true,
      ajax: {
        url: 'app/ajax/pieces_recherche.php', dataType: 'json', delay: 250,
        data: function (p) { return { q: p.term || '' }; },
        processResults: function (r) {
          return { results: ((r && r.pieces) || []).map(function (x) { return { id: x.id, text: x.code + ' — ' + x.nom }; }) };
        }
      }
    });

    function bornesDates() {   // « du » ne dépasse pas « au », ni aujourd'hui
      elDu.max = elAu.value || aujourdhui;
      elAu.min = elDu.value || '';
    }
    bornesDates();

    function filtres() {
      return {
        entreprise_id: elEnt ? elEnt.value : '',
        piece_id: $piece.val() || '',
        emplacement_id: elEmp.value,
        type: elType.value,
        du: elDu.value,
        au: elAu.value,
        utilisateur_id: elUtil.value,
        numero: elNum.value.trim()
      };
    }

    function rSigne(d) {
      if (d === null || d === undefined || d === '') { return ''; }
      var n = nombre(d);
      return '<span class="font-weight-bold ' + (n > 0 ? 'sk-pos' : (n < 0 ? 'sk-neg' : '')) + '">' + w.esc((n > 0 ? '+' : '') + w.fmtQte(d)) + '</span>';
    }

    var colonnes = [
      { data: 'ordre', visible: false, searchable: false },
      { data: 'date', orderData: 0, className: 'sk-date' },
      { data: 'numero' },
      { data: 'type' },
      { data: 'code', render: function (d, t, l) { return t === 'display' ? d + '<br><small>' + l.nom + '</small>' : d; } }   // code et nom : déjà des liens échappés par le serveur
    ];
    if (multi) { colonnes.push({ data: 'entreprise' }); }
    colonnes.push({ data: 'emplacement' });
    colonnes.push({ data: 'quantite', className: 'nombre', render: rSigne });
    colonnes.push({ data: 'utilisateur', defaultContent: '' });
    if (couts) {
      colonnes.push({ data: 'cout_unitaire', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d, 4)); } });
      colonnes.push({ data: 'valeur', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d)); } });
    }
    colonnes.push({ data: 'mention', orderable: false, defaultContent: '' });

    var table = tableauServeur('#table-historique', {
      order: [[1, 'desc']],   // date et heure, le plus récent d'abord (trie par identifiant : chronologique)
      columns: colonnes,
      ajax: { url: 'app/ajax/historique_data.php', type: 'POST', data: function (d) { $.extend(d, filtres()); } },
      createdRow: function (row, data) { if (data.annulation) { row.classList.add('sk-annulation'); } },
      language: { zeroRecords: 'Aucun mouvement ne correspond à ces filtres.', emptyTable: 'Aucun mouvement ne correspond à ces filtres.' }
    });

    $(q('#table-historique')).on('preXhr.dt', function () { q('#btn-export').setAttribute('href', 'app/ajax/historique_export.php?' + $.param(filtres())); });
    q('#btn-export').setAttribute('href', 'app/ajax/historique_export.php?' + $.param(filtres()));

    var recharger = debounce(function () { table.ajax.reload(); }, 300);
    if (elEnt) { $(elEnt).on('change', function () { majEmplacements(); table.ajax.reload(); }); }
    $piece.on('change', function () { table.ajax.reload(); });
    [elEmp, elType, elUtil].forEach(function (el) { $(el).on('change', function () { table.ajax.reload(); }); });
    [elDu, elAu].forEach(function (el) { $(el).on('change', function () { bornesDates(); table.ajax.reload(); }); });
    $(elNum).on('input', recharger);
    $(elNum).on('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); recharger.annuler(); table.ajax.reload(); } });
    q('#f-effacer').addEventListener('click', function () {
      $piece.val(null).trigger('change.select2');
      if (elEnt) { elEnt.value = defautEnt; if (elEnt.value !== defautEnt) { elEnt.value = ''; } }
      majEmplacements();
      elEmp.value = ''; elType.value = ''; elDu.value = ''; elAu.value = ''; elUtil.value = ''; elNum.value = '';
      bornesDates();
      table.ajax.reload();
    });
  }

  // ===================================================================================
  //  PIÈCES SOUS LE MINIMUM
  // ===================================================================================
  function pageSousMinimum() {
    var gest = racine.getAttribute('data-gest') === '1';
    var table = null;
    var elPortee = q('#sm-portee'), elErreur = q('#sm-erreur'), elVide = q('#sm-vide'), elTableau = q('#sm-tableau'), btn = q('#sm-actualiser');
    var no = 0;

    function lien(l) {
      var h = 'index.php?page=reception&piece_id=' + entier(l.piece_id);
      if (l.emplacement_reception_id) { h += '&emplacement_id=' + entier(l.emplacement_reception_id); }
      return h;
    }
    var colonnes = [
      { data: 'code', render: function (d, t, l) { return t === 'display' ? '<a class="code font-weight-bold" href="index.php?page=piece_voir&amp;id=' + entier(l.piece_id) + '">' + w.esc(d) + '</a>' : d; } },
      { data: 'nom', render: function (d, t, l) { return t === 'display' ? '<a href="index.php?page=piece_voir&amp;id=' + entier(l.piece_id) + '">' + w.esc(d) + '</a>' : d; } },
      { data: 'entreprise', render: function (d, t) { return t === 'display' ? w.esc(d) : d; } },
      { data: 'quantite', className: 'nombre', render: function (d, t) { return t === 'display' ? w.esc(rQte(d)) : nombre(d); } },
      { data: 'minimum', className: 'nombre', render: function (d, t) { return t === 'display' ? w.esc(rQte(d)) : nombre(d); } },
      { data: 'manque', className: 'nombre', render: function (d, t) { return t === 'display' ? '<strong class="sk-neg">' + w.esc(rQte(d)) + '</strong>' : nombre(d); } },
      { data: 'unite', render: function (d, t) { return t === 'display' ? w.esc(d) : d; } }
    ];
    if (gest) {
      colonnes.push({
        data: null, orderable: false, searchable: false, className: 'no-print text-right',
        render: function (d, t, l) { return t === 'display' ? '<a class="btn btn-sm btn-outline-primary sk-btn-recevoir" href="' + w.esc(lien(l)) + '">Réceptionner</a>' : ''; }
      });
    }

    function rendre(r) {
      var lignes = r.lignes || [];
      var ents = r.entreprises || [];
      elPortee.textContent = (ents.length > 1 ? 'Entreprises : ' : 'Entreprise : ') + (ents.join(', ') || '—') + ' — ' +
        (lignes.length === 0 ? 'aucune pièce sous le minimum' : (lignes.length === 1 ? '1 pièce sous le minimum' : lignes.length + ' pièces sous le minimum'));
      montrer(elErreur, false);
      montrer(elVide, lignes.length === 0);
      montrer(elTableau, lignes.length > 0);
      if (!table) {
        table = $('#table-sous-minimum').DataTable({
          data: lignes, columns: colonnes, autoWidth: false, pageLength: 50, order: [[5, 'desc'], [0, 'asc']],
          language: { zeroRecords: 'Aucune pièce ne correspond à cette recherche.', emptyTable: 'Aucune pièce sous le minimum.' }
        });
      } else {
        table.clear().rows.add(lignes).draw();
      }
    }

    function charger() {
      var courant = ++no;
      btn.disabled = true;
      return w.api.get('app/ajax/sous_minimum_data.php').then(function (r) {
        if (courant === no) { rendre(r); }
      }).catch(function (err) {
        if (courant !== no) { return; }
        elErreur.textContent = 'Impossible de charger la liste. ' + msg(err);
        montrer(elErreur, true);
        elPortee.textContent = '';
      }).then(function () { if (courant === no) { btn.disabled = false; } });
    }
    btn.addEventListener('click', function () { charger(); });
    charger();
  }

  if (page === 'stock') { pageStock(); }
  else if (page === 'historique') { pageHistorique(); }
  else { pageSousMinimum(); }
})(window, jQuery);
