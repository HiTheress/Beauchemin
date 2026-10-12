// Les trois sortes d'emplacements, construits par code. Repère local : origine au centre de l'emprise, X = largeur, Z = profondeur,
// façade (portes, vitrine, arrière du camion) vers +Z / +X, hauteur = Y ; 1 unité = 1 mètre de la scène (1 case de 20 px du plan).
// Chaque fabrique rend des géométries fusionnées (peu de dessins), des plaques (enseignes) et les piles de cartons à remplir.
import { Pieces, boiteMur, prismeMur, clamp, fusionner } from './geo.js';
import { BoxGeometry } from 'three';

/** Couleurs des entreprises : BEA bleu marine + liseré vert/cyan, BCH rouge + or ; sinon un gris-bleu neutre. */
export const MARQUES = {
  bea: { cle: 'bea', toit: 0x044c92, cadre: 0x0a3a73, lis: [0x35802a, 0x2db2d1], acc: 0x2db2d1, cabine: 0x0b5aa8, bande: 0x35802a, filet: 0x2db2d1, auvent: ['#044c92', '#f4f8fc'], nom: 'Beauchemin', c: ['#044c92', '#35802a'], halo: 0x2db2d1, logo: { mode: 'blanc', ratio: 812 / 166 } },
  bch: { cle: 'bch', toit: 0xd0021b, cadre: 0x9c0516, lis: [0xc9a24d, 0xe8c779], acc: 0xc9a24d, cabine: 0xd0021b, bande: 0xd0021b, filet: 0xc9a24d, auvent: ['#d6353d', '#a1161e'], nom: 'Boutique Chaleur', c: ['#d0021b', '#c9a24d'], halo: 0xe0a93a, logo: { mode: 'rouge', ratio: 784 / 352 } },
  neutre: { cle: 'neutre', toit: 0x4f6f9c, cadre: 0x37507a, lis: [0x8fa6c6, 0xb9c8de], acc: 0x8fa6c6, cabine: 0xeef1f6, bande: 0x6f819e, filet: 0xa9b8d0, auvent: ['#4f6f9c', '#f4f6fa'], nom: '', c: ['#4f6f9c', '#8fa6c6'], halo: 0x6c8bb8 },
};
/** Palette d'une entreprise : BEA, BCH ou, pour toute autre, un blanc neutre qui porte SON nom (clé propre : texture propre). */
export function marque(code, nom) {
  const c = String(code || '').toLowerCase();
  if (c === 'bea' || c === 'bch') { return MARQUES[c]; }
  return Object.assign({}, MARQUES.neutre, { cle: 'neutre:' + c, nom: nom || String(code || '') });
}

const INT1 = 0xa9b4cb, INT2 = 0x7d89a6, BETON = 0xcfd6e4, NOIR = 0x222733, GRIS = 0x8793ab, CLAIR = 0xf3f6fb;

/** Dimensions d'un carton (m) : mêmes pour toutes les piles, le remplissage les empile. */
export const CARTON = { x: 0.62, y: 0.46, z: 0.52 };
export const PALETTE = { x: 1.3, y: 0.16, z: 1.1 };

/**
 * Pile = palette + cartons (cols x rows par couche, plusieurs couches) posée en (x, y, z).
 * Le remplissage allume les cartons dans l'ordre : couche par couche, pile par pile.
 */
export function pile(x, y, z, cols, rows, layers, ry = 0) { return { x, y, z, cols, rows, layers, ry }; }

