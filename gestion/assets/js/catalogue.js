/* Catalogue : pièces, fiche d'une pièce, modification, fournisseurs, catégories (module A1).
 * Un seul fichier ; la page est reconnue par l'attribut data-catalogue de sa racine :
 *   pieces | piece_voir | piece_edit | fournisseurs | categories
 * Règles : toute valeur insérée dans innerHTML passe par esc() ; les quantités et montants restent des chaînes décimales
 * (la conversion en nombre ne sert qu'à l'affichage) ; les boutons sont désactivés pendant l'envoi.
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-catalogue]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-catalogue');

  // ===================================================================================
  //  Utilitaires communs
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  /** Message d'erreur affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez.';
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  function nettoyer(s) { return String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim(); }

  function aujourdhui() {
    var d = new Date(), m = d.getMonth() + 1, j = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j;
  }

  /** "14.5000" -> "14,50" (au moins 2 décimales, zéros inutiles retirés au-delà) pour un champ de saisie. */
  function saisieMontant(s) {
    var p = String(s).split('.'), frac = (p[1] || '').replace(/0+$/, '');
    while (frac.length < 2) { frac += '0'; }
    return p[0] + ',' + frac;
  }

  // Session expirée pendant le chargement d'un tableau : retour à la connexion (comme api.get / api.post)
  $(document).ajaxError(function (e, xhr) { if (xhr && xhr.status === 401) { w.location.href = 'login.php'; } });

  // Erreur de chargement d'un tableau : message en français (le texte de DataTables est technique et en anglais)
  $.fn.dataTable.ext.errMode = function () { w.toast('Impossible de charger le tableau. Rechargez la page ou réessayez dans un instant.', 'danger'); };

  /** Tri français (accents et casse ignorés) pour les tableaux entièrement chargés dans le navigateur. */
  $.fn.dataTable.ext.type.order['fr-asc'] = function (a, b) { return String(a === null ? '' : a).localeCompare(String(b === null ? '' : b), 'fr', { sensitivity: 'base' }); };
  $.fn.dataTable.ext.type.order['fr-desc'] = function (a, b) { return -$.fn.dataTable.ext.type.order['fr-asc'](a, b); };

  /** Message d'erreur dans une zone .alert (ou toast si la zone n'existe pas). */
  function alerte(zone, texte) {
    if (!zone) { w.toast(texte, 'danger'); return; }
    zone.textContent = texte;
    zone.hidden = false;
  }

  function effacerErreurs(form) {
    qa('.is-invalid', form).forEach(function (e) { e.classList.remove('is-invalid'); });
    qa('[data-erreur-pour]', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
  }

  /** Boîte de confirmation (Promise<boolean>). Le message est inséré en texte, jamais en HTML. */
  var confirmationOuverte = false;
  function confirmer(titre, message, libelle, classe) {
    if (confirmationOuverte) { return Promise.resolve(false); }      // double clic : une seule boîte à la fois
    confirmationOuverte = true;
    return new Promise(function (resolve) {
      var m = document.getElementById('modal-confirmer');
      if (!m) {
        m = document.createElement('div');
        m.id = 'modal-confirmer';
        m.className = 'modal fade';
        m.tabIndex = -1;
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.setAttribute('aria-labelledby', 'modal-confirmer-titre');
        m.innerHTML = '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">' +
          '<div class="modal-header"><h5 class="modal-title" id="modal-confirmer-titre"></h5>' +
          '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>' +
          '<div class="modal-body"><p class="mb-0 cat-desc" id="modal-confirmer-message"></p></div>' +
          '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="modal-confirmer-non">Annuler</button>' +
          '<button type="button" class="btn cat-btn-danger" id="modal-confirmer-oui"></button></div></div></div>';
        document.body.appendChild(m);
      }
      q('#modal-confirmer-titre', m).textContent = titre;
      q('#modal-confirmer-message', m).textContent = message;
      var oui = q('#modal-confirmer-oui', m);
      oui.textContent = libelle || 'Confirmer';
      oui.className = 'btn ' + (classe || 'cat-btn-danger');
      var decision = false;
      oui.onclick = function () { decision = true; $(m).modal('hide'); };
      $(m).off('hidden.bs.modal.confirmer shown.bs.modal.confirmer')
        .on('shown.bs.modal.confirmer', function () { q('#modal-confirmer-non', m).focus(); })
        .one('hidden.bs.modal.confirmer', function () { confirmationOuverte = false; resolve(decision); });
      $(m).modal('show');
    });
  }

  /** Confirmation de désactivation d'une pièce : un seul message, avec le stock restant s'il y en a (vérifié côté serveur, sans rien changer). */
  function confirmerDesactivation(id, code) {
    return api.post('app/action/piece_activer.php', { id: id, actif: false, simuler: true }).then(function () {
      return confirmer('Désactiver la pièce ?', 'Désactiver « ' + code + ' » ? Elle n\'apparaîtra plus dans les listes de saisie ; son historique est conservé.', 'Désactiver', 'cat-btn-danger');
    }, function (err) {
      if (err.champ === 'confirmation') { return confirmer('Désactiver la pièce ?', err.message, 'Désactiver quand même', 'cat-btn-danger'); }
      throw err;
    });
  }

  /** Désactive les boutons le temps d'une requête ; les réactive seulement en cas d'échec (ou si garder === true). */
  function envoyer(boutons, requete, garder) {
    boutons.forEach(function (b) { if (b) { b.disabled = true; } });
    function libres() { boutons.forEach(function (b) { if (b) { b.disabled = false; } }); }
    return requete().then(function (r) { if (garder) { libres(); } return r; }, function (e) { libres(); throw e; });
  }

  // ===================================================================================
  //  Liste des pièces
  // ===================================================================================
  function initPieces() {
    var champRech = q('#recherche'), minuteur = null;
    var table = $('#table-pieces').DataTable({
      serverSide: true,
      processing: true,
      searching: true,
      search: { search: champRech.value.trim() },        // recherche reçue par l'adresse (?q=) : incluse dans la première requête
      order: [[1, 'asc']],
      dom: '<"row"<"col-sm-12"tr>><"row mt-2"<"col-sm-12 col-md-4"l><"col-sm-12 col-md-3"i><"col-sm-12 col-md-5"p>>',
      ajax: {
        url: 'app/ajax/pieces_data.php',
        type: 'POST',
        data: function (d) {
          d.categorie_id = q('#f-categorie').value;
          d.statut = q('#f-statut').value;
          d.avec_stock = q('#f-stock').checked ? 1 : 0;
        }
      },
      columns: [
        { data: 'code' },
        { data: 'nom' },
        { data: 'categorie', defaultContent: '' },
        { data: 'unite' },
        { data: 'quantite', className: 'nombre', render: function (v, type) { return type === 'display' ? w.fmtQte(v) : v; } },
        { data: 'statut', render: function (v, type) {
            if (type !== 'display') { return v; }
            return parseInt(v, 10) === 1 ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Désactivée</span>';
          } }
      ],
      language: $.extend({}, w.DT_LANG, {
        zeroRecords: 'Aucune pièce ne correspond à ces critères.',
        emptyTable: 'Aucune pièce dans le catalogue.'
      }),
      createdRow: function (tr) { tr.classList.add('cliquable'); }
    });

    // Un clic sur la ligne ouvre la fiche (zone de clic large pour la tablette)
    $('#table-pieces tbody').on('click', 'tr.cliquable', function (e) {
      if ($(e.target).closest('a, button, input').length) { return; }
      var a = this.querySelector('a.lien-fiche');
      if (a) { w.location.href = a.getAttribute('href'); }
    });

    ['#f-categorie', '#f-statut', '#f-stock'].forEach(function (s) {
      q(s).addEventListener('change', function () { table.draw(); });
    });

    // Recherche en tapant ; Entrée (lecteur de codes-barres) : un code exact ouvre directement la fiche
    function filtrer() { table.search(champRech.value.trim()).draw(); }
    champRech.addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(filtrer, 300); });
    champRech.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') { return; }
      e.preventDefault();
      clearTimeout(minuteur);
      var code = nettoyer(champRech.value);
      if (code === '') { filtrer(); return; }
      api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
        if (r.trouve && r.type === 'piece') {
          w.bip(true);
          w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(r.piece.id);
        } else if (r.trouve && r.type === 'emplacement') {
          w.bip(false);
          w.toast('« ' + code + ' » est le code de l\'emplacement « ' + r.emplacement.nom + ' », pas d\'une pièce.', 'warning');
          filtrer();
        } else {
          // code inconnu : on filtre quand même (c'est peut-être un bout de nom) ; si rien ne correspond, bip d'erreur et message clair
          table.one('draw', function () {
            if (table.page.info().recordsDisplay === 0) { w.bip(false); w.toast('Aucune pièce ne correspond à « ' + code + ' ».', 'warning'); }
          });
          filtrer();
        }
      }).catch(function (err) { w.toast(msg(err), 'danger'); filtrer(); });
    });
    if (!w.matchMedia || !w.matchMedia('(pointer: coarse)').matches) { champRech.focus(); }   // pas de clavier virtuel intempestif sur tablette
  }

  // ===================================================================================
  //  Fiche d'une pièce
  // ===================================================================================
  function initFiche() {
    var pieceId = racine.getAttribute('data-piece-id');
    var code = racine.getAttribute('data-piece-code');

    var btnAct = q('#btn-activer');
    if (btnAct) {
      btnAct.addEventListener('click', function () {
        var actif = btnAct.getAttribute('data-vers') === '1';
        var pid = parseInt(pieceId, 10);
        function appliquer() {
          return envoyer([btnAct], function () { return api.post('app/action/piece_activer.php', { id: pid, actif: actif, confirmer: true }); })
            .then(function () { w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(pieceId) + '&msg=' + (actif ? 'reactivee' : 'desactivee'); })
            .catch(function (err) { w.toast(msg(err), 'danger'); });
        }
        if (actif) { appliquer(); return; }
        btnAct.disabled = true;      // évite de lancer deux fois la vérification (double clic)
        confirmerDesactivation(pid, code).then(function (ok) { btnAct.disabled = false; if (ok) { appliquer(); } },
          function (err) { btnAct.disabled = false; w.toast(msg(err), 'danger'); });
      });
    }

    if (!q('#section-prix')) { return; }   // employé : aucune donnée de coût n'est même demandée

    var etat = null;

    function fmtEcart(e) {
      if (!e) { return '<span class="text-muted">—</span>'; }
      var n = parseFloat(e.ecart), p = Math.abs(parseFloat(e.pct));
      var cls = n < 0 ? 'cat-ecart-bon' : (n > 0 ? 'cat-ecart-mauvais' : '');
      var signe = n > 0 ? '+' : (n < 0 ? '−' : '');
      return '<span class="' + cls + '">' + signe + esc(w.fmtArgent(String(Math.abs(n)), 4)) + ' (' + signe + esc(String(p).replace('.', ',')) + ' %)</span>';
    }

    function rendre() {
      var cm = etat.couts.map(function (c) {
        return '<span class="mr-4 text-nowrap"><strong>' + esc(c.nom) + '</strong> : ' +
          (c.cout_moyen === null ? '<span class="text-muted">aucun coût connu</span>' : esc(w.fmtArgent(c.cout_moyen, 4))) + '</span>';
      }).join('');
      q('#couts-moyens').innerHTML = '<div class="mb-3"><span class="text-muted mr-2">Coût moyen :</span>' + (cm || '<span class="text-muted">—</span>') + '</div>';

      var zone = q('#prix-contenu');
      if (!etat.prix.length) {
        zone.innerHTML = '<p class="text-muted mb-0">Aucun prix de fournisseur enregistré pour cette pièce. Cliquez sur « Ajouter un prix ».</p>';
      } else {
        var h = '<table class="table table-sm cat-table mb-0" id="table-prix"><thead><tr><th scope="col">Fournisseur</th><th scope="col">N° fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Date</th>';
        etat.couts.forEach(function (c) { h += '<th scope="col" class="nombre">Écart vs coût moyen<br><small class="text-muted font-weight-normal">' + esc(c.nom) + '</small></th>'; });
        h += '<th scope="col" class="no-print"><span class="sr-only">Actions</span></th></tr></thead><tbody>';
        etat.prix.forEach(function (l) {
          h += '<tr data-fournisseur="' + esc(l.fournisseur_id) + '"><td>' + esc(l.fournisseur) +
            (l.actif ? '' : ' <span class="badge badge-secondary">Désactivé</span>') +
            (l.meilleur ? ' <span class="badge badge-success">Meilleur prix</span>' : '') +
            (l.note ? '<div class="small text-muted">' + esc(l.note) + '</div>' : '') + '</td>' +
            '<td class="code">' + esc(l.no_fournisseur || '') + '</td>' +
            '<td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + '</td>' +
            '<td class="text-nowrap">' + esc(l.date_prix) + '</td>';
          etat.couts.forEach(function (c) { h += '<td class="nombre">' + fmtEcart(l.ecarts[String(c.entreprise_id)]) + '</td>'; });
          h += '<td class="text-nowrap text-right no-print">' +
            '<button type="button" class="btn btn-outline-primary btn-sm mr-1" data-action="modifier-prix" data-fournisseur="' + esc(l.fournisseur_id) + '" title="Modifier le prix"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier le prix de ' + esc(l.fournisseur) + '</span></button>' +
            '<button type="button" class="btn btn-outline-danger btn-sm" data-action="supprimer-prix" data-fournisseur="' + esc(l.fournisseur_id) + '" title="Retirer le prix"><i class="fas fa-trash" aria-hidden="true"></i><span class="sr-only">Retirer le prix de ' + esc(l.fournisseur) + '</span></button>' +
            '</td></tr>';
        });
        zone.innerHTML = h + '</tbody></table>';
      }

      var hz = q('#hist-contenu');
      if (!etat.historique.length) {
        hz.innerHTML = '<p class="text-muted mb-0">Aucun changement de prix enregistré.</p>';
      } else {
        var t = '<div class="table-responsive"><table class="table table-sm cat-table mb-0" id="table-hist-prix"><thead><tr><th scope="col">Date</th><th scope="col">Fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Par</th></tr></thead><tbody>';
        etat.historique.forEach(function (l) {
          t += '<tr><td class="text-nowrap">' + esc(l.date_prix) + '</td><td>' + esc(l.fournisseur || '') + '</td><td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + '</td><td>' + esc(l.utilisateur || '') + '</td></tr>';
        });
        hz.innerHTML = t + '</tbody></table></div>';
      }
    }

    function charger() {
      return api.get('app/ajax/piece_prix.php', { piece_id: pieceId }).then(function (r) { etat = r; rendre(); })
        .catch(function (err) {
          var d = document.createElement('div'); d.className = 'alert alert-danger mb-0'; d.setAttribute('role', 'alert');
          d.textContent = 'Impossible de charger les prix : ' + msg(err);
          var z = q('#prix-contenu'); z.innerHTML = ''; z.appendChild(d);
        });
    }

    // ---- fenêtre d'ajout / modification d'un prix ------------------------------------------------
    var formPrix = q('#form-prix'), selFour = q('#prix-fournisseur'), zoneErr = q('#prix-erreur');
    var modeEdition = false;

    function ouvrirPrix(ligne) {
      effacerErreurs(formPrix);
      montrer(zoneErr, false);
      modeEdition = !!ligne;
      selFour.innerHTML = '';
      function option(id, nom) { var o = document.createElement('option'); o.value = String(id); o.textContent = nom; selFour.appendChild(o); }
      if (ligne) {
        option(ligne.fournisseur_id, ligne.fournisseur);
        selFour.disabled = true;
        q('#prix-montant').value = saisieMontant(ligne.prix);
        q('#prix-no').value = ligne.no_fournisseur || '';
        q('#prix-note').value = ligne.note || '';
        q('#modal-prix-titre').textContent = 'Modifier le prix — ' + ligne.fournisseur;
      } else {
        var deja = {};
        etat.prix.forEach(function (l) { deja[String(l.fournisseur_id)] = true; });
        var libres = etat.fournisseurs.filter(function (f) { return !deja[String(f.id)]; });
        if (!libres.length) {
          w.toast(etat.fournisseurs.length ? 'Tous les fournisseurs actifs ont déjà un prix pour cette pièce : modifiez un prix existant, ou créez d\'abord un fournisseur.' : 'Aucun fournisseur actif : créez d\'abord un fournisseur (menu Catalogue > Fournisseurs).', 'warning');
          return;
        }
        option('', '— Choisissez un fournisseur —');
        libres.forEach(function (f) { option(f.id, f.nom); });
        selFour.disabled = false;
        q('#prix-montant').value = '';
        q('#prix-no').value = '';
        q('#prix-note').value = '';
        q('#modal-prix-titre').textContent = 'Ajouter un prix';
      }
      var d = q('#prix-date'), auj = etat.aujourdhui || aujourdhui();      // date du serveur (le fuseau du poste peut différer)
      d.max = auj;
      d.value = auj;
      $('#modal-prix').off('shown.bs.modal.cat').one('shown.bs.modal.cat', function () { (ligne ? q('#prix-montant') : selFour).focus(); }).modal('show');
    }

    q('#btn-ajouter-prix').addEventListener('click', function () { if (etat) { ouvrirPrix(null); } });

    formPrix.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formPrix);
      montrer(zoneErr, false);
      var btn = q('#prix-enregistrer');
      var donnees = {
        piece_id: parseInt(pieceId, 10), fournisseur_id: parseInt(selFour.value, 10) || 0, prix: q('#prix-montant').value.trim(),
        no_fournisseur: q('#prix-no').value.trim(), date: q('#prix-date').value, note: q('#prix-note').value.trim()
      };
      envoyer([btn], function () { return api.post('app/action/prix_save.php', donnees); }, true)
        .then(function () {
          $('#modal-prix').modal('hide');
          w.toast(modeEdition ? 'Prix modifié.' : 'Prix ajouté.', 'success');
          return charger();
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          if (err.champ === 'fournisseur_id') { selFour.classList.add('is-invalid'); selFour.focus(); }
          else if (err.champ === 'prix') { q('#prix-montant').classList.add('is-invalid'); q('#prix-montant').focus(); }
          else if (err.champ === 'date') { q('#prix-date').classList.add('is-invalid'); q('#prix-date').focus(); }
        });
    });

    q('#prix-contenu').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-action]');
      if (!b || !etat) { return; }
      var fid = b.getAttribute('data-fournisseur');
      var ligne = etat.prix.filter(function (l) { return String(l.fournisseur_id) === fid; })[0];
      if (!ligne) { return; }
      if (b.getAttribute('data-action') === 'modifier-prix') { ouvrirPrix(ligne); return; }
      confirmer('Retirer ce prix ?', 'Retirer le prix de « ' + ligne.fournisseur + ' » pour la pièce « ' + code + ' » ? L\'historique des prix est conservé.', 'Retirer le prix', 'cat-btn-danger').then(function (ok) {
        if (!ok) { return; }
        envoyer([b], function () { return api.post('app/action/prix_supprimer.php', { piece_id: parseInt(pieceId, 10), fournisseur_id: parseInt(fid, 10) }); }, true)
          .then(function () { w.toast('Prix retiré.', 'success'); return charger(); })
          .catch(function (err) { w.toast(msg(err), 'danger'); charger(); });
      });
    });

    charger();
  }

  // ===================================================================================
  //  Création / modification d'une pièce
  // ===================================================================================
  function initEdit() {
    var form = q('#form-piece');
    var pieceId = parseInt(form.getAttribute('data-piece-id'), 10) || 0;
    var donnees = JSON.parse(q('#donnees-piece').textContent);
    var alias = (donnees.alias || []).map(function (a) { return { code: a.code, type: a.type }; });
    var NOMS_TYPE = { fabricant: 'Fabricant', fournisseur: 'Fournisseur', autre: 'Autre' };
    var zoneErr = q('#erreur-form');
    var champCode = q('#f-code'), champAlias = q('#f-alias');
    var enCours = false, confirmeDesactivation = false;
    var boutons = [q('#btn-enregistrer'), q('#btn-enregistrer-nouveau')];

    function erreurChamp(champ, texte) {
      var zone = q('[data-erreur-pour="' + champ + '"]', form);
      if (zone) { zone.textContent = texte; zone.hidden = false; }
      var el = form.querySelector('[name="' + champ + '"]');
      if (el) { el.classList.add('is-invalid'); }
    }
    function effacer(champ) {
      var zone = q('[data-erreur-pour="' + champ + '"]', form);
      if (zone) { zone.hidden = true; zone.textContent = ''; }
      var el = form.querySelector('[name="' + champ + '"]');
      if (el) { el.classList.remove('is-invalid'); }
    }

    // ---- code interne -------------------------------------------------------------------------
    champCode.addEventListener('input', function () {
      var a = champCode.selectionStart, b = champCode.selectionEnd;
      champCode.value = champCode.value.toUpperCase();
      try { champCode.setSelectionRange(a, b); } catch (e) { /* champ non texte */ }
      effacer('code');
    });
    champCode.addEventListener('blur', function () {
      var c = nettoyer(champCode.value);
      if (champCode.readOnly || c === '') { return; }
      api.get('app/ajax/piece_code_verifier.php', { code: c, role: 'interne', piece_id: pieceId })
        .then(function (r) { if (!r.disponible) { erreurChamp('code', r.message); } })
        .catch(function () { /* la vérification finale se fait à l'enregistrement */ });
    });
    var btnProp = q('#btn-proposer');
    if (btnProp) {
      btnProp.addEventListener('click', function () {
        envoyer([btnProp], function () { return api.get('app/ajax/piece_code_proposer.php'); }, true)
          .then(function (r) { champCode.value = r.code; effacer('code'); q('#f-nom').focus(); })
          .catch(function (err) { w.toast(msg(err), 'danger'); });
      });
    }
    ['nom', 'description', 'categorie_id', 'unite'].forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      if (el) { el.addEventListener('input', function () { effacer(n); }); el.addEventListener('change', function () { effacer(n); }); }
    });

    // ---- nouvelle catégorie sans quitter la page ---------------------------------------------------
    var blocCat = q('#bloc-nouvelle-categorie'), champNc = q('#nc-nom'), erreurNc = q('#nc-erreur');
    function ouvrirCat(oui) {
      montrer(blocCat, oui);
      montrer(erreurNc, false);
      if (oui) { champNc.value = ''; champNc.focus(); } else { q('#btn-nouvelle-categorie').focus(); }
    }
    q('#btn-nouvelle-categorie').addEventListener('click', function () { ouvrirCat(true); });
    q('#btn-annuler-categorie').addEventListener('click', function () { ouvrirCat(false); });
    function creerCategorie() {
      var nom = champNc.value.trim();
      if (nom === '') { alerte(erreurNc, 'Le nom de la catégorie est obligatoire.'); return; }
      montrer(erreurNc, false);
      var b = q('#btn-creer-categorie');
      envoyer([b], function () { return api.post('app/action/categorie_save.php', { nom: nom, description: '' }); }, true)
        .then(function (r) {
          var sel = q('#f-categorie');
          var o = document.createElement('option'); o.value = String(r.id); o.textContent = r.nom; sel.appendChild(o);
          sel.value = String(r.id);
          ouvrirCat(false);
          w.toast('Catégorie « ' + r.nom + ' » créée.', 'success');
        })
        .catch(function (err) { alerte(erreurNc, msg(err)); champNc.focus(); });
    }
    q('#btn-creer-categorie').addEventListener('click', creerCategorie);
    champNc.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); creerCategorie(); }
      else if (e.key === 'Escape') { e.preventDefault(); ouvrirCat(false); }
    });

    // ---- codes-barres alias ----------------------------------------------------------------------------
    function rendreAlias() {
      var ul = q('#liste-alias');
      ul.innerHTML = '';
      if (!alias.length) {
        var vide = document.createElement('li'); vide.className = 'text-muted'; vide.textContent = 'Aucun code-barres alias.'; ul.appendChild(vide); return;
      }
      alias.forEach(function (a, i) {
        var li = document.createElement('li');
        var badge = document.createElement('span'); badge.className = 'badge badge-info'; badge.textContent = NOMS_TYPE[a.type] || a.type;
        var c = document.createElement('span'); c.className = 'code'; c.textContent = a.code;
        var bt = document.createElement('button');
        bt.type = 'button'; bt.className = 'btn btn-outline-danger btn-sm';
        bt.setAttribute('aria-label', 'Retirer le code ' + a.code);
        bt.setAttribute('data-retirer', String(i));
        bt.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        bt.addEventListener('click', function () { alias.splice(i, 1); rendreAlias(); effacer('codes'); champAlias.focus(); });
        li.appendChild(badge); li.appendChild(document.createTextNode(' ')); li.appendChild(c); li.appendChild(bt);
        ul.appendChild(li);
      });
    }

    function ajouterAlias() {
      var code = nettoyer(champAlias.value);
      effacer('codes');
      if (code === '') { return Promise.resolve(false); }
      var cle = code.toLowerCase();
      if (alias.some(function (a) { return a.code.toLowerCase() === cle; })) {
        erreurChamp('codes', 'Le code « ' + code + ' » est déjà dans la liste.'); w.bip(false); return Promise.resolve(false);
      }
      if (code.toUpperCase() === nettoyer(champCode.value).toUpperCase()) {
        erreurChamp('codes', 'Le code « ' + code + ' » est déjà le code interne de cette pièce : il n\'a pas besoin d\'alias.'); w.bip(false); return Promise.resolve(false);
      }
      return envoyer([q('#btn-alias')], function () { return api.get('app/ajax/piece_code_verifier.php', { code: code, role: 'alias', piece_id: pieceId }); }, true)
        .then(function (r) {
          if (!r.disponible) { erreurChamp('codes', r.message); w.bip(false); champAlias.select(); return false; }
          alias.push({ code: r.code, type: q('#f-alias-type').value });
          champAlias.value = '';
          rendreAlias();
          w.bip(true);
          champAlias.focus();
          return true;
        })
        .catch(function (err) { erreurChamp('codes', msg(err)); w.bip(false); return false; });
    }
    q('#btn-alias').addEventListener('click', ajouterAlias);
    champAlias.addEventListener('keydown', function (e) {
      // le lecteur envoie Entrée (ou Tab) après le code : on l'ajoute sans envoyer le formulaire
      if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && nettoyer(champAlias.value) !== '')) { e.preventDefault(); ajouterAlias(); }
    });
    champAlias.addEventListener('input', function () { effacer('codes'); });
    rendreAlias();

    // ---- enregistrement ----------------------------------------------------------------------------------
    function charge() {
      var seuils = qa('.champ-seuil').map(function (i) {
        return { entreprise_id: parseInt(i.getAttribute('data-entreprise'), 10), minimum: i.value.trim() };
      });
      var d = {
        code: nettoyer(champCode.value), nom: q('#f-nom').value.trim(), description: q('#f-description').value,
        categorie_id: q('#f-categorie').value, unite: q('#f-unite').value.trim(),
        codes: alias.map(function (a) { return { code: a.code, type: a.type }; }), seuils: seuils
      };
      if (pieceId) { d.id = pieceId; d.actif = q('#f-actif').checked; d.confirmer_desactivation = confirmeDesactivation; }
      return d;
    }

    function enregistrer(mode) {
      if (enCours) { return; }
      effacerErreurs(form);
      montrer(zoneErr, false);
      if (nettoyer(champAlias.value) !== '') {
        erreurChamp('codes', 'Un code-barres est saisi mais n\'a pas été ajouté : cliquez sur « Ajouter » (ou effacez-le).');
        champAlias.focus();
        return;
      }
      enCours = true;
      envoyer(boutons, function () { return api.post('app/action/piece_save.php', charge()); })
        .then(function (r) {
          if (mode === 'nouvelle' && r.cree) { w.location.href = 'index.php?page=piece_edit&cree=' + encodeURIComponent(r.id); }
          else { w.location.href = 'index.php?page=piece_voir&id=' + encodeURIComponent(r.id) + '&msg=' + (r.cree ? 'cree' : 'modifie'); }
        })
        .catch(function (err) {
          enCours = false;
          if (err.champ === 'confirmation' && !confirmeDesactivation) {
            return confirmer('Désactiver la pièce ?', err.message, 'Désactiver quand même', 'cat-btn-danger').then(function (ok) {
              if (ok) { confirmeDesactivation = true; enregistrer(mode); }
              else { q('#f-actif').checked = true; }
            });
          }
          alerte(zoneErr, msg(err));
          if (err.champ) {
            var cible = err.champ === 'codes' ? 'codes' : err.champ;
            erreurChamp(cible, msg(err));
            var el = form.querySelector('[name="' + cible + '"]') || (cible === 'codes' ? champAlias : null) || (cible === 'seuils' ? q('.champ-seuil') : null);
            if (el && typeof el.focus === 'function') { el.focus(); }
          }
          zoneErr.scrollIntoView({ block: 'nearest' });
        });
    }
    // Décocher « active » sur une pièce active : confirmation (avec le stock restant) avant d'enregistrer
    var actifInitial = form.getAttribute('data-actif') === '1', verification = false;
    function demarrer(mode) {
      if (pieceId && actifInitial && !q('#f-actif').checked && !confirmeDesactivation && !enCours) {
        if (verification) { return; }
        verification = true;
        confirmerDesactivation(pieceId, form.getAttribute('data-piece-code') || nettoyer(champCode.value))
          .then(function (ok) { verification = false; if (ok) { confirmeDesactivation = true; enregistrer(mode); } else { q('#f-actif').checked = true; } },
            function (err) { verification = false; alerte(zoneErr, msg(err)); });
        return;
      }
      enregistrer(mode);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); demarrer('voir'); });
    var btnNouv = q('#btn-enregistrer-nouveau');
    if (btnNouv) { btnNouv.addEventListener('click', function () { demarrer('nouvelle'); }); }
    if (pieceId) {
      q('#f-actif').addEventListener('change', function () { confirmeDesactivation = false; });
    }

    if (!pieceId) { q('#f-code').focus(); } else { q('#f-nom').focus(); }
  }

  // ===================================================================================
  //  Fournisseurs
  // ===================================================================================
  function initFournisseurs() {
    var formF = q('#form-fournisseur'), zoneErr = q('#fournisseur-erreur');
    var idEdition = 0;

    var table = $('#table-fournisseurs').DataTable({
      ajax: {
        url: 'app/ajax/fournisseur_liste.php',
        data: function (d) { d.statut = q('#f-statut').value; },
        dataSrc: 'fournisseurs'
      },
      order: [[0, 'asc']],
      columns: [
        { data: 'nom', type: 'fr', render: function (v, type, row) {
            if (type !== 'display') { return v; }
            return '<a href="#" class="font-weight-bold" data-action="prix" title="Voir les prix de ce fournisseur">' + esc(v) + '</a>';
          } },
        { data: 'contact', type: 'fr', defaultContent: '', render: function (v, t) { return t === 'display' ? esc(v) : (v || ''); } },
        { data: 'telephone', defaultContent: '', className: 'text-nowrap', render: function (v, t) { return t === 'display' ? esc(v) : (v || ''); } },
        { data: 'courriel', defaultContent: '', render: function (v, t) { return t === 'display' ? esc(v) : (v || ''); } },
        { data: 'nb_prix', className: 'nombre' },
        { data: 'actif', render: function (v, t) {
            if (t !== 'display') { return v ? 1 : 0; }
            return v ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-secondary">Désactivé</span>';
          } },
        { data: null, orderable: false, searchable: false, className: 'text-nowrap text-right no-print', render: function (v, t, row) {
            return '<button type="button" class="btn btn-outline-primary btn-sm mr-1" data-action="modifier" title="Modifier"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier ' + esc(row.nom) + '</span></button>' +
              '<button type="button" class="btn ' + (row.actif ? 'btn-outline-danger' : 'btn-outline-success') + ' btn-sm" data-action="activer" title="' + (row.actif ? 'Désactiver' : 'Réactiver') + '"><i class="fas ' + (row.actif ? 'fa-ban' : 'fa-undo') + '" aria-hidden="true"></i><span class="sr-only">' + (row.actif ? 'Désactiver ' : 'Réactiver ') + esc(row.nom) + '</span></button>';
          } }
      ],
      language: $.extend({}, w.DT_LANG, { zeroRecords: 'Aucun fournisseur ne correspond.', emptyTable: 'Aucun fournisseur. Cliquez sur « Nouveau fournisseur » pour commencer.', search: 'Rechercher :' }),
      createdRow: function (tr) { tr.classList.add('cliquable'); }
    });
    q('#f-statut').addEventListener('change', function () { table.ajax.reload(); });

    // ---- création / modification ------------------------------------------------------------------------
    function ouvrir(f) {
      effacerErreurs(formF);
      montrer(zoneErr, false);
      idEdition = f ? f.id : 0;
      q('#modal-fournisseur-titre').textContent = f ? 'Modifier le fournisseur' : 'Nouveau fournisseur';
      q('#fo-nom').value = f ? f.nom : '';
      q('#fo-contact').value = f ? (f.contact || '') : '';
      q('#fo-telephone').value = f ? (f.telephone || '') : '';
      q('#fo-courriel').value = f ? (f.courriel || '') : '';
      q('#fo-adresse').value = f ? (f.adresse || '') : '';
      q('#fo-notes').value = f ? (f.notes || '') : '';
      $('#modal-fournisseur').off('shown.bs.modal.cat').one('shown.bs.modal.cat', function () { q('#fo-nom').focus(); }).modal('show');
    }
    q('#btn-nouveau').addEventListener('click', function () { ouvrir(null); });

    formF.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formF);
      montrer(zoneErr, false);
      var d = {
        id: idEdition, nom: q('#fo-nom').value.trim(), contact: q('#fo-contact').value.trim(), telephone: q('#fo-telephone').value.trim(),
        courriel: q('#fo-courriel').value.trim(), adresse: q('#fo-adresse').value.trim(), notes: q('#fo-notes').value
      };
      envoyer([q('#fournisseur-enregistrer')], function () { return api.post('app/action/fournisseur_save.php', d); }, true)
        .then(function (r) {
          $('#modal-fournisseur').modal('hide');
          w.toast(r.cree ? 'Fournisseur créé.' : 'Fournisseur modifié.', 'success');
          table.ajax.reload(null, false);
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          var map = { nom: '#fo-nom', courriel: '#fo-courriel', contact: '#fo-contact', telephone: '#fo-telephone', adresse: '#fo-adresse', notes: '#fo-notes' };
          if (err.champ && map[err.champ]) { q(map[err.champ]).classList.add('is-invalid'); q(map[err.champ]).focus(); }
        });
    });

    // ---- prix de ce fournisseur ----------------------------------------------------------------------------
    function voirPrix(f) {
      var zone = q('#prix-fournisseur-contenu');
      q('#modal-prix-fournisseur-titre').textContent = 'Prix de ce fournisseur — ' + f.nom;
      zone.innerHTML = '<span class="text-muted">Chargement…</span>';
      $('#modal-prix-fournisseur').modal('show');
      api.get('app/ajax/fournisseur_prix.php', { id: f.id }).then(function (r) {
        if (!r.prix.length) { zone.innerHTML = '<p class="mb-0 text-muted">Aucun prix enregistré pour ce fournisseur. Les prix s\'ajoutent depuis la fiche d\'une pièce.</p>'; return; }
        var h = '<div class="table-responsive"><table class="table table-sm cat-table mb-0" id="table-prix-fournisseur"><thead><tr><th scope="col">Pièce</th><th scope="col">N° fournisseur</th><th scope="col" class="nombre">Prix</th><th scope="col">Date</th></tr></thead><tbody>';
        r.prix.forEach(function (l) {
          h += '<tr><td><a class="code" href="index.php?page=piece_voir&amp;id=' + esc(l.piece_id) + '">' + esc(l.code) + '</a> ' + esc(l.nom) +
            (l.actif ? '' : ' <span class="badge badge-secondary">Désactivée</span>') + '</td><td class="code">' + esc(l.no_fournisseur || '') + '</td>' +
            '<td class="nombre">' + esc(w.fmtArgent(l.prix, 4)) + ' <small class="text-muted">/ ' + esc(l.unite) + '</small></td><td class="text-nowrap">' + esc(l.date_prix) + '</td></tr>';
        });
        zone.innerHTML = h + '</tbody></table></div>';
      }).catch(function (err) {
        var d = document.createElement('div'); d.className = 'alert alert-danger mb-0'; d.setAttribute('role', 'alert'); d.textContent = msg(err);
        zone.innerHTML = ''; zone.appendChild(d);
      });
    }

    $('#table-fournisseurs tbody').on('click', 'tr', function (e) {
      var ligne = table.row(this).data();
      if (!ligne) { return; }
      var b = $(e.target).closest('button[data-action]')[0];
      if (b) {
        var action = b.getAttribute('data-action');
        if (action === 'modifier') { ouvrir(ligne); }
        else if (action === 'activer') {
          var activer = !ligne.actif;
          var go = activer ? Promise.resolve(true) : confirmer('Désactiver le fournisseur ?', 'Désactiver « ' + ligne.nom + ' » ? Il n\'apparaîtra plus dans les listes de saisie ; ses prix et son historique sont conservés.', 'Désactiver', 'cat-btn-danger');
          go.then(function (ok) {
            if (!ok) { return; }
            envoyer([b], function () { return api.post('app/action/fournisseur_activer.php', { id: ligne.id, actif: activer }); }, true)
              .then(function () { w.toast(activer ? 'Fournisseur réactivé.' : 'Fournisseur désactivé.', 'success'); table.ajax.reload(null, false); })
              .catch(function (err) { w.toast(msg(err), 'danger'); });
          });
        }
        return;
      }
      if ($(e.target).closest('a, input').length && !$(e.target).closest('a[data-action="prix"]').length) { return; }
      e.preventDefault();
      voirPrix(ligne);
    });
  }

  // ===================================================================================
  //  Catégories
  // ===================================================================================
  function initCategories() {
    var formC = q('#form-categorie'), zoneErr = q('#categorie-erreur');
    var idEdition = 0;

    var table = $('#table-categories').DataTable({
      ajax: { url: 'app/ajax/categorie_liste.php', dataSrc: 'categories' },
      order: [[0, 'asc']],
      columns: [
        { data: 'nom', type: 'fr', render: function (v, t) { return t === 'display' ? esc(v) : v; } },
        { data: 'description', type: 'fr', defaultContent: '', render: function (v, t) { return t === 'display' ? esc(v) : (v || ''); } },
        { data: 'nb_pieces', className: 'nombre', render: function (v, t, row) {
            if (t !== 'display') { return v; }
            return v > 0 ? '<a href="index.php?page=pieces&amp;statut=toutes&amp;categorie_id=' + esc(row.id) + '" title="Voir ces pièces">' + esc(v) + '</a>' : '0';
          } },
        { data: null, orderable: false, searchable: false, className: 'text-nowrap text-right no-print', render: function (v, t, row) {
            return '<button type="button" class="btn btn-outline-primary btn-sm mr-1" data-action="modifier" title="Modifier"><i class="fas fa-pen" aria-hidden="true"></i><span class="sr-only">Modifier ' + esc(row.nom) + '</span></button>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="supprimer" title="Supprimer"><i class="fas fa-trash" aria-hidden="true"></i><span class="sr-only">Supprimer ' + esc(row.nom) + '</span></button>';
          } }
      ],
      language: $.extend({}, w.DT_LANG, { zeroRecords: 'Aucune catégorie ne correspond.', emptyTable: 'Aucune catégorie. Cliquez sur « Nouvelle catégorie » pour commencer.' })
    });

    function ouvrir(c) {
      effacerErreurs(formC);
      montrer(zoneErr, false);
      idEdition = c ? c.id : 0;
      q('#modal-categorie-titre').textContent = c ? 'Modifier la catégorie' : 'Nouvelle catégorie';
      q('#ca-nom').value = c ? c.nom : '';
      q('#ca-description').value = c ? (c.description || '') : '';
      $('#modal-categorie').off('shown.bs.modal.cat').one('shown.bs.modal.cat', function () { q('#ca-nom').focus(); }).modal('show');
    }
    q('#btn-nouvelle').addEventListener('click', function () { ouvrir(null); });

    formC.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(formC);
      montrer(zoneErr, false);
      var d = { id: idEdition, nom: q('#ca-nom').value.trim(), description: q('#ca-description').value.trim() };
      envoyer([q('#categorie-enregistrer')], function () { return api.post('app/action/categorie_save.php', d); }, true)
        .then(function (r) {
          $('#modal-categorie').modal('hide');
          w.toast(r.cree ? 'Catégorie créée.' : 'Catégorie modifiée.', 'success');
          table.ajax.reload(null, false);
        })
        .catch(function (err) {
          alerte(zoneErr, msg(err));
          if (err.champ === 'nom') { q('#ca-nom').classList.add('is-invalid'); q('#ca-nom').focus(); }
        });
    });

    $('#table-categories tbody').on('click', 'button[data-action]', function () {
      var b = this, ligne = table.row($(b).closest('tr')).data();
      if (!ligne) { return; }
      if (b.getAttribute('data-action') === 'modifier') { ouvrir(ligne); return; }
      if (ligne.nb_pieces > 0) {
        w.toast('Impossible de supprimer la catégorie « ' + ligne.nom + ' » : ' + (ligne.nb_pieces === 1 ? '1 pièce l\'utilise encore' : ligne.nb_pieces + ' pièces l\'utilisent encore') + '. Changez d\'abord la catégorie de ' + (ligne.nb_pieces === 1 ? 'cette pièce' : 'ces pièces') + '.', 'warning');
        return;
      }
      confirmer('Supprimer la catégorie ?', 'Supprimer définitivement la catégorie « ' + ligne.nom + ' » ? Aucune pièce ne l\'utilise.', 'Supprimer', 'cat-btn-danger').then(function (ok) {
        if (!ok) { return; }
        envoyer([b], function () { return api.post('app/action/categorie_supprimer.php', { id: ligne.id }); }, true)
          .then(function () { w.toast('Catégorie supprimée.', 'success'); table.ajax.reload(null, false); })
          .catch(function (err) { w.toast(msg(err), 'danger'); table.ajax.reload(null, false); });
      });
    });
  }

  // ===================================================================================
  var INIT = { pieces: initPieces, piece_voir: initFiche, piece_edit: initEdit, fournisseurs: initFournisseurs, categories: initCategories };
  if (INIT[page]) { $(function () { INIT[page](); }); }
})(window, jQuery);
