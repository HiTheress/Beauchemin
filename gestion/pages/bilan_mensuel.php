<?php
// Bilan mensuel des factures internes entre deux entreprises (gestionnaire+) : factures et pièces regroupées de chaque sens,
// puis le solde. Tous les montants viennent de inventaire()->bilanMensuel (les factures annulées n'y figurent pas).
// URL : annee, mois (défaut : mois courant), a et b (paire d'entreprises, seulement s'il y a plus de deux entreprises).
// Le formulaire de choix (mois, année, paire) est TOUJOURS affiché, même si la paire demandée est refusée.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/facture_lib.php';
page_script('assets/js/interentreprise.js');
$css = '<link rel="stylesheet" href="assets/css/interentreprise.css?v=' . (int) @filemtime(__DIR__ . '/../assets/css/interentreprise.css') . '">';

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
	$nb_factures = count($r['a_vers_b']['documents']) + count($r['b_vers_a']['documents']);
	$sens = array(
		array($a, $b, $r['a_vers_b']),
		array($b, $a, $r['b_vers_a']),
	);
	$titre_onglet = 'Bilan ' . $periode_de . ' — ' . $noms[$a] . ' et ' . $noms[$b];
} else {
	$titre_onglet = 'Bilan mensuel — Beauchemin';
}
echo $css;
?>
<div class="content-wrapper" data-ie="bilan_mensuel" data-titre="<?php echo e($titre_onglet); ?>">
  <?php page_titre('Bilan mensuel', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($toutes) { ?>
    <div class="card ie-carte no-print"><div class="card-body">
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
          <?php if ($r) { ?>
          <div class="col-auto form-group ie-nav-mois">
            <?php if ($peut_prec) { ?><a class="btn btn-outline-secondary" id="b-prec" href="<?php echo e($url($prec[0], $prec[1])); ?>"><i class="fas fa-chevron-left mr-1" aria-hidden="true"></i> Mois précédent</a><?php } ?>
            <?php if ($peut_suiv) { ?><a class="btn btn-outline-secondary" id="b-suiv" href="<?php echo e($url($suiv[0], $suiv[1])); ?>">Mois suivant <i class="fas fa-chevron-right ml-1" aria-hidden="true"></i></a>
            <?php } else { ?><span class="btn btn-outline-secondary disabled" aria-disabled="true" id="b-suiv-off">Mois suivant <i class="fas fa-chevron-right ml-1" aria-hidden="true"></i></span><?php } ?>
          </div>
          <div class="col-auto form-group ml-lg-auto">
            <a class="btn btn-outline-secondary" id="btn-csv" href="<?php echo e($lien_csv); ?>"><i class="fas fa-file-csv mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
            <button type="button" class="btn btn-outline-secondary" id="btn-imprimer"><i class="fas fa-print mr-1" aria-hidden="true"></i> Imprimer</button>
          </div>
          <?php } ?>
        </div>
      </form>
      <?php if ($r) { ?>
      <p class="mb-0 small">
        <?php if ($nb_annulees > 0) { ?>
          <i class="fas fa-ban text-danger mr-1" aria-hidden="true"></i> <a id="lien-annulees" class="ie-lien-tactile" href="<?php echo e($lien_annulees); ?>"><?php echo $nb_annulees === 1 ? '1 facture annulée' : (int) $nb_annulees . ' factures annulées'; ?> en <?php echo e($periode); ?></a> (non comptée<?php echo $nb_annulees === 1 ? '' : 's'; ?> dans ce bilan)
        <?php } else { ?>
          <span class="text-muted" id="lien-annulees-aucune">Aucune facture annulée pour <?php echo e($periode); ?>.</span>
        <?php } ?>
      </p>
      <?php } ?>
    </div></div>
    <?php } ?>

    <?php if (!$r) { ?>
    <div class="alert alert-warning" role="alert"><?php echo e($erreur !== null ? $erreur : 'Le bilan est indisponible.'); ?><?php echo ($plusDeDeux && $toutes) ? ' Choisissez une paire qui comprend l\'une de vos entreprises.' : ''; ?></div>
  </div></section>
</div>
<?php return; } ?>

    <div class="ie-bilan" id="bilan">
      <div class="d-none d-print-block ie-impression-entete">Beauchemin — Gestion d'inventaire · imprimé le <?php echo e(date('Y-m-d H:i')); ?></div>
      <h2 class="ie-bilan-titre">Bilan <?php echo e($periode_de); ?></h2>
      <p class="ie-bilan-paire"><?php echo e($noms[$a]); ?> <i class="fas fa-exchange-alt mx-1" aria-hidden="true"></i><span class="sr-only">et</span> <?php echo e($noms[$b]); ?> — factures internes établies au coût (sans marge)</p>

      <div class="ie-solde<?php echo $solde['debiteur'] === null ? ' ie-solde-nul' : ''; ?>" id="solde" role="status">
        <?php if ($solde['debiteur'] !== null) { ?>
          <div class="ie-solde-texte"><span class="ie-solde-qui"><?php echo e($solde['debiteur_nom']); ?></span> doit <span class="ie-montant" id="solde-montant"><?php echo e(Interentreprise::argent($solde['montant'])); ?></span> à <span class="ie-solde-qui"><?php echo e($solde['creancier_nom']); ?></span> pour <?php echo e($periode); ?></div>
        <?php } else { ?>
          <div class="ie-solde-texte">Aucun solde pour <?php echo e($periode); ?></div>
          <div class="ie-solde-sous"><?php echo $nb_factures === 0 ? 'Aucune facture interne valide entre ces deux entreprises pour ' . $periode . '.' : 'Les factures des deux sens s\'annulent exactement.'; ?></div>
        <?php } ?>
      </div>

      <?php foreach ($sens as $i => $s) {
        list($de, $vers, $bloc) = $s; ?>
      <section class="card ie-carte ie-sens" id="sens-<?php echo $i === 0 ? 'ab' : 'ba'; ?>" aria-labelledby="sens-titre-<?php echo (int) $i; ?>">
        <div class="card-header">
          <h3 class="card-title" id="sens-titre-<?php echo (int) $i; ?>"><?php echo e($noms[$de]); ?> <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> <?php echo e($noms[$vers]); ?></h3>
          <div class="card-tools ie-total-sens">Total : <strong class="ie-total-sens-montant"><?php echo e(Interentreprise::argent($bloc['total'])); ?></strong></div>
        </div>
        <div class="card-body">
          <p class="text-muted small mb-2">Pièces prises dans l'inventaire de <?php echo e($noms[$de]); ?> par <?php echo e($noms[$vers]); ?>.</p>
          <?php if (!$bloc['documents']) { ?>
            <p class="text-muted mb-0">Aucune facture dans ce sens pour <?php echo e($periode); ?>.</p>
          <?php } else { ?>
          <h4 class="ie-sous-section">Factures (<?php echo count($bloc['documents']); ?>)</h4>
          <div class="table-responsive">
            <table class="table table-sm ie-table ie-bilan-factures mb-3">
              <caption class="sr-only">Factures de <?php echo e($noms[$de]); ?> à <?php echo e($noms[$vers]); ?> pour <?php echo e($periode); ?></caption>
              <thead><tr><th scope="col">Numéro</th><th scope="col">Date</th><th scope="col">Emplacements</th><th scope="col" class="nombre">Total</th></tr></thead>
              <tbody>
              <?php foreach ($bloc['documents'] as $doc) { ?>
                <tr>
                  <td class="code"><a class="ie-lien-tactile" href="index.php?page=facture_interne_voir&amp;id=<?php echo (int) $doc['id']; ?>"><?php echo e($doc['numero']); ?></a></td>
                  <td><?php echo e(fmt_date($doc['date_document'])); ?></td>
                  <td><?php echo e($doc['emplacement']); ?> <i class="fas fa-long-arrow-alt-right mx-1" aria-hidden="true"></i><span class="sr-only">vers</span> <?php echo e($doc['emplacement_dest']); ?><?php echo ($doc['note'] !== null && $doc['note'] !== '') ? '<div class="small text-muted ie-note-ligne">' . e($doc['note']) . '</div>' : ''; ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::argent($doc['total'])); ?></td>
                </tr>
              <?php } ?>
              </tbody>
            </table>
          </div>
          <h4 class="ie-sous-section">Pièces regroupées (<?php echo count($bloc['pieces']); ?>)</h4>
          <div class="table-responsive">
            <table class="table table-sm ie-table ie-bilan-pieces mb-0">
              <caption class="sr-only">Pièces regroupées de <?php echo e($noms[$de]); ?> à <?php echo e($noms[$vers]); ?> pour <?php echo e($periode); ?></caption>
              <thead><tr><th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th><th scope="col" class="nombre">Coût moyen pondéré</th><th scope="col" class="nombre">Total</th></tr></thead>
              <tbody>
              <?php foreach ($bloc['pieces'] as $p) { ?>
                <tr>
                  <td class="code"><a class="ie-lien-tactile" href="index.php?page=piece_voir&amp;id=<?php echo (int) $p['piece_id']; ?>"><?php echo e($p['code']); ?></a></td>
                  <td><?php echo e($p['nom']); ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::nombre($p['quantite'])); ?><?php echo ($p['unite'] && $p['unite'] !== 'unité') ? ' <small class="text-muted">' . e($p['unite']) . '</small>' : ''; ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::cout($p['cout_moyen'])); ?></td>
                  <td class="nombre"><?php echo e(Interentreprise::argent($p['total'])); ?></td>
                </tr>
              <?php } ?>
              </tbody>
              <tfoot><tr class="ie-ligne-total"><th colspan="4" class="text-right">Total <?php echo e($noms[$de]); ?> → <?php echo e($noms[$vers]); ?></th><th class="nombre"><?php echo e(Interentreprise::argent($bloc['total'])); ?></th></tr></tfoot>
            </table>
          </div>
          <?php } ?>
        </div>
      </section>
      <?php } ?>

      <p class="text-muted small ie-bilan-pied">Solde = total <?php echo e($noms[$a]); ?> → <?php echo e($noms[$b]); ?> moins total <?php echo e($noms[$b]); ?> → <?php echo e($noms[$a]); ?>. Seules les factures valides datées <?php echo e($periode_de); ?> sont comptées ; le coût moyen pondéré d'une pièce est son total divisé par sa quantité.</p>
    </div>

  </div></section>
</div>
