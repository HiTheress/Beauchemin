<?php
// Page d'essai du composant de saisie : disponible SEULEMENT sur les serveurs de test (tools/serveur.sh définit BEA_ENV=test).
// Deux modes : par défaut, la recherche select2 d'origine (utilisée par la facture interne) ; &mode=fusion : un seul champ qui
// scanne ET cherche, avec boutons − / + (utilisé par les écrans de mouvements).
if (getenv('BEA_ENV') !== 'test') { include __DIR__ . '/error_page.php'; return; }
?>
<?php page_script('assets/js/saisie-lignes.js'); page_script('assets/js/_essai_lignes.js'); ?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper"><?php page_titre('Essai composant'); ?>
<section class="content"><div class="container-fluid"><div class="card mv-carte"><div class="card-body">
  <div class="form-group"><select id="src" class="form-control"><option value="1">Entrepôt principal</option><option value="3">Cube 12</option></select></div>
  <div class="scan-box mv-scan mb-2"><input id="scan" class="form-control scan-input" autocomplete="off" inputmode="none" placeholder="Scannez…"></div>
  <select id="rech"></select>
  <div id="lignes" class="mt-3 mv-lignes"></div>
  <pre id="sortie"></pre>
</div></div></div></section></div>
