<?php
// Étiquettes code-barres (Code 128) : pièces et emplacements. Gestionnaire et plus.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/ajax/etiquette_lib.php';
page_script('assets/js/etiquettes.js');

$uid = utilisateur_id();
$formats = Etiquettes::formats();

// Catégories (pour « toutes les pièces d'une catégorie ») et emplacements actifs accessibles
$categories = $pdo->query('SELECT c.id, c.nom, (SELECT COUNT(*) FROM pieces p WHERE p.categorie_id = c.id AND p.actif = 1) AS nb FROM categories c ORDER BY c.nom')->fetchAll(PDO::FETCH_ASSOC);
$sansCategorie = (int) $pdo->query('SELECT COUNT(*) FROM pieces WHERE categorie_id IS NULL AND actif = 1')->fetchColumn();
$emplacements = inventaire()->listeEmplacements($uid);

// Préremplissage par l'URL : &piece_id=12, &emplacement_id=3, &pieces=1,2,3
$prefill = array('pieces' => array(), 'emplacements' => array());
$avertissements = array();
$idsPieces = array();
foreach (array('piece_id' => 1, 'pieces' => 200) as $cle => $max) {
	if (!isset($_GET[$cle]) || !is_string($_GET[$cle])) { continue; }
	foreach (array_slice(explode(',', $_GET[$cle]), 0, $max) as $x) {
		$x = trim($x);
		if ($x !== '' && ctype_digit($x) && (int) $x > 0) { $idsPieces[(int) $x] = true; }
	}
}
if ($idsPieces) {
	$ids = array_keys($idsPieces);
	$st = $pdo->prepare('SELECT id, code, nom, unite, actif FROM pieces WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
	$st->execute($ids);
	$trouvees = array();
	foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) { $trouvees[(int) $r['id']] = $r; }
	foreach ($ids as $id) {
		if (!isset($trouvees[$id])) { $avertissements[] = 'La pièce no ' . $id . ' est introuvable : ignorée.'; continue; }
		$r = $trouvees[$id];
		if (!$r['actif']) { $avertissements[] = 'La pièce « ' . $r['code'] . ' » est désactivée : ignorée.'; continue; }
		$prefill['pieces'][] = array('type' => 'piece', 'id' => (int) $r['id'], 'code' => $r['code'], 'nom' => $r['nom'], 'droite' => $r['unite']);
	}
}
if (isset($_GET['emplacement_id']) && is_string($_GET['emplacement_id']) && ctype_digit($_GET['emplacement_id']) && (int) $_GET['emplacement_id'] > 0) {
	$eid = (int) $_GET['emplacement_id'];
	$trouve = false;
	foreach ($emplacements as $em) {
		if ((int) $em['id'] === $eid) {
			$trouve = true;
			$prefill['emplacements'][] = array('type' => 'emplacement', 'id' => $eid, 'code' => $em['code_barres'], 'nom' => $em['nom'], 'droite' => $em['entreprise_nom']);
		}
	}
	if (!$trouve) { $avertissements[] = 'L\'emplacement demandé est introuvable, désactivé ou inaccessible : ignoré.'; }
}

$empJs = array();
foreach ($emplacements as $em) {
	$empJs[] = array('id' => (int) $em['id'], 'code' => (string) $em['code_barres'], 'nom' => $em['nom'], 'entreprise' => $em['entreprise_nom'], 'type' => $em['type']);
}
$config = array('formats' => $formats, 'format_defaut' => 'feuille30', 'prefill' => array_merge($prefill['pieces'], $prefill['emplacements']), 'emplacements' => $empJs,
	'max_etiquettes' => Etiquettes::MAX_ETIQUETTES, 'max_copies' => Etiquettes::MAX_COPIES, 'max_elements' => Etiquettes::MAX_ELEMENTS);
