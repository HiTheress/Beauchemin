<?php
require_once 'app/init.php';
if ($Ouser->is_login()) {
  header("location:index.php"); exit;
}
$erreur = $_SESSION['login_error'] ?? null;
unset($_SESSION['login_error']);
?>
<!DOCTYPE html>
<html lang="fr-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>Beauchemin — Connexion</title>
  <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
  <link rel="stylesheet" href="dist/css/adminlte.min.css">
  <link rel="stylesheet" href="assets/css/beauchemin.css">
</head>
<body class="hold-transition login-page">
<div class="login-box">
  <div class="login-logo">
    <i class="fas fa-fire-alt text-warning"></i> <b>Beauchemin</b>
    <div class="h6 text-muted mt-1">Gestion d'inventaire · Boutique Chaleur</div>
  </div>
  <div class="card">
    <div class="card-body login-card-body">
      <p class="login-box-msg">Connectez-vous pour continuer</p>
      <?php if ($erreur) { ?>
        <div class="alert alert-danger text-center" role="alert"><?php echo e($erreur); ?></div>
      <?php } ?>
      <form action="app/action/login.php" method="post" autocomplete="on">
        <input type="hidden" name="csrf_token" value="<?php echo e($_SESSION['csrf_token']); ?>">
        <div class="input-group mb-3">
          <input type="text" name="username" class="form-control" placeholder="Nom d'utilisateur" autocomplete="username" autofocus required>
          <div class="input-group-append"><div class="input-group-text"><span class="fas fa-user"></span></div></div>
        </div>
        <div class="input-group mb-3">
          <input type="password" name="password" class="form-control" placeholder="Mot de passe" autocomplete="current-password" required>
          <div class="input-group-append"><div class="input-group-text"><span class="fas fa-lock"></span></div></div>
        </div>
        <button type="submit" name="admin_login" value="1" class="btn btn-primary btn-block">Connexion</button>
      </form>
    </div>
  </div>
</div>
</body>
</html>
