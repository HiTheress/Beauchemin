<?php
// Menu principal. Une entrée seule : array('page', libellé, icône, rôle minimum, pages « sœurs » qui l'activent).
// Un groupe repliable : array('groupe' => titre, 'icone' => icône, 'items' => array(entrées…)). Un groupe sans entrée visible n'est pas affiché ;
// le groupe qui contient la page courante s'ouvre tout seul.
$menu = array(
  array('dashboard', 'Tableau de bord',    'fa-tachometer-alt', 'employe', array()),
  array('scanner',   'Scanner / Chercher', 'fa-barcode',        'employe', array()),
  array('stock',     'Stock',              'fa-boxes',          'employe', array()),
  array('groupe' => 'Mouvements', 'icone' => 'fa-exchange-alt', 'items' => array(
    array('reception',  'Réception',            'fa-truck-loading',   'gestionnaire', array()),
    array('transfert',  'Transfert',            'fa-exchange-alt',    'employe',      array()),
    array('sortie',     'Sortie (utilisation)', 'fa-sign-out-alt',    'employe',      array()),
    array('ajustement', 'Ajustement',           'fa-sliders-h',       'gestionnaire', array()),
    array('comptage',   'Comptage',             'fa-clipboard-check', 'employe',      array('comptage_voir')),
  )),
  array('groupe' => 'Entre entreprises', 'icone' => 'fa-handshake', 'items' => array(
    array('facture_interne',   'Nouvelle facture interne', 'fa-file-invoice-dollar', 'gestionnaire', array()),
    array('factures_internes', 'Factures internes',        'fa-list',                'gestionnaire', array('facture_interne_voir')),
    array('bilan_mensuel',     'Bilan mensuel',            'fa-balance-scale',       'gestionnaire', array()),
  )),
  array('groupe' => 'Catalogue', 'icone' => 'fa-cogs', 'items' => array(
    array('pieces',        'Pièces',               'fa-cogs',     'employe',      array('piece_voir', 'piece_edit')),
    array('pieces_import', 'Importer des pièces',  'fa-file-import', 'gestionnaire', array()),
    array('fournisseurs',  'Fournisseurs',         'fa-industry', 'gestionnaire', array()),
    array('categories',    'Catégories',           'fa-tags',     'gestionnaire', array()),
    array('etiquettes',    'Étiquettes code-barres', 'fa-print',  'gestionnaire', array()),
  )),
  array('groupe' => 'Rapports', 'icone' => 'fa-chart-bar', 'items' => array(
    array('documents',         'Documents',                'fa-file-alt',            'employe',      array('document_voir')),
    array('historique',        'Historique',                'fa-history',            'employe',      array()),
    array('sous_minimum',      'Sous le minimum',          'fa-exclamation-triangle','employe',      array()),
    array('valeur_inventaire', 'Valeur de l\'inventaire',  'fa-dollar-sign',         'gestionnaire', array()),
  )),
  array('groupe' => 'Administration', 'icone' => 'fa-user-shield', 'items' => array(
    array('utilisateurs',    'Utilisateurs',        'fa-users',          'admin', array()),
    array('entreprises',     'Entreprises',         'fa-building',       'admin', array()),
    array('emplacements',    'Emplacements',        'fa-warehouse',      'admin', array()),
    array('journal',         'Journal d\'activité', 'fa-clipboard-list', 'admin', array()),
    array('backup_database', 'Sauvegarde',          'fa-database',       'admin', array()),
  )),
);
$entree_active = function ($i) use ($page_courante) { return $page_courante === $i[0] || in_array($page_courante, $i[4], true); };
?>
  <aside class="main-sidebar sidebar-dark-primary elevation-2 no-print">
    <a href="index.php" class="brand-link" aria-label="Accueil">
      <?php if ($marque === 'neutre') { ?>
        <span class="marque-duo">
          <img class="sur-blanc" src="assets/img/logo-beauchemin.png" alt="Beauchemin — Mazout et propane">
          <img src="assets/img/logo-boutique-chaleur.png" alt="Boutique Chaleur">
        </span>
      <?php } else { ?>
        <img class="marque-logo<?php echo $marque === 'bea' ? ' sur-blanc' : ''; ?>" src="assets/img/logo-<?php echo e($marque_slug[$marque]); ?>.png" alt="<?php echo $marque === 'bea' ? 'Beauchemin — Mazout et propane' : 'Boutique Chaleur'; ?>">
      <?php } ?>
      <span class="marque-icones" aria-hidden="true">
        <?php if ($marque !== 'bch') { ?><img src="assets/img/icone-beauchemin.svg" alt=""><?php } ?>
        <?php if ($marque !== 'bea') { ?><img src="assets/img/icone-boutique-chaleur.svg" alt=""><?php } ?>
      </span>
    </a>
    <div class="sidebar">
      <nav class="mt-2" aria-label="Menu principal">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="true">
          <?php foreach ($menu as $m) {
            if (!isset($m['groupe'])) {
              if (!$Ouser->aRole($m[3])) { continue; }
              $actif = $entree_active($m); ?>
              <li class="nav-item">
                <a href="index.php?page=<?php echo e($m[0]); ?>" class="nav-link<?php echo $actif ? ' active' : ''; ?>"<?php echo $actif ? ' aria-current="page"' : ''; ?>>
                  <i class="nav-icon fas <?php echo e($m[2]); ?>"></i>
                  <p><?php echo e($m[1]); ?></p>
                </a>
              </li>
            <?php continue; }
            $visibles = array_filter($m['items'], function ($i) use ($Ouser) { return $Ouser->aRole($i[3]); });
            if (!$visibles) { continue; }
            $ouvert = false;
            foreach ($visibles as $i) { if ($entree_active($i)) { $ouvert = true; } } ?>
            <li class="nav-item has-treeview<?php echo $ouvert ? ' menu-open groupe-actif' : ''; ?>">
              <a href="#" class="nav-link" role="button" aria-expanded="<?php echo $ouvert ? 'true' : 'false'; ?>">
                <i class="nav-icon fas <?php echo e($m['icone']); ?>"></i>
                <p><?php echo e($m['groupe']); ?><i class="right fas fa-angle-left"></i></p>
              </a>
              <ul class="nav nav-treeview">
                <?php foreach ($visibles as $i) { $actif = $entree_active($i); ?>
                <li class="nav-item">
                  <a href="index.php?page=<?php echo e($i[0]); ?>" class="nav-link<?php echo $actif ? ' active' : ''; ?>"<?php echo $actif ? ' aria-current="page"' : ''; ?>>
                    <i class="nav-icon far fa-circle"></i>
                    <p><?php echo e($i[1]); ?></p>
                  </a>
                </li>
                <?php } ?>
              </ul>
            </li>
          <?php } ?>
        </ul>
      </nav>
    </div>
  </aside>
