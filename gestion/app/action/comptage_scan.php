<?php
// Enregistre un scan (ou une quantité tapée) dans un comptage en cours.
// POST : id (comptage), code (code scanné : interne ou alias) OU piece_id (choisie dans la recherche),
//        mode ('ajouter' : ajoute `quantite` à ce qui est compté, défaut ; 'fixer' : remplace), quantite (défaut 1),
//        aveugle ('1' : ne pas renvoyer le stock attendu).
// Employé+ ; droit sur l'entreprise du comptage vérifié par le service. Une seule requête par scan (résolution du code + écriture).
// Réponse : {ok:true, ligne:{piece_id, code, nom, unite, quantite_comptee, (si !aveugle : quantite_actuelle, ecart)}}
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	$d = entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$id = ScanLib::entier(isset($d['id']) ? $d['id'] : null, 'Comptage invalide.', 'id');
	$mode = isset($d['mode']) ? $d['mode'] : 'ajouter';
	if ($mode !== 'ajouter' && $mode !== 'fixer') {
		throw new InventaireException('Mode de comptage invalide.', 'mode');
	}
	$qte = isset($d['quantite']) ? $d['quantite'] : '1';
	if (!is_string($qte) && !is_int($qte) && !is_float($qte)) {
		throw new InventaireException('Quantité invalide.', 'quantite');
	}
	$aveugle = isset($d['aveugle']) ? ScanLib::booleen($d['aveugle']) : true;

	// Quelle pièce ? (le service d'inventaire retire lui-même les coûts ; ici on n'utilise que l'identité)
	if (isset($d['piece_id']) && $d['piece_id'] !== '' && $d['piece_id'] !== null) {
		$pieceId = ScanLib::entier($d['piece_id'], 'Pièce invalide.', 'piece_id');
		$p = $inv->pieceDetail($uid, $pieceId);
	} else {
		$code = isset($d['code']) && is_string($d['code']) ? $d['code'] : '';
		$r = $inv->trouverParCode($uid, $code);
		if ($r === null) {
			$aff = mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', trim($code)), 0, 40);
			throw new InventaireException('Code inconnu : « ' . $aff . ' ». Aucune pièce du catalogue ne porte ce code.', 'code');
		}
		if ($r['type'] === 'emplacement') {
			throw new InventaireException('« ' . $r['emplacement']['nom'] . ' » est un emplacement, pas une pièce : scannez une pièce.', 'code');
		}
		$p = $r['piece'];
	}
	if (!$p['actif']) {
		throw new InventaireException('La pièce « ' . $p['code'] . ' » est désactivée : elle ne peut pas être comptée.', 'code');
	}

	$res = $inv->comptageScanner($uid, $id, (int) $p['id'], $qte, $mode);
	$ligne = array(
		'piece_id' => (int) $p['id'], 'code' => $p['code'], 'nom' => $p['nom'], 'unite' => $p['unite'],
		'quantite_comptee' => $res['quantite_comptee'],
	);
	if (!$aveugle) {
		$st = $pdo->prepare('SELECT COALESCE((SELECT s.quantite FROM stock s WHERE s.piece_id = ? AND s.emplacement_id = c.emplacement_id), 0) FROM comptages c WHERE c.id = ?');
		$st->execute(array((int) $p['id'], $id));
		$actuel = (string) $st->fetchColumn();
		$ligne['quantite_actuelle'] = $actuel;
		$ligne['ecart'] = Dec::fmt(Dec::parse($res['quantite_comptee'], Dec::QTE) - Dec::parse($actuel, Dec::QTE), Dec::QTE);
	}
	return array('ligne' => $ligne);
});
