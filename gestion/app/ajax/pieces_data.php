<?php
// Tableau serveur (DataTables) des pièces. Tous les rôles ; la quantité totale ne compte que les entreprises visibles
// de l'utilisateur (entreprise choisie en haut, sinon toutes les siennes). Aucun coût.
// POST : paramètres DataTables + categorie_id ('' | id | 'aucune'), statut ('actives'|'inactives'|'toutes'), avec_stock (0|1), search[value].
// Colonnes (alias) : code, nom, categorie, unite, quantite, statut — doivent correspondre à columns[].data côté JS.
require_once __DIR__ . '/../action/piece_lib.php';
endpoint(function () {
	global $pdo;
	inventaire()->exiger(utilisateur_id(), 'consulter');
	$req = Catalogue::requeteDataTable();
	$lire = function ($cle, $defaut = '') use ($req) {
		return (isset($req[$cle]) && is_scalar($req[$cle])) ? trim((string) $req[$cle]) : $defaut;
	};

	// Entreprises visibles : paramètres nommés distincts (requêtes préparées natives)
	$params = array();
	$in = array();
	foreach (array_values(entreprises_filtre()) as $i => $id) {
		$in[] = ':ent' . $i;
		$params[':ent' . $i] = (int) $id;
	}
	if (!$in) {
		$in[] = '0';
	}

	$where = array();
	$statut = $lire('statut', 'actives');
	if ($statut === 'actives') {
		$where[] = 'p.actif = 1';
	} elseif ($statut === 'inactives') {
		$where[] = 'p.actif = 0';
	}
	$cat = $lire('categorie_id');
	if ($cat === 'aucune') {
		$where[] = 'p.categorie_id IS NULL';
	} elseif ($cat !== '' && ctype_digit($cat)) {
		$where[] = 'p.categorie_id = :cat';
		$params[':cat'] = (int) $cat;
	}
	if ($lire('avec_stock') === '1') {
		$where[] = 'COALESCE(t.q, 0) > 0';
	}

	DataTable::repondre($pdo, array(
		'from' => 'pieces p
			LEFT JOIN categories c ON c.id = p.categorie_id
			LEFT JOIN (SELECT s.piece_id, SUM(s.quantite) AS q FROM stock s JOIN emplacements e ON e.id = s.emplacement_id
			            WHERE e.entreprise_id IN (' . implode(',', $in) . ') GROUP BY s.piece_id) t ON t.piece_id = p.id',
		'colonnes' => array(
			'code' => 'p.code',
			'nom' => 'p.nom',
			'categorie' => 'c.nom',
			'unite' => 'p.unite',
			'quantite' => 'COALESCE(t.q, 0)',
			'statut' => 'p.actif',
			'id' => 'p.id',
		),
		// une seule expression de recherche : code, nom et alias de codes-barres (le même paramètre ne peut pas être répété)
		'recherche' => array("CONCAT_WS(' ', p.code, p.nom, (SELECT GROUP_CONCAT(pc.code SEPARATOR ' ') FROM pieces_codes pc WHERE pc.piece_id = p.id))"),
		'where' => $where,
		'params' => $params,
		'tri_defaut' => array('nom', 'asc'),
		'formateurs' => array(
			'code' => function ($l) {
				return '<a class="code lien-fiche" href="index.php?page=piece_voir&amp;id=' . (int) $l['id'] . '">' . e($l['code']) . '</a>';
			},
		),
	));
});
