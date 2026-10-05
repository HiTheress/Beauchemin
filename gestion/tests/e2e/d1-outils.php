<?php
// Outils du test d1.js (module D1) : prépare des situations que l'interface seule ne permet pas de créer facilement.
// BASE DE DÉVELOPPEMENT SEULEMENT (DB_NAME=bea_*). Ligne de commande uniquement ; chaque commande écrit un résultat sur une ligne.
//   php tests/e2e/d1-outils.php transferer <emp_source> <emp_dest> <piece_id> <quantite>   transfert (service) ; écrit le numéro du document
//   php tests/e2e/d1-outils.php sortir <emplacement_id> <piece_id> <quantite>              sortie de stock (service) ; écrit le numéro du document
//   php tests/e2e/d1-outils.php utilisateur <nom> <role> <entreprises : 1,2>               crée un utilisateur (mot de passe Test-Beauchemin-1) ; écrit son id
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
require __DIR__ . '/../../app/init.php';
if (!preg_match('/^bea_/', (string) DATABASE_NAME)) { exit("Refusé : ce n'est pas une base de développement (bea_*).\n"); }
$inv = new Inventaire($pdo);
$admin = (int) $pdo->query("SELECT id FROM utilisateurs WHERE role = 'admin' ORDER BY id LIMIT 1")->fetchColumn();
$cmd = isset($argv[1]) ? $argv[1] : '';
switch ($cmd) {
	case 'transferer':
		$r = $inv->transferer($admin, array('emplacement_id' => (int) $argv[2], 'emplacement_dest_id' => (int) $argv[3], 'lignes' => array(array('piece_id' => (int) $argv[4], 'quantite' => $argv[5]))));
		echo $r['numero'], "\n";
		break;
	case 'sortir':
		$r = $inv->sortir($admin, array('emplacement_id' => (int) $argv[2], 'motif' => 'service', 'lignes' => array(array('piece_id' => (int) $argv[3], 'quantite' => $argv[4]))));
		echo $r['numero'], "\n";
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
	default:
		fwrite(STDERR, "Commande inconnue.\n");
		exit(2);
}
