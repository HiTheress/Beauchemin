<?php
require_once 'app/init.php';
if ($Ouser->is_login()) {
  header("location:index.php"); exit;
}
require_once 'inc/mascotte.php';
$erreur = $_SESSION['login_error'] ?? null;
unset($_SESSION['login_error']);
?>
<!DOCTYPE html>
<html lang="fr-CA" data-marque="neutre">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="assets/img/icone-beauchemin.svg">
  <title>Beauchemin — Connexion</title>
  <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
  <link rel="stylesheet" href="dist/css/adminlte.min.css">
  <link rel="stylesheet" href="assets/css/beauchemin.css">
  <link rel="stylesheet" href="assets/css/theme.css">
  <link rel="stylesheet" href="assets/css/mascotte.css">
</head>
<body class="hold-transition login-page">
<div class="connexion" id="connexion">
  <section class="connexion-image">
    <img src="assets/img/connexion-beauchemin-chaleur.webp" width="1254" height="1254" alt="Beauchemin, mazout et propane — Boutique Chaleur">
  </section>
  <section class="connexion-formulaire">
    <div class="carte">
      <h1>Connexion</h1>
      <?php if ($erreur) { ?>
        <div class="alert alert-danger text-center" role="alert"><?php echo e($erreur); ?></div>
      <?php } ?>
      <form action="app/action/login.php" method="post" autocomplete="on" id="form-connexion">
        <input type="hidden" name="csrf_token" value="<?php echo e($_SESSION['csrf_token']); ?>">
        <div class="form-group">
          <label for="champ-nom">Nom d'utilisateur</label>
          <input id="champ-nom" type="text" name="username" class="form-control" autocomplete="username" autocapitalize="none" autofocus required>
        </div>
        <div class="form-group">
          <label for="champ-mdp">Mot de passe</label>
          <input id="champ-mdp" type="password" name="password" class="form-control" autocomplete="current-password" required>
        </div>
        <button type="submit" name="admin_login" value="1" class="btn btn-primary btn-block" id="bouton-connexion">Se connecter</button>
      </form>
    </div>
  </section>
</div>
<div id="chargement" role="status" aria-live="polite" aria-label="Connexion en cours"><?php mascotte_html(); ?><div class="chargement-texte">Connexion…</div></div>
<?php mascotte_modele(); ?>
<script src="assets/js/connexion.js"></script>
<script src="assets/js/mascotte.js"></script>
</body>
</html>
