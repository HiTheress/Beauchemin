<?php
// Ajoute ou modifie le prix d'une pièce chez un fournisseur (gestionnaire+), avec historique.
// POST JSON : piece_id, fournisseur_id, prix, no_fournisseur?, date? (AAAA-MM-JJ), note?
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$pieceId = Catalogue::entier(isset($d['piece_id']) ? $d['piece_id'] : 0);
	$fid = Catalogue::entier(isset($d['fournisseur_id']) ? $d['fournisseur_id'] : 0);
	if (!$pieceId) {
		throw new InventaireException('Pièce introuvable.');
	}
	if (!$fid) {
		throw new InventaireException('Choisissez un fournisseur.', 'fournisseur_id');
	}
	$prix = isset($d['prix']) ? $d['prix'] : '';
	if (is_string($prix)) {
		$prix = trim(preg_replace('/\s*\$\s*$/', '', trim($prix)));      // « 12,50 $ » collé depuis une facture
	}
	if ($prix === '' || $prix === null) {
		throw new InventaireException('Le prix est obligatoire.', 'prix');
	}
	if (!is_string($prix) && !is_int($prix) && !is_float($prix)) {
		throw new InventaireException('Le prix doit être un nombre (par exemple 12,50).', 'prix');
	}
	try {
		$p4 = Dec::parse($prix, Dec::COUT, 'prix');
	} catch (InventaireException $ex) {
		throw new InventaireException('Le prix doit être un nombre (par exemple 12,50).', 'prix');
	}
	if ($p4 < 0 || $p4 > Inventaire::MAX_COUT * 10000) {
		throw new InventaireException('Le prix doit être compris entre 0 $ et ' . number_format(Inventaire::MAX_COUT, 0, ',', ' ') . ' $.', 'prix');
	}
	$no = Catalogue::texte($d, 'no_fournisseur', 'Le numéro de pièce du fournisseur', 60);
	$note = Catalogue::texte($d, 'note', 'La note', 255);
	$date = isset($d['date']) && is_string($d['date']) && $d['date'] !== '' ? $d['date'] : null;

	return $inv->transaction(function () use ($inv, $uid, $pieceId, $fid, $prix, $p4, $no, $note, $date) {
		global $pdo;
		$st = $pdo->prepare('SELECT id FROM pieces WHERE id = ?');
		$st->execute(array($pieceId));
		if (!$st->fetch()) {
			throw new InventaireException('Pièce introuvable.');
		}
		$st = $pdo->prepare(
			'SELECT f.actif, pf.id AS ligne, pf.prix, pf.no_fournisseur, pf.date_prix
			   FROM fournisseurs f LEFT JOIN prix_fournisseurs pf ON pf.fournisseur_id = f.id AND pf.piece_id = ? WHERE f.id = ? FOR UPDATE'
		);
		$st->execute(array($pieceId, $fid));
		$avant = $st->fetch();
		if (!$avant) {
			throw new InventaireException('Fournisseur introuvable.', 'fournisseur_id');
		}
		if (!$avant['actif'] && !$avant['ligne']) {
			throw new InventaireException('Ce fournisseur est désactivé : réactivez-le avant de lui ajouter un prix.', 'fournisseur_id');
		}
		$r = $inv->definirPrixFournisseur($uid, $pieceId, $fid, $prix, $no === '' ? null : $no, $date, $note === '' ? null : $note);
		// le service garde l'ancien numéro quand on n'en donne pas : ici, un champ vidé doit vraiment être vidé
		if ($no === '' && $avant['ligne'] && $avant['no_fournisseur'] !== null) {
			$pdo->prepare('UPDATE prix_fournisseurs SET no_fournisseur = NULL WHERE piece_id = ? AND fournisseur_id = ?')->execute(array($pieceId, $fid));
		}
		// le service ne journalise que les changements de prix : on journalise aussi les autres modifications
		if ($avant['ligne'] && Dec::parse($avant['prix'], Dec::COUT) === $p4
			&& ((string) $avant['no_fournisseur'] !== $no || ($date !== null && $avant['date_prix'] !== $date))) {
			Journal::ecrire($pdo, $uid, 'prix.modifie', 'pieces', $pieceId, array('fournisseur_id' => $fid, 'no_fournisseur' => $no === '' ? null : $no, 'date' => $date));
		}
		return $r;
	});
});
