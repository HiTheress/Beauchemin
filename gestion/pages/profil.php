<?php
// Profil : mes informations et changement de MON mot de passe. Tout utilisateur connecté.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/utilisateur_lib.php';
page_script('assets/js/admin.js');
$st = $pdo->prepare('SELECT nom_utilisateur, nom_complet, role, derniere_connexion FROM utilisateurs WHERE id = ?');
$st->execute(array(utilisateur_id()));
$me = $st->fetch();
$noms_entreprises = array();
foreach (inventaire()->listeEntreprises(utilisateur_id()) as $en) { $noms_entreprises[] = $en['nom']; }
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="profil" data-nom-utilisateur="<?php echo e($me['nom_utilisateur']); ?>">
  <?php page_titre('Mon profil', array('Compte')); ?>
  <section class="content"><div class="container-fluid"><div class="row">
    <div class="col-lg-5">
      <div class="card"><div class="card-header"><h2 class="card-title h5 mb-0">Mes informations</h2></div>
        <div class="card-body">
          <dl class="adm-infos mb-0">
            <dt>Nom d'utilisateur</dt><dd id="profil-nom-utilisateur"><?php echo e($me['nom_utilisateur']); ?></dd>
            <dt>Nom complet</dt><dd id="profil-nom-complet"><?php echo e($me['nom_complet'] !== '' ? $me['nom_complet'] : '—'); ?></dd>
            <dt>Rôle</dt><dd id="profil-role"><?php echo e(ROLES_FR[$me['role']]); ?>
              <small class="d-block text-muted"><?php echo e(Admin::ROLES_AIDE[$me['role']]); ?></small></dd>
            <dt>Entreprises</dt><dd id="profil-entreprises"><?php echo $me['role'] === 'admin' ? 'Toutes les entreprises' : e($noms_entreprises ? implode(', ', $noms_entreprises) : 'Aucune entreprise active'); ?></dd>
            <dt>Dernière connexion</dt><dd id="profil-connexion"><?php echo e($me['derniere_connexion'] ? $me['derniere_connexion'] : '—'); ?></dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="col-lg-7">
      <div class="card"><div class="card-header"><h2 class="card-title h5 mb-0">Changer mon mot de passe</h2></div>
        <div class="card-body">
          <div class="alert alert-success" role="status" id="profil-succes" tabindex="-1" hidden></div>
          <div class="alert alert-danger" role="alert" id="profil-erreur" hidden></div>
          <form id="form-profil" novalidate autocomplete="off">
            <input type="text" name="username" value="<?php echo e($me['nom_utilisateur']); ?>" autocomplete="username" class="sr-only" tabindex="-1" aria-hidden="true" readonly>
            <div class="form-group">
              <label for="p-actuel">Mot de passe actuel</label>
              <input id="p-actuel" name="actuel" type="password" class="form-control" autocomplete="current-password" maxlength="200">
              <small class="text-danger" data-erreur-pour="actuel" hidden></small>
            </div>
            <div class="form-group">
              <label for="p-nouveau">Nouveau mot de passe</label>
              <input id="p-nouveau" name="nouveau" type="password" class="form-control" autocomplete="new-password" maxlength="72" aria-describedby="p-nouveau-aide">
              <small id="p-nouveau-aide" class="form-text text-muted">Au moins 10 caractères. Évitez votre nom et les mots de passe déjà utilisés ailleurs.</small>
              <small class="text-danger" data-erreur-pour="nouveau" hidden></small>
            </div>
            <div class="form-group">
              <label for="p-confirmation">Confirmer le nouveau mot de passe</label>
              <input id="p-confirmation" name="confirmation" type="password" class="form-control" autocomplete="new-password" maxlength="72">
              <small class="text-danger" data-erreur-pour="confirmation" hidden></small>
            </div>
            <div class="custom-control custom-checkbox adm-case mb-3">
              <input type="checkbox" class="custom-control-input" id="p-voir">
              <label class="custom-control-label" for="p-voir">Afficher les mots de passe saisis</label>
            </div>
            <button type="submit" class="btn btn-primary" id="profil-enregistrer"><i class="fas fa-key mr-1" aria-hidden="true"></i> Changer le mot de passe</button>
          </form>
        </div>
      </div>
    </div>
  </div></div></section>
</div>
