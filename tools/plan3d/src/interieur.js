// Vue en coupe d'un emplacement : rayonnages (montants bleus, lisses orange, tablettes), une caisse par pièce dans SA case (allée / étagère / niveau),
// zone « À ranger » pour les pièces sans position ; entrepôt (allées jaunes), cube de service (caisse du camion en coupe), boutique (showroom + arrière-boutique).
// Tout est instancié (montants, lisses, tablettes, caisses, palettes) ou fusionné ; les étiquettes passent par un atlas ; rien ne tourne au repos.
import { Group, Mesh, MeshLambertMaterial, MeshBasicMaterial, BoxGeometry, ConeGeometry, PlaneGeometry, InstancedMesh, Matrix4, Quaternion, Vector3, Euler, Color, Plane } from 'three';
import { Pieces, alea, clamp, lerp, boiteMur, dalleUV } from './geo.js';
import { Atlas, plaque, coinsPlaque } from './atlas.js';
import { geoPalette } from './remplissage.js';
import { chariot } from './monde.js';
import { showroom } from './showroom.js';
import { geoGoutte } from './effets.js';
import { ease } from './anim.js';
import * as TX from './textures.js';

const GAB = {
  entrepot: { bw: 2.2, rd: 0.95, lh: 0.95, gap: 2.3, yb: 0.12, mont: 0.1, lisse: 0.09 },
  boutique: { bw: 1.9, rd: 0.8, lh: 0.9, gap: 2.0, yb: 0.12, mont: 0.09, lisse: 0.08 },
  cube: { bw: 1.4, rd: 0.55, lh: 0.74, gap: 0.95, yb: 0.1, mont: 0.06, lisse: 0.05 },
};
const DEFAUT = { entrepot: { allees: 4, etageres: 6, niveaux: 4 }, boutique: { allees: 2, etageres: 4, niveaux: 3 }, cube: { allees: 2, etageres: 3, niveaux: 3 } };
const BLEU = 0x1f5fbf, ORANGE = 0xf28c28, JAUNE = 0xf2c230, PALE = new Color('#e4eaf3'), BLANC = new Color('#ffffff');
const TANS = ['#d9a56e', '#cf9a62', '#e0b07a', '#c58f5a'], BACS = ['#3a73c9', '#3f9a5a', '#e48a2e', '#8e99ab'];
const _m = new Matrix4(), _q = new Quaternion(), _p = new Vector3(), _s = new Vector3(), _e = new Euler(), _c = new Color(), _plan = new Plane(new Vector3(0, 1, 0), -1.6);

export const cle = (a, e, n) => a + ':' + e + ':' + n;
export function libellePosition(r, type) {
  const al = type === 'cube' ? (r.allee === 1 ? 'Côté gauche' : r.allee === 2 ? 'Côté droit' : 'Côté ' + r.allee) : 'Allée ' + (r.allee >= 1 && r.allee <= 26 ? String.fromCharCode(64 + r.allee) : r.allee);
  return al + ' · Étagère ' + r.etagere + ' · Niveau ' + r.niveau;
}

/** Disposition d'un intérieur (mètres, centrée en (0, 0)) d'après le type et les dimensions des rayonnages. */
export function disposer(type, geo, nZone) {
  const P = GAB[type] || GAB.entrepot, g = geo || DEFAUT[type] || DEFAUT.entrepot, A = g.allees, S = g.etageres, N = g.niveaux;
  const L = Object.assign({ type, A, S, N, rowW: S * P.bw, rows: [] }, P);
  L.Hr = N * P.lh + P.yb + 0.12;                                        // hauteur des montants
  const cols = clamp(nZone, 1, 6), lignes = Math.ceil(Math.max(1, nZone) / cols);
  if (type === 'cube') {
    L.W = L.rowW + 0.5 + 2.1; L.D = 2 * P.rd + P.gap + 0.5; L.H = N * P.lh + 0.35; L.x0 = -L.W / 2 + 0.3;
    for (let k = 0; k < A; k++) { L.rows.push({ allee: k + 1, z: (k === 0 ? 1 : -1) * (P.gap / 2 + P.rd / 2), x0: L.x0 }); }
    const zx0 = L.x0 + L.rowW + 0.15;
    L.zone = { x: (zx0 + L.W / 2) / 2, z: 0, w: L.W / 2 - zx0 - 0.1, d: L.D - 0.5, cols: 2, pas: 0.6 };
    L.bornes = { x0: -L.W / 2 - 2.2, x1: L.W / 2 + 1.0, z0: -L.D / 2 - 0.6, z1: L.D / 2 + 0.9, h: L.H };
    return L;
  }
  const zw = Math.max(3.2, cols * 1.0 + 0.8), zd = Math.max(2.4, lignes * 1.05 + 0.9), rs = P.rd + P.gap, sd = type === 'boutique' ? 7.4 : 0;
  L.W = L.rowW + 3.8;
  const stock = 1.1 + (A - 1) * rs + P.rd + 1.9 + zd + 0.5;
  L.D = stock + (sd ? sd + 0.4 : 0); L.sd = sd; L.rs = rs;
  const zStore = L.D / 2 - (sd ? sd + 0.4 : 0);                          // face avant de l'arrière-boutique / de l'entrepôt
  L.x0 = -L.rowW / 2 - 0.2;
  const z1 = zStore - 0.25 - zd - 1.9 - P.rd / 2;
  for (let k = 0; k < A; k++) { L.rows.push({ allee: k + 1, z: z1 - k * rs, x0: L.x0 }); }
  L.zone = { x: L.W / 2 - 1.3 - zw / 2, z: zStore - 0.25 - zd / 2, w: zw, d: zd, cols, pas: 1.0 };
  L.zStore = zStore; L.H = N * P.lh + 1.5;
  L.bornes = { x0: -L.W / 2, x1: L.W / 2, z0: -L.D / 2, z1: L.D / 2, h: L.H };
  return L;
}

function hache(n) { let h = n * 2654435761 >>> 0; h ^= h >>> 15; return (h >>> 0) / 4294967296; }

export class Interieur {
  /** sc : la scène ; b : le bâtiment ; data : réponse de plan_emplacement.php ; o : { peutRanger, piece (à chercher tout de suite) }. */
  constructor(sc, b, data, o) {
    this.sc = sc; this.b = b; this.o = o || {};
    this.type = b.type; this.m = b.m; this.jet = []; this.murs = []; this.flammes = []; this.suivis = new Set();
    this.peutRanger = !!(data && data.peut_ranger) && (this.o.peutRanger !== false);
    this.geo = (data && data.geometrie) || DEFAUT[b.type] || DEFAUT.entrepot;
    this.lignes = ((data && data.lignes) || []).map(l => Object.assign({}, l));
    this.sigLignes = JSON.stringify(this.lignes.map(l => [l.piece_id, l.code, l.quantite, l.unite, !!l.bas, l.rangement ? [l.rangement.allee, l.rangement.etagere, l.rangement.niveau] : null]));
    this.g = new Group(); this.g.name = 'interieur';
    this.R = alea(b.id * 17 + 3);
    this.crates = new Map(); this.idx = [];
    this.survolId = null; this.focusId = null; this.cible = null; this.pin = null; this.drag = null; this.celluleSurvol = null;
    this.flammeJusqua = 0;
    this.atlas = new Atlas(sc.aniso);
    this.L = disposer(this.type, this.geo, this.lignes.filter(l => !this.placee(l)).length);
    this.bornes = this.L.bornes;
    this.construire();
    sc.scene.add(this.g);
  }

