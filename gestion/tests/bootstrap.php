<?php
// Amorçage commun des tests : base dédiée beauchemin_test (créée par tests/run.sh).
putenv('DB_NAME=' . (getenv('DB_NAME') ?: 'beauchemin_test'));
require __DIR__ . '/../app/init.php';

function ok($cond, $msg) {
	global $T_PASS, $T_FAIL;
	if ($cond) { $T_PASS++; return; }
	$T_FAIL++;
	echo "  ÉCHEC : $msg\n";
}
function egal($attendu, $reel, $msg) {
	ok($attendu === $reel, $msg . ' — attendu ' . var_export($attendu, true) . ', obtenu ' . var_export($reel, true));
}
/** Vérifie qu'une action échoue avec une InventaireException dont le message contient $fragment. */
function refuse($fn, $fragment, $msg) {
	try { $fn(); }
	catch (InventaireException $e) { ok($fragment === '' || mb_stripos($e->getMessage(), $fragment) !== false, $msg . ' — message : ' . $e->getMessage()); return; }
	catch (Throwable $e) { ok(false, $msg . ' — mauvaise exception : ' . get_class($e) . ' ' . $e->getMessage()); return; }
	ok(false, $msg . ' — aurait dû être refusé');
}
function groupe($titre) { echo "• $titre\n"; }
$T_PASS = 0; $T_FAIL = 0;

function q($sql, $p = array()) { global $pdo; $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(); }
function val($sql, $p = array()) { global $pdo; $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); }
function stock($piece, $emp) { $v = val('SELECT quantite FROM stock WHERE piece_id = ? AND emplacement_id = ?', array($piece, $emp)); return $v === false ? '0.000' : $v; }
function cout($ent, $piece) { $v = val('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ?', array($ent, $piece)); return $v === false ? null : $v; }

/** Invariants globaux : stock = somme des mouvements, jamais négatif, coûts >= 0, numéros uniques. */
function invariants($etiquette) {
	egal(0, (int) val('SELECT COUNT(*) FROM (SELECT s.piece_id FROM stock s LEFT JOIN (SELECT piece_id, emplacement_id, SUM(quantite) q FROM mouvements GROUP BY piece_id, emplacement_id) m USING (piece_id, emplacement_id) WHERE s.quantite <> COALESCE(m.q, 0)) x'), "$etiquette : stock = somme des mouvements");
	egal(0, (int) val('SELECT COUNT(*) FROM stock WHERE quantite < 0'), "$etiquette : aucun stock négatif");
	egal(0, (int) val('SELECT COUNT(*) FROM stock_couts WHERE cout_moyen < 0'), "$etiquette : aucun coût négatif");
	egal(0, (int) val('SELECT COUNT(*) FROM (SELECT d.id FROM documents d JOIN document_lignes l ON l.document_id = d.id GROUP BY d.id HAVING ABS(SUM(l.total_ligne) - MAX(d.total)) > 0.001) x'), "$etiquette : total du document = somme des lignes");
	egal(0, (int) val('SELECT COUNT(*) FROM (SELECT numero FROM documents GROUP BY numero HAVING COUNT(*) > 1) x'), "$etiquette : numéros de documents uniques");
}
