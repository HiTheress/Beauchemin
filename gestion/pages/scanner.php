<?php
// Scanner (employé+) : un champ de scan, puis la fiche de la pièce (quantités par emplacement) ou le contenu de l'emplacement (EMP-…).
// Recherche par nom et choix d'un emplacement en secours ; historique de la session. Voir assets/js/scan.js.
if (!acces_page('employe')) { return; }
page_script('assets/js/scan.js');
?>
<link rel="stylesheet" href="assets/css/scan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/scan.css'); ?>">
<div class="content-wrapper" id="page-scanner" data-role="<?php echo e($Ouser->role()); ?>" data-user="<?php echo (int) utilisateur_id(); ?>">
  <?php page_titre('Scanner', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">

    <div class="card sc-carte"><div class="card-body">
      <label for="scan" class="sr-only">Code-barres</label>
      <div class="scan-box">
        <input id="scan" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="none" maxlength="64"
               placeholder="Scannez un code…">
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
        <div class="sc-choix">
          <label for="emp-choix">Voir un emplacement</label>
          <select id="emp-choix" class="form-control" disabled><option value="">Chargement…</option></select>
        </div>
      </div>
      <div id="cam-zone" class="d-none"></div>
    </div></div>

    <div id="sc-messages" aria-live="polite"></div>
    <div id="sc-annonce" class="sr-only" role="status" aria-live="polite"></div>

    <div class="row">
      <div class="col-xl-8">
        <div id="sc-resultat" role="region" aria-label="Résultat du scan">
          <div class="card"><div class="card-body text-muted sc-accueil">
            <i class="fas fa-barcode fa-2x mb-2" aria-hidden="true"></i><br>
            Prêt à scanner.
          </div></div>
        </div>
      </div>
      <div class="col-xl-4">
        <div class="card sc-historique">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="card-title m-0">Derniers scans</h2>
            <button type="button" id="sc-vider-hist" class="btn btn-sm btn-outline-secondary">Effacer</button>
          </div>
          <div class="card-body p-0"><ul id="sc-hist" class="list-unstyled m-0"></ul></div>
        </div>
      </div>
    </div>

  </div></section>
</div>
