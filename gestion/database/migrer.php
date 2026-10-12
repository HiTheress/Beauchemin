<?php
// Applique les migrations de la base : database/migrations/*.sql, par ordre alphabétique (la date est dans le nom du fichier).
// Chaque fichier est IDEMPOTENT (CREATE TABLE IF NOT EXISTS, index testé avant sa création) : on peut relancer ce script à volonté.
// Usage : php database/migrer.php      (variables DB_HOST, DB_NAME, DB_USER, DB_PASS, comme pour l'application)
// Le démarrage Docker l'exécute à chaque fois. Sur un serveur, le compte de la base doit avoir les droits CREATE et ALTER ;
// sinon : mysql <base> < database/migrations/<fichier>.sql avec le compte administrateur (voir docs/DEPLOIEMENT.md).

/** Instructions d'un fichier SQL : lignes de commentaire « -- » retirées, instructions séparées par un « ; » en fin de ligne. */
function migration_instructions($sql)
{
	$lignes = array();
	foreach (preg_split('/\R/', (string) $sql) as $l) {
		if (strncmp(ltrim($l), '--', 2) !== 0) {
			$lignes[] = $l;
		}
	}
	$out = array();
	foreach (preg_split('/;[ \t]*(?:\R|$)/', implode("\n", $lignes)) as $instruction) {
		$instruction = trim($instruction);
		if ($instruction !== '') {
			$out[] = $instruction;
		}
	}
	return $out;
}

/** Exécute chaque fichier du dossier ; retourne les noms appliqués. Lance l'exception de la première instruction qui échoue. */
function migrer(PDO $pdo, $dossier)
{
	$fichiers = glob(rtrim($dossier, '/') . '/*.sql');
	sort($fichiers);
	$faits = array();
	foreach ($fichiers as $f) {
		foreach (migration_instructions(file_get_contents($f)) as $instruction) {
			$pdo->exec($instruction);
		}
		$faits[] = basename($f);
	}
	return $faits;
}

if (PHP_SAPI === 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
	require __DIR__ . '/../app/config/config.php';
	require __DIR__ . '/../app/database/connection.php';
	try {
		foreach (migrer($pdo, __DIR__ . '/migrations') as $nom) {
			echo "Migration appliquée : $nom\n";
		}
	} catch (Throwable $e) {
		fwrite(STDERR, 'Migration échouée : ' . $e->getMessage() . "\n");
		exit(1);
	}
}
