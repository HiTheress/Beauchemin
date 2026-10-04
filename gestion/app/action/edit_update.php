<?php 
	require_once '../init.php';

	// Changement de mot de passe : seulement le sien, sauf pour un administrateur
	$user_id = (int) ($_POST['user_id'] ?? 0);
	$password = $_POST['password'] ?? '';
	$c_password = $_POST['c_password'] ?? '';

	if ($user_id !== (int) $_SESSION['user_id'] && !$Ouser->is_admin()) {
		http_response_code(403);
		exit("Action non permise");
	}

	if ($password === '') {
		exit("Entrez un mot de passe");
	}
	if ($password !== $c_password) {
		exit("Les mots de passe ne correspondent pas");
	}
	if (strlen($password) < 8) {
		exit("Le mot de passe doit contenir au moins 8 caractères");
	}

	$res = $obj->update('user', 'id', $user_id, array('password' => password_hash($password, PASSWORD_DEFAULT)));
	echo $res ? "yes" : "Échec de la mise à jour du mot de passe";
 ?>
