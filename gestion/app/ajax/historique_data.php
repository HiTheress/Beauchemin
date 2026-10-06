<?php
// Tableau serveur (DataTables) du registre des mouvements. Employé+ ; seuls les mouvements dont l'EMPLACEMENT appartient à une
// entreprise de l'utilisateur sont listés (une facture interne n'expose à chaque entreprise que sa propre moitié).
// POST (ou GET) : paramètres DataTables + entreprise_id (403 si non permise), piece_id, emplacement_id (403 si non permis), type
// (reception|transfert|sortie|ajustement|facture_interne), du / au (AAAA-MM-JJ, inclusifs), utilisateur_id, numero (numéro de document, partiel).
// Tri de départ : le plus récent d'abord, par identifiant (chronologique) donc sans tri coûteux ; « date » trie aussi par identifiant.
// Colonnes (alias, identiques à columns[].data côté JS) : ordre, date, doc_id, numero, type, doc_statut, piece_id, code (lien : code + nom), nom, unite, entreprise,
//   emplacement, quantite (signée), utilisateur, annulation (0/1), mention ; + cout_unitaire et valeur pour un gestionnaire+ SEULEMENT.
require_once __DIR__ . '/stock_lib.php';
Suivi::executer(function ($ctx) {
	global $pdo;
	$f = Suivi::filtresHistorique($ctx, Suivi::requete());
	$def = Suivi::historiqueRequete($ctx, $f);

	$formateurs = array(
		'date' => function ($l) {
			return e(substr((string) $l['date'], 0, 16));
		},
		'numero' => function ($l) {
			return '<a class="code font-weight-bold" href="index.php?page=document_voir&amp;id=' . (int) $l['doc_id'] . '">' . e($l['numero']) . '</a>';
		},
		'type' => function ($l) {
			return e(isset(TYPES_DOCUMENT_FR[$l['type']]) ? TYPES_DOCUMENT_FR[$l['type']] : $l['type']);
		},
		// code et nom dans UN SEUL lien (une seule zone à toucher sur tablette) ; le nom est échappé comme le code
		'code' => function ($l) {
			return '<a href="index.php?page=piece_voir&amp;id=' . (int) $l['piece_id'] . '"><span class="code font-weight-bold">' . e($l['code']) . '</span><br><small>' . e($l['nom']) . '</small></a>';
		},
		'mention' => function ($l) {
			if ($l['annulation']) {
				return '<span class="badge badge-danger">Annulation</span>';
			}
			if ($l['doc_statut'] === 'annule') {
				return '<span class="badge badge-secondary" title="Ce document a été annulé ; l\'annulation a ses propres mouvements.">Document annulé</span>';
			}
			return '';
		},
	);

	DataTable::repondre($pdo, array(
		'from' => $def['from'],
		'colonnes' => $def['colonnes'],
		'where' => $def['where'],
		'params' => $def['params'],
		'tri_defaut' => array('ordre', 'desc'),
		'formateurs' => $formateurs,
	));
});
