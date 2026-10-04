<?php page_script('assets/js/saisie-lignes.js'); page_script('assets/js/_essai_lignes.js'); ?>
<div class="content-wrapper"><?php page_titre('Essai composant'); ?>
<section class="content"><div class="container-fluid"><div class="card"><div class="card-body">
  <div class="form-group"><select id="src" class="form-control"><option value="1">Entrepôt principal</option><option value="3">Cube 12</option></select></div>
  <div class="scan-box mb-2"><input id="scan" class="form-control scan-input" autocomplete="off" placeholder="Scannez…"></div>
  <select id="rech"></select>
  <div id="lignes" class="mt-3"></div>
  <pre id="sortie"></pre>
</div></div></div></section></div>
