// La scène 3D du Plan : un bâtiment par emplacement, posé à sa place enregistrée (1 case de 20 px = 1 mètre).
// Rendu À LA DEMANDE : requestAnimationFrame ne tourne que pendant une interaction ou une animation ; au repos, aucune image n'est dessinée.
import { WebGLRenderer, Scene, HemisphereLight, DirectionalLight, Group, Mesh, MeshLambertMaterial, BoxGeometry, PlaneGeometry, Raycaster, Vector2, Vector3, PCFShadowMap, SRGBColorSpace } from 'three';
import { Vue, AZ0 } from './camera.js';
import { Anim } from './anim.js';
import { alea, clamp } from './geo.js';
import { entrepot, boutique, camion, marque } from './batiments.js';
import { Remplissage } from './remplissage.js';
import { Effets } from './effets.js';
import { construireMonde } from './monde.js';
import * as TX from './textures.js';

const NOMBRE_MAX = 1000;
const MURS_TEINTE = { bea: 0xf3f9ff, bch: 0xfff8f3, neutre: 0xf6f8fb };
const BOUTIQUE_TEINTE = { bea: 0xe6f3ef, bch: 0xf7ece3, neutre: 0xeef0f4 };

/** Niveau de remplissage visible (0 = quai vide) : échelle logarithmique plafonnée, minimum visible si l'emplacement n'est pas vide. */
export function niveau(t) {
  const u = parseFloat(t.unites) || 0;
  if (!(t.nb_pieces > 0) || u <= 0) { return 0; }
  return clamp(0.12 + 0.88 * Math.log10(1 + u) / Math.log10(1 + NOMBRE_MAX), 0.12, 1);
}

export class Scene3D {
  constructor(conteneur, o) {
    this.o = o || {}; this.conteneur = conteneur;
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reduit = () => !!(mq && mq.matches);
    this.anim = new Anim(this.reduit);

    // ---- Rendu ------------------------------------------------------------------------------------------------------------------
    const r = this.r = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = PCFShadowMap; r.shadowMap.autoUpdate = false;
    r.setClearColor(0x000000, 0);
    const cv = this.canvas = r.domElement;
    cv.className = 'pl3-canevas';
    cv.setAttribute('role', 'img'); cv.setAttribute('tabindex', '0');
    if (this.o.libelle) { cv.setAttribute('aria-label', this.o.libelle); }
    conteneur.insertBefore(cv, conteneur.firstChild);
    this.aniso = Math.min(4, r.capabilities.getMaxAnisotropy());

    this.scene = new Scene();
    this.hemi = new HemisphereLight(0xffffff, 0xaab8d4, 1.55); this.scene.add(this.hemi);
    this.soleil = new DirectionalLight(0xfff3e4, 2.35); this.soleil.castShadow = true;
    this.soleil.shadow.mapSize.set(window.innerWidth < 768 ? 1024 : 2048, window.innerWidth < 768 ? 1024 : 2048);
    this.soleil.shadow.bias = -0.0006; this.soleil.shadow.normalBias = 0.05; this.soleil.shadow.radius = 3.5;
    this.scene.add(this.soleil, this.soleil.target);

    this.tex = { murs: TX.murs(this.aniso), toit: TX.toit(this.aniso), dalles: TX.dalles(this.aniso) };
    this.texMarque = {};
    this.sig = ''; this.cleRecherche = ''; this.rechercheFaite = false;
    this.B = new Map(); this.pickables = []; this.monde = null; this.cleMonde = '';
    this.groupe = new Group(); this.scene.add(this.groupe);

    this.images = 0; this.dessins = 0; this.triangles = 0;
    this.demande = false; this.detruit = false; this.perdu = false; this.ombresSale = true;
    this.selId = null; this.survolId = null; this.recherche = null; this.azSoleil = null; this.marges = { g: 24, d: 24, h: 96, b: 36 };
    this.ray = new Raycaster(); this.ndc = new Vector2();
    this.limites = { x0: -50, x1: 50, z0: -50, z1: 50, echMin: 4, echMax: 90 };
    this.fit = 12; this.bornes = null;

    this.effets = new Effets(this.scene, this.anim, () => this.demander(), () => { this.ombresSale = true; });
    this.ms = 0;
    this.rem = new Remplissage(this.scene, this.anim, () => this.demander());
    this.vue = new Vue(cv, {
      anim: this.anim, demander: () => this.demander(), limites: () => this.limites, recentrer: () => this.recentrer(true),
      surChange: () => this.camChange(),
      surClic: (x, y) => { const id = this.choisir(x, y); if (this.o.surSelection) { this.o.surSelection(id, cv); } },
      surSurvol: (x, y) => this.survoler(x, y),
    });

    // ---- Réactions de l'environnement ---------------------------------------------------------------------------------------------
    const mesurer = () => { const b = conteneur.getBoundingClientRect(); this.taille(b.width, b.height); };
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(mesurer) : null;
    if (this.ro) { this.ro.observe(conteneur); } else { window.addEventListener('resize', mesurer); this.ecouteResize = mesurer; }
    this.surVisibilite = () => { if (document.hidden) { cancelAnimationFrame(this.raf); this.demande = false; } else { this.demander(); } };
    document.addEventListener('visibilitychange', this.surVisibilite);
    this.surPerte = e => { e.preventDefault(); this.perdu = true; cancelAnimationFrame(this.raf); this.demande = false; clearTimeout(this.minutePerte); this.minutePerte = setTimeout(() => { if (this.perdu && this.o.surPerte) { this.o.surPerte(); } }, 3500); };
    this.surRestaure = () => { clearTimeout(this.minutePerte); this.perdu = false; this.ombresSale = true; this.demander(); };
    cv.addEventListener('webglcontextlost', this.surPerte); cv.addEventListener('webglcontextrestored', this.surRestaure);
    mesurer();
    this.reglerSoleil(true);
  }

