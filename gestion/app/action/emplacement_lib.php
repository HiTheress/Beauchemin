<?php
/**
 * Gestion des emplacements (module E). Inclus par emplacement_save.php, emplacement_activer.php et
 * emplacement_code_proposer.php ; appelé directement : 404.
 * Pas de suppression : on désactive. Un code-barres est unique GLOBALEMENT (pièces, alias de pièces, emplacements).
 */
require_once __DIR__ . '/utilisateur_lib.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class AdminEmplacement
{
	/** Prochain code EMP-###### libre (séquentiel : le plus grand numéro existant + 1). */
	public static function prochainCode()
	{
		global $pdo;
		$max = (int) $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(code_barres, 5) AS UNSIGNED)), 0) FROM emplacements WHERE code_barres REGEXP '^EMP-[0-9]{6}$'")->fetchColumn();
		for ($n = $max + 1, $essais = 0; $essais < 1000; $n++, $essais++) {
			$code = sprintf('EMP-%06d', $n);
			if (inventaire()->codeDisponible($code, 0)) {
				return $code;
			}
		}
		throw new InventaireException('Impossible de proposer un code-barres libre. Saisissez-en un.', 'code_barres');
	}

	/** Code saisi : sans espaces de bord, caractères Code 128 (ASCII imprimable), 1 à 40 caractères. */
	private static function codeValide($v)
	{
		$v = preg_replace('/^\s+|\s+$/u', '', (string) $v);
		if (!Code128::valide($v)) {
			throw new InventaireException('Le code-barres doit contenir de 1 à 40 caractères parmi les lettres sans accent, les chiffres et les signes usuels (exemple : EMP-000007).', 'code_barres');
		}
		return $v;
	}

	/** Création (id = 0) ou modification : entreprise_id, nom, type, code_barres, actif?. */
	public static function enregistrer($acteur, $id, array $d)
	{
		global $pdo;
		$eid = Admin::entier(isset($d['entreprise_id']) ? $d['entreprise_id'] : null, 'Choisissez une entreprise.', 'entreprise_id');
		$nom = Admin::texte($d, 'nom', 'Le nom', 100, true);
		$type = isset($d['type']) ? $d['type'] : null;
		if (!is_string($type) || !isset(TYPES_EMPLACEMENT_FR[$type])) {
			throw new InventaireException('Choisissez le type : entrepôt, boutique ou cube de service.', 'type');
		}
		$codeBrut = Admin::texte($d, 'code_barres', 'Le code-barres', 64, false);
		if ($codeBrut === '' && $id) {
			throw new InventaireException('Le code-barres est obligatoire (sans lui, l\'emplacement ne peut pas être scanné).', 'code_barres');
		}
		$code = ($codeBrut === '') ? null : self::codeValide($codeBrut);       // null : proposé automatiquement à la création
		$actif = array_key_exists('actif', $d) ? Admin::booleen($d['actif']) : null;

		// Le code-barres d'un emplacement partage son espace de noms avec les codes de pièces et leurs alias : on prend le
		// verrou global des codes AVANT la transaction (vérification « libre ? » puis écriture atomiques), comme le catalogue.
		return inventaire()->avecVerrouCodes(function () use ($pdo, $acteur, $id, $eid, $nom, $type, $code, $actif) {
		return inventaire()->transaction(function () use ($pdo, $acteur, $id, $eid, $nom, $type, $code, $actif) {
			Admin::acteur($acteur);
			$st = $pdo->prepare('SELECT id, nom, actif FROM entreprises WHERE id = ? FOR UPDATE');
			$st->execute(array($eid));
			$ent = $st->fetch();
			if (!$ent) {
				throw new InventaireException('Entreprise introuvable.', 'entreprise_id');
			}
			$avant = null;
			if ($id) {
				$st = $pdo->prepare('SELECT id, entreprise_id, nom, type, code_barres, actif FROM emplacements WHERE id = ? FOR UPDATE');
				$st->execute(array($id));
				$avant = $st->fetch();
				if (!$avant) {
					throw new InventaireException('Emplacement introuvable.');
				}
			}
			if ((!$avant || (int) $avant['entreprise_id'] !== $eid) && !$ent['actif']) {
				throw new InventaireException('L\'entreprise « ' . $ent['nom'] . ' » est désactivée : réactivez-la d\'abord.', 'entreprise_id');
			}
			if ($avant && (int) $avant['entreprise_id'] !== $eid && self::aDeLHistorique($id)) {
				throw new InventaireException('Cet emplacement a déjà des mouvements, du stock ou des comptages : on ne peut pas le changer d\'entreprise. Créez plutôt un nouvel emplacement.', 'entreprise_id');
			}
			// Nom unique dans l'entreprise (sans égard à la casse)
			$st = $pdo->prepare('SELECT id FROM emplacements WHERE entreprise_id = ? AND nom = ? AND id <> ? LIMIT 1');
			$st->execute(array($eid, $nom, (int) $id));
			if ($st->fetch()) {
				throw new InventaireException('Cette entreprise a déjà un emplacement nommé « ' . $nom . ' » (les majuscules et les accents ne comptent pas).', 'nom');
			}
			// Code-barres : libre dans tout le système (sauf si on garde le sien)
			if ($code === null) {
				$code = self::prochainCode();
			} elseif (!$avant || strcasecmp((string) $avant['code_barres'], $code) !== 0) {
				if (!inventaire()->codeDisponible($code, 0)) {
					throw new InventaireException('Ce code-barres est déjà utilisé par une pièce ou par un autre emplacement.', 'code_barres');
				}
			}
			try {
				if (!$avant) {
					$pdo->prepare('INSERT INTO emplacements (entreprise_id, nom, type, code_barres, actif) VALUES (?, ?, ?, ?, 1)')->execute(array($eid, $nom, $type, $code));
					$nid = (int) $pdo->lastInsertId();
					Journal::ecrire($pdo, $acteur, 'emplacement.cree', 'emplacements', $nid, array('nom' => $nom, 'entreprise' => $ent['nom'], 'type' => $type, 'code_barres' => $code));
					return array('id' => $nid, 'cree' => true, 'code_barres' => $code);
				}
				$apres = array('entreprise_id' => $eid, 'nom' => $nom, 'type' => $type, 'code_barres' => $code);
				$chg = array();
				foreach ($apres as $k => $v) {
					if ((string) $avant[$k] !== (string) $v) {
						$chg[$k] = array($avant[$k], $v);
					}
				}
				if ($chg) {
					$pdo->prepare('UPDATE emplacements SET entreprise_id = ?, nom = ?, type = ?, code_barres = ? WHERE id = ?')->execute(array($eid, $nom, $type, $code, $id));
					if (isset($chg['entreprise_id'])) {
						$noms = Admin::nomsEntreprises();
						$chg['entreprise'] = array(isset($noms[(int) $avant['entreprise_id']]) ? $noms[(int) $avant['entreprise_id']] : $avant['entreprise_id'], $ent['nom']);
						unset($chg['entreprise_id']);
					}
					Journal::ecrire($pdo, $acteur, 'emplacement.modifie', 'emplacements', $id, array('nom' => $nom, 'changements' => $chg));
				}
				$r = array('id' => $id, 'cree' => false, 'code_barres' => $code, 'actif' => (bool) $avant['actif']);
				if ($actif !== null && $actif !== (bool) $avant['actif']) {
					$r = array_merge($r, self::definirActif($acteur, $id, $actif));
				}
				return $r;
			} catch (PDOException $ex) {
				if (Admin::doublon($ex, 'uq_emplacements_code')) {
					throw new InventaireException('Ce code-barres est déjà utilisé par un autre emplacement.', 'code_barres');
				}
				if (Admin::doublon($ex, 'uq_emplacements_nom')) {
					throw new InventaireException('Cette entreprise a déjà un emplacement nommé « ' . $nom . ' ».', 'nom');
				}
				throw $ex;
			}
		});
		});
	}

	/** Désactive (refusé s'il reste du stock ou si un comptage est en cours) ou réactive. */
	public static function definirActif($acteur, $id, $actif)
	{
		global $pdo;
		return inventaire()->transaction(function () use ($pdo, $acteur, $id, $actif) {
			Admin::acteur($acteur);
			$st = $pdo->prepare('SELECT id, nom, actif FROM emplacements WHERE id = ? FOR UPDATE');
			$st->execute(array($id));
			$e = $st->fetch();
			if (!$e) {
				throw new InventaireException('Emplacement introuvable.');
			}
			if ((bool) $e['actif'] === (bool) $actif) {
				return array('id' => $id, 'actif' => (bool) $actif, 'inchange' => true);
			}
			if (!$actif) {
				$st = $pdo->prepare('SELECT piece_id FROM stock WHERE emplacement_id = ? AND quantite > 0 FOR UPDATE');
				$st->execute(array($id));
				$pieces = count($st->fetchAll(PDO::FETCH_COLUMN));
				if ($pieces > 0) {
					throw new InventaireException('Impossible de désactiver « ' . $e['nom'] . ' » : il reste ' . Admin::pluriel($pieces, 'pièce', 'pièces') . ' en stock à cet emplacement. Videz-le d\'abord par un transfert, une sortie ou un ajustement.', 'stock');
				}
				$st = $pdo->prepare("SELECT numero FROM comptages WHERE emplacement_id = ? AND statut = 'en_cours' LIMIT 1");
				$st->execute(array($id));
				if ($num = $st->fetchColumn()) {
					throw new InventaireException('Impossible de désactiver « ' . $e['nom'] . ' » : un comptage est en cours à cet emplacement (' . $num . '). Terminez-le ou annulez-le d\'abord.', 'comptage');
				}
			}
			$pdo->prepare('UPDATE emplacements SET actif = ? WHERE id = ?')->execute(array($actif ? 1 : 0, $id));
			Journal::ecrire($pdo, $acteur, $actif ? 'emplacement.reactive' : 'emplacement.desactive', 'emplacements', $id, array('nom' => $e['nom']));
			return array('id' => $id, 'actif' => (bool) $actif, 'inchange' => false);
		});
	}

	/** Vrai si l'emplacement apparaît déjà quelque part (mouvements, documents, stock, comptages). */
	private static function aDeLHistorique($id)
	{
		global $pdo;
		$st = $pdo->prepare(
			'SELECT (EXISTS (SELECT 1 FROM mouvements WHERE emplacement_id = :a)
			      OR EXISTS (SELECT 1 FROM documents WHERE emplacement_id = :b OR emplacement_dest_id = :c)
			      OR EXISTS (SELECT 1 FROM stock WHERE emplacement_id = :d)
			      OR EXISTS (SELECT 1 FROM comptages WHERE emplacement_id = :e))'
		);
		$st->execute(array(':a' => $id, ':b' => $id, ':c' => $id, ':d' => $id, ':e' => $id));
		return (bool) $st->fetchColumn();
	}
}
