<?php
// Outils du test d2.js (module D2) : prépare des situations que l'interface seule ne permet pas de créer facilement.
// BASE DE DÉVELOPPEMENT SEULEMENT (DB_NAME=bea_*). Ligne de commande uniquement ; chaque commande écrit du JSON sur une ligne.
//   php tests/e2e/d2-outils.php exact      pièces X-1 / X-10 / X-100 (codes qui se contiennent), un alias exact, une pièce sans stock
//   php tests/e2e/d2-outils.php preparer   jeu de données de test (pièces piégées XSS / formules CSV, alias, zéro, désactivés,
//                                          annulation, mouvement daté du passé, 2 utilisateurs) ; écrit les identifiants créés
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
require __DIR__ . '/../../app/init.php';
if (!preg_match('/^bea_/', (string) DATABASE_NAME)) { exit("Refusé : ce n'est pas une base de développement (bea_*).\n"); }
$inv = new Inventaire($pdo);
$admin = (int) $pdo->query("SELECT id FROM utilisateurs WHERE role = 'admin' ORDER BY id LIMIT 1")->fetchColumn();
$cmd = isset($argv[1]) ? $argv[1] : '';

function nouvelUtilisateur(PDO $pdo, $nom, $role, array $ents)
{
	$pdo->prepare('INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES (?, ?, ?, ?)')
		->execute(array($nom, $nom, password_hash('Test-Beauchemin-1', PASSWORD_DEFAULT), $role));
	$uid = (int) $pdo->lastInsertId();
	foreach ($ents as $e) {
		$pdo->prepare('INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES (?, ?)')->execute(array($uid, (int) $e));
	}
	return $uid;
}

function nouvellePiece(PDO $pdo, $code, $nom, $unite, $cat = null, $actif = 1)
{
	$pdo->prepare('INSERT INTO pieces (code, nom, unite, categorie_id, actif) VALUES (?, ?, ?, ?, ?)')->execute(array($code, $nom, $unite, $cat, $actif));
	return (int) $pdo->lastInsertId();
}

