<?php
// Export CSV des pièces sous le minimum (employé+). GET : entreprise_id (facultatif ; sinon la barre du haut, sinon toutes les entreprises permises).
// Colonnes : Code, Pièce, Entreprise, Quantité, Minimum, Manque, Unité. Aucun coût. Du plus grand manque au plus petit.
// Format : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées. Refus : texte brut avec le code HTTP (403 / 400).
require_once __DIR__ . '/stock_lib.php';
Suivi::executerExport(function ($ctx) {
	$req = Suivi::requete();
	$demande = Suivi::entier($req, 'entreprise_id', 'Entreprise');
	$ids = Suivi::entreprises($ctx, $demande !== null ? $demande : (entreprise_courante() ?: null));
	$lignes = Suivi::sousMinimum($ctx, $ids);
	Suivi::journalExport($ctx, 'export.sous_minimum', array('entreprises' => $ids));
	Suivi::csvDebut('sous-minimum-' . date('Y-m-d') . '.csv', array('Code', 'Pièce', 'Entreprise', 'Quantité', 'Minimum', 'Manque', 'Unité'));
	foreach ($lignes as $l) {
		Suivi::csvLigne(array(
			Suivi::csvTexte($l['code']), Suivi::csvTexte($l['nom']), Suivi::csvTexte($l['entreprise']),
			Suivi::csvNombre($l['quantite'], 0, 3), Suivi::csvNombre($l['minimum'], 0, 3), Suivi::csvNombre($l['manque'], 0, 3),
			Suivi::csvTexte($l['unite']),
		));
	}
});
