/* Inter-entreprises et rapports (module C) : facture interne au coût, liste des factures, facture imprimable (annulation),
 * bilan mensuel, valeur de l'inventaire. Un seul fichier ; la page est reconnue par l'attribut data-ie de sa racine :
 *   facture_interne | factures_internes | facture_interne_voir | bilan_mensuel | valeur_inventaire
 * Règles : tout texte venant du serveur est inséré avec textContent ou esc() (jamais en HTML brut) ; les quantités et montants
 * restent des chaînes décimales (les nombres ne servent qu'à l'affichage et au tri) ; les coûts et totaux d'une facture sont
 * calculés par le serveur (aperçu en lecture seule), jamais saisis ; le bouton « Enregistrer » est désactivé pendant l'envoi et
 * un jeton à usage unique empêche qu'un double envoi crée deux factures. Les lignes (scan, recherche, quantités) sont gérées
 * par le composant partagé saisie-lignes.js.
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-ie]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-ie');

  // ===================================================================================
  //  Utilitaires
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  function el(tag, classe, texte) {
    var e = document.createElement(tag);
    if (classe) { e.className = classe; }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }

  /** Message d'erreur affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez : rien n\'a été enregistré en double.';
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

  /** Jeton aléatoire d'une saisie (le serveur refuse de créer deux fois la même facture). */
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

  function lienFacture(id) { return 'index.php?page=facture_interne_voir&id=' + encodeURIComponent(String(id)); }

  var TYPES_EMP = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };

  function bouton_imprimer() {
    var b = q('#btn-imprimer');
    if (b) { b.addEventListener('click', function () { w.print(); }); }
  }

  // ===================================================================================
  //  Facture interne : saisie
  // ===================================================================================
  function initFacture() {
    var $emp = q('#emplacement'), $ent = q('#entreprise-dest'), $dest = q('#destination'), $date = q('#date'), $note = q('#note');
    var $zeroBloc = q('#ie-zero-bloc'), $zero = q('#cout-zero'), $avert = q('#ie-avert'), $total = q('#ie-total');
    var $btn = q('#btn-enregistrer'), $err = q('#ie-erreur'), $succes = q('#ie-succes'), $resume = q('#ie-resume');
    var CLE_SRC = 'bea.ie.facture.source', CLE_DEST = 'bea.ie.facture.destination.';
    var emplacements = [];       // emplacements actifs de mes entreprises (sources possibles)
    var entreprises = [];        // toutes les entreprises actives (destinataires possibles)
    var enCours = false;
    var jeton = nouveauJeton();
    var reqDest = 0;             // numéro de la dernière demande de la liste des destinations (ignore les réponses périmées)
    var apercu = { seq: 0, minuteur: null, lancer: null, promesse: Promise.resolve(), sansCout: [], pret: false };
    var sl = null;

    // ---- listes déroulantes ----------------------------------------------------------
    function parId(id) {
      for (var i = 0; i < emplacements.length; i++) { if (String(emplacements[i].id) === String(id)) { return emplacements[i]; } }
      return null;
    }

    /** Liste groupée par entreprise (textContent : aucun HTML issu du serveur). */
    function remplirSources(valeur) {
      $emp.innerHTML = '';
      var o = el('option', null, '— Choisissez —'); o.value = '';
      $emp.appendChild(o);
      var groupe = null, courant = null;
      emplacements.forEach(function (e) {
        if (courant !== e.entreprise_id) {
          groupe = document.createElement('optgroup');
          groupe.label = e.entreprise_nom;
          $emp.appendChild(groupe);
          courant = e.entreprise_id;
        }
        var op = el('option', null, e.nom + ' (' + (TYPES_EMP[e.type] || e.type) + ')');
        op.value = String(e.id);
        groupe.appendChild(op);
      });
      $emp.disabled = false;
      if (valeur && parId(valeur)) { $emp.value = String(valeur); }
    }

    function remplirDestinations(liste, vide, valeur) {
      $dest.innerHTML = '';
      var o = el('option', null, vide); o.value = '';
      $dest.appendChild(o);
      liste.forEach(function (e) {
        var op = el('option', null, e.nom + ' (' + (TYPES_EMP[e.type] || e.type) + ')');
        op.value = String(e.id);
        $dest.appendChild(op);
      });
      $dest.disabled = !liste.length;
      if (valeur && liste.some(function (e) { return String(e.id) === String(valeur); })) { $dest.value = String(valeur); }
      else if (liste.length === 1) { $dest.value = String(liste[0].id); }
    }

    /** Entreprises destinataires : toutes sauf l'entreprise de la source. */
    function majEntreprises() {
      var s = parId($emp.value);
      var ancien = $ent.value;
      $ent.innerHTML = '';
      if (!s) {
        var o0 = el('option', null, 'Choisissez d\'abord la source'); o0.value = '';
        $ent.appendChild(o0);
        $ent.disabled = true;
        chargerDestinations();
        return;
      }
      var liste = entreprises.filter(function (e) { return String(e.id) !== String(s.entreprise_id); });
      var o = el('option', null, liste.length ? '— Choisissez —' : 'Aucune autre entreprise active'); o.value = '';
      $ent.appendChild(o);
      liste.forEach(function (e) { var op = el('option', null, e.nom); op.value = String(e.id); $ent.appendChild(op); });
      $ent.disabled = !liste.length;
      if (ancien && liste.some(function (e) { return String(e.id) === String(ancien); })) { $ent.value = String(ancien); }
      else if (liste.length === 1) { $ent.value = String(liste[0].id); }
      chargerDestinations();
    }

    /** Emplacements actifs de l'entreprise destinataire choisie (voulu : emplacement à présélectionner). */
    function chargerDestinations(voulu) {
      var id = $ent.value;
      var mon = ++reqDest;
      if (!id) {
        remplirDestinations([], 'Choisissez d\'abord l\'entreprise', '');
        return Promise.resolve();
      }
      $dest.disabled = true;
      $dest.innerHTML = '<option value="">Chargement…</option>';
      return w.api.get('app/ajax/emplacements_liste.php', { destination_entreprise: id }).then(function (r) {
        if (mon !== reqDest) { return; }
        var liste = r.emplacements || [];
        remplirDestinations(liste, liste.length ? '— Choisissez la destination —' : 'Aucun emplacement actif dans cette entreprise', voulu || memoLire(CLE_DEST + id));
      }).catch(function (err) {
        if (mon !== reqDest) { return; }
        $dest.innerHTML = '<option value="">Liste indisponible</option>';
        afficherErreur('Impossible de charger les emplacements de destination : ' + msg(err), null);
      });
    }

    function surChangementSource() {
      if ($emp.value) { memoEcrire(CLE_SRC, $emp.value); }
      majEntreprises();
      if (sl) { sl.rafraichir(); }        // « Disponible » et aperçu des coûts de la nouvelle source
      effacerErreur();
    }

    // ---- scan d'un emplacement ---------------------------------------------------------
    /** Un code EMP-… a été scanné : la source s'il n'y en a pas encore (ou si c'est la même entreprise), sinon la destination. */
    function emplacementScanne(emp) {
      var s = parId($emp.value);
      if (s && String(emp.entreprise_id) !== String(s.entreprise_id)) {
        if (!entreprises.some(function (e) { return String(e.id) === String(emp.entreprise_id); })) {
          throw new Error('L\'entreprise de « ' + emp.nom + ' » ne peut pas recevoir de facture.');
        }
        $ent.value = String(emp.entreprise_id);
        chargerDestinations(String(emp.id)).then(function () {
          if ($dest.value !== String(emp.id)) { throw new Error('L\'emplacement « ' + emp.nom + ' » est désactivé : choisissez la destination dans la liste.'); }
          memoEcrire(CLE_DEST + emp.entreprise_id, String(emp.id));
          effacerErreur();
          w.toast('Destination : ' + emp.nom, 'info');
        }).catch(function (err) { w.bip(false); w.toast(msg(err), 'danger'); });
        return;
      }
      var e = parId(emp.id);
      if (!e) { throw new Error('L\'emplacement « ' + emp.nom + ' » est désactivé ou n\'est pas disponible.'); }
      $emp.value = String(e.id);
      surChangementSource();
      w.toast('Source : ' + e.nom, 'info');
    }

    // ---- messages ------------------------------------------------------------------------
    var champsFautifs = { emplacement_id: $emp, entreprise_dest_id: $ent, emplacement_dest_id: $dest, date: $date, note: $note };

    function effacerErreur() {
      montrer($err, false);
      $err.textContent = '';
      qa('.ie-carte .is-invalid').forEach(function (e) { if (!e.closest('#lignes')) { e.classList.remove('is-invalid'); } });
    }

    function afficherErreur(texte, champ) {
      $err.textContent = texte;
      montrer($err, true);
      var f = champ ? champsFautifs[champ] : null;
      if (f) { f.classList.add('is-invalid'); }
      try { $err.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
      w.toast(texte, 'danger');
      w.bip(false);
    }

    function afficherSucces(r) {
      $succes.textContent = '';
      var ic = el('i', 'fas fa-check-circle mr-1');
      ic.setAttribute('aria-hidden', 'true');
      $succes.appendChild(ic);
      $succes.appendChild(document.createTextNode('Facture interne '));
      var a = el('a', null, r.numero);
      a.href = lienFacture(r.id);
      $succes.appendChild(a);
      $succes.appendChild(document.createTextNode(r.doublon ? ' : cette facture avait déjà été enregistrée (aucun doublon créé)' : ' enregistrée'));
      if (r.total !== undefined && r.total !== null) { $succes.appendChild(document.createTextNode(' — total ' + w.fmtArgent(r.total))); }
      $succes.appendChild(document.createTextNode('. '));
      var b = el('a', 'alert-link', 'Voir la facture');
      b.href = lienFacture(r.id);
      $succes.appendChild(b);
      montrer($succes, true);
      try { $succes.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
    }

    function majResume(lignes) {
      $resume.textContent = lignes.length ? (lignes.length + (lignes.length > 1 ? ' lignes' : ' ligne')) : '';
    }

    // ---- aperçu au coût (lecture seule, calculé par le serveur) --------------------------------
    /** Ajoute au tableau du composant les colonnes « Coût unitaire (au coût) » et « Total » (en lecture seule). */
    function ajouterEntetes() {
      var htr = q('#lignes thead tr');
      if (!htr || q('.ie-col-cout', htr)) { return; }
      var fin = htr.lastElementChild;
      ['Coût unitaire (au coût)', 'Total'].forEach(function (t) {
        var th = el('th', 'nombre ie-col-cout', t);
        th.scope = 'col';
        htr.insertBefore(th, fin);
      });
    }

    function assurerCellules() {
      qa('#lignes tbody tr').forEach(function (tr) {
        if (q('.ie-cout', tr)) { return; }
        var fin = tr.lastElementChild;
        var c1 = el('td', 'nombre ie-cout ie-attente', '…');
        var c2 = el('td', 'nombre ie-total-ligne ie-attente', '…');
        tr.insertBefore(c1, fin);
        tr.insertBefore(c2, fin);
      });
    }

    function effacerApercu() {
      qa('#lignes tbody tr').forEach(function (tr) {
        tr.classList.remove('ie-ligne-sans-cout');
        var c1 = q('.ie-cout', tr), c2 = q('.ie-total-ligne', tr);
        if (c1) { c1.textContent = '…'; c1.className = 'nombre ie-cout ie-attente'; }
        if (c2) { c2.textContent = '…'; c2.className = 'nombre ie-total-ligne ie-attente'; }
      });
    }

    function reinitialiserApercu() {
      apercu.sansCout = [];
      apercu.pret = false;
      $total.textContent = '';
      $avert.textContent = '';
      montrer($avert, false);
      montrer($zeroBloc, false);
      $zero.checked = false;
    }

    function ajouterAvis(titre, texte) {
      var d = el('div');
      d.appendChild(el('strong', null, titre + ' : '));
      d.appendChild(document.createTextNode(texte));
      $avert.appendChild(d);
    }

    function appliquerApercu(r) {
      var parCode = {};
      (r.lignes || []).forEach(function (l) { if (l.code) { parCode[l.code] = l; } });
      qa('#lignes tbody tr').forEach(function (tr) {
        var code = tr.cells[0] ? tr.cells[0].textContent : '';
        var c1 = q('.ie-cout', tr), c2 = q('.ie-total-ligne', tr);
        if (!c1 || !c2) { return; }
        var l = parCode[code];
        tr.classList.remove('ie-ligne-sans-cout');
        c1.className = 'nombre ie-cout'; c2.className = 'nombre ie-total-ligne';
        c1.textContent = ''; c2.textContent = '';
        if (!l || l.erreur) { c1.textContent = '—'; c2.textContent = '—'; return; }
        if (l.sans_cout) {
          tr.classList.add('ie-ligne-sans-cout');
          c1.appendChild(el('span', 'badge badge-sans-cout', 'Sans coût'));
        } else {
          c1.textContent = w.fmtArgent(l.cout_unitaire, 4);
        }
        c2.textContent = w.fmtArgent(l.total_ligne);
      });

      var sans = (r.lignes || []).filter(function (l) { return !l.erreur && l.sans_cout; });
      var insuf = (r.lignes || []).filter(function (l) { return !l.erreur && l.insuffisant; });
      var erreurs = (r.lignes || []).filter(function (l) { return !!l.erreur; });
      var s = parId($emp.value);
      var nomEmetteur = s ? s.entreprise_nom : 'l\'entreprise émettrice';
      apercu.sansCout = sans.map(function (l) { return l.code; });
      apercu.pret = true;

      $avert.textContent = '';
      if (sans.length) {
        ajouterAvis('Coût inconnu', sans.map(function (l) { return '« ' + l.code + ' »'; }).join(', ') + (sans.length > 1 ? ' n\'ont' : ' n\'a') +
          ' aucun coût connu chez ' + nomEmetteur + '. Faites d\'abord une réception (ou un ajustement avec coût), ou cochez « Facturer les pièces sans coût à 0 $ ».');
      }
      if (insuf.length) {
        ajouterAvis('Stock insuffisant', insuf.map(function (l) { return '« ' + l.code + ' » (disponible ' + w.fmtQte(l.disponible) + ', demandé ' + w.fmtQte(l.quantite) + ')'; }).join(', ') +
          ' : l\'enregistrement sera refusé.');
      }
      if (erreurs.length) {
        ajouterAvis('Ligne à corriger', erreurs.map(function (l) { return (l.code ? '« ' + l.code + ' » : ' : '') + l.erreur; }).join(' '));
      }
      montrer($avert, !!(sans.length || insuf.length || erreurs.length));
      montrer($zeroBloc, sans.length > 0);
      if (!sans.length) { $zero.checked = false; }

      var texte = 'Total de la facture (au coût) : ' + w.fmtArgent(r.total);
      if (sans.length) { texte += ' — dont ' + sans.length + (sans.length > 1 ? ' pièces sans coût comptées à 0,00 $' : ' pièce sans coût comptée à 0,00 $'); }
      $total.textContent = (r.lignes || []).length ? texte : '';
    }

    function apercuIndisponible(err) {
      apercu.pret = false;
      apercu.sansCout = [];
      effacerApercu();
      $total.textContent = '';
      $avert.textContent = '';
      ajouterAvis('Aperçu indisponible', msg(err) + ' Le serveur revérifiera tout à l\'enregistrement.');
      montrer($avert, true);
      montrer($zeroBloc, false);
    }

    function programmerApercu(lignes) {
      apercu.seq++;
      var mon = apercu.seq;
      clearTimeout(apercu.minuteur);
      apercu.minuteur = null;
      apercu.lancer = null;
      apercu.pret = false;
      if (!$emp.value || !lignes.length) {
        reinitialiserApercu();
        if (lignes.length) {      // des pièces, mais pas encore de source : le coût est celui de l'entreprise émettrice
          qa('#lignes td.ie-cout, #lignes td.ie-total-ligne').forEach(function (c) { c.textContent = '—'; c.className = c.className.replace(/\s*ie-attente/, ''); });
          $total.textContent = 'Choisissez l\'emplacement source pour calculer les coûts.';
        }
        return;
      }
      qa('#lignes td.ie-cout, #lignes td.ie-total-ligne').forEach(function (c) { c.classList.add('ie-attente'); });   // valeurs périmées : estompées en attendant
      apercu.lancer = function () {
        apercu.minuteur = null;
        apercu.promesse = w.api.post('app/ajax/facture_apercu.php', { emplacement_id: parseInt($emp.value, 10), lignes: lignes })
          .then(function (r) { if (mon === apercu.seq) { appliquerApercu(r); } })
          .catch(function (err) { if (mon === apercu.seq) { apercuIndisponible(err); } });
      };
      apercu.minuteur = setTimeout(apercu.lancer, 250);
    }

    function surChangementLignes(lignes) {
      assurerCellules();
      majResume(lignes);
      programmerApercu(lignes);
    }

    // ---- validation et envoi ----------------------------------------------------------------------
    function validerBase() {
      if (!$emp.value) { return { m: 'Choisissez l\'emplacement source.', champ: 'emplacement_id' }; }
      if (!$ent.value) { return { m: 'Choisissez l\'entreprise destinataire.', champ: 'entreprise_dest_id' }; }
      if (!$dest.value) { return { m: 'Choisissez l\'emplacement de destination.', champ: 'emplacement_dest_id' }; }
      if (!$date.value) { return { m: 'Entrez une date valide.', champ: 'date' }; }
      if ($date.value > aujourdhui()) { return { m: 'La date ne peut pas être dans le futur.', champ: 'date' }; }
      var e = sl.valider();
      if (e) { return { m: e, champ: 'lignes' }; }
      if (sl.compter() > 300) { return { m: 'Trop de lignes (maximum 300). Enregistrez-les en plusieurs factures.', champ: 'lignes' }; }
      return null;
    }

    function validerApercu() {
      if (apercu.sansCout.length && !$zero.checked) {
        return {
          m: 'Certaines pièces n\'ont aucun coût connu : ' + apercu.sansCout.map(function (c) { return '« ' + c + ' »'; }).join(', ') +
            '. Cochez « Facturer les pièces sans coût à 0 $ » pour les facturer à 0 $, ou faites d\'abord une réception.',
          champ: 'lignes'
        };
      }
      return null;
    }

    function charge() {
      return {
        jeton: jeton, emplacement_id: parseInt($emp.value, 10), entreprise_dest_id: parseInt($ent.value, 10),
        emplacement_dest_id: parseInt($dest.value, 10), date: $date.value, note: $note.value,
        permettre_cout_zero: !!($zero.checked && apercu.sansCout.length), lignes: sl.lignes()
      };
    }

    function remiseAZero() {
      sl.vider();
      $note.value = '';
      $zero.checked = false;
      $date.value = aujourdhui();
      jeton = nouveauJeton();
      effacerErreur();
      sl.focus();
    }

    function occupe(oui) {
      enCours = oui;
      $btn.disabled = oui;
      var s = q('span', $btn), i = q('i', $btn);
      if (oui) { $btn.setAttribute('data-libelle', s.textContent); s.textContent = 'Enregistrement…'; i.className = 'fas fa-spinner fa-spin mr-1'; }
      else if ($btn.hasAttribute('data-libelle')) { s.textContent = $btn.getAttribute('data-libelle'); i.className = 'fas fa-check mr-1'; }
    }

    function enregistrer() {
      if (enCours) { return; }                         // double clic : un seul envoi
      occupe(true);
      effacerErreur();
      montrer($succes, false);
      var e = validerBase();
      if (e) { occupe(false); afficherErreur(e.m, e.champ); if (e.champ === 'lignes') { sl.focus(); } return; }
      if (apercu.minuteur && apercu.lancer) { clearTimeout(apercu.minuteur); apercu.lancer(); }   // aperçu en attente : on le fait tout de suite
      apercu.promesse.then(function () {
        var e2 = validerApercu();
        if (e2) { afficherErreur(e2.m, e2.champ); sl.focus(); return; }
        return w.api.post('app/action/facture_save.php', charge())
          .then(function (r) {
            w.bip(true);
            afficherSucces(r);
            remiseAZero();
          })
          .catch(function (err) {
            afficherErreur(msg(err), err.champ);
            if (/aucun coût connu/.test(String(err.message || '')) && sl.compter()) { programmerApercu(sl.lignes()); }   // révèle la case « à 0 $ »
          });
      }).then(function () { occupe(false); });
    }

    // ---- démarrage ----------------------------------------------------------------------------------
    sl = w.SaisieLignes.creer({
      conteneur: '#lignes', scan: '#scan', recherche: '#recherche',
      coutColonne: false,
      emplacementSource: function () { return $emp.value || null; },
      onEmplacement: emplacementScanne,
      onChange: surChangementLignes,
      vide: 'Scannez une pièce ou cherchez-la ci-dessus.'
    });
    ajouterEntetes();

    // Messages plus justes pour un code d'emplacement (EMP-…) inconnu ou d'une entreprise à laquelle on n'a pas accès.
    // Le composant appelle toujours api.ajouterParCode : on l'enveloppe ici, sans toucher au composant.
    var ajouterParCode = sl.ajouterParCode;
    sl.ajouterParCode = function (code) {
      return ajouterParCode(code).catch(function (err) {
        if (/^EMP-/i.test(String(code).trim()) && /^Code inconnu/.test(err.message || '')) {
          throw new Error('Emplacement inconnu, ou d\'une entreprise à laquelle vous n\'avez pas accès : « ' + String(code).trim() + ' ». Choisissez la destination dans la liste.');
        }
        throw err;
      });
    };

    $emp.addEventListener('change', surChangementSource);
    $ent.addEventListener('change', function () { chargerDestinations(); effacerErreur(); });
    $dest.addEventListener('change', function () { if ($dest.value && $ent.value) { memoEcrire(CLE_DEST + $ent.value, $dest.value); } effacerErreur(); });
    [$date, $note, $zero].forEach(function (c) { c.addEventListener('input', effacerErreur); c.addEventListener('change', effacerErreur); });
    $btn.addEventListener('click', enregistrer);

    // Entrée dans une quantité : retour au champ de scan (enchaîne la saisie au scanner)
    var zone = q('#lignes');
    zone.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); sl.focus(); }
    });
    zone.addEventListener('focusin', function (ev) {
      if (ev.target.tagName === 'INPUT') { try { ev.target.select(); } catch (e) { /* sans effet */ } }
    });

    Promise.all([
      w.api.get('app/ajax/emplacements_liste.php'),
      w.api.get('app/ajax/emplacements_liste.php', { entreprises_destination: 1 })
    ]).then(function (res) {
      emplacements = (res[0].emplacements || []).map(function (e) { return { id: e.id, nom: e.nom, type: e.type, entreprise_id: e.entreprise_id, entreprise_nom: e.entreprise_nom }; });
      entreprises = (res[1].entreprises || []).map(function (e) { return { id: e.id, nom: e.nom }; });
      if (!emplacements.length) {
        $emp.innerHTML = '<option value="">Aucun emplacement disponible</option>';
        afficherErreur('Aucun emplacement actif n\'est disponible pour vous. Demandez à un administrateur d\'en créer un.', null);
        return;
      }
      var voulu = racine.getAttribute('data-emplacement-id') || memoLire(CLE_SRC) || '';
      remplirSources(voulu);
      if (!$emp.value && emplacements.length === 1) { $emp.value = String(emplacements[0].id); }   // un seul choix : on le prend
      surChangementSource();
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
  //  Liste des factures internes
  // ===================================================================================
  function initListe() {
    var $q = q('#f-recherche'), $an = q('#f-annee'), $mo = q('#f-mois'), $sens = q('#f-sens'), $st = q('#f-statut'), $tot = q('#ie-totaux');
    var seqTotaux = 0;

    function filtres() {
      return { q: $q.value.trim(), annee: $an.value, mois: $mo.value, sens: $sens.value, statut: $st.value };
    }

    var langue = $.extend({}, w.DT_LANG, {
      emptyTable: 'Aucune facture interne pour ces filtres.', zeroRecords: 'Aucune facture interne pour ces filtres.',
      infoEmpty: 'Aucune facture', info: '_START_ à _END_ de _TOTAL_ factures', infoFiltered: ''
    });
    var table = $('#table-factures').DataTable({
      serverSide: true, processing: true, searching: false, order: [],
      dom: "<'row'<'col-12'tr>><'row mt-2'<'col-sm-12 col-md-3'l><'col-sm-12 col-md-4'i><'col-sm-12 col-md-5'p>>",
      language: langue,
      ajax: {
        url: 'app/ajax/factures_internes_data.php', type: 'POST',
        data: function (d) { var f = filtres(); Object.keys(f).forEach(function (k) { d[k] = f[k]; }); }
      },
      columns: [
        { data: 'numero' },
        { data: 'date', orderSequence: ['desc', 'asc'] },
        { data: 'parties' },
        { data: 'emplacements' },
        { data: 'total', className: 'nombre', orderSequence: ['desc', 'asc'] },
        { data: 'statut' }
      ],
      createdRow: function (row, data) {
        if (String(data.statut).indexOf('badge-danger') !== -1) { row.classList.add('ie-ligne-annulee'); }
      }
    });

    function afficherTotaux(r) {
      $tot.textContent = '';
      if (!r.nb_valides && !r.nb_annulees) { $tot.textContent = 'Aucune facture pour ces filtres.'; return; }
      $tot.appendChild(el('strong', null, String(r.nb_valides)));
      $tot.appendChild(document.createTextNode((r.nb_valides > 1 ? ' factures valides' : ' facture valide') + ' · total au coût : '));
      var t = el('strong', null, w.fmtArgent(r.total));
      t.id = 'ie-totaux-montant';
      $tot.appendChild(t);
      if (r.nb_annulees) { $tot.appendChild(document.createTextNode(' · ' + r.nb_annulees + (r.nb_annulees > 1 ? ' annulées non comptées' : ' annulée non comptée'))); }
    }

    function chargerTotaux() {
      var mon = ++seqTotaux;
      w.api.post('app/ajax/factures_internes_totaux.php', filtres())
        .then(function (r) { if (mon === seqTotaux) { afficherTotaux(r); } })
        .catch(function (err) { if (mon === seqTotaux) { $tot.textContent = 'Totaux indisponibles : ' + msg(err); } });
    }
    table.on('xhr.dt', chargerTotaux);

    function redessiner() { table.draw(); }
    [$an, $mo, $sens, $st].forEach(function (c) { c.addEventListener('change', redessiner); });
    var minuteur = null;
    $q.addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(redessiner, 300); });
    q('#f-effacer').addEventListener('click', function () {
      $q.value = ''; $an.value = ''; $mo.value = ''; $sens.value = ''; $st.value = '';
      redessiner();
    });
    // Un clic n'importe où sur la ligne ouvre la facture (les liens gardent leur comportement)
    $('#table-factures tbody').on('click', 'tr', function (ev) {
      if ($(ev.target).closest('a,button,input,select').length) { return; }
      var a = this.querySelector('a');
      if (a) { w.location.href = a.getAttribute('href'); }
    }).on('mouseenter', 'tr', function () { if (this.querySelector('a')) { this.style.cursor = 'pointer'; } });
  }

  // ===================================================================================
  //  Facture imprimable : impression, annulation
  // ===================================================================================
  function initVoir() {
    var id = parseInt(racine.getAttribute('data-document-id'), 10);
    bouton_imprimer();

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
      w.api.post('app/action/facture_annuler.php', { id: id, motif: motif })
        .then(function () { w.location.href = lienFacture(id) + '&ok=annule'; })
        .catch(function (err) {
          erreur(msg(err));        // message du service tel quel (ex. : stock insuffisant à la destination)
          enCours = false; $ok.disabled = false; $retour.disabled = false;
          $ok.textContent = 'Annuler cette facture';
        });
    });
  }

  // ===================================================================================
  //  Bilan mensuel
  // ===================================================================================
  function initBilan() {
    var form = q('#form-bilan');
    if (form) { qa('select', form).forEach(function (s) { s.addEventListener('change', function () { form.submit(); }); }); }
    bouton_imprimer();
  }

  // ===================================================================================
  //  Valeur de l'inventaire
  // ===================================================================================
  function initValeur() {
    var carte = q('#detail-carte');
    if (!carte) { bouton_imprimer(); return; }
    var $titre = q('#detail-titre'), $etat = q('#detail-etat'), $contenu = q('#detail-contenu'), $total = q('#detail-total'), $nb = q('#detail-nb');
    var $csv = q('#detail-csv'), $fermer = q('#detail-fermer');
    var table = null, seq = 0;
    bouton_imprimer();

    function nombre(d) { var n = parseFloat(d); return isNaN(n) ? 0 : n; }
    function colonnes() {
      return [
        { data: 'code', render: function (d, t, row) { return t === 'display' ? '<a class="code" href="index.php?page=piece_voir&id=' + encodeURIComponent(String(row.piece_id)) + '">' + w.esc(d) + '</a>' : d; } },
        { data: 'nom', render: function (d, t) { return t === 'display' ? w.esc(d) : d; } },
        { data: 'categorie', render: function (d, t) { return t === 'display' ? (d === '' ? '<span class="text-muted">—</span>' : w.esc(d)) : d; } },
        { data: 'quantite', className: 'nombre', render: function (d, t, row) {
          if (t !== 'display') { return nombre(d); }
          return w.esc(w.fmtQte(d)) + ((row.unite && row.unite !== 'unité') ? ' <small class="text-muted">' + w.esc(row.unite) + '</small>' : '');
        } },
        { data: 'cout_moyen', className: 'nombre', render: function (d, t, row) {
          if (t !== 'display') { return nombre(d); }
          return row.sans_cout ? '<span class="badge badge-sans-cout">Sans coût</span>' : w.esc(w.fmtArgent(d, 4));
        } },
        { data: 'valeur', className: 'nombre', render: function (d, t) { return t === 'display' ? w.esc(w.fmtArgent(d)) : nombre(d); } }
      ];
    }

    function marquerActif(id) {
      qa('.ie-ligne-emplacement').forEach(function (tr) {
        if (String(tr.getAttribute('data-id')) === String(id)) { tr.classList.add('ie-actif'); } else { tr.classList.remove('ie-actif'); }
      });
    }

    function afficher(r) {
      var e = r.emplacement, lignes = r.lignes || [];
      $titre.textContent = 'Détail : ' + e.nom + ' (' + e.entreprise_nom + ')' + (e.actif ? '' : ' — emplacement désactivé');
      $csv.href = 'app/ajax/valeur_export.php?mode=pieces&emplacement_id=' + encodeURIComponent(String(e.id));
      montrer($csv, true);
      if (!lignes.length) {
        $etat.textContent = 'Aucune pièce en stock à cet emplacement.';
        montrer($etat, true); montrer($contenu, false);
        return;
      }
      montrer($etat, false); montrer($contenu, true);
      $total.textContent = w.fmtArgent(r.total);
      $nb.textContent = '— ' + lignes.length + (lignes.length > 1 ? ' pièces en stock' : ' pièce en stock');
      var donnees = lignes.map(function (l) { return { piece_id: l.piece_id, code: l.code, nom: l.nom, unite: l.unite, categorie: l.categorie || '', quantite: l.quantite, cout_moyen: l.cout_moyen, valeur: l.valeur, sans_cout: !!l.sans_cout }; });
      if (table) {
        table.clear().rows.add(donnees).draw();
      } else {
        table = $('#table-detail').DataTable({
          data: donnees, columns: colonnes(), order: [[0, 'asc']], pageLength: 25, autoWidth: false,
          language: $.extend({}, w.DT_LANG, { info: '_START_ à _END_ de _TOTAL_ pièces', infoFiltered: '(filtré sur _MAX_)', zeroRecords: 'Aucune pièce ne correspond.', emptyTable: 'Aucune pièce en stock.' })
        });
      }
    }

    function ouvrir(id) {
      var mon = ++seq;
      marquerActif(id);
      montrer(carte, true);
      $titre.textContent = 'Détail';
      $etat.textContent = 'Chargement…';
      montrer($etat, true); montrer($contenu, false); montrer($csv, false);
      try { carte.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ancien navigateur */ }
      w.api.get('app/ajax/valeur_detail.php', { emplacement_id: id })
        .then(function (r) { if (mon === seq) { afficher(r); } })
        .catch(function (err) { if (mon === seq) { $etat.textContent = 'Impossible de charger le détail : ' + msg(err); montrer($etat, true); montrer($contenu, false); } });
    }

    document.addEventListener('click', function (ev) {
      var tr = ev.target.closest ? ev.target.closest('.ie-ligne-emplacement') : null;
      if (!tr) { return; }
      if (ev.target.closest('a')) { return; }
      ouvrir(parseInt(tr.getAttribute('data-id'), 10));
    });
    $fermer.addEventListener('click', function () { seq++; montrer(carte, false); marquerActif(0); });

    var voulu = parseInt(racine.getAttribute('data-ouvrir'), 10);
    if (voulu > 0 && q('.ie-ligne-emplacement[data-id="' + voulu + '"]')) { ouvrir(voulu); }
  }

  // ===================================================================================
  $(function () {
    if (page === 'facture_interne') { initFacture(); }
    else if (page === 'factures_internes') { initListe(); }
    else if (page === 'facture_interne_voir') { initVoir(); }
    else if (page === 'bilan_mensuel') { initBilan(); }
    else if (page === 'valeur_inventaire') { initValeur(); }
  });
})(window, jQuery);
