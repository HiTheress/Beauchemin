<?php
// Import du catalogue et du stock initial depuis un fichier CSV. Gestionnaire et plus.
if (!acces_page('gestionnaire')) { return; }
page_script('assets/js/import.js');
$config = array('max_octets' => 2097152, 'max_lignes' => 5000);
?>
<link rel="stylesheet" href="assets/css/etiquette_commun.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/etiquette_commun.css'); ?>">
<style>
  .imp-steps { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; margin: 0 0 1rem; }
  .imp-steps li { padding: .45rem .9rem; border-radius: 2rem; background: #e9ecef; color: #495057; font-weight: 500; }
  .imp-steps li.actif { background: #0056b3; color: #fff; }
  .imp-steps li.fait { background: #1e7e34; color: #fff; }
  .imp-btn { min-height: 44px; }
  .imp-barre { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-bottom: 1rem; }
  .imp-barre .imp-changer { margin-left: auto; }
  #imp-meta { margin-bottom: .75rem; }
  .imp-info { color: #565e64; cursor: help; margin-left: .25rem; }
  #imp-export-bloc { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; }
  .custom-file, .custom-file-input, .custom-file-label { min-height: 44px; }
  .custom-file-label { line-height: 2rem; overflow: hidden; }
  .custom-file-label::after { content: 'Parcourir'; line-height: 2rem; }
  #imp-options .custom-control-label { font-weight: 400; }
  .imp-tuile { border-radius: .25rem; padding: .6rem .9rem; background: #fff; border: 1px solid #dee2e6; min-width: 8.5rem; }
  .imp-tuile .n { font-size: 1.5rem; font-weight: 600; line-height: 1.1; }
  .imp-tuile.erreur { border-color: #b02a37; background: #fff5f5; }
  .imp-tuile.avert { border-color: #b8860b; background: #fffdf3; }
  /* Filtre actif : texte blanc sur fond foncé (le thème imposait une couleur de lien sur gris : contraste 1,2 pour 1) */
  #imp-filtres .btn.active, #imp-filtres .btn.active:focus, #imp-filtres .btn.active:hover { color: #fff !important; background: #343a40; border-color: #343a40; }
  #imp-table td { vertical-align: top; }
  #imp-table td.code { white-space: nowrap; font-family: 'DejaVu Sans Mono', 'Liberation Mono', Consolas, monospace; font-size: .9rem; }
  #imp-table tr.st-erreur { background: #fff1f1; }
  #imp-table tr.st-avertissement { background: #fffbea; }
  #imp-table tr.st-ignoree td, #imp-table tr.act-ignorer td { color: #565e64; }
  .imp-msg-erreur { color: #8f1f2b; }
  .imp-msg-avertissement { color: #7a5c00; }
  .imp-msg-info { color: #565e64; }
  .imp-msgs { list-style: none; margin: 0; padding: 0; }
  .imp-cible { scroll-margin-top: 5rem; }
  /* Téléphone : chaque ligne devient une petite fiche au lieu d'un tableau qui déborde */
  @media (max-width: 575.98px) {
    #imp-table thead { display: none; }
    #imp-table, #imp-table tbody { display: block; }
    #imp-table tr { display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: "ligne code action" "nom nom nom" "stock stock stock" "details details details"; column-gap: .5rem; align-items: center; padding: .4rem .5rem; }
    #imp-table td { display: block; border: 0; padding: .1rem 0; }
    #imp-table td:empty { display: none; }
    #imp-table td:nth-child(1) { grid-area: ligne; }
    #imp-table td:nth-child(2) { grid-area: code; }
    #imp-table td:nth-child(3) { grid-area: nom; }
    #imp-table td:nth-child(4) { grid-area: action; }
    #imp-table td:nth-child(5) { grid-area: stock; }
    #imp-table td:nth-child(6) { grid-area: details; }
    #imp-table td[colspan] { grid-column: 1 / -1; }
  }
  #imp-erreur:focus, .imp-titre:focus, #imp-zone-table:focus { outline: none; }
  #imp-erreur { scroll-margin-top: 5rem; }
</style>
<div class="content-wrapper a2-page">
  <?php page_titre('Importer des pièces', array('Catalogue', 'Import')); ?>
  <section class="content"><div class="container-fluid">
    <div id="imp-config" data-config="<?php echo e(json_encode($config)); ?>"></div>

    <ol class="imp-steps" aria-label="Étapes de l'import">
      <li id="imp-s1" class="actif" aria-current="step">1. Fichier<span class="sr-only"></span></li>
      <li id="imp-s2">2. Aperçu<span class="sr-only"></span></li>
      <li id="imp-s3">3. Résultat<span class="sr-only"></span></li>
    </ol>

    <div id="imp-annonce" class="sr-only" role="status" aria-live="polite"></div>
    <div id="imp-erreur" class="alert alert-danger" role="alert" tabindex="-1" style="display:none"></div>

    <!-- Étape 1 : fichier -->
    <div id="imp-depart">
      <div class="card">
        <div class="card-body">
          <div class="form-group">
            <label for="imp-fichier">Fichier CSV</label>
            <div class="custom-file">
              <input type="file" id="imp-fichier" class="custom-file-input" accept=".csv,.txt,text/csv,text/plain">
              <label class="custom-file-label" for="imp-fichier" id="imp-fichier-nom">Choisir un fichier…</label>
            </div>
          </div>
          <div class="d-flex flex-wrap align-items-center" style="gap:.5rem 1.5rem">
            <button type="button" id="imp-analyser" class="btn btn-primary btn-lg imp-btn"><i class="fas fa-eye"></i> Voir l'aperçu</button>
            <a id="imp-modele" class="btn btn-link imp-btn" href="app/ajax/import_modele.php"><i class="fas fa-download"></i> Télécharger un exemple</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Options (étapes 1 et 2) -->
    <div id="imp-options-zone">
      <button type="button" id="imp-plus" class="btn btn-link imp-btn a2-plus" data-toggle="collapse" data-target="#imp-options" aria-expanded="false" aria-controls="imp-options">Plus d'options <i class="fas fa-caret-down" aria-hidden="true"></i></button>
      <div id="imp-options" class="collapse">
        <div class="card mt-2">
          <div class="card-body">
            <fieldset class="form-group mb-2">
              <legend class="sr-only">Mode</legend>
              <div class="custom-control custom-radio">
                <input type="radio" class="custom-control-input" name="imp-mode" id="imp-mode-creer" value="creer" checked>
                <label class="custom-control-label" for="imp-mode-creer" title="Les codes déjà existants sont ignorés.">Créer seulement</label>
              </div>
              <div class="custom-control custom-radio">
                <input type="radio" class="custom-control-input" name="imp-mode" id="imp-mode-maj" value="creer_maj">
                <label class="custom-control-label" for="imp-mode-maj" title="Met à jour nom, catégorie, unité, codes, minimums et prix des pièces existantes (jamais le stock).">Créer ou mettre à jour</label>
              </div>
            </fieldset>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="imp-creer-cat">
              <label class="custom-control-label" for="imp-creer-cat">Créer les catégories manquantes</label>
            </div>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="imp-creer-four">
              <label class="custom-control-label" for="imp-creer-four">Créer les fournisseurs manquants</label>
            </div>
            <div id="imp-export-bloc" class="border-top pt-3 mt-3">
              <a id="imp-exporter" class="btn btn-outline-secondary imp-btn" href="app/ajax/pieces_export.php"><i class="fas fa-file-export"></i> Exporter le catalogue</a>
              <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="imp-exp-inactives">
                <label class="custom-control-label" for="imp-exp-inactives">Avec les pièces désactivées</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Étape 2 : aperçu -->
    <div id="imp-apercu" style="display:none">
      <div class="card">
        <div class="card-body">
          <h2 class="sr-only imp-titre" id="imp-titre-2" tabindex="-1">2. Aperçu</h2>
          <div id="imp-meta" class="small text-muted"></div>
          <div id="imp-tuiles" class="d-flex flex-wrap mb-3" style="gap:.5rem"></div>
          <div id="imp-bilan" class="mb-3" role="status" aria-live="polite"></div>
          <div class="imp-barre">
            <button type="button" id="imp-confirmer" class="btn btn-primary btn-lg imp-btn" disabled><i class="fas fa-check"></i> Importer</button>
            <button type="button" id="imp-erreurs-csv" class="btn btn-outline-danger imp-btn" style="display:none"><i class="fas fa-download"></i> <span id="imp-erreurs-csv-txt">Télécharger les erreurs (CSV)</span></button>
            <button type="button" id="imp-changer" class="btn btn-outline-secondary imp-btn imp-changer"><i class="fas fa-undo"></i> Choisir un autre fichier</button>
          </div>
          <div class="btn-group mb-2 flex-wrap" role="group" aria-label="Filtrer les lignes" id="imp-filtres"></div>
          <div class="table-responsive imp-cible" id="imp-zone-table" tabindex="-1" aria-label="Lignes analysées">
            <table id="imp-table" class="table table-sm mb-0">
              <thead><tr><th>Ligne</th><th>Code</th><th>Nom</th><th>Action</th><th>Stock initial</th><th>Détails</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div id="imp-pagination" class="d-flex align-items-center mt-2 flex-wrap" style="gap:.5rem"></div>
        </div>
      </div>
    </div>

    <!-- Étape 3 : résultat -->
    <div id="imp-resultat" style="display:none">
      <div class="card">
        <div class="card-body">
          <h2 class="sr-only imp-titre" id="imp-titre-3" tabindex="-1">3. Résultat</h2>
          <div id="imp-resume" class="alert alert-success" role="status"></div>
          <div id="imp-docs"></div>
        </div>
        <div class="card-footer d-flex flex-wrap" style="gap:.5rem">
          <a class="btn btn-primary btn-lg imp-btn" href="index.php?page=pieces"><i class="fas fa-cogs"></i> Voir les pièces</a>
          <a class="btn btn-outline-secondary imp-btn" href="index.php?page=etiquettes"><i class="fas fa-print"></i> Imprimer des étiquettes</a>
          <button type="button" id="imp-autre" class="btn btn-outline-secondary imp-btn"><i class="fas fa-redo"></i> Importer un autre fichier</button>
        </div>
      </div>
    </div>
  </div></section>
</div>
