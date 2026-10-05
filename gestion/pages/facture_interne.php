<?php
// Facture interne AU COÛT entre deux entreprises (gestionnaire+) : les pièces sortent d'un emplacement de l'entreprise émettrice
// et entrent dans un emplacement de l'autre entreprise, au coût moyen de l'émettrice (aucune marge).
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/saisie-lignes.js');
page_script('assets/js/interentreprise.js');
$pre = Interentreprise::prefill();
$aujourdhui = Interentreprise::aujourdhui();
?>
<link rel="stylesheet" href="assets/css/interentreprise.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css'); ?>">
<div class="content-wrapper" data-ie="facture_interne" data-titre="Facture interne — Beauchemin" data-aujourdhui="<?php echo e($aujourdhui); ?>"
     data-piece-code="<?php echo e($pre['piece_code']); ?>" data-emplacement-id="<?php echo e($pre['emplacement_id']); ?>">
  <?php page_titre('Facture interne', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <div id="ie-succes" class="alert alert-success ie-succes" role="status" aria-live="polite" hidden></div>
    <?php if ($pre['piece_avert'] !== '') { ?><div class="alert alert-warning" role="alert"><?php echo e($pre['piece_avert']); ?></div><?php } ?>

    <div class="card ie-carte"><div class="card-body">
      <p class="text-muted mb-2">Les pièces sont facturées <strong>au coût moyen de l'entreprise émettrice</strong>, sans marge. Elles sortent de l'emplacement source et entrent dans l'emplacement de destination de l'autre entreprise.</p>
      <p class="text-muted small mb-3">Les champs marqués d'un <span aria-hidden="true">*</span><span class="sr-only">astérisque</span> sont obligatoires.</p>

      <div class="row ie-entete-form">
        <div class="col-md-7 form-group">
          <label for="emplacement">Emplacement source <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="emplacement" class="form-control" required aria-required="true" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-md-5 form-group">
          <label for="entreprise-dest">Entreprise destinataire <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="entreprise-dest" class="form-control" required aria-required="true" disabled><option value="">Choisissez d'abord la source</option></select>
        </div>
        <div class="col-md-7 form-group">
          <label for="destination">Emplacement de destination <span class="text-danger" aria-hidden="true">*</span></label>
          <select id="destination" class="form-control" required aria-required="true" disabled><option value="">Choisissez d'abord l'entreprise</option></select>
        </div>
        <div class="col-md-5 col-xl-3 form-group">
          <label for="date">Date <span class="text-danger" aria-hidden="true">*</span></label>
          <input id="date" type="date" class="form-control" required aria-required="true" value="<?php echo e($aujourdhui); ?>" min="2000-01-01" max="<?php echo e($aujourdhui); ?>">
        </div>
      </div>
      <p class="text-muted small ie-aide-scan"><i class="fas fa-info-circle mr-1" aria-hidden="true"></i> Au scanner : un code d'emplacement (EMP-…) choisit la source, puis un code d'emplacement de l'entreprise destinataire choisit la destination.</p>

      <div class="scan-box ie-scan">
        <label for="scan" class="ie-scan-label"><i class="fas fa-barcode mr-1" aria-hidden="true"></i> Scannez une pièce (ou un emplacement), puis Entrée</label>
        <input id="scan" class="form-control scan-input" autocomplete="off" inputmode="none" maxlength="64" placeholder="Code-barres de la pièce…">
      </div>
      <div class="form-group mt-3 mb-2">
        <label for="recherche">Ou cherchez une pièce par son nom ou son code</label>
        <select id="recherche" class="form-control"></select>
      </div>
      <p id="ie-recap" class="ie-recap" aria-live="polite" hidden></p>
      <div id="lignes" class="ie-lignes table-responsive"></div>
      <p class="text-muted small mt-2 mb-0">La colonne «&nbsp;Disponible&nbsp;» indique le stock à la source ; le coût unitaire et le total sont calculés automatiquement au coût moyen de l'entreprise émettrice (non modifiables).</p>

      <div id="ie-avert" class="alert alert-warning mt-3 mb-2" role="alert" hidden></div>
      <div id="ie-zero-bloc" class="custom-control custom-checkbox mb-2" hidden>
        <input type="checkbox" class="custom-control-input" id="cout-zero">
        <label class="custom-control-label" for="cout-zero">Facturer les pièces sans coût à 0&nbsp;$</label>
      </div>
      <p class="ie-total-general" id="ie-total" aria-live="polite"></p>

      <div class="form-group mt-3">
        <label for="note">Note (facultative)</label>
        <textarea id="note" class="form-control" rows="2" maxlength="2000" placeholder="Une précision utile pour la suite…"></textarea>
      </div>
      <div id="ie-erreur" class="alert alert-danger ie-erreur" role="alert" hidden></div>
      <div class="ie-actions">
        <button type="button" id="btn-enregistrer" class="btn btn-primary btn-lg"><i class="fas fa-check mr-1" aria-hidden="true"></i> <span>Enregistrer la facture interne</span></button>
        <span id="ie-resume" class="text-muted ml-3"></span>
      </div>
    </div></div>
  </div></section>
</div>
