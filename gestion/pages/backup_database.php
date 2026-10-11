<?php
// Sauvegarde de la base de données — réservée à l'administrateur.
// Le fichier .sql.gz (SQL compressé, le même format que la sauvegarde nocturne : tools/restaurer.sh le restaure) est produit à la volée
// et envoyé au navigateur : rien n'est jamais écrit dans le dossier du site.
// Écran : un seul gros bouton (sauvegarde complète). Sans liste de tables dans la requête, toutes les tables sont sauvegardées ;
// une requête qui nomme des tables (table[]) reste acceptée : seules les vraies tables de la base sont retenues.
// Sécurité : rôle administrateur, jeton CSRF (POST), tables choisies parmi la liste blanche des vraies tables de la base,
// valeurs SQL échappées par PDO::quote().
if (!acces_page('admin')) { return; }
page_script('assets/js/admin.js');

$tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN);
$selectError = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  // Sans liste de tables : sauvegarde complète (l'écran n'en propose pas d'autre). Avec une liste : seules les vraies tables sont retenues.
  $choisies = !isset($_POST['table']) ? $tables : (is_array($_POST['table']) ? $_POST['table'] : array());
  $jeton = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
  if (!is_string($jeton) || !hash_equals((string) $_SESSION['csrf_token'], $jeton)) {
    $selectError = 'Jeton de sécurité invalide. Rechargez la page, puis réessayez.';
  } else {
    $aExporter = array();
    foreach ($tables as $t) {                      // liste blanche : seules les vraies tables, dans l'ordre de la base
      if (in_array($t, $choisies, true)) { $aExporter[] = $t; }
    }
    if (!$aExporter) { $selectError = 'Sélectionnez au moins une table à sauvegarder.'; }
  }

  if ($selectError === null) {
    $ident = function ($nom) { return '`' . str_replace('`', '``', $nom) . '`'; };
    $complete = (count($aExporter) === count($tables));
    $etat = $complete ? 'complète' : ('partielle : ' . count($aExporter) . (count($aExporter) > 1 ? ' tables' : ' table') . ' sur ' . count($tables));
    Journal::ecrire($pdo, utilisateur_id(), 'sauvegarde.telechargee', 'sauvegarde', null, array('nb_tables' => count($aExporter), 'complete' => $complete));

    @set_time_limit(0);
    $pdo->exec("SET time_zone = '+00:00'");        // les colonnes TIMESTAMP sortent en UTC et sont restaurées en UTC
    $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');         // toutes les tables sont lues dans le même état (stock = somme des mouvements)
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);   // gros tableaux : lus ligne par ligne
    // Tout ce qui peut échouer est lu AVANT d'envoyer le moindre octet (sinon une erreur donnerait un fichier tronqué)
    $creations = array();
    foreach ($aExporter as $t) {
      $creations[$t] = $pdo->query('SHOW CREATE TABLE ' . $ident($t))->fetch(PDO::FETCH_NUM)[1];
    }

    // Compression au fil de l'eau (gzip) : un gros fichier n'est jamais gardé en mémoire. Sans l'extension zlib : SQL en clair.
    $gz = function_exists('deflate_init') ? deflate_init(ZLIB_ENCODING_GZIP, array('level' => 6)) : false;
    $sortie = function ($texte) use ($gz) {
      if ($gz) { $o = deflate_add($gz, $texte, ZLIB_NO_FLUSH); if ($o !== '') { echo $o; } } else { echo $texte; }
    };
    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: ' . ($gz ? 'application/gzip' : 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="sauvegarde_beauchemin_' . ($complete ? '' : 'partielle_') . date('Y-m-d_His') . ($gz ? '.sql.gz' : '.sql') . '"');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    $sortie("-- Sauvegarde Beauchemin / Boutique Chaleur — " . date('Y-m-d H:i:s') . " (" . $etat . ")\n");
    $sortie("-- CONFIDENTIEL : ce fichier contient toutes les données, y compris les empreintes des mots de passe. Conservez-le en lieu sûr.\n");
    $sortie("-- Restauration (sur le serveur) : tools/restaurer.sh <ce fichier>.sql.gz — voir docs/DEPLOIEMENT.md, section « Sauvegardes ».\n");
    $sortie("SET NAMES utf8mb4;\nSET TIME_ZONE = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\nSET UNIQUE_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n");
    try {
      foreach ($aExporter as $t) {
        $sortie("\n-- Table " . $t . "\nDROP TABLE IF EXISTS " . $ident($t) . ";\n" . $creations[$t] . ";\n");
        $st = $pdo->query('SELECT * FROM ' . $ident($t), PDO::FETCH_ASSOC);
        $entete = null;
        $lot = array();
        $taille = 0;
        $vider = function () use (&$lot, &$taille, &$entete, $t, $ident, $sortie) {
          if ($lot) { $sortie('INSERT INTO ' . $ident($t) . ' (' . $entete . ") VALUES\n" . implode(",\n", $lot) . ";\n"); }
          $lot = array();
          $taille = 0;
        };
        while ($row = $st->fetch()) {
          if ($entete === null) { $entete = implode(', ', array_map($ident, array_keys($row))); }
          $vals = array();
          foreach ($row as $v) { $vals[] = ($v === null) ? 'NULL' : $pdo->quote((string) $v); }
          $ligne = '(' . implode(', ', $vals) . ')';
          $lot[] = $ligne;
          $taille += strlen($ligne);
          if (count($lot) >= 200 || $taille > 200000) { $vider(); }
        }
        $vider();
        $st->closeCursor();
      }
      $sortie("\nSET FOREIGN_KEY_CHECKS = 1;\nSET UNIQUE_CHECKS = 1;\n-- Fin de la sauvegarde (" . $etat . ")\n");
    } catch (Throwable $ex) {
      error_log('Sauvegarde : ' . $ex->getMessage());
      $sortie("\n-- ERREUR : la sauvegarde est INCOMPLÈTE. Ne l'utilisez pas ; recommencez.\n");
    }
    if ($gz) { echo deflate_add($gz, '', ZLIB_FINISH); }
    exit;
  }
}
?>
<?php
// Dernière sauvegarde téléchargée (inscrite au journal à chaque téléchargement)
$derniere = $pdo->query("SELECT j.date_action, u.nom_utilisateur FROM journal j LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id WHERE j.action = 'sauvegarde.telechargee' ORDER BY j.id DESC LIMIT 1")->fetch();
?>
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="sauvegarde">
  <?php page_titre('Sauvegarde', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card"><div class="card-body text-center adm-sauvegarde">
      <?php if ($selectError !== null) { ?><div class="alert alert-danger text-left" role="alert"><?php echo e($selectError); ?></div><?php } ?>
      <form method="post" action="index.php?page=backup_database" id="exportForm">
        <input type="hidden" name="csrf_token" value="<?php echo e($_SESSION['csrf_token']); ?>">
        <button type="submit" class="btn btn-primary btn-lg adm-gros-bouton" id="btn-sauvegarde"><i class="fas fa-download mr-2" aria-hidden="true"></i> Télécharger une sauvegarde</button>
        <p class="mt-3 mb-0 text-muted" id="sauvegarde-etat" role="status"><?php
          if ($derniere) {
            echo 'Dernière sauvegarde : ' . e(substr($derniere['date_action'], 0, 16)) . ($derniere['nom_utilisateur'] ? ' (' . e($derniere['nom_utilisateur']) . ')' : '');
          } else {
            echo 'Aucune sauvegarde téléchargée.';
          }
        ?></p>
      </form>
    </div></div>
  </div></section>
</div>
