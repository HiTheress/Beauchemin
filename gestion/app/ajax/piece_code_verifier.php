<?php
// Vérifie qu'un code est libre (gestionnaire+). GET : code, role ('interne'|'alias'), piece_id (0 = nouvelle pièce).
// Réponse : {disponible:true, code} ou {disponible:false, message:<qui l'utilise déjà>}. Aide à la saisie : piece_save revérifie tout.
require_once __DIR__ . '/../action/piece_lib.php';
endpoint(function () {
	inventaire()->exiger(utilisateur_id(), 'catalogue');
	$in = $_GET + entree();
	$interne = (isset($in['role']) && $in['role'] === 'interne');
	$pid = Catalogue::entier(isset($in['piece_id']) ? $in['piece_id'] : 0);
	try {
		if ($interne) {
			$code = Catalogue::codeInterne(array('code' => isset($in['code']) ? $in['code'] : ''));
		} else {
			$code = Catalogue::codeAlias(isset($in['code']) ? $in['code'] : '');
		}
		Catalogue::exigerCodeLibre($code, $pid, $interne ? 'code' : 'codes');
		return array('disponible' => true, 'code' => $code);
	} catch (InventaireException $ex) {
		return array('disponible' => false, 'message' => $ex->getMessage());
	}
});
