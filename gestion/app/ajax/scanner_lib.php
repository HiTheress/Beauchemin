<?php
// Outils communs aux endpoints du module « Scanner et comptage » (scanner*, comptage*).
// Ce fichier ne fait rien lorsqu'on l'appelle directement : il définit seulement une classe.
if (!class_exists('ScanLib', false)) {
	final class ScanLib
	{
		/** Entier positif issu du navigateur (chaîne ou nombre) ; sinon exception « métier » en français. */
		public static function entier($v, $message, $champ = null)
		{
			if (is_int($v) && $v > 0) {
				return $v;
			}
			if (is_string($v) && ctype_digit($v) && strlen($v) < 10 && (int) $v > 0) {
				return (int) $v;
			}
			throw new InventaireException($message, $champ);
		}

		/** Vrai pour true, 1, "1", "true", "on", "oui". */
		public static function booleen($v)
		{
			if (is_bool($v)) {
				return $v;
			}
			if (is_int($v)) {
				return $v === 1;
			}
			return is_string($v) && in_array(strtolower(trim($v)), array('1', 'true', 'on', 'oui'), true);
		}

		/** Chaîne (jamais un tableau) tronquée ; '' si absente. */
		public static function texte($v, $max = 255)
		{
			return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
		}

		/**
		 * Emplacement (actif ou non) d'une entreprise accessible à l'utilisateur ; même message qu'il n'existe pas
		 * ou qu'il appartienne à une autre entreprise (on ne révèle pas son existence).
		 */
		public static function emplacementAccessible($id)
		{
			global $pdo, $Ouser;
			$st = $pdo->prepare(
				'SELECT e.id, e.nom, e.type, e.code_barres, e.actif, e.entreprise_id, en.nom AS entreprise_nom
				   FROM emplacements e JOIN entreprises en ON en.id = e.entreprise_id WHERE e.id = ?'
			);
			$st->execute(array((int) $id));
			$e = $st->fetch(PDO::FETCH_ASSOC);
			if (!$e || !$Ouser->peutAcces((int) $e['entreprise_id'])) {
				throw new InventaireException('Emplacement introuvable ou non accessible.', 'emplacement_id');
			}
			return $e;
		}

		/** Comptage en cours d'un emplacement (id, numero) ou null. À n'appeler qu'après le contrôle d'accès. */
		public static function comptageOuvert($emplacementId)
		{
			global $pdo;
			$st = $pdo->prepare("SELECT id, numero FROM comptages WHERE emplacement_id = ? AND statut = 'en_cours' ORDER BY id LIMIT 1");
			$st->execute(array((int) $emplacementId));
			$r = $st->fetch(PDO::FETCH_ASSOC);
			return $r ? array('id' => (int) $r['id'], 'numero' => $r['numero']) : null;
		}
	}
}
