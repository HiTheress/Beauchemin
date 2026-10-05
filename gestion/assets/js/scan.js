/* Scanner / Chercher (module D1) + outils de scan partagés avec l'écran de comptage (comptage.js).
 *
 *   Scan.lier(input, traiter, opts)   champ de scan à FILE D'ATTENTE : aucun scan n'est perdu, même en rafale
 *       traiter(code, n)  -> Promise (ou valeur) ; renvoyer false ou lancer une erreur = échec (bip grave)
 *       opts.regrouper    true : des scans identiques consécutifs en attente sont fusionnés (n = leur nombre)
 *       opts.onAttente(n) nombre de scans pas encore traités
 *       opts.onErreur(err, code)   (défaut : message « toast »)
 *     retourne { ajouter(code), focus(), attente() }
 *   Scan.camera(zone, onCode, opts)   lecture par la caméra (BarcodeDetector ; HTTPS ou localhost) -> { ouvrir(), fermer(), actif() }
 *       opts.onFermer()   appelé quand la caméra se ferme (bouton, page masquée ou quittée) : l'appelant remet son bouton à l'état « fermé »
 *       Un code déjà lu n'est relu qu'après avoir quitté l'image (au moins DELAI_REARMEMENT sans détection) : une étiquette tenue devant
 *       l'objectif compte UNE fois ; la retirer puis la représenter compte de nouveau.
 *   Scan.clavier(bouton, input)       bascule le clavier tactile du champ de scan (inputmode none <-> text)
 *   Scan.typeEmplacement(type)        « Cube de service », …
 *
 * La page « Scanner / Chercher » (#page-scanner) est initialisée ici ; la page de comptage charge ce fichier pour la file et la caméra.
 */
