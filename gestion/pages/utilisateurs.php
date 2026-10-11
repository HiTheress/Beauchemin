<?php
// Utilisateurs : liste (un clic sur une ligne ouvre la fiche), ajout, modification, mot de passe, déverrouillage, désactivation. Administrateur seulement.
if (!acces_page('admin')) { return; }
require_once __DIR__ . '/../app/action/utilisateur_lib.php';
page_script('assets/js/admin.js');
$entreprises = $pdo->query('SELECT id, code, nom, actif FROM entreprises ORDER BY id')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="utilisateurs" data-moi="<?php echo (int) utilisateur_id(); ?>">
  <?php page_titre('Utilisateurs', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <?php Admin::enteteImpression('Utilisateurs'); ?>
    <div class="card"><div class="card-body">
      <div class="row adm-filtres align-items-center">
        <div class="col-md-6 col-lg-4 form-group">
          <label for="f-recherche" class="sr-only">Rechercher</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fas fa-search" aria-hidden="true"></i></span></div>
            <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Nom ou entreprise">
          </div>
        </div>
        <div class="col-md-6 col-lg-8 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-user-plus mr-1" aria-hidden="true"></i> Ajouter un utilisateur</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-utilisateurs" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Utilisateur</th><th scope="col">Rôle</th><th scope="col">Entreprises</th><th scope="col">État</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>

  <!-- Ajouter / modifier -->
  <div class="modal fade" id="modal-utilisateur" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-utilisateur-titre" data-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <form id="form-utilisateur" novalidate autocomplete="off">
        <div class="modal-header"><h5 class="modal-title" id="modal-utilisateur-titre">Utilisateur</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="utilisateur-erreur" hidden></div>
          <div class="form-group">
            <label for="u-nom">Nom d'utilisateur <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="u-nom" name="nom_utilisateur" class="form-control" maxlength="50" autocomplete="off" autocapitalize="none" spellcheck="false">
            <small class="text-danger" data-erreur-pour="nom_utilisateur" hidden></small>
          </div>
          <div class="form-group">
            <label for="u-complet">Nom complet <span class="text-danger" aria-hidden="true">*</span></label>
            <input id="u-complet" name="nom_complet" class="form-control" maxlength="100" autocomplete="off">
            <small class="text-danger" data-erreur-pour="nom_complet" hidden></small>
          </div>
          <div class="form-group">
            <label for="u-role">Rôle <span class="text-danger" aria-hidden="true">*</span></label>
            <select id="u-role" name="role" class="form-control">
              <?php foreach (ROLES_FR as $code => $lib) { ?>
                <option value="<?php echo e($code); ?>"><?php echo e($lib); ?></option>
              <?php } ?>
            </select>
            <small class="text-danger" data-erreur-pour="role" hidden></small>
          </div>
          <fieldset class="form-group" id="u-entreprises-groupe">
            <legend class="adm-legende">Entreprises <span class="text-danger" aria-hidden="true">*</span></legend>
            <?php foreach ($entreprises as $en) { ?>
              <div class="custom-control custom-checkbox adm-case">
                <input type="checkbox" class="custom-control-input" id="u-ent-<?php echo (int) $en['id']; ?>" name="entreprise_ids" value="<?php echo (int) $en['id']; ?>">
                <label class="custom-control-label" for="u-ent-<?php echo (int) $en['id']; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></label>
              </div>
            <?php } ?>
            <small class="text-danger" data-erreur-pour="entreprise_ids" hidden></small>
          </fieldset>

          <div id="u-mdp-bloc" class="form-group">
            <label for="u-mdp">Mot de passe <span class="text-danger" aria-hidden="true">*</span></label>
            <div class="input-group">
              <input id="u-mdp" name="mot_de_passe" type="password" class="form-control" maxlength="72" autocomplete="new-password" spellcheck="false">
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary" id="u-mdp-voir" aria-label="Afficher le mot de passe">Afficher</button>
                <button type="button" class="btn btn-outline-secondary" id="u-mdp-gen"><i class="fas fa-random mr-1" aria-hidden="true"></i>Générer</button>
              </div>
            </div>
            <small class="text-danger" data-erreur-pour="mot_de_passe" hidden></small>
          </div>

          <div id="u-compte-bloc" class="adm-compte" hidden>
            <div class="small text-muted mb-2" id="u-connexion"></div>
            <button type="button" class="btn btn-outline-secondary mr-2 mb-2" id="u-btn-mdp"><i class="fas fa-key mr-1" aria-hidden="true"></i>Réinitialiser le mot de passe</button>
            <button type="button" class="btn adm-btn-attention mr-2 mb-2" id="u-btn-deverrouiller" hidden><i class="fas fa-unlock mr-1" aria-hidden="true"></i>Déverrouiller</button>
            <button type="button" class="btn btn-outline-danger mb-2" id="u-btn-desactiver" hidden><i class="fas fa-user-slash mr-1" aria-hidden="true"></i>Désactiver</button>
            <button type="button" class="btn btn-outline-success mb-2" id="u-btn-reactiver" hidden><i class="fas fa-user-check mr-1" aria-hidden="true"></i>Réactiver</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="utilisateur-enregistrer">Enregistrer</button>
        </div>
      </form>
    </div></div>
  </div>

  <!-- Mot de passe : réinitialisation, ou affichage unique après la création -->
  <div class="modal fade" id="modal-mdp" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-mdp-titre" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="modal-mdp-titre">Mot de passe</h5></div>
      <div class="modal-body">
        <div class="alert alert-danger" role="alert" id="mdp-erreur" hidden></div>
        <p id="mdp-texte" class="font-weight-bold mb-2"></p>
        <div class="form-group mb-2">
          <label for="mdp-champ" id="mdp-etiquette">Mot de passe</label>
          <div class="input-group">
            <input id="mdp-champ" name="mot_de_passe" type="text" class="form-control adm-mdp-champ" maxlength="72" autocomplete="off" spellcheck="false">
            <div class="input-group-append">
              <button type="button" class="btn btn-outline-secondary" id="mdp-gen"><i class="fas fa-random mr-1" aria-hidden="true"></i>Générer</button>
              <button type="button" class="btn btn-outline-secondary" id="mdp-copier"><i class="far fa-copy mr-1" aria-hidden="true"></i>Copier</button>
            </div>
          </div>
          <small class="text-danger" data-erreur-pour="mot_de_passe" hidden></small>
        </div>
        <p class="small adm-avert mb-0" id="mdp-note"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" id="mdp-annuler">Annuler</button>
        <button type="button" class="btn btn-primary" id="mdp-valider">Réinitialiser le mot de passe</button>
        <button type="button" class="btn btn-primary" id="mdp-fermer" hidden>Fermer</button>
      </div>
    </div></div>
  </div>
</div>
