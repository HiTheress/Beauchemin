// Atlas d'étiquettes : toutes les plaques de texte d'un intérieur (code + quantité des caisses, lettres d'allée, numéros d'étagère, « +N »…) sont dessinées
// sur quelques grands canevas et posées par des quadrilatères fusionnés (un dessin par page d'atlas) : pas une texture par caisse.
import { CanvasTexture, SRGBColorSpace, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, LinearMipmapLinearFilter, LinearFilter } from 'three';

const CW = 224, CH = 84, COLS = 9, LIGNES_MAX = 48;      // 9 colonnes x 48 lignes = 432 plaques par page (2016 x 4032 px)
const POLICE = '"Figtree", "Segoe UI", system-ui, sans-serif';

function arrondi(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }

/** Dessins de plaques : chacun reçoit (contexte, largeur, hauteur) de sa case. */
export const plaque = {
  /** Étiquette de caisse : code de pièce et quantité ; bande rouge si la pièce est sous le minimum. */
  caisse(code, qte, unite, bas) {
    return (x, w, h) => {
      arrondi(x, 3, 3, w - 6, h - 6, 12); x.fillStyle = '#ffffff'; x.fill(); x.lineWidth = 3; x.strokeStyle = bas ? '#d92d2d' : '#9aa7bd'; x.stroke();
      if (bas) { x.fillStyle = '#d92d2d'; arrondi(x, 3, 3, 18, h - 6, 9); x.fill(); }
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#1d2531';
      let s = 30; x.font = '800 ' + s + 'px ' + POLICE;
      while (x.measureText(code).width > w - 36 && s > 14) { s -= 2; x.font = '800 ' + s + 'px ' + POLICE; }
      x.fillText(code, bas ? 28 : 14, h * 0.32);
      x.textAlign = 'right'; x.fillStyle = bas ? '#b71c1c' : '#0f5132'; x.font = '800 36px ' + POLICE;
      const u = unite && unite !== 'unité' ? ' ' + unite : '';
      let t = qte + u; s = 36; while (x.measureText(t).width > w - 24 && s > 16) { s -= 2; x.font = '800 ' + s + 'px ' + POLICE; }
      x.fillText(t, w - 14, h * 0.7);
    };
  },
  /** Grosse plaque ronde ou carrée avec une lettre ou un chiffre (bout d'allée, numéro d'étagère ou de niveau). */
  repere(texte, fond, encre, carre) {
    return (x, w, h) => {
      if (carre) { x.translate((w - h) / 2, 0); w = h; }
      arrondi(x, 3, 3, w - 6, h - 6, 16); x.fillStyle = fond || '#1f5fbf'; x.fill();
      x.fillStyle = encre || '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      let s = Math.round(h * 0.78); x.font = '800 ' + s + 'px ' + POLICE;
      while (x.measureText(texte).width > w - 20 && s > 14) { s -= 3; x.font = '800 ' + s + 'px ' + POLICE; }
      x.fillText(texte, w / 2, h / 2 + 3);
    };
  },
  /** « +3 » : d'autres pièces dans la même case. */
  plus(n) { return plaque.repere('+' + n, '#f28c28', '#ffffff', true); },
  /** Panneau de zone. */
  zone(texte) { return plaque.repere(texte, '#f2c230', '#2b2b2b', false); },
  /** Lettre d'allée, numéro d'étagère ou de niveau : petite plaque carrée. */
  lettre(texte, fond) { return plaque.repere(texte, fond || '#1f5fbf', '#ffffff', true); },
};

export class Atlas {
  constructor(aniso) {
    this.aniso = aniso; this.pages = []; this.n = 0;
  }
  /** Réserve une case et la dessine ; rend { page, u0, v0, u1, v1 }. */
  ajouter(dessin) {
    let p = this.pages[this.pages.length - 1];
    if (!p || p.n >= COLS * LIGNES_MAX) { p = this.pages[this.pages.push({ n: 0, dess: [], quads: [] }) - 1]; }
    const i = p.n++, col = i % COLS, lig = Math.floor(i / COLS);
    p.dess.push([dessin, col, lig]);
    return { page: this.pages.length - 1, col, lig };
  }
  /** Pose une plaque dans la scène : coins (a, b, c, d) en sens antihoraire vu de face. */
  quad(ref, coins) { this.pages[ref.page].quads.push([ref, coins]); }
  /** Construit les canevas, textures et maillages (un par page). */
  construire(parent) {
    this.meshes = [];
    this.pages.forEach(p => {
      if (!p.quads.length) { return; }
      const lignes = Math.max(1, Math.ceil(p.n / COLS)), c = document.createElement('canvas');
      c.width = CW * COLS; c.height = CH * lignes;
      const x = c.getContext('2d');
      p.dess.forEach(([d, col, lig]) => { x.save(); x.translate(col * CW, lig * CH); x.beginPath(); x.rect(0, 0, CW, CH); x.clip(); d(x, CW, CH); x.restore(); });
      const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = this.aniso; t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter;
      const pos = [], uv = [], idx = [];
      p.quads.forEach(([ref, k], q) => {
        const u0 = (ref.col * CW + 2) / c.width, u1 = ((ref.col + 1) * CW - 2) / c.width, vh = c.height, v1 = 1 - (ref.lig * CH + 2) / vh, v0 = 1 - ((ref.lig + 1) * CH - 2) / vh;
        k.forEach(pt => pos.push(pt[0], pt[1], pt[2]));
        uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
        idx.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
      });
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new MeshBasicMaterial({ map: t, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
      const me = new Mesh(g, m); me.frustumCulled = false; me.renderOrder = 4;
      parent.add(me); this.meshes.push(me);
    });
  }
  liberer(parent) {
    (this.meshes || []).forEach(me => { parent.remove(me); me.geometry.dispose(); me.material.map.dispose(); me.material.dispose(); });
    this.meshes = []; this.pages = [];
  }
}

/** Quadrilatère (largeur w, hauteur h) centré en (x, y, z), tourné de ry autour de Y : rend les quatre coins. ry = 0 : face à +Z ; π : face à −Z ; π/2 : face à +X. */
export function coinsPlaque(x, y, z, w, h, ry) {
  const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, hh = h / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([a, b]) => [x + a * c, y + b, z - a * s]);
}
