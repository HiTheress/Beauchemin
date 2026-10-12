// Cartons et palettes : UNE seule instance de dessin pour tous les cartons de la scène (et une pour les palettes).
// Chaque carton a son échelle animée (0 -> 1 : il apparaît ; 1 -> 0 : il disparaît), sans jamais recréer de maillage.
import { InstancedMesh, MeshLambertMaterial, Matrix4, Quaternion, Vector3, Euler, Color } from 'three';
import { Pieces, alea, lerp } from './geo.js';
import { CARTON, PALETTE } from './batiments.js';
import { ease } from './anim.js';

export function geoCarton() {
  const P = new Pieces(), t = 0.1;
  P.boite(CARTON.x, CARTON.y, CARTON.z, 0, 0, 0, 0xd8d8d8);
  P.boite(t, 0.012, CARTON.z + 0.012, 0, CARTON.y / 2, 0, 0xffffff);                       // ruban sur le dessus
  P.boite(t, CARTON.y + 0.012, 0.012, 0, 0, CARTON.z / 2, 0xffffff);
  P.boite(t, CARTON.y + 0.012, 0.012, 0, 0, -CARTON.z / 2, 0xffffff);
  P.boite(0.16, 0.002 + 0.01, 0.1, CARTON.x * 0.28, CARTON.y / 2 + 0.003, CARTON.z * 0.25, 0xf0f0f0);   // étiquette
  return P.fin();
}
export function geoPalette() {
  const P = new Pieces(), b = 0xb88a58, c = 0xa5784a;
  for (let i = -1; i <= 1; i++) { P.boite(PALETTE.x, 0.07, 0.11, 0, 0.035, i * 0.46, c); }
  for (let i = 0; i < 7; i++) { P.boite(0.13, 0.04, PALETTE.z, -PALETTE.x / 2 + 0.08 + i * ((PALETTE.x - 0.16) / 6), 0.09, 0, b); }
  P.boite(PALETTE.x, 0.05, 0.12, 0, 0.135, -0.49, b); P.boite(PALETTE.x, 0.05, 0.12, 0, 0.135, 0.49, b);
  return P.fin();
}

const TAN = ['#d9a56e', '#cf9a62', '#e0b07a', '#c58f5a'];
const PALE = new Color('#e7edf6');
const _m = new Matrix4(), _q = new Quaternion(), _p = new Vector3(), _s = new Vector3(), _e = new Euler(), _c = new Color();

export class Remplissage {
  constructor(scene, anim, surChange) {
    this.scene = scene; this.anim = anim; this.surChange = surChange;
    this.mat = new MeshLambertMaterial({ vertexColors: true });
    this.geoC = geoCarton(); this.geoP = geoPalette();
    this.cartons = null; this.palettes = null;
    this.c = []; this.p = []; this.occupe = false;
  }

  /** liste : [{ id, x, z, e, piles: [{x, y, z, cols, rows, layers, ry}] }] (positions locales, e = échelle du bâtiment). */
  construire(liste) {
    const avant = new Map(); this.c.forEach(c => avant.set(c.cle, c)); this.p.forEach(p => avant.set(p.cle, p));
    const cs = [], ps = [];
    liste.forEach(b => {
      const R = alea(b.id * 7919 + 13), e = b.e || 1;
      let rang = 0;
      b.piles.forEach((pl, k) => {
        const cosr = Math.cos(pl.ry), sinr = Math.sin(pl.ry), x0 = b.x + pl.x * e, z0 = b.z + pl.z * e, y0 = pl.y * e;
        const cleP = b.id + ':p' + k;
        const pal = { cle: cleP, bat: b.id, x: x0, y: y0, z: z0, ry: pl.ry, sc: e, ech: 0, de: 0, vers: 0, t0: 0, dur: 1, actif: false, cartons: [] };
        const ancien = avant.get(cleP); if (ancien) { pal.ech = pal.vers = pal.de = ancien.ech; }
        ps.push(pal);
        const par = pl.cols * pl.rows;
        for (let i = 0; i < par * pl.layers; i++) {
          const couche = Math.floor(i / par), j = i % par, col = j % pl.cols, lig = Math.floor(j / pl.cols);
          const lx = (col - (pl.cols - 1) / 2) * (CARTON.x + 0.015) + (R() - 0.5) * 0.04, lz = (lig - (pl.rows - 1) / 2) * (CARTON.z + 0.015) + (R() - 0.5) * 0.04;
          const ly = (PALETTE.y + (couche + 0.5) * CARTON.y) * e;
          const cle = b.id + ':c' + rang;
          const c = {
            cle, bat: b.id, rang, pal, x: x0 + (lx * cosr + lz * sinr) * e, y: y0 + ly, z: z0 + (-lx * sinr + lz * cosr) * e,
            ry: pl.ry + (R() - 0.5) * 0.07, sc: e * (0.97 + R() * 0.06), ech: 0, de: 0, vers: 0, t0: 0, dur: 1, actif: false,
            teinte: new Color(TAN[Math.floor(R() * TAN.length)]).multiplyScalar(0.94 + R() * 0.1),
          };
          const a = avant.get(cle); if (a) { c.ech = c.vers = c.de = a.ech; }
          pal.cartons.push(c); cs.push(c); rang++;
        }
      });
    });
    this.c = cs; this.p = ps;
    this.reservation(cs.length, ps.length);
    for (let i = 0; i < cs.length; i++) { this.ecrire(this.cartons, i, cs[i]); this.cartons.setColorAt(i, cs[i].teinte); }
    for (let i = 0; i < ps.length; i++) { this.ecrire(this.palettes, i, ps[i]); }
    this.cartons.instanceMatrix.needsUpdate = true; this.palettes.instanceMatrix.needsUpdate = true;
    if (this.cartons.instanceColor) { this.cartons.instanceColor.needsUpdate = true; }
  }