// ===========================================================================================================================
//  Entrepôt : tôle nervurée, toit en dents de scie, portes de quai (cadre foncé, palettes visibles dans l'alcôve)
// ===========================================================================================================================
export function entrepot(W, D, M, R, opts) {
  const bw = opts && opts.bureau ? opts.bureau : 0, Ww = W - bw;                      // bw : largeur du bloc de bureau à gauche (entrepôt Beauchemin), sinon 0
  const n = clamp(Math.round(Ww / 5.2), 1, 9), p = Ww / n;
  const hl = clamp(3.9 + 0.1 * Ww, 4.4, 6.4), hr = clamp(0.3 * p, 1.1, 2.2), H = hl + hr;
  const dep = Math.min(1.7, D * 0.42), dw = Math.min(3.1, p - 1.5), dh = Math.min(3.5, hl - 0.8), seuil = 0.18, cad = 0.3;
  const x0 = -W / 2 + bw, z1 = D / 2;
  const S = new Pieces(), murs = [], toit = [], verre = new Pieces(), piles = [], plaques = [];

  // profil en dents de scie : haut à gauche (-X), bas à droite (+X) ; la contremarche regarde -X (elle porte le vitrage)
  const pts = [[x0, 0], [W / 2, 0], [W / 2, hl]];
  for (let i = n - 1; i >= 0; i--) { const xl = x0 + i * p; pts.push([xl, H]); if (i > 0) { pts.push([xl, hl]); } }
  const trous = [];
  for (let j = 0; j < n; j++) { const cx = x0 + (j + 0.5) * p; trous.push([[cx - dw / 2, seuil], [cx - dw / 2, dh], [cx + dw / 2, dh], [cx + dw / 2, seuil]]); }
  murs.push(prismeMur(pts, null, D - dep, -D / 2, 0.5));             // corps arrière
  murs.push(prismeMur(pts, trous, dep, z1 - dep, 0.5));              // façade avec ses ouvertures

  for (let j = 0; j < n; j++) {
    const cx = x0 + (j + 0.5) * p;
    // fond de l'alcôve (deux tons : l'ombre du linteau) et plateforme de quai
    S.boite(dw, (dh - seuil) * 0.5, 0.03, cx, seuil + (dh - seuil) * 0.25, z1 - dep + 0.02, INT1);
    S.boite(dw, (dh - seuil) * 0.5, 0.03, cx, seuil + (dh - seuil) * 0.75, z1 - dep + 0.02, INT2);
    S.boite(0.34, dh - seuil, 0.06, cx - dw / 2 + 0.25, seuil + (dh - seuil) / 2, z1 - dep + 0.06, 0xe9eef7);   // glissière du rideau
    S.boite(dw + 0.5, 0.2, 0.75, cx, 0.1, z1 + 0.37, BETON);
    // cadre de la porte, plaque de numéro, butoirs
    S.boite(cad, dh + cad - seuil, 0.22, cx - dw / 2 - cad / 2, (seuil + dh + cad) / 2, z1 + 0.04, M.cadre);
    S.boite(cad, dh + cad - seuil, 0.22, cx + dw / 2 + cad / 2, (seuil + dh + cad) / 2, z1 + 0.04, M.cadre);
    S.boite(dw + 2 * cad, cad, 0.22, cx, dh + cad / 2, z1 + 0.04, M.cadre);
    S.boite(0.62, 0.36, 0.07, cx, dh + cad + 0.36, z1 + 0.04, M.cadre);
    S.boite(0.4, 0.17, 0.02, cx, dh + cad + 0.36, z1 + 0.09, 0xf4f7fb);
    S.cyl(0.13, 0.13, 0.5, cx - dw / 2 + 0.2, 0.45, z1 + 0.62, NOIR, 8);
    S.cyl(0.13, 0.13, 0.5, cx + dw / 2 - 0.2, 0.45, z1 + 0.62, NOIR, 8);
    const dx = (R() - 0.5) * 0.5;
    piles.push(pile(cx + dx, seuil, z1 - dep + 0.15 + PALETTE.z / 2, 2, 2, 4, (R() - 0.5) * 0.08));
  }
  // fenêtres sur le mur du fond (visibles en tournant la vue), une par travée
  for (let j = 0; j < n; j++) {
    const cx = x0 + (j + 0.5) * p;
    verre.boite(1.7, 0.85, 0.05, cx, hl * 0.68, -D / 2 - 0.03, 0xc6e8f6);
    S.boite(1.9, 0.07, 0.1, cx, hl * 0.68 + 0.5, -D / 2 - 0.03, M.cadre); S.boite(1.9, 0.07, 0.1, cx, hl * 0.68 - 0.5, -D / 2 - 0.03, M.cadre);
    S.boite(0.07, 0.99, 0.1, cx - 0.93, hl * 0.68, -D / 2 - 0.03, M.cadre); S.boite(0.07, 0.99, 0.1, cx + 0.93, hl * 0.68, -D / 2 - 0.03, M.cadre);
  }
  // poteaux d'angle
  S.boite(0.36, H, 0.36, x0, H / 2, z1, M.cadre);
  S.boite(0.36, hl, 0.36, W / 2, hl / 2, z1, M.cadre);
  S.boite(0.36, hl, 0.36, W / 2, hl / 2, -D / 2, M.cadre);
  S.boite(0.36, H, 0.36, x0, H / 2, -D / 2, M.cadre);
  // porte de service sur le pignon (+X) et plaque d'enseigne
  S.boite(0.1, 2.15, 1.15, W / 2 + 0.04, 1.08, z1 - 1.7, M.cadre);
  S.boite(0.04, 1.85, 0.85, W / 2 + 0.1, 1.0, z1 - 1.7, 0xc5cde0);
  S.boite(0.22, 0.12, 1.4, W / 2 + 0.1, 2.25, z1 - 1.7, 0xf2f5fb);
  plaques.push({ w: 3.4, h: 0.85, x: W / 2 + 0.05, y: hl * 0.6, z: -0.2, ry: Math.PI / 2 });

  // toit : un panneau incliné par dent, joints debout ; liseré aux couleurs de l'entreprise le long du bord de façade
  const L = Math.hypot(p, hr), a = -Math.atan2(hr, p), T = 0.16, sail = 0.4;
  for (let i = 0; i < n; i++) {
    const xl = x0 + i * p, xr = xl + p, mx = (xl + xr) / 2, my = hl + hr / 2;
    const nx = hr / L, ny = p / L, off = T / 2 + 0.03;
    const g = new BoxGeometry(L + 0.5, T, D + 2 * sail);
    const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) { uv.setXY(k, uv.getX(k), uv.getY(k) * (D + 2 * sail) / 0.9); }
    g.rotateZ(a); g.translate(mx + nx * off - 0.08 * Math.cos(a), my + ny * off + 0.08 * Math.sin(a), 0);
    toit.push(g);
    // liseré de façade (deux tons) + faîtage + gouttière
    const bx = mx + nx * (off + T / 2 + 0.0), by = my + ny * (off + T / 2);
    S.boite(L + 0.5, 0.1, 0.1, bx, by - 0.02, z1 + sail + 0.04, M.lis[0], 0, a);
    S.boite(L + 0.5, 0.07, 0.07, bx + nx * 0.07, by + ny * 0.07 - 0.02, z1 + sail + 0.06, M.lis[1], 0, a);
    S.boite(0.3, 0.3, D + 2 * sail + 0.1, xr + 0.08, hl + 0.02, 0, M.cadre);
    S.boite(0.26, 0.26, D + 2 * sail + 0.1, xl - 0.04, H + 0.05, 0, M.cadre, 0, a);
    // vitrage de la contremarche (visible en tournant la vue)
    verre.boite(0.08, hr * 0.5, D * 0.8, xl - 0.06, hl + hr * 0.52, 0, 0xc6e8f6);
  }

  return {
    statique: S.fin(), murs: fusionner(murs), toit: fusionner(toit), verre: verre.fin(),
    plaques, piles, h: H, ancre: [0, H + 0.4, 0], boite: [W, H, D], pin: [0, H + 0.1, 0], portes: n,
  };
}

