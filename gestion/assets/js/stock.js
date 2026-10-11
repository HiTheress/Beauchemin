/* Stock, historique, à recommander (module D2).
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
      serverSide: true, processing: true, searching: false, lengthChange: false, autoWidth: false, pageLength: 25
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

  /** Une ligne de tableau ouvre son détail (la ligne porte data-href) ; les liens et boutons de la ligne gardent leur propre action. */
  function ligneCliquable(sel) {
    $(sel + ' tbody').on('click', 'tr.sk-clic', function (e) {
      if ($(e.target).closest('a, button, input, select, label').length) { return; }
      if (w.getSelection && String(w.getSelection()).length > 0) { return; }   // texte en cours de sélection : pas de navigation
      var h = this.getAttribute('data-href');
      if (h) { w.location.href = h; }
    });
  }
  /** « Effacer » n'est visible que lorsqu'un filtre est posé. */
  function montrerEffacer(actif) { var b = q('#f-effacer'); if (b) { b.hidden = !actif; } }

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

    // Colonnes : 0 code · 1 pièce · 2 entreprise (vue « pièce », si plusieurs entreprises) · 3 emplacement (vue « emplacement ») ·
    // 4 quantité (avec son unité) · 5 minimum (vue « pièce ») · 6 valeur (gestionnaire+). Les données gardent les mêmes noms que le serveur.
    var colonnes = [
      { data: 'code' },
      { data: 'nom' },
      { data: 'entreprise', visible: vue === 'piece' && multi },
      {
        data: 'emplacement', defaultContent: '', visible: vue === 'emplacement',
        render: function (d, t, l) { return (t === 'display' && multi && l.entreprise) ? d + '<br><small class="text-muted">' + l.entreprise + '</small>' : d; }
      },
      {
        data: 'quantite', className: 'nombre',
        render: function (d, t, l) { return t === 'display' ? w.esc(rQte(d)) + ' <small class="text-muted">' + (l.unite || '') + '</small>' : d; }
      },
      { data: 'minimum', className: 'nombre', defaultContent: '', visible: vue === 'piece', render: function (d) { return w.esc(rQte(d)); } }
    ];
    if (couts) {
      colonnes.push({ data: 'valeur', className: 'nombre sk-xs-cache', defaultContent: '', render: function (d) { return w.esc(rArgent(d)); } });
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
      createdRow: function (row, data) {
        if (data.sous_min) { row.classList.add('sk-bas'); }
        if (data.piece_id) { row.classList.add('sk-clic'); row.setAttribute('data-href', 'index.php?page=piece_voir&id=' + entier(data.piece_id)); }
      },
      language: { zeroRecords: 'Aucune pièce trouvée.', emptyTable: 'Aucune pièce trouvée.' }
    }, function (json) {
      var s = scans[json.draw];
      if (!s) { return; }
      delete scans[json.draw];
      retourScan(s, entier(json.recordsFiltered) > 0);
    });

    ligneCliquable('#table-stock');

    // ---- retour du scan : bip, et explication quand le tableau est vide --------------------------------------
    function retourScan(s, trouve) {
      if (s.emplacement) {   // contenu d'un emplacement demandé par son code
        w.bip(true);
        if (!trouve) { w.toast('L\'emplacement « ' + s.emplacement + ' » est vide.', 'info'); }
        return;
      }
      if (trouve) { w.bip(true); return; }
      // Tableau vide : le code est peut-être celui d'un emplacement, ou d'une pièce qui n'est pas en stock avec ces filtres.
      w.api.get('app/ajax/scan_code.php', { code: s.code }).then(function (r) {
        if (s.jeton !== jeton) { return; }   // un scan plus récent a pris le relais
        if (r.trouve && r.type === 'emplacement' && r.emplacement && ouvrirEmplacement(r.emplacement, s)) { return; }
        if (r.trouve && r.type === 'piece' && r.piece) {
          w.bip(true);
          w.toast('La pièce « ' + r.piece.code + ' » (' + r.piece.nom + ') n\'est pas en stock.', 'info', 7000);
          return;
        }
        w.bip(false);
        w.toast('Aucune pièce ne correspond à « ' + s.code + ' ». Vérifiez le code.', 'warning');
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
      ecrireResume('Stock ' + (vue === 'piece' ? 'par pièce' : 'par emplacement'), parts);
      montrerEffacer(f.q !== '' || (!!elEnt && elEnt.value !== defautEnt) || elEmp.value !== '' || f.categorie_id !== '' || !!f.zero);
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
      table.column(2).visible(piece && multi);   // entreprise : colonne à part en vue « pièce » ; sinon écrite sous l'emplacement
      table.column(3).visible(!piece);
      table.column(5).visible(piece);
      elEmp.disabled = piece;
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
  //  HISTORIQUE
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

    // Colonnes allégées : la date sur deux lignes, sous le numéro du document le type et l'utilisateur (puis « Annulation » s'il y a lieu),
    // l'entreprise sous l'emplacement. Les valeurs de texte arrivent déjà échappées du serveur.
    var colonnes = [
      { data: 'ordre', visible: false, searchable: false },
      {
        data: 'date', orderData: 0, className: 'sk-date',
        render: function (d, t) { return t === 'display' ? String(d).replace(' ', '<br><small class="text-muted">') + '</small>' : d; }
      },
      {
        data: 'numero',
        render: function (d, t, l) {
          return t === 'display'
            ? d + '<br><small class="text-muted"><span class="sk-type">' + l.type + '</span>' + (l.utilisateur ? ' · <span class="sk-util">' + l.utilisateur + '</span>' : '') + '</small>' + (l.mention ? '<br>' + l.mention : '')
            : d;
        }
      },
      { data: 'code' },   // un seul lien : code et nom de la pièce
      {
        data: 'emplacement', className: 'sk-xs-cache',
        render: function (d, t, l) { return (t === 'display' && multi && l.entreprise) ? d + '<br><small class="text-muted">' + l.entreprise + '</small>' : d; }
      },
      { data: 'quantite', className: 'nombre', render: rSigne }
    ];
    if (couts) {
      colonnes.push({ data: 'valeur', className: 'nombre sk-xs-cache', defaultContent: '', render: function (d) { return w.esc(rArgent(d)); } });
    }

    var table = tableauServeur('#table-historique', {
      order: [[1, 'desc']],   // date et heure, le plus récent d'abord (trie par identifiant : chronologique)
      columns: colonnes,
      ajax: { url: 'app/ajax/historique_data.php', type: 'POST', data: function (d) { $.extend(d, filtres()); } },
      createdRow: function (row, data) {
        if (data.annulation) { row.classList.add('sk-annulation'); }
        if (data.doc_id) { row.classList.add('sk-clic'); row.setAttribute('data-href', 'index.php?page=document_voir&id=' + entier(data.doc_id)); }
      },
      language: { zeroRecords: 'Aucun mouvement trouvé.', emptyTable: 'Aucun mouvement trouvé.' }
    });
    ligneCliquable('#table-historique');

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
      ecrireResume('Historique', parts);
      montrerEffacer(f.piece_id !== '' || f.du !== '' || f.au !== '' || f.emplacement_id !== '' || f.type !== '' || f.utilisateur_id !== '' || f.numero !== '' || (!!elEnt && elEnt.value !== defautEnt));
    }
    $(q('#table-historique')).on('preXhr.dt', majSorties);
    majSorties();

    // « Plus d'options » : les filtres rares (entreprise, emplacement, type, utilisateur, numéro) restent cachés tant qu'on n'en a pas besoin
    var elPlus = q('#h-plus'), elOptions = q('#h-options');
    elPlus.addEventListener('click', function () {
      var ouvrir = elOptions.hidden;
      elOptions.hidden = !ouvrir;
      elPlus.setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
      elPlus.querySelector('span').textContent = ouvrir ? 'Moins d\'options' : 'Plus d\'options';
    });

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
  //  À RECOMMANDER
  // ===================================================================================
  function pageSousMinimum() {
    var gest = racine.getAttribute('data-gest') === '1';
    var multi = racine.getAttribute('data-multi') === '1';   // plusieurs entreprises : on montre la colonne « Entreprise »
    // L'entreprise AFFICHÉE par la page (0 = toutes) est envoyée au serveur : « Actualiser » et « Exporter » restent fidèles à l'écran
    // même si l'entreprise de la barre du haut a été changée dans un autre onglet.
    var ent = String(entier(racine.getAttribute('data-entreprise')));
    var table = null;
    var elPortee = q('#sm-portee'), elErreur = q('#sm-erreur'), elVide = q('#sm-vide'), elTableau = q('#sm-tableau'), btn = q('#sm-actualiser');
    var no = 0;
    q('#sm-export').setAttribute('href', 'app/ajax/sous_minimum_export.php?' + $.param({ entreprise_id: ent }));

    function lienPiece(l) { return 'index.php?page=piece_voir&id=' + entier(l.piece_id); }
    function lienReception(l) {
      var h = 'index.php?page=reception&piece_id=' + entier(l.piece_id);
      if (l.emplacement_reception_id) { h += '&emplacement_id=' + entier(l.emplacement_reception_id); }
      return h;
    }
    var colonnes = [
      {   // code et nom dans une seule colonne ; la recherche porte sur les deux
        data: 'code',
        render: function (d, t, l) {
          if (t === 'display') { return '<span class="code font-weight-bold">' + w.esc(d) + '</span><br><span class="sk-nom">' + w.esc(l.nom) + '</span>'; }
          return t === 'filter' ? d + ' ' + l.nom : d;
        }
      }
    ];
    if (multi) { colonnes.push({ data: 'entreprise', className: 'sk-xs-cache', render: function (d, t) { return t === 'display' ? w.esc(d) : d; } }); }
    colonnes.push(
      { data: 'quantite', className: 'nombre sk-xs-cache', render: function (d, t) { return t === 'display' ? w.esc(rQte(d)) : nombre(d); } },
      { data: 'minimum', className: 'nombre sk-xs-cache', render: function (d, t) { return t === 'display' ? w.esc(rQte(d)) : nombre(d); } },
      // le manque porte l'unité (une colonne de moins)
      { data: 'manque', className: 'nombre', render: function (d, t, l) { return t === 'display' ? '<strong class="sk-neg">' + w.esc(rQte(d)) + '</strong> <small class="text-muted">' + w.esc(l.unite) + '</small>' : nombre(d); } },
      {
        data: null, orderable: false, searchable: false, className: 'no-print text-right',
        render: function (d, t, l) {
          if (t !== 'display') { return ''; }
          return '<a class="btn btn-primary sk-btn-voir" href="' + w.esc(lienPiece(l)) + '">Voir la pièce</a>' +
            (gest ? ' <a class="btn btn-sm btn-outline-secondary sk-btn-recevoir" href="' + w.esc(lienReception(l)) + '">Recevoir</a>' : '');
        }
      }
    );
    var colManque = multi ? 4 : 3;

    function rendre(r) {
      var lignes = r.lignes || [];
      var ents = r.entreprises || [];
      elPortee.textContent = (ents.length > 1 ? 'Entreprises : ' : 'Entreprise : ') + (ents.join(', ') || '—') + ' · ' +
        (lignes.length === 0 ? '0 pièce' : (lignes.length === 1 ? '1 pièce' : lignes.length + ' pièces'));
      montrer(elErreur, false);
      montrer(elVide, lignes.length === 0);
      montrer(elTableau, lignes.length > 0);
      if (!table) {
        table = $('#table-sous-minimum').DataTable({
          data: lignes, columns: colonnes, autoWidth: false, pageLength: 50, lengthChange: false, order: [[colManque, 'desc'], [0, 'asc']],
          createdRow: function (row, data) { row.classList.add('sk-clic'); row.setAttribute('data-href', lienPiece(data)); },
          language: { search: '', searchPlaceholder: 'Rechercher', zeroRecords: 'Aucune pièce trouvée.', emptyTable: 'Rien à recommander.' }
        });
        ligneCliquable('#table-sous-minimum');
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
