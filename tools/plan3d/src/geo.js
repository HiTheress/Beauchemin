// Outils de géométrie : tout est fabriqué par code (aucun modèle 3D, aucune image).
import { BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, ExtrudeGeometry, Shape, Matrix4, Quaternion, Vector3, Euler, Color, BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(0, 0, 0, 'YXZ'), _v = new Vector3(), _s = new Vector3(), _c = new Color();

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;

/** Générateur pseudo-aléatoire déterministe (même emplacement = même décor à chaque affichage). */
export function alea(graine) {
  let a = (graine * 2654435761 + 1013904223) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rectangle à coins arrondis (Shape) centré en (0,0), éventuellement avec un trou (anneau). */
export function rectArrondi(w, d, r, trou) {
  const s = new Shape();
  tracer(s, w, d, r);
  if (trou) { const h = new Shape(); tracer(h, w - 2 * trou, d - 2 * trou, Math.max(0.05, r - trou)); s.holes.push(h); }
  return s;
}
function tracer(s, w, d, r) {
  const x = -w / 2, y = -d / 2;
  r = Math.min(r, w / 2, d / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
}

/**
 * Assemble plusieurs formes en UNE géométrie à couleurs de sommets (un seul dessin par bâtiment).
 * Chaque ajout se place avec (x, y, z, rx, ry, rz) ; les couleurs se multiplient par la couleur du matériau.
 */
export class Pieces {
  constructor() { this.l = []; }
  g(geo, couleur, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    _e.set(rx, ry, rz); _q.setFromEuler(_e);
    geo.applyMatrix4(_m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)));
    if (geo.index) { geo = geo.toNonIndexed(); }
    geo.deleteAttribute('uv');
    const n = geo.attributes.position.count, col = new Float32Array(n * 3);
    _c.set(couleur);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    geo.setAttribute('color', new BufferAttribute(col, 3));
    this.l.push(geo);
    return this;
  }
  boite(w, h, d, x, y, z, couleur, ry = 0, rz = 0, rx = 0) { return this.g(new BoxGeometry(w, h, d), couleur, x, y, z, rx, ry, rz); }
  cyl(rHaut, rBas, h, x, y, z, couleur, seg = 12, rx = 0, rz = 0, ry = 0) { return this.g(new CylinderGeometry(rHaut, rBas, h, seg), couleur, x, y, z, rx, ry, rz); }
  cone(r, h, x, y, z, couleur, seg = 8) { return this.g(new ConeGeometry(r, h, seg), couleur, x, y, z); }
  sphere(r, x, y, z, couleur, sx = 1, sy = 1, sz = 1, seg = 8) { return this.g(new SphereGeometry(r, seg, Math.max(4, seg - 2)), couleur, x, y, z, 0, 0, 0, sx, sy, sz); }
  /** Profil (liste de [x,y]) extrudé en largeur (z), avec biseau doux pour les formes arrondies (cabine, capots). */
  profil(pts, largeur, x, y, z, couleur, biseau = 0.1, ry = 0) {
    const s = new Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
    const geo = new ExtrudeGeometry(s, { depth: Math.max(0.01, largeur - 2 * biseau), bevelEnabled: biseau > 0, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 2, curveSegments: 4 });
    geo.translate(0, 0, -largeur / 2 + biseau);
    return this.g(geo, couleur, x, y, z, 0, ry, 0);
  }
  fin() {
    const g = this.l.length ? mergeGeometries(this.l) : null;
    this.l.forEach(x => x.dispose());
    this.l = [];
    return g;
  }
}

/** Boîte dont les UV suivent les dimensions réelles (en « pas » de nervure) : la texture ne s'étire jamais. */
export function boiteMur(w, h, d, x, y, z, pas) {
  const g = new BoxGeometry(w, h, d);
  const uv = g.attributes.uv, echelles = [d, d, w, w, w, w];             // +x, -x, +y, -y, +z, -z
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * echelles[f] / pas, uv.getY(k) * (f === 2 || f === 3 ? d : h) / 4);
    }
  }
  g.translate(x, y, z);
  return g;
}

/** Prisme extrudé (profil en XY, profondeur en Z) pour les murs ; UV recalculés d'après la direction de chaque face. */
export function prismeMur(pts, trous, profondeur, z0, pas) {
  const s = new Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  (trous || []).forEach(t => { const h = new Shape(); t.forEach((p, i) => (i ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1]))); s.holes.push(h); });
  const g = new ExtrudeGeometry(s, { depth: profondeur, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, z0);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), nz = Math.abs(n.getZ(i));
    uv.setXY(i, (nz > 0.5 ? p.getX(i) : nx > 0.5 ? p.getZ(i) : p.getX(i)) / pas, p.getY(i) / 4);
  }
  return g;
}

/** Plan (rectangle plat) horizontal dont les UV suivent les dimensions réelles. */
export function dalleUV(w, d, pas) {
  const g = new BoxGeometry(w, 0.001, d);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) { uv.setXY(i, uv.getX(i) * w / pas, uv.getY(i) * d / pas); }
  return g;
}

export function fusionner(liste) {
  const g = liste.length ? mergeGeometries(liste) : null;
  liste.forEach(x => x.dispose());
  return g;
}

/** Boîte à UV en mètres (briques : répétition dans les deux sens, un carreau = pu x pv mètres). */
export function boiteUV(w, h, d, x, y, z, pu, pv) {
  const g = new BoxGeometry(w, h, d);
  const uv = g.attributes.uv, lu = [d, d, w, w, w, w], lv = [h, h, d, d, h, h];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * lu[f] / pu, uv.getY(k) * lv[f] / pv); }
  }
  g.translate(x, y, z);
  return g;
}
