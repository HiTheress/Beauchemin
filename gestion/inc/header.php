<?php
require_once 'app/init.php';
if (!$Ouser->is_login()) {
  header("location:login.php"); exit;
}
$page_courante = (isset($_GET['page']) && is_string($_GET['page']) && preg_match('/^[a-z0-9_]+$/i', $_GET['page'])) ? $_GET['page'] : 'dashboard';
$moi = $Ouser->courant();
$mes_entreprises = inventaire()->listeEntreprises(utilisateur_id());
$entreprise_active = entreprise_courante();
// Identité visuelle : couleurs et logo de l'entreprise active (« neutre » = toutes les entreprises)
$marque = 'neutre';
foreach ($mes_entreprises as $en) {
  if ((int) $en['id'] === $entreprise_active) { $c = strtolower((string) ($en['code'] ?? '')); $marque = ($c === 'bea' || $c === 'bch') ? $c : 'neutre'; }
}
$marque_slug = array('bea' => 'beauchemin', 'bch' => 'boutique-chaleur');
?>
<!DOCTYPE html>
<html lang="fr-CA" data-marque="<?php echo e($marque); ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="assets/img/icone-<?php echo $marque === 'bch' ? 'boutique-chaleur' : 'beauchemin'; ?>.svg">
  <title>Beauchemin — Gestion d'inventaire</title>
  <meta name="csrf-token" content="<?php echo e($_SESSION['csrf_token']); ?>">

  <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
  <link rel="stylesheet" href="plugins/overlayScrollbars/css/OverlayScrollbars.min.css">
  <link rel="stylesheet" href="plugins/datatables-bs4/css/dataTables.bootstrap4.min.css">
  <link rel="stylesheet" href="plugins/select2/css/select2.min.css">
  <link rel="stylesheet" href="dist/css/adminlte.min.css">
  <link rel="stylesheet" href="<?php echo asset('assets/css/beauchemin.css'); ?>">
  <link rel="stylesheet" href="<?php echo asset('assets/css/theme.css'); ?>">
  <link rel="stylesheet" href="<?php echo asset('assets/css/mascotte.css'); ?>">
</head>
<body class="hold-transition sidebar-mini layout-fixed layout-navbar-fixed">

<div class="wrapper">
  <nav class="main-header navbar navbar-expand navbar-white navbar-light no-print">
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" data-widget="pushmenu" href="#" role="button" aria-label="Menu"><i class="fas fa-bars"></i></a>
      </li>
    </ul>

    <ul class="navbar-nav ml-auto align-items-center">
      <?php if (count($mes_entreprises) > 0) { ?>
      <li class="nav-item mr-3">
        <label for="entreprise-courante" class="sr-only">Entreprise</label>
        <select id="entreprise-courante" class="form-control form-control-sm">
          <?php if (count($mes_entreprises) > 1) { ?>
            <option value="0"<?php echo $entreprise_active === 0 ? ' selected' : ''; ?>>Toutes les entreprises</option>
          <?php } ?>
          <?php foreach ($mes_entreprises as $en) { ?>
            <option value="<?php echo (int) $en['id']; ?>"<?php echo $entreprise_active === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option>
          <?php } ?>
        </select>
      </li>
      <?php } ?>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button">
          <i class="fas fa-user-circle"></i>
          <span class="d-none d-sm-inline"><?php echo e($moi['nom_complet'] !== '' ? $moi['nom_complet'] : $moi['nom_utilisateur']); ?></span>
          <small class="text-muted d-none d-md-inline">(<?php echo e(ROLES_FR[$moi['role']]); ?>)</small>
        </a>
        <div class="dropdown-menu dropdown-menu-right">
          <a href="index.php?page=profil" class="dropdown-item"><i class="fas fa-key mr-2"></i> Mon profil</a>
          <div class="dropdown-divider"></div>
          <a href="app/action/logout.php" class="dropdown-item"><i class="fas fa-sign-out-alt mr-2"></i> Déconnexion</a>
        </div>
      </li>
    </ul>
  </nav>