  placee(l) { const r = l.rangement; return !!(r && r.allee >= 1 && r.allee <= this.geo.allees && r.etagere >= 1 && r.etagere <= this.geo.etageres && r.niveau >= 1 && r.niveau <= this.geo.niveaux); }
  mat(o) { const x = new MeshLambertMaterial(o); this.jet.push(x); return x; }
  suivre(geo) { this.jet.push(geo); return geo; }

  // =============================================================================================================================
  //  Décor fixe : sol, murs, rayonnages, zone « À ranger », accessoires
  // =============================================================================================================================
  construire() {
    const L = this.L, sc = this.sc, S = new Pieces(), type = this.type;
    this.unit = this.suivre(new BoxGeometry(1, 1, 1));
    // sol
    if (type === 'cube') {
      S.boite(L.W + 0.2, 0.14, L.D + 0.3, 0, -0.07, 0, 0xc4ccd9);
      S.boite(L.W + 0.2, 0.2, 0.2, 0, -0.3, L.D / 2 - 0.3, 0x30384b); S.boite(L.W + 0.2, 0.2, 0.2, 0, -0.3, -L.D / 2 + 0.3, 0x30384b);
      for (const [wx, wz] of [[-L.W / 2 + 1.2, 1], [-L.W / 2 + 1.2, -1], [L.W / 2 - 2.4, 1], [L.W / 2 - 1.7, 1], [L.W / 2 - 2.4, -1], [L.W / 2 - 1.7, -1]]) {
        S.cyl(0.52, 0.52, 0.36, wx, -0.28, wz * (L.D / 2 + 0.15), 0x222733, 14, Math.PI / 2); S.cyl(0.26, 0.26, 0.37, wx, -0.28, wz * (L.D / 2 + 0.16), 0xc3cbdc, 10, Math.PI / 2);
      }
      S.boite(1.9, 1.5, L.D, -L.W / 2 - 0.95, 0.75, 0, this.m.cabine); S.boite(0.1, 0.5, L.D - 0.3, -L.W / 2 - 1.95, 1.1, 0, 0x2d3445);
      S.boite(1.1, 0.12, L.D - 0.2, L.W / 2 + 0.55, -0.05, 0, 0x9aa6bd); S.boite(0.08, 0.14, L.D - 0.2, L.W / 2 + 1.1, -0.05, 0, 0xf2b53a);   // hayon abaissé
    } else {
      S.boite(L.W + 0.6, 0.4, L.D + 0.6, 0, -0.2, 0, 0xc9d3e4);
    }
    const sol = new Mesh(this.suivre(dalleUV(L.W, L.D, 5)), this.mat({ color: type === 'cube' ? 0xcdd5e2 : 0xe9eef6, map: type === 'cube' ? null : sc.tex.dalles }));
    sol.position.set(0, 0.002, 0); sol.receiveShadow = true; this.g.add(sol);
    this.murs = []; this.fenetres = [];
    this.construireMurs(S);
    this.construireRayons(S);
    this.construireZone(S);
    this.construireAccessoires(S);
    if (type === 'boutique') { this.flammesDef = showroom(S, -L.W / 2 + 0.7, L.W / 2 - 0.7, L.zStore + 0.7, L.D / 2 - 0.5); this.construireShowroomExtra(S); }
    const geo = S.fin();
    if (geo) { const me = new Mesh(this.suivre(geo), this.mat({ vertexColors: true })); me.castShadow = true; me.receiveShadow = true; this.g.add(me); }
    if (this.flammesDef && this.flammesDef.length) { this.construireFlammes(); }
    this.reconstruire(true);
  }

  /** Murs : quatre pans ; seuls ceux qui tournent le dos à la caméra sont montés en entier (les autres ne laissent qu'un muret). */
  construireMurs(S) {
    const L = this.L, sc = this.sc, H = L.H, type = this.type;
    if (type === 'cube') {
      const tall = new Group(), mk = (w, h, d, x, y, z, c) => { const P = new Pieces(); P.boite(w, h, d, x, y, z, c); return P; };
      // paroi du fond (−Z) et cloison de la cabine (−X) en entier ; muret côté caméra (+Z)
      const P1 = new Pieces(), P2 = new Pieces(), P3 = new Pieces();
      P1.boite(L.W + 0.2, H, 0.12, 0, H / 2, -L.D / 2 - 0.06, 0xf4f6fa); P1.boite(L.W + 0.2, 0.3, 0.14, 0, 0.9, -L.D / 2 - 0.07, this.m.bande);
      P2.boite(0.12, H, L.D + 0.2, -L.W / 2 - 0.06, H / 2, 0, 0xe9edf3);
      P3.boite(L.W + 0.2, 0.5, 0.12, 0, 0.25, L.D / 2 + 0.06, 0xf4f6fa);
      [[P1, 0, -1], [P2, -1, 0]].forEach(([P, nx, nz]) => { const g = new Group(), geo = P.fin(); const me = new Mesh(this.suivre(geo), this.mat({ vertexColors: true })); me.castShadow = true; me.receiveShadow = true; g.add(me); this.g.add(g); this.murs.push({ g, nx, nz }); });
      const st = new Mesh(this.suivre(P3.fin()), this.mat({ vertexColors: true })); st.castShadow = true; st.receiveShadow = true; this.g.add(st);
      return;
    }
    const teinte = type === 'boutique' ? 0xf1e7dc : 0xf2f7ff, mur = this.mat(type === 'boutique' ? { color: teinte, emissive: 0x2a2620 } : { map: sc.tex.murs, color: teinte, emissive: 0x28303f });
    const defs = [[0, -1, L.W + 0.6, 0, -L.D / 2 - 0.15, true], [0, 1, L.W + 0.6, 0, L.D / 2 + 0.15, true], [-1, 0, L.D, -L.W / 2 - 0.15, 0, false], [1, 0, L.D, L.W / 2 + 0.15, 0, false]];
    defs.forEach(([nx, nz, len, x, z, long]) => {
      const g = new Group(), pas = 0.5;
      const geo = this.suivre(long ? boiteMur(len, H, 0.3, x, H / 2, z, pas) : boiteMur(0.3, H, len, x, H / 2, z, pas));
      const me = new Mesh(geo, mur); me.castShadow = true; me.receiveShadow = true; g.add(me);
      // fenêtres sur la face intérieure
      const W = new Pieces(), nW = long ? Math.max(1, Math.floor(L.W / 4.2)) : Math.max(1, Math.floor(L.D / 4.2));
      for (let i = 0; i < nW; i++) {
        const t = (i + 0.5) / nW - 0.5;
        if (type === 'boutique' && nx === -1 && Math.abs(t * L.D * 0.9 - (L.zStore + L.D / 2) / 2) < 4.1) { continue; }   // le panneau du showroom occupe cette partie du mur
        if (long) { W.boite(2.3, 1.2, 0.05, t * L.W * 0.9, H * 0.66, z - nz * 0.16, 0xbfe3f1); W.boite(2.5, 0.08, 0.08, t * L.W * 0.9, H * 0.66 + 0.64, z - nz * 0.16, 0xeef2f8); W.boite(2.5, 0.08, 0.08, t * L.W * 0.9, H * 0.66 - 0.64, z - nz * 0.16, 0xeef2f8); }
        else { W.boite(0.05, 1.2, 2.3, x - nx * 0.16, H * 0.66, t * L.D * 0.9, 0xbfe3f1); W.boite(0.08, 0.08, 2.5, x - nx * 0.16, H * 0.66 + 0.64, t * L.D * 0.9, 0xeef2f8); W.boite(0.08, 0.08, 2.5, x - nx * 0.16, H * 0.66 - 0.64, t * L.D * 0.9, 0xeef2f8); }
      }
      if (type === 'boutique' && nx === -1) {          // panneau « Poêles · Foyers · Décorations » sur le mur du fond du showroom
        const tex = TX.panneauShowroom(sc.aniso); this.jet.push(tex);
        const pl = new Mesh(this.suivre(new PlaneGeometry(5.6, 5.6 * 160 / 1024)), new MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); this.jet.push(pl.material);
        pl.position.set(x + 0.16, 3.35, (L.zStore + L.D / 2) / 2); pl.rotation.y = Math.PI / 2; g.add(pl);
      }
      const wg = W.fin(); if (wg) { const wm = new Mesh(this.suivre(wg), this.mat({ vertexColors: true, emissive: 0x2a3a52, emissiveIntensity: 0.35 })); g.add(wm); }
      this.g.add(g); this.murs.push({ g, nx, nz });
      // muret toujours visible
      const mg = this.suivre(long ? new BoxGeometry(len, 0.45, 0.3) : new BoxGeometry(0.3, 0.45, len));
      const mm = new Mesh(mg, mur); mm.position.set(x, 0.225, z); mm.receiveShadow = true; mm.castShadow = true; this.g.add(mm);
    });
  }

