<?php
// Annule une facture interne : les pièces retournent à l'emplacement source et sortent de l'emplacement de destination
// (écritures inverses ; la facture reste dans la liste, marquée ANNULÉE). Gestionnaire+.
// POST JSON : id (facture), motif (obligatoire, 255 caractères maximum).
// Réponse : {ok:true, id, numero}. 400 avec le message du service si la marchandise a déjà été sortie de la destination, si la
// facture est déjà annulée ou si le document n'est pas une facture interne. 403 : rôle ou entreprise refusés
// (l'émettrice OU la destinataire doit être une entreprise de l'utilisateur).
require_once __DIR__ . '/facture_lib.php';
exiger_post();
endpoint(function () {
	global $pdo, $Ouser;
	$d = entree();
	Interentreprise::exigerRole('annulation');
	$id = Interentreprise::identifiant($d, 'id');
	if ($id <= 0) {
		throw new InventaireException('Facture introuvable.');
	}
	$st = $pdo->prepare('SELECT type, entreprise_id, entreprise_dest_id FROM documents WHERE id = ?');
	$st->execute(array($id));
	$doc = $st->fetch();
	if (!$doc) {
		throw new InventaireException('Facture introuvable.');
	}
	$ok = $Ouser->peutAcces((int) $doc['entreprise_id']) || ($doc['entreprise_dest_id'] && $Ouser->peutAcces((int) $doc['entreprise_dest_id']));
	if (!$ok) {
		json_fail('Vous n\'avez pas accès à cette facture.', 403);
	}
	if ($doc['type'] !== 'facture_interne') {
		throw new InventaireException('Ce document n\'est pas une facture interne : annulez-le depuis la page des documents.');
	}
	$motif = Interentreprise::texte($d, 'motif', 'Le motif', Interentreprise::MAX_MOTIF);
	if ($motif === '') {
		throw new InventaireException('Indiquez le motif de l\'annulation.', 'motif');
	}
	$r = inventaire()->annuler(utilisateur_id(), $id, $motif);
	return array('id' => (int) $r['id'], 'numero' => $r['numero'], 'lien' => 'index.php?page=facture_interne_voir&id=' . (int) $r['id']);
});
