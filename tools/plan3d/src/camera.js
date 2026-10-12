// Caméra orthographique isométrique et son contrôleur maison (pas d'OrbitControls) :
//   glisser = déplacer · molette / pincement = zoom (vers le pointeur) · clic droit / deux doigts = pivoter (pas de 90 ° à la fin)
//   clavier (quand le canevas a le focus) : flèches = déplacer, + / − = zoom, Q / E = pivoter, Origine = recentrer.
import { OrthographicCamera, Vector3 } from 'three';
import { ease } from './anim.js';
import { clamp } from './geo.js';

export const AZ0 = Math.PI / 4;                       // azimut par défaut : 45 °
export const EL = 35 * Math.PI / 180;                 // élévation de la vue isométrique
const PAS = Math.PI / 2;

export class Vue {
  /** o : { demander(), anim, surClic(x, y), surSurvol(x, y), surChange(), limites() -> { x0, x1, z0, z1, echMin, echMax } } */
  constructor(el, o) {
    this.el = el; this.o = o;
    this.cam = new OrthographicCamera(-10, 10, 10, -10, 1, 900);
    this.e = { x: 0, z: 0, az: AZ0, ech: 12, ox: 0, oy: 0, el: EL };
    this.W = 1; this.H = 1; this.t = null; this.ptrs = new Map(); this.mode = null; this.g = null; this.utilisee = false;
    this.R = new Vector3(); this.U = new Vector3(); this.F = new Vector3();
    this.liaison();
    this.appliquer();
  }

  // ---- Géométrie --------------------------------------------------------------------------------------------------------------
  taille(w, h) { this.W = Math.max(1, w); this.H = Math.max(1, h); this.appliquer(); }
  appliquer() {
    const e = this.e, c = this.cam, ce = Math.cos(e.el), se = Math.sin(e.el), sa = Math.sin(e.az), ca = Math.cos(e.az);
    this.R.set(ca, 0, -sa);
    this.F.set(-sa * ce, -se, -ca * ce);                                  // direction du regard
    this.U.crossVectors(this.R, this.F);                                  // « haut » à l'écran
    c.left = -(this.W / 2 + e.ox) / e.ech; c.right = (this.W / 2 - e.ox) / e.ech;
    c.top = (this.H / 2 + e.oy) / e.ech; c.bottom = -(this.H / 2 - e.oy) / e.ech;
    c.position.set(e.x - this.F.x * 300, -this.F.y * 300, e.z - this.F.z * 300);
    c.up.set(0, 1, 0); c.lookAt(e.x, 0, e.z);
    c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  }
  /** Point du sol (y = 0) sous un pixel de l'écran. */
  sol(px, py, out) {
    const e = this.e, u = (px - this.W / 2 - e.ox) / e.ech, v = -(py - this.H / 2 - e.oy) / e.ech, b = v / Math.sin(e.el), sa = Math.sin(e.az), ca = Math.cos(e.az);
    return (out || new Vector3()).set(e.x + ca * u - sa * b, 0, e.z - sa * u - ca * b);
  }
  /** Projection d'un point du monde : { x, y } en pixels, z = profondeur (plus grand = plus loin). */
  ecran(p, out) {
    const e = this.e, dx = p.x - e.x, dy = p.y, dz = p.z - e.z;
    const u = dx * this.R.x + dy * this.R.y + dz * this.R.z, v = dx * this.U.x + dy * this.U.y + dz * this.U.z, z = dx * this.F.x + dy * this.F.y + dz * this.F.z;
    out = out || {}; out.x = this.W / 2 + e.ox + u * e.ech; out.y = this.H / 2 + e.oy - v * e.ech; out.z = z;
    return out;
  }
  /** Étendue à l'écran (en mètres par pixel de zoom 1) d'un ensemble de points : sert à cadrer. */
  etendue(points, az, el) {
    el = el === undefined ? this.e.el : el;
    const sa = Math.sin(az), ca = Math.cos(az), ce = Math.cos(el), se = Math.sin(el);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, mu = 0, mv = 0;
    points.forEach(p => {
      const u = p.x * ca - p.z * sa, v = (p.x * sa + p.z * ca) * -se + p.y * ce;         // « haut » = (−sinEL·avant) + cosEL·Y avec l'avant au sol = (−sa, −ca)·(−1)
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    });
    return { u0, u1, v0, v1, w: u1 - u0, h: v1 - v0, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2 };
  }
  /** Point du sol dont la projection est (u, v) mètres du centre de l'écran, pour un azimut donné. */
  centre(u, v, az, el) { el = el === undefined ? this.e.el : el; const sa = Math.sin(az), ca = Math.cos(az), b = v / Math.sin(el); return { x: ca * u - sa * b, z: -sa * u - ca * b }; }
  contraindre() {
    const L = this.o.limites && this.o.limites(), e = this.e;
    if (!L) { return; }
    e.ech = clamp(e.ech, L.echMin, L.echMax);
    e.x = clamp(e.x, L.x0, L.x1); e.z = clamp(e.z, L.z0, L.z1);
  }
  changer() { this.contraindre(); this.appliquer(); this.o.surChange(); this.o.demander(); }

