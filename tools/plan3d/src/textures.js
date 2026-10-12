// Textures dessinées par code (CanvasTexture) : nervures des murs, joints du toit, dalles du sol, enseignes, auvent.
import { CanvasTexture, RepeatWrapping, ClampToEdgeWrapping, SRGBColorSpace } from 'three';

function canevas(l, h) { const c = document.createElement('canvas'); c.width = l; c.height = h; return [c, c.getContext('2d')]; }
function texture(c, repete, aniso) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = repete ? RepeatWrapping : ClampToEdgeWrapping;
  t.wrapT = repete === 'xy' ? RepeatWrapping : ClampToEdgeWrapping;
  t.anisotropy = aniso || 1;
  return t;
}

/** Tôle nervurée verticale : un « pas » = 0,5 m ; légère ombre vers le bas du mur (4 m de hauteur de dégradé). */
export function murs(aniso) {
  const [c, x] = canevas(64, 128);
  const g = x.createLinearGradient(0, 128, 0, 0);       // v = 0 en bas du canevas : y = 128
  g.addColorStop(0, '#d3daea'); g.addColorStop(0.35, '#e8edf6'); g.addColorStop(1, '#f6f8fc');
  x.fillStyle = g; x.fillRect(0, 0, 64, 128);
  const n = x.createLinearGradient(0, 0, 64, 0);        // une nervure : ombre, creux, éclat
  n.addColorStop(0, 'rgba(120,135,170,0)'); n.addColorStop(0.18, 'rgba(120,135,170,.34)'); n.addColorStop(0.42, 'rgba(120,135,170,0)');
  n.addColorStop(0.7, 'rgba(255,255,255,.55)'); n.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = n; x.fillRect(0, 0, 64, 128);
  return texture(c, 'x', aniso);
}

/** Toit en tôle à joints debout : les bandes courent le long de la pente (variation selon v). */
export function toit(aniso) {
  const [c, x] = canevas(8, 64);
  const g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,255,255,.20)'); g.addColorStop(0.12, 'rgba(255,255,255,0)'); g.addColorStop(0.86, 'rgba(0,0,40,0)'); g.addColorStop(1, 'rgba(0,0,40,.32)');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 8, 64);
  x.fillStyle = g; x.fillRect(0, 0, 8, 64);
  return texture(c, 'xy', aniso);
}

/** Dalles de béton du sol (joints discrets, très peu de grain). */
export function dalles(aniso) {
  const [c, x] = canevas(256, 256);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (150 + (i * 7) % 60) + ',' + (165 + (i * 13) % 50) + ',200,.045)'; x.fillRect((i * 97) % 256, (i * 53) % 256, 2 + (i % 4), 2 + (i % 3)); }
  x.fillStyle = 'rgba(120,138,176,.30)'; x.fillRect(0, 0, 256, 2); x.fillRect(0, 0, 2, 256);
  x.fillStyle = 'rgba(255,255,255,.65)'; x.fillRect(0, 2, 256, 2); x.fillRect(2, 0, 2, 256);
  return texture(c, 'xy', aniso);
}

/** Enseigne : plaque blanche aux coins ronds, barre de la couleur de l'entreprise, nom en gras. */
export function enseigne(nom, c1, c2, sombre, aniso) {
  const L = 512, H = 128, [c, x] = canevas(L, H);
  const rr = (px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  rr(4, 4, L - 8, H - 8, 22); x.fillStyle = sombre ? c1 : '#ffffff'; x.fill();
  if (!sombre) { rr(4, H - 30, L - 8, 26, 14); x.fillStyle = c1; x.fill(); x.fillStyle = c2; x.fillRect(4, H - 32, L - 8, 5); }
  // petit cube logo
  const cx = 62, cy = 58;
  x.fillStyle = sombre ? '#ffffff' : c1; x.beginPath(); x.moveTo(cx, cy - 30); x.lineTo(cx + 26, cy - 15); x.lineTo(cx + 26, cy + 15); x.lineTo(cx, cy + 30); x.lineTo(cx - 26, cy + 15); x.lineTo(cx - 26, cy - 15); x.closePath(); x.fill();
  x.fillStyle = sombre ? c1 : c2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 26, cy - 15); x.lineTo(cx + 26, cy + 15); x.lineTo(cx, cy + 30); x.closePath(); x.fill();
  x.fillStyle = sombre ? '#ffffff' : c1;
  x.font = '700 50px "Figtree", "Segoe UI", system-ui, sans-serif'; x.textBaseline = 'middle';
  let t = nom, taille = 50;
  while (x.measureText(t).width > L - 150 && taille > 22) { taille -= 2; x.font = '700 ' + taille + 'px "Figtree", "Segoe UI", system-ui, sans-serif'; }
  x.fillText(t, 108, sombre ? 64 : 52);
  return texture(c, false, aniso);
}

