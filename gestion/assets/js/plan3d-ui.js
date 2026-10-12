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
   * o : { conteneur, ouvrir(id, el), fermer(), repli(), aide: { resumeHtml(t), libelle(t), icone(type), marque(code) } }
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
        vue = w.Plan3D.creer(scene, { libelle: scene.getAttribute('data-libelle') || '', surRendu: rendu, surSelection: clic, surSurvol: survol, surPerte: perte });
      } catch (e) { vue = null; conteneur.hidden = true; webgl = false; return false; }
      actif = true;
      if (dernier) { precedent = instantane(dernier.tuiles); appliquer(dernier, null); }
      return true;
    }
    function desactiver() {
      if (vue) { try { vue.detruire(); } catch (e) { /* déjà détruite */ } vue = null; }
      actif = false; recherche = null; rechCle = '';
      Object.keys(etiq).forEach(function (id) { etiq[id].el.remove(); });
      etiq = {}; ordre = [];
      conteneur.hidden = true;
      ['images', 'dessins', 'triangles', 'epingles', 'pulses', 'vols', 'actifs', 'zoom', 'azimut', 'ms', 'cartons'].forEach(function (k) { conteneur.removeAttribute('data-' + k); });
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
        'data-zoom': Math.round(r.ech * 100) / 100, 'data-azimut': Math.round(r.az * 10000) / 10000, 'data-ms': Math.round(r.ms * 100) / 100, 'data-cartons': r.cartons };
      Object.keys(at).forEach(function (k) { conteneur.setAttribute(k, at[k]); });
      var l = [], W = r.largeur;
      derniereAncre = {};
      r.ancres.forEach(function (a) {
        derniereAncre[a.id] = a;
        var e = etiq[a.id]; if (!e) { return; }
        if (e.sale || !e.w) { e.w = e.el.offsetWidth; e.h = e.el.offsetHeight; e.sale = false; }
        var prio = a.id === selection ? 0 : (recherche && recherche[a.id] !== undefined) ? 1 : 2;
        var x = Math.max(6, Math.min(W - e.w - 6, a.x - e.w / 2)), y = a.y - e.h - 14 - (a.pin || 0);
        l.push({ e: e, a: a, prio: prio, x: x, y: y, ax: a.x, ay: a.y - (a.pin || 0) });
        e.el.setAttribute('data-cartons', a.cartons);
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
      if (actif) { vue.selectionner(selection === null ? null : selection, { cadrer: selection !== null }); }
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

    // ---- Barre d'outils de la caméra ----------------------------------------------------------------------------------------------------------
    d.getElementById('pl3-outils').addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b || !vue) { return; }
      var a = b.getAttribute('data-act');
      if (a === 'plus') { vue.zoom(1.4); } else if (a === 'moins') { vue.zoom(1 / 1.4); }
      else if (a === 'gauche') { vue.pivoter(-1); } else if (a === 'droite') { vue.pivoter(1); } else if (a === 'centrer') { vue.recentrer(); }
    });

    function marge(droite) { if (vue) { vue.marges({ d: 24 + Math.max(0, droite || 0) }); } }

    return {
      disponible: disponible, activer: activer, desactiver: desactiver, actif: function () { return actif; },
      donnees: donnees, recherche: majRecherche, selection: majSelection, marge: marge,
      reprendre: function () { if (vue) { vue.redessiner(); } },
    };
  }
})(window);
