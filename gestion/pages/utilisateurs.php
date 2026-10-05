<?php
// Utilisateurs : liste, création, modification, mot de passe, déverrouillage, désactivation. Administrateur seulement.
if (!acces_page('admin')) { return; }
require_once __DIR__ . '/../app/action/utilisateur_lib.php';
page_script('assets/js/admin.js');
$entreprises = $pdo->query('SELECT id, code, nom, actif FROM entreprises ORDER BY id')->fetchAll();
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="utilisateurs" data-moi="<?php echo (int) utilisateur_id(); ?>">
  <?php page_titre('Utilisateurs', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body">
      <div class="row adm-filtres align-items-end">
        <div class="col-md-4 col-lg-3 form-group">
          <label for="f-recherche">Rechercher</label>
          <input id="f-recherche" type="search" class="form-control" maxlength="100" autocomplete="off" placeholder="Nom, nom d'utilisateur ou entreprise">
        </div>
        <div class="col-md-3 col-lg-2 form-group">
          <label for="f-statut">Statut</label>
          <select id="f-statut" class="form-control">
            <option value="tous">Tous</option><option value="actifs">Actifs</option><option value="inactifs">Désactivés</option>
          </select>
        </div>
        <div class="col-md-5 col-lg-7 form-group text-md-right adm-actions no-print">
          <button type="button" class="btn btn-primary" id="btn-nouveau"><i class="fas fa-user-plus mr-1" aria-hidden="true"></i> Nouvel utilisateur</button>
        </div>
      </div>
      <div class="table-responsive">
        <table id="table-utilisateurs" class="table table-striped adm-table w-100">
          <thead><tr>
            <th scope="col">Nom d'utilisateur</th><th scope="col">Nom complet</th><th scope="col">Rôle</th><th scope="col">Entreprises</th>
            <th scope="col">Statut</th><th scope="col">Dernière connexion</th><th scope="col">Verrouillé ?</th>
            <th scope="col" class="no-print"><span class="sr-only">Actions</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Un compte désactivé ne peut plus se connecter ; ses connexions ouvertes sont coupées à la prochaine action. Son historique est conservé.
        Un compte est verrouillé 15 minutes après 5 mots de passe erronés ; vous pouvez le déverrouiller tout de suite.</p>
    </div></div>
  </div></section>

  <!-- Créer / modifier -->
  <div class="modal fade" id="modal-utilisateur" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-utilisateur-titre">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document"><div class="modal-content">
      <form id="form-utilisateur" novalidate autocomplete="off">
        <div class="modal-header"><h5 class="modal-title" id="modal-utilisateur-titre">Utilisateur</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
        <div class="modal-body">
          <div class="alert alert-danger" role="alert" id="utilisateur-erreur" hidden></div>
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="u-nom">Nom d'utilisateur <span class="text-danger" aria-hidden="true">*</span></label>
              <input id="u-nom" name="nom_utilisateur" class="form-control" maxlength="50" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="u-nom-aide">
              <small id="u-nom-aide" class="form-text text-muted">3 à 50 caractères : lettres sans accent, chiffres, point, tiret ou tiret bas. Les majuscules ne comptent pas.</small>
              <small class="text-danger" data-erreur-pour="nom_utilisateur" hidden></small>
            </div>
            <div class="form-group col-md-6">
              <label for="u-complet">Nom complet <span class="text-danger" aria-hidden="true">*</span></label>
              <input id="u-complet" name="nom_complet" class="form-control" maxlength="100" autocomplete="off">
              <small class="text-danger" data-erreur-pour="nom_complet" hidden></small>
            </div>
          </div>
          <div class="form-group">
            <label for="u-role">Rôle <span class="text-danger" aria-hidden="true">*</span></label>
            <select id="u-role" name="role" class="form-control" aria-describedby="u-role-aide">
              <?php foreach (ROLES_FR as $code => $lib) { ?>
                <option value="<?php echo e($code); ?>" data-aide="<?php echo e(Admin::ROLES_AIDE[$code]); ?>"><?php echo e($lib); ?></option>
              <?php } ?>
            </select>
            <small id="u-role-aide" class="form-text text-muted" aria-live="polite"></small>
            <small class="text-danger" data-erreur-pour="role" hidden></small>
          </div>
          <fieldset class="form-group" id="u-entreprises-groupe">
            <legend class="adm-legende">Entreprises accessibles <span class="text-danger" aria-hidden="true">*</span></legend>
            <?php foreach ($entreprises as $en) { ?>
              <div class="custom-control custom-checkbox adm-case">
                <input type="checkbox" class="custom-control-input" id="u-ent-<?php echo (int) $en['id']; ?>" name="entreprise_ids" value="<?php echo (int) $en['id']; ?>">
                <label class="custom-control-label" for="u-ent-<?php echo (int) $en['id']; ?>"><?php echo e($en['nom']); ?><?php echo $en['actif'] ? '' : ' (désactivée)'; ?></label>
              </div>
            <?php } ?>
            <small id="u-entreprises-admin" class="form-text text-muted" hidden>Un administrateur voit toutes les entreprises.</small>
            <small class="text-danger" data-erreur-pour="entreprise_ids" hidden></small>
          </fieldset>
          <div class="form-group">
            <div class="custom-control custom-checkbox adm-case">
              <input type="checkbox" class="custom-control-input" id="u-actif" name="actif" checked>
              <label class="custom-control-label" for="u-actif">Compte actif (peut se connecter)</label>
            </div>
            <small id="u-actif-aide" class="form-text text-muted" hidden>Vous ne pouvez pas désactiver votre propre compte ni retirer votre propre rôle d'administrateur.</small>
            <small class="text-danger" data-erreur-pour="actif" hidden></small>
          </div>

          <div id="u-mdp-bloc" class="form-group">
            <label for="u-mdp">Mot de passe initial <span class="text-danger" aria-hidden="true">*</span></label>
            <div class="input-group">
              <input id="u-mdp" name="mot_de_passe" type="password" class="form-control" maxlength="72" autocomplete="new-password" spellcheck="false" aria-describedby="u-mdp-aide">
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary" id="u-mdp-voir" aria-pressed="false">Afficher</button>
                <button type="button" class="btn btn-outline-primary" id="u-mdp-gen"><i class="fas fa-random mr-1" aria-hidden="true"></i>Générer</button>
                <button type="button" class="btn btn-outline-secondary" id="u-mdp-copier"><i class="far fa-copy mr-1" aria-hidden="true"></i>Copier</button>
              </div>
            </div>
            <small id="u-mdp-aide" class="form-text text-muted">Au moins 10 caractères. « Générer » en propose un solide. Il sera affiché une seule fois après l'enregistrement : notez-le ou copiez-le pour le transmettre à la personne.</small>
            <small class="text-danger" data-erreur-pour="mot_de_passe" hidden></small>
          </div>

          <div id="u-compte-bloc" class="adm-compte" hidden>
            <div class="small text-muted mb-2" id="u-connexion"></div>
            <button type="button" class="btn btn-outline-primary mr-2 mb-2" id="u-btn-mdp"><i class="fas fa-key mr-1" aria-hidden="true"></i>Réinitialiser le mot de passe…</button>
            <button type="button" class="btn btn-outline-warning mb-2" id="u-btn-deverrouiller" hidden><i class="fas fa-unlock mr-1" aria-hidden="true"></i>Déverrouiller le compte</button>
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
        <p id="mdp-texte" class="mb-3"></p>
        <div class="form-group mb-2">
          <label for="mdp-champ" id="mdp-etiquette">Mot de passe</label>
          <div class="input-group">
            <input id="mdp-champ" name="mot_de_passe" type="text" class="form-control adm-mdp-champ" maxlength="72" autocomplete="off" spellcheck="false">
            <div class="input-group-append">
              <button type="button" class="btn btn-outline-primary" id="mdp-gen"><i class="fas fa-random mr-1" aria-hidden="true"></i>Générer</button>
              <button type="button" class="btn btn-outline-secondary" id="mdp-copier"><i class="far fa-copy mr-1" aria-hidden="true"></i>Copier</button>
            </div>
          </div>
          <small class="text-danger" data-erreur-pour="mot_de_passe" hidden></small>
        </div>
        <p class="small text-muted mb-0" id="mdp-note"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" id="mdp-annuler">Annuler</button>
        <button type="button" class="btn btn-primary" id="mdp-valider">Réinitialiser le mot de passe</button>
        <button type="button" class="btn btn-primary" id="mdp-fermer" hidden>J'ai noté le mot de passe, fermer</button>
      </div>
    </div></div>
  </div>
</div>
