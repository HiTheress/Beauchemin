<?php
// Réception de marchandise d'un fournisseur (gestionnaire+) : pièces entrées avec leur coût unitaire.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill();
$fournisseurs = $pdo->query('SELECT id, nom FROM fournisseurs WHERE actif = 1 ORDER BY nom')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('reception', $pre); ?>>
  <?php page_titre('Réception de marchandise', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-lg-4 col-md-6 form-group">
          <label for="emplacement">Emplacement de réception <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" disabled><option value="">Chargement…</option></select>
          <small class="form-text text-muted">Ou scannez son code-barres (EMP-…).</small>
        </div>
        <div class="col-lg-2 col-md-6 form-group">
          <label for="date">Date de réception <span class="text-danger" aria-hidden="true">*</span></label>
          <input id="date" type="date" class="form-control" value="<?php echo e(Mouvements::aujourdhui()); ?>" max="<?php echo e(Mouvements::aujourdhui()); ?>">
        </div>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="fournisseur">Fournisseur</label>
          <select id="fournisseur" class="form-control">
            <option value="">— Aucun —</option>
            <?php foreach ($fournisseurs as $f) { ?><option value="<?php echo (int) $f['id']; ?>"><?php echo e($f['nom']); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="reference">N° de facture du fournisseur</label>
          <input id="reference" type="text" class="form-control" maxlength="100" autocomplete="off">
        </div>
      </div>

      <div class="mb-3 mv-maj-prix">
        <label class="mv-check" for="maj-prix"><input type="checkbox" id="maj-prix" disabled> <span>Mettre à jour les prix de ce fournisseur avec les coûts saisis</span></label>
        <small class="form-text text-muted" id="maj-prix-aide">Choisissez d'abord un fournisseur.</small>
      </div>

      <?php Mouvements::blocLignes('Le coût unitaire est proposé d\'après le prix de ce fournisseur, sinon le coût moyen de l\'entreprise. Vous pouvez le modifier ; il est obligatoire pour chaque ligne.'); ?>

      <div class="mv-total-estime" id="mv-total" aria-live="polite"></div>

      <?php Mouvements::blocFin('Enregistrer la réception'); ?>
    </div></div>
  </div></section>
</div>