/** Bandes de l'auvent (alternance couleur / blanc), répétées en x. */
export function auvent(c1, c2, aniso, bandes) {
  const [c, x] = canevas(64, 8), n = bandes || 1, w = 64 / (2 * n);
  for (let i = 0; i < n; i++) { x.fillStyle = c1; x.fillRect(i * 2 * w, 0, w, 8); x.fillStyle = c2; x.fillRect(i * 2 * w + w, 0, w, 8); }
  const t = texture(c, 'x', aniso);
  return t;
}

// ---------------------------------------------------------------------------------------------------------------------------------
//  Logos réels (images du même domaine chargées par le bundle, jamais d'une autre origine) et textures des sites du client
// ---------------------------------------------------------------------------------------------------------------------------------
function arrondi(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }

/**
 * Plaque de logo (côtés d'un camion, panneau d'un bâtiment). Tant que l'image n'est pas arrivée, on dessine le nom de l'entreprise ;
 * dessiner(img) redessine avec le vrai logo (mêmes texture et canevas : le maillage n'a rien à changer). Résolution : 1024 px de large, mipmaps, anisotropie, sRGB.
 */
export function plaqueLogo(ratio, nom, c1, c2, mode, aniso) {
  const L = 1024, H = Math.max(64, Math.round(L / ratio)), [c, x] = canevas(L, H);
  const t = texture(c, false, aniso);
  t.minFilter = 1008;            // LinearMipmapLinearFilter
  const fond = () => { arrondi(x, 4, 4, L - 8, H - 8, Math.min(40, H / 5)); };
  const secours = () => {
    x.clearRect(0, 0, L, H); fond(); x.fillStyle = mode === 'rouge' ? c1 : '#ffffff'; x.fill();
    x.fillStyle = mode === 'rouge' ? '#ffffff' : c1; x.textBaseline = 'middle'; x.textAlign = 'center';
    let s = Math.round(H * 0.42); x.font = '800 ' + s + 'px "Figtree", "Segoe UI", system-ui, sans-serif';
    while (x.measureText(nom).width > L * 0.86 && s > 18) { s -= 3; x.font = '800 ' + s + 'px "Figtree", "Segoe UI", system-ui, sans-serif'; }
    x.fillText(nom, L / 2, H / 2);
    if (mode !== 'rouge') { x.fillStyle = c2; x.fillRect(L * 0.1, H - 22, L * 0.8, 6); }
  };
  secours();
  return {
    tex: t, canvas: c,
    dessiner(img) {
      if (!img) { secours(); t.needsUpdate = true; return; }
      x.clearRect(0, 0, L, H);
      if (mode === 'rouge') {            // le logo a son propre fond rouge : il remplit la plaque (coins arrondis, mince liseré blanc)
        x.save(); fond(); x.clip(); x.drawImage(img, 0, 0, L, H); x.restore();
        fond(); x.lineWidth = 7; x.strokeStyle = '#ffffff'; x.stroke();
      } else {                           // logo sur fond blanc, marges égales
        fond(); x.fillStyle = '#ffffff'; x.fill();
        const pad = H * 0.1, s = Math.min((L - 2 * pad) / img.width, (H - 2 * pad) / img.height), w = img.width * s, h = img.height * s;
        x.drawImage(img, (L - w) / 2, (H - h) / 2, w, h);
        fond(); x.lineWidth = 5; x.strokeStyle = 'rgba(120,135,170,.35)'; x.stroke();
      }
      t.needsUpdate = true;
    },
  };
}

