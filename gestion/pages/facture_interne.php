<?php
// Facture interne AU COÛT entre deux entreprises (gestionnaire+) : les pièces sortent d'un emplacement de l'entreprise émettrice
// et entrent dans un emplacement de l'autre entreprise, au coût moyen de l'émettrice (aucune marge).
// Écran : choix « qui facture à qui » (grosses cartes), emplacements, pièces (scan ou recherche), bouton « Facturer ».
// La date et la note sont cachées derrière « Plus d'options ».
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/interentreprise.js');
$pre = Interentreprise::prefill();
$aujourdhui = Interentreprise::aujourdhui();
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<link rel="stylesheet" href="assets/css/interentreprise.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css'); ?>">
<div class="content-wrapper" data-ie="facture_interne" data-titre="Nouvelle facture — Beauchemin" data-aujourdhui="<?php echo e($aujourdhui); ?>"
     data-piece-code="<?php echo e($pre['piece_code']); ?>" data-emplacement-id="<?php echo e($pre['emplacement_id']); ?>">
  <?php page_titre('Nouvelle facture', array('Facturation')); ?>
  <section class="content"><div class="container-fluid">
    <div id="ie-succes" class="alert alert-success ie-succes" role="status" aria-live="polite" hidden></div>
    <?php if ($pre['piece_avert'] !== '') { ?><div class="alert alert-warning" role="alert"><?php echo e($pre['piece_avert']); ?></div><?php } ?>

    <div class="card ie-carte mv-carte"><div class="card-body">
      <fieldset class="ie-trajet form-group" id="ie-trajet">
        <legend class="ie-legende">Qui facture à qui ?</legend>
        <div id="ie-trajet-choix" class="ie-trajet-choix" role="radiogroup" aria-label="Qui facture à qui ?" aria-required="true"><span class="text-muted">Chargement…</span></div>
      </fieldset>

      <div class="mv-de-vers ie-entete-form">
        <div class="form-group">
          <label for="emplacement">Prendre dans</label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">—</option></select>
        </div>
        <div class="mv-fleche" aria-hidden="true"><i class="fas fa-arrow-right"></i></div>
        <div class="form-group">
          <label for="destination">Mettre dans</label>
          <select id="destination" class="form-control" required aria-required="true" disabled><option value="">—</option></select>
        </div>
      </div>

      <div class="form-group mv-piece mb-2">
        <label for="scan">Pièce</label>
        <div class="scan-box ie-scan mv-scan">
          <i class="fas fa-barcode mv-scan-icone" aria-hidden="true"></i>
          <input id="scan" class="form-control scan-input" autocomplete="off" inputmode="none" maxlength="64" placeholder="Scannez ou cherchez…">
        </div>
      </div>
      <div id="lignes" class="ie-lignes mv-lignes table-responsive"></div>

      <div id="ie-avert" class="alert alert-warning mt-3 mb-2" role="alert" hidden></div>
      <div id="ie-zero-bloc" class="custom-control custom-checkbox mb-2" hidden>
        <input type="checkbox" class="custom-control-input" id="cout-zero">
        <label class="custom-control-label" for="cout-zero">Facturer les pièces sans coût à 0&nbsp;$</label>
      </div>

      <div class="mv-plus">
        <button type="button" id="ie-plus" class="btn btn-link mv-plus-btn" aria-expanded="false" aria-controls="ie-options"><i class="fas fa-chevron-right mv-plus-icone" aria-hidden="true"></i> Plus d'options</button>
      </div>
      <div id="ie-options" class="mv-options" hidden>
        <div class="row">
          <div class="col-md-4 form-group">
            <label for="date">Date</label>
            <input id="date" type="date" class="form-control" required aria-required="true" value="<?php echo e($aujourdhui); ?>" min="2000-01-01" max="<?php echo e($aujourdhui); ?>">
          </div>
          <div class="col-md-8 form-group">
            <label for="note">Note</label>
            <textarea id="note" class="form-control" rows="2" maxlength="2000"></textarea>
          </div>
        </div>
      </div>

      <div id="ie-erreur" class="alert alert-danger ie-erreur" role="alert" hidden></div>
      <div class="ie-actions">
        <p class="ie-total-general" id="ie-total" aria-live="polite"></p>
        <button type="button" id="btn-enregistrer" class="btn btn-primary btn-lg"><i class="fas fa-check mr-1" aria-hidden="true"></i> <span>Facturer</span></button>
      </div>
    </div></div>
  </div></section>
</div>
