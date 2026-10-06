/* Administration : utilisateurs, entreprises, emplacements, journal, profil, sauvegarde (module E).
 * Un seul fichier ; la page est reconnue par l'attribut data-admin de sa racine :
 *   utilisateurs | entreprises | emplacements | journal | profil | sauvegarde
 * Règles : toute valeur insérée dans innerHTML passe par esc() (les tableaux serveur arrivent déjà échappés par DataTable::repondre,
 * on ne les échappe donc pas une seconde fois) ; les valeurs des champs se posent avec .value / .textContent ; les boutons sont
 * désactivés pendant l'envoi ; un mot de passe n'est conservé nulle part (champ vidé à la fermeture, rien dans le stockage du navigateur).
 */
(function (w, $) {
  'use strict';

  var racine = document.querySelector('[data-admin]');
  if (!racine) { return; }
  var page = racine.getAttribute('data-admin');
  // Titre de l'onglet = titre de la page (« Utilisateurs — Beauchemin ») : on distingue les onglets ouverts et un lecteur d'écran annonce la page
  var titrePage = document.querySelector('.content-header h1');
  if (titrePage && titrePage.textContent.trim()) { document.title = titrePage.textContent.trim() + ' — Beauchemin'; }

  // ===================================================================================
  //  Utilitaires communs
  // ===================================================================================
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function montrer(el, oui) { if (el) { el.hidden = !oui; } }
  /** Message d'erreur affichable : jamais de texte technique anglais (réseau coupé : « Failed to fetch »). */
  function msg(err) {
    var m = (err && err.message) ? String(err.message) : '';
    if (err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Connexion au serveur impossible. Vérifiez le réseau, puis réessayez.';
    }
    if (/contactez l.administrateur/i.test(m)) {
      return 'Erreur inattendue. Réessayez ; si elle persiste, consultez le journal d\'erreurs du serveur.';      // ces écrans sont réservés à l'administrateur : inutile de lui dire de s'adresser à lui-même
    }
    return m || 'Erreur inattendue. Réessayez.';
  }
  var _ta = document.createElement('textarea');
  /** Texte brut d'une chaîne HTML déjà échappée par le serveur (&lt; devient <) : pour textContent / value seulement. */
  function decoder(html) { _ta.innerHTML = String(html === null || html === undefined ? '' : html); return _ta.value; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function aujourdhui() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Session expirée pendant le chargement d'un tableau : retour à la connexion (comme api.get / api.post)
  $(document).ajaxError(function (e, xhr) { if (xhr && xhr.status === 401) { w.location.href = 'login.php'; } });
  // (Le message d'erreur de chargement d'un tableau est affiché une seule fois, par app.js ; ici on signale en plus l'échec dans le tableau.)

  var DOM = '<"row"<"col-sm-12"tr>><"row mt-2"<"col-sm-12 col-md-4"l><"col-sm-12 col-md-3"i><"col-sm-12 col-md-5"p>>';

  /** Tableau serveur standard (la recherche passe par le champ #f-recherche de la page). */
  function creerTable(sel, ajaxUrl, filtres, colonnes, ordre, vide, apresLigne) {
    var t = $(sel).DataTable({
      serverSide: true, processing: true, searching: true, order: ordre, dom: DOM,
      ajax: { url: ajaxUrl, type: 'POST', data: function (d) { filtres(d); } },
      columns: colonnes,
      language: $.extend({}, w.DT_LANG, { zeroRecords: vide[0], emptyTable: vide[1] }),
      createdRow: function (tr, data) { if (apresLigne) { apresLigne(tr, data); } }
    });
    // Échec de chargement : les anciennes lignes ne doivent pas rester là comme si de rien n'était
    $(sel).on('error.dt', function () {
      var corps = $(sel).find('tbody');
      corps.empty().append($('<tr class="adm-erreur-chargement"></tr>').append(
        $('<td class="text-center text-danger"></td>').attr('colspan', colonnes.length).text('Chargement impossible. Réessayez dans un instant.')));
      $(sel + '_processing').hide();
    });
    return t;
  }

  /**
   * Recherche en tapant (anti-rebond). Entrée filtre tout de suite et SÉLECTIONNE le texte : le scan suivant remplace le précédent au lieu de s'y ajouter.
   * opts.scan : champ qui sert aussi à scanner un code-barres (focus au chargement, bip et message si rien ne correspond).
   */
  function brancherRecherche(table, opts) {
    var champ = q('#f-recherche'), minuteur = null;
    if (!champ) { return; }
    opts = opts || {};
    function filtrer() { table.search(champ.value.trim()).draw(); }
    champ.addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(filtrer, 300); });
    champ.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') { return; }
      e.preventDefault();
      clearTimeout(minuteur);
      var texte = champ.value.trim();
      if (opts.scan && texte !== '') {
        $(table.table().node()).one('draw.dt', function () {
          var trouve = table.page.info().recordsDisplay > 0;
          w.bip(trouve);
          if (!trouve) { w.toast('Aucun résultat pour « ' + texte + ' ».', 'warning'); }
        });
      }
      filtrer();
      champ.select();
    });
    if (opts.scan) { champ.focus(); }      // un code tapé par le lecteur sans clic préalable n'est pas perdu
  }

  /** Désactive les boutons le temps d'une requête ; les réactive en cas d'échec (ou si garder === true). */
  function envoyer(boutons, requete, garder) {
    boutons.forEach(function (b) { if (b) { b.disabled = true; } });
    function libres() { boutons.forEach(function (b) { if (b) { b.disabled = false; } }); }
    return requete().then(function (r) { if (garder) { libres(); } return r; }, function (e) { libres(); throw e; });
  }

  function effacerErreurs(form) {
    qa('.is-invalid', form).forEach(function (e) {
      e.classList.remove('is-invalid');
      e.removeAttribute('aria-invalid');
      var d = (e.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x.indexOf('err-') !== 0; }).join(' ');
      if (d) { e.setAttribute('aria-describedby', d); } else { e.removeAttribute('aria-describedby'); }
    });
    qa('[data-erreur-pour]', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
    qa('.alert-danger[role="alert"]', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
  }

  /** Pose un message sous un champ : le champ est signalé (is-invalid, aria-invalid) et relié au message (aria-describedby) pour les lecteurs d'écran. */
  function poserErreurChamp(form, champ, message) {
    var cible = q('[data-erreur-pour="' + champ + '"]', form);
    if (!cible) { return null; }
    var f = q('[name="' + champ + '"]', form);
    cible.id = cible.id || ('err-' + (form.id || 'form') + '-' + champ);
    cible.setAttribute('role', 'alert');
    cible.textContent = message;
    cible.hidden = false;
    if (f) {
      f.classList.add('is-invalid');
      f.setAttribute('aria-invalid', 'true');
      var d = (f.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (d.indexOf(cible.id) === -1) { d.push(cible.id); }
      f.setAttribute('aria-describedby', d.join(' '));
    }
    return f;
  }

  /**
   * Erreur du serveur : sous le champ fautif (err.champ) s'il existe, sinon dans la zone d'alerte du formulaire.
   * lien = {href, texte} : ajoute un lien (ex. voir le stock restant) à la zone d'alerte.
   */
  function afficherErreur(form, zone, err, lien) {
    var champ = (err && err.champ && /^[a-z_]+$/.test(err.champ)) ? err.champ : null;
    var f = champ ? poserErreurChamp(form, champ, msg(err)) : null;
    if (champ && q('[data-erreur-pour="' + champ + '"]', form)) {
      if (f && !f.disabled && f.focus) { f.focus(); }
      return;
    }
    zone.textContent = msg(err);
    if (lien && err && err.champ === 'stock') {
      zone.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = lien.href; a.className = 'alert-link'; a.textContent = lien.texte;
      zone.appendChild(a);
    }
    zone.hidden = false;
  }

  /** Plusieurs erreurs de champs d'un coup (contrôle avant envoi) : [{champ, message}] ; le focus va au premier champ fautif. Retourne vrai s'il y en avait. */
  function afficherErreurs(form, liste) {
    var premier = null;
    liste.forEach(function (x) {
      var f = poserErreurChamp(form, x.champ, x.message);
      if (f && !premier) { premier = f; }
    });
    if (premier && !premier.disabled && premier.focus) { premier.focus(); }
    return liste.length > 0;
  }

  /** Un bouton « Enregistrer » reste bloqué après un succès (pas de double envoi pendant la fermeture) : on le libère à la réouverture. */
  function libererALOuverture(modal) {
    $(modal).on('show.bs.modal', function () { qa('button[type="submit"]', modal).forEach(function (b) { b.disabled = false; }); });
  }

  // ---- Boîtes de dialogue (construites une seule fois) ---------------------------------------------------------------
  var confirmationOuverte = false;
  function dialogue(id, html) {
    var m = document.getElementById(id);
    if (!m) {
      m = document.createElement('div');
      m.id = id; m.className = 'modal fade'; m.tabIndex = -1;
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', id + '-titre');
      m.innerHTML = html;
      document.body.appendChild(m);
    }
    return m;
  }

  /** Confirmation (Promise<boolean>). Le message est inséré en texte, jamais en HTML. */
  function confirmer(titre, message, libelle, classe) {
    if (confirmationOuverte) { return Promise.resolve(false); }      // double clic : une seule boîte à la fois
    confirmationOuverte = true;
    return new Promise(function (resolve) {
      var m = dialogue('modal-confirmer',
        '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">' +
        '<div class="modal-header"><h5 class="modal-title" id="modal-confirmer-titre"></h5>' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>' +
        '<div class="modal-body"><p class="mb-0" id="modal-confirmer-message"></p></div>' +
        '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="modal-confirmer-non">Annuler</button>' +
        '<button type="button" class="btn" id="modal-confirmer-oui"></button></div></div></div>');
      q('#modal-confirmer-titre', m).textContent = titre;
      q('#modal-confirmer-message', m).textContent = message;
      var oui = q('#modal-confirmer-oui', m);
      oui.textContent = libelle || 'Confirmer';
      oui.className = 'btn ' + (classe || 'adm-btn-danger');
      var decision = false, ouvreur = document.activeElement;
      oui.onclick = function () { decision = true; $(m).modal('hide'); };
      $(m).off('hidden.bs.modal.confirmer shown.bs.modal.confirmer')
        .on('shown.bs.modal.confirmer', function () { q('#modal-confirmer-non', m).focus(); })
        .one('hidden.bs.modal.confirmer', function () {
          confirmationOuverte = false;
          if (ouvreur && document.body.contains(ouvreur) && ouvreur.offsetParent !== null) { ouvreur.focus(); }
          resolve(decision);
        });
      $(m).modal('show');
    });
  }

  /** Refus expliqué, avec un lien utile (ex. voir le stock qui reste). */
  function refuser(titre, message, href, texteLien) {
    var m = dialogue('modal-refus',
      '<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title" id="modal-refus-titre"></h5>' +
      '<button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>' +
      '<div class="modal-body"><p class="mb-0" id="modal-refus-message"></p></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Fermer</button>' +
      '<a class="btn btn-primary" id="modal-refus-lien" href="#"></a></div></div></div>');
    q('#modal-refus-titre', m).textContent = titre;
    q('#modal-refus-message', m).textContent = message;
    var a = q('#modal-refus-lien', m);
    a.hidden = !href;
    if (href) { a.href = href; a.textContent = texteLien; }
    var ouvreur = document.activeElement;
    $(m).off('hidden.bs.modal.refus').one('hidden.bs.modal.refus', function () {
      if (ouvreur && document.body.contains(ouvreur) && ouvreur.offsetParent !== null) { ouvreur.focus(); }
    });
    $(m).modal('show');
  }

  // ---- Copier / générer un mot de passe --------------------------------------------------------------------------------
  function copierTexte(texte) {
    function secours() {
      var hote = document.querySelector('.modal.show') || document.body;      // dans le dialogue ouvert : sinon le focus lui est volé
      var ta = document.createElement('textarea');
      ta.value = texte; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      hote.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && w.isSecureContext) {
      return navigator.clipboard.writeText(texte).then(function () { return true; }, function () { return secours(); });
    }
    return Promise.resolve(secours());
  }
  function copierChamp(champ, boutonLibelle) {
    if (!champ.value) { w.toast('Il n\'y a rien à copier.', 'warning'); return; }
    copierTexte(champ.value).then(function (ok) {
      if (ok) { w.toast('Copié dans le presse-papiers.', 'success', 2500); }
      else { champ.type = 'text'; champ.focus(); champ.select(); w.toast('Copie automatique impossible : le texte est sélectionné, faites Ctrl+C.', 'warning'); }
    });
  }

  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';   // sans 0/O, 1/l/I : lisible à voix haute
  /** Mot de passe aléatoire (16 caractères, 4 groupes), tiré avec le générateur cryptographique du navigateur. */
  function genererMotDePasse() {
    if (!w.crypto || !w.crypto.getRandomValues) { w.toast('Ce navigateur ne peut pas générer de mot de passe. Saisissez-en un.', 'danger'); return ''; }
    var max = 256 - (256 % ALPHABET.length), buf = new Uint8Array(64), out = '';
    while (out.length < 16) {
      w.crypto.getRandomValues(buf);
      for (var i = 0; i < buf.length && out.length < 16; i++) { if (buf[i] < max) { out += ALPHABET.charAt(buf[i] % ALPHABET.length); } }
    }
    return out.slice(0, 4) + '-' + out.slice(4, 8) + '-' + out.slice(8, 12) + '-' + out.slice(12, 16);
  }

  function badgeActif(v) {
    return parseInt(v, 10) === 1 ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-secondary">Désactivé</span>';
  }
  /**
   * Bouton d'action d'une ligne : icône ET texte visible (une infobulle n'existe pas au toucher). L'étiquette lue par un lecteur d'écran
   * commence par le texte visible et nomme la cible (« Modifier jean »). nomCible : texte déjà échappé par le serveur (décodé puis échappé une seule fois).
   */
  function bouton(action, id, icone, libelle, titre, nomCible, classe) {
    return '<button type="button" class="btn btn-sm adm-btn-ligne ' + classe + '" data-action="' + action + '" data-id="' + esc(id) + '" title="' + esc(titre) + '" aria-label="' + esc(titre + ' : ' + decoder(nomCible)) + '">' +
      '<i class="fas ' + icone + '" aria-hidden="true"></i><span>' + esc(libelle) + '</span></button>';
  }
  function actionsLigne(html) { return '<div class="adm-actions-ligne">' + html + '</div>'; }

  /**
   * Redessin du tableau APRÈS une action sur une ligne : le bouton qui avait le focus est remplacé par le redessin, le focus tomberait sur la page.
   * Renvoie rafraichir(bouton) : redessine la page courante du tableau puis redonne le focus au bouton de même ligne (même action, sinon le premier),
   * sinon au bouton « Nouveau… ». Si le focus est ailleurs (une fenêtre ouverte, un champ), il n'est pas déplacé.
   */
  function suivreFocusLigne(table) {
    var memo = null;
    table.on('draw', function () {
      if (!memo) { return; }
      if ((Date.now() - memo.t) > 120000) { memo = null; return; }
      var a = document.activeElement;
      if (a && a !== document.body && document.body.contains(a)) { return; }      // le focus est bien placé : on garde la mémoire pour le redessin qui suit l'action
      var m = memo; memo = null;
      var corps = table.table().body(), b = null;
      if (m.id) {
        b = corps.querySelector('[data-action="' + m.action + '"][data-id="' + m.id + '"]') || corps.querySelector('button[data-id="' + m.id + '"], a[data-id="' + m.id + '"]');
      }
      b = b || q('#btn-nouveau');
      if (b) { b.focus(); }
    });
    return function (bouton) {
      memo = { t: Date.now(), id: bouton ? bouton.getAttribute('data-id') : null, action: bouton ? bouton.getAttribute('data-action') : null };
      table.draw(false);
    };
  }

  /**
   * Une fenêtre qui se ferme rend le focus à ce qui l'a ouverte (sinon il tombe sur la page et Échap ne ferme plus rien).
   * Si ce bouton a été remplacé entre-temps (le tableau s'est redessiné), on retrouve celui de la même ligne, sinon « Nouveau… ».
   */
  function rendreLeFocus(modal) {
    var ouvreur = null, cle = null;
    $(modal).on('show.bs.modal', function () {
      ouvreur = document.activeElement;
      cle = (ouvreur && ouvreur.getAttribute && ouvreur.getAttribute('data-id')) ? { a: ouvreur.getAttribute('data-action'), i: ouvreur.getAttribute('data-id') } : null;
    });
    $(modal).on('hidden.bs.modal', function () {
      var o = ouvreur, k = cle; ouvreur = null; cle = null;
      if (o && document.body.contains(o) && o.offsetParent !== null) { o.focus(); return; }
      var b = null;
      if (k) { b = q('.adm-table [data-action="' + k.a + '"][data-id="' + k.i + '"]') || q('.adm-table [data-id="' + k.i + '"]'); }
      b = b || q('#btn-nouveau');
      if (b) { b.focus(); }
    });
  }

  // ===================================================================================
  //  Utilisateurs
  // ===================================================================================
  function initUtilisateurs() {
    var ROLES = { admin: 'Administrateur', gestionnaire: 'Gestionnaire', employe: 'Employé' };
    var form = q('#form-utilisateur'), modal = q('#modal-utilisateur'), zone = q('#utilisateur-erreur');
    libererALOuverture(modal);
    var champMdp = q('#u-mdp');
    var etat = { id: 0, soi: false };

    var table = creerTable('#table-utilisateurs', 'app/ajax/utilisateurs_data.php',
      function (d) { d.statut = q('#f-statut').value; },
      [
        // Quatre colonnes seulement (le tableau doit tenir dans 694 px sur une tablette) : l'identité, le rôle et les entreprises, l'état, les actions
        { data: 'nom_utilisateur', render: function (v, t, row) {
            return t === 'display' ? '<strong>' + v + '</strong>' + (parseInt(row.soi, 10) === 1 ? ' <span class="badge badge-info">vous</span>' : '') +
              '<small class="d-block text-muted">' + (row.nom_complet || '') + '</small>' : v;
          } },
        { data: 'role', render: function (v, t, row) {
            return t === 'display' ? '<span class="text-nowrap">' + (ROLES[v] || v) + '</span><small class="d-block text-muted">' + (row.entreprises || '') + '</small>' : v;
          } },
        { data: 'actif', render: function (v, t, row) {
            if (t !== 'display') { return v; }
            var h = badgeActif(v), n = parseInt(row.tentatives, 10) || 0;
            if (parseInt(row.verrouille, 10) === 1) {
              h += ' <span class="badge badge-danger">Verrouillé</span><small class="d-block text-muted">jusqu\'à ' + esc(String(row.verrouille_jusqua).substr(11, 5)) + '</small>';
            } else if (n > 0) {
              h += '<small class="d-block text-muted">' + n + ' échec' + (n > 1 ? 's' : '') + ' de connexion</small>';
            }
            return h + '<small class="d-block text-muted">Dernière connexion : ' + (row.derniere_connexion ? esc(String(row.derniere_connexion).substr(0, 16)) : 'jamais') + '</small>';
          } },
        { data: null, orderable: false, className: 'adm-boutons no-print', render: function (v, t, row) {
            var id = row.id, nom = row.nom_utilisateur, h = '';
            h += bouton('modifier', id, 'fa-pen', 'Modifier', 'Modifier', nom, 'btn-outline-primary');
            h += bouton('mdp', id, 'fa-key', 'Mot de passe', 'Réinitialiser le mot de passe', nom, 'btn-outline-secondary');
            if (parseInt(row.verrouille, 10) === 1 || parseInt(row.tentatives, 10) > 0) { h += bouton('deverrouiller', id, 'fa-unlock', 'Déverrouiller', 'Déverrouiller le compte', nom, 'adm-btn-attention'); }
            if (parseInt(row.soi, 10) !== 1) {
              h += parseInt(row.actif, 10) === 1
                ? bouton('desactiver', id, 'fa-user-slash', 'Désactiver', 'Désactiver le compte', nom, 'btn-outline-danger')
                : bouton('activer', id, 'fa-user-check', 'Réactiver', 'Réactiver le compte', nom, 'btn-outline-success');
            }
            return actionsLigne(h);
          } }
      ],
      [[0, 'asc']],
      ['Aucun utilisateur ne correspond à ces critères.', 'Aucun utilisateur.'],
      function (tr, data) { if (parseInt(data.actif, 10) !== 1) { tr.classList.add('adm-inactif'); } });
    brancherRecherche(table);
    q('#f-statut').addEventListener('change', function () { table.draw(); });
    var rafraichir = suivreFocusLigne(table), derniereLigne = null;      // derniereLigne : bouton de la ligne en cours de traitement (null : création)
    rendreLeFocus(modal);

    // ---- actions de la liste
    $('#table-utilisateurs tbody').on('click', 'button[data-action]', function () {
      var b = this, action = b.getAttribute('data-action'), id = parseInt(b.getAttribute('data-id'), 10);
      var ligne = table.row($(b).closest('tr')).data() || {};
      var nom = decoder(ligne.nom_utilisateur);
      derniereLigne = b;
      if (action === 'modifier') { ouvrir(id); }
      else if (action === 'mdp') { ouvrirMdp({ mode: 'reset', id: id, nom: nom }); }
      else if (action === 'deverrouiller') { deverrouiller(id, nom, b); }
      else if (action === 'activer') { activer(id, true, nom, b); }
      else if (action === 'desactiver') {
        confirmer('Désactiver le compte ?', 'Désactiver « ' + nom + ' » ? Cette personne ne pourra plus se connecter, et sa connexion actuelle sera coupée dès sa prochaine action. Son historique est conservé.', 'Désactiver')
          .then(function (ok) { if (ok) { activer(id, false, nom, b); } });
      }
    });

    function activer(id, actif, nom, b) {
      envoyer([b], function () { return api.post('app/action/utilisateur_activer.php', { id: id, actif: actif }); })
        .then(function () { w.toast(actif ? 'Compte « ' + nom + ' » réactivé.' : 'Compte « ' + nom + ' » désactivé.', 'success'); rafraichir(derniereLigne); })
        .catch(function (err) { w.toast(msg(err), 'danger'); });
    }
    function deverrouiller(id, nom, b) {
      return envoyer([b], function () { return api.post('app/action/utilisateur_deverrouiller.php', { id: id }); })
        .then(function () { w.toast('Compte « ' + nom + ' » déverrouillé.', 'success'); rafraichir(derniereLigne); return true; })
        .catch(function (err) { w.toast(msg(err), 'danger'); return false; });
    }

    // ---- formulaire créer / modifier
    function appliquerRole() {
      var role = q('#u-role').value, admin = (role === 'admin');
      qa('input[name="entreprise_ids"]', form).forEach(function (c) { c.disabled = admin; });
      montrer(q('#u-entreprises-admin'), admin);
      var opt = q('#u-role').options[q('#u-role').selectedIndex];
      q('#u-role-aide').textContent = opt ? (opt.getAttribute('data-aide') || '') : '';
    }
    q('#u-role').addEventListener('change', appliquerRole);

    function remplir(u) {
      etat = { id: u.id, soi: !!u.soi, empreinte: u.empreinte || '' };
      q('#modal-utilisateur-titre').textContent = 'Modifier l\'utilisateur';
      q('#u-nom').value = u.nom_utilisateur;
      q('#u-complet').value = u.nom_complet;
      q('#u-role').value = u.role;
      qa('input[name="entreprise_ids"]', form).forEach(function (c) { c.checked = u.entreprise_ids.indexOf(parseInt(c.value, 10)) !== -1; });
      q('#u-actif').checked = !!u.actif;
      // On ne peut ni se désactiver ni se retirer le rôle d'administrateur soi-même (le serveur le refuse aussi)
      q('#u-actif').disabled = !!u.soi;
      q('#u-role').disabled = !!u.soi;
      montrer(q('#u-actif-aide'), !!u.soi);
      montrer(q('#u-mdp-bloc'), false);
      montrer(q('#u-compte-bloc'), true);
      montrer(q('#u-btn-deverrouiller'), !!u.verrouille || u.tentatives > 0);
      q('#u-connexion').textContent = 'Dernière connexion : ' + (u.derniere_connexion ? u.derniere_connexion.substr(0, 16) : 'jamais') +
        (u.verrouille ? ' · Compte verrouillé jusqu\'à ' + String(u.verrouille_jusqua).substr(11, 5) + '.' : (u.tentatives > 0 ? ' · ' + u.tentatives + ' échec' + (u.tentatives > 1 ? 's' : '') + ' de connexion récent' + (u.tentatives > 1 ? 's' : '') + '.' : ''));
      appliquerRole();
      $(modal).modal('show');
    }

    function ouvrir(id) {
      effacerErreurs(form);
      form.reset();
      champMdp.value = '';
      champMdp.type = 'password';
      reglerVoirMdp(false);
      q('#u-actif').disabled = false;
      q('#u-role').disabled = false;
      montrer(q('#u-actif-aide'), false);
      if (!id) {
        etat = { id: 0, soi: false };
        q('#modal-utilisateur-titre').textContent = 'Nouvel utilisateur';
        q('#u-role').value = 'employe';                      // le moins de droits par défaut
        qa('input[name="entreprise_ids"]', form).forEach(function (c) { c.checked = false; });
        q('#u-actif').checked = true;
        montrer(q('#u-mdp-bloc'), true);
        montrer(q('#u-compte-bloc'), false);
        appliquerRole();
        $(modal).modal('show');
        return;
      }
      api.get('app/ajax/utilisateur_detail.php', { id: id }).then(function (r) { remplir(r.utilisateur); })
        .catch(function (err) { w.toast(msg(err), 'danger'); });
    }
    q('#btn-nouveau').addEventListener('click', function () { derniereLigne = null; ouvrir(0); });
    $(modal).on('shown.bs.modal', function () { q(etat.id ? '#u-complet' : '#u-nom').focus(); });
    $(modal).on('hidden.bs.modal', function () { champMdp.value = ''; });

    /** Bouton Afficher / Masquer : le libellé change (pas de aria-pressed en plus, qui rendrait la lecture contradictoire). */
    function reglerVoirMdp(visible) {
      champMdp.type = visible ? 'text' : 'password';
      var b = q('#u-mdp-voir');
      b.textContent = visible ? 'Masquer' : 'Afficher';
      b.setAttribute('aria-label', visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    }
    q('#u-mdp-gen').addEventListener('click', function () {
      var m = genererMotDePasse();
      if (m) { champMdp.value = m; reglerVoirMdp(true); }
    });
    q('#u-mdp-voir').addEventListener('click', function () { reglerVoirMdp(champMdp.type !== 'text'); });
    q('#u-mdp-copier').addEventListener('click', function () { copierChamp(champMdp); });

    q('#u-btn-mdp').addEventListener('click', function () {
      var id = etat.id, nom = q('#u-nom').value.trim();
      $(modal).one('hidden.bs.modal', function () { ouvrirMdp({ mode: 'reset', id: id, nom: nom }); });
      $(modal).modal('hide');
    });
    q('#u-btn-deverrouiller').addEventListener('click', function () {
      var b = this;
      deverrouiller(etat.id, q('#u-nom').value.trim(), b).then(function (ok) {
        if (ok) { q('#u-connexion').textContent = 'Compte déverrouillé.'; montrer(b, false); b.disabled = false; q('#utilisateur-enregistrer').focus(); }      // le bouton qui avait le focus disparaît : on le déplace sur l'action suivante
      });
    });

    /** Contrôles rapides, TOUS d'un coup (le serveur refait chacun d'eux et reste l'autorité) : liste de {champ, message}. */
    function erreursLocales(p, creation) {
      var l = [];
      if (p.nom_utilisateur === '') { l.push({ champ: 'nom_utilisateur', message: 'Le nom d\'utilisateur est obligatoire.' }); }
      else if (!/^[A-Za-z0-9._-]{3,50}$/.test(p.nom_utilisateur)) { l.push({ champ: 'nom_utilisateur', message: 'Le nom d\'utilisateur doit contenir de 3 à 50 caractères : lettres sans accent, chiffres, point, tiret ou tiret bas.' }); }
      if (p.nom_complet === '') { l.push({ champ: 'nom_complet', message: 'Le nom complet est obligatoire.' }); }
      if (p.role !== 'admin' && p.entreprise_ids.length === 0) { l.push({ champ: 'entreprise_ids', message: 'Un gestionnaire ou un employé doit avoir accès à au moins une entreprise.' }); }
      if (creation) {
        if (p.mot_de_passe === '') { l.push({ champ: 'mot_de_passe', message: 'Le mot de passe est obligatoire.' }); }
        else if (p.mot_de_passe.length < 10) { l.push({ champ: 'mot_de_passe', message: 'Le mot de passe doit contenir au moins 10 caractères.' }); }
      }
      return l;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = q('#utilisateur-enregistrer');
      effacerErreurs(form);
      var role = q('#u-role').value;
      var ids = role === 'admin' ? [] : qa('input[name="entreprise_ids"]:checked', form).map(function (c) { return parseInt(c.value, 10); });
      var payload = {
        nom_utilisateur: q('#u-nom').value.trim(), nom_complet: q('#u-complet').value.trim(),
        role: role, actif: !!q('#u-actif').checked, entreprise_ids: ids
      };
      if (etat.id) { payload.id = etat.id; payload.empreinte = etat.empreinte; } else { payload.mot_de_passe = champMdp.value; }
      if (afficherErreurs(form, erreursLocales(payload, !etat.id))) { return; }
      var mdpInitial = champMdp.value, creation = !etat.id;
      envoyer([btn], function () { return api.post('app/action/utilisateur_save.php', payload); })
        .then(function (r) {
          $(modal).one('hidden.bs.modal', function () {
            rafraichir(derniereLigne);
            if (creation) {
              ouvrirMdp({ mode: 'resultat', id: r.id, nom: r.nom_utilisateur, mdp: mdpInitial, titre: 'Compte créé',
                texte: 'Le compte « ' + r.nom_utilisateur + ' » est créé. Voici le mot de passe initial : transmettez-le à la personne.' });
              mdpInitial = '';
            } else {
              w.toast('Utilisateur « ' + payload.nom_utilisateur + ' » enregistré.', 'success');
            }
          });
          $(modal).modal('hide');
        })
        .catch(function (err) {
          afficherErreur(form, zone, err);
          if (err && err.champ === 'empreinte') { rafraichir(derniereLigne); }      // la fiche a changé ailleurs : la liste se met à jour derrière la fenêtre
        });
    });

    // ---- Mot de passe : réinitialisation, ou affichage unique après la création
    var mm = q('#modal-mdp'), champ = q('#mdp-champ'), mdpEtat = { id: 0, nom: '' };
    function ouvrirMdp(o) {
      mdpEtat = { id: o.id, nom: o.nom };
      effacerErreurs(mm);
      var reset = (o.mode === 'reset');
      q('#modal-mdp-titre').textContent = reset ? 'Réinitialiser le mot de passe' : o.titre;
      q('#mdp-texte').textContent = reset
        ? 'Choisissez un nouveau mot de passe pour « ' + o.nom + ' », ou utilisez celui qui est proposé. Le compte sera aussi déverrouillé.'
        : o.texte;
      q('#mdp-etiquette').textContent = reset ? 'Nouveau mot de passe' : 'Mot de passe';
      champ.readOnly = !reset;
      champ.value = reset ? genererMotDePasse() : o.mdp;
      montrer(q('#mdp-gen'), reset);
      montrer(q('#mdp-valider'), reset);
      montrer(q('#mdp-annuler'), reset);
      montrer(q('#mdp-fermer'), !reset);
      if ($(mm).hasClass('show')) { setTimeout(function () { (champ.readOnly ? q('#mdp-copier') : champ).focus(); }, 0); }      // bascule dans la même fenêtre : le bouton qui avait le focus a disparu
      q('#mdp-note').textContent = reset
        ? 'Il sera affiché une seule fois, après l\'enregistrement. Au moins 10 caractères.'
        : 'Ce mot de passe ne sera plus affiché : copiez-le ou notez-le maintenant. La personne pourra le changer dans « Mon profil ».';
      $(mm).modal('show');
    }
    $(mm).on('shown.bs.modal', function () { (champ.readOnly ? q('#mdp-copier') : champ).focus(); });
    $(mm).on('hidden.bs.modal', function () { champ.value = ''; });
    rendreLeFocus(mm);
    q('#mdp-gen').addEventListener('click', function () { var m = genererMotDePasse(); if (m) { champ.value = m; } });
    q('#mdp-copier').addEventListener('click', function () { copierChamp(champ); });
    q('#mdp-annuler').addEventListener('click', function () { $(mm).modal('hide'); });
    q('#mdp-fermer').addEventListener('click', function () { $(mm).modal('hide'); });
    q('#mdp-valider').addEventListener('click', function () {
      var b = this, mdp = champ.value;
      effacerErreurs(mm);
      envoyer([b], function () { return api.post('app/action/utilisateur_mdp.php', { id: mdpEtat.id, mot_de_passe: mdp }); })
        .then(function () {
          rafraichir(derniereLigne);
          ouvrirMdp({ mode: 'resultat', id: mdpEtat.id, nom: mdpEtat.nom, mdp: mdp, titre: 'Mot de passe réinitialisé',
            texte: 'Le mot de passe de « ' + mdpEtat.nom + ' » est réinitialisé (son compte est déverrouillé). Transmettez-lui ce mot de passe.' });
          b.disabled = false;
        })
        .catch(function (err) { afficherErreur(mm, q('#mdp-erreur'), err); });
    });
  }

  // ===================================================================================
  //  Entreprises
  // ===================================================================================
  function initEntreprises() {
    var form = q('#form-entreprise'), modal = q('#modal-entreprise'), zone = q('#entreprise-erreur');
    libererALOuverture(modal);
    var etat = { id: 0 };
    function pl(n, sing, plur) { n = parseInt(n, 10) || 0; return n + ' ' + (n > 1 ? plur : sing); }
    var table = creerTable('#table-entreprises', 'app/ajax/entreprises_data.php',
      function (d) { d.statut = q('#f-statut').value; },
      [
        // Quatre colonnes (le tableau doit tenir dans 694 px sur une tablette) : l'entreprise (code, nom, adresse), son contenu, son état, les actions
        { data: 'nom', render: function (v, t, row) {
            return t === 'display' ? '<strong>' + v + '</strong> <span class="badge badge-light border code">' + row.code + '</span>' +
              (row.adresse ? '<small class="d-block text-muted">' + row.adresse + '</small>' : '') : v;
          } },
        { data: 'nb_pieces', render: function (v, t, row) {
            return t === 'display' ? '<span class="d-block">' + pl(row.nb_emplacements, 'emplacement actif', 'emplacements actifs') + '</span>' +
              '<span class="d-block">' + pl(v, 'pièce en stock', 'pièces en stock') + '</span>' +
              '<span class="d-block">' + pl(row.nb_utilisateurs, 'utilisateur', 'utilisateurs') + '</span>' : v;
          } },
        { data: 'actif', render: function (v, t) { return t === 'display' ? badgeActif(v).replace('Actif', 'Active').replace('Désactivé', 'Désactivée') : v; } },
        { data: null, orderable: false, className: 'adm-boutons no-print', render: function (v, t, row) {
            return actionsLigne(bouton('modifier', row.id, 'fa-pen', 'Modifier', 'Modifier', row.nom, 'btn-outline-primary') +
              (parseInt(row.actif, 10) === 1
                ? bouton('desactiver', row.id, 'fa-ban', 'Désactiver', 'Désactiver l\'entreprise', row.nom, 'btn-outline-danger')
                : bouton('activer', row.id, 'fa-check', 'Réactiver', 'Réactiver l\'entreprise', row.nom, 'btn-outline-success')));
          } }
      ],
      [[0, 'asc']],
      ['Aucune entreprise ne correspond à ces critères.', 'Aucune entreprise.'],
      function (tr, data) { if (parseInt(data.actif, 10) !== 1) { tr.classList.add('adm-inactif'); } });
    q('#f-statut').addEventListener('change', function () { table.draw(); });
    var rafraichir = suivreFocusLigne(table), derniereLigne = null;      // derniereLigne : bouton de la ligne en cours de traitement (null : création)
    rendreLeFocus(modal);

    /** Réponse de désactivation / réactivation : messages, avertissement si des utilisateurs perdent leur accès. */
    function apresActivation(r, nom, actif) {
      w.toast('Entreprise « ' + nom + ' » ' + (actif ? 'réactivée.' : 'désactivée.'), 'success');
      if (r && r.utilisateurs_sans_acces > 0) {
        w.toast(r.utilisateurs_sans_acces + (r.utilisateurs_sans_acces > 1 ? ' utilisateurs n\'ont' : ' utilisateur n\'a') + ' plus accès à aucune entreprise active. Modifiez leurs accès dans « Utilisateurs ».', 'warning');
      }
    }
    function refusStock(err, id) {
      if (err && err.champ === 'stock') { refuser('Désactivation impossible', err.message, 'index.php?page=stock&entreprise_id=' + encodeURIComponent(id), 'Voir le stock de cette entreprise'); return true; }
      return false;
    }

    $('#table-entreprises tbody').on('click', 'button[data-action]', function () {
      var b = this, action = b.getAttribute('data-action'), id = parseInt(b.getAttribute('data-id'), 10);
      var nom = decoder((table.row($(b).closest('tr')).data() || {}).nom);
      derniereLigne = b;
      if (action === 'modifier') { ouvrir(id); return; }
      function appliquer(actif) {
        envoyer([b], function () { return api.post('app/action/entreprise_activer.php', { id: id, actif: actif }); })
          .then(function (r) { apresActivation(r, nom, actif); rafraichir(derniereLigne); })
          .catch(function (err) { if (!refusStock(err, id)) { w.toast(msg(err), 'danger'); } });
      }
      if (action === 'activer') { appliquer(true); return; }
      confirmer('Désactiver l\'entreprise ?', 'Désactiver « ' + nom + ' » ? Elle disparaîtra des listes de saisie et ses utilisateurs n\'y auront plus accès ; son historique est conservé.', 'Désactiver')
        .then(function (ok) { if (ok) { appliquer(false); } });
    });

    function ouvrir(id) {
      effacerErreurs(form);
      form.reset();
      etat = { id: id || 0 };
      montrer(q('#en-actif-groupe'), !!id);
      q('#modal-entreprise-titre').textContent = id ? 'Modifier l\'entreprise' : 'Nouvelle entreprise';
      if (!id) { $(modal).modal('show'); return; }
      api.get('app/ajax/entreprise_detail.php', { id: id }).then(function (r) {
        var e = r.entreprise;
        q('#en-code').value = e.code; q('#en-nom').value = e.nom; q('#en-adresse').value = e.adresse; q('#en-actif').checked = !!e.actif;
        $(modal).modal('show');
      }).catch(function (err) { w.toast(msg(err), 'danger'); });
    }
    q('#btn-nouveau').addEventListener('click', function () { derniereLigne = null; ouvrir(0); });
    $(modal).on('shown.bs.modal', function () { q('#en-code').focus(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = q('#entreprise-enregistrer');
      effacerErreurs(form);
      var payload = { code: q('#en-code').value.trim(), nom: q('#en-nom').value.trim(), adresse: q('#en-adresse').value.trim() };
      if (etat.id) { payload.id = etat.id; payload.actif = !!q('#en-actif').checked; }
      var locales = [];
      if (payload.code === '') { locales.push({ champ: 'code', message: 'Le code est obligatoire.' }); }
      else if (!/^[A-Za-z0-9_-]{1,10}$/.test(payload.code)) { locales.push({ champ: 'code', message: 'Le code doit contenir de 1 à 10 caractères : lettres sans accent, chiffres, tiret ou tiret bas (exemple : BEA).' }); }
      if (payload.nom === '') { locales.push({ champ: 'nom', message: 'Le nom est obligatoire.' }); }
      if (afficherErreurs(form, locales)) { return; }
      envoyer([btn], function () { return api.post('app/action/entreprise_save.php', payload); })
        .then(function (r) {
          $(modal).modal('hide');
          rafraichir(derniereLigne);
          if (r.utilisateurs_sans_acces !== undefined && r.inchange === false) { apresActivation(r, payload.nom, !!r.actif); }
          else { w.toast('Entreprise « ' + payload.nom + ' » enregistrée.', 'success'); }
        })
        .catch(function (err) {
          afficherErreur(form, zone, err, etat.id ? { href: 'index.php?page=stock&entreprise_id=' + encodeURIComponent(etat.id), texte: 'Voir le stock de cette entreprise' } : null);
        });
    });
    brancherRecherche(table);
  }

  // ===================================================================================
  //  Emplacements
  // ===================================================================================
  function initEmplacements() {
    var TYPES = { entrepot: 'Entrepôt', boutique: 'Boutique', cube: 'Cube de service' };
    var form = q('#form-emplacement'), modal = q('#modal-emplacement'), zone = q('#emplacement-erreur');
    libererALOuverture(modal);
    var champCode = q('#em-code');
    var etat = { id: 0, codeInitial: '' };

    var table = creerTable('#table-emplacements', 'app/ajax/emplacement_data.php',
      function (d) { d.entreprise_id = q('#f-entreprise').value; d.type = q('#f-type').value; d.statut = q('#f-statut').value; },
      [
        { data: 'entreprise', render: function (v, t, row) { return t === 'display' ? v + (parseInt(row.entreprise_actif, 10) === 1 ? '' : ' <span class="badge badge-secondary">désactivée</span>') : v; } },
        // Le type est sous le nom (une colonne de moins : le tableau doit tenir dans 694 px sur une tablette)
        { data: 'nom', render: function (v, t, row) { return t === 'display' ? '<strong>' + v + '</strong><small class="d-block text-muted">' + (TYPES[row.type] || row.type) + '</small>' : v; } },
        { data: 'code_barres', render: function (v, t) { return t === 'display' ? '<span class="code">' + v + '</span>' : v; } },
        { data: 'nb_pieces', className: 'nombre', render: function (v, t, row) {
            if (t !== 'display') { return v; }
            var n = parseInt(v, 10) || 0;
            return n > 0 ? '<a class="adm-lien-nombre" href="index.php?page=stock&amp;emplacement_id=' + esc(row.id) + '" title="Voir le stock de cet emplacement">' + n + '</a>' : '0';
          } },
        { data: 'actif', render: function (v, t) { return t === 'display' ? badgeActif(v) : v; } },
        { data: null, orderable: false, className: 'adm-boutons no-print', render: function (v, t, row) {
            var h = bouton('modifier', row.id, 'fa-pen', 'Modifier', 'Modifier', row.nom, 'btn-outline-primary');
            h += '<a class="btn btn-sm adm-btn-ligne btn-outline-secondary" data-action="etiquette" data-id="' + esc(row.id) + '" href="index.php?page=etiquettes&amp;emplacement_id=' + esc(row.id) + '" title="Imprimer l\'étiquette code-barres" aria-label="' + esc('Étiquette : ' + decoder(row.nom)) + '"><i class="fas fa-barcode" aria-hidden="true"></i><span>Étiquette</span></a>';
            h += parseInt(row.actif, 10) === 1
              ? bouton('desactiver', row.id, 'fa-ban', 'Désactiver', 'Désactiver l\'emplacement', row.nom, 'btn-outline-danger')
              : bouton('activer', row.id, 'fa-check', 'Réactiver', 'Réactiver l\'emplacement', row.nom, 'btn-outline-success');
            return actionsLigne(h);
          } }
      ],
      [[0, 'asc']],
      ['Aucun emplacement ne correspond à ces critères.', 'Aucun emplacement.'],
      function (tr, data) { if (parseInt(data.actif, 10) !== 1) { tr.classList.add('adm-inactif'); } });
    brancherRecherche(table, { scan: true });      // champ « Rechercher ou scanner » : le code d'un emplacement (EMP-000003) filtre la liste
    ['#f-entreprise', '#f-type', '#f-statut'].forEach(function (s) { q(s).addEventListener('change', function () { table.draw(); }); });
    var rafraichir = suivreFocusLigne(table), derniereLigne = null;      // derniereLigne : bouton de la ligne en cours de traitement (null : création)
    rendreLeFocus(modal);

    function refusStock(err, id) {
      if (err && err.champ === 'stock') { refuser('Désactivation impossible', err.message, 'index.php?page=stock&emplacement_id=' + encodeURIComponent(id), 'Voir le stock de cet emplacement'); return true; }
      return false;
    }
    $('#table-emplacements tbody').on('click', 'button[data-action]', function () {
      var b = this, action = b.getAttribute('data-action'), id = parseInt(b.getAttribute('data-id'), 10);
      var nom = decoder((table.row($(b).closest('tr')).data() || {}).nom);
      derniereLigne = b;
      if (action === 'modifier') { ouvrir(id); return; }
      function appliquer(actif) {
        envoyer([b], function () { return api.post('app/action/emplacement_activer.php', { id: id, actif: actif }); })
          .then(function () { w.toast('Emplacement « ' + nom + ' » ' + (actif ? 'réactivé.' : 'désactivé.'), 'success'); rafraichir(derniereLigne); })
          .catch(function (err) { if (!refusStock(err, id)) { w.toast(msg(err), 'danger'); } });
      }
      if (action === 'activer') { appliquer(true); return; }
      confirmer('Désactiver l\'emplacement ?', 'Désactiver « ' + nom + ' » ? Il n\'apparaîtra plus dans les listes de saisie ; son historique est conservé.', 'Désactiver')
        .then(function (ok) { if (ok) { appliquer(false); } });
    });

    /** Options d'entreprise : une entreprise désactivée n'est pas permise (sauf celle de l'emplacement modifié). */
    function regler(entrepriseActuelle) {
      qa('#em-entreprise option').forEach(function (o) {
        if (o.value === '') { return; }
        o.disabled = (o.getAttribute('data-actif') !== '1') && (parseInt(o.value, 10) !== entrepriseActuelle);
      });
    }
    function proposer(silencieux) {
      return api.get('app/ajax/emplacement_code_proposer.php').then(function (r) { champCode.value = r.code; majAvertissement(); return true; })
        .catch(function (err) { if (!silencieux) { w.toast(msg(err), 'danger'); } return false; });
    }
    function majAvertissement() {
      montrer(q('#em-code-avert'), !!etat.id && etat.codeInitial !== '' && champCode.value.trim() !== etat.codeInitial);
    }
    champCode.addEventListener('input', majAvertissement);
    q('#em-code-proposer').addEventListener('click', function () { proposer(false); });

    function ouvrir(id) {
      effacerErreurs(form);
      form.reset();
      etat = { id: id || 0, codeInitial: '' };
      q('#em-entreprise').disabled = false;
      montrer(q('#em-entreprise-aide'), false);
      montrer(q('#em-actif-groupe'), !!id);
      montrer(q('#em-code-avert'), false);
      q('#modal-emplacement-titre').textContent = id ? 'Modifier l\'emplacement' : 'Nouvel emplacement';
      if (!id) {
        regler(0);
        var f = q('#f-entreprise').value;       // l'entreprise filtrée est présélectionnée
        var o = f ? q('#em-entreprise option[value="' + f.replace(/[^0-9]/g, '') + '"]') : null;
        q('#em-entreprise').value = (o && !o.disabled) ? o.value : '';
        q('#em-type').value = 'entrepot';
        champCode.value = '';
        $(modal).modal('show');
        proposer(true);
        return;
      }
      api.get('app/ajax/emplacement_detail.php', { id: id }).then(function (r) {
        var e = r.emplacement;
        regler(e.entreprise_id);
        q('#em-entreprise').value = String(e.entreprise_id);
        q('#em-entreprise').disabled = !!e.a_historique;
        montrer(q('#em-entreprise-aide'), !!e.a_historique);
        q('#em-nom').value = e.nom; q('#em-type').value = e.type; champCode.value = e.code_barres; q('#em-actif').checked = !!e.actif;
        etat.codeInitial = e.code_barres;
        $(modal).modal('show');
      }).catch(function (err) { w.toast(msg(err), 'danger'); });
    }
    q('#btn-nouveau').addEventListener('click', function () { derniereLigne = null; ouvrir(0); });
    $(modal).on('shown.bs.modal', function () { q(etat.id ? '#em-nom' : '#em-entreprise').focus(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = q('#emplacement-enregistrer');
      effacerErreurs(form);
      var payload = {
        entreprise_id: parseInt(q('#em-entreprise').value, 10) || 0, nom: q('#em-nom').value.trim(), type: q('#em-type').value,
        code_barres: champCode.value.trim()
      };
      if (etat.id) { payload.id = etat.id; payload.actif = !!q('#em-actif').checked; }
      var locales = [];
      if (!payload.entreprise_id) { locales.push({ champ: 'entreprise_id', message: 'Choisissez une entreprise.' }); }
      if (payload.nom === '') { locales.push({ champ: 'nom', message: 'Le nom est obligatoire.' }); }
      if (etat.id && payload.code_barres === '') { locales.push({ champ: 'code_barres', message: 'Le code-barres est obligatoire (sans lui, l\'emplacement ne peut pas être scanné).' }); }
      if (afficherErreurs(form, locales)) { return; }
      envoyer([btn], function () { return api.post('app/action/emplacement_save.php', payload); })
        .then(function () { $(modal).modal('hide'); rafraichir(derniereLigne); w.toast('Emplacement « ' + payload.nom + ' » enregistré.', 'success'); })
        .catch(function (err) {
          afficherErreur(form, zone, err, etat.id ? { href: 'index.php?page=stock&emplacement_id=' + encodeURIComponent(etat.id), texte: 'Voir le stock de cet emplacement' } : null);
        });
    });
  }

  // ===================================================================================
  //  Journal
  // ===================================================================================
  function initJournal() {
    function filtres() {
      var f = {};
      [['utilisateur_id', '#f-utilisateur'], ['action', '#f-action'], ['entite', '#f-entite'], ['du', '#f-du'], ['au', '#f-au']].forEach(function (c) {
        var v = q(c[1]).value; if (v) { f[c[0]] = v; }
      });
      return f;
    }
    var table = creerTable('#table-journal', 'app/ajax/journal_data.php',
      function (d) { $.extend(d, filtres()); },
      [
        // Le tri « par date » se fait sur le numéro d'entrée (même ordre, et départage les actions de la même seconde)
        { data: 'id', render: function (v, t, row) { return t === 'display' ? row.date : v; } },
        { data: 'utilisateur', orderable: true, render: function (v, t) { return t === 'display' ? (v === '' ? '<span class="text-muted">—</span>' : v) : v; } },
        { data: 'action', render: function (v, t, row) { return t === 'display' ? row.action_fr : v; } },
        { data: 'entite', render: function (v, t, row) { return t === 'display' ? row.element : v; } },
        { data: 'details', orderable: false },
        { data: 'ip', render: function (v, t) { return t === 'display' ? '<span class="code">' + v + '</span>' : v; } }
      ],
      [[0, 'desc']],
      ['Aucune entrée du journal ne correspond à ces critères.', 'Le journal est vide.']);
    brancherRecherche(table);
    ['#f-utilisateur', '#f-action', '#f-entite', '#f-du', '#f-au'].forEach(function (s) {
      q(s).addEventListener('change', function () {
        var du = q('#f-du').value, au = q('#f-au').value;
        if (du && au && du > au) { w.toast('La date de début doit précéder la date de fin.', 'warning'); return; }
        table.draw();
      });
    });
    q('#btn-reinitialiser').addEventListener('click', function () {
      ['#f-utilisateur', '#f-action', '#f-entite', '#f-du', '#f-au', '#f-recherche'].forEach(function (s) { q(s).value = ''; });
      table.search('').draw();
    });

    q('#btn-exporter').addEventListener('click', function () {
      var b = this, params = filtres(), rech = q('#f-recherche').value.trim();
      if (rech) { params.q = rech; }
      envoyer([b], function () {
        return fetch('app/ajax/journal_export.php?' + $.param(params), { credentials: 'same-origin' }).then(function (resp) {
          if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée. Veuillez vous reconnecter.'); }
          if (!resp.ok) {
            return resp.text().then(function (t) { var m = 'Export impossible (' + resp.status + ').'; try { m = JSON.parse(t).erreur || m; } catch (e) { /* pas du JSON */ } throw new Error(m); });
          }
          return resp.blob();
        });
      }, true).then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'journal-' + aujourdhui() + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
        w.toast('Le fichier CSV est téléchargé.', 'success');
      }).catch(function (err) { w.toast(msg(err), 'danger'); });
    });
  }

  // ===================================================================================
  //  Profil : changement de mot de passe
  // ===================================================================================
  function initProfil() {
    var form = q('#form-profil'), ok = q('#profil-succes'), zone = q('#profil-erreur');
    var champs = [q('#p-actuel'), q('#p-nouveau'), q('#p-confirmation')];
    q('#p-voir').addEventListener('change', function () { var t = this.checked ? 'text' : 'password'; champs.forEach(function (c) { c.type = t; }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = q('#profil-enregistrer');
      effacerErreurs(form);
      montrer(ok, false);
      var actuel = q('#p-actuel').value, nouveau = q('#p-nouveau').value, conf = q('#p-confirmation').value;
      // Contrôles rapides (le serveur refait tout)
      var locales = [];
      if (actuel === '') { locales.push({ champ: 'actuel', message: 'Saisissez votre mot de passe actuel.' }); }
      if (nouveau.length < 10) { locales.push({ champ: 'nouveau', message: 'Le nouveau mot de passe doit contenir au moins 10 caractères.' }); }
      else if (conf !== nouveau) { locales.push({ champ: 'confirmation', message: 'La confirmation ne correspond pas au nouveau mot de passe.' }); }
      if (afficherErreurs(form, locales)) { return; }
      envoyer([btn], function () { return api.post('app/action/profil_mdp.php', { actuel: actuel, nouveau: nouveau, confirmation: conf }); })
        .then(function (r) {
          champs.forEach(function (c) { c.value = ''; });
          ok.textContent = (r && r.message ? r.message : 'Votre mot de passe a été changé.') + ' Utilisez-le à votre prochaine connexion.';
          ok.hidden = false;
          ok.focus();      // un seul message de succès : le bandeau (lu par les lecteurs d'écran) ; pas de notification en double
          btn.disabled = false;
        })
        .catch(function (err) {
          afficherErreur(form, zone, err);
          if (err && err.champ === 'actuel') { q('#p-actuel').value = ''; }
        });
    });
  }

  // ===================================================================================
  //  Sauvegarde
  // ===================================================================================
  function initSauvegarde() {
    var cases = qa('input.checkbox_table'), etat = q('#sauvegarde-compte'), btn = q('#btn-sauvegarde'), info = q('#sauvegarde-etat'), formulaire = q('#exportForm');
    function maj() {
      var n = cases.filter(function (c) { return c.checked; }).length;
      etat.textContent = n + ' table' + (n > 1 ? 's' : '') + ' sur ' + cases.length + ' cochée' + (n > 1 ? 's' : '');
    }
    cases.forEach(function (c) { c.addEventListener('change', maj); });
    q('#btn-tout-cocher').addEventListener('click', function () { cases.forEach(function (c) { c.checked = true; }); maj(); });
    q('#btn-tout-decocher').addEventListener('click', function () { cases.forEach(function (c) { c.checked = false; }); maj(); });
    maj();
    function telecharger() {
      // Téléchargement : la page ne se recharge pas ; on évite le double clic, puis on libère le bouton
      btn.disabled = true;
      info.className = 'small text-muted ml-2';
      info.textContent = 'Préparation du fichier…';
      HTMLFormElement.prototype.submit.call(formulaire);
      setTimeout(function () { btn.disabled = false; info.textContent = 'Le téléchargement devrait avoir démarré. Vérifiez le fichier reçu avant de le ranger.'; }, 4000);
    }
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cases.some(function (c) { return c.checked; })) { info.textContent = 'Sélectionnez au moins une table.'; info.className = 'small text-danger ml-2'; return; }
      if (cases.every(function (c) { return c.checked; })) { telecharger(); return; }
      confirmer('Sauvegarde incomplète', 'Certaines tables ne sont pas cochées : cette sauvegarde sera INCOMPLÈTE et ne permettra pas de restaurer tout le système. Continuer quand même ?', 'Continuer', 'btn-primary')
        .then(function (oui) { if (oui) { telecharger(); } });
    });
  }

  var inits = { utilisateurs: initUtilisateurs, entreprises: initEntreprises, emplacements: initEmplacements, journal: initJournal, profil: initProfil, sauvegarde: initSauvegarde };
  if (inits[page]) { inits[page](); }
})(window, jQuery);
