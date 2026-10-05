<?php
// Stock : ce que nous avons, et où. Tableau serveur (DataTables) par emplacement ou par pièce (totaux par entreprise).
// Employé+ ; les colonnes « Coût moyen » et « Valeur » n'existent que pour un gestionnaire+ (absentes du HTML et du JSON pour un employé).
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
$pre_ent = $get('entreprise_id') !== '' && ctype_digit($get('entreprise_id')) && in_array((int) $get('entreprise_id'), $ids_ent, true) ? (int) $get('entreprise_id') : $defaut_ent;
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
<div class="content-wrapper sk-page" data-d2="stock" data-couts="<?php echo $couts ? '1' : '0'; ?>" data-defaut-entreprise="<?php echo (int) $defaut_ent; ?>" data-vue-initiale="<?php echo e($pre_vue); ?>">
  <?php page_titre('Stock', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card sk-carte"><div class="card-body">

      <div class="row sk-filtres">
        <div class="col-lg-4 col-md-6 form-group">
          <label for="f-recherche">Rechercher ou scanner une pièce</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-barcode" aria-hidden="true"></i></span></div>
            <input id="f-recherche" type="search" class="form-control" autocomplete="off" maxlength="100" placeholder="Code, nom ou code-barres, puis Entrée" value="<?php echo e($pre_q); ?>">
          </div>
        </div>
        <?php if (count($mes_ent) > 0) { ?>
        <div class="col-lg-2 col-md-6 form-group">
          <label for="f-entreprise">Entreprise</label>
          <select id="f-entreprise" class="form-control">
            <?php if (count($mes_ent) > 1) { ?><option value="">Toutes mes entreprises</option><?php } ?>
            <?php foreach ($mes_ent as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $pre_ent === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php } ?>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-emplacement">Emplacement</label>
          <select id="f-emplacement" class="form-control">
            <option value="">Tous les emplacements</option>
            <?php foreach ($mes_emp as $emp) { ?>
              <option value="<?php echo (int) $emp['id']; ?>" data-ent="<?php echo (int) $emp['entreprise_id']; ?>" data-ent-nom="<?php echo e($emp['entreprise_nom']); ?>" data-nom="<?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?>"<?php echo $pre_emp === (int) $emp['id'] ? ' selected' : ''; ?>><?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-categorie">Catégorie</label>
          <select id="f-categorie" class="form-control">
            <option value="">Toutes les catégories</option>
            <option value="aucune"<?php echo $pre_cat === 'aucune' ? ' selected' : ''; ?>>Sans catégorie</option>
            <?php foreach ($cats as $c) { ?><option value="<?php echo (int) $c['id']; ?>"<?php echo $pre_cat === (string) $c['id'] ? ' selected' : ''; ?>><?php echo e($c['nom']); ?></option><?php } ?>
          </select>
        </div>
      </div>

      <div class="row sk-barre no-print">
        <div class="col-lg-5 form-group">
          <span class="sk-etiquette" id="lbl-vue">Affichage</span>
          <div class="btn-group sk-vue" role="group" aria-labelledby="lbl-vue">
            <button type="button" class="btn btn-outline-primary" data-vue="emplacement" aria-pressed="<?php echo $pre_vue === 'emplacement' ? 'true' : 'false'; ?>">Par emplacement</button>
            <button type="button" class="btn btn-outline-primary" data-vue="piece" aria-pressed="<?php echo $pre_vue === 'piece' ? 'true' : 'false'; ?>">Par pièce (totaux par entreprise)</button>
          </div>
        </div>
        <div class="col-lg-7 form-group d-flex flex-wrap align-items-end justify-content-lg-end sk-actions">
          <div class="custom-control custom-checkbox sk-case mr-3">
            <input type="checkbox" class="custom-control-input" id="f-zero"<?php echo $pre_zero ? ' checked' : ''; ?>>
            <label class="custom-control-label" for="f-zero">Afficher les quantités à zéro</label>
          </div>
          <button type="button" id="f-effacer" class="btn btn-outline-secondary mr-2"><i class="fas fa-eraser mr-1" aria-hidden="true"></i> Effacer</button>
          <a id="btn-export" class="btn btn-outline-secondary" href="app/ajax/stock_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        </div>
      </div>

      <p class="sk-aide text-muted small" id="sk-aide-vue"></p>

      <div class="table-responsive">
        <table id="table-stock" class="table table-striped table-hover sk-table w-100">
          <caption class="sr-only">Stock par pièce</caption>
          <thead><tr>
            <th scope="col">Code</th>
            <th scope="col">Pièce</th>
            <th scope="col">Catégorie</th>
            <th scope="col">Entreprise</th>
            <th scope="col">Emplacement</th>
            <th scope="col" class="nombre" id="th-quantite">Quantité</th>
            <th scope="col">Unité</th>
            <th scope="col" class="nombre">Minimum</th>
            <?php if ($couts) { ?>
            <th scope="col" class="nombre">Coût moyen</th>
            <th scope="col" class="nombre">Valeur</th>
            <?php } ?>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Les lignes sur fond rouge sont sous le minimum fixé pour l'entreprise (total de tous ses emplacements). Cliquez sur une pièce pour ouvrir sa fiche.<?php if ($couts) { ?> La valeur est la quantité multipliée par le coût moyen de l'entreprise.<?php } ?></p>
    </div></div>
  </div></section>
</div>
