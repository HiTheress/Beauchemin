<?php
// Données d'aperçu/impression des étiquettes (gestionnaire+). POST JSON :
//   { format: 'feuille30'|'rouleau'|'grande', elements: [ { type: 'piece'|'emplacement', id: 12, copies: 3 }, … ] }
// Réponse : { ok:true, format, total, elements:[ { type, id, copies, ok:true, code, nom, nom_affiche, droite, svg, code_pt }
//                                                | { type, id, copies, ok:false, code, nom, erreur } ] }
// Pièces : actives seulement. Emplacements : actifs et d'une entreprise à laquelle l'utilisateur a accès.
require_once '../init.php';
require_once __DIR__ . '/etiquette_lib.php';
exiger_post();
endpoint(function () {
	$uid = utilisateur_id();
	$u = inventaire()->exiger($uid, 'catalogue');
	global $pdo;
	$d = entree();

	$fmt = Etiquettes::format(isset($d['format']) ? $d['format'] : '');
	$elements = isset($d['elements']) ? $d['elements'] : null;
	if (!is_array($elements) || !$elements) {
		throw new InventaireException('Ajoutez au moins une pièce ou un emplacement.', 'elements');
	}
	if (count($elements) > Etiquettes::MAX_ELEMENTS) {
		throw new InventaireException('Trop d\'éléments dans la liste (maximum ' . Etiquettes::MAX_ELEMENTS . ').', 'elements');
	}

	$demandes = array();
	$total = 0;
	$idsPieces = array();
	$idsEmps = array();
	foreach (array_values($elements) as $i => $el) {
		$n = $i + 1;
		if (!is_array($el)) {
			throw new InventaireException("Élément $n invalide.", 'elements');
		}
		$type = isset($el['type']) ? $el['type'] : '';
		if ($type !== 'piece' && $type !== 'emplacement') {
			throw new InventaireException("Élément $n : type inconnu.", 'elements');
		}
		$id = isset($el['id']) && (is_int($el['id']) || (is_string($el['id']) && ctype_digit($el['id']))) ? (int) $el['id'] : 0;
		if ($id <= 0) {
			throw new InventaireException("Élément $n : identifiant invalide.", 'elements');
		}
		$c = isset($el['copies']) ? $el['copies'] : 1;
		if (!(is_int($c) || (is_string($c) && ctype_digit($c))) || (int) $c < 1 || (int) $c > Etiquettes::MAX_COPIES) {
			throw new InventaireException("Élément $n : le nombre de copies doit être un entier de 1 à " . Etiquettes::MAX_COPIES . '.', 'copies');
		}
		$total += (int) $c;
		if ($total > Etiquettes::MAX_ETIQUETTES) {
			throw new InventaireException('Trop d\'étiquettes d\'un coup (maximum ' . number_format(Etiquettes::MAX_ETIQUETTES, 0, ',', ' ') . ' par impression).', 'copies');
		}
		$demandes[] = array('type' => $type, 'id' => $id, 'copies' => (int) $c);
		if ($type === 'piece') {
			$idsPieces[$id] = true;
		} else {
			$idsEmps[$id] = true;
		}
	}

	// Pièces
	$pieces = array();
	if ($idsPieces) {
		$ids = array_keys($idsPieces);
		$st = $pdo->prepare('SELECT id, code, nom, unite, actif FROM pieces WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
		$st->execute($ids);
		foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
			$pieces[(int) $r['id']] = $r;
		}
		foreach ($ids as $id) {
			if (!isset($pieces[$id])) {
				throw new InventaireException('Une des pièces est introuvable.', 'elements');
			}
		}
	}
	// Emplacements : introuvable ET inaccessible donnent le même refus (pas de fuite entre entreprises)
	$emps = array();
	if ($idsEmps) {
		$ids = array_keys($idsEmps);
		$st = $pdo->prepare('SELECT e.id, e.nom, e.code_barres, e.actif, e.entreprise_id, en.nom AS entreprise_nom, en.actif AS entreprise_actif
		                       FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id
		                      WHERE e.id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
		$st->execute($ids);
		foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
			if (in_array((int) $r['entreprise_id'], $u['entreprises'], true)) {
				$emps[(int) $r['id']] = $r;
			}
		}
		foreach ($ids as $id) {
			if (!isset($emps[$id])) {
				throw new InventaireException('Emplacement introuvable ou inaccessible.', 'elements');
			}
		}
	}

	$sortie = array();
	$cache = array();   // un même code n'est généré qu'une fois
	foreach ($demandes as $dm) {
		$base = array('type' => $dm['type'], 'id' => $dm['id'], 'copies' => $dm['copies']);
		if ($dm['type'] === 'piece') {
			$p = $pieces[$dm['id']];
			$code = (string) $p['code'];
			$nom = (string) $p['nom'];
			$droite = (string) $p['unite'];
			$inactif = !$p['actif'] ? 'La pièce « ' . $code . ' » est désactivée : aucune étiquette.' : null;
		} else {
			$p = $emps[$dm['id']];
			$code = (string) $p['code_barres'];
			$nom = (string) $p['nom'];
			$droite = (string) $p['entreprise_nom'];
			$inactif = (!$p['actif'] || !$p['entreprise_actif']) ? 'L\'emplacement « ' . $nom . ' » est désactivé : aucune étiquette.' : null;
			if ($code === '') {
				$inactif = 'L\'emplacement « ' . $nom . ' » n\'a pas de code-barres.';
			}
		}
		$base += array('code' => $code, 'nom' => $nom);
		if ($inactif !== null) {
			$sortie[] = $base + array('ok' => false, 'erreur' => $inactif);
			continue;
		}
		try {
			if (!isset($cache[$code])) {
				$cache[$code] = Etiquettes::codeBarres($code, $fmt);
			}
		} catch (InventaireException $ex) {
			$sortie[] = $base + array('ok' => false, 'erreur' => $ex->getMessage());
			continue;
		}
		$sortie[] = $base + array(
			'ok' => true,
			'nom_affiche' => Etiquettes::tronquer($nom, $fmt['nom_max']),
			'droite' => Etiquettes::tronquer($droite, 24),
			'svg' => $cache[$code]['svg'],
			'code_pt' => $cache[$code]['code_pt'],
		);
	}
	return array('format' => $fmt['cle'], 'total' => $total, 'elements' => $sortie);
});
