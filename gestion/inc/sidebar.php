<?php
// Menu principal. Chaque entrée : page, libellé, icône, rôle minimum, pages « sœurs » qui l'activent.
$menu = array(
  'Opérations' => array(
    array('dashboard',       'Tableau de bord',        'fa-tachometer-alt',      'employe',      array()),
    array('scanner',         'Scanner / Chercher',     'fa-barcode',             'employe',      array()),
    array('stock',           'Stock',                  'fa-boxes',               'employe',      array()),
    array('reception',       'Réception',              'fa-truck-loading',       'gestionnaire', array()),
    array('transfert',       'Transfert',              'fa-exchange-alt',        'employe',      array()),
    array('sortie',          'Sortie (utilisation)',   'fa-sign-out-alt',        'employe',      array()),
    array('ajustement',      'Ajustement',             'fa-sliders-h',           'gestionnaire', array()),
    array('facture_interne', 'Facture interne',        'fa-file-invoice-dollar', 'gestionnaire', array()),
    array('comptage',        'Comptage',               'fa-clipboard-check',     'employe',      array('comptage_voir')),
  ),
  'Catalogue' => array(
    array('pieces',          'Pièces',                 'fa-cogs',                'employe',      array('piece_voir', 'piece_edit', 'pieces_import')),
    array('fournisseurs',    'Fournisseurs',           'fa-industry',            'gestionnaire', array()),
    array('categories',      'Catégories',             'fa-tags',                'gestionnaire', array()),
    array('etiquettes',      'Étiquettes code-barres', 'fa-print',               'gestionnaire', array()),
  ),
  'Rapports' => array(
    array('documents',          'Documents',               'fa-file-alt',            'employe',      array('document_voir')),
    array('historique',         'Historique des mouvements','fa-history',            'employe',      array()),
    array('sous_minimum',       'Sous le minimum',         'fa-exclamation-triangle','employe',      array()),
    array('factures_internes',  'Factures internes',       'fa-list',                'gestionnaire', array('facture_interne_voir')),
    array('bilan_mensuel',      'Bilan mensuel',           'fa-balance-scale',       'gestionnaire', array()),
    array('valeur_inventaire',  'Valeur de l\'inventaire', 'fa-dollar-sign',         'gestionnaire', array()),
  ),
  'Administration' => array(
    array('utilisateurs',    'Utilisateurs',           'fa-users',               'admin',        array()),
    array('entreprises',     'Entreprises',            'fa-building',            'admin',        array()),
    array('emplacements',    'Emplacements',           'fa-warehouse',           'admin',        array()),
    array('journal',         'Journal d\'activité',    'fa-clipboard-list',      'admin',        array()),
    array('backup_database', 'Sauvegarde',             'fa-database',            'admin',        array()),
  ),
);
?>
  <aside class="main-sidebar sidebar-dark-primary elevation-2 no-print">
    <a href="index.php" class="brand-link">
      <span class="brand-text font-weight-bold pl-3"><i class="fas fa-fire-alt text-warning mr-1"></i> Beauchemin</span>
    </a>
    <div class="sidebar">
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
          <?php foreach ($menu as $section => $items) {
            $visibles = array_filter($items, function ($i) use ($Ouser) { return $Ouser->aRole($i[3]); });
            if (!$visibles) { continue; } ?>
            <li class="nav-header"><?php echo e(mb_strtoupper($section)); ?></li>
            <?php foreach ($visibles as $i) {
              $actif = ($page_courante === $i[0] || in_array($page_courante, $i[4], true)); ?>
              <li class="nav-item">
                <a href="index.php?page=<?php echo e($i[0]); ?>" class="nav-link<?php echo $actif ? ' active' : ''; ?>">
                  <i class="nav-icon fas <?php echo e($i[2]); ?>"></i>
                  <p><?php echo e($i[1]); ?></p>
                </a>
              </li>
            <?php } ?>
          <?php } ?>
        </ul>
      </nav>
    </div>
  </aside>
