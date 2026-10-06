<?php
// Export CSV de l'historique des mouvements (employé+) avec les mêmes filtres que le tableau :
// GET entreprise_id, piece_id, emplacement_id, type, du, au, utilisateur_id, numero. Du plus récent au plus ancien.
// Un employé n'a AUCUN coût ni valeur dans le fichier ; un gestionnaire+ ajoute coût unitaire et valeur.
// Format : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées. Refus : texte brut avec le code HTTP (403 / 400).
require_once __DIR__ . '/stock_lib.php';
Suivi::executerExport(function ($ctx) {
	global $pdo;
	$f = Suivi::filtresHistorique($ctx, Suivi::requete());
	$def = Suivi::historiqueRequete($ctx, $f);

	$select = array();
	foreach ($def['colonnes'] as $alias => $expr) {
		$select[] = $expr . ' AS `' . $alias . '`';
	}
	$st = $pdo->prepare('SELECT ' . implode(', ', $select) . ' FROM ' . $def['from'] . ' WHERE ' . implode(' AND ', $def['where']) . ' ORDER BY m.id DESC');
	$st->execute($def['params']);

	$entetes = array('Date et heure', 'Document', 'Type', 'Code', 'Pièce', 'Entreprise', 'Emplacement', 'Quantité', 'Unité', 'Utilisateur', 'Mention');
	if ($ctx['couts']) {
		$entetes[] = 'Coût unitaire ($)';
		$entetes[] = 'Valeur ($)';
	}
	Suivi::journalExport($ctx, 'export.historique', array(
		'entreprises' => Suivi::nomsEntreprises($f['entreprises']),
		'filtres' => array_filter(array(
			'piece' => Suivi::nomDe('piece', $f['piece']),
			'emplacement' => Suivi::nomDe('emplacement', $f['emplacement']),
			'type' => $f['type'] !== '' ? TYPES_DOCUMENT_FR[$f['type']] : null,
			'du' => $f['du'],
			'au' => $f['au'],
			'utilisateur' => Suivi::nomDe('utilisateur', $f['utilisateur']),
			'numero' => $f['numero'] !== '' ? $f['numero'] : null,
		)),
	));
	Suivi::csvDebut('historique-' . date('Y-m-d') . '.csv', $entetes);
	while ($l = $st->fetch()) {
		$mention = $l['annulation'] ? 'Annulation' : ($l['doc_statut'] === 'annule' ? 'Document annulé' : '');
		$ligne = array(
			Suivi::csvTexte(substr((string) $l['date'], 0, 16)),
			Suivi::csvTexte($l['numero']),
			Suivi::csvTexte(isset(TYPES_DOCUMENT_FR[$l['type']]) ? TYPES_DOCUMENT_FR[$l['type']] : $l['type']),
			Suivi::csvTexte($l['code']),
			Suivi::csvTexte($l['nom']),
			Suivi::csvTexte($l['entreprise']),
			Suivi::csvTexte($l['emplacement']),
			Suivi::csvNombre($l['quantite'], 0, 3),
			Suivi::csvTexte($l['unite']),
			Suivi::csvTexte($l['utilisateur']),
			Suivi::csvTexte($mention),
		);
		if ($ctx['couts']) {
			$ligne[] = Suivi::csvNombre($l['cout_unitaire'], 2, 4);
			$ligne[] = Suivi::csvNombre($l['valeur'], 2, 2);
		}
		Suivi::csvLigne($ligne);
	}
});
