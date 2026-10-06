<?php
// Historique des mouvements : registre de tout ce qui est entré, sorti ou déplacé (tableau serveur). Employé+ ; aucun coût pour un employé.
if (!acces_page('employe')) { return; }
require_once __DIR__ . '/../app/ajax/stock_lib.php';
page_script('assets/js/stock.js');
$couts = $Ouser->peutVoirCouts();
$mes_ent = inventaire()->listeEntreprises(utilisateur_id());
$ids_ent = array_map(function ($en) { return (int) $en['id']; }, $mes_ent);
$mes_emp = inventaire()->listeEmplacements(utilisateur_id(), true);
$ids_emp = array_map(function ($e2) { return (int) $e2['id']; }, $mes_emp);
$utilisateurs = Suivi::utilisateursVisibles(array('entreprises' => $ids_ent));

// Préremplissage par l'URL (validé) : piece_id, emplacement_id, entreprise_id, type, du, au, utilisateur_id, numero
$get = function ($cle) { return (isset($_GET[$cle]) && is_string($_GET[$cle])) ? trim($_GET[$cle]) : ''; };
$date_ok = function ($s) { return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]); };
$defaut_ent = entreprise_courante();
// entreprise_id=0 : « toutes mes entreprises » choisi explicitement (la page écrit ses filtres dans l'adresse : le bouton Retour les retrouve)
$pre_ent = $get('entreprise_id') === '0' ? 0
    : (($get('entreprise_id') !== '' && ctype_digit($get('entreprise_id')) && in_array((int) $get('entreprise_id'), $ids_ent, true)) ? (int) $get('entreprise_id') : $defaut_ent);
