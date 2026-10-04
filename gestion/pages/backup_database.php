<?php
// Sauvegarde de la base de données — réservée à l'administrateur
if (!$Ouser->is_admin()) {
  echo "<div class='content-wrapper'><div class='container-fluid mt-4'><div class='alert alert-danger'>Réservé à l'administrateur.</div></div></div>";
  return;
}

$tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN);

if (isset($_POST['submit'])) {
  if (!hash_equals($_SESSION['csrf_token'], (string) ($_POST['csrf_token'] ?? ''))) {
    $selectError = "Jeton de sécurité invalide. Rechargez la page.";
  } elseif (empty($_POST['table']) || !is_array($_POST['table'])) {
    $selectError = "Sélectionnez au moins une table à exporter.";
  } else {
    $output = "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n";
    foreach ($_POST['table'] as $table) {
      if (!in_array($table, $tables, true)) { continue; } // seulement de vraies tables
      $create = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
      $output .= "\nDROP TABLE IF EXISTS `$table`;\n" . $create[1] . ";\n\n";
      foreach ($pdo->query("SELECT * FROM `$table`", PDO::FETCH_ASSOC) as $row) {
        $vals = array_map(function ($v) use ($pdo) { return $v === null ? 'NULL' : $pdo->quote($v); }, array_values($row));
        $output .= "INSERT INTO `$table` (`" . implode('`, `', array_keys($row)) . "`) VALUES (" . implode(', ', $vals) . ");\n";
      }
    }
    $output .= "\nSET FOREIGN_KEY_CHECKS=1;\n";

    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="sauvegarde_beauchemin_' . date('Y-m-d_His') . '.sql"');
    header('Content-Length: ' . strlen($output));
    echo $output;
    exit;
  }
}
?>

<div class="content-wrapper">
  <div class="content-header">
    <div class="container-fluid mt-3">
      <div class="row">
        <div class="col-md-6"><h1 class="m-0 text-dark">Paramètres</h1></div>
        <div class="col-md-6 mt-3">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="index.php">Accueil</a></li>
            <li class="breadcrumb-item active">Sauvegarde de la base de données</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
  <section class="content">
    <div class="container-fluid">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Faire une sauvegarde</h3></div>
        <div class="card-body">
          <?php if (isset($selectError)) { echo "<div class='alert alert-danger'>" . htmlspecialchars($selectError) . "</div>"; } ?>
          <form method="post" action="index.php?page=backup_database" id="exportForm">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
            <div class="row">
              <?php foreach ($tables as $table) { $t = htmlspecialchars($table); ?>
                <div class="col-md-3 col-lg-3">
                  <label><input type="checkbox" class="checkbox_table" name="table[]" value="<?php echo $t; ?>" checked> <?php echo $t; ?></label>
                </div>
              <?php } ?>
            </div>
            <div class="form-group mt-3">
              <input type="submit" class="btn btn-info" name="submit" id="submit" value="Télécharger la sauvegarde">
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</div>
