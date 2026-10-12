<?php
// Plan de l'entrepôt (employé+) : une tuile par emplacement actif, ce qu'il contient, « où est cette pièce ? » en haut, mise à jour en direct.
// L'administrateur peut aussi disposer les tuiles à sa guise (écran large). Données de départ dans data-donnees (aucun JavaScript en ligne) ;
// le reste est dans assets/js/plan.js, assets/css/plan.css et app/classes/Plan.php. Aucun prix ni coût, pour aucun rôle.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/classes/Plan.php';
page_script('assets/js/plan.js');
$donnees = (new Plan($pdo, inventaire()))->donnees(utilisateur_id());
$admin = $donnees['admin'];
?>
<link rel="stylesheet" href="assets/css/plan.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/plan.css'); ?>">
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
