<?php
$dsn = "mysql:host=" . DATABASE_HOST . ";dbname=" . DATABASE_NAME . ";charset=utf8mb4";

try {
	$pdo = new PDO($dsn, DATABASE_USER, DATABASE_PASS, array(
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
	));
} catch (PDOException $e) {
	error_log('DB connection error: ' . $e->getMessage());
	http_response_code(500);
	exit('Erreur de connexion à la base de données.');
}
