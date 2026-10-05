/* Mouvements (module B) : réception, transfert, sortie, ajustement, liste des documents, détail d'un document.
 * Un seul fichier ; la page est reconnue par l'attribut data-mouvement de sa racine :
 *   reception | transfert | sortie | ajustement | documents | document_voir
 * Règles : tout texte du serveur est inséré avec textContent (jamais en HTML brut) ; les quantités et montants restent
 * des chaînes décimales (les nombres ne servent qu'à l'affichage) ; le bouton « Enregistrer » est désactivé pendant
 * l'envoi et un jeton à usage unique empêche qu'un double envoi crée deux documents.
 * Les lignes (scan, recherche, quantités, coûts) sont gérées par le composant partagé saisie-lignes.js ; ce fichier
 * ajoute par-dessus : vérification stricte des nombres (même grammaire que le serveur), totaux exacts en cents,
 * protection contre un scan tombé dans une quantité, avertissement avant de quitter une saisie, bouton +/− de l'ajustement.
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-mouvement]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-mouvement');
  var gest = racine.getAttribute('data-gestionnaire') === '1';

  // ===================================================================================
  //  Utilitaires
  // ===================================================================================
  var NB = ' ';      // espace insécable
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }

  /** Typographie française : espace insécable à l'intérieur des « guillemets » et avant : ; ? ! (les messages du serveur n'en ont pas). */
  function typo(t) {
    return String(t).replace(/«[ \u00a0]?/g, '«' + NB).replace(/[ \u00a0]?»/g, NB + '»').replace(/[ \u00a0]([:;?!])/g, NB + '$1');   // idempotent
  }
  /** « P-0001 » avec espaces insécables. */
  function guill(texte) { return '«' + NB + texte + NB + '»'; }

  /** Message d'erreur affichable : jamais de texte technique anglais ; $enregistrement : le renvoi ne crée pas de doublon. */
  function msg(err, enregistrement) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed|connexion (au serveur )?impossible/i.test(m)) {
      return typo(enregistrement
        ? 'Connexion au serveur impossible. Vérifiez le réseau, puis cliquez de nouveau sur Enregistrer : le document ne sera pas créé en double.'
        : 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez.');
    }
    return typo(m || 'Erreur inattendue. Réessayez.');
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

  /**
   * Analyse d'une saisie décimale avec la MÊME grammaire que le serveur (Dec::parse) : espaces ignorés, une seule virgule
   * ou un seul point, signe facultatif. Retourne null si illisible (« 12abc », « 1e3 », « 1.000.5 »), sinon
   * {n: entier mis à l'échelle (3 pour une quantité, 4 pour un coût), neg, trop: plus de décimales que l'échelle}.
   */
  function lireDec(s, echelle) {
    var t = String(s === null || s === undefined ? '' : s).replace(/[\s ]/g, '');
    var m = /^([+-]?)(\d*)(?:[.,](\d*))?$/.exec(t);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) { return null; }
    var ent = m[2].replace(/^0+/, ''), frac = m[3] || '';
    if (ent.length > 9) { return { n: Number.MAX_SAFE_INTEGER, neg: m[1] === '-', trop: false }; }     // bien au-delà des limites : refusé plus loin
    var arrondi = (frac.length > echelle && frac.charAt(echelle) >= '5') ? 1 : 0;
    var n = parseInt((ent || '0') + (frac + '0000000000').substr(0, echelle), 10) + arrondi;
    return { n: m[1] === '-' ? -n : n, neg: m[1] === '-', trop: frac.length > echelle };
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
    var r = Math.floor((Math.abs(p) + 50000) / 100000);
    return neg ? -r : r;
  }

  function lienDocument(id) { return 'index.php?page=document_voir&id=' + encodeURIComponent(String(id)); }

  // Titre d'onglet propre à chaque écran (le titre de la coquille est le même partout)
  (function () {
    var h1 = q('.content-header h1');
    if (h1 && h1.textContent.trim()) { document.title = (page === 'document_voir' ? 'Document ' : '') + h1.textContent.trim() + ' — Beauchemin'; }
  })();

  // ===================================================================================
  //  Écrans de saisie : réception, transfert, sortie, ajustement
  // ===================================================================================
  var CONFIG = {
    reception:  { url: 'app/action/reception_save.php',  doc: 'Réception',  fini: 'enregistrée', cout: true,  coutObligatoire: true,  signe: false, disponible: false },
    transfert:  { url: 'app/action/transfert_save.php',  doc: 'Transfert',  fini: 'enregistré', cout: false, coutObligatoire: false, signe: false, disponible: true },
    sortie:     { url: 'app/action/sortie_save.php',     doc: 'Sortie',     fini: 'enregistrée', cout: false, coutObligatoire: false, signe: false, disponible: true },
    ajustement: { url: 'app/action/ajustement_save.php', doc: 'Ajustement', fini: 'enregistré', cout: true,  coutObligatoire: false, signe: true,  disponible: true }
  };
  var TYPES_EMP = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };
  var MAX_LIGNES = 300;
  var MAX_QTE = 100000;        // unités par ligne (comme le service)
  var MAX_COUT = 100000;       // $ par unité (comme le service)

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
    var sourceChoisie = false; // transfert : la source a été choisie dans CETTE saisie (liste, URL ou premier code EMP scanné)
    var sl = null;

    // ---- emplacements ------------------------------------------------------------
    function parId(id) {
      for (var i = 0; i < emplacements.length; i++) { if (String(emplacements[i].id) === String(id)) { return emplacements[i]; } }
      return null;
    }
    function plusieursEntreprises() {
      var vus = {}, n = 0;
      emplacements.forEach(function (e) { if (!vus[e.entreprise_id]) { vus[e.entreprise_id] = true; n++; } });
      return n > 1;
    }
    /** Nom d'un emplacement, avec son entreprise quand deux entreprises peuvent porter le même nom (« Entrepôt principal »). */
    function nomComplet(e) { return plusieursEntreprises() ? e.nom + ' (' + e.entreprise_nom + ')' : e.nom; }

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

    var aideFacture = function () {
      return gest ? 'Pour passer d\'une entreprise à l\'autre, utilisez une facture interne.' : 'Pour passer d\'une entreprise à l\'autre, demandez à un gestionnaire de faire une facture interne.';
    };

    /**
     * Un code EMP-… a été scanné : choisit l'emplacement.
     * Transfert : le premier code scanné de la saisie choisit TOUJOURS la source (et vide la destination), le suivant la destination —
     * même si une source avait été mémorisée d'une saisie précédente.
     */
    function emplacementScanne(emp) {
      var e = parId(emp.id);
      if (!e) { throw new Error('L\'emplacement ' + guill(emp.nom) + ' est désactivé ou n\'est pas disponible.'); }
      if (page === 'transfert' && sourceChoisie && $emp.value) {
        var s = parId($emp.value);
        if (String(e.id) === String($emp.value)) { throw new Error(guill(nomComplet(e)) + ' est déjà la source. Scannez la destination.'); }
        if (s && e.entreprise_id !== s.entreprise_id) {
          throw new Error(guill(e.nom) + ' (' + e.entreprise_nom + ') appartient à une autre entreprise que la source (' + s.entreprise_nom + '). ' + aideFacture());
        }
        $dest.value = String(e.id);
        effacerErreur();
        w.toast(typo('Destination : ' + nomComplet(e)), 'info', 2500);
        return;
      }
      if (page === 'transfert') { sourceChoisie = true; }
      fixerEmplacement(e.id);
      if (page === 'transfert' && $dest) { $dest.value = ''; }
      w.toast(typo((page === 'transfert' ? 'Source : ' : 'Emplacement : ') + nomComplet(e)), 'info', 2500);
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

    var erreurSurLignes = false;      // l'erreur affichée concerne les lignes (elle disparaît dès qu'on les modifie) et non un champ d'en-tête

    /** Efface le bandeau d'erreur et les surlignages (champs d'en-tête, coûts et rangées fautives). */
    function effacerErreur() {
      erreurSurLignes = false;
      montrer($err, false);
      if ($err) { $err.textContent = ''; }
      qa('.mv-carte .is-invalid').forEach(function (e) { if (!e.closest('#lignes')) { e.classList.remove('is-invalid'); } });
      // dans les lignes, la quantité est surlignée par le composant lui-même ; on ne retire que nos surlignages (coût, rangée)
      qa('#lignes input[aria-label^="Coût"].is-invalid').forEach(function (e) { e.classList.remove('is-invalid'); });
      qa('#lignes tr.table-danger').forEach(function (e) { e.classList.remove('table-danger'); });
    }

    function afficherErreur(texte, champ, elLigne) {
      texte = typo(texte);
      erreurSurLignes = (champ === 'lignes' || !!elLigne);
      $err.textContent = texte;
      montrer($err, true);
      var f = champ ? champsFautifs[champ] : null;
      if (elLigne) {
        elLigne.classList.add('is-invalid');
        try { elLigne.focus(); elLigne.scrollIntoView({ block: 'center' }); } catch (e) { /* ancien navigateur */ }
      } else if (f) { f.classList.add('is-invalid'); f.focus(); }
      else if (champ === 'lignes' && sl) { sl.focus(); }
      if (!elLigne) { try { $err.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ } }
      w.toast(texte, 'danger', 5000);
      w.bip(false);
    }

    /**
     * Erreur du serveur : « Ligne 3 : coût invalide. » devient « Pièce « P-0003 » : coût invalide. » (le tableau n'a pas de numéros
     * de ligne) et la rangée fautive est surlignée ; un « Stock insuffisant pour « P-0003 — … » » surligne la quantité de P-0003.
     */
    function afficherErreurServeur(err) {
      var texte = String(err && err.message ? err.message : ''), el = null;
      var rangs = qa('#lignes tbody tr');
      var m = /^Ligne (\d+)(?:\s*:)?\s*(.*)$/.exec(texte);
      if (m && rangs[parseInt(m[1], 10) - 1]) {
        var tr = rangs[parseInt(m[1], 10) - 1];
        var reste = m[2].replace('la variation ne peut pas être zéro', 'la quantité ne peut pas être zéro');
        texte = 'Pièce ' + guill(tr.cells[0].textContent) + (/^Ligne \d+\s*:/.test(texte) ? ' : ' : ' ') + reste;
        el = tr.querySelector(/coût/i.test(reste) ? 'input[aria-label^="Coût"]' : 'input[aria-label^="Quantité"]');
        if (!el) { tr.classList.add('table-danger'); }
      } else {
        var s = /^Stock insuffisant pour « ?(\S+) — /.exec(texte);
        if (s) {
          rangs.forEach(function (r) { if (!el && r.cells[0].textContent === s[1]) { el = r.querySelector('input[aria-label^="Quantité"]'); } });
        }
      }
      afficherErreur(msg({ message: texte }, true), err && err.champ, el);
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
      $succes.appendChild(document.createTextNode(r.doublon ? NB + ': ce document avait déjà été enregistré (aucun doublon créé)' : ' ' + cfg.fini));
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
        var trop = lignes.length > MAX_LIGNES;
        $resume.textContent = !lignes.length ? '' : (trop
          ? lignes.length + ' lignes' + NB + ': maximum ' + MAX_LIGNES + ' par document'
          : lignes.length + (lignes.length > 1 ? ' lignes' : ' ligne'));
        $resume.classList.toggle('text-danger', trop);
        $resume.classList.toggle('font-weight-bold', trop);
        $resume.classList.toggle('text-muted', !trop);
      }
      if ($total) {
        if (!lignes.length) { $total.textContent = ''; return; }
        var somme = 0, manque = 0;
        lignes.forEach(function (l) {
          var qte = lireDec(l.quantite, 3), c = (l.cout_unitaire === undefined) ? null : lireDec(l.cout_unitaire, 4);
          if (qte === null || c === null) { manque++; return; }
          somme += totalLigneCents(qte.n, c.n);
        });
        $total.textContent = 'Total estimé' + NB + ': ' + w.fmtArgent(centsEnChaine(somme)) + (manque ? ' (' + manque + (manque > 1 ? ' lignes sans coût' : ' ligne sans coût') + ')' : '');
      }
    }

    /** Le composant calcule le total d'une ligne en nombres à virgule : on le remplace par le calcul exact en cents (celui du serveur). */
    function corrigerTotaux(lignes) {
      if (!cfg.cout) { return; }
      qa('#lignes tbody tr').forEach(function (tr, i) {
        var l = lignes[i], cel = tr.cells[tr.cells.length - 2];      // « Total » : juste avant le bouton Retirer
        if (!l || !cel) { return; }
        var qte = lireDec(l.quantite, 3), c = (l.cout_unitaire === undefined) ? null : lireDec(l.cout_unitaire, 4);
        cel.textContent = (qte === null || c === null) ? '' : w.fmtArgent(centsEnChaine(totalLigneCents(qte.n, c.n)));
      });
    }

    /** Ajustement : un bouton +/− par ligne (le clavier numérique d'une tablette n'a pas toujours la touche « − »). */
    function ajouterBoutonsSigne() {
      qa('#lignes tbody tr').forEach(function (tr) {
        var champ = tr.querySelector('input[aria-label^="Quantité"]');
        if (!champ || tr.querySelector('.mv-signe')) { return; }
        var code = tr.cells[0].textContent;
        var enveloppe = document.createElement('div');
        enveloppe.className = 'mv-qte-signee';
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-outline-secondary mv-signe';
        b.title = 'Changer le signe : ajouter (+) ou retirer (−)';
        b.setAttribute('aria-label', 'Changer le signe de la quantité de ' + code);
        b.textContent = '+/−';
        b.addEventListener('click', function () {
          var v = champ.value.trim();
          champ.value = v.charAt(0) === '-' ? v.slice(1) : (v.charAt(0) === '+' ? '-' + v.slice(1) : '-' + v);
          champ.dispatchEvent(new Event('input', { bubbles: true }));
          champ.focus();
        });
        champ.parentNode.insertBefore(enveloppe, champ);
        enveloppe.appendChild(b);
        enveloppe.appendChild(champ);
      });
    }

    /** Appelé par le composant après chaque changement de lignes (ajout, retrait, quantité, coût). */
    function surChangementLignes(lignes) {
      majResume(lignes);
      corrigerTotaux(lignes);
      if (cfg.signe) { ajouterBoutonsSigne(); }
      if (lignes.length) { montrer($succes, false); }     // le message de réussite du document précédent n'a plus lieu d'être
      if (erreurSurLignes) { effacerErreur(); }            // un message d'erreur périmé laisse croire que le problème persiste (un champ d'en-tête non corrigé garde son message)
    }

    // ---- validation et envoi ----------------------------------------------------------------
    /**
     * Vérification de confort des lignes, avec la même grammaire que le serveur (le serveur reste l'autorité).
     * Retourne null ou {m: message, champ: 'lignes', el: champ fautif}.
     */
    function validerLignes() {
      var lignes = sl.lignes(), rangs = qa('#lignes tbody tr');
      if (!lignes.length) { return { m: 'Ajoutez au moins une pièce.', champ: 'lignes' }; }
      for (var i = 0; i < lignes.length; i++) {
        var l = lignes[i], tr = rangs[i];
        if (!tr) { continue; }
        var code = guill(tr.cells[0].textContent);
        var inQ = tr.querySelector('input[aria-label^="Quantité"]'), inC = tr.querySelector('input[aria-label^="Coût"]');
        var qte = lireDec(l.quantite, 3);
        if (qte === null) { return { m: 'Quantité invalide pour ' + code + ' (exemple : 1,5).', champ: 'lignes', el: inQ }; }
        if (qte.trop) { return { m: 'La quantité de ' + code + ' ne peut pas avoir plus de 3 décimales.', champ: 'lignes', el: inQ }; }
        if (cfg.signe ? qte.n === 0 : qte.n <= 0) {
          return { m: cfg.signe
            ? 'La quantité de ' + code + ' ne peut pas être zéro : entrez un nombre positif ou négatif.'
            : 'La quantité de ' + code + ' doit être supérieure à zéro.', champ: 'lignes', el: inQ };
        }
        if (Math.abs(qte.n) > MAX_QTE * 1000) { return { m: 'La quantité de ' + code + ' est trop grande (maximum 100' + NB + '000).', champ: 'lignes', el: inQ }; }
        if (cfg.cout && (!cfg.signe || qte.n > 0)) {            // ajustement : le coût ne sert qu'aux quantités positives
          if (l.cout_unitaire === undefined) {
            if (cfg.coutObligatoire) { return { m: 'Entrez le coût unitaire de ' + code + '.', champ: 'lignes', el: inC }; }
          } else {
            var c = lireDec(l.cout_unitaire, 4);
            if (c === null || c.neg) { return { m: 'Coût unitaire invalide pour ' + code + ' (exemple : 12,50).', champ: 'lignes', el: inC }; }
            if (c.trop) { return { m: 'Le coût unitaire de ' + code + ' ne peut pas avoir plus de 4 décimales.', champ: 'lignes', el: inC }; }
            if (c.n > MAX_COUT * 10000) { return { m: 'Le coût unitaire de ' + code + ' est trop élevé (maximum 100' + NB + '000' + NB + '$).', champ: 'lignes', el: inC }; }
          }
        }
      }
      return null;
    }

    function valider() {
      if (!$emp.value) { return { m: page === 'transfert' ? 'Choisissez l\'emplacement source.' : 'Choisissez l\'emplacement.', champ: 'emplacement_id' }; }
      if ($dest && !$dest.value) { return { m: 'Choisissez l\'emplacement de destination.', champ: 'emplacement_dest_id' }; }
      if (!$date.value) { return { m: 'Entrez une date valide.', champ: 'date' }; }
      if ($date.value > aujourdhui()) { return { m: 'La date ne peut pas être dans le futur.', champ: 'date' }; }
      if ($motif && !$motif.value) { return { m: page === 'sortie' ? 'Choisissez un motif de sortie.' : 'Choisissez un motif d\'ajustement.', champ: 'motif' }; }
      if (sl.compter() > MAX_LIGNES) { return { m: 'Trop de lignes (maximum ' + MAX_LIGNES + '). Retirez-en ou enregistrez-les en plusieurs documents.', champ: 'lignes' }; }
      return validerLignes();
    }

    function charge() {
      var lignes = sl.lignes();
      if (cfg.signe) {      // le coût ne s'applique qu'aux quantités positives
        lignes.forEach(function (l) { var n = lireDec(l.quantite, 3); if (n !== null && n.n < 0) { delete l.cout_unitaire; } });
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
      if ($dest) { $dest.value = ''; }          // transfert : la destination est à choisir de nouveau
      sourceChoisie = false;                    // le premier code EMP scanné de la prochaine saisie choisira la source
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

    // Des scans peuvent encore être « en file » dans le champ de scan (rafale + clic sur Enregistrer) : on les attend (8 s au plus)
    function attendreScans() {
      var $scan = q('#scan');
      return new Promise(function (ok) {
        var t0 = Date.now();
        (function boucle() {
          var n = $scan ? parseInt($scan.getAttribute('data-attente') || '0', 10) : 0;
          if (!n || Date.now() - t0 > 8000) { ok(); } else { setTimeout(boucle, 40); }
        })();
      });
    }

    function enregistrer() {
      if (enCours) { return; }                         // double clic : un seul envoi
      enCours = true; $btn.disabled = true;            // verrou immédiat pendant l'attente de la file de scans
      effacerErreur();
      montrer($succes, false);
      attendreScans().then(function () {
        occupe(true);                                  // le champ de scan est verrouillé seulement une fois la file vidée
        var e = valider();
        if (e) { occupe(false); afficherErreur(e.m, e.champ, e.el); return; }
        return w.api.post(cfg.url, charge())
          .then(function (r) {
            w.bip(true);
            afficherSucces(r);
            remiseAZero();
          })
          .catch(function (err) {
            if (err && err.champ === 'jeton') { jeton = nouveauJeton(); }      // saisie modifiée après un envoi déjà enregistré : le prochain clic crée un nouveau document
            afficherErreurServeur(err);
          })
          .then(function () { occupe(false); });
      });
    }

    // ---- démarrage ----------------------------------------------------------------------
    sl = w.SaisieLignes.creer({
      conteneur: '#lignes', scan: '#scan', recherche: '#recherche',
      coutColonne: cfg.cout, coutObligatoire: cfg.coutObligatoire, signe: cfg.signe,
      inactivesOk: page !== 'reception',      // une pièce désactivée garde son stock : on peut le sortir, le transférer ou le diminuer
      emplacementSource: cfg.disponible ? function () { return $emp.value || null; } : undefined,
      coutParDefaut: page === 'reception' ? proposerCout : undefined,
      onEmplacement: emplacementScanne,
      onChange: surChangementLignes,
      vide: 'Scannez une pièce ou cherchez-la ci-dessus.'
    });
    if (page === 'ajustement') {       // à l'ajustement, la colonne montre le solde actuel (avant la correction)
      qa('#lignes thead th').forEach(function (th) { if (th.textContent === 'Disponible') { th.textContent = 'Stock actuel'; } });
    }

    // Messages plus justes pour un code d'emplacement (EMP-…) inconnu ou d'une entreprise à laquelle on n'a pas accès.
    // Le composant appelle toujours api.ajouterParCode : on l'enveloppe ici, sans toucher au composant.
    var ajouterParCode = sl.ajouterParCode;
    sl.ajouterParCode = function (code) {
      return ajouterParCode(code).catch(function (err) {
        if (/^EMP-/i.test(String(code).trim()) && /^Code inconnu/.test(err.message || '')) {
          throw new Error(typo('Emplacement inconnu, ou d\'une entreprise à laquelle vous n\'avez pas accès : ' + guill(String(code).trim()) + '.'));
        }
        throw new Error(typo(err.message || 'Erreur inattendue.'));
      });
    };

    // (pas de retour de focus au champ de scan sur « change » : les flèches du clavier changent la valeur d'une liste fermée.
    //  Une frappe qui tombe sur une liste est redirigée vers le champ de scan par app.js ; sur une case ou une date, par le gestionnaire plus bas.)
    $emp.addEventListener('change', function () {
      if (page === 'transfert') { sourceChoisie = !!$emp.value; }
      surChangementEmplacement();
    });
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

    // Un lecteur de codes-barres « tape » dans le champ qui a le focus : dans une quantité, un coût ou une date il écraserait la valeur
    // (« 5P-0003 »), sur une case à cocher il serait perdu. Une lettre n'a rien à faire dans un nombre ni dans une date : c'est un code,
    // on le redirige vers le champ de scan. Une rafale de chiffres (6 frappes à moins de 50 ms : aucune main ne tape ainsi) est un code
    // UPC : la valeur d'origine est rétablie et le code passe dans le champ de scan. (Les champs de texte gardent leur saisie : on peut
    // y scanner un numéro de bon de travail.)
    var rafale = { n: 0, t: 0, avant: '', texte: '' };
    racine.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if (t.tagName !== 'INPUT' || ev.ctrlKey || ev.metaKey || ev.altKey || !ev.key || ev.key.length !== 1) { return; }
      var nombre = !!t.closest('#lignes') || t.type === 'date', coche = (t.type === 'checkbox' || t.type === 'radio');
      if (!nombre && !coche) { return; }
      var scan = q('#scan');
      if (!scan || scan.readOnly || scan.disabled) { return; }
      if (coche) { if (ev.key !== ' ') { scan.focus(); } return; }
      if (!/[0-9.,+\-\s\/]/.test(ev.key)) { scan.focus(); return; }          // la frappe est alors saisie dans le champ de scan
      var maintenant = Date.now();
      if (maintenant - rafale.t > 50) { rafale.n = 0; rafale.avant = t.value; rafale.texte = ''; }
      rafale.t = maintenant; rafale.n++; rafale.texte += ev.key;
      if (rafale.n >= 6) {
        ev.preventDefault();
        t.value = rafale.avant;
        t.dispatchEvent(new Event('input', { bubbles: true }));                // le composant relit la valeur d'origine
        scan.value = rafale.texte; scan.focus();
        rafale.n = 0; rafale.texte = '';
      }
    }, true);

    // Quitter la page (menu, retour du navigateur, rechargement) avec des lignes saisies les perdrait sans avertissement
    w.addEventListener('beforeunload', function (ev) {
      if (enCours || !sl || sl.compter() === 0) { return; }
      ev.preventDefault();
      ev.returnValue = '';
    });

    w.api.get('app/ajax/emplacements_liste.php').then(function (r) {
      emplacements = (r.emplacements || []).map(function (e) { return { id: e.id, nom: e.nom, type: e.type, entreprise_id: e.entreprise_id, entreprise_nom: e.entreprise_nom }; });
      if (!emplacements.length) {
        $emp.innerHTML = '<option value="">Aucun emplacement disponible</option>';
        afficherErreur('Aucun emplacement actif n\'est disponible pour vous. Demandez à un administrateur d\'en créer un.', null);
        return;
      }
      var depuisUrl = racine.getAttribute('data-emplacement-id') || '';
      var voulu = depuisUrl || memoLire(cleMemo) || '';
      remplir($emp, emplacements, '— Choisissez —', voulu);
      surChangementEmplacement();
      if (page === 'transfert' && depuisUrl && $emp.value === String(depuisUrl)) { sourceChoisie = true; }     // source imposée par l'adresse
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
    var $avert = q('#f-avert'), $erreur = q('#documents-erreur');
    var entetes = qa('#table-documents thead th');
    var colonnes = entetes.map(function (th) {
      return { data: th.getAttribute('data-col'), className: th.className.replace(/\bsorting\w*\b/g, '').trim(), orderSequence: ['desc', 'asc'] };
    });
    var langue = $.extend(true, {}, w.DT_LANG, {
      emptyTable: 'Aucun document pour le moment.', zeroRecords: 'Aucun document ne correspond à ces critères.',
      infoEmpty: 'Aucun document', info: '_START_ à _END_ de _TOTAL_ documents', infoFiltered: '(filtré sur _MAX_)',
      aria: {
        sortAscending: NB + ': activer pour trier par ordre croissant',
        sortDescending: NB + ': activer pour trier par ordre décroissant',
        paginate: { first: 'Première page', previous: 'Page précédente', next: 'Page suivante', last: 'Dernière page' }
      }
    });

    function datesInversees() { return !!($du.value && $au.value && $du.value > $au.value); }
    function filtresActifs() { return !!(($type && $type.value) || ($ent && $ent.value) || ($statut && $statut.value) || $du.value || $au.value || $rech.value.trim()); }

    /** « Aucun document pour le moment » n'est vrai que sans filtre : avec un filtre, on le dit (le comptage total tient compte des filtres). */
    function majMessageVide(settings) {
      var inv = datesInversees(), lang = settings.oLanguage;
      lang.sEmptyTable = inv ? 'Aucun document : la date de début est après la date de fin.'
        : (filtresActifs() ? 'Aucun document ne correspond à ces critères. Utilisez «' + NB + 'Effacer les filtres' + NB + '».' : 'Aucun document pour le moment.');
      lang.sZeroRecords = lang.sEmptyTable;
      $avert.textContent = inv ? 'La date de début est après la date de fin.' : '';
      montrer($avert, inv);
    }

    var table = $('#table-documents').DataTable({
      serverSide: true, processing: true, searching: true, order: [], search: { search: $rech.value.trim() },
      dom: "<'row'<'col-12'tr>><'row mt-2'<'col-sm-12 col-md-3'l><'col-sm-12 col-md-4'i><'col-sm-12 col-md-5'p>>",
      language: langue,
      ajax: {
        url: 'app/ajax/documents_data.php', type: 'POST',
        data: function (d, settings) {
          d.type = $type.value;
          d.entreprise_id = $ent ? $ent.value : '';
          d.statut = $statut.value;
          d.du = $du.value;
          d.au = $au.value;
          if (settings) { majMessageVide(settings); }
        }
      },
      columns: colonnes,
      createdRow: function (row, data) {
        if (String(data.statut).indexOf('badge-danger') !== -1) { row.classList.add('mv-ligne-annule'); }
      }
    });

    /** Échec du chargement (serveur ou réseau) : message français durable avec « Réessayer », jamais de texte anglais ni de silence. */
    function montrerErreurListe(xhr) {
      var s = xhr ? xhr.status : 0, t;
      if (s === 403) { t = 'Accès refusé. Rechargez la page.'; }
      else if (s === 0) { t = 'Connexion au serveur impossible. Vérifiez le réseau, puis cliquez sur «' + NB + 'Réessayer' + NB + '».'; }
      else { t = 'Impossible de charger la liste des documents. Cliquez sur «' + NB + 'Réessayer' + NB + '».'; }
      $erreur.textContent = t + ' ';
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn btn-sm btn-outline-danger ml-2'; b.textContent = 'Réessayer';
      b.addEventListener('click', function () { table.draw(false); });
      $erreur.appendChild(b);
      montrer($erreur, true);
      if (s === 0) { w.toast(t, 'danger'); }       // les autres échecs ont déjà leur notification (app.js)
    }

    $('#table-documents').on('xhr.dt', function (ev, settings, json, xhr) {
      if (xhr && xhr.status === 401) { w.location.href = 'login.php'; return; }      // session expirée
      if (json === null || json === undefined || (json && json.ok === false)) { montrerErreurListe(xhr); }
      else { montrer($erreur, false); }
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
    var LIBELLE_OK = $ok.textContent;

    function erreur(t) { $err.textContent = t; montrer($err, !!t); }
    btn.addEventListener('click', function () { erreur(''); $(modal).modal('show'); });
    $(modal).on('shown.bs.modal', function () { $motif.focus(); });
    $(modal).on('hidden.bs.modal', function () { erreur(''); btn.focus(); });      // le focus revient au bouton qui a ouvert la fenêtre
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
          $ok.textContent = LIBELLE_OK;
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
