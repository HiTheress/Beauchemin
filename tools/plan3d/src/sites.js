// Les sites réels du client, d'après leurs photos : Boutique Chaleur (façade grise, corniche et pignon rouges, auvents rayés, cheminée en brique)
// et Beauchemin (bureau en brique beige sous une tôle saumon, enseigne, oriflammes, mât de manche à air).
// Mêmes conventions que batiments.js : repère local centré, façade vers +Z, mètres ; chaque fabrique rend des géométries fusionnées par matériau.
import { Pieces, boiteMur, boiteUV, prismeMur, clamp, fusionner } from './geo.js';
import { BoxGeometry, ConeGeometry, CylinderGeometry, Shape, ExtrudeGeometry } from 'three';
import { pile } from './batiments.js';

const NOIR = 0x222733, VERRE = 0x2f3a4c;

/** Prisme extrudé selon X : profil en (z, y), largeur W, de x0 à x0 + W. */
function prismeX(pts, W, x0) {
  const g = prismeMur(pts, null, W, 0, 0.5);
  g.rotateY(-Math.PI / 2); g.translate(x0 + W, 0, 0);
  return g;
}

/** Fanion en goutte (oriflamme) : mât + toile découpée, face à +Z. */
function oriflamme(P, x, z, couleur, hauteur, ry) {
  P.cyl(0.035, 0.045, hauteur, x, hauteur / 2, z, 0x8a93a6, 6);
  const s = hauteur * 0.62, pts = [[0, 0], [0, 0.95], [0.1, 1.5], [0.32, 1.85], [0.6, 1.95], [0.82, 1.8], [0.9, 1.45], [0.78, 1.0], [0.55, 0.5], [0.3, 0.14]].map(p => [p[0] * s * 0.5, p[1] * s * 0.5]);
  P.profil(pts, 0.03, x, hauteur - s * 1.0 - 0.1, z, couleur, 0, ry || 0);
}

/**
 * Bureau Beauchemin : brique beige en bas (fenêtres, entrée vitrée), tôle saumon en haut, toit à faible pente saumon, panneau « BEAUCHEMIN » (logo réel),
 * oriflammes, mât de manche à air. Pour un emplacement « boutique » de Beauchemin, ou comme bloc de bureau d'un entrepôt (bloc = true : pas de cour latérale).
 * W = largeur disponible ; ox = décalage horizontal du bloc.
 */
