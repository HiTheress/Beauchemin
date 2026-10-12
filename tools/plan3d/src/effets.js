// Effets visibles : anneau qui pulse au sol, cadre de sélection/survol, épingles de carte qui tombent, carton qui vole d'un bâtiment à l'autre.
import { Mesh, MeshBasicMaterial, MeshLambertMaterial, ShapeGeometry, LatheGeometry, CircleGeometry, Group, Vector2, Vector3, DoubleSide } from 'three';
import { rectArrondi, lerp } from './geo.js';
import { geoCarton } from './remplissage.js';
import { ease } from './anim.js';

const BLEU_PIN = 0x2f6bff;

/** Épingle de carte : goutte (tournée par révolution) pointe en bas, taille de départ 3 m de haut. */
function geoGoutte() {
  const R = 0.62, yc = 1.95, a = Math.asin(R / yc), phi0 = Math.PI / 2 - a, pts = [new Vector2(0.001, 0)];
  for (let i = 0; i <= 14; i++) { const f = phi0 + (Math.PI - phi0) * i / 14; pts.push(new Vector2(Math.max(0.001, R * Math.sin(f)), yc - R * Math.cos(f))); }
  return new LatheGeometry(pts, 20);
}

export class Effets {
  constructor(scene, anim, demander, ombres) {
    this.scene = scene; this.anim = anim; this.demander = demander; this.ombres = ombres;
    this.geos = new Map();
    this.groupe = new Group(); scene.add(this.groupe);
    this.pins = new Map();                       // id du bâtiment -> { g, base, hauteurBase }
    this.cadre = null; this.survol = null;
    this.geoGoutte = geoGoutte(); this.geoDisque = new CircleGeometry(0.27, 20);
    this.matPin = new MeshLambertMaterial({ color: BLEU_PIN, emissive: 0x0b2a8a, emissiveIntensity: 0.55 });
    this.matDisque = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
    this.carton = null;
    this.camAz = 0.78; this.echelleEcran = 1;
    this.nPulses = 0; this.nVols = 0;                // compteurs cumulés (lus par les tests de navigateur)
  }

  anneauGeo(w, d, trou) {
    const cle = w.toFixed(1) + 'x' + d.toFixed(1) + ':' + trou;
    if (!this.geos.has(cle)) { const g = new ShapeGeometry(rectArrondi(w, d, 1.3, trou), 8); g.rotateX(-Math.PI / 2); this.geos.set(cle, g); }
    return this.geos.get(cle);
  }

