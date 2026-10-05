<?php
// Analyse (aperçu) d'un import du catalogue : ne modifie RIEN. Gestionnaire+.
//  (1) téléversement  : POST multipart, champs fichier (.csv/.txt, 2 Mo), mode ('creer'|'creer_maj'), creer_categories, creer_fournisseurs
//      -> lit le fichier en mémoire (jamais enregistré), renvoie { meta, source (lignes lues, à conserver côté client), resultats, totaux }
//  (2) ré-analyse    : POST JSON { lignes: source, mode, creer_categories, creer_fournisseurs } -> { resultats, totaux }
// resultats[i] : { no, statut: ok|avertissement|erreur|ignoree, action: creer|maj|inchange|ignorer|stock, code, nom, categorie,
//                  stock: {emplacement, quantite, cout}|null, changements[], msgs: [[niveau, texte], …] }
require_once '../init.php';
require_once __DIR__ . '/import_lib.php';
exiger_post();
endpoint(function () {
	set_time_limit(120);
	global $pdo;
	$uid = utilisateur_id();
	inventaire()->exiger($uid, 'catalogue');
	$d = entree();
	$options = ImportCatalogue::options($d);
	$imp = new ImportCatalogue($pdo, inventaire(), $uid);
	$sortie = array();
	if (isset($_FILES['fichier'])) {
		$lu = $imp->lireFichier($_FILES['fichier']);
		$lignes = $lu['lignes'];
		$sortie['meta'] = $lu['meta'];
		$sortie['source'] = $lignes;
	} elseif (!empty($_SERVER['CONTENT_LENGTH']) && stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false && !$_POST) {
		throw new InventaireException('Le fichier dépasse la taille permise (2 Mo) : découpez-le en plusieurs fichiers.', 'fichier');
	} else {
		$lignes = ImportCatalogue::lignesClient(isset($d['lignes']) ? $d['lignes'] : null);
	}
	$a = $imp->analyser($lignes, $options);
	return $sortie + array('resultats' => $a['resultats'], 'totaux' => $a['totaux']);
});
