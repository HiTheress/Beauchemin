<?php
// Bilan mensuel des factures internes entre deux entreprises (gestionnaire+) : factures et pièces regroupées de chaque sens,
// puis le solde. Tous les montants viennent de inventaire()->bilanMensuel (les factures annulées n'y figurent pas).
// URL : annee, mois (défaut : mois courant), a et b (paire d'entreprises, seulement s'il y a plus de deux entreprises).
// Écran : une phrase (qui doit combien à qui), le sélecteur ‹ mois ›, puis le détail. Le choix d'un autre mois ou d'une autre paire
// est caché derrière « Plus d'options » (ouvert d'office si la paire demandée est refusée).
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
require_once __DIR__ . '/../app/classes/DocumentVue.php';
page_script('assets/js/interentreprise.js');
$css = '<link rel="stylesheet" href="assets/css/interentreprise.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css') . '">'
	. '<link rel="stylesheet" href="assets/css/documents.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/documents.css') . '">';

$erreur = null;
$r = null;
$toutes = array();
$a = 0;
$b = 0;
list($annee, $mois) = Interentreprise::periode($_GET);
try {
	list($a, $b, $toutes) = Interentreprise::paire($_GET);
	$r = inventaire()->bilanMensuel(utilisateur_id(), $annee, $mois, $a, $b);
} catch (InventaireException $ex) {
	$erreur = $ex->getMessage();
}
$plusDeDeux = count($toutes) > 2;
$mois_cap = function ($n) { $m = MOIS_FR[$n]; return mb_strtoupper(mb_substr($m, 0, 1)) . mb_substr($m, 1); };
$miennes = array_map('intval', $Ouser->entreprisesAutorisees());
$periode = Interentreprise::libellePeriode($annee, $mois);              // « mars 2026 »
$periode_de = Interentreprise::periodeAvecDe($annee, $mois);            // « de mars 2026 », « d'octobre 2026 »

// Années proposées : de la plus ancienne facture entre les deux entreprises à l'année en cours (et l'année affichée)
$premiere = (int) date('Y');
if ($a > 0 && $b > 0) {
	$st = $pdo->prepare("SELECT COALESCE(MIN(YEAR(date_document)), ?) FROM documents WHERE type = 'facture_interne' AND ((entreprise_id = ? AND entreprise_dest_id = ?) OR (entreprise_id = ? AND entreprise_dest_id = ?))");
	$st->execute(array((int) date('Y'), $a, $b, $b, $a));
	$premiere = (int) $st->fetchColumn();
}
$annees = array();
for ($i = (int) date('Y'); $i >= min($premiere, (int) date('Y')); $i--) { $annees[] = $i; }
if (!in_array($annee, $annees, true)) { $annees[] = $annee; rsort($annees); }