export function bureauBEA(W, D, M, R, opts) {
  opts = opts || {};
  const bloc = !!opts.bloc, cour = !bloc && W >= 9 ? 2.6 : 0, Wb = W - cour, ox = opts.ox !== undefined ? opts.ox : -W / 2 + Wb / 2;
  const hb = 2.55, hu = 2.45, H = hb + hu, rise = clamp(D * 0.14, 0.5, 1.0), x0 = ox - Wb / 2, x1 = ox + Wb / 2, z1 = D / 2, z0 = -D / 2;
  const S = new Pieces(), verre = new Pieces(), couches = [], plaques = [], piles = [];
  // corps : brique beige (bas) + tôle saumon (haut, profil en pente) + toit
  couches.push({ geo: boiteUV(Wb, hb, D, ox, hb / 2, 0, 0.9, 0.9), tex: 'briqueBeige', couleur: 0xffffff });
  couches.push({ geo: prismeX([[z0, hb], [z1, hb], [z1, H], [z0, H + rise]], Wb, x0), tex: 'murs', couleur: 0xf2a79d });
  const a = Math.atan2(rise, D), L = Math.hypot(D + 0.9, rise), pg = new BoxGeometry(Wb + 0.7, 0.14, L);
  { const uv = pg.attributes.uv; for (let k = 0; k < uv.count; k++) { const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, v * L / 0.9, u * (Wb + 0.7) / 0.9); } }
  pg.rotateX(a); pg.translate(ox, H + rise / 2 + 0.06, 0.0);
  couches.push({ geo: pg, tex: 'toit', couleur: 0xe9776b });
  S.boite(Wb + 0.7, 0.2, 0.16, ox, H + 0.02, z1 + 0.42, 0xe9776b);                 // égout
  S.boite(Wb + 0.05, 0.16, D + 0.05, ox, hb + 0.02, 0, 0xeee6d4);                  // cordon entre brique et tôle
  // fenêtres du bas (cadre clair, verre sombre) et petites fenêtres carrées du haut
  const nf = Math.max(2, Math.floor((Wb - 2.8) / 2.1)), ent = ox + Wb * 0.2;
  for (let i = 0; i < nf + 1; i++) {
    const cx = x0 + 1.1 + i * (Wb - 2.2) / nf;
    if (Math.abs(cx - ent) < 1.7) { continue; }
    S.boite(1.45, 1.2, 0.1, cx, 1.55, z1 + 0.03, 0xe9e4d8); verre.boite(1.25, 1.0, 0.06, cx, 1.55, z1 + 0.08, VERRE);
    S.boite(1.6, 0.1, 0.22, cx, 0.9, z1 + 0.1, 0xd9d2c2);
    if (cx > x0 + 4.5 || Wb < 8) { S.boite(0.85, 0.85, 0.08, cx, hb + 1.2, z1 + 0.03, 0xf4efe6); verre.boite(0.68, 0.68, 0.05, cx, hb + 1.2, z1 + 0.07, VERRE); }
  }
  // entrée vitrée avec auvent
  S.boite(2.1, 2.4, 0.14, ent, 1.2, z1 + 0.05, 0xdfe6ee); verre.boite(1.8, 2.2, 0.08, ent, 1.15, z1 + 0.11, 0x3b4a5e);
  S.boite(0.07, 2.2, 0.1, ent, 1.15, z1 + 0.14, 0xdfe6ee);
  S.boite(3.1, 0.14, 1.0, ent, 2.65, z1 + 0.5, 0xe9e4d8); S.boite(2.9, 0.07, 0.07, ent, 2.58, z1 + 1.0, 0x8a93a6);
  S.boite(2.4, 0.18, 0.9, ent, 0.09, z1 + 0.45, 0xcfd6e4);
  // panneau blanc « BEAUCHEMIN » (logo réel) sur la tôle, à gauche
  plaques.push({ tex: 'logo', w: Math.min(3.2, Wb * 0.3), h: Math.min(3.2, Wb * 0.3) / 4.89, x: x0 + Math.min(3.2, Wb * 0.3) / 2 + 0.7, y: hb + 1.25, z: z1 + 0.03, ry: 0 });
  // oriflammes en goutte devant le bâtiment, mât de manche à air au fond
  oriflamme(S, x0 + Wb * 0.38, z1 + 0.6, 0xd0202c, 3.5, 0.7); oriflamme(S, x0 + Wb * 0.47, z1 + 0.6, 0xf5f5f7, 3.5, 0.7);
  S.cyl(0.07, 0.1, 8.2, x0 + 0.5, 4.1, z0 + 0.45, 0x8a93a6, 6);
  for (let i = 0; i < 4; i++) { S.cyl(0.3 - i * 0.045, 0.3 - (i + 1) * 0.045, 0.34, x0 + 0.5 - 0.17 - i * 0.3, 8.0 - i * 0.04, z0 + 0.45, i % 2 ? 0xf4f4f4 : 0xff6a2a, 8, 0, Math.PI / 2 + 0.2); }
  S.boite(1.4, 0.6, 1.0, ox + Wb * 0.3, H + rise + 0.45, -0.2, 0xdfe5ef);          // unité de toit
  // marchandise : deux piles sur palettes dans la cour latérale (ou rien pour un bloc de bureau)
  if (cour) { piles.push(pile(W / 2 - 1.3, 0.04, -D * 0.18, 2, 2, 3, 0.1), pile(W / 2 - 1.3, 0.04, D * 0.2, 2, 2, 3, -0.08)); }
  return { statique: S.fin(), verre: verre.fin(), couches, plaques, piles, h: H + rise + 0.6, ancre: [ox, H + rise + 0.9, 0], boite: [Wb, H + rise + 0.2, D], boiteX: ox, pin: [ox, H + rise + 0.5, 0] };
}

/**
 * Boutique Chaleur (Longueuil) : parement gris, corniche rouge, pignon central rouge, trois auvents rayés sur fenêtres à gauche, grande enseigne
 * « Boutique Chaleur » avec la flamme, porte vitrée, vitrines « Poêles / Foyers / Décorations » sous un long auvent, cheminée en brique rouge.
 */
