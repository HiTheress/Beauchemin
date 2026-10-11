<?php
// Journal : qui a fait quoi, quand. Tableau serveur avec filtres, détails lisibles, export CSV. Administrateur seulement.
if (!acces_page('admin')) { return; }
require_once __DIR__ . '/../app/ajax/journal_lib.php';
page_script('assets/js/admin.js');
$users = $pdo->query('SELECT id, nom_utilisateur, nom_complet FROM utilisateurs ORDER BY nom_utilisateur')->fetchAll();
$actions = array();
foreach ($pdo->query('SELECT DISTINCT action FROM journal ORDER BY action')->fetchAll(PDO::FETCH_COLUMN) as $a) {
  $actions[$a] = JournalFr::action($a);
}
asort($actions, SORT_NATURAL | SORT_FLAG_CASE);
$entites = array();
foreach ($pdo->query("SELECT DISTINCT entite FROM journal WHERE entite IS NOT NULL AND entite <> '' ORDER BY entite")->fetchAll(PDO::FETCH_COLUMN) as $en) {
  $entites[$en] = JournalFr::entite($en);
}
asort($entites, SORT_NATURAL | SORT_FLAG_CASE);
$aujourdhui = date('Y-m-d');
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="journal" data-aujourdhui="<?php echo e($aujourdhui); ?>">
  <?php page_titre('Journal', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <?php Admin::enteteImpression('Journal'); ?>
    <div class="card"><div class="card-body">
      <div class="row adm-filtres">
        <div class="col-md-6 col-lg-3 form-group">
          <label for="f-utilisateur">Utilisateur</label>
          <select id="f-utilisateur" class="form-control">
            <option value="">Tous</option>
            <option value="aucun">Aucun (système ou inconnu)</option>
            <?php foreach ($users as $u) { ?>
              <option value="<?php echo (int) $u['id']; ?>"><?php echo e($u['nom_utilisateur']); ?><?php echo $u['nom_complet'] !== '' ? ' — ' . e($u['nom_complet']) : ''; ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-md-6 col-lg-3 form-group">
          <label for="f-action">Action</label>
          <select id="f-action" class="form-control">
            <option value="">Toutes</option>
            <?php foreach ($actions as $code => $lib) { ?>
              <option value="<?php echo e($code); ?>"><?php echo e($lib); ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-6 col-lg-3 form-group">
          <label for="f-du">Du</label>
          <input id="f-du" type="date" class="form-control" max="<?php echo e($aujourdhui); ?>">
        </div>
        <div class="col-6 col-lg-3 form-group">
          <label for="f-au">Au</label>
          <input id="f-au" type="date" class="form-control" max="<?php echo e($aujourdhui); ?>">
        </div>
      </div>
      <div class="row adm-filtres align-items-center">
        <div class="col-md-6 col-lg-4 form-group">
          <label for="f-recherche" class="sr-only">Rechercher</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-search" aria-hidden="true"></i></span></div>
            <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Rechercher">
          </div>
        </div>
        <div class="col-md-6 col-lg-8 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-link" id="btn-plus-filtres" aria-expanded="false" aria-controls="journal-plus">Plus de filtres</button>
          <button type="button" class="btn btn-link" id="btn-reinitialiser">Effacer les filtres</button>
          <button type="button" class="btn btn-outline-secondary" id="btn-exporter"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter en CSV</button>
        </div>
      </div>
      <div class="row adm-filtres" id="journal-plus" hidden>
        <div class="col-md-6 col-lg-3 form-group">
          <label for="f-entite">Objet concerné</label>
          <select id="f-entite" class="form-control">
            <option value="">Tous</option>
            <?php foreach ($entites as $code => $lib) { ?>
              <option value="<?php echo e($code); ?>"><?php echo e($lib); ?></option>
            <?php } ?>
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-journal" class="table table-striped table-sm adm-table w-100">
          <thead><tr>
            <th scope="col">Date et heure</th><th scope="col">Utilisateur</th><th scope="col">Action</th><th scope="col">Objet concerné</th>
            <th scope="col">Détails</th><th scope="col">Adresse IP</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>
</div>
