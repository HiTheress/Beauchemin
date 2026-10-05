/* Mouvements (module B) : réception, transfert, sortie, ajustement, liste des documents, détail d'un document.
 * Un seul fichier ; la page est reconnue par l'attribut data-mouvement de sa racine :
 *   reception | transfert | sortie | ajustement | documents | document_voir
 * Règles : tout texte du serveur est inséré avec textContent (jamais en HTML brut) ; les quantités et montants restent
 * des chaînes décimales (les nombres ne servent qu'à l'affichage) ; le bouton « Enregistrer » est désactivé pendant
 * l'envoi et un jeton à usage unique empêche qu'un double envoi crée deux documents.
 * Les lignes (scan, recherche, quantités, coûts) sont gérées par le composant partagé saisie-lignes.js.
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-mouvement]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-mouvement');

  // ===================================================================================
  //  Utilitaires
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }

  /** Message d'erreur affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis cliquez de nouveau sur Enregistrer : le document ne sera pas créé en double.';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }

  function aujourdhui() {
    var a = racine.getAttribute('data-aujourdhui');
    if (a) { return a; }
    var d = new Date(), m = d.getMonth() + 1, j = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j;
  }

  /** Mémoire du navigateur (dernier emplacement) : peut être indisponible (navigation privée, stockage bloqué). */
  function memoLire(cle) { try { return w.localStorage.getItem(cle); } catch (e) { return null; } }
  function memoEcrire(cle, valeur) { try { w.localStorage.setItem(cle, valeur); } catch (e) { /* tant pis */ } }

  /** Jeton aléatoire d'une saisie (le serveur refuse de créer deux fois le même document). */
  function nouveauJeton() {
    var a = '';
    try {
      var t = new Uint8Array(16);
      w.crypto.getRandomValues(t);
      for (var i = 0; i < t.length; i++) { a += (t[i] < 16 ? '0' : '') + t[i].toString(16); }
    } catch (e) {
      for (var j = 0; j < 32; j++) { a += Math.floor(Math.random() * 16).toString(16); }
    }
    return a;
  }

  /** "14.5000" -> "14,50" (au moins 2 décimales, zéros inutiles retirés au-delà) pour un champ de saisie. */
  function saisieMontant(s) {
    var p = String(s).split('.'), frac = (p[1] || '').replace(/0+$/, '');
    while (frac.length < 2) { frac += '0'; }
    return p[0] + ',' + frac;
  }

  /** Texte saisi ("1 234,5", "-2") -> entier mis à l'échelle (3 pour une quantité, 4 pour un coût) ; null si invalide. */
  function parseDec(s, echelle) {
    var t = String(s === null || s === undefined ? '' : s).replace(/[\s ]/g, '').replace(',', '.');
    var m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(t);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) { return null; }
    var ent = m[2].replace(/^0+/, ''), frac = m[3] || '';
    if (ent.length > 9) { return null; }
    var arrondi = (frac.length > echelle && frac.charAt(echelle) >= '5') ? 1 : 0;
    frac = (frac + '0000000000').substr(0, echelle);
    var n = parseInt((ent || '0') + frac, 10) + arrondi;
    return m[1] === '-' ? -n : n;
  }

  /** Cents -> "1234.56" (chaîne décimale exacte pour fmtArgent). */
  function centsEnChaine(c) {
    var neg = c < 0, s = String(Math.abs(c));
    while (s.length < 3) { s = '0' + s; }
    return (neg ? '-' : '') + s.slice(0, -2) + '.' + s.slice(-2);
  }

  /** Total d'une ligne en cents : quantité (éch. 3) x coût (éch. 4), arrondi demi vers le haut en valeur absolue (comme le serveur). */
  function totalLigneCents(q3, c4) {
    var p = q3 * c4, neg = p < 0;
    var r = Math.round(Math.abs(p) / 100000);
    return neg ? -r : r;
  }

  function lienDocument(id) { return 'index.php?page=document_voir&id=' + encodeURIComponent(String(id)); }

  // ===================================================================================
  //  Écrans de saisie : réception, transfert, sortie, ajustement
  // ===================================================================================
  var CONFIG = {
    reception:  { url: 'app/action/reception_save.php',  doc: 'Réception',  fini: 'enregistrée', cout: true,  coutObligatoire: true,  signe: false, disponible: false },
    transfert:  { url: 'app/action/transfert_save.php',  doc: 'Transfert',  fini: 'enregistré', cout: false, coutObligatoire: false, signe: false, disponible: true },
    sortie:     { url: 'app/action/sortie_save.php',     doc: 'Sortie',     fini: 'enregistrée', cout: false, coutObligatoire: false, signe: false, disponible: true },
    ajustement: { url: 'app/action/ajustement_save.php', doc: 'Ajustement', fini: 'enregistré', cout: true,  coutObligatoire: false, signe: true,  disponible: false }
  };
  var TYPES_EMP = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };
  var MAX_LIGNES = 300;

  function initSaisie(cfg) {
    var $emp = q('#emplacement'), $dest = q('#destination'), $date = q('#date'), $note = q('#note');
    var $motif = q('#motif'), $ref = q('#reference'), $fourn = q('#fournisseur'), $majPrix = q('#maj-prix'), $majAide = q('#maj-prix-aide');
    var $btn = q('#btn-enregistrer'), $err = q('#mv-erreur'), $succes = q('#mv-succes'), $resume = q('#mv-resume'), $total = q('#mv-total');
    var cleMemo = 'bea.mv.' + page + '.emplacement';
    var emplacements = [];
    var enCours = false;
    var jeton = nouveauJeton();
    var propose = {};          // code de pièce -> coût proposé automatiquement (pour ne pas écraser une saisie manuelle)
    var piecesParCode = {};
    var sl = null;

    // ---- emplacements ------------------------------------------------------------
    function parId(id) {
      for (var i = 0; i < emplacements.length; i++) { if (String(emplacements[i].id) === String(id)) { return emplacements[i]; } }
      return null;
    }

    /** Remplit une liste déroulante groupée par entreprise (textContent : aucun HTML issu du serveur). */
    function remplir(select, liste, vide, valeur) {
      select.innerHTML = '';
      var o = document.createElement('option');
      o.value = ''; o.textContent = vide;
      select.appendChild(o);
      var groupe = null, courant = null;
      liste.forEach(function (e) {
        if (courant !== e.entreprise_id) {
          groupe = document.createElement('optgroup');
          groupe.label = e.entreprise_nom;
          select.appendChild(groupe);
          courant = e.entreprise_id;
        }
        var op = document.createElement('option');
        op.value = String(e.id);
        op.textContent = e.nom + ' (' + (TYPES_EMP[e.type] || e.type) + ')';
        groupe.appendChild(op);
      });
      select.disabled = false;
      if (valeur && liste.some(function (e) { return String(e.id) === String(valeur); })) { select.value = String(valeur); }
    }

    function listeDestination() {
      var s = parId($emp.value);
      if (!s) { return []; }
      return emplacements.filter(function (e) { return e.entreprise_id === s.entreprise_id && e.id !== s.id; });
    }

    function majDestination() {
      if (!$dest) { return; }
      var ancien = $dest.value;
      if (!$emp.value) {
        $dest.innerHTML = '<option value="">Choisissez d\'abord la source</option>';
        $dest.disabled = true;
        return;
      }
      var liste = listeDestination();
      remplir($dest, liste, liste.length ? '— Choisissez la destination —' : 'Aucun autre emplacement dans cette entreprise', ancien);
      $dest.disabled = !liste.length;
    }

    function fixerEmplacement(id) {
      $emp.value = String(id);
      surChangementEmplacement();
    }

    function surChangementEmplacement() {
      if ($emp.value) { memoEcrire(cleMemo, $emp.value); }
      majDestination();
      if (sl) { sl.rafraichir(); }
      if (page === 'reception') { rafraichirCouts(); }
      effacerErreur();
    }

    /** Un code EMP-… a été scanné : choisit l'emplacement (transfert : la source si elle est vide, sinon la destination). */
    function emplacementScanne(emp) {
      var e = parId(emp.id);
      if (!e) { throw new Error('L\'emplacement « ' + emp.nom + ' » est désactivé ou n\'est pas disponible.'); }
      if (page === 'transfert' && $emp.value) {
        var s = parId($emp.value);
        if (String(e.id) === String($emp.value)) { throw new Error('« ' + e.nom + ' » est déjà la source. Scannez la destination.'); }
        if (s && e.entreprise_id !== s.entreprise_id) {
          throw new Error('« ' + e.nom + ' » appartient à une autre entreprise. Pour passer d\'une entreprise à l\'autre, utilisez une facture interne.');
        }
        $dest.value = String(e.id);
        effacerErreur();
        w.toast('Destination : ' + e.nom, 'info', 2500);
        return;
      }
      fixerEmplacement(e.id);
      w.toast((page === 'transfert' ? 'Source : ' : 'Emplacement : ') + e.nom, 'info', 2500);
    }

    // ---- coût proposé (réception) ----------------------------------------------------
    function coutPour(pieceId) {
      var p = { piece_id: pieceId };
      if ($fourn && $fourn.value) { p.fournisseur_id = $fourn.value; }
      if ($emp.value) { p.emplacement_id = $emp.value; }
      return w.api.get('app/ajax/reception_prix.php', p).then(function (r) { return r.cout ? saisieMontant(r.cout) : null; });
    }

    function proposerCout(piece) {
      piecesParCode[piece.code] = piece;
      return coutPour(piece.id).then(function (c) { if (c !== null) { propose[piece.code] = c; } return c; });
    }

    /** Fournisseur ou emplacement changé : met à jour les coûts qui n'ont pas été modifiés à la main. */
    function rafraichirCouts() {
      qa('#lignes tbody tr').forEach(function (tr) {
        var code = tr.cells[0] ? tr.cells[0].textContent : '';
        var piece = piecesParCode[code];
        var champ = tr.querySelector('input[aria-label^="Coût unitaire"]');
        if (!piece || !champ) { return; }
        var actuel = champ.value.trim();
        if (actuel !== '' && actuel !== propose[code]) { return; }       // saisi à la main : on n'y touche pas
        coutPour(piece.id).then(function (c) {
          if (champ.value.trim() !== actuel) { return; }                  // modifié pendant l'attente
          if (c === null) { delete propose[code]; } else { propose[code] = c; }
          champ.value = c === null ? '' : c;
          champ.dispatchEvent(new Event('input', { bubbles: true }));     // le composant relit la valeur
        }).catch(function () { /* on garde la valeur actuelle */ });
      });
    }

    // ---- messages ------------------------------------------------------------------
    var champsFautifs = { emplacement_id: $emp, emplacement_dest_id: $dest, date: $date, motif: $motif, fournisseur_id: $fourn, reference: $ref, note: $note };

    function effacerErreur() {
      montrer($err, false);
      if ($err) { $err.textContent = ''; }
      qa('.mv-carte .is-invalid').forEach(function (e) { if (!e.closest('#lignes')) { e.classList.remove('is-invalid'); } });
    }

    function afficherErreur(texte, champ) {
      $err.textContent = texte;
      montrer($err, true);
      var f = champ ? champsFautifs[champ] : null;
      if (f) { f.classList.add('is-invalid'); f.focus(); }
      else if (champ === 'lignes' && sl) { sl.focus(); }
      try { $err.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
      w.toast(texte, 'danger', 5000);
      w.bip(false);
    }

    function afficherSucces(r) {
      $succes.textContent = '';
      var ic = document.createElement('i');
      ic.className = 'fas fa-check-circle mr-1';
      ic.setAttribute('aria-hidden', 'true');
      $succes.appendChild(ic);
      $succes.appendChild(document.createTextNode(cfg.doc + ' '));
      var a = document.createElement('a');
      a.href = lienDocument(r.id);
      a.textContent = r.numero;
      $succes.appendChild(a);
      $succes.appendChild(document.createTextNode(r.doublon ? ' : ce document avait déjà été enregistré (aucun doublon créé)' : ' ' + cfg.fini));
      if (r.total !== undefined && r.total !== null && page === 'reception') {
        $succes.appendChild(document.createTextNode(' — total ' + w.fmtArgent(r.total)));
      }
      $succes.appendChild(document.createTextNode('. '));
      var b = document.createElement('a');
      b.href = lienDocument(r.id);
      b.className = 'alert-link';
      b.textContent = 'Voir le document';
      $succes.appendChild(b);
      montrer($succes, true);
      try { $succes.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
    }

    // ---- résumé et totaux ----------------------------------------------------------------
    function majResume(lignes) {
      if ($resume) {
        $resume.textContent = lignes.length ? (lignes.length + (lignes.length > 1 ? ' lignes' : ' ligne')) : '';
      }
      if ($total) {
        if (!lignes.length) { $total.textContent = ''; return; }
        var somme = 0, manque = 0;
        lignes.forEach(function (l) {
          var qte = parseDec(l.quantite, 3), c = (l.cout_unitaire === undefined) ? null : parseDec(l.cout_unitaire, 4);
          if (qte === null || c === null) { manque++; return; }
          somme += totalLigneCents(qte, c);
        });
        $total.textContent = 'Total estimé : ' + w.fmtArgent(centsEnChaine(somme)) + (manque ? ' (' + manque + (manque > 1 ? ' lignes sans coût' : ' ligne sans coût') + ')' : '');
      }
    }

    // ---- validation et envoi ----------------------------------------------------------------
    function valider() {
      if (!$emp.value) { return { m: page === 'transfert' ? 'Choisissez l\'emplacement source.' : 'Choisissez l\'emplacement.', champ: 'emplacement_id' }; }
      if ($dest && !$dest.value) { return { m: 'Choisissez l\'emplacement de destination.', champ: 'emplacement_dest_id' }; }
      if (!$date.value) { return { m: 'Entrez une date valide.', champ: 'date' }; }
      if ($date.value > aujourdhui()) { return { m: 'La date ne peut pas être dans le futur.', champ: 'date' }; }
      if ($motif && !$motif.value) { return { m: page === 'sortie' ? 'Choisissez un motif de sortie.' : 'Choisissez un motif d\'ajustement.', champ: 'motif' }; }
      var e = sl.valider();
      if (e) { return { m: e, champ: 'lignes' }; }
      if (sl.compter() > MAX_LIGNES) { return { m: 'Trop de lignes (maximum ' + MAX_LIGNES + '). Enregistrez-les en plusieurs documents.', champ: 'lignes' }; }
      return null;
    }

    function charge() {
      var lignes = sl.lignes();
      if (cfg.signe) {      // le coût ne s'applique qu'aux quantités positives
        lignes.forEach(function (l) { var n = parseDec(l.quantite, 3); if (n !== null && n < 0) { delete l.cout_unitaire; } });
      }
      var d = { jeton: jeton, emplacement_id: parseInt($emp.value, 10), date: $date.value, note: $note.value, lignes: lignes };
      if ($dest) { d.emplacement_dest_id = parseInt($dest.value, 10); }
      if ($motif) { d.motif = $motif.value; }
      if ($ref) { d.reference = $ref.value; }
      if ($fourn) { d.fournisseur_id = $fourn.value ? parseInt($fourn.value, 10) : 0; }
      if ($majPrix) { d.maj_prix = !!($majPrix.checked && $fourn && $fourn.value); }
      return d;
    }

    function remiseAZero() {
      sl.vider();
      propose = {};
      $note.value = '';
      if ($ref) { $ref.value = ''; }
      if ($fourn) { $fourn.value = ''; surChangementFournisseur(); }
      $date.value = aujourdhui();
      jeton = nouveauJeton();
      effacerErreur();
      sl.focus();
    }

    function surChangementFournisseur() {
      if (!$majPrix) { return; }
      var a = !!($fourn && $fourn.value);
      $majPrix.disabled = !a;
      if (!a) { $majPrix.checked = false; }
      if ($majAide) { $majAide.textContent = a ? 'Les prix de ce fournisseur seront remplacés par les coûts saisis ci-dessous (l\'historique des prix est conservé).' : 'Choisissez d\'abord un fournisseur.'; }
    }

    function occupe(oui) {
      enCours = oui;
      $btn.disabled = oui;
      // Pendant l'envoi on n'accepte plus de scan : une pièce ajoutée à ce moment serait effacée avec la liste envoyée
      var $scan = q('#scan');
      if ($scan) { $scan.readOnly = oui; }
      $('#recherche').prop('disabled', oui);
      var s = q('span', $btn), i = q('i', $btn);
      if (oui) { $btn.setAttribute('data-libelle', s.textContent); s.textContent = 'Enregistrement…'; i.className = 'fas fa-spinner fa-spin mr-1'; }
      else if ($btn.hasAttribute('data-libelle')) { s.textContent = $btn.getAttribute('data-libelle'); i.className = 'fas fa-check mr-1'; }
    }

    function enregistrer() {
      if (enCours) { return; }                         // double clic : un seul envoi
      occupe(true);
      effacerErreur();
      montrer($succes, false);
      var e = valider();
      if (e) { occupe(false); afficherErreur(e.m, e.champ); return; }
      w.api.post(cfg.url, charge())
        .then(function (r) {
          w.bip(true);
          afficherSucces(r);
          remiseAZero();
        })
        .catch(function (err) { afficherErreur(msg(err), err.champ); })
        .then(function () { occupe(false); });
    }

    // ---- démarrage ----------------------------------------------------------------------
    sl = w.SaisieLignes.creer({
      conteneur: '#lignes', scan: '#scan', recherche: '#recherche',
      coutColonne: cfg.cout, coutObligatoire: cfg.coutObligatoire, signe: cfg.signe,
      emplacementSource: cfg.disponible ? function () { return $emp.value || null; } : undefined,
      coutParDefaut: page === 'reception' ? proposerCout : undefined,
      onEmplacement: emplacementScanne,
      onChange: majResume,
      vide: 'Scannez une pièce ou cherchez-la ci-dessus.'
    });

    // Messages plus justes pour un code d'emplacement (EMP-…) inconnu ou d'une entreprise à laquelle on n'a pas accès.
    // Le composant appelle toujours api.ajouterParCode : on l'enveloppe ici, sans toucher au composant.
    var ajouterParCode = sl.ajouterParCode;
    sl.ajouterParCode = function (code) {
      return ajouterParCode(code).catch(function (err) {
        if (/^EMP-/i.test(String(code).trim()) && /^Code inconnu/.test(err.message || '')) {
          throw new Error('Emplacement inconnu, ou d\'une entreprise à laquelle vous n\'avez pas accès : « ' + String(code).trim() + ' ».');
        }
        throw err;
      });
    };

    $emp.addEventListener('change', surChangementEmplacement);
    if ($dest) { $dest.addEventListener('change', effacerErreur); }
    if ($fourn) { $fourn.addEventListener('change', function () { surChangementFournisseur(); rafraichirCouts(); effacerErreur(); }); }
    [$date, $motif, $ref, $note, $majPrix].forEach(function (c) { if (c) { c.addEventListener('input', effacerErreur); c.addEventListener('change', effacerErreur); } });
    $btn.addEventListener('click', enregistrer);
    surChangementFournisseur();

    // Entrée dans une quantité ou un coût : retour au champ de scan (enchaîne la saisie au scanner)
    var zone = q('#lignes');
    zone.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); sl.focus(); }
    });
    zone.addEventListener('focusin', function (ev) {
      if (ev.target.tagName === 'INPUT') { try { ev.target.select(); } catch (e) { /* sans effet */ } }
    });

    w.api.get('app/ajax/emplacements_liste.php').then(function (r) {
      emplacements = (r.emplacements || []).map(function (e) { return { id: e.id, nom: e.nom, type: e.type, entreprise_id: e.entreprise_id, entreprise_nom: e.entreprise_nom }; });
      if (!emplacements.length) {
        $emp.innerHTML = '<option value="">Aucun emplacement disponible</option>';
        afficherErreur('Aucun emplacement actif n\'est disponible pour vous. Demandez à un administrateur d\'en créer un.', null);
        return;
      }
      var voulu = racine.getAttribute('data-emplacement-id') || memoLire(cleMemo) || '';
      remplir($emp, emplacements, '— Choisissez —', voulu);
      surChangementEmplacement();
      var code = racine.getAttribute('data-piece-code');
      if (code) {
        return sl.ajouterParCode(code).then(function () { w.bip(true); }).catch(function (err) { w.toast(msg(err), 'danger'); });
      }
    }).catch(function (err) {
      $emp.innerHTML = '<option value="">Liste indisponible</option>';
      afficherErreur('Impossible de charger les emplacements : ' + msg(err), null);
    }).then(function () { sl.focus(); });
  }

  // ===================================================================================
  //  Liste des documents
  // ===================================================================================
  function initDocuments() {
    var $type = q('#f-type'), $ent = q('#f-entreprise'), $statut = q('#f-statut'), $du = q('#f-du'), $au = q('#f-au'), $rech = q('#f-recherche');
    var entetes = qa('#table-documents thead th');
    var colonnes = entetes.map(function (th) {
      return { data: th.getAttribute('data-col'), className: th.classList.contains('nombre') ? 'nombre' : '', orderSequence: ['desc', 'asc'] };
    });
    var langue = $.extend({}, w.DT_LANG, {
      emptyTable: 'Aucun document pour le moment.', zeroRecords: 'Aucun document ne correspond à ces filtres.',
      infoEmpty: 'Aucun document', info: '_START_ à _END_ de _TOTAL_ documents', infoFiltered: '(filtré sur _MAX_)'
    });
    var table = $('#table-documents').DataTable({
      serverSide: true, processing: true, searching: true, order: [], search: { search: $rech.value.trim() },
      dom: "<'row'<'col-12'tr>><'row mt-2'<'col-sm-12 col-md-3'l><'col-sm-12 col-md-4'i><'col-sm-12 col-md-5'p>>",
      language: langue,
      ajax: {
        url: 'app/ajax/documents_data.php', type: 'POST',
        data: function (d) {
          d.type = $type.value;
          d.entreprise_id = $ent ? $ent.value : '';
          d.statut = $statut.value;
          d.du = $du.value;
          d.au = $au.value;
        }
      },
      columns: colonnes,
      createdRow: function (row, data) {
        if (String(data.statut).indexOf('badge-danger') !== -1) { row.classList.add('mv-ligne-annule'); }
      }
    });

    $('#table-documents').on('xhr.dt', function (ev, settings, json, xhr) {
      if (xhr && xhr.status === 401) { w.location.href = 'login.php'; }       // session expirée
    });

    function redessiner() { table.draw(); }
    [$type, $ent, $statut, $du, $au].forEach(function (c) { if (c) { c.addEventListener('change', redessiner); } });
    var minuteur = null;
    $rech.addEventListener('input', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { table.search($rech.value.trim()).draw(); }, 300);
    });
    q('#f-effacer').addEventListener('click', function () {
      [$type, $ent, $statut].forEach(function (c) { if (c) { c.value = ''; } });
      $du.value = ''; $au.value = ''; $rech.value = '';
      table.search('').draw();
    });
    // Un clic n'importe où sur la ligne ouvre le document (les liens gardent leur comportement)
    $('#table-documents tbody').on('click', 'tr', function (ev) {
      if ($(ev.target).closest('a,button,input,select').length) { return; }
      var a = this.querySelector('a');
      if (a) { w.location.href = a.getAttribute('href'); }
    }).on('mouseenter', 'tr', function () { if (this.querySelector('a')) { this.style.cursor = 'pointer'; } });
  }

  // ===================================================================================
  //  Détail d'un document : impression, annulation
  // ===================================================================================
  function initDocumentVoir() {
    var id = parseInt(racine.getAttribute('data-document-id'), 10);
    var btnImp = q('#btn-imprimer');
    if (btnImp) { btnImp.addEventListener('click', function () { w.print(); }); }

    var btn = q('#btn-annuler'), modal = q('#modal-annuler');
    if (!btn || !modal) { return; }
    var $motif = q('#annuler-motif'), $err = q('#annuler-erreur'), $ok = q('#annuler-confirmer'), $retour = q('#annuler-retour');
    var enCours = false;

    function erreur(t) { $err.textContent = t; montrer($err, !!t); }
    btn.addEventListener('click', function () { erreur(''); $(modal).modal('show'); });
    $(modal).on('shown.bs.modal', function () { $motif.focus(); });
    $(modal).on('hidden.bs.modal', function () { erreur(''); });
    $motif.addEventListener('input', function () { erreur(''); $motif.classList.remove('is-invalid'); });

    $ok.addEventListener('click', function () {
      if (enCours) { return; }
      var motif = $motif.value.trim();
      if (motif === '') { $motif.classList.add('is-invalid'); erreur('Indiquez le motif de l\'annulation.'); $motif.focus(); return; }
      enCours = true;
      $ok.disabled = true; $retour.disabled = true;
      $ok.textContent = 'Annulation en cours…';
      w.api.post('app/action/document_annuler.php', { id: id, motif: motif })
        .then(function () { w.location.href = 'index.php?page=document_voir&id=' + encodeURIComponent(String(id)) + '&ok=annule'; })
        .catch(function (err) {
          erreur(msg(err));
          enCours = false; $ok.disabled = false; $retour.disabled = false;
          $ok.textContent = 'Annuler ce document';
        });
    });
  }

  // ===================================================================================
  $(function () {
    if (CONFIG[page]) { initSaisie(CONFIG[page]); }
    else if (page === 'documents') { initDocuments(); }
    else if (page === 'document_voir') { initDocumentVoir(); }
  });
})(window, jQuery);
