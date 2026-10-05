<?php
// Ajustement manuel d'un solde (gestionnaire+) : quantités signées (+ ajoute, − retire).
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill(true);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('ajustement', $pre); ?>>
  <?php page_titre('Ajustement de stock', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="alert alert-info mv-info" role="note">
      <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
      Un ajustement corrige un solde sans fournisseur ni client. Entrez une quantité <strong>positive</strong> pour ajouter des pièces
      et une quantité <strong>négative</strong> (par exemple <span class="code">-2</span>, ou le bouton <strong>+/−</strong> de la ligne) pour en retirer. Pour compter un emplacement au complet, utilisez plutôt le <a class="alert-link" href="index.php?page=comptage">comptage</a>.
    </div>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-xl-5 col-md-6 form-group">
          <label for="emplacement">Emplacement <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
          <small class="form-text text-muted">Ou scannez son code-barres (EMP-…).</small>
        </div>
        <div class="col-xl-4 col-md-6 form-group">
          <label for="motif">Motif <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="motif" class="form-control" required aria-required="true">
            <option value="">— Choisissez —</option>
            <?php foreach (Inventaire::MOTIFS_AJUSTEMENT as $cle => $libelle) { ?><option value="<?php echo e($cle); ?>"><?php echo e($libelle); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-xl-3 col-md-6 form-group">
          <label for="date">Date <span class="text-danger" aria-hidden="true">*</span></label>
          <input id="date" type="date" class="form-control" required aria-required="true" value="<?php echo e(Mouvements::aujourdhui()); ?>" max="<?php echo e(Mouvements::aujourdhui()); ?>">
        </div>
      </div>

      <?php Mouvements::blocLignes('La colonne « Stock actuel » montre le solde avant la correction. Le coût unitaire est facultatif et ne sert que pour les quantités positives ; sans coût, la pièce entre au coût moyen actuel.'); ?>

      <?php Mouvements::blocFin('Enregistrer l\'ajustement'); ?>
    </div></div>
  </div></section>
</div>
