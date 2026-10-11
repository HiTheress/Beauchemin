<?php
require_once 'app/init.php';
if ($Ouser->is_login()) {
  header("location:index.php"); exit;
}
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
</head>
<body class="hold-transition login-page">
<div class="connexion">
  <section class="connexion-marques" aria-label="Entreprises">
    <div class="connexion-logos">
      <div class="bloc"><img src="assets/img/logo-beauchemin.png" alt="Beauchemin — Mazout et propane"></div>
      <div class="bloc rouge"><img src="assets/img/logo-boutique-chaleur.png" alt="Boutique Chaleur"></div>
    </div>
    <h1>Savoir où sont les pièces, en tout temps.</h1>
    <p>Inventaire des entrepôts, des boutiques et des cubes de service de Beauchemin et de Boutique Chaleur.</p>
  </section>
  <section class="connexion-formulaire">
    <div class="carte">
      <h2>Connexion</h2>
      <p class="sous-titre">Entrez votre nom d'utilisateur et votre mot de passe.</p>
      <?php if ($erreur) { ?>
        <div class="alert alert-danger text-center" role="alert"><?php echo e($erreur); ?></div>
      <?php } ?>
      <form action="app/action/login.php" method="post" autocomplete="on">
        <input type="hidden" name="csrf_token" value="<?php echo e($_SESSION['csrf_token']); ?>">
        <div class="input-group mb-3">
          <input type="text" name="username" class="form-control" placeholder="Nom d'utilisateur" aria-label="Nom d'utilisateur" autocomplete="username" autofocus required>
          <div class="input-group-append"><div class="input-group-text"><span class="fas fa-user"></span></div></div>
        </div>
        <div class="input-group mb-3">
          <input type="password" name="password" class="form-control" placeholder="Mot de passe" aria-label="Mot de passe" autocomplete="current-password" required>
          <div class="input-group-append"><div class="input-group-text"><span class="fas fa-lock"></span></div></div>
        </div>
        <button type="submit" name="admin_login" value="1" class="btn btn-primary btn-block">Se connecter</button>
      </form>
    </div>
  </section>
</div>
</body>
</html>
