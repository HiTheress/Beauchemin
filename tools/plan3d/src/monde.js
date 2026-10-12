// Le sol, les marquages jaune-orangé et le décor fixe (chariot élévateur, cage de propane, cônes, arbres, haies) : tout est fusionné
// en quelques maillages, reconstruit seulement quand la disposition change.
import { Mesh, BoxGeometry, MeshLambertMaterial, InstancedMesh, Matrix4, Quaternion, Vector3, Euler, Group } from 'three';
import { Pieces, alea, dalleUV } from './geo.js';
import { CARTON, PALETTE } from './batiments.js';

const ORANGE = 0xf6a43a;
const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(), _p = new Vector3(), _s = new Vector3();

// ---------------------------------------------------------------------------------------------------------------------------
//  Décor
// ---------------------------------------------------------------------------------------------------------------------------
export function chariot(P, x, z, ry) {
  // repère local : fourches vers +X ; on assemble puis on tourne l'ensemble en posant chaque pièce
  const c = Math.cos(ry), s = Math.sin(ry);
  const pos = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const add = (w, h, d, lx, y, lz, col) => { const [px, pz] = pos(lx, lz); P.boite(w, h, d, px, y, pz, col, ry); };
  const cyl = (r, l, lx, y, lz, col) => { const [px, pz] = pos(lx, lz); P.cyl(r, r, l, px, y, pz, col, 12, Math.PI / 2, 0, ry); };
  add(1.9, 0.5, 1.1, 0, 0.55, 0, 0x2f66d6);                      // châssis bleu
  add(1.05, 0.85, 1.14, -0.45, 1.1, 0, 0xf6a91f);               // capot et contrepoids orange
  add(0.18, 0.5, 0.8, 0.12, 1.55, 0, 0xf6a91f);
  add(0.62, 0.12, 0.66, 0.25, 1.2, 0, 0x2a303d);                // siège
  add(0.1, 0.55, 0.62, -0.02, 1.5, 0, 0x2a303d);
  add(0.3, 0.45, 0.46, 0.2, 1.55, 0, 0xff7a2a);                 // conducteur (gilet orange) et tête
  { const [px, pz] = pos(0.2, 0); P.sphere(0.17, px, 1.95, pz, 0xf0c7a0, 1, 1, 1, 8); }
  [[0.62, 0.52], [0.62, -0.52], [-0.48, 0.52], [-0.48, -0.52]].forEach(([lx, lz]) => add(0.06, 1.2, 0.06, lx, 1.8, lz, 0x242934));  // cadre de protection
  add(1.18, 0.06, 1.1, 0.07, 2.4, 0, 0x242934);
  add(0.1, 1.8, 0.08, 0.98, 1.05, 0.34, 0x4a5163); add(0.1, 1.8, 0.08, 0.98, 1.05, -0.34, 0x4a5163);   // mât
  add(0.1, 0.5, 0.95, 1.04, 0.5, 0, 0x4a5163);
  add(1.0, 0.07, 0.14, 1.55, 0.12, 0.28, 0x3b4150); add(1.0, 0.07, 0.14, 1.55, 0.12, -0.28, 0x3b4150);  // fourches
  cyl(0.34, 0.26, 0.62, 0.34, 0.6, 0x232832); cyl(0.34, 0.26, 0.62, 0.34, -0.6, 0x232832);
  cyl(0.27, 0.26, -0.7, 0.27, 0.6, 0x232832); cyl(0.27, 0.26, -0.7, 0.27, -0.6, 0x232832);
}

function cage(P, x, z) {
  P.boite(2.4, 0.14, 1.6, x, 0.07, z, 0x8793ab);
  for (const [dx, dz] of [[-1.15, -0.75], [1.15, -0.75], [-1.15, 0.75], [1.15, 0.75], [0, 0.75], [0, -0.75]]) { P.boite(0.07, 1.6, 0.07, x + dx, 0.9, z + dz, 0x4a5a78); }
  for (const y of [0.55, 1.1, 1.67]) { P.boite(2.4, 0.05, 0.05, x, y, z + 0.75, 0x4a5a78); P.boite(2.4, 0.05, 0.05, x, y, z - 0.75, 0x4a5a78); P.boite(0.05, 0.05, 1.5, x - 1.15, y, z, 0x4a5a78); P.boite(0.05, 0.05, 1.5, x + 1.15, y, z, 0x4a5a78); }
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      const bx = x - 0.86 + i * 0.58, bz = z - 0.35 + j * 0.7;
      P.cyl(0.19, 0.19, 0.95, bx, 0.14 + 0.475, bz, 0xf3f6fb, 12);
      P.sphere(0.19, bx, 1.09, bz, 0xf3f6fb, 1, 0.55, 1, 10);
      P.cyl(0.2, 0.2, 0.07, bx, 0.7, bz, 0x2db2d1, 12);              // collier turquoise
      P.cyl(0.1, 0.1, 0.12, bx, 1.24, bz, 0x22c3c0, 10);           // bouchon turquoise
    }
  }
}

