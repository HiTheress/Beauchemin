<?php
// Tableau serveur (DataTables) du stock. Employé+ ; seules les entreprises de l'utilisateur sont lues.
// POST (ou GET) : paramètres DataTables + vue ('emplacement' = une ligne par pièce et emplacement, défaut ; 'piece' = totaux par pièce et entreprise),
//   entreprise_id (refusée avec 403 si non permise), emplacement_id (vue emplacement seulement), categorie_id (id ou 'aucune'),
//   zero (1 = afficher aussi les quantités à zéro), q (recherche : code, nom ou code-barres, chaque mot doit être trouvé).
// Colonnes (alias, identiques à columns[].data côté JS) : cle, piece_id, code, nom, actif, categorie, entreprise, emplacement, emp_actif,
//   quantite, unite, minimum, total_ent, sous_min ; + cout_moyen et valeur pour un gestionnaire+ SEULEMENT (absentes du JSON pour un employé).
// Quantités et montants : chaînes décimales exactes. Tous les textes sont échappés ; code et nom sont des liens vers piece_voir.
require_once __DIR__ . '/stock_lib.php';
Suivi::executer(function ($ctx) {
	global $pdo;
	$f = Suivi::filtresStock($ctx, Suivi::requete());
	$def = Suivi::stockRequete($ctx, $f);

	$lien = function ($texte, $id, $classe) {
		return '<a class="' . $classe . '" href="index.php?page=piece_voir&amp;id=' . (int) $id . '">' . e($texte) . '</a>';
	};
	$formateurs = array(
		'code' => function ($l) use ($lien) {
			return $lien($l['code'], $l['piece_id'], 'code font-weight-bold');
		},
		'nom' => function ($l) use ($lien) {
			$h = $lien($l['nom'], $l['piece_id'], 'sk-nom');
			if (!$l['actif']) {
				$h .= ' <span class="badge badge-secondary">Désactivée</span>';
			}
			if (Suivi::sousMinimumLigne($l)) {
				$h .= ' <span class="badge badge-bas" title="' . e('Total de l\'entreprise : ' . fmt_nombre($l['total_ent']) . ' — minimum : ' . fmt_nombre($l['minimum'])) . '">Sous le minimum</span>';
			}
			return $h;
		},
		'emplacement' => function ($l) {
			if ($l['emplacement'] === null) {
				return '';
			}
			return e($l['emplacement']) . ($l['emp_actif'] ? '' : ' <span class="text-muted">(désactivé)</span>');
		},
		'sous_min' => function ($l) {
			return Suivi::sousMinimumLigne($l) ? 1 : 0;
		},
	);

	DataTable::repondre($pdo, array(
		'from' => $def['from'],
		'colonnes' => $def['colonnes'],
		'where' => $def['where'],
		'params' => $def['params'],
		'tri_defaut' => array('code', 'asc'),
		'formateurs' => $formateurs,
	));
});