  /** Rayonnages : montants, lisses et tablettes en instances ; plaques de lettres et de numéros. */
  construireRayons(S) {
    const L = this.L, mont = [], lisses = [], decks = [], deck = this.type === 'cube' ? 0xc0c9d6 : 0xb9c3d1;
    L.rows.forEach(r => {
      const zf = r.z + L.rd / 2, zb = r.z - L.rd / 2, x0 = r.x0;
      for (let i = 0; i <= L.S; i++) { for (const z of [zf - 0.05, zb + 0.05]) { mont.push([x0 + i * L.bw, L.Hr / 2, z, L.mont, L.Hr, L.mont]); } }
      for (let n = 0; n <= L.N; n++) {
        const y = L.yb + n * L.lh;
        for (let i = 0; i < L.S; i++) { for (const z of [zf - 0.05, zb + 0.05]) { lisses.push([x0 + (i + 0.5) * L.bw, y, z, L.bw - L.mont, L.lisse, 0.06]); } }
      }
      for (let n = 0; n < L.N; n++) { for (let i = 0; i < L.S; i++) { decks.push([x0 + (i + 0.5) * L.bw, L.yb + n * L.lh + 0.06, r.z, L.bw - 0.12, 0.04, L.rd - 0.1]); } }
    });
    const faire = (liste, couleur) => {
      if (!liste.length) { return; }
      const im = new InstancedMesh(this.unit, this.mat({ color: couleur }), liste.length);
      liste.forEach((v, i) => im.setMatrixAt(i, _m.compose(_p.set(v[0], v[1], v[2]), _q.identity(), _s.set(v[3], v[4], v[5]))));
      im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; this.g.add(im);
    };
    faire(mont, this.type === 'cube' ? 0x4a7fd6 : BLEU); faire(lisses, ORANGE); faire(decks, deck);
  }

  /** Zone « À ranger » près de la porte (palettes au sol) : repère jaune au sol, panneau. */
  construireZone(S) {
    const L = this.L, z = L.zone;
    const trait = (w, d, x, zz) => S.boite(w, 0.014, d, x, 0.012, zz, JAUNE);
    trait(z.w, 0.12, z.x, z.z - z.d / 2); trait(z.w, 0.12, z.x, z.z + z.d / 2); trait(0.12, z.d, z.x - z.w / 2, z.z); trait(0.12, z.d, z.x + z.w / 2, z.z);
    for (let k = 0; k < Math.floor(z.w / 0.8); k++) { S.boite(0.1, 0.012, z.d - 0.3, z.x - z.w / 2 + 0.5 + k * 0.8, 0.011, z.z, 0xf6e08a, 0.6); }
    const h = this.type === 'cube' ? 0.26 : 0.36;
    S.cyl(0.04, 0.04, 1.0, z.x + z.w / 2 - 0.05, 0.5, z.z - z.d / 2 + 0.05, 0x4a5568, 6);
    // lignes jaunes d'allée devant chaque rangée (entrepôt, boutique)
    if (this.type !== 'cube') {
      L.rows.forEach(r => { for (const dz of [L.rd / 2 + 0.36]) { S.boite(L.rowW + 0.8, 0.014, 0.1, r.x0 + L.rowW / 2, 0.012, r.z + dz, JAUNE); } });
    }
  }

  construireAccessoires(S) {
    const L = this.L, type = this.type;
    if (type === 'cube') {
      S.boite(0.1, 0.6, 0.1, -L.W / 2 + 0.2, 0.3, L.D / 2 - 0.35, 0xd32f2f);   // extincteur fixé près de la cabine
      return;
    }
    const r1 = L.rows[0];
    for (const r of L.rows) { for (const sz of [-1, 1]) { S.cyl(0.11, 0.11, 0.8, r.x0 + L.rowW + 0.7, 0.4, r.z + sz * (L.rd / 2 + 0.1), 0xf2c230, 10); S.cyl(0.115, 0.115, 0.12, r.x0 + L.rowW + 0.7, 0.55, r.z + sz * (L.rd / 2 + 0.1), 0x222733, 10); } }
    S.cyl(0.1, 0.1, 0.55, -L.W / 2 + 0.45, 1.1, -L.D / 2 + 0.5, 0xd32f2f, 10); S.boite(0.24, 0.24, 0.05, -L.W / 2 + 0.45, 1.6, -L.D / 2 + 0.32, 0xf4f4f4);   // extincteur
    chariot(S, -L.W / 2 + 3.2, r1.z + L.rd / 2 + 1.1, Math.PI * 0.9);
    for (let k = 0; k < 3; k++) { S.boite(1.2, 0.1, 1.0, -L.W / 2 + 1.0, 0.05 + k * 0.1, L.zStore - 1.6, 0xa5784a); }
    if (type === 'boutique') {                       // cloison du showroom avec ouverture, comptoir et caisse
      const zp = L.zStore + 0.2;
      S.boite(L.W * 0.38, 1.05, 0.14, -L.W / 2 + L.W * 0.19, 0.525, zp, 0xe8e2d6); S.boite(L.W * 0.38, 1.05, 0.14, L.W / 2 - L.W * 0.19, 0.525, zp, 0xe8e2d6);
      S.boite(2.8, 1.05, 0.9, L.W * 0.2, 0.525, L.zStore - 1.0, 0xc8202c); S.boite(3.0, 0.07, 1.0, L.W * 0.2, 1.08, L.zStore - 1.0, 0xf3f1ec);
      S.boite(0.5, 0.35, 0.4, L.W * 0.2 + 0.7, 1.28, L.zStore - 1.0, 0x2a2e37); S.boite(0.4, 0.28, 0.02, L.W * 0.2 + 0.7, 1.32, L.zStore - 0.78, 0x6fd0e8);
    }
  }
  construireShowroomExtra(S) { /* réservé : le showroom est entièrement décrit dans showroom.js */ }

