<?php
// Export CSV de la valeur de l'inventaire (gestionnaire+) : UTF-8 avec BOM, séparateur « ; », virgule décimale.
// GET : mode = 'emplacements' (défaut : une ligne par emplacement, totaux par entreprise et général)
//             | 'pieces' (une ligne par pièce et par emplacement) ; emplacement_id (mode pieces : un seul emplacement).
// Respecte le filtre d'entreprise de la barre du haut. Refus : texte brut avec le code HTTP 403 (rôle ou entreprise) ou 400.
require_once __DIR__ . '/../action/facture_lib.php';
global $pdo, $Ouser;
if (!$Ouser->aRole(Inventaire::ROLE_MIN['rapport'])) {
	Interentreprise::refuserExport('Vous n\'avez pas la permission de consulter ce rapport.');
}
$C = function ($v) { return Interentreprise::csvTexte($v); };
$N = function ($v, $min, $max) { return Interentreprise::csvNombre($v, $min, $max); };
$mode = (isset($_GET['mode']) && $_GET['mode'] === 'pieces') ? 'pieces' : 'emplacements';
$date = date('Y-m-d');

try {
	if ($mode === 'pieces') {
		$empId = Interentreprise::identifiant($_GET, 'emplacement_id');
		if ($empId > 0) {
			$emp = Interentreprise::emplacement($empId);
			if (!$emp) {
				Interentreprise::refuserExport('Emplacement introuvable.', 400);
			}
			if (!$Ouser->peutAcces((int) $emp['entreprise_id'])) {
				Interentreprise::refuserExport('Vous n\'avez pas accès à cette entreprise.');
			}
			$ids = array($empId);
			$nom = 'detail-inventaire-' . $date . '.csv';
		} else {
			$v = Interentreprise::valeurComplete(entreprises_filtre());
			$ids = array();
			foreach ($v['emplacements'] as $e) {
				$ids[] = (int) $e['id'];
			}
			$nom = 'detail-inventaire-' . $date . '.csv';
		}
		$lignes = array(array($C('Entreprise'), $C('Emplacement'), $C('Type'), $C('Code'), $C('Pièce'), $C('Catégorie'), $C('Unité'), $C('Quantité'), $C('Coût moyen ($)'), $C('Valeur ($)')));
		foreach (Interentreprise::lignesValeur($ids) as $r) {
			$lignes[] = array(
				$C($r['entreprise']), $C($r['emplacement'] . ($r['actif'] ? '' : ' (désactivé)')), $C(TYPES_EMPLACEMENT_FR[$r['type']]), $C($r['code']), $C($r['nom']),
				$C($r['categorie'] === null ? '' : $r['categorie']), $C($r['unite']), $N($r['quantite'], 0, 3), $N($r['cout_moyen'], 2, 4), $N($r['valeur'], 2, 2),
			);
		}
	} else {
		$v = Interentreprise::valeurComplete(entreprises_filtre());
		$nom = 'valeur-inventaire-' . $date . '.csv';
		$lignes = array(
			array($C('Valeur de l\'inventaire au coût moyen'), $C($date)),
			array(),
			array($C('Entreprise'), $C('Emplacement'), $C('Type'), $C('Nombre de pièces'), $C('Valeur ($)')),
		);
		$parEnt = array();
		foreach ($v['emplacements'] as $e) {
			$parEnt[(int) $e['entreprise_id']][] = $e;
		}
		foreach ($v['entreprises'] as $en) {
			foreach (isset($parEnt[(int) $en['id']]) ? $parEnt[(int) $en['id']] : array() as $e) {
				$lignes[] = array(
					$C($en['nom']), $C($e['nom'] . ($e['actif'] ? '' : ' (désactivé)')), $C(TYPES_EMPLACEMENT_FR[$e['type']]),
					$N((string) (int) $e['nb_pieces'], 0, 0), $N($e['valeur'], 2, 2),
				);
			}
			$arrondi = isset($v['arrondi'][(int) $en['id']]) ? $v['arrondi'][(int) $en['id']] : '0.00';
			if (Dec::parse($arrondi, Dec::TOTAL) !== 0) {      // chaque emplacement est arrondi au cent, le total de l'entreprise une seule fois
				$lignes[] = array($C($en['nom']), $C('Écart d\'arrondi'), '', '', $N($arrondi, 2, 2));
			}
			$lignes[] = array($C($en['nom']), $C('Total de l\'entreprise'), '', '', $N($en['valeur'], 2, 2));
		}
		$lignes[] = array($C('Total général'), '', '', '', $N($v['total'], 2, 2));
	}
} catch (InventaireException $ex) {
	Interentreprise::refuserExport($ex->getMessage(), 400);
} catch (Throwable $ex) {
	error_log('Export ' . ($_SERVER['SCRIPT_NAME'] ?? '') . ' : ' . $ex);
	Interentreprise::refuserExport('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
}
Journal::ecrire($pdo, utilisateur_id(), 'export.valeur', 'entreprises', null, array('mode' => $mode));
Interentreprise::csvEnvoyer($nom, $lignes);
