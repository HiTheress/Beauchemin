// Petit moteur d'animations (durées, délais, courbes) : la scène ne dessine que tant qu'il en reste une en cours.
export const ease = {
  lin: k => k,
  sortie: k => 1 - Math.pow(1 - k, 3),
  entreeSortie: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  ressort: k => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },   // dépasse un peu puis se pose
  rebond: k => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) { return n * k * k; }
    if (k < 2 / d) { k -= 1.5 / d; return n * k * k + 0.75; }
    if (k < 2.5 / d) { k -= 2.25 / d; return n * k * k + 0.9375; }
    k -= 2.625 / d; return n * k * k + 0.984375;
  },
};

export class Anim {
  /** reduit() : vrai quand la personne demande moins de mouvement (les changements sont alors immédiats). */
  constructor(reduit) { this.l = []; this.reduit = reduit || (() => false); }
  /** { dur, delai, courbe, f(k), fin() } ; rend l'objet (pour l'annuler avec .stop = true). */
  ajouter(o) {
    o.t0 = performance.now() + (o.delai || 0);
    o.courbe = o.courbe || ease.sortie;
    if (this.reduit() && !o.toujours) { o.f(1); if (o.fin) { o.fin(); } return o; }
    this.l.push(o);
    return o;
  }
  actif() { return this.l.length > 0; }
  /** Avance toutes les animations ; vrai s'il en reste. */
  maj(now) {
    const l = this.l;
    for (let i = l.length - 1; i >= 0; i--) {
      const o = l[i];
      if (o.stop) { l.splice(i, 1); continue; }
      if (now < o.t0) { continue; }
      const k = Math.min(1, (now - o.t0) / o.dur);
      o.f(o.courbe(k), k);
      if (k >= 1) { l.splice(i, 1); if (o.fin) { o.fin(); } }
    }
    return l.length > 0;
  }
  vider() { this.l.length = 0; }
}
