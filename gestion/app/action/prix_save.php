<?php
// Ajoute ou modifie le prix d'une pièce chez un fournisseur (gestionnaire+), avec historique.
// POST JSON : piece_id, fournisseur_id, prix, no_fournisseur?, date? (AAAA-MM-JJ), note?
// no_fournisseur et note : clé absente (ou null) = inchangé ; chaîne vide = effacé.
// date : absente = aujourd'hui si le prix est nouveau ou change ; la date actuelle est conservée si seul le reste change.
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
	// null = inchangé (clé absente) ; chaîne vide = effacé (c'est la sémantique de definirPrixFournisseur)
	$no = isset($d['no_fournisseur']) ? Catalogue::texte($d, 'no_fournisseur', 'Le numéro de pièce du fournisseur', 60) : null;
	$note = isset($d['note']) ? Catalogue::texte($d, 'note', 'La note', 255) : null;
	$date = null;
	if (isset($d['date']) && $d['date'] !== '') {
		if (!is_string($d['date'])) {
			throw new InventaireException('La date du prix est invalide (format AAAA-MM-JJ).', 'date');
		}
		$date = $d['date'];
	}

	return $inv->transaction(function () use ($inv, $uid, $pieceId, $fid, $prix, $p4, $no, $note, $date) {
		global $pdo;
		$st = $pdo->prepare('SELECT id FROM pieces WHERE id = ?');
		$st->execute(array($pieceId));
		if (!$st->fetch()) {
			throw new InventaireException('Pièce introuvable.');
		}
		$st = $pdo->prepare(
			'SELECT f.actif, pf.id AS ligne, pf.prix, pf.no_fournisseur, pf.date_prix, pf.note
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
		// Date : sans date fournie, une ligne existante dont le prix ne change pas garde sa date (la modifier d'une note ne rend pas le prix « du jour »)
		$dateUtilisee = $date;
		if ($date === null && $avant['ligne'] && Dec::parse($avant['prix'], Dec::COUT) === $p4) {
			$dateUtilisee = $avant['date_prix'];
		}
		$r = $inv->definirPrixFournisseur($uid, $pieceId, $fid, $prix, $no, $dateUtilisee, $note);
		// Le service journalise les changements de prix (prix.maj) ; on journalise aussi les autres modifications, avec l'ancienne et la nouvelle valeur
		if ($avant['ligne']) {
			$st = $pdo->prepare('SELECT no_fournisseur, note, date_prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ?');
			$st->execute(array($pieceId, $fid));
			$apres = $st->fetch();
			$chg = array();
			foreach (array('no_fournisseur', 'note') as $k) {
				if ((string) $avant[$k] !== (string) $apres[$k]) {
					$chg[$k] = array($avant[$k], $apres[$k]);
				}
			}
			if ($avant['date_prix'] !== $apres['date_prix'] && Dec::parse($avant['prix'], Dec::COUT) === $p4) {
				$chg['date_prix'] = array($avant['date_prix'], $apres['date_prix']);
			}
			if ($chg) {
				Journal::ecrire($pdo, $uid, 'prix.modifie', 'pieces', $pieceId, array('fournisseur_id' => $fid, 'changements' => $chg));
			}
		}
		return $r;
	});
});
