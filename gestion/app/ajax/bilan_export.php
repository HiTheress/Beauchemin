<?php
// Export CSV du bilan mensuel (gestionnaire+) : UTF-8 avec BOM, séparateur « ; », virgule décimale, formules neutralisées.
// GET : annee, mois (mois courant par défaut), a et b (paire d'entreprises ; fixe s'il n'y a que deux entreprises).
// Tous les montants viennent de inventaire()->bilanMensuel. Refus : texte brut avec le code HTTP 403 (rôle ou entreprise) ou 400.
require_once __DIR__ . '/../action/facture_lib.php';
global $pdo, $Ouser;
if (!$Ouser->aRole(Inventaire::ROLE_MIN['rapport'])) {
	Interentreprise::refuserExport('Vous n\'avez pas la permission de consulter ce rapport.');
}
$C = function ($v) { return Interentreprise::csvTexte($v); };
$N = function ($v, $min, $max) { return Interentreprise::csvNombre($v, $min, $max); };
try {
	list($annee, $mois) = Interentreprise::periode($_GET);
	list($a, $b) = Interentreprise::paire($_GET);
	if (!$Ouser->peutAcces($a) && !$Ouser->peutAcces($b)) {
		Interentreprise::refuserExport('Vous n\'avez pas accès à ces entreprises.');
	}
	$r = inventaire()->bilanMensuel(utilisateur_id(), $annee, $mois, $a, $b);
} catch (InventaireException $ex) {
	Interentreprise::refuserExport($ex->getMessage(), 400);
} catch (Throwable $ex) {
	error_log('Export ' . ($_SERVER['SCRIPT_NAME'] ?? '') . ' : ' . $ex);
	Interentreprise::refuserExport('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
}
$noms = $r['entreprises'];
$periode = Interentreprise::libellePeriode($annee, $mois);
$lignes = array(
	array($C('Bilan mensuel des factures internes'), $C($periode)),
	array($C('Entreprises'), $C($noms[$a]), $C($noms[$b])),
	array($C('Factures annulées exclues du bilan')),
);
foreach (array(array($a, $b, 'a_vers_b'), array($b, $a, 'b_vers_a')) as $s) {
	$sens = $r[$s[2]];
	$titre = $noms[$s[0]] . ' vers ' . $noms[$s[1]];
	$lignes[] = array();
	$lignes[] = array($C('Factures émises : ' . $titre));
	$lignes[] = array($C('Numéro'), $C('Date'), $C('Emplacement source'), $C('Emplacement de destination'), $C('Note'), $C('Total ($)'));
	foreach ($sens['documents'] as $doc) {
		$lignes[] = array($C($doc['numero']), $C($doc['date_document']), $C($doc['emplacement']), $C($doc['emplacement_dest']), $C($doc['note'] === null ? '' : $doc['note']), $N($doc['total'], 2, 2));
	}
	$lignes[] = array($C('Total des factures'), '', '', '', '', $N($sens['total'], 2, 2));
	$lignes[] = array();
	$lignes[] = array($C('Pièces regroupées : ' . $titre));
	$lignes[] = array($C('Code'), $C('Pièce'), $C('Unité'), $C('Quantité'), $C('Coût moyen pondéré ($)'), $C('Total ($)'));
	foreach ($sens['pieces'] as $p) {
		$lignes[] = array($C($p['code']), $C($p['nom']), $C($p['unite']), $N($p['quantite'], 0, 3), $N($p['cout_moyen'], 2, 4), $N($p['total'], 2, 2));
	}
	$lignes[] = array($C('Total des pièces'), '', '', '', '', $N($sens['total'], 2, 2));
}
$solde = $r['solde'];
$lignes[] = array();
if ($solde['debiteur'] === null) {
	$lignes[] = array($C('Solde'), $C('Aucun solde pour ' . $periode), $N('0.00', 2, 2));
} else {
	$lignes[] = array($C('Solde'), $C($solde['debiteur_nom'] . ' doit à ' . $solde['creancier_nom'] . ' pour ' . $periode), $N($solde['montant'], 2, 2));
}
Journal::ecrire($pdo, utilisateur_id(), 'export.bilan', 'entreprises', null, array('periode' => sprintf('%04d-%02d', $annee, $mois), 'a' => $a, 'b' => $b));
Interentreprise::csvEnvoyer(sprintf('bilan-%04d-%02d.csv', $annee, $mois), $lignes);