/** Gros réservoirs de propane blancs couchés, empilés en pyramide derrière une clôture grillagée (comme au site de Beauchemin). Axe des cylindres selon Z. */
function reservoirs(P, x, z) {
  const R = 0.56, L = 3.6;
  [[4, 0], [3, 1], [2, 2]].forEach(([n, couche]) => {
    for (let i = 0; i < n; i++) {
      const cx = x + (i - (n - 1) / 2) * (2 * R + 0.04), cy = R + couche * (R * 1.74);
      P.cyl(R, R, L, cx, cy, z, 0xf3f5f9, 16, Math.PI / 2);
      P.sphere(R, cx, cy, z - L / 2, 0xf3f5f9, 1, 1, 0.42, 10); P.sphere(R, cx, cy, z + L / 2, 0xf3f5f9, 1, 1, 0.42, 10);
      P.cyl(R + 0.01, R + 0.01, 0.1, cx, cy, z - L * 0.28, 0xc9d1de, 16, Math.PI / 2); P.cyl(R + 0.01, R + 0.01, 0.1, cx, cy, z + L * 0.28, 0xc9d1de, 16, Math.PI / 2);
    }
  });
  P.boite(4 * (2 * R + 0.04) + 0.4, 0.12, L + 0.4, x, 0.06, z, 0xaeb6c4);                      // dalle
  const fx = 2 * (2 * R + 0.04) + 0.9, fz = L / 2 + 0.8;
  for (const sx of [-1, 1]) for (let k = 0; k <= 5; k++) { P.boite(0.07, 2.0, 0.07, x + sx * fx, 1.0, z - fz + k * (2 * fz / 5), 0x39414f); }
  for (let k = 1; k < 5; k++) { P.boite(0.07, 2.0, 0.07, x - fx + k * (2 * fx / 5), 1.0, z + fz, 0x39414f); }
  for (const y of [0.25, 1.0, 1.95]) { P.boite(0.05, 0.05, 2 * fz, x - fx, y, z, 0x39414f); P.boite(0.05, 0.05, 2 * fz, x + fx, y, z, 0x39414f); P.boite(2 * fx, 0.05, 0.05, x, y, z + fz, 0x39414f); }
  P.boite(0.04, 1.6, 2 * fz, x + fx, 1.1, z, 0x56627a); P.boite(2 * fx, 1.6, 0.04, x, 1.1, z + fz, 0x56627a);   // grillage (panneaux pleins pour rester léger)
}

function cone(P, x, z) {
  P.boite(0.55, 0.05, 0.55, x, 0.025, z, 0xe85f1c);
  P.cone(0.24, 0.72, x, 0.41, z, 0xff7a2a, 10);
  P.cyl(0.15, 0.2, 0.14, x, 0.4, z, 0xffffff, 10);
}
function arbre(P, x, z, R) {
  const k = 0.85 + R() * 0.5, v = 0x6fbf8a + (Math.floor(R() * 3) * 0x050a05);
  P.cyl(0.16 * k, 0.24 * k, 1.5 * k, x, 0.75 * k, z, 0x9b7556, 7);
  P.sphere(1.25 * k, x, 2.5 * k, z, v, 1, 1.05, 1, 8);
  P.sphere(0.85 * k, x + 0.25 * k, 3.5 * k, z - 0.15 * k, v + 0x0a140a, 1, 1, 1, 7);
}
function haie(P, x, z, l, ry) {
  const n = Math.max(2, Math.round(l / 1.1)), c = Math.cos(ry), s = Math.sin(ry);
  for (let i = 0; i < n; i++) { const t = (i / (n - 1) - 0.5) * (l - 1.0); P.sphere(0.66, x + t * c, 0.52, z - t * s, i % 2 ? 0x86c79b : 0x94d1a7, 1, 0.82, 1, 7); }
}
function palettesBlanches(P, x, z, R) {
  P.boite(PALETTE.x, PALETTE.y, PALETTE.z, x, PALETTE.y / 2, z, 0x2f5fd0);
  for (let l = 0; l < 2; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const cx = x + (i - 0.5) * (CARTON.x + 0.015), cz = z + (j - 0.5) * (CARTON.z + 0.015), cy = PALETTE.y + (l + 0.5) * CARTON.y;
    P.boite(CARTON.x, CARTON.y, CARTON.z, cx, cy, cz, 0xeef1f8 - Math.floor(R() * 3) * 0x050505);
    P.boite(0.1, CARTON.y + 0.012, CARTON.z + 0.012, cx, cy, cz, 0xcdd3e2);
  }
}