  // ---- Transitions ------------------------------------------------------------------------------------------------------------
  arreter() { if (this.t) { this.t.stop = true; this.t = null; } }
  /** Glisse en douceur vers { x, z, az, ech, ox, oy } (valeurs absentes = inchangées). */
  aller(c, dur) {
    this.arreter();
    const d = this.e, a = { x: d.x, z: d.z, az: d.az, ech: d.ech, ox: d.ox, oy: d.oy, el: d.el };
    const b = { el: c.el !== undefined ? c.el : a.el, x: c.x !== undefined ? c.x : a.x, z: c.z !== undefined ? c.z : a.z, az: c.az !== undefined ? c.az : a.az, ech: c.ech !== undefined ? c.ech : a.ech, ox: c.ox !== undefined ? c.ox : a.ox, oy: c.oy !== undefined ? c.oy : a.oy };
    const L = this.o.limites && this.o.limites();
    if (L) { b.ech = clamp(b.ech, L.echMin, L.echMax); b.x = clamp(b.x, L.x0, L.x1); b.z = clamp(b.z, L.z0, L.z1); }
    this.vers = b;
    const fin = () => { Object.assign(this.e, b); this.t = null; this.appliquer(); this.o.surChange(); };
    if (this.o.anim.reduit() || !dur) { fin(); this.o.demander(); return; }
    this.t = this.o.anim.ajouter({
      dur, courbe: ease.entreeSortie, toujours: false,
      f: k => {
        const e = this.e;
        e.el = a.el + (b.el - a.el) * k; e.x = a.x + (b.x - a.x) * k; e.z = a.z + (b.z - a.z) * k; e.az = a.az + (b.az - a.az) * k; e.ox = a.ox + (b.ox - a.ox) * k; e.oy = a.oy + (b.oy - a.oy) * k;
        e.ech = a.ech * Math.pow(b.ech / a.ech, k);
        this.appliquer(); this.o.surChange();
      },
      fin,
    });
    this.o.demander();
  }
  pivoter(sens) { this.versAzimut(this.cible('az') + sens * PAS, 520); }
  /** Tourne vers un azimut ; si la vue n'a pas été déplacée à la main, l'ensemble est recadré pour ce nouvel angle. */
  versAzimut(az, dur) {
    const f = !this.utilisee && this.o.cadreAzimut ? this.o.cadreAzimut(az) : null;
    this.aller(f || { az }, f ? 650 : dur);
  }
  cible(k) { return this.t && this.vers ? this.vers[k] : this.e[k]; }
  zoom(facteur, px, py, dur) {
    const e = this.e, L = this.o.limites && this.o.limites();
    if (px === undefined) { this.aller({ ech: clamp(this.cible('ech') * facteur, L ? L.echMin : 1, L ? L.echMax : 200) }, dur === undefined ? 260 : dur); return; }     // plusieurs appuis de suite s'additionnent
    const ech = clamp(e.ech * facteur, L ? L.echMin : 1, L ? L.echMax : 200);
    const a = this.sol(px, py); e.ech = ech; this.appliquer(); const b = this.sol(px, py);
    e.x += a.x - b.x; e.z += a.z - b.z; this.changer();
  }
  deplacer(dx, dz) { const e = this.e; this.aller({ x: e.x + dx, z: e.z + dz }, 200); }
  /** Revient au pas d'isométrie le plus proche (45 ° + k · 90 °). */
  caler() {
    const e = this.e, az = AZ0 + Math.round((e.az - AZ0) / PAS) * PAS;
    if (Math.abs(az - e.az) > 1e-3) { this.versAzimut(az, 260); }
  }