  /** Flammes (rendues à part : elles vacillent un instant après chaque interaction). */
  construireFlammes() {
    const geo = this.suivre(new ConeGeometry(1, 1, 7)), m1 = new MeshBasicMaterial({ color: 0xffa21f, toneMapped: false }), m2 = new MeshBasicMaterial({ color: 0xffd04a, toneMapped: false });
    this.jet.push(m1, m2);
    this.flammesDef.forEach(f => {
      const me = new Mesh(geo, f.c === 0xffd04a ? m2 : m1);
      me.position.set(f.x, f.y + f.h / 2, f.z); me.scale.set(f.r, f.h, f.r); me.userData = { f, y: f.y + f.h / 2 };
      this.g.add(me); this.flammes.push(me);
    });
  }
  /** Vacillement des flammes : seulement pendant que flammeJusqua n'est pas passé. */
  animer(now) {
    if (!this.flammes.length || now > this.flammeJusqua) { return false; }
    this.flammes.forEach(me => { const f = me.userData.f, t = now * 0.012 + f.ph; me.scale.set(f.r * (1 + 0.12 * Math.sin(t * 1.3)), f.h * (1 + 0.22 * Math.sin(t) + 0.1 * Math.sin(t * 2.7)), f.r * (1 + 0.1 * Math.cos(t * 1.7))); me.position.y = f.y + me.scale.y / 2; me.rotation.z = 0.08 * Math.sin(t * 0.8); });
    return true;
  }
  eveiller(ms) { this.flammeJusqua = performance.now() + (ms || 5000); this.sc.demander(); }

  /** Murs : ceux dont la face extérieure regarde la caméra s'effacent (le muret reste). */
  orienter(az) {
    const sa = Math.sin(az), ca = Math.cos(az);
    this.murs.forEach(w => { w.g.visible = (w.nx * sa + w.nz * ca) < 0.05; });
  }

  // =============================================================================================================================
  //  Caisses : une par pièce, dans sa case ; zone « À ranger » pour les autres
  // =============================================================================================================================
  /** Dimensions d'une caisse d'après la quantité (plafonnées par la case). */
  dimensions(q, largeurMax) {
    const L = this.L, t = clamp(Math.log10(1 + q) / 2.7, 0, 1), s = this.type === 'cube' ? 0.8 : 1;
    const w = Math.min(lerp(0.66, 1.3, t) * s, largeurMax), h = Math.min(lerp(0.42, 0.68, t) * s, L.lh - 0.22), d = Math.min(lerp(0.48, 0.8, t) * s, L.rd - 0.12);
    return { w, h, d, deux: q >= 150 && (L.lh - 0.24) >= 2 * 0.3 * s };
  }
  cellule(a, e, n) {
    const L = this.L, r = L.rows[a - 1]; if (!r) { return null; }
    return { x: r.x0 + (e - 0.5) * L.bw, y0: L.yb + (n - 1) * L.lh, z: r.z, row: r };
  }
  /** Position cible de chaque pièce (parties : une ou deux caisses empilées) et plaques « +N ». */
  planifier() {
    const L = this.L, par = new Map(), zone = [], cibles = new Map();
    const tri = (a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : a.piece_id - b.piece_id);
    this.lignes.slice().sort(tri).forEach(l => {
      if (this.placee(l)) { const k = cle(l.rangement.allee, l.rangement.etagere, l.rangement.niveau); if (!par.has(k)) { par.set(k, []); } par.get(k).push(l); } else { zone.push(l); }
    });
    this.plus = [];
    par.forEach((liste, k) => {
      const [a, e, n] = k.split(':').map(Number), c = this.cellule(a, e, n), vis = liste.slice(0, 3), nv = vis.length;
      if (!c) { return; }
      const slot = (L.bw - 0.2) / nv;
      vis.forEach((l, j) => {
        const dm = this.dimensions(parseFloat(l.quantite) || 0, slot - 0.06), x = c.x + (j - (nv - 1) / 2) * slot, hy = c.y0 + 0.085, zc = c.z + L.rd / 2 - dm.d / 2 - 0.1;     // au bord de l'allée : on le voit et on lit son étiquette
        const parts = dm.deux ? [{ x, y: hy + dm.h * 0.32, z: zc, sx: dm.w, sy: dm.h * 0.64, sz: dm.d }, { x, y: hy + dm.h * 0.64 + dm.h * 0.24, z: zc, sx: dm.w * 0.86, sy: dm.h * 0.48, sz: dm.d * 0.86 }] : [{ x, y: hy + dm.h / 2, z: zc, sx: dm.w, sy: dm.h, sz: dm.d }];
        cibles.set(l.piece_id, { l, a, e, n, parts, plaque: true, w: dm.w, x, z: zc, ytop: parts[parts.length - 1].y + parts[parts.length - 1].sy / 2 });
      });
      liste.slice(3).forEach(l => { cibles.set(l.piece_id, { l, a, e, n, parts: [], cachee: true }); });
      if (liste.length > 3) { this.plus.push({ a, e, n, k: liste.length - 3, c }); }
    });
    // zone « À ranger » : caisses posées sur de petites palettes, en grille
    const Z = L.zone, cols = Z.cols, pas = Z.pas;
    zone.forEach((l, i) => {
      const col = i % cols, lig = Math.floor(i / cols), dm = this.dimensions(parseFloat(l.quantite) || 0, 0.85);
      const x = Z.x - (Math.min(cols, zone.length) - 1) / 2 * pas + col * pas, z = Z.z - ((Math.ceil(zone.length / cols) - 1) / 2) * 0.95 + lig * 0.95, hy = this.type === 'cube' ? 0.02 : 0.17;
      const h = Math.max(dm.h, 0.3);
      cibles.set(l.piece_id, { l, zone: true, parts: [{ x, y: hy + h / 2, z, sx: Math.max(dm.w, 0.42), sy: h, sz: Math.max(dm.d, 0.42) }], plaque: true, w: dm.w, x, z, ytop: hy + h, palette: true });
    });
    return cibles;
  }

