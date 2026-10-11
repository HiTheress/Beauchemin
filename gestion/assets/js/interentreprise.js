/* Inter-entreprises et rapports (module C) : facture interne au coût, liste des factures, facture imprimable (annulation),
 * bilan mensuel, valeur de l'inventaire. Un seul fichier ; la page est reconnue par l'attribut data-ie de sa racine :
 *   facture_interne | factures_internes | facture_interne_voir | bilan_mensuel | valeur_inventaire
 * Règles : tout texte venant du serveur est inséré avec textContent ou esc() (jamais en HTML brut) ; les quantités et montants
 * restent des chaînes décimales (les nombres ne servent qu'à l'affichage et au tri) ; les coûts et totaux d'une facture sont
 * calculés par le serveur (aperçu en lecture seule), jamais saisis ; le bouton « Facturer » est désactivé pendant l'envoi et
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
  var NB = ' ';       // espace insécable : jamais de « ou » ou de $ seul en début de ligne
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  function el(tag, classe, texte) {
    var e = document.createElement(tag);
    if (classe) { e.className = classe; }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }
  /** « texte » avec les espaces insécables qu'exige la typographie française. */
  function guill(t) { return '«' + NB + t + NB + '»'; }
  /** Montant « 1 234,56 $ » avec espace insécable avant le $ (fmtArgent du noyau met une espace ordinaire). */
  function argent(s, dec) { return String(w.fmtArgent(s, dec)).replace(/\s\$$/, NB + '$'); }

  /** Libellés français supplémentaires de DataTables : séparateur de milliers et libellés d'accessibilité des en-têtes. */
  var LANG_PLUS = {
    thousands: NB,
    aria: { sortAscending: ' : activer pour trier en ordre croissant', sortDescending: ' : activer pour trier en ordre décroissant' }
  };

  /**
   * Message d'erreur affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »).
   * $contexte : 'enregistrement' (la facture a peut-être été enregistrée), 'annulation' ; sinon une lecture (rien n'a changé).
   */
  function msg(err, contexte) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed|^Connexion impossible/i.test(m)) {
      if (contexte === 'enregistrement') {
        return 'Connexion perdue : la facture n\'a peut-être pas été enregistrée. Vérifiez la liste des factures avant de recommencer.';
      }
      if (contexte === 'annulation') {
        return 'Connexion perdue : l\'annulation n\'a peut-être pas été enregistrée. Rechargez la page pour voir l\'état de la facture.';
      }
      return 'Connexion impossible. Vérifiez le réseau, puis réessayez.';
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

  // Titre de l'onglet (et nom du fichier proposé à l'impression en PDF) : propre à chaque page et à chaque facture
  var titreOnglet = racine.getAttribute('data-titre');
  if (titreOnglet) { document.title = titreOnglet; }

  // ===================================================================================
  //  Nouvelle facture : saisie
  // ===================================================================================
  function initFacture() {
    var $emp = q('#emplacement'), $dest = q('#destination'), $date = q('#date'), $note = q('#note');
    var $trajet = q('#ie-trajet'), $choix = q('#ie-trajet-choix'), $plus = q('#ie-plus'), $options = q('#ie-options');
    var $zeroBloc = q('#ie-zero-bloc'), $zero = q('#cout-zero'), $avert = q('#ie-avert'), $total = q('#ie-total');
    var $btn = q('#btn-enregistrer'), $err = q('#ie-erreur'), $succes = q('#ie-succes');
    var $scan = q('#scan');
    var CLE_TRAJET = 'bea.ie.facture.trajet', CLE_SRC = 'bea.ie.facture.source.', CLE_DEST = 'bea.ie.facture.destination.';
    var emplacements = [];       // emplacements actifs de mes entreprises (sources possibles)
    var entreprises = [];        // toutes les entreprises actives (destinataires possibles)
    var sources = [];            // entreprises de mes emplacements : {id, nom}
    var trajet = { src: '', dest: '' };      // « qui facture à qui » : ids d'entreprise (chaînes)
    var enCours = false;
    var jeton = nouveauJeton();
    var reqDest = 0;             // numéro de la dernière demande de la liste des destinations (ignore les réponses périmées)
    var apercu = { seq: 0, minuteur: null, lancer: null, promesse: Promise.resolve(), sansCout: [], pret: false };
    var consentement = {};       // codes des pièces sans coût que l'utilisateur a accepté de facturer à 0 $ (case cochée)
    var sl = null;

    // ---- Plus d'options : la date et la note restent repliées ---------------------------------------------------------------
    function ouvrirOptions(oui) {
      $options.hidden = !oui;
      $plus.setAttribute('aria-expanded', oui ? 'true' : 'false');
      var ic = q('i', $plus);
      if (ic) { ic.className = oui ? 'fas fa-chevron-down mv-plus-icone' : 'fas fa-chevron-right mv-plus-icone'; }
    }

    // ---- « qui facture à qui » : une grosse carte par couple (entreprise émettrice → entreprise destinataire) -------------
    function parId(id) {
      for (var i = 0; i < emplacements.length; i++) { if (String(emplacements[i].id) === String(id)) { return emplacements[i]; } }
      return null;
    }
    function autresEntreprises(idSrc) {
      return entreprises.filter(function (e) { return String(e.id) !== String(idSrc); });
    }
    function paireValide(src, dest) {
      return sources.some(function (s) { return String(s.id) === String(src); }) &&
        autresEntreprises(src).some(function (e) { return String(e.id) === String(dest); });
    }

    function dessinerTrajets() {
      $choix.textContent = '';
      var n = 0;
      sources.forEach(function (s) {
        autresEntreprises(s.id).forEach(function (d) {
          n++;
          var lab = el('label', 'ie-trajet-carte');
          var r = el('input', 'sr-only');
          r.type = 'radio'; r.name = 'trajet'; r.value = s.id + '>' + d.id;
          r.setAttribute('data-src', String(s.id)); r.setAttribute('data-dest', String(d.id));
          lab.appendChild(r);
          lab.appendChild(el('span', 'ie-trajet-nom', s.nom));
          var fl = el('i', 'fas fa-long-arrow-alt-right ie-trajet-fleche'); fl.setAttribute('aria-hidden', 'true');
          lab.appendChild(fl);
          lab.appendChild(el('span', 'ie-trajet-nom', d.nom));
          $choix.appendChild(lab);
        });
      });
      if (!n) { $choix.appendChild(el('span', 'text-muted', 'Aucune autre entreprise active.')); }
    }

    /** Coche la carte du trajet courant ; sans destination encore choisie, les cartes de la source sont seulement soulignées. */
    function marquerTrajet() {
      qa('.ie-trajet-carte', $choix).forEach(function (lab) {
        var r = q('input', lab);
        var choisie = r.getAttribute('data-src') === trajet.src && r.getAttribute('data-dest') === trajet.dest;
        r.checked = choisie;
        lab.classList.toggle('ie-choisie', choisie);
        lab.classList.toggle('ie-suggere', !choisie && !trajet.dest && trajet.src !== '' && r.getAttribute('data-src') === trajet.src);
      });
      $trajet.classList.remove('is-invalid');
    }

    // ---- listes d'emplacements ------------------------------------------------------------------
    /** Emplacements de l'entreprise émettrice choisie (textContent : aucun HTML issu du serveur). */
    function remplirSources(valeur) {
      $emp.innerHTML = '';
      var liste = emplacements.filter(function (e) { return String(e.entreprise_id) === trajet.src; });
      var o = el('option', null, liste.length ? '— Choisissez —' : '—'); o.value = '';
      $emp.appendChild(o);
      liste.forEach(function (e) {
        var op = el('option', null, e.nom);
        op.value = String(e.id);
        $emp.appendChild(op);
      });
      $emp.disabled = !liste.length;
      if (valeur && liste.some(function (e) { return String(e.id) === String(valeur); })) { $emp.value = String(valeur); }
      else if (liste.length === 1) { $emp.value = String(liste[0].id); }      // un seul choix : on le prend
    }

    function remplirDestinations(liste, vide, valeur) {
      $dest.innerHTML = '';
      var o = el('option', null, vide); o.value = '';
      $dest.appendChild(o);
      liste.forEach(function (e) {
        var op = el('option', null, e.nom);
        op.value = String(e.id);
        $dest.appendChild(op);
      });
      $dest.disabled = !liste.length;
      if (valeur && liste.some(function (e) { return String(e.id) === String(valeur); })) { $dest.value = String(valeur); }
      else if (liste.length === 1) { $dest.value = String(liste[0].id); }
    }

    /** Emplacements actifs de l'entreprise destinataire choisie (voulu : emplacement à présélectionner). */
    function chargerDestinations(voulu) {
      var id = trajet.dest;
      var mon = ++reqDest;
      if (!id) {
        remplirDestinations([], '—', '');
        return Promise.resolve();
      }
      $dest.disabled = true;
      $dest.innerHTML = '<option value="">Chargement…</option>';
      return w.api.get('app/ajax/emplacements_liste.php', { destination_entreprise: id }).then(function (r) {
        if (mon !== reqDest) { return; }
        var liste = r.emplacements || [];
        remplirDestinations(liste, liste.length ? '— Choisissez —' : 'Aucun emplacement actif', voulu || memoLire(CLE_DEST + id));
      }).catch(function (err) {
        if (mon !== reqDest) { return; }
        $dest.innerHTML = '<option value="">Liste indisponible</option>';
        afficherErreur('Impossible de charger les emplacements de destination : ' + msg(err), null);
      });
    }

    /** Choisit « qui facture à qui » (dest peut rester vide) ; retourne la promesse du chargement des destinations. */
    function choisirTrajet(src, dest, destVoulue) {
      src = String(src || ''); dest = String(dest || '');
      var autreSource = (src !== trajet.src), autreDest = (dest !== trajet.dest);
      trajet.src = src; trajet.dest = dest;
      marquerTrajet();
      if (src && dest) { memoEcrire(CLE_TRAJET, src + '>' + dest); }
      if (autreSource) {
        remplirSources(src ? memoLire(CLE_SRC + src) : '');
        if (sl) { sl.rafraichir(); }        // « Disponible » et aperçu des coûts de la nouvelle source
      }
      return (autreDest || destVoulue) ? chargerDestinations(destVoulue) : Promise.resolve();
    }

    function surChangementSource() {
      if ($emp.value && trajet.src) { memoEcrire(CLE_SRC + trajet.src, $emp.value); }
      if (sl) { sl.rafraichir(); }
      effacerErreur();
    }

    // ---- scan d'un emplacement ---------------------------------------------------------
    /**
     * Un code EMP-… a été scanné. Une entreprise émettrice est déjà choisie : un emplacement de cette entreprise est la source, celui
     * d'une autre entreprise est la destination. Rien n'est choisi : un emplacement à moi fixe l'émettrice (et le destinataire s'il n'y a
     * qu'un autre choix). Une entreprise à laquelle je n'ai pas accès ne peut être que la destination (résolue par facture_emplacement_code.php).
     */
    function emplacementScanne(emp) {
      var ent = String(emp.entreprise_id);
      if (trajet.src && ent !== trajet.src) {
        if (!entreprises.some(function (e) { return String(e.id) === ent; })) {
          throw new Error('L\'entreprise de ' + guill(emp.nom) + ' ne peut pas recevoir de facture.');
        }
        return choisirTrajet(trajet.src, ent, String(emp.id)).then(function () {
          if ($dest.value !== String(emp.id)) { throw new Error('L\'emplacement ' + guill(emp.nom) + ' est désactivé : choisissez où mettre les pièces dans la liste.'); }
          memoEcrire(CLE_DEST + ent, String(emp.id));
          effacerErreur();
          w.toast('Destination : ' + emp.nom + ' (' + (emp.entreprise_nom || '') + ')', 'info');
        });
      }
      if (!trajet.src && !parId(emp.id)) {
        throw new Error('Choisissez d\'abord qui facture à qui, puis scannez l\'emplacement où mettre les pièces.');
      }
      var e = parId(emp.id);
      if (!e) { throw new Error('L\'emplacement ' + guill(emp.nom) + ' est désactivé ou n\'est pas disponible.'); }
      if (!trajet.src) {
        var autres = autresEntreprises(ent);
        choisirTrajet(ent, autres.length === 1 ? autres[0].id : '');
      }
      $emp.value = String(e.id);
      surChangementSource();
      w.toast('Source : ' + e.nom + ' (' + e.entreprise_nom + ')', 'info');
    }

    // ---- messages ------------------------------------------------------------------------
    var champsFautifs = { emplacement_id: $emp, entreprise_dest_id: $trajet, emplacement_dest_id: $dest, date: $date, note: $note };

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
      if (f && $options.contains(f)) { ouvrirOptions(true); }       // la date ou la note fautive doit se voir
      try { $err.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
      w.toast(texte, 'danger');
      w.bip(false);
    }

    function afficherSucces(r) {
      $succes.textContent = '';
      var ic = el('i', 'fas fa-check-circle mr-1');
      ic.setAttribute('aria-hidden', 'true');
      $succes.appendChild(ic);
      $succes.appendChild(document.createTextNode('Facture '));
      var a = el('a', null, r.numero);
      a.href = lienFacture(r.id);
      $succes.appendChild(a);
      $succes.appendChild(document.createTextNode(r.doublon ? ' déjà enregistrée (aucun doublon)' : ' enregistrée'));
      if (r.total !== undefined && r.total !== null) { $succes.appendChild(document.createTextNode(' : ' + argent(r.total))); }
      montrer($succes, true);
      try { $succes.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
    }

    // ---- aperçu au coût (lecture seule, calculé par le serveur) --------------------------------
    /** Ajoute au tableau du composant les colonnes « Coût unitaire » et « Total » (en lecture seule) et un titre pour les lecteurs d'écran. */
    function ajouterEntetes() {
      var htr = q('#lignes thead tr');
      if (!htr || q('.ie-col-cout', htr)) { return; }
      var fin = htr.lastElementChild;
      ['Coût unitaire', 'Total'].forEach(function (t) {
        var th = el('th', 'nombre ie-col-cout', t);
        th.scope = 'col';
        htr.insertBefore(th, fin);
      });
      var table = q('#lignes table');
      if (table && !table.caption) {
        var cap = el('caption', 'sr-only', 'Pièces de la facture interne : quantité à facturer et coût calculé automatiquement');
        table.insertBefore(cap, table.firstChild);
      }
    }

    /** Indice (0, 1, 2…) de la colonne « Disponible » du composant, ou -1. */
    function indiceDisponible() {
      var ths = qa('#lignes thead th');
      for (var i = 0; i < ths.length; i++) { if (ths[i].textContent === 'Disponible') { return i; } }
      return -1;
    }

    function assurerCellules() {
      qa('#lignes tbody tr').forEach(function (tr) {
        if (q('.ie-cout', tr)) { return; }
        var fin = tr.lastElementChild;
        var c1 = el('td', 'nombre ie-cout mv-c-cout ie-attente', '…');
        var c2 = el('td', 'nombre ie-total-ligne mv-c-total ie-attente', '…');
        c1.setAttribute('data-label', 'Coût unitaire'); c2.setAttribute('data-label', 'Total');
        tr.insertBefore(c1, fin);
        tr.insertBefore(c2, fin);
      });
    }

    function effacerApercu() {
      qa('#lignes tbody tr').forEach(function (tr) {
        tr.classList.remove('ie-ligne-sans-cout');
        var c1 = q('.ie-cout', tr), c2 = q('.ie-total-ligne', tr);
        if (c1) { c1.textContent = '…'; c1.className = 'nombre ie-cout mv-c-cout ie-attente'; }
        if (c2) { c2.textContent = '…'; c2.className = 'nombre ie-total-ligne mv-c-total ie-attente'; }
      });
    }

    /**
     * Plus d'aperçu (aucune ligne, pas de source, ou ligne vidée le temps de retaper la quantité) : on cache les avis,
     * mais on NE décoche PAS la case « à 0 $ » : le choix de l'utilisateur est conservé (voir « consentement »).
     */
    function reinitialiserApercu() {
      apercu.sansCout = [];
      apercu.pret = false;
      $total.textContent = '';
      $avert.textContent = '';
      montrer($avert, false);
      montrer($zeroBloc, false);
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
      var ci = indiceDisponible();
      qa('#lignes tbody tr').forEach(function (tr) {
        var code = tr.cells[0] ? tr.cells[0].textContent : '';
        var c1 = q('.ie-cout', tr), c2 = q('.ie-total-ligne', tr);
        if (!c1 || !c2) { return; }
        var l = parCode[code];
        // « Disponible » : la valeur à jour de la source (le composant ne connaît que celle du moment du scan)
        if (l && ci >= 0 && tr.cells[ci]) {
          tr.cells[ci].textContent = w.fmtQte(l.disponible);
          tr.cells[ci].className = 'nombre' + (l.insuffisant ? ' text-danger font-weight-bold' : '');
        }
        tr.classList.remove('ie-ligne-sans-cout');
        c1.className = 'nombre ie-cout mv-c-cout'; c2.className = 'nombre ie-total-ligne mv-c-total';
        c1.textContent = ''; c2.textContent = '';
        if (!l || l.erreur) { c1.textContent = '—'; c2.textContent = '—'; return; }
        if (l.sans_cout) {
          tr.classList.add('ie-ligne-sans-cout');
          c1.appendChild(el('span', 'badge badge-sans-cout', 'Sans coût'));
        } else {
          c1.textContent = argent(l.cout_unitaire, 4);
        }
        c2.textContent = argent(l.total_ligne);
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
        ajouterAvis('Coût inconnu', sans.map(function (l) { return guill(l.code); }).join(', ') + (sans.length > 1 ? ' n\'ont' : ' n\'a') +
          ' aucun coût connu chez ' + nomEmetteur + '. Faites d\'abord une réception, ou cochez ' + guill('Facturer les pièces sans coût à 0' + NB + '$') + '.');
      }
      if (insuf.length) {
        ajouterAvis('Stock insuffisant', insuf.map(function (l) { return guill(l.code) + ' (disponible ' + w.fmtQte(l.disponible) + ', demandé ' + w.fmtQte(l.quantite) + ')'; }).join(', ') + '.');
      }
      if (erreurs.length) {
        ajouterAvis('Ligne à corriger', erreurs.map(function (l) { return (l.code ? guill(l.code) + ' : ' : '') + l.erreur; }).join(' '));
      }
      montrer($avert, !!(sans.length || insuf.length || erreurs.length));
      montrer($zeroBloc, sans.length > 0);
      // Une pièce sans coût que l'utilisateur n'a pas déjà acceptée de facturer à 0 $ remet la case à « décochée »
      if (sans.some(function (l) { return !consentement[l.code]; })) { $zero.checked = false; }

      var texte = 'Total : ' + argent(r.total);
      if (sans.length) { texte += ' · ' + sans.length + (sans.length > 1 ? ' pièces sans coût' : ' pièce sans coût'); }
      $total.textContent = (r.lignes || []).length ? texte : '';
    }

    function apercuIndisponible(err) {
      apercu.pret = false;
      apercu.sansCout = [];
      effacerApercu();
      $total.textContent = '';
      $avert.textContent = '';
      ajouterAvis('Aperçu indisponible', msg(err) + ' Les coûts seront vérifiés à l\'enregistrement.');
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
          $total.textContent = 'Choisissez où prendre les pièces.';
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
      programmerApercu(lignes);
    }

    // ---- validation et envoi ----------------------------------------------------------------------------
    /** Une quantité doit être un nombre décimal simple (« 2 », « 1,5 », « 0.25 ») : « 12abc », « 1e1 » ou « 1,5,2 » sont refusés. */
    function verifierQuantites() {
      var rows = qa('#lignes tbody tr');
      for (var i = 0; i < rows.length; i++) {
        var inp = q('input', rows[i]);
        if (!inp) { continue; }
        var v = inp.value.replace(/[\s ]/g, '');
        if (!/^(\d+([.,]\d+)?|[.,]\d+)$/.test(v)) {
          return 'Quantité invalide pour ' + guill(rows[i].cells[0].textContent) + '.';
        }
      }
      return null;
    }

    function validerBase() {
      if (!trajet.src || !trajet.dest) { return { m: 'Choisissez qui facture à qui.', champ: 'entreprise_dest_id' }; }
      if (!$emp.value) { return { m: 'Choisissez où prendre les pièces.', champ: 'emplacement_id' }; }
      if (!$dest.value) { return { m: 'Choisissez où mettre les pièces.', champ: 'emplacement_dest_id' }; }
      if (!$date.value) { return { m: 'Entrez une date valide.', champ: 'date' }; }
      if ($date.value > aujourdhui()) { return { m: 'La date ne peut pas être dans le futur.', champ: 'date' }; }
      if ($date.value < '2000-01-01') { return { m: 'La date doit être le 1er janvier 2000 ou plus récente.', champ: 'date' }; }
      var e = verifierQuantites() || sl.valider();
      if (e) { return { m: e, champ: 'lignes' }; }
      if (sl.compter() > 300) { return { m: 'Trop de lignes (maximum 300). Enregistrez-les en plusieurs factures.', champ: 'lignes' }; }
      return null;
    }

    function validerApercu() {
      if (apercu.sansCout.length && !$zero.checked) {
        return {
          m: 'Certaines pièces n\'ont aucun coût connu : ' + apercu.sansCout.map(guill).join(', ') +
            '. Cochez ' + guill('Facturer les pièces sans coût à 0' + NB + '$') + ' pour les facturer à 0' + NB + '$, ou faites d\'abord une réception.',
          champ: 'lignes'
        };
      }
      return null;
    }

    function charge() {
      return {
        jeton: jeton, emplacement_id: parseInt($emp.value, 10), entreprise_dest_id: parseInt(trajet.dest, 10),
        emplacement_dest_id: parseInt($dest.value, 10), date: $date.value, note: $note.value,
        permettre_cout_zero: !!($zero.checked && apercu.sansCout.length), lignes: sl.lignes()
      };
    }

    function remiseAZero() {
      sl.vider();
      $note.value = '';
      $zero.checked = false;
      consentement = {};
      $date.value = aujourdhui();
      ouvrirOptions(false);
      jeton = nouveauJeton();
      effacerErreur();
      sl.focus();
    }

    /**
     * Bouton « Facturer » pendant l'envoi : aria-disabled (et non disabled) pour que le bouton GARDE le focus ;
     * l'indicateur « enCours » bloque le double clic. Un bouton désactivé qui a le focus le perdrait (focus sur BODY : le scan suivant serait perdu).
     */
    function occupe(oui) {
      enCours = oui;
      $btn.setAttribute('aria-disabled', oui ? 'true' : 'false');
      $btn.classList.toggle('disabled', !!oui);
      var s = q('span', $btn), i = q('i', $btn);
      if (oui) { $btn.setAttribute('data-libelle', s.textContent); s.textContent = 'Facturation…'; i.className = 'fas fa-spinner fa-spin mr-1'; }
      else if ($btn.hasAttribute('data-libelle')) { s.textContent = $btn.getAttribute('data-libelle'); i.className = 'fas fa-check mr-1'; }
    }

    function enregistrer() {
      if (enCours) { return; }                         // double clic : un seul envoi
      occupe(true);
      effacerErreur();
      montrer($succes, false);
      var e = validerBase();
      if (e) { occupe(false); afficherErreur(e.m, e.champ); sl.focus(); return; }
      if (apercu.minuteur && apercu.lancer) { clearTimeout(apercu.minuteur); apercu.lancer(); }   // aperçu en attente : on le fait tout de suite
      apercu.promesse.then(function () {
        var e2 = validerApercu();
        if (e2) { afficherErreur(e2.m, e2.champ); return; }
        return w.api.post('app/action/facture_save.php', charge())
          .then(function (r) {
            w.bip(true);
            afficherSucces(r);
            remiseAZero();
          })
          .catch(function (err) {
            afficherErreur(msg(err, 'enregistrement'), err.champ);
            if (/aucun coût connu/.test(String(err.message || '')) && sl.compter()) { programmerApercu(sl.lignes()); }   // révèle la case « à 0 $ »
          });
      }).then(function () { occupe(false); sl.focus(); });     // le curseur revient toujours au champ de scan
    }

    // ---- démarrage ----------------------------------------------------------------------------------
    sl = w.SaisieLignes.creer({
      conteneur: '#lignes', scan: '#scan', suggestions: true, stepper: true,
      coutColonne: false,
      emplacementSource: function () { return $emp.value || null; },
      onEmplacement: function (emp) {          // le composant n'attend pas la promesse : une erreur tardive doit se voir
        var r = emplacementScanne(emp);
        if (r && r.catch) { r.catch(function (err) { w.bip(false); w.toast(msg(err), 'danger'); }); }
      },
      onChange: surChangementLignes,
      vide: 'Aucune pièce.'
    });
    ajouterEntetes();

    // Code d'emplacement (EMP-…) que le composant ne reconnaît pas (scan_code ne connaît que MES entreprises) : on cherche une
    // destination dans une autre entreprise ; sinon, message clair. Le composant appelle toujours api.ajouterParCode : on l'enveloppe ici.
    var ajouterParCode = sl.ajouterParCode;
    sl.ajouterParCode = function (code) {
      var c = String(code).trim();
      return ajouterParCode(c).catch(function (err) {
        if (/^EMP-/i.test(c) && /^Code inconnu/.test(err.message || '')) {
          return w.api.get('app/ajax/facture_emplacement_code.php', { code: c }).then(function (r) {
            if (!r.trouve) {
              throw new Error('Emplacement inconnu ou désactivé : ' + guill(c) + '.');
            }
            return emplacementScanne(r.emplacement);
          });
        }
        throw err;
      });
    };

    $emp.addEventListener('change', surChangementSource);
    $dest.addEventListener('change', function () { if ($dest.value && trajet.dest) { memoEcrire(CLE_DEST + trajet.dest, $dest.value); } effacerErreur(); });
    $choix.addEventListener('change', function (ev) {
      var r = ev.target;
      if (!r || r.name !== 'trajet') { return; }
      choisirTrajet(r.getAttribute('data-src'), r.getAttribute('data-dest'));
      effacerErreur();
    });
    [$date, $note].forEach(function (c) { c.addEventListener('input', effacerErreur); c.addEventListener('change', effacerErreur); });
    $zero.addEventListener('change', function () {
      consentement = {};
      if ($zero.checked) { apercu.sansCout.forEach(function (code) { consentement[code] = true; }); }
      effacerErreur();
    });
    $btn.addEventListener('click', enregistrer);
    $plus.addEventListener('click', function () { ouvrirOptions($options.hidden); });

    // Après un choix fait À LA SOURIS dans une liste ou parmi les cartes, le curseur revient au champ de scan (le prochain code scanné n'est pas avalé par la liste).
    // Au clavier on ne bouge pas : chaque flèche d'une liste fermée déclenche « change », et l'utilisateur doit pouvoir continuer.
    // (Une frappe de lecteur tombée sur une liste est de toute façon redirigée vers le champ de scan par app.js.)
    [$emp, $dest, $choix].forEach(function (c) {
      var pointeur = false;
      c.addEventListener('pointerdown', function () { pointeur = true; });
      c.addEventListener('keydown', function () { pointeur = false; });
      c.addEventListener('blur', function () { pointeur = false; }, true);
      c.addEventListener('change', function () { if (pointeur) { pointeur = false; setTimeout(function () { sl.focus(); }, 0); } });
    });

    // Champ date : un lecteur qui « tape » dans le champ date (focus resté là) changerait l'année. Entrée ou une lettre renvoie au champ
    // de scan ; une rafale de chiffres (code numérique : plus vite qu'une main) restaure la date et reporte le code dans le champ de scan.
    (function () {
      var avant = $date.value, dernier = 0, premier = '';
      $date.addEventListener('focus', function () { avant = $date.value; premier = ''; });
      $date.addEventListener('keydown', function (ev) {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || !ev.key) { return; }
        if (ev.key === 'Enter') { ev.preventDefault(); sl.focus(); return; }
        if (ev.key.length !== 1) { return; }
        if (!/[0-9]/.test(ev.key)) {
          if (/[\/\-.]/.test(ev.key)) { return; }
          sl.focus();                                       // lettre ou symbole : ce n'est pas une saisie de date
          return;
        }
        var t = Date.now();
        if (premier !== '' && t - dernier < 40) {           // deux chiffres à moins de 40 ms : c'est le lecteur
          $date.value = avant;
          $scan.value = premier;
          premier = '';
          sl.focus();
        } else {
          premier = ev.key;
        }
        dernier = t;
      });
    })();

    // Entrée dans une quantité : retour au champ de scan (enchaîne la saisie au scanner)
    var zone = q('#lignes');
    zone.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); sl.focus(); }
    });
    zone.addEventListener('focusin', function (ev) {
      if (ev.target.tagName === 'INPUT') { try { ev.target.select(); } catch (e) { /* sans effet */ } }
    });

    /** Trajet de départ : l'emplacement de l'adresse, sinon le dernier trajet utilisé, sinon l'unique trajet possible. */
    function trajetInitial() {
      var voulu = parId(racine.getAttribute('data-emplacement-id') || '');
      var memo = (memoLire(CLE_TRAJET) || '').split('>');
      if (voulu) {
        var src = String(voulu.entreprise_id), autres = autresEntreprises(src);
        var dest = autres.length === 1 ? String(autres[0].id) : (memo[0] === src && paireValide(src, memo[1]) ? memo[1] : '');
        choisirTrajet(src, dest);
        $emp.value = String(voulu.id);
        surChangementSource();
        return;
      }
      if (memo.length === 2 && paireValide(memo[0], memo[1])) { choisirTrajet(memo[0], memo[1]); return; }
      var paires = [];
      sources.forEach(function (s) { autresEntreprises(s.id).forEach(function (d) { paires.push([String(s.id), String(d.id)]); }); });
      if (paires.length === 1) { choisirTrajet(paires[0][0], paires[0][1]); }
    }

    Promise.all([
      w.api.get('app/ajax/emplacements_liste.php'),
      w.api.get('app/ajax/emplacements_liste.php', { entreprises_destination: 1 })
    ]).then(function (res) {
      emplacements = (res[0].emplacements || []).map(function (e) { return { id: e.id, nom: e.nom, type: e.type, entreprise_id: e.entreprise_id, entreprise_nom: e.entreprise_nom }; });
      entreprises = (res[1].entreprises || []).map(function (e) { return { id: e.id, nom: e.nom }; });
      if (!emplacements.length) {
        $choix.textContent = '';
        $emp.innerHTML = '<option value="">Aucun emplacement</option>';
        afficherErreur('Aucun emplacement actif n\'est disponible pour vous. Demandez à un administrateur d\'en créer un.', null);
        return;
      }
      emplacements.forEach(function (e) {
        if (!sources.some(function (s) { return String(s.id) === String(e.entreprise_id); })) { sources.push({ id: e.entreprise_id, nom: e.entreprise_nom }); }
      });
      dessinerTrajets();
      trajetInitial();
      var code = racine.getAttribute('data-piece-code');
      if (code) {
        return sl.ajouterParCode(code).then(function () { w.bip(true); }).catch(function (err) { w.toast(msg(err), 'danger'); });
      }
    }).catch(function (err) {
      $choix.textContent = '';
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

    var langue = $.extend({}, w.DT_LANG, LANG_PLUS, {
      emptyTable: 'Aucune facture.', zeroRecords: 'Aucune facture.',
      infoEmpty: '', info: '_START_ à _END_ de _TOTAL_ factures', infoFiltered: ''
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
        { data: 'emplacements', visible: false },       // trouvé par la recherche, mais pas affiché : le détail est sur la facture
        { data: 'total', className: 'nombre', orderSequence: ['desc', 'asc'] },
        { data: 'statut' }
      ],
      createdRow: function (row, data) {
        if (String(data.statut).indexOf('badge-danger') !== -1) { row.classList.add('ie-ligne-annulee'); }
      }
    });

    function afficherTotaux(r) {
      $tot.textContent = '';
      if (!r.nb_valides && !r.nb_annulees) { montrer($tot, false); return; }     // le tableau dit déjà qu'il n'y a aucune facture
      montrer($tot, true);
      $tot.appendChild(el('strong', null, String(r.nb_valides)));
      $tot.appendChild(document.createTextNode((r.nb_valides > 1 ? ' factures valides' : ' facture valide') + ' · total : '));
      var t = el('strong', null, argent(r.total));
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
    /** La liste n'a pas pu être chargée : on retire les lignes périmées (une facture annulée ne doit pas rester sous « Valides »). */
    function echecListe() {
      seqTotaux++;                                   // une réponse de totaux encore en route est ignorée
      montrer($tot, true);
      $tot.textContent = 'Impossible de charger les factures. Vérifiez la connexion, puis réessayez.';
      var tr = el('tr', 'odd');
      var td = el('td', 'dataTables_empty', 'Impossible de charger les factures. Vérifiez la connexion, puis réessayez.');
      td.colSpan = 5;
      tr.appendChild(td);
      var tb = q('#table-factures tbody');
      tb.textContent = '';
      tb.appendChild(tr);
    }
    // Fin d'une requête de la liste : json est nul quand elle a échoué (hors ligne, erreur 500…). Le noyau affiche déjà le
    // message en français des erreurs HTTP ; ici on s'assure que rien de périmé ne reste à l'écran.
    table.on('xhr.dt', function (ev, settings, json) {
      if (!json) { echecListe(); return; }
      chargerTotaux();
    });

    function redessiner() { table.draw(); }
    [$an, $mo, $sens, $st].forEach(function (c) { c.addEventListener('change', redessiner); });
    var minuteur = null;
    $q.addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(redessiner, 300); });
    // « Plus d'options » : le sens et le statut restent repliés tant qu'on ne les demande pas
    var $plus = q('#f-plus'), $opts = q('#f-options');
    function ouvrirOptions(oui) {
      $opts.hidden = !oui;
      $plus.setAttribute('aria-expanded', oui ? 'true' : 'false');
      q('i', $plus).className = 'fas ' + (oui ? 'fa-chevron-down' : 'fa-chevron-right') + ' ie-plus-icone';
    }
    $plus.addEventListener('click', function () { ouvrirOptions($opts.hidden); });
    q('#f-effacer').addEventListener('click', function () {
      $q.value = ''; $an.value = ''; $mo.value = ''; $sens.value = ''; $st.value = '';
      ouvrirOptions(false);
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
    // Le message « facture annulée » (affiché une seule fois par le serveur) vient d'un paramètre d'adresse : on l'en retire pour que
    // l'adresse copiée ou mise en favori ne le contienne pas.
    try {
      var u = new URL(w.location.href);
      if (u.searchParams.has('ok')) { u.searchParams.delete('ok'); w.history.replaceState(null, '', u.pathname + u.search + u.hash); }
    } catch (e) { /* navigateur sans URL() ou history : sans conséquence */ }

    var btn = q('#btn-annuler'), modal = q('#modal-annuler');
    if (!btn || !modal) { return; }
    var $motif = q('#annuler-motif'), $err = q('#annuler-erreur'), $ok = q('#annuler-confirmer'), $retour = q('#annuler-retour');
    var enCours = false;

    function erreur(t) { $err.textContent = t; montrer($err, !!t); }
    btn.addEventListener('click', function () { erreur(''); $(modal).modal('show'); });
    $(modal).on('shown.bs.modal', function () { $motif.focus(); });
    // Le focus revient au bouton qui a ouvert la fenêtre (sinon il tomberait sur la page : Échap et Tab ne mèneraient nulle part)
    $(modal).on('hidden.bs.modal', function () { erreur(''); try { btn.focus(); } catch (e) { /* sans effet */ } });
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
          erreur(msg(err, 'annulation'));        // message du service (ex. : stock insuffisant à la destination), précédé d'une phrase qui explique
          enCours = false; $ok.disabled = false; $retour.disabled = false;
          $ok.textContent = 'Annuler la facture';
          $motif.focus();           // le focus ne doit pas tomber sur la page (Échap fermerait la fenêtre)
        });
    });
  }

  // ===================================================================================
  //  Bilan mensuel
  // ===================================================================================
  function initBilan() {
    // Aucun envoi automatique à chaque changement d'une liste : au clavier, une flèche recharge la page et fait perdre le focus.
    // Le bouton « Afficher » (ou Entrée) envoie le formulaire.
    var $plus = q('#b-plus'), $opts = q('#b-options');
    if ($plus && $opts) {         // « Plus d'options » : autre mois, autre année, autre paire d'entreprises
      $plus.addEventListener('click', function () {
        var oui = $opts.hidden;
        $opts.hidden = !oui;
        $plus.setAttribute('aria-expanded', oui ? 'true' : 'false');
        q('i', $plus).className = 'fas ' + (oui ? 'fa-chevron-down' : 'fa-chevron-right') + ' ie-plus-icone';
      });
    }
    var $a = q('#b-a'), $b = q('#b-b');
    if ($a && $b) {
      // Les deux entreprises doivent être différentes : l'entreprise choisie à gauche n'est pas proposée à droite
      var sync = function () {
        qa('option', $b).forEach(function (o) { o.disabled = (o.value === $a.value); });
        if ($b.value === $a.value) {
          var autre = qa('option', $b).filter(function (o) { return !o.disabled; })[0];
          if (autre) { $b.value = autre.value; }
        }
      };
      $a.addEventListener('change', sync);
      sync();
    }
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
    var table = null, seq = 0, declencheur = null;
    bouton_imprimer();

    function nombre(d) { var n = parseFloat(d); return isNaN(n) ? 0 : n; }
    function colonnes() {
      return [
        { data: 'code', className: 'code', render: function (d, t, row) { return t === 'display' ? '<a class="code" href="index.php?page=piece_voir&id=' + encodeURIComponent(String(row.piece_id)) + '">' + w.esc(d) + '</a>' : d; } },
        { data: 'nom', render: function (d, t) { return t === 'display' ? w.esc(d) : d; } },
        { data: 'categorie', render: function (d, t) { return t === 'display' ? (d === '' ? '<span class="text-muted">—</span>' : w.esc(d)) : d; } },
        { data: 'quantite', className: 'nombre', render: function (d, t, row) {
          if (t !== 'display') { return nombre(d); }
          return w.esc(w.fmtQte(d)) + ((row.unite && row.unite !== 'unité') ? ' <small class="text-muted">' + w.esc(row.unite) + '</small>' : '');
        } },
        { data: 'cout_moyen', className: 'nombre', render: function (d, t, row) {
          if (t !== 'display') { return nombre(d); }
          return row.sans_cout ? '<span class="badge badge-sans-cout">Sans coût</span>' : w.esc(argent(d, 4));
        } },
        { data: 'valeur', className: 'nombre', render: function (d, t) { return t === 'display' ? w.esc(argent(d)) : nombre(d); } }
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
        mettreFocus();
        return;
      }
      montrer($etat, false); montrer($contenu, true);
      $total.textContent = argent(r.total);
      $nb.textContent = '— ' + lignes.length + (lignes.length > 1 ? ' pièces en stock' : ' pièce en stock');
      var donnees = lignes.map(function (l) { return { piece_id: l.piece_id, code: l.code, nom: l.nom, unite: l.unite, categorie: l.categorie || '', quantite: l.quantite, cout_moyen: l.cout_moyen, valeur: l.valeur, sans_cout: !!l.sans_cout }; });
      if (table) {
        table.clear().rows.add(donnees).draw();
      } else {
        table = $('#table-detail').DataTable({
          data: donnees, columns: colonnes(), order: [[0, 'asc']], pageLength: 25, autoWidth: false,
          language: $.extend({}, w.DT_LANG, LANG_PLUS, { info: '_START_ à _END_ de _TOTAL_ pièces', infoFiltered: '(filtré sur _MAX_)', zeroRecords: 'Aucune pièce ne correspond.', emptyTable: 'Aucune pièce en stock.' })
        });
      }
    }

    /** Le titre du détail reçoit le focus quand le détail est prêt : le clavier et les lecteurs d'écran arrivent sur la bonne zone. */
    function mettreFocus() {
      try { $titre.focus({ preventScroll: true }); } catch (e) { /* ancien navigateur */ }
    }

    function ouvrir(id, bouton) {
      var mon = ++seq;
      if (bouton) { declencheur = bouton; }
      marquerActif(id);
      montrer(carte, true);
      $titre.textContent = 'Détail';
      $etat.textContent = 'Chargement…';
      montrer($etat, true); montrer($contenu, false); montrer($csv, false);
      try { carte.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ancien navigateur */ }
      w.api.get('app/ajax/valeur_detail.php', { emplacement_id: id })
        .then(function (r) { if (mon === seq) { afficher(r); mettreFocus(); } })
        .catch(function (err) { if (mon === seq) { $etat.textContent = 'Impossible de charger le détail : ' + msg(err); montrer($etat, true); montrer($contenu, false); mettreFocus(); } });
    }

    document.addEventListener('click', function (ev) {
      var tr = ev.target.closest ? ev.target.closest('.ie-ligne-emplacement') : null;
      if (!tr) { return; }
      if (ev.target.closest('a')) { return; }
      ouvrir(parseInt(tr.getAttribute('data-id'), 10), ev.target.closest('button') || null);
    });
    $fermer.addEventListener('click', function () {
      seq++; montrer(carte, false); marquerActif(0);
      if (declencheur && document.body.contains(declencheur)) { try { declencheur.focus(); } catch (e) { /* sans effet */ } }
    });

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
