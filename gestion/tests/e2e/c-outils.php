<?php
// Outils du test c.js (module C) : prépare des situations que l'interface seule ne permet pas de créer facilement.
// BASE DE DÉVELOPPEMENT SEULEMENT (DB_NAME=bea_c). Ligne de commande uniquement ; chaque commande écrit un résultat sur une ligne.
//   php tests/e2e/c-outils.php piece <code> <nom> <emplacement_id> <quantite> [cout]   crée une pièce et son stock (par un ajustement du service) ; écrit l'id
//   php tests/e2e/c-outils.php sortir <emplacement_id> <piece_id> <quantite>           sortie de stock (service) ; écrit le numéro du document
//   php tests/e2e/c-outils.php ajuster <emplacement_id> <piece_id> <quantite> [cout]    ajustement (service) ; écrit le numéro du document
//   php tests/e2e/c-outils.php recevoir <emplacement_id> <piece_id> <quantite> <cout>  réception (service) ; écrit le numéro du document
//   php tests/e2e/c-outils.php cout <entreprise_id> <piece_id>                         écrit le coût moyen (stock_couts) de la pièce
//   php tests/e2e/c-outils.php utilisateur <nom> <role> <entreprises : 1,2>            crée un utilisateur (mot de passe Test-Beauchemin-1) ; écrit son id
//   php tests/e2e/c-outils.php entreprise <code> <nom> <code_barres_emplacement>       crée une entreprise et son entrepôt ; écrit « id_entreprise id_emplacement »
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
require __DIR__ . '/../../app/init.php';
if (!preg_match('/^bea_/', (string) DATABASE_NAME)) { exit("Refusé : ce n'est pas une base de développement (bea_*).\n"); }
$inv = new Inventaire($pdo);
$admin = (int) $pdo->query("SELECT id FROM utilisateurs WHERE role = 'admin' ORDER BY id LIMIT 1")->fetchColumn();
$cmd = isset($argv[1]) ? $argv[1] : '';
switch ($cmd) {
	case 'piece':
		list(, , $code, $nom, $emp, $qte) = $argv;
		$cout = isset($argv[6]) ? $argv[6] : null;
		$pdo->prepare('INSERT INTO pieces (code, nom, unite) VALUES (?, ?, ?)')->execute(array($code, $nom, 'unité'));
		$pid = (int) $pdo->lastInsertId();
		$ligne = array('piece_id' => $pid, 'quantite' => $qte);
		if ($cout !== null) { $ligne['cout_unitaire'] = $cout; }
		$inv->ajuster($admin, array('emplacement_id' => (int) $emp, 'motif' => 'correction', 'lignes' => array($ligne)));
		echo $pid, "\n";
		break;
	case 'sortir':
		$r = $inv->sortir($admin, array('emplacement_id' => (int) $argv[2], 'motif' => 'service', 'lignes' => array(array('piece_id' => (int) $argv[3], 'quantite' => $argv[4]))));
		echo $r['numero'], "\n";
		break;
	case 'ajuster':
		$ligne = array('piece_id' => (int) $argv[3], 'quantite' => $argv[4]);
		if (isset($argv[5])) { $ligne['cout_unitaire'] = $argv[5]; }
		$r = $inv->ajuster($admin, array('emplacement_id' => (int) $argv[2], 'motif' => 'correction', 'lignes' => array($ligne)));
		echo $r['numero'], "\n";
		break;
	case 'recevoir':
		$r = $inv->recevoir($admin, array('emplacement_id' => (int) $argv[2], 'lignes' => array(array('piece_id' => (int) $argv[3], 'quantite' => $argv[4], 'cout_unitaire' => $argv[5]))));
		echo $r['numero'], "\n";
		break;
	case 'cout':
		$st = $pdo->prepare('SELECT cout_moyen FROM stock_couts WHERE entreprise_id = ? AND piece_id = ?');
		$st->execute(array((int) $argv[2], (int) $argv[3]));
		echo $st->fetchColumn(), "\n";
		break;
	case 'utilisateur':
		list(, , $nom, $role, $ents) = $argv;
		$pdo->prepare('INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES (?, ?, ?, ?)')
			->execute(array($nom, $nom, password_hash('Test-Beauchemin-1', PASSWORD_DEFAULT), $role));
		$uid = (int) $pdo->lastInsertId();
		foreach (array_filter(explode(',', $ents)) as $e) {
			$pdo->prepare('INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES (?, ?)')->execute(array($uid, (int) $e));
		}
		echo $uid, "\n";
		break;
	case 'entreprise':
		list(, , $code, $nom, $cb) = $argv;
		$pdo->prepare('INSERT INTO entreprises (code, nom) VALUES (?, ?)')->execute(array($code, $nom));
		$eid = (int) $pdo->lastInsertId();
		$pdo->prepare("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (?, 'Entrepôt tiers', 'entrepot', ?)")->execute(array($eid, $cb));
		echo $eid, ' ', (int) $pdo->lastInsertId(), "\n";
		break;
	default:
		fwrite(STDERR, "Commande inconnue.\n");
		exit(2);
}
