<?php
// Liste des factures internes dont une entreprise de l'utilisateur est émettrice ou destinataire (gestionnaire+).
// Filtres : mois / année, sens (émises / reçues), statut, recherche. Préremplis par l'URL : annee, mois, sens, statut, q.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/interentreprise.js');

$get = function ($cle) { return (isset($_GET[$cle]) && is_string($_GET[$cle])) ? trim($_GET[$cle]) : ''; };
$annee_courante = (int) date('Y');
// Année : celle de l'URL si elle est donnée (même vide = « toutes »), sinon l'année en cours
$pre_annee = array_key_exists('annee', $_GET) ? (preg_match('/^\d{4}$/', $get('annee')) ? (int) $get('annee') : 0) : $annee_courante;
$pre_mois = (ctype_digit($get('mois')) && (int) $get('mois') >= 1 && (int) $get('mois') <= 12) ? (int) $get('mois') : 0;
$pre_sens = in_array($get('sens'), array('emises', 'recues'), true) ? $get('sens') : '';
$pre_statut = in_array($get('statut'), array('valide', 'annule'), true) ? $get('statut') : '';
$pre_q = mb_substr($get('q'), 0, 100);

// Années proposées : de la plus ancienne facture de mes entreprises à l'année en cours
$acc = array_map('intval', $Ouser->entreprisesAutorisees());
$liste = $acc ? implode(',', $acc) : '0';      // entiers issus des droits de l'utilisateur
$premiere = (int) $pdo->query("SELECT COALESCE(MIN(YEAR(date_document)), " . $annee_courante . ") FROM documents WHERE type = 'facture_interne' AND (entreprise_id IN ($liste) OR entreprise_dest_id IN ($liste))")->fetchColumn();
$annees = array();
for ($a = $annee_courante; $a >= min($premiere, $annee_courante); $a--) { $annees[] = $a; }
if ($pre_annee && !in_array($pre_annee, $annees, true)) { $annees[] = $pre_annee; rsort($annees); }
?>
<link rel="stylesheet" href="assets/css/interentreprise.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css'); ?>">
<div class="content-wrapper" data-ie="factures_internes">
  <?php page_titre('Factures internes', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card ie-carte"><div class="card-body">

      <div class="row ie-filtres">
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-recherche">Rechercher</label>
          <input id="f-recherche" type="search" class="form-control" autocomplete="off" maxlength="100" placeholder="Numéro, note, emplacement…" value="<?php echo e($pre_q); ?>">
        </div>
        <div class="col-lg-2 col-md-3 col-6 form-group">
          <label for="f-annee">Année</label>
          <select id="f-annee" class="form-control">
            <option value="">Toutes</option>
            <?php foreach ($annees as $a) { ?><option value="<?php echo (int) $a; ?>"<?php echo $pre_annee === $a ? ' selected' : ''; ?>><?php echo (int) $a; ?></option><?php } ?>
          </select>
        </div>
        <div class="col-lg-2 col-md-3 col-6 form-group">
          <label for="f-mois">Mois</label>
          <select id="f-mois" class="form-control">
            <option value="">Tous</option>
            <?php foreach (MOIS_FR as $n => $lib) { ?><option value="<?php echo (int) $n; ?>"<?php echo $pre_mois === $n ? ' selected' : ''; ?>><?php echo e(mb_strtoupper(mb_substr($lib, 0, 1)) . mb_substr($lib, 1)); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-sens">Sens</label>
          <select id="f-sens" class="form-control">
            <option value="">Émises et reçues</option>
            <option value="emises"<?php echo $pre_sens === 'emises' ? ' selected' : ''; ?>>Émises par mon entreprise</option>
            <option value="recues"<?php echo $pre_sens === 'recues' ? ' selected' : ''; ?>>Reçues par mon entreprise</option>
          </select>
        </div>
        <div class="col-lg-2 col-md-6 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="">Tous</option>
            <option value="valide"<?php echo $pre_statut === 'valide' ? ' selected' : ''; ?>>Valides</option>
            <option value="annule"<?php echo $pre_statut === 'annule' ? ' selected' : ''; ?>>Annulées</option>
          </select>
        </div>
      </div>
      <div class="mb-3 no-print">
        <button type="button" id="f-effacer" class="btn btn-outline-secondary"><i class="fas fa-eraser mr-1" aria-hidden="true"></i> Effacer les filtres</button>
        <a href="index.php?page=facture_interne" class="btn btn-primary ml-1"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvelle facture interne</a>
      </div>

      <div class="table-responsive">
        <table id="table-factures" class="table table-striped ie-table w-100">
          <thead><tr>
            <th scope="col">Numéro</th>
            <th scope="col">Date</th>
            <th scope="col">De → vers</th>
            <th scope="col">Emplacements</th>
            <th scope="col" class="nombre">Total</th>
            <th scope="col">Statut</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>

      <div id="ie-totaux" class="ie-totaux" aria-live="polite">Calcul des totaux…</div>
      <p class="text-muted small mt-2 mb-0">Seules les factures de vos entreprises sont listées. Les montants sont facturés au coût : aucune marge. Cliquez sur un numéro pour voir la facture, l'imprimer ou, au besoin, l'annuler.</p>
    </div></div>
  </div></section>
</div>
