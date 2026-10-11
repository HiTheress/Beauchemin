<?php
// À recommander : les pièces sous le minimum, en liste simple. Employé+ ; « Voir la pièce » sur chaque ligne, « Recevoir » en plus pour un gestionnaire+. Aucun coût.
if (!acces_page('employe')) { return; }
page_script('assets/js/stock.js');
$gest = $Ouser->aRole('gestionnaire');
$multi = count(inventaire()->listeEntreprises(utilisateur_id())) > 1;
?>
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" data-d2="sous_minimum" data-gest="<?php echo $gest ? '1' : '0'; ?>" data-multi="<?php echo $multi ? '1' : '0'; ?>" data-entreprise="<?php echo (int) entreprise_courante(); ?>">
  <?php page_titre('À recommander'); ?>
  <section class="content"><div class="container-fluid">
    <div class="card sk-carte"><div class="card-body">
      <div class="d-flex flex-wrap align-items-center justify-content-between mb-3">
        <p class="mb-2 mb-md-0 text-muted font-weight-bold" id="sm-portee" role="status">&nbsp;</p>
        <div class="no-print">
          <button type="button" id="sm-actualiser" class="btn btn-sm btn-outline-secondary mr-2" title="Actualiser" aria-label="Actualiser"><i class="fas fa-sync-alt" aria-hidden="true"></i></button>
          <a id="sm-export" class="btn btn-sm btn-outline-secondary" href="app/ajax/sous_minimum_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        </div>
      </div>

      <div id="sm-erreur" class="alert alert-danger" role="alert" hidden></div>

      <div id="sm-vide" class="sk-vide" hidden>
        <i class="fas fa-check-circle sk-vide-icone" aria-hidden="true"></i>
        <p class="sk-vide-titre mb-0">Rien à recommander.</p>
      </div>

      <div id="sm-tableau" class="table-responsive" hidden>
        <table id="table-sous-minimum" class="table table-striped table-hover sk-table w-100">
          <caption class="sr-only">Pièces à recommander</caption>
          <thead><tr>
            <th scope="col">Pièce</th>
            <?php if ($multi) { ?><th scope="col" class="sk-xs-cache">Entreprise</th><?php } ?>
            <th scope="col" class="nombre sk-xs-cache">Quantité</th>
            <th scope="col" class="nombre sk-xs-cache">Minimum</th>
            <th scope="col" class="nombre">Manque</th>
            <th scope="col" class="no-print"><span class="sr-only">Action</span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div></div>
  </div></section>
</div>
