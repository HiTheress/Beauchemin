<?php
// Écran de comptage (employé+) : on scanne les pièces d'un emplacement (+1 par scan) ou on règle la quantité (−, +, saisie) ;
// « Terminer le comptage » : le gestionnaire voit les corrections puis les applique, l'employé le fait appliquer par un gestionnaire.
// Voir assets/js/comptage.js.
if (!acces_page('employe')) { return; }
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$st = $pdo->prepare('SELECT entreprise_id FROM comptages WHERE id = ?');
$st->execute(array($id));
$ent_comptage = $st->fetchColumn();
if ($ent_comptage === false || !$Ouser->peutAcces((int) $ent_comptage)) { ?>
<div class="content-wrapper"><?php page_titre('Compter', array('Opérations', 'Comptage')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning" role="alert">Ce comptage n'existe pas ou vous n'y avez pas accès. <a class="alert-link" href="index.php?page=comptage">Retour aux comptages</a></div>
  </div></section>
</div>
<?php return; }

page_script('assets/js/scan.js');
page_script('assets/js/comptage.js');
?>
<link rel="stylesheet" href="assets/css/scan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/scan.css'); ?>">
<div class="content-wrapper" id="page-comptage-voir" data-comptage-id="<?php echo (int) $id; ?>" data-role="<?php echo e($Ouser->role()); ?>">
  <?php page_titre('Compter', array('Opérations', 'Comptage')); ?>
  <section class="content"><div class="container-fluid">

    <div id="cv-alerte" aria-live="polite"></div>

    <div class="card cp-carte"><div class="card-body cp-tete">
      <div id="cv-entete" class="cp-tete-info"><span class="text-muted"><i class="fas fa-spinner fa-spin mr-1" aria-hidden="true"></i> Chargement…</span></div>
      <div class="cp-barre no-print" id="cv-actions"></div>
    </div></div>

    <div class="card cp-carte cp-saisie d-none" id="cv-saisie"><div class="card-body">
      <label for="scan" class="sr-only">Pièce</label>
      <div class="scan-box">
        <input id="scan" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="none" maxlength="64" placeholder="Scannez une pièce…">
      </div>
      <span id="sc-attente" class="sc-attente text-muted" aria-live="polite"></span>
      <div class="sc-outils">
        <div class="sc-boutons">
          <button type="button" id="btn-camera" class="btn btn-outline-secondary" aria-expanded="false" aria-controls="cam-zone"><i class="fas fa-camera mr-1" aria-hidden="true"></i> Caméra</button>
          <button type="button" id="btn-clavier" class="btn btn-outline-secondary" aria-pressed="false"><i class="fas fa-keyboard mr-1" aria-hidden="true"></i> Clavier</button>
        </div>
        <div class="sc-choix">
          <label for="recherche" id="lib-recherche">Chercher une pièce</label>
          <select id="recherche" class="form-control"><option></option></select>
        </div>
      </div>
      <div id="cam-zone" class="d-none"></div>
      <div id="cv-dernier" class="cp-dernier d-none" role="status"></div>
      <div id="cv-annonce" class="sr-only" role="status" aria-live="polite"></div>
      <details id="cv-options" class="sc-plus">
        <summary>Plus d'options</summary>
        <div class="custom-control custom-checkbox mt-2">
          <input type="checkbox" class="custom-control-input" id="cv-aveugle">
          <label class="custom-control-label" for="cv-aveugle">Masquer le stock attendu</label>
        </div>
      </details>
    </div></div>

    <div class="card cp-carte">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="card-title m-0">Pièces comptées <span id="cv-nb" class="badge badge-info ml-1"></span></h2>
        <button type="button" id="btn-actualiser" class="btn btn-sm btn-outline-secondary no-print" title="Actualiser" aria-label="Actualiser"><i class="fas fa-sync-alt" aria-hidden="true"></i></button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive"><table id="cv-table" class="table table-striped cp-table mb-0"><thead></thead><tbody></tbody></table></div>
        <div id="cv-vide" class="text-muted text-center p-4">Aucune pièce comptée.</div>
      </div>
    </div>

    <div class="card cp-carte d-none" id="cv-non-comptees">
      <div class="card-header"><h2 class="card-title m-0">Pas encore comptées <span id="cv-nb-non" class="badge badge-secondary ml-1"></span></h2></div>
      <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm cp-table mb-0"><thead><tr><th scope="col" class="d-none d-sm-table-cell">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Stock attendu</th></tr></thead><tbody id="cv-non-corps"></tbody></table></div></div>
    </div>

  </div></section>

  <!-- Corrections à appliquer (gestionnaire+) : écarts contre le stock actuel, puis confirmation -->
  <div class="modal fade" id="modal-appliquer" tabindex="-1" role="dialog" aria-labelledby="modal-appliquer-titre" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title h5" id="modal-appliquer-titre">Terminer le comptage</h2><button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
      <div class="modal-body" id="ap-corps"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Fermer</button>
        <button type="button" class="btn btn-primary" id="ap-confirmer" disabled>Appliquer les corrections</button>
      </div>
    </div></div>
  </div>

  <!-- Confirmation d'annulation -->
  <div class="modal fade" id="modal-annuler" tabindex="-1" role="dialog" aria-labelledby="modal-annuler-titre" aria-hidden="true">
    <div class="modal-dialog" role="document"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title h5" id="modal-annuler-titre">Annuler ce comptage ?</h2><button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
      <div class="modal-body"><p class="mb-1">Les quantités comptées seront perdues. <strong>Le stock ne sera pas modifié.</strong></p><div id="an-erreur" class="text-danger" role="alert"></div></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Garder le comptage</button>
        <button type="button" class="btn btn-danger" id="an-confirmer">Annuler le comptage</button>
      </div>
    </div></div>
  </div>
</div>
