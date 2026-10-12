<?php
// Plan de l'entrepôt (employé+) : une tuile par emplacement actif, ce qu'il contient, « où est cette pièce ? » en haut, mise à jour en direct.
// L'administrateur peut aussi disposer les tuiles à sa guise (écran large). Deux vues des mêmes données : « 3D » (scène isométrique Three.js,
// assets/js/plan3d.bundle.js construit par tools/plan3d, interface dans assets/js/plan3d-ui.js) et « Tuiles » (la vue accessible au clavier et de repli).
// Données de départ dans data-donnees (aucun JavaScript en ligne) ; le reste est dans assets/js/plan.js, assets/css/plan.css, plan3d.css et app/classes/Plan.php.
// Aucun prix ni coût, pour aucun rôle.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/classes/Plan.php';
page_script('assets/js/plan3d.bundle.js');
page_script('assets/js/plan3d-ui.js');
page_script('assets/js/plan.js');
$donnees = (new Plan($pdo, inventaire()))->donnees(utilisateur_id());
$admin = $donnees['admin'];
?>
<link rel="stylesheet" href="assets/css/plan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/plan.css'); ?>">
<link rel="stylesheet" href="assets/css/plan3d.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/plan3d.css'); ?>">
<div class="content-wrapper pl-page" id="page-plan" data-admin="<?php echo $admin ? '1' : '0'; ?>" data-donnees="<?php echo e(json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)); ?>">
  <?php page_titre('Plan'); ?>
  <section class="content"><div class="container-fluid">

    <div class="pl-barre no-print">
      <div class="scan-box pl-scan">
        <i class="fas fa-search pl-scan-icone" aria-hidden="true"></i>
        <label for="pl-recherche" class="sr-only">Chercher une pièce ou scanner son code</label>
        <input id="pl-recherche" type="text" class="form-control scan-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="64"
               placeholder="Chercher ou scanner" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="pl-suggestions">
        <button type="button" class="pl-croix" id="pl-vider" aria-label="Effacer la recherche" hidden><i class="fas fa-times" aria-hidden="true"></i></button>
        <ul id="pl-suggestions" class="pl-suggestions" role="listbox" aria-label="Pièces trouvées" hidden></ul>
      </div>
      <div class="pl-outils">
        <span class="pl-vues" id="pl-vues" role="group" aria-label="Vue" hidden>
          <button type="button" class="pl-vue" id="pl-vue-3d" data-vue="3d" aria-pressed="false" title="Vue 3D"><i class="fas fa-cube" aria-hidden="true"></i><span>3D</span></button>
          <button type="button" class="pl-vue" id="pl-vue-tuiles" data-vue="tuiles" aria-pressed="true" title="Vue Tuiles"><i class="fas fa-th-large" aria-hidden="true"></i><span>Tuiles</span></button>
        </span>
        <span id="pl-direct" class="pl-direct" role="status"><span class="pl-point" aria-hidden="true"></span><span id="pl-direct-texte">En direct</span></span>
        <?php if ($admin) { ?>
        <button type="button" class="btn btn-outline-secondary" id="pl-modifier"><i class="fas fa-pen mr-1" aria-hidden="true"></i> Modifier le plan</button>
        <span class="pl-edition-boutons" id="pl-edition-boutons" hidden>
          <button type="button" class="btn btn-outline-secondary" id="pl-ranger" title="Remettre les tuiles en ordre"><i class="fas fa-th-large mr-1" aria-hidden="true"></i> Tout ranger</button>
          <button type="button" class="btn btn-outline-secondary" id="pl-annuler">Annuler</button>
          <button type="button" class="btn btn-primary" id="pl-enregistrer">Enregistrer</button>
        </span>
        <?php } ?>
      </div>
    </div>

    <div id="pl-bandeau" class="pl-bandeau no-print" role="status" hidden></div>

    <div class="card pl-carte"><div class="card-body">
      <div id="pl-3d" class="pl3 no-print" hidden>
        <div class="pl3-scene" id="pl3-scene" data-libelle="Vue 3D de l'entrepôt. La liste des emplacements est disponible dans la vue Tuiles."></div>
        <div class="pl3-etiquettes" id="pl3-etiquettes"></div>
        <div class="pl3-stats" id="pl3-stats" role="group" aria-label="Résumé">
          <div class="pl3-stat" id="pl3-stat-unites"><span class="pl3-stat-ico" aria-hidden="true"><i class="fas fa-boxes"></i></span><span class="pl3-stat-txt"><span class="pl3-stat-nom">Unités en stock</span><b class="pl3-stat-val" id="pl3-unites">0</b></span><span class="pl3-delta-carte" id="pl3-delta" hidden></span></div>
          <div class="pl3-stat" id="pl3-stat-bas"><span class="pl3-stat-ico" aria-hidden="true"><i class="fas fa-exclamation-triangle"></i></span><span class="pl3-stat-txt"><span class="pl3-stat-nom">Sous le minimum</span><b class="pl3-stat-val" id="pl3-bas">0</b></span></div>
          <div class="pl3-stat" id="pl3-stat-emp"><span class="pl3-stat-ico" aria-hidden="true"><i class="fas fa-warehouse"></i></span><span class="pl3-stat-txt"><span class="pl3-stat-nom">Emplacements</span><b class="pl3-stat-val" id="pl3-emp">0</b></span></div>
        </div>
        <div class="pl3-outils" id="pl3-outils" role="toolbar" aria-label="Caméra">
          <button type="button" class="pl3-btn" data-act="plus" aria-label="Zoom avant" title="Zoom avant"><i class="fas fa-plus" aria-hidden="true"></i></button>
          <button type="button" class="pl3-btn" data-act="moins" aria-label="Zoom arrière" title="Zoom arrière"><i class="fas fa-minus" aria-hidden="true"></i></button>
          <button type="button" class="pl3-btn pl3-sep" data-act="gauche" aria-label="Pivoter à gauche" title="Pivoter à gauche"><i class="fas fa-undo-alt" aria-hidden="true"></i></button>
          <button type="button" class="pl3-btn" data-act="droite" aria-label="Pivoter à droite" title="Pivoter à droite"><i class="fas fa-redo-alt" aria-hidden="true"></i></button>
          <button type="button" class="pl3-btn pl3-sep" data-act="centrer" aria-label="Recentrer" title="Recentrer"><i class="fas fa-home" aria-hidden="true"></i></button>
        </div>
      </div>
      <div id="pl-plan" class="pl-plan" role="group" aria-label="Plan de l'entrepôt">
        <div id="pl-surface" class="pl-surface"></div>
        <p id="pl-vide" class="pl-vide-plan" hidden>Aucun emplacement.<?php if ($admin) { ?> <a href="index.php?page=emplacements">Ajouter un emplacement</a><?php } ?></p>
      </div>
    </div></div>

  </div></section>

  <aside id="pl-tiroir" class="pl-tiroir no-print" role="dialog" aria-modal="false" aria-labelledby="pl-tiroir-titre" hidden>
    <div class="pl-tiroir-tete">
      <span class="pl-icone" id="pl-tiroir-icone" aria-hidden="true"><i class="fas fa-warehouse"></i></span>
      <div class="pl-tiroir-titres">
        <h2 id="pl-tiroir-titre" tabindex="-1"></h2>
        <div class="pl-tiroir-sous" id="pl-tiroir-sous"></div>
      </div>
      <button type="button" class="pl-croix" id="pl-tiroir-fermer" aria-label="Fermer"><i class="fas fa-times" aria-hidden="true"></i></button>
    </div>
    <div class="pl-tiroir-resume" id="pl-tiroir-resume"></div>
    <div class="pl-tiroir-recherche">
      <label for="pl-filtre" class="sr-only">Chercher dans cet emplacement</label>
      <input id="pl-filtre" type="search" class="form-control" autocomplete="off" maxlength="100" placeholder="Chercher ici">
    </div>
    <ul class="pl-lignes" id="pl-lignes" aria-label="Pièces de l'emplacement"></ul>
    <div class="pl-tiroir-pied">
      <a class="btn btn-outline-secondary" id="pl-voir-stock" href="index.php?page=stock"><i class="fas fa-boxes mr-1" aria-hidden="true"></i> Voir dans Stock</a>
    </div>
  </aside>
</div>
