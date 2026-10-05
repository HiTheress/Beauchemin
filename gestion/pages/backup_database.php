<?php
// Sauvegarde de la base de données — réservée à l'administrateur.
// Le fichier .sql est produit à la volée et envoyé au navigateur : rien n'est jamais écrit dans le dossier du site.
// Sécurité : rôle administrateur, jeton CSRF (POST), tables choisies parmi la liste blanche des vraies tables de la base,
// valeurs SQL échappées par PDO::quote().
if (!acces_page('admin')) { return; }
page_script('assets/js/admin.js');

$tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN);
$selectError = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $choisies = (isset($_POST['table']) && is_array($_POST['table'])) ? $_POST['table'] : array();
  if (!hash_equals($_SESSION['csrf_token'], (string) ($_POST['csrf_token'] ?? ''))) {
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
    Journal::ecrire($pdo, utilisateur_id(), 'sauvegarde.telechargee', 'sauvegarde', null, array('nb_tables' => count($aExporter)));

    @set_time_limit(0);
    $pdo->exec("SET time_zone = '+00:00'");        // les colonnes TIMESTAMP sortent en UTC et sont restaurées en UTC
    $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');         // toutes les tables sont lues dans le même état (stock = somme des mouvements)
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);   // gros tableaux : lus ligne par ligne
    // Tout ce qui peut échouer est lu AVANT d'envoyer le moindre octet (sinon une erreur donnerait un fichier tronqué)
    $creations = array();
    foreach ($aExporter as $t) {
      $creations[$t] = $pdo->query('SHOW CREATE TABLE ' . $ident($t))->fetch(PDO::FETCH_NUM)[1];
    }

    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="sauvegarde_beauchemin_' . date('Y-m-d_His') . '.sql"');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    echo "-- Sauvegarde Beauchemin / Boutique Chaleur — " . date('Y-m-d H:i:s') . "\n";
    echo "-- CONFIDENTIEL : ce fichier contient toutes les données, y compris les empreintes des mots de passe. Conservez-le en lieu sûr.\n";
    echo "-- Restauration : voir docs/DEPLOIEMENT.md (section « Sauvegardes »).\n";
    echo "SET NAMES utf8mb4;\nSET TIME_ZONE = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\nSET UNIQUE_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
    try {
      foreach ($aExporter as $t) {
        echo "\n-- Table " . $t . "\nDROP TABLE IF EXISTS " . $ident($t) . ";\n" . $creations[$t] . ";\n";
        $st = $pdo->query('SELECT * FROM ' . $ident($t), PDO::FETCH_ASSOC);
        $entete = null;
        $lot = array();
        $taille = 0;
        $vider = function () use (&$lot, &$taille, &$entete, $t, $ident) {
          if ($lot) { echo 'INSERT INTO ' . $ident($t) . ' (' . $entete . ") VALUES\n" . implode(",\n", $lot) . ";\n"; }
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
      echo "\nSET FOREIGN_KEY_CHECKS = 1;\nSET UNIQUE_CHECKS = 1;\n-- Fin de la sauvegarde (complète)\n";
    } catch (Throwable $ex) {
      error_log('Sauvegarde : ' . $ex->getMessage());
      echo "\n-- ERREUR : la sauvegarde est INCOMPLÈTE. Ne l'utilisez pas ; recommencez.\n";
    }
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
                <div class="col-sm-6 col-md-4 col-lg-3">
                  <div class="custom-control custom-checkbox adm-case">
                    <input type="checkbox" class="custom-control-input checkbox_table" id="table-<?php echo (int) $i; ?>" name="table[]" value="<?php echo e($table); ?>" checked>
                    <label class="custom-control-label" for="table-<?php echo (int) $i; ?>"><?php echo e($table); ?></label>
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
          <li>Le fichier se termine par la ligne « Fin de la sauvegarde (complète) ». S'il ne la contient pas, la sauvegarde est incomplète : recommencez.</li>
          <li>Une sauvegarde automatique chaque nuit est prévue sur le serveur (guide de déploiement, section « Sauvegardes »). Copiez aussi vos sauvegardes hors du serveur.</li>
          <li>La restauration remplace toutes les données actuelles : elle se fait sur le serveur, par la personne qui l'administre, et il vaut mieux l'essayer d'abord dans une base de test.</li>
        </ul>
      </div>
    </div>
  </div></section>
</div>