  /** (Re)calcule les cibles et lance les animations d'apparition, de déplacement et de changement de taille ; direct = sans animation. */
  reconstruire(direct) {
    const cibles = this.planifier(), now = performance.now(), anim = !direct && !this.sc.reduit();
    const evenements = [];
    // pièces disparues
    this.crates.forEach((c, id) => { if (!cibles.has(id) && !c.mort) { c.mort = true; this.demarrer(c, null, now, anim); } });
    cibles.forEach((t, id) => {
      let c = this.crates.get(id);
      if (!c) {
        c = { id, l: t.l, parts: [], de: [], vers: [], ech: direct ? 1 : 0, ech0: 0, ech1: 1, t0: now, dur: 1, actif: false, couleur: this.couleurDe(id), mort: false };
        this.crates.set(id, c);
        c.vers = t.parts; c.de = t.parts.map(p => Object.assign({}, p)); c.t = t;
        if (!direct) { this.demarrer(c, t, now, anim, true); } else { c.parts = t.parts.map(p => Object.assign({}, p)); }
        return;
      }
      const avant = parseFloat(c.l.quantite) || 0, apres = parseFloat(t.l.quantite) || 0;
      if (Math.abs(apres - avant) > 1e-9 && !direct) { evenements.push({ id, delta: Math.round((apres - avant) * 1000) / 1000 }); c.pulse = now; }
      c.l = t.l; c.mort = false;
      this.demarrer(c, t, now, anim);
    });
    this.crates.forEach((c, id) => { if (c.mort && !c.actif) { this.crates.delete(id); } });
    this.evenements = evenements;
    this.reindexer();
    this.etiquettes();
    this.sc.ombres();
    return evenements;
  }
  couleurDe(id) { const h = hache(id * 7 + 1); return h < 0.62 ? new Color(TANS[Math.floor(hache(id + 9) * TANS.length)]).multiplyScalar(0.95 + hache(id + 3) * 0.1) : new Color(BACS[Math.floor(hache(id + 5) * BACS.length)]); }
  /** Démarre la transition d'une caisse vers sa nouvelle cible (null : disparaît). */
  demarrer(c, t, now, anim, neuve) {
    const cur = this.courant(c);
    c.de = cur; c.t0 = now; c.dur = 380; c.actif = !!anim;
    if (t === null) { c.vers = cur.map(p => Object.assign({}, p)); c.ech0 = c.ech; c.ech1 = 0; }
    else {
      c.t = t; c.vers = t.parts.map(p => Object.assign({}, p)); c.ech0 = c.ech; c.ech1 = 1;
      // une partie qui n'existait pas encore part de la première (elle « sort » de la caisse)
      while (c.de.length < c.vers.length) { const p0 = c.de[0] || c.vers[0]; c.de.push(Object.assign({}, p0, { sy: 0.01 })); }
    }
    if (!anim) { c.parts = c.vers.map(p => Object.assign({}, p)); c.ech = c.ech1; c.actif = false; c.k = 1; }
  }
  courant(c) { return c.parts.length ? c.parts.map(p => Object.assign({}, p)) : c.vers.map(p => Object.assign({}, p)); }

  /** Rend à chaque caisse son (ses) indice(s) d'instance et réécrit tout ; recrée la maille instanciée si besoin. */
  reindexer() {
    const liste = Array.from(this.crates.values()).sort((a, b) => a.id - b.id);
    const n = liste.length * 2, pal = liste.filter(c => c.t && c.t.palette).length;
    if (!this.cr || this.cr.instanceMatrix.count < n) {
      if (this.cr) { this.g.remove(this.cr); this.cr.dispose(); }
      this.cr = new InstancedMesh(this.geoCaisse(), this.mat({ vertexColors: true }), Math.max(8, n + 16));
      this.cr.castShadow = true; this.cr.receiveShadow = true; this.cr.frustumCulled = false; this.g.add(this.cr);
    }
    this.idx = [];
    liste.forEach((c, i) => { c.i0 = i * 2; this.idx[i * 2] = c; this.idx[i * 2 + 1] = c; });
    this.cr.count = n;
    if (!this.pal || this.pal.instanceMatrix.count < pal) {
      if (this.pal) { this.g.remove(this.pal); this.pal.dispose(); }
      this.geoPal = this.geoPal || this.suivre(geoPalette());
      this.pal = new InstancedMesh(this.geoPal, this.matPal || (this.matPal = this.mat({ vertexColors: true })), Math.max(8, pal + 16));
      this.pal.castShadow = true; this.pal.receiveShadow = true; this.pal.frustumCulled = false; this.g.add(this.pal);
    }
    this.ecrireTout();
  }
  geoCaisse() {
    if (!this.geoC) {
      const P = new Pieces();
      P.boite(1, 1, 1, 0, 0, 0, 0xdadada); P.boite(0.16, 1.014, 1.014, 0, 0, 0, 0xffffff); P.boite(1.014, 0.05, 1.014, 0, 0.5, 0, 0xeeeeee);
      this.geoC = this.suivre(P.fin());
    }
    return this.geoC;
  }
  ecrireTout() {
    this.crates.forEach(c => this.ecrire(c));
    this.cr.instanceMatrix.needsUpdate = true;
    if (this.cr.instanceColor) { this.cr.instanceColor.needsUpdate = true; }
    this.cr.boundingSphere = null;
    this.ecrirePalettes();
  }
  /** Palettes de la zone « À ranger » : une sous chaque caisse de la zone, à l'échelle de la caisse. */
  ecrirePalettes() {
    let k = 0;
    this.crates.forEach(c => {
      if (c.t && c.t.palette && !c.mort) {
        const p = (c.parts[0] || c.vers[0]); if (!p) { return; }
        this.pal.setMatrixAt(k++, _m.compose(_p.set(p.x, 0, p.z), _q.identity(), _s.set(1, 1, 1).multiplyScalar(Math.min(1, Math.max(0.55, p.sx / 0.62)) * Math.max(0, c.ech))));
      }
    });
    this.pal.count = k; this.pal.instanceMatrix.needsUpdate = true;
  }
  teinteDe(c) {
    _c.copy(c.couleur);
    if (this.cible !== null && c.id !== this.cible) { _c.lerp(PALE, 0.72); }
    if (c.id === this.survolId || c.id === this.focusId) { _c.lerp(BLANC, 0.3); }
    if (c.pulse && performance.now() - c.pulse < 900) { _c.lerp(new Color('#7fd0ff'), 0.6 * (1 - (performance.now() - c.pulse) / 900)); }
    return _c;
  }
  ecrire(c) {
    const n = c.parts.length || c.vers.length;
    for (let j = 0; j < 2; j++) {
      const i = c.i0 + j, p = c.parts[j];
      if (!p || j >= n || c.ech <= 0.001) { this.cr.setMatrixAt(i, _m.makeScale(0, 0, 0)); this.cr.setColorAt(i, _c.set(0xffffff)); continue; }
      this.cr.setMatrixAt(i, _m.compose(_p.set(p.x, p.y, p.z), _q.identity(), _s.set(p.sx * c.ech, p.sy * c.ech, p.sz * c.ech)));
      this.cr.setColorAt(i, j ? this.teinteDe(c).clone().multiplyScalar(0.94) : this.teinteDe(c));
    }
  }