  // ---- Boucle à la demande ----------------------------------------------------------------------------------------------------------
  demander() {
    if (this.demande || this.detruit || this.perdu || document.hidden) { return; }
    this.demande = true;
    this.raf = requestAnimationFrame(t => this.dessiner(t));
  }
  ombres() { this.ombresSale = true; this.demander(); }
  dessiner() {
    this.demande = false;
    if (this.detruit || this.perdu) { return; }
    const now = performance.now();
    let encore = this.anim.maj(now);
    if (this.rem.maj(now)) { encore = true; this.ombresSale = true; }
    if (this.ombresSale) { this.r.shadowMap.needsUpdate = true; this.ombresSale = false; }
    this.r.render(this.scene, this.vue.cam);
    this.images++; this.dessins = this.r.info.render.calls; this.triangles = this.r.info.render.triangles;
    this.rapporter();
    this.ms = performance.now() - now;
    if (encore || this.anim.actif() || this.rem.occupe) { this.demander(); }
  }

  taille(w, h) {
    if (this.detruit || w < 2 || h < 2) { return; }
    if (this.w === Math.round(w) && this.h === Math.round(h)) { return; }
    this.w = Math.round(w); this.h = Math.round(h);
    this.r.setSize(this.w, this.h, false);
    this.vue.taille(this.w, this.h);
    this.calculerLimites();
    if (!this.vue.utilisee && this.bornes) { this.recentrer(false); }
    this.camChange();
    this.demander();
  }

  // ---- Soleil et ombres (la lumière suit la caméra : la vue est belle sous les quatre orientations) --------------------------------------
  reglerSoleil(force) {
    const az = this.vue.e.az;
    if (!force && this.azSoleil !== null && Math.abs(az - this.azSoleil) < 1e-4) { return; }
    this.azSoleil = az;
    const sa = Math.sin(az), ca = Math.cos(az);
    let hx = -0.62 * ca + 0.56 * sa, hz = 0.62 * sa + 0.56 * ca; const n = Math.hypot(hx, hz); hx /= n; hz /= n;
    const el = 54 * Math.PI / 180, B = this.bornes || { x0: -20, x1: 20, z0: -15, z1: 15 };
    const cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, R = Math.hypot(B.x1 - B.x0, B.z1 - B.z0) / 2 + 24;
    this.soleil.position.set(cx + hx * Math.cos(el) * 220, Math.sin(el) * 220, cz + hz * Math.cos(el) * 220);
    this.soleil.target.position.set(cx, 0, cz); this.soleil.target.updateMatrixWorld();
    const c = this.soleil.shadow.camera;
    c.left = -R; c.right = R; c.top = R; c.bottom = -R; c.near = 20; c.far = 460; c.updateProjectionMatrix();
    this.ombresSale = true;
  }
  camChange() {
    this.reglerSoleil(false);
    this.effets.orienterTout(this.vue.e.az, this.vue.e.ech);
    this.demander();
  }

