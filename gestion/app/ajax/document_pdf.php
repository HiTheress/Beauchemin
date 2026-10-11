<?php
// PDF d'un document : réception, déplacement, utilisation, correction du stock (employé+) et facture interne (gestionnaire+).
// GET : id (entier). Mêmes droits que la page du document : inventaire()->document() (employé+, entreprise émettrice OU destinataire),
// aucun coût ni total pour un employé (peutVoirCouts), emplacement d'une entreprise inaccessible masqué. Document inexistant ou
// inaccessible : la même réponse neutre (404 texte brut). Réponse : application/pdf en téléchargement.
require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/../classes/DocumentVue.php';
require_once __DIR__ . '/../classes/DocumentsPdf.php';
global $pdo, $Ouser;

if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', array('GET', 'HEAD'), true)) {
	header('Allow: GET, HEAD');
	PdfDocument::refuser(405, 'Méthode non permise.');
}
$id = (isset($_GET['id']) && is_string($_GET['id']) && ctype_digit($_GET['id']) && strlen($_GET['id']) < 10) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
	PdfDocument::refuser(404, 'Introuvable.');
}
try {
	try {
		$r = inventaire()->document(utilisateur_id(), $id);
	} catch (InventaireException $ex) {
		PdfDocument::refuser(404, 'Introuvable.');                     // inexistant ou inaccessible : même réponse
	}
	// La facture interne est un document de gestionnaire (comme sa page) : l'employé n'en reçoit pas, ni montants ni signatures
	if ($r['doc']['type'] === 'facture_interne' && !$Ouser->aRole('gestionnaire')) {
		PdfDocument::refuser(403, 'Vous n\'avez pas la permission d\'effectuer cette opération.');
	}
	$m = DocumentVue::document($pdo, $Ouser, $r, array('masque' => $r['doc']['type'] === 'facture_interne' ? 'non communiqué' : 'Autre entreprise'));
	$contenu = DocumentsPdf::document($m)->contenu();
} catch (Throwable $ex) {
	error_log('PDF ' . ($_SERVER['SCRIPT_NAME'] ?? '') . ' : ' . $ex);
	PdfDocument::refuser(500, 'Erreur inattendue. Réessayez ou contactez l\'administrateur.');
}
PdfDocument::envoyer($contenu, $m['numero']);
