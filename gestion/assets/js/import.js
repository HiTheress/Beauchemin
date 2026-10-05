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

  var etat = { source: null, meta: null, resultats: [], totaux: null, nom: '', filtre: 'tous', page: 1, occupe: false, seq: 0 };
  var minuterie = null;

  function $id(id) { return document.getElementById(id); }
  function el(tag, attrs, texte) {
    var e = document.createElement(tag);
    if (attrs) { Object.keys(attrs).forEach(function (k) { if (k === 'class') { e.className = attrs[k]; } else { e.setAttribute(k, attrs[k]); } }); }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }
  function pluriel(n, un, plusieurs) { return w.fmtQte(String(n)) + ' ' + (n > 1 ? plusieurs : un); }
  /* Message d'erreur en français (une panne réseau de fetch() donne un TypeError au texte anglais). */
  function msg(err) {
    if (err && err.name === 'TypeError') { return 'Le serveur ne répond pas ou le fichier a changé depuis sa sélection. Vérifiez votre connexion, choisissez de nouveau le fichier, puis réessayez.'; }
    return (err && err.message) || 'Erreur inattendue.';
  }
  function csrf() { var m = document.querySelector('meta[name="csrf-token"]'); return m ? m.getAttribute('content') : ''; }

  // ---- Affichage des étapes ------------------------------------------------------------------
  function montrer(etape) {
    $id('imp-depart').style.display = etape === 1 ? '' : 'none';
    $id('imp-options').style.display = (etape === 1 || etape === 3) ? '' : 'none';
    $id('imp-apercu').style.display = etape === 3 ? '' : 'none';
    $id('imp-resultat').style.display = etape === 4 ? '' : 'none';
    var cls = { 1: ['actif', 'actif', '', ''], 3: ['fait', 'fait', 'actif', ''], 4: ['fait', 'fait', 'fait', 'fait'] }[etape];
    for (var i = 0; i < 4; i++) { $id('imp-s' + (i + 1)).className = cls[i]; }
    w.scrollTo(0, 0);
  }

  function erreurGlobale(msg, details) {
    var box = $id('imp-erreur');
    box.innerHTML = '';
    if (!msg) { box.style.display = 'none'; return; }
    box.appendChild(el('strong', null, msg));
    if (details && details.length) {
      var ul = el('ul', { class: 'mb-0 mt-2' });
      details.slice(0, 20).forEach(function (d) {
        var txt = 'Ligne ' + d.no + (d.code ? ' (' + d.code + ')' : '') + ' : ' + d.msgs.filter(function (m) { return m[0] === 'erreur'; }).map(function (m) { return m[1]; }).join(' ');
        ul.appendChild(el('li', null, txt));
      });
      box.appendChild(ul);
    }
    box.style.display = '';
  }

  function options() {
    return {
      mode: document.querySelector('input[name="imp-mode"]:checked').value,
      creer_categories: $id('imp-creer-cat').checked,
      creer_fournisseurs: $id('imp-creer-four').checked
    };
  }

  // ---- Appels au serveur ----------------------------------------------------------------------
  function envoyerFichier(fd) {
    return fetch('app/ajax/import_analyser.php', {
      method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf(), 'Accept': 'application/json' }, body: fd
    }).then(function (resp) {
      return resp.text().then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (e) { /* non JSON */ }
        if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée. Veuillez vous reconnecter.'); }
        if (!data) { throw new Error('Réponse inattendue du serveur (' + resp.status + '). Le fichier est peut-être trop gros.'); }
        if (data.ok === false || !resp.ok) { throw new Error(data.erreur || 'Erreur (' + resp.status + ').'); }
        return data;
      });
    });
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
    envoyerFichier(fd).then(function (r) {
      etat.source = r.source; etat.meta = r.meta; etat.resultats = r.resultats; etat.totaux = r.totaux;
      etat.nom = r.meta.fichier || f.name; etat.filtre = 'tous'; etat.page = 1;
      montrer(3); dessiner();
    }).catch(function (err) {
      erreurGlobale(msg(err));
    }).then(function () {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i> Analyser le fichier';
    });
  }

  /* Les options ont changé pendant l'aperçu : le serveur ré-analyse les lignes déjà lues (sans nouveau téléversement). */
  function reanalyser() {
    if (!etat.source) { return; }
    var mon = ++etat.seq;
    etat.occupe = true; majBoutons();
    w.api.post('app/ajax/import_analyser.php', Object.assign({ lignes: etat.source }, options())).then(function (r) {
      if (mon !== etat.seq) { return; }
      etat.resultats = r.resultats; etat.totaux = r.totaux; etat.page = 1;
      erreurGlobale(null);
    }).catch(function (err) {
      if (mon !== etat.seq) { return; }
      erreurGlobale(msg(err));
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
    w.api.post('app/action/import_appliquer.php', Object.assign({ lignes: etat.source, fichier: etat.nom }, options())).then(function (r) {
      etat.source = null;   // le fichier est consommé : pas de deuxième envoi par erreur
      fin();
      resultat(r);
    }, function (err) {
      fin();
      erreurGlobale(msg(err));
      reanalyser();   // l'aperçu montre les lignes en cause
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
    d.appendChild(el('div', { class: 'n' }, w.fmtQte(String(n))));
    d.appendChild(el('div', { class: 'small text-muted' }, titre));
    return d;
  }

  function dessiner() {
    var t = etat.totaux, m = etat.meta;
    // méta
    var meta = $id('imp-meta');
    if (m) {
      var txt = 'Fichier « ' + etat.nom + ' » — séparateur « ' + m.separateur + ' » — encodage ' + m.encodage + ' — ' + pluriel(m.nb_lignes, 'ligne lue', 'lignes lues')
        + (m.lignes_vides ? ' (' + pluriel(m.lignes_vides, 'ligne vide ignorée', 'lignes vides ignorées') + ')' : '') + '.';
      txt += ' Colonnes reconnues : ' + m.colonnes.join(', ') + '.';
      if (m.colonnes_ignorees.length) { txt += ' Colonnes ignorées : ' + m.colonnes_ignorees.join(', ') + '.'; }
      if (m.colonnes_informatives.length) { txt += ' Colonnes informatives (jamais importées) : ' + m.colonnes_informatives.join(', ') + '.'; }
      meta.textContent = txt;
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
      b.appendChild(el('div', { class: 'alert alert-danger mb-2' }, pluriel(t.erreurs, 'ligne est en erreur', 'lignes sont en erreur') + ' : rien ne sera importé tant qu\'elles ne sont pas corrigées dans le fichier (tout ou rien).'));
    } else if (!(t.creer + t.maj + t.lignes_stock)) {
      b.appendChild(el('div', { class: 'alert alert-warning mb-2' }, 'Il n\'y a rien à importer : toutes les lignes sont ignorées ou sans changement.'));
    } else {
      b.appendChild(el('div', { class: 'alert alert-success mb-2' }, 'Le fichier est valide.' + (parts.length ? ' ' + parts.join(' ; ') + '.' : '')));
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
      var bt = el('button', { type: 'button', class: 'btn btn-outline-secondary imp-btn' + (etat.filtre === f[0] ? ' active' : ''), 'aria-pressed': etat.filtre === f[0] ? 'true' : 'false' }, f[1] + ' (' + compte[f[0]] + ')');
      bt.addEventListener('click', function () { etat.filtre = f[0]; etat.page = 1; dessiner(); });
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
      if (r.changements && r.changements.length) { ul.appendChild(el('li', null, 'Modifie : ' + r.changements.join(', ') + '.')); }
      r.msgs.forEach(function (mm) { ul.appendChild(el('li', { class: 'imp-msg-' + mm[0] }, mm[1])); });
      tdD.appendChild(ul); tr.appendChild(tdD);
      tb.appendChild(tr);
    });
    // pagination
    var pg = $id('imp-pagination'); pg.innerHTML = '';
    if (liste.length > PAR_PAGE) {
      var prev = el('button', { type: 'button', class: 'btn btn-outline-secondary imp-btn' }, 'Précédent');
      prev.disabled = etat.page <= 1;
      prev.addEventListener('click', function () { etat.page--; dessiner(); });
      var next = el('button', { type: 'button', class: 'btn btn-outline-secondary imp-btn' }, 'Suivant');
      next.disabled = etat.page >= pages;
      next.addEventListener('click', function () { etat.page++; dessiner(); });
      pg.appendChild(prev);
      pg.appendChild(el('span', null, 'Lignes ' + (debut + 1) + ' à ' + Math.min(debut + PAR_PAGE, liste.length) + ' sur ' + liste.length));
      pg.appendChild(next);
    } else if (liste.length) {
      pg.appendChild(el('span', { class: 'text-muted' }, pluriel(liste.length, 'ligne', 'lignes') + '.'));
    }
    majBoutons();
  }

  function majBoutons() {
    var t = etat.totaux;
    var ok = !!t && !etat.occupe && t.erreurs === 0 && (t.creer + t.maj + t.lignes_stock) > 0 && !!etat.source;
    $id('imp-confirmer').disabled = !ok;
    $id('imp-erreurs-csv').style.display = (t && (t.erreurs || t.avertissements)) ? '' : 'none';
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
  function telechargerErreurs() {
    var lignes = ['ligne;code;niveau;message'];
    etat.resultats.forEach(function (r) {
      r.msgs.forEach(function (m) {
        if (m[0] === 'erreur' || m[0] === 'avertissement') {
          lignes.push([r.no, cellule(r.code), m[0] === 'erreur' ? 'erreur' : 'avertissement', cellule(m[1])].join(';'));
        }
      });
    });
    var blob = new Blob(['﻿' + lignes.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'erreurs-import.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ---- Résultat ---------------------------------------------------------------------------------------------------------
  function resultat(r) {
    montrer(4);
    var box = $id('imp-resume'); box.innerHTML = '';
    box.appendChild(el('strong', null, 'L\'import est terminé.'));
    var ul = el('ul', { class: 'mb-0 mt-2' });
    ul.appendChild(el('li', null, pluriel(r.creees, 'pièce créée', 'pièces créées') + '.'));
    ul.appendChild(el('li', null, pluriel(r.mises_a_jour, 'pièce mise à jour', 'pièces mises à jour') + '.'));
    ul.appendChild(el('li', null, pluriel(r.ignorees, 'ligne ignorée', 'lignes ignorées') + (r.dont_inchangees ? ' (dont ' + r.dont_inchangees + ' sans changement)' : '') + '.'));
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
  }

  function recommencer() {
    etat.source = null; etat.meta = null; etat.resultats = []; etat.totaux = null; etat.seq++;
    $id('imp-fichier').value = '';
    $id('imp-fichier-nom').textContent = 'Choisir un fichier…';
    erreurGlobale(null);
    montrer(1);
  }

  // ---- Branchements ---------------------------------------------------------------------------------------------------
  $(function () {
    $id('imp-analyser').addEventListener('click', analyserFichier);
    $id('imp-fichier').addEventListener('change', function () {
      $id('imp-fichier-nom').textContent = (this.files && this.files[0]) ? this.files[0].name : 'Choisir un fichier…';
    });
    $id('imp-fichier').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); analyserFichier(); } });
    $id('imp-confirmer').addEventListener('click', confirmer);
    $id('imp-erreurs-csv').addEventListener('click', telechargerErreurs);
    $id('imp-changer').addEventListener('click', recommencer);
    $id('imp-autre').addEventListener('click', recommencer);
    $id('imp-exp-inactives').addEventListener('change', function () {
      $id('imp-exporter').setAttribute('href', 'app/ajax/pieces_export.php' + (this.checked ? '?inactives=1' : ''));
    });
    // changement d'option pendant l'aperçu : nouvelle analyse (les lignes lues sont conservées)
    ['imp-mode-creer', 'imp-mode-maj', 'imp-creer-cat', 'imp-creer-four'].forEach(function (id) {
      $id(id).addEventListener('change', function () {
        if (!etat.source) { return; }
        clearTimeout(minuterie);
        etat.seq++; etat.occupe = true; majBoutons();
        minuterie = setTimeout(reanalyser, 150);
      });
    });
    montrer(1);
  });
})(window, jQuery);
