<?php
// Facture interne au coût : présentation imprimable (gestionnaire+). Paramètre : id.
// Accès refusé à tout utilisateur qui n'a accès ni à l'entreprise émettrice ni à la destinataire. Un document d'un autre type est
// renvoyé vers la page des documents (document_voir).
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/interentreprise.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
$css = '<link rel="stylesheet" href="assets/css/interentreprise.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css') . '">';

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
<div class="content-wrapper"><?php page_titre($refus ? 'Accès refusé' : 'Facture introuvable', array('Rapports', 'Factures internes')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-<?php echo $refus ? 'danger' : 'warning'; ?>" role="alert"><?php echo e($erreur_doc); ?> <a class="alert-link" href="index.php?page=factures_internes">Retour à la liste des factures internes</a></div>
  </div></section>
</div>
<?php return; }

$d = $r['doc'];
$lignes = $r['lignes'];
$annule = ($d['statut'] === 'annule');
// Seule l'entreprise qui a ÉMIS la facture peut l'annuler (règle du service) : le destinataire voit la facture, sans le bouton,
// avec l'explication de la marche à suivre (facture en sens inverse).
$peut_annuler = !$annule && $Ouser->peutAcces((int) $d['entreprise_id']);
$moment = function ($s) { return $s ? substr((string) $s, 0, 16) : ''; };
$qte = function ($s) { return Interentreprise::nombre($s); };
// Message de succès de l'annulation : affiché UNE seule fois (mémorisé dans la session par facture_annuler.php), pas à chaque rechargement
$flash = ($annule && isset($_GET['ok']) && $_GET['ok'] === 'annule' && isset($_SESSION['ie_flash_annule']) && (int) $_SESSION['ie_flash_annule'] === (int) $d['id']);
if ($flash) { unset($_SESSION['ie_flash_annule']); }
// Le service ne communique pas le nom d'un emplacement d'une entreprise à laquelle l'utilisateur n'a pas accès (valeur nulle)
$nom_emp = function ($n) { return ($n === null || $n === '') ? '<span class="text-muted">non communiqué</span>' : '<strong>' . e($n) . '</strong>'; };
$guill = function ($t) { return "«\xc2\xa0" . $t . "\xc2\xa0»"; };
$nom_utilisateur = $d['utilisateur'] !== null ? $d['utilisateur'] : '—';
?>
<?php echo $css; ?>
<div class="content-wrapper" data-ie="facture_interne_voir" data-document-id="<?php echo (int) $d['id']; ?>" data-numero="<?php echo e($d['numero']); ?>" data-titre="<?php echo e('Facture interne ' . $d['numero'] . ' — Beauchemin'); ?>">
  <?php page_titre($d['numero'], array('Rapports', 'Factures internes')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($flash) { ?><div class="alert ie-succes no-print" role="status" id="flash-annule"><i class="fas fa-check-circle mr-1" aria-hidden="true"></i> La facture <strong><?php echo e($d['numero']); ?></strong> a été annulée : les pièces sont retournées à l'emplacement source de <?php echo e($d['entreprise']); ?> et ont quitté l'emplacement de destination de <?php echo e($d['entreprise_dest']); ?>.</div><?php } ?>

    <div class="mb-3 no-print ie-barre">
      <a class="btn btn-outline-secondary" href="index.php?page=factures_internes"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i> Liste des factures</a>
      <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      <?php if ($peut_annuler) { ?>
        <button type="button" class="btn ie-btn-danger" id="btn-annuler"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Annuler cette facture</button>
      <?php } ?>
    </div>
    <?php if (!$annule && !$peut_annuler) { ?>
    <p class="text-muted no-print" id="annulation-emettrice"><i class="fas fa-info-circle mr-1" aria-hidden="true"></i> Seule l'entreprise émettrice (<?php echo e($d['entreprise']); ?>) peut annuler cette facture. Pour la défaire, demandez-lui de l'annuler ou faites émettre une facture en sens inverse.</p>
    <?php } ?>

    <article class="card ie-facture<?php echo $annule ? ' ie-annulee' : ''; ?>" id="facture" aria-label="Facture interne <?php echo e($d['numero']); ?>">
      <?php if ($annule) { ?><div class="ie-filigrane" aria-hidden="true">ANNULÉE</div><?php } ?>
      <div class="card-body">
        <?php if ($annule) { ?>
        <div class="alert ie-bandeau-annule" role="status" id="bandeau-annule">
          <span class="badge badge-danger ie-badge-annule">ANNULÉE</span>
          <span class="ml-2">
            Annulée<?php echo $d['annule_par_nom'] ? ' par <strong>' . e($d['annule_par_nom']) . '</strong>' : ''; ?><?php echo $d['annule_le'] ? ' le ' . e($moment($d['annule_le'])) : ''; ?>.
            <?php if ($d['motif_annulation'] !== null && $d['motif_annulation'] !== '') { ?>Motif : <?php echo e($guill($d['motif_annulation'])); ?>.<?php } ?>
          </span>
        </div>
        <?php } ?>

        <header class="ie-entete">
          <div>
            <h2 class="ie-titre">FACTURE INTERNE</h2>
            <div class="ie-sous-titre">Facturation entre entreprises, au coût</div>
          </div>
          <dl class="ie-meta">
            <dt>Numéro</dt><dd class="code font-weight-bold"><?php echo e($d['numero']); ?></dd>
            <dt>Date</dt><dd><?php echo e(fmt_date($d['date_document'])); ?></dd>
            <dt>Statut</dt><dd><?php echo $annule ? '<span class="badge badge-danger">ANNULÉE</span>' : '<span class="badge badge-success">Valide</span>'; ?></dd>
          </dl>
        </header>

        <div class="ie-parties">
          <section class="ie-partie" aria-labelledby="ie-emetteur">
            <h3 id="ie-emetteur">Émetteur</h3>
            <p class="ie-partie-nom"><?php echo e($d['entreprise']); ?></p>
            <p class="mb-0">Emplacement source : <?php echo $nom_emp($d['emplacement']); ?></p>
          </section>
          <section class="ie-partie" aria-labelledby="ie-destinataire">
            <h3 id="ie-destinataire">Destinataire</h3>
            <p class="ie-partie-nom"><?php echo e($d['entreprise_dest']); ?></p>
            <p class="mb-0">Emplacement de destination : <?php echo $nom_emp($d['emplacement_dest']); ?></p>
          </section>
        </div>

        <div class="table-responsive">
          <table class="table table-sm ie-table-facture" id="table-lignes">
            <caption class="sr-only">Pièces de la facture <?php echo e($d['numero']); ?></caption>
            <thead><tr>
              <th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th>
              <th scope="col" class="nombre">Coût unitaire</th><th scope="col" class="nombre">Total</th>
            </tr></thead>
            <tbody>
            <?php foreach ($lignes as $l) { ?>
              <tr>
                <td class="code"><a href="index.php?page=piece_voir&amp;id=<?php echo (int) $l['piece_id']; ?>"><?php echo e($l['code']); ?></a></td>
                <td><?php echo e($l['nom']); ?></td>
                <td class="nombre"><?php echo e($qte($l['quantite'])); ?><?php echo ($l['unite'] && $l['unite'] !== 'unité') ? ' <small class="text-muted">' . e($l['unite']) . '</small>' : ''; ?></td>
                <td class="nombre"><?php echo e(Interentreprise::cout($l['cout_unitaire'])); ?></td>
                <td class="nombre"><?php echo e(Interentreprise::argent($l['total_ligne'])); ?></td>
              </tr>
            <?php } ?>
            </tbody>
            <tfoot><tr class="ie-ligne-total"><th colspan="4" class="text-right">Total</th><th class="nombre" id="total-facture"><?php echo e(Interentreprise::argent($d['total'])); ?></th></tr></tfoot>
          </table>
        </div>

        <p class="ie-mention"><i class="fas fa-info-circle mr-1" aria-hidden="true"></i> Facturé au coût — aucune marge</p>

        <?php if ($d['note'] !== null && $d['note'] !== '') { ?>
        <div class="ie-note"><strong>Note</strong><div class="ie-note-texte"><?php echo e($d['note']); ?></div></div>
        <?php } ?>

        <div class="ie-signatures">
          <div class="ie-signature"><div class="ie-trait"></div><div>Préparé par — <?php echo e($d['entreprise']); ?></div></div>
          <div class="ie-signature"><div class="ie-trait"></div><div>Reçu par — <?php echo e($d['entreprise_dest']); ?></div></div>
        </div>
        <p class="ie-pied">Saisie par <?php echo e($nom_utilisateur); ?> · <?php echo e($moment($d['cree_le'])); ?> · imprimée le <?php echo e(date('Y-m-d H:i')); ?></p>
      </div>
    </article>

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
      <p>Les pièces retourneront à l'emplacement source de <?php echo e($d['entreprise']); ?> et quitteront l'emplacement de destination de <?php echo e($d['entreprise_dest']); ?>. La facture reste dans la liste, marquée «&nbsp;ANNULÉE&nbsp;», et n'est plus comptée dans le bilan. Si les pièces ont déjà été sorties de la destination, l'annulation est refusée.</p>
      <div class="form-group mb-2">
        <label for="annuler-motif">Motif de l'annulation <span class="text-danger" aria-hidden="true">*</span><span class="sr-only">(obligatoire)</span></label>
        <textarea id="annuler-motif" class="form-control" rows="3" maxlength="255" required aria-required="true" placeholder="Par exemple : erreur de quantité, mauvaise destination…"></textarea>
      </div>
      <div id="annuler-erreur" class="alert alert-danger mb-0" role="alert" hidden></div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="annuler-retour">Retour</button>
      <button type="button" class="btn ie-btn-danger" id="annuler-confirmer">Annuler cette facture</button>
    </div>
  </div></div>
</div>
<?php } ?>
