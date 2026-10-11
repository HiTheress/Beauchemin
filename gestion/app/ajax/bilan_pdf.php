<?php
// PDF du bilan mensuel des factures internes entre deux entreprises (gestionnaire+), mêmes paramètres et mêmes droits que bilan_export.php :
// GET annee, mois (mois courant par défaut), a et b (paire d'entreprises ; fixe s'il n'y a que deux entreprises).
// Tous les montants viennent de inventaire()->bilanMensuel. Refus : texte brut avec le code HTTP 403 (rôle ou entreprise) ou 400.
require_once __DIR__ . '/../action/facture_lib.php';
require_once __DIR__ . '/../classes/DocumentVue.php';
require_once __DIR__ . '/../classes/DocumentsPdf.php';
global $pdo, $Ouser;

if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', array('GET', 'HEAD'), true)) {
	header('Allow: GET, HEAD');
	PdfDocument::refuser(405, 'Méthode non permise.');
}
if (!$Ouser->aRole(Inventaire::ROLE_MIN['rapport'])) {
	PdfDocument::refuser(403, 'Vous n\'avez pas la permission de consulter ce rapport.');
}
try {
	list($annee, $mois) = Interentreprise::periode($_GET);
	list($a, $b) = Interentreprise::paire($_GET);
	if (!$Ouser->peutAcces($a) && !$Ouser->peutAcces($b)) {
		PdfDocument::refuser(403, 'Vous n\'avez pas accès à ces entreprises.');
	}
	$r = inventaire()->bilanMensuel(utilisateur_id(), $annee, $mois, $a, $b);
	$m = DocumentVue::bilan($pdo, $r, $annee, $mois, $a, $b, Interentreprise::libellePeriode($annee, $mois));
	$contenu = DocumentsPdf::bilan($m)->contenu();
} catch (InventaireException $ex) {
	PdfDocument::refuser(400, $ex->getMessage());
} catch (Throwable $ex) {
	error_log('PDF ' . ($_SERVER['SCRIPT_NAME'] ?? '') . ' : ' . $ex);
	PdfDocument::refuser(500, 'Erreur inattendue. Réessayez ou contactez l\'administrateur.');
}
Journal::ecrire($pdo, utilisateur_id(), 'export.bilan', 'entreprises', null, array('periode' => sprintf('%04d-%02d', $annee, $mois), 'a' => $a, 'b' => $b, 'format' => 'pdf'));
PdfDocument::envoyer($contenu, sprintf('bilan-%04d-%02d', $annee, $mois));
