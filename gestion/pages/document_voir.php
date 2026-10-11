<?php
// Détail d'un document : en-tête avec logos, lignes, mouvements créés, annulation (gestionnaire+), impression A4 et PDF.
// Employé+ : un employé ne voit aucun coût ni total. Une facture interne (gestionnaire+) est affichée par le module C.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/action/document_lib.php';
require_once __DIR__ . '/../app/classes/DocumentVue.php';
page_script('assets/js/mouvements.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$gest = $Ouser->aRole('gestionnaire');
$couts = $Ouser->peutVoirCouts();
$acc = array_map('intval', $Ouser->entreprisesConsultables());

$r = null;
try { $r = inventaire()->document(utilisateur_id(), $id); } catch (InventaireException $ex) { $r = null; }   // inexistant ou inaccessible : même réponse
if (!$r) { ?>
<div class="content-wrapper"><?php page_titre('Document introuvable'); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning" role="alert">Ce document n'existe pas, ou vous n'y avez pas accès. <a class="alert-link" href="index.php?page=documents">Retour à la liste des documents</a></div>
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

$m = DocumentVue::document($pdo, $Ouser, $r, array('masque' => 'Autre entreprise'));   // même modèle que le PDF
$annule = $m['annule'];
$type = $d['type'];
$peut_annuler = $gest && !$annule && $type !== 'ajustement';
$peut_pdf = ($type !== 'facture_interne');          // la facture interne est un document de gestionnaire : pas de PDF pour un employé
$moment = function ($s) { return DocumentVue::moment($s); };
$cout4 = function ($s) { return DocumentVue::cout($s); };   // 2 à 4 décimales
$qte = function ($s, $signe) { $v = fmt_nombre($s); return ($signe && $s !== '' && $s[0] !== '-' ? '+' : '') . $v; };

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
// Réception qui a modifié les prix du fournisseur : l'annulation reprend le stock et le coût moyen, mais pas ces prix
$prix_modifies = 0;
if ($peut_annuler && $type === 'reception' && $d['fournisseur_id']) {
	$st = $pdo->prepare('SELECT COUNT(DISTINCT pf.piece_id) FROM prix_fournisseurs pf JOIN document_lignes l ON l.piece_id = pf.piece_id
		WHERE l.document_id = ? AND pf.fournisseur_id = ? AND pf.note = ?');
	$st->execute(array((int) $d['id'], (int) $d['fournisseur_id'], 'Réception ' . $d['numero']));
	$prix_modifies = (int) $st->fetchColumn();
}
$flash = (isset($_GET['ok']) && $_GET['ok'] === 'annule' && $annule);
?>
<link rel="stylesheet" href="assets/css/mouvements.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/mouvements.css'); ?>">
<link rel="stylesheet" href="assets/css/documents.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/documents.css'); ?>">
<div class="content-wrapper" data-mouvement="document_voir" data-doc="1" data-document-id="<?php echo (int) $d['id']; ?>" data-numero="<?php echo e($d['numero']); ?>">
  <?php page_titre($d['numero']); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($flash) { ?><div class="alert alert-success no-print" role="status">Le document a été annulé et le stock a été corrigé.</div><?php } ?>

    <div class="mb-3 no-print mv-barre doc-barre">
      <a class="btn btn-outline-secondary" href="index.php?page=documents"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i> Documents</a>
      <?php if ($peut_pdf) { ?><a class="btn btn-primary" id="btn-pdf" href="app/ajax/document_pdf.php?id=<?php echo (int) $d['id']; ?>"><i class="fas fa-file-pdf mr-1" aria-hidden="true"></i> Télécharger en PDF</a><?php } ?>
      <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      <?php if ($peut_annuler) { ?>
        <button type="button" class="btn mv-btn-danger" id="btn-annuler"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Annuler ce document</button>
      <?php } ?>
    </div>

    <?php DocumentVue::documentHtml($m, array('classes' => 'mv-document')); ?>

    <div class="card mv-carte no-print"><div class="card-header"><h3 class="card-title">Mouvements créés</h3></div><div class="card-body p-0">
      <?php if (!$mouvements) { ?>
        <p class="text-muted p-3 mb-0">Aucun mouvement.</p>
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
      <p><?php echo e(isset($consequence[$type]) ? $consequence[$type] : ''); ?></p>
      <?php if ($prix_modifies > 0) { ?>
      <p class="alert alert-warning" id="annuler-prix"><i class="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i> Cette réception a mis à jour <?php echo $prix_modifies; ?> prix de <?php echo e($d['fournisseur']); ?>. L'annulation ne rétablit pas ces prix.</p>
      <?php } ?>
      <div class="form-group mb-2">
        <label for="annuler-motif">Motif de l'annulation <span class="text-danger" aria-hidden="true">*</span></label>
        <textarea id="annuler-motif" class="form-control" rows="3" maxlength="255" placeholder="Erreur de saisie…"></textarea>
      </div>
      <div id="annuler-erreur" class="alert alert-danger mb-0" role="alert" hidden></div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="annuler-retour">Ne pas annuler</button>
      <button type="button" class="btn mv-btn-danger" id="annuler-confirmer">Confirmer l'annulation</button>
    </div>
  </div></div>
</div>
<?php } ?>
