<?php
/** Journal d'audit : qui a fait quoi, quand. Les échecs d'écriture n'interrompent jamais l'action. */
final class Journal
{
	public static function ecrire(PDO $pdo, $utilisateurId, $action, $entite = null, $entiteId = null, $details = null)
	{
		try {
			$ip = isset($_SERVER['REMOTE_ADDR']) ? substr($_SERVER['REMOTE_ADDR'], 0, 45) : null;
			if (is_array($details)) {
				$details = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
			}
			$st = $pdo->prepare('INSERT INTO journal (date_action, utilisateur_id, action, entite, entite_id, details, ip) VALUES (NOW(), ?, ?, ?, ?, ?, ?)');
			$st->execute(array($utilisateurId, $action, $entite, $entiteId, $details, $ip));
		} catch (Throwable $e) {
			error_log('Journal: ' . $e->getMessage());
		}
	}
}
