<?php
// « Qu'est-ce qu'il y a dans mon cube ? » : tout ce que contient un emplacement.
// GET/POST : emplacement_id.
// Réponse : {ok:true, emplacement:{id, nom, type, type_libelle, actif, entreprise_id, entreprise_nom, code_barres},
//            lignes:[{piece_id, code, nom, unite, actif, quantite, (gestionnaire+ : cout_moyen, valeur)}],
//            nb_pieces, (gestionnaire+ : valeur_totale), comptage_en_cours:{id, numero}|null}
// Employé+. L'emplacement doit appartenir à une entreprise de l'utilisateur (même réponse « introuvable » sinon).
// Un employé ne reçoit ni coût moyen ni valeur : ces champs ne sont ni calculés ni envoyés.
require_once '../init.php';
require_once __DIR__ . '/scanner_lib.php';
endpoint(function () {
	global $pdo, $Ouser;
	$in = $_GET + entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$inv->exiger($uid, 'consulter');
	$id = ScanLib::entier(isset($in['emplacement_id']) ? $in['emplacement_id'] : null, 'Emplacement invalide.', 'emplacement_id');
	$emp = ScanLib::emplacementAccessible($id);
	$couts = $Ouser->peutVoirCouts();

	$sql = 'SELECT p.id AS piece_id, p.code, p.nom, p.unite, p.actif, s.quantite' . ($couts ? ', COALESCE(sc.cout_moyen, 0) AS cout_moyen' : '') . '
	          FROM stock s JOIN pieces p ON p.id = s.piece_id'
	     . ($couts ? ' LEFT JOIN stock_couts sc ON sc.entreprise_id = ? AND sc.piece_id = p.id' : '') . '
	         WHERE s.emplacement_id = ? AND s.quantite > 0 ORDER BY p.code';
	$st = $pdo->prepare($sql);
	$st->execute($couts ? array((int) $emp['entreprise_id'], (int) $emp['id']) : array((int) $emp['id']));
	$lignes = array();
	foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $l) {
		$l['piece_id'] = (int) $l['piece_id'];
		$l['actif'] = (bool) $l['actif'];
		if ($couts) {
			$l['valeur'] = Dec::fmt(Dec::totalLigne(Dec::parse($l['quantite'], Dec::QTE), Dec::parse($l['cout_moyen'], Dec::COUT)), Dec::TOTAL);
		}
		$lignes[] = $l;
	}

	$rep = array(
		'emplacement' => array(
			'id' => (int) $emp['id'], 'nom' => $emp['nom'], 'type' => $emp['type'],
			'type_libelle' => isset(TYPES_EMPLACEMENT_FR[$emp['type']]) ? TYPES_EMPLACEMENT_FR[$emp['type']] : $emp['type'],
			'actif' => (bool) $emp['actif'], 'entreprise_id' => (int) $emp['entreprise_id'], 'entreprise_nom' => $emp['entreprise_nom'],
			'code_barres' => $emp['code_barres'],
		),
		'lignes' => $lignes,
		'nb_pieces' => count($lignes),
		'comptage_en_cours' => ScanLib::comptageOuvert($emp['id']),
	);
	if ($couts) {
		// Même formule que la page « Valeur de l'inventaire » (somme quantité x coût moyen, arrondie une seule fois) : les totaux concordent.
		$st = $pdo->prepare(
			'SELECT COALESCE(ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 2), 0)
			   FROM stock s LEFT JOIN stock_couts sc ON sc.entreprise_id = ? AND sc.piece_id = s.piece_id
			  WHERE s.emplacement_id = ?'
		);
		$st->execute(array((int) $emp['entreprise_id'], (int) $emp['id']));
		$rep['valeur_totale'] = (string) $st->fetchColumn();
	}
	return $rep;
});
