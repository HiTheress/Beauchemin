<?php
// Emplacements (entrepôts, boutiques, cubes de service) : liste (un clic sur une ligne ouvre la fiche), ajout, modification, étiquette, désactivation. Administrateur seulement.
if (!acces_page('admin')) { return; }
require_once __DIR__ . '/../app/action/utilisateur_lib.php';
page_script('assets/js/admin.js');
$entreprises = $pdo->query('SELECT id, code, nom, actif FROM entreprises ORDER BY id')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="emplacements">
  <?php page_titre('Emplacements', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <?php Admin::enteteImpression('Emplacements'); ?>
    <div class="card"><div class="card-body">
      <div class="row adm-filtres align-items-center">
        <div class="col-md-6 col-lg-4 form-group">
          <label for="f-recherche" class="sr-only">Rechercher</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-barcode" aria-hidden="true"></i></span></div>
            <input id="f-recherche" type="search" class="form-control scan-input" maxlength="100" autocomplete="off" placeholder="Nom ou code-barres">
          </div>
        </div>
        <div class="col-md-6 col-lg-3 form-group">
          <label for="f-entreprise" class="sr-only">Entreprise</label>
          <select id="f-entreprise" class="form-control">
            <option value="">Toutes les entreprises</option>
            <?php foreach ($entreprises as $en) { ?>
              <option value="<?php echo (int) $en['id']; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></option>
            <?php } ?>
          </select>
        </div>
        <div class="col-lg-5 form-group text-lg-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Ajouter un emplacement</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-emplacements" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Entreprise</th><th scope="col">Emplacement</th><th scope="col">Code-barres</th>
            <th scope="col" class="nombre">Pièces en stock</th><th scope="col">État</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>

  <div class="modal fade" id="modal-emplacement" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-emplacement-titre" data-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-emplacement" novalidate autocomplete="off">
        <div class="modal-header"><h5 class="modal-title" id="modal-emplacement-titre">Emplacement</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="emplacement-erreur" hidden></div>
          <div class="form-group">
            <div class="adm-etiquette-ligne">
              <label for="em-entreprise">Entreprise <span class="text-danger" aria-hidden="true">*</span></label>
              <span id="em-entreprise-aide" class="adm-info" role="img" tabindex="0" title="Cet emplacement a déjà du stock ou des mouvements : son entreprise ne peut plus changer." aria-label="Cet emplacement a déjà du stock ou des mouvements : son entreprise ne peut plus changer." hidden><i class="fas fa-info-circle" aria-hidden="true"></i></span>
            </div>
            <select id="em-entreprise" name="entreprise_id" class="form-control">
              <option value="">— Choisir —</option>
              <?php foreach ($entreprises as $en) { ?>
                <option value="<?php echo (int) $en['id']; ?>" data-actif="<?php echo $en['actif'] ? '1' : '0'; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></option>
              <?php } ?>
            </select>
            <small class="text-danger" data-erreur-pour="entreprise_id" hidden></small>
          </div>
          <div class="form-group">
            <label for="em-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="em-nom" name="nom" class="form-control" maxlength="100" autocomplete="off">
            <small class="text-danger" data-erreur-pour="nom" hidden></small>
          </div>
          <div class="form-group">
            <div class="adm-etiquette-ligne">
              <label for="em-type">Type <span class="text-danger" aria-hidden="true">*</span></label>
              <span class="adm-info" role="img" tabindex="0" title="Cube de service : le camion ou la fourgonnette d'un technicien." aria-label="Cube de service : le camion ou la fourgonnette d'un technicien."><i class="fas fa-info-circle" aria-hidden="true"></i></span>
            </div>
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
              <input id="em-code" name="code_barres" class="form-control adm-code" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false">
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary" id="em-code-proposer"><i class="fas fa-magic mr-1" aria-hidden="true"></i>Proposer</button>
              </div>
            </div>
            <small id="em-code-avert" class="form-text adm-avert" role="status" hidden>Si des étiquettes de cet emplacement sont déjà imprimées, elles ne fonctionneront plus avec un nouveau code.</small>
            <small class="text-danger" data-erreur-pour="code_barres" hidden></small>
          </div>
          <div class="adm-compte" id="em-compte-bloc" hidden>
            <a class="btn btn-outline-secondary mr-2 mb-2" id="em-etiquette" href="index.php?page=etiquettes"><i class="fas fa-barcode mr-1" aria-hidden="true"></i>Imprimer l'étiquette</a>
            <button type="button" class="btn btn-outline-danger mb-2" id="em-btn-desactiver" hidden><i class="fas fa-ban mr-1" aria-hidden="true"></i>Désactiver</button>
            <button type="button" class="btn btn-outline-success mb-2" id="em-btn-reactiver" hidden><i class="fas fa-check mr-1" aria-hidden="true"></i>Réactiver</button>
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
