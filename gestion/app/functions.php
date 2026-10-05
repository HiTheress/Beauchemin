<?php

// ---------------------------------------------------------------------------
//  Utilitaires communs (pages, endpoints JSON, formats français)
// ---------------------------------------------------------------------------

function redirect($path){
	header("location: " . SITE_ROOT . $path);
	exit;
}

/** Échappe pour HTML (à utiliser pour TOUTE valeur affichée). */
function e($s){
	return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Données envoyées par le navigateur : corps JSON si Content-Type JSON, sinon $_POST. */
function entree(){
	static $cache = null;
	if ($cache !== null) {
		return $cache;
	}
	$type = $_SERVER['CONTENT_TYPE'] ?? '';
	if (stripos($type, 'application/json') !== false) {
		$brut = file_get_contents('php://input');
		$j = json_decode($brut, true);
		$cache = is_array($j) ? $j : array();
	} else {
		$cache = $_POST;
	}
	return $cache;
}

/** Réponse JSON de succès et fin du script. */
function json_ok($data = array(), $status = 200){
	http_response_code($status);
	header('Content-Type: application/json; charset=utf-8');
	header('Cache-Control: no-store');
	echo json_encode(array('ok' => true) + (array) $data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
	exit;
}

/** Réponse JSON d'erreur (message en français affichable) et fin du script. */
function json_fail($message, $status = 400, $extra = array()){
	http_response_code($status);
	header('Content-Type: application/json; charset=utf-8');
	header('Cache-Control: no-store');
	echo json_encode(array('ok' => false, 'erreur' => $message) + $extra, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
	exit;
}

/** Début d'un endpoint d'écriture : exige POST. */
function exiger_post(){
	if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
		header('Allow: POST');
		json_fail('Méthode non permise.', 405);
	}
}

/** Service d'inventaire du script courant. */
function inventaire(){
	global $pdo;
	static $svc = null;
	if ($svc === null) {
		$svc = new Inventaire($pdo);
	}
	return $svc;
}

/** Id de l'utilisateur connecté (ou 0). */
function utilisateur_id(){
	return (int) ($_SESSION['user_id'] ?? 0);
}

/**
 * Exécute $fn() dans un endpoint : InventaireException -> 400 avec message, autre erreur -> 500 générique.
 * $fn retourne le tableau de données de la réponse.
 */
function endpoint($fn){
	try {
		$data = $fn();
		json_ok(is_array($data) ? $data : array());
	} catch (InventaireException $ex) {
		json_fail($ex->getMessage(), 400, $ex->champ ? array('champ' => $ex->champ) : array());
	} catch (Throwable $ex) {
		error_log('Endpoint ' . ($_SERVER['SCRIPT_NAME'] ?? '') . ' : ' . $ex);
		json_fail('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
	}
}

/** En-tête de page standard (titre + fil d'Ariane). */
function page_titre($titre, array $fil = array()){
	echo '<div class="content-header"><div class="container-fluid"><div class="row mb-2">';
	echo '<div class="col-sm-7"><h1 class="m-0 text-dark">' . e($titre) . '</h1></div>';
	echo '<div class="col-sm-5"><ol class="breadcrumb float-sm-right"><li class="breadcrumb-item"><a href="index.php">Accueil</a></li>';
	foreach ($fil as $f) {
		echo '<li class="breadcrumb-item active">' . e($f) . '</li>';
	}
	echo '</ol></div></div></div></div>';
}

/**
 * Contrôle d'accès d'une page. Retourne false (et affiche un message) si le rôle est insuffisant ;
 * la page doit alors faire `return;`.
 */
function acces_page($roleMin){
	global $Ouser;
	if ($Ouser->aRole($roleMin)) {
		return true;
	}
	echo '<div class="content-wrapper"><div class="content"><div class="container-fluid mt-4"><div class="alert alert-danger">Vous n\'avez pas la permission d\'accéder à cette page.</div></div></div></div>';
	return false;
}

/** Ajoute un script JS de page (chargé par le pied de page, après jQuery). */
function page_script($chemin){
	global $page_scripts;
	if (!isset($page_scripts)) {
		$page_scripts = array();
	}
	$page_scripts[] = $chemin;
}

/** Entreprise sélectionnée dans la barre du haut : id, ou 0 = toutes celles auxquelles l'utilisateur a accès. */
function entreprise_courante(){
	global $Ouser;
	$permises = $Ouser->entreprisesAutorisees();
	$id = (int) ($_SESSION['entreprise_id'] ?? 0);
	if ($id && in_array($id, $permises, true)) {
		return $id;
	}
	return count($permises) === 1 ? $permises[0] : 0;
}

/** Entreprises à utiliser comme filtre : [id courant] ou toutes celles permises. */
function entreprises_filtre(){
	global $Ouser;
	$c = entreprise_courante();
	return $c ? array($c) : $Ouser->entreprisesAutorisees();
}

// ---- formats français ------------------------------------------------------

/** "1234.5000" -> "1 234,50 $" */
function fmt_argent($s, $decimales = 2){
	if ($s === null || $s === '') {
		return '';
	}
	return fmt_nombre($s, $decimales) . "\xc2\xa0$";
}

/**
 * Nombre décimal exact (chaîne) -> format fr-CA ("1 234,56"), espace insécable comme séparateur de milliers.
 * $decimales null = enlève les zéros inutiles ; sinon arrondi « demi vers le haut » (en valeur absolue), comme Dec.
 */
function fmt_nombre($s, $decimales = null){
	if ($s === null || $s === '') {
		return '';
	}
	$s = (string) $s;
	$neg = ($s[0] === '-');
	$s = ltrim($s, '+-');
	$parts = explode('.', $s, 2);
	$ent = ltrim($parts[0], '0');
	$frac = isset($parts[1]) ? $parts[1] : '';
	if ($decimales === null) {
		$frac = rtrim($frac, '0');
	} else {
		if (strlen($frac) > $decimales) {
			$monter = ((int) $frac[$decimales] >= 5);
			$frac = substr($frac, 0, $decimales);
			if ($monter) {
				$chiffres = ($ent === '' ? '0' : $ent) . $frac;           // ex. 1234,5678 -> "123457" après arrondi à 2
				$chiffres = ltrim(bcadd_chaine($chiffres, '1'), '0');
				$chiffres = str_pad($chiffres, $decimales + 1, '0', STR_PAD_LEFT);
				$ent = $decimales > 0 ? substr($chiffres, 0, -$decimales) : $chiffres;
				$frac = $decimales > 0 ? substr($chiffres, -$decimales) : '';
				$ent = ltrim($ent, '0');
			}
		}
		$frac = str_pad($frac, $decimales, '0');
	}
	$ent = $ent === '' ? '0' : $ent;
	$ent = preg_replace('/\B(?=(\d{3})+(?!\d))/', "\xc2\xa0", $ent);   // octets ASCII-sûrs : jamais de strrev sur de l'UTF-8
	$vide = (trim($ent . $frac, "0\xc2\xa0") === '');
	return (($neg && !$vide) ? '-' : '') . $ent . ($frac !== '' ? ',' . $frac : '');
}

/** +1 sur une chaîne de chiffres (sans extension bcmath). */
function bcadd_chaine($chiffres, $un){
	$i = strlen($chiffres) - 1;
	while ($i >= 0) {
		if ($chiffres[$i] === '9') {
			$chiffres[$i] = '0';
			$i--;
		} else {
			$chiffres[$i] = (string) ((int) $chiffres[$i] + 1);
			return $chiffres;
		}
	}
	return '1' . $chiffres;
}

function fmt_date($d){
	if (!$d) {
		return '';
	}
	$t = strtotime($d);
	return $t ? date('Y-m-d', $t) : e($d);
}

const MOIS_FR = array(1 => 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre');

const ROLES_FR = array('admin' => 'Administrateur', 'gestionnaire' => 'Gestionnaire', 'employe' => 'Employé');
const TYPES_EMPLACEMENT_FR = array('entrepot' => 'Entrepôt', 'boutique' => 'Boutique', 'cube' => 'Cube de service');
const TYPES_DOCUMENT_FR = array(
	'reception' => 'Réception', 'transfert' => 'Transfert', 'sortie' => 'Sortie',
	'ajustement' => 'Ajustement', 'facture_interne' => 'Facture interne',
);
