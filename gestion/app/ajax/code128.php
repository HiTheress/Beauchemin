<?php
// Image SVG d'un code-barres Code 128 : GET app/ajax/code128.php?texte=P-0001[&module=2&hauteur=60&sans_texte=1]
require_once '../init.php';
$texte = (isset($_GET['texte']) && is_string($_GET['texte'])) ? $_GET['texte'] : '';
if (!Code128::valide($texte)) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Texte invalide pour un code-barres (ASCII imprimable, 1 à 40 caractères).');
}
header('Content-Type: image/svg+xml; charset=utf-8');
header('Cache-Control: private, max-age=86400');
echo Code128::svg($texte, array(
	'module' => (isset($_GET['module']) && is_scalar($_GET['module'])) ? max(1, min(6, (int) $_GET['module'])) : 2,
	'hauteur' => (isset($_GET['hauteur']) && is_scalar($_GET['hauteur'])) ? max(10, min(300, (int) $_GET['hauteur'])) : 60,
	'texte' => empty($_GET['sans_texte']),
));
