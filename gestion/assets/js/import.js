/* Import du catalogue et du stock initial (page « pieces_import »).
 * Étapes : fichier -> analyse par le serveur (aperçu ligne par ligne) -> confirmation -> résumé.
 * Le navigateur conserve les lignes analysées (« source ») et les renvoie à la confirmation ;
 * le serveur revalide tout : l'aperçu n'est qu'une information. */
(function (w, $) {
  'use strict';

  var cfgEl = document.getElementById('imp-config');
  if (!cfgEl) { return; }
  var cfg = JSON.parse(cfgEl.getAttribute('data-config'));
  var PAR_PAGE = 100;
  var SEUIL_CONFIRMATION = 100;   // au-delà de ce nombre de lignes analysées, abandonner l'aperçu demande une confirmation

  var etat = { source: null, meta: null, resultats: [], totaux: null, nom: '', filtre: 'tous', page: 1, occupe: false, seq: 0 };
  var minuterie = null;

  function $id(id) { return document.getElementById(id); }
  function el(tag, attrs, texte) {
    var e = document.createElement(tag);
    if (attrs) { Object.keys(attrs).forEach(function (k) { if (k === 'class') { e.className = attrs[k]; } else { e.setAttribute(k, attrs[k]); } }); }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }
  /* Typographie française : espace insécable dans « … » et avant : ; ? ! (jamais de « » ou de « : » seul en début de ligne). */
  function fr(s) {
    return String(s).replace(/« +/g, '«\u00a0').replace(/ +»/g, '\u00a0»').replace(/ +([:;?!])/g, '\u00a0$1');
  }
  function nb(n) { return w.fmtQte(String(n)); }
  function pluriel(n, un, plusieurs) { return nb(n) + ' ' + (n > 1 ? plusieurs : un); }
  function msg(err) {
    return fr((err && err.message) || 'Erreur inattendue.');
  }
  function csrf() { var m = document.querySelector('meta[name="csrf-token"]'); return m ? m.getAttribute('content') : ''; }
  function annoncer(texte) { var z = $id('imp-annonce'); if (z) { z.textContent = ''; setTimeout(function () { z.textContent = fr(texte); }, 50); } }

  // ---- Fenêtre de confirmation (Promise<boolean>) : le message est inséré en texte, jamais en HTML -----------------
  var confirmationOuverte = false;
  function confirmerAction(titre, message, libelle) {
    if (confirmationOuverte) { return Promise.resolve(false); }
    confirmationOuverte = true;
    return new Promise(function (resolve) {
      var m = $id('imp-modal-confirmer');
      if (!m) {
        m = el('div', { id: 'imp-modal-confirmer', class: 'modal fade', tabindex: '-1', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'imp-modal-titre' });
        m.innerHTML = '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">'
          + '<div class="modal-header"><h5 class="modal-title" id="imp-modal-titre"></h5>'
          + '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>'
          + '<div class="modal-body"><p class="mb-0" id="imp-modal-message"></p></div>'
          + '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary imp-btn" data-dismiss="modal" id="imp-modal-non">Annuler</button>'
          + '<button type="button" class="btn btn-danger imp-btn" id="imp-modal-oui"></button></div></div></div>';
        document.body.appendChild(m);
      }
      $id('imp-modal-titre').textContent = titre;
      $id('imp-modal-message').textContent = fr(message);
      $id('imp-modal-oui').textContent = libelle;
      var decision = false;
      $id('imp-modal-oui').onclick = function () { decision = true; $(m).modal('hide'); };
      $(m).off('shown.bs.modal.imp hidden.bs.modal.imp')
        .on('shown.bs.modal.imp', function () { $id('imp-modal-non').focus(); })
        .one('hidden.bs.modal.imp', function () { confirmationOuverte = false; resolve(decision); });
      $(m).modal('show');
    });
  }

  // ---- Affichage des étapes ------------------------------------------------------------------
  /* Une seule étape « en cours » (aria-current) ; les étapes terminées sont annoncées aux lecteurs d'écran. */
  var ETAPES = { 1: ['actif', '', '', ''], 3: ['fait', 'fait', 'actif', ''], 4: ['fait', 'fait', 'fait', 'actif'] };
  function montrer(etape, avecFocus) {
    $id('imp-depart').style.display = etape === 1 ? '' : 'none';
    $id('imp-options').style.display = (etape === 1 || etape === 3) ? '' : 'none';
    $id('imp-apercu').style.display = etape === 3 ? '' : 'none';
    $id('imp-resultat').style.display = etape === 4 ? '' : 'none';
    var cls = ETAPES[etape];
    for (var i = 0; i < 4; i++) {
      var li = $id('imp-s' + (i + 1));
      li.className = cls[i];
      if (cls[i] === 'actif' || (etape === 4 && i === 3)) { li.setAttribute('aria-current', 'step'); } else { li.removeAttribute('aria-current'); }
      var sr = li.querySelector('.sr-only');
      if (sr) { sr.textContent = (etape === 4 && i === 3) ? ' (étape en cours)' : (cls[i] === 'fait' ? ' (terminée)' : (cls[i] === 'actif' ? ' (étape en cours)' : '')); }
    }
    w.scrollTo(0, 0);
    if (avecFocus) {   // le focus suit l'écran : un clavier ou un lecteur d'écran ne repart pas du haut de la page
      var cible = etape === 3 ? $id('imp-titre-3') : (etape === 4 ? $id('imp-titre-4') : $id('imp-fichier'));
      if (cible) { cible.focus({ preventScroll: true }); }
    }
  }

  function erreurGlobale(message, details, amener) {
    var box = $id('imp-erreur');
    box.innerHTML = '';
    if (!message) { box.style.display = 'none'; return; }
    box.appendChild(el('strong', null, fr(message)));
    if (details && details.length) {
      var ul = el('ul', { class: 'mb-0 mt-2' });
      details.slice(0, 20).forEach(function (d) {
        var txt = 'Ligne ' + d.no + (d.code ? ' (' + d.code + ')' : '') + ' : ' + d.msgs.filter(function (m) { return m[0] === 'erreur'; }).map(function (m) { return m[1]; }).join(' ');
        ul.appendChild(el('li', null, fr(txt)));
      });
      box.appendChild(ul);
    }
    box.style.display = '';
    if (amener) {   // l'alerte est en haut de la page, le bouton de confirmation tout en bas : on amène l'erreur à l'écran
      box.scrollIntoView({ block: 'center' });
      box.focus({ preventScroll: true });
    }
  }

  function options() {
    return {
      mode: document.querySelector('input[name="imp-mode"]:checked').value,
      creer_categories: $id('imp-creer-cat').checked,
      creer_fournisseurs: $id('imp-creer-four').checked
    };
  }

  // ---- Appels au serveur ----------------------------------------------------------------------
  /* Erreur d'appel : incertain = on ne sait pas si le serveur a traité la demande (réseau coupé, réponse illisible). */
  function erreurAppel(texte, incertain, details) {
    var e = new Error(texte);
    e.incertain = !!incertain;
    e.details = details || null;
    return e;
  }
  function appel(url, init, texteReseau) {
    init = init || {};
    init.credentials = 'same-origin';
    init.headers = Object.assign({ 'Accept': 'application/json', 'X-CSRF-Token': csrf() }, init.headers || {});
    return fetch(url, init).then(function (resp) {
      return resp.text().then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (e) { /* non JSON */ }
        if (resp.status === 401) { w.location.href = 'login.php'; throw erreurAppel('Session expirée. Veuillez vous reconnecter.', false); }
        if (!data) {
          if (resp.status === 413) { throw erreurAppel('Les données envoyées dépassent la taille permise par le serveur (413). Découpez le fichier en plusieurs fichiers plus petits.', false); }
          throw erreurAppel('Réponse inattendue du serveur (' + resp.status + ').' + (resp.status < 500 ? ' Le fichier est peut-être trop gros.' : ''), resp.status >= 500);
        }
        if (data.ok === false || !resp.ok) { throw erreurAppel(data.erreur || 'Erreur (' + resp.status + ').', false, data.erreurs); }
        return data;
      });
    }, function () {
      throw erreurAppel(texteReseau || 'Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.', true);
    });
  }
  function postJson(url, objet) {
    return appel(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(objet) });
  }

  function analyserFichier() {
    erreurGlobale(null);
    var inp = $id('imp-fichier');
    var f = inp.files && inp.files[0];
    if (!f) { erreurGlobale('Choisissez d\'abord un fichier CSV.'); inp.focus(); return; }
    if (!/\.(csv|txt)$/i.test(f.name)) { erreurGlobale('Le fichier doit être un fichier .csv ou .txt. Dans Excel : « Enregistrer sous », puis « CSV UTF-8 ».'); return; }
    if (f.size > cfg.max_octets) { erreurGlobale('Le fichier dépasse 2 Mo : découpez-le en plusieurs fichiers.'); return; }
    if (f.size === 0) { erreurGlobale('Le fichier est vide.'); return; }
    var o = options();
    var fd = new FormData();
    fd.append('fichier', f);
    fd.append('mode', o.mode);
    fd.append('creer_categories', o.creer_categories ? '1' : '0');
    fd.append('creer_fournisseurs', o.creer_fournisseurs ? '1' : '0');
    var btn = $id('imp-analyser');
    btn.disabled = true; btn.textContent = 'Analyse en cours…';
    appel('app/ajax/import_analyser.php', { method: 'POST', body: fd },
      'Le serveur ne répond pas ou le fichier a changé depuis sa sélection. Vérifiez votre connexion, choisissez de nouveau le fichier, puis réessayez.'
    ).then(function (r) {
      etat.source = r.source; etat.meta = r.meta; etat.resultats = r.resultats; etat.totaux = r.totaux;
      etat.nom = r.meta.fichier || f.name; etat.filtre = 'tous'; etat.page = 1;
      montrer(3, true); dessiner();
      annoncer('Analyse terminée : ' + pluriel(r.totaux.erreurs, 'erreur', 'erreurs') + ', ' + pluriel(r.totaux.avertissements, 'avertissement', 'avertissements') + '.');
    }).catch(function (err) {
      erreurGlobale(msg(err));
    }).then(function () {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i> Analyser le fichier';
    });
  }

  /* Les options ont changé pendant l'aperçu : le serveur ré-analyse les lignes déjà lues (sans nouveau téléversement).
   * garderErreur : la ré-analyse suit un échec de confirmation, dont le message doit rester affiché. */
  function reanalyser(garderErreur) {
    if (!etat.source) { return; }
    var mon = ++etat.seq;
    etat.occupe = true; majBoutons();
    postJson('app/ajax/import_analyser.php', Object.assign({ lignes: etat.source }, options())).then(function (r) {
      if (mon !== etat.seq) { return; }
      etat.resultats = r.resultats; etat.totaux = r.totaux; etat.page = 1;
      if (!garderErreur) { erreurGlobale(null); }
    }).catch(function (err) {
      if (mon !== etat.seq) { return; }
      if (garderErreur) { w.toast(msg(err), 'danger'); } else { erreurGlobale(msg(err)); }
    }).then(function () {
      if (mon !== etat.seq) { return; }
      etat.occupe = false; dessiner();
    });
  }

  function confirmer() {
    if (etat.occupe || !etat.source) { return; }
    erreurGlobale(null);
    etat.occupe = true; majBoutons();
    var btn = $id('imp-confirmer');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Import en cours…';
    function fin() { etat.occupe = false; btn.innerHTML = '<i class="fas fa-check"></i> Confirmer l\'import'; majBoutons(); }
    postJson('app/action/import_appliquer.php', Object.assign({ lignes: etat.source, fichier: etat.nom }, options())).then(function (r) {
      etat.source = null;   // le fichier est consommé : pas de deuxième envoi par erreur
      fin();
      resultat(r);
    }, function (err) {
      fin();
      var texte;
      if (err.incertain) {
        texte = 'La réponse du serveur n\'est pas parvenue : l\'import a peut-être été appliqué. Avant de réessayer, vérifiez le catalogue et les documents « Stock initial (import) ». (' + err.message + ')';
      } else {
        texte = err.message + (/rien n.a été importé|aucune pièce n.a été importée/i.test(err.message) ? '' : ' Aucune pièce n\'a été importée.');
      }
      erreurGlobale(texte, err.details, true);   // visible, annoncé et au focus : il n'est plus effacé par la ré-analyse qui suit
      w.toast(err.incertain ? 'Import incertain : vérifiez le catalogue avant de réessayer.' : 'Import refusé : aucune pièce n\'a été importée.', 'danger');
      reanalyser(true);   // l'aperçu montre les lignes en cause
    });
  }

  // ---- Aperçu ---------------------------------------------------------------------------------
  var ACTIONS = {
    creer: ['Créer', 'badge-success'], maj: ['Mettre à jour', 'badge-info'], inchange: ['Sans changement', 'badge-secondary'],
    ignorer: ['Ignorée', 'badge-secondary'], stock: ['Stock seulement', 'badge-primary']
  };

  function filtrees() {
    return etat.resultats.filter(function (r) {
      switch (etat.filtre) {
        case 'erreurs': return r.statut === 'erreur';
        case 'avertissements': return r.statut === 'avertissement';
        case 'creer': return r.action === 'creer' && r.statut !== 'erreur';
        case 'maj': return r.action === 'maj' && r.statut !== 'erreur';
        default: return true;
      }
    });
  }

  function tuile(titre, n, cls) {
    var d = el('div', { class: 'imp-tuile ' + (cls || '') });
    d.appendChild(el('div', { class: 'n' }, nb(n)));
    d.appendChild(el('div', { class: 'small text-muted' }, titre));
    return d;
  }

  /* foc : 'filtre' (redonne le focus au bouton de filtre recréé) ou 'page' (focus et défilement sur le haut du tableau). */
  function dessiner(foc) {
    var t = etat.totaux, m = etat.meta;
    // méta
    var meta = $id('imp-meta');
    if (m) {
      var txt = 'Fichier « ' + etat.nom + ' » — séparateur « ' + m.separateur + ' » — encodage ' + m.encodage + ' — ' + pluriel(m.nb_lignes, 'ligne lue', 'lignes lues')
        + (m.lignes_vides ? ' (' + pluriel(m.lignes_vides, 'ligne vide ignorée', 'lignes vides ignorées') + ')' : '') + '.';
      txt += ' Colonnes reconnues : ' + m.colonnes.join(', ') + '.';
      if (m.colonnes_ignorees.length) { txt += ' Colonnes ignorées : ' + m.colonnes_ignorees.join(', ') + '.'; }
      if (m.colonnes_informatives.length) { txt += ' Colonnes informatives (jamais importées) : ' + m.colonnes_informatives.join(', ') + '.'; }
      meta.textContent = fr(txt);
    }
    // tuiles
    var tu = $id('imp-tuiles'); tu.innerHTML = '';
    tu.appendChild(tuile('À créer', t.creer));
    tu.appendChild(tuile('À mettre à jour', t.maj));
    tu.appendChild(tuile('Ignorées ou sans changement', t.ignorer + t.inchange));
    tu.appendChild(tuile('Lignes de stock initial', t.lignes_stock));
    tu.appendChild(tuile('Erreurs', t.erreurs, t.erreurs ? 'erreur' : ''));
    tu.appendChild(tuile('Avertissements', t.avertissements, t.avertissements ? 'avert' : ''));
    // bilan
    var b = $id('imp-bilan'); b.innerHTML = '';
    var parts = [];
    if (t.documents) { parts.push(pluriel(t.documents, 'document de stock initial sera créé', 'documents de stock initial seront créés')); }
    if (t.categories_a_creer) { parts.push(pluriel(t.categories_a_creer, 'catégorie sera créée', 'catégories seront créées')); }
    if (t.fournisseurs_a_creer) { parts.push(pluriel(t.fournisseurs_a_creer, 'fournisseur sera créé', 'fournisseurs seront créés')); }
    if (t.erreurs) {
      b.appendChild(el('div', { class: 'alert alert-danger mb-2' }, fr(pluriel(t.erreurs, 'ligne est en erreur', 'lignes sont en erreur') + ' : rien ne sera importé tant que '
        + (t.erreurs > 1 ? 'les erreurs ne sont pas corrigées' : 'l\'erreur n\'est pas corrigée') + ' dans le fichier (tout ou rien).')));
    } else if (!(t.creer + t.maj + t.lignes_stock)) {
      b.appendChild(el('div', { class: 'alert alert-warning mb-2' }, fr('Il n\'y a rien à importer : toutes les lignes sont ignorées ou sans changement.')));
    } else {
      b.appendChild(el('div', { class: 'alert alert-success mb-2' }, 'Le fichier est valide.' + (parts.length ? ' ' + parts.join('\u00a0; ') + '.' : '')));
    }
    // filtres
    var fl = $id('imp-filtres'); fl.innerHTML = '';
    var compte = {
      tous: etat.resultats.length,
      erreurs: etat.resultats.filter(function (r) { return r.statut === 'erreur'; }).length,
      avertissements: etat.resultats.filter(function (r) { return r.statut === 'avertissement'; }).length,
      creer: t.creer, maj: t.maj
    };
    [['tous', 'Toutes'], ['erreurs', 'Erreurs'], ['avertissements', 'Avertissements'], ['creer', 'À créer'], ['maj', 'À mettre à jour']].forEach(function (f) {
      var bt = el('button', { type: 'button', 'data-filtre': f[0], class: 'btn btn-outline-secondary imp-btn' + (etat.filtre === f[0] ? ' active' : ''), 'aria-pressed': etat.filtre === f[0] ? 'true' : 'false' }, f[1] + ' (' + nb(compte[f[0]]) + ')');
      bt.addEventListener('click', function () { etat.filtre = f[0]; etat.page = 1; dessiner('filtre'); });
      fl.appendChild(bt);
    });
    // tableau
    var liste = filtrees();
    var pages = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
    if (etat.page > pages) { etat.page = pages; }
    var debut = (etat.page - 1) * PAR_PAGE;
    var tb = document.querySelector('#imp-table tbody'); tb.innerHTML = '';
    if (!liste.length) {
      var trv = el('tr'); var tdv = el('td', { colspan: '6', class: 'text-center text-muted p-3' }, 'Aucune ligne à afficher avec ce filtre.');
      trv.appendChild(tdv); tb.appendChild(trv);
    }
    liste.slice(debut, debut + PAR_PAGE).forEach(function (r) {
      var tr = el('tr', { class: 'st-' + r.statut + ' act-' + r.action });
      tr.appendChild(el('td', { class: 'nombre' }, String(r.no)));
      tr.appendChild(el('td', { class: 'code' }, r.code));
      var tdN = el('td'); tdN.appendChild(document.createTextNode(r.nom));
      if (r.categorie) { tdN.appendChild(el('div', { class: 'small text-muted' }, r.categorie)); }
      tr.appendChild(tdN);
      var tdA = el('td');
      var a = ACTIONS[r.action] || ACTIONS.ignorer;
      if (r.statut === 'erreur') { tdA.appendChild(el('span', { class: 'badge badge-danger' }, 'Erreur')); }
      else { tdA.appendChild(el('span', { class: 'badge ' + a[1] }, a[0])); }
      tr.appendChild(tdA);
      var tdS = el('td');
      if (r.stock) {
        tdS.textContent = w.fmtQte(r.stock.quantite) + ' × ' + r.stock.emplacement + (r.stock.cout !== null ? ' à ' + w.fmtArgent(r.stock.cout, 4) : '');
      }
      tr.appendChild(tdS);
      var tdD = el('td'); var ul = el('ul', { class: 'imp-msgs' });
      if (r.changements && r.changements.length) { ul.appendChild(el('li', null, fr('Modifications : ' + r.changements.join(', ') + '.'))); }
      r.msgs.forEach(function (mm) { ul.appendChild(el('li', { class: 'imp-msg-' + mm[0] }, fr(mm[1]))); });
      tdD.appendChild(ul); tr.appendChild(tdD);
      tb.appendChild(tr);
    });
    // pagination
    var pg = $id('imp-pagination'); pg.innerHTML = '';
    if (liste.length > PAR_PAGE) {
      var prev = el('button', { type: 'button', class: 'btn btn-outline-secondary imp-btn' }, 'Précédent');
      prev.disabled = etat.page <= 1;
      prev.addEventListener('click', function () { etat.page--; dessiner('page'); });
      var next = el('button', { type: 'button', class: 'btn btn-outline-secondary imp-btn' }, 'Suivant');
      next.disabled = etat.page >= pages;
      next.addEventListener('click', function () { etat.page++; dessiner('page'); });
      pg.appendChild(prev);
      pg.appendChild(el('span', { 'aria-live': 'polite' }, 'Lignes ' + nb(debut + 1) + ' à ' + nb(Math.min(debut + PAR_PAGE, liste.length)) + ' sur ' + nb(liste.length)));
      pg.appendChild(next);
    } else if (liste.length) {
      pg.appendChild(el('span', { class: 'text-muted' }, pluriel(liste.length, 'ligne', 'lignes') + '.'));
    }
    majBoutons();
    if (foc === 'filtre') {
      var bf = document.querySelector('#imp-filtres [data-filtre="' + etat.filtre + '"]');
      if (bf) { bf.focus({ preventScroll: true }); }
    } else if (foc === 'page') {
      var zone = $id('imp-zone-table');
      zone.focus({ preventScroll: true });
      zone.scrollIntoView({ block: 'start' });   // sinon on reste en bas de la page : le haut du nouveau tableau est des milliers de pixels plus haut
    }
  }

  function majBoutons() {
    var t = etat.totaux;
    var ok = !!t && !etat.occupe && t.erreurs === 0 && (t.creer + t.maj + t.lignes_stock) > 0 && !!etat.source;
    $id('imp-confirmer').disabled = !ok;
    $id('imp-erreurs-csv').style.display = (t && (t.erreurs || t.avertissements)) ? '' : 'none';
    if (t) {
      $id('imp-erreurs-csv-txt').textContent = 'Télécharger ' + (t.erreurs && t.avertissements ? 'les erreurs et avertissements' : (t.erreurs ? 'les erreurs' : 'les avertissements')) + ' (CSV)';
    }
    var aide = $id('imp-confirmer-aide');
    if (etat.occupe) { aide.textContent = 'Veuillez patienter…'; }
    else if (t && t.erreurs) { aide.textContent = 'Corrigez le fichier, puis analysez-le de nouveau.'; }
    else if (t && !(t.creer + t.maj + t.lignes_stock)) { aide.textContent = 'Rien à importer.'; }
    else { aide.textContent = 'Tout ou rien : si une écriture échoue, rien n\'est enregistré.'; }
  }

  // ---- Fichier des erreurs (pour les corriger dans le tableur) ------------------------------------------------------
  function neutraliser(s) { s = String(s); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
  function cellule(s) {
    s = neutraliser(s);
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function sauvegarder(blob, nom) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function telechargerErreurs() {
    var lignes = ['ligne;code;niveau;message'];
    etat.resultats.forEach(function (r) {
      r.msgs.forEach(function (m) {
        if (m[0] === 'erreur' || m[0] === 'avertissement') {
          lignes.push([r.no, cellule(r.code), m[0] === 'erreur' ? 'erreur' : 'avertissement', cellule(m[1])].join(';'));
        }
      });
    });
    sauvegarder(new Blob(['﻿' + lignes.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }), 'erreurs-import.csv');
  }

  /* Le modèle et l'export s'ouvrent par un lien. Une session expirée ou un refus donnerait du JSON brut dans le navigateur :
   * le téléchargement passe donc par fetch, ce qui permet de rediriger vers la connexion ou d'afficher un message lisible. */
  function telecharger(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button) { return; }
    ev.preventDefault();
    var lien = ev.currentTarget;
    fetch(lien.href, { credentials: 'same-origin', headers: { 'Accept': 'text/csv, application/json' } }).then(function (resp) {
      if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée. Veuillez vous reconnecter.'); }
      if (!resp.ok) {
        return resp.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.erreur || 'Le téléchargement a échoué. Réessayez.'); });
      }
      var nom = /filename="?([^";]+)"?/.exec(resp.headers.get('Content-Disposition') || '');
      return resp.blob().then(function (blob) { sauvegarder(blob, nom ? nom[1] : 'catalogue.csv'); });
    }).catch(function (err) {
      w.toast(err instanceof TypeError ? 'Connexion impossible au serveur. Vérifiez le réseau, puis réessayez.' : msg(err), 'danger');
    });
  }

  // ---- Résultat ---------------------------------------------------------------------------------------------------------
  function resultat(r) {
    montrer(4, true);
    var box = $id('imp-resume'); box.innerHTML = '';
    box.appendChild(el('strong', null, 'L\'import est terminé.'));
    var ul = el('ul', { class: 'mb-0 mt-2' });
    ul.appendChild(el('li', null, pluriel(r.creees, 'pièce créée', 'pièces créées') + '.'));
    ul.appendChild(el('li', null, pluriel(r.mises_a_jour, 'pièce mise à jour', 'pièces mises à jour') + '.'));
    ul.appendChild(el('li', null, pluriel(r.ignorees, 'ligne ignorée', 'lignes ignorées') + (r.dont_inchangees ? ' (dont ' + nb(r.dont_inchangees) + ' sans changement)' : '') + '.'));
    if (r.categories_creees) { ul.appendChild(el('li', null, pluriel(r.categories_creees, 'catégorie créée', 'catégories créées') + '.')); }
    if (r.fournisseurs_crees) { ul.appendChild(el('li', null, pluriel(r.fournisseurs_crees, 'fournisseur créé', 'fournisseurs créés') + '.')); }
    ul.appendChild(el('li', null, pluriel(r.documents.length, 'document de stock initial créé', 'documents de stock initial créés') + (r.lignes_stock ? ' (' + pluriel(r.lignes_stock, 'ligne de stock', 'lignes de stock') + ')' : '') + '.'));
    box.appendChild(ul);
    var d = $id('imp-docs'); d.innerHTML = '';
    if (r.documents.length) {
      var tb = el('table', { class: 'table table-sm' });
      var th = el('thead'); var trh = el('tr');
      ['Document', 'Emplacement', 'Lignes'].forEach(function (h) { trh.appendChild(el('th', null, h)); });
      th.appendChild(trh); tb.appendChild(th);
      var body = el('tbody');
      r.documents.forEach(function (doc) {
        var tr = el('tr');
        var td = el('td'); var a = el('a', { href: 'index.php?page=document_voir&id=' + encodeURIComponent(doc.id) }, doc.numero); td.appendChild(a); tr.appendChild(td);
        tr.appendChild(el('td', null, doc.emplacement));
        tr.appendChild(el('td', { class: 'nombre' }, String(doc.lignes)));
        body.appendChild(tr);
      });
      tb.appendChild(body); d.appendChild(tb);
    }
    w.toast('Import terminé.', 'success');
    annoncer('Import terminé : ' + pluriel(r.creees, 'pièce créée', 'pièces créées') + ', ' + pluriel(r.mises_a_jour, 'pièce mise à jour', 'pièces mises à jour') + '.');
  }

  function recommencer() {
    etat.source = null; etat.meta = null; etat.resultats = []; etat.totaux = null; etat.seq++; etat.occupe = false;
    $id('imp-fichier').value = '';
    $id('imp-fichier-nom').textContent = 'Choisir un fichier…';
    erreurGlobale(null);
    montrer(1, true);
  }

  /* « Choisir un autre fichier » jette l'analyse : on demande confirmation quand elle est volumineuse. */
  function changerDeFichier() {
    if (etat.source && etat.resultats.length > SEUIL_CONFIRMATION) {
      confirmerAction('Abandonner l\'analyse ?', 'Les ' + nb(etat.resultats.length) + ' lignes analysées seront abandonnées : vous devrez téléverser de nouveau un fichier.', 'Abandonner l\'analyse')
        .then(function (oui) { if (oui) { recommencer(); } else { $id('imp-changer').focus(); } });
      return;
    }
    recommencer();
  }

  // ---- Branchements ---------------------------------------------------------------------------------------------------
  $(function () {
    $id('imp-analyser').addEventListener('click', analyserFichier);
    $id('imp-fichier').addEventListener('change', function () {
      $id('imp-fichier-nom').textContent = (this.files && this.files[0]) ? this.files[0].name : 'Choisir un fichier…';
    });
    // Entrée lance l'analyse seulement quand un fichier est choisi : sinon elle doit ouvrir le sélecteur de fichier (comportement normal)
    $id('imp-fichier').addEventListener('keydown', function (e) { if (e.key === 'Enter' && this.files && this.files.length) { e.preventDefault(); analyserFichier(); } });
    $id('imp-confirmer').addEventListener('click', confirmer);
    $id('imp-erreurs-csv').addEventListener('click', telechargerErreurs);
    $id('imp-changer').addEventListener('click', changerDeFichier);
    $id('imp-autre').addEventListener('click', recommencer);
    $id('imp-modele').addEventListener('click', telecharger);
    $id('imp-exporter').addEventListener('click', telecharger);
    $id('imp-exp-inactives').addEventListener('change', function () {
      $id('imp-exporter').setAttribute('href', 'app/ajax/pieces_export.php' + (this.checked ? '?inactives=1' : ''));
    });
    // bascule « Description des colonnes » : l'état (ouvert / fermé) est annoncé
    $('#imp-desc-bascule').on('expanded.lte.cardwidget', function () { this.setAttribute('aria-expanded', 'true'); })
      .on('collapsed.lte.cardwidget', function () { this.setAttribute('aria-expanded', 'false'); });
    // changement d'option pendant l'aperçu : nouvelle analyse (les lignes lues sont conservées)
    ['imp-mode-creer', 'imp-mode-maj', 'imp-creer-cat', 'imp-creer-four'].forEach(function (id) {
      $id(id).addEventListener('change', function () {
        if (!etat.source) { return; }
        clearTimeout(minuterie);
        etat.seq++; etat.occupe = true; majBoutons();
        minuterie = setTimeout(reanalyser, 150);
      });
    });
    montrer(1, false);
  });
})(window, jQuery);
