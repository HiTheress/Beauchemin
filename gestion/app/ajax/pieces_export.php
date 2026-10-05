<?php
// Export CSV du catalogue (tous les rôles ; coûts moyens réservés aux gestionnaires et admins).
// GET : inactives=1 pour inclure les pièces désactivées. Colonnes de quantité/minimum : entreprises du filtre courant (barre du haut).
// Format : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées. Ré-importable avec pieces_import :
//   code ; nom ; categorie ; unite ; code_barres (alias séparés par |) ; description ; actif ; quantite_entreprise_N ; [cout_moyen_entreprise_N] ; minimum_entreprise_N
// Les colonnes actif, quantite_entreprise_N et cout_moyen_entreprise_N sont informatives : l'import les ignore (il ne touche jamais au stock).
require_once '../init.php';
require_once __DIR__ . '/import_lib.php';
try {
	$uid = utilisateur_id();
	$u = inventaire()->exiger($uid, 'consulter');
	$couts = inventaire()->peutVoirCouts($uid);
	$entIds = array_values(array_intersect(array_map('intval', entreprises_filtre()), $u['entreprises']));
} catch (InventaireException $ex) {
	json_fail($ex->getMessage(), 403);
}
sort($entIds);
$inactives = !empty($_GET['inactives']);

$cols = array('code', 'nom', 'categorie', 'unite', 'code_barres', 'description', 'actif');
foreach ($entIds as $id) { $cols[] = 'quantite_entreprise_' . $id; }
if ($couts) { foreach ($entIds as $id) { $cols[] = 'cout_moyen_entreprise_' . $id; } }
foreach ($entIds as $id) { $cols[] = 'minimum_entreprise_' . $id; }

$alias = array();
foreach ($pdo->query('SELECT piece_id, code FROM pieces_codes ORDER BY id') as $r) { $alias[(int) $r['piece_id']][] = $r['code']; }
$qte = array(); $cout = array(); $min = array();
if ($entIds) {
	$in = implode(',', array_fill(0, count($entIds), '?'));
	$st = $pdo->prepare("SELECT s.piece_id, e.entreprise_id, SUM(s.quantite) AS q FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE e.entreprise_id IN ($in) GROUP BY s.piece_id, e.entreprise_id");
	$st->execute($entIds);
	foreach ($st as $r) { $qte[(int) $r['piece_id'] . ':' . (int) $r['entreprise_id']] = $r['q']; }
	if ($couts) {
		$st = $pdo->prepare("SELECT piece_id, entreprise_id, cout_moyen FROM stock_couts WHERE entreprise_id IN ($in)");
		$st->execute($entIds);
		foreach ($st as $r) { $cout[(int) $r['piece_id'] . ':' . (int) $r['entreprise_id']] = $r['cout_moyen']; }
	}
	$st = $pdo->prepare("SELECT piece_id, entreprise_id, minimum FROM seuils WHERE entreprise_id IN ($in)");
	$st->execute($entIds);
	foreach ($st as $r) { $min[(int) $r['piece_id'] . ':' . (int) $r['entreprise_id']] = $r['minimum']; }
}

ImportCatalogue::entetesCsv('catalogue-pieces-' . date('Y-m-d') . '.csv');
echo ImportCatalogue::csvLigne($cols);
$st = $pdo->query('SELECT p.id, p.code, p.nom, p.description, p.unite, p.actif, c.nom AS categorie FROM pieces p LEFT JOIN categories c ON c.id = p.categorie_id'
	. ($inactives ? '' : ' WHERE p.actif = 1') . ' ORDER BY p.code', PDO::FETCH_ASSOC);
foreach ($st as $p) {
	$id = (int) $p['id'];
	$l = array($p['code'], $p['nom'], (string) $p['categorie'], $p['unite'], isset($alias[$id]) ? implode(' | ', $alias[$id]) : '', (string) $p['description'], $p['actif'] ? 'oui' : 'non');
	foreach ($entIds as $e) { $l[] = ImportCatalogue::decimalCsv(isset($qte[$id . ':' . $e]) ? $qte[$id . ':' . $e] : '0.000'); }
	if ($couts) { foreach ($entIds as $e) { $l[] = isset($cout[$id . ':' . $e]) ? ImportCatalogue::decimalCsv($cout[$id . ':' . $e], 2) : ''; } }
	foreach ($entIds as $e) { $l[] = isset($min[$id . ':' . $e]) ? ImportCatalogue::decimalCsv($min[$id . ':' . $e]) : ''; }
	echo ImportCatalogue::csvLigne($l);
}
