<?php
// Détail de la valeur du stock d'UN emplacement, pièce par pièce (gestionnaire+). GET/POST : emplacement_id.
// Réponse : {ok:true, emplacement:{id, nom, type, actif, entreprise_id, entreprise_nom}, total, lignes:[{piece_id, code, nom, unite, categorie,
// quantite, cout_moyen, valeur, sans_cout}]}. Montants et quantités en chaînes décimales exactes.
// Le coût moyen est celui de l'entreprise propriétaire de l'emplacement ; le total est arrondi une seule fois (comme la valeur
// de l'emplacement donnée par le service), alors que chaque ligne est arrondie au cent : un écart de quelques cents est possible.
// 403 : rôle ou entreprise refusés.
require_once __DIR__ . '/../action/facture_lib.php';
endpoint(function () {
	global $pdo;
	Interentreprise::exigerRole('rapport');
	$in = $_GET + entree();
	$id = Interentreprise::identifiant($in, 'emplacement_id');
	if ($id <= 0) {
		throw new InventaireException('Choisissez un emplacement.', 'emplacement_id');
	}
	$emp = Interentreprise::emplacement($id);
	if (!$emp) {
		throw new InventaireException('Emplacement introuvable.', 'emplacement_id');
	}
	Interentreprise::exigerEntreprise($emp['entreprise_id']);

	$st = $pdo->prepare(
		'SELECT COALESCE(ROUND(SUM(s.quantite * COALESCE(sc.cout_moyen, 0)), 2), 0)
		   FROM stock s LEFT JOIN stock_couts sc ON sc.entreprise_id = ? AND sc.piece_id = s.piece_id
		  WHERE s.emplacement_id = ?'
	);
	$st->execute(array((int) $emp['entreprise_id'], (int) $emp['id']));
	$total = Dec::fmt(Dec::parse($st->fetchColumn(), Dec::TOTAL), Dec::TOTAL);

	$lignes = array();
	foreach (Interentreprise::lignesValeur(array($emp['id'])) as $r) {
		$lignes[] = array(
			'piece_id' => (int) $r['piece_id'], 'code' => $r['code'], 'nom' => $r['nom'], 'unite' => $r['unite'],
			'categorie' => $r['categorie'], 'quantite' => $r['quantite'], 'cout_moyen' => $r['cout_moyen'], 'valeur' => $r['valeur'],
			'sans_cout' => (Dec::parse($r['cout_moyen'], Dec::COUT) === 0),
		);
	}
	return array(
		'emplacement' => array(
			'id' => (int) $emp['id'], 'nom' => $emp['nom'], 'type' => $emp['type'], 'actif' => (int) $emp['actif'],
			'entreprise_id' => (int) $emp['entreprise_id'], 'entreprise_nom' => $emp['entreprise_nom'],
		),
		'total' => $total,
		'lignes' => $lignes,
	);
});
