// Showroom de la Boutique Chaleur : foyers et poêles en exposition sur des podiums (foyer au gaz, poêle à bois noir avec tuyau, foyer en pierre,
// décorations) devant l'arrière-boutique. Tout est fusionné dans un seul maillage ; les flammes sont rendues à part (elles vacillent un instant).
const NOIR = 0x1e2128, PIERRE1 = 0xb9b3a6, PIERRE2 = 0xa39d90, BOIS = 0x8a5a36, FLAMME = 0xffa21f;

function podium(P, x, z, w, d, h) {
  P.boite(w, h, d, x, h / 2, z, 0xf0eee9);
  P.boite(w + 0.1, 0.07, d + 0.1, x, h + 0.03, z, 0xffffff);
  P.boite(w + 0.04, 0.1, d + 0.04, x, 0.05, z, 0x2f343e);
  return h + 0.07;
}
function flammes(F, x, y, z, n, taille) {
  for (let i = 0; i < n; i++) { F.push({ x: x + (i - (n - 1) / 2) * taille * 0.8, y, z, r: taille * (0.55 + (i % 2) * 0.2), h: taille * (1.5 + (i % 3) * 0.35), c: i % 2 ? 0xffd04a : FLAMME, ph: i * 1.7 }); }
}

/** Foyer au gaz : cadre noir à bordure chromée, vitre sombre, lit de bûches, flammes. */
function foyerGaz(P, F, x, z, y0) {
  P.boite(1.7, 1.15, 0.5, x, y0 + 0.58, z, NOIR);
  P.boite(1.34, 0.78, 0.06, x, y0 + 0.6, z + 0.25, 0x0c0e12);
  for (const [dx, dy, w, h] of [[0, 0.99, 1.5, 0.045], [0, 0.21, 1.5, 0.045], [-0.73, 0.6, 0.045, 0.82], [0.73, 0.6, 0.045, 0.82]]) { P.boite(w, h, 0.03, x + dx, y0 + dy, z + 0.27, 0xd9dde4); }
  for (let i = 0; i < 4; i++) { P.cyl(0.07, 0.07, 0.5 - i * 0.04, x - 0.4 + i * 0.27, y0 + 0.3, z + 0.16, 0x4a3426, 6, 0, Math.PI / 2 + (i % 2) * 0.2); }
  flammes(F, x, y0 + 0.36, z + 0.2, 5, 0.1);
}
/** Poêle à bois noir : corps, porte vitrée qui rougeoie, pieds, tuyau jusqu'au plafond. */
function poeleBois(P, F, x, z, y0) {
  P.boite(0.95, 0.78, 0.7, x, y0 + 0.55, z, NOIR);
  P.boite(1.05, 0.07, 0.8, x, y0 + 0.97, z, 0x2a2e37);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P.boite(0.08, 0.2, 0.08, x + sx * 0.4, y0 + 0.1, z + sz * 0.28, NOIR); }
  P.boite(0.52, 0.42, 0.03, x, y0 + 0.58, z + 0.36, 0xff8a2a);
  P.boite(0.6, 0.5, 0.025, x, y0 + 0.58, z + 0.345, 0x3a3f4a);
  P.boite(0.1, 0.55, 0.05, x + 0.34, y0 + 0.6, z + 0.37, 0x777f8c);
  P.cyl(0.1, 0.1, 2.6, x, y0 + 2.3, z - 0.1, 0x2a2e37, 12);
  P.cyl(0.14, 0.14, 0.1, x, y0 + 3.55, z - 0.1, 0x777f8c, 12);
  P.cyl(0.14, 0.14, 0.08, x, y0 + 1.1, z - 0.1, 0x777f8c, 12);
  flammes(F, x, y0 + 0.5, z + 0.34, 3, 0.07);
}
/** Foyer en pierre : jambages et manteau, hotte, foyer avec bûches et feu. */
function foyerPierre(P, F, x, z, y0) {
  P.boite(2.3, 0.18, 0.8, x, y0 + 0.09, z, PIERRE2);
  for (const sx of [-1, 1]) { for (let k = 0; k < 5; k++) { P.boite(0.46, 0.28, 0.55, x + sx * 0.86, y0 + 0.32 + k * 0.28, z, k % 2 ? PIERRE1 : PIERRE2); } }
  P.boite(2.4, 0.2, 0.7, x, y0 + 1.85, z + 0.05, BOIS);
  P.boite(1.6, 1.2, 0.5, x, y0 + 2.55, z - 0.05, PIERRE1); P.boite(1.2, 0.9, 0.45, x, y0 + 3.5, z - 0.1, PIERRE2);
  P.boite(1.28, 1.3, 0.4, x, y0 + 0.9, z - 0.12, 0x15171c);
  for (let i = 0; i < 3; i++) { P.cyl(0.09, 0.09, 0.8, x - 0.3 + i * 0.3, y0 + 0.3, z + 0.02, 0x5a3b26, 7, 0, Math.PI / 2); }
  flammes(F, x, y0 + 0.5, z + 0.02, 6, 0.12);
}
/** Décorations : vases, plante, panier de bûches, bougies. */
function decorations(P, x, z, y0) {
  P.cyl(0.18, 0.3, 0.7, x - 0.6, y0 + 0.35, z, 0xc65a3a, 10); P.sphere(0.2, x - 0.6, y0 + 0.82, z, 0xc65a3a, 1, 0.8, 1, 8);
  P.cyl(0.2, 0.15, 0.4, x + 0.1, y0 + 0.2, z + 0.3, 0xe8e2d4, 10);
  for (let i = 0; i < 6; i++) { P.sphere(0.2, x + 0.1 + Math.cos(i * 1.05) * 0.18, y0 + 0.62 + (i % 2) * 0.2, z + 0.3 + Math.sin(i * 1.05) * 0.18, 0x3f8a52, 1, 1.2, 1, 6); }
  P.boite(0.9, 0.5, 0.6, x + 0.75, y0 + 0.25, z - 0.1, BOIS);
  for (let i = 0; i < 5; i++) { P.cyl(0.09, 0.09, 0.8, x + 0.75, y0 + 0.5 + (i % 2) * 0.12, z - 0.35 + i * 0.14, 0x6a4326, 7, Math.PI / 2, 0, 0); }
  for (let i = 0; i < 3; i++) { P.cyl(0.05, 0.05, 0.22 + i * 0.08, x - 0.2 + i * 0.16, y0 + 0.11 + i * 0.04, z - 0.4, 0xf4ecd6, 8); }
}
/** Poêle à granules (blanc cassé) et braséro rouge : petits produits devant. */
function petits(P, x, z, y0) {
  P.boite(0.7, 1.0, 0.55, x - 0.9, y0 + 0.5, z, 0xe6e4df); P.boite(0.4, 0.32, 0.03, x - 0.9, y0 + 0.6, z + 0.29, 0x20242c); P.boite(0.5, 0.1, 0.4, x - 0.9, y0 + 1.04, z, 0x2a2e37);
  P.cyl(0.38, 0.28, 0.5, x + 0.5, y0 + 0.55, z, 0xb3262e, 14); P.cyl(0.4, 0.4, 0.06, x + 0.5, y0 + 0.82, z, 0x23262d, 14);
  for (const a of [0, 2.1, 4.2]) { P.boite(0.06, 0.3, 0.06, x + 0.5 + Math.cos(a) * 0.24, y0 + 0.15, z + Math.sin(a) * 0.24, 0x23262d); }
}

