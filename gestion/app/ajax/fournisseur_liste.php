<?php
// Liste des fournisseurs avec le nombre de pièces ayant un prix (gestionnaire+). GET : statut ('actifs' défaut | 'inactifs' | 'tous').
// Réponse : {fournisseurs:[{id, nom, contact, telephone, courriel, adresse, notes, actif, nb_prix}]} (valeurs brutes : le JS échappe).
require_once '../init.php';
endpoint(function () {
	global $pdo;
	inventaire()->exiger(utilisateur_id(), 'catalogue');
	$in = $_GET + entree();
	$statut = (isset($in['statut']) && is_string($in['statut'])) ? $in['statut'] : 'actifs';
	$w = ($statut === 'tous') ? '' : ($statut === 'inactifs' ? 'WHERE f.actif = 0' : 'WHERE f.actif = 1');
	$rows = $pdo->query(
		"SELECT f.id, f.nom, f.contact, f.telephone, f.courriel, f.adresse, f.notes, f.actif, COUNT(pf.id) AS nb_prix
		   FROM fournisseurs f LEFT JOIN prix_fournisseurs pf ON pf.fournisseur_id = f.id $w GROUP BY f.id ORDER BY f.nom"
	)->fetchAll();
	foreach ($rows as &$r) {
		$r['id'] = (int) $r['id'];
		$r['actif'] = (bool) $r['actif'];
		$r['nb_prix'] = (int) $r['nb_prix'];
	}
	unset($r);
	return array('fournisseurs' => $rows);
});