  /** Anneau lumineux qui s'élargit et s'efface autour d'un bâtiment (contenu modifié). */
  pulse(b, couleur, reduit) {
    this.nPulses++;
    const g = this.anneauGeo(b.w + 1.6, b.d + 1.6, 0.55);
    const m = new MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.9, depthWrite: false });
    const o = new Mesh(g, m); o.position.set(b.cx, 0.1, b.cz); o.renderOrder = 3;
    this.groupe.add(o);
    const fin = () => { this.groupe.remove(o); m.dispose(); this.demander(); };
    if (reduit) { m.opacity = 0.7; this.anim.ajouter({ dur: 2200, toujours: true, f: () => {}, fin }); return; }
    this.anim.ajouter({
      dur: 1700, courbe: ease.sortie,
      f: k => { const e = 2.4 * k; o.scale.set((b.w + 1.6 + 2 * e) / (b.w + 1.6), 1, (b.d + 1.6 + 2 * e) / (b.d + 1.6)); m.opacity = 0.9 * (1 - k); },
      fin,
    });
    this.demander();
  }

  /** Cadre continu autour du bâtiment choisi (couleur de l'entreprise) ; null l'enlève. */
  selection(b, couleur) {
    if (this.cadre) { this.groupe.remove(this.cadre.o); this.cadre.m.dispose(); this.cadre.m2.dispose(); this.cadre = null; }
    if (!b) { return; }
    const m = new MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.95, depthWrite: false });
    const m2 = new MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.16, depthWrite: false });
    const o = new Group();
    const a = new Mesh(this.anneauGeo(b.w + 1.5, b.d + 1.5, 0.28), m); a.position.y = 0.11;
    const f = new Mesh(this.anneauGeo(b.w + 1.5, b.d + 1.5, 20), m2); f.position.y = 0.09;
    const blanc = new Mesh(this.anneauGeo(b.w + 0.9, b.d + 0.9, 0.12), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); blanc.position.y = 0.12;
    o.add(f, a, blanc); o.position.set(b.cx, 0, b.cz); o.renderOrder = 2;
    this.groupe.add(o);
    this.cadre = { o, m, m2, blanc };
  }

  /** Mince anneau pâle sous le pointeur. */
  survoler(b, couleur) {
    if (this.survol) { this.groupe.remove(this.survol.o); this.survol.m.dispose(); this.survol = null; }
    if (!b) { return; }
    const m = new MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.55, depthWrite: false });
    const o = new Mesh(this.anneauGeo(b.w + 1.4, b.d + 1.4, 0.22), m); o.position.set(b.cx, 0.1, b.cz); o.renderOrder = 2;
    this.groupe.add(o);
    this.survol = { o, m };
  }

  /** Épingle de recherche : tombe au-dessus du bâtiment avec un petit rebond. i = rang (décalage entre deux épingles). */
  epingle(b, i, reduit) {
    this.retirerEpingle(b.id);
    const g = new Group(), goutte = new Mesh(this.geoGoutte, this.matPin), disque = new Mesh(this.geoDisque, this.matDisque);
    goutte.castShadow = true; disque.position.set(0, 2.0, 0.62);
    g.add(goutte, disque);
    const base = b.pinY, k0 = b.pinEchelle;
    g.position.set(b.cx + b.pin[0], base + 9, b.cz + b.pin[2]);
    this.groupe.add(g);
    const p = { g, goutte, disque, base, k0, x: b.cx + b.pin[0], z: b.cz + b.pin[2], mort: false };
    this.pins.set(b.id, p);
    this.orienter(p);
    const de = base + 9;
    if (reduit) { g.position.y = base; this.demander(); return p; }
    g.visible = false;
    this.anim.ajouter({
      dur: 900, delai: 120 + i * 130, courbe: ease.rebond,
      f: k => { g.visible = true; g.position.y = lerp(de, base, k); this.ombres(); },
      fin: () => { g.position.y = base; this.ombres(); },
    });
    this.demander();
    return p;
  }
  retirerEpingle(id) {
    const p = this.pins.get(id); if (!p) { return; }
    this.pins.delete(id); p.mort = true;
    this.groupe.remove(p.g);
  }
  effacerEpingles() { Array.from(this.pins.keys()).forEach(id => this.retirerEpingle(id)); }
  /** Le disque blanc regarde toujours la caméra ; la taille garde un minimum lisible à l'écran. */
  orienter(p, az, ech) {
    if (az !== undefined) { this.camAz = az; }
    if (ech !== undefined) { this.echelleEcran = ech; }
    const s = p.k0 * Math.max(1, 64 / (3.0 * p.k0 * this.echelleEcran));
    p.g.scale.setScalar(Math.min(s, p.k0 * 3.8));
    p.g.rotation.y = this.camAz;
  }
  orienterTout(az, ech) { this.pins.forEach(p => this.orienter(p, az, ech)); }

  /** Un petit carton vole en arc d'un bâtiment à l'autre. */
  voler(de, vers, fin, reduit) {
    if (reduit) { if (fin) { fin(); } return; }
    this.nVols++;
    if (!this.carton) { const g = geoCarton(); this.carton = { g, m: new MeshLambertMaterial({ vertexColors: true, color: 0xe0b07a }) }; }
    const o = new Mesh(this.carton.g, this.carton.m); o.castShadow = true; o.scale.setScalar(1.3);
    this.groupe.add(o);
    const A = new Vector3(de.x, de.y, de.z), B = new Vector3(vers.x, vers.y, vers.z), haut = 5 + A.distanceTo(B) * 0.18;
    this.anim.ajouter({
      dur: 1000, courbe: ease.entreeSortie,
      f: k => { o.position.lerpVectors(A, B, k); o.position.y += Math.sin(Math.PI * k) * haut; o.rotation.set(k * 5, k * 3, k * 2); this.ombres(); },
      fin: () => { this.groupe.remove(o); this.ombres(); if (fin) { fin(); } this.demander(); },
    });
    this.demander();
  }

  liberer() {
    this.groupe.traverse(o => { if (o.material && o.material.dispose && o.material !== this.matPin && o.material !== this.matDisque) { o.material.dispose(); } });
    this.scene.remove(this.groupe);
    this.geos.forEach(g => g.dispose()); this.geos.clear();
    this.geoGoutte.dispose(); this.geoDisque.dispose(); this.matPin.dispose(); this.matDisque.dispose();
    if (this.carton) { this.carton.g.dispose(); this.carton.m.dispose(); }
  }
}
