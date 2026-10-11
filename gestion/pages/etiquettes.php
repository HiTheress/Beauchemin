<?php
// Étiquettes code-barres (Code 128) : pièces et emplacements. Gestionnaire et plus.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/ajax/etiquette_lib.php';
page_script('assets/js/etiquettes.js');

$uid = utilisateur_id();
$formats = Etiquettes::formats();

// Catégories (pour « toutes les pièces d'une catégorie ») et emplacements actifs accessibles
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
		if (!$r['actif']) { $avertissements[] = 'La pièce « ' . $r['code'] . ' » est désactivée : ignorée.'; continue; }
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

// Noms de format courts (les dimensions et le détail restent dans l'infobulle)
$formatsCourts = array();
foreach ($formats as $cle => $f) { $formatsCourts[$cle] = trim(preg_replace('/\s*\(.*\)\s*$/u', '', $f['nom'])); }

$empJs = array();
foreach ($emplacements as $em) {
	$empJs[] = array('id' => (int) $em['id'], 'code' => (string) $em['code_barres'], 'nom' => $em['nom'], 'entreprise' => $em['entreprise_nom'], 'type' => $em['type']);
}
$config = array('formats' => $formats, 'format_defaut' => 'feuille30', 'prefill' => array_merge($prefill['pieces'], $prefill['emplacements']), 'emplacements' => $empJs,
	'max_etiquettes' => Etiquettes::MAX_ETIQUETTES, 'max_copies' => Etiquettes::MAX_COPIES, 'max_elements' => Etiquettes::MAX_ELEMENTS);
