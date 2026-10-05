<?php
// Page « Scanner / Chercher » : résout un code scanné (ou un identifiant de pièce choisi dans la recherche) et renvoie la fiche.
// GET/POST : code (pièce : code interne ou alias ; emplacement : EMP-…)   OU   piece_id.
// Réponse : {ok:true, trouve:false}
//        ou {ok:true, trouve:true, type:'piece', piece:{…comme scan_code.php…, minimums:[{entreprise_id, entreprise, minimum, quantite, sous_minimum}]}}
//        ou {ok:true, trouve:true, type:'emplacement', emplacement:{id, nom, type, type_libelle, entreprise_id, entreprise_nom}}
// Employé+. Coûts et prix fournisseurs : seulement pour un gestionnaire+ (c'est le service d'inventaire qui les retire). Les quantités
// ne portent que sur les entreprises de l'utilisateur.
require_once '../init.php';
require_once __DIR__ . '/scanner_lib.php';
endpoint(function () {
	global $pdo, $Ouser;
	$in = $_GET + entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$inv->exiger($uid, 'consulter');

	if (isset($in['piece_id']) && $in['piece_id'] !== '') {
		$pid = ScanLib::entier($in['piece_id'], 'Pièce invalide.', 'piece_id');
		$r = array('type' => 'piece', 'piece' => $inv->pieceDetail($uid, $pid));
	} else {
		$r = $inv->trouverParCode($uid, isset($in['code']) && is_string($in['code']) ? $in['code'] : '');
		if ($r === null) {
			return array('trouve' => false);
		}
	}

	if ($r['type'] === 'piece') {
		// Minimums (par entreprise accessible) et alerte « sous le minimum » : une entreprise sans stock du tout est aussi sous son minimum.
		$p = $r['piece'];
		$qte = array();
		foreach ($p['totaux'] as $t) {
			$qte[(int) $t['entreprise_id']] = $t['quantite'];
		}
		$ents = array_map('intval', $Ouser->entreprisesAutorisees());
		$p['minimums'] = array();
		if ($ents) {
			$ph = implode(',', array_fill(0, count($ents), '?'));
			$st = $pdo->prepare(
				"SELECT se.entreprise_id, en.nom AS entreprise, se.minimum
				   FROM seuils se JOIN entreprises en ON en.id = se.entreprise_id
				  WHERE se.piece_id = ? AND se.minimum > 0 AND se.entreprise_id IN ($ph) ORDER BY se.entreprise_id"
			);
			$st->execute(array_merge(array((int) $p['id']), $ents));
			foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $m) {
				$q = isset($qte[(int) $m['entreprise_id']]) ? $qte[(int) $m['entreprise_id']] : '0.000';
				$p['minimums'][] = array(
					'entreprise_id' => (int) $m['entreprise_id'],
					'entreprise' => $m['entreprise'],
					'minimum' => $m['minimum'],
					'quantite' => $q,
					'sous_minimum' => Dec::parse($q, Dec::QTE) < Dec::parse($m['minimum'], Dec::QTE),
				);
			}
		}
		$r['piece'] = $p;
	} else {
		$r['emplacement']['type_libelle'] = isset(TYPES_EMPLACEMENT_FR[$r['emplacement']['type']]) ? TYPES_EMPLACEMENT_FR[$r['emplacement']['type']] : $r['emplacement']['type'];
	}
	return array('trouve' => true) + $r;
});
