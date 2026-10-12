/* Plan de l'entrepôt (page « Plan »).
 *
 *  - une tuile par emplacement actif (plan_data.php) ; rangement automatique par type puis par entreprise, ou place libre enregistrée ;
 *  - « où est cette pièce ? » : champ de scan/recherche en haut ; les tuiles qui ont la pièce s'illuminent, les autres s'estompent ;
 *  - un clic sur une tuile ouvre le tiroir (plan_emplacement.php) ;
 *  - temps réel : plan_version.php toutes les 4 s (une seule requête à la fois, arrêt quand l'onglet est caché, recul en cas d'erreur) ;
 *    quand le jeton change, plan_data.php est relu et les tuiles dont le contenu a changé pulsent ;
 *  - administrateur : « Modifier le plan » (pointer events : souris et doigt, accrochage à 20 px, limites de la zone) puis plan_save.php ;
 *  - deux vues des mêmes données : « 3D » (scène isométrique, plan3d-ui.js + plan3d.bundle.js ; par défaut sur écran large quand WebGL fonctionne)
 *    et « Tuiles » (vue accessible au clavier et de repli ; la modification du plan se fait ici). Le choix est mémorisé.
 * Toute valeur du serveur passe par esc() avant innerHTML. Quantités = chaînes décimales (affichage par fmtQte seulement).
 */