  // ---- Données ----------------------------------------------------------------------------------------------------------------------
  materiauxMarque(m) {
    if (!this.texMarque[m.cle]) { this.texMarque[m.cle] = { enseigne: TX.enseigne(m.nom || 'Plan', m.c[0], m.c[1], false, this.aniso), auvent: TX.auvent(m.auvent[0], m.auvent[1], this.aniso) }; }
    return this.texMarque[m.cle];
  }

  fabriquer(t, r) {
    const m = marque(t.entreprise_code), w = r.largeur / 20, d = r.hauteur / 20;
    const cx = (r.x + r.largeur / 2) / 20, cz = (r.y + r.hauteur / 2) / 20, R = alea(t.id * 31 + 7);
    const f = t.type === 'entrepot' ? entrepot(Math.max(4, w - 1.4), Math.max(3, d - 1.4), m, R)
      : t.type === 'boutique' ? boutique(Math.max(5, w - 1.8), Math.max(4, d - 1.2), m, R)
      : camion(w, d, m, R);
    const e = f.echelle || 1, g = new Group();
    g.position.set(cx, 0, cz); g.scale.setScalar(e);
    const mats = [], jet = [];
    const mat = (o, fade) => { const x = new MeshLambertMaterial(o); x.userData.c0 = x.color.clone(); if (fade !== false) { mats.push(x); } jet.push(x); return x; };
    const mesh = (geo, mt, ombre) => { if (!geo) { return null; } const me = new Mesh(geo, mt); me.castShadow = ombre !== false; me.receiveShadow = true; g.add(me); jet.push(geo); return me; };
    const tm = this.materiauxMarque(m);
    mesh(f.statique, mat({ vertexColors: true }));
    if (f.murs) { mesh(f.murs, t.type === 'boutique' ? mat({ color: BOUTIQUE_TEINTE[m.cle] }) : mat({ map: this.tex.murs, color: MURS_TEINTE[m.cle] })); }
    if (f.toit) { mesh(f.toit, mat({ map: this.tex.toit, color: m.toit })); }
    if (f.verre) { mesh(f.verre, f.vitreTrans ? mat({ vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false }, false) : mat({ vertexColors: true, emissive: 0x1a2740, emissiveIntensity: 0.3 }), false); }
    f.plaques.forEach(p => {
      let geo, mt;
      if (p.auvent) { geo = new BoxGeometry(p.w, 0.07, p.l); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setXY(i, uv.getX(i) * p.w / 1.0, uv.getY(i)); } geo.rotateX(p.rx); mt = mat({ map: tm.auvent, color: 0xffffff }); }
      else { geo = new PlaneGeometry(p.w, p.h); mt = mat({ map: tm.enseigne, color: 0xffffff, transparent: true }); }
      const me = mesh(geo, mt, !!p.auvent); me.position.set(p.x, p.y, p.z); if (p.ry) { me.rotation.y = p.ry; }
    });
    const pick = new Mesh(new BoxGeometry(f.boite[0], f.boite[1], f.boite[2]), new MeshLambertMaterial({ visible: false }));
    pick.position.y = f.boite[1] / 2; pick.userData.id = t.id; g.add(pick); jet.push(pick.geometry, pick.material);
    this.groupe.add(g);
    this.pickables.push(pick);

