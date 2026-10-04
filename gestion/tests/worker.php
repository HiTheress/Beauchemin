<?php
// Processus de travail du test de concurrence : fait des opérations en boucle sur des pièces/emplacements partagés.
require __DIR__ . '/bootstrap.php';
global $pdo;
$inv = new Inventaire($pdo);
$user = (int) $argv[1]; $n = (int) $argv[2]; $id = (int) $argv[3];
mt_srand(1000 + $id);
$P = array_map('intval', explode(',', $argv[4]));
$EMPS = array(201, 202, 203, 204); $ENT = array(201 => 21, 202 => 21, 203 => 22, 204 => 22);
$inattendues = 0; $ok = 0; $refus = 0;
for ($i = 0; $i < $n; $i++) {
	$p = $P[mt_rand(0, count($P) - 1)]; $p2 = $P[mt_rand(0, count($P) - 1)];
	$e1 = $EMPS[mt_rand(0, 3)]; $e2 = $EMPS[mt_rand(0, 3)];
	$q = (string) mt_rand(1, 4);
	try {
		switch (mt_rand(1, 6)) {
			case 1: $inv->recevoir($user, array('emplacement_id' => $e1, 'lignes' => array(array('piece_id' => $p, 'quantite' => '5', 'cout_unitaire' => (string) mt_rand(1, 50)), array('piece_id' => $p2, 'quantite' => '3', 'cout_unitaire' => '2')))); break;
			case 2: $inv->transferer($user, array('emplacement_id' => $e1, 'emplacement_dest_id' => $e2, 'lignes' => array(array('piece_id' => $p, 'quantite' => $q), array('piece_id' => $p2, 'quantite' => '1')))); break;
			case 3: $inv->sortir($user, array('emplacement_id' => $e1, 'motif' => 'service', 'lignes' => array(array('piece_id' => $p, 'quantite' => '1')))); break;
			case 4: case 5: $inv->factureInterne($user, array('emplacement_id' => $e1, 'entreprise_dest_id' => $ENT[$e2], 'emplacement_dest_id' => $e2, 'permettre_cout_zero' => true, 'lignes' => array(array('piece_id' => $p, 'quantite' => $q), array('piece_id' => $p2, 'quantite' => '1')))); break;
			case 6: $inv->ajuster($user, array('emplacement_id' => $e1, 'motif' => 'correction', 'lignes' => array(array('piece_id' => $p, 'quantite' => '2')))); break;
		}
		$ok++;
	} catch (InventaireException $e) { $refus++; }
	catch (Throwable $e) { $inattendues++; fwrite(STDERR, "worker $id : " . get_class($e) . ' ' . $e->getMessage() . "\n"); }
}
echo json_encode(array('ok' => $ok, 'refus' => $refus, 'inattendues' => $inattendues));
exit($inattendues ? 1 : 0);
