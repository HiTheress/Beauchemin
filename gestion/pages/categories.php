<?php
// Catégories de pièces : liste, création, modification, suppression (seulement si aucune pièce). Gestionnaire+.
if (!acces_page('gestionnaire')) { return; }
page_script('assets/js/catalogue.js');
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="categories">
  <?php page_titre('Catégories', array('Catalogue')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body">
      <div class="mb-3 cat-actions no-print">
        <button type="button" class="btn btn-primary" id="btn-nouvelle"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvelle catégorie</button>
      </div>
      <div class="table-responsive">
        <table id="table-categories" class="table table-striped cat-table w-100">
          <thead><tr>
            <th scope="col">Nom</th><th scope="col">Description</th><th scope="col" class="nombre">Pièces</th><th scope="col" class="no-print"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>

  <div class="modal fade" id="modal-categorie" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-categorie-titre">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-categorie" novalidate>
        <div class="modal-header"><h5 class="modal-title" id="modal-categorie-titre">Catégorie</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="categorie-erreur" hidden></div>
          <div class="form-group"><label for="ca-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="ca-nom" name="nom" class="form-control" maxlength="100" autocomplete="off"></div>
          <div class="form-group mb-0"><label for="ca-description">Description</label>
            <input id="ca-description" name="description" class="form-control" maxlength="255" autocomplete="off"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="categorie-enregistrer">Enregistrer</button>
        </div>
      </form>
    </div></div>
  </div>
</div>
