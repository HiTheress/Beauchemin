<?php
// Crée ou modifie une catégorie (gestionnaire+). POST JSON : id?, nom, description. Le nom est unique sans égard à la casse.
require_once __DIR__ . '/piece_lib.php';
exiger_post();
endpoint(function () {
	$inv = inventaire();
	$uid = utilisateur_id();
	$inv->exiger($uid, 'catalogue');
	$d = entree();
	$id = Catalogue::identifiant($d);
	$nom = Catalogue::texte($d, 'nom', 'Le nom', 100, true);
	$desc = Catalogue::texte($d, 'description', 'La description', 255);
	return $inv->transaction(function () use ($uid, $id, $nom, $desc) {
		global $pdo;
		$st = $pdo->prepare('SELECT id FROM categories WHERE nom = ? AND id <> ? LIMIT 1');
		$st->execute(array($nom, $id));
		if ($st->fetch()) {
			throw new InventaireException('Une catégorie porte déjà ce nom (les majuscules et les accents ne comptent pas).', 'nom');
		}
		try {
			if ($id) {
				$st = $pdo->prepare('SELECT nom, description FROM categories WHERE id = ? FOR UPDATE');
				$st->execute(array($id));
				$avant = $st->fetch();
				if (!$avant) {
					throw new InventaireException('Catégorie introuvable.');
				}
				$pdo->prepare('UPDATE categories SET nom = ?, description = ? WHERE id = ?')->execute(array($nom, $desc === '' ? null : $desc, $id));
				$chg = array();
				if ($avant['nom'] !== $nom) {
					$chg['nom'] = array($avant['nom'], $nom);
				}
				if ((string) $avant['description'] !== $desc) {
					$chg['description'] = array($avant['description'], $desc);
				}
				if ($chg) {
					Journal::ecrire($pdo, $uid, 'categorie.modifie', 'categories', $id, array('nom' => $nom, 'changements' => $chg));
				}
				return array('id' => $id, 'nom' => $nom, 'cree' => false);
			}
			$pdo->prepare('INSERT INTO categories (nom, description) VALUES (?, ?)')->execute(array($nom, $desc === '' ? null : $desc));
			$nid = (int) $pdo->lastInsertId();
			Journal::ecrire($pdo, $uid, 'categorie.cree', 'categories', $nid, array('nom' => $nom));
			return array('id' => $nid, 'nom' => $nom, 'cree' => true);
		} catch (PDOException $ex) {
			if (isset($ex->errorInfo[1]) && (int) $ex->errorInfo[1] === 1062) {
				throw new InventaireException('Une catégorie porte déjà ce nom (les majuscules et les accents ne comptent pas).', 'nom');
			}
			throw $ex;
		}
	});
});
