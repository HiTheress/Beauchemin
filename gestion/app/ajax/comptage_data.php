<?php
// Tableau serveur (DataTables) des comptages d'inventaire. Employé+.
// Seuls les comptages des entreprises de l'utilisateur sont listés (droits relus dans la base, jamais pris du navigateur).
// POST : paramètres DataTables + statut ('en_cours'|'applique'|'annule'), entreprise_id, mine ('1' = seulement mes comptages),
//        search[value] (numéro, emplacement, entreprise, utilisateur, note).
// Colonnes (alias) : numero, emplacement, entreprise, statut, cree_par, cree_le, nb_lignes, document — doivent correspondre à columns[].data côté JS.
require_once '../init.php';
require_once __DIR__ . '/scanner_lib.php';
endpoint(function () {
	global $pdo, $Ouser;
	inventaire()->exiger(utilisateur_id(), 'consulter');
	$req = $_POST + $_GET;
	$lire = function ($cle) use ($req) {
		return (isset($req[$cle]) && is_scalar($req[$cle])) ? trim((string) $req[$cle]) : '';
	};

	// Entreprises de l'utilisateur : entiers issus de ses droits, donc insérés tels quels.
	$acc = array_map('intval', $Ouser->entreprisesAutorisees());
	$where = array('c.entreprise_id IN (' . ($acc ? implode(',', $acc) : '0') . ')');
	$params = array();

	$statut = $lire('statut');
	if ($statut !== '') {
		if (in_array($statut, array('en_cours', 'applique', 'annule'), true)) {
			$where[] = 'c.statut = :statut';
			$params[':statut'] = $statut;
		} else {
			$where[] = '1 = 0';
		}
	}
	$ent = $lire('entreprise_id');
	if ($ent !== '' && $ent !== '0') {
		if (ctype_digit($ent) && strlen($ent) < 10 && in_array((int) $ent, $acc, true)) {
			$where[] = 'c.entreprise_id = :ent';
			$params[':ent'] = (int) $ent;
		} else {
			$where[] = '1 = 0';
		}
	}
	if (ScanLib::booleen($lire('mine'))) {
		$where[] = 'c.cree_par = :moi';
		$params[':moi'] = utilisateur_id();
	}

	// Paramètres DataTables : on ne garde que des valeurs de la bonne forme (un navigateur détourné peut envoyer des tableaux là où
	// DataTable attend du texte, ce qui y provoquerait des avertissements PHP).
	$propre = function (array $t) {
		$o = array();
		foreach (array('draw', 'start', 'length') as $k) {
			if (isset($t[$k]) && is_scalar($t[$k])) {
				$o[$k] = (int) $t[$k];
			}
		}
		if (isset($t['search']) && is_array($t['search']) && isset($t['search']['value']) && is_string($t['search']['value'])) {
			$o['search'] = array('value' => $t['search']['value']);
		}
		if (isset($t['order'][0]['column']) && is_scalar($t['order'][0]['column'])) {
			$dir = (isset($t['order'][0]['dir']) && is_string($t['order'][0]['dir'])) ? $t['order'][0]['dir'] : 'asc';
			$o['order'] = array(array('column' => (int) $t['order'][0]['column'], 'dir' => $dir));
		}
		if (isset($t['columns']) && is_array($t['columns'])) {
			foreach ($t['columns'] as $i => $c) {
				if (is_array($c) && isset($c['data']) && is_string($c['data'])) {
					$o['columns'][(int) $i] = array('data' => $c['data']);
				}
			}
		}
		return $o;
	};
	$_POST = $propre($_POST);
	$_GET = $propre($_GET);

	$statuts = array('en_cours' => array('En cours', 'warning'), 'applique' => array('Appliqué', 'success'), 'annule' => array('Annulé', 'secondary'));
	DataTable::repondre($pdo, array(
		'from' => 'comptages c
			JOIN emplacements e ON e.id = c.emplacement_id
			JOIN entreprises en ON en.id = c.entreprise_id
			LEFT JOIN utilisateurs u ON u.id = c.cree_par
			LEFT JOIN documents d ON d.id = c.document_id',
		'colonnes' => array(
			'id' => 'c.id',
			'numero' => 'c.numero',
			'emplacement' => 'e.nom',
			'entreprise' => 'en.nom',
			'statut' => 'c.statut',
			'cree_par' => "COALESCE(NULLIF(u.nom_complet, ''), u.nom_utilisateur)",
			'cree_le' => 'c.cree_le',
			'nb_lignes' => '(SELECT COUNT(*) FROM comptage_lignes cl WHERE cl.comptage_id = c.id)',
			'document_id' => 'c.document_id',
			'document' => 'd.numero',
		),
		// une seule expression de recherche : le même paramètre ne peut pas être répété (requêtes préparées natives)
		'recherche' => array("CONCAT_WS(' ', c.numero, e.nom, en.nom, u.nom_utilisateur, u.nom_complet, c.note)"),
		'where' => $where,
		'params' => $params,
		'tri_defaut' => array('cree_le', 'desc'),
		'brut' => array('numero', 'statut', 'document'),
		'formateurs' => array(
			'numero' => function ($l) {
				return '<a href="index.php?page=comptage_voir&amp;id=' . (int) $l['id'] . '">' . e($l['numero']) . '</a>';
			},
			'statut' => function ($l) use ($statuts) {
				$s = isset($statuts[$l['statut']]) ? $statuts[$l['statut']] : array($l['statut'], 'secondary');
				return '<span class="badge badge-' . e($s[1]) . '">' . e($s[0]) . '</span>';
			},
			'cree_le' => function ($l) {
				return e(substr((string) $l['cree_le'], 0, 16));
			},
			'document' => function ($l) {
				return $l['document_id'] ? '<a href="index.php?page=document_voir&amp;id=' . (int) $l['document_id'] . '">' . e($l['document']) . '</a>' : '';
			},
		),
	));
});
