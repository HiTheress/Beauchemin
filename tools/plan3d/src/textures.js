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
export function auvent(c1, c2, aniso) {
  const [c, x] = canevas(64, 8);
  x.fillStyle = c1; x.fillRect(0, 0, 32, 8);
  x.fillStyle = c2; x.fillRect(32, 0, 32, 8);
  const t = texture(c, 'x', aniso);
  return t;
}
