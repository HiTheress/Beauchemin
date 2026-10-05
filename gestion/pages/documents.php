<?php
// Liste des documents (réceptions, transferts, sorties, ajustements, factures internes) — tableau serveur.
// Employé+. Un employé ne voit aucun montant : la colonne « Total » n'existe pas pour lui.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/mouvements.js');
$couts = $Ouser->peutVoirCouts();
$mes_ent = inventaire()->listeEntreprises(utilisateur_id());

$get = function ($cle) { return (isset($_GET[$cle]) && is_string($_GET[$cle])) ? trim($_GET[$cle]) : ''; };
$date_ok = function ($s) { return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]); };
$pre_type = isset(TYPES_DOCUMENT_FR[$get('type')]) ? $get('type') : '';
$pre_statut = in_array($get('statut'), array('valide', 'annule'), true) ? $get('statut') : '';
$pre_ent = ctype_digit($get('entreprise_id')) && $get('entreprise_id') !== '' ? (int) $get('entreprise_id') : entreprise_courante();
$pre_du = $date_ok($get('du')) ? $get('du') : '';
$pre_au = $date_ok($get('au')) ? $get('au') : '';
$pre_q = mb_substr($get('q'), 0, 100);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" data-mouvement="documents">
  <?php page_titre('Documents', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card mv-carte"><div class="card-body">

      <div class="row mv-filtres">
        <div class="col-lg-4 col-md-6 form-group">
          <label for="f-recherche">Rechercher</label>
          <input id="f-recherche" type="search" class="form-control" autocomplete="off" maxlength="100" placeholder="Numéro, référence, fournisseur, note…" value="<?php echo e($pre_q); ?>">
        </div>
        <div class="col-lg-2 col-md-6 form-group">
          <label for="f-type">Type</label>
          <select id="f-type" class="form-control">
            <option value="">Tous les types</option>
            <?php foreach (TYPES_DOCUMENT_FR as $cle => $lib) { ?><option value="<?php echo e($cle); ?>"<?php echo $pre_type === $cle ? ' selected' : ''; ?>><?php echo e($lib); ?></option><?php } ?>
          </select>
        </div>
        <?php if (count($mes_ent) > 0) { ?>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-entreprise">Entreprise</label>
          <select id="f-entreprise" class="form-control">
            <option value="">Toutes mes entreprises</option>
            <?php foreach ($mes_ent as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $pre_ent === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php } ?>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="">Tous</option>
            <option value="valide"<?php echo $pre_statut === 'valide' ? ' selected' : ''; ?>>Valides</option>
            <option value="annule"<?php echo $pre_statut === 'annule' ? ' selected' : ''; ?>>Annulés</option>
          </select>
        </div>
      </div>
      <div class="row mv-filtres">
        <div class="col-lg-5 col-md-8 form-group">
          <span class="mv-label-plage" id="lbl-plage">Période</span>
          <div class="input-group" role="group" aria-labelledby="lbl-plage">
            <input id="f-du" type="date" class="form-control" aria-label="Du" value="<?php echo e($pre_du); ?>">
            <div class="input-group-prepend input-group-append"><span class="input-group-text">au</span></div>
            <input id="f-au" type="date" class="form-control" aria-label="Au" value="<?php echo e($pre_au); ?>">
          </div>
        </div>
        <div class="col-lg-3 col-md-4 form-group d-flex align-items-end no-print">
          <button type="button" id="f-effacer" class="btn btn-outline-secondary"><i class="fas fa-eraser mr-1" aria-hidden="true"></i> Effacer les filtres</button>
        </div>
      </div>

      <div class="table-responsive">
        <table id="table-documents" class="table table-striped mv-table w-100">
          <thead><tr>
            <th scope="col" data-col="numero">Numéro</th>
            <th scope="col" data-col="type">Type</th>
            <th scope="col" data-col="date">Date</th>
            <th scope="col" data-col="entreprise">Entreprise</th>
            <th scope="col" data-col="emplacements">Emplacement(s)</th>
            <th scope="col" data-col="utilisateur">Utilisateur</th>
            <?php if ($couts) { ?><th scope="col" data-col="total" class="nombre">Total</th><?php } ?>
            <th scope="col" data-col="statut">Statut</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Seuls les documents de vos entreprises sont listés. Cliquez sur un numéro pour voir le détail, l'imprimer ou, au besoin, l'annuler.</p>
    </div></div>
  </div></section>
</div>