/** Place le décor sans toucher aux bâtiments (tuiles agrandies d'un mètre) ; déterministe d'après la disposition. */
function decor(items, B, X0, X1, Z0, Z1) {
  const P = new Pieces(), R = alea(items.length * 97 + Math.round(B.x1 - B.x0) * 31 + Math.round(B.z1 - B.z0));
  const libre = (x, z, r) => items.every(t => x + r < t.cx - t.w / 2 - 0.8 || x - r > t.cx + t.w / 2 + 0.8 || z + r < t.cz - t.d / 2 - 0.8 || z - r > t.cz + t.d / 2 + 0.8);
  // arbres au fond (-Z) et à gauche (-X), haies basses devant (+Z) et à droite (+X) : on voit toujours les bâtiments
  for (let x = X0 + 2.2; x < X1 - 1.5; x += 6.5 + R() * 2.5) { arbre(P, x, Z0 + 1.8 + R() * 1.2, R); }
  for (let z = Z0 + 6; z < Z1 - 3; z += 7 + R() * 3) { arbre(P, X0 + 1.8 + R() * 1.2, z, R); }
  for (let x = X0 + 4; x < X1 - 6; x += 9 + R() * 3) { haie(P, x, Z1 - 1.3, 3.6 + R() * 2, 0); }
  for (let z = Z0 + 6; z < Z1 - 6; z += 9 + R() * 4) { haie(P, X1 - 1.3, z, 3.6 + R() * 2, Math.PI / 2); }
  // chariot élévateur + palettes emballées + cônes, dans la bande de droite, face aux bâtiments
  const fx = B.x1 + 2.6, fz = B.z0 + 3.2;
  if (libre(fx, fz, 1.6)) {
    chariot(P, fx, fz, Math.PI);
    palettesBlanches(P, fx - 3.1, fz + 1.4, R); palettesBlanches(P, fx - 1.9, fz + 3.4, R);
    cone(P, fx + 0.6, fz + 2.3); cone(P, fx + 1.5, fz + 2.9); cone(P, fx + 2.4, fz + 3.5);
  }
  // cage de propane près d'un entrepôt Beauchemin (bande libre la plus proche de ses murs)
  const bea = items.filter(t => t.type === 'entrepot' && t.m.cle === 'bea').sort((a, b) => a.cz - b.cz || a.cx - b.cx)[0];
  if (bea) {
    const r = { x0: bea.cx - bea.w / 2, x1: bea.cx + bea.w / 2, z0: bea.cz - bea.d / 2, z1: bea.cz + bea.d / 2 };
    // près de l'angle de façade (là où le camion ou le chariot ne cachent rien, et où la vue d'ensemble le montre)
    const c = [[r.x1 + 2.4, r.z1 - 1.7], [r.x0 + 2.2, r.z1 + 2.1], [r.x0 - 2.4, r.z1 - 1.7], [bea.cx, r.z0 - 2.0]].map(([x, z]) => ({ x, z })).find(c => libre(c.x, c.z, 1.3));
    if (c) { cage(P, c.x, c.z); cone(P, c.x + 1.8, c.z + 0.9); }
  }
  // réservoirs couchés derrière une clôture, au bord de la cour, près d'un site Beauchemin (le plus à droite d'abord : c'est le côté qu'on voit)
  const sites = items.filter(t => t.m.cle === 'bea').sort((a, b) => (b.cx + b.cz) - (a.cx + a.cz));
  for (const t of sites) {
    const r = { x1: t.cx + t.w / 2, z1: t.cz + t.d / 2 };
    const c = [[r.x1 + 4.2, t.cz], [t.cx, r.z1 + 4.2]].map(([x, z]) => ({ x, z })).find(c => libre(c.x, c.z, 3.2) && c.x + 3.2 < X1 && c.z + 3.2 < Z1);
    if (c) { reservoirs(P, c.x, c.z); break; }
  }
  return P.fin();
}

// ---------------------------------------------------------------------------------------------------------------------------
//  Sol, marquages
// ---------------------------------------------------------------------------------------------------------------------------
function pointille(l, x0, z0, x1, z1, plein) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz) - Math.PI / 2;
  if (plein) { l.push([(x0 + x1) / 2, (z0 + z1) / 2, L + 0.14, a]); return; }
  const dash = 1.15, gap = 0.85, n = Math.max(1, Math.round((L + gap) / (dash + gap))), pas = (L + gap) / n;
  for (let i = 0; i < n; i++) {
    const c = (i * pas + (pas - gap) / 2) / L;
    l.push([x0 + dx * c, z0 + dz * c, pas - gap, a]);
  }
}

