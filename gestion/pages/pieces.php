<?php
// Catalogue : liste des pièces (tableau serveur). Tous les rôles ; les boutons d'écriture sont réservés aux gestionnaires.
if (!acces_page('employe')) { return; }
page_script('assets/js/catalogue.js');
$gest = $Ouser->aRole('gestionnaire');
$cats = $pdo->query('SELECT id, nom FROM categories ORDER BY nom')->fetchAll();
$filtre_ent = entreprises_filtre();
$noms_ent = array();
foreach (inventaire()->listeEntreprises(utilisateur_id()) as $en) {
	if (in_array((int) $en['id'], $filtre_ent, true)) { $noms_ent[] = $en['nom']; }
}
$portee = $noms_ent ? implode(', ', $noms_ent) : 'aucune entreprise';
$pre_cat = (isset($_GET['categorie_id']) && is_string($_GET['categorie_id']) && ($_GET['categorie_id'] === 'aucune' || ctype_digit($_GET['categorie_id']))) ? $_GET['categorie_id'] : '';
$pre_statut = (isset($_GET['statut']) && is_string($_GET['statut']) && in_array($_GET['statut'], array('actives', 'inactives', 'toutes'), true)) ? $_GET['statut'] : 'actives';
$pre_q = (isset($_GET['q']) && is_string($_GET['q'])) ? mb_substr($_GET['q'], 0, 100) : '';
$options_ouvertes = ($pre_statut !== 'actives');   // un filtre venu de l'adresse doit rester visible
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="pieces" data-gest="<?php echo $gest ? '1' : '0'; ?>">
  <?php page_titre('Pièces', array('Catalogue')); ?>
  <section class="content"><div class="container-fluid">
    <div class="cat-titre-impression"><div class="titre">Liste des pièces</div><div id="filtres-impression" data-portee="<?php echo e($portee); ?>"></div></div>
    <div class="card"><div class="card-body">

      <div class="cat-barre cat-filtres">
        <div class="cat-barre-recherche">
          <label for="recherche" class="sr-only">Rechercher une pièce</label>
          <div class="scan-box cat-scan-box">
            <div class="input-group">
              <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-barcode" aria-hidden="true"></i></span></div>
              <input id="recherche" type="search" class="form-control scan-input" autocomplete="off" placeholder="Code, nom ou code-barres…" value="<?php echo e($pre_q); ?>">
            </div>
          </div>
        </div>
        <div class="cat-barre-filtre">
          <label for="f-categorie" class="sr-only">Catégorie</label>
          <select id="f-categorie" class="form-control">
            <option value="">Toutes les catégories</option>
            <option value="aucune"<?php echo $pre_cat === 'aucune' ? ' selected' : ''; ?>>Sans catégorie</option>
            <?php foreach ($cats as $c) { ?>
              <option value="<?php echo (int) $c['id']; ?>"<?php echo $pre_cat === (string) $c['id'] ? ' selected' : ''; ?>><?php echo e($c['nom']); ?></option>
            <?php } ?>
          </select>
        </div>
        <?php if ($gest) { ?>
        <div class="cat-actions no-print">
          <a class="btn btn-primary" href="index.php?page=piece_edit"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Ajouter une pièce</a>
        </div>
        <?php } ?>
      </div>

      <div class="cat-plus-ligne cat-filtres no-print">
        <button type="button" class="btn btn-link cat-plus" data-plus="options-pieces" aria-expanded="<?php echo $options_ouvertes ? 'true' : 'false'; ?>" aria-controls="options-pieces">Plus d'options <i class="fas fa-chevron-down" aria-hidden="true"></i></button>
      </div>
      <div id="options-pieces" class="cat-plus-zone cat-filtres no-print"<?php echo $options_ouvertes ? '' : ' hidden'; ?>>
        <div class="form-row align-items-end">
          <div class="col-sm-6 col-md-4 form-group">
            <label for="f-statut">Afficher</label>
            <select id="f-statut" class="form-control">
              <option value="actives"<?php echo $pre_statut === 'actives' ? ' selected' : ''; ?>>Pièces actives</option>
              <option value="inactives"<?php echo $pre_statut === 'inactives' ? ' selected' : ''; ?>>Pièces désactivées</option>
              <option value="toutes"<?php echo $pre_statut === 'toutes' ? ' selected' : ''; ?>>Toutes les pièces</option>
            </select>
          </div>
          <div class="col-sm-6 col-md-4 form-group">
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="f-stock">
              <label class="custom-control-label" for="f-stock">En stock seulement</label>
            </div>
          </div>
          <?php if ($gest) { ?>
          <div class="col-md-4 form-group cat-actions">
            <a class="btn btn-outline-secondary" href="app/ajax/pieces_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter</a>
          </div>
          <?php } ?>
        </div>
      </div>

      <div class="table-responsive">
        <table id="table-pieces" class="table table-striped cat-table w-100">
          <thead><tr>
            <th scope="col">Code</th><th scope="col">Nom</th><th scope="col" class="d-none d-sm-table-cell">Catégorie</th><th scope="col" class="nombre">Quantité</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>
</div>
