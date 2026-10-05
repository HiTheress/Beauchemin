/* Outils JavaScript communs (chargé sur toutes les pages, après jQuery).
 *   api.get(url, params) / api.post(url, objet)  -> Promise<JSON>  (rejette avec Error(message) ; e.champ = champ fautif)
 *   toast(message, 'success'|'danger'|'warning'|'info')
 *   esc(texte)                -> échappe pour HTML (à utiliser pour TOUTE valeur insérée dans innerHTML)
 *   fmtArgent('12.5') / fmtQte('3.000') / fmtNombre(...)  -> format fr-CA à partir des chaînes décimales du serveur
 *   bip(true|false)           -> petit son de succès / d'erreur (scanner)
 *   scanner(input, fn, opts)  -> appelle fn(code) quand le lecteur envoie Entrée ; FILE D'ATTENTE (aucun scan perdu) ; garde le focus
 *   DT_LANG                   -> libellés français de DataTables (déjà appliqués par défaut)
 */
(function (w, $) {
  'use strict';
  var meta = document.querySelector('meta[name="csrf-token"]');
  var CSRF = meta ? meta.getAttribute('content') : '';
  $.ajaxSetup({ headers: { 'X-CSRF-Token': CSRF } });

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  w.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };

  // ---- Appels au serveur -------------------------------------------------------------
  function traiter(resp) {
    return resp.text().then(function (txt) {
      var data = null;
      try { data = JSON.parse(txt); } catch (e) { /* réponse non JSON */ }
      if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée. Veuillez vous reconnecter.'); }
      if (!data) { throw new Error('Réponse inattendue du serveur (' + resp.status + ').'); }
      if (data.ok === false || !resp.ok) {
        var err = new Error(data.erreur || 'Erreur (' + resp.status + ').');
        err.champ = data.champ || null;
        throw err;
      }
      return data;
    });
  }
  // Réseau coupé / serveur injoignable : message en français (le navigateur dit « Failed to fetch »)
  function reseauHS() { throw new Error('Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.'); }
  w.api = {
    get: function (url, params) {
      var q = params ? '?' + $.param(params) : '';
      return fetch(url + q, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } }).then(traiter, reseauHS);
    },
    post: function (url, obj) {
      return fetch(url, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': CSRF },
        body: JSON.stringify(obj || {})
      }).then(traiter, reseauHS);
    }
  };

  // ---- Notifications -----------------------------------------------------------------
  w.toast = function (message, type, ms) {
    var box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var d = document.createElement('div');
    d.className = 'alert alert-' + (type || 'info') + ' alert-dismissible';
    d.setAttribute('role', 'status');
    d.innerHTML = '<button type="button" class="close" aria-label="Fermer">&times;</button>' + w.esc(message);
    d.querySelector('button').onclick = function () { d.remove(); };
    box.appendChild(d);
    setTimeout(function () { d.remove(); }, ms || (type === 'danger' ? 8000 : 4000));
  };

  // ---- Formats fr-CA à partir des chaînes décimales du serveur -------------------------------
  function nf(min, max) { return new Intl.NumberFormat('fr-CA', { minimumFractionDigits: min, maximumFractionDigits: max }); }
  var F2 = nf(2, 2), FQ = nf(0, 3), F4 = nf(2, 4);
  w.fmtArgent = function (s, dec) { if (s === null || s === undefined || s === '') { return ''; } return (dec === 4 ? F4 : F2).format(parseFloat(s)) + ' $'; };
  w.fmtQte = function (s) { if (s === null || s === undefined || s === '') { return ''; } return FQ.format(parseFloat(s)); };
  w.fmtNombre = w.fmtQte;

  // ---- Son (retour sonore du scan) -----------------------------------------------------------
  var ctx = null;
  w.bip = function (succes) {
    try {
      var AC = w.AudioContext || w.webkitAudioContext; if (!AC) { return; }
      ctx = ctx || new AC();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = succes ? 1200 : 220;
      g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + (succes ? 0.08 : 0.35));
    } catch (e) { /* pas de son possible */ }
  };

  /* Champ de scan. Un lecteur USB/Bluetooth « tape » le code puis Entrée.
   * fn(code) peut retourner une Promise ; retourner false (ou lancer une erreur) = échec (bip grave + message).
   * FILE D'ATTENTE : un code reçu pendant le traitement du précédent est mis en file et traité dans l'ordre (aucun scan perdu).
   * Le focus revient au champ une fois la file vide, sauf si l'utilisateur est en train de saisir ailleurs (quantité d'une ligne, fenêtre…).
   * opts.garderFocus === false : ne remet jamais le focus.  Retourne { focus(), attente() } ; l'attribut data-attente du champ = nombre de scans en attente. */
  w.scanner = function (input, fn, opts) {
    opts = opts || {};
    var el = (typeof input === 'string') ? document.querySelector(input) : input;
    var box = el.closest('.scan-box');
    var file = [], enCours = false, minuterie = null;
    function attente() { return file.length + (enCours ? 1 : 0); }
    function notifier() { el.setAttribute('data-attente', String(attente())); }
    function marquer(cls) {
      if (!box) { return; }
      box.classList.remove('ok', 'erreur'); void box.offsetWidth; box.classList.add(cls);
      clearTimeout(minuterie); minuterie = setTimeout(function () { box.classList.remove(cls); }, 900);
    }
    function rendreFocus() {
      if (opts.garderFocus === false) { return; }
      var a = document.activeElement;
      if (!a || a === document.body || a === el || !a.matches('input, select, textarea, [contenteditable]')) { el.focus(); }
    }
    function pomper() {
      if (enCours) { return; }
      var code = file.shift();
      if (code === undefined) { notifier(); rendreFocus(); return; }
      enCours = true; notifier();
      Promise.resolve().then(function () { return fn(code); })
        .then(function (r) {
          if (r !== false) { if (!file.length) { w.bip(true); } marquer('ok'); } else { w.bip(false); marquer('erreur'); }
        }, function (err) {
          w.bip(false); marquer('erreur'); w.toast((err && err.message) ? err.message : String(err), 'danger');
        })
        .then(function () { enCours = false; pomper(); });
    }
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== 'Tab') { return; }
      var code = el.value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
      if (e.key === 'Tab' && code === '') { return; }
      e.preventDefault();
      el.value = '';
      if (code === '') { return; }
      if (file.length >= 500) { w.bip(false); w.toast('Trop de scans en attente : patientez un instant.', 'warning'); return; }
      file.push(code); notifier(); pomper();
    });
    notifier();
    if (opts.focusInitial !== false) { el.focus(); }
    return { focus: function () { el.focus(); }, attente: attente };
  };

  // ---- DataTables en français, par défaut -----------------------------------------------------
  w.DT_LANG = {
    processing: 'Chargement…', search: 'Rechercher :', lengthMenu: 'Afficher _MENU_ lignes',
    info: '_START_ à _END_ de _TOTAL_', infoEmpty: 'Aucun résultat', infoFiltered: '(filtré sur _MAX_)',
    loadingRecords: 'Chargement…', zeroRecords: 'Aucun résultat', emptyTable: 'Aucune donnée',
    paginate: { first: '«', previous: 'Précédent', next: 'Suivant', last: '»' }
  };
  if ($.fn.dataTable) {
    $.extend(true, $.fn.dataTable.defaults, { language: w.DT_LANG, pageLength: 25, lengthMenu: [10, 25, 50, 100], autoWidth: false });
    // Jamais de texte technique anglais : on distingue session expirée, accès refusé et erreur serveur.
    $.fn.dataTable.ext.errMode = 'none';
    $(document).on('error.dt', function (e, settings) {
      var x = settings && settings.jqXHR;
      if (x && x.status === 401) { w.location.href = 'login.php'; return; }
      var m = 'Impossible de charger le tableau. Réessayez dans un instant.';
      if (x && x.status === 403) { m = 'Accès refusé. Rechargez la page.'; }
      else if (x && x.status === 0) { m = 'Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.'; }
      w.toast(m, 'danger');
    });
  }

  // ---- Select2 en français ---------------------------------------------------------------------
  if ($.fn.select2) {
    $.fn.select2.defaults.set('language', {
      noResults: function () { return 'Aucun résultat'; }, searching: function () { return 'Recherche…'; },
      inputTooShort: function () { return 'Entrez au moins un caractère'; }, errorLoading: function () { return 'Erreur de chargement'; }
    });
    $.fn.select2.defaults.set('width', '100%');
  }

  // ---- Lecteur de codes-barres : il « tape » dans l'élément qui a le focus. Si ce n'est pas un champ de texte
  //      (liste déroulante, bouton, page), on redonne le focus au champ de scan pour ne perdre aucun caractère.
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) { return; }
    var t = e.target, tag = t && t.tagName;
    if (!(tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || tag === 'BODY' || tag === 'HTML')) { return; }
    if (t.closest && t.closest('.modal, .select2-container, .select2-dropdown, .dropdown-menu')) { return; }
    var sc = document.querySelector('.scan-input');
    if (!sc || sc.disabled || sc.offsetParent === null || document.querySelector('.modal.show')) { return; }
    sc.focus();   // le caractère de cette frappe est alors saisi dans le champ de scan
  }, true);

  // ---- Entreprise active (barre du haut) ---------------------------------------------------------
  $(function () {
    $('#entreprise-courante').on('change', function () {
      w.api.post('app/action/choisir_entreprise.php', { entreprise_id: parseInt(this.value, 10) || 0 })
        .then(function () { w.location.reload(); })
        .catch(function (e) { w.toast(e.message, 'danger'); });
    });
  });
})(window, jQuery);
