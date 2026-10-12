// Point d'entrée du bundle : expose window.Plan3D = { disponible(), creer(conteneur, options) }.
import { Scene3D } from './scene.js';

/** Vrai si un contexte WebGL peut être créé (le contexte d'essai est aussitôt libéré). */
function disponible() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) { return false; }
    const e = gl.getExtension('WEBGL_lose_context');
    if (e) { e.loseContext(); }
    return true;
  } catch (e) { return false; }
}

/**
 * Crée la scène dans `conteneur`. options : { libelle (aria-label du canevas), surRendu(rapport), surSelection(id), surSurvol(id), surPerte() }.
 * Lance une exception si le contexte WebGL ne peut pas être créé (l'appelant se replie alors sur la vue Tuiles).
 */
function creer(conteneur, options) { return new Scene3D(conteneur, options).api(); }

window.Plan3D = { disponible, creer };
