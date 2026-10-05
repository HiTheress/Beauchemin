<?php
// Enregistre une facture interne AU COÛT entre deux entreprises (gestionnaire+).
// POST JSON : emplacement_id (source), entreprise_dest_id, emplacement_dest_id, date (AAAA-MM-JJ, pas dans le futur), note,
//             permettre_cout_zero (bool : facturer à 0 $ les pièces sans coût connu), jeton (anti double envoi), lignes[{piece_id, quantite}].
// Réponse : {ok:true, id, numero, total, lien, doublon?}. 403 : rôle ou entreprise (de la source) refusés ; 400 : entrée invalide
// (message en français : corps illisible, ligne mal formée, emplacement désactivé, stock insuffisant, pièce sans coût, même entreprise, etc.).
require_once __DIR__ . '/facture_lib.php';
exiger_post();
endpoint(function () {
	global $pdo;
	Interentreprise::exigerRole('facture_interne');
	$d = Interentreprise::donnees();

	$idSrc = Interentreprise::identifiant($d, 'emplacement_id');
	$idDst = Interentreprise::identifiant($d, 'emplacement_dest_id');
	$entDst = Interentreprise::identifiant($d, 'entreprise_dest_id');
	$src = Interentreprise::emplacement($idSrc);
	if ($src) {
		Interentreprise::exigerEntreprise($src['entreprise_id']);       // l'émettrice doit être une entreprise de l'utilisateur
	}

	// Double envoi : le même jeton ne crée jamais deux factures (les requêtes d'une même session s'exécutent à la file).
	$jeton = Interentreprise::jeton($d);
	if ($jeton !== null && isset($_SESSION['ie_jetons'][$jeton])) {
		return array('doublon' => true) + $_SESSION['ie_jetons'][$jeton];
	}

	if ($idSrc <= 0) {
		throw new InventaireException('Choisissez l\'emplacement source.', 'emplacement_id');
	}
	if (!$src) {
		throw new InventaireException('Emplacement source introuvable.', 'emplacement_id');
	}
	if ($entDst <= 0) {
		throw new InventaireException('Choisissez l\'entreprise destinataire.', 'entreprise_dest_id');
	}
	if ($idDst <= 0) {
		throw new InventaireException('Choisissez l\'emplacement de destination.', 'emplacement_dest_id');
	}
	$dst = Interentreprise::emplacement($idDst);
	if (!$dst) {
		throw new InventaireException('Emplacement de destination introuvable.', 'emplacement_dest_id');
	}
	if ((int) $dst['entreprise_id'] === (int) $src['entreprise_id'] || $entDst === (int) $src['entreprise_id']) {
		throw new InventaireException('Une facture interne se fait entre deux entreprises différentes. Pour la même entreprise, utilisez un transfert.', 'entreprise_dest_id');
	}
	if ((int) $dst['entreprise_id'] !== $entDst) {
		throw new InventaireException('L\'emplacement de destination n\'appartient pas à l\'entreprise choisie.', 'emplacement_dest_id');
	}
	// Emplacements actifs : contrôlés ici pour surligner le BON champ (le service signale toujours « emplacement_id »)
	Interentreprise::exigerActif($src, 'emplacement_id');
	Interentreprise::exigerActif($dst, 'emplacement_dest_id');

	$in = array(
		'emplacement_id' => (int) $src['id'],
		'entreprise_dest_id' => $entDst,
		'emplacement_dest_id' => (int) $dst['id'],
		'date' => (isset($d['date']) && $d['date'] !== '') ? $d['date'] : null,
		'note' => Interentreprise::texte($d, 'note', 'La note', Interentreprise::MAX_NOTE, true),
		'permettre_cout_zero' => Interentreprise::booleen($d, 'permettre_cout_zero'),    // booléen strict : le service teste empty()
		'lignes' => Interentreprise::lignesFacture(isset($d['lignes']) ? $d['lignes'] : null),
	);
	$r = inventaire()->factureInterne(utilisateur_id(), $in);

	Journal::ecrire($pdo, utilisateur_id(), 'facture_interne.creee', 'documents', (int) $r['id'], array(
		'numero' => $r['numero'], 'total' => $r['total'], 'de' => $src['entreprise_nom'], 'vers' => $dst['entreprise_nom'],
	));
	$sortie = array(
		'id' => (int) $r['id'], 'numero' => $r['numero'], 'total' => $r['total'],
		'lien' => 'index.php?page=facture_interne_voir&id=' . (int) $r['id'],
	);
	if ($jeton !== null) {
		$_SESSION['ie_jetons'][$jeton] = $sortie;
		if (count($_SESSION['ie_jetons']) > Interentreprise::MAX_JETONS) {
			$_SESSION['ie_jetons'] = array_slice($_SESSION['ie_jetons'], -Interentreprise::MAX_JETONS, null, true);
		}
	}
	return $sortie;
});
