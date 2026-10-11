<?php
// Accueil : « que dois-je faire maintenant ? » Gros boutons d'action selon le rôle, puis l'état en deux chiffres, puis les graphiques.
// Employé+. Un employé ne voit aucun montant : « Factures du mois » et « Valeur du stock » sont réservés aux gestionnaires+.
// Les chiffres sont chargés par assets/js/dashboard.js depuis app/ajax/dashboard_data.php (rafraîchis toutes les deux minutes).
if (!acces_page('employe')) { return; }
page_script('assets/js/widgets.js');
page_script('assets/js/dashboard.js');
$gest = $Ouser->aRole('gestionnaire');
$aujourdhui = date('Y-m-d');
?>
<link rel="stylesheet" href="assets/css/widgets.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/widgets.css'); ?>">
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" id="ds-racine" data-gest="<?php echo $gest ? '1' : '0'; ?>" data-entreprise="<?php echo (int) entreprise_courante(); ?>">
  <?php page_titre('Accueil'); ?>
  <section class="content"><div class="container-fluid">

    <div id="ds-erreur" class="alert alert-danger" role="alert" hidden></div>
    <noscript><div class="alert alert-warning">Activez JavaScript pour voir les chiffres.</div></noscript>

    <!-- Que faire ? -->
    <div class="ds-raccourcis no-print <?php echo $gest ? 'ds-n4' : 'ds-n3'; ?>">
      <a class="btn btn-primary btn-lg" href="index.php?page=scanner"><i class="fas fa-barcode" aria-hidden="true"></i><span>Scanner</span></a>
      <a class="btn btn-primary btn-lg" href="index.php?page=transfert"><i class="fas fa-exchange-alt" aria-hidden="true"></i><span>Déplacer</span></a>
      <a class="btn btn-primary btn-lg" href="index.php?page=sortie"><i class="fas fa-wrench" aria-hidden="true"></i><span>Utiliser</span></a>
      <?php if ($gest) { ?>
      <a class="btn btn-primary btn-lg" href="index.php?page=reception"><i class="fas fa-truck-loading" aria-hidden="true"></i><span>Recevoir</span></a>
      <?php } ?>
    </div>

    <!-- État -->
    <div class="d-flex align-items-center justify-content-between mb-2">
      <p class="ds-portee mb-0" id="ds-portee" role="status">&nbsp;</p>
      <button type="button" id="ds-actualiser" class="btn btn-outline-secondary btn-sm no-print" title="Actualiser" aria-label="Actualiser"><i class="fas fa-sync-alt" aria-hidden="true"></i></button>
    </div>
    <div class="row">
      <div class="col-md-6">
        <a class="card ds-carte ds-tuile" id="ds-carte-sous" href="index.php?page=sous_minimum">
          <span>
            <span class="ds-titre" id="ds-t-sous">À recommander</span>
            <span class="ds-ligne-nombre"><span class="ds-nombre" id="ds-sous">…</span> <span class="ds-unite" id="ds-sous-unite">pièces</span></span>
          </span>
          <i class="fas fa-chevron-right ds-fleche no-print" aria-hidden="true"></i>
        </a>
      </div>
      <div class="col-md-6">
        <a class="card ds-carte ds-tuile" id="ds-jour-lien" href="index.php?page=historique&amp;du=<?php echo e($aujourdhui); ?>&amp;au=<?php echo e($aujourdhui); ?>">
          <span>
            <span class="ds-titre" id="ds-t-jour">Aujourd'hui</span>
            <span class="ds-ligne-nombre"><span class="ds-nombre" id="ds-jour">…</span> <span class="ds-unite" id="ds-jour-unite">mouvements</span></span>
          </span>
          <i class="fas fa-chevron-right ds-fleche no-print" aria-hidden="true"></i>
        </a>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="wk no-print-graph" id="ds-widgets">
      <div class="grid grid--2-1">
        <section class="widget" aria-labelledby="ds-t-act">
          <div class="widget__head">
            <h2 class="widget__title" id="ds-t-act">7 derniers jours</h2>
            <span class="no-print"><a class="gr-btn" href="index.php?page=historique">Historique</a> <a class="gr-btn" href="index.php?page=documents">Documents</a></span>
          </div>
          <div class="gr-valeur"><span class="gr-grand" id="gr-total">0</span><span class="gr-unite">mouvements</span></div>
          <div id="gr-graph" aria-label="Mouvements par jour sur les sept derniers jours"></div>
          <div class="gr-lectures" id="gr-lectures"></div>
        </section>
        <section class="widget widget--center" aria-labelledby="ds-t-cov">
          <h2 class="widget__title" id="ds-t-cov" style="align-self:stretch">Pièces en stock</h2>
          <div class="ring ring--lg" id="gr-ring" aria-label="Part des pièces actives qui ont du stock"></div>
          <p class="widget__sub" id="gr-ring-txt">&nbsp;</p>
        </section>
      </div>
      <div class="grid grid--auto">
        <section class="widget" aria-labelledby="ds-t-type">
          <h2 class="widget__title" id="ds-t-type">Mouvements par type</h2>
          <div id="gr-types"></div>
          <p class="widget__sub" id="gr-types-vide" hidden>Aucun mouvement.</p>
        </section>
        <?php if ($gest) { ?>
        <section class="widget" aria-labelledby="ds-t-fact">
          <div class="widget__head">
            <h2 class="widget__title" id="ds-t-fact">Factures du mois <span class="font-weight-normal text-muted" id="ds-mois"></span></h2>
            <a class="gr-btn no-print" href="index.php?page=factures_internes">Factures</a>
          </div>
          <div class="legend"><span class="legend__item" style="--c:var(--indigo)">Émis</span><span class="legend__item" style="--c:var(--sky)">Reçu</span></div>
          <div id="gr-fact"></div>
          <div id="ds-factures" class="ds-factures">…</div>
        </section>
        <section class="widget" aria-labelledby="ds-t-val">
          <div class="widget__head">
            <h2 class="widget__title" id="ds-t-val">Valeur du stock</h2>
            <a class="gr-btn no-print" href="index.php?page=valeur_inventaire">Détail</a>
          </div>
          <div class="progress" id="gr-valeur"></div>
        </section>
        <?php } ?>
      </div>
    </div>

  </div></section>
</div>
