// Construit gestion/assets/js/plan3d.bundle.js (script classique, sans module ES ni importmap : la CSP interdit les scripts en ligne).
//   cd tools/plan3d && npm install && npm run build
// Three.js n'est importé que pour ce qui sert (tree-shaking) ; le bundle est minifié et porte la licence MIT de Three.js en en-tête.
import { build, context } from 'esbuild';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ici = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.resolve(ici, '../../gestion/assets/js/plan3d.bundle.js');
const three = JSON.parse(readFileSync(path.join(ici, 'node_modules/three/package.json'), 'utf8'));
const licence = readFileSync(path.join(ici, 'node_modules/three/LICENSE'), 'utf8').trim().split('\n').map(l => ' * ' + l).join('\n');

const options = {
  entryPoints: [path.join(ici, 'src/index.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  charset: 'utf8',
  legalComments: 'none',
  outfile: sortie,
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: {
    js: '/*! Vue 3D du Plan : bundle généré par tools/plan3d (npm run build) — ne pas modifier à la main.\n' +
      ' * Contient Three.js r' + three.version.split('.')[1] + ' (' + three.version + '), licence MIT :\n *\n' + licence + '\n */',
  },
};

if (process.argv.includes('--watch')) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Surveillance de src/ (Ctrl+C pour arrêter)');
} else {
  await build(options);
  const brut = statSync(sortie).size;
  const gz = gzipSync(readFileSync(sortie)).length;
  console.log('plan3d.bundle.js : ' + (brut / 1024).toFixed(1) + ' Ko (' + (gz / 1024).toFixed(1) + ' Ko compressé), Three.js ' + three.version);
  if (brut > 700 * 1024) { console.error('Attention : le bundle dépasse 700 Ko.'); process.exitCode = 1; }
}
