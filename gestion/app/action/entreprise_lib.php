<?php
/**
 * Gestion des entreprises (module E). Inclus par entreprise_save.php et entreprise_activer.php ; appelé directement : 404.
 * Pas de suppression : on désactive. Désactiver est refusé s'il reste du stock dans les emplacements de l'entreprise,
 * si un comptage y est en cours, ou s'il s'agit de la dernière entreprise active.
 */
require_once __DIR__ . '/utilisateur_lib.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class AdminEntreprise
{
	/** Création ou modification : code, nom, adresse, actif? (en modification, un changement d'état suit les mêmes règles que la désactivation). */
	public static function enregistrer($acteur, $id, array $d)
	{
		global $pdo;
		$code = Admin::texte($d, 'code', 'Le code', 10, true);
		$code = mb_strtoupper($code, 'UTF-8');
		if (!preg_match('/^[A-Z0-9_-]{1,10}\z/', $code)) {
			throw new InventaireException('Le code doit contenir de 1 à 10 caractères : lettres sans accent, chiffres, tiret ou tiret bas (exemple : BEA).', 'code');
		}
		$nom = Admin::texte($d, 'nom', 'Le nom', 100, true);
		$adresse = Admin::texte($d, 'adresse', 'L\'adresse', 255, false);
		$actif = array_key_exists('actif', $d) ? Admin::booleen($d['actif']) : null;

		return inventaire()->transaction(function () use ($pdo, $acteur, $id, $code, $nom, $adresse, $actif) {
			Admin::acteur($acteur);
			$st = $pdo->prepare('SELECT id FROM entreprises WHERE code = ? AND id <> ? LIMIT 1');
			$st->execute(array($code, (int) $id));
			if ($st->fetch()) {
				throw new InventaireException('Ce code est déjà utilisé par une autre entreprise.', 'code');
			}
			$st = $pdo->prepare('SELECT id FROM entreprises WHERE nom = ? AND id <> ? LIMIT 1');
			$st->execute(array($nom, (int) $id));
			if ($st->fetch()) {
				throw new InventaireException('Une entreprise porte déjà ce nom (les majuscules et les accents ne comptent pas).', 'nom');
			}
			try {
				if (!$id) {
					$pdo->prepare('INSERT INTO entreprises (code, nom, adresse, actif) VALUES (?, ?, ?, 1)')->execute(array($code, $nom, $adresse === '' ? null : $adresse));
					$nid = (int) $pdo->lastInsertId();
					Journal::ecrire($pdo, $acteur, 'entreprise.cree', 'entreprises', $nid, array('code' => $code, 'nom' => $nom));
					return array('id' => $nid, 'cree' => true);
				}
				$st = $pdo->prepare('SELECT code, nom, adresse, actif FROM entreprises WHERE id = ? FOR UPDATE');
				$st->execute(array($id));
				$avant = $st->fetch();
				if (!$avant) {
					throw new InventaireException('Entreprise introuvable.');
				}
				$apres = array('code' => $code, 'nom' => $nom, 'adresse' => $adresse === '' ? null : $adresse);
				$chg = array();
				foreach ($apres as $k => $v) {
					if ((string) $avant[$k] !== (string) $v) {
						$chg[$k] = array($avant[$k], $v);
					}
				}
				if ($chg) {
					$pdo->prepare('UPDATE entreprises SET code = ?, nom = ?, adresse = ? WHERE id = ?')->execute(array($code, $nom, $apres['adresse'], $id));
					Journal::ecrire($pdo, $acteur, 'entreprise.modifie', 'entreprises', $id, array('code' => $code, 'nom' => $nom, 'changements' => $chg));
				}
				$r = array('id' => $id, 'cree' => false, 'actif' => (bool) $avant['actif']);
				if ($actif !== null && $actif !== (bool) $avant['actif']) {
					$r = array_merge($r, self::definirActif($acteur, $id, $actif));
				}
				return $r;
			} catch (PDOException $ex) {
				if (Admin::doublon($ex, 'uq_entreprises_code')) {
					throw new InventaireException('Ce code est déjà utilisé par une autre entreprise.', 'code');
				}
				throw $ex;
			}
		});
	}

	/** Désactive ou réactive. Retourne array(id, actif, inchange, utilisateurs_sans_acces). */
	public static function definirActif($acteur, $id, $actif)
	{
		global $pdo;
		return inventaire()->transaction(function () use ($pdo, $acteur, $id, $actif) {
			Admin::acteur($acteur);
			$st = $pdo->prepare('SELECT id, nom, actif FROM entreprises WHERE id = ? FOR UPDATE');
			$st->execute(array($id));
			$e = $st->fetch();
			if (!$e) {
				throw new InventaireException('Entreprise introuvable.');
			}
			if ((bool) $e['actif'] === (bool) $actif) {
				return array('id' => $id, 'actif' => (bool) $actif, 'inchange' => true, 'utilisateurs_sans_acces' => 0);
			}
			if (!$actif) {
				$st = $pdo->prepare('SELECT COUNT(*) FROM entreprises WHERE actif = 1 AND id <> ?');
				$st->execute(array($id));
				if ((int) $st->fetchColumn() === 0) {
					throw new InventaireException('Impossible de désactiver « ' . $e['nom'] . ' » : c\'est la dernière entreprise active.', 'derniere');
				}
				// Du stock à reprendre (lignes verrouillées : personne ne peut en ajouter pendant la vérification)
				$st = $pdo->prepare('SELECT s.piece_id FROM stock s JOIN emplacements em ON em.id = s.emplacement_id WHERE em.entreprise_id = ? AND s.quantite > 0 FOR UPDATE');
				$st->execute(array($id));
				$pieces = count(array_unique($st->fetchAll(PDO::FETCH_COLUMN)));
				if ($pieces > 0) {
					throw new InventaireException('Impossible de désactiver « ' . $e['nom'] . ' » : il reste du stock dans ses emplacements (' . Admin::pluriel($pieces, 'pièce', 'pièces') . '). Videz-le d\'abord par un transfert, une sortie ou un ajustement.', 'stock');
				}
				$st = $pdo->prepare("SELECT numero FROM comptages WHERE entreprise_id = ? AND statut = 'en_cours' LIMIT 1");
				$st->execute(array($id));
				if ($num = $st->fetchColumn()) {
					throw new InventaireException('Impossible de désactiver « ' . $e['nom'] . ' » : un comptage est en cours (' . $num . '). Terminez-le ou annulez-le d\'abord.', 'comptage');
				}
			}
			$pdo->prepare('UPDATE entreprises SET actif = ? WHERE id = ?')->execute(array($actif ? 1 : 0, $id));
			Journal::ecrire($pdo, $acteur, $actif ? 'entreprise.reactive' : 'entreprise.desactive', 'entreprises', $id, array('nom' => $e['nom']));
			$sans = 0;
			if (!$actif) {
				// Utilisateurs actifs rattachés à cette entreprise, qui n'ont plus aucune entreprise active
				$st = $pdo->prepare(
					"SELECT COUNT(*) FROM utilisateurs u
					  WHERE u.actif = 1 AND u.role <> 'admin'
					    AND EXISTS (SELECT 1 FROM utilisateur_entreprises ue WHERE ue.utilisateur_id = u.id AND ue.entreprise_id = ?)
					    AND NOT EXISTS (SELECT 1 FROM utilisateur_entreprises ue JOIN entreprises en ON en.id = ue.entreprise_id WHERE ue.utilisateur_id = u.id AND en.actif = 1)"
				);
				$st->execute(array($id));
				$sans = (int) $st->fetchColumn();
			}
			return array('id' => $id, 'actif' => (bool) $actif, 'inchange' => false, 'utilisateurs_sans_acces' => $sans);
		});
	}
}
