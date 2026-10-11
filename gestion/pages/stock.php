<?php
// Stock : ce que nous avons, et où. Recherche d'abord (elle prend aussi un code scanné), puis des filtres discrets. Tableau serveur (DataTables)
// par emplacement ou par pièce (totaux par entreprise). Employé+ ; la colonne « Valeur » n'existe que pour un gestionnaire+ (absente du HTML et du JSON pour un employé).
if (!acces_page('employe')) { return; }
page_script('assets/js/stock.js');
$couts = $Ouser->peutVoirCouts();
$mes_ent = inventaire()->listeEntreprises(utilisateur_id());
$ids_ent = array_map(function ($en) { return (int) $en['id']; }, $mes_ent);
$mes_emp = inventaire()->listeEmplacements(utilisateur_id(), true);
$cats = $pdo->query('SELECT id, nom FROM categories ORDER BY nom')->fetchAll();

// Préremplissage par l'URL (validé : jamais cru sur parole)
$get = function ($cle) { return (isset($_GET[$cle]) && is_string($_GET[$cle])) ? trim($_GET[$cle]) : ''; };
$defaut_ent = entreprise_courante();
// entreprise_id=0 : « toutes mes entreprises » choisi explicitement (la page écrit ses filtres dans l'adresse : le bouton Retour les retrouve)
$pre_ent = $get('entreprise_id') === '0' ? 0
    : ($get('entreprise_id') !== '' && ctype_digit($get('entreprise_id')) && in_array((int) $get('entreprise_id'), $ids_ent, true) ? (int) $get('entreprise_id') : $defaut_ent);
$ids_emp = array_map(function ($e2) { return (int) $e2['id']; }, $mes_emp);
$pre_emp = ($get('emplacement_id') !== '' && ctype_digit($get('emplacement_id')) && in_array((int) $get('emplacement_id'), $ids_emp, true)) ? (int) $get('emplacement_id') : 0;
if ($pre_emp) {   // l'entreprise de l'emplacement demandé l'emporte
    foreach ($mes_emp as $e2) { if ((int) $e2['id'] === $pre_emp) { $pre_ent = (int) $e2['entreprise_id']; } }
}
$pre_vue = $get('vue') === 'piece' ? 'piece' : 'emplacement';
$pre_cat = ($get('categorie_id') === 'aucune' || ($get('categorie_id') !== '' && ctype_digit($get('categorie_id')))) ? $get('categorie_id') : '';
$pre_q = mb_substr($get('q'), 0, 100);
$pre_zero = $get('zero') === '1';
?>
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" data-d2="stock" data-couts="<?php echo $couts ? '1' : '0'; ?>" data-multi="<?php echo count($mes_ent) > 1 ? '1' : '0'; ?>" data-defaut-entreprise="<?php echo (int) $defaut_ent; ?>" data-vue-initiale="<?php echo e($pre_vue); ?>">
  <?php page_titre('Stock'); ?>
  <section class="content"><div class="container-fluid">
    <div class="card sk-carte"><div class="card-body">

      <div class="row sk-filtres no-print">
        <div class="col-xl-5 col-12">
          <label for="f-recherche" class="sr-only">Rechercher ou scanner</label>
          <div class="sk-recherche form-group">
            <i class="fas fa-search" aria-hidden="true"></i>
            <input id="f-recherche" type="search" class="form-control scan-input" autocomplete="off" maxlength="100" placeholder="Rechercher ou scanner" value="<?php echo e($pre_q); ?>">
          </div>
        </div>
        <div class="col-xl-4 col-md-6 form-group">
          <div class="btn-group sk-vue" role="group" aria-label="Affichage">
            <button type="button" class="btn btn-outline-primary" data-vue="emplacement" aria-pressed="<?php echo $pre_vue === 'emplacement' ? 'true' : 'false'; ?>">Par emplacement</button>
            <button type="button" class="btn btn-outline-primary" data-vue="piece" aria-pressed="<?php echo $pre_vue === 'piece' ? 'true' : 'false'; ?>">Par pièce</button>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 form-group d-flex justify-content-md-end sk-actions">
          <a id="btn-export" class="btn btn-sm btn-outline-secondary" href="app/ajax/stock_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        </div>
      </div>

      <div class="row sk-filtres no-print">
        <?php if (count($mes_ent) > 1) { ?>
        <div class="col-xl-3 col-md-4 form-group">
          <select id="f-entreprise" class="form-control" autocomplete="off" aria-label="Entreprise">
            <option value="">Toutes mes entreprises</option>
            <?php foreach ($mes_ent as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $pre_ent === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php } ?>
        <div class="col-xl-3 col-md-4 form-group">
          <select id="f-emplacement" class="form-control" autocomplete="off" aria-label="Emplacement">
            <option value="">Tous les emplacements</option>
            <?php foreach ($mes_emp as $emp) { ?>
              <option value="<?php echo (int) $emp['id']; ?>" data-ent="<?php echo (int) $emp['entreprise_id']; ?>" data-ent-nom="<?php echo e($emp['entreprise_nom']); ?>" data-nom="<?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?>"<?php echo $pre_emp === (int) $emp['id'] ? ' selected' : ''; ?>><?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-xl-3 col-md-4 form-group">
          <select id="f-categorie" class="form-control" autocomplete="off" aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            <option value="aucune"<?php echo $pre_cat === 'aucune' ? ' selected' : ''; ?>>Sans catégorie</option>
            <?php foreach ($cats as $c) { ?><option value="<?php echo (int) $c['id']; ?>"<?php echo $pre_cat === (string) $c['id'] ? ' selected' : ''; ?>><?php echo e($c['nom']); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-xl-3 col-12 form-group d-flex align-items-center justify-content-between">
          <div class="custom-control custom-checkbox sk-case">
            <input type="checkbox" class="custom-control-input" id="f-zero" autocomplete="off"<?php echo $pre_zero ? ' checked' : ''; ?>>
            <label class="custom-control-label" for="f-zero">Pièces à zéro</label>
          </div>
          <button type="button" id="f-effacer" class="btn btn-sm btn-outline-secondary" hidden><i class="fas fa-times mr-1" aria-hidden="true"></i> Effacer</button>
        </div>
      </div>

      <p class="d-none d-print-block sk-resume-impression" id="sk-resume"></p>

      <div class="table-responsive">
        <table id="table-stock" class="table table-striped table-hover sk-table w-100">
          <caption class="sr-only">Stock</caption>
          <thead><tr>
            <th scope="col">Code</th>
            <th scope="col">Pièce</th>
            <th scope="col">Entreprise</th>
            <th scope="col">Emplacement</th>
            <th scope="col" class="nombre" id="th-quantite">Quantité</th>
            <th scope="col" class="nombre">Minimum</th>
            <?php if ($couts) { ?>
            <th scope="col" class="nombre sk-xs-cache">Valeur</th>
            <?php } ?>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>
</div>
