<?php
// Scanner / Chercher (employé+) : consultation rapide. Scanner une pièce : fiche (quantités, alertes, actions).
// Scanner un emplacement (EMP-…) : tout ce qu'il contient. Recherche par nom en secours ; historique de la session.
if (!acces_page('employe')) { return; }
page_script('assets/js/scan.js');
?>
<link rel="stylesheet" href="assets/css/scan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/scan.css'); ?>">
<div class="content-wrapper" id="page-scanner" data-role="<?php echo e($Ouser->role()); ?>" data-user="<?php echo (int) utilisateur_id(); ?>">
  <?php page_titre('Scanner / Chercher', array('Opérations')); ?>
  <section class="content"><div class="container-fluid">

    <div class="card sc-carte"><div class="card-body">
      <label for="scan" class="sc-label">Scannez un code-barres (pièce ou emplacement)</label>
      <div class="scan-box">
        <input id="scan" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="none" maxlength="64"
               placeholder="Scannez, puis Entrée…" aria-describedby="scan-aide">
      </div>
      <div class="sc-sous-champ">
        <small id="scan-aide" class="form-text text-muted">Un code de pièce (ou un code du fabricant) affiche sa fiche ; un code d'emplacement (EMP-…) affiche tout son contenu.</small>
        <span id="sc-attente" class="sc-attente text-muted" aria-live="polite"></span>
      </div>

      <div class="row sc-outils">
        <div class="col-lg-5 col-md-6 form-group">
          <label for="recherche" id="lib-recherche">Chercher une pièce par son nom ou son code</label>
          <select id="recherche" class="form-control"><option></option></select>
        </div>
        <div class="col-lg-4 col-md-6 form-group">
          <label for="emp-choix">Voir le contenu d'un emplacement</label>
          <select id="emp-choix" class="form-control" disabled><option value="">Chargement…</option></select>
        </div>
        <div class="col-lg-3 col-md-12 form-group sc-boutons">
          <button type="button" id="btn-camera" class="btn btn-outline-primary" aria-expanded="false" aria-controls="cam-zone"><i class="fas fa-camera mr-1" aria-hidden="true"></i> Utiliser la caméra</button>
          <button type="button" id="btn-clavier" class="btn btn-outline-secondary" aria-pressed="false" title="Afficher le clavier de la tablette pour taper un code"><i class="fas fa-keyboard mr-1" aria-hidden="true"></i> Clavier à l'écran</button>
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
            Scannez une pièce pour voir où elle se trouve, ou un emplacement (cube, entrepôt, boutique) pour voir tout ce qu'il contient.
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