  reservation(nc, np) {
    const faire = (ancien, geo, n) => {
      if (ancien && ancien.instanceMatrix.count >= n && ancien.instanceMatrix.count <= n + 32) { ancien.count = n; return ancien; }
      if (ancien) { this.scene.remove(ancien); ancien.dispose(); }
      const m = new InstancedMesh(geo, this.mat, Math.max(1, n + 16));
      m.count = n; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
      this.scene.add(m);
      return m;
    };
    this.cartons = faire(this.cartons, this.geoC, nc);
    this.palettes = faire(this.palettes, this.geoP, np);
  }

  ecrire(mesh, i, o) {
    const s = o.sc * Math.max(0, o.ech);
    _e.set(0, o.ry, 0); _q.setFromEuler(_e);
    mesh.setMatrixAt(i, _m.compose(_p.set(o.x, o.y, o.z), _q, _s.set(s, s, s)));
  }

  /** niveaux : { id du bâtiment : nombre de cartons à montrer } ; options.immediat, options.retards { id : ms }. */
  niveaux(niveaux, opts) {
    opts = opts || {};
    const now = performance.now(), reduit = this.anim.reduit() || opts.immediat, cpt = {};
    this.c.forEach(c => {
      const n = niveaux[c.bat] || 0, vers = c.rang < n ? 1 : 0;
      if (vers === c.vers) { return; }
      const delai = ((opts.retards && opts.retards[c.bat]) || 0) + (vers ? (cpt[c.bat] = (cpt[c.bat] || 0) + 1) * 22 : 0);
      this.demarrer(c, vers, now, delai, reduit);
    });
    this.p.forEach(p => {
      const vers = p.cartons.some(c => c.vers === 1) ? 1 : 0;
      if (vers === p.vers) { return; }
      this.demarrer(p, vers, now, ((opts.retards && opts.retards[p.bat]) || 0) + (vers ? 0 : 160), reduit);
    });
    this.occupe = this.c.some(c => c.actif) || this.p.some(p => p.actif);
    this.flush();
    if (this.occupe) { this.surChange(true); }
  }
  demarrer(o, vers, now, delai, reduit) {
    o.de = o.ech; o.vers = vers;
    if (reduit) { o.ech = vers; o.actif = false; o.t0 = 0; return; }
    o.t0 = now + delai; o.dur = vers ? 340 : 220; o.actif = true;
  }
  flush() {
    for (let i = 0; i < this.c.length; i++) { this.ecrire(this.cartons, i, this.c[i]); }
    for (let i = 0; i < this.p.length; i++) { this.ecrire(this.palettes, i, this.p[i]); }
    this.cartons.instanceMatrix.needsUpdate = true; this.palettes.instanceMatrix.needsUpdate = true;
  }

  /** Avance les échelles ; vrai s'il reste quelque chose à animer. */
  maj(now) {
    if (!this.occupe) { return false; }
    let reste = false, ch = false, chp = false;
    const pas = (o, mesh, i, flag) => {
      if (!o.actif) { return; }
      if (now < o.t0) { reste = true; return; }
      const k = Math.min(1, (now - o.t0) / o.dur);
      o.ech = lerp(o.de, o.vers, o.vers ? ease.ressort(k) : ease.sortie(k));
      if (k >= 1) { o.ech = o.vers; o.actif = false; } else { reste = true; }
      this.ecrire(mesh, i, o); flag.v = true;
    };
    const f1 = { v: false }, f2 = { v: false };
    for (let i = 0; i < this.c.length; i++) { pas(this.c[i], this.cartons, i, f1); }
    for (let i = 0; i < this.p.length; i++) { pas(this.p[i], this.palettes, i, f2); }
    if (f1.v) { this.cartons.instanceMatrix.needsUpdate = true; }
    if (f2.v) { this.palettes.instanceMatrix.needsUpdate = true; }
    this.occupe = reste;
    return reste;
  }

  /** Estompe les cartons d'un bâtiment (k de 0 à 1) : teinte vers un gris-bleu clair. */
  estomper(id, k) {
    let ch = false;
    for (let i = 0; i < this.c.length; i++) {
      const c = this.c[i]; if (c.bat !== id) { continue; }
      _c.copy(c.teinte).lerp(PALE, k * 0.7); this.cartons.setColorAt(i, _c); ch = true;
    }
    if (ch && this.cartons.instanceColor) { this.cartons.instanceColor.needsUpdate = true; }
  }

  nombreVisible(id) { let n = 0; this.c.forEach(c => { if (c.bat === id && c.vers === 1) { n++; } }); return n; }

  liberer() {
    [this.cartons, this.palettes].forEach(m => { if (m) { this.scene.remove(m); m.dispose(); } });
    this.geoC.dispose(); this.geoP.dispose(); this.mat.dispose();
    this.cartons = this.palettes = null; this.c = []; this.p = [];
  }
}
