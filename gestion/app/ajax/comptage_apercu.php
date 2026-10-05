<?php
// Aperçu avant application d'un comptage : écarts calculés contre le stock ACTUEL (pas celui du début du comptage).
// GET/POST : id. Gestionnaire+ seulement (c'est lui qui peut appliquer) ; droit sur l'entreprise vérifié par le service.
// Réponse : {ok:true, comptage:{id, numero, emplacement_nom, entreprise_nom},
//   lignes:[{piece_id, code, nom, unite, actif, quantite_comptee, quantite_actuelle, ecart}],        // pièces scannées
//   non_scannees:[{piece_id, code, nom, unite, actif, quantite_actuelle}],                           // en stock mais pas scannées
//   empreinte, empreinte_zero,   // à renvoyer à comptage_appliquer (selon la case « non scannées à 0 ») : refus si le comptage ou le stock ont changé
//   max_lignes}                  // un ajustement porte au plus ce nombre de pièces : au-delà, plusieurs documents sont créés
// Aucun coût.
require_once '../init.php';
require_once __DIR__ . '/scanner_lib.php';
endpoint(function () {
	global $pdo;
	$in = $_GET + entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$id = ScanLib::entier(isset($in['id']) ? $in['id'] : null, 'Comptage invalide.', 'id');
	ScanLib::comptageAccessible($id);                // introuvable = même message qu'une autre entreprise
	$det = $inv->comptageDetail($uid, $id, true);   // droit de consulter + entreprise
	$c = $det['comptage'];
	$inv->exiger($uid, 'comptage_appliquer', array((int) $c['entreprise_id']));
	if ($c['statut'] !== 'en_cours') {
		throw new InventaireException('Ce comptage est terminé.');
	}
	// Pièces désactivées : le service refuse d'ajuster une pièce désactivée, l'écran doit pouvoir le signaler avant.
	$actif = array();
	$ids = array_map(function ($l) { return (int) $l['piece_id']; }, $det['lignes']);
	if ($ids) {
		$st = $pdo->prepare('SELECT id, actif FROM pieces WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
		$st->execute($ids);
		foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
			$actif[(int) $r['id']] = (bool) $r['actif'];
		}
	}
	$lignes = array();
	$non = array();
	foreach ($det['lignes'] as $l) {
		$base = array(
			'piece_id' => (int) $l['piece_id'], 'code' => $l['code'], 'nom' => $l['nom'], 'unite' => $l['unite'],
			'actif' => isset($actif[(int) $l['piece_id']]) ? $actif[(int) $l['piece_id']] : true,
		);
		if ($l['compte']) {
			$lignes[] = $base + array('quantite_comptee' => $l['quantite_comptee'], 'quantite_actuelle' => $l['quantite_actuelle'], 'ecart' => $l['ecart']);
		} else {
			$non[] = $base + array('quantite_actuelle' => $l['quantite_actuelle']);
		}
	}
	return array(
		'comptage' => array('id' => (int) $c['id'], 'numero' => $c['numero'], 'emplacement_nom' => $c['emplacement_nom'], 'entreprise_nom' => $c['entreprise_nom']),
		'lignes' => $lignes,
		'non_scannees' => $non,
		'empreinte' => ScanLib::empreinte($det, false),
		'empreinte_zero' => ScanLib::empreinte($det, true),
		'max_lignes' => Inventaire::MAX_LIGNES,
	);
});
