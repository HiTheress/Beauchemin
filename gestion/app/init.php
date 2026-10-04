<?php

require_once('config/config.php');

// Classes (ordre : les exceptions et utilitaires avant ceux qui les utilisent)
require_once 'classes/InventaireException.php';
require_once 'classes/Dec.php';
require_once 'classes/Journal.php';
require_once 'classes/Inventaire.php';
require_once 'classes/User.php';
require_once 'classes/DataTable.php';
require_once 'classes/Code128.php';
require_once 'database/connection.php';
require_once 'functions.php';

// En-têtes de sécurité
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

// Session durcie (8 h d'inactivité avant déconnexion : un quart de travail ; identifiants de session non devinables)
ini_set('session.use_strict_mode', '1');
ini_set('session.gc_maxlifetime', '28800');
session_set_cookie_params(array(
	'lifetime' => 0,
	'path' => '/',
	'httponly' => true,
	'samesite' => 'Lax',
	'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
));
session_start();

global $pdo;
$Ouser = new User($pdo);

// Jeton CSRF (un par session)
if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Garde : tout script appelé par AJAX/action doit être connecté (sauf login/logout)
$script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
$isEndpoint = (bool) preg_match('#/app/(action|ajax)/[^/]+\.php$#', $script);
$publicEndpoints = array('login.php', 'logout.php');
if ($isEndpoint) {
	$name = basename($script);
	$isPublic = in_array($name, $publicEndpoints, true);
	if (!$isPublic && !$Ouser->is_login()) {
		http_response_code(401);
		header('Content-Type: application/json; charset=utf-8');
		exit(json_encode(array('ok' => false, 'erreur' => 'Session expirée. Veuillez vous reconnecter.')));
	}
	if ($_SERVER['REQUEST_METHOD'] === 'POST' && $name !== 'logout.php') {
		$sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
		if (!is_string($sent) || !hash_equals($_SESSION['csrf_token'], $sent)) {
			http_response_code(403);
			header('Content-Type: application/json; charset=utf-8');
			exit(json_encode(array('ok' => false, 'erreur' => 'Jeton de sécurité invalide. Rechargez la page.')));
		}
	}
}
