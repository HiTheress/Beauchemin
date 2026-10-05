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
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="pieces">
  <?php page_titre('Pièces', array('Catalogue')); ?>
  <section class="content"><div class="container-fluid">
    <div class="cat-titre-impression"><div class="titre">Liste des pièces</div><div id="filtres-impression"></div></div>
    <div class="card"><div class="card-body">

      <div class="row cat-filtres">
        <div class="col-lg-4 col-md-6 form-group">
          <label for="recherche">Rechercher ou scanner une pièce</label>
          <div class="scan-box cat-scan-box">
            <div class="input-group">
              <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-barcode" aria-hidden="true"></i></span></div>
              <input id="recherche" type="search" class="form-control scan-input" autocomplete="off" placeholder="Code, nom ou code-barres…" value="<?php echo e($pre_q); ?>">
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 form-group">
          <label for="f-categorie">Catégorie</label>
          <select id="f-categorie" class="form-control">
            <option value="">Toutes les catégories</option>
            <option value="aucune"<?php echo $pre_cat === 'aucune' ? ' selected' : ''; ?>>Sans catégorie</option>
            <?php foreach ($cats as $c) { ?>
              <option value="<?php echo (int) $c['id']; ?>"<?php echo $pre_cat === (string) $c['id'] ? ' selected' : ''; ?>><?php echo e($c['nom']); ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-lg-2 col-md-4 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="actives"<?php echo $pre_statut === 'actives' ? ' selected' : ''; ?>>Actives</option>
            <option value="inactives"<?php echo $pre_statut === 'inactives' ? ' selected' : ''; ?>>Désactivées</option>
            <option value="toutes"<?php echo $pre_statut === 'toutes' ? ' selected' : ''; ?>>Toutes</option>
          </select>
        </div>
        <div class="col-lg-3 col-md-8 form-group d-flex align-items-end">
          <div class="custom-control custom-checkbox mb-2">
            <input type="checkbox" class="custom-control-input" id="f-stock">
            <label class="custom-control-label" for="f-stock">Avec stock seulement</label>
          </div>
        </div>
      </div>

      <?php if ($gest) { ?>
      <div class="mb-3 cat-actions no-print">
        <a class="btn btn-primary" href="index.php?page=piece_edit"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvelle pièce</a>
        <a class="btn btn-outline-secondary" href="index.php?page=pieces_import"><i class="fas fa-file-import mr-1" aria-hidden="true"></i> Importer (CSV)</a>
        <a class="btn btn-outline-secondary" href="app/ajax/pieces_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        <a class="btn btn-outline-secondary" href="index.php?page=etiquettes"><i class="fas fa-print mr-1" aria-hidden="true"></i> Étiquettes</a>
      </div>
      <?php } ?>

      <div class="table-responsive">
        <table id="table-pieces" class="table table-striped cat-table w-100">
          <thead><tr>
            <th scope="col">Code</th><th scope="col">Nom</th><th scope="col">Catégorie</th><th scope="col">Unité</th>
            <th scope="col" class="nombre">Quantité totale</th><th scope="col">Statut</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0 cat-portee">Quantités comptées dans : <strong><?php echo e($portee); ?></strong> (tous les emplacements). Pour changer d'entreprise, utilisez le sélecteur en haut de l'écran.</p>
    </div></div>
  </div></section>
</div>
