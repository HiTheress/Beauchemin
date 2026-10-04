<?php require_once 'inc/header.php'; ?>
<?php require_once 'inc/sidebar.php'; ?>

  <!-- Content Wrapper. Contains page content -->

  <?php 
        if (isset($_GET['page']) && is_string($_GET['page']) && preg_match('/^[a-z0-9_]+$/i', $_GET['page'])) {
          $page ='pages/' .$_GET['page'].'.php';

        }else{
          $page = 'pages/dashboard.php';
        }
        if (file_exists($page)) {
          require_once $page; 
        }else{
          require_once 'pages/error_page.php';
        }
 ?>
  <!-- Control Sidebar -->
  <aside class="control-sidebar control-sidebar-dark">
    <!-- Control sidebar content goes here -->
  </aside>
  <!-- /.control-sidebar -->

 <?php require_once 'inc/footer.php'; ?>