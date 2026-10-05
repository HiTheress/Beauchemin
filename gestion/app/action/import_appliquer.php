<?php
// Applique un import du catalogue (gestionnaire+). POST JSON { lignes: [...lignes analysées...], mode, creer_categories, creer_fournisseurs, fichier? }
// Le serveur revalide TOUT (l'aperçu n'est pas cru) puis applique en une seule transaction : tout ou rien.
// Succès : { ok:true, creees, mises_a_jour, ignorees, dont_inchangees, documents:[{id,numero,emplacement,lignes}], lignes_stock, categories_creees, fournisseurs_crees }
// Refus (lignes en erreur) : 400 { ok:false, erreur, erreurs:[{no, code, msgs}] }
require_once '../init.php';
require_once __DIR__ . '/../ajax/import_lib.php';
exiger_post();
endpoint(function () {
	set_time_limit(300);
	global $pdo;
	$uid = utilisateur_id();
	inventaire()->exiger($uid, 'catalogue');
	$d = entree();
	$options = ImportCatalogue::options($d);
	$lignes = ImportCatalogue::lignesClient(isset($d['lignes']) ? $d['lignes'] : null);
	$fichier = isset($d['fichier']) && is_string($d['fichier']) ? mb_substr(preg_replace('/[\x00-\x1F\x7F]/', '', $d['fichier']), 0, 100) : '';
	$imp = new ImportCatalogue($pdo, inventaire(), $uid);
	try {
		return $imp->appliquer($lignes, $options, $fichier);
	} catch (ImportException $ex) {
		json_fail($ex->getMessage(), 400, array('erreurs' => $ex->details));
	}
});
