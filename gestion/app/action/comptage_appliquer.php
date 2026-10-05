<?php
// Applique un comptage : crée le document d'ajustement avec les écarts (compté - stock actuel au moment de l'application).
// Au-delà de Inventaire::MAX_LIGNES écarts, le service crée plusieurs documents (même transaction : tout ou rien).
// POST : id, zero_non_scannees (true : les pièces en stock mais non scannées passent à 0),
//        empreinte (celle de l'aperçu : comptage_apercu.php renvoie `empreinte` ou `empreinte_zero` selon la case « non scannées à 0 »).
// L'empreinte est EXIGÉE : ce que le gestionnaire a vu dans l'aperçu (pièces comptées, stock actuel, pièces remises à 0) est exactement
// ce qui est appliqué ; si un autre écran a changé le comptage ou si du stock a bougé entre-temps, rien n'est appliqué (400, champ « apercu »)
// et l'écran rouvre l'aperçu à jour.
// Gestionnaire+ (le rôle et l'entreprise sont vérifiés ici ET par le service ; un employé reçoit un refus en français).
// Réponse : {ok:true, document_id|null, numero|null, ecarts:int, documents:[{id, numero}, …]}   (aucun écart : aucun document créé)
require_once '../init.php';
require_once __DIR__ . '/../ajax/scanner_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	$d = entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$id = ScanLib::entier(isset($d['id']) ? $d['id'] : null, 'Comptage invalide.', 'id');
	$zero = isset($d['zero_non_scannees']) && ScanLib::booleen($d['zero_non_scannees']);
	$empreinte = (isset($d['empreinte']) && is_string($d['empreinte'])) ? $d['empreinte'] : '';

	$r = $inv->transaction(function () use ($pdo, $inv, $uid, $id, $zero, $empreinte) {
		$acces = ScanLib::comptageAccessible($id);
		$inv->exiger($uid, 'comptage_appliquer', array((int) $acces['entreprise_id']));
		// Verrous : la ligne du comptage et le stock de l'emplacement. Un scan d'un autre écran ou un mouvement attend la fin de l'application ;
		// ce qui est comparé ci-dessous est donc ce qui sera appliqué.
		$st = $pdo->prepare('SELECT statut FROM comptages WHERE id = ? FOR UPDATE');
		$st->execute(array($id));
		if ($st->fetchColumn() !== 'en_cours') {
			throw new InventaireException('Ce comptage est terminé.');
		}
		if ($empreinte === '') {
			throw new InventaireException('Ouvrez l\'aperçu du comptage avant de l\'appliquer.', 'apercu');
		}
		$st = $pdo->prepare('SELECT piece_id FROM stock WHERE emplacement_id = ? ORDER BY piece_id FOR UPDATE');
		$st->execute(array((int) $acces['emplacement_id']));
		$st->fetchAll();
		$courante = ScanLib::empreinte($inv->comptageDetail($uid, $id, true), $zero);
		if (!hash_equals($courante, $empreinte)) {
			throw new InventaireException('Le comptage ou le stock a changé depuis l\'aperçu : vérifiez les écarts de nouveau.', 'apercu');
		}
		return $inv->comptageAppliquer($uid, $id, $zero);
	});
	Journal::ecrire($pdo, $uid, 'comptage.applique', 'comptages', $id, array(
		'document_id' => $r['document_id'], 'numero' => $r['numero'], 'ecarts' => $r['ecarts'], 'non_scannees_a_zero' => $zero,
		'documents' => isset($r['documents']) ? array_map(function ($x) { return $x['numero']; }, $r['documents']) : array(),
	));
	return $r;
});
