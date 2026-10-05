<?php
// Annule un document (réception, transfert, sortie) en passant les écritures inverses (gestionnaire+).
// POST JSON : id (document), motif (obligatoire, 255 caractères maximum).
// Réponse : {ok:true, id, numero}. Refusé (400) si le stock à reprendre n'est plus là, si le document est déjà annulé
// ou si c'est un ajustement (on le corrige par un nouvel ajustement). 403 : rôle ou entreprise refusés.
require_once __DIR__ . '/document_lib.php';
exiger_post();
endpoint(function () {
	global $pdo, $Ouser;
	$d = entree();
	Mouvements::exigerRole('annulation');
	$id = Mouvements::identifiant($d, 'id');
	if ($id <= 0) {
		throw new InventaireException('Document introuvable.');
	}
	// Entreprise : le document doit concerner (émettrice ou destinataire) une entreprise de l'utilisateur
	$st = $pdo->prepare('SELECT entreprise_id, entreprise_dest_id FROM documents WHERE id = ?');
	$st->execute(array($id));
	$doc = $st->fetch();
	if ($doc) {
		$ok = $Ouser->peutAcces((int) $doc['entreprise_id']) || ($doc['entreprise_dest_id'] && $Ouser->peutAcces((int) $doc['entreprise_dest_id']));
		if (!$ok) {
			json_fail('Vous n\'avez pas accès à ce document.', 403);
		}
	}
	$motif = Mouvements::texte($d, 'motif', 'Le motif', Mouvements::MAX_MOTIF_ANNULATION);
	if ($motif === '') {
		throw new InventaireException('Indiquez le motif de l\'annulation.', 'motif');
	}
	$r = inventaire()->annuler(utilisateur_id(), $id, $motif);
	return array('id' => (int) $r['id'], 'numero' => $r['numero'], 'lien' => 'index.php?page=document_voir&id=' . (int) $r['id']);
});
