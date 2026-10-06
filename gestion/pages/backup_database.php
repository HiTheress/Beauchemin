<?php
// Sauvegarde de la base de données — réservée à l'administrateur.
// Le fichier .sql.gz (SQL compressé, le même format que la sauvegarde nocturne : tools/restaurer.sh le restaure) est produit à la volée
// et envoyé au navigateur : rien n'est jamais écrit dans le dossier du site.
// Sécurité : rôle administrateur, jeton CSRF (POST), tables choisies parmi la liste blanche des vraies tables de la base,
// valeurs SQL échappées par PDO::quote().
if (!acces_page('admin')) { return; }
page_script('assets/js/admin.js');

$tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN);
$selectError = null;

// Nom des tables en français (le nom technique reste en infobulle) ; une table inconnue garde son nom.
$libellesTables = array(
  'categories' => 'Catégories', 'comptage_lignes' => 'Lignes des comptages', 'comptages' => 'Comptages',
  'document_lignes' => 'Lignes des documents', 'documents' => 'Documents (réceptions, transferts, sorties…)',
  'emplacements' => 'Emplacements', 'entreprises' => 'Entreprises', 'fournisseurs' => 'Fournisseurs',
  'journal' => 'Journal d\'activité', 'mouvements' => 'Mouvements de stock', 'pieces' => 'Pièces',
  'pieces_codes' => 'Codes-barres supplémentaires des pièces', 'prix_fournisseurs' => 'Prix des fournisseurs',
  'prix_fournisseurs_hist' => 'Historique des prix des fournisseurs', 'sequences' => 'Compteurs de numéros de documents',
  'seuils' => 'Seuils minimums', 'stock' => 'Stock', 'stock_couts' => 'Coûts moyens',
  'utilisateur_entreprises' => 'Accès des utilisateurs aux entreprises', 'utilisateurs' => 'Utilisateurs (comptes et mots de passe chiffrés)',
);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $choisies = (isset($_POST['table']) && is_array($_POST['table'])) ? $_POST['table'] : array();
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
<link rel="stylesheet" href="assets/css/admin.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/admin.css'); ?>">
<div class="content-wrapper" data-admin="sauvegarde">
  <?php page_titre('Sauvegarde de la base de données', array('Administration')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning" role="note" id="sauvegarde-avertissement">
      <i class="fas fa-lock mr-1" aria-hidden="true"></i>
      <strong>Fichier confidentiel.</strong> La sauvegarde contient toutes vos données, y compris les <strong>empreintes des mots de passe</strong> des utilisateurs.
      Conservez-la en lieu sûr (accès restreint) : ne l'envoyez pas par courriel et ne la déposez pas dans le dossier du site.
    </div>
    <div class="card">
      <div class="card-header"><h2 class="card-title h5 mb-0">Faire une sauvegarde</h2></div>
      <div class="card-body">
        <?php if ($selectError !== null) { ?><div class="alert alert-danger" role="alert"><?php echo e($selectError); ?></div><?php } ?>
        <form method="post" action="index.php?page=backup_database" id="exportForm">
          <input type="hidden" name="csrf_token" value="<?php echo e($_SESSION['csrf_token']); ?>">
          <fieldset>
            <legend class="adm-legende">Tables à sauvegarder</legend>
            <p class="small text-muted">Pour une sauvegarde complète, laissez toutes les tables cochées (c'est ce qu'il faut pour restaurer le système en entier).</p>
            <div class="mb-2 no-print">
              <button type="button" class="btn btn-sm btn-outline-secondary" id="btn-tout-cocher">Tout cocher</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="btn-tout-decocher">Tout décocher</button>
              <span class="small text-muted ml-2" id="sauvegarde-compte" aria-live="polite"></span>
            </div>
            <div class="row">
              <?php foreach ($tables as $i => $table) { ?>
                <div class="col-sm-6 col-lg-4">
                  <div class="custom-control custom-checkbox adm-case">
                    <input type="checkbox" class="custom-control-input checkbox_table" id="table-<?php echo (int) $i; ?>" name="table[]" value="<?php echo e($table); ?>" checked>
                    <label class="custom-control-label" for="table-<?php echo (int) $i; ?>" title="Table « <?php echo e($table); ?> »"><?php echo e(isset($libellesTables[$table]) ? $libellesTables[$table] : $table); ?></label>
                  </div>
                </div>
              <?php } ?>
            </div>
          </fieldset>
          <div class="form-group mt-3 mb-0">
            <button type="submit" class="btn btn-primary" id="btn-sauvegarde"><i class="fas fa-download mr-1" aria-hidden="true"></i> Télécharger la sauvegarde</button>
            <span class="small text-muted ml-2" id="sauvegarde-etat" role="status"></span>
          </div>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h2 class="card-title h5 mb-0">À savoir</h2></div>
      <div class="card-body small">
        <ul class="mb-2">
          <li>Le fichier téléchargé est compressé (<code>.sql.gz</code>), comme la sauvegarde automatique de la nuit. Il se termine par la ligne « Fin de la sauvegarde (complète) » ; s'il ne la contient pas, la sauvegarde est incomplète : recommencez.</li>
          <li>Une sauvegarde partielle (certaines tables décochées) ne suffit pas pour restaurer le système : gardez toujours des sauvegardes complètes.</li>
          <li>Une sauvegarde automatique chaque nuit est prévue sur le serveur (guide de déploiement, section « Sauvegardes »). Copiez aussi vos sauvegardes hors du serveur, dans un endroit à accès restreint.</li>
          <li>La restauration remplace toutes les données actuelles : elle se fait sur le serveur, par la personne qui l'administre, avec <code>tools/restaurer.sh fichier.sql.gz</code>. Essayez-la d'abord dans une base de test.</li>
        </ul>
      </div>
    </div>
  </div></section>
</div>