  /** Avance les transitions de caisses ; vrai s'il en reste (la scène redessine). */
  maj(now) {
    let reste = false;
    this.crates.forEach((c, id) => {
      if (c.pulse && now - c.pulse < 900) { reste = true; c.sale = true; }
      if (!c.actif) { return; }
      const k = Math.min(1, (now - c.t0) / c.dur), e = c.ech1 > c.ech0 ? ease.ressort(k) : ease.sortie(k);
      c.ech = lerp(c.ech0, c.ech1, e);
      const kk = ease.entreeSortie(k), n = Math.max(c.de.length, c.vers.length);
      c.parts = [];
      for (let j = 0; j < n; j++) { const a = c.de[j] || c.vers[j], b = c.vers[j] || c.de[j]; c.parts.push({ x: lerp(a.x, b.x, kk), y: lerp(a.y, b.y, kk), z: lerp(a.z, b.z, kk), sx: lerp(a.sx, b.sx, kk), sy: lerp(a.sy, b.sy, kk), sz: lerp(a.sz, b.sz, kk) }); }
      if (k >= 1) { c.actif = false; c.ech = c.ech1; c.parts = c.vers.map(p => Object.assign({}, p)); c.sale = true; if (c.mort) { c.supprimer = true; } this.faitFin = true; } else { reste = true; }
      c.sale = true;
    });
    if (this.drag) { reste = true; }
    let ch = false;
    this.crates.forEach(c => { if (c.sale) { this.ecrire(c); c.sale = false; ch = true; } });
    if (ch) { this.cr.instanceMatrix.needsUpdate = true; if (this.cr.instanceColor) { this.cr.instanceColor.needsUpdate = true; } this.cr.boundingSphere = null; this.ecrirePalettes(); }
    if (this.faitFin) {
      this.faitFin = false;
      let sup = false; this.crates.forEach((c, id) => { if (c.supprimer) { this.crates.delete(id); sup = true; } });
      if (sup) { this.reindexer(); }
      this.etiquettes();
    }
    return reste;
  }

  // =============================================================================================================================
  //  Étiquettes (atlas) : code et quantité sur la face avant ET arrière de chaque caisse ; « +N » sur les cases trop pleines
  // =============================================================================================================================
  etiquettes() {
    this.atlas.liberer(this.g);
    this.atlas = new Atlas(this.sc.aniso);
    this.construireRepaires();
    this.crates.forEach(c => {
      const t = c.t; if (!t || !t.plaque || c.actif || c.mort || (this.cible !== null && c.id !== this.cible)) { return; }
      const l = c.l, ref = this.atlas.ajouter(plaque.caisse(l.code, this.fmt(l.quantite), l.unite, l.bas));
      const p = c.parts[c.parts.length > 1 ? 0 : 0] || c.vers[0], hl = Math.min(p.sx * 0.94, p.sy * 0.8 * 224 / 84, 0.62), hh = hl * 84 / 224, yy = p.y - p.sy * 0.04;
      this.atlas.quad(ref, coinsPlaque(p.x, yy, p.z + p.sz / 2 + 0.006, hl, hh, 0));
      this.atlas.quad(ref, coinsPlaque(p.x, yy, p.z - p.sz / 2 - 0.006, hl, hh, Math.PI));
    });
    if (this.cible === null) {
      this.plus.forEach(p => { const ref = this.atlas.ajouter(plaque.plus(p.k)), h = this.type === 'cube' ? 0.17 : 0.24; this.atlas.quad(ref, coinsPlaque(p.c.x + this.L.bw / 2 - 0.2, p.c.y0 + this.L.lh - 0.2, p.c.z + this.L.rd / 2 + 0.015, h * 224 / 84, h, 0)); });
    }
    this.atlas.construire(this.g);
  }
  construireRepaires() {
    // les repères (lettres, numéros, panneau de zone) vivent dans le même atlas : on les redessine avec lui
    const L = this.L, at = this.atlas, car = (ref, x, y, z, h, ry) => at.quad(ref, coinsPlaque(x, y, z, h * 224 / 84, h, ry));
    L.rows.forEach(r => {
      const x0 = r.x0, zf = r.z + L.rd / 2, hx = x0 + L.S * L.bw + 0.12, big = this.type === 'cube' ? 0.34 : 0.52, small = this.type === 'cube' ? 0.17 : 0.24;
      const lettre = this.type === 'cube' ? (r.allee === 1 ? 'G' : 'D') : String.fromCharCode(64 + (r.allee > 26 ? 26 : r.allee));
      car(at.ajouter(plaque.lettre(lettre, this.type === 'cube' ? '#2d6cdf' : '#1f5fbf')), hx + 0.04, L.Hr + big * 0.62, r.z, big, Math.PI / 2);
      for (let i = 0; i < L.S; i++) { car(at.ajouter(plaque.lettre(String(i + 1), '#f28c28')), x0 + (i + 0.5) * L.bw, L.yb + small * 0.7, zf + 0.012, small, 0); }
      for (let n = 0; n < L.N; n++) { car(at.ajouter(plaque.lettre(String(n + 1), '#46536b')), hx, L.yb + (n + 0.5) * L.lh, r.z, small, Math.PI / 2); }
    });
    const z = L.zone, h = this.type === 'cube' ? 0.26 : 0.36;
    car(at.ajouter(plaque.zone('À ranger')), z.x + z.w / 2 - 0.05, 1.05 + h * 0.5, z.z - z.d / 2 + 0.07, h * 2.7, 0);
  }
  fmt(q) { const n = parseFloat(q); return isNaN(n) ? '' : (this.sc.o.fmtQte ? this.sc.o.fmtQte(q) : String(Math.round(n * 1000) / 1000).replace('.', ',')); }

