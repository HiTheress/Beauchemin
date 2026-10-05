<?php
// Aperçu AU COÛT d'une facture interne (lecture seule : ne modifie rien, ne réserve rien). Gestionnaire+.
// POST JSON : emplacement_id (source), lignes[{piece_id, quantite}].
// Réponse : {ok:true, lignes:[{piece_id, code, nom, unite, quantite, disponible, cout_unitaire, total_ligne, sans_cout, insuffisant, erreur}],
//            total, nb_sans_cout, nb_insuffisant, nb_erreurs}
// Le coût unitaire est le coût moyen pondéré de l'entreprise ÉMETTRICE (celle de l'emplacement source), comme à l'enregistrement.
// 403 : rôle ou entreprise refusés (l'emplacement source doit appartenir à une entreprise de l'utilisateur) ; 400 : emplacement
// source désactivé, corps illisible ou ligne mal formée.
require_once __DIR__ . '/../action/facture_lib.php';
endpoint(function () {
	Interentreprise::exigerRole('facture_interne');
	$d = Interentreprise::donnees();
	$id = Interentreprise::identifiant($d, 'emplacement_id');
	if ($id <= 0) {
		throw new InventaireException('Choisissez l\'emplacement source.', 'emplacement_id');
	}
	$emp = Interentreprise::emplacement($id);
	if (!$emp) {
		throw new InventaireException('Emplacement introuvable.', 'emplacement_id');
	}
	Interentreprise::exigerEntreprise($emp['entreprise_id']);
	Interentreprise::exigerActif($emp, 'emplacement_id');      // comme à l'enregistrement : un emplacement désactivé est refusé
	return Interentreprise::apercu($emp, isset($d['lignes']) ? $d['lignes'] : array());
});
