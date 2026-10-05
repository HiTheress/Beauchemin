<?php
// Détail d'un document : en-tête, lignes, mouvements créés, annulation (gestionnaire+), impression.
// Employé+ : un employé ne voit aucun coût ni total. Une facture interne (gestionnaire+) est affichée par le module C.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
page_script('assets/js/mouvements.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$gest = $Ouser->aRole('gestionnaire');
$couts = $Ouser->peutVoirCouts();
$acc = array_map('intval', $Ouser->entreprisesAutorisees());

$r = null;
try { $r = inventaire()->document(utilisateur_id(), $id); } catch (InventaireException $ex) { $r = null; $erreur_doc = $ex->getMessage(); }
if (!$r) { ?>
<div class="content-wrapper"><?php page_titre('Document introuvable', array('Rapports', 'Documents')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning" role="alert"><?php echo e(isset($erreur_doc) ? $erreur_doc : 'Ce document n\'existe pas.'); ?> <a class="alert-link" href="index.php?page=documents">Retour à la liste des documents</a></div>
  </div></section>
</div>
<?php return; }

$d = $r['doc'];
$lignes = $r['lignes'];

// Facture interne : l'écran du module C (réservé aux gestionnaires) ; un employé voit ici le détail sans montants
if ($d['type'] === 'facture_interne' && $gest) {
	while (ob_get_level() > 0) { ob_end_clean(); }
	redirect('index.php?page=facture_interne_voir&id=' . (int) $d['id']);
}

$annule = ($d['statut'] === 'annule');
$type = $d['type'];
$peut_annuler = $gest && !$annule && $type !== 'ajustement';
$visible = function ($entreprise_id) use ($acc) { return in_array((int) $entreprise_id, $acc, true); };
$ent_dest_id = $d['entreprise_dest_id'] ? (int) $d['entreprise_dest_id'] : (int) $d['entreprise_id'];
$nom_src = $visible($d['entreprise_id']) ? $d['emplacement'] : null;
$nom_dest = ($d['emplacement_dest'] !== null && $visible($ent_dest_id)) ? $d['emplacement_dest'] : null;
$moment = function ($s) { return $s ? substr((string) $s, 0, 16) : ''; };
$cout4 = function ($s) { $x = fmt_nombre($s, 4); $x = preg_replace('/(,\d\d\d)0$/', '$1', $x); $x = preg_replace('/(,\d\d)0$/', '$1', $x); return $x . "\xc2\xa0$"; };   // 2 à 4 décimales
$qte = function ($s, $signe) { $v = fmt_nombre($s); return ($signe && $s !== '' && $s[0] !== '-' ? '+' : '') . $v; };

$etiquette_ref = ($type === 'reception') ? 'N° de facture du fournisseur' : (($type === 'sortie') ? 'N° de bon de travail' : 'Référence');
$consequence = array(
	'reception' => 'Les pièces reçues seront retirées de l\'emplacement et le coût moyen sera recalculé.',
	'transfert' => 'Les pièces retourneront à l\'emplacement source.',
	'sortie' => 'Les pièces seront remises dans l\'emplacement.',
	'facture_interne' => 'Les pièces retourneront chez l\'entreprise émettrice.',
);

// Mouvements de ce document, dans les entreprises de l'utilisateur seulement
$mouvements = array();
$nb_mouv_total = 0;
if ($acc) {
	$in = implode(',', $acc);     // entiers issus des droits de l'utilisateur
	$cols = 'm.id, m.date_mouvement, m.quantite, m.est_annulation, p.code, p.nom, p.unite, e.nom AS emplacement, en.nom AS entreprise' . ($couts ? ', m.cout_unitaire' : '');
	$st = $pdo->prepare(
		"SELECT $cols FROM mouvements m JOIN pieces p ON p.id = m.piece_id JOIN emplacements e ON e.id = m.emplacement_id JOIN entreprises en ON en.id = e.entreprise_id
		  WHERE m.document_id = ? AND e.entreprise_id IN ($in) ORDER BY m.id"
	);
	$st->execute(array((int) $d['id']));
	$mouvements = $st->fetchAll();
}
$st = $pdo->prepare('SELECT COUNT(*) FROM mouvements WHERE document_id = ?');
$st->execute(array((int) $d['id']));
$nb_mouv_total = (int) $st->fetchColumn();
$nb_masques = $nb_mouv_total - count($mouvements);
$flash = (isset($_GET['ok']) && $_GET['ok'] === 'annule' && $annule);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<div class="content-wrapper" data-mouvement="document_voir" data-document-id="<?php echo (int) $d['id']; ?>" data-numero="<?php echo e($d['numero']); ?>">
  <?php page_titre($d['numero'], array('Rapports', 'Documents')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($flash) { ?><div class="alert alert-success" role="status">Le document a été annulé : les écritures inverses ont été passées dans le stock.</div><?php } ?>

    <?php if ($annule) { ?>
    <div class="alert mv-bandeau-annule" role="status" id="bandeau-annule">
      <span class="badge badge-danger mv-badge-annule">ANNULÉ</span>
      <span class="ml-2">
        Annulé<?php echo $d['annule_par_nom'] ? ' par <strong>' . e($d['annule_par_nom']) . '</strong>' : ''; ?><?php echo $d['annule_le'] ? ' le ' . e($moment($d['annule_le'])) : ''; ?>.
        <?php if ($d['motif_annulation'] !== null && $d['motif_annulation'] !== '') { ?>Motif : « <?php echo e($d['motif_annulation']); ?> ».<?php } ?>
      </span>
    </div>
    <?php } ?>

    <div class="mb-3 no-print mv-barre">
      <a class="btn btn-outline-secondary" href="index.php?page=documents"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i> Liste des documents</a>
      <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      <?php if ($peut_annuler) { ?>
        <button type="button" class="btn mv-btn-danger" id="btn-annuler"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Annuler ce document</button>
      <?php } elseif ($gest && $type === 'ajustement' && !$annule) { ?>
        <span class="text-muted small ml-2">Un ajustement ne s'annule pas : corrigez-le avec un nouvel ajustement.</span>
      <?php } ?>
    </div>

    <div class="card mv-carte mv-document<?php echo $annule ? ' mv-annule' : ''; ?>"><div class="card-body">
      <div class="d-none d-print-block mv-impression-entete">Beauchemin — Gestion d'inventaire · imprimé le <?php echo e(date('Y-m-d H:i')); ?></div>
      <div class="d-flex flex-wrap align-items-center mb-3">
        <h2 class="h4 mb-0 mr-3"><span class="code"><?php echo e($d['numero']); ?></span></h2>
        <span class="badge badge-info mr-2"><?php echo e(TYPES_DOCUMENT_FR[$type]); ?></span>
        <?php if ($annule) { ?><span class="badge badge-danger">ANNULÉ</span><?php } else { ?><span class="badge badge-success">Valide</span><?php } ?>
      </div>

      <dl class="row mv-entete mb-0">
        <dt class="col-sm-3">Date du document</dt><dd class="col-sm-9"><?php echo e(fmt_date($d['date_document'])); ?></dd>
        <dt class="col-sm-3">Entreprise</dt>
        <dd class="col-sm-9"><?php echo e($d['entreprise']); ?><?php echo $d['entreprise_dest'] ? ' <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> ' . e($d['entreprise_dest']) : ''; ?></dd>
        <?php if ($type === 'transfert' || $type === 'facture_interne') { ?>
          <dt class="col-sm-3">De</dt><dd class="col-sm-9"><?php echo $nom_src !== null ? e($nom_src) : '<span class="text-muted">Autre entreprise</span>'; ?></dd>
          <dt class="col-sm-3">Vers</dt><dd class="col-sm-9"><?php echo $nom_dest !== null ? e($nom_dest) : '<span class="text-muted">Autre entreprise</span>'; ?></dd>
        <?php } else { ?>
          <dt class="col-sm-3"><?php echo $type === 'reception' ? 'Reçu à' : ($type === 'sortie' ? 'Sorti de' : 'Emplacement'); ?></dt>
          <dd class="col-sm-9"><?php echo $nom_src !== null ? e($nom_src) : '<span class="text-muted">Autre entreprise</span>'; ?></dd>
        <?php } ?>
        <?php if ($d['fournisseur']) { ?><dt class="col-sm-3">Fournisseur</dt><dd class="col-sm-9"><?php echo e($d['fournisseur']); ?></dd><?php } ?>
        <?php if ($d['reference'] !== null && $d['reference'] !== '') { ?><dt class="col-sm-3"><?php echo e($etiquette_ref); ?></dt><dd class="col-sm-9"><?php echo e($d['reference']); ?></dd><?php } ?>
        <?php if ($d['motif'] !== null && $d['motif'] !== '') { ?><dt class="col-sm-3">Motif</dt><dd class="col-sm-9"><?php echo e(Mouvements::libelleMotif($type, $d['motif'])); ?></dd><?php } ?>
        <?php if ($d['note'] !== null && $d['note'] !== '') { ?><dt class="col-sm-3">Note</dt><dd class="col-sm-9 mv-note"><?php echo e($d['note']); ?></dd><?php } ?>
        <dt class="col-sm-3">Saisi par</dt><dd class="col-sm-9"><?php echo e($d['utilisateur'] !== null ? $d['utilisateur'] : '—'); ?> <span class="text-muted">· <?php echo e($moment($d['cree_le'])); ?></span></dd>
      </dl>
    </div></div>

    <div class="card mv-carte"><div class="card-header"><h3 class="card-title">Pièces</h3></div><div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-sm table-striped mb-0 mv-table" id="table-lignes">
          <thead><tr>
            <th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th>
            <?php if ($couts) { ?><th scope="col" class="nombre">Coût unitaire</th><th scope="col" class="nombre">Total</th><?php } ?>
          </tr></thead>
          <tbody>
          <?php foreach ($lignes as $l) { ?>
            <tr>
              <td class="code"><a href="index.php?page=piece_voir&amp;id=<?php echo (int) $l['piece_id']; ?>"><?php echo e($l['code']); ?></a></td>
              <td><?php echo e($l['nom']); ?></td>
              <td class="nombre"><?php echo e($qte($l['quantite'], $type === 'ajustement')); ?><?php echo ($l['unite'] && $l['unite'] !== 'unité') ? ' <small class="text-muted">' . e($l['unite']) . '</small>' : ''; ?></td>
              <?php if ($couts) { ?>
                <td class="nombre"><?php echo e($cout4($l['cout_unitaire'])); ?></td>
                <td class="nombre"><?php echo e(fmt_argent($l['total_ligne'])); ?></td>
              <?php } ?>
            </tr>
          <?php } ?>
          </tbody>
          <?php if ($couts) { ?>
          <tfoot><tr class="mv-total-ligne"><th colspan="4" class="text-right">Total</th><th class="nombre" id="total-document"><?php echo e(fmt_argent($d['total'])); ?></th></tr></tfoot>
          <?php } ?>
        </table>
      </div>
    </div></div>

    <div class="card mv-carte"><div class="card-header"><h3 class="card-title">Mouvements créés</h3></div><div class="card-body p-0">
      <?php if (!$mouvements) { ?>
        <p class="text-muted p-3 mb-0">Aucun mouvement visible pour ce document.</p>
      <?php } else { ?>
      <div class="table-responsive">
        <table class="table table-sm mb-0 mv-table" id="table-mouvements">
          <thead><tr>
            <th scope="col">Date et heure</th><th scope="col">Emplacement</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th>
            <?php if ($couts) { ?><th scope="col" class="nombre">Coût unitaire</th><?php } ?>
            <th scope="col">Nature</th>
          </tr></thead>
          <tbody>
          <?php foreach ($mouvements as $m) { ?>
            <tr<?php echo $m['est_annulation'] ? ' class="mv-mouv-annulation"' : ''; ?>>
              <td><?php echo e($moment($m['date_mouvement'])); ?></td>
              <td><?php echo e($m['emplacement']); ?> <small class="text-muted">(<?php echo e($m['entreprise']); ?>)</small></td>
              <td><span class="code"><?php echo e($m['code']); ?></span> — <?php echo e($m['nom']); ?></td>
              <td class="nombre"><?php echo e($qte($m['quantite'], true)); ?></td>
              <?php if ($couts) { ?><td class="nombre"><?php echo e($cout4($m['cout_unitaire'])); ?></td><?php } ?>
              <td><?php echo $m['est_annulation'] ? '<span class="badge badge-danger">Annulation</span>' : 'Saisie d\'origine'; ?></td>
            </tr>
          <?php } ?>
          </tbody>
        </table>
      </div>
      <?php } ?>
      <?php if ($nb_masques > 0) { ?><p class="text-muted small p-3 mb-0">Certains mouvements concernent une autre entreprise et ne sont pas affichés.</p><?php } ?>
    </div></div>

  </div></section>
</div>

<?php if ($peut_annuler) { ?>
<div class="modal fade" id="modal-annuler" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-annuler-titre">
  <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title" id="modal-annuler-titre">Annuler le document <?php echo e($d['numero']); ?></h5>
      <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button>
    </div>
    <div class="modal-body">
      <p><?php echo e(isset($consequence[$type]) ? $consequence[$type] : ''); ?> Le document reste dans la liste, marqué « ANNULÉ ». Si les pièces ne sont plus là, l'annulation est refusée.</p>
      <div class="form-group mb-2">
        <label for="annuler-motif">Motif de l'annulation <span class="text-danger" aria-hidden="true">*</span></label>
        <textarea id="annuler-motif" class="form-control" rows="3" maxlength="255" placeholder="Par exemple : erreur de saisie, mauvaise quantité…"></textarea>
      </div>
      <div id="annuler-erreur" class="alert alert-danger mb-0" role="alert" hidden></div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="annuler-retour">Retour</button>
      <button type="button" class="btn mv-btn-danger" id="annuler-confirmer">Annuler ce document</button>
    </div>
  </div></div>
</div>
<?php } ?>
