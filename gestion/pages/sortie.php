<?php
// Utiliser des pièces (employé+) : service, installation, perte ou retour au fournisseur.
// 1) emplacement et motif, 2) pièces au scanner, 3) bouton « Utiliser ». Bon de travail, date et note : « Plus d'options ».
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill(true);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('sortie', $pre); ?>>
  <?php page_titre('Utiliser'); ?>
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
            <?php foreach (Inventaire::MOTIFS_SORTIE as $cle => $libelle) { ?><option value="<?php echo e($cle); ?>"><?php echo e($libelle); ?></option><?php } ?>
          </select>
        </div>
      </div>

      <?php Mouvements::blocLignes(); ?>

      <?php Mouvements::debutOptions(); ?>
        <div class="col-md-6 form-group">
          <label for="reference">N° de bon de travail</label>
          <input id="reference" type="text" class="form-control" maxlength="100" autocomplete="off">
        </div>
        <?php Mouvements::champDate('col-md-6'); ?>
      <?php Mouvements::finOptions(); ?>

      <?php Mouvements::blocFin('Utiliser'); ?>
    </div></div>
  </div></section>
</div>