switch ($cmd) {
	case 'preparer':
		$r = array();
		$r['emp_bch'] = nouvelUtilisateur($pdo, 'emp_bch', 'employe', array(2));
		$r['gest_bea'] = nouvelUtilisateur($pdo, 'gest_bea', 'gestionnaire', array(1));
		$r['sans_ent'] = nouvelUtilisateur($pdo, 'sans_ent', 'employe', array());

		$pdo->prepare('INSERT INTO categories (nom) VALUES (?)')->execute(array('<b>Cat piégée</b>'));
		$catXss = (int) $pdo->lastInsertId();
		$r['xss'] = nouvellePiece($pdo, 'XSS-1', '<img src=x onerror=alert(1)>', '<i>u</i>', $catXss);
		$r['csv1'] = nouvellePiece($pdo, 'CSV-1', '=HYPERLINK("http://exemple.test";"clic")', 'unité');
		$r['csv2'] = nouvellePiece($pdo, 'CSV-2', '@SUM(1+1); « guillemets » "doubles"', 'unité');
		$r['dec'] = nouvellePiece($pdo, 'DEC-1', 'Tuyau au pied', 'pi');
		$r['inac'] = nouvellePiece($pdo, 'INAC-1', 'Pièce désactivée avec stock', 'unité');
		$pdo->prepare("INSERT INTO pieces_codes (piece_id, code, type) VALUES (?, '9990001112223', 'fabricant')")->execute(array($r['xss']));

		// Un emplacement qui sera désactivé (garde son stock)
		$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Ancien cube', 'cube', 'EMP-000099')");
		$r['emp_ancien'] = (int) $pdo->lastInsertId();

		// Réceptions (coûts entiers pour des valeurs faciles à vérifier)
		$inv->recevoir($admin, array('emplacement_id' => 1, 'lignes' => array(
			array('piece_id' => $r['xss'], 'quantite' => 10, 'cout_unitaire' => '5.00'),
			array('piece_id' => $r['csv1'], 'quantite' => 3, 'cout_unitaire' => '2.50'),
			array('piece_id' => $r['csv2'], 'quantite' => 4, 'cout_unitaire' => '1.25'),
			array('piece_id' => $r['dec'], 'quantite' => '12,5', 'cout_unitaire' => '3.00'),
			array('piece_id' => $r['inac'], 'quantite' => 2, 'cout_unitaire' => '10.00'),
		)));
		$inv->recevoir($admin, array('emplacement_id' => 2, 'lignes' => array(
			array('piece_id' => $r['xss'], 'quantite' => 2, 'cout_unitaire' => '7.00'),
		)));
		$inv->recevoir($admin, array('emplacement_id' => $r['emp_ancien'], 'lignes' => array(
			array('piece_id' => $r['dec'], 'quantite' => '4.5', 'cout_unitaire' => '3.00'),
		)));
		// Minimums : XSS-1 sous le minimum dans les deux entreprises (10 < 50 ; 2 < 5)
		$pdo->prepare('INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (1, ?, 50), (2, ?, 5)')->execute(array($r['xss'], $r['xss']));
		$pdo->prepare('UPDATE pieces SET actif = 0 WHERE id = ?')->execute(array($r['inac']));
		$pdo->exec('UPDATE emplacements SET actif = 0 WHERE id = ' . (int) $r['emp_ancien']);

		// Une ligne de stock à zéro : tout le P-0005 du cube 12 est utilisé
		$qte = $pdo->query('SELECT quantite FROM stock WHERE piece_id = 5 AND emplacement_id = 3')->fetchColumn();
		$inv->sortir($admin, array('emplacement_id' => 3, 'motif' => 'service', 'lignes' => array(array('piece_id' => 5, 'quantite' => $qte))));

		// Un transfert annulé (mouvements d'annulation)
		$t = $inv->transferer($admin, array('emplacement_id' => 1, 'emplacement_dest_id' => 4, 'lignes' => array(array('piece_id' => 2, 'quantite' => 1))));
		$inv->annuler($admin, $t['id'], 'Erreur de saisie (test)');
		$r['transfert_annule'] = $t['numero'];

		// Un mouvement du passé (pour le filtre de dates) : la réception de la pièce DEC-1 dans l'ancien cube
		$pdo->exec("UPDATE mouvements SET date_mouvement = '2026-09-15 10:30:00' WHERE piece_id = " . (int) $r['dec'] . ' AND emplacement_id = ' . (int) $r['emp_ancien']);
		echo json_encode($r), "\n";
		break;
	case 'exact':
		// Codes qui se contiennent l'un l'autre (X-1, X-10, X-100), alias exact, pièce sans aucun stock ; une pièce sous son minimum
		$r = array();
		$r['x1'] = nouvellePiece($pdo, 'X-1', 'Vis courte', 'unité');
		$r['x10'] = nouvellePiece($pdo, 'X-10', 'Vis moyenne', 'unité');
		$r['x100'] = nouvellePiece($pdo, 'X-100', 'Vis longue', 'unité');
		$r['sans_stock'] = nouvellePiece($pdo, 'SANS-STOCK-1', 'Pièce neuve sans stock', 'unité');
		$pdo->prepare("INSERT INTO pieces_codes (piece_id, code, type) VALUES (?, '5551234567890', 'fabricant')")->execute(array($r['x1']));
		$inv->recevoir($admin, array('emplacement_id' => 1, 'lignes' => array(
			array('piece_id' => $r['x1'], 'quantite' => 5, 'cout_unitaire' => '1.00'),
			array('piece_id' => $r['x10'], 'quantite' => 6, 'cout_unitaire' => '1.00'),
			array('piece_id' => $r['x100'], 'quantite' => 7, 'cout_unitaire' => '1.00'),
		)));
		echo json_encode($r), "\n";
		break;
	default:
		fwrite(STDERR, "Commande inconnue.\n");
		exit(2);
}
