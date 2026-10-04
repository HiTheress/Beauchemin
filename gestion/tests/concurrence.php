<?php
// Accès simultanés : plusieurs processus font des opérations croisées sur les mêmes pièces et emplacements.
// Vérifie : aucun interblocage non géré, stock cohérent avec le registre, numéros uniques, coûts sains.
require __DIR__ . '/bootstrap.php';
global $pdo, $T_PASS, $T_FAIL;
echo "• Concurrence (6 processus)\n";
$h = password_hash('x', PASSWORD_DEFAULT);
$pdo->exec("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES ('cc_adm','$h','admin')");
$user = (int) val("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'cc_adm'");
$pdo->exec("INSERT INTO entreprises (id, code, nom) VALUES (21,'CC1','Conc 1'),(22,'CC2','Conc 2')");
$pdo->exec("INSERT INTO emplacements (id, entreprise_id, nom, type) VALUES (201,21,'C1a','entrepot'),(202,21,'C1b','cube'),(203,22,'C2a','entrepot'),(204,22,'C2b','boutique')");
$ids = array();
for ($i = 1; $i <= 5; $i++) { $pdo->exec("INSERT INTO pieces (code, nom) VALUES ('CC$i', 'Pièce conc $i')"); $ids[] = (int) $pdo->lastInsertId(); }
$inv = new Inventaire($pdo);
foreach (array(201, 203) as $e) {
	$inv->recevoir($user, array('emplacement_id' => $e, 'lignes' => array_map(function ($p) { return array('piece_id' => $p, 'quantite' => '40', 'cout_unitaire' => '3.5'); }, $ids)));
}
$procs = array(); $pipes = array();
for ($w = 1; $w <= 6; $w++) {
	$cmd = array(PHP_BINARY, __DIR__ . '/worker.php', (string) $user, '60', (string) $w, implode(',', $ids));
	$procs[$w] = proc_open($cmd, array(1 => array('pipe', 'w'), 2 => array('pipe', 'w')), $pipes[$w], null, array('DB_NAME' => getenv('DB_NAME')) + $_ENV + array('PATH' => getenv('PATH')));
}
$tot = array('ok' => 0, 'refus' => 0, 'inattendues' => 0);
foreach ($procs as $w => $pr) {
	$out = stream_get_contents($pipes[$w][1]); $err = stream_get_contents($pipes[$w][2]);
	$code = proc_close($pr);
	$r = json_decode($out, true);
	if ($err !== '') { echo $err; }
	ok($r !== null && $code === 0, "processus $w terminé sans erreur inattendue");
	if ($r) { foreach ($tot as $k => $_) { $tot[$k] += $r[$k]; } }
}
echo "  {$tot['ok']} opérations acceptées, {$tot['refus']} refusées, {$tot['inattendues']} erreurs inattendues\n";
ok($tot['ok'] > 100, 'beaucoup d\'opérations réussies en parallèle');
egal(0, $tot['inattendues'], 'aucun interblocage / erreur SQL non gérée');
invariants('après concurrence');
$n = (int) val("SELECT COUNT(*) FROM documents WHERE entreprise_id IN (21,22)");
ok($n >= $tot['ok'], 'chaque opération acceptée a son document');
$min = (int) val("SELECT MIN(SUBSTRING_INDEX(numero,'-',-1)) FROM documents WHERE type = 'facture_interne'");
egal(0, (int) val("SELECT COUNT(*) FROM (SELECT type, YEAR(date_document) y, COUNT(*) c, MAX(CAST(SUBSTRING_INDEX(numero,'-',-1) AS UNSIGNED)) m FROM documents GROUP BY type, YEAR(date_document) HAVING c <> m) x"), 'numérotation sans trou ni doublon');
echo "\n" . ($T_FAIL === 0 ? "OK" : "ÉCHECS") . " — $T_PASS vérifications réussies, $T_FAIL échec(s)\n";
exit($T_FAIL === 0 ? 0 : 1);