?>
<link rel="stylesheet" href="assets/css/etiquette_commun.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/etiquette_commun.css'); ?>">
<link rel="stylesheet" href="assets/css/etiquettes.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/etiquettes.css'); ?>">
<div class="content-wrapper a2-page">
  <?php page_titre('Étiquettes', array('Catalogue', 'Étiquettes')); ?>
  <section class="content"><div class="container-fluid">
    <div id="et-config" data-config="<?php echo e(json_encode($config, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)); ?>"></div>

    <?php foreach ($avertissements as $a) { ?>
      <div class="alert alert-warning no-print"><?php echo e(Etiquettes::typo($a)); ?></div>
    <?php } ?>

    <div class="card no-print">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group col-md-8">
            <label class="sr-only" for="et-recherche">Chercher une pièce</label>
            <select id="et-recherche" class="form-control" multiple="multiple" data-placeholder="Chercher une pièce…"></select>
          </div>
          <div class="form-group col-md-4">
            <label class="sr-only" for="et-scan">Scanner un code</label>
            <div class="scan-box et-scan-box"><input id="et-scan" class="form-control scan-input" autocomplete="off" inputmode="none" placeholder="Scanner un code"></div>
          </div>
        </div>
        <button type="button" id="et-plus" class="btn btn-link et-plus" data-toggle="collapse" data-target="#et-options" aria-expanded="false" aria-controls="et-options">Plus d'options <i class="fas fa-caret-down" aria-hidden="true"></i></button>
        <div id="et-options" class="collapse">
          <div class="form-row et-options-ligne">
            <div class="form-group col-md-8">
              <label for="et-emplacements">Emplacements</label>
              <select id="et-emplacements" class="form-control" multiple="multiple" data-placeholder="Choisir des emplacements…">
                <?php $groupe = null; foreach ($emplacements as $em) {
                  if ($groupe !== $em['entreprise_nom']) { if ($groupe !== null) { echo '</optgroup>'; } $groupe = $em['entreprise_nom']; echo '<optgroup label="' . e($groupe) . '">'; } ?>
                  <option value="<?php echo (int) $em['id']; ?>"><?php echo e($em['nom']); ?> — <?php echo e($em['code_barres']); ?></option>
                <?php } if ($groupe !== null) { echo '</optgroup>'; } ?>
              </select>
            </div>
            <div class="form-group col-md-4 d-flex align-items-end">
              <button type="button" id="et-tous-emplacements" class="btn btn-outline-secondary btn-block"><i class="fas fa-plus"></i> Tous les emplacements</button>
            </div>
          </div>
          <div class="form-row et-options-ligne">
            <div class="form-group col-md-8">
              <label for="et-categorie">Catégorie</label>
              <select id="et-categorie" class="form-control">
                <option value="">Choisir une catégorie</option>
                <?php foreach ($categories as $c) { ?>
                  <option value="<?php echo (int) $c['id']; ?>"><?php echo e($c['nom']); ?> (<?php echo (int) $c['nb']; ?>)</option>
                <?php } ?>
                <option value="0">Sans catégorie (<?php echo $sansCategorie; ?>)</option>
              </select>
            </div>
            <div class="form-group col-md-4 d-flex align-items-end">
              <button type="button" id="et-ajouter-categorie" class="btn btn-outline-secondary btn-block"><i class="fas fa-plus"></i> Ajouter les pièces</button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-6 col-md-4 mb-0">
              <label for="et-copies-defaut">Copies par ajout</label>
              <input id="et-copies-defaut" type="text" inputmode="numeric" class="form-control et-copies-input" value="1" aria-describedby="et-copies-defaut-err">
              <div class="invalid-feedback" id="et-copies-defaut-err">Entrez un nombre de 1 à <?php echo (int) Etiquettes::MAX_COPIES; ?>.</div>
            </div>
            <div class="form-group col-6 col-md-4 mb-0" id="et-depart-groupe">
              <label for="et-depart">Commencer à la case</label>
              <input id="et-depart" type="text" inputmode="numeric" class="form-control et-copies-input" value="1" aria-describedby="et-depart-err">
              <div class="invalid-feedback" id="et-depart-err">Entrez un nombre de 1 à 30.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card no-print">
      <div class="card-header d-flex align-items-center">
        <h2 class="card-title h5 mb-0">À imprimer <span id="et-compte" class="badge badge-secondary ml-2">0</span></h2>
        <button type="button" id="et-vider" class="btn btn-sm btn-outline-secondary ml-auto" disabled><i class="fas fa-trash"></i> Vider la liste</button>
      </div>
      <div class="card-body" id="et-carte-impression">
        <div class="et-barre-impression">
          <fieldset class="et-formats">
            <legend class="sr-only">Format</legend>
            <?php foreach ($formats as $cle => $f) { ?>
              <div class="custom-control custom-radio custom-control-inline et-format-option">
                <input class="custom-control-input" type="radio" name="et-format" id="et-format-<?php echo e($cle); ?>" value="<?php echo e($cle); ?>"<?php echo $cle === 'feuille30' ? ' checked' : ''; ?>>
                <label class="custom-control-label" for="et-format-<?php echo e($cle); ?>" title="<?php echo e($f['aide']); ?>"><?php echo e($formatsCourts[$cle]); ?></label>
              </div>
            <?php } ?>
          </fieldset>
          <div class="et-imprimer-groupe">
            <span class="et-info" role="img" aria-label="Dans la fenêtre d'impression : échelle 100 % (Taille réelle) et marges Aucune. Essayez d'abord sur du papier ordinaire." title="Dans la fenêtre d'impression : échelle 100 % (Taille réelle) et marges « Aucune ». Essayez d'abord sur du papier ordinaire."><i class="fas fa-info-circle" aria-hidden="true"></i></span>
            <button type="button" id="et-imprimer" class="btn btn-primary btn-lg" disabled><i class="fas fa-print"></i> Imprimer</button>
          </div>
        </div>
        <div id="et-resume" class="alert alert-light border mt-3 mb-0" role="status">—</div>
        <div id="et-refus" class="alert alert-danger mt-3 mb-0" style="display:none" role="alert"></div>
      </div>
      <div class="card-body p-0 et-liste">
        <div id="et-vide" class="text-muted text-center p-4">Aucune étiquette. <button type="button" id="et-vide-action" class="btn btn-outline-secondary ml-2"><i class="fas fa-search"></i> Ajouter une pièce</button></div>
        <div class="table-responsive">
          <table id="et-table" class="table table-sm table-striped mb-0 et-table" style="display:none">
            <thead><tr><th class="et-col-type">Type</th><th>Code</th><th>Description</th><th class="nombre">Copies</th><th><span class="sr-only">Retirer</span></th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card et-carte-apercu" style="display:none">
      <div class="card-header no-print"><h2 class="card-title h5 mb-0">Aperçu</h2></div>
      <div class="card-body">
        <div id="et-apercu" class="et-apercu"></div>
      </div>
    </div>
  </div></section>
</div>
