<?php
// Valeur de l'inventaire au coût moyen (gestionnaire+) : par entreprise et par emplacement, total général, détail pièce par pièce
// d'un emplacement au clic, export CSV. Respecte le filtre d'entreprise de la barre du haut.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/interentreprise.js');
$css = '<link rel="stylesheet" href="assets/css/interentreprise.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css') . '">';

$erreur = null;
$v = null;
try {
	$v = Interentreprise::valeurComplete(entreprises_filtre());
} catch (InventaireException $ex) {
	$erreur = $ex->getMessage();
}
if ($erreur !== null) { ?>
<?php echo $css; ?>
<div class="content-wrapper" data-ie="valeur_inventaire"><?php page_titre('Valeur de l\'inventaire', array('Rapports')); ?>
  <section class="content"><div class="container-fluid"><div class="alert alert-warning" role="alert"><?php echo e($erreur); ?></div></div></section>
</div>
<?php return; }

$par_ent = array();
foreach ($v['emplacements'] as $e) { $par_ent[(int) $e['entreprise_id']][] = $e; }
$nom_filtre = '';
foreach ($v['entreprises'] as $en) { $nom_filtre .= ($nom_filtre === '' ? '' : ', ') . $en['nom']; }
$ouvrir = (isset($_GET['emplacement_id']) && is_string($_GET['emplacement_id']) && ctype_digit($_GET['emplacement_id']) && strlen($_GET['emplacement_id']) < 10) ? (int) $_GET['emplacement_id'] : 0;
?>
<?php echo $css; ?>
<div class="content-wrapper" data-ie="valeur_inventaire" data-ouvrir="<?php echo (int) $ouvrir; ?>">
  <?php page_titre('Valeur de l\'inventaire', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">

    <?php if (!$v['entreprises']) { ?>
      <div class="alert alert-info" role="status">Aucune entreprise à afficher.</div>
    <?php } else { ?>

    <div class="d-none d-print-block ie-impression-entete">Beauchemin — Gestion d'inventaire · valeur de l'inventaire au coût moyen au <?php echo e(date('Y-m-d H:i')); ?> · <?php echo e($nom_filtre); ?></div>
    <div class="ie-valeur-entete no-print">
      <p class="text-muted mb-2">Quantité en stock × coût moyen pondéré de l'entreprise propriétaire, à l'instant présent (<?php echo e(date('Y-m-d H:i')); ?>). Entreprise(s) affichée(s) : <strong><?php echo e($nom_filtre); ?></strong> — changez-la dans la barre du haut.</p>
      <div class="mb-3">
        <a class="btn btn-outline-secondary" id="btn-csv" href="app/ajax/valeur_export.php"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter par emplacement (CSV)</a>
        <a class="btn btn-outline-secondary" id="btn-csv-pieces" href="app/ajax/valeur_export.php?mode=pieces"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter le détail par pièce (CSV)</a>
        <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      </div>
    </div>

    <div class="row">
      <?php foreach ($v['entreprises'] as $en) { $n_sans = isset($v['sans_cout'][(int) $en['id']]) ? $v['sans_cout'][(int) $en['id']] : 0; ?>
      <div class="col-md-6 col-xl-4">
        <div class="card ie-carte ie-carte-valeur" data-entreprise="<?php echo (int) $en['id']; ?>">
          <div class="card-body">
            <div class="ie-valeur-nom"><?php echo e($en['nom']); ?></div>
            <div class="ie-valeur-montant"><?php echo e(Interentreprise::argent($en['valeur'])); ?></div>
            <?php if ($n_sans > 0) { ?><div class="small text-warning-dark ie-sans-cout"><i class="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i> <?php echo (int) $n_sans; ?> pièce<?php echo $n_sans > 1 ? 's' : ''; ?> en stock sans coût connu (comptée<?php echo $n_sans > 1 ? 's' : ''; ?> à 0 $)</div><?php } ?>
          </div>
        </div>
      </div>
      <?php } ?>
      <div class="col-md-6 col-xl-4">
        <div class="card ie-carte ie-carte-valeur ie-carte-total">
          <div class="card-body">
            <div class="ie-valeur-nom">Total général</div>
            <div class="ie-valeur-montant" id="valeur-total-general"><?php echo e(Interentreprise::argent($v['total'])); ?></div>
          </div>
        </div>
      </div>
    </div>

    <?php foreach ($v['entreprises'] as $en) { $lignes = isset($par_ent[(int) $en['id']]) ? $par_ent[(int) $en['id']] : array(); ?>
    <div class="card ie-carte">
      <div class="card-header"><h3 class="card-title"><?php echo e($en['nom']); ?> — par emplacement</h3><div class="card-tools ie-total-sens">Total : <strong><?php echo e(Interentreprise::argent($en['valeur'])); ?></strong></div></div>
      <div class="card-body p-0">
        <?php if (!$lignes) { ?><p class="text-muted p-3 mb-0">Aucun emplacement avec du stock.</p><?php } else { ?>
        <div class="table-responsive">
          <table class="table table-hover ie-table ie-table-emplacements mb-0">
            <thead><tr><th scope="col">Emplacement</th><th scope="col">Type</th><th scope="col" class="nombre">Pièces en stock</th><th scope="col" class="nombre">Valeur</th><th scope="col" class="no-print"><span class="sr-only">Détail</span></th></tr></thead>
            <tbody>
            <?php foreach ($lignes as $e) { ?>
              <tr class="ie-ligne-emplacement" data-id="<?php echo (int) $e['id']; ?>">
                <td><?php echo e($e['nom']); ?><?php echo $e['actif'] ? '' : ' <span class="badge badge-secondary">Désactivé</span>'; ?></td>
                <td><?php echo e(TYPES_EMPLACEMENT_FR[$e['type']]); ?></td>
                <td class="nombre"><?php echo (int) $e['nb_pieces']; ?></td>
                <td class="nombre"><?php echo e(Interentreprise::argent($e['valeur'])); ?></td>
                <td class="text-right no-print"><button type="button" class="btn btn-sm btn-outline-primary ie-voir-detail" data-id="<?php echo (int) $e['id']; ?>" aria-label="Voir le détail de <?php echo e($e['nom']); ?>">Voir le détail <i class="fas fa-chevron-down ml-1" aria-hidden="true"></i></button></td>
              </tr>
            <?php } ?>
            </tbody>
          </table>
        </div>
        <?php } ?>
      </div>
    </div>
    <?php } ?>

    <div class="card ie-carte" id="detail-carte" hidden>
      <div class="card-header">
        <h3 class="card-title" id="detail-titre">Détail</h3>
        <div class="card-tools no-print">
          <a class="btn btn-sm btn-outline-secondary" id="detail-csv" href="#"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter ce détail (CSV)</a>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="detail-fermer" aria-label="Fermer le détail"><i class="fas fa-times" aria-hidden="true"></i> Fermer</button>
        </div>
      </div>
      <div class="card-body">
        <div id="detail-etat" class="text-muted">Chargement…</div>
        <div id="detail-contenu" hidden>
          <div class="ie-detail-total mb-2">Valeur de l'emplacement : <strong id="detail-total"></strong> <span class="text-muted" id="detail-nb"></span></div>
          <div class="table-responsive">
            <table id="table-detail" class="table table-sm table-striped ie-table w-100">
              <thead><tr>
                <th scope="col">Code</th><th scope="col">Pièce</th><th scope="col">Catégorie</th>
                <th scope="col" class="nombre">Quantité</th><th scope="col" class="nombre">Coût moyen</th><th scope="col" class="nombre">Valeur</th>
              </tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <p class="text-muted small mb-0">Chaque ligne est arrondie au cent ; le total de l'emplacement est arrondi une seule fois : un écart de quelques cents est possible.</p>
        </div>
      </div>
    </div>

    <?php } ?>
  </div></section>
</div>