?>
<link rel="stylesheet" href="assets/css/etiquettes.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/etiquettes.css'); ?>">
<div class="content-wrapper">
  <?php page_titre('Étiquettes code-barres', array('Catalogue', 'Étiquettes')); ?>
  <section class="content"><div class="container-fluid">
    <div id="et-config" data-config="<?php echo e(json_encode($config, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)); ?>"></div>

    <?php foreach ($avertissements as $a) { ?>
      <div class="alert alert-warning no-print"><?php echo e($a); ?></div>
    <?php } ?>

    <div class="row no-print">
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header"><h3 class="card-title">1. Choisir les étiquettes</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label for="et-scan">Scanner ou taper un code (pièce ou emplacement), puis Entrée</label>
              <div class="scan-box"><input id="et-scan" class="form-control scan-input" autocomplete="off" inputmode="none" placeholder="P-0001, EMP-000003…"></div>
            </div>
            <div class="form-group">
              <label for="et-recherche">Chercher des pièces (nom ou code)</label>
              <select id="et-recherche" class="form-control" multiple="multiple" data-placeholder="Taper le nom ou le code d'une pièce…"></select>
            </div>
            <div class="form-row">
              <div class="form-group col-md-8">
                <label for="et-categorie">Toutes les pièces d'une catégorie</label>
                <select id="et-categorie" class="form-control">
                  <option value="">— Choisir une catégorie —</option>
                  <?php foreach ($categories as $c) { ?>
                    <option value="<?php echo (int) $c['id']; ?>"><?php echo e($c['nom']); ?> (<?php echo (int) $c['nb']; ?>)</option>
                  <?php } ?>
                  <option value="0">Sans catégorie (<?php echo $sansCategorie; ?>)</option>
                </select>
              </div>
              <div class="form-group col-md-4 d-flex align-items-end">
                <button type="button" id="et-ajouter-categorie" class="btn btn-outline-primary btn-block"><i class="fas fa-plus"></i> Ajouter la catégorie</button>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-md-8">
                <label for="et-emplacements">Emplacements (étiquettes EMP-…)</label>
                <select id="et-emplacements" class="form-control" multiple="multiple" data-placeholder="Choisir des emplacements…">
                  <?php $groupe = null; foreach ($emplacements as $em) {
                    if ($groupe !== $em['entreprise_nom']) { if ($groupe !== null) { echo '</optgroup>'; } $groupe = $em['entreprise_nom']; echo '<optgroup label="' . e($groupe) . '">'; } ?>
                    <option value="<?php echo (int) $em['id']; ?>"><?php echo e($em['nom']); ?> — <?php echo e($em['code_barres']); ?></option>
                  <?php } if ($groupe !== null) { echo '</optgroup>'; } ?>
                </select>
              </div>
              <div class="form-group col-md-4 d-flex align-items-end">
                <button type="button" id="et-tous-emplacements" class="btn btn-outline-primary btn-block"><i class="fas fa-plus"></i> Tous les emplacements actifs</button>
              </div>
            </div>
            <div class="form-group mb-0">
              <label for="et-copies-defaut">Copies par élément ajouté</label>
              <input id="et-copies-defaut" type="text" inputmode="numeric" class="form-control et-copies-input" value="1" style="max-width:8rem">
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex align-items-center">
            <h3 class="card-title">Liste à imprimer <span id="et-compte" class="badge badge-secondary ml-2">0</span></h3>
            <div class="ml-auto"><button type="button" id="et-vider" class="btn btn-sm btn-outline-secondary" disabled><i class="fas fa-trash"></i> Vider la liste</button></div>
          </div>
          <div class="card-body p-0">
            <div id="et-vide" class="text-muted text-center p-4">Aucune étiquette : scannez un code ou ajoutez des pièces ou des emplacements ci-dessus.</div>
            <div class="table-responsive">
              <table id="et-table" class="table table-sm table-striped mb-0 et-table" style="display:none">
                <thead><tr><th>Type</th><th>Code</th><th>Description</th><th class="nombre">Copies</th><th><span class="sr-only">Retirer</span></th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card">
          <div class="card-header"><h3 class="card-title">2. Format et impression</h3></div>
          <div class="card-body">
            <fieldset class="form-group">
              <legend class="h6">Format des étiquettes</legend>
              <?php foreach ($formats as $cle => $f) { ?>
                <div class="custom-control custom-radio et-format-option">
                  <input class="custom-control-input" type="radio" name="et-format" id="et-format-<?php echo e($cle); ?>" value="<?php echo e($cle); ?>"<?php echo $cle === 'feuille30' ? ' checked' : ''; ?>>
                  <label class="custom-control-label" for="et-format-<?php echo e($cle); ?>"><strong><?php echo e($f['nom']); ?></strong><br><small class="text-muted"><?php echo e($f['aide']); ?></small></label>
                </div>
              <?php } ?>
            </fieldset>
            <div class="form-group" id="et-depart-groupe">
              <label for="et-depart">Première étiquette à utiliser sur la feuille (1 à 30)</label>
              <input id="et-depart" type="text" inputmode="numeric" class="form-control et-copies-input" value="1" style="max-width:8rem">
              <small class="form-text text-muted">Pour reprendre une feuille déjà entamée : les cases précédentes restent vides.</small>
            </div>
            <div id="et-resume" class="alert alert-light border" role="status">—</div>
            <button type="button" id="et-imprimer" class="btn btn-primary btn-lg btn-block" disabled><i class="fas fa-print"></i> Imprimer</button>
            <p class="small text-muted mt-3 mb-0">Dans la fenêtre d'impression : choisissez votre imprimante, une échelle de <strong>100 %</strong> (« Taille réelle ») et des marges « <strong>Aucune</strong> ». Faites d'abord un essai sur une feuille de papier ordinaire.</p>
          </div>
        </div>
      </div>
    </div>

    <div id="et-refus" class="alert alert-danger no-print" style="display:none" role="alert"></div>

    <div class="card et-carte-apercu">
      <div class="card-header no-print"><h3 class="card-title">Aperçu <small class="text-muted">(identique à l'impression)</small></h3></div>
      <div class="card-body">
        <div id="et-apercu" class="et-apercu" aria-live="polite"></div>
      </div>
    </div>
  </div></section>
</div>
