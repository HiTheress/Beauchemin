<?php
// Résout un code d'emplacement (EMP-…) scanné à l'écran « Facture interne » comme emplacement de DESTINATION, y compris dans une
// entreprise à laquelle l'utilisateur n'a pas accès (scan_code.php ne reconnaît que les emplacements de ses propres entreprises).
// Gestionnaire+ seulement. N'expose que ce que la liste des destinations (emplacements_liste.php?destination_entreprise=) montre déjà :
// emplacement ACTIF d'une entreprise ACTIVE (id, nom, type, entreprise) — jamais le code-barres ni du stock.
// GET : code. Réponse : {ok:true, trouve:bool, emplacement?:{id, nom, type, entreprise_id, entreprise_nom}}.
require_once __DIR__ . '/../action/facture_lib.php';
endpoint(function () {
	global $pdo;
	Interentreprise::exigerRole('facture_interne');
	$in = $_GET + entree();
	$code = Interentreprise::texte($in, 'code', 'Le code', 64);
	if ($code === '') {
		throw new InventaireException('Entrez un code.', 'code');
	}
	$st = $pdo->prepare(
		'SELECT e.id, e.nom, e.type, e.entreprise_id, en.nom AS entreprise_nom
		   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
		  WHERE e.code_barres = ? AND e.actif = 1 AND en.actif = 1'
	);
	$st->execute(array($code));
	$r = $st->fetch();
	if (!$r) {
		return array('trouve' => false);
	}
	return array('trouve' => true, 'emplacement' => array(
		'id' => (int) $r['id'], 'nom' => $r['nom'], 'type' => $r['type'],
		'entreprise_id' => (int) $r['entreprise_id'], 'entreprise_nom' => $r['entreprise_nom'],
	));
});
