<?php
// Tableau de bord : l'état de l'inventaire en un coup d'œil, pour l'entreprise choisie dans la barre du haut.
// Employé+. Un employé ne voit aucun montant : la valeur d'inventaire et les factures internes sont réservées aux gestionnaires+.
// Les chiffres sont chargés par assets/js/dashboard.js depuis app/ajax/dashboard_data.php (rafraîchis toutes les deux minutes).
if (!acces_page('employe')) { return; }
page_script('assets/js/dashboard.js');
$gest = $Ouser->aRole('gestionnaire');
$aujourdhui = date('Y-m-d');
?>
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" id="ds-racine" data-gest="<?php echo $gest ? '1' : '0'; ?>">
  <?php page_titre('Tableau de bord'); ?>
  <section class="content"><div class="container-fluid">

    <div class="d-flex flex-wrap align-items-center justify-content-between mb-3">
      <p class="mb-2 mb-md-0" id="ds-portee" role="status">Chargement…</p>
      <button type="button" id="ds-actualiser" class="btn btn-outline-secondary no-print"><i class="fas fa-sync-alt mr-1" aria-hidden="true"></i> Actualiser</button>
    </div>
    <div id="ds-erreur" class="alert alert-danger" role="alert" hidden></div>
    <noscript><div class="alert alert-warning">JavaScript doit être activé pour afficher le tableau de bord.</div></noscript>

    <!-- Raccourcis -->
    <div class="ds-raccourcis no-print mb-3">
      <a class="btn btn-primary btn-lg" href="index.php?page=scanner"><i class="fas fa-barcode mr-2" aria-hidden="true"></i> Scanner</a>
      <a class="btn btn-primary btn-lg" href="index.php?page=transfert"><i class="fas fa-exchange-alt mr-2" aria-hidden="true"></i> Transfert</a>
      <a class="btn btn-primary btn-lg" href="index.php?page=sortie"><i class="fas fa-sign-out-alt mr-2" aria-hidden="true"></i> Sortie</a>
      <?php if ($gest) { ?>
      <a class="btn btn-outline-primary btn-lg" href="index.php?page=reception"><i class="fas fa-truck-loading mr-2" aria-hidden="true"></i> Réception</a>
      <a class="btn btn-outline-primary btn-lg" href="index.php?page=facture_interne"><i class="fas fa-file-invoice-dollar mr-2" aria-hidden="true"></i> Facture interne</a>
      <?php } ?>
    </div>

    <!-- Cartes -->
    <div class="row">
      <div class="col-lg-<?php echo $gest ? '3' : '4'; ?> col-md-6">
        <div class="card ds-carte" aria-labelledby="ds-t-pieces">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-pieces">Pièces actives</h2>
            <p class="ds-nombre" id="ds-pieces">…</p>
            <p class="ds-detail" id="ds-pieces-detail">&nbsp;</p>
            <a class="ds-lien no-print" href="index.php?page=stock">Voir le stock</a>
          </div>
        </div>
      </div>
      <div class="col-lg-<?php echo $gest ? '3' : '4'; ?> col-md-6">
        <div class="card ds-carte" id="ds-carte-sous" aria-labelledby="ds-t-sous">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-sous">Sous le minimum</h2>
            <p class="ds-nombre" id="ds-sous">…</p>
            <p class="ds-detail" id="ds-sous-detail">&nbsp;</p>
            <a class="ds-lien no-print" href="index.php?page=sous_minimum">Voir la liste</a>
          </div>
        </div>
      </div>
      <div class="col-lg-<?php echo $gest ? '3' : '4'; ?> col-md-6">
        <div class="card ds-carte" aria-labelledby="ds-t-jour">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-jour">Mouvements du jour</h2>
            <p class="ds-nombre" id="ds-jour">…</p>
            <p class="ds-detail" id="ds-jour-detail">&nbsp;</p>
            <a class="ds-lien no-print" id="ds-jour-lien" href="index.php?page=historique&amp;du=<?php echo e($aujourdhui); ?>&amp;au=<?php echo e($aujourdhui); ?>">Voir l'historique</a>
          </div>
        </div>
      </div>
      <?php if ($gest) { ?>
      <div class="col-lg-3 col-md-6">
        <div class="card ds-carte" aria-labelledby="ds-t-valeur">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-valeur">Valeur de l'inventaire</h2>
            <div id="ds-valeur" class="ds-lignes">…</div>
            <a class="ds-lien no-print" href="index.php?page=valeur_inventaire">Voir le détail</a>
          </div>
        </div>
      </div>
      <?php } ?>
    </div>

    <?php if ($gest) { ?>
    <div class="card ds-carte" aria-labelledby="ds-t-factures">
      <div class="card-body">
        <h2 class="ds-titre" id="ds-t-factures">Factures internes du mois <span class="font-weight-normal text-muted" id="ds-mois"></span></h2>
        <div id="ds-factures" class="ds-lignes">…</div>
        <a class="ds-lien no-print" href="index.php?page=factures_internes">Voir les factures</a>
        <span class="ds-lien-sep no-print" aria-hidden="true">·</span>
        <a class="ds-lien no-print" href="index.php?page=bilan_mensuel">Bilan mensuel</a>
      </div>
    </div>
    <?php } ?>

    <div class="row">
      <div class="col-lg-7">
        <div class="card ds-carte" aria-labelledby="ds-t-docs">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-docs">Derniers documents</h2>
            <p class="text-muted mb-0" id="ds-docs-vide" hidden>Aucun document pour le moment.</p>
            <div class="table-responsive" id="ds-docs-zone" hidden>
              <table class="table table-sm table-striped mb-0">
                <caption class="sr-only">Les dix derniers documents</caption>
                <thead><tr>
                  <th scope="col">Numéro</th><th scope="col">Type</th><th scope="col">Date</th><th scope="col">Emplacement</th>
                  <?php if ($gest) { ?><th scope="col" class="nombre">Total</th><?php } ?>
                  <th scope="col">Statut</th>
                </tr></thead>
                <tbody id="ds-docs"></tbody>
              </table>
            </div>
            <a class="ds-lien no-print" href="index.php?page=documents">Tous les documents</a>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card ds-carte" aria-labelledby="ds-t-bas">
          <div class="card-body">
            <h2 class="ds-titre" id="ds-t-bas">Pièces les plus sous le minimum</h2>
            <p class="text-muted mb-0" id="ds-bas-vide" hidden>Aucune pièce sous le minimum.</p>
            <div class="table-responsive" id="ds-bas-zone" hidden>
              <table class="table table-sm table-striped mb-0">
                <caption class="sr-only">Les cinq pièces les plus manquantes</caption>
                <thead><tr>
                  <th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th><th scope="col" class="nombre">Minimum</th><th scope="col" class="nombre">Manque</th>
                </tr></thead>
                <tbody id="ds-bas"></tbody>
              </table>
            </div>
            <a class="ds-lien no-print" href="index.php?page=sous_minimum">Voir toutes les pièces sous le minimum</a>
          </div>
        </div>
      </div>
    </div>

  </div></section>
</div>
