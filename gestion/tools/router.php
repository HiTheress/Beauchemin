<?php
// Routeur du serveur de développement (php -S ... tools/router.php).
// Reproduit les mêmes interdictions que .htaccess / nginx en production : on ne doit pouvoir appeler directement
// ni les gabarits (pages/, inc/), ni les classes, ni la configuration, ni les outils, tests et schémas.
$chemin = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$interdit = '#(^|/)(pages|inc|tests|tools|docs|database|deploy)(/|$)|(^|/)app/(classes|config|database)(/|$)|(^|/)app/(functions|init)\.php$|(^|/)\.[^/]#';
if (preg_match($interdit, $chemin) || strpos($chemin, "\0") !== false) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Introuvable.';
	return true;
}
// Comme en production : aucune erreur PHP affichée au navigateur (elles vont au journal).
ini_set('display_errors', '0');
ini_set('log_errors', '1');
return false;   // laisse le serveur servir le fichier demandé
