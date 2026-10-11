<?php
// Recevoir de la marchandise (gestionnaire+) : 1) emplacement (et fournisseur), 2) pièces au scanner, 3) bouton « Recevoir ».
// Facture du fournisseur, mise à jour des prix, date et note sont cachées derrière « Plus d'options ».
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/mouvements.js');
$pre = Mouvements::prefill();
$fournisseurs = $pdo->query('SELECT id, nom FROM fournisseurs WHERE actif = 1 ORDER BY nom')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" <?php echo Mouvements::attributsSaisie('reception', $pre); ?>>
  <?php page_titre('Recevoir'); ?>
  <section class="content"><div class="container-fluid">
    <?php Mouvements::zonesMessages($pre); ?>
    <div class="card mv-carte"><div class="card-body">

      <div class="row">
        <div class="col-md-6 form-group">
          <label for="emplacement">Emplacement <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-md-6 form-group">
          <label for="fournisseur">Fournisseur</label>
          <select id="fournisseur" class="form-control">
            <option value="">— Aucun —</option>
            <?php foreach ($fournisseurs as $f) { ?><option value="<?php echo (int) $f['id']; ?>"><?php echo e($f['nom']); ?></option><?php } ?>
          </select>
        </div>
      </div>

      <?php Mouvements::blocLignes(); ?>

      <div class="mv-total-estime" id="mv-total" aria-live="polite"></div>

      <?php Mouvements::debutOptions(); ?>
        <div class="col-md-6 form-group">
          <label for="reference">N° de facture du fournisseur</label>
          <input id="reference" type="text" class="form-control" maxlength="100" autocomplete="off">
        </div>
        <?php Mouvements::champDate('col-md-6'); ?>
        <div class="col-12 mv-maj-prix" id="maj-prix-ligne" hidden>
          <label class="mv-check" for="maj-prix"><input type="checkbox" id="maj-prix" disabled> <span>Mettre à jour les prix du fournisseur</span></label>
        </div>
      <?php Mouvements::finOptions(); ?>

      <?php Mouvements::blocFin('Recevoir'); ?>
    </div></div>
  </div></section>
</div>