  // =============================================================================================================================
  //  Pointeur : cases, caisses, survol, clic, glisser-déposer
  // =============================================================================================================================
  rayon(px, py) { const sc = this.sc; sc.ndc.set(px / sc.w * 2 - 1, -(py / sc.h) * 2 + 1); sc.ray.setFromCamera(sc.ndc, sc.vue.cam); return sc.ray; }
  /** Caisse touchée (id de pièce) et case visée { a, e, n } (ou la zone « À ranger »). */
  viser(px, py) {
    if (px < 0) { return { id: null, cell: null, zone: false }; }
    const ray = this.rayon(px, py), L = this.L;
    let id = null, best = 1e9;
    if (this.cr && this.idx.length) {
      const h = ray.intersectObject(this.cr, false);
      for (const x of h) { const c = this.idx[x.instanceId]; if (c && !c.mort && c.ech > 0.5) { id = c.id; best = x.distance; break; } }
    }
    // case : intersection avec le plan de façade de chaque rangée (boîte alignée), la plus proche
    const o = ray.ray.origin, d = ray.ray.direction; let cell = null, tc = 1e9;
    for (const r of L.rows) {
      const b0 = [r.x0, 0, r.z - L.rd / 2], b1 = [r.x0 + L.rowW, L.Hr, r.z + L.rd / 2];
      let t0 = 0, t1 = 1e9, ok = true;
      for (let k = 0; k < 3; k++) {
        const ok_ = k === 0 ? o.x : k === 1 ? o.y : o.z, dk = k === 0 ? d.x : k === 1 ? d.y : d.z;
        if (Math.abs(dk) < 1e-9) { if (ok_ < b0[k] || ok_ > b1[k]) { ok = false; break; } continue; }
        let a = (b0[k] - ok_) / dk, b = (b1[k] - ok_) / dk; if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) { ok = false; break; }
      }
      if (ok && t0 < tc) {
        const hx = o.x + d.x * t0, hy = o.y + d.y * t0;
        cell = { a: r.allee, e: clamp(Math.floor((hx - r.x0) / L.bw) + 1, 1, L.S), n: clamp(Math.floor((hy - L.yb) / L.lh) + 1, 1, L.N) }; tc = t0;
      }
    }
    // zone « À ranger » : plan du sol
    let zone = false;
    if (Math.abs(d.y) > 1e-6) { const t = -o.y / d.y, hx = o.x + d.x * t, hz = o.z + d.z * t, Z = L.zone; zone = t > 0 && t < tc && Math.abs(hx - Z.x) <= Z.w / 2 && Math.abs(hz - Z.z) <= Z.d / 2; }
    if (id !== null) { const c = this.crates.get(id), t = c.t; if (t && !t.zone && !t.cachee) { cell = { a: t.a, e: t.e, n: t.n }; zone = false; } else if (t && t.zone) { cell = null; zone = true; } }
    return { id, cell, zone };
  }
  infoCase(v) {
    const L = this.L;
    if (v.zone) { return { zone: true, lignes: this.lignes.filter(l => !this.placee(l)), focus: v.id }; }
    if (!v.cell) { return null; }
    const lignes = this.lignes.filter(l => this.placee(l) && l.rangement.allee === v.cell.a && l.rangement.etagere === v.cell.e && l.rangement.niveau === v.cell.n);
    return { rangement: { allee: v.cell.a, etagere: v.cell.e, niveau: v.cell.n }, lignes, focus: v.id !== null ? v.id : (lignes[0] ? lignes[0].piece_id : null), type: this.type };
  }
  survol(px, py) {
    if (this.drag) { return; }
    const v = this.viser(px, py), info = this.infoCase(v), foc = v.id;
    const memeCase = (a, b) => (!a && !b) || (a && b && JSON.stringify(a.rangement) === JSON.stringify(b.rangement) && !!a.zone === !!b.zone);
    const changeCrate = foc !== this.survolId;
    if (!changeCrate && memeCase(info, this.infoSurvol)) { return; }
    this.survolId = foc; this.infoSurvol = info;
    this.cadreSur(v.cell, v.zone ? 'zone' : (v.id !== null || (info && info.lignes && info.lignes.length) ? 'survol' : 'vide'));
    this.sc.canvas.style.cursor = foc !== null || v.zone || (v.cell && info.lignes.length) ? 'pointer' : '';
    this.crates.forEach(c => { c.sale = true; }); this.sc.demander();
    if (this.flammes.length) { this.eveiller(3500); }
    if (this.sc.o.surCaisse) { this.sc.o.surCaisse(info, px, py, foc); }
  }
  /** Retire le survol (pointeur sorti). */
  quitter() { this.survolId = null; this.infoSurvol = null; this.cadreSur(null); this.crates.forEach(c => { c.sale = true; }); this.sc.canvas.style.cursor = ''; if (this.sc.o.surCaisse) { this.sc.o.surCaisse(null); } this.sc.demander(); }
  clic(px, py) {
    const v = this.viser(px, py), info = this.infoCase(v);
    const id = v.id !== null ? v.id : (info && info.lignes && info.lignes[0] ? info.lignes[0].piece_id : null);
    if (this.sc.o.surCaisseClic) { this.sc.o.surCaisseClic(id, info); }
  }
  /** Clavier / lecteur d'écran : met une pièce en avant sans pointeur. */
  mettreEnAvant(id) {
    this.focusId = id; const c = id !== null ? this.crates.get(id) : null, t = c && c.t;
    this.cadreSur(t && !t.zone ? { a: t.a, e: t.e, n: t.n } : null, 'survol');
    this.crates.forEach(x => { x.sale = true; });
    if (c && this.sc.o.surCaisse) { this.sc.o.surCaisse(this.infoCase({ id, cell: t && !t.zone ? { a: t.a, e: t.e, n: t.n } : null, zone: !!(t && t.zone) }), -1, -1, id); }
    this.sc.demander();
  }

  /** Cadre de case (survol, recherche, cible du glisser) : un seul maillage déplacé. */
  cadreSur(cell, mode) {
    const L = this.L;
    if (!this.cadreMesh) {
      const P = new Pieces(), w = L.bw - 0.02, h = L.lh - 0.02, d = L.rd + 0.06, e = 0.05;
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) { P.boite(w, e, e, 0, sy * h / 2, sz * d / 2, 0xffffff); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P.boite(e, h, e, sx * w / 2, 0, sz * d / 2, 0xffffff); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.boite(e, e, d, sx * w / 2, sy * h / 2, 0, 0xffffff); }
      this.cadreMat = new MeshBasicMaterial({ vertexColors: true, color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.95 }); this.jet.push(this.cadreMat);
      this.cadreMesh = new Mesh(this.suivre(P.fin()), this.cadreMat); this.cadreMesh.renderOrder = 5; this.cadreMesh.visible = false; this.g.add(this.cadreMesh);
    }
    if (!cell) { this.cadreMesh.visible = false; return; }
    const c = this.cellule(cell.a, cell.e, cell.n); if (!c) { this.cadreMesh.visible = false; return; }
    this.cadreMesh.position.set(c.x, c.y0 + L.lh / 2 + 0.04, c.z);
    this.cadreMat.color.set(mode === 'cible' ? 0x2fbf6a : mode === 'refus' ? 0xe0463c : mode === 'recherche' ? 0x2f6bff : mode === 'vide' ? 0xb8c4d8 : 0xffa21f);
    this.cadreMesh.visible = true; this.sc.demander();
  }

  /** Glisser-déposer d'une caisse (gestionnaire+) : surbrillance de la case visée, enregistrement par le serveur, retour arrière si refus. */
  debutGlisse(px, py) {
    if (!this.peutRanger) { return null; }
    const v = this.viser(px, py); if (v.id === null) { return null; }
    const c = this.crates.get(v.id); if (!c || !c.t || c.t.cachee) { return null; }
    const origine = c.t.zone ? null : { allee: c.t.a, etagere: c.t.e, niveau: c.t.n };
    const self = this;
    return {
      move(x, y) {
        if (!self.drag) { self.drag = { c, origine, cible: undefined, de: c.parts.map(p => Object.assign({}, p)) }; c.actif = false; self.quitter(); self.sc.canvas.style.cursor = 'grabbing'; }
        const ray = self.rayon(x, y), pt = ray.ray.intersectPlane(_plan, new Vector3());
        const w = self.viser(x, y);                         // la caisse tenue ne compte pas : on ne lit que la case / la zone
        const dest = w.zone ? null : w.cell ? { allee: w.cell.a, etagere: w.cell.e, niveau: w.cell.n } : undefined;
        self.drag.cible = dest;
        if (pt) { c.parts = c.parts.map((p, i) => Object.assign({}, p, { x: pt.x, y: pt.y + i * 0.3, z: pt.z })); c.sale = true; }
        const meme = dest !== undefined && dest !== null && origine && dest.allee === origine.allee && dest.etagere === origine.etagere && dest.niveau === origine.niveau;
        self.cadreSur(dest ? { a: dest.allee, e: dest.etagere, n: dest.niveau } : null, dest === undefined ? 'refus' : meme ? 'vide' : 'cible');
        self.sc.demander();
      },
      fin(x, y, etat) {
        const d = self.drag; self.drag = null; self.cadreSur(null);
        if (!d) { return; }
        const dest = d.cible, meme = dest !== undefined && ((dest === null && !d.origine) || (dest && d.origine && dest.allee === d.origine.allee && dest.etagere === d.origine.etagere && dest.niveau === d.origine.niveau));
        if (etat !== 'glisse' || dest === undefined || meme) { self.rendre(c, d.de); return; }
        // essai : la caisse va dans sa nouvelle case tout de suite ; si le serveur refuse, elle revient
        const l = self.lignes.find(z => z.piece_id === c.id), avant = l.rangement;
        l.rangement = dest ? Object.assign({}, dest) : null;
        self.reconstruire(false);
        const ok = () => { /* la lecture suivante du plan confirme */ }, ko = () => { l.rangement = avant; self.reconstruire(false); };
        if (self.sc.o.surRanger) { self.sc.o.surRanger(c.id, dest, ok, ko); } else { ok(); }
      },
    };
  }
  rendre(c, parts) { c.parts = parts; c.vers = parts.map(p => Object.assign({}, p)); c.actif = false; c.ech = 1; c.sale = true; this.sc.demander(); }

  // =============================================================================================================================
  //  Recherche, mises à jour en direct
  // =============================================================================================================================
  /** « Où est cette pièce ? » : épingle au-dessus de la caisse, cadre sur la case, les autres caisses s'estompent ; la caméra cadre la travée. */
  chercher(pieceId, cadrer) {
    this.cible = pieceId === undefined ? null : pieceId;
    if (this.pin) { this.g.remove(this.pin.g); this.pin = null; }
    const c = this.cible !== null ? this.crates.get(this.cible) : null;
    if (c && c.t && !c.t.cachee) {
      const t = c.t, y = t.ytop + 0.55;
      const pg = new Group(), mp = this.pinMat || (this.pinMat = this.mat({ color: 0x2f6bff, emissive: 0x0b2a8a, emissiveIntensity: 0.55, depthTest: false, transparent: true })), md = this.pinDisque || (this.pinDisque = new MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true })); this.jet.push(md);
      this.pinGeo = this.pinGeo || this.suivre(geoGoutte()); this.pinDisqueGeo = this.pinDisqueGeo || this.suivre(new PlaneGeometry(0.54, 0.54));
      const go = new Mesh(this.pinGeo, mp), di = new Mesh(this.pinDisqueGeo, md); go.castShadow = false; go.renderOrder = 6; di.renderOrder = 7; di.position.set(0, 2.0, 0.63); pg.add(go, di);
      const k = this.type === 'cube' ? 0.5 : 0.7; pg.scale.setScalar(k); pg.position.set(t.x || 0, y + 3, t.z || 0); pg.rotation.y = this.sc.vue.e.az; this.g.add(pg);
      this.pin = { g: pg, y, k };
      const cell = t.zone ? null : { a: t.a, e: t.e, n: t.n };
      this.cadreSur(cell, 'recherche');
      if (this.sc.reduit()) { pg.position.y = y; } else { this.sc.anim.ajouter({ dur: 800, delai: 200, courbe: ease.rebond, f: kk => { pg.position.y = lerp(y + 3, y, kk); this.sc.ombres(); }, fin: () => { pg.position.y = y; } }); }
      if (cadrer) { this.cadrerSur(t); }
    } else { this.cadreSur(null); }
    this.crates.forEach(x => { x.sale = true; });
    this.etiquettes();
    this.sc.ombres();
  }
  /** Caméra : cadre la travée de la case (ou la zone). */
  cadrerSur(t) {
    const sc = this.sc, L = this.L, az = sc.vue.cible('az');
    let x = t.x, z = t.z, y = t.parts && t.parts[0] ? t.parts[0].y : 1, w = L.bw * 2.8;
    const pts = [];
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => [0, 1].forEach(sy => pts.push({ x: x + sx * w / 2, y: sy * (this.type === 'cube' ? 2.0 : 3.6), z: z + sz * 1.6 }))));
    const f = sc.cadre(pts, az, 40, sc.vue.cible('el'));
    f.ech = clamp(f.ech, sc.limites.echMin, sc.limites.echMax);
    sc.vue.utilisee = true; sc.vue.aller(f, 700);
  }
  /** Lecture en direct : nouvelles lignes du serveur ; rend les changements de quantité [{ id, delta }] (pour les « +N / −N »). */
  majLignes(lignes) {
    const sig = JSON.stringify(lignes.map(l => [l.piece_id, l.code, l.quantite, l.unite, !!l.bas, l.rangement ? [l.rangement.allee, l.rangement.etagere, l.rangement.niveau] : null]));
    if (sig === this.sigLignes) { return []; }                // relecture périodique sans changement : rien à refaire
    this.sigLignes = sig;
    this.lignes = lignes.map(l => Object.assign({}, l));
    return this.reconstruire(false);
  }
  rapport() {
    const sc = this.sc, out = { suivis: {} };
    this.suivis.forEach(id => { const c = this.crates.get(id), p = c && (c.parts[0] || c.vers[0]); if (p) { const e = sc.vue.ecran({ x: p.x, y: p.y + p.sy / 2, z: p.z }, {}); out.suivis[id] = { x: e.x, y: e.y }; } });
    return out;
  }
  positionEcran(id) { const c = this.crates.get(id), p = c && (c.parts[0] || c.vers[0]); if (!p) { return null; } const e = this.sc.vue.ecran({ x: p.x, y: p.y + p.sy / 2, z: p.z }, {}); return { x: e.x, y: e.y }; }
  /** Centre d'une case à l'écran (pour la sonde des tests). */
  positionCellule(a, e, n) { const c = this.cellule(a, e, n); if (!c) { return null; } const p = this.sc.vue.ecran({ x: c.x, y: c.y0 + this.L.lh * 0.45, z: c.z + this.L.rd / 2 - 0.25 }, {}); return { x: p.x, y: p.y }; }
  /** Centre de la zone « À ranger » à l'écran. */
  positionZone() { const Z = this.L.zone, p = this.sc.vue.ecran({ x: Z.x, y: 0.05, z: Z.z }, {}); return { x: p.x, y: p.y }; }
  nombreCaisses() { let n = 0; this.crates.forEach(c => { if (!c.mort && c.t && !c.t.cachee) { n++; } }); return n; }
  detail() {
    const o = []; this.crates.forEach(c => { if (!c.mort && c.t) { o.push({ id: c.id, zone: !!c.t.zone, a: c.t.a || 0, e: c.t.e || 0, n: c.t.n || 0, cachee: !!c.t.cachee }); } });
    return o;
  }

  liberer() {
    this.atlas.liberer(this.g);
    this.sc.scene.remove(this.g);
    this.g.traverse(o => { if (o.isInstancedMesh) { o.dispose(); } });
    this.jet.forEach(x => { if (x && x.dispose) { x.dispose(); } });
    this.jet = []; this.crates.clear(); this.idx = [];
  }
}
