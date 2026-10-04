<?php
require_once 'inc/header.php';
require_once 'inc/sidebar.php';

$fichier = 'pages/' . $page_courante . '.php';
if (!is_file($fichier)) {
  $fichier = 'pages/error_page.php';
}
include $fichier;

require_once 'inc/footer.php';
