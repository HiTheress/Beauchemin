<?php
// Fuseau horaire (Québec)
date_default_timezone_set("America/Toronto");

// Réglages locaux : copier config.local.example.php vers config.local.php
// (jamais versionné) ou utiliser des variables d'environnement.
if (is_file(__DIR__ . '/config.local.php')) {
	require __DIR__ . '/config.local.php';
}

function cfg($name, $default) {
	$v = getenv($name);
	return $v === false ? $default : $v;
}

defined('DATABASE_HOST') || define('DATABASE_HOST', cfg('DB_HOST', 'localhost'));
defined('DATABASE_USER') || define('DATABASE_USER', cfg('DB_USER', 'root'));
defined('DATABASE_NAME') || define('DATABASE_NAME', cfg('DB_NAME', 'beauchemin'));
defined('DATABASE_PASS') || define('DATABASE_PASS', cfg('DB_PASS', ''));

// URL de base, déduite de la requête (se termine toujours par "/")
if (!defined('SITE_ROOT')) {
	$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
	$dir = rtrim(dirname(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/'))), '/\\');
	// Les scripts sous /app/action, /app/ajax... sont 3 niveaux plus bas que la racine
	if (!preg_match('#/app/(action|ajax|invoice)/#', $_SERVER['SCRIPT_NAME'] ?? '')) {
		$dir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/\\');
	}
	define('SITE_ROOT', ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $dir . '/');
}
