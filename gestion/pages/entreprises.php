<?php
// Entreprises : liste (un clic sur une ligne ouvre la fiche), ajout, modification, désactivation (jamais de suppression). Administrateur seulement.
if (!acces_page('admin')) { return; }
require_once __DIR__ . '/../app/action/utilisateur_lib.php';
page_script('assets/js/admin.js');
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="entreprises">
  <?php page_titre('Entreprises', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <?php Admin::enteteImpression('Entreprises'); ?>
    <div class="card"><div class="card-body">
      <div class="row adm-filtres align-items-center">
        <div class="col-md-6 col-lg-4 form-group">
          <label for="f-recherche" class="sr-only">Rechercher</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-search" aria-hidden="true"></i></span></div>
            <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Nom ou code">
          </div>
        </div>
        <div class="col-md-6 col-lg-8 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Ajouter une entreprise</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-entreprises" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Entreprise</th><th scope="col">Code</th><th scope="col">Adresse</th><th scope="col">État</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>

  <div class="modal fade" id="modal-entreprise" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-entreprise-titre" data-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-entreprise" novalidate autocomplete="off">
        <div class="modal-header"><h5 class="modal-title" id="modal-entreprise-titre">Entreprise</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="entreprise-erreur" hidden></div>
          <div class="form-group">
            <label for="en-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="en-nom" name="nom" class="form-control" maxlength="100" autocomplete="off">
            <small class="text-danger" data-erreur-pour="nom" hidden></small>
          </div>
          <div class="form-group">
            <label for="en-code">Code <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="en-code" name="code" class="form-control adm-code" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ex. : BEA">
            <small class="text-danger" data-erreur-pour="code" hidden></small>
          </div>
          <div class="form-group">
            <label for="en-adresse">Adresse</label>
            <input id="en-adresse" name="adresse" class="form-control" maxlength="255" autocomplete="off">
            <small class="text-danger" data-erreur-pour="adresse" hidden></small>
          </div>
          <div class="adm-compte" id="en-compte-bloc" hidden>
            <button type="button" class="btn btn-outline-danger" id="en-btn-desactiver" hidden><i class="fas fa-ban mr-1" aria-hidden="true"></i>Désactiver l'entreprise</button>
            <button type="button" class="btn btn-outline-success" id="en-btn-reactiver" hidden><i class="fas fa-check mr-1" aria-hidden="true"></i>Réactiver l'entreprise</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="entreprise-enregistrer">Enregistrer</button>
        </div>
      </form>
    </div></div>
  </div>
</div>