export function boutiqueBCH(W, D, M, R) {
  const cour = W >= 10 ? 2.4 : 0, Wb = W - cour, ox = -W / 2 + Wb / 2, x0 = -W / 2, x1 = x0 + Wb, z1 = D / 2, z0 = -D / 2;
  const H = 4.2, ROUGE = 0xc92b36, ROUGEF = 0xa21a24, GRIS = 0x8b909a, BR = 0xc4675c;
  const S = new Pieces(), verre = new Pieces(), couches = [], plaques = [], piles = [];
  const secG = Wb * 0.37, secC = Wb * 0.27, secD = Wb * 0.24, chim = Wb - secG - secC - secD;
  const xB = x0 + secG, xC = xB + secC, xD = xC + secD, cC = (xB + xC) / 2;
  // corps gris (parement lisse), brique rouge à hauteur d'homme
  couches.push({ geo: boiteMur(Wb, H, D, ox, H / 2, 0, 0.5), tex: null, couleur: GRIS });
  const br = (w, h, x, y, e = 0.06) => couches.push({ geo: boiteUV(w, h, 0.12, x, y, z1 + e / 2 + 0.02, 0.9, 0.9), tex: 'briqueRouge', couleur: 0xffffff });
  br(secG, 0.8, x0 + secG / 2, 0.4); br(xD - xC, 0.5, (xC + xD) / 2, 0.25);
  // fenêtres de gauche (trois), avec leurs piliers de brique et leurs auvents rayés
  const ww = (secG - 4 * 0.38) / 3;
  for (let i = 0; i < 3; i++) {
    const cx = x0 + 0.38 + ww / 2 + i * (ww + 0.38);
    S.boite(ww + 0.2, 1.7, 0.1, cx, 1.65, z1 + 0.05, 0xe6e6ea); verre.boite(ww - 0.05, 1.5, 0.06, cx, 1.65, z1 + 0.1, i === 1 ? 0x6a5a52 : VERRE);
    S.boite(ww * 0.55, 0.9, 0.05, cx, 1.8, z1 + 0.12, i === 1 ? 0xe9d9c4 : 0x555d6b);           // affiche / foyer en vitrine
    plaques.push({ auvent: true, tex: 'auvent', w: ww + 0.35, l: Math.hypot(0.8, 0.45), x: cx, y: 2.82, z: z1 + 0.4, rx: Math.atan2(0.45, 0.8) });
    S.boite(ww + 0.35, 0.18, 0.06, cx, 2.5, z1 + 0.78, ROUGEF);
  }
  for (let i = 0; i <= 3; i++) { const px = x0 + 0.19 + i * (ww + 0.38); couches.push({ geo: boiteUV(0.38, 1.9, 0.12, px, 1.55 + 0.35, z1 + 0.05, 0.9, 0.9), tex: 'briqueRouge', couleur: 0xffffff }); }
  // centre : porte vitrée, piliers de brique, affiches, enseigne (lettres rouges + flamme), pignon
  S.boite(2.0, 2.5, 0.14, cC, 1.25, z1 + 0.06, 0x2e3440); verre.boite(1.76, 2.3, 0.08, cC, 1.2, z1 + 0.12, 0x20262f);
  S.boite(0.06, 2.3, 0.1, cC, 1.2, z1 + 0.16, 0x4a5262); S.boite(0.5, 0.2, 0.05, cC, 2.62, z1 + 0.1, 0xd02a2a);
  couches.push({ geo: boiteUV(0.55, 2.6, 0.12, xB + 0.28, 1.3, z1 + 0.06, 0.9, 0.9), tex: 'briqueRouge', couleur: 0xffffff });
  couches.push({ geo: boiteUV(0.55, 2.6, 0.12, xC - 0.28, 1.3, z1 + 0.06, 0.9, 0.9), tex: 'briqueRouge', couleur: 0xffffff });
  S.boite(0.8, 1.7, 0.06, xB + 0.95, 1.5, z1 + 0.1, 0x1a1c22); S.boite(0.8, 1.7, 0.06, xC - 0.95, 1.5, z1 + 0.1, 0x2c8ad0);   // poêle à bois en vitrine / affiche bleue
  const sh = Math.min(1.45, secC * 0.95 / 1.88), sw = sh * 1.88;
  plaques.push({ tex: 'enseigneBCH', w: sw, h: sh, x: cC, y: 2.65 + sh / 2, z: z1 + 0.04, ry: 0 });
  const pw = secC * 1.05, ph = 1.55;
  S.boite(pw + 0.5, 0.3, 0.7, cC, H + 0.15, z1 - 0.05, ROUGE);                                 // base du pignon
  S.profil([[-pw / 2, 0], [pw / 2, 0], [0, ph]], 0.4, cC, H + 0.3, z1 - 0.2, GRIS, 0);          // triangle gris
  for (const s of [-1, 1]) S.boite(Math.hypot(pw / 2, ph) + 0.25, 0.26, 0.6, cC + s * pw / 4, H + 0.3 + ph / 2, z1 - 0.05, ROUGE, 0, -s * Math.atan2(ph, pw / 2));
  // showroom (droite) : vitrines à lettres rouges sous un long auvent, brique, cheminée
  S.boite(secD - 0.2, 2.1, 0.12, (xC + xD) / 2, 1.6, z1 + 0.05, 0x2e3440);
  plaques.push({ tex: 'vitrines', w: secD - 0.35, h: (secD - 0.35) * 0.375, x: (xC + xD) / 2, y: 1.6, z: z1 + 0.14, ry: 0 });
  plaques.push({ auvent: true, tex: 'auvent', w: secD + 0.3, l: Math.hypot(0.8, 0.45), x: (xC + xD) / 2, y: 2.98, z: z1 + 0.4, rx: Math.atan2(0.45, 0.8) });
  S.boite(secD + 0.3, 0.18, 0.06, (xC + xD) / 2, 2.66, z1 + 0.78, ROUGEF);
  couches.push({ geo: boiteUV(chim, 7.0, Math.min(D, 1.6), (xD + x1) / 2, 3.5, z1 - Math.min(D, 1.6) / 2 + 0.3, 0.9, 0.9), tex: 'briqueRouge', couleur: 0xffffff });
  S.boite(chim + 0.35, 0.4, Math.min(D, 1.6) + 0.35, (xD + x1) / 2, 7.2, z1 - Math.min(D, 1.6) / 2 + 0.3, ROUGE);
  S.cyl(0.13, 0.13, 0.8, (xD + x1) / 2 - 0.25, 7.8, z1 - 0.5, 0xb8bec8, 8); S.cyl(0.11, 0.11, 0.65, (xD + x1) / 2 + 0.25, 7.7, z1 - 0.5, 0xb8bec8, 8);
  // corniche rouge tout le long, toit plat sombre avec ses appareils
  S.boite(Wb + 0.4, 0.45, 0.62, ox, H + 0.33, z1 - 0.02, ROUGE); S.boite(0.62, 0.45, D + 0.4, x0 - 0.02, H + 0.33, 0, ROUGE); S.boite(0.62, 0.45, D + 0.4, x1 + 0.02, H + 0.33, 0, ROUGE);
  S.boite(Wb - 0.2, 0.12, D - 0.2, ox, H + 0.02, 0, 0x4a505c);
  for (let i = 0; i < 3; i++) { S.boite(0.9, 0.5, 0.7, x0 + Wb * (0.2 + 0.25 * i), H + 0.4, -D * 0.2, 0xd9dfe8); }
  for (let i = 0; i < 3; i++) { S.cyl(0.07, 0.07, 0.6, xB - 1.2 + i * 0.3, H + 0.5, -0.4, 0xb8bec8, 6); }
  // arbustes devant la façade
  for (const [px, sz] of [[x0 - 0.1, 0.5], [xD + 0.1, 0.55], [xC - 0.1, 0.4]]) { S.sphere(sz, px, sz * 0.9, z1 + 0.55, 0x2f5a3a, 1, 1.15, 1, 7); }
  // cour latérale : clôture noire et deux piles de marchandise
  if (cour) {
    S.boite(0.05, 1.4, D - 0.4, W / 2 - 0.1, 0.7, 0, 0x23272f);
    for (let k = 0; k < 6; k++) { S.boite(0.1, 1.5, 0.1, W / 2 - 0.1, 0.75, -D / 2 + 0.3 + k * ((D - 0.6) / 5), 0x23272f); }
    piles.push(pile(W / 2 - 1.5, 0.04, -D * 0.18, 2, 2, 3, 0.1), pile(W / 2 - 1.5, 0.04, D * 0.2, 2, 2, 3, -0.08));
  }
  return { statique: S.fin(), verre: verre.fin(), couches, plaques, piles, h: 7.8, ancre: [ox, 8.3, 0], boite: [Wb, 5.8, D], boiteX: ox, pin: [ox, H + 1.9, 0] };
}
