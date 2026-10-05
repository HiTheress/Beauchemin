<?php
// Fournisseurs : liste, création/modification, désactivation, prix de chaque fournisseur. Gestionnaire+.
if (!acces_page('gestionnaire')) { return; }
page_script('assets/js/catalogue.js');
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="fournisseurs">
  <?php page_titre('Fournisseurs', array('Catalogue')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body">
      <div class="row cat-filtres align-items-end">
        <div class="col-md-3 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="actifs">Actifs</option><option value="inactifs">Désactivés</option><option value="tous">Tous</option>
          </select>
        </div>
        <div class="col-md-9 form-group text-md-right cat-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouveau fournisseur</button>
        </div>
      </div>
      <p class="text-muted small">Cliquez sur un fournisseur pour voir ses pièces et ses prix.</p>
      <div class="table-responsive">
        <table id="table-fournisseurs" class="table table-striped cat-table w-100">
          <thead><tr>
            <th scope="col">Nom</th><th scope="col">Contact</th><th scope="col">Téléphone</th><th scope="col">Courriel</th>
            <th scope="col" class="nombre cat-th-souple">Pièces avec prix</th><th scope="col">Statut</th><th scope="col" class="no-print"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>

  <div class="modal fade" id="modal-fournisseur" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-fournisseur-titre" data-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-fournisseur" novalidate>
        <div class="modal-header"><h5 class="modal-title" id="modal-fournisseur-titre">Fournisseur</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="fournisseur-erreur" hidden></div>
          <div class="form-group"><label for="fo-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="fo-nom" name="nom" class="form-control" maxlength="150" autocomplete="off"></div>
          <div class="form-row">
            <div class="form-group col-sm-6"><label for="fo-contact">Contact</label><input id="fo-contact" name="contact" class="form-control" maxlength="100" autocomplete="off"></div>
            <div class="form-group col-sm-6"><label for="fo-telephone">Téléphone</label><input id="fo-telephone" name="telephone" type="tel" class="form-control" maxlength="40" autocomplete="off"></div>
          </div>
          <div class="form-group"><label for="fo-courriel">Courriel</label><input id="fo-courriel" name="courriel" type="email" class="form-control" maxlength="150" autocomplete="off"></div>
          <div class="form-group"><label for="fo-adresse">Adresse</label><input id="fo-adresse" name="adresse" class="form-control" maxlength="255" autocomplete="off"></div>
          <div class="form-group mb-0"><label for="fo-notes">Notes</label><textarea id="fo-notes" name="notes" class="form-control" rows="3" maxlength="2000"></textarea></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="fournisseur-enregistrer">Enregistrer</button>
        </div>
      </form>
    </div></div>
  </div>

  <div class="modal fade" id="modal-prix-fournisseur" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-prix-fournisseur-titre">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="modal-prix-fournisseur-titre">Prix de ce fournisseur</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
      <div class="modal-body" id="prix-fournisseur-contenu"></div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Fermer</button></div>
    </div></div>
  </div>
</div>