(function (w, $) {
  'use strict';

  var d = document;
  function qs(sel, racine) { return (racine || d).querySelector(sel); }
  function esc(s) { return w.esc(s); }
  function attendre(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function tousChampsSaisie(el) { return !!(el && el.matches && el.matches('input, select, textarea, [contenteditable]')); }

  var TYPES_EMP = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };
  var TYPES_CODE = { fabricant: 'Fabricant', fournisseur: 'Fournisseur', autre: 'Autre' };

  /* ------------------------------------------------------------------------------------------------
   *  File de scans : le clavier du lecteur envoie « code » + Entrée ; on empile et on traite dans l'ordre.
   * ---------------------------------------------------------------------------------------------- */
  var dernierBipErreur = 0;
  function bip(ok) {
    var t = Date.now();
    if (!ok) {
      if (t - dernierBipErreur < 250) { return; }   // une rafale d'erreurs ne doit pas faire un vacarme
      dernierBipErreur = t;
    }
    w.bip(ok);
  }

  function lier(input, traiter, opts) {
    opts = opts || {};
    var el = (typeof input === 'string') ? qs(input) : input;
    var box = el.closest ? el.closest('.scan-box') : null;
    var file = [];
    var enCours = false;
    var minuterie = null;

    function marquer(cls) {
      if (!box) { return; }
      box.classList.remove('ok', 'erreur'); void box.offsetWidth; box.classList.add(cls);
      clearTimeout(minuterie); minuterie = setTimeout(function () { box.classList.remove(cls); }, 1500);
    }
    function attente() { return file.length + (enCours ? 1 : 0); }
    function notifier() {
      el.setAttribute('data-attente', String(attente()));   // lisible par les tests : 0 = tout est traité
      if (opts.onAttente) { opts.onAttente(attente()); }
    }
    function rendreFocus() {
      var a = d.activeElement;
      // On ne vole pas le focus à quelqu'un qui est en train de saisir ailleurs (quantité d'une ligne, fenêtre ouverte…)
      if (!a || a === d.body || a === el || !tousChampsSaisie(a)) { el.focus({ preventScroll: true }); }
    }
    function pomper() {
      if (enCours) { return; }
      var code = file.shift();
      if (code === undefined) { notifier(); rendreFocus(); return; }
      var n = 1;
      if (opts.regrouper) { while (file.length && file[0] === code) { file.shift(); n++; } }
      enCours = true; notifier();
      var fin = function (ok, err) {
        enCours = false;
        if (ok) { if (!file.length) { bip(true); } marquer('ok'); }
        else {
          bip(false); marquer('erreur');
          if (err) { if (opts.onErreur) { opts.onErreur(err, code); } else { w.toast(err.message || String(err), 'danger'); } }
        }
        pomper();
      };
      var p;
      try { p = Promise.resolve(traiter(code, n)); } catch (e) { p = Promise.reject(e); }
      p.then(function (r) { fin(r !== false, null); }, function (e) { fin(false, e); });
    }
    function ajouter(valeur) {
      var code = String(valeur === null || valeur === undefined ? '' : valeur).replace(/[\u0000-\u001f\u007f]/g, '').trim();
      if (code === '') { return; }
      file.push(code); notifier(); pomper();
    }

    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== 'Tab') { return; }
      var code = el.value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
      if (e.key === 'Tab' && code === '') { return; }   // Tab sans code : navigation normale
      e.preventDefault();
      el.value = '';
      ajouter(code);
    });
    // Les lecteurs configurés « Entrée automatique » peuvent aussi arriver en un seul événement de saisie terminé par un saut de ligne
    el.addEventListener('input', function () {
      if (/[\r\n]/.test(el.value)) {
        var parts = el.value.split(/[\r\n]+/);
        el.value = parts.pop();
        parts.forEach(ajouter);
      }
    });
    // Quitter la page avec des scans encore en file d'attente (pas encore envoyés) les perdrait : on prévient.
    w.addEventListener('beforeunload', function (e) {
      if (file.length > 0) { e.preventDefault(); e.returnValue = ''; return ''; }
    });
    // Champ inactif (le focus est ailleurs) : le texte d'invite le dit ; sans cela, le lecteur de codes écrirait dans le vide
    var invite = el.getAttribute('placeholder') || '';
    el.addEventListener('focus', function () { el.setAttribute('placeholder', invite); });
    el.addEventListener('blur', function () { el.setAttribute('placeholder', 'Champ inactif : cliquez ici pour scanner'); });
    el.setAttribute('data-attente', '0');
    if (opts.focusInitial !== false) { el.focus(); }
    return { ajouter: ajouter, focus: function () { el.focus(); }, attente: attente };
  }

  /* Un clic dans une zone « vide » de la page ramène le curseur dans le champ de scan. */
  function focusAuto(el, racine) {
    (racine || d).addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('input, select, textarea, a, button, label, .select2-container, .select2-dropdown, .modal, [tabindex], table')) { return; }
      el.focus();
    });
    d.addEventListener('visibilitychange', function () { if (!d.hidden && (!d.activeElement || d.activeElement === d.body)) { el.focus(); } });
  }

  /* Clavier tactile : le champ de scan est en inputmode « none » (pas de clavier à l'écran avec un lecteur Bluetooth). */
  function clavier(bouton, input) {
    if (!bouton) { return; }
    bouton.addEventListener('click', function () {
      var actif = input.getAttribute('inputmode') === 'none';
      input.setAttribute('inputmode', actif ? 'text' : 'none');
      bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
      bouton.classList.toggle('active', !!actif);
      input.blur(); input.focus();
    });
  }

  /* ------------------------------------------------------------------------------------------------
   *  Caméra (amélioration progressive)
   * ---------------------------------------------------------------------------------------------- */
  var FORMATS = ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'qr_code', 'data_matrix'];

  function cameraIndisponible() {
    if (!w.isSecureContext) { return 'La caméra exige une connexion sécurisée (HTTPS) ou l\'adresse locale du serveur. Utilisez un lecteur de codes-barres ou tapez le code.'; }
    if (!w.navigator.mediaDevices || !w.navigator.mediaDevices.getUserMedia) { return 'Ce navigateur ne permet pas d\'utiliser la caméra. Utilisez un lecteur de codes-barres ou tapez le code.'; }
    if (!('BarcodeDetector' in w)) { return 'Ce navigateur ne sait pas lire les codes-barres avec la caméra (essayez Chrome ou Edge récent sur une tablette). Utilisez un lecteur de codes-barres ou tapez le code.'; }
    return null;
  }

  var DELAI_REARMEMENT = 800;   // ms sans voir un code avant d'accepter qu'on le relise (étiquette retirée puis représentée)

  function camera(zone, onCode, opts) {
    opts = opts || {};
    var video = null, flux = null, minuterie = null, detecteur = null, occupe = false, msgTimer = null;
    var vus = {};                 // code -> dernier instant où la caméra l'a vu
    var ouverte = false, jeton = 0;

    function dessiner(messageHtml) {
      zone.innerHTML =
        '<div class="sc-camera">' +
        '<div class="sc-camera-barre"><strong><i class="fas fa-camera mr-1" aria-hidden="true"></i> Lecture par la caméra</strong>' +
        '<button type="button" class="btn btn-outline-secondary sc-camera-fermer">Fermer la caméra</button></div>' +
        '<div class="sc-camera-msg" role="status" aria-live="polite">' + messageHtml + '</div>' +
        '<video class="sc-camera-video" playsinline muted autoplay aria-label="Image de la caméra"></video></div>';
      video = qs('video', zone);
      qs('.sc-camera-fermer', zone).addEventListener('click', function () { fermer(); });
    }
    function message(texte, type) {
      var m = qs('.sc-camera-msg', zone);
      if (m) { m.className = 'sc-camera-msg text-' + (type || 'muted'); m.textContent = texte; }
    }
    function arreterFlux() {
      clearInterval(minuterie); minuterie = null; occupe = false;
      if (flux) { flux.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* déjà arrêtée */ } }); flux = null; }
      if (video) { try { video.pause(); } catch (e) { /* rien */ } video.srcObject = null; }
    }
    function fermer() {
      var etaitOuverte = ouverte;
      jeton++;
      arreterFlux();
      clearTimeout(msgTimer);
      ouverte = false; detecteur = null; vus = {};
      zone.classList.add('d-none'); zone.innerHTML = '';
      if (etaitOuverte && opts.onFermer) { opts.onFermer(); }
    }
    function lire() {
      if (occupe || !video || video.readyState < 2) { return; }
      occupe = true;
      detecteur.detect(video).then(function (codes) {
        if (!codes || !codes.length) { return; }
        var c = String(codes[0].rawValue || '').trim();
        if (c === '') { return; }
        var t = Date.now(), avant = vus[c];
        vus[c] = t;                                            // chaque détection prolonge la « présentation » en cours
        if (avant !== undefined && t - avant <= DELAI_REARMEMENT) { return; }   // même étiquette, toujours devant l'objectif
        message('Lu : ' + c, 'success');
        clearTimeout(msgTimer);
        msgTimer = setTimeout(function () { message('Présentez le code-barres devant la caméra.', 'muted'); }, 1500);
        onCode(c);
      }).catch(function () { /* image illisible : on réessaie */ }).then(function () { occupe = false; });
    }
    function ouvrir() {
      if (ouverte) { return Promise.resolve(); }
      ouverte = true;
      zone.classList.remove('d-none');
      dessiner('Démarrage de la caméra…');
      var raison = cameraIndisponible();
      if (raison) { message(raison, 'danger'); return Promise.resolve(); }
      var mon = ++jeton;
      vus = {};
      return w.navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (f) {
        if (mon !== jeton) { f.getTracks().forEach(function (t) { t.stop(); }); return; }   // fermée entre-temps
        flux = f; video.srcObject = f;
        var lecture = video.play(); if (lecture && lecture.catch) { lecture.catch(function () { /* lecture automatique refusée */ }); }
        var fmts = (w.BarcodeDetector.getSupportedFormats ? w.BarcodeDetector.getSupportedFormats() : Promise.resolve([]));
        return Promise.resolve(fmts).then(function (liste) {
          var ok = (liste || []).filter(function (x) { return FORMATS.indexOf(x) >= 0; });
          detecteur = ok.length ? new w.BarcodeDetector({ formats: ok }) : new w.BarcodeDetector();
          if (mon !== jeton) { return; }
          message('Présentez le code-barres devant la caméra.', 'muted');
          minuterie = setInterval(lire, 250);
        });
      }).catch(function (err) {
        if (mon !== jeton) { return; }
        arreterFlux();
        var nom = err && err.name;
        message(nom === 'NotAllowedError' || nom === 'SecurityError' ? 'L\'accès à la caméra a été refusé. Autorisez-le dans les réglages du navigateur, puis réessayez.'
          : nom === 'NotFoundError' || nom === 'OverconstrainedError' ? 'Aucune caméra n\'a été trouvée sur cet appareil.'
          : 'Impossible de démarrer la caméra.', 'danger');
      });
    }
    // Le flux vidéo ne doit jamais rester allumé : page quittée ou masquée
    w.addEventListener('pagehide', fermer);
    d.addEventListener('visibilitychange', function () { if (d.hidden && ouverte) { fermer(); } });
    return { ouvrir: ouvrir, fermer: fermer, actif: function () { return ouverte; } };
  }

  /* POST JSON qui garde TOUTE la réponse du serveur (api.post ne conserve que le message d'erreur) : { status, data }.
   * Sert quand l'erreur porte une donnée utile (ex. {existant:{id, numero}} : un comptage est déjà en cours). */
  function postBrut(url, obj) {
    var meta = qs('meta[name="csrf-token"]');
    return fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': meta ? meta.getAttribute('content') : '' },
      body: JSON.stringify(obj || {})
    }).catch(function () {
      // Réseau coupé / serveur injoignable : le navigateur dirait « Failed to fetch »
      throw new Error('Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.');
    }).then(function (resp) {
      if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée. Veuillez vous reconnecter.'); }
      return resp.text().then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (e) { /* réponse non JSON */ }
        if (!data) { throw new Error('Réponse inattendue du serveur (' + resp.status + ').'); }
        return { status: resp.status, data: data };
      });
    });
  }

  /* Select2 4.0 ignore la première saisie qui suit un choix fait avec Entrée quand la liste a perdu le focus entre-temps
   * (son drapeau interne _keyUpPrevented reste levé). On le baisse après chaque fermeture : sans effet pour la saisie au clavier,
   * indispensable pour une saisie collée ou automatisée. */
  function select2Propre($el) {
    $el.on('select2:close', function () {
      setTimeout(function () {
        try {
          var s = $el.data('select2');
          if (!s && $.fn.select2.amd) { s = $.fn.select2.amd.require('select2/utils').GetData($el[0], 'select2'); }   // Select2 4.0.6+ range l'instance dans son propre cache
          if (s && s.dropdown) { s.dropdown._keyUpPrevented = false; }
        } catch (e) { /* version différente de Select2 */ }
      }, 0);
    });
  }

  /* Nom accessible du Select2 : son <label>, pas seulement le texte d'invite (le <label for> pointe vers le <select> masqué). */
  function select2Etiquette($el, idLabel) {
    try {
      var sel = $el.next('.select2-container').find('.select2-selection');
      var rendu = sel.find('.select2-selection__rendered').attr('id');
      sel.attr('aria-labelledby', idLabel + (rendu ? ' ' + rendu : ''));
    } catch (e) { /* version différente de Select2 */ }
  }

  w.Scan = { lier: lier, select2Propre: select2Propre, select2Etiquette: select2Etiquette, camera: camera, clavier: clavier, focusAuto: focusAuto, postBrut: postBrut, typeEmplacement: function (t) { return TYPES_EMP[t] || t; }, bip: bip };

  /* ================================================================================================
   *  Page « Scanner / Chercher »
   * ============================================================================================== */
  var racine = qs('#page-scanner');
  if (!racine) { return; }

  var role = racine.getAttribute('data-role');
  var gestionnaire = (role === 'gestionnaire' || role === 'admin');
  var elScan = qs('#scan');
  var elResultat = qs('#sc-resultat');
  var elMessages = qs('#sc-messages');
  var elHist = qs('#sc-hist');
  var elAnnonce = qs('#sc-annonce');
  function focusScan() { elScan.focus({ preventScroll: true }); }
  var seq = 0;                       // seule la réponse la plus récente s'affiche
  // L'historique appartient à l'utilisateur connecté : une tablette partagée ne montre jamais les scans du précédent
  // (libellés d'emplacements d'une entreprise à laquelle le suivant n'a pas accès). Les historiques des autres utilisateurs sont purgés.
  var PREFIXE_HIST = 'bea_scanner_historique';
  var CLE_HIST = PREFIXE_HIST + '_' + (parseInt(racine.getAttribute('data-user'), 10) || 0);
  var historique = [];
  function purgerAutresHist() {
    try {
      var aSupprimer = [];
      for (var i = 0; i < w.sessionStorage.length; i++) { var k = w.sessionStorage.key(i); if (k && k.indexOf(PREFIXE_HIST) === 0 && k !== CLE_HIST) { aSupprimer.push(k); } }
      aSupprimer.forEach(function (k) { w.sessionStorage.removeItem(k); });
    } catch (e) { /* stockage indisponible */ }
  }

  // ---- historique de la session (jamais de coût : seulement code, libellé et résultat)
  function lireHist() {
    try { var j = JSON.parse(w.sessionStorage.getItem(CLE_HIST) || '[]'); return Array.isArray(j) ? j.slice(0, 30) : []; } catch (e) { return []; }
  }
  function ecrireHist() { try { w.sessionStorage.setItem(CLE_HIST, JSON.stringify(historique.slice(0, 30))); } catch (e) { /* stockage indisponible */ } }
  function heure() { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2) + ':' + ('0' + n.getSeconds()).slice(-2); }
  function ajouterHist(e) {
    e.h = heure();
    historique.unshift(e);
    historique = historique.slice(0, 30);
    ecrireHist(); dessinerHist();
  }
  function dessinerHist() {
    if (!historique.length) { elHist.innerHTML = '<li class="text-muted p-3">Aucun scan pour le moment.</li>'; return; }
    elHist.innerHTML = historique.map(function (e, i) {
      var icone = e.type === 'piece' ? 'fa-cog' : e.type === 'emplacement' ? 'fa-warehouse' : 'fa-times-circle text-danger';
      var cible = (e.type === 'piece' || e.type === 'emplacement') ? ' data-i="' + i + '"' : '';
      var etiquette = '<span class="sc-hist-h">' + esc(e.h) + '</span> <i class="fas ' + icone + '" aria-hidden="true"></i> ' +
        '<span class="sc-hist-code code">' + esc(e.code) + '</span> <span class="sc-hist-lib">' + esc(e.libelle) + '</span>';
      return '<li class="sc-hist-item">' + (cible ? '<button type="button" class="sc-hist-btn"' + cible + '>' + etiquette + '</button>' : '<div class="sc-hist-btn sc-hist-mort">' + etiquette + '</div>') + '</li>';
    }).join('');
  }
  elHist.addEventListener('click', function (ev) {
    var b = ev.target.closest('.sc-hist-btn[data-i]');
    if (!b) { return; }
    var e = historique[parseInt(b.getAttribute('data-i'), 10)];
    if (!e) { return; }
    (e.type === 'piece' ? montrerPiece(e.id, e.code) : montrerEmplacement(e.id, e.code)).then(function () { focusScan(); });
  });

  // ---- messages
  function message(type, html) {
    elMessages.innerHTML = html ? '<div class="alert alert-' + type + ' sc-message" role="alert">' + html + '</div>' : '';
  }
  function chargement() {
    elResultat.innerHTML = '<div class="card"><div class="card-body text-muted"><i class="fas fa-spinner fa-spin mr-1" aria-hidden="true"></i> Recherche…</div></div>';
  }
  function erreur(texte) {
    elResultat.innerHTML = '<div class="alert alert-danger" role="alert">' + esc(texte) + '</div>';
  }
  /** Annonce vocale (lecteur d'écran) du résultat : la fiche remplace tout le bloc, qui ne peut donc pas être une zone « live ». */
  function annoncer(texte) {
    if (!elAnnonce) { return; }
    elAnnonce.textContent = '';
    setTimeout(function () { elAnnonce.textContent = texte; }, 30);
  }
  /** Amène le résultat à l'écran s'il commence trop bas (tablette en paysage, portable) : on consulte sans défiler à la main. */
  function amener() {
    try {
      var r = elResultat.getBoundingClientRect();
      if (r.top > w.innerHeight * 0.4 || r.top < 0) { elResultat.scrollIntoView({ block: 'start' }); }
    } catch (e) { /* ancien navigateur */ }
  }

  // ---- affichage d'une pièce
  function lienPage(page, params) {
    var q = ['page=' + encodeURIComponent(page)];
    Object.keys(params).forEach(function (k) { q.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k])); });
    return 'index.php?' + q.join('&amp;');
  }
  function qte(q, unite) { return esc(w.fmtQte(q)) + (unite && unite !== 'unité' ? ' <small class="text-muted">' + esc(unite) + '</small>' : ''); }

  function htmlPiece(p) {
    var h = [];
    var actif = !!p.actif;
    h.push('<div class="card sc-fiche"><div class="card-body">');
    h.push('<div class="sc-entete"><div class="sc-code code">' + esc(p.code) + '</div>');
    h.push('<h2 class="sc-nom">' + esc(p.nom) + '</h2><div class="sc-meta">');
    if (p.categorie) { h.push('<span class="badge badge-info">' + esc(p.categorie) + '</span> '); }
    if (p.unite && p.unite !== 'unité') { h.push('<span class="badge badge-light border">Unité : ' + esc(p.unite) + '</span>'); }
    if (!actif) { h.push(' <span class="badge badge-secondary">Pièce désactivée</span>'); }
    h.push('</div></div>');
    if (p.description) { h.push('<p class="text-muted sc-description">' + esc(p.description) + '</p>'); }
    if (!actif) { h.push('<div class="alert alert-secondary mt-2" role="status">Cette pièce est désactivée : elle n\'apparaît plus dans les listes de saisie. Son historique est conservé. Pour la remettre en service, demandez à un gestionnaire de la réactiver (bouton « Fiche complète »).</div>'); }

    (p.minimums || []).forEach(function (m) {
      if (m.sous_minimum) {
        h.push('<div class="alert alert-danger sc-alerte" role="alert"><i class="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i> <strong>Sous le minimum</strong> — ' +
          esc(m.entreprise) + ' : ' + esc(w.fmtQte(m.quantite)) + ' en stock, minimum ' + esc(w.fmtQte(m.minimum)) + '.</div>');
      }
    });

    // Quantités : par entreprise (total), puis par emplacement
    var ents = {}, ordre = [];
    function ent(id, nom) { if (!ents[id]) { ents[id] = { id: id, nom: nom, lignes: [], total: null, min: null, cout: null }; ordre.push(id); } return ents[id]; }
    (p.stock || []).forEach(function (s) { ent(s.entreprise_id, s.entreprise).lignes.push(s); });
    (p.totaux || []).forEach(function (t) { var e = ent(t.entreprise_id, t.entreprise); e.total = t.quantite; if (t.cout_moyen !== undefined) { e.cout = t.cout_moyen; } });
    (p.minimums || []).forEach(function (m) { var e = ent(m.entreprise_id, m.entreprise); e.min = m.minimum; if (e.total === null) { e.total = m.quantite; } });
    ordre.sort(function (a, b) { return a - b; });
    h.push('<h3 class="sc-h3">Quantité en stock</h3>');
    if (!ordre.length) {
      h.push('<p class="text-muted">Aucun stock de cette pièce dans vos entreprises.</p>');
    } else {
      h.push('<div class="table-responsive"><table class="table table-sm sc-table" aria-label="Quantités par entreprise et par emplacement"><thead><tr><th scope="col">Entreprise / emplacement</th><th scope="col" class="nombre">Quantité</th>');
      if (gestionnaire) { h.push('<th scope="col" class="nombre">Coût moyen</th>'); }
      h.push('<th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>');
      ordre.forEach(function (id) {
        var e = ents[id];
        h.push('<tr class="sc-ent"><th scope="row">' + esc(e.nom) + (e.min !== null ? ' <small class="text-muted font-weight-normal">(minimum ' + esc(w.fmtQte(e.min)) + ')</small>' : '') + '</th>');
        h.push('<th class="nombre" data-total-ent="' + esc(id) + '">Total : ' + qte(e.total === null ? '0' : e.total, p.unite) + '</th>');
        if (gestionnaire) { h.push('<th class="nombre">' + (e.cout !== null ? esc(w.fmtArgent(e.cout, 4)) : '') + '</th>'); }
        h.push('<th></th></tr>');
        if (!e.lignes.length) { h.push('<tr><td colspan="' + (gestionnaire ? 4 : 3) + '" class="text-muted pl-4">Aucun stock à cette entreprise.</td></tr>'); }
        e.lignes.forEach(function (s) {
          h.push('<tr data-emplacement="' + esc(s.emplacement_id) + '"><td class="pl-4">' + esc(s.emplacement) + ' <small class="text-muted">' + esc(TYPES_EMP[s.type] || s.type) + '</small></td>');
          h.push('<td class="nombre">' + qte(s.quantite, p.unite) + '</td>');
          if (gestionnaire) { h.push('<td></td>'); }
          h.push('<td class="text-right"><button type="button" class="btn btn-sm btn-outline-secondary sc-voir-emp" data-emp="' + esc(s.emplacement_id) + '" aria-label="Voir le contenu — ' + esc(s.emplacement) + '">Voir le contenu</button></td></tr>');
        });
      });
      h.push('</tbody></table></div>');
    }

    // Prix fournisseurs : gestionnaire+ seulement (le serveur ne les envoie pas aux employés)
    if (gestionnaire && Array.isArray(p.prix_fournisseurs)) {
      h.push('<h3 class="sc-h3">Prix chez les fournisseurs</h3>');
      if (!p.prix_fournisseurs.length) { h.push('<p class="text-muted">Aucun prix fournisseur enregistré.</p>'); }
      else {
        h.push('<div class="table-responsive"><table class="table table-sm sc-table" aria-label="Prix chez les fournisseurs"><thead><tr><th scope="col">Fournisseur</th><th scope="col">N° fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Date</th></tr></thead><tbody>');
        p.prix_fournisseurs.forEach(function (f, i) {
          h.push('<tr><td>' + esc(f.fournisseur) + (i === 0 && p.prix_fournisseurs.length > 1 ? ' <span class="badge badge-success">Meilleur prix</span>' : '') + '</td><td class="code">' + esc(f.no_fournisseur || '') + '</td><td class="nombre">' + esc(w.fmtArgent(f.prix, 4)) + '</td><td>' + esc(f.date_prix) + '</td></tr>');
        });
        h.push('</tbody></table></div>');
      }
    }

    // Codes-barres
    h.push('<h3 class="sc-h3">Codes-barres</h3><ul class="list-inline sc-codes"><li class="list-inline-item"><span class="code sc-code-chip">' + esc(p.code) + '</span> <small class="text-muted">code interne</small></li>');
    (p.codes || []).forEach(function (c) {
      h.push('<li class="list-inline-item"><span class="code sc-code-chip">' + esc(c.code) + '</span> <small class="text-muted">' + esc(TYPES_CODE[c.type] || c.type) + '</small></li>');
    });
    h.push('</ul>');

    // Actions
    var unique = (p.stock || []).length === 1 ? { emplacement_id: p.stock[0].emplacement_id } : {};
    h.push('<div class="sc-actions no-print">');
    if (actif) {
      h.push('<a class="btn btn-primary" href="' + lienPage('transfert', $.extend({ piece_id: p.id }, unique)) + '"><i class="fas fa-exchange-alt mr-1" aria-hidden="true"></i> Transférer</a>');
      h.push('<a class="btn btn-primary" href="' + lienPage('sortie', $.extend({ piece_id: p.id }, unique)) + '"><i class="fas fa-sign-out-alt mr-1" aria-hidden="true"></i> Sortir</a>');
      if (gestionnaire) { h.push('<a class="btn btn-primary" href="' + lienPage('reception', { piece_id: p.id }) + '"><i class="fas fa-truck-loading mr-1" aria-hidden="true"></i> Réceptionner</a>'); }
    }
    h.push('<a class="btn btn-outline-secondary" href="' + lienPage('piece_voir', { id: p.id }) + '"><i class="fas fa-file-alt mr-1" aria-hidden="true"></i> Fiche complète</a>');
    h.push('</div></div></div>');
    return h.join('');
  }

  // ---- affichage d'un emplacement
  function htmlEmplacement(r) {
    var e = r.emplacement, h = [];
    h.push('<div class="card sc-fiche sc-fiche-emp"><div class="card-body">');
    h.push('<div class="sc-entete"><div class="sc-code code">' + esc(e.code_barres || '') + '</div><h2 class="sc-nom">' + esc(e.nom) + '</h2><div class="sc-meta">');
    h.push('<span class="badge badge-info">' + esc(e.type_libelle) + '</span> <span class="badge badge-light border">' + esc(e.entreprise_nom) + '</span>');
    if (!e.actif) { h.push(' <span class="badge badge-secondary">Emplacement désactivé</span>'); }
    h.push('</div></div>');
    h.push('<p class="sc-resume" id="sc-resume-emp"><strong>' + esc(r.nb_pieces) + '</strong> ' + (r.nb_pieces > 1 ? 'pièces différentes' : 'pièce différente') + ' dans cet emplacement');
    if (gestionnaire && r.valeur_totale !== undefined) { h.push(' — valeur totale : <strong id="sc-valeur-emp">' + esc(w.fmtArgent(r.valeur_totale)) + '</strong> <small class="text-muted">(au coût moyen, arrondie sur l\'ensemble : elle peut différer de quelques sous de la somme des lignes)</small>'); }
    h.push('</p>');
    if (r.comptage_en_cours) {
      h.push('<div class="alert alert-warning" role="status">Un comptage est déjà en cours à cet emplacement : <a class="alert-link" href="' + lienPage('comptage_voir', { id: r.comptage_en_cours.id }) + '">' + esc(r.comptage_en_cours.numero) + '</a>.</div>');
    }
    if (!r.lignes.length) {
      h.push('<p class="text-muted sc-vide">Cet emplacement est vide : aucune pièce n\'y est enregistrée.</p>');
    } else {
      h.push('<div class="table-responsive"><table class="table table-sm table-striped sc-table" aria-label="Contenu de l\'emplacement"><thead><tr><th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th>');
      if (gestionnaire) { h.push('<th scope="col" class="nombre">Coût moyen</th><th scope="col" class="nombre">Valeur</th>'); }
      h.push('</tr></thead><tbody>');
      r.lignes.forEach(function (l) {
        h.push('<tr data-piece="' + esc(l.piece_id) + '"><td class="code"><button type="button" class="btn btn-link p-0 sc-voir-piece" data-piece="' + esc(l.piece_id) + '" data-code="' + esc(l.code) + '">' + esc(l.code) + '</button></td><td>' + esc(l.nom) + (l.actif ? '' : ' <span class="badge badge-secondary">désactivée</span>') + '</td><td class="nombre">' + qte(l.quantite, l.unite) + '</td>');
        if (gestionnaire) { h.push('<td class="nombre">' + esc(w.fmtArgent(l.cout_moyen, 4)) + '</td><td class="nombre">' + esc(w.fmtArgent(l.valeur)) + '</td>'); }
        h.push('</tr>');
      });
      h.push('</tbody></table></div>');
    }
    h.push('<div class="sc-actions no-print">');
    if (r.comptage_en_cours) {
      h.push('<a class="btn btn-primary" id="sc-reprendre" href="' + lienPage('comptage_voir', { id: r.comptage_en_cours.id }) + '"><i class="fas fa-clipboard-check mr-1" aria-hidden="true"></i> Reprendre le comptage ' + esc(r.comptage_en_cours.numero) + '</a>');
    } else if (e.actif) {
      h.push('<button type="button" class="btn btn-primary" id="sc-compter" data-emp="' + esc(e.id) + '"><i class="fas fa-clipboard-check mr-1" aria-hidden="true"></i> Compter cet emplacement</button>');
    }
    if (e.actif) {
      h.push('<a class="btn btn-outline-primary" href="' + lienPage('transfert', { emplacement_id: e.id }) + '"><i class="fas fa-exchange-alt mr-1" aria-hidden="true"></i> Transférer d\'ici</a>');
      h.push('<a class="btn btn-outline-primary" href="' + lienPage('sortie', { emplacement_id: e.id }) + '"><i class="fas fa-sign-out-alt mr-1" aria-hidden="true"></i> Sortir d\'ici</a>');
    }
    h.push('</div></div></div>');
    return h.join('');
  }

  // ---- parcours : afficher
  function montrerPiece(pieceId, codeSaisi) {
    var mon = ++seq; chargement(); message('', '');
    return w.api.get('app/ajax/scanner_code.php', { piece_id: pieceId }).then(function (r) {
      if (mon !== seq) { return true; }
      return rendrePiece(r, codeSaisi || '');
    }).catch(function (e) { if (mon === seq) { erreur(e.message); } return false; });
  }
  function rendrePiece(r, codeSaisi) {
    var p = r.piece;
    elResultat.innerHTML = htmlPiece(p);
    amener();
    annoncer('Fiche de ' + p.code + ', ' + p.nom + (p.actif ? '.' : ' : pièce désactivée.'));
    ajouterHist({ type: 'piece', id: p.id, code: codeSaisi || p.code, libelle: p.nom + (p.actif ? '' : ' (désactivée)') });
    return true;
  }
  function montrerEmplacement(empId, codeSaisi) {
    var mon = ++seq; chargement(); message('', '');
    return w.api.get('app/ajax/scanner_contenu.php', { emplacement_id: empId }).then(function (r) {
      if (mon !== seq) { return true; }
      elResultat.innerHTML = htmlEmplacement(r);
      amener();
      annoncer('Contenu de ' + r.emplacement.nom + ' : ' + r.nb_pieces + (r.nb_pieces > 1 ? ' pièces différentes.' : ' pièce différente.'));
      ajouterHist({ type: 'emplacement', id: r.emplacement.id, code: codeSaisi || r.emplacement.code_barres || '', libelle: r.emplacement.nom + ' — ' + r.nb_pieces + (r.nb_pieces > 1 ? ' pièces' : ' pièce') });
      return true;
    }).catch(function (e) { if (mon === seq) { erreur(e.message); } return false; });
  }
  /** Code scanné : pièce, emplacement ou inconnu (message + bip d'erreur). */
  function traiterCode(code) {
    var mon = ++seq; chargement(); message('', '');
    return w.api.get('app/ajax/scanner_code.php', { code: code }).then(function (r) {
      if (mon !== seq) { return r.trouve ? true : false; }
      if (!r.trouve) {
        annoncer('Code inconnu : ' + code + '.');
        elResultat.innerHTML = '<div class="alert alert-danger sc-inconnu" role="alert"><i class="fas fa-times-circle mr-1" aria-hidden="true"></i> <strong>Code inconnu : « ' + esc(code) + ' ».</strong><br>' +
          'Aucune pièce ni aucun emplacement de vos entreprises ne porte ce code. Vérifiez l\'étiquette ou cherchez la pièce par son nom.</div>';
        ajouterHist({ type: 'inconnu', code: code, libelle: 'Code inconnu' });
        return false;
      }
      if (r.type === 'piece') { return rendrePiece(r, code); }
      return montrerEmplacement(r.emplacement.id, code);
    }).catch(function (e) {
      if (mon === seq) { erreur(e.message); }
      return false;
    });
  }

  // ---- actions dans la fiche
  elResultat.addEventListener('click', function (ev) {
    var b = ev.target.closest('.sc-voir-emp');
    if (b) { montrerEmplacement(parseInt(b.getAttribute('data-emp'), 10)).then(function () { focusScan(); }); return; }
    b = ev.target.closest('.sc-voir-piece');
    if (b) { montrerPiece(parseInt(b.getAttribute('data-piece'), 10), b.getAttribute('data-code')).then(function () { focusScan(); }); return; }
    b = ev.target.closest('#sc-compter');
    if (b) {
      if (b.disabled) { return; }
      b.disabled = true;
      postBrut('app/action/comptage_creer.php', { emplacement_id: parseInt(b.getAttribute('data-emp'), 10) }).then(function (r) {
        var j = r.data;
        if (j.ok) { w.location.href = 'index.php?page=comptage_voir&id=' + encodeURIComponent(j.id); return; }
        b.disabled = false;
        message('warning', esc(j.erreur || 'Impossible de créer le comptage.') + (j.existant ? ' <a class="alert-link" href="' + lienPage('comptage_voir', { id: j.existant.id }) + '">Ouvrir le comptage ' + esc(j.existant.numero) + '</a>' : ''));
        focusScan();
      }).catch(function (e) { b.disabled = false; w.toast(e.message, 'danger'); focusScan(); });
    }
  });

  // ---- champ de scan (file d'attente : aucune perte en rafale)
  var file = lier(elScan, traiterCode, {
    onAttente: function (n) { var a = qs('#sc-attente'); if (a) { a.textContent = n > 1 ? n + ' scans en attente…' : ''; } },
    onErreur: function () { /* le message est déjà affiché dans la zone de résultat */ }
  });
  focusAuto(elScan, racine);
  clavier(qs('#btn-clavier'), elScan);

  // ---- recherche texte de secours
  var $rech = $('#recherche');
  $rech.select2({
    placeholder: 'Taper une partie du nom ou du code…', allowClear: true, minimumInputLength: 1, dropdownParent: $(d.body),
    ajax: {
      url: 'app/ajax/pieces_recherche.php', dataType: 'json', delay: 200,
      data: function (p) { return { q: p.term || '' }; },
      processResults: function (r) { return { results: (r.pieces || []).map(function (p) { return { id: p.id, text: p.code + ' — ' + p.nom }; }) }; }
    }
  });
  select2Propre($rech);
  select2Etiquette($rech, 'lib-recherche');
  $rech.on('select2:select', function (e) {
    var id = e.params.data.id;
    $rech.val(null).trigger('change');
    montrerPiece(id).then(function () { focusScan(); });
  });

  // ---- choix d'un emplacement dans la liste
  var $emp = $('#emp-choix');
  w.api.get('app/ajax/emplacements_liste.php').then(function (r) {
    var groupes = {}, ordre = [];
    (r.emplacements || []).forEach(function (e) {
      if (!groupes[e.entreprise_id]) { groupes[e.entreprise_id] = { nom: e.entreprise_nom, items: [] }; ordre.push(e.entreprise_id); }
      groupes[e.entreprise_id].items.push(e);
    });
    var h = '<option value="">— Choisir un emplacement —</option>';
    ordre.forEach(function (id) {
      h += '<optgroup label="' + esc(groupes[id].nom) + '">' + groupes[id].items.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.nom) + ' (' + esc(TYPES_EMP[e.type] || e.type) + ')</option>'; }).join('') + '</optgroup>';
    });
    $emp.html(h).prop('disabled', false);
  }).catch(function () { $emp.html('<option value="">Liste indisponible</option>'); });
  $emp.on('change', function () {
    var v = parseInt(this.value, 10);
    this.value = '';
    if (v) { montrerEmplacement(v).then(function () { focusScan(); }); }
  });

  // ---- caméra
  var bCam = qs('#btn-camera');
  var cam = camera(qs('#cam-zone'), function (code) { file.ajouter(code); }, { onFermer: function () { if (bCam) { bCam.setAttribute('aria-expanded', 'false'); } } });
  if (bCam) {
    bCam.addEventListener('click', function () {
      if (cam.actif()) { cam.fermer(); bCam.setAttribute('aria-expanded', 'false'); focusScan(); return; }
      bCam.setAttribute('aria-expanded', 'true');
      cam.ouvrir();
      focusScan();   // le lecteur de codes-barres reste utilisable pendant que la caméra est ouverte
    });
    qs('#cam-zone').addEventListener('click', function (e) { if (e.target.closest('.sc-camera-fermer')) { bCam.setAttribute('aria-expanded', 'false'); focusScan(); } });
  }

  // ---- démarrage
  purgerAutresHist();
  historique = lireHist();
  dessinerHist();
  qs('#sc-vider-hist').addEventListener('click', function () { historique = []; ecrireHist(); dessinerHist(); focusScan(); });
  focusScan();
})(window, jQuery);
