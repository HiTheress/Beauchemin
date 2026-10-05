<?php
// Détail d'un comptage pour l'écran de comptage. GET/POST : id, aveugle ('1' = ne pas envoyer le stock attendu).
// Employé+ ; le comptage doit être celui d'une entreprise de l'utilisateur (vérifié par le service).
//
// Réponse : {ok:true,
//   comptage:{id, numero, statut, statut_libelle, note, emplacement_id, emplacement_nom, entreprise_id, entreprise_nom,
//             cree_par_nom, cree_le, applique_par_nom, applique_le, document_id, document_numero,
//             documents:[{id, numero}, …]   // comptage appliqué : un seul document, sauf si plus de 300 écarts (un document par tranche de 300)},
//   aveugle:bool, peut_appliquer:bool,
//   lignes:[{piece_id, code, nom, unite, quantite_comptee, (stock attendu seulement si !aveugle : quantite_actuelle, ecart),
//            (comptage appliqué : ecart_applique)}],
//   non_comptees:[{piece_id, code, nom, unite, quantite_actuelle}]   // en stock mais pas encore scannées (jamais en mode aveugle)
//   remises_a_zero:[…]   // comptage appliqué : pièces non scannées mises à 0 par l'ajustement
// }
// En mode aveugle (défaut pour un employé), le stock attendu n'est ni lu ni envoyé : il n'est donc pas dans la réponse brute.
// Aucun coût n'est jamais renvoyé.
require_once '../init.php';
require_once __DIR__ . '/scanner_lib.php';
endpoint(function () {
	global $pdo, $Ouser;
	$in = $_GET + entree();
	$uid = utilisateur_id();
	$inv = inventaire();
	$id = ScanLib::entier(isset($in['id']) ? $in['id'] : null, 'Comptage invalide.', 'id');
	// Par défaut (paramètre absent) : à l'aveugle pour un employé, stock attendu visible pour un gestionnaire+.
	$aveugle = array_key_exists('aveugle', $in) ? ScanLib::booleen($in['aveugle']) : !$Ouser->aRole('gestionnaire');

	ScanLib::comptageAccessible($id);                    // introuvable = même message qu'un comptage d'une autre entreprise
	$premier = $inv->comptageDetail($uid, $id, false);   // vérifie le droit d'accès à l'entreprise du comptage
	$c = $premier['comptage'];
	$enCours = ($c['statut'] === 'en_cours');
	$det = ($enCours && !$aveugle) ? $inv->comptageDetail($uid, $id, true) : $premier;

	$lignes = array();
	$nonComptees = array();
	foreach ($det['lignes'] as $l) {
		$base = array(
			'piece_id' => (int) $l['piece_id'], 'code' => $l['code'], 'nom' => $l['nom'], 'unite' => $l['unite'],
		);
		if (!$l['compte']) {
			$nonComptees[] = $base + array('quantite_actuelle' => $l['quantite_actuelle']);
			continue;
		}
		$base['quantite_comptee'] = $l['quantite_comptee'];
		if ($enCours && !$aveugle) {
			$base['quantite_actuelle'] = $l['quantite_actuelle'];
			$base['ecart'] = $l['ecart'];
		}
		$lignes[] = $base;
	}

	// Noms d'utilisateurs et numéro du document d'ajustement
	$st = $pdo->prepare(
		"SELECT COALESCE(NULLIF(u1.nom_complet, ''), u1.nom_utilisateur) AS cree_par_nom,
		        COALESCE(NULLIF(u2.nom_complet, ''), u2.nom_utilisateur) AS applique_par_nom, d.numero AS document_numero
		   FROM comptages c LEFT JOIN utilisateurs u1 ON u1.id = c.cree_par LEFT JOIN utilisateurs u2 ON u2.id = c.applique_par
		        LEFT JOIN documents d ON d.id = c.document_id WHERE c.id = ?"
	);
	$st->execute(array((int) $c['id']));
	$noms = $st->fetch(PDO::FETCH_ASSOC) ?: array();

	// Comptage appliqué : écart réellement appliqué, ligne par ligne (document(s) d'ajustement ; coûts masqués par le service).
	// Plus de 300 écarts : plusieurs documents, dont les lignes sont réunies ici.
	$remises = array();
	$documents = array();
	if ($c['statut'] === 'applique' && $c['document_id']) {
		$documents = ScanLib::documentsDuComptage($c);
		if (!$documents) {
			$documents = array(array('id' => (int) $c['document_id'], 'numero' => isset($noms['document_numero']) ? $noms['document_numero'] : ''));
		}
		$parPiece = array();
		foreach ($documents as $dc) {
			$doc = $inv->document($uid, (int) $dc['id']);
			foreach ($doc['lignes'] as $dl) {
				$parPiece[(int) $dl['piece_id']] = $dl;
			}
		}
		foreach ($lignes as $i => $l) {
			$lignes[$i]['ecart_applique'] = isset($parPiece[$l['piece_id']]) ? $parPiece[$l['piece_id']]['quantite'] : '0.000';
			unset($parPiece[$l['piece_id']]);
		}
		foreach ($parPiece as $dl) {
			$remises[] = array('piece_id' => (int) $dl['piece_id'], 'code' => $dl['code'], 'nom' => $dl['nom'], 'unite' => $dl['unite'], 'ecart_applique' => $dl['quantite']);
		}
	} elseif ($c['statut'] === 'applique') {
		foreach ($lignes as $i => $l) {
			$lignes[$i]['ecart_applique'] = '0.000';
		}
	}

	$libelles = array('en_cours' => 'En cours', 'applique' => 'Appliqué', 'annule' => 'Annulé');
	return array(
		'comptage' => array(
			'id' => (int) $c['id'], 'numero' => $c['numero'], 'statut' => $c['statut'],
			'statut_libelle' => isset($libelles[$c['statut']]) ? $libelles[$c['statut']] : $c['statut'],
			'note' => $c['note'], 'emplacement_id' => (int) $c['emplacement_id'], 'emplacement_nom' => $c['emplacement_nom'],
			'entreprise_id' => (int) $c['entreprise_id'], 'entreprise_nom' => $c['entreprise_nom'],
			'cree_par_nom' => isset($noms['cree_par_nom']) ? $noms['cree_par_nom'] : null, 'cree_le' => substr((string) $c['cree_le'], 0, 16),
			'applique_par_nom' => isset($noms['applique_par_nom']) ? $noms['applique_par_nom'] : null,
			'applique_le' => $c['applique_le'] ? substr((string) $c['applique_le'], 0, 16) : null,
			'document_id' => $c['document_id'] ? (int) $c['document_id'] : null,
			'document_numero' => isset($noms['document_numero']) ? $noms['document_numero'] : null,
			'documents' => $documents,
		),
		'aveugle' => (bool) ($enCours ? $aveugle : true),
		'peut_appliquer' => $enCours && $Ouser->aRole('gestionnaire'),
		'lignes' => $lignes,
		'non_comptees' => $nonComptees,
		'remises_a_zero' => $remises,
	);
});
