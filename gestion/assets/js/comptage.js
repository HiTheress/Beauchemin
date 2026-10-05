/* Comptage d'inventaire (module D1) : liste des comptages + écran de comptage au scanner.
 * Charger APRÈS assets/js/scan.js (file de scans sans perte, caméra, POST qui garde les données d'erreur).
 *
 *  - page « comptage »       (#page-comptage)       : nouveau comptage (scan EMP-… ou liste) + liste filtrable
 *  - page « comptage_voir »  (#page-comptage-voir)  : chaque scan fait +1 (« ajouter ») ; quantité exacte tapée = « fixer » ;
 *    stock attendu masquable (à l'aveugle par défaut pour un employé : alors il n'est même pas envoyé par le serveur) ;
 *    gestionnaire : aperçu des écarts puis application ; employé : « À faire approuver par un gestionnaire » ; annulation avec confirmation.
 * Les quantités circulent en CHAÎNES décimales ("3.000") ; l'affichage passe par fmtQte.
 */
(function (w, $) {
  'use strict';

  var d = document;
  function qs(sel, racine) { return (racine || d).querySelector(sel); }
  function esc(s) { return w.esc(s); }
  function lien(page, id) { return 'index.php?page=' + encodeURIComponent(page) + '&amp;id=' + encodeURIComponent(id); }
  function heure() { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2) + ':' + ('0' + n.getSeconds()).slice(-2); }
  /** "3.000" -> "3" ; "2.500" -> "2,5" : valeur à mettre dans un champ de saisie (sans séparateur de milliers). */
  function brute(s) {
    s = String(s === null || s === undefined ? '' : s);
    if (s.indexOf('.') >= 0) { s = s.replace(/0+$/, '').replace(/\.$/, ''); }
    return s.replace('.', ',');
  }
  function zero(s) { return parseFloat(s) === 0; }
  function signe(s) { var n = parseFloat(s); return (n > 0 ? '+' : '') + w.fmtQte(s); }
  function classeEcart(s) { var n = parseFloat(s); return n > 0 ? 'cp-ecart-pos' : n < 0 ? 'cp-ecart-neg' : 'cp-ecart-nul'; }
  function unite(u) { return (u && u !== 'unité') ? ' <small class="text-muted">(' + esc(u) + ')</small>' : ''; }

  /* ================================================================================================
   *  Page « Comptage » : nouveau comptage + liste
   * ============================================================================================== */
  var racineListe = qs('#page-comptage');
  if (racineListe) {
    (function () {
      var elScan = qs('#scan'), sel = qs('#nouveau-emp'), msg = qs('#cp-nouveau-msg'), bNouveau = qs('#btn-nouveau');
      var entCourante = parseInt(racineListe.getAttribute('data-entreprise'), 10) || 0;
      var enCreation = false;
      var TYPES = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };

      function afficher(type, html) { msg.innerHTML = html ? '<div class="alert alert-' + type + ' mt-2" role="alert">' + html + '</div>' : ''; }

      // Un seul comptage ouvert par emplacement : on affiche le message du service avec le lien vers l'existant.
      function creer(empId) {
        if (enCreation) { return Promise.resolve(false); }
        enCreation = true; bNouveau.disabled = true; afficher('', '');
        return w.Scan.postBrut('app/action/comptage_creer.php', { emplacement_id: empId, note: qs('#nouveau-note').value }).then(function (r) {
          var j = r.data;
          if (j.ok) { w.location.href = 'index.php?page=comptage_voir&id=' + encodeURIComponent(j.id); return true; }
          enCreation = false; bNouveau.disabled = false;
          afficher('warning', esc(j.erreur || 'Impossible de créer le comptage.') +
            (j.existant ? ' <a class="alert-link" id="lien-existant" href="' + lien('comptage_voir', j.existant.id) + '">Ouvrir le comptage ' + esc(j.existant.numero) + '</a>' : ''));
          return false;
        }).catch(function (e) { enCreation = false; bNouveau.disabled = false; afficher('danger', esc(e.message)); return false; });
      }

      // Scan d'un code d'emplacement : le comptage démarre tout de suite
      w.Scan.lier(elScan, function (code) {
        return w.api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
          if (!r.trouve) { afficher('danger', 'Code inconnu : « ' + esc(code) + ' ». Scannez le code-barres d\'un emplacement (EMP-…) de vos entreprises.'); return false; }
          if (r.type !== 'emplacement') { afficher('danger', '« ' + esc(r.piece.code) + ' » est une pièce. Scannez plutôt le code-barres de l\'emplacement (EMP-…) à compter.'); return false; }
          sel.value = String(r.emplacement.id);
          return creer(r.emplacement.id).then(function (ok) { return ok; });
        });
      }, { onErreur: function (e) { afficher('danger', esc(e.message)); } });
      w.Scan.focusAuto(elScan, racineListe);

      // Liste des emplacements actifs (de l'entreprise active si l'une est choisie en haut)
      w.api.get('app/ajax/emplacements_liste.php').then(function (r) {
        var groupes = {}, ordre = [];
        (r.emplacements || []).forEach(function (e) {
          if (entCourante && e.entreprise_id !== entCourante) { return; }
          if (!groupes[e.entreprise_id]) { groupes[e.entreprise_id] = { nom: e.entreprise_nom, items: [] }; ordre.push(e.entreprise_id); }
          groupes[e.entreprise_id].items.push(e);
        });
        var h = '<option value="">— Choisir un emplacement —</option>';
        ordre.forEach(function (id) {
          h += '<optgroup label="' + esc(groupes[id].nom) + '">' + groupes[id].items.map(function (e) {
            return '<option value="' + esc(e.id) + '">' + esc(e.nom) + ' (' + esc(TYPES[e.type] || e.type) + ')</option>';
          }).join('') + '</optgroup>';
        });
        $(sel).html(h).prop('disabled', false);
      }).catch(function () { $(sel).html('<option value="">Liste indisponible</option>'); });

      bNouveau.addEventListener('click', function () {
        var v = parseInt(sel.value, 10);
        if (!v) { afficher('warning', 'Choisissez d\'abord un emplacement dans la liste, ou scannez son code-barres.'); sel.focus(); return; }
        creer(v);
      });

      // Liste (tableau serveur). Six colonnes (l'entreprise est sous l'emplacement, « par … » sous la date) : le tableau tient sans défilement.
      // Alias renvoyés par comptage_data.php = columns[].data.
      var MSG_VIDE = 'Aucun comptage pour le moment. Scannez un emplacement ci-dessus pour en commencer un.';
      var MSG_FILTRES = 'Aucun comptage ne correspond à ces filtres.';
      function filtresActifs() { return !!($('#f-statut').val() || $('#f-entreprise').val() || $('#f-mes').is(':checked')); }
      var table = $('#table-comptages').DataTable({
        serverSide: true, processing: true, searchDelay: 300, order: [[3, 'desc']],
        ajax: {
          url: 'app/ajax/comptage_data.php', type: 'POST',
          data: function (p) {
            p.statut = $('#f-statut').val() || '';
            p.entreprise_id = ($('#f-entreprise').val() || '');
            p.mine = $('#f-mes').is(':checked') ? '1' : '';
          }
        },
        columns: [
          { data: 'numero' }, { data: 'emplacement' }, { data: 'statut' }, { data: 'cree_le' },
          { data: 'nb_lignes', className: 'nombre' }, { data: 'document', orderable: false, defaultContent: '' }
        ],
        // « Aucun comptage pour le moment » serait faux quand un filtre vide la liste (le serveur compte le total AVEC les filtres)
        preDrawCallback: function (settings) { settings.oLanguage.sEmptyTable = filtresActifs() ? MSG_FILTRES : MSG_VIDE; },
        language: $.extend(true, {}, w.DT_LANG, {
          emptyTable: MSG_VIDE, zeroRecords: MSG_FILTRES, search: 'Rechercher :',
          aria: { sortAscending: ' : activer pour trier par ordre croissant', sortDescending: ' : activer pour trier par ordre décroissant' }
        })
      });
      $('#f-statut, #f-entreprise, #f-mes').on('change', function () { table.ajax.reload(); });
    })();
  }

  /* ================================================================================================
   *  Page « Comptage » : écran de comptage
   * ============================================================================================== */
  var racine = qs('#page-comptage-voir');
  if (!racine) { return; }

  var ID = parseInt(racine.getAttribute('data-comptage-id'), 10);
  var role = racine.getAttribute('data-role');
  var gestionnaire = (role === 'gestionnaire' || role === 'admin');
  var elScan = qs('#scan'), elAlerte = qs('#cv-alerte'), elEntete = qs('#cv-entete'), elSaisie = qs('#cv-saisie');
  var table = qs('#cv-table'), thead = qs('thead', table), tbody = qs('tbody', table);
  var elVide = qs('#cv-vide'), elNb = qs('#cv-nb'), elActions = qs('#cv-actions'), elJournal = qs('#cv-journal');
  var chkAveugle = qs('#cv-aveugle');

  var MAX_LIGNES_DEFAUT = 300;         // pièces par document d'ajustement (le serveur renvoie la valeur exacte avec l'aperçu)
  var etat = { det: null, lignes: {}, ordre: [], non: [], aveugle: !gestionnaire, termine: false };
  chkAveugle.checked = etat.aveugle;
  var fileScan = null;                 // file des scans (créée une fois le comptage chargé)
  var serie = Promise.resolve();       // toutes les écritures partent l'une après l'autre : l'ordre est conservé
  var ecritures = 0;                   // compteur : change à chaque écriture demandée, commencée ou terminée (détecte une lecture périmée)
  function enSerie(fn) {
    ecritures++;
    var p = serie.then(function () { ecritures++; return fn(); });
    serie = p.then(function () { ecritures++; }, function () { ecritures++; });
    return p;
  }
  /** Résout quand tous les scans en file ont été envoyés (avant d'appliquer ou d'annuler : rien ne doit rester en route). */
  function fileInactive() {
    return new Promise(function (ok) {
      var n = 0;
      (function guetter() { if (!fileScan || fileScan.attente() === 0 || n++ > 100) { ok(); } else { setTimeout(guetter, 100); } })();
    });
  }

  // ---- messages
  function alerte(type, html) {
    elAlerte.innerHTML = html ? '<div class="alert alert-' + type + '" role="alert">' + html + '</div>' : '';
    if (html && w.scrollTo) { try { elAlerte.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ } }
  }
  /** Dernier scan en GRAND (nom et nouveau total) : on voit d'un coup d'oeil, même de loin, que le scan a été pris en compte. */
  function dernier(ok, html) {
    var z = qs('#cv-dernier');
    if (!z) { return; }
    z.className = 'cp-dernier ' + (ok ? 'cp-dernier-ok' : 'cp-dernier-ko');
    z.innerHTML = html;
  }
  function journal(ok, texte) {
    var li = d.createElement('li'); li.className = ok ? 'cp-j-ok' : 'cp-j-ko';
    li.innerHTML = '<span class="cp-j-h">' + esc(heure()) + '</span> <i class="fas ' + (ok ? 'fa-check text-success' : 'fa-times') + '" aria-hidden="true"></i> ';
    var s = d.createElement('span'); s.textContent = texte; li.appendChild(s);
    elJournal.insertBefore(li, elJournal.firstChild);
    while (elJournal.children.length > 8) { elJournal.removeChild(elJournal.lastChild); }
  }

  // ---- en-tête
  function dessinerEntete() {
    var c = etat.det.comptage;
    var cls = c.statut === 'en_cours' ? 'warning' : c.statut === 'applique' ? 'success' : 'secondary';
    var h = '<div class="row"><div class="col-lg-8"><div class="cp-numero">' + esc(c.numero) + ' <span class="badge badge-' + cls + ' cp-statut" id="cv-statut">' + esc(c.statut_libelle) + '</span></div>';
    h += '<dl class="row cp-entete mt-2 mb-0"><dt class="col-sm-3">Emplacement</dt><dd class="col-sm-9">' + esc(c.emplacement_nom) + ' <small class="text-muted">(' + esc(c.entreprise_nom) + ')</small></dd>';
    h += '<dt class="col-sm-3">Commencé</dt><dd class="col-sm-9">' + esc(c.cree_le) + (c.cree_par_nom ? ' par ' + esc(c.cree_par_nom) : '') + '</dd>';
    if (c.note) { h += '<dt class="col-sm-3">Note</dt><dd class="col-sm-9">' + esc(c.note) + '</dd>'; }
    if (c.statut === 'applique') {
      h += '<dt class="col-sm-3">Appliqué</dt><dd class="col-sm-9">' + esc(c.applique_le || '') + (c.applique_par_nom ? ' par ' + esc(c.applique_par_nom) : '') + '</dd>';
      var docs = (c.documents && c.documents.length) ? c.documents : (c.document_id ? [{ id: c.document_id, numero: c.document_numero || 'Voir le document' }] : []);
      h += '<dt class="col-sm-3">' + (docs.length > 1 ? 'Ajustements' : 'Ajustement') + '</dt><dd class="col-sm-9">' + (docs.length
        ? docs.map(function (x, i) { return '<a' + (i === 0 ? ' id="lien-ajustement"' : '') + ' href="' + lien('document_voir', x.id) + '">' + esc(x.numero) + '</a>'; }).join(', ') + (docs.length > 1 ? ' <small class="text-muted">(' + docs.length + ' documents : un par tranche de ' + MAX_LIGNES_DEFAUT + ' pièces)</small>' : '')
        : '<span class="text-muted">Aucun écart : aucun ajustement n\'a été nécessaire.</span>') + '</dd>';
    }
    h += '</dl></div></div>';
    elEntete.innerHTML = h;
  }

  // ---- tableau
  function entetesTableau() {
    var c = etat.det.comptage, edition = c.statut === 'en_cours', attendu = edition && !etat.aveugle, applique = c.statut === 'applique';
    var h = '<tr><th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Compté</th>';
    if (attendu) { h += '<th scope="col" class="nombre">Stock attendu</th><th scope="col" class="nombre">Écart</th>'; }
    if (applique) { h += '<th scope="col" class="nombre">Écart appliqué</th>'; }
    if (edition) { h += '<th scope="col" class="text-right"><span class="sr-only">Retirer</span></th>'; }
    thead.innerHTML = h + '</tr>';
  }
  function htmlLigne(l) {
    var c = etat.det.comptage, edition = c.statut === 'en_cours', attendu = edition && !etat.aveugle;
    var h = '<td class="code">' + esc(l.code) + '</td><td>' + esc(l.nom) + unite(l.unite) + '</td>';
    if (edition) {
      h += '<td class="nombre"><input type="text" inputmode="decimal" class="form-control cp-qte" value="' + esc(brute(l.quantite_comptee)) + '" data-serveur="' + esc(l.quantite_comptee) + '" aria-label="Quantité comptée de ' + esc(l.code) + '" autocomplete="off">' +
        '<div class="cp-erreur-champ" role="alert"></div></td>';
    } else {
      h += '<td class="nombre cp-comptee">' + esc(w.fmtQte(l.quantite_comptee)) + '</td>';
    }
    if (attendu) {
      h += '<td class="nombre cp-attendu">' + esc(w.fmtQte(l.quantite_actuelle)) + '</td><td class="nombre cp-ecart ' + classeEcart(l.ecart) + '">' + esc(signe(l.ecart)) + '</td>';
    }
    if (c.statut === 'applique') {
      h += '<td class="nombre cp-ecart ' + classeEcart(l.ecart_applique) + '">' + esc(signe(l.ecart_applique || '0')) + '</td>';
    }
    if (edition) {
      h += '<td class="text-right"><button type="button" class="btn btn-sm btn-outline-danger cp-retirer" data-code="' + esc(l.code) + '" aria-label="Retirer ' + esc(l.code) + ' du comptage" title="Retirer cette ligne"><i class="fas fa-times cp-retirer-icone" aria-hidden="true"></i><span class="cp-retirer-texte">Retirer ?</span></button></td>';
    }
    return h;
  }
  function creerTr(l) {
    var tr = d.createElement('tr'); tr.setAttribute('data-piece', l.piece_id); tr.innerHTML = htmlLigne(l); return tr;
  }
  function trDe(id) { return tbody.querySelector('tr[data-piece="' + id + '"]'); }
  function majCompteurs() {
    var n = etat.ordre.length;
    elNb.textContent = n;
    elVide.style.display = n ? 'none' : '';
    table.style.display = n ? '' : 'none';
    elVide.textContent = etat.det.comptage.statut === 'en_cours' ? 'Aucune pièce comptée pour le moment. Scannez une pièce pour commencer.' : 'Aucune pièce n\'avait été comptée.';
  }
  /** Carte « En stock selon le système, pas encore comptées » : tient à jour ce qu'il reste à compter (scan, retrait, actualisation). */
  function dessinerNonComptees() {
    var carte = qs('#cv-non-comptees'), non = etat.non;
    if (etat.det && etat.det.comptage.statut === 'en_cours' && !etat.aveugle && non.length) {
      qs('#cv-nb-non').textContent = non.length;
      qs('#cv-non-corps').innerHTML = non.map(function (l) { return '<tr data-piece="' + esc(l.piece_id) + '"><td class="code">' + esc(l.code) + '</td><td>' + esc(l.nom) + unite(l.unite) + '</td><td class="nombre">' + esc(w.fmtQte(l.quantite_actuelle)) + '</td></tr>'; }).join('');
      carte.classList.remove('d-none');
    } else { carte.classList.add('d-none'); }
  }
  /** Dessine tout le tableau. Les lignes déjà affichées gardent leur place ; les nouvelles (autre onglet) passent en tête. */
  function dessinerTout() {
    var det = etat.det, map = {};
    det.lignes.forEach(function (l) { map[l.piece_id] = l; });
    var gardees = etat.ordre.filter(function (id) { return map[id]; });
    var nouvelles = det.lignes.filter(function (l) { return gardees.indexOf(l.piece_id) < 0; }).map(function (l) { return l.piece_id; });
    etat.ordre = nouvelles.concat(gardees);
    etat.lignes = map;
    entetesTableau();
    tbody.innerHTML = '';
    etat.ordre.forEach(function (id) { tbody.appendChild(creerTr(map[id])); });
    majCompteurs();
    // Pièces en stock pas encore comptées (jamais en mode aveugle : le serveur ne les envoie pas)
    etat.non = (det.non_comptees || []).slice();
    dessinerNonComptees();
    // Comptage appliqué : pièces non scannées mises à 0 par l'ajustement
    var rem = det.remises_a_zero || [];
    if (det.comptage.statut === 'applique' && rem.length) {
      rem.forEach(function (l) {
        var tr = d.createElement('tr'); tr.className = 'table-warning';
        tr.innerHTML = '<td class="code">' + esc(l.code) + '</td><td>' + esc(l.nom) + unite(l.unite) + ' <span class="badge badge-warning">non scannée : remise à 0</span></td><td class="nombre">0</td><td class="nombre cp-ecart ' + classeEcart(l.ecart_applique) + '">' + esc(signe(l.ecart_applique)) + '</td>';
        tbody.appendChild(tr);
      });
      elVide.style.display = 'none'; table.style.display = '';
    }
  }
  /** Met à jour (ou crée) UNE ligne après un scan, sans reconstruire le tableau (le curseur ne bouge pas). */
  function majLigne(l, mettreEnTete, forcer) {
    var existe = !!etat.lignes[l.piece_id];
    etat.lignes[l.piece_id] = l;
    var tr = trDe(l.piece_id);
    if (!tr) { tr = creerTr(l); }
    else {
      var champ = qs('.cp-qte', tr);
      var enSaisie = champ && d.activeElement === champ && champ.value !== brute(champ.getAttribute('data-serveur'));
      if (forcer || !enSaisie) { tr.innerHTML = htmlLigne(l); }
    }
    if (!existe) { etat.ordre.unshift(l.piece_id); }
    var avant = etat.non.length;
    etat.non = etat.non.filter(function (x) { return x.piece_id !== l.piece_id; });
    if (etat.non.length !== avant) { dessinerNonComptees(); }
    if (mettreEnTete !== false) {
      if (tbody.firstChild !== tr) { tbody.insertBefore(tr, tbody.firstChild); }
      etat.ordre = [l.piece_id].concat(etat.ordre.filter(function (x) { return x !== l.piece_id; }));
    } else if (!tr.parentNode) { tbody.appendChild(tr); }
    tr.classList.add('cp-flash'); setTimeout(function () { tr.classList.remove('cp-flash'); }, 1500);
    majCompteurs();
  }

  // ---- actions
  function dessinerActions() {
    var c = etat.det.comptage, h = '';
    if (c.statut === 'en_cours') {
      if (etat.det.peut_appliquer) { h += '<button type="button" id="btn-appliquer" class="btn btn-success"><i class="fas fa-check-double mr-1" aria-hidden="true"></i> Appliquer le comptage</button>'; }
      else { h += '<button type="button" id="btn-approbation" class="btn btn-primary"><i class="fas fa-user-check mr-1" aria-hidden="true"></i> À faire approuver par un gestionnaire</button>'; }
      h += '<button type="button" id="btn-annuler" class="btn btn-outline-danger"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Annuler le comptage</button>';
    }
    h += '<span class="cp-espace"></span><a class="btn btn-outline-secondary" href="index.php?page=comptage"><i class="fas fa-list mr-1" aria-hidden="true"></i> Liste des comptages</a>';
    elActions.innerHTML = h;
  }

  // ---- chargement de l'état
  var dernierChargement = 0;   // numéro de la dernière demande : une réponse plus ancienne est ignorée
  function charger(silencieux, muet, essai) {
    essai = essai || 0;
    var demande = ++dernierChargement, e0 = ecritures;
    return w.api.get('app/ajax/comptage_detail.php', { id: ID, aveugle: etat.aveugle ? 1 : 0 }).then(function (r) {
      if (demande !== dernierChargement) { return; }   // une réponse plus récente est déjà arrivée
      // Une écriture (scan, quantité tapée…) a eu lieu pendant la lecture, ou l'utilisateur tape dans une quantité : cette lecture
      // peut être périmée et écraserait ce qui est affiché. Rafraîchissement automatique : on abandonne ; lecture demandée : on relit.
      var saisie = d.activeElement && d.activeElement.classList && d.activeElement.classList.contains('cp-qte');
      if (ecritures !== e0 || (silencieux && saisie)) {
        if (silencieux) { return; }
        if (essai < 3) { return charger(silencieux, muet, essai + 1); }
      }
      var passeEnCours = etat.det && etat.det.comptage.statut === 'en_cours' && r.comptage.statut !== 'en_cours';
      etat.det = r; etat.termine = r.comptage.statut !== 'en_cours';
      dessinerEntete(); dessinerTout(); dessinerActions();
      elSaisie.classList.toggle('d-none', etat.termine);
      if (passeEnCours && silencieux && !muet) { alerte('info', 'Ce comptage vient d\'être terminé (' + esc(r.comptage.statut_libelle.toLowerCase()) + ') depuis un autre écran.'); }
      if (etat.termine) { stopperRafraichissement(); } else if (!silencieux && fileScan) { fileScan.focus(); }
    }).catch(function (e) {
      if (silencieux && etat.det) { return; }   // un rafraîchissement raté ne casse pas l'écran
      elEntete.innerHTML = '<div class="alert alert-danger mb-0" role="alert">' + esc(e.message) + ' <a class="alert-link" href="index.php?page=comptage">Retour à la liste des comptages</a></div>';
      elSaisie.classList.add('d-none'); elActions.innerHTML = '';
    });
  }

  // Rafraîchissement automatique (deux écrans sur le même comptage) : seulement si rien n'est en cours de saisie
  var minuterie = null;
  function stopperRafraichissement() { clearInterval(minuterie); minuterie = null; }
  function peutRafraichir() {
    var a = d.activeElement;
    return !d.hidden && !etat.termine && (!fileScan || fileScan.attente() === 0) && !(a && a.classList && a.classList.contains('cp-qte')) && !$('.modal.show').length;
  }
  function demarrerRafraichissement() { stopperRafraichissement(); minuterie = setInterval(function () { if (peutRafraichir()) { charger(true); } }, 15000); }
  d.addEventListener('visibilitychange', function () { if (!d.hidden && !etat.termine && peutRafraichir()) { charger(true); } });

  // ---- écritures (toujours via la file « enSerie »)
  function envoyerScan(corps, libelle) {
    corps.id = ID; corps.aveugle = etat.aveugle ? 1 : 0;
    return enSerie(function () {
      return w.api.post('app/action/comptage_scan.php', corps).then(function (r) {
        majLigne(r.ligne, true);
        journal(true, r.ligne.code + ' — ' + r.ligne.nom + ' : ' + w.fmtQte(r.ligne.quantite_comptee));
        dernier(true, '<span class="cp-dernier-code code">' + esc(r.ligne.code) + '</span> <span class="cp-dernier-nom">' + esc(r.ligne.nom) + '</span> <span class="cp-dernier-total">Compté : <strong>' + esc(w.fmtQte(r.ligne.quantite_comptee)) + '</strong></span>');
        return true;
      });
    }).catch(function (e) { gererErreurEcriture(e, libelle); throw e; });
  }
  function gererErreurEcriture(e, libelle) {
    journal(false, (libelle ? libelle + ' : ' : '') + e.message);
    dernier(false, '<i class="fas fa-times-circle mr-1" aria-hidden="true"></i> ' + esc(e.message));
    if (/termin/i.test(e.message)) { alerte('warning', 'Ce comptage est terminé : il ne peut plus être modifié.'); charger(true); }
    else { alerte('danger', esc(e.message)); }
  }

  function demarrerSaisie() {
    fileScan = w.Scan.lier(elScan, function (code, n) {
      alerte('', '');
      return envoyerScan({ code: code, mode: 'ajouter', quantite: String(n) }, '« ' + code + ' »').then(function () { return true; });
    }, { regrouper: true, onAttente: function (n) { qs('#sc-attente').textContent = n > 1 ? n + ' scans en attente…' : ''; }, onErreur: function () { /* déjà affichée par gererErreurEcriture */ } });
    w.Scan.focusAuto(elScan, racine);
    w.Scan.clavier(qs('#btn-clavier'), elScan);

    // Recherche texte de secours : +1 pour la pièce choisie
    var $rech = $('#recherche');
    $rech.select2({
      placeholder: 'Taper une partie du nom ou du code…', allowClear: true, minimumInputLength: 1,
      ajax: {
        url: 'app/ajax/pieces_recherche.php', dataType: 'json', delay: 200,
        data: function (p) { return { q: p.term || '' }; },
        processResults: function (r) { return { results: (r.pieces || []).map(function (p) { return { id: p.id, text: p.code + ' — ' + p.nom }; }) }; }
      }
    });
    w.Scan.select2Propre($rech);
    w.Scan.select2Etiquette($rech, 'lib-recherche');
    $rech.on('select2:select', function (e) {
      var id = parseInt(e.params.data.id, 10), texte = e.params.data.text;
      $rech.val(null).trigger('change');
      alerte('', '');
      envoyerScan({ piece_id: id, mode: 'ajouter', quantite: '1' }, texte).then(function () { w.bip(true); }, function () { w.bip(false); }).then(function () { elScan.focus(); });
    });

    // Caméra : mêmes scans, mêmes règles
    var bCam = qs('#btn-camera');
    var cam = w.Scan.camera(qs('#cam-zone'), function (code) { fileScan.ajouter(code); }, { onFermer: function () { bCam.setAttribute('aria-expanded', 'false'); } });
    bCam.addEventListener('click', function () {
      if (cam.actif()) { cam.fermer(); bCam.setAttribute('aria-expanded', 'false'); elScan.focus(); return; }
      bCam.setAttribute('aria-expanded', 'true'); cam.ouvrir(); elScan.focus();
    });
    qs('#cam-zone').addEventListener('click', function (e) { if (e.target.closest('.sc-camera-fermer')) { bCam.setAttribute('aria-expanded', 'false'); elScan.focus(); } });
  }

  // Quantité exacte tapée dans le tableau (« fixer »). Validée AVANT l'envoi ; l'erreur s'affiche sous la cellule fautive.
  var FORME_QTE = /^\d+([.,]\d+)?$/;
  function erreurChamp(inp, texte) {
    var z = qs('.cp-erreur-champ', inp.closest('td'));
    if (!z) { return; }
    clearTimeout(z._t);
    z.textContent = texte || '';
    if (texte) { inp.setAttribute('aria-invalid', 'true'); z._t = setTimeout(function () { erreurChamp(inp, ''); }, 8000); }
    else { inp.removeAttribute('aria-invalid'); }
  }
  /** Retourne une Promise<boolean> : true = rien à corriger (le curseur peut retourner au champ de scan), false = erreur affichée sous le champ. */
  function validerChamp(inp, depuisEntree) {
    var tr = inp.closest('tr'), id = parseInt(tr.getAttribute('data-piece'), 10), l = etat.lignes[id];
    var ancienne = brute(inp.getAttribute('data-serveur'));
    var brut = inp.value.trim();
    var v = brut.replace(/[\s  ]/g, '');      // « 1 000 » = 1000
    if (v === ancienne) { erreurChamp(inp, ''); return Promise.resolve(true); }
    if (v === '') { inp.value = ancienne; erreurChamp(inp, ''); return Promise.resolve(true); }
    var probleme = '';
    if (!FORME_QTE.test(v)) { probleme = 'La quantité « ' + brut + ' » n\'est pas valide : tapez un nombre positif (ex. : 12 ou 2,5).'; }
    else if (/[.,]\d{4,}$/.test(v)) { probleme = 'La quantité « ' + brut + ' » a trop de décimales : trois au maximum (ex. : 2,5 ou 0,125).'; }
    if (probleme) {
      erreurChamp(inp, probleme);
      journal(false, (l ? l.code + ' : ' : '') + probleme);
      if (depuisEntree) { inp.select(); } else { inp.value = ancienne; }
      return Promise.resolve(false);
    }
    if (inp.getAttribute('data-envoi') === v) { return Promise.resolve(true); }   // Entrée puis perte du focus : un seul envoi
    inp.setAttribute('data-envoi', v);
    erreurChamp(inp, ''); alerte('', '');
    return enSerie(function () {
      return w.api.post('app/action/comptage_scan.php', { id: ID, piece_id: id, mode: 'fixer', quantite: v, aveugle: etat.aveugle ? 1 : 0 }).then(function (r) {
        majLigne(r.ligne, false, true);
        journal(true, r.ligne.code + ' — ' + r.ligne.nom + ' : ' + w.fmtQte(r.ligne.quantite_comptee) + ' (quantité tapée)');
        dernier(true, '<span class="cp-dernier-code code">' + esc(r.ligne.code) + '</span> <span class="cp-dernier-nom">' + esc(r.ligne.nom) + '</span> <span class="cp-dernier-total">Compté : <strong>' + esc(w.fmtQte(r.ligne.quantite_comptee)) + '</strong></span>');
        return true;
      });
    }).then(function (ok) { inp.removeAttribute('data-envoi'); return ok; }, function (e) {
      inp.removeAttribute('data-envoi');
      var termine = /termin/i.test(e.message);
      if (!termine) { erreurChamp(inp, e.message); }
      inp.value = ancienne; tr.classList.add('cp-erreur-ligne'); setTimeout(function () { tr.classList.remove('cp-erreur-ligne'); }, 1500);
      if (termine) { gererErreurEcriture(e, l ? l.code : ''); } else { journal(false, (l ? l.code + ' : ' : '') + e.message); dernier(false, '<i class="fas fa-times-circle mr-1" aria-hidden="true"></i> ' + esc(e.message)); }
      return false;
    });
  }
  tbody.addEventListener('keydown', function (e) {
    var inp = e.target.closest ? e.target.closest('.cp-qte') : null;
    if (!inp) { return; }
    if (e.key === 'Enter') { e.preventDefault(); validerChamp(inp, true).then(function (ok) { if (ok) { elScan.focus(); } }); }
    else if (e.key === 'Escape') { inp.value = brute(inp.getAttribute('data-serveur')); erreurChamp(inp, ''); elScan.focus(); }
  });
  tbody.addEventListener('change', function (e) {
    var inp = e.target.closest ? e.target.closest('.cp-qte') : null;
    if (inp) { validerChamp(inp, false); }
  });
  tbody.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('cp-qte')) { e.target.select(); } });

  // Retirer une ligne : premier clic = le bouton passe à « Retirer ? » (rouge), second clic = confirmation (évite le clic accidentel sur tablette).
  // Le bouton garde son contenu (icône + texte, seule la classe change) : la cible du clic reste dans la page et le focus reste sur le bouton.
  // L'armement tombe seul : après 4 s, dès que le focus quitte le bouton, ou dès qu'une touche de caractère est tapée (un scan qui arrive
  // ne doit jamais valider un retrait : la touche Entrée du lecteur irait sur le bouton armé).
  var armee = null, minArme = null;
  function desarmer() {
    clearTimeout(minArme);
    if (!armee) { return; }
    var b = armee; armee = null;
    b.classList.remove('cp-arme', 'btn-danger'); b.classList.add('btn-outline-danger');
    b.setAttribute('aria-label', 'Retirer ' + (b.getAttribute('data-code') || '') + ' du comptage');
  }
  function armer(b) {
    desarmer();
    armee = b;
    b.classList.remove('btn-outline-danger'); b.classList.add('btn-danger', 'cp-arme');
    b.setAttribute('aria-label', 'Confirmer le retrait de ' + (b.getAttribute('data-code') || '') + ' du comptage');
    annoncer('Cliquez de nouveau pour confirmer le retrait de ' + (b.getAttribute('data-code') || 'la pièce') + '.');
    minArme = setTimeout(desarmer, 4000);
  }
  /** Annonce vocale discrète (lecteur d'écran), sans bandeau à l'écran. */
  function annoncer(texte) {
    var z = qs('#cv-annonce');
    if (!z) { return; }
    z.textContent = '';
    setTimeout(function () { z.textContent = texte; }, 30);
  }
  d.addEventListener('keydown', function (e) {
    if (!armee || !e.key || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) { return; }
    if (e.key === ' ' && e.target === armee) { return; }   // la barre d'espace sur le bouton armé = le confirmer au clavier
    desarmer();
  }, true);
  tbody.addEventListener('focusout', function (e) { if (armee && e.target === armee) { desarmer(); } });
  tbody.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.cp-retirer') : null;
    if (!b) { return; }
    var tr = b.closest('tr'), id = parseInt(tr.getAttribute('data-piece'), 10), l = etat.lignes[id];
    if (!b.classList.contains('cp-arme')) { armer(b); return; }
    if (b.disabled) { return; }
    desarmer();
    b.disabled = true;
    enSerie(function () { return w.api.post('app/action/comptage_retirer.php', { id: ID, piece_id: id }); }).then(function () {
      delete etat.lignes[id]; etat.ordre = etat.ordre.filter(function (x) { return x !== id; }); tr.remove(); majCompteurs();
      // En stock selon le système : la pièce retirée du comptage retourne dans « pas encore comptées » (jamais à l'aveugle : pas de stock connu)
      if (l && !etat.aveugle && l.quantite_actuelle !== undefined && parseFloat(l.quantite_actuelle) > 0) {
        etat.non.push({ piece_id: l.piece_id, code: l.code, nom: l.nom, unite: l.unite, quantite_actuelle: l.quantite_actuelle });
        etat.non.sort(function (x, y) { return x.code < y.code ? -1 : x.code > y.code ? 1 : 0; });
      }
      dessinerNonComptees();
      journal(true, (l ? l.code : 'Ligne') + ' retiré du comptage');
      elScan.focus();
    }).catch(function (err) { b.disabled = false; gererErreurEcriture(err, l ? l.code : ''); });
  });

  // ---- à l'aveugle
  chkAveugle.addEventListener('change', function () {
    etat.aveugle = chkAveugle.checked;
    charger(false);
  });
  qs('#btn-actualiser').addEventListener('click', function () { charger(false).then(function () { if (fileScan) { fileScan.focus(); } }); });

  // ---- boutons d'action
  elActions.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) { return; }
    if (b.id === 'btn-appliquer') { ouvrirApercu(); }
    else if (b.id === 'btn-annuler') { qs('#an-erreur').textContent = ''; $('#modal-annuler').modal('show'); }
    else if (b.id === 'btn-approbation') {
      alerte('info', '<strong>Votre comptage est enregistré.</strong> Seul un gestionnaire peut l\'appliquer au stock : demandez-lui d\'ouvrir le comptage <strong>' + esc(etat.det.comptage.numero) + '</strong> (menu « Comptage ») et de cliquer sur « Appliquer le comptage ». Rien n\'est modifié tant qu\'il ne l\'a pas fait.');
      if (fileScan) { fileScan.focus(); }   // le prochain scan doit être compté, pas tapé dans le bouton
    }
  });

  // ---- annulation
  var bAnnuler = qs('#an-confirmer');
  bAnnuler.addEventListener('click', function () {
    if (bAnnuler.disabled) { return; }
    bAnnuler.disabled = true;
    fileInactive().then(function () { return enSerie(function () { return w.api.post('app/action/comptage_annuler.php', { id: ID }); }); }).then(function () {
      $('#modal-annuler').modal('hide');
      alerte('success', 'Le comptage <strong>' + esc(etat.det.comptage.numero) + '</strong> a été annulé. Le stock n\'a pas été modifié.');
      return charger(true, true);
    }).catch(function (err) { qs('#an-erreur').textContent = err.message; }).then(function () { bAnnuler.disabled = false; });
  });
  $('#modal-annuler').on('hidden.bs.modal', function () { if (fileScan && !etat.termine) { fileScan.focus(); } });

  // ---- application (gestionnaire+) : aperçu des écarts contre le stock ACTUEL, case « non scannées à 0 », confirmation explicite.
  // L'aperçu porte une EMPREINTE (comptage + stock actuel + pièces à remettre à 0) : l'application la renvoie et le serveur refuse si
  // quelque chose a changé depuis (autre écran, mouvement) ; l'aperçu est alors relu et le gestionnaire doit confirmer de nouveau.
  var ap = { donnees: null };
  var bConfirmer = qs('#ap-confirmer');
  function ouvrirApercu() {
    $('#modal-appliquer').modal('show');
    chargerApercu(null);
  }
  /** reprise : { zero:bool, message:texte } pour rouvrir l'aperçu à jour après un changement détecté (la case « à 0 » reste cochée). */
  function chargerApercu(reprise) {
    var corps = qs('#ap-corps');
    corps.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin mr-1" aria-hidden="true"></i> Calcul des écarts…</p>';
    bConfirmer.disabled = true; ap.donnees = null;
    return fileInactive().then(function () { return enSerie(function () { return w.api.get('app/ajax/comptage_apercu.php', { id: ID }); }); }).then(function (r) {
      ap.donnees = r; dessinerApercu(reprise);
    }).catch(function (e) { corps.innerHTML = '<div class="alert alert-danger mb-0" role="alert">' + esc(e.message) + '</div>'; });
  }
  function dessinerApercu(reprise) {
    var r = ap.donnees, corps = qs('#ap-corps');
    var avecEcart = r.lignes.filter(function (l) { return !zero(l.ecart); });
    var plus = 0, moins = 0;
    avecEcart.forEach(function (l) { var n = parseFloat(l.ecart); if (n > 0) { plus++; } else { moins++; } });
    var h = '';
    if (reprise && reprise.message) { h += '<div class="alert alert-warning" role="alert" id="ap-changement">' + esc(reprise.message) + '</div>'; }
    h += '<p class="cp-apercu-resume">Comptage <strong>' + esc(r.comptage.numero) + '</strong> — ' + esc(r.comptage.emplacement_nom) + ' <small class="text-muted">(' + esc(r.comptage.entreprise_nom) + ')</small>.<br>' +
      'Les écarts ci-dessous sont calculés contre le <strong>stock actuel</strong> (au moment de cet aperçu), pas celui du début du comptage.</p>';
    h += '<h3 class="sc-h3">Pièces comptées <span class="badge badge-info" id="ap-nb-comptees">' + r.lignes.length + '</span></h3>';
    if (!r.lignes.length) { h += '<p class="text-muted">Aucune pièce n\'a été comptée.</p>'; }
    else {
      h += '<div class="table-responsive"><table class="table table-sm cp-apercu" id="ap-table"><thead><tr><th scope="col">Pièce</th><th scope="col" class="nombre">Compté</th><th scope="col" class="nombre">Stock actuel</th><th scope="col" class="nombre">Écart</th></tr></thead><tbody>';
      r.lignes.forEach(function (l) {
        h += '<tr data-piece="' + esc(l.piece_id) + '" class="' + (zero(l.ecart) ? 'text-muted' : '') + '"><td><span class="code">' + esc(l.code) + '</span> ' + esc(l.nom) + (l.actif ? '' : ' <span class="badge badge-danger">désactivée</span>') + '</td><td class="nombre">' + esc(w.fmtQte(l.quantite_comptee)) + '</td><td class="nombre">' + esc(w.fmtQte(l.quantite_actuelle)) + '</td><td class="nombre ' + classeEcart(l.ecart) + '">' + (zero(l.ecart) ? 'aucun' : esc(signe(l.ecart))) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '<div class="custom-control custom-checkbox my-3"><input type="checkbox" class="custom-control-input" id="ap-zero"><label class="custom-control-label" for="ap-zero">Mettre à 0 les pièces non scannées <span class="text-muted">(' + r.non_scannees.length + ' en stock dans cet emplacement)</span></label></div>';
    h += '<div id="ap-zero-zone" class="d-none"><p class="mb-1">Ces pièces seront remises à 0 :</p><div class="table-responsive"><table class="table table-sm cp-apercu" id="ap-table-zero"><thead><tr><th scope="col">Pièce</th><th scope="col" class="nombre">Stock actuel</th><th scope="col" class="nombre">Après</th></tr></thead><tbody>';
    r.non_scannees.forEach(function (l) {
      h += '<tr data-piece="' + esc(l.piece_id) + '"><td><span class="code">' + esc(l.code) + '</span> ' + esc(l.nom) + (l.actif ? '' : ' <span class="badge badge-danger">désactivée</span>') + '</td><td class="nombre">' + esc(w.fmtQte(l.quantite_actuelle)) + '</td><td class="nombre cp-ecart-neg">0</td></tr>';
    });
    h += '</tbody></table></div></div>';
    if (!r.non_scannees.length) { h = h.replace('id="ap-zero"', 'id="ap-zero" disabled'); }
    h += '<div id="ap-bilan" class="alert alert-info" role="status"></div><div id="ap-bloque" class="alert alert-danger d-none" role="alert"></div>';
    h += '<div class="custom-control custom-checkbox mb-2"><input type="checkbox" class="custom-control-input" id="ap-ok"><label class="custom-control-label" for="ap-ok">Je confirme que le stock de « ' + esc(r.comptage.emplacement_nom) + ' » sera modifié avec ces écarts.</label></div>';
    h += '<div id="ap-erreur" class="text-danger" role="alert"></div>';
    corps.innerHTML = h;
    if (reprise && reprise.zero && r.non_scannees.length) { qs('#ap-zero').checked = true; }
    recalculerApercu();
  }
  function recalculerApercu() {
    var r = ap.donnees, zeroOn = qs('#ap-zero').checked, ok = qs('#ap-ok').checked;
    var ecarts = r.lignes.filter(function (l) { return !zero(l.ecart); }).length + (zeroOn ? r.non_scannees.length : 0);
    var max = r.max_lignes || MAX_LIGNES_DEFAUT, nbDocs = Math.max(1, Math.ceil(ecarts / max));
    qs('#ap-zero-zone').classList.toggle('d-none', !zeroOn);
    var txt;
    if (!ecarts) { txt = 'Aucun écart : le stock correspond déjà au comptage. Aucun ajustement ne sera créé.'; }
    else if (nbDocs === 1) { txt = '<strong>' + ecarts + '</strong> ' + (ecarts > 1 ? 'pièces seront ajustées' : 'pièce sera ajustée') + ' : un seul document d\'ajustement sera créé.'; }
    else { txt = '<strong>' + ecarts + '</strong> pièces seront ajustées : <strong>' + nbDocs + ' documents d\'ajustement</strong> seront créés (' + max + ' pièces au plus chacun), tous ensemble ou aucun.'; }
    if (zeroOn && !r.lignes.length && r.non_scannees.length) { txt += '<br><strong>Attention : aucune pièce n\'a été comptée. TOUT le stock de cet emplacement sera remis à 0.</strong>'; }
    qs('#ap-bilan').innerHTML = txt;
    // Une pièce désactivée ne peut plus être ajustée à la hausse : on le dit avant, au lieu de laisser le serveur refuser
    var bloquees = r.lignes.filter(function (l) { return !l.actif && parseFloat(l.ecart) > 0; }).map(function (l) { return l.code; });
    var bl = qs('#ap-bloque');
    if (bloquees.length) { bl.classList.remove('d-none'); bl.textContent = 'La pièce « ' + bloquees.join(' », « ') + ' » est désactivée : son stock ne peut pas augmenter. Retirez-la du comptage, ou réactivez-la d\'abord.'; }
    else { bl.classList.add('d-none'); bl.textContent = ''; }
    bConfirmer.disabled = !ok || bloquees.length > 0;
    bConfirmer.textContent = ecarts ? 'Appliquer le comptage (' + ecarts + (ecarts > 1 ? ' ajustements)' : ' ajustement)') : 'Terminer le comptage (aucun écart)';
  }
  qs('#ap-corps').addEventListener('change', function (e) {
    // Changer la case « non scannées à 0 » change ce qui sera appliqué : la confirmation déjà donnée ne vaut plus, il faut confirmer de nouveau.
    if (e.target.id === 'ap-zero') { qs('#ap-ok').checked = false; recalculerApercu(); }
    else if (e.target.id === 'ap-ok') { recalculerApercu(); }
  });
  bConfirmer.addEventListener('click', function () {
    if (bConfirmer.disabled || !ap.donnees) { return; }
    bConfirmer.disabled = true;
    var zeroOn = qs('#ap-zero').checked;
    var empreinte = zeroOn ? ap.donnees.empreinte_zero : ap.donnees.empreinte;
    fileInactive().then(function () { return enSerie(function () { return w.api.post('app/action/comptage_appliquer.php', { id: ID, zero_non_scannees: zeroOn, empreinte: empreinte }); }); }).then(function (r) {
      $('#modal-appliquer').modal('hide');
      var docs = (r.documents && r.documents.length) ? r.documents : (r.document_id ? [{ id: r.document_id, numero: r.numero }] : []);
      var msg = docs.length
        ? 'Comptage appliqué : le stock a été ajusté (' + esc(r.ecarts) + (r.ecarts > 1 ? ' pièces' : ' pièce') + '). ' + (docs.length > 1 ? 'Ajustements ' : 'Ajustement ') +
          docs.map(function (x, i) { return '<a class="alert-link"' + (i === 0 ? ' id="lien-ajustement-resultat"' : '') + ' href="' + lien('document_voir', x.id) + '">' + esc(x.numero) + '</a>'; }).join(', ') + '.'
        : 'Comptage terminé : aucun écart, donc aucun ajustement n\'a été nécessaire.';
      alerte('success', msg);
      return charger(true, true);
    }).catch(function (err) {
      if (/termin/i.test(err.message)) { $('#modal-appliquer').modal('hide'); alerte('warning', 'Ce comptage est déjà terminé.'); charger(true); return; }
      if (err.champ === 'apercu') {
        // Le comptage ou le stock a changé depuis l'aperçu : on relit l'aperçu, la confirmation est à refaire
        chargerApercu({ zero: zeroOn, message: 'Le comptage ou le stock a changé depuis l\'aperçu (un autre écran ou un mouvement). Les écarts ci-dessous ont été recalculés : vérifiez-les, puis confirmez de nouveau.' });
        return;
      }
      qs('#ap-erreur').textContent = err.message;
      bConfirmer.disabled = false;
    });
  });
  $('#modal-appliquer').on('hidden.bs.modal', function () { if (fileScan && !etat.termine) { fileScan.focus(); } });

  // ---- démarrage
  demarrerSaisie();
  charger(false).then(function () { if (!etat.termine) { demarrerRafraichissement(); } });
})(window, jQuery);