export function construireMonde(items, tex) {
  const g = new Group(), jetables = [];
  const ajoute = (geo, mat, o = {}) => { const m = new Mesh(geo, mat); m.receiveShadow = o.recoit !== false; m.castShadow = !!o.projette; g.add(m); jetables.push(geo, mat); return m; };
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  items.forEach(t => { x0 = Math.min(x0, t.cx - t.w / 2); x1 = Math.max(x1, t.cx + t.w / 2); z0 = Math.min(z0, t.cz - t.d / 2); z1 = Math.max(z1, t.cz + t.d / 2); });
  if (!items.length) { x0 = -10; x1 = 10; z0 = -8; z1 = 8; }
  const B = { x0, x1, z0, z1 };
  const marge = 6.5, mw = 36, md = 26;
  let X0 = x0 - marge, X1 = x1 + marge, Z0 = z0 - marge, Z1 = z1 + marge;
  if (X1 - X0 < mw) { const e = (mw - (X1 - X0)) / 2; X0 -= e; X1 += e; }
  if (Z1 - Z0 < md) { const e = (md - (Z1 - Z0)) / 2; Z0 -= e; Z1 += e; }
  const W = X1 - X0, D = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;

  // terrain bas, dalle de la cour (avec son rebord), puis sol des parcelles
  const grand = Math.max(W, D) + 500;
  ajoute(new BoxGeometry(grand, 1, grand), new MeshLambertMaterial({ color: 0xd4e0f5 }), { recoit: true }).position.set(cx, -0.5 - 0.5, cz);
  ajoute(new BoxGeometry(W, 0.5, D), new MeshLambertMaterial({ color: 0xc9d3e4 })).position.set(cx, -0.25, cz);
  const dalle = ajoute(dalleUV(W, D, 6), new MeshLambertMaterial({ color: 0xedf1f8, map: tex.dalles })); dalle.position.set(cx, 0.001, cz);

  const pads = new Pieces(), traits = [];
  items.forEach(t => {
    const cube = t.type === 'cube';
    pads.boite(t.w - 0.4, 0.05, t.d - 0.4, t.cx, 0.027, t.cz, cube ? 0xd3e0f7 : 0xf4f6fb);
    if (cube) { const a = 0.35, b = t.w / 2 - 0.5, c = t.d / 2 - 0.5; [[-b, -c, b, -c], [b, -c, b, c], [b, c, -b, c], [-b, c, -b, -c]].forEach(s => pointille(traits, t.cx + s[0], t.cz + s[1], t.cx + s[2], t.cz + s[3], true)); }
    else { const b = t.w / 2 - 0.35, c = t.d / 2 - 0.35; [[-b, -c, b, -c], [b, -c, b, c], [b, c, -b, c], [-b, c, -b, -c]].forEach(s => pointille(traits, t.cx + s[0], t.cz + s[1], t.cx + s[2], t.cz + s[3], false)); }
  });
  const pg = pads.fin();
  if (pg) { ajoute(pg, new MeshLambertMaterial({ vertexColors: true })); }
  // ligne de voie blanche en pointillé le long de l'avant de la cour
  const voie = [];
  pointille(voie, X0 + 2, Z1 - 2.6, X1 - 2, Z1 - 2.6, false);

  const pose = (liste, couleur, large) => {
    if (!liste.length) { return; }
    const m = new InstancedMesh(new BoxGeometry(1, 0.012, 1), new MeshLambertMaterial({ color: couleur }), liste.length);
    liste.forEach((s, i) => { _e.set(0, s[3], 0); _q.setFromEuler(_e); m.setMatrixAt(i, _m.compose(_p.set(s[0], 0.062, s[1]), _q, _s.set(s[2], 1, large))); });
    m.receiveShadow = true; m.frustumCulled = false; g.add(m); jetables.push(m.geometry, m.material, m);
  };
  pose(traits, ORANGE, 0.15);
  pose(voie, 0xffffff, 0.17);

  const dg = decor(items, B, X0, X1, Z0, Z1);
  if (dg) { const m = ajoute(dg, new MeshLambertMaterial({ vertexColors: true }), { projette: true }); }

  return {
    groupe: g, bornes: B, cour: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
    liberer() { jetables.forEach(o => { if (o.isInstancedMesh) { o.dispose(); } else if (o.dispose) { o.dispose(); } }); },
  };
}