$pre_emp = ($get('emplacement_id') !== '' && ctype_digit($get('emplacement_id')) && in_array((int) $get('emplacement_id'), $ids_emp, true)) ? (int) $get('emplacement_id') : 0;
if ($pre_emp) {
    foreach ($mes_emp as $e2) { if ((int) $e2['id'] === $pre_emp) { $pre_ent = (int) $e2['entreprise_id']; } }
}
$pre_type = isset(TYPES_DOCUMENT_FR[$get('type')]) ? $get('type') : '';
$pre_du = $date_ok($get('du')) ? $get('du') : '';
$pre_au = $date_ok($get('au')) ? $get('au') : '';
$ids_util = array_map(function ($u) { return (int) $u['id']; }, $utilisateurs);
$pre_util = ($get('utilisateur_id') !== '' && ctype_digit($get('utilisateur_id')) && in_array((int) $get('utilisateur_id'), $ids_util, true)) ? (int) $get('utilisateur_id') : 0;
$pre_num = mb_substr($get('numero'), 0, 30);
// Pièce préchoisie : lue sans condition d'activité (une pièce désactivée garde son historique)
$pre_piece = null;
if ($get('piece_id') !== '' && ctype_digit($get('piece_id')) && strlen($get('piece_id')) < 10) {
    $st = $pdo->prepare('SELECT id, code, nom FROM pieces WHERE id = ?');
    $st->execute(array((int) $get('piece_id')));
    $pre_piece = $st->fetch() ?: null;
}
?>
<link rel="stylesheet" href="assets/css/stock.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/stock.css'); ?>">
<div class="content-wrapper sk-page" data-d2="historique" data-couts="<?php echo $couts ? '1' : '0'; ?>" data-multi="<?php echo count($mes_ent) > 1 ? '1' : '0'; ?>" data-defaut-entreprise="<?php echo (int) $defaut_ent; ?>" data-aujourdhui="<?php echo e(date('Y-m-d')); ?>">
  <?php page_titre('Historique des mouvements', array('Rapports')); ?>
  <section class="content"><div class="container-fluid">
    <div class="card sk-carte"><div class="card-body">

      <div class="row sk-filtres no-print">
        <div class="col-xl-4 col-md-12 form-group">
          <label for="f-piece">Pièce</label>
          <select id="f-piece" class="form-control" data-placeholder="Toutes les pièces" autocomplete="off">
            <option value=""></option>
            <?php if ($pre_piece) { ?><option value="<?php echo (int) $pre_piece['id']; ?>" selected><?php echo e($pre_piece['code'] . ' — ' . $pre_piece['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php if (count($mes_ent) > 0) { ?>
        <div class="col-xl-4 col-md-6 form-group">
          <label for="f-entreprise">Entreprise</label>
          <select id="f-entreprise" class="form-control" autocomplete="off">
            <?php if (count($mes_ent) > 1) { ?><option value="">Toutes mes entreprises</option><?php } ?>
            <?php foreach ($mes_ent as $en) { ?><option value="<?php echo (int) $en['id']; ?>"<?php echo $pre_ent === (int) $en['id'] ? ' selected' : ''; ?>><?php echo e($en['nom']); ?></option><?php } ?>
          </select>
        </div>
        <?php } ?>
        <div class="col-xl-4 col-md-6 form-group">
          <label for="f-emplacement">Emplacement</label>
          <select id="f-emplacement" class="form-control" autocomplete="off">
            <option value="">Tous les emplacements</option>
            <?php foreach ($mes_emp as $emp) { ?>
              <option value="<?php echo (int) $emp['id']; ?>" data-ent="<?php echo (int) $emp['entreprise_id']; ?>" data-ent-nom="<?php echo e($emp['entreprise_nom']); ?>" data-nom="<?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?>"<?php echo $pre_emp === (int) $emp['id'] ? ' selected' : ''; ?>><?php echo e($emp['nom'] . ($emp['actif'] ? '' : ' (désactivé)')); ?></option>
            <?php } ?>
          </select>
        </div>
      </div>

      <div class="row sk-filtres no-print">
        <div class="col-xl-4 col-md-12 form-group">
          <span class="sk-etiquette" id="lbl-plage">Période</span>
          <div class="input-group" role="group" aria-labelledby="lbl-plage">
            <input id="f-du" type="date" class="form-control" aria-label="Du" autocomplete="off" max="<?php echo e(date('Y-m-d')); ?>" value="<?php echo e($pre_du); ?>">
            <div class="input-group-prepend input-group-append"><span class="input-group-text">au</span></div>
            <input id="f-au" type="date" class="form-control" aria-label="Au" autocomplete="off" max="<?php echo e(date('Y-m-d')); ?>" value="<?php echo e($pre_au); ?>">
          </div>
        </div>
        <div class="col-xl-3 col-md-4 form-group">
          <label for="f-type">Type de document</label>
          <select id="f-type" class="form-control" autocomplete="off">
            <option value="">Tous les types</option>
            <?php foreach (TYPES_DOCUMENT_FR as $cle => $lib) { ?><option value="<?php echo e($cle); ?>"<?php echo $pre_type === $cle ? ' selected' : ''; ?>><?php echo e($lib); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-xl-3 col-md-4 form-group">
          <label for="f-utilisateur">Utilisateur</label>
          <select id="f-utilisateur" class="form-control" autocomplete="off">
            <option value="">Tous les utilisateurs</option>
            <?php foreach ($utilisateurs as $u) { ?><option value="<?php echo (int) $u['id']; ?>"<?php echo $pre_util === (int) $u['id'] ? ' selected' : ''; ?>><?php echo e($u['nom'] . ($u['actif'] ? '' : ' (inactif)')); ?></option><?php } ?>
          </select>
        </div>
        <div class="col-xl-2 col-md-4 form-group">
          <label for="f-numero">N° de document</label>
          <input id="f-numero" type="search" class="form-control" autocomplete="off" maxlength="30" placeholder="ex. TRF-2026" value="<?php echo e($pre_num); ?>">
        </div>
      </div>
      <div class="row sk-barre no-print">
        <div class="col-12 form-group d-flex justify-content-lg-end sk-actions">
          <button type="button" id="f-effacer" class="btn btn-outline-secondary mr-2"><i class="fas fa-eraser mr-1" aria-hidden="true"></i> Effacer les filtres</button>
          <a id="btn-export" class="btn btn-outline-secondary" href="app/ajax/historique_export.php"><i class="fas fa-file-export mr-1" aria-hidden="true"></i> Exporter (CSV)</a>
        </div>
      </div>

      <p class="d-none d-print-block sk-resume-impression" id="sk-resume"></p>
      <div class="table-responsive">
        <table id="table-historique" class="table table-striped table-hover sk-table w-100">
          <caption class="sr-only">Registre des mouvements de stock</caption>
          <thead><tr>
            <th scope="col">Ordre</th>
            <th scope="col">Date et heure</th>
            <th scope="col">Document</th>
            <th scope="col">Pièce</th>
            <th scope="col">Emplacement</th>
            <th scope="col" class="nombre">Quantité</th>
            <th scope="col">Utilisateur</th>
            <?php if ($couts) { ?>
            <th scope="col" class="nombre">Coût unitaire</th>
            <th scope="col" class="nombre">Valeur</th>
            <?php } ?>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Du plus récent au plus ancien. Seuls les mouvements de vos entreprises sont listés. Une quantité en vert est une entrée, en rouge une sortie ; une annulation de document est marquée « Annulation ». Le type de document est écrit sous son numéro.</p>
    </div></div>
  </div></section>
</div>