if ($r) {
	$noms = $r['entreprises'];
	$solde = $r['solde'];
	// Navigation : mois précédent / suivant (pas de facture dans le futur : le suivant s'arrête au mois courant)
	$url = function ($an, $mo) use ($a, $b, $plusDeDeux) {
		return 'index.php?page=bilan_mensuel&annee=' . (int) $an . '&mois=' . (int) $mo . ($plusDeDeux ? '&a=' . (int) $a . '&b=' . (int) $b : '');
	};
	$prec = ($mois === 1) ? array($annee - 1, 12) : array($annee, $mois - 1);
	$suiv = ($mois === 12) ? array($annee + 1, 1) : array($annee, $mois + 1);
	$courant = ((int) date('Y')) * 12 + (int) date('n');
	$peut_prec = $annee * 12 + $mois > 2000 * 12 + 1;
	$peut_suiv = ($suiv[0] * 12 + $suiv[1]) <= $courant;

	// Factures annulées de ce mois entre les deux entreprises (non comptées dans le bilan)
	$st = $pdo->prepare("SELECT COUNT(*) FROM documents WHERE type = 'facture_interne' AND statut = 'annule' AND date_document BETWEEN ? AND ? AND ((entreprise_id = ? AND entreprise_dest_id = ?) OR (entreprise_id = ? AND entreprise_dest_id = ?))");
	$st->execute(array($r['periode']['du'], $r['periode']['au'], $a, $b, $b, $a));
	$nb_annulees = (int) $st->fetchColumn();
	$lien_annulees = 'index.php?page=factures_internes&annee=' . (int) $annee . '&mois=' . (int) $mois . '&statut=annule';
	$lien_csv = 'app/ajax/bilan_export.php?annee=' . (int) $annee . '&mois=' . (int) $mois . '&a=' . (int) $a . '&b=' . (int) $b;
	$lien_pdf = 'app/ajax/bilan_pdf.php?annee=' . (int) $annee . '&mois=' . (int) $mois . '&a=' . (int) $a . '&b=' . (int) $b;
	$mb = DocumentVue::bilan($pdo, $r, $annee, $mois, $a, $b, $periode);      // même modèle que le PDF
	$nb_factures = count($r['a_vers_b']['documents']) + count($r['b_vers_a']['documents']);
	$sens = array(
		array($a, $b, $r['a_vers_b']),
		array($b, $a, $r['b_vers_a']),
	);
	$titre_onglet = 'Bilan ' . $periode_de . ' — ' . $noms[$a] . ' et ' . $noms[$b];
} else {
	$titre_onglet = 'Bilan du mois — Beauchemin';
}
echo $css;
?>
<div class="content-wrapper" data-ie="bilan_mensuel" data-doc="1" data-titre="<?php echo e($titre_onglet); ?>">
  <?php page_titre('Bilan du mois', array('Facturation')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($r) { ?>
    <div class="ie-bilan-barre no-print">
      <div class="ie-nav-mois" role="group" aria-label="Mois">
        <?php if ($peut_prec) { ?><a class="btn btn-outline-secondary ie-nav-btn" id="b-prec" href="<?php echo e($url($prec[0], $prec[1])); ?>" aria-label="Mois précédent" title="Mois précédent"><i class="fas fa-chevron-left" aria-hidden="true"></i></a><?php } ?>
        <h2 class="ie-bilan-titre"><?php echo e($periode); ?></h2>
        <?php if ($peut_suiv) { ?><a class="btn btn-outline-secondary ie-nav-btn" id="b-suiv" href="<?php echo e($url($suiv[0], $suiv[1])); ?>" aria-label="Mois suivant" title="Mois suivant"><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
        <?php } else { ?><span class="btn btn-outline-secondary ie-nav-btn disabled" aria-disabled="true" id="b-suiv-off" aria-label="Mois suivant" title="Mois suivant"><i class="fas fa-chevron-right" aria-hidden="true"></i></span><?php } ?>
      </div>
      <div class="ie-bilan-outils">
        <a class="btn btn-primary" id="btn-pdf" href="<?php echo e($lien_pdf); ?>"><i class="fas fa-file-pdf mr-1" aria-hidden="true"></i> Télécharger en PDF</a>
        <a class="btn btn-outline-secondary" id="btn-csv" href="<?php echo e($lien_csv); ?>"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter</a>
        <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
      </div>
    </div>
    <?php } ?>

    <?php if (!$r) { ?>
    <div class="alert alert-warning" role="alert"><?php echo e($erreur !== null ? $erreur : 'Le bilan est indisponible.'); ?><?php echo ($plusDeDeux && $toutes) ? ' Choisissez une paire qui comprend l\'une de vos entreprises.' : ''; ?></div>
    <?php } ?>

    <?php if ($toutes) { ?>
    <div class="ie-bilan-plus no-print">
      <button type="button" id="b-plus" class="btn btn-link ie-plus-btn" aria-expanded="<?php echo $r ? 'false' : 'true'; ?>" aria-controls="b-options"><i class="fas fa-chevron-<?php echo $r ? 'right' : 'down'; ?> ie-plus-icone" aria-hidden="true"></i> Plus d'options</button>
      <div id="b-options" class="ie-options-liste"<?php echo $r ? ' hidden' : ''; ?>>
        <form method="get" action="index.php" class="ie-form-bilan" id="form-bilan">
          <input type="hidden" name="page" value="bilan_mensuel">
          <div class="form-row align-items-end">
            <div class="col-auto form-group">
              <label for="b-mois">Mois</label>
              <select id="b-mois" name="mois" class="form-control">
                <?php foreach (MOIS_FR as $n => $lib) { ?><option value="<?php echo (int) $n; ?>"<?php echo $mois === $n ? ' selected' : ''; ?>><?php echo e($mois_cap($n)); ?></option><?php } ?>
              </select>
            </div>
            <div class="col-auto form-group">
              <label for="b-annee">Année</label>
              <select id="b-annee" name="annee" class="form-control">
                <?php foreach ($annees as $y) { ?><option value="<?php echo (int) $y; ?>"<?php echo $annee === $y ? ' selected' : ''; ?>><?php echo (int) $y; ?></option><?php } ?>
              </select>
            </div>
            <?php if ($plusDeDeux) { ?>
            <div class="col-auto form-group">
              <label for="b-a">Entre l'entreprise</label>
              <select id="b-a" name="a" class="form-control">
                <?php foreach ($toutes as $en) { if (!in_array((int) $en['id'], $miennes, true)) { continue; } ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $a === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
              </select>
            </div>
            <div class="col-auto form-group">
              <label for="b-b">et l'entreprise</label>
              <select id="b-b" name="b" class="form-control">
                <?php foreach ($toutes as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $b === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
              </select>
            </div>
            <?php } ?>
            <div class="col-auto form-group"><button type="submit" class="btn btn-outline-primary">Afficher</button></div>
          </div>
        </form>
      </div>
    </div>
    <?php } ?>

    <?php if (!$r) { ?>
  </div></section>
</div>
<?php return; } ?>

    <div class="ie-bilan" id="bilan">
      <?php echo DocumentVue::styleImpression(); ?>
      <article class="card doc <?php echo e(DocumentVue::classeMarque($mb)); ?> ie-doc-bilan"><div class="card-body">
      <?php DocumentVue::enteteHtml($mb); ?>

      <div class="doc-solde ie-solde<?php echo $solde['debiteur'] === null ? ' doc-solde-nul ie-solde-nul' : ''; ?>" id="solde" role="status">
        <?php if ($solde['debiteur'] !== null) { ?>
          <div class="doc-solde-texte ie-solde-texte"><span class="ie-solde-qui"><?php echo e($solde['debiteur_nom']); ?></span> doit <span class="doc-solde-montant ie-montant" id="solde-montant"><?php echo e(Interentreprise::argent($solde['montant'])); ?></span> à <span class="ie-solde-qui"><?php echo e($solde['creancier_nom']); ?></span></div>
        <?php } else { ?>
          <div class="doc-solde-texte ie-solde-texte">Aucun solde</div>
          <div class="doc-solde-sous ie-solde-sous"><?php echo $nb_factures === 0 ? 'Aucune facture en ' . e($periode) . '.' : 'Les deux entreprises sont quittes.'; ?></div>
        <?php } ?>
      </div>
      <p class="ie-bilan-paire no-print"><?php echo e($noms[$a]); ?> <i class="fas fa-exchange-alt mx-1" aria-hidden="true"></i><span class="sr-only">et</span> <?php echo e($noms[$b]); ?>
        <?php if ($nb_annulees > 0) { ?><span class="ie-annulees"> · <i class="fas fa-ban text-danger mr-1" aria-hidden="true"></i><a id="lien-annulees" class="ie-lien-tactile" href="<?php echo e($lien_annulees); ?>"><?php echo $nb_annulees === 1 ? '1 facture annulée' : (int) $nb_annulees . ' factures annulées'; ?></a></span><?php } ?>
      </p>

      <?php foreach ($sens as $i => $s) {
        list($de, $vers, $bloc) = $s; ?>
      <section class="doc-sens ie-sens" id="sens-<?php echo $i === 0 ? 'ab' : 'ba'; ?>" aria-labelledby="sens-titre-<?php echo (int) $i; ?>">
        <div class="doc-sens-entete">
          <h3 class="doc-sens-titre" id="sens-titre-<?php echo (int) $i; ?>"><?php echo e($noms[$de]); ?> <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> <?php echo e($noms[$vers]); ?></h3>
          <div class="ie-total-sens">Total : <strong class="ie-total-sens-montant"><?php echo e(Interentreprise::argent($bloc['total'])); ?></strong></div>
        </div>
        <div class="doc-sens-corps">
          <?php if (!$bloc['documents']) { ?>
            <p class="text-muted mb-0">Aucune facture.</p>
          <?php } else { ?>
          <h4 class="ie-sous-section">Factures</h4>
          <div class="table-responsive doc-table-wrap">
            <table class="table table-sm doc-table ie-table ie-bilan-factures mb-3">
              <caption class="sr-only">Factures de <?php echo e($noms[$de]); ?> à <?php echo e($noms[$vers]); ?> pour <?php echo e($periode); ?></caption>
              <thead><tr><th scope="col">Numéro</th><th scope="col">Date</th><th scope="col" class="d-none d-sm-table-cell">Emplacements</th><th scope="col" class="nombre">Total</th></tr></thead>
              <tbody>
              <?php foreach ($bloc['documents'] as $doc) { ?>
                <tr>
                  <td class="code"><a class="ie-lien-tactile" href="index.php?page=facture_interne_voir&amp;id=<?php echo (int) $doc['id']; ?>"><?php echo e($doc['numero']); ?></a></td>
                  <td><?php echo e(fmt_date($doc['date_document'])); ?></td>
                  <td class="d-none d-sm-table-cell"><?php echo e($doc['emplacement']); ?> <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> <?php echo e($doc['emplacement_dest']); ?><?php echo ($doc['note'] !== null && $doc['note'] !== '') ? '<div class="small text-muted ie-note-ligne">' . e($doc['note']) . '</div>' : ''; ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::argent($doc['total'])); ?></td>
                </tr>
              <?php } ?>
              </tbody>
            </table>
          </div>
          <h4 class="ie-sous-section">Pièces</h4>
          <div class="table-responsive doc-table-wrap">
            <table class="table table-sm doc-table ie-table ie-bilan-pieces mb-0">
              <caption class="sr-only">Pièces de <?php echo e($noms[$de]); ?> à <?php echo e($noms[$vers]); ?> pour <?php echo e($periode); ?></caption>
              <thead><tr><th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th><th scope="col" class="nombre d-none d-sm-table-cell">Coût moyen</th><th scope="col" class="nombre">Total</th></tr></thead>
              <tbody>
              <?php foreach ($bloc['pieces'] as $p) { ?>
                <tr>
                  <td class="code"><a class="ie-lien-tactile" href="index.php?page=piece_voir&amp;id=<?php echo (int) $p['piece_id']; ?>"><?php echo e($p['code']); ?></a></td>
                  <td><?php echo e($p['nom']); ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::nombre($p['quantite'])); ?><?php echo ($p['unite'] && $p['unite'] !== 'unité') ? ' <small class="text-muted">' . e($p['unite']) . '</small>' : ''; ?></td>
                  <td class="nombre d-none d-sm-table-cell"><?php echo e(Interentreprise::cout($p['cout_moyen'])); ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::argent($p['total'])); ?></td>
                </tr>
              <?php } ?>
              </tbody>
              <tfoot><tr class="ie-ligne-total"><th colspan="4" class="doc-total-texte text-right d-none d-sm-table-cell">Total <?php echo e($noms[$de]); ?> → <?php echo e($noms[$vers]); ?></th><th colspan="3" class="doc-total-texte text-right d-sm-none">Total</th><th class="nombre doc-total-montant"><?php echo e(Interentreprise::argent($bloc['total'])); ?></th></tr></tfoot>
            </table>
          </div>
          <?php } ?>
        </div>
      </section>
      <?php } ?>
      <footer class="doc-pied"><span><?php echo e($mb['paire']); ?> · <?php echo e($periode); ?></span><span class="doc-pied-logiciel">Logiciel de gestion d'inventaire — Beauchemin / Boutique Chaleur</span></footer>
      </div></article>
    </div>

  </div></section>
</div>