// ===========================================================================================================================
//  Boutique : vitrine, porte, auvent rayé, enseigne, toit plat avec climatiseurs ; la marchandise se voit à travers la vitre
// ===========================================================================================================================
export function boutique(W, D, M, R) {
  const H = 4.0, vitre = 3.3, avant = clamp(D * 0.5, 2.6, 4.2), arr = D - avant;
  const x0 = -W / 2, z1 = D / 2, zc = -D / 2 + arr;               // zc = face avant du corps plein (le fond du magasin)
  const S = new Pieces(), murs = [], verre = new Pieces(), piles = [], plaques = [];

  murs.push(boiteMur(W, H, arr, 0, H / 2, -D / 2 + arr / 2, 0.5));          // fond du magasin (plein)
  murs.push(boiteMur(0.25, H, avant, x0 + 0.125, H / 2, zc + avant / 2, 0.5));   // murs latéraux de l'espace de vente
  murs.push(boiteMur(0.25, H, avant, -x0 - 0.125, H / 2, zc + avant / 2, 0.5));
  murs.push(boiteMur(W, 0.7, 0.3, 0, H - 0.35, z1 - 0.15, 0.5));            // bandeau au-dessus de la vitrine
  S.boite(W + 0.5, 0.28, D + 0.5, 0, H + 0.14, 0, 0xf1f4fa);                // dalle de toit et acrotère
  S.boite(W + 0.5, 0.22, 0.28, 0, H + 0.39, z1 + 0.11, M.cadre);
  S.boite(0.28, 0.22, D + 0.5, -x0 + 0.11, H + 0.39, 0, M.cadre);
  S.boite(0.28, 0.22, D + 0.5, x0 - 0.11, H + 0.39, 0, M.cadre);
  S.boite(W - 0.3, 0.06, avant - 0.2, 0, 0.08, zc + avant / 2, 0xe6d9c6);   // plancher de l'espace de vente
  // vitrine : cadre foncé, montants, porte
  const pd = Math.min(1.5, W * 0.18);
  S.boite(W, 0.18, 0.2, 0, vitre + 0.09 - 0.0, z1 - 0.1, M.cadre);
  S.boite(W, 0.14, 0.2, 0, 0.07, z1 - 0.1, M.cadre);
  const nm = Math.max(2, Math.round(W / 2.4));
  for (let i = 0; i <= nm; i++) { S.boite(0.12, vitre, 0.16, x0 + (i / nm) * W, vitre / 2, z1 - 0.1, M.cadre); }
  S.boite(pd + 0.3, vitre - 0.25, 0.22, 0, (vitre - 0.25) / 2 + 0.08, z1 - 0.04, M.cadre);
  verre.boite(W - 0.3, vitre - 0.3, 0.05, 0, vitre / 2 + 0.02, z1 - 0.1, 0xc9ecf7);
  S.boite(pd, vitre - 0.55, 0.1, 0, (vitre - 0.55) / 2 + 0.1, z1 - 0.0, 0xe3f4fb);
  S.boite(0.07, 0.9, 0.12, -pd / 2 + 0.18, 1.3, z1 + 0.06, GRIS);
  S.boite(0.07, 0.9, 0.12, pd / 2 - 0.18, 1.3, z1 + 0.06, GRIS);
  S.boite(pd + 1.0, 0.1, 0.9, 0, 0.05, z1 + 0.45, BETON);                    // seuil
  // étagères le long du fond, visibles à travers la vitre
  for (let i = 0; i < 3; i++) {
    const sx = x0 + 1.2 + i * (W - 2.4) / 2;
    S.boite(1.8, 1.9, 0.5, sx, 0.95 + 0.06, zc + 0.3, 0xcfa56f);
    S.boite(1.7, 0.05, 0.52, sx, 0.9, zc + 0.3, 0xe8d3b0); S.boite(1.7, 0.05, 0.52, sx, 1.45, zc + 0.3, 0xe8d3b0);
  }
  // climatiseurs sur le toit
  for (let i = 0; i < 2; i++) {
    const cx = x0 + W * (0.28 + 0.42 * i);
    S.boite(1.6, 0.7, 1.2, cx, H + 0.28 + 0.35, -D / 2 + arr * 0.45, 0xdfe5ef);
    S.cyl(0.42, 0.42, 0.06, cx, H + 0.28 + 0.72, -D / 2 + arr * 0.45, 0x8e9ab2, 12);
  }
  // fenêtre sur le pignon (+X)
  verre.boite(0.06, 1.3, 1.6, -x0 + 0.02, 2.2, -D / 2 + arr * 0.5, 0xc9ecf7);
  S.boite(0.1, 1.45, 0.12, -x0 + 0.02, 2.2, -D / 2 + arr * 0.5 - 0.84, M.cadre);
  S.boite(0.1, 1.45, 0.12, -x0 + 0.02, 2.2, -D / 2 + arr * 0.5 + 0.84, M.cadre);
  // enseigne (plaque texturée) et auvent rayé incliné
  plaques.push({ w: Math.min(W - 1.0, 5.2), h: 0.6, x: 0, y: H - 0.35, z: z1 + 0.02, ry: 0 });
  const prof = 1.15;
  plaques.push({ auvent: true, w: W + 0.2, l: Math.hypot(prof, 0.5), x: 0, y: vitre + 0.3, z: z1 + prof / 2, rx: Math.atan2(0.5, prof) });
  S.boite(W + 0.2, 0.12, 0.1, 0, vitre - 0.12, z1 + prof - 0.05, M.cadre);
  // marchandise : deux piles près de la vitre, la première visible en premier
  piles.push(pile(-W * 0.22, 0.1, zc + avant - 1.25, 2, 2, 3, 0.12), pile(W * 0.2, 0.1, zc + avant - 1.5, 2, 2, 3, -0.1));

  return { statique: S.fin(), murs: fusionner(murs), toit: null, verre: verre.fin(), plaques, piles, h: H + 0.5, ancre: [0, H + 0.9, 0], boite: [W, H + 0.5, D], pin: [0, H + 0.6, 0], vitreTrans: true };
}

