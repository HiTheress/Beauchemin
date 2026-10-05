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
<div class="content-wrapper" data-ie="valeur_inventaire" data-titre="Valeur de l'inventaire — Beauchemin"><?php page_titre('Valeur de l\'inventaire', array('Rapports')); ?>
  <section class="content"><div class="container-fluid"><div class="alert alert-warning" role="alert"><?php echo e($erreur); ?></div></div></section>
</div>
<?php return; }

$par_ent = array();
foreach ($v['emplacements'] as $e) { $par_ent[(int) $e['entreprise_id']][] = $e; }
$nom_filtre = '';
foreach ($v['entreprises'] as $en) { $nom_filtre .= ($nom_filtre === '' ? '' : ', ') . $en['nom']; }
$plusieurs = count($Ouser->entreprisesAutorisees()) > 1;     // l'utilisateur peut changer d'entreprise dans la barre du haut
$ouvrir = (isset($_GET['emplacement_id']) && is_string($_GET['emplacement_id']) && ctype_digit($_GET['emplacement_id']) && strlen($_GET['emplacement_id']) < 10) ? (int) $_GET['emplacement_id'] : 0;
?>
<?php echo $css; ?>
<div class="content-wrapper" data-ie="valeur_inventaire" data-titre="Valeur de l'inventaire — <?php echo e($nom_filtre !== '' ? $nom_filtre : 'Beauchemin'); ?>" data-ouvrir="<?php echo (int) $ouvrir; ?>">
  <?php page_titre('Valeur de l\'inventaire', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">

    <?php if (!$v['entreprises']) { ?>
      <div class="alert alert-info" role="status">Aucune entreprise à afficher.</div>
    <?php } else { ?>

    <div class="d-none d-print-block ie-impression-entete">Beauchemin — Gestion d'inventaire · valeur de l'inventaire au coût moyen au <?php echo e(date('Y-m-d H:i')); ?> · <?php echo e($nom_filtre); ?></div>
    <div class="ie-valeur-entete no-print">
      <p class="text-muted mb-2">Quantité en stock × coût moyen pondéré de l'entreprise propriétaire, à l'instant présent (<?php echo e(date('Y-m-d H:i')); ?>). <?php echo count($v['entreprises']) > 1 ? 'Entreprises affichées' : 'Entreprise affichée'; ?> : <strong><?php echo e($nom_filtre); ?></strong>.<?php echo $plusieurs ? ' Pour en changer, utilisez la liste en haut de l\'écran.' : ''; ?></p>
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
            <?php if ($n_sans > 0) { $liste_sans = isset($v['sans_cout_liste'][(int) $en['id']]) ? $v['sans_cout_liste'][(int) $en['id']] : array(); ?>
            <details class="small text-warning-dark ie-sans-cout">
              <summary class="ie-sans-cout-titre"><i class="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i> <?php echo (int) $n_sans; ?> pièce<?php echo $n_sans > 1 ? 's' : ''; ?> en stock sans coût connu (comptée<?php echo $n_sans > 1 ? 's' : ''; ?> à 0&nbsp;$)</summary>
              <ul class="ie-sans-cout-liste">
                <?php foreach ($liste_sans as $p) { ?><li><a class="ie-lien-tactile" href="index.php?page=piece_voir&amp;id=<?php echo (int) $p['piece_id']; ?>"><span class="code"><?php echo e($p['code']); ?></span> — <?php echo e($p['nom']); ?></a></li><?php } ?>
              </ul>
            </details>
            <?php } ?>
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
            <caption class="sr-only">Valeur du stock de <?php echo e($en['nom']); ?> par emplacement</caption>
            <thead><tr><th scope="col">Emplacement</th><th scope="col">Type</th><th scope="col" class="nombre">Pièces en stock</th><th scope="col" class="nombre">Valeur</th><th scope="col" class="no-print"><span class="sr-only">Détail</span></th></tr></thead>
            <tbody>
            <?php foreach ($lignes as $e) { ?>
              <tr class="ie-ligne-emplacement" data-id="<?php echo (int) $e['id']; ?>">
                <td><?php echo e($e['nom']); ?><?php echo $e['actif'] ? '' : ' <span class="badge badge-secondary">Désactivé</span>'; ?></td>
                <td><?php echo e(TYPES_EMPLACEMENT_FR[$e['type']]); ?></td>
                <td class="nombre"><?php echo (int) $e['nb_pieces']; ?></td>
                <td class="nombre"><?php echo e(Interentreprise::argent($e['valeur'])); ?></td>
                <td class="text-right no-print"><button type="button" class="btn btn-sm btn-outline-primary ie-voir-detail" data-id="<?php echo (int) $e['id']; ?>" aria-label="Voir le détail de l'emplacement «&nbsp;<?php echo e($e['nom']); ?>&nbsp;» (<?php echo e($en['nom']); ?>)">Voir le détail <i class="fas fa-chevron-down ml-1" aria-hidden="true"></i></button></td>
              </tr>
            <?php } ?>
            </tbody>
            <?php $arrondi = isset($v['arrondi'][(int) $en['id']]) ? $v['arrondi'][(int) $en['id']] : '0.00'; if (Dec::parse($arrondi, Dec::TOTAL) !== 0) { ?>
            <tfoot>
              <tr class="ie-ligne-arrondi"><th scope="row" colspan="3">Écart d'arrondi <span class="text-muted font-weight-normal">(chaque emplacement est arrondi au cent ; le total de l'entreprise l'est une seule fois)</span></th><td class="nombre"><?php echo e(Interentreprise::argent($arrondi)); ?></td><td class="no-print"></td></tr>
              <tr class="ie-ligne-total"><th scope="row" colspan="3">Total de <?php echo e($en['nom']); ?></th><td class="nombre"><?php echo e(Interentreprise::argent($en['valeur'])); ?></td><td class="no-print"></td></tr>
            </tfoot>
            <?php } ?>
          </table>
        </div>
        <?php } ?>
      </div>
    </div>
    <?php } ?>

    <div class="card ie-carte" id="detail-carte" hidden>
      <div class="card-header">
        <h3 class="card-title" id="detail-titre" tabindex="-1">Détail</h3>
        <div class="card-tools no-print">
          <a class="btn btn-sm btn-outline-secondary" id="detail-csv" href="#"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter ce détail (CSV)</a>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="detail-fermer" aria-label="Fermer le détail"><i class="fas fa-times" aria-hidden="true"></i> Fermer</button>
        </div>
      </div>
      <div class="card-body">
        <div id="detail-etat" class="text-muted" role="status" aria-live="polite">Chargement…</div>
        <div id="detail-contenu" hidden>
          <div class="ie-detail-total mb-2">Valeur de l'emplacement : <strong id="detail-total"></strong> <span class="text-muted" id="detail-nb"></span></div>
          <div class="table-responsive">
            <table id="table-detail" class="table table-sm table-striped ie-table w-100">
              <caption class="sr-only">Pièces en stock de l'emplacement choisi, avec leur coût moyen et leur valeur</caption>
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
