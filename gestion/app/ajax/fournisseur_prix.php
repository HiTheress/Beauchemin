<?php
// Pièces et prix d'un fournisseur (gestionnaire+). GET : id. Réponse : {fournisseur:{id,nom,actif}, prix:[{piece_id, code, nom, unite, actif, prix, no_fournisseur, date_prix}]}
require_once '../init.php';
endpoint(function () {
	global $pdo;
	inventaire()->exiger(utilisateur_id(), 'voir_couts');
	$in = $_GET + entree();
	$id = isset($in['id']) && is_scalar($in['id']) && ctype_digit((string) $in['id']) ? (int) $in['id'] : 0;
	$st = $pdo->prepare('SELECT id, nom, actif FROM fournisseurs WHERE id = ?');
	$st->execute(array($id));
	$f = $st->fetch();
	if (!$f) {
		throw new InventaireException('Fournisseur introuvable.');
	}
	$f['id'] = (int) $f['id'];
	$f['actif'] = (bool) $f['actif'];
	$st = $pdo->prepare(
		'SELECT p.id AS piece_id, p.code, p.nom, p.unite, p.actif, pf.prix, pf.no_fournisseur, pf.date_prix
		   FROM prix_fournisseurs pf JOIN pieces p ON p.id = pf.piece_id WHERE pf.fournisseur_id = ? ORDER BY p.code'
	);
	$st->execute(array($id));
	$prix = $st->fetchAll();
	foreach ($prix as &$l) {
		$l['piece_id'] = (int) $l['piece_id'];
		$l['actif'] = (bool) $l['actif'];
	}
	unset($l);
	return array('fournisseur' => $f, 'prix' => $prix);
});