// ===========================================================================================================================
//  Cube de service : camion à caisse blanche, cabine aux couleurs de l'entreprise, hayon abaissé et caisse ouverte à l'arrière (+X)
// ===========================================================================================================================
export function camion(W, D, M, R) {
  const e = clamp((W - 0.6) / 6.9, 0.55, 1.15);
  const S = new Pieces(), verre = new Pieces(), piles = [], plaques = [];
  const cabX0 = -3.3, cabX1 = -1.4, bx0 = -1.3, bx1 = 3.2, larg = 2.3, demi = larg / 2;

  // châssis, roues (essieu avant simple, arrière double), garde-boue
  S.boite(6.6, 0.3, 1.6, -0.05, 0.75, 0, NOIR);
  [[-2.45, 1], [-2.45, -1], [1.7, 1], [1.7, -1], [2.35, 1], [2.35, -1]].forEach(([x, s]) => {
    S.cyl(0.52, 0.52, 0.36, x, 0.52, s * 1.02, NOIR, 14, Math.PI / 2);
    S.cyl(0.26, 0.26, 0.37, x, 0.52, s * 1.03, 0xc3cbdc, 10, Math.PI / 2);
  });
  S.boite(1.4, 0.3, 0.1, -2.45, 1.0, 1.15, 0x3a4152); S.boite(1.4, 0.3, 0.1, -2.45, 1.0, -1.15, 0x3a4152);
  // cabine (profil à pare-brise incliné, bords doux)
  const cab = [[-3.2, 0.7], [-3.2, 1.55], [-2.95, 2.05], [-2.5, 2.45], [-1.5, 2.45], [-1.5, 0.7]];
  S.profil(cab, larg - 0.2, 0, 0, 0, M.cabine, 0.1);
  S.boite(0.16, 0.34, larg - 0.1, -3.34, 0.95, 0, 0xe8edf6);                    // pare-chocs
  S.boite(0.06, 0.16, 0.5, -3.33, 1.4, 0.75, 0xfff4cc); S.boite(0.06, 0.16, 0.5, -3.33, 1.4, -0.75, 0xfff4cc);
  S.boite(0.06, 0.55, 1.1, -3.3, 1.2, 0, 0x2d3445);                             // calandre
  verre.g(new BoxGeometry(0.06, 0.62, larg - 0.5), 0x253047, -2.745, 2.27, 0, 0, 0, -0.844);        // pare-brise incliné (teinté)
  [-1, 1].forEach(s => {
    verre.boite(1.2, 0.72, 0.05, -2.2, 1.88, s * (demi - 0.07), 0x253047);
    S.boite(0.12, 0.3, 0.1, -3.0, 1.55, s * (demi + 0.12), 0x2d3445);           // rétroviseurs
  });
  // caisse : plancher, toit, parois fines, cloison avant ; l'arrière (+X) est ouvert
  const ch = 3.45, bz = demi - 0.02;
  S.boite(bx1 - bx0, 0.14, larg - 0.04, (bx0 + bx1) / 2, 1.0, 0, 0xe3e8f2);
  S.boite(bx1 - bx0 + 0.1, 0.16, larg + 0.06, (bx0 + bx1) / 2, ch + 0.08, 0, 0xf6f8fc);
  [-1, 1].forEach(s => {
    S.boite(bx1 - bx0, ch - 1.0, 0.1, (bx0 + bx1) / 2, (ch + 1.0) / 2, s * bz, 0xf9fbfe);
    S.boite(bx1 - bx0 - 0.1, 0.3, 0.025, (bx0 + bx1) / 2 - 0.05, 1.5, s * (bz + 0.06), M.bande);       // bande aux couleurs de l'entreprise
    S.boite(bx1 - bx0 - 0.1, 0.07, 0.025, (bx0 + bx1) / 2 - 0.05, 1.78, s * (bz + 0.06), M.filet);
    S.boite(0.2, ch - 1.0, 0.16, bx1 - 0.1, (ch + 1.0) / 2, s * (bz - 0.0), 0xd9dfec);               // montants arrière
    S.boite(1.05, 2.35, 0.07, bx1 - 0.6, 2.15, s * (demi + 0.1), 0xf9fbfe);                              // vantaux ouverts, rabattus le long de la caisse
    S.boite(0.12, 0.12, 0.12, bx1 + 0.02, 0.98, s * 0.95, 0xd7263d);                                    // feux arrière
  });
  S.boite(0.1, ch - 1.0, larg - 0.04, bx0 + 0.1, (ch + 1.0) / 2, 0, 0xe7ecf5);                         // cloison avant (fond visible)
  // hayon élévateur abaissé, avec son liseré jaune
  S.boite(0.95, 0.1, larg - 0.2, bx1 + 0.5, 0.2, 0, 0x9aa6bd);
  S.boite(0.08, 0.12, larg - 0.2, bx1 + 0.99, 0.2, 0, 0xf2b53a);
  S.boite(0.1, 0.5, larg - 0.4, bx1 + 0.02, 0.55, 0, 0x30384b);                                         // pare-chocs arrière
  // logo réel de l'entreprise des DEUX côtés de la caisse (BEA : bandeau large ; BCH : panneau rouge ; autre : son nom sur blanc)
  const lg = M.logo ? M.logo.ratio : 4, PH = M.cle === 'bch' ? 1.0 : (M.logo ? 0.66 : 0.62), PW = Math.min(M.cle === 'bch' ? 2.2 : 3.2, PH * lg), py = M.cle === 'bch' ? 2.35 : 2.5, px = M.cle === 'bch' ? 0.45 : 0.35;   // à gauche des vantaux ouverts
  plaques.push({ tex: 'logo', w: PW, h: PH, x: px, y: py, z: bz + 0.075, ry: 0 }, { tex: 'logo', w: PW, h: PH, x: px, y: py, z: -bz - 0.075, ry: Math.PI });
  // cartons : sur le hayon d'abord, puis deux piles au fond de la caisse
  piles.push(pile(bx1 + 0.5, 0.25, 0, 2, 2, 3, 0.05), pile(2.35, 1.07, -0.56, 2, 2, 3, 0.03), pile(2.35, 1.07, 0.56, 2, 2, 3, -0.04));

  return { statique: S.fin(), murs: null, toit: null, verre: verre.fin(), plaques, piles, h: ch + 0.3, ancre: [0, ch + 0.7, 0], boite: [6.8, ch + 0.2, larg + 0.4], pin: [0, ch + 0.4, 0], echelle: e };
}
