<?php
// Export CSV du stock (employé+) avec les mêmes filtres que le tableau : GET vue, entreprise_id, emplacement_id, categorie_id, zero, q.
// Même définition SQL que stock_data.php. Un employé n'a AUCUN coût ni valeur dans le fichier ; un gestionnaire+ ajoute coût moyen et valeur.
// Format : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées. Refus : texte brut avec le code HTTP (403 / 400).
require_once __DIR__ . '/stock_lib.php';
Suivi::executerExport(function ($ctx) {
	global $pdo;
	$f = Suivi::filtresStock($ctx, Suivi::requete());
	$def = Suivi::stockRequete($ctx, $f);
	$piece = ($f['vue'] === 'piece');

	$select = array();
	foreach ($def['colonnes'] as $alias => $expr) {
		$select[] = $expr . ' AS `' . $alias . '`';
	}
	$sql = 'SELECT ' . implode(', ', $select) . ' FROM ' . $def['from']
		. ($def['where'] ? ' WHERE ' . implode(' AND ', $def['where']) : '')
		. ' ORDER BY p.code ASC, ' . $def['colonnes']['cle'] . ' ASC';
	$st = $pdo->prepare($sql);
	$st->execute($def['params']);

	$entetes = array('Code', 'Pièce', 'Catégorie', 'Entreprise');
	if (!$piece) {
		$entetes[] = 'Emplacement';
	}
	$entetes[] = $piece ? 'Quantité totale' : 'Quantité';
	$entetes[] = 'Unité';
	$entetes[] = 'Minimum';
	$entetes[] = 'Sous le minimum';
	if ($ctx['couts']) {
		$entetes[] = 'Coût moyen ($)';
		$entetes[] = 'Valeur ($)';
	}
	Suivi::journalExport($ctx, 'export.stock', array('vue' => $f['vue'], 'entreprises' => $f['entreprises'], 'filtres' => array_filter(array(
		'emplacement' => $f['emplacement'], 'categorie' => $f['categorie'], 'zero' => $f['zero'] ? 1 : null, 'q' => $f['q'] !== '' ? $f['q'] : null,
	))));
	Suivi::csvDebut('stock-' . date('Y-m-d') . '.csv', $entetes);
	while ($l = $st->fetch()) {
		$ligne = array(
			Suivi::csvTexte($l['code']), Suivi::csvTexte($l['nom']), Suivi::csvTexte($l['categorie']), Suivi::csvTexte($l['entreprise']),
		);
		if (!$piece) {
			$ligne[] = Suivi::csvTexte($l['emplacement'] . ($l['emp_actif'] ? '' : ' (désactivé)'));
		}
		$ligne[] = Suivi::csvNombre($l['quantite'], 0, 3);
		$ligne[] = Suivi::csvTexte($l['unite']);
		$ligne[] = Suivi::csvNombre($l['minimum'], 0, 3);
		$ligne[] = Suivi::sousMinimumLigne($l) ? 'oui' : 'non';
		if ($ctx['couts']) {
			$ligne[] = Suivi::csvNombre($l['cout_moyen'], 2, 4);
			$ligne[] = Suivi::csvNombre($l['valeur'], 2, 2);
		}
		Suivi::csvLigne($ligne);
	}
});
