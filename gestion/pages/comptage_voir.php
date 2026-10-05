<?php
// Écran de comptage (employé+) : on scanne les pièces d'un emplacement (+1 par scan) ou on tape la quantité exacte ;
// le gestionnaire applique le comptage (ajustement du stock), l'employé le fait approuver. Voir assets/js/comptage.js.
if (!acces_page('employe')) { return; }
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$st = $pdo->prepare('SELECT entreprise_id FROM comptages WHERE id = ?');
$st->execute(array($id));
$ent_comptage = $st->fetchColumn();
if ($ent_comptage === false || !$Ouser->peutAcces((int) $ent_comptage)) { ?>
<div class="content-wrapper"><?php page_titre('Comptage introuvable', array('Opérations', 'Comptage')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning" role="alert">Ce comptage n'existe pas ou vous n'y avez pas accès. <a class="alert-link" href="index.php?page=comptage">Retour à la liste des comptages</a></div>
  </div></section>
</div>
<?php return; }

page_script('assets/js/scan.js');
page_script('assets/js/comptage.js');
?>
<link rel="stylesheet" href="assets/css/scan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/scan.css'); ?>">
<div class="content-wrapper" id="page-comptage-voir" data-comptage-id="<?php echo (int) $id; ?>" data-role="<?php echo e($Ouser->role()); ?>">
  <?php page_titre('Comptage d\'inventaire', array('Opérations', 'Comptage')); ?>
  <section class="content"><div class="container-fluid">

    <div id="cv-alerte" aria-live="polite"></div>

    <div class="card cp-carte"><div class="card-body" id="cv-entete"><span class="text-muted"><i class="fas fa-spinner fa-spin mr-1" aria-hidden="true"></i> Chargement du comptage…</span></div></div>

    <div class="card cp-carte cp-saisie d-none" id="cv-saisie"><div class="card-body">
      <label for="scan" class="sc-label">Scannez chaque pièce : chaque scan ajoute 1</label>
      <div class="scan-box">
        <input id="scan" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="none" maxlength="64" placeholder="Scannez une pièce, puis Entrée…" aria-describedby="scan-aide">
      </div>
      <div class="sc-sous-champ">
        <small id="scan-aide" class="form-text text-muted">Pour une quantité exacte, tapez-la dans la colonne « Compté » du tableau, puis Entrée.</small>
        <span id="sc-attente" class="sc-attente text-muted" aria-live="polite"></span>
      </div>
      <div class="row">
        <div class="col-lg-5 col-md-6 form-group">
          <label for="recherche">Chercher une pièce par son nom ou son code</label>
          <select id="recherche" class="form-control"><option></option></select>
        </div>
        <div class="col-lg-4 col-md-6 form-group d-flex align-items-end">
          <div class="custom-control custom-checkbox">
            <input type="checkbox" class="custom-control-input" id="cv-aveugle">
            <label class="custom-control-label" for="cv-aveugle">Comptage à l'aveugle (masquer le stock attendu)</label>
          </div>
        </div>
        <div class="col-lg-3 col-md-12 form-group sc-boutons">
          <button type="button" id="btn-camera" class="btn btn-outline-primary" aria-expanded="false" aria-controls="cam-zone"><i class="fas fa-camera mr-1" aria-hidden="true"></i> Utiliser la caméra</button>
          <button type="button" id="btn-clavier" class="btn btn-outline-secondary" aria-pressed="false" title="Afficher le clavier de la tablette pour taper un code"><i class="fas fa-keyboard mr-1" aria-hidden="true"></i> Clavier</button>
        </div>
      </div>
      <div id="cam-zone" class="d-none"></div>
      <ul id="cv-journal" class="cp-journal" aria-label="Derniers scans"></ul>
    </div></div>

    <div class="card cp-carte">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="card-title m-0">Pièces comptées <span id="cv-nb" class="badge badge-info ml-1"></span></h2>
        <button type="button" id="btn-actualiser" class="btn btn-sm btn-outline-secondary no-print"><i class="fas fa-sync-alt mr-1" aria-hidden="true"></i> Actualiser</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive"><table id="cv-table" class="table table-striped cp-table mb-0"><thead></thead><tbody></tbody></table></div>
        <div id="cv-vide" class="text-muted text-center p-4">Aucune pièce comptée pour le moment.</div>
      </div>
    </div>

    <div class="card cp-carte d-none" id="cv-non-comptees">
      <div class="card-header"><h2 class="card-title m-0">En stock selon le système, pas encore comptées <span id="cv-nb-non" class="badge badge-secondary ml-1"></span></h2></div>
      <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm cp-table mb-0"><thead><tr><th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Stock attendu</th></tr></thead><tbody id="cv-non-corps"></tbody></table></div></div>
    </div>

    <div class="card cp-carte no-print"><div class="card-body"><div class="cp-barre" id="cv-actions"></div></div></div>

  </div></section>

  <!-- Aperçu et confirmation de l'application du comptage (gestionnaire+) -->
  <div class="modal fade" id="modal-appliquer" tabindex="-1" role="dialog" aria-labelledby="modal-appliquer-titre" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title h5" id="modal-appliquer-titre">Appliquer le comptage</h2><button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
      <div class="modal-body" id="ap-corps"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Fermer</button>
        <button type="button" class="btn btn-success" id="ap-confirmer" disabled>Appliquer le comptage</button>
      </div>
    </div></div>
  </div>

  <!-- Confirmation d'annulation -->
  <div class="modal fade" id="modal-annuler" tabindex="-1" role="dialog" aria-labelledby="modal-annuler-titre" aria-hidden="true">
    <div class="modal-dialog" role="document"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title h5" id="modal-annuler-titre">Annuler ce comptage ?</h2><button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
      <div class="modal-body"><p class="mb-1">Les quantités comptées seront abandonnées. <strong>Le stock ne sera pas modifié.</strong></p><div id="an-erreur" class="text-danger" role="alert"></div></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Garder le comptage</button>
        <button type="button" class="btn btn-danger" id="an-confirmer">Annuler le comptage</button>
      </div>
    </div></div>
  </div>
</div>
