<?php
/**
 * Outils communs des endpoints du plan de l'entrepôt (plan_data, plan_version, plan_emplacement, plan_save).
 * Ce fichier n'est pas un endpoint : il est inclus (require_once) par eux. Appelé directement, il répond 404 (après les gardes de init.php : connexion).
 * Refus de droit ou d'accès => 403 ; entrée invalide => 400 (message français) ; autre erreur => 500 générique (journal PHP).
 */
require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/../classes/Plan.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class PlanHttp
{
	/** Le service du plan pour la requête courante. */
	public static function plan()
	{
		global $pdo;
		return new Plan($pdo, inventaire());
	}

	/** Exécute $fn(Plan, id de l'utilisateur) et répond en JSON. */
	public static function executer($fn)
	{
		try {
			$data = $fn(self::plan(), utilisateur_id());
			json_ok(is_array($data) ? $data : array());
		} catch (PlanRefus $ex) {
			json_fail($ex->getMessage(), 403);
		} catch (InventaireException $ex) {
			json_fail($ex->getMessage(), 400, $ex->champ ? array('champ' => $ex->champ) : array());
		} catch (Throwable $ex) {
			error_log('Endpoint ' . (isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '') . ' : ' . $ex);
			json_fail('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
		}
	}

	/** Paramètres de la requête : adresse (GET) puis corps (JSON ou formulaire). */
	public static function requete()
	{
		return $_GET + entree();
	}

	/** Entier strictement positif (nombre ou chaîne de chiffres) ; null si absent, vide ou 0 ; sinon 400. */
	public static function entier(array $in, $cle, $libelle)
	{
		if (!isset($in[$cle]) || $in[$cle] === '' || $in[$cle] === 0 || $in[$cle] === '0') {
			return null;
		}
		$v = $in[$cle];
		if (is_int($v) && $v > 0) {
			return $v;
		}
		if (is_string($v) && ctype_digit($v) && strlen($v) < 10) {
			return (int) $v;
		}
		throw new InventaireException($libelle . ' invalide.', $cle);
	}
}
