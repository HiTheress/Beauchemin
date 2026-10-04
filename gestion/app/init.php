<?php

require_once('config/config.php');

// including the classes
require_once 'database/connection.php';
require_once 'classes/Object.php';
require_once 'classes/User.php';

//include the function
require_once 'functions.php';

// Session durcie
session_set_cookie_params(array(
	'lifetime' => 0,
	'path' => '/',
	'httponly' => true,
	'samesite' => 'Lax',
	'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
));
session_start();

// making global objects
global $pdo;
$obj = new Objects($pdo);
$Ouser = new User($pdo);

// Jeton CSRF (un par session)
if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Garde : tout script appelé par AJAX/action doit être connecté (sauf login/logout)
$script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
$isEndpoint = (bool) preg_match('#/app/(action|ajax|invoice)/[^/]+\.php$#', $script);
$publicEndpoints = array('login.php', 'logout.php');
if ($isEndpoint) {
	$name = basename($script);
	$isPublic = in_array($name, $publicEndpoints, true);
	if (!$isPublic && empty($_SESSION['user_id'])) {
		http_response_code(401);
		exit('Non autorisé. Veuillez vous reconnecter.');
	}
	if ($_SERVER['REQUEST_METHOD'] === 'POST' && $name !== 'logout.php') {
		$sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
		if (!is_string($sent) || !hash_equals($_SESSION['csrf_token'], $sent)) {
			http_response_code(403);
			exit('Jeton de sécurité invalide. Rechargez la page.');
		}
	}
}
