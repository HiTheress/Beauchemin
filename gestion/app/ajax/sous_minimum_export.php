<?php
// Export CSV des pièces sous le minimum (employé+). GET : entreprise_id (numéro, ou 0 = toutes mes entreprises ; absent : la barre du haut ; 403 si non permise).
// Colonnes : Code, Pièce, Entreprise, Quantité, Minimum, Manque, Unité. Aucun coût. Du plus grand manque au plus petit.
// Format : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées. Refus : texte brut avec le code HTTP (403 / 400).
require_once __DIR__ . '/stock_lib.php';
Suivi::executerExport(function ($ctx) {
	$ids = Suivi::portee($ctx, Suivi::requete());
	$lignes = Suivi::sousMinimum($ctx, $ids);
	Suivi::journalExport($ctx, 'export.sous_minimum', array('entreprises' => Suivi::nomsEntreprises($ids)));
	Suivi::csvDebut('sous-minimum-' . date('Y-m-d') . '.csv', array('Code', 'Pièce', 'Entreprise', 'Quantité', 'Minimum', 'Manque', 'Unité'));
	foreach ($lignes as $l) {
		Suivi::csvLigne(array(
			Suivi::csvTexte($l['code']), Suivi::csvTexte($l['nom']), Suivi::csvTexte($l['entreprise']),
			Suivi::csvNombre($l['quantite'], 0, 3), Suivi::csvNombre($l['minimum'], 0, 3), Suivi::csvNombre($l['manque'], 0, 3),
			Suivi::csvTexte($l['unite']),
		));
	}
});
