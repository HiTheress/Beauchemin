<?php
// Facture interne au coût : document avec en-tête (logos), imprimable (A4) et téléchargeable en PDF (gestionnaire+). Paramètre : id.
// Accès refusé à tout utilisateur qui n'a accès ni à l'entreprise émettrice ni à la destinataire. Un document d'un autre type est
// renvoyé vers la page des documents (document_voir).
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
require_once __DIR__ . '/../app/classes/DocumentVue.php';
page_script('assets/js/interentreprise.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$css = '<link rel="stylesheet" href="assets/css/interentreprise.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css') . '">'
	. '<link rel="stylesheet" href="assets/css/documents.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/documents.css') . '">';

$r = null;
$erreur_doc = 'Cette facture n\'existe pas.';
$refus = false;
if ($id > 0) {
	try { $r = inventaire()->document(utilisateur_id(), $id); }
	catch (InventaireException $ex) { $r = null; $erreur_doc = $ex->getMessage(); $refus = (strpos($erreur_doc, 'accès') !== false); }
}
// Un document d'un autre type (accès déjà vérifié par le service) : la page des documents
if ($r && $r['doc']['type'] !== 'facture_interne') {
	while (ob_get_level() > 0) { ob_end_clean(); }
	header('Location: index.php?page=document_voir&id=' . (int) $r['doc']['id']);      // relative : aucun nom d'hôte réfléchi
	exit;
}
if (!$r) {
	http_response_code($refus ? 403 : 404);
	?>
<div class="content-wrapper"><?php page_titre($refus ? 'Accès refusé' : 'Facture introuvable', array('Facturation', 'Factures')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-<?php echo $refus ? 'danger' : 'warning'; ?>" role="alert"><?php echo e($erreur_doc); ?> <a class="alert-link" href="index.php?page=factures_internes">Retour aux factures</a></div>
  </div></section>
</div>
<?php return; }

$d = $r['doc'];
$m = DocumentVue::document($pdo, $Ouser, $r, array('masque' => 'non communiqué'));   // même modèle que le PDF
$annule = $m['annule'];
// Seule l'entreprise qui a ÉMIS la facture peut l'annuler (règle du service) : le destinataire voit la facture, sans le bouton,
// avec une petite icône d'information (infobulle) qui dit pourquoi.
$peut_annuler = !$annule && $Ouser->peutAcces((int) $d['entreprise_id']);
// Message de succès de l'annulation : affiché UNE seule fois (mémorisé dans la session par facture_annuler.php), pas à chaque rechargement
$flash = ($annule && isset($_GET['ok']) && $_GET['ok'] === 'annule' && isset($_SESSION['ie_flash_annule']) && (int) $_SESSION['ie_flash_annule'] === (int) $d['id']);
if ($flash) { unset($_SESSION['ie_flash_annule']); }
?>
<?php echo $css; ?>
<div class="content-wrapper" data-ie="facture_interne_voir" data-doc="1" data-document-id="<?php echo (int) $d['id']; ?>" data-numero="<?php echo e($d['numero']); ?>" data-titre="<?php echo e('Facture interne ' . $d['numero'] . ' — Beauchemin'); ?>">
  <?php page_titre($d['numero'], array('Facturation', 'Factures')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($flash) { ?><div class="alert ie-succes no-print" role="status" id="flash-annule"><i class="fas fa-check-circle mr-1" aria-hidden="true"></i> Facture <strong><?php echo e($d['numero']); ?></strong> annulée.</div><?php } ?>

    <div class="mb-3 no-print ie-barre doc-barre">
      <a class="btn btn-outline-secondary" href="index.php?page=factures_internes"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i> Factures</a>
      <a class="btn btn-primary" id="btn-pdf" href="app/ajax/document_pdf.php?id=<?php echo (int) $d['id']; ?>"><i class="fas fa-file-pdf mr-1" aria-hidden="true"></i> Télécharger en PDF</a>
      <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      <?php if ($peut_annuler) { ?>
        <button type="button" class="btn ie-btn-danger" id="btn-annuler"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Annuler la facture</button>
      <?php } elseif (!$annule) { $info_annul = 'Seule l\'entreprise émettrice (' . $d['entreprise'] . ') peut annuler cette facture.'; ?>
        <span class="ie-info" id="annulation-emettrice" tabindex="0" role="img" aria-label="<?php echo e($info_annul); ?>" title="<?php echo e($info_annul); ?>"><i class="fas fa-info-circle" aria-hidden="true"></i></span>
      <?php } ?>
    </div>

    <?php DocumentVue::documentHtml($m, array('id' => 'facture')); ?>

  </div></section>
</div>

<?php if ($peut_annuler) { ?>
<div class="modal fade" id="modal-annuler" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-annuler-titre">
  <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title" id="modal-annuler-titre">Annuler la facture <?php echo e($d['numero']); ?></h5>
      <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button>
    </div>
    <div class="modal-body">
      <p>Les pièces retourneront chez <?php echo e($d['entreprise']); ?> et quitteront <?php echo e($d['entreprise_dest']); ?> : l'annulation est définitive.</p>
      <div class="form-group mb-2">
        <label for="annuler-motif">Motif <span class="text-danger" aria-hidden="true">*</span><span class="sr-only">(obligatoire)</span></label>
        <textarea id="annuler-motif" class="form-control" rows="3" maxlength="255" required aria-required="true" placeholder="Ex. : erreur de quantité"></textarea>
      </div>
      <div id="annuler-erreur" class="alert alert-danger mb-0" role="alert" hidden></div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="annuler-retour">Garder la facture</button>
      <button type="button" class="btn ie-btn-danger" id="annuler-confirmer">Annuler la facture</button>
    </div>
  </div></div>
</div>
<?php } ?>