/**
 * Showroom dans la zone [x0, x1] x [zA, zB] (zB = côté vitrine). Renvoie la liste des flammes (x, y, z, rayon, hauteur, couleur, phase) ;
 * le reste est ajouté à P (géométrie fusionnée à couleurs de sommets).
 */
export function showroom(P, x0, x1, zA, zB) {
  const F = [], w = x1 - x0, zc = zA + 1.7, zp = zB - 1.5;
  // parquet clair du showroom
  P.boite(w, 0.05, zB - zA, (x0 + x1) / 2, 0.025, (zA + zB) / 2, 0xd9c7a8);
  for (let i = 0; i < 10; i++) { P.boite(w, 0.052, 0.03, (x0 + x1) / 2, 0.026, zA + (i + 0.5) * (zB - zA) / 10, 0xcdb994); }
  const y1 = podium(P, x0 + w * 0.17, zc, 2.7, 1.9, 0.3); foyerGaz(P, F, x0 + w * 0.17, zc - 0.2, y1);
  const y2 = podium(P, x0 + w * 0.43, zc, 2.2, 1.9, 0.3); poeleBois(P, F, x0 + w * 0.43, zc, y2);
  const y3 = podium(P, x0 + w * 0.7, zc, 3.0, 1.9, 0.3); foyerPierre(P, F, x0 + w * 0.7, zc - 0.1, y3);
  const y4 = podium(P, x0 + w * 0.92, zc, 2.2, 1.9, 0.3); decorations(P, x0 + w * 0.92 - 0.2, zc, y4);
  const y5 = podium(P, x0 + w * 0.4, zp, 3.2, 1.6, 0.18); petits(P, x0 + w * 0.4, zp, y5);
  // spots de plafond (petits cylindres) au-dessus des produits : lumière douce, détail seulement
  return F;
}
