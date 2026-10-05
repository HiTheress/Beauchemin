<?php
// Fiche d'une pièce : identité, codes-barres, stock, (gestionnaire+ : coûts et prix fournisseurs), derniers mouvements.
if (!acces_page('employe')) { return; }
page_script('assets/js/catalogue.js');
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 12) ? (int) $_GET['id'] : 0;
$gest = $Ouser->aRole('gestionnaire');
$couts = $Ouser->peutVoirCouts();
$p = null;
try { $p = inventaire()->pieceDetail(utilisateur_id(), $id); } catch (InventaireException $ex) { $p = null; }
if (!$p) { ?>
<div class="content-wrapper"><?php page_titre('Pièce introuvable', array('Catalogue', 'Pièces')); ?>
  <section class="content"><div class="container-fluid">
    <div class="alert alert-warning">Cette pièce n'existe pas. <a class="alert-link" href="index.php?page=pieces">Retour à la liste des pièces</a></div>
  </div></section>
</div>
<?php return; }

$actif = (bool) $p['actif'];
$a_du_stock = false;
foreach ($p['totaux'] as $t) { if (Dec::parse($t['quantite'], Dec::QTE) > 0) { $a_du_stock = true; } }
$ents = inventaire()->listeEntreprises(utilisateur_id());
$ids_ent = array_map(function ($en) { return (int) $en['id']; }, $ents);

// Minimums par entreprise accessible
$minimums = array();
if ($ids_ent) {
	$in = implode(',', array_fill(0, count($ids_ent), '?'));
	$st = $pdo->prepare("SELECT entreprise_id, minimum FROM seuils WHERE piece_id = ? AND entreprise_id IN ($in)");
	$st->execute(array_merge(array($p['id']), $ids_ent));
	foreach ($st->fetchAll() as $r) { $minimums[(int) $r['entreprise_id']] = $r['minimum']; }
}
// Stock regroupé par entreprise
$stock_par_ent = array();
foreach ($p['stock'] as $s) { $stock_par_ent[(int) $s['entreprise_id']][] = $s; }
$totaux = array();
foreach ($p['totaux'] as $t) { $totaux[(int) $t['entreprise_id']] = $t['quantite']; }