    const cap = f.piles.reduce((s, p) => s + p.cols * p.rows * p.layers, 0);
    return {
      id: t.id, cle: cleDe(t, r), t, m, type: t.type, g, pick, mats, jet, cx, cz, w: f.boite[0] * e, d: f.boite[2] * e, tw: w, td: d, e, h: f.h * e, cap, piles: f.piles,
      ancre: new Vector3(cx + f.ancre[0] * e, f.ancre[1] * e, cz + f.ancre[2] * e), pin: f.pin, pinY: f.pin[1] * e, pinEchelle: t.type === 'cube' ? 0.72 : t.type === 'boutique' ? 0.85 : 1,
      fade: 0, cartons: 0,
    };
  }
  retirer(b) {
    this.groupe.remove(b.g);
    this.pickables.splice(this.pickables.indexOf(b.pick), 1);
    b.jet.forEach(x => x.dispose());
    this.effets.retirerEpingle(b.id);
  }

  /** tuiles : tableau du serveur ; rects : id -> { x, y, largeur, hauteur } en pixels ; options { retards: { id: ms } }. */
  definirDonnees(tuiles, rects, opts) {
    if (this.detruit) { return; }
    opts = opts || {};
    // rien n'a changé (relecture périodique du plan) : aucun travail, aucune image
    const sig = tuiles.map(t => t.id + ':' + t.unites + ':' + t.nb_pieces + ':' + t.nb_bas + ':' + t.type + ':' + t.entreprise_code + ':' + (rects[t.id] ? [rects[t.id].x, rects[t.id].y, rects[t.id].largeur, rects[t.id].hauteur].join(',') : '-')).join('|');
    if (sig === this.sig) { tuiles.forEach(t => { const b = this.B.get(t.id); if (b) { b.t = t; } }); return; }
    this.sig = sig;
    const presents = new Set(), neufs = [];
    let batiments = false;
    tuiles.forEach(t => {
      const r = rects[t.id]; if (!r) { return; }
      presents.add(t.id);
      const ancien = this.B.get(t.id), cle = cleDe(t, r);
      if (ancien && ancien.cle === cle) { ancien.t = t; return; }
      if (ancien) { this.retirer(ancien); }
      const b = this.fabriquer(t, r); this.B.set(t.id, b); neufs.push(b); batiments = true;
    });
    Array.from(this.B.keys()).forEach(id => { if (!presents.has(id)) { this.retirer(this.B.get(id)); this.B.delete(id); if (this.selId === id) { this.selId = null; this.effets.selection(null); } batiments = true; } });

    // sol, parcelles, marquages et décor : seulement si la disposition a changé
    const items = Array.from(this.B.values()).map(b => ({ id: b.id, type: b.type, m: b.m, cx: (rects[b.id].x + rects[b.id].largeur / 2) / 20, cz: (rects[b.id].y + rects[b.id].hauteur / 2) / 20, w: rects[b.id].largeur / 20, d: rects[b.id].hauteur / 20 }));
    const cle = items.map(i => i.id + i.type + i.m.cle + i.cx + ',' + i.cz + ',' + i.w + ',' + i.d).sort().join('|');
    if (cle !== this.cleMonde) {
      this.cleMonde = cle;
      if (this.monde) { this.scene.remove(this.monde.groupe); this.monde.liberer(); }
      this.monde = construireMonde(items, this.tex);
      this.monde.groupe.traverse(o => { if (o.isMesh && o.castShadow === undefined) { o.castShadow = false; } });
      this.scene.add(this.monde.groupe);
      this.bornes = this.etendueMonde();
      this.calculerLimites();
      this.reglerSoleil(true);
      if (!this.vue.utilisee) { this.recentrer(!!this.premiereVue); }
      this.premiereVue = true;
    }
    if (batiments) { this.rem.construire(Array.from(this.B.values()).map(b => ({ id: b.id, x: b.cx, z: b.cz, e: b.e, piles: b.piles }))); }
    // niveaux de remplissage
    const niv = {};
    this.B.forEach(b => { const n = niveau(b.t); b.cartons = n > 0 ? Math.min(b.cap, Math.max(Math.min(b.cap, 3), Math.round(n * b.cap))) : 0; niv[b.id] = b.cartons; });
    this.rem.niveaux(niv, { retards: opts.retards, immediat: !this.rendu });
    neufs.forEach(b => { if (b.id === this.selId) { b.glow = 1; b.glowCible = 1; } this.estomperBat(b, b.fade); });
    this.appliquerRecherche(true);
    if (this.selId !== null && this.B.has(this.selId)) { this.effets.selection(this.B.get(this.selId), this.B.get(this.selId).m.halo); }
    this.ombres();
  }

  etendueMonde() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, h = 0;
    this.B.forEach(b => { x0 = Math.min(x0, b.cx - b.tw / 2); x1 = Math.max(x1, b.cx + b.tw / 2); z0 = Math.min(z0, b.cz - b.td / 2); z1 = Math.max(z1, b.cz + b.td / 2); h = Math.max(h, b.h); });
    if (!this.B.size) { x0 = -10; x1 = 10; z0 = -8; z1 = 8; h = 5; }
    return { x0, x1, z0, z1, h };
  }
  pointsDe(boite) { const p = []; [boite.x0, boite.x1].forEach(x => [boite.z0, boite.z1].forEach(z => [0, boite.h].forEach(y => p.push({ x, y, z })))); return p; }

  // ---- Cadrage ----------------------------------------------------------------------------------------------------------------------
  /** Cadre des points du monde dans la zone visible (marges en pixels) : renvoie { x, z, ech, ox, oy }. */
  cadre(points, az, marge) {
    const E = this.vue.etendue(points, az), M = this.marges, m = marge || 0;
    const aw = Math.max(80, this.w - M.g - M.d - 2 * m), ah = Math.max(80, this.h - M.h - M.b - 2 * m);
    const ech = Math.min(aw / Math.max(E.w, 1), ah / Math.max(E.h, 1));
    const c = this.vue.centre(E.cu, E.cv, az);
    return { x: c.x, z: c.z, ech, az, ox: (M.g - M.d) / 2, oy: (M.h - M.b) / 2 };
  }
  calculerLimites() {
    if (!this.bornes || !this.w) { return; }
    const f = this.cadre(this.pointsDe(this.bornes), AZ0, 0);
    this.fit = Math.min(f.ech * 0.92, 26);
    const B = this.bornes;
    this.limites = { x0: B.x0 - 12, x1: B.x1 + 12, z0: B.z0 - 12, z1: B.z1 + 12, echMin: Math.max(2.5, this.fit * 0.55), echMax: Math.max(72, this.fit * 6) };
  }
  recentrer(animer) {
    if (!this.bornes || !this.w) { return; }
    const f = this.cadre(this.pointsDe(this.bornes), AZ0, 0);
    f.ech = Math.min(f.ech * 0.92, 26);
    this.vue.utilisee = false;
    this.vue.aller(f, animer ? 700 : 0);
  }
  /** Centre (et au besoin zoome sur) un ou plusieurs bâtiments : opts.maxFit = zoom maximal en multiples du cadrage d'ensemble ; opts.garder = ne jamais dézoomer. */
  cadrerBatiments(ids, opts) {
    opts = opts || {};
    const pts = []; ids.forEach(id => { const b = this.B.get(id); if (!b) { return; } pts.push(...this.pointsDe({ x0: b.cx - b.tw / 2 - 1, x1: b.cx + b.tw / 2 + 1, z0: b.cz - b.td / 2 - 1, z1: b.cz + b.td / 2 + 1, h: b.h })); });
    if (!pts.length) { return; }
    const az = this.vue.cible('az'), f = this.cadre(pts, az, 18), cur = this.vue.cible('ech');
    let ech = Math.min(f.ech, this.fit * (opts.maxFit || 3));
    if (opts.garder) { ech = Math.max(cur, ech); }
    f.ech = clamp(ech, this.limites.echMin, this.limites.echMax);
    this.vue.utilisee = true;
    this.vue.aller(f, 650);
  }
  definirMarges(m) { Object.assign(this.marges, m); if (this.w) { this.vue.aller({ ox: (this.marges.g - this.marges.d) / 2, oy: (this.marges.h - this.marges.b) / 2 }, 350); } }

  // ---- Interactions : sélection, survol, recherche ---------------------------------------------------------------------------------
  choisir(px, py) {
    if (px < 0) { return null; }
    this.ndc.set(px / this.w * 2 - 1, -(py / this.h) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.vue.cam);
    const h = this.ray.intersectObjects(this.pickables, false);
    return h.length ? h[0].object.userData.id : null;
  }
  survoler(px, py) {
    const id = this.choisir(px, py);
    if (id === this.survolId) { return; }
    this.survolId = id;
    this.canvas.style.cursor = id !== null ? 'pointer' : '';
    const b = id !== null ? this.B.get(id) : null;
    this.effets.survoler(b && b.id !== this.selId ? b : null, 0xffffff);
    if (this.o.surSurvol) { this.o.surSurvol(id); }
    this.demander();
  }
  /** Éclat doux du bâtiment choisi (en plus du cadre au sol). */
  eclat(b, cible) {
    if (!b || b.glowCible === cible) { return; }
    b.glowCible = cible; const de = b.glow || 0;
    if (b.animEclat) { b.animEclat.stop = true; }
    b.animEclat = this.anim.ajouter({ dur: 260, f: k => { b.glow = de + (cible - de) * k; this.estomperBat(b, b.fade); }, fin: () => { b.animEclat = null; } });
    this.demander();
  }
  selectionner(id, opts) {
    const avant = this.selId !== null ? this.B.get(this.selId) : null;
    this.selId = id === undefined ? null : id;
    if (avant && avant.id !== this.selId) { this.eclat(avant, 0); }
    const b = this.selId !== null ? this.B.get(this.selId) : null;
    this.effets.selection(b, b ? b.m.halo : 0);
    if (b) { this.eclat(b, 1); }
    if (b && b.id === this.survolId) { this.effets.survoler(null); }
    if (b && (!opts || opts.cadrer !== false)) { this.cadrerBatiments([b.id], { garder: true, maxFit: 2.2 }); }
    this.demander();
  }
  /** map : { id : quantité } ou null. Les autres bâtiments s'estompent ; une épingle tombe sur chaque emplacement trouvé. */
  chercher(map, opts) {
    const cle = map && Object.keys(map).length ? Object.keys(map).sort().map(k => k + '=' + map[k]).join(',') : '';
    const memeRecherche = cle === this.cleRecherche && !(opts && opts.forcer);
    this.cleRecherche = cle;
    if (memeRecherche && this.rechercheFaite) { return; }
    this.rechercheFaite = true;
    this.recherche = map && Object.keys(map).length ? map : null;
    this.appliquerRecherche(false);
    if (this.recherche && (!opts || opts.cadrer !== false)) { this.cadrerBatiments(Object.keys(this.recherche).map(Number), { maxFit: 2.6 }); }
  }
  appliquerRecherche(sansCadrer) {
    const rech = this.recherche, ordre = [];
    this.B.forEach(b => {
      const trouve = rech ? rech[b.id] !== undefined : false, cible = rech && !trouve ? 1 : 0;
      this.fondu(b, cible);
      if (trouve) { ordre.push(b); } else { this.effets.retirerEpingle(b.id); }
    });
    ordre.forEach((b, i) => { if (!this.effets.pins.has(b.id)) { this.effets.epingle(Object.assign(b, { pin: b.pin, pinY: b.pinY }), i, this.reduit()); } });
    this.effets.orienterTout(this.vue.e.az, this.vue.e.ech);
    this.ombres();
  }
  fondu(b, cible) {
    if (b.fadeCible === cible) { return; }
    b.fadeCible = cible;
    const de = b.fade;
    if (b.animFondu) { b.animFondu.stop = true; }
    b.animFondu = this.anim.ajouter({ dur: 320, f: k => { b.fade = de + (cible - de) * k; this.estomperBat(b, b.fade); }, fin: () => { b.animFondu = null; this.demander(); } });
    this.demander();
  }
  estomperBat(b, k) {
    const g = b.glow || 0;
    b.mats.forEach(m => { m.color.copy(m.userData.c0).multiplyScalar(1 - 0.3 * k); m.emissive.setRGB(0.19 * k + 0.07 * g, 0.215 * k + 0.075 * g, 0.26 * k + 0.09 * g); });
    this.rem.estomper(b.id, k);
  }

  // ---- Temps réel -------------------------------------------------------------------------------------------------------------------
  pulser(ids) { ids.forEach(id => { const b = this.B.get(id); if (b) { this.effets.pulse(b, b.m.halo, this.reduit()); } }); this.demander(); }
  voler(de, vers, fin) {
    const a = this.B.get(de), b = this.B.get(vers);
    if (!a || !b) { if (fin) { fin(); } return; }
    const p = v => ({ x: v.ancre.x, y: v.ancre.y - 0.8, z: v.ancre.z });
    this.effets.voler(p(a), p(b), fin, this.reduit());
  }

  // ---- Rapport pour les étiquettes HTML ------------------------------------------------------------------------------------------------
  rapporter() {
    if (!this.o.surRendu) { return; }
    const liste = [], W = this.w, H = this.h, vue = this.vue;
    const boites = [];
    this.B.forEach(b => {
      const a = vue.ecran(b.ancre, {});
      // boîte à l'écran du bâtiment (8 coins) : sert à masquer une étiquette cachée derrière un bâtiment plus proche
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const hw = b.w / 2, hd = b.d / 2, tmp = { x: 0, y: 0, z: 0 }, p = { x: 0, y: 0, z: 0 };
      for (let i = 0; i < 8; i++) {
        p.x = b.cx + (i & 1 ? hw : -hw); p.z = b.cz + (i & 2 ? hd : -hd); p.y = i & 4 ? b.h : 0;
        vue.ecran(p, tmp); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y);
      }
      const base = vue.ecran({ x: b.cx, y: 0, z: b.cz }, {});
      const pin = this.effets.pins.get(b.id), o = { id: b.id, pin: pin ? Math.round(3.0 * pin.g.scale.x * vue.e.ech) : 0, x: a.x, y: a.y, z: base.z, boite: [x0, y0, x1, y1], dedans: a.x > -40 && a.x < W + 40 && a.y > -40 && a.y < H + 40, cartons: b.cartons, vus: this.rem.nombreVisible(b.id), fade: b.fade };
      liste.push(o); boites.push(o);
    });
    // un bâtiment plus proche de la caméra (profondeur plus petite) dont la boîte contient le point d'ancrage cache l'étiquette
    liste.forEach(o => { o.cache = boites.some(q => q !== o && q.z < o.z - 0.5 && o.x > q.boite[0] && o.x < q.boite[2] && o.y > q.boite[1] + 2 && o.y < q.boite[3]); });
    this.o.surRendu({ ancres: liste, images: this.images, dessins: this.dessins, triangles: this.triangles, ech: vue.e.ech, az: vue.e.az, largeur: W, hauteur: H,
      epingles: this.effets.pins.size, pulses: this.effets.nPulses, vols: this.effets.nVols, actifs: this.anim.l.length, ms: this.ms || 0, cartons: this.rem.c.reduce((n, c) => n + (c.vers === 1 ? 1 : 0), 0) });
  }

  // ---- Fin de vie -------------------------------------------------------------------------------------------------------------------
  detruire() {
    if (this.detruit) { return; }
    this.detruit = true;
    cancelAnimationFrame(this.raf); clearTimeout(this.minutePerte);
    if (this.ro) { this.ro.disconnect(); } else if (this.ecouteResize) { window.removeEventListener('resize', this.ecouteResize); }
    document.removeEventListener('visibilitychange', this.surVisibilite);
    this.canvas.removeEventListener('webglcontextlost', this.surPerte); this.canvas.removeEventListener('webglcontextrestored', this.surRestaure);
    this.anim.vider(); this.vue.liberer();
    this.B.forEach(b => { b.jet.forEach(x => x.dispose()); });
    this.B.clear(); this.pickables.length = 0;
    if (this.monde) { this.monde.liberer(); }
    this.rem.liberer(); this.effets.liberer();
    Object.keys(this.tex).forEach(k => this.tex[k].dispose());
    Object.keys(this.texMarque).forEach(k => { this.texMarque[k].enseigne.dispose(); this.texMarque[k].auvent.dispose(); });
    this.soleil.shadow.map && this.soleil.shadow.map.dispose();
    this.scene.clear();
    this.r.dispose(); if (!this.perdu) { this.r.forceContextLoss(); }
    if (this.canvas.parentNode) { this.canvas.parentNode.removeChild(this.canvas); }
  }

  api() {
    const s = this;
    return {
      definirDonnees: (t, r, o) => { s.definirDonnees(t, r, o); s.rendu = true; },
      chercher: (m, o) => s.chercher(m, o), selectionner: (id, o) => s.selectionner(id, o),
      pulser: ids => s.pulser(ids), voler: (a, b, f) => s.voler(a, b, f), marges: m => s.definirMarges(m),
      zoom: f => { s.vue.utilisee = true; s.vue.zoom(f); }, pivoter: sens => { s.vue.utilisee = true; s.vue.pivoter(sens); }, recentrer: () => s.recentrer(true),
      cadrer: ids => s.cadrerBatiments(ids, { maxFit: 2.2 }), canevas: s.canvas, redessiner: () => s.demander(),
      stats: () => ({ images: s.images, dessins: s.dessins, triangles: s.triangles, ech: s.vue.e.ech, az: s.vue.e.az, cartons: s.rem.c.filter(c => c.vers === 1).length, instances: s.rem.c.length }),
      detruire: () => s.detruire(),
    };
  }
}

function cleDe(t, r) { return t.type + '|' + (t.entreprise_code || '') + '|' + r.x + ',' + r.y + ',' + r.largeur + ',' + r.hauteur; }
