<?php
// Données du tableau de bord (employé+), pour l'entreprise choisie dans la barre du haut (sinon toutes celles de l'utilisateur).
// GET. Réponse : {ok:true, portee:{ids, noms, libelle}, montants:bool, aujourdhui:'AAAA-MM-JJ', role,
//   cartes:{pieces_actives, pieces_en_stock, sous_minimum, mouvements_jour, documents_jour},
//   derniers_documents:[{id, numero, type, type_libelle, statut, date, entreprise, entreprise_dest, emplacement, emplacement_dest, utilisateur[, total]}],
//   plus_bas:[{entreprise, piece_id, code, nom, unite, minimum, quantite, manque}]  (5 plus grands manques),
//   et pour un gestionnaire+ SEULEMENT : valeur:[{id, nom, valeur}], factures:{libelle_mois, du, au, lignes:[{id, nom, emis, recu, solde, nb_emises, nb_recues}]}}
// Un employé ne reçoit aucun coût : ni valeur d'inventaire, ni factures internes, ni total de document.
require_once __DIR__ . '/stock_lib.php';
Suivi::executer(function ($ctx) {
	global $pdo;
	$uid = $ctx['uid'];
	$ids = Suivi::entreprises($ctx, entreprise_courante() ?: null);
	$liste = Suivi::listeIds($ids);
	$mes = Suivi::listeIds($ctx['entreprises']);
	$un = function ($sql, array $p = array()) use ($pdo) {
		$st = $pdo->prepare($sql);
		$st->execute($p);
		return $st->fetch();
	};

	$noms = array();
	foreach (inventaire()->listeEntreprises($uid) as $en) {
		if (in_array((int) $en['id'], $ids, true)) {
			$noms[] = $en['nom'];
		}
	}

	// --- cartes ---
	$actives = (int) $pdo->query('SELECT COUNT(*) FROM pieces WHERE actif = 1')->fetchColumn();
	$enStock = $un(
		'SELECT COUNT(DISTINCT s.piece_id) AS n FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN pieces p ON p.id = s.piece_id
		  WHERE e.entreprise_id IN (' . $liste . ') AND s.quantite > 0 AND p.actif = 1'
	);
	$sous = Suivi::sousMinimum($ctx, $ids);
	$aujourdhui = date('Y-m-d');
	$jour = $un(
		'SELECT COUNT(*) AS n, COUNT(DISTINCT m.document_id) AS docs FROM mouvements m JOIN emplacements e ON e.id = m.emplacement_id
		  WHERE e.entreprise_id IN (' . $liste . ') AND m.date_mouvement >= :d0 AND m.date_mouvement < :d1',
		array(':d0' => $aujourdhui . ' 00:00:00', ':d1' => date('Y-m-d', strtotime('+1 day')) . ' 00:00:00')
	);

	// --- 10 derniers documents (émis OU reçus par l'entreprise choisie) ---
	$docs = array();
	$st = $pdo->query(
		'SELECT d.id, d.numero, d.type, d.statut, d.date_document, en.nom AS entreprise, end_.nom AS entreprise_dest,
		        CASE WHEN d.entreprise_id IN (' . $mes . ') THEN e.nom END AS emplacement,
		        CASE WHEN ed.entreprise_id IN (' . $mes . ') THEN ed.nom END AS emplacement_dest,
		        COALESCE(NULLIF(u.nom_complet, \'\'), u.nom_utilisateur) AS utilisateur, d.total
		   FROM documents d
		   JOIN entreprises en ON en.id = d.entreprise_id
		   JOIN emplacements e ON e.id = d.emplacement_id
		   LEFT JOIN emplacements ed ON ed.id = d.emplacement_dest_id
		   LEFT JOIN entreprises end_ ON end_.id = d.entreprise_dest_id
		   LEFT JOIN utilisateurs u ON u.id = d.utilisateur_id
		  WHERE d.entreprise_id IN (' . $liste . ') OR d.entreprise_dest_id IN (' . $liste . ')
		  ORDER BY d.id DESC LIMIT 10'
	);
	foreach ($st->fetchAll() as $d) {
		$l = array(
			'id' => (int) $d['id'],
			'numero' => $d['numero'],
			'type' => $d['type'],
			'type_libelle' => isset(TYPES_DOCUMENT_FR[$d['type']]) ? TYPES_DOCUMENT_FR[$d['type']] : $d['type'],
			'statut' => $d['statut'],
			'date' => $d['date_document'],
			'entreprise' => $d['entreprise'],
			'entreprise_dest' => $d['entreprise_dest'],
			'emplacement' => $d['emplacement'],
			'emplacement_dest' => $d['emplacement_dest'],
			'utilisateur' => $d['utilisateur'],
		);
		if ($ctx['couts']) {
			$l['total'] = $d['total'];
		}
		$docs[] = $l;
	}

	$r = array(
		'portee' => array('ids' => $ids, 'noms' => $noms, 'libelle' => $noms ? implode(', ', $noms) : 'aucune entreprise'),
		'montants' => $ctx['couts'],
		'role' => $ctx['role'],
		'aujourdhui' => $aujourdhui,
		'cartes' => array(
			'pieces_actives' => $actives,
			'pieces_en_stock' => (int) $enStock['n'],
			'sous_minimum' => count($sous),
			'mouvements_jour' => (int) $jour['n'],
			'documents_jour' => (int) $jour['docs'],
		),
		'derniers_documents' => $docs,
		'plus_bas' => array_slice($sous, 0, 5),
	);

	// --- gestionnaire+ : valeur d'inventaire et factures internes du mois ---
	if ($ctx['couts']) {
		$val = inventaire()->valeurInventaire($uid, $ids);
		$r['valeur'] = array();
		foreach ($val['entreprises'] as $v) {
			$r['valeur'][] = array('id' => (int) $v['id'], 'nom' => $v['nom'], 'valeur' => $v['valeur']);
		}

		$du = date('Y-m-01');
		$au = date('Y-m-t');
		$agreger = function ($colonne) use ($pdo, $liste, $du, $au) {
			$st = $pdo->prepare(
				"SELECT $colonne AS id, SUM(total) AS t, COUNT(*) AS n FROM documents
				  WHERE type = 'facture_interne' AND statut = 'valide' AND date_document BETWEEN ? AND ? AND $colonne IN ($liste)
				  GROUP BY $colonne"
			);
			$st->execute(array($du, $au));
			$o = array();
			foreach ($st->fetchAll() as $x) {
				$o[(int) $x['id']] = array('t' => $x['t'], 'n' => (int) $x['n']);
			}
			return $o;
		};
		$emis = $agreger('entreprise_id');
		$recu = $agreger('entreprise_dest_id');
		$lignes = array();
		foreach (inventaire()->listeEntreprises($uid) as $en) {
			$id = (int) $en['id'];
			if (!in_array($id, $ids, true)) {
				continue;
			}
			$e = isset($emis[$id]) ? $emis[$id]['t'] : '0.00';
			$c = isset($recu[$id]) ? $recu[$id]['t'] : '0.00';
			$lignes[] = array(
				'id' => $id,
				'nom' => $en['nom'],
				'emis' => $e,
				'recu' => $c,
				'solde' => Dec::fmt(Dec::parse($e, Dec::TOTAL) - Dec::parse($c, Dec::TOTAL), Dec::TOTAL),   // > 0 : on nous doit ; < 0 : nous devons
				'nb_emises' => isset($emis[$id]) ? $emis[$id]['n'] : 0,
				'nb_recues' => isset($recu[$id]) ? $recu[$id]['n'] : 0,
			);
		}
		$r['factures'] = array(
			'libelle_mois' => MOIS_FR[(int) date('n')] . ' ' . date('Y'),
			'du' => $du,
			'au' => $au,
			'lignes' => $lignes,
		);
	}
	return $r;
});
