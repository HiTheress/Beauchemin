/* Interface de la vue 3D du Plan (page « Plan »). La scène elle-même est dans plan3d.bundle.js (Three.js, construit par tools/plan3d) ;
 * ici : cycle de vie de la scène (création / destruction au changement de vue), étiquettes HTML posées sur les bâtiments, cartes de statistiques,
 * barre d'outils de la caméra, et lecture des changements en direct (anneau qui pulse, « +3 » / « −2 », carton qui vole d'un emplacement à l'autre).
 * Appelé par plan.js (une seule source de données). Aucun texte explicatif ; seulement des quantités (jamais de prix ni de valeur).
 */
(function (w) {
  'use strict';
  var d = document;

  w.PlanVue3D = { creer: creer };

  /**
   * o : { conteneur, ouvrir(id, el), fermer(), repli(), interieur(id, piece?), retour(), piece(emplacementId, pieceId), ranger(emplacementId, pieceId, dest, ok, ko),
   *       aide: { resumeHtml(t), libelle(t), icone(type), marque(code) } }
   * Intérieur d'un emplacement (vue en coupe) : entrerInterieur(id, donnees, opts) / sortirInterieur() / majInterieur(donnees) ; les données sont la réponse de plan_emplacement.php.
   */
  function creer(o) {
    var conteneur = o.conteneur, scene = d.getElementById('pl3-scene'), couche = d.getElementById('pl3-etiquettes');
    var vue = null, actif = false, webgl = null, dernier = null, precedent = null, etiq = {}, ordre = [];
    var recherche = null, rechCle = '', selection = null, survole = null, timerDelta = null;
    var mqReduit = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function reduit() { return !!(mqReduit && mqReduit.matches); }
    function nombre(s) { var n = parseFloat(s); return isNaN(n) ? 0 : n; }
    function arrondi(n) { return Math.round(n * 1000) / 1000; }

    function disponible() {
      if (webgl === null) { webgl = !!(w.Plan3D && w.Plan3D.disponible && w.Plan3D.disponible()); }
      return webgl;
    }

    // ---- Cycle de vie -----------------------------------------------------------------------------------------------------------
    function activer() {
      if (actif) { return true; }
      if (!disponible()) { return false; }
      conteneur.hidden = false;                                  // la zone doit avoir une taille avant la création du contexte
      try {
        vue = w.Plan3D.creer(scene, { libelle: scene.getAttribute('data-libelle') || '', logos: { bea: scene.getAttribute('data-logo-bea') || '', bch: scene.getAttribute('data-logo-bch') || '' }, surRendu: rendu, surSelection: clic, surSurvol: survol, surPerte: perte,
          surDoubleClic: function (id) { if (o.interieur) { o.interieur(id); } }, fmtQte: w.fmtQte, surCaisse: caisseSurvol, surCaisseClic: caisseClic, surRanger: ranger });
      } catch (e) { vue = null; conteneur.hidden = true; webgl = false; return false; }
      actif = true;
      vue.marges(w.innerWidth < 768 ? { g: 8, d: 8, h: 62, b: 58 } : { g: 20, d: 20, h: 78, b: 22 });
      precedent = null;                                           // plan.js envoie tout de suite les données courantes (donnees())
      return true;
    }
    function desactiver() {
      if (vue) { try { vue.detruire(); } catch (e) { /* déjà détruite */ } vue = null; }
      actif = false; recherche = null; rechCle = ''; dernier = null; precedent = null; selection = null; survole = null; unitesAffichees = null;
      Object.keys(etiq).forEach(function (id) { etiq[id].el.remove(); });
      etiq = {}; ordre = [];
      reinitialiserInterieur();
      conteneur.hidden = true;
      ['images', 'dessins', 'triangles', 'logos', 'epingles', 'pulses', 'vols', 'actifs', 'zoom', 'azimut', 'ms', 'cartons', 'caisses', 'zone', 'cachees', 'interieur'].forEach(function (k) { conteneur.removeAttribute('data-' + k); });
      clearTimeout(timerDelta);
    }
    function perte() { if (o.repli) { o.repli(); } }

    // ---- Données ------------------------------------------------------------------------------------------------------------------
    function instantane(tuiles) {
      var s = {};
      tuiles.forEach(function (t) { s[t.id] = { u: nombre(t.unites), sig: t.sig, nb: t.nb_pieces, bas: t.nb_bas }; });
      return s;
    }

    /** Appelé par plan.js à chaque lecture du plan : tuiles du serveur, places (px), résumé ; anime = les changements se voient (temps réel). */
    function donnees(tuiles, rects, resume, anime) {
      var nouveau = { tuiles: tuiles, rects: rects, resume: resume };
      majStats(resume, tuiles, anime && precedent);
      if (!actif) { dernier = nouveau; return; }
      appliquer(nouveau, anime ? precedent : null);
      dernier = nouveau;
    }

    function appliquer(n, avant) {
      majEtiquettes(n.tuiles, n.rects);
      var diffs = [], retards = {}, vols = [];
      if (avant) {
        n.tuiles.forEach(function (t) {
          var p = avant[t.id];
          if (!p) { return; }
          var du = arrondi(nombre(t.unites) - p.u);
          if (du !== 0 || p.sig !== t.sig || p.nb !== t.nb_pieces || p.bas !== t.nb_bas) { diffs.push({ id: t.id, delta: du }); }
        });
        // un déplacement : un emplacement perd N pendant qu'un autre gagne N
        var pertes = diffs.filter(function (x) { return x.delta < 0; }), gains = diffs.filter(function (x) { return x.delta > 0; });
        pertes.forEach(function (p) {
          for (var i = 0; i < gains.length; i++) {
            if (Math.abs(gains[i].delta + p.delta) < 0.0005 && !gains[i].pris) { gains[i].pris = true; vols.push({ de: p.id, vers: gains[i].id }); if (!reduit()) { retards[gains[i].id] = 950; } break; }
          }
        });
      }
      vue.definirDonnees(n.tuiles, n.rects, { retards: retards });
      appliquerRecherche(true);
      precedent = instantane(n.tuiles);
      if (diffs.length) {
        var arrivees = {};
        vols.forEach(function (v) { arrivees[v.vers] = true; });
        var tous = diffs.filter(function (x) { return !arrivees[x.id] || reduit(); }).map(function (x) { return x.id; });
        vue.pulser(tous);
        diffs.forEach(function (x) { if (x.delta !== 0 && (!arrivees[x.id] || reduit())) { flotter(x.id, x.delta); } });
        vols.forEach(function (v) {
          if (reduit()) { return; }
          vue.voler(v.de, v.vers, function () { if (!actif) { return; } vue.pulser([v.vers]); var g = diffs.filter(function (x) { return x.id === v.vers; })[0]; if (g) { flotter(v.vers, g.delta); } });
        });
      }
    }

    // ---- Étiquettes HTML sur les bâtiments ---------------------------------------------------------------------------------------------
    function creerEtiquette(t) {
      var b = d.createElement('button');
      b.type = 'button'; b.className = 'pl3-etiquette'; b.setAttribute('data-id', t.id);
      b.innerHTML = '<span class="pl3-alerte" aria-hidden="true"><i class="fas fa-exclamation" aria-hidden="true"></i><b></b></span>' +
        '<span class="pl3-corps"><span class="pl3-icone" aria-hidden="true"><i class="fas"></i></span>' +
        '<span class="pl3-textes"><span class="pl3-nom"></span><span class="pl3-chiffres"></span></span><span class="pl3-qte" hidden></span></span>';
      b.addEventListener('click', function () { o.ouvrir(t.id, b); });
      b.addEventListener('focus', function () {
        var a = derniereAncre[t.id];
        if (vue && (!a || !a.dedans) && b.matches && b.matches(':focus-visible')) { vue.cadrer([t.id]); }
      });
      var e = { el: b, nom: b.querySelector('.pl3-nom'), chiffres: b.querySelector('.pl3-chiffres'), icone: b.querySelector('.pl3-icone i'), qte: b.querySelector('.pl3-qte'), alerte: b.querySelector('.pl3-alerte'), nbAlerte: b.querySelector('.pl3-alerte b'), sale: true, w: 0, h: 0, masque: null, html: '', rendu: '' };
      couche.appendChild(b);
      return e;
    }
    function libelleDe(e) { return o.aide.libelle(e.t) + (recherche && recherche[e.t.id] !== undefined ? ', contient ' + w.fmtQte(recherche[e.t.id]) : ''); }
    function majEtiquettes(tuiles, rects) {
      var presents = {};
      tuiles.forEach(function (t) {
        presents[t.id] = true;
        var e = etiq[t.id];
        if (!e) { e = etiq[t.id] = creerEtiquette(t); }
        var h = o.aide.resumeHtml(t);
        e.el.setAttribute('data-marque', o.aide.marque(t.entreprise_code));
        e.el.setAttribute('data-type', t.type);
        e.t = t;
        e.el.setAttribute('aria-label', libelleDe(e));
        if (e.nom.textContent !== t.nom) { e.nom.textContent = t.nom; e.sale = true; }
        if (e.html !== h) { e.chiffres.innerHTML = h; e.html = h; e.sale = true; }
        e.icone.className = 'fas ' + o.aide.icone(t.type);
        e.alerte.hidden = !t.nb_bas;
        if (t.nb_bas) { e.nbAlerte.textContent = t.nb_bas; e.alerte.setAttribute('title', t.nb_bas + ' ' + (t.nb_bas > 1 ? 'pièces sous le minimum' : 'pièce sous le minimum')); }
        e.el.setAttribute('data-bas', t.nb_bas ? String(t.nb_bas) : '');
      });
      Object.keys(etiq).forEach(function (id) { if (!presents[id]) { etiq[id].el.remove(); delete etiq[id]; } });
      // ordre du DOM = ordre de lecture du plan (Tab suit le dessin : de haut en bas, de gauche à droite)
      var voulu = tuiles.slice().sort(function (a, b) { var ra = rects[a.id] || { x: 0, y: 0 }, rb = rects[b.id] || { x: 0, y: 0 }; return (ra.y - rb.y) || (ra.x - rb.x) || (a.id - b.id); }).map(function (t) { return t.id; });
      if (voulu.join() !== ordre.join()) { voulu.forEach(function (id) { couche.appendChild(etiq[id].el); }); ordre = voulu; }
    }

    var derniereAncre = {};
    /** Après chaque image dessinée : positionne les étiquettes (masque celles qui se chevauchent ou sont cachées derrière un bâtiment). */
    function rendu(r) {
      // compteurs discrets (lus par les tests de navigateur ; rien n'est affiché)
      var at = { 'data-images': r.images, 'data-dessins': r.dessins, 'data-triangles': r.triangles, 'data-epingles': r.epingles, 'data-pulses': r.pulses, 'data-vols': r.vols, 'data-actifs': r.actifs,
        'data-logos': r.logos, 'data-zoom': Math.round(r.ech * 100) / 100, 'data-azimut': Math.round(r.az * 10000) / 10000, 'data-ms': Math.round(r.ms * 100) / 100, 'data-cartons': r.cartons };
      Object.keys(at).forEach(function (k) { conteneur.setAttribute(k, at[k]); });
      if (r.interieur) { renduInterieur(r); return; }
      var l = [], W = r.largeur;
      derniereAncre = {};
      r.ancres.forEach(function (a) {
        derniereAncre[a.id] = a;
        var e = etiq[a.id]; if (!e) { return; }
        if (e.sale || !e.w) { e.w = e.el.offsetWidth; e.h = e.el.offsetHeight; e.sale = false; }
        var prio = a.id === selection ? 0 : (recherche && recherche[a.id] !== undefined) ? 1 : 2;
        var x = Math.max(6, Math.min(W - e.w - 6, a.x - e.w / 2)), y = a.y - e.h - 14 - (a.pin || 0);
        l.push({ e: e, a: a, prio: prio, x: x, y: y, ax: a.x, ay: a.y - (a.pin || 0) });
        e.el.setAttribute('data-cartons', a.cartons); e.el.setAttribute('data-logo', a.logo ? '1' : '');
      });
      l.sort(function (p, q) { return (p.prio - q.prio) || (p.a.z - q.a.z); });
      var places = [];
      l.forEach(function (p) {
        var e = p.e, w0 = e.w, h0 = e.h, cache = !p.a.dedans || (p.prio > 1 && p.a.cache);
        if (!cache) {
          for (var i = 0; i < places.length; i++) {
            var q = places[i], ix = Math.min(p.x + w0, q.x + q.w) - Math.max(p.x, q.x), iy = Math.min(p.y + h0, q.y + q.h) - Math.max(p.y, q.y);
            if (ix > 0 && iy > 0 && ix * iy > 0.12 * Math.min(w0 * h0, q.w * q.h)) { cache = true; break; }
          }
        }
        if (!cache) { places.push({ x: p.x, y: p.y, w: w0, h: h0 }); }
        if (e.masque !== cache) { e.masque = cache; e.el.classList.toggle('pl3-masque', cache); }
        e.el.style.transform = 'translate3d(' + (Math.round(p.x * 2) / 2) + 'px,' + (Math.round(p.y * 2) / 2) + 'px,0)';
        e.el.style.setProperty('--pointe', Math.round(Math.max(14, Math.min(w0 - 14, p.ax - p.x))) + 'px');
        e.el.style.zIndex = String(10 + Math.max(0, Math.round(900 - p.a.z)));
      });
    }

    /** « +3 » vert ou « −2 » rouge qui flotte au-dessus du bâtiment puis s'estompe. */
    function flotter(id, delta) {
      var e = etiq[id]; if (!e || !delta) { return; }
      var s = d.createElement('span');
      s.className = 'pl3-delta ' + (delta > 0 ? 'pl3-plus' : 'pl3-moins');
      s.setAttribute('aria-hidden', 'true');
      s.setAttribute('data-delta', (delta > 0 ? '+' : '−') + w.fmtQte(String(Math.abs(delta))));
      s.textContent = (delta > 0 ? '+' : '−') + w.fmtQte(String(Math.abs(delta)));
      e.el.appendChild(s);
      setTimeout(function () { if (s.parentNode) { s.remove(); } }, reduit() ? 3200 : 2800);
      e.el.setAttribute('data-impulsion', String(Date.now()));
    }

    // ---- Cartes de statistiques --------------------------------------------------------------------------------------------------------
    var elU = d.getElementById('pl3-unites'), elB = d.getElementById('pl3-bas'), elE = d.getElementById('pl3-emp'), elD = d.getElementById('pl3-delta'), carteB = d.getElementById('pl3-stat-bas');
    var unitesAffichees = null;
    function majStats(resume, tuiles, avecDelta) {
      var u = resume ? resume.unites : String(tuiles.reduce(function (s, t) { return s + nombre(t.unites); }, 0));
      var bas = resume ? resume.nb_bas : tuiles.reduce(function (s, t) { return s + (t.nb_bas || 0); }, 0);
      var emp = resume ? resume.nb_emplacements : tuiles.length;
      var avant = unitesAffichees;
      elU.textContent = w.fmtQte(u); elB.textContent = String(bas); elE.textContent = String(emp);
      elU.setAttribute('data-valeur', u); elB.setAttribute('data-valeur', String(bas)); elE.setAttribute('data-valeur', String(emp));
      carteB.classList.toggle('pl3-alerte-carte', bas > 0);
      unitesAffichees = nombre(u);
      if (avecDelta && avant !== null && arrondi(unitesAffichees - avant) !== 0) {
        var dd = arrondi(unitesAffichees - avant);
        elD.textContent = (dd > 0 ? '+' : '−') + w.fmtQte(String(Math.abs(dd)));
        elD.className = 'pl3-delta-carte ' + (dd > 0 ? 'pl3-plus' : 'pl3-moins'); elD.hidden = false;
        clearTimeout(timerDelta); timerDelta = setTimeout(function () { elD.hidden = true; }, 4500);
      }
    }

    // ---- Recherche, sélection, survol, clics ---------------------------------------------------------------------------------------------
    /** par : { id d'emplacement : quantité (chaîne) } ou null ; rec : { piece: { unite } } (pour l'unité de la pastille). */
    function majRecherche(par, rec) {
      recherche = par && Object.keys(par).length ? par : null;
      appliquerRecherche(false, rec);
    }
    var dernierRec = null;
    function appliquerRecherche(suite, rec) {
      if (rec !== undefined) { dernierRec = rec; }
      if (!actif) { return; }
      if (dedans) { chercherDedans(false); }
      var ids = recherche ? Object.keys(recherche).sort() : [], cle = ids.length ? ((dernierRec && dernierRec.piece ? dernierRec.piece.id : '') + ':' + ids.join(',')) : '';
      var unite = dernierRec && dernierRec.piece && dernierRec.piece.unite && dernierRec.piece.unite !== 'unité' ? ' ' + dernierRec.piece.unite : '';
      Object.keys(etiq).forEach(function (id) {
        var e = etiq[id], trouve = recherche && recherche[id] !== undefined;
        e.el.classList.toggle('pl3-trouve', !!trouve);
        e.el.classList.toggle('pl3-estompe', !!recherche && !trouve);
        if (trouve) { e.qte.textContent = w.fmtQte(recherche[id]) + unite; e.qte.hidden = false; e.el.setAttribute('data-epingle', recherche[id]); }
        else { e.qte.hidden = true; e.el.removeAttribute('data-epingle'); }
        e.sale = true;
        e.el.setAttribute('aria-label', libelleDe(e));
      });
      if (suite && cle === rechCle) { vue.chercher(recherche ? mapNum(recherche) : null, { cadrer: false }); return; }
      var change = cle !== rechCle; rechCle = cle;
      vue.chercher(recherche ? mapNum(recherche) : null, { cadrer: change && !!recherche });
    }
    function mapNum(par) { var m = {}; Object.keys(par).forEach(function (id) { m[parseInt(id, 10)] = par[id]; }); return m; }

    function majSelection(id) {
      selection = id === undefined ? null : id;
      Object.keys(etiq).forEach(function (k) {
        var e = etiq[k], sel = parseInt(k, 10) === selection;
        e.el.classList.toggle('pl3-actif', sel);
        if (sel) { e.el.setAttribute('aria-expanded', 'true'); } else { e.el.removeAttribute('aria-expanded'); }
      });
      if (actif && !dedans) { vue.selectionner(selection === null ? null : selection, { cadrer: selection !== null }); }
    }
    function clic(id, canevas) {
      if (id === null) { if (selection !== null && o.fermer) { o.fermer(); } return; }
      o.ouvrir(id, etiq[id] ? etiq[id].el : canevas);
    }
    function survol(id) {
      if (survole !== null && etiq[survole]) { etiq[survole].el.classList.remove('pl3-survol'); }
      survole = id;
      if (id !== null && etiq[id]) { etiq[id].el.classList.add('pl3-survol'); }
    }


    // ---- Intérieur d'un emplacement : vue en coupe, fiche au survol, « +N / −N », liste pour le clavier --------------------------------------
    var elInt = d.getElementById('pl3-int'), elFil = d.getElementById('pl3-fil-nom'), elStatsBloc = d.getElementById('pl3-stats'), elCarte = d.getElementById('pl3-carte'), elPuces = d.getElementById('pl3-puces'), elClavier = d.getElementById('pl3-clavier');
    var dedans = null, puces = [], libelleCanevas = null;
    var LETTRES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function nomAllee(a, type) { if (type === 'cube') { return a === 1 ? 'Côté gauche' : (a === 2 ? 'Côté droit' : 'Côté ' + a); } return 'Allée ' + (LETTRES.charAt(a - 1) || a); }
    function posTexte(p, type) { return nomAllee(p.allee, type) + ' · Étagère ' + p.etagere + ' · Niveau ' + p.niveau; }
    function posVoix(p, type) { return nomAllee(p.allee, type) + ', étagère ' + p.etagere + ', niveau ' + p.niveau; }
    function qteTexte(l) {
      var n = parseFloat(l.quantite), u = l.unite && l.unite !== 'unité' ? l.unite : (n >= 2 ? 'unités' : 'unité');
      return w.fmtQte(l.quantite) + ' ' + u;
    }
    function placee(l) { return !!l.rangement; }

    function reinitialiserInterieur() {
      puces.forEach(function (p) { clearTimeout(p.minute); p.el.remove(); }); puces = [];
      if (elPuces) { elPuces.textContent = ''; }
      if (elClavier) { elClavier.textContent = ''; elClavier.hidden = true; }
      if (elCarte) { elCarte.hidden = true; }
      if (elInt) { elInt.hidden = true; }
      if (elStatsBloc) { elStatsBloc.hidden = false; }
      couche.hidden = false;
      conteneur.classList.remove('pl3-dedans');
      var cv = scene.querySelector('canvas');
      if (cv && libelleCanevas !== null) { cv.setAttribute('aria-label', libelleCanevas); }
      libelleCanevas = null; dedans = null;
    }

    /** Entre dans l'emplacement id : donnees = réponse de plan_emplacement.php ; opts.piece = pièce à montrer tout de suite. */
    function entrerInterieur(id, donnees, opts) {
      if (!actif || !vue || dedans) { return false; }
      var t = null; (dernier ? dernier.tuiles : []).forEach(function (x) { if (x.id === id) { t = x; } });
      if (!t) { return false; }
      var piece = opts && opts.piece && donnees.lignes.some(function (l) { return l.piece_id === opts.piece; }) ? opts.piece : null;
      if (!vue.entrerInterieur(id, donnees, { piece: piece })) { return false; }
      dedans = { id: id, type: t.type, nom: t.nom, lignes: donnees.lignes, peutRanger: !!donnees.peut_ranger, piece: piece };
      couche.hidden = true; elStatsBloc.hidden = true; elInt.hidden = false;
      elFil.textContent = t.nom;
      conteneur.classList.add('pl3-dedans'); conteneur.setAttribute('data-interieur', String(id));
      var cv = scene.querySelector('canvas');
      if (cv) { libelleCanevas = cv.getAttribute('aria-label') || ''; cv.setAttribute('aria-label', 'Intérieur de ' + t.nom + '. La liste des pièces est disponible au clavier.'); }
      construireClavier();
      return true;
    }
    function sortirInterieur() {
      if (!dedans) { return false; }
      var id = dedans.id;
      if (vue) { vue.sortirInterieur(); }
      reinitialiserInterieur();
      ['caisses', 'zone', 'cachees', 'interieur'].forEach(function (k) { conteneur.removeAttribute('data-' + k); });
      if (etiq[id]) { try { etiq[id].el.focus({ preventScroll: true }); } catch (e) { /* élément détaché */ } }
      return true;
    }
    /** Lecture en direct : nouvelles lignes ; « +N / −N » au-dessus des caisses dont la quantité a changé. */
    function majInterieur(donnees) {
      if (!dedans || !vue) { return; }
      dedans.lignes = donnees.lignes; dedans.peutRanger = !!donnees.peut_ranger;
      var evenements = vue.majInterieur(donnees.lignes) || [];
      evenements.forEach(function (e) { puce(e.id, e.delta); });
      construireClavier();
      chercherDedans(false);
    }
    function chercherDedans(cadrer) {
      if (!dedans || !vue) { return; }
      var p = dernierRec && dernierRec.piece && recherche ? dernierRec.piece.id : null;
      if (p !== null && !dedans.lignes.some(function (l) { return l.piece_id === p; })) { p = null; }
      if (p === dedans.piece && !cadrer) { return; }
      dedans.piece = p;
      vue.interieurChercher(p, p !== null);
    }

    // liste pour le clavier et les lecteurs d'écran : un bouton par pièce, placé comme dans la scène ; le focus met la caisse en avant
    function construireClavier() {
      var info = vue.interieurInfo(), cases = {}, zone = 0, cachees = 0, caisses = 0;
      if (info) { info.cases.forEach(function (c) { cases[c.id] = c; if (!c.cachee) { caisses++; } if (c.zone) { zone++; } if (c.cachee) { cachees++; } }); }
      conteneur.setAttribute('data-zone', String(zone)); conteneur.setAttribute('data-cachees', String(cachees));
      var focus = d.activeElement && elClavier.contains(d.activeElement) ? d.activeElement.getAttribute('data-piece') : null;
      elClavier.textContent = '';
      dedans.lignes.slice().sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; }).forEach(function (l) {
        if (!parseFloat(l.quantite) && !cases[l.piece_id]) { return; }
        var c = cases[l.piece_id], li = d.createElement('li'), b = d.createElement('button');
        b.type = 'button'; b.className = 'pl3-clavier-btn'; b.setAttribute('data-piece', String(l.piece_id));
        b.setAttribute('data-case', !c ? '' : c.zone ? 'zone' : c.a + ':' + c.e + ':' + c.n + (c.cachee ? ':cachee' : ''));
        b.setAttribute('aria-label', l.code + ', ' + l.nom + ', ' + qteTexte(l) + ', ' + (l.rangement ? posVoix(l.rangement, dedans.type) : 'à ranger') + (l.bas ? ', sous le minimum' : ''));
        b.textContent = l.code;
        b.addEventListener('focus', function () { if (vue) { vue.interieurFocus(l.piece_id); } });
        b.addEventListener('blur', function () { if (vue) { vue.interieurFocus(null); } cacherCarte(); });
        b.addEventListener('click', function () { if (o.piece) { o.piece(dedans.id, l.piece_id); } });
        li.appendChild(b); elClavier.appendChild(li);
      });
      elClavier.hidden = !elClavier.children.length;
      if (focus) { var r = elClavier.querySelector('[data-piece="' + focus + '"]'); if (r) { r.focus({ preventScroll: true }); } }
    }

    // fiche au survol d'une caisse (code, nom, quantité, position, « sous le minimum ») ; plusieurs pièces dans la même case : une petite liste
    var cCode = elCarte.querySelector('.pl3-carte-code'), cBas = elCarte.querySelector('.pl3-carte-bas'), cNom = elCarte.querySelector('.pl3-carte-nom'), cQte = elCarte.querySelector('.pl3-carte-qte'), cPos = elCarte.querySelector('.pl3-carte-pos');
    function cacherCarte() { if (!elCarte.hidden) { elCarte.hidden = true; } }
    function caisseSurvol(info, px, py, foc) {
      if (!dedans || !info) { cacherCarte(); return; }
      var type = dedans.type, ligne = null;
      if (foc !== null && foc !== undefined) { info.lignes.forEach(function (l) { if (l.piece_id === foc) { ligne = l; } }); if (!ligne) { dedans.lignes.forEach(function (l) { if (l.piece_id === foc) { ligne = l; } }); } }
      var pos = info.zone ? 'À ranger' : info.rangement ? posTexte(info.rangement, type) : '';
      if (ligne) {
        cCode.textContent = ligne.code; cNom.textContent = ligne.nom; cQte.textContent = qteTexte(ligne); cPos.textContent = pos || (ligne.rangement ? posTexte(ligne.rangement, type) : 'À ranger');
        cBas.hidden = !ligne.bas; elCarte.classList.toggle('pl3-carte-bas-oui', !!ligne.bas); elCarte.classList.remove('pl3-carte-liste');
      } else if (info.lignes && info.lignes.length) {
        cCode.textContent = pos; cBas.hidden = true; cPos.textContent = ''; cQte.textContent = '';
        cNom.textContent = info.lignes.slice(0, 5).map(function (l) { return l.code + ' · ' + w.fmtQte(l.quantite); }).join('   ') + (info.lignes.length > 5 ? '   +' + (info.lignes.length - 5) : '');
        elCarte.classList.add('pl3-carte-liste'); elCarte.classList.remove('pl3-carte-bas-oui');
      } else { cacherCarte(); return; }
      elCarte.hidden = false;
      var W = scene.clientWidth, H = scene.clientHeight, cw = elCarte.offsetWidth, ch = elCarte.offsetHeight, x = px, y = py;
      if (px < 0 || py < 0) { var e = vue.interieurInfo().position(foc); if (!e) { cacherCarte(); return; } x = e.x; y = e.y; }
      var gx = Math.max(8, Math.min(W - cw - 8, x + 16)), gy = y + 20 + ch > H - 8 ? Math.max(8, y - ch - 16) : y + 20;
      elCarte.style.transform = 'translate3d(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px,0)';
    }
    function caisseClic(id, info) {
      cacherCarte();
      if (id === null || id === undefined) { if (selection !== null && o.fermer) { o.fermer(); } return; }
      if (dedans && o.piece) { o.piece(dedans.id, id); }
    }
    /** Une caisse déposée dans une autre case (gestionnaire et administrateur) : plan.js l'enregistre ; ko() la fait revenir. */
    function ranger(pieceId, dest, ok, ko) {
      if (!dedans || !o.ranger) { ko(); return; }
      o.ranger(dedans.id, pieceId, dest, ok, ko);
    }

    // « +3 » / « −2 » qui suit la caisse à l'écran, puis s'estompe
    function puce(id, delta) {
      if (!dedans || !delta) { return; }
      var s = d.createElement('span'), t = d.createElement('span'), pos = vue.interieurInfo().position(id), txt = (delta > 0 ? '+' : '−') + w.fmtQte(String(Math.abs(delta)));
      s.className = 'pl3-puce'; t.className = 'pl3-puce-txt ' + (delta > 0 ? 'pl3-plus' : 'pl3-moins');
      s.setAttribute('data-delta', txt); t.textContent = txt; s.appendChild(t);
      var p = { id: id, el: s, x: pos ? pos.x : 0, y: pos ? pos.y : 0 };
      s.style.transform = 'translate3d(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px,0)';
      elPuces.appendChild(s); puces.push(p);
      suivrePuces();
      p.minute = setTimeout(function () { s.remove(); puces = puces.filter(function (q) { return q !== p; }); suivrePuces(); }, reduit() ? 3200 : 2800);
    }
    function suivrePuces() { if (vue && dedans) { vue.interieurSuivre(puces.map(function (p) { return p.id; })); } }
    function renduInterieur(r) {
      var at = { 'data-images': r.images, 'data-dessins': r.dessins, 'data-triangles': r.triangles, 'data-epingles': r.epingles, 'data-pulses': r.pulses, 'data-actifs': r.actifs,
        'data-logos': r.logos, 'data-zoom': Math.round(r.ech * 100) / 100, 'data-azimut': Math.round(r.az * 10000) / 10000, 'data-ms': Math.round(r.ms * 100) / 100, 'data-caisses': r.caisses, 'data-cartons': r.cartons };
      Object.keys(at).forEach(function (k) { conteneur.setAttribute(k, at[k]); });
      puces.forEach(function (p) {
        var e = r.int && r.int.suivis ? r.int.suivis[p.id] : null;
        if (e) { p.x = e.x; p.y = e.y; }
        p.el.style.transform = 'translate3d(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px,0)';
      });
    }
    // sonde des tests : l'événement « pl3-positions » écrit, sur chaque bouton de la liste, la place de sa caisse à l'écran (data-x, data-y) et, sur la scène, celle d'une case ou de la zone
    conteneur.addEventListener('pl3-positions', function (ev) {
      var info = dedans && vue ? vue.interieurInfo() : null; if (!info) { return; }
      Array.prototype.forEach.call(elClavier.querySelectorAll('[data-piece]'), function (b) {
        var p = info.position(parseInt(b.getAttribute('data-piece'), 10));
        if (p) { b.setAttribute('data-x', String(Math.round(p.x))); b.setAttribute('data-y', String(Math.round(p.y))); }
      });
      var c = ev.detail && ev.detail.cellule, q = c ? info.cellule(c[0], c[1], c[2]) : ev.detail && ev.detail.zone ? info.zone() : null;
      if (q) { conteneur.setAttribute('data-cx', String(Math.round(q.x))); conteneur.setAttribute('data-cy', String(Math.round(q.y))); }
    });
    var elRetour = d.getElementById('pl3-retour');
    if (elRetour) { elRetour.addEventListener('click', function () { if (o.retour) { o.retour(); } }); }

    // ---- Barre d'outils de la caméra ----------------------------------------------------------------------------------------------------------
    d.getElementById('pl3-outils').addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b || !vue) { return; }
      var a = b.getAttribute('data-act');
      if (a === 'plus') { vue.zoom(1.4); } else if (a === 'moins') { vue.zoom(1 / 1.4); }
      else if (a === 'gauche') { vue.pivoter(-1); } else if (a === 'droite') { vue.pivoter(1); } else if (a === 'centrer') { vue.recentrer(); }
    });

    couche.addEventListener('wheel', function (ev) { if (vue) { vue.molette(ev); } }, { passive: false });      // le zoom marche aussi au-dessus d'une étiquette

    function marge(droite) { if (vue) { vue.marges({ d: (w.innerWidth < 768 ? 8 : 20) + Math.max(0, droite || 0) }); } }

    return {
      disponible: disponible, activer: activer, desactiver: desactiver, actif: function () { return actif; },
      donnees: donnees, recherche: majRecherche, selection: majSelection, marge: marge,
      reprendre: function () { if (vue) { vue.redessiner(); } },
      entrerInterieur: entrerInterieur, sortirInterieur: sortirInterieur, majInterieur: majInterieur, interieurActif: function () { return !!dedans; },
    };
  }
})(window);
