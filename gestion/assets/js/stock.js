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
  // Les erreurs de chargement sont expliquées par tableauServeur() (UN seul message par erreur).
  $.fn.dataTable.ext.errMode = function (settings, aide, message) {
    if (/ajax error|invalid json/i.test(String(message))) { return; }
    w.toast('Impossible d\'afficher le tableau. Rechargez la page ou réessayez dans un instant.', 'danger');
    if (w.console && w.console.error) { w.console.error(message); }
  };

  /**
   * Tableau serveur : sans recherche intégrée (nos propres champs).
   * `onReponse(json)` est appelé à chaque réponse valide (compteurs, retour de scan).
   * Erreur HTTP : UN SEUL message, celui du serveur quand il en donne un (« La date de début doit précéder la date de fin. ») ;
   * le gestionnaire générique d'app.js (message sans détail) n'est alors pas appelé (stopPropagation). Réseau coupé : app.js affiche
   * déjà son message sur l'événement xhr.dt sans réponse, on n'en ajoute pas un second.
   */
  function tableauServeur(sel, opts, onReponse) {
    var $t = $(sel);
    var t = $t.DataTable($.extend({
      serverSide: true, processing: true, searching: false, autoWidth: false, pageLength: 25
    }, opts));
    $t.on('xhr.dt', function (e, settings, json) { if (json && onReponse) { onReponse(json); } });
    $t.on('error.dt', function (e, settings) {
      e.stopPropagation();
      var x = settings && settings.jqXHR;
      if (x && x.status === 401) { w.location.href = 'login.php'; return; }
      var m = (x && x.status === 403) ? 'Accès refusé. Rechargez la page.' : 'Impossible de charger le tableau. Réessayez dans un instant.';
      try { var j = JSON.parse(x.responseText); if (j && j.erreur) { m = j.erreur; } } catch (z) { /* réponse non JSON */ }
      w.toast(m, 'danger');
    });
    return t;
  }

  /** Écrit les filtres dans l'adresse de la page (sans recharger) : le bouton Retour du navigateur retrouve la même vue. */
  function ecrireAdresse(params) {
    try { if (w.history && w.history.replaceState) { w.history.replaceState(null, '', w.location.pathname + '?' + $.param(params)); } } catch (x) { /* adresse non modifiable : tant pis */ }
  }
  /**
   * Changer l'entreprise de la barre du haut recharge la page : les filtres écrits dans l'adresse (dont l'ancienne entreprise) seraient
   * relus et l'emporteraient sur ce choix. On repart donc de l'adresse sans filtres, comme avant, avant ce rechargement.
   */
  function reinitialiserAdresseSiBarreChangee(nomPage) {
    $('#entreprise-courante').on('change', function () { ecrireAdresse({ page: nomPage }); });
  }
  function texteChoisi(el) { return (el && el.selectedIndex >= 0 && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : ''; }
  /** Résumé des filtres, visible seulement à l'impression (les champs de filtre ne s'impriment pas). */
  function ecrireResume(titre, parts) {
    var el = q('#sk-resume');
    if (el) { el.textContent = titre + (parts.length ? ' — ' + parts.join(' · ') : ''); }
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
    var multi = racine.getAttribute('data-multi') === '1';   // plusieurs entreprises : on précise l'entreprise sous l'emplacement
    var defautEnt = racine.getAttribute('data-defaut-entreprise');
    defautEnt = (defautEnt && defautEnt !== '0') ? defautEnt : '';
    var vue = racine.getAttribute('data-vue-initiale') === 'piece' ? 'piece' : 'emplacement';

    var elQ = q('#f-recherche'), elEnt = q('#f-entreprise'), elEmp = q('#f-emplacement'), elCat = q('#f-categorie'), elZero = q('#f-zero');
    var majEmplacements = liaisonEmplacements(elEnt, elEmp);
    majEmplacements();

    // Lecteur de codes-barres. Après Entrée (ou Tab), le texte reste affiché mais SÉLECTIONNÉ : le code suivant le remplace.
    var exact = false;        // vrai après un scan : un code interne ou un code-barres exact ne ramène que sa pièce
    var sale = false;         // le texte a changé depuis le dernier scan (Tab ne « scanne » qu'alors : jamais de piège au clavier)
    var jeton = 0;            // numéro du dernier scan : un résultat tardif d'un scan plus ancien est ignoré
    var scanSuivant = null;   // scan à rattacher à la prochaine requête
    var scans = {};           // numéro de requête (draw) -> scan en attente de retour sonore

    function filtres() {
      var f = {
        vue: vue,
        entreprise_id: elEnt ? elEnt.value : '',
        emplacement_id: vue === 'emplacement' ? elEmp.value : '',
        categorie_id: elCat.value,
        zero: elZero.checked ? 1 : 0,
        q: elQ.value.trim()
      };
      if (exact && f.q !== '') { f.exact = 1; }
      return f;
    }

    var colonnes = [
      { data: 'code' },
      { data: 'nom' },
      { data: 'categorie', defaultContent: '' },
      { data: 'entreprise', visible: vue === 'piece' },
      {
        data: 'emplacement', defaultContent: '', visible: vue === 'emplacement',
        render: function (d, t, l) { return (t === 'display' && multi && l.entreprise) ? d + '<br><small class="text-muted">' + l.entreprise + '</small>' : d; }
      },
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
      ajax: {
        url: 'app/ajax/stock_data.php', type: 'POST',
        data: function (d) {
          $.extend(d, filtres());
          if (scanSuivant) { scans[d.draw] = scanSuivant; scanSuivant = null; }   // d.draw : numéro de CETTE requête
        }
      },
      createdRow: function (row, data) { if (data.sous_min) { row.classList.add('sk-bas'); } },
      language: { zeroRecords: 'Aucune ligne de stock ne correspond à ces filtres. Essayez « Afficher les quantités à zéro » ou cliquez sur « Effacer ».', emptyTable: 'Aucune ligne de stock ne correspond à ces filtres. Essayez « Afficher les quantités à zéro » ou cliquez sur « Effacer ».' }
    }, function (json) {
      var s = scans[json.draw];
      if (!s) { return; }
      delete scans[json.draw];
      retourScan(s, entier(json.recordsFiltered) > 0);
    });

    // ---- retour du scan : bip, et explication quand le tableau est vide --------------------------------------
    function retourScan(s, trouve) {
      if (s.emplacement) {   // contenu d'un emplacement demandé par son code
        w.bip(true);
        if (!trouve) { w.toast('L\'emplacement « ' + s.emplacement + ' » ne contient aucune pièce en ce moment.', 'info'); }
        return;
      }
      if (trouve) { w.bip(true); return; }
      // Tableau vide : le code est peut-être celui d'un emplacement, ou d'une pièce qui n'est pas en stock avec ces filtres.
      w.api.get('app/ajax/scan_code.php', { code: s.code }).then(function (r) {
        if (s.jeton !== jeton) { return; }   // un scan plus récent a pris le relais
        if (r.trouve && r.type === 'emplacement' && r.emplacement && ouvrirEmplacement(r.emplacement, s)) { return; }
        if (r.trouve && r.type === 'piece' && r.piece) {
          w.bip(true);
          w.toast('La pièce « ' + r.piece.code + ' » (' + r.piece.nom + ') existe, mais aucune ligne de stock ne correspond aux filtres actuels. Cochez « Afficher les quantités à zéro » ou cliquez sur « Effacer ».', 'info', 9000);
          return;
        }
        w.bip(false);
        w.toast('Aucune pièce ne correspond à « ' + s.code + ' ».', 'warning');
      }).catch(function (err) {
        if (s.jeton !== jeton) { return; }
        w.bip(false);
        w.toast(msg(err), 'danger');
      });
    }

    /** Un code d'emplacement (EMP-…) choisit l'emplacement : le tableau montre son contenu. Faux si l'emplacement n'est pas dans les listes. */
    function ouvrirEmplacement(emp, s) {
      var id = String(emp.id), ent = String(emp.entreprise_id);
      if (elEnt) { elEnt.value = ent; if (elEnt.value !== ent) { return false; } }
      majEmplacements();
      elEmp.value = id;
      if (elEmp.value !== id) { return false; }
      vue = 'emplacement';
      majVue();
      exact = false; sale = false;
      elQ.value = '';
      scanSuivant = { emplacement: String(emp.nom), jeton: s.jeton };
      table.ajax.reload();
      return true;
    }

    function scanner(code) {
      recharger.annuler();
      exact = true; sale = false;
      scanSuivant = { code: code, jeton: ++jeton };
      table.ajax.reload();
      elQ.select();   // le code suivant remplace celui-ci
    }

    // ---- adresse de la page, lien d'export et résumé d'impression : toujours d'après les MÊMES filtres que le tableau ----
    function majSorties() {
      var f = filtres();
      q('#btn-export').setAttribute('href', 'app/ajax/stock_export.php?' + $.param(f));
      var a = { page: 'stock' };
      if (elEnt) { a.entreprise_id = f.entreprise_id === '' ? '0' : f.entreprise_id; }   // 0 = « toutes mes entreprises », choix explicite
      if (vue === 'piece') { a.vue = 'piece'; }
      if (elEmp.value !== '') { a.emplacement_id = elEmp.value; }
      if (f.categorie_id !== '') { a.categorie_id = f.categorie_id; }
      if (f.zero) { a.zero = 1; }
      if (f.q !== '') { a.q = f.q; }
      ecrireAdresse(a);
      var parts = [];
      if (elEnt) { parts.push('Entreprise : ' + texteChoisi(elEnt)); }
      if (vue === 'emplacement' && elEmp.value !== '') { parts.push('Emplacement : ' + texteChoisi(elEmp)); }
      if (f.categorie_id !== '') { parts.push('Catégorie : ' + texteChoisi(elCat)); }
      if (f.q !== '') { parts.push('Recherche : « ' + f.q + ' »'); }
      if (f.zero) { parts.push('quantités à zéro incluses'); }
      ecrireResume('Stock ' + (vue === 'piece' ? 'par pièce (totaux par entreprise)' : 'par emplacement'), parts);
    }
    $(q('#table-stock')).on('preXhr.dt', majSorties);
    majSorties();

    function majVue() {
      qa('[data-vue]', racine).forEach(function (b) {
        var actif = b.getAttribute('data-vue') === vue;
        b.setAttribute('aria-pressed', actif ? 'true' : 'false');
        if (actif) { b.classList.add('active'); } else { b.classList.remove('active'); }
      });
      var piece = vue === 'piece';
      table.column(3).visible(piece);    // entreprise : colonne à part en vue « pièce » ; sinon écrite sous l'emplacement
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
    $(elQ).on('input', function () { exact = false; sale = true; recharger(); });   // saisie au clavier : recherche « contient », en direct
    $(elQ).on('keydown', function (e) {
      var entree = e.key === 'Enter';
      // Tab en fin de code (lecteur configuré ainsi) : même chose qu'Entrée, seulement si le texte vient d'être saisi
      var tab = e.key === 'Tab' && !e.shiftKey && sale && elQ.value.trim() !== '';
      if (!entree && !tab) { return; }
      e.preventDefault();
      var code = elQ.value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
      if (code === '') { recharger.annuler(); table.ajax.reload(); return; }
      scanner(code);
    });
    // Le focus (clic, Tab ou redirection d'une frappe de lecteur tombée ailleurs) sélectionne le texte : le code scanné le remplace.
    // Un clic dans un champ qui n'avait pas le focus ne doit pas désélectionner le texte (un second clic place le curseur, pour corriger).
    var focusParSouris = false;
    elQ.addEventListener('focus', function () { elQ.select(); });
    elQ.addEventListener('mousedown', function () { focusParSouris = document.activeElement !== elQ; });
    elQ.addEventListener('mouseup', function (e) { if (focusParSouris) { e.preventDefault(); focusParSouris = false; } });
    reinitialiserAdresseSiBarreChangee('stock');
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
      recharger.annuler();
      exact = false; sale = false;
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
        data: function (p) { return { q: p.term || '', inactives: 1 }; },   // l'historique retrouve aussi les pièces désactivées
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

    // Colonnes allégées pour tenir dans la carte : la date sur deux lignes, le type et la mention « Annulation » sous le numéro du
    // document, l'entreprise sous l'emplacement. Les valeurs de texte arrivent déjà échappées du serveur.
    var colonnes = [
      { data: 'ordre', visible: false, searchable: false },
      {
        data: 'date', orderData: 0, className: 'sk-date',
        render: function (d, t) { return t === 'display' ? String(d).replace(' ', '<br><small class="text-muted">') + '</small>' : d; }
      },
      {
        data: 'numero',
        render: function (d, t, l) { return t === 'display' ? d + '<br><small class="text-muted">' + l.type + '</small>' + (l.mention ? '<br>' + l.mention : '') : d; }
      },
      { data: 'code' },   // un seul lien : code et nom de la pièce
      {
        data: 'emplacement',
        render: function (d, t, l) { return (t === 'display' && multi && l.entreprise) ? d + '<br><small class="text-muted">' + l.entreprise + '</small>' : d; }
      },
      { data: 'quantite', className: 'nombre', render: rSigne },
      { data: 'utilisateur', defaultContent: '' }
    ];
    if (couts) {
      colonnes.push({ data: 'cout_unitaire', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d, 4)); } });
      colonnes.push({ data: 'valeur', className: 'nombre', defaultContent: '', render: function (d) { return w.esc(rArgent(d)); } });
    }

    var table = tableauServeur('#table-historique', {
      order: [[1, 'desc']],   // date et heure, le plus récent d'abord (trie par identifiant : chronologique)
      columns: colonnes,
      ajax: { url: 'app/ajax/historique_data.php', type: 'POST', data: function (d) { $.extend(d, filtres()); } },
      createdRow: function (row, data) { if (data.annulation) { row.classList.add('sk-annulation'); } },
      language: { zeroRecords: 'Aucun mouvement ne correspond à ces filtres.', emptyTable: 'Aucun mouvement ne correspond à ces filtres.' }
    });

    // Adresse de la page, lien d'export et résumé d'impression : toujours d'après les MÊMES filtres que le tableau
    function majSorties() {
      var f = filtres();
      q('#btn-export').setAttribute('href', 'app/ajax/historique_export.php?' + $.param(f));
      var a = { page: 'historique' };
      if (elEnt) { a.entreprise_id = f.entreprise_id === '' ? '0' : f.entreprise_id; }   // 0 = « toutes mes entreprises », choix explicite
      ['piece_id', 'emplacement_id', 'type', 'du', 'au', 'utilisateur_id', 'numero'].forEach(function (k) { if (f[k] !== '') { a[k] = f[k]; } });
      ecrireAdresse(a);
      var parts = [];
      if (elEnt) { parts.push('Entreprise : ' + texteChoisi(elEnt)); }
      if (f.piece_id !== '') { parts.push('Pièce : ' + ($piece.find('option:selected').text() || f.piece_id)); }
      if (f.emplacement_id !== '') { parts.push('Emplacement : ' + texteChoisi(elEmp)); }
      if (f.type !== '') { parts.push('Type : ' + texteChoisi(elType)); }
      if (f.du !== '' || f.au !== '') { parts.push('Période : ' + (f.du || '…') + ' au ' + (f.au || '…')); }
      if (f.utilisateur_id !== '') { parts.push('Utilisateur : ' + texteChoisi(elUtil)); }
      if (f.numero !== '') { parts.push('N° de document : ' + f.numero); }
      ecrireResume('Historique des mouvements', parts);
    }
    $(q('#table-historique')).on('preXhr.dt', majSorties);
    majSorties();

    var recharger = debounce(function () { table.ajax.reload(); }, 300);
    reinitialiserAdresseSiBarreChangee('historique');
    if (elEnt) { $(elEnt).on('change', function () { majEmplacements(); table.ajax.reload(); }); }
    $piece.on('change', function () { table.ajax.reload(); });
    [elEmp, elType, elUtil].forEach(function (el) { $(el).on('change', function () { table.ajax.reload(); }); });
    [elDu, elAu].forEach(function (el) {
      $(el).on('change', function () {
        bornesDates();
        if (elDu.value !== '' && elAu.value !== '' && elDu.value > elAu.value) {   // plage à l'envers : on le dit sans interroger le serveur
          w.toast('La date de début doit précéder la date de fin.', 'warning');
          return;
        }
        table.ajax.reload();
      });
    });
    $(elNum).on('input', recharger);
    $(elNum).on('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); recharger.annuler(); table.ajax.reload(); } });
    q('#f-effacer').addEventListener('click', function () {
      recharger.annuler();
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
    // L'entreprise AFFICHÉE par la page (0 = toutes) est envoyée au serveur : « Actualiser » et « Exporter » restent fidèles à l'écran
    // même si l'entreprise de la barre du haut a été changée dans un autre onglet.
    var ent = String(entier(racine.getAttribute('data-entreprise')));
    var table = null;
    var elPortee = q('#sm-portee'), elErreur = q('#sm-erreur'), elVide = q('#sm-vide'), elTableau = q('#sm-tableau'), btn = q('#sm-actualiser');
    var no = 0;
    q('#sm-export').setAttribute('href', 'app/ajax/sous_minimum_export.php?' + $.param({ entreprise_id: ent }));

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
      // le manque porte l'unité (une colonne de moins : le tableau tient dans la carte)
      { data: 'manque', className: 'nombre', render: function (d, t, l) { return t === 'display' ? '<strong class="sk-neg">' + w.esc(rQte(d)) + '</strong> <small class="text-muted">' + w.esc(l.unite) + '</small>' : nombre(d); } }
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
      return w.api.get('app/ajax/sous_minimum_data.php', { entreprise_id: ent }).then(function (r) {
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