/** Enseigne « Boutique Chaleur » : lettres rouges avec la flamme, sans fond (comme sur la façade) ; extraites du vrai logo (lettres blanches sur rouge). */
export function enseigneBCH(ratio, aniso) {
  const L = 1024, H = Math.round(L / ratio), [c, x] = canevas(L, H), t = texture(c, false, aniso);
  t.minFilter = 1008;
  const secours = () => {
    x.clearRect(0, 0, L, H); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#d4202c'; x.font = '900 ' + Math.round(H * 0.34) + 'px "Figtree", system-ui, sans-serif';
    x.fillText('Boutique', L / 2, H * 0.52); x.fillText('Chaleur', L / 2, H * 0.84);
    x.beginPath(); x.moveTo(L * 0.5, H * 0.04); x.bezierCurveTo(L * 0.62, H * 0.2, L * 0.6, H * 0.3, L * 0.5, H * 0.34); x.bezierCurveTo(L * 0.4, H * 0.3, L * 0.38, H * 0.2, L * 0.5, H * 0.04); x.fillStyle = '#ff7a2a'; x.fill();
  };
  secours();
  return {
    tex: t, canvas: c,
    dessiner(img) {
      if (!img) { secours(); t.needsUpdate = true; return; }
      // zone du logo qui porte la flamme et les deux mots (sans le « 50 ans » doré)
      const sx = img.width * 0.035, sy = img.height * 0.2, sw = img.width * 0.66, sh = img.height * 0.78;
      const tmp = document.createElement('canvas'); tmp.width = L; tmp.height = H;
      const y = tmp.getContext('2d', { willReadFrequently: true });
      y.drawImage(img, sx, sy, sw, sh, 0, 0, L, H);
      try {
        const d = y.getImageData(0, 0, L, H), p = d.data;
        for (let i = 0; i < p.length; i += 4) {
          const m = Math.min(p[i], p[i + 1], p[i + 2]);                // lettres blanches : les trois canaux hauts ; fond rouge : vert et bleu bas
          const a = Math.max(0, Math.min(1, (m - 120) / 100));
          const py = ((i / 4) / L) / H;                                // la flamme (en haut) tire vers l'orangé
          p[i] = 214; p[i + 1] = py < 0.36 ? 110 : 26; p[i + 2] = py < 0.36 ? 30 : 36; p[i + 3] = Math.round(a * 255);
        }
        x.clearRect(0, 0, L, H); x.putImageData(d, 0, 0);
      } catch (e) { secours(); }                                        // image d'une autre origine : le canevas est « teinté », on garde le dessin de secours
      t.needsUpdate = true;
    },
  };
}

/** Briques (joints de mortier) : c1, c2 = deux tons ; un carreau = 1 m de côté. */
export function briques(c1, c2, joint, aniso) {
  const [c, x] = canevas(128, 128);
  x.fillStyle = joint; x.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) {
    for (let k = -1; k < 4; k++) {
      const bx = k * 32 + (r % 2 ? 16 : 0), by = r * 16;
      x.fillStyle = ((r * 7 + k * 3) % 5 === 0) ? c2 : c1; x.fillRect(bx + 1.5, by + 1.5, 29, 13);
      x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(bx + 1.5, by + 1.5, 29, 3);
    }
  }
  return texture(c, 'xy', aniso);
}

/** Vitrines du showroom (façade BCH) : trois panneaux « Poêles / Foyers / Décorations » en lettres rouges sur verre pâle. */
export function vitrinesBCH(aniso) {
  const L = 1024, H = 384, [c, x] = canevas(L, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e9f3f8'); g.addColorStop(1, '#cfdde8');
  ['Poêles', 'Foyers', 'Décorations'].forEach((m, i) => {
    const px = 8 + i * (L / 3);
    x.fillStyle = g; x.fillRect(px, 6, L / 3 - 16, H - 12);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.moveTo(px + 20, 6); x.lineTo(px + 120, 6); x.lineTo(px + 50, H - 6); x.lineTo(px + 6, H - 6); x.fill();
    x.fillStyle = '#d4202c'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let s = 74; x.font = '800 ' + s + 'px "Figtree", system-ui, sans-serif';
    while (x.measureText(m).width > L / 3 - 70 && s > 30) { s -= 3; x.font = '800 ' + s + 'px "Figtree", system-ui, sans-serif'; }
    x.fillText(m, px + (L / 3 - 16) / 2, H * 0.2);
    x.fillStyle = '#ff9a3c'; x.beginPath(); x.moveTo(px + (L / 3 - 16) / 2, H * 0.52); x.bezierCurveTo(px + (L / 3) * 0.66, H * 0.7, px + (L / 3) * 0.6, H * 0.85, px + (L / 3 - 16) / 2, H * 0.9); x.bezierCurveTo(px + (L / 3) * 0.3, H * 0.85, px + (L / 3) * 0.36, H * 0.7, px + (L / 3 - 16) / 2, H * 0.52); x.fill();
  });
  const t = texture(c, false, aniso); t.minFilter = 1008; return t;
}

/** Panneau du showroom intérieur : « Poêles · Foyers · Décorations ». */
export function panneauShowroom(aniso) {
  const L = 1024, H = 160, [c, x] = canevas(L, H);
  arrondi(x, 4, 4, L - 8, H - 8, 30); x.fillStyle = '#c8202c'; x.fill();
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 66px "Figtree", system-ui, sans-serif';
  x.fillText('Poêles · Foyers · Décorations', L / 2, H / 2 + 4);
  const t = texture(c, false, aniso); t.minFilter = 1008; return t;
}
