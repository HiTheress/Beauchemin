/* Étiquettes code-barres (page « etiquettes ») : sélection, aperçu fidèle à l'impression, impression.
 * Le serveur (app/ajax/etiquettes_donnees.php) fabrique les codes-barres Code 128 ; ce script place les
 * étiquettes sur des « pages » aux dimensions réelles (mm) et injecte la règle @page du format choisi. */
(function (w, $) {
  'use strict';

  var cfgEl = document.getElementById('et-config');
  if (!cfgEl) { return; }
  var cfg = JSON.parse(cfgEl.getAttribute('data-config'));
  var FORMATS = cfg.formats;
  var MAX_ET = cfg.max_etiquettes, MAX_COPIES = cfg.max_copies;

  var items = [];            // { cle, type, id, code, nom, droite, copies (chaîne saisie), erreur (texte|null) }
  var format = cfg.format_defaut;
  var donnees = null;        // dernière réponse du serveur (éléments dans l'ordre de la liste)
  var seq = 0, minuterie = null, enCours = false, nbRefus = 0, cptLigne = 0;

  function el(tag, attrs, texte) {
    var e = document.createElement(tag);
    if (attrs) { Object.keys(attrs).forEach(function (k) { if (k === 'class') { e.className = attrs[k]; } else { e.setAttribute(k, attrs[k]); } }); }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }
  function $id(id) { return document.getElementById(id); }
  function msg(err) {
    if (err && err.name === 'TypeError') { return 'Le serveur ne répond pas. Vérifiez votre connexion, puis réessayez.'; }
    return (err && err.message) || 'Erreur inattendue.';
  }
  function entier(s) { s = String(s).trim(); return /^\d+$/.test(s) ? parseInt(s, 10) : NaN; }
  /* Typographie française : espace insécable dans « … » et avant : ; ? ! (jamais de « » ou de « : » seul en début de ligne). */
  function fr(s) {
    return String(s).replace(/« +/g, '«\u00a0').replace(/ +»/g, '\u00a0»').replace(/ +([:;?!])/g, '\u00a0$1');
  }
  function nb(n) { return w.fmtQte(String(n)); }
  function pluriel(n, un, plusieurs) { return nb(n) + ' ' + (n > 1 ? plusieurs : un); }
  function versScan() { setTimeout(function () { var s = $id('et-scan'); if (s) { s.focus(); } }, 0); }

  // ---- Fenêtre de confirmation (Promise<boolean>) : le message est inséré en texte, jamais en HTML -----------------
  var confirmationOuverte = false;
  function confirmerAction(titre, message, libelle) {
    if (confirmationOuverte) { return Promise.resolve(false); }
    confirmationOuverte = true;
    return new Promise(function (resolve) {
      var m = $id('et-modal-confirmer');
      if (!m) {
        m = el('div', { id: 'et-modal-confirmer', class: 'modal fade', tabindex: '-1', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'et-modal-titre' });
        m.innerHTML = '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">'
          + '<div class="modal-header"><h5 class="modal-title" id="et-modal-titre"></h5>'
          + '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>'
          + '<div class="modal-body"><p class="mb-0" id="et-modal-message"></p></div>'
          + '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="et-modal-non">Annuler</button>'
          + '<button type="button" class="btn btn-danger" id="et-modal-oui"></button></div></div></div>';
        document.body.appendChild(m);
      }
      $id('et-modal-titre').textContent = titre;
      $id('et-modal-message').textContent = fr(message);
      $id('et-modal-oui').textContent = libelle;
      var decision = false;
      $id('et-modal-oui').onclick = function () { decision = true; $(m).modal('hide'); };
      $(m).off('shown.bs.modal.et hidden.bs.modal.et')
        .on('shown.bs.modal.et', function () { $id('et-modal-non').focus(); })
        .one('hidden.bs.modal.et', function () { confirmationOuverte = false; resolve(decision); });
      $(m).modal('show');
    });
  }

  function copiesDefautValide() { var n = entier($id('et-copies-defaut').value); return n >= 1 && n <= MAX_COPIES; }
  function copiesDefaut() {
    var n = entier($id('et-copies-defaut').value);
    return (n >= 1 && n <= MAX_COPIES) ? n : 1;
  }
  /* « Copies par élément ajouté » invalide : on ajoute 1 copie, mais on le dit (jamais de remplacement silencieux). */
  function verifCopiesDefaut() {
    if (!copiesDefautValide()) { w.toast(fr('Le nombre de copies par élément est invalide (entier de 1 à ' + MAX_COPIES + ') : une seule copie a été ajoutée.'), 'warning'); }
  }
  function copiesValides(it) { var n = entier(it.copies); return n >= 1 && n <= MAX_COPIES; }
  function totalEtiquettes() {
    return items.reduce(function (t, it) { return t + (copiesValides(it) ? entier(it.copies) : 0); }, 0);
  }

  // ---- Liste des éléments -------------------------------------------------------------
  /* Ajoute un élément. Déjà présent : +copies (un scan ou un choix répété veut une étiquette de plus),
   * sauf pour un ajout en bloc (catégorie, tous les emplacements) où on le laisse tel quel. */
  function ajouter(info, copies, silencieux, enBloc) {
    var cle = info.type + ':' + info.id;
    var n = copies || copiesDefaut();
    var ex = items.filter(function (i) { return i.cle === cle; })[0];
    if (ex && enBloc === true) { return false; }
    if (ex) {
      var c = copiesValides(ex) ? entier(ex.copies) : 0;
      ex.copies = String(Math.min(MAX_COPIES, c + n));
    } else {
      if (items.length >= cfg.max_elements) { throw new Error('La liste est pleine (maximum ' + cfg.max_elements + ' éléments).'); }
      items.push({ cle: cle, type: info.type, id: info.id, code: info.code, nom: info.nom, droite: info.droite, copies: String(n), erreur: null });
    }
    if (silencieux !== true) { dessinerListe(cle); programmerApercu(); }
    return true;
  }

  function deja(info) { return items.some(function (i) { return i.cle === info.type + ':' + info.id; }); }

  function retirer(cle) {
    items = items.filter(function (i) { return i.cle !== cle; });
    dessinerListe(); programmerApercu();
  }

  function dessinerListe(clignoter) {
    var tbody = document.querySelector('#et-table tbody');
    tbody.innerHTML = '';
    items.forEach(function (it) {
      var tr = el('tr');
      it.tr = tr;
      var tdT = el('td'); tdT.appendChild(el('span', { class: 'badge et-badge-type ' + (it.type === 'piece' ? 'badge-primary' : 'badge-info') }, it.type === 'piece' ? 'Pièce' : 'Emplacement'));
      tr.appendChild(tdT);
      tr.appendChild(el('td', { class: 'code' }, it.code));
      var tdN = el('td'); tdN.appendChild(document.createTextNode(it.nom));
      if (it.droite) { tdN.appendChild(el('small', { class: 'text-muted ml-1' }, '(' + it.droite + ')')); }
      it.celErreur = el('div', { class: 'small text-danger' });
      tdN.appendChild(it.celErreur);
      tr.appendChild(tdN);
      var tdC = el('td', { class: 'nombre' });
      var inp = el('input', { type: 'text', inputmode: 'numeric', class: 'form-control form-control-sm et-copies-input', 'aria-label': 'Copies de ' + it.code, value: it.copies });
      var fb = el('div', { class: 'invalid-feedback', id: 'et-cop-' + (++cptLigne) }, 'Entrez un nombre de 1 à ' + MAX_COPIES + '.');
      inp.setAttribute('aria-describedby', fb.id);
      inp.classList.toggle('is-invalid', !copiesValides(it));
      inp.addEventListener('input', function () {
        it.copies = inp.value;
        inp.classList.toggle('is-invalid', !copiesValides(it));
        majCompte(); programmerApercu();
      });
      tdC.appendChild(inp); tdC.appendChild(fb); tr.appendChild(tdC);
      var tdX = el('td', { class: 'text-right', style: 'width:60px' });
      var bx = el('button', { type: 'button', class: 'btn btn-sm btn-outline-danger', title: 'Retirer de la liste', 'aria-label': 'Retirer ' + it.code });
      bx.appendChild(el('i', { class: 'fas fa-times' }));
      bx.addEventListener('click', function () { retirer(it.cle); });
      tdX.appendChild(bx); tr.appendChild(tdX);
      tbody.appendChild(tr);
      if (clignoter === it.cle) { tr.classList.add('table-success'); setTimeout(function () { tr.classList.remove('table-success'); }, 700); }
    });
    $id('et-table').style.display = items.length ? '' : 'none';
    $id('et-vide').style.display = items.length ? 'none' : '';
    $id('et-vider').disabled = !items.length;
    marquerErreurs();
    majCompte();
  }

  /* Surligne les lignes refusées par le serveur sans reconstruire le tableau (garde le focus d'une saisie en cours). */
  function marquerErreurs() {
    items.forEach(function (it) {
      if (!it.tr) { return; }
      it.tr.classList.toggle('table-danger', !!it.erreur);
      if (it.erreur) { it.tr.setAttribute('title', it.erreur); } else { it.tr.removeAttribute('title'); }
      it.celErreur.textContent = it.erreur || '';
    });
  }

  function majCompte() {
    $id('et-compte').textContent = items.length;
  }

  // ---- Format et @page ---------------------------------------------------------------
  function appliquerFormat() {
    var f = FORMATS[format];
    var styleEl = $id('et-page-style');
    if (!styleEl) { styleEl = el('style', { id: 'et-page-style' }); document.head.appendChild(styleEl); }
    styleEl.textContent = '@page { size: ' + f.page_largeur + 'mm ' + f.page_hauteur + 'mm; margin: 0; }';
    $id('et-depart-groupe').style.display = (f.colonnes * f.rangees > 1) ? '' : 'none';
    var max = f.colonnes * f.rangees;
    $id('et-depart').setAttribute('aria-label', 'Première étiquette à utiliser (1 à ' + max + ')');
    majDepartChamp();
  }

  function depart() {
    var f = FORMATS[format], max = f.colonnes * f.rangees;
    if (max < 2) { return 1; }
    var n = entier($id('et-depart').value);
    return (n >= 1 && n <= max) ? n : 1;
  }
  /* « Première étiquette à utiliser » hors de 1..N (vide, 0, 31, texte) : imprimer partirait de la case 1, sur des étiquettes peut-être déjà utilisées. */
  function departInvalide() {
    var f = FORMATS[format], max = f.colonnes * f.rangees;
    if (max < 2) { return false; }
    var n = entier($id('et-depart').value);
    return !(n >= 1 && n <= max);
  }
  function majDepartChamp() {
    var f = FORMATS[format], max = f.colonnes * f.rangees;
    var inp = $id('et-depart'), fb = $id('et-depart-err');
    inp.classList.toggle('is-invalid', departInvalide());
    if (fb) { fb.textContent = 'Entrez un nombre de 1 à ' + max + '.'; }
  }

  // ---- Aperçu --------------------------------------------------------------------------
  function programmerApercu() {
    seq++;   // toute réponse en cours devient périmée
    $id('et-imprimer').disabled = true;
    clearTimeout(minuterie);
    minuterie = setTimeout(chargerApercu, 250);
  }

  function chargerApercu() {
    var mon = ++seq;
    donnees = null;
    var invalide = items.some(function (it) { return !copiesValides(it); });
    var total = totalEtiquettes();
    items.forEach(function (it) { it.erreur = null; });
    marquerErreurs();
    nbRefus = 0;
    $id('et-refus').style.display = 'none';
    if (!items.length) { $id('et-apercu').innerHTML = ''; resume(); return; }
    if (invalide) { $id('et-apercu').innerHTML = ''; resume('Corrigez le nombre de copies : un entier de 1 à ' + MAX_COPIES + '.'); return; }
    if (total > MAX_ET) { $id('et-apercu').innerHTML = ''; resume('Trop d\'étiquettes d\'un coup : ' + nb(total) + ' (maximum ' + nb(MAX_ET) + ' par impression).'); return; }
    enCours = true;
    var zone = $id('et-apercu');
    zone.innerHTML = ''; zone.appendChild(el('div', { class: 'et-chargement' }, 'Génération de l\'aperçu…'));
    w.api.post('app/ajax/etiquettes_donnees.php', {
      format: format,
      elements: items.map(function (it) { return { type: it.type, id: it.id, copies: entier(it.copies) }; })
    }).then(function (r) {
      if (mon !== seq) { return; }
      enCours = false; donnees = r.elements;
      var refus = [];
      r.elements.forEach(function (e, i) { if (!e.ok && items[i]) { items[i].erreur = e.erreur; refus.push(e); } });
      nbRefus = refus.length;
      marquerErreurs();
      afficherRefus(refus);
      dessinerApercu();
    }).catch(function (err) {
      if (mon !== seq) { return; }
      enCours = false;
      zone.innerHTML = '';
      resume(msg(err));
      w.toast(msg(err), 'danger');
    });
  }

  function afficherRefus(refus) {
    var box = $id('et-refus');
    box.innerHTML = '';
    if (!refus.length) { box.style.display = 'none'; return; }
    box.appendChild(el('strong', null, fr(pluriel(refus.length, 'élément refusé', 'éléments refusés') + ' (non imprimé' + (refus.length > 1 ? 's' : '') + ') :')));
    var ul = el('ul', { class: 'mb-0' });
    refus.forEach(function (e) { ul.appendChild(el('li', null, fr(e.erreur))); });
    box.appendChild(ul);
    box.style.display = '';
  }

  function resume(message) {
    var box = $id('et-resume'), btn = $id('et-imprimer');
    var f = FORMATS[format];
    var valides = donnees ? donnees.filter(function (e) { return e.ok; }) : [];
    var n = valides.reduce(function (t, e) { return t + e.copies; }, 0);
    box.className = 'alert border';
    if (message) {
      box.classList.add('alert-warning'); box.textContent = fr(message); btn.disabled = true; return;
    }
    if (!items.length) { box.classList.add('alert-light'); box.textContent = 'Aucune étiquette à imprimer.'; btn.disabled = true; return; }
    if (!donnees) { box.classList.add('alert-light'); box.textContent = 'Préparation de l\'aperçu…'; btn.disabled = true; return; }
    if (!n) { box.classList.add('alert-danger'); box.textContent = fr('Aucune étiquette ne peut être imprimée : voir les éléments refusés ci-dessous.'); btn.disabled = true; return; }
    var par = f.colonnes * f.rangees;
    if (departInvalide()) {   // une case de départ invalide n'est jamais remplacée en silence : on bloque l'impression
      box.classList.add('alert-warning'); box.textContent = fr('Première étiquette : entrez un nombre de 1 à ' + par + '.'); btn.disabled = true; return;
    }
    var texte;
    if (par > 1) {
      var d = depart(), pages = Math.ceil((n + d - 1) / par);
      texte = pluriel(n, 'étiquette', 'étiquettes') + ' sur ' + pluriel(pages, 'feuille', 'feuilles') + ' (' + par + ' par feuille' + (d > 1 ? ', en commençant à la case ' + d : '') + ').';
    } else {
      texte = pluriel(n, 'étiquette', 'étiquettes') + ' : une étiquette par page, ' + String(f.largeur).replace('.', ',') + ' × ' + String(f.hauteur).replace('.', ',') + ' mm.';
    }
    if (nbRefus) {   // des éléments manquent : le résumé ne doit pas laisser croire que tout sera imprimé
      box.classList.add('alert-warning');
      texte += ' ' + pluriel(nbRefus, 'élément refusé n\'est pas imprimé', 'éléments refusés ne sont pas imprimés') + ' (voir ci-dessous).';
    } else {
      box.classList.add('alert-success');
    }
    box.textContent = fr(texte);
    btn.disabled = false;
  }

  function etiquetteDom(e) {
    var d = el('div', { class: 'et-etiquette' });
    var b = el('div', { class: 'et-barres' });
    b.innerHTML = e.svg;   // SVG fabriqué par le serveur : le code (ASCII imprimable) y est échappé
    d.appendChild(b);
    var l = el('div', { class: 'et-ligne' });
    var c = el('span', { class: 'et-code' }, e.code);
    c.style.fontSize = e.code_pt + 'pt';
    l.appendChild(c);
    l.appendChild(el('span', { class: 'et-droite' }, e.droite));
    d.appendChild(l);
    d.appendChild(el('div', { class: 'et-nom' }, e.nom_affiche));
    return d;
  }

  function dessinerApercu() {
    var zone = $id('et-apercu');
    zone.innerHTML = '';
    var f = FORMATS[format];
    var etiquettes = [];
    (donnees || []).forEach(function (e) {
      if (!e.ok) { return; }
      var modele = etiquetteDom(e);
      for (var i = 0; i < e.copies; i++) { etiquettes.push(modele.cloneNode(true)); }
    });
    resume();
    if (!etiquettes.length) { return; }

    var par = f.colonnes * f.rangees;
    var avant = par > 1 ? depart() - 1 : 0;
    for (var i = 0; i < avant; i++) { etiquettes.unshift(el('div', { class: 'et-etiquette et-vide' })); }

    // facteur d'affichage (à l'écran seulement) : tient dans la largeur disponible
    var dispo = zone.clientWidth - 32;
    var largeurPx = f.page_largeur * 96 / 25.4;
    var zoom = Math.min(f.zoom || 1, dispo > 0 ? dispo / largeurPx : 1);
    if (zoom > 1) { zoom = Math.floor(zoom * 100) / 100; }
    zoom = Math.max(0.3, zoom);

    for (var p = 0; p < etiquettes.length; p += par) {
      var page = el('section', { class: 'et-page ' + (par > 1 ? 'et-feuille' : 'et-unique'), 'aria-label': 'Page ' + (p / par + 1) });
      var s = page.style;
      s.setProperty('--pg-w', f.page_largeur); s.setProperty('--pg-h', f.page_hauteur);
      s.setProperty('--et-w', f.largeur); s.setProperty('--et-h', f.hauteur); s.setProperty('--pad', f.marge_interne);
      s.setProperty('--cols', f.colonnes); s.setProperty('--gap-x', f.ecart_x); s.setProperty('--gap-y', f.ecart_y);
      s.setProperty('--marge-haut', f.marge_haut); s.setProperty('--marge-gauche', f.marge_gauche);
      s.setProperty('--pt-nom', f.police_nom); s.setProperty('--zoom', zoom);
      etiquettes.slice(p, p + par).forEach(function (n) { page.appendChild(n); });
      zone.appendChild(page);
    }
  }

  // ---- Branchements --------------------------------------------------------------------
  $(function () {
    appliquerFormat();

    // Recherche de pièces (select2 multiple : chaque choix ajoute une ligne puis se vide)
    var $rech = $('#et-recherche');
    $rech.select2({
      placeholder: 'Taper le nom ou le code d\'une pièce…', minimumInputLength: 1, multiple: true,
      ajax: {
        url: 'app/ajax/pieces_recherche.php', dataType: 'json', delay: 200,
        data: function (p) { return { q: p.term || '' }; },
        processResults: function (d) {
          return { results: (d.pieces || []).map(function (p) { return { id: p.id, text: p.code + ' — ' + p.nom, code: p.code, nom: p.nom, unite: p.unite }; }) };
        }
      }
    });
    $rech.on('select2:select', function (e) {
      var d = e.params.data;
      verifCopiesDefaut();
      try { ajouter({ type: 'piece', id: parseInt(d.id, 10), code: d.code, nom: d.nom, droite: d.unite }); }
      catch (err) { w.toast(err.message, 'warning'); }
      setTimeout(function () { $rech.val(null).trigger('change'); }, 0);
      versScan();   // le focus ne reste pas dans la recherche : le code suivant tapé au lecteur ne doit pas se perdre
    });

    // Emplacements
    var $emp = $('#et-emplacements');
    $emp.select2({ placeholder: 'Choisir des emplacements…' });
    function empInfo(id) {
      var r = cfg.emplacements.filter(function (x) { return String(x.id) === String(id); })[0];
      return r ? { type: 'emplacement', id: r.id, code: r.code, nom: r.nom, droite: r.entreprise } : null;
    }
    $emp.on('select2:select', function (e) {
      var inf = empInfo(e.params.data.id);
      verifCopiesDefaut();
      if (inf) { try { ajouter(inf); } catch (err) { w.toast(err.message, 'warning'); } }
      setTimeout(function () { $emp.val(null).trigger('change'); }, 0);
      versScan();
    });
    // les deux champs de recherche de select2 n'ont pas de libellé : on leur donne un nom accessible
    $rech.next('.select2').find('.select2-search__field').attr('aria-label', 'Chercher des pièces par nom ou par code');
    $emp.next('.select2').find('.select2-search__field').attr('aria-label', 'Choisir des emplacements');
    $('#et-tous-emplacements').on('click', function () {
      var n = 0;
      verifCopiesDefaut();
      cfg.emplacements.forEach(function (r) {
        if (ajouter(empInfo(r.id), null, true, true)) { n++; }
      });
      dessinerListe(); programmerApercu();
      w.toast(n ? pluriel(n, 'emplacement ajouté', 'emplacements ajoutés') + '.' : 'Tous les emplacements sont déjà dans la liste.', n ? 'success' : 'info');
      versScan();
    });

    // Catégorie complète
    $('#et-ajouter-categorie').on('click', function () {
      var sel = $id('et-categorie'), btn = this;
      if (sel.value === '') { w.toast('Choisissez d\'abord une catégorie.', 'warning'); sel.focus(); return; }
      verifCopiesDefaut();
      btn.disabled = true;
      w.api.get('app/ajax/etiquettes_categorie.php', { categorie_id: sel.value }).then(function (r) {
        if (!r.pieces.length) { w.toast('Cette catégorie ne contient aucune pièce active.', 'info'); versScan(); return; }
        var n = 0, deja = 0, plein = r.tronque;
        r.pieces.forEach(function (p) {
          try {
            if (ajouter({ type: 'piece', id: p.id, code: p.code, nom: p.nom, droite: p.unite }, null, true, true)) { n++; } else { deja++; }
          } catch (err) { plein = true; }
        });
        dessinerListe(); programmerApercu();
        w.toast(pluriel(n, 'pièce ajoutée', 'pièces ajoutées') + (deja ? ' (' + pluriel(deja, 'était déjà dans la liste', 'étaient déjà dans la liste') + ')' : '') + '.'
          + (plein ? ' La liste est limitée à ' + nb(cfg.max_elements) + ' éléments.' : ''), plein ? 'warning' : 'success');
      }).catch(function (err) { w.toast(msg(err), 'danger'); }).then(function () { btn.disabled = false; versScan(); });
    });

    // Scanner : pièce ou emplacement
    w.scanner('#et-scan', function (code) {
      return w.api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
        if (!r.trouve) { throw new Error(fr('Code inconnu : « ' + code + ' ».')); }
        if (r.type === 'emplacement') {
          var inf = empInfo(r.emplacement.id);
          if (!inf) { throw new Error(fr('L\'emplacement « ' + r.emplacement.nom + ' » est désactivé ou n\'a pas de code-barres.')); }
          if (!deja(inf)) { verifCopiesDefaut(); }
          ajouter(inf, deja(inf) ? 1 : null);
        } else {
          if (!r.piece.actif) { throw new Error(fr('La pièce « ' + r.piece.code + ' » est désactivée.')); }
          var pi = { type: 'piece', id: r.piece.id, code: r.piece.code, nom: r.piece.nom, droite: r.piece.unite };
          if (!deja(pi)) { verifCopiesDefaut(); }
          ajouter(pi, deja(pi) ? 1 : null);   // 1re lecture : copies par défaut ; relectures : une étiquette de plus
        }
        return true;
      });
    });

    function vider() { items = []; dessinerListe(); programmerApercu(); versScan(); }
    $('#et-vider').on('click', function () {
      if (items.length > 5) {   // une longue liste (par exemple une catégorie entière) ne se jette pas d'un clic
        confirmerAction('Vider la liste ?', 'Les ' + nb(items.length) + ' éléments de la liste (' + pluriel(totalEtiquettes(), 'étiquette', 'étiquettes') + ') seront retirés.', 'Vider la liste')
          .then(function (oui) { if (oui) { vider(); } else { $id('et-vider').focus(); } });
      } else { vider(); }
    });
    $('#et-copies-defaut').on('input', function () { this.classList.toggle('is-invalid', !copiesDefautValide()); });
    $('#et-saut').on('click', function (ev) {   // lien d'évitement : de la liste directement au format et à l'impression
      ev.preventDefault();
      var c = $id('et-carte-impression');
      c.focus({ preventScroll: true });
      c.scrollIntoView({ block: 'start' });
    });

    $('input[name="et-format"]').on('change', function () {
      format = this.value;
      appliquerFormat();
      programmerApercu();
    });
    $('#et-depart').on('input', function () {
      majDepartChamp();
      if (donnees) { dessinerApercu(); } else { resume(); }
    });

    $('#et-imprimer').on('click', function () {
      if (enCours || !donnees || departInvalide()) { return; }
      w.print();
    });
    w.addEventListener('resize', function () { if (donnees) { dessinerApercu(); } });

    // Préremplissage par l'URL (déjà validé par le serveur)
    cfg.prefill.forEach(function (p) { try { ajouter(p, 1, true); } catch (err) { /* liste pleine */ } });
    dessinerListe();
    if (items.length) { programmerApercu(); } else { resume(); }
    $id('et-scan').focus();
  });
})(window, jQuery);
