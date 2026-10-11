<?php
// Corriger le stock (gestionnaire+) : quantités signées (+ ajoute, − retire).
// 1) emplacement et motif, 2) pièces au scanner, 3) bouton « Corriger ». Date et note : « Plus d'options ».
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill(true);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('ajustement', $pre); ?>>
  <?php page_titre('Corriger le stock'); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-md-6 form-group">
          <label for="emplacement">Emplacement <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-md-6 form-group">
          <label for="motif">Motif <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="motif" class="form-control" required aria-required="true">
            <option value="">— Choisissez —</option>
            <?php foreach (Inventaire::MOTIFS_AJUSTEMENT as $cle => $libelle) { ?><option value="<?php echo e($cle); ?>"><?php echo e($libelle); ?></option><?php } ?>
          </select>
        </div>
      </div>

      <?php Mouvements::blocLignes(); ?>

      <?php Mouvements::debutOptions(); ?>
        <?php Mouvements::champDate('col-md-4'); ?>
      <?php Mouvements::finOptions(); ?>

      <?php Mouvements::blocFin('Corriger'); ?>
    </div></div>
  </div></section>
</div>
