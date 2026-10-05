<?php
// Sortie de stock (employé+) : pièces utilisées pour un service ou une installation, perdues, ou retournées au fournisseur.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill(true);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('sortie', $pre); ?>>
  <?php page_titre('Sortie de pièces (utilisation)', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-xl-5 col-md-6 form-group">
          <label for="emplacement">Emplacement (d'où sortent les pièces) <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
          <small class="form-text text-muted">Ou scannez son code-barres (EMP-…).</small>
        </div>
        <div class="col-xl-4 col-md-6 form-group">
          <label for="motif">Motif <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="motif" class="form-control" required aria-required="true">
            <option value="">— Choisissez —</option>
            <?php foreach (Inventaire::MOTIFS_SORTIE as $cle => $libelle) { ?><option value="<?php echo e($cle); ?>"><?php echo e($libelle); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-xl-5 col-md-6 form-group">
          <label for="reference">N° de bon de travail</label>
          <input id="reference" type="text" class="form-control" maxlength="100" autocomplete="off">
        </div>
        <div class="col-xl-3 col-md-6 form-group">
          <label for="date">Date <span class="text-danger" aria-hidden="true">*</span></label>
          <input id="date" type="date" class="form-control" required aria-required="true" value="<?php echo e(Mouvements::aujourdhui()); ?>" max="<?php echo e(Mouvements::aujourdhui()); ?>">
        </div>
      </div>

      <?php Mouvements::blocLignes('La colonne « Disponible » indique le stock à cet emplacement ; une quantité plus grande est refusée à l\'enregistrement.'); ?>

      <?php Mouvements::blocFin('Enregistrer la sortie'); ?>
    </div></div>
  </div></section>
</div>
