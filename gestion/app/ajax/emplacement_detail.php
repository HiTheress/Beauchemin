<?php
// Fiche d'un emplacement pour le formulaire de modification (administrateur). GET : id.
// Réponse : {emplacement:{id, entreprise_id, nom, type, code_barres, actif, nb_pieces, a_historique}} (valeurs brutes : le JavaScript les place dans des champs).
require_once __DIR__ . '/../action/utilisateur_lib.php';
Admin::exiger();
endpoint(function () {
	global $pdo;
	$in = $_GET + entree();
	$id = Admin::entier(isset($in['id']) ? $in['id'] : null, 'Emplacement invalide.');
	$st = $pdo->prepare(
		'SELECT e.id, e.entreprise_id, e.nom, e.type, e.code_barres, e.actif,
		        (SELECT COUNT(*) FROM stock s WHERE s.emplacement_id = e.id AND s.quantite > 0) AS nb_pieces,
		        (EXISTS (SELECT 1 FROM mouvements m WHERE m.emplacement_id = e.id)
		      OR EXISTS (SELECT 1 FROM documents d WHERE d.emplacement_id = e.id OR d.emplacement_dest_id = e.id)
		      OR EXISTS (SELECT 1 FROM stock s2 WHERE s2.emplacement_id = e.id)
		      OR EXISTS (SELECT 1 FROM comptages c WHERE c.emplacement_id = e.id)) AS a_historique
		   FROM emplacements e WHERE e.id = ?'
	);
	$st->execute(array($id));
	$e = $st->fetch();
	if (!$e) {
		throw new InventaireException('Emplacement introuvable.');
	}
	return array('emplacement' => array(
		'id' => (int) $e['id'], 'entreprise_id' => (int) $e['entreprise_id'], 'nom' => $e['nom'], 'type' => $e['type'],
		'code_barres' => (string) $e['code_barres'], 'actif' => (bool) $e['actif'],
		'nb_pieces' => (int) $e['nb_pieces'], 'a_historique' => (bool) $e['a_historique'],
	));
});
