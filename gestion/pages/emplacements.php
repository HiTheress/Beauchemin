<?php
// Emplacements (entrepôts, boutiques, cubes de service) : liste, création, modification, étiquette, désactivation. Administrateur seulement.
if (!acces_page('admin')) { return; }
page_script('assets/js/admin.js');
$entreprises = $pdo->query('SELECT id, code, nom, actif FROM entreprises ORDER BY id')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="emplacements">
  <?php page_titre('Emplacements', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body">
      <div class="row adm-filtres align-items-end">
        <div class="col-md-4 col-lg-3 form-group">
          <label for="f-recherche">Rechercher ou scanner</label>
          <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Nom ou code-barres">
        </div>
        <div class="col-md-4 col-lg-2 form-group">
          <label for="f-entreprise">Entreprise</label>
          <select id="f-entreprise" class="form-control">
            <option value="">Toutes</option>
            <?php foreach ($entreprises as $en) { ?>
              <option value="<?php echo (int) $en['id']; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-md-4 col-lg-2 form-group">
          <label for="f-type">Type</label>
          <select id="f-type" class="form-control">
            <option value="">Tous</option>
            <?php foreach (TYPES_EMPLACEMENT_FR as $code => $lib) { ?>
              <option value="<?php echo e($code); ?>"><?php echo e($lib); ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-md-4 col-lg-2 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="tous">Tous</option><option value="actifs">Actifs</option><option value="inactifs">Désactivés</option>
          </select>
        </div>
        <div class="col-md-8 col-lg-3 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvel emplacement</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-emplacements" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Entreprise</th><th scope="col">Nom</th><th scope="col">Type</th><th scope="col">Code-barres</th>
            <th scope="col" class="nombre">Pièces en stock</th><th scope="col">Statut</th><th scope="col" class="no-print"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Un cube de service est le camion ou la fourgonnette d'un technicien. Le code-barres de l'emplacement s'imprime sur une étiquette (bouton « Étiquette »)
        et se scanne comme celui d'une pièce. On ne supprime pas un emplacement : on le désactive, ce qui n'est possible que s'il est vide.</p>
    </div></div>
  </div></section>

  <div class="modal fade" id="modal-emplacement" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-emplacement-titre">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-emplacement" novalidate autocomplete="off">
        <div class="modal-header"><h5 class="modal-title" id="modal-emplacement-titre">Emplacement</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="emplacement-erreur" hidden></div>
          <div class="form-group">
            <label for="em-entreprise">Entreprise <span class="text-danger" aria-hidden="true">*</span></label>
            <select id="em-entreprise" name="entreprise_id" class="form-control" aria-describedby="em-entreprise-aide">
              <option value="">— Choisir —</option>
              <?php foreach ($entreprises as $en) { ?>
                <option value="<?php echo (int) $en['id']; ?>" data-actif="<?php echo $en['actif'] ? '1' : '0'; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></option>
              <?php } ?>
            </select>
            <small id="em-entreprise-aide" class="form-text text-muted" hidden>Cet emplacement a déjà des mouvements, du stock ou des comptages : on ne peut plus le changer d'entreprise.</small>
            <small class="text-danger" data-erreur-pour="entreprise_id" hidden></small>
          </div>
          <div class="form-group">
            <label for="em-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="em-nom" name="nom" class="form-control" maxlength="100" autocomplete="off" aria-describedby="em-nom-aide">
            <small id="em-nom-aide" class="form-text text-muted">Unique dans l'entreprise. Exemple : « Cube 12 — Marc ».</small>
            <small class="text-danger" data-erreur-pour="nom" hidden></small>
          </div>
          <div class="form-group">
            <label for="em-type">Type <span class="text-danger" aria-hidden="true">*</span></label>
            <select id="em-type" name="type" class="form-control">
              <?php foreach (TYPES_EMPLACEMENT_FR as $code => $lib) { ?>
                <option value="<?php echo e($code); ?>"><?php echo e($lib); ?></option>
              <?php } ?>
            </select>
            <small class="text-danger" data-erreur-pour="type" hidden></small>
          </div>
          <div class="form-group">
            <label for="em-code">Code-barres <span class="text-danger" aria-hidden="true">*</span></label>
            <div class="input-group">
              <input id="em-code" name="code_barres" class="form-control adm-code" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="em-code-aide">
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary" id="em-code-proposer" title="Proposer le prochain code libre"><i class="fas fa-magic mr-1" aria-hidden="true"></i>Proposer</button>
              </div>
            </div>
            <small id="em-code-aide" class="form-text text-muted">Proposé automatiquement (EMP-000001, EMP-000002…) ; vous pouvez le modifier. Il doit être unique dans tout le système.</small>
            <small id="em-code-avert" class="form-text text-warning" hidden>Si des étiquettes de cet emplacement sont déjà imprimées, elles ne fonctionneront plus avec un nouveau code.</small>
            <small class="text-danger" data-erreur-pour="code_barres" hidden></small>
          </div>
          <div class="form-group mb-0" id="em-actif-groupe" hidden>
            <div class="custom-control custom-checkbox adm-case">
              <input type="checkbox" class="custom-control-input" id="em-actif" name="actif" checked>
              <label class="custom-control-label" for="em-actif">Emplacement actif</label>
            </div>
            <small class="text-danger" data-erreur-pour="actif" hidden></small>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="emplacement-enregistrer">Enregistrer</button>
        </div>
      </form>
    </div></div>
  </div>
</div>