  // ---- Interactions -----------------------------------------------------------------------------------------------------------
  liaison() {
    const el = this.el, rel = ev => { const r = el.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    this.on = [];
    const ecoute = (cible, type, f, opts) => { cible.addEventListener(type, f, opts); this.on.push([cible, type, f, opts]); };

    ecoute(el, 'contextmenu', ev => ev.preventDefault());
    ecoute(el, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button > 2) { return; }
      this.arreter();
      try { el.setPointerCapture(ev.pointerId); } catch (x) { /* capture refusée : le glisser suit quand même */ }
      const [x, y] = rel(ev);
      this.ptrs.set(ev.pointerId, { x, y });
      if (this.ptrs.size === 1) {
        this.mode = (ev.pointerType === 'mouse' && ev.button === 2) ? 'rot' : 'pan';
        this.depart = { x, y, bouge: false, bouton: ev.button, az0: this.e.az };
        // l'intérieur peut prendre le glisser (déplacer une caisse) : il rend un { move(x, y), fin(x, y, annule) } ou rien
        this.externe = this.mode === 'pan' && this.o.debutGlisse ? (this.o.debutGlisse(x, y, ev) || null) : null;
      } else if (this.ptrs.size === 2) {
        if (this.externe) { this.externe.fin(x, y, 'annule'); this.externe = null; }
        this.mode = 'geste'; this.depart.bouge = true; this.utilisee = true;
        const [a, b] = Array.from(this.ptrs.values());
        this.g = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, a: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
      el.focus({ preventScroll: true });
      if (ev.pointerType !== 'mouse') { ev.preventDefault(); }
    });
    ecoute(el, 'pointermove', ev => {
      const [x, y] = rel(ev), p = this.ptrs.get(ev.pointerId);
      if (!p) { if (ev.pointerType === 'mouse' && this.o.surSurvol) { this.o.surSurvol(x, y); } return; }
      const dx = x - p.x, dy = y - p.y; p.x = x; p.y = y;
      const e = this.e;
      if (this.mode === 'pan') {
        if (!this.depart.bouge && Math.hypot(x - this.depart.x, y - this.depart.y) > 5) { this.depart.bouge = true; this.utilisee = true; if (this.o.surSurvol) { this.o.surSurvol(-1, -1); } }
        if (this.depart.bouge) {
          if (this.externe) { this.externe.move(x, y); } else { this.pan(dx, dy); }
        }
      } else if (this.mode === 'rot') {
        this.depart.bouge = true; e.az += dx * 0.0075; this.changer();
      } else if (this.mode === 'geste' && this.ptrs.size >= 2) {
        const [a, b] = Array.from(this.ptrs.values()), d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const L = this.o.limites && this.o.limites(), g = this.g;
        const avant = this.sol(g.mx, g.my);
        e.ech = clamp(e.ech * d / g.d, L ? L.echMin : 1, L ? L.echMax : 200);
        let da = ang - g.a; if (da > Math.PI) { da -= 2 * Math.PI; } else if (da < -Math.PI) { da += 2 * Math.PI; }
        e.az += da; this.appliquer();
        const apres = this.sol(mx, my);                                    // le point sous les doigts reste sous les doigts
        e.x += avant.x - apres.x; e.z += avant.z - apres.z;
        g.d = d; g.a = ang; g.mx = mx; g.my = my;
        this.changer();
      }
    });
    const fin = ev => {
      if (!this.ptrs.has(ev.pointerId)) { return; }
      const [x, y] = rel(ev), d = this.depart;
      this.ptrs.delete(ev.pointerId);
      try { el.releasePointerCapture(ev.pointerId); } catch (e2) { /* déjà relâchée */ }
      if (this.ptrs.size === 0) {
        const mode = this.mode; this.mode = null;
        if (this.externe) { const ex = this.externe; this.externe = null; const etat = ev.type !== 'pointerup' ? 'annule' : d.bouge ? 'glisse' : 'clic'; ex.fin(x, y, etat); if (etat === 'clic' && d.bouton <= 1 && this.o.surClic) { this.o.surClic(x, y, ev); } return; }
        if (mode === 'pan' && !d.bouge && ev.type === 'pointerup' && d.bouton <= 1 && this.o.surClic) { this.o.surClic(x, y, ev); }
        else if (mode === 'rot' || mode === 'geste') { this.caler(); }
      } else if (this.ptrs.size === 1) { this.mode = 'pan'; const r = Array.from(this.ptrs.values())[0]; this.depart = { x: r.x, y: r.y, bouge: true, bouton: 0, az0: this.e.az }; this.caler(); }
    };
    ecoute(el, 'pointerup', fin); ecoute(el, 'pointercancel', fin);
    ecoute(el, 'pointerleave', ev => { if (!this.ptrs.size && this.o.surSurvol) { this.o.surSurvol(-1, -1); } });
    ecoute(el, 'wheel', ev => this.molette(ev), { passive: false });
    ecoute(el, 'keydown', ev => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) { return; }
      const e = this.e, pas = (ev.shiftKey ? 90 : 45) / e.ech, k = ev.key;
      const r = this.R, f = [-Math.sin(e.az), -Math.cos(e.az)];
      let ok = true;
      if (k === 'ArrowLeft') { this.deplacer(-r.x * pas, -r.z * pas); }
      else if (k === 'ArrowRight') { this.deplacer(r.x * pas, r.z * pas); }
      else if (k === 'ArrowUp') { this.deplacer(f[0] * pas * 1.4, f[1] * pas * 1.4); }
      else if (k === 'ArrowDown') { this.deplacer(-f[0] * pas * 1.4, -f[1] * pas * 1.4); }
      else if (k === '+' || k === '=') { this.zoom(1.35); }
      else if (k === '-' || k === '_') { this.zoom(1 / 1.35); }
      else if (k === 'q' || k === 'Q') { this.pivoter(-1); }
      else if (k === 'e' || k === 'E') { this.pivoter(1); }
      else if (k === 'Home' || k === '0') { this.o.recentrer(); }
      else { ok = false; }
      if (ok) { ev.preventDefault(); if (k !== 'q' && k !== 'Q' && k !== 'e' && k !== 'E' && k !== 'Home' && k !== '0') { this.utilisee = true; } }
    });
  }
  /** Molette (ou pincement du pavé tactile) : zoom vers le pointeur ; les étiquettes HTML la renvoient ici pour que le zoom marche aussi par-dessus. */
  molette(ev) {
    ev.preventDefault(); this.arreter(); this.utilisee = true;
    const r = this.el.getBoundingClientRect(), k = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 300 : 1;
    this.zoom(Math.exp(-ev.deltaY * k * (ev.ctrlKey ? 0.01 : 0.0017)), ev.clientX - r.left, ev.clientY - r.top);
  }
  pan(dx, dy) {
    const e = this.e, sa = Math.sin(e.az), ca = Math.cos(e.az), k = dy / (e.ech * Math.sin(e.el));
    e.x -= ca * dx / e.ech; e.z += sa * dx / e.ech;                     // vers la gauche quand on tire vers la droite
    e.x += -sa * k; e.z += -ca * k;                                      // tirer vers le bas = regarder plus loin
    this.changer();
  }
  liberer() { this.arreter(); this.on.forEach(([c, t, f, o]) => c.removeEventListener(t, f, o)); this.on = []; this.ptrs.clear(); }
}