(function (w, $) {
  'use strict';

  var racine = document.getElementById('page-plan');
  if (!racine) { return; }
  var d = document;

  function el(id) { return d.getElementById(id); }
  function esc(s) { return w.esc(s); }
  function copie(r) { return { x: r.x, y: r.y, largeur: r.largeur, hauteur: r.hauteur }; }
  function msgErreur(e) { return (e && e.message) ? e.message : 'Erreur inattendue. Réessayez.'; }

  var admin = racine.getAttribute('data-admin') === '1';
  var plan = el('pl-plan'), surface = el('pl-surface'), champ = el('pl-recherche'), liste = el('pl-suggestions'), bandeau = el('pl-bandeau');
  var direct = el('pl-direct'), directTexte = el('pl-direct-texte'), vide = el('pl-vide'), vider = el('pl-vider');
  var tiroir = el('pl-tiroir'), lignesEl = el('pl-lignes'), filtre = el('pl-filtre');
  var vues = el('pl-vues'), scene3d = el('pl-3d');
  var mqLarge = w.matchMedia('(min-width: 768px)');

  var INTERVALLE = 4000;          // entre deux interrogations du jeton de version
  var ATTENTE_MAX = 30000;        // plafond du recul après des erreurs réseau
  var DELAI_REQUETE = 8000;       // une interrogation sans réponse est abandonnée
  var TOUT_RELIRE = 60000;        // relecture complète même sans changement (minimums, noms de pièces : non couverts par le jeton)
  var DUREE_PULSE = 1600;
  var TITRE_H = 40;               // hauteur du titre d'un groupe dans le rangement automatique
  var ICONES = { entrepot: 'fa-warehouse', boutique: 'fa-store', cube: 'fa-shuttle-van' };
  var TITRES = { entrepot: 'Entrepôts', boutique: 'Boutiques', cube: 'Cubes de service' };
  var CLE_VUE = 'beauchemin.plan.vue';  // « 3d » ou « tuiles » (localStorage : jamais indispensable)
  var LARGEUR_3D = 1100;                  // largeur du rangement automatique quand la vue Tuiles est cachée (4 colonnes)

  // ---- État -------------------------------------------------------------------------------------------------------------
  var etat = {
    zone: null, tuiles: [], objets: {},      // objets : id -> { t: données du serveur, el: bouton }
    titres: {},                              // type -> élément de titre de groupe
    version: '', pieceId: null, recherche: null,
    rects: {},                               // places affichées (px) : id -> {x, y, largeur, hauteur}
    edition: false, brouillon: null, avant: null, sale: false,
    tiroirId: null, tiroirLignes: null, tiroirTronque: false, declencheur: null,
    premier: true, seq: 0, derniereLecture: 0,
    vue: 'tuiles', apresEdition: null
  };

  var ui3d = creerVue3d();

  // ---- Utilitaires d'affichage --------------------------------------------------------------------------------------------
  function marque(code) { var c = String(code || '').toLowerCase(); return (c === 'bea' || c === 'bch') ? c : 'neutre'; }
  function nbPieces(t) { return t.nb_pieces + ' ' + (t.nb_pieces > 1 ? 'pièces' : 'pièce'); }
  function unites(t) { var u = parseFloat(t.unites); return w.fmtQte(t.unites) + ' ' + (u >= 2 ? 'unités' : 'unité'); }
  /** « 14 pièces · 238 unités » (chiffres en gras) ou « Vide » : même résumé sur la tuile et dans le tiroir. */
  function resumeHtml(t) {
    return t.nb_pieces ? '<b>' + esc(t.nb_pieces) + '</b> ' + (t.nb_pieces > 1 ? 'pièces' : 'pièce') + ' · <b>' + esc(w.fmtQte(t.unites)) + '</b> ' + (parseFloat(t.unites) >= 2 ? 'unités' : 'unité') : 'Vide';
  }
  function libelleTuile(t) {
    var s = t.nom + ', ' + (t.nb_pieces ? nbPieces(t) + ', ' + unites(t) : 'vide');
    if (t.nb_bas) { s += ', ' + t.nb_bas + ' sous le minimum'; }
    return s;
  }
  function quantiteAvecUnite(q, unite) {
    return esc(w.fmtQte(q)) + (unite && unite !== 'unité' ? ' <small>' + esc(unite) + '</small>' : '');
  }
  function normaliser(s) { s = String(s || '').toLowerCase(); return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s; }
  function lienPage(page, params) {
    var q = ['page=' + encodeURIComponent(page)];
    Object.keys(params).forEach(function (k) { q.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k])); });
    return 'index.php?' + q.join('&');
  }

  // ---- Tuiles : création et mise à jour (jamais reconstruites : le focus et l'animation en cours sont gardés) ---------------
  function creerTuile(t) {
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'pl-tuile';
    b.setAttribute('data-id', t.id);
    b.setAttribute('aria-describedby', 'pl-ent-' + t.id);
    b.innerHTML = '<span class="pl-haut"><span class="pl-icone" aria-hidden="true"><i class="fas"></i></span><span class="pl-pastilles" aria-hidden="true"></span></span>' +
      '<span class="pl-nom"></span>' +
      '<span class="pl-meta"><span class="pl-entreprise" id="pl-ent-' + esc(t.id) + '"></span><span class="pl-code"></span></span>' +
      '<span class="pl-chiffres"></span><span class="pl-poignee" aria-hidden="true"></span>';
    return b;
  }
  function texte(parent, sel, valeur) {
    var n = parent.querySelector(sel);
    if (n.textContent !== valeur) { n.textContent = valeur; }
  }
  function majTuile(o) {
    var t = o.t, b = o.el;
    b.setAttribute('data-marque', marque(t.entreprise_code));
    b.setAttribute('aria-label', libelleTuile(t) + (etat.recherche && o.qte !== undefined ? ', contient ' + w.fmtQte(o.qte) : ''));
    b.querySelector('.pl-icone i').className = 'fas ' + (ICONES[t.type] || 'fa-warehouse');
    texte(b, '.pl-nom', t.nom);
    texte(b, '.pl-entreprise', t.entreprise_nom);
    texte(b, '.pl-code', t.code || '');
    b.querySelector('.pl-chiffres').innerHTML = resumeHtml(t);
    b.classList.toggle('pl-vide', t.nb_pieces === 0);
    var p = b.querySelector('.pl-pastilles');
    var html = '';
    if (o.qte !== undefined) { html += '<span class="pl-qte">' + quantiteAvecUnite(o.qte, etat.recherche ? etat.recherche.piece.unite : '') + '</span>'; }
    if (t.nb_bas) { html += '<span class="pl-alerte" title="' + esc(t.nb_bas + ' ' + (t.nb_bas > 1 ? 'pièces sous le minimum' : 'pièce sous le minimum')) + '"><i class="fas fa-exclamation-triangle" aria-hidden="true"></i>' + esc(t.nb_bas) + '</span>'; }
    if (p.getAttribute('data-html') !== html) { p.innerHTML = html; p.setAttribute('data-html', html); }
  }
  function pulser(b) {
    b.classList.remove('pl-pulse');
    void b.offsetWidth;
    b.classList.add('pl-pulse');
    clearTimeout(b._pulse);
    b._pulse = setTimeout(function () { b.classList.remove('pl-pulse'); }, DUREE_PULSE);
  }
  function change(avant, apres) {
    return avant.sig !== apres.sig || avant.nb_pieces !== apres.nb_pieces || avant.unites !== apres.unites || avant.nb_bas !== apres.nb_bas;
  }

  /** Remplace la liste des tuiles par celle du serveur : ajoute, retire, met à jour, et fait pulser celles dont le contenu a changé. */
  function appliquerTuiles(tuiles, pulse) {
    var presents = {};
    tuiles.forEach(function (t) {
      presents[t.id] = true;
      var o = etat.objets[t.id];
      if (!o) {
        o = etat.objets[t.id] = { t: t, el: creerTuile(t), qte: undefined };
      } else {
        if (pulse && change(o.t, t)) { pulser(o.el); }
        o.t = t;
      }
    });
    Object.keys(etat.objets).forEach(function (id) {
      if (!presents[id]) { etat.objets[id].el.remove(); delete etat.objets[id]; if (etat.brouillon) { delete etat.brouillon[id]; } }
    });
    etat.tuiles = tuiles;
    // titres de groupe + ordre du DOM (celui du serveur : type, entreprise, nom) ; on ne touche au DOM que si l'ordre a changé
    var voulu = [], vus = {};
    tuiles.forEach(function (t) {
      if (!vus[t.type]) {
        vus[t.type] = true;
        if (!etat.titres[t.type]) {
          var h = d.createElement('div');
          h.className = 'pl-groupe';
          h.setAttribute('aria-hidden', 'true');
          h.innerHTML = '<i class="fas ' + (ICONES[t.type] || 'fa-warehouse') + '"></i> ' + esc(TITRES[t.type] || t.type_libelle);
          etat.titres[t.type] = h;
        }
        voulu.push(etat.titres[t.type]);
      }
      voulu.push(etat.objets[t.id].el);
    });
    Object.keys(etat.titres).forEach(function (k) { if (!vus[k]) { etat.titres[k].remove(); delete etat.titres[k]; } });
    var actuel = Array.prototype.slice.call(surface.children);
    var pareil = actuel.length === voulu.length && voulu.every(function (n, i) { return actuel[i] === n; });
    if (!pareil) { voulu.forEach(function (n) { surface.appendChild(n); }); }
    tuiles.forEach(function (t) { majTuile(etat.objets[t.id]); });
    vide.hidden = tuiles.length > 0;
    surface.hidden = tuiles.length === 0;
  }

  // ---- Disposition -----------------------------------------------------------------------------------------------------------
  function largeurDisponible() {
    var cs = w.getComputedStyle(plan);
    return Math.max(0, plan.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  }
  function enLigne(a, b) { return a.x < b.x + b.largeur && a.x + a.largeur > b.x && a.y < b.y + b.hauteur && a.y + a.hauteur > b.y; }

  /**
   * Rangement automatique : grille de tuiles de taille standard, une nouvelle rangée à chaque changement de type
   * (les tuiles arrivent déjà triées par type, puis par entreprise, puis par nom). Retourne { rects, titres }.
   */
  function rangerAuto(liste, largeurZone, yDepart, avecTitres) {
    var Z = etat.zone, G = Z.grille, TW = Z.tuile_largeur, TH = Z.tuile_hauteur;
    var colonnes = Math.max(1, Math.floor((largeurZone + G) / (TW + G)));
    var rects = {}, titres = {}, y = yDepart, col = 0, type = null;
    liste.forEach(function (t) {
      if (t.type !== type) {
        if (type !== null) { y += (col > 0 ? TH + G : 0) + G; }
        type = t.type; col = 0;
        if (avecTitres) { titres[type] = y; y += TITRE_H; }
      } else if (col >= colonnes) { col = 0; y += TH + G; }
      rects[t.id] = { x: col * (TW + G), y: y, largeur: TW, hauteur: TH };
      col++;
    });
    return { rects: rects, titres: titres };
  }

  /** Les places à afficher : brouillon en modification, sinon places enregistrées + rangement automatique des autres, sous les premières. */
  function calculerRects() {
    var Z = etat.zone, G = Z.grille, rects = {}, titres = {}, mode;
    if (etat.edition && etat.brouillon) {
      mode = 'libre';
      etat.tuiles.forEach(function (t) { rects[t.id] = etat.brouillon[t.id] || null; });
      var sans = etat.tuiles.filter(function (t) { return !rects[t.id]; });
      if (sans.length) {
        var r0 = rangerAuto(sans, largeurDisponible(), basDe(rects) + G, false);
        sans.forEach(function (t) { rects[t.id] = etat.brouillon[t.id] = r0.rects[t.id]; });
      }
    } else {
      var placees = etat.tuiles.filter(function (t) { return t.pos; });
      var libres = etat.tuiles.filter(function (t) { return !t.pos; });
      placees.forEach(function (t) { rects[t.id] = copie(t.pos); });
      if (!placees.length) {
        mode = 'auto';
        var a = rangerAuto(libres, largeurDisponible(), 0, true);
        libres.forEach(function (t) { rects[t.id] = a.rects[t.id]; });
        titres = a.titres;
      } else {
        mode = 'libre';
        if (libres.length) {
          var b = rangerAuto(libres, Math.max(largeurDisponible(), droiteDe(rects)), basDe(rects) + 2 * G, false);
          libres.forEach(function (t) { rects[t.id] = b.rects[t.id]; });
        }
      }
    }
    return { rects: rects, titres: titres, mode: mode };
  }
  function basDe(rects) { var m = 0; Object.keys(rects).forEach(function (k) { if (rects[k]) { m = Math.max(m, rects[k].y + rects[k].hauteur); } }); return m; }
  function droiteDe(rects) { var m = 0; Object.keys(rects).forEach(function (k) { if (rects[k]) { m = Math.max(m, rects[k].x + rects[k].largeur); } }); return m; }

  function placer(b, r) {
    b.style.left = r.x + 'px'; b.style.top = r.y + 'px'; b.style.width = r.largeur + 'px'; b.style.height = r.hauteur + 'px';
    b.classList.toggle('pl-petite', r.hauteur < 120 || r.largeur < 180);
    b.classList.toggle('pl-grande', r.hauteur >= 200 && r.largeur >= 280);
  }
  function retirerPlace(b) { b.style.left = b.style.top = b.style.width = b.style.height = ''; b.classList.remove('pl-petite', 'pl-grande'); }

  /** Dimensions de la surface en modification : jamais plus petite que l'écran, elle grandit avec les tuiles (jusqu'aux limites du plan). */
  function tailleSurface(rects) {
    var Z = etat.zone;
    var l = Math.max(largeurDisponible(), droiteDe(rects));
    var h = basDe(rects);
    if (etat.edition) { h = Math.min(Z.hauteur, Math.max(h + 240, 480)); l = Math.min(Z.largeur, Math.max(l, 400)); }
    return { largeur: l, hauteur: h };
  }

  function disposer() {
    if (!etat.zone || etat.vue === '3d') { return; }
    if (!mqLarge.matches) {                                   // téléphone : liste de cartes, rien à positionner
      surface.className = 'pl-surface pl-liste';
      surface.style.width = surface.style.height = '';
      Object.keys(etat.objets).forEach(function (id) { retirerPlace(etat.objets[id].el); });
      Object.keys(etat.titres).forEach(function (k) { etat.titres[k].style.top = ''; });
      etat.rects = {};
      return;
    }
    var c = calculerRects();
    etat.rects = c.rects;
    surface.className = 'pl-surface ' + (c.mode === 'auto' ? 'pl-auto' : 'pl-libre');
    Object.keys(etat.objets).forEach(function (id) { var r = c.rects[id]; if (r) { placer(etat.objets[id].el, r); } });
    Object.keys(etat.titres).forEach(function (k) { etat.titres[k].style.top = (c.titres[k] === undefined ? 0 : c.titres[k]) + 'px'; });
    var s = tailleSurface(c.rects);
    surface.style.width = s.largeur + 'px';
    surface.style.height = s.hauteur + 'px';
  }

  // ---- Les deux vues : 3D et Tuiles (mêmes données, une seule source) --------------------------------------------------------------------
  function creerVue3d() {
    if (!w.PlanVue3D) { return { disponible: function () { return false; }, activer: function () { return false; }, desactiver: function () {}, donnees: function () {}, recherche: function () {}, selection: function () {}, marge: function () {} }; }
    return w.PlanVue3D.creer({
      conteneur: scene3d,
      ouvrir: function (id, declencheur) { if (etat.edition) { return; } if (etat.tiroirId === id) { fermerTiroir(); } else { ouvrirTiroir(id, declencheur); } },
      fermer: function () { fermerTiroir(); },
      repli: function () { choisirVue('tuiles', { memoriser: false }); },       // contexte WebGL perdu pour de bon : retour discret aux tuiles
      aide: { resumeHtml: resumeHtml, libelle: libelleTuile, icone: function (type) { return ICONES[type] || 'fa-warehouse'; }, marque: marque },
    });
  }
  /** Places (px) de la vue 3D : celles enregistrées ; les emplacements jamais placés se rangent automatiquement (même règle que les tuiles). */
  function rects3d() {
    var G = etat.zone.grille, rects = {};
    var placees = etat.tuiles.filter(function (t) { return t.pos; }), libres = etat.tuiles.filter(function (t) { return !t.pos; });
    placees.forEach(function (t) { rects[t.id] = copie(t.pos); });
    if (libres.length) {
      var a = placees.length ? rangerAuto(libres, Math.max(LARGEUR_3D, droiteDe(rects)), basDe(rects) + 2 * G, false) : rangerAuto(libres, LARGEUR_3D, 0, false);
      libres.forEach(function (t) { rects[t.id] = a.rects[t.id]; });
    }
    return rects;
  }
  function pousser3d(anime) {
    if (etat.vue !== '3d' || !etat.zone) { return; }
    ui3d.donnees(etat.tuiles, rects3d(), etat.resume, anime);
  }
  function majRecherche3d() {
    if (etat.vue !== '3d') { return; }
    var par = null;
    if (etat.recherche && etat.recherche.emplacements.length) { par = {}; etat.recherche.emplacements.forEach(function (e) { par[e.emplacement_id] = e.quantite; }); }
    ui3d.recherche(par, etat.recherche);
  }
  /** Montre la vue choisie (et la liste « Aucun emplacement. » quand il n'y a rien à dessiner en 3D). */
  /** En 3D sur grand écran, la fiche flotte dans la scène (comme la fiche de détail de la référence) ; sinon elle reste en panneau de la page. */
  function placerTiroir() {
    var cible = (etat.vue === '3d' && mqLarge.matches) ? scene3d : racine;
    if (tiroir.parentNode !== cible) { cible.appendChild(tiroir); }
  }
  function afficherVue() {
    var trois = etat.vue === '3d' && etat.tuiles.length > 0;
    plan.hidden = trois;
    scene3d.hidden = !trois;
  }
  function choisirVue(v, opts) {
    opts = opts || {};
    var avant = etat.vue;
    if (v === '3d' && (etat.edition || !ui3d.disponible())) { v = 'tuiles'; }
    if (v === '3d' && avant !== '3d') {
      etat.vue = '3d';
      if (!ui3d.activer()) { v = 'tuiles'; etat.vue = avant; }
    }
    if (v !== '3d' && avant === '3d') { ui3d.desactiver(); }
    etat.vue = v;
    racine.classList.toggle('pl-mode-3d', v === '3d');
    racine.classList.toggle('pl-mode-tuiles', v !== '3d');
    Array.prototype.forEach.call(vues.querySelectorAll('.pl-vue'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-vue') === v ? 'true' : 'false'); });
    afficherVue();
    placerTiroir();
    if (v === '3d') {
      pousser3d(false);
      majRecherche3d();
      if (etat.tiroirId !== null) { ui3d.marge(mqLarge.matches ? 376 : 0); ui3d.selection(etat.tiroirId); }
    } else { disposer(); }
    if (opts.memoriser !== false) { try { w.localStorage.setItem(CLE_VUE, v); } catch (e) { /* stockage refusé : le choix ne sera pas gardé */ } }
  }
  function vueInitiale() {
    if (!ui3d.disponible()) { return 'tuiles'; }
    var m = null;
    try { m = w.localStorage.getItem(CLE_VUE); } catch (e) { m = null; }
    if (m === '3d' || m === 'tuiles') { return m; }
    return mqLarge.matches ? '3d' : 'tuiles';
  }
  vues.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.pl-vue') : null;
    if (b && !etat.edition) { choisirVue(b.getAttribute('data-vue'), { memoriser: true }); }
  });

  // ---- Recherche : où est cette pièce ? ---------------------------------------------------------------------------------------
  function appliquerRecherche(rec) {
    etat.recherche = rec && rec.piece ? rec : null;
    var par = {};
    if (etat.recherche) { etat.recherche.emplacements.forEach(function (e) { par[e.emplacement_id] = e.quantite; }); }
    var actif = !!etat.recherche && etat.recherche.emplacements.length > 0;
    racine.classList.toggle('pl-cherche', actif);
    Object.keys(etat.objets).forEach(function (id) {
      var o = etat.objets[id];
      o.qte = par[id];
      o.el.classList.toggle('pl-trouve', o.qte !== undefined);
      majTuile(o);
    });
    majRecherche3d();
    if (!etat.recherche) { bandeau.hidden = true; bandeau.textContent = ''; bandeau.removeAttribute('data-html'); vider.hidden = !champ.value; return; }
    var p = etat.recherche.piece;
    bandeau.hidden = false;
    var htmlBandeau = '<span class="pl-bandeau-piece"><span class="code">' + esc(p.code) + '</span>' + esc(p.nom) + '</span>' +
      (actif ? '<span class="pl-bandeau-somme"><b>' + quantiteAvecUnite(etat.recherche.somme, p.unite) + '</b> en stock</span>'
             : '<span class="pl-bandeau-rien">Aucun emplacement n\'en a en stock.</span>') +
      '<button type="button" class="pl-croix" aria-label="Effacer la recherche"><i class="fas fa-times" aria-hidden="true"></i></button>';
    if (bandeau.getAttribute('data-html') !== htmlBandeau) {              // reconstruit seulement s'il change (le focus de la croix est gardé)
      bandeau.innerHTML = htmlBandeau;
      bandeau.setAttribute('data-html', htmlBandeau);
      bandeau.querySelector('.pl-croix').addEventListener('click', effacerRecherche);
    }
    vider.hidden = false;
    marquerTiroir();
  }
  function effacerRecherche() {
    etat.pieceId = null;
    fermerSuggestions();
    champ.value = '';
    appliquerRecherche(null);
    marquerTiroir();
    champ.focus();
  }

  /** Lit le plan (et, si une pièce est cherchée, où elle est). Seule la réponse la plus récente est appliquée. */
  function charger() {
    var mon = ++etat.seq;
    var params = etat.pieceId ? { piece_id: etat.pieceId } : null;
    return w.api.get('app/ajax/plan_data.php', params).then(function (r) {
      if (mon !== etat.seq) { return r; }
      appliquerDonnees(r, true);
      return r;
    });
  }
  function appliquerDonnees(r, pulse) {
    etat.zone = r.zone;
    etat.version = r.version;
    etat.derniereLecture = Date.now();
    racine.setAttribute('data-version', r.version);
    var anime = pulse && !etat.premier;
    etat.resume = r.resume;
    appliquerTuiles(r.tuiles, anime);
    disposer();
    pousser3d(anime);
    appliquerRecherche(r.recherche);
    etat.premier = false;
    afficherVue();
    if (etat.tiroirId !== null) {
      if (!etat.objets[etat.tiroirId]) { fermerTiroir(); } else { chargerTiroir(true); }
    }
  }

  // ---- Champ de scan / recherche ------------------------------------------------------------------------------------------------
  var suggs = [], actifSugg = -1, seqSugg = 0, minuteSugg = null;
  function majVider() { vider.hidden = !champ.value && !etat.recherche; }
  function fermerSuggestions() {
    seqSugg++; clearTimeout(minuteSugg);
    liste.hidden = true; liste.textContent = ''; suggs = []; actifSugg = -1;
    champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant');
  }
  function activerSugg(i) {
    var items = liste.children;
    if (!items.length) { return; }
    actifSugg = (i + items.length) % items.length;
    Array.prototype.forEach.call(items, function (li, k) { li.setAttribute('aria-selected', k === actifSugg ? 'true' : 'false'); });
    champ.setAttribute('aria-activedescendant', items[actifSugg].id);
    try { items[actifSugg].scrollIntoView({ block: 'nearest' }); } catch (e) { /* ancien navigateur */ }
  }
  function montrerSuggestions(pieces) {
    liste.textContent = ''; suggs = pieces; actifSugg = -1;
    pieces.forEach(function (p, k) {
      var li = d.createElement('li');
      li.setAttribute('role', 'option'); li.id = 'pl-sug-' + k; li.setAttribute('aria-selected', 'false');
      li.innerHTML = '<span class="code pl-sug-code">' + esc(p.code) + '</span><span class="pl-sug-nom">' + esc(p.nom) + '</span>';
      li.addEventListener('mousedown', function (ev) { ev.preventDefault(); });          // le champ garde le focus
      li.addEventListener('click', function () { choisirPiece(p, true); });
      liste.appendChild(li);
    });
    liste.hidden = !pieces.length;
    champ.setAttribute('aria-expanded', pieces.length ? 'true' : 'false');
  }
  function chercherNoms(terme) {
    var n = ++seqSugg;
    return w.api.get('app/ajax/pieces_recherche.php', { q: terme, limite: 8 }).then(function (r) {
      if (n !== seqSugg) { return null; }
      var l = r.pieces || [];
      montrerSuggestions(l);
      return l;
    });
  }
  /** Une pièce choisie dans la liste (ou seule trouvée par son nom). $depuisListe : le texte tapé est effacé ; sinon (Entrée) le lecteur l'a déjà effacé. */
  function choisirPiece(p, depuisListe) {
    if (depuisListe) { fermerSuggestions(); champ.value = ''; majVider(); }
    etat.pieceId = p.id;
    charger().catch(function (e) { w.toast(msgErreur(e), 'danger'); });
    champ.focus();
  }

  /** Code scanné ou texte tapé + Entrée : code-barres, code interne ou code d'emplacement ; sinon recherche par nom.
   *  Si la personne a déjà recommencé à taper quand la réponse arrive (champ non vide), sa nouvelle frappe n'est jamais touchée. */
  function traiterCode(code) {
    return w.api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
      if (r.trouve && r.type === 'piece') {
        if (!champ.value) { fermerSuggestions(); }
        etat.pieceId = r.piece.id;
        return charger().then(function () { return true; });
      }
      if (r.trouve && r.type === 'emplacement') {
        var o = etat.objets[r.emplacement.id];
        if (!o) { throw new Error('Cet emplacement n\'est pas sur le plan.'); }
        if (!champ.value) { fermerSuggestions(); }
        ouvrirTiroir(o.t.id, o.el);
        return true;
      }
      return chercherNoms(code).then(function (l) {
        if (l === null) { return true; }                      // une saisie plus récente a pris le relais
        if (l.length === 1) { if (!champ.value) { fermerSuggestions(); } choisirPiece(l[0], false); return true; }
        if (!l.length) { throw new Error('Pièce inconnue : « ' + code + ' ».'); }
        return true;                                          // plusieurs pièces : la liste est affichée, on choisit
      });
    });
  }

  champ.addEventListener('input', function () {
    clearTimeout(minuteSugg);
    var t = champ.value.trim();
    vider.hidden = !t && !etat.recherche;
    if (t.length < 2) { fermerSuggestions(); return; }
    minuteSugg = setTimeout(function () { chercherNoms(t).catch(function () { /* la recherche est un confort : le scan reste possible */ }); }, 220);
  });
  // (avant w.scanner : Entrée sur une suggestion choisie aux flèches ne doit pas être lue comme un code)
  champ.addEventListener('keydown', function (ev) {
    if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !liste.hidden) {
      ev.preventDefault(); activerSugg(actifSugg < 0 ? (ev.key === 'ArrowDown' ? 0 : -1) : actifSugg + (ev.key === 'ArrowDown' ? 1 : -1));
    } else if ((ev.key === 'Enter' || ev.key === 'Tab') && actifSugg >= 0 && !liste.hidden) {
      ev.preventDefault(); ev.stopImmediatePropagation(); choisirPiece(suggs[actifSugg], true);
    } else if (ev.key === 'Escape' && !liste.hidden) {
      ev.preventDefault(); ev.stopPropagation(); fermerSuggestions();
    } else if (ev.key === 'Enter' || ev.key === 'Tab') {
      fermerSuggestions();
    }
  });
  champ.addEventListener('blur', function () { setTimeout(function () { if (d.activeElement !== champ) { fermerSuggestions(); } }, 200); });
  vider.addEventListener('click', effacerRecherche);
  w.scanner(champ, function (code) {
    return traiterCode(code).then(function (r) { majVider(); return r; }, function (e) { majVider(); throw e; });
  });

  // ---- Tiroir : contenu d'une tuile ------------------------------------------------------------------------------------------------
  var minuteFiltre = null, seqTiroir = 0;
  function ouvrirTiroir(id, declencheur) {
    var o = etat.objets[id];
    if (!o) { return; }
    var memeTuile = etat.tiroirId === id;
    etat.tiroirId = id;
    if (declencheur) { etat.declencheur = declencheur; }
    tiroir.setAttribute('data-marque', marque(o.t.entreprise_code));
    el('pl-tiroir-titre').textContent = o.t.nom;
    el('pl-tiroir-icone').innerHTML = '<i class="fas ' + (ICONES[o.t.type] || 'fa-warehouse') + '"></i>';
    el('pl-tiroir-sous').innerHTML = '<span class="pl-entreprise">' + esc(o.t.entreprise_nom) + '</span>' + esc(o.t.type_libelle) + (o.t.code ? ' · <span class="code">' + esc(o.t.code) + '</span>' : '');
    el('pl-voir-stock').setAttribute('href', lienPage('stock', { emplacement_id: id }));
    if (!memeTuile) { filtre.value = ''; lignesEl.textContent = ''; lignesEl.removeAttribute('data-html'); etat.tiroirLignes = null; etat.tiroirTronque = false; el('pl-tiroir-resume').textContent = ''; }
    tiroir.hidden = false;
    void tiroir.offsetWidth;
    tiroir.classList.add('pl-ouvert');
    racine.classList.add('pl-tiroir-ouvert');
    Object.keys(etat.objets).forEach(function (k) { etat.objets[k].el.setAttribute('aria-expanded', k === String(id) ? 'true' : 'false'); });
    if (!memeTuile) { el('pl-tiroir-titre').focus({ preventScroll: true }); }
    chargerTiroir(false);
    if (etat.vue === '3d') { ui3d.marge(mqLarge.matches ? 376 : 0); ui3d.selection(id); }
  }
  function fermerTiroir() {
    if (etat.tiroirId === null) { return; }
    var retour = etat.declencheur;
    etat.tiroirId = null; seqTiroir++;
    tiroir.classList.remove('pl-ouvert');
    racine.classList.remove('pl-tiroir-ouvert');
    Object.keys(etat.objets).forEach(function (k) { etat.objets[k].el.removeAttribute('aria-expanded'); });
    var fin = function () { if (etat.tiroirId === null) { tiroir.hidden = true; } };
    if (w.matchMedia('(prefers-reduced-motion: reduce)').matches) { fin(); } else { setTimeout(fin, 300); }
    if (retour && d.body.contains(retour)) { retour.focus({ preventScroll: true }); } else { champ.focus(); }
    if (etat.vue === '3d') { ui3d.selection(null); ui3d.marge(0); }
  }
  function chargerTiroir(silencieux) {
    var id = etat.tiroirId, mon = ++seqTiroir, q = filtre.value.trim();
    return w.api.get('app/ajax/plan_emplacement.php', { emplacement_id: id, q: etat.tiroirTronque ? q : '' }).then(function (r) {
      if (mon !== seqTiroir || id !== etat.tiroirId) { return; }
      etat.tiroirTronque = !!r.tronque;
      rendreLignes(r, silencieux);
    }).catch(function (e) {
      if (mon !== seqTiroir) { return; }
      if (!silencieux) { lignesEl.innerHTML = '<li class="pl-lignes-vide">' + esc(msgErreur(e)) + '</li>'; }
    });
  }
  function rendreLignes(r, silencieux) {
    el('pl-tiroir-resume').innerHTML = resumeHtml(r);
    var anciennes = {};
    (etat.tiroirLignes || []).forEach(function (l) { anciennes[l.piece_id] = l.quantite; });
    var avait = etat.tiroirLignes !== null;
    etat.tiroirLignes = r.lignes;
    var haut = lignesEl.scrollTop;
    var html = r.lignes.map(function (l) {
      var cls = 'pl-ligne' + (avait && silencieux && anciennes[l.piece_id] !== l.quantite ? ' pl-change' : '');
      return '<li class="' + cls + '" data-piece="' + esc(l.piece_id) + '" data-recherche="' + esc(normaliser(l.code + ' ' + l.nom)) + '">' +
        '<span class="pl-ligne-nom">' + esc(l.nom) + (l.actif ? '' : ' <span class="badge badge-secondary">Désactivée</span>') + '</span>' +
        '<span class="pl-ligne-sous"><a href="' + esc(lienPage('piece_voir', { id: l.piece_id })) + '" class="code">' + esc(l.code) + '</a>' + (l.bas ? '<span class="badge badge-bas">Sous le minimum</span>' : '') + '</span>' +
        '<span class="pl-ligne-qte">' + quantiteAvecUnite(l.quantite, l.unite) + '</span></li>';
    }).join('');
    if (!r.lignes.length) { html = '<li class="pl-lignes-vide">' + (filtre.value.trim() ? 'Aucune pièce trouvée.' : 'Aucune pièce.') + '</li>'; }
    if (lignesEl.getAttribute('data-html') !== html) { lignesEl.innerHTML = html; lignesEl.setAttribute('data-html', html); lignesEl.scrollTop = haut; }
    marquerTiroir();
    filtrerLocal();
  }
  /** La pièce cherchée en haut est repérée dans la liste du tiroir. */
  function marquerTiroir() {
    var id = etat.recherche ? String(etat.recherche.piece.id) : null;
    Array.prototype.forEach.call(lignesEl.querySelectorAll('.pl-ligne'), function (li) { li.classList.toggle('pl-ligne-trouvee', li.getAttribute('data-piece') === id); });
  }
  /** Recherche rapide : sur place quand toute la liste est là, sinon (très longue liste) le serveur filtre. */
  function filtrerLocal() {
    if (etat.tiroirTronque) { return; }
    var mots = normaliser(filtre.value.trim()).split(/\s+/).filter(Boolean), n = 0;
    Array.prototype.forEach.call(lignesEl.querySelectorAll('.pl-ligne'), function (li) {
      var t = li.getAttribute('data-recherche'), ok = mots.every(function (m) { return t.indexOf(m) !== -1; });
      li.hidden = !ok; if (ok) { n++; }
    });
    var vide0 = lignesEl.querySelector('.pl-lignes-filtre');
    if (vide0) { vide0.remove(); }
    if (mots.length && !n && etat.tiroirLignes && etat.tiroirLignes.length) {
      var li = d.createElement('li'); li.className = 'pl-lignes-vide pl-lignes-filtre'; li.textContent = 'Aucune pièce trouvée.'; lignesEl.appendChild(li);
    }
  }
  filtre.addEventListener('input', function () {
    if (!etat.tiroirTronque) { filtrerLocal(); return; }
    clearTimeout(minuteFiltre);
    minuteFiltre = setTimeout(function () { chargerTiroir(false); }, 250);
  });
  el('pl-tiroir-fermer').addEventListener('click', fermerTiroir);

  // Un clic sur une tuile ouvre (ou ferme) son tiroir ; en modification, les tuiles se déplacent mais ne s'ouvrent pas
  surface.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.pl-tuile') : null;
    if (!b || etat.edition) { return; }
    var id = parseInt(b.getAttribute('data-id'), 10);
    if (etat.tiroirId === id) { fermerTiroir(); } else { ouvrirTiroir(id, b); }
  });

  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) { return; }
    if (glisse) { finGlisse({ pointerId: glisse.pointeur }, true); return; }       // Échap pendant un glisser : on laisse tomber
    if (etat.tiroirId !== null) { fermerTiroir(); return; }
    if (!etat.edition && (etat.pieceId || champ.value)) { effacerRecherche(); }
  });

  // ---- Modification du plan (administrateur) --------------------------------------------------------------------------------------
  var glisse = null;
  function snap(v) { var G = etat.zone.grille; return Math.round(v / G) * G; }
  function bornes() { var G = etat.zone.grille, s = tailleSurface(etat.rects || {}); return { l: Math.floor(Math.min(etat.zone.largeur, Math.max(s.largeur, 400)) / G) * G, h: etat.zone.hauteur }; }
  /** Une place est valable si elle reste dans le plan, respecte les tailles permises et ne recouvre aucune autre tuile. */
  function valide(id, r) {
    var Z = etat.zone, B = bornes();
    if (r.x < 0 || r.y < 0 || r.x + r.largeur > B.l || r.y + r.hauteur > B.h) { return false; }
    if (r.largeur < Z.largeur_min || r.largeur > Z.largeur_max || r.hauteur < Z.hauteur_min || r.hauteur > Z.hauteur_max) { return false; }
    return !Object.keys(etat.brouillon).some(function (k) { return k !== String(id) && etat.brouillon[k] && enLigne(r, etat.brouillon[k]); });
  }
  function entrerEdition() {
    if (!admin || etat.edition || !mqLarge.matches) { return; }
    fermerTiroir();
    if (etat.vue === '3d') { etat.apresEdition = '3d'; choisirVue('tuiles', { memoriser: false }); }
    etat.brouillon = {};
    Object.keys(etat.rects).forEach(function (id) { etat.brouillon[id] = copie(etat.rects[id]); });
    etat.avant = JSON.parse(JSON.stringify(etat.brouillon));
    etat.edition = true; etat.sale = false;
    racine.classList.add('pl-edition');
    el('pl-modifier').hidden = true; el('pl-edition-boutons').hidden = false; vues.hidden = true;
    Object.keys(etat.objets).forEach(function (id) { etat.objets[id].el.setAttribute('aria-describedby', 'pl-ent-' + id + ' pl-aide-edition'); });
    disposer();
    var premiere = surface.querySelector('.pl-tuile'); if (premiere) { premiere.focus({ preventScroll: true }); }
  }
  function sortirEdition() {
    etat.edition = false; etat.brouillon = null; etat.avant = null; etat.sale = false; glisse = null;
    racine.classList.remove('pl-edition');
    el('pl-modifier').hidden = false; el('pl-edition-boutons').hidden = true;
    Object.keys(etat.objets).forEach(function (id) { etat.objets[id].el.setAttribute('aria-describedby', 'pl-ent-' + id); etat.objets[id].el.classList.remove('pl-deplace', 'pl-invalide'); });
    disposer();
    vues.hidden = !ui3d.disponible();
    if (etat.apresEdition === '3d') { etat.apresEdition = null; choisirVue('3d', { memoriser: false }); }
    el('pl-modifier').focus();
  }
  function enregistrer() {
    var btn = el('pl-enregistrer');
    var positions = etat.tuiles.map(function (t) { var r = etat.brouillon[t.id]; return { emplacement_id: t.id, x: r.x, y: r.y, largeur: r.largeur, hauteur: r.hauteur }; });
    btn.disabled = true;
    w.api.post('app/action/plan_save.php', { positions: positions }).then(function () {
      etat.tuiles.forEach(function (t) { t.pos = copie(etat.brouillon[t.id]); });
      sortirEdition();
      w.toast('Plan enregistré.', 'success');
      charger().catch(function () { /* la prochaine interrogation relira le plan */ });
    }).catch(function (e) { w.toast(msgErreur(e), 'danger'); }).then(function () { btn.disabled = false; });
  }
  function toutRanger() {
    var a = rangerAuto(etat.tuiles, largeurDisponible(), 0, false);
    etat.tuiles.forEach(function (t) { etat.brouillon[t.id] = a.rects[t.id]; });
    etat.sale = true;
    disposer();
  }
  if (admin) {
    el('pl-modifier').addEventListener('click', entrerEdition);
    el('pl-annuler').addEventListener('click', sortirEdition);
    el('pl-enregistrer').addEventListener('click', enregistrer);
    el('pl-ranger').addEventListener('click', toutRanger);
    var aide = d.createElement('span'); aide.id = 'pl-aide-edition'; aide.className = 'sr-only';
    aide.textContent = 'Flèches pour déplacer, Maj et flèches pour agrandir ou rétrécir.';
    racine.appendChild(aide);
  }
  w.addEventListener('beforeunload', function (e) { if (etat.edition && etat.sale) { e.preventDefault(); e.returnValue = ''; return ''; } });

  // Déplacer et redimensionner : pointer events (souris, doigt, stylet), accrochage à la grille, limites de la zone.
  // Le déplacement se mesure par rapport à la SURFACE (pas à l'écran) : le défilement de la page ou du plan ne fausse rien,
  // et près du bord de l'écran la page défile toute seule (une tablette ne montre pas tout le plan d'un coup).
  surface.addEventListener('pointerdown', function (e) {
    if (!etat.edition || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
    var b = e.target.closest ? e.target.closest('.pl-tuile') : null;
    if (!b) { return; }
    var id = b.getAttribute('data-id'), r = etat.brouillon[id];
    if (!r) { return; }
    var sr = surface.getBoundingClientRect();
    glisse = { id: id, b: b, mode: e.target.closest('.pl-poignee') ? 'taille' : 'deplace', px0: e.clientX - sr.left, py0: e.clientY - sr.top, cx: e.clientX, cy: e.clientY,
      depart: copie(r), courant: copie(r), bouge: false, pointeur: e.pointerId, raf: 0 };
    try { b.setPointerCapture(e.pointerId); } catch (err) { /* capture refusée : le déplacement suit quand même */ }
    b.classList.add('pl-deplace');
    b.focus({ preventScroll: true });
    e.preventDefault();
  });
  /** La place visée d'après la position actuelle du pointeur. */
  function suivre(g) {
    var Z = etat.zone, sr = surface.getBoundingClientRect(), dx = (g.cx - sr.left) - g.px0, dy = (g.cy - sr.top) - g.py0, B = bornes(), r = copie(g.depart);
    if (g.mode === 'deplace') {
      r.x = Math.max(0, Math.min(snap(g.depart.x + dx), B.l - r.largeur));
      r.y = Math.max(0, Math.min(snap(g.depart.y + dy), B.h - r.hauteur));
    } else {
      r.largeur = Math.max(Z.largeur_min, Math.min(snap(g.depart.largeur + dx), Z.largeur_max, B.l - r.x));
      r.hauteur = Math.max(Z.hauteur_min, Math.min(snap(g.depart.hauteur + dy), Z.hauteur_max, B.h - r.y));
    }
    if (r.x !== g.courant.x || r.y !== g.courant.y || r.largeur !== g.courant.largeur || r.hauteur !== g.courant.hauteur) {
      g.bouge = true; g.courant = r;
      placer(g.b, r);
      g.b.classList.toggle('pl-invalide', !valide(g.id, r));
      var tmp = {}; Object.keys(etat.brouillon).forEach(function (k) { tmp[k] = etat.brouillon[k]; }); tmp[g.id] = r;   // la surface grandit avec la tuile
      var s = tailleSurface(tmp); surface.style.height = s.hauteur + 'px'; surface.style.width = s.largeur + 'px';
    }
  }
  /** Près du haut ou du bas de l'écran, la page défile tant que le doigt ou la souris y reste. */
  function defiler(g) {
    if (g.raf) { return; }
    g.raf = w.requestAnimationFrame(function () {
      g.raf = 0;
      if (glisse !== g) { return; }
      var h = w.innerHeight, v = 0;
      if (g.cy > h - 80) { v = Math.min(24, (g.cy - (h - 80)) / 3 + 3); } else if (g.cy < 110) { v = -Math.min(24, (110 - g.cy) / 3 + 3); }
      if (!v) { return; }
      var avant = w.pageYOffset;
      try { w.scrollBy({ top: v, left: 0, behavior: 'instant' }); } catch (err) { w.scrollBy(0, v); }     // « instant » : la page défile en douceur sinon (CSS d'AdminLTE)
      if (w.pageYOffset !== avant) { suivre(g); }
      defiler(g);
    });
  }
  surface.addEventListener('pointermove', function (e) {
    if (!glisse || e.pointerId !== glisse.pointeur) { return; }
    glisse.cx = e.clientX; glisse.cy = e.clientY;
    suivre(glisse);
    defiler(glisse);
  });
  function finGlisse(e, annule) {
    if (!glisse || e.pointerId !== glisse.pointeur) { return; }
    var g = glisse; glisse = null;
    try { g.b.releasePointerCapture(e.pointerId); } catch (err) { /* déjà relâchée */ }
    g.b.classList.remove('pl-deplace', 'pl-invalide');
    if (g.bouge && !annule && valide(g.id, g.courant)) { etat.brouillon[g.id] = g.courant; etat.sale = true; }
    disposer();                                                // une place refusée (recouvrement) revient à la précédente
  }
  surface.addEventListener('pointerup', function (e) { finGlisse(e, false); });
  surface.addEventListener('pointercancel', function (e) { finGlisse(e, true); });
  // Clavier : flèches = déplacer de 20 px, Maj + flèches = changer la taille
  surface.addEventListener('keydown', function (e) {
    if (!etat.edition || !e.target.classList || !e.target.classList.contains('pl-tuile')) { return; }
    var G = etat.zone.grille, dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') { dx = -G; } else if (e.key === 'ArrowRight') { dx = G; } else if (e.key === 'ArrowUp') { dy = -G; } else if (e.key === 'ArrowDown') { dy = G; } else { return; }
    e.preventDefault();
    var id = e.target.getAttribute('data-id'), r = copie(etat.brouillon[id]);
    if (e.shiftKey) { r.largeur += dx; r.hauteur += dy; } else { r.x += dx; r.y += dy; }
    if (valide(id, r)) { etat.brouillon[id] = r; etat.sale = true; disposer(); }
  });

  // ---- Temps réel : le jeton de version, interrogé sans jamais empiler de requêtes ---------------------------------------------------
  var minuterie = null, enCours = false, echecs = 0;
  function indicateur(ok) {
    direct.classList.toggle('pl-hors-ligne', !ok);
    var t = ok ? 'En direct' : 'Connexion perdue';
    if (directTexte.textContent !== t) { directTexte.textContent = t; }
    racine.setAttribute('data-direct', ok ? '1' : '0');
  }
  function prochain() {
    clearTimeout(minuterie); minuterie = null;
    if (d.hidden) { racine.setAttribute('data-sondage', 'pause'); return; }          // onglet caché : on s'arrête
    racine.setAttribute('data-sondage', 'actif');
    var delai = echecs ? Math.min(ATTENTE_MAX, INTERVALLE * Math.pow(2, echecs)) : INTERVALLE;
    minuterie = setTimeout(interroger, delai);
  }
  function lireVersion() {
    var ctl = ('AbortController' in w) ? new AbortController() : null;
    var arret = setTimeout(function () { if (ctl) { ctl.abort(); } }, DELAI_REQUETE);
    return fetch('app/ajax/plan_version.php', { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(function (resp) {
        clearTimeout(arret);
        if (resp.status === 401) { w.location.href = 'login.php'; throw new Error('Session expirée.'); }
        return resp.json().then(function (j) { if (!resp.ok || !j || j.ok === false || typeof j.version !== 'string') { throw new Error('Réponse inattendue.'); } return j.version; });
      }, function (err) { clearTimeout(arret); throw err; });
  }
  function interroger() {
    if (enCours || d.hidden) { return; }
    enCours = true;
    clearTimeout(minuterie);
    racine.setAttribute('data-sondages', String((parseInt(racine.getAttribute('data-sondages'), 10) || 0) + 1));
    lireVersion().then(function (version) {
      var vieux = Date.now() - etat.derniereLecture > TOUT_RELIRE;
      if (version !== etat.version || vieux) { return charger().then(function () { return true; }); }
      return true;
    }).then(function () { echecs = 0; indicateur(true); }, function () { echecs++; indicateur(false); })
      .then(function () { enCours = false; prochain(); });
  }
  d.addEventListener('visibilitychange', function () {
    if (d.hidden) { clearTimeout(minuterie); minuterie = null; racine.setAttribute('data-sondage', 'pause'); return; }
    echecs = 0;
    interroger();                                           // retour sur l'onglet : on se remet à jour tout de suite
  });
  w.addEventListener('online', function () { echecs = 0; if (!d.hidden) { interroger(); } });
  w.addEventListener('offline', function () { indicateur(false); });

  // ---- Mise en page : l'écran change de taille (rangement automatique) ou passe du téléphone à l'écran large ---------------------------
  var minuteTaille = null;
  w.addEventListener('resize', function () {
    clearTimeout(minuteTaille);
    minuteTaille = setTimeout(function () { if (!glisse) { disposer(); } }, 120);
  });
  function changementMode() { if (!mqLarge.matches && etat.edition) { sortirEdition(); } placerTiroir(); disposer(); }
  if (mqLarge.addEventListener) { mqLarge.addEventListener('change', changementMode); } else if (mqLarge.addListener) { mqLarge.addListener(changementMode); }

  // ---- Départ -------------------------------------------------------------------------------------------------------------------------
  var depart = null;
  try { depart = JSON.parse(racine.getAttribute('data-donnees') || 'null'); } catch (e) { depart = null; }
  racine.removeAttribute('data-donnees');
  vues.hidden = !ui3d.disponible();                         // le commutateur n'existe que si WebGL fonctionne
  var voulue = vueInitiale();
  if (voulue === '3d') { plan.hidden = true; }              // pas d'éclair de tuiles avant la scène
  choisirVue(voulue, { memoriser: false });
  if (depart) { appliquerDonnees(depart, false); } else { charger().catch(function (e) { w.toast(msgErreur(e), 'danger'); }); }
  indicateur(true);
  prochain();
  champ.focus();
})(window, jQuery);
