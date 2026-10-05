<?php
// Création (sans id) et modification (id) d'une pièce. Gestionnaire+.
if (!acces_page('gestionnaire')) { return; }
require_once __DIR__ . '/../app/action/piece_lib.php';     // classe Catalogue (formats de saisie)
page_script('assets/js/catalogue.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 12) ? (int) $_GET['id'] : 0;
$piece = null;
if ($id) {
	$st = $pdo->prepare('SELECT * FROM pieces WHERE id = ?');
	$st->execute(array($id));
	$piece = $st->fetch();
	if (!$piece) { ?>
<div class="content-wrapper"><?php page_titre('Pièce introuvable', array('Catalogue', 'Pièces')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning">Cette pièce n'existe pas. <a class="alert-link" href="index.php?page=pieces">Retour à la liste des pièces</a></div>
  </div></section>
</div>
<?php return; }
}
$ents = inventaire()->listeEntreprises(utilisateur_id());
$cats = $pdo->query('SELECT id, nom FROM categories ORDER BY nom')->fetchAll();
$a_mouvements = false;
$alias = array();
$seuils = array();
if ($piece) {
	$st = $pdo->prepare('SELECT 1 FROM mouvements WHERE piece_id = ? LIMIT 1');
	$st->execute(array($id));
	$a_mouvements = (bool) $st->fetch();
	$st = $pdo->prepare('SELECT code, type FROM pieces_codes WHERE piece_id = ? ORDER BY id');
	$st->execute(array($id));
	$alias = $st->fetchAll();
	$st = $pdo->prepare('SELECT entreprise_id, minimum FROM seuils WHERE piece_id = ?');
	$st->execute(array($id));
	foreach ($st->fetchAll() as $r) { $seuils[(int) $r['entreprise_id']] = $r['minimum']; }
}
// Pièce créée à l'instant (« Enregistrer et créer une autre »)
$creee = null;
if (!$piece && isset($_GET['cree']) && is_string($_GET['cree']) && ctype_digit($_GET['cree']) && strlen($_GET['cree']) < 12) {
	$st = $pdo->prepare('SELECT id, code, nom FROM pieces WHERE id = ?');
	$st->execute(array((int) $_GET['cree']));
	$creee = $st->fetch() ?: null;
}
$v = function ($k, $defaut = '') use ($piece) { return $piece ? (string) ($piece[$k] === null ? '' : $piece[$k]) : $defaut; };
$donnees = array('alias' => $alias);
if ($piece) {
	// version de la pièce au moment de l'ouverture du formulaire : renvoyée à l'enregistrement (refus si quelqu'un l'a modifiée entre-temps)
	$donnees['empreinte'] = Catalogue::empreinte($id, array_map(function ($en) { return (int) $en['id']; }, $ents));
}
$flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE;
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="piece_edit">
  <?php page_titre($piece ? 'Modifier la pièce ' . $piece['code'] : 'Nouvelle pièce', array('Catalogue', 'Pièces')); ?>
  <section class="content"><div class="container-fluid">

    <?php if ($creee) { ?>
      <div class="alert alert-success" role="status">La pièce « <?php echo e($creee['code']); ?> — <?php echo e($creee['nom']); ?> » a été créée.
        <a class="alert-link" href="index.php?page=piece_voir&amp;id=<?php echo (int) $creee['id']; ?>">Voir la fiche</a>. Vous pouvez en créer une autre.</div>
    <?php } ?>

    <form id="form-piece" class="cat-form" novalidate data-piece-id="<?php echo (int) $id; ?>" data-piece-code="<?php echo e($v('code')); ?>" data-actif="<?php echo ($piece && $piece['actif']) ? '1' : '0'; ?>">
      <div class="alert alert-danger" role="alert" id="erreur-form" hidden></div>
      <div class="row">
        <div class="col-lg-7">
          <div class="card"><div class="card-header"><h3 class="card-title">Identité</h3></div>
            <div class="card-body">
              <div class="form-group">
                <label for="f-code">Code interne <span class="text-danger" aria-hidden="true">*</span></label>
                <div class="input-group">
                  <input id="f-code" name="code" class="form-control code<?php echo $a_mouvements ? ' cat-code-fige' : ''; ?>" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase"
                         value="<?php echo e($v('code')); ?>"<?php echo $a_mouvements ? ' readonly aria-describedby="aide-code-fige"' : ' aria-describedby="aide-code"'; ?>>
                  <?php if (!$a_mouvements) { ?>
                    <div class="input-group-append"><button type="button" class="btn btn-outline-secondary" id="btn-proposer"><i class="fas fa-magic mr-1" aria-hidden="true"></i> Proposer un code</button></div>
                  <?php } ?>
                </div>
                <div class="text-danger small mt-1" data-erreur-pour="code" hidden></div>
                <?php if ($a_mouvements) { ?>
                  <small id="aide-code-fige" class="form-text text-muted"><i class="fas fa-lock mr-1" aria-hidden="true"></i> Ce code ne peut plus être modifié : la pièce a déjà des mouvements et ses étiquettes imprimées deviendraient invalides. Ajoutez plutôt un code-barres alias.</small>
                <?php } else { ?>
                  <small id="aide-code" class="form-text text-muted">C'est le code imprimé sur les étiquettes (Code 128). Permis : lettres majuscules (A-Z), chiffres et les symboles . - _ / (40 caractères au plus, sans espace ni accent). Il ne pourra plus être changé après le premier mouvement.</small>
                <?php } ?>
              </div>
              <div class="form-group">
                <label for="f-nom">Nom <span class="text-danger" aria-hidden="true">*</span></label>
                <input id="f-nom" name="nom" class="form-control" maxlength="150" autocomplete="off" value="<?php echo e($v('nom')); ?>">
                <div class="text-danger small mt-1" data-erreur-pour="nom" hidden></div>
              </div>
              <div class="form-group">
                <label for="f-description">Description</label>
                <textarea id="f-description" name="description" class="form-control" rows="3" maxlength="5000"><?php echo e($v('description')); ?></textarea>
                <div class="text-danger small mt-1" data-erreur-pour="description" hidden></div>
              </div>
              <div class="form-group">
                <label for="f-categorie">Catégorie</label>
                <div class="input-group">
                  <select id="f-categorie" name="categorie_id" class="form-control">
                    <option value="">— Sans catégorie —</option>
                    <?php foreach ($cats as $c) { ?>
                      <option value="<?php echo (int) $c['id']; ?>"<?php echo ($piece && (int) $piece['categorie_id'] === (int) $c['id']) ? ' selected' : ''; ?>><?php echo e($c['nom']); ?></option>
                    <?php } ?>
                  </select>
                  <div class="input-group-append"><button type="button" class="btn btn-outline-secondary" id="btn-nouvelle-categorie"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Nouvelle catégorie</button></div>
                </div>
                <div class="text-danger small mt-1" data-erreur-pour="categorie_id" hidden></div>
                <div id="bloc-nouvelle-categorie" class="mt-2 p-2 border rounded bg-light" hidden>
                  <label for="nc-nom">Nom de la nouvelle catégorie</label>
                  <div class="input-group">
                    <input id="nc-nom" class="form-control" maxlength="100" autocomplete="off">
                    <div class="input-group-append">
                      <button type="button" class="btn btn-success" id="btn-creer-categorie">Créer</button>
                      <button type="button" class="btn btn-outline-secondary" id="btn-annuler-categorie">Annuler</button>
                    </div>
                  </div>
                  <div class="text-danger small mt-1" id="nc-erreur" role="alert" hidden></div>
                </div>
              </div>
              <div class="form-group">
                <label for="f-unite">Unité de mesure <span class="text-danger" aria-hidden="true">*</span></label>
                <input id="f-unite" name="unite" class="form-control" maxlength="20" autocomplete="off" list="unites-suggerees" value="<?php echo e($v('unite', 'unité')); ?>">
                <datalist id="unites-suggerees">
                  <?php foreach (array('unité', 'paire', 'm', 'pi', 'kg', 'L', 'boîte', 'rouleau', 'lot') as $u) { ?><option value="<?php echo e($u); ?>"></option><?php } ?>
                </datalist>
                <small class="form-text text-muted">Choisissez une suggestion ou tapez la vôtre (20 caractères au plus).</small>
                <div class="text-danger small mt-1" data-erreur-pour="unite" hidden></div>
              </div>
              <?php if ($piece) { ?>
              <div class="custom-control custom-switch mb-2">
                <input type="checkbox" class="custom-control-input" id="f-actif"<?php echo $piece['actif'] ? ' checked' : ''; ?>>
                <label class="custom-control-label" for="f-actif">Pièce active (offerte dans les listes de saisie)</label>
              </div>
              <?php } ?>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card"><div class="card-header"><h3 class="card-title">Codes-barres alias</h3></div>
            <div class="card-body">
              <p class="text-muted small">Autres codes qui retrouvent cette pièce au scan (code du fabricant, du fournisseur…). Choisissez d'abord le type, puis scannez le code dans le champ (Entrée ou Tab pour l'ajouter).</p>
              <div class="form-group mb-2"><label for="f-alias-type" class="mb-1">Type du code</label>
                <select id="f-alias-type" class="form-control"><option value="fabricant">Fabricant</option><option value="fournisseur">Fournisseur</option><option value="autre">Autre</option></select></div>
              <label for="f-alias" class="mb-1">Code-barres à ajouter</label>
              <div class="scan-box mb-2"><div class="input-group">
                <input id="f-alias" class="form-control code" maxlength="64" autocomplete="off" spellcheck="false" placeholder="Scannez ou tapez un code">
                <div class="input-group-append"><button type="button" class="btn btn-outline-primary" id="btn-alias"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Ajouter</button></div>
              </div></div>
              <div class="text-danger small" data-erreur-pour="codes" hidden></div>
              <ul class="cat-alias-liste" id="liste-alias" aria-live="polite"></ul>
            </div>
          </div>

          <div class="card"><div class="card-header"><h3 class="card-title">Minimum fixé</h3></div>
            <div class="card-body">
              <p class="text-muted small">Sous ce total, la pièce apparaît dans « Sous le minimum » (un minimum par entreprise). <strong>0 ou vide = pas d'alerte.</strong></p>
              <?php if (!$ents) { ?><p class="text-muted mb-0">Aucune entreprise accessible.</p><?php } else { ?>
              <table class="table table-sm mb-0"><tbody>
                <?php foreach ($ents as $en) { $eid = (int) $en['id']; ?>
                <tr>
                  <td class="align-middle"><label for="seuil-<?php echo $eid; ?>" class="mb-0"><?php echo e($en['nom']); ?></label></td>
                  <td style="width:9rem"><input id="seuil-<?php echo $eid; ?>" name="seuil_<?php echo $eid; ?>" class="form-control nombre champ-seuil" data-entreprise="<?php echo $eid; ?>" inputmode="decimal" autocomplete="off" placeholder="0"
                      value="<?php echo e(isset($seuils[$eid]) ? Catalogue::nombreSaisie($seuils[$eid]) : ''); ?>"></td>
                </tr>
                <?php } ?>
              </tbody></table>
              <div class="text-danger small mt-1" data-erreur-pour="seuils" hidden></div>
              <?php } ?>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 cat-actions no-print">
        <button type="submit" class="btn btn-primary" id="btn-enregistrer"><i class="fas fa-save mr-1" aria-hidden="true"></i> Enregistrer</button>
        <?php if (!$piece) { ?><button type="button" class="btn btn-outline-primary" id="btn-enregistrer-nouveau">Enregistrer et créer une autre pièce</button><?php } ?>
        <a class="btn btn-outline-secondary" href="<?php echo $piece ? 'index.php?page=piece_voir&amp;id=' . (int) $id : 'index.php?page=pieces'; ?>">Annuler</a>
      </div>
    </form>
    <script type="application/json" id="donnees-piece"><?php echo json_encode($donnees, $flags); ?></script>
  </div></section>
</div>
