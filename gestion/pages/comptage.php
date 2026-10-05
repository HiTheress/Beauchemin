<?php
// Comptages d'inventaire (employé+) : liste (en cours / appliqués / annulés) des entreprises de l'utilisateur et création d'un comptage
// (emplacement choisi dans la liste ou scanné : EMP-…). Le comptage lui-même se fait dans « comptage_voir ».
if (!acces_page('employe')) { return; }
page_script('assets/js/scan.js');
page_script('assets/js/comptage.js');
$mes_ent = inventaire()->listeEntreprises(utilisateur_id());
$pre_ent = entreprise_courante();
$statuts = array('' => 'Tous les statuts', 'en_cours' => 'En cours', 'applique' => 'Appliqués', 'annule' => 'Annulés');
$pre_statut = (isset($_GET['statut']) && is_string($_GET['statut']) && isset($statuts[$_GET['statut']])) ? $_GET['statut'] : '';
?>
<link rel="stylesheet" href="assets/css/scan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/scan.css'); ?>">
<div class="content-wrapper" id="page-comptage" data-entreprise="<?php echo (int) $pre_ent; ?>">
  <?php page_titre('Comptage d\'inventaire', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">

    <div class="card cp-carte"><div class="card-header"><h2 class="card-title m-0">Nouveau comptage</h2></div><div class="card-body">
      <label for="scan" class="sc-label">Scannez le code-barres de l'emplacement à compter (EMP-…)</label>
      <div class="scan-box">
        <input id="scan" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="none" maxlength="64" placeholder="Scannez l'emplacement, puis Entrée…">
      </div>
      <div class="row mt-3">
        <div class="col-lg-5 col-md-6 form-group">
          <label for="nouveau-emp">… ou choisissez-le dans la liste</label>
          <select id="nouveau-emp" class="form-control" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-lg-4 col-md-6 form-group">
          <label for="nouveau-note">Note (facultatif)</label>
          <input id="nouveau-note" type="text" class="form-control" maxlength="255" autocomplete="off" placeholder="Ex. : inventaire de fin de mois">
        </div>
        <div class="col-lg-3 col-md-12 form-group d-flex align-items-end">
          <button type="button" id="btn-nouveau" class="btn btn-primary btn-block"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouveau comptage</button>
        </div>
      </div>
      <div id="cp-nouveau-msg" aria-live="polite"></div>
    </div></div>

    <div class="card cp-carte"><div class="card-header"><h2 class="card-title m-0">Comptages</h2></div><div class="card-body">
      <div class="row cp-liste-filtres">
        <div class="col-lg-4 col-md-6 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <?php foreach ($statuts as $cle => $lib) { ?><option value="<?php echo e($cle); ?>"<?php echo $pre_statut === $cle ? ' selected' : ''; ?>><?php echo e($lib); ?></option><?php } ?>
          </select>
        </div>
        <?php if (count($mes_ent) > 0) { ?>
        <div class="col-lg-5 col-md-6 form-group">
          <label for="f-entreprise">Entreprise</label>
          <select id="f-entreprise" class="form-control">
            <option value="">Toutes mes entreprises</option>
            <?php foreach ($mes_ent as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $pre_ent === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php } ?>
        <div class="col-lg-3 col-md-12 form-group d-flex align-items-end">
          <div class="custom-control custom-checkbox">
            <input type="checkbox" class="custom-control-input" id="f-mes">
            <label class="custom-control-label" for="f-mes">Seulement mes comptages</label>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-comptages" class="table table-striped w-100 cp-liste">
          <thead><tr>
            <th scope="col">Numéro</th>
            <th scope="col">Emplacement</th>
            <th scope="col">Statut</th>
            <th scope="col">Commencé le</th>
            <th scope="col" class="nombre">Pièces</th>
            <th scope="col">Ajustement</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>

  </div></section>
</div>
