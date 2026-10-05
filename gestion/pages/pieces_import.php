<?php
// Import du catalogue et du stock initial depuis un fichier CSV. Gestionnaire et plus.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/ajax/import_lib.php';
page_script('assets/js/import.js');
$entreprises = inventaire()->listeEntreprises(utilisateur_id());
$config = array('max_octets' => 2097152, 'max_lignes' => 5000);

// Description des colonnes (affichée dans la page, repliable)
$colonnes = array(
	array('code', 'Obligatoire', 'Code interne de la pièce (celui imprimé sur les étiquettes) : 40 caractères au plus, lettres sans accent (converties en majuscules), chiffres et les symboles . - _ /, sans espace. Une ligne dont le code commence par # est un commentaire : elle est ignorée.'),
	array('nom', 'Obligatoire pour une nouvelle pièce', 'Nom de la pièce (150 caractères au plus).'),
	array('categorie', 'Facultatif', 'Nom d\'une catégorie existante (ou créée automatiquement si vous cochez l\'option).'),
	array('unite', 'Facultatif', 'unité, m, paire… (« unité » par défaut pour une nouvelle pièce).'),
	array('code_barres', 'Facultatif', 'Code-barres du fabricant (alias scannable). Plusieurs codes : séparez-les par |. Un alias déjà utilisé ailleurs est refusé.'),
	array('description', 'Facultatif', 'Texte libre.'),
	array('fournisseur', 'Facultatif', 'Nom du fournisseur (avec prix_fournisseur).'),
	array('prix_fournisseur', 'Facultatif', 'Prix chez ce fournisseur, ex. 14,50 ou 14.50.'),
	array('no_fournisseur', 'Facultatif', 'Numéro de la pièce chez le fournisseur.'),
);
foreach ($entreprises as $en) {
	$colonnes[] = array('minimum_entreprise_' . (int) $en['id'], 'Facultatif', 'Quantité minimale souhaitée pour « ' . $en['nom'] . ' » (alerte « sous le minimum »).');
}
$colonnes[] = array('emplacement', 'Pour le stock initial', 'Code EMP-… ou nom de l\'emplacement où se trouve le stock.');
$colonnes[] = array('quantite', 'Pour le stock initial', 'Quantité en stock (stock initial des NOUVELLES pièces seulement : l\'import ne modifie jamais le stock d\'une pièce existante).');
$colonnes[] = array('cout', 'Conseillé avec la quantité', 'Coût unitaire du stock initial : il alimente le coût moyen.');
?>
<link rel="stylesheet" href="assets/css/etiquette_commun.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/etiquette_commun.css'); ?>">
<style>
  .imp-steps { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; margin: 0 0 1rem; }
  .imp-steps li { padding: .45rem .9rem; border-radius: 2rem; background: #e9ecef; color: #495057; font-weight: 500; }
  .imp-steps li.actif { background: #0056b3; color: #fff; }
  .imp-steps li.fait { background: #1e7e34; color: #fff; }
  .imp-btn { min-height: 44px; }
  .custom-file, .custom-file-input, .custom-file-label { min-height: 44px; }
  .custom-file-label { line-height: 2rem; overflow: hidden; }
  .custom-file-label::after { content: 'Parcourir'; line-height: 2rem; }
  #imp-depart .custom-control-label, #imp-options .custom-control-label { font-weight: 400; }
  #imp-options .custom-control-label strong { font-weight: 700; }
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
  #imp-erreur:focus, .imp-titre:focus, #imp-zone-table:focus { outline: none; }
  #imp-erreur { scroll-margin-top: 5rem; }
</style>
<div class="content-wrapper a2-page">
  <?php page_titre('Importer des pièces (CSV)', array('Catalogue', 'Import')); ?>
  <section class="content"><div class="container-fluid">
    <div id="imp-config" data-config="<?php echo e(json_encode($config)); ?>"></div>

    <ol class="imp-steps" aria-label="Étapes de l'import">
      <li id="imp-s1" class="actif" aria-current="step">1. Modèle<span class="sr-only"></span></li>
      <li id="imp-s2">2. Fichier<span class="sr-only"></span></li>
      <li id="imp-s3">3. Aperçu et confirmation<span class="sr-only"></span></li>
      <li id="imp-s4">4. Résultat<span class="sr-only"></span></li>
    </ol>

    <div id="imp-annonce" class="sr-only" role="status" aria-live="polite"></div>
    <div id="imp-erreur" class="alert alert-danger" role="alert" tabindex="-1" style="display:none"></div>

    <!-- Étapes 1 et 2 -->
    <div id="imp-depart">
      <div class="row">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h3 class="card-title">1. Télécharger le modèle</h3></div>
            <div class="card-body">
              <p>Remplissez le modèle dans Excel (ou un autre tableur) puis enregistrez-le en <strong>CSV</strong>. Les lignes d'exemple commencent par <code>#</code> : elles sont ignorées.</p>
              <a id="imp-modele" class="btn btn-primary imp-btn" href="app/ajax/import_modele.php"><i class="fas fa-download"></i> Télécharger le modèle CSV</a>
              <hr>
              <p class="mb-2">Pour <strong>corriger le catalogue existant</strong>, exportez-le, modifiez-le puis réimportez-le en mode « Créer ou mettre à jour » :</p>
              <div class="custom-control custom-checkbox mb-2">
                <input type="checkbox" class="custom-control-input" id="imp-exp-inactives">
                <label class="custom-control-label" for="imp-exp-inactives">Inclure les pièces désactivées</label>
              </div>
              <a id="imp-exporter" class="btn btn-outline-primary imp-btn" href="app/ajax/pieces_export.php"><i class="fas fa-file-export"></i> Exporter le catalogue actuel (CSV)</a>
              <p class="small text-muted mt-2 mb-0">Les colonnes de quantité de l'export suivent l'entreprise choisie en haut de l'écran.</p>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h3 class="card-title">2. Choisir le fichier</h3></div>
            <div class="card-body">
              <div class="form-group">
                <label for="imp-fichier">Fichier CSV (.csv ou .txt, 2 Mo et 5 000 lignes au plus)</label>
                <div class="custom-file">
                  <input type="file" id="imp-fichier" class="custom-file-input" accept=".csv,.txt,text/csv,text/plain">
                  <label class="custom-file-label" for="imp-fichier" id="imp-fichier-nom">Choisir un fichier…</label>
                </div>
                <small class="form-text text-muted">Séparateur « ; » ou « , », encodage UTF-8 ou Windows-1252 (Excel), décimales à virgule ou à point : détectés automatiquement.</small>
              </div>
              <button type="button" id="imp-analyser" class="btn btn-success imp-btn"><i class="fas fa-search"></i> Analyser le fichier</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card collapsed-card">
        <div class="card-header">
          <h3 class="card-title">Description des colonnes</h3>
          <div class="card-tools"><button type="button" id="imp-desc-bascule" class="btn btn-tool" data-card-widget="collapse" aria-expanded="false" aria-controls="imp-desc-corps" aria-label="Afficher ou masquer la description des colonnes"><i class="fas fa-plus"></i></button></div>
        </div>
        <div class="card-body p-0" id="imp-desc-corps">
          <div class="table-responsive">
            <table class="table table-sm table-striped mb-0">
              <thead><tr><th>Colonne</th><th>Utilisation</th><th>Contenu</th></tr></thead>
              <tbody>
                <?php foreach ($colonnes as $c) { ?>
                  <tr><td class="code"><?php echo e($c[0]); ?></td><td><?php echo e(ImportCatalogue::typo($c[1])); ?></td><td><?php echo e(ImportCatalogue::typo($c[2])); ?></td></tr>
                <?php } ?>
              </tbody>
            </table>
          </div>
          <div class="p-3 small text-muted">
            Les colonnes <code>minimum_entreprise_N</code> désignent l'entreprise par son numéro :
            <?php foreach ($entreprises as $i => $en) { echo ($i ? ', ' : '') . e($en['nom']) . ' = ' . (int) $en['id']; } ?>.
            Une cellule vide ne modifie jamais une valeur existante. Les colonnes inconnues sont ignorées.
          </div>
        </div>
      </div>
    </div>

    <!-- Options (visibles aux étapes 2 et 3) -->
    <div id="imp-options" class="card">
      <div class="card-header"><h3 class="card-title">Options de l'import</h3></div>
      <div class="card-body">
        <fieldset class="form-group mb-2">
          <legend class="h6">Mode</legend>
          <div class="custom-control custom-radio">
            <input type="radio" class="custom-control-input" name="imp-mode" id="imp-mode-creer" value="creer" checked>
            <label class="custom-control-label" for="imp-mode-creer"><strong>Créer seulement</strong> : les codes déjà existants sont ignorés.</label>
          </div>
          <div class="custom-control custom-radio">
            <input type="radio" class="custom-control-input" name="imp-mode" id="imp-mode-maj" value="creer_maj">
            <label class="custom-control-label" for="imp-mode-maj"><strong>Créer ou mettre à jour</strong> : met à jour nom, catégorie, unité, alias, minimums et prix des pièces existantes (jamais le stock).</label>
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
      </div>
    </div>

    <!-- Étape 3 : aperçu -->
    <div id="imp-apercu" style="display:none">
      <div class="card">
        <div class="card-header d-flex align-items-center flex-wrap">
          <h3 class="card-title mb-0 imp-titre" id="imp-titre-3" tabindex="-1">3. Aperçu et confirmation</h3>
          <div class="ml-auto"><button type="button" id="imp-changer" class="btn btn-sm btn-outline-secondary imp-btn"><i class="fas fa-undo"></i> Choisir un autre fichier</button></div>
        </div>
        <div class="card-body">
          <p id="imp-meta" class="small text-muted"></p>
          <div id="imp-tuiles" class="d-flex flex-wrap mb-3" style="gap:.5rem"></div>
          <div id="imp-bilan" class="mb-3" role="status" aria-live="polite"></div>
          <div class="btn-group mb-2 flex-wrap" role="group" aria-label="Filtrer les lignes" id="imp-filtres"></div>
          <div class="table-responsive imp-cible" id="imp-zone-table" tabindex="-1" aria-label="Lignes analysées">
            <table id="imp-table" class="table table-sm mb-0">
              <thead><tr><th>Ligne</th><th>Code</th><th>Nom</th><th>Action</th><th>Stock initial</th><th>Détails</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div id="imp-pagination" class="d-flex align-items-center mt-2 flex-wrap" style="gap:.5rem"></div>
        </div>
        <div class="card-footer d-flex flex-wrap align-items-center" style="gap:.5rem">
          <button type="button" id="imp-confirmer" class="btn btn-primary btn-lg imp-btn" disabled><i class="fas fa-check"></i> Confirmer l'import</button>
          <button type="button" id="imp-erreurs-csv" class="btn btn-outline-danger imp-btn" style="display:none"><i class="fas fa-download"></i> <span id="imp-erreurs-csv-txt">Télécharger les erreurs (CSV)</span></button>
          <span id="imp-confirmer-aide" class="text-muted"></span>
        </div>
      </div>
    </div>

    <!-- Étape 4 : résultat -->
    <div id="imp-resultat" style="display:none">
      <div class="card">
        <div class="card-header"><h3 class="card-title imp-titre" id="imp-titre-4" tabindex="-1">4. Résultat</h3></div>
        <div class="card-body">
          <div id="imp-resume" class="alert alert-success" role="status"></div>
          <div id="imp-docs"></div>
        </div>
        <div class="card-footer d-flex flex-wrap" style="gap:.5rem">
          <a class="btn btn-primary imp-btn" href="index.php?page=pieces"><i class="fas fa-cogs"></i> Voir les pièces</a>
          <a class="btn btn-outline-primary imp-btn" href="index.php?page=etiquettes"><i class="fas fa-print"></i> Imprimer des étiquettes</a>
          <button type="button" id="imp-autre" class="btn btn-outline-secondary imp-btn"><i class="fas fa-redo"></i> Importer un autre fichier</button>
        </div>
      </div>
    </div>
  </div></section>
</div>
