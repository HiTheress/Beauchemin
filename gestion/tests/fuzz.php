<?php
// Test « au hasard » : des centaines d'opérations valides ET invalides, comparées à un modèle simple en mémoire.
require __DIR__ . '/bootstrap.php';
global $pdo, $T_PASS, $T_FAIL;
$inv = new Inventaire($pdo);
$seed = (int) (getenv('FUZZ_SEED') ?: 20261004);
mt_srand($seed);
echo "• Test aléatoire (graine $seed)\n";

$h = password_hash('x', PASSWORD_DEFAULT);
$pdo->exec("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES ('fz_adm','$h','admin'),('fz_emp','$h','employe')");
$UA = (int) val("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'fz_adm'");
$UE = (int) val("SELECT id FROM utilisateurs WHERE nom_utilisateur = 'fz_emp'");
$pdo->exec("INSERT INTO utilisateur_entreprises VALUES ($UE, 1)");
$pdo->exec("INSERT INTO entreprises (id, code, nom) VALUES (11,'FZ1','Fuzz 1'),(12,'FZ2','Fuzz 2')");
$pdo->exec("INSERT INTO emplacements (id, entreprise_id, nom, type) VALUES (101,11,'F1a','entrepot'),(102,11,'F1b','cube'),(103,12,'F2a','entrepot'),(104,12,'F2b','boutique')");
$EMP = array(101, 102, 103, 104);
$ENT = array(101 => 11, 102 => 11, 103 => 12, 104 => 12);
$pieces = array();
for ($i = 1; $i <= 6; $i++) {
	$pdo->exec("INSERT INTO pieces (code, nom, unite) VALUES ('FZ$i', 'Pièce fuzz $i', " . ($i % 3 === 0 ? "'m'" : "'unité'") . ")");
	$pieces[] = (int) $pdo->lastInsertId();
}
// modèle : [piece][emp] => quantité en milli ; coûts vus par (entreprise, pièce)
$model = array(); $vus = array();
function mq(&$m, $p, $e) { return isset($m[$p][$e]) ? $m[$p][$e] : 0; }
$lignesAlea = function ($signe = false, $avecCout = false) use ($pieces) {
	$n = mt_rand(1, 3); $l = array();
	for ($i = 0; $i < $n; $i++) {
		$q = mt_rand(1, 12) * (mt_rand(0, 3) ? 1 : 0.5);
		if ($signe && mt_rand(0, 1)) { $q = -$q; }
		$ligne = array('piece_id' => $pieces[mt_rand(0, count($pieces) - 1)], 'quantite' => (string) $q);
		if ($avecCout) { $ligne['cout_unitaire'] = sprintf('%.4f', mt_rand(1, 500) / 7); }
		$l[] = $ligne;
	}
	return $l;
};
$ok = 0; $refus = 0;
for ($k = 0; $k < 400; $k++) {
	$op = mt_rand(1, 7);
	$user = mt_rand(0, 9) ? $UA : $UE;
	$e1 = $EMP[mt_rand(0, 3)]; $e2 = $EMP[mt_rand(0, 3)];
	try {
		switch ($op) {
			case 1: case 2:
				$lg = $lignesAlea(false, true);
				$inv->recevoir($user, array('emplacement_id' => $e1, 'lignes' => $lg));
				foreach ($lg as $l) { $p = $l['piece_id']; $model[$p][$e1] = mq($model, $p, $e1) + Dec::parse($l['quantite'], 3); $vus[$ENT[$e1]][$p][] = Dec::parse($l['cout_unitaire'], 4); }
				break;
			case 3:
				$lg = $lignesAlea();
				$inv->transferer($user, array('emplacement_id' => $e1, 'emplacement_dest_id' => $e2, 'lignes' => $lg));
				foreach ($lg as $l) { $p = $l['piece_id']; $q = Dec::parse($l['quantite'], 3); $model[$p][$e1] = mq($model, $p, $e1) - $q; $model[$p][$e2] = mq($model, $p, $e2) + $q; }
				break;
			case 4:
				$lg = $lignesAlea();
				$inv->sortir($user, array('emplacement_id' => $e1, 'motif' => 'service', 'lignes' => $lg));
				foreach ($lg as $l) { $p = $l['piece_id']; $model[$p][$e1] = mq($model, $p, $e1) - Dec::parse($l['quantite'], 3); }
				break;
			case 5:
				$lg = $lignesAlea();
				$inv->factureInterne($user, array('emplacement_id' => $e1, 'entreprise_dest_id' => $ENT[$e2], 'emplacement_dest_id' => $e2, 'permettre_cout_zero' => true, 'lignes' => $lg));
				foreach ($lg as $l) {
					$p = $l['piece_id']; $q = Dec::parse($l['quantite'], 3);
					$model[$p][$e1] = mq($model, $p, $e1) - $q; $model[$p][$e2] = mq($model, $p, $e2) + $q;
					$c = Dec::parse(val('SELECT cout_unitaire FROM document_lignes WHERE document_id = (SELECT MAX(id) FROM documents) AND piece_id = ? LIMIT 1', array($p)), 4);
					$vus[$ENT[$e2]][$p][] = $c;
				}
				break;
			case 6:
				$lg = $lignesAlea(true);
				$inv->ajuster($user, array('emplacement_id' => $e1, 'motif' => 'correction', 'lignes' => $lg));
				// lignes d'une même pièce fusionnées par le service : même effet net
				foreach ($lg as $l) { $p = $l['piece_id']; $model[$p][$e1] = mq($model, $p, $e1) + Dec::parse($l['quantite'], 3); }
				break;
			case 7:
				$doc = q("SELECT id FROM documents WHERE statut = 'valide' AND type <> 'ajustement' ORDER BY RAND() LIMIT 1");
				if (!$doc) { continue 2; }
				$d = (int) $doc[0]['id'];
				$ligs = q('SELECT piece_id, quantite, cout_unitaire FROM document_lignes WHERE document_id = ?', array($d));
				$hd = q('SELECT type, emplacement_id src, emplacement_dest_id dst FROM documents WHERE id = ?', array($d))[0];
				$inv->annuler($UA, $d, 'fuzz');
				foreach ($ligs as $l) {
					$p = (int) $l['piece_id']; $q = Dec::parse($l['quantite'], 3);
					$s = (int) $hd['src']; $t = $hd['dst'] ? (int) $hd['dst'] : null;
					if ($hd['type'] === 'reception') { $model[$p][$s] = mq($model, $p, $s) - $q; }
					elseif ($hd['type'] === 'sortie') { $model[$p][$s] = mq($model, $p, $s) + $q; }
					else { $model[$p][$s] = mq($model, $p, $s) + $q; $model[$p][$t] = mq($model, $p, $t) - $q; }
				}
				break;
		}
		$ok++;
	} catch (InventaireException $e) {
		$refus++;
	}
	if ($k % 100 === 99) { invariants("fuzz après " . ($k + 1) . " opérations"); }
}
echo "  $ok opérations acceptées, $refus refusées\n";
ok($ok > 100 && $refus > 5, 'le test a exercé des opérations valides et invalides');
$fautes = 0;
foreach ($pieces as $p) {
	foreach ($EMP as $e) {
		$attendu = mq($model, $p, $e);
		$reel = Dec::parse(stock($p, $e), 3);
		if ($attendu !== $reel) { $fautes++; echo "  écart pièce $p emplacement $e : modèle " . Dec::fmt($attendu, 3) . ", base " . Dec::fmt($reel, 3) . "\n"; }
		ok($attendu >= 0, "modèle jamais négatif ($p/$e)");
	}
}
egal(0, $fautes, 'le stock en base égale le modèle indépendant');
foreach ($vus as $ent => $par) {
	foreach ($par as $p => $coûts) {
		$Q = array_sum(array_map(function ($e) use ($p, $ENT, $ent) { return $ENT[$e] === $ent ? Dec::parse(stock($p, $e), 3) : 0; }, array(101, 102, 103, 104)));
		$c = cout($ent, $p);
		if ($Q > 0 && $c !== null) {
			$c4 = Dec::parse($c, 4);
			ok($c4 >= min($coûts) - 5 && $c4 <= max($coûts) + 5, "coût moyen ($ent/$p) entre le min et le max des coûts d'entrée : $c vs [" . Dec::fmt(min($coûts), 4) . ", " . Dec::fmt(max($coûts), 4) . "]");
		}
	}
}
invariants('fuzz final');
echo "\n" . ($T_FAIL === 0 ? "OK" : "ÉCHECS") . " — $T_PASS vérifications réussies, $T_FAIL échec(s)\n";
exit($T_FAIL === 0 ? 0 : 1);
