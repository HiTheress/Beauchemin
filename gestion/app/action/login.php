<?php 
	require_once '../init.php';

	if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['admin_login'])) {
		$Ouser->login($_POST['username'] ?? '', $_POST['password'] ?? '');
	}
	redirect("login.php");
 ?>
