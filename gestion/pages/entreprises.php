<?php
// Entreprises : liste, création, modification, désactivation (jamais de suppression). Administrateur seulement.
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
      <div class="row adm-filtres align-items-end">
        <div class="col-md-4 col-lg-3 form-group">
          <label for="f-recherche">Rechercher</label>
          <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Code, nom ou adresse">
        </div>
        <div class="col-md-3 col-lg-2 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="tous">Toutes</option><option value="actifs">Actives</option><option value="inactifs">Désactivées</option>
          </select>
        </div>
        <div class="col-md-5 col-lg-7 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvelle entreprise</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-entreprises" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Entreprise</th><th scope="col">Contenu</th>
            <th scope="col">Statut</th><th scope="col" class="no-print"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">On ne supprime pas une entreprise : on la désactive. Elle disparaît alors des listes de saisie, mais son historique reste consultable.
        La désactivation est refusée s'il reste du stock dans ses emplacements, si un comptage y est en cours ou s'il s'agit de la dernière entreprise active.</p>
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
            <label for="en-code">Code <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="en-code" name="code" class="form-control adm-code" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="en-code-aide">
            <small id="en-code-aide" class="form-text text-muted">10 caractères au plus (lettres, chiffres, tiret). Unique. Exemple : BEA.</small>
            <small class="text-danger" data-erreur-pour="code" hidden></small>
          </div>
          <div class="form-group">
            <label for="en-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="en-nom" name="nom" class="form-control" maxlength="100" autocomplete="off">
            <small class="text-danger" data-erreur-pour="nom" hidden></small>
          </div>
          <div class="form-group">
            <label for="en-adresse">Adresse</label>
            <input id="en-adresse" name="adresse" class="form-control" maxlength="255" autocomplete="off">
            <small class="text-danger" data-erreur-pour="adresse" hidden></small>
          </div>
          <div class="form-group mb-0" id="en-actif-groupe" hidden>
            <div class="custom-control custom-checkbox adm-case">
              <input type="checkbox" class="custom-control-input" id="en-actif" name="actif" checked>
              <label class="custom-control-label" for="en-actif">Entreprise active</label>
            </div>
            <small class="text-danger" data-erreur-pour="actif" hidden></small>
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
