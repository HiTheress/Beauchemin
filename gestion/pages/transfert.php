<?php
// Transfert entre deux emplacements d'une même entreprise (employé+) : entrepôt vers cube de service, etc.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill();
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('transfert', $pre); ?>>
  <?php page_titre('Transfert entre emplacements', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-lg-4 col-md-5 form-group">
          <label for="emplacement">De (source) <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-lg-4 col-md-5 form-group">
          <label for="destination">Vers (destination) <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="destination" class="form-control" disabled><option value="">Choisissez d'abord la source</option></select>
          <small class="form-text text-muted">Même entreprise que la source. Pour passer à l'autre entreprise, utilisez une facture interne.</small>
        </div>
        <div class="col-lg-2 col-md-2 form-group">
          <label for="date">Date <span class="text-danger" aria-hidden="true">*</span></label>
          <input id="date" type="date" class="form-control" value="<?php echo e(Mouvements::aujourdhui()); ?>" max="<?php echo e(Mouvements::aujourdhui()); ?>">
        </div>
      </div>
      <p class="text-muted small mv-aide-scan"><i class="fas fa-info-circle mr-1" aria-hidden="true"></i> Au scanner : un premier code d'emplacement (EMP-…) choisit la source, le suivant la destination.</p>

      <?php Mouvements::blocLignes('La colonne « Disponible » indique le stock à la source ; une quantité plus grande est refusée à l\'enregistrement.'); ?>

      <?php Mouvements::blocFin('Enregistrer le transfert'); ?>
    </div></div>
  </div></section>
</div>
