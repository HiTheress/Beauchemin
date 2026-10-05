<?php
// Modèle CSV d'import du catalogue (gestionnaire+) : séparateur « ; », UTF-8 avec BOM, lignes d'exemple en commentaire (#).
// Les colonnes minimum_entreprise_N sont générées à partir des entreprises actives auxquelles l'utilisateur a accès.
require_once '../init.php';
require_once __DIR__ . '/import_lib.php';
try {
	$uid = utilisateur_id();
	inventaire()->exiger($uid, 'catalogue');
	$entreprises = inventaire()->listeEntreprises($uid);
} catch (InventaireException $ex) {
	ImportCatalogue::refuserTelechargement($ex->getMessage(), 403);
}
$cols = ImportCatalogue::colonnesModele($entreprises);
$exemples = array(
	// Une pièce complète : prix fournisseur, minimums, stock initial dans un emplacement (code EMP-… ou nom)
	array(
		'code' => '#EXEMPLE-1', 'nom' => 'Gicleur 0,75 gph 80° type B', 'categorie' => 'Gicleurs et pompes', 'unite' => 'unité',
		'code_barres' => '036000291452', 'description' => 'Exemple : ligne ignorée (le code commence par #)', 'fournisseur' => 'Nom du fournisseur',
		'prix_fournisseur' => '6,25', 'no_fournisseur' => 'GIC-075', 'emplacement' => 'EMP-000001', 'quantite' => '24', 'cout' => '6,25',
	),
	// Une pièce minimale : seuls le code et le nom sont obligatoires
	array('code' => '#EXEMPLE-2', 'nom' => 'Joint de porte (rouleau)', 'unite' => 'rouleau'),
);
$mins = array('10', '4', '2', '2', '2', '2', '2', '2');
ImportCatalogue::entetesCsv('modele-import-pieces.csv');
echo ImportCatalogue::csvLigne($cols);
foreach ($exemples as $i => $ex) {
	$ligne = array();
	$n = 0;
	foreach ($cols as $c) {
		if (strpos($c, 'minimum_entreprise_') === 0) {
			$ligne[] = $i === 0 ? $mins[min($n++, count($mins) - 1)] : '';
		} else {
			$ligne[] = isset($ex[$c]) ? $ex[$c] : '';
		}
	}
	echo ImportCatalogue::csvLigne($ligne);
}
