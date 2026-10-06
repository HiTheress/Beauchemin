<?php
// Pièces sous le minimum : ce qu'il faut recommander. Employé+ ; lien « Réceptionner » pour un gestionnaire+. Aucun coût.
if (!acces_page('employe')) { return; }
page_script('assets/js/stock.js');
$gest = $Ouser->aRole('gestionnaire');
?>
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" data-d2="sous_minimum" data-gest="<?php echo $gest ? '1' : '0'; ?>" data-entreprise="<?php echo (int) entreprise_courante(); ?>">
  <?php page_titre('Pièces sous le minimum', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card sk-carte"><div class="card-body">
      <div class="d-flex flex-wrap align-items-center justify-content-between mb-3">
        <p class="mb-2 mb-md-0" id="sm-portee" role="status">Chargement…</p>
        <div class="no-print">
          <button type="button" id="sm-actualiser" class="btn btn-outline-secondary mr-2"><i class="fas fa-sync-alt mr-1" aria-hidden="true"></i> Actualiser</button>
          <a id="sm-export" class="btn btn-outline-secondary" href="app/ajax/sous_minimum_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        </div>
      </div>

      <div id="sm-erreur" class="alert alert-danger" role="alert" hidden></div>

      <div id="sm-vide" class="sk-vide" hidden>
        <i class="fas fa-check-circle sk-vide-icone" aria-hidden="true"></i>
        <p class="sk-vide-titre mb-1">Aucune pièce sous le minimum.</p>
        <p class="text-muted mb-0">Toutes les pièces qui ont un minimum fixé en ont assez en stock.</p>
      </div>

      <div id="sm-tableau" class="table-responsive" hidden>
        <table id="table-sous-minimum" class="table table-striped table-hover sk-table w-100">
          <caption class="sr-only">Pièces dont la quantité est sous le minimum fixé</caption>
          <thead><tr>
            <th scope="col">Code</th>
            <th scope="col">Pièce</th>
            <th scope="col">Entreprise</th>
            <th scope="col" class="nombre">Quantité</th>
            <th scope="col" class="nombre">Minimum</th>
            <th scope="col" class="nombre">Manque</th>
            <?php if ($gest) { ?><th scope="col" class="no-print"><span class="sr-only">Action</span></th><?php } ?>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">La quantité est le total de l'entreprise (tous ses emplacements). Le manque (avec son unité) est ce qu'il reste à acheter pour atteindre le minimum.<?php if ($gest) { ?> « Réceptionner » ouvre une réception avec la pièce déjà ajoutée.<?php } ?></p>
    </div></div>
  </div></section>
</div>
