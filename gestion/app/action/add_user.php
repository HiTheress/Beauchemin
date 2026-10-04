<?php 
	require_once '../init.php';

	if (!$Ouser->is_admin()) {
		http_response_code(403);
		exit("Réservé à l'administrateur");
	}

	$username = trim($_POST['username'] ?? '');
	$password = $_POST['password'] ?? '';
	$role = in_array($_POST['user_role'] ?? '', array('admin', 'employe'), true) ? $_POST['user_role'] : 'employe';

	if ($username === '' || strlen($password) < 8) {
		exit("Nom d'utilisateur requis et mot de passe d'au moins 8 caractères");
	}
	if ($obj->find('user', 'username', $username)) {
		exit("Ce nom d'utilisateur existe déjà");
	}

	$res = $obj->create('user', array(
		'username' => $username,
		'password' => password_hash($password, PASSWORD_DEFAULT),
		'user_role' => $role,
		'update_by' => $_SESSION['user_id'],
	));
	echo $res ? "true" : "Échec de l'ajout";
 ?>
