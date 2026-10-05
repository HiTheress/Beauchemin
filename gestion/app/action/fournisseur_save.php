<?php
// Crée ou modifie un fournisseur (gestionnaire+). POST JSON : id?, nom, contact, telephone, courriel, adresse, notes.
// Le nom est unique sans égard à la casse (ni aux accents).
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$id = Catalogue::identifiant($d);
	$champs = array(
		'nom' => Catalogue::texte($d, 'nom', 'Le nom', 150, true),
		'contact' => Catalogue::texte($d, 'contact', 'Le contact', 100),
		'telephone' => Catalogue::texte($d, 'telephone', 'Le téléphone', 40),
		'courriel' => Catalogue::texte($d, 'courriel', 'Le courriel', 150),
		'adresse' => Catalogue::texte($d, 'adresse', 'L\'adresse', 255),
		'notes' => Catalogue::texte($d, 'notes', 'Les notes', 2000, false, true),
	);
	if ($champs['courriel'] !== '' && !filter_var($champs['courriel'], FILTER_VALIDATE_EMAIL)) {
		throw new InventaireException('Le courriel n\'est pas valide (exemple : nom@entreprise.com).', 'courriel');
	}
	return $inv->transaction(function () use ($uid, $id, $champs) {
		global $pdo;
		$st = $pdo->prepare('SELECT id FROM fournisseurs WHERE nom = ? AND id <> ? LIMIT 1');
		$st->execute(array($champs['nom'], $id));
		if ($st->fetch()) {
			throw new InventaireException('Un fournisseur porte déjà ce nom (les majuscules et les accents ne comptent pas).', 'nom');
		}
		$valeurs = array();
		foreach ($champs as $k => $v) {
			$valeurs[$k] = ($v === '') ? null : $v;
		}
		try {
			if ($id) {
				$st = $pdo->prepare('SELECT * FROM fournisseurs WHERE id = ? FOR UPDATE');
				$st->execute(array($id));
				$avant = $st->fetch();
				if (!$avant) {
					throw new InventaireException('Fournisseur introuvable.');
				}
				$pdo->prepare('UPDATE fournisseurs SET nom = ?, contact = ?, telephone = ?, courriel = ?, adresse = ?, notes = ? WHERE id = ?')
					->execute(array($valeurs['nom'], $valeurs['contact'], $valeurs['telephone'], $valeurs['courriel'], $valeurs['adresse'], $valeurs['notes'], $id));
				$chg = array();
				foreach ($valeurs as $k => $v) {
					if ((string) $avant[$k] !== (string) $v) {
						$chg[$k] = array($avant[$k], $v);
					}
				}
				if ($chg) {
					Journal::ecrire($pdo, $uid, 'fournisseur.modifie', 'fournisseurs', $id, array('nom' => $valeurs['nom'], 'changements' => $chg));
				}
				return array('id' => $id, 'cree' => false);
			}
			$pdo->prepare('INSERT INTO fournisseurs (nom, contact, telephone, courriel, adresse, notes, actif) VALUES (?, ?, ?, ?, ?, ?, 1)')
				->execute(array($valeurs['nom'], $valeurs['contact'], $valeurs['telephone'], $valeurs['courriel'], $valeurs['adresse'], $valeurs['notes']));
			$nid = (int) $pdo->lastInsertId();
			Journal::ecrire($pdo, $uid, 'fournisseur.cree', 'fournisseurs', $nid, array('nom' => $valeurs['nom']));
			return array('id' => $nid, 'cree' => true);
		} catch (PDOException $ex) {
			if (isset($ex->errorInfo[1]) && (int) $ex->errorInfo[1] === 1062) {
				throw new InventaireException('Un fournisseur porte déjà ce nom (les majuscules et les accents ne comptent pas).', 'nom');
			}
			throw $ex;
		}
	});
});
