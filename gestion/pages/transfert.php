<?php
// Déplacer des pièces entre deux emplacements d'une même entreprise (employé+) : 1) de → vers, 2) pièces au scanner, 3) bouton « Déplacer ».
// Date et note sont cachées derrière « Plus d'options ».
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill(true);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('transfert', $pre); ?>>
  <?php page_titre('Déplacer'); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="mv-de-vers">
        <div class="form-group">
          <label for="emplacement">De <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="mv-fleche" aria-hidden="true"><i class="fas fa-arrow-right"></i></div>
        <div class="form-group">
          <label for="destination">Vers <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="destination" class="form-control" required aria-required="true" disabled><option value="">— Choisissez —</option></select>
        </div>
      </div>

      <?php Mouvements::blocLignes(); ?>

      <?php Mouvements::debutOptions(); ?>
        <?php Mouvements::champDate('col-md-4'); ?>
      <?php Mouvements::finOptions(); ?>

      <?php Mouvements::blocFin('Déplacer'); ?>
    </div></div>
  </div></section>
</div>