// 20 derniers mouvements (entreprises accessibles seulement)
$mouvements = array();
if ($ids_ent) {
	$st = $pdo->prepare(
		"SELECT m.date_mouvement, m.quantite, m.est_annulation, d.id AS document_id, d.numero, d.type, d.statut, e.nom AS emplacement, COALESCE(NULLIF(us.nom_complet, ''), us.nom_utilisateur) AS utilisateur
		   FROM mouvements m JOIN documents d ON d.id = m.document_id JOIN emplacements e ON e.id = m.emplacement_id
		   LEFT JOIN utilisateurs us ON us.id = m.utilisateur_id
		  WHERE m.piece_id = ? AND e.entreprise_id IN ($in) ORDER BY m.id DESC LIMIT 20"
	);
	$st->execute(array_merge(array($p['id']), $ids_ent));
	$mouvements = $st->fetchAll();
}
$TYPES_CODE = array('fabricant' => 'Fabricant', 'fournisseur' => 'Fournisseur', 'autre' => 'Autre');
$codes = array(array('Interne', $p['code']));
foreach ($p['codes'] as $c) { $codes[] = array($TYPES_CODE[$c['type']], $c['code']); }
$MESSAGES = array(
	'cree' => 'La pièce « ' . $p['code'] . ' » a été créée.', 'modifie' => 'Les modifications de la pièce « ' . $p['code'] . ' » ont été enregistrées.',
	'desactivee' => 'La pièce « ' . $p['code'] . ' » a été désactivée.', 'reactivee' => 'La pièce « ' . $p['code'] . ' » a été réactivée.',
);
$msg = (isset($_GET['msg']) && is_string($_GET['msg']) && isset($MESSAGES[$_GET['msg']])) ? $MESSAGES[$_GET['msg']] : null;
$pid = (int) $p['id'];
?>
<link rel="stylesheet" href="assets/css/catalogue.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/catalogue.css'); ?>">
<div class="content-wrapper" data-catalogue="piece_voir" data-piece-id="<?php echo $pid; ?>" data-piece-code="<?php echo e($p['code']); ?>">
  <?php page_titre($p['code'] . ' — ' . $p['nom'], array('Catalogue', 'Pièces')); ?>
  <section class="content"><div class="container-fluid">
    <div class="cat-titre-impression"><div class="titre"><?php echo e($p['code'] . ' — ' . $p['nom']); ?></div></div>

    <?php if ($msg) { ?><div class="alert alert-success" role="status"><?php echo e($msg); ?></div><?php } ?>
    <?php if (!$actif) { ?><div class="alert alert-secondary" role="status"><i class="fas fa-ban mr-1" aria-hidden="true"></i> Cette pièce est <strong>désactivée</strong> : elle n'apparaît plus dans les listes de saisie et ne peut plus être reçue<?php echo $a_du_stock ? ', mais son stock peut encore être transféré ou sorti' : ''; ?>. Son historique est conservé.</div><?php } ?>

    <div class="mb-3 cat-actions no-print">
      <a class="btn btn-outline-secondary" href="index.php?page=pieces"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i> Liste des pièces</a>
      <?php if ($gest) { ?>
        <a class="btn btn-primary" href="index.php?page=piece_edit&amp;id=<?php echo $pid; ?>"><i class="fas fa-pen mr-1" aria-hidden="true"></i> Modifier</a>
        <a class="btn btn-outline-secondary" href="index.php?page=etiquettes&amp;piece_id=<?php echo $pid; ?>"><i class="fas fa-print mr-1" aria-hidden="true"></i> Étiquette</a>
      <?php } ?>
      <?php if ($actif && $gest) { ?><a class="btn btn-outline-success" href="index.php?page=reception&amp;piece_id=<?php echo $pid; ?>"><i class="fas fa-truck-loading mr-1" aria-hidden="true"></i> Réception</a><?php } ?>
      <?php if ($actif || $a_du_stock) { /* une pièce désactivée ne se reçoit plus, mais son stock peut toujours être vidé */ ?>
        <a class="btn btn-outline-success" href="index.php?page=transfert&amp;piece_id=<?php echo $pid; ?>"><i class="fas fa-exchange-alt mr-1" aria-hidden="true"></i> Transfert</a>
        <a class="btn btn-outline-success" href="index.php?page=sortie&amp;piece_id=<?php echo $pid; ?>"><i class="fas fa-sign-out-alt mr-1" aria-hidden="true"></i> Sortie</a>
      <?php } ?>
      <?php if ($gest) { ?>
        <button type="button" class="btn <?php echo $actif ? 'btn-outline-danger' : 'btn-outline-success'; ?>" id="btn-activer" data-vers="<?php echo $actif ? '0' : '1'; ?>">
          <i class="fas <?php echo $actif ? 'fa-ban' : 'fa-undo'; ?> mr-1" aria-hidden="true"></i> <?php echo $actif ? 'Désactiver' : 'Réactiver'; ?>
        </button>
      <?php } ?>
    </div>

    <div class="row">
      <div class="col-xl-6">
        <div class="card"><div class="card-header"><h3 class="card-title">Identité</h3></div>
          <div class="card-body">
            <dl class="row mb-0">
              <dt class="col-sm-4">Code interne</dt><dd class="col-sm-8 code"><?php echo e($p['code']); ?></dd>
              <dt class="col-sm-4">Nom</dt><dd class="col-sm-8"><?php echo e($p['nom']); ?></dd>
              <dt class="col-sm-4">Description</dt><dd class="col-sm-8 cat-desc"><?php echo $p['description'] !== null && $p['description'] !== '' ? e($p['description']) : '<span class="text-muted">—</span>'; ?></dd>
              <dt class="col-sm-4">Catégorie</dt><dd class="col-sm-8"><?php echo $p['categorie'] !== null ? e($p['categorie']) : '<span class="text-muted">Sans catégorie</span>'; ?></dd>
              <dt class="col-sm-4">Unité</dt><dd class="col-sm-8"><?php echo e($p['unite']); ?></dd>
              <dt class="col-sm-4">Statut</dt><dd class="col-sm-8"><?php echo $actif ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Désactivée</span>'; ?></dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="col-xl-6">
        <div class="card"><div class="card-header"><h3 class="card-title">Codes-barres</h3></div>
          <div class="card-body p-0">
            <div class="table-responsive"><table class="table mb-0 cat-table" id="table-codes">
              <thead><tr><th scope="col">Type</th><th scope="col">Code</th><th scope="col">Aperçu (Code 128)</th></tr></thead>
              <tbody>
              <?php foreach ($codes as $c) { ?>
                <tr>
                  <td><?php echo e($c[0]); ?></td>
                  <td class="code"><?php echo e($c[1]); ?></td>
                  <td class="cat-barcode"><?php if (Code128::valide($c[1])) { ?>
                    <img src="app/ajax/code128.php?texte=<?php echo e(rawurlencode($c[1])); ?>" alt="Code-barres <?php echo e($c[1]); ?>">
                  <?php } else { ?><span class="text-muted small">Aperçu indisponible (code trop long)</span><?php } ?></td>
                </tr>
              <?php } ?>
              </tbody>
            </table></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card"><div class="card-header"><h3 class="card-title">Stock</h3></div>
      <div class="card-body p-0">
        <?php if (!$ents) { ?>
          <p class="p-3 mb-0 text-muted">Vous n'avez accès à aucune entreprise.</p>
        <?php } else { ?>
        <div class="table-responsive"><table class="table mb-0 cat-table" id="table-stock">
          <thead><tr><th scope="col">Entreprise / emplacement</th><th scope="col">Type</th><th scope="col" class="nombre">Quantité</th></tr></thead>
          <tbody>
          <?php foreach ($ents as $en) {
            $eid = (int) $en['id'];
            $tot = isset($totaux[$eid]) ? $totaux[$eid] : '0';
            $min = isset($minimums[$eid]) ? $minimums[$eid] : null;
            $sous = ($actif && $min !== null && Dec::parse($min, Dec::QTE) > 0 && Dec::parse($tot, Dec::QTE) < Dec::parse($min, Dec::QTE)); ?>
            <tr class="cat-entete-entreprise" data-entreprise="<?php echo $eid; ?>">
              <td colspan="2"><?php echo e($en['nom']); ?><?php if ($min !== null && Dec::parse($min, Dec::QTE) > 0) { ?> <small class="text-muted font-weight-normal">(minimum : <?php echo e(fmt_nombre($min)); ?>)</small><?php } ?><?php if ($sous) { ?> <span class="badge badge-bas">Sous le minimum</span><?php } ?></td>
              <td class="nombre">Total : <?php echo e(fmt_nombre($tot)); ?> <small class="text-muted font-weight-normal">(<?php echo e($p['unite']); ?>)</small></td>
            </tr>
            <?php if (empty($stock_par_ent[$eid])) { ?>
              <tr><td colspan="3" class="text-muted pl-4">Aucun stock.</td></tr>
            <?php } else { foreach ($stock_par_ent[$eid] as $s) { ?>
              <tr>
                <td class="pl-4"><?php echo e($s['emplacement']); ?></td>
                <td><?php echo e(isset(TYPES_EMPLACEMENT_FR[$s['type']]) ? TYPES_EMPLACEMENT_FR[$s['type']] : $s['type']); ?></td>
                <td class="nombre"><?php echo e(fmt_nombre($s['quantite'])); ?></td>
              </tr>
            <?php } } ?>
          <?php } ?>
          </tbody>
        </table></div>
        <?php } ?>
      </div>
    </div>

    <?php if ($couts) { ?>
    <div class="card" id="section-prix"><div class="card-header">
        <h3 class="card-title">Coûts et prix des fournisseurs</h3>
        <div class="card-tools no-print"><button type="button" class="btn btn-primary btn-sm" id="btn-ajouter-prix"><i class="fas fa-plus mr-1" aria-hidden="true"></i> Ajouter un prix</button></div>
      </div>
      <div class="card-body">
        <div id="couts-moyens"></div>
        <div id="prix-contenu" class="table-responsive"><span class="text-muted">Chargement…</span></div>
      </div>
    </div>
    <div class="card collapsed-card" id="section-historique"><div class="card-header">
        <h3 class="card-title">Historique des prix</h3>
        <div class="card-tools no-print"><button type="button" class="btn btn-tool" data-card-widget="collapse" aria-label="Afficher ou masquer l'historique des prix"><i class="fas fa-plus"></i></button></div>
      </div>
      <div class="card-body" id="hist-contenu"><span class="text-muted">Chargement…</span></div>
    </div>

    <div class="modal fade" id="modal-prix" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-prix-titre" data-backdrop="static">
      <div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content">
        <form id="form-prix" novalidate>
          <div class="modal-header"><h5 class="modal-title" id="modal-prix-titre">Prix chez un fournisseur</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Fermer"><span aria-hidden="true">&times;</span></button></div>
          <div class="modal-body">
            <div class="alert alert-danger" role="alert" id="prix-erreur" hidden></div>
            <div class="form-group"><label for="prix-fournisseur">Fournisseur <span class="text-danger" aria-hidden="true">*</span></label>
              <select id="prix-fournisseur" name="fournisseur_id" class="form-control"></select></div>
            <div class="form-row">
              <div class="form-group col-sm-6"><label for="prix-montant" id="prix-montant-libelle">Prix ($ par <?php echo e($p['unite']); ?>) <span class="text-danger" aria-hidden="true">*</span></label>
                <input id="prix-montant" name="prix" class="form-control nombre" inputmode="decimal" autocomplete="off" placeholder="0,00"></div>
              <div class="form-group col-sm-6"><label for="prix-date">Date du prix</label>
                <input id="prix-date" name="date" type="date" class="form-control"></div>
            </div>
            <div class="form-group"><label for="prix-no">Numéro de pièce chez le fournisseur <span class="text-muted font-weight-normal">(facultatif)</span></label>
              <input id="prix-no" name="no_fournisseur" class="form-control" maxlength="60" autocomplete="off"></div>
            <div class="form-group mb-0"><label for="prix-note">Note <span class="text-muted font-weight-normal">(facultatif)</span></label>
              <input id="prix-note" name="note" class="form-control" maxlength="255" autocomplete="off"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Annuler</button>
            <button type="submit" class="btn btn-primary" id="prix-enregistrer">Enregistrer</button>
          </div>
        </form>
      </div></div>
    </div>
    <?php } ?>

    <div class="card"><div class="card-header"><h3 class="card-title">Derniers mouvements <small class="text-muted">(20 au plus)</small></h3></div>
      <div class="card-body p-0">
        <?php if (!$mouvements) { ?>
          <p class="p-3 mb-0 text-muted">Aucun mouvement pour cette pièce.</p>
        <?php } else { ?>
        <div class="table-responsive"><table class="table table-sm mb-0 cat-table" id="table-mouvements">
          <thead><tr><th scope="col">Date</th><th scope="col">Document</th><th scope="col">Type</th><th scope="col">Emplacement</th><th scope="col" class="nombre">Quantité</th><th scope="col">Utilisateur</th></tr></thead>
          <tbody>
          <?php foreach ($mouvements as $m) { $neg = ($m['quantite'][0] === '-'); ?>
            <tr>
              <td class="text-nowrap"><?php echo e(substr($m['date_mouvement'], 0, 16)); ?></td>
              <td><a href="index.php?page=document_voir&amp;id=<?php echo (int) $m['document_id']; ?>" class="code"><?php echo e($m['numero']); ?></a><?php if ($m['statut'] === 'annule') { ?> <span class="badge badge-secondary">Annulé</span><?php } ?></td>
              <td><?php echo e(isset(TYPES_DOCUMENT_FR[$m['type']]) ? TYPES_DOCUMENT_FR[$m['type']] : $m['type']); ?><?php if ($m['est_annulation']) { ?> <span class="badge badge-warning">Annulation</span><?php } ?></td>
              <td><?php echo e($m['emplacement']); ?></td>
              <td class="nombre <?php echo $neg ? 'text-danger' : 'text-success'; ?>"><?php echo $neg ? '' : '+'; ?><?php echo e(fmt_nombre($m['quantite'])); ?></td>
              <td><?php echo e($m['utilisateur']); ?></td>
            </tr>
          <?php } ?>
          </tbody>
        </table></div>
        <?php } ?>
      </div>
    </div>

  </div></section>
</div>
