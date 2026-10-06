<?php
/**
 * Fonctions communes aux endpoints d'administration (module E : utilisateurs, entreprises, emplacements, journal, profil).
 * Ce fichier n'est pas un endpoint : il est inclus par les autres (require_once __DIR__ . '/utilisateur_lib.php').
 * Appelé directement, il répond 404 (après les gardes de init.php : connexion, jeton CSRF).
 *
 * Règles appliquées partout ici :
 *  - le rôle « administrateur » est relu dans la base, DANS la transaction (Admin::acteur) ;
 *  - requêtes préparées seulement ; aucun mot de passe n'est écrit dans le journal, ni renvoyé au navigateur ;
 *  - les messages d'erreur (InventaireException) sont en français et affichables tels quels.
 */
require_once __DIR__ . '/../init.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class Admin
{
	const MDP_MIN = 10;
	const MDP_MAX_OCTETS = 72;      // limite de bcrypt : au-delà, le mot de passe serait tronqué en silence
	const MAX_ENTREPRISES = 100;    // borne d'une liste d'entreprises envoyée par le navigateur (une requête ne doit pas pouvoir en contenir des milliers)

	/** Ce que chaque rôle permet (affiché dans le formulaire d'utilisateur et dans le profil). */
	const ROLES_AIDE = array(
		'admin' => 'Accès complet, y compris les utilisateurs, les entreprises, les emplacements, le journal et les sauvegardes. Voit toutes les entreprises.',
		'gestionnaire' => 'Voit les coûts et les prix. Fait les réceptions, les ajustements, les factures internes, le catalogue et les rapports, dans ses entreprises.',
		'employe' => 'Consulte les pièces et le stock (sans les coûts). Fait des transferts, des sorties et des comptages, dans ses entreprises.',
	);

	// ------------------------------------------------------------------
	//  Contrôle d'accès
	// ------------------------------------------------------------------

	/** Début de tout endpoint d'administration : exige un administrateur actif (sinon 403 et fin). Retourne son id. */
	public static function exiger()
	{
		global $Ouser;
		if (!$Ouser->is_admin()) {
			json_fail('Cette action est réservée à l\'administrateur.', 403);
		}
		return utilisateur_id();
	}

	/**
	 * Revérifie, DANS la transaction, que l'acteur est toujours un administrateur actif (un verrou partagé sur sa ligne
	 * empêche de le rétrograder avant la fin de l'opération).
	 */
	public static function acteur($acteur)
	{
		global $pdo;
		$st = $pdo->prepare("SELECT id FROM utilisateurs WHERE id = ? AND role = 'admin' AND actif = 1 LOCK IN SHARE MODE");
		$st->execute(array((int) $acteur));
		if (!$st->fetch()) {
			throw new InventaireException('Cette action est réservée à l\'administrateur.');
		}
	}

	/**
	 * Pour les changements d'utilisateurs : verrouille TOUS les administrateurs actifs (ordre des id) afin que deux
	 * modifications simultanées ne puissent pas laisser le système sans administrateur. Retourne leurs id.
	 */
	public static function verrouillerAdmins($acteur)
	{
		global $pdo;
		$ids = array_map('intval', $pdo->query("SELECT id FROM utilisateurs WHERE role = 'admin' AND actif = 1 ORDER BY id FOR UPDATE")->fetchAll(PDO::FETCH_COLUMN));
		if (!in_array((int) $acteur, $ids, true)) {
			throw new InventaireException('Cette action est réservée à l\'administrateur.');
		}
		return $ids;
	}

	// ------------------------------------------------------------------
	//  Lecture et validation des champs envoyés par le navigateur
	// ------------------------------------------------------------------

	/** Champ texte nettoyé : espaces de bord retirés, caractères de contrôle refusés, longueur bornée. '' si vide. */
	public static function texte(array $d, $cle, $etiquette, $max, $obligatoire = false)
	{
		$v = isset($d[$cle]) ? $d[$cle] : '';
		if (is_array($v) || is_object($v) || is_bool($v)) {
			throw new InventaireException($etiquette . ' est invalide.', $cle);
		}
		$v = (string) $v;
		if (!mb_check_encoding($v, 'UTF-8')) {
			throw new InventaireException($etiquette . ' contient des caractères invalides.', $cle);
		}
		$v = preg_replace('/^\s+|\s+$/u', '', $v);
		if (preg_match('/[\x00-\x1F\x7F]/', $v)) {
			throw new InventaireException($etiquette . ' contient des caractères non permis.', $cle);
		}
		if ($v === '') {
			if ($obligatoire) {
				throw new InventaireException($etiquette . ' est obligatoire.', $cle);
			}
			return '';
		}
		if (mb_strlen($v) > $max) {
			throw new InventaireException($etiquette . ' ne doit pas dépasser ' . $max . ' caractères.', $cle);
		}
		return $v;
	}

	/** Entier positif (identifiant) ou exception. */
	public static function entier($v, $message = 'Identifiant invalide.', $champ = null)
	{
		if (is_int($v) && $v > 0) {
			return $v;
		}
		if (is_string($v) && preg_match('/^[0-9]{1,10}\z/', $v) && (int) $v > 0) {
			return (int) $v;
		}
		throw new InventaireException($message, $champ);
	}

	/** Identifiant facultatif : absent / vide / 0 = création (0). */
	public static function idFacultatif(array $d, $cle = 'id')
	{
		if (!isset($d[$cle]) || $d[$cle] === '' || $d[$cle] === 0 || $d[$cle] === '0') {
			return 0;
		}
		return self::entier($d[$cle]);
	}

	/** Booléen explicite. Absent (null) : $defaut s'il est fourni, sinon erreur (jamais de valeur devinée pour un changement d'état). */
	public static function booleen($v, $defaut = null)
	{
		if ($v === null) {
			if ($defaut === null) {
				throw new InventaireException('Valeur invalide (oui ou non attendu).');
			}
			return $defaut;
		}
		if (is_bool($v)) {
			return $v;
		}
		if (is_int($v) && ($v === 0 || $v === 1)) {
			return $v === 1;
		}
		if (is_string($v)) {
			$r = filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
			if ($r !== null) {
				return $r;
			}
		}
		throw new InventaireException('Valeur invalide (oui ou non attendu).');
	}

	public static function role($v)
	{
		if (!is_string($v) || !isset(ROLES_FR[$v])) {
			throw new InventaireException('Choisissez un rôle : administrateur, gestionnaire ou employé.', 'role');
		}
		return $v;
	}

	/** Nom d'utilisateur : 3 à 50 caractères parmi A-Z a-z 0-9 . _ - */
	public static function nomUtilisateur(array $d)
	{
		$v = self::texte($d, 'nom_utilisateur', 'Le nom d\'utilisateur', 50, true);
		if (!preg_match('/^[A-Za-z0-9._-]{3,50}\z/', $v)) {
			throw new InventaireException('Le nom d\'utilisateur doit contenir de 3 à 50 caractères : lettres sans accent, chiffres, point, tiret ou tiret bas.', 'nom_utilisateur');
		}
		return $v;
	}

	/**
	 * Mot de passe : au moins 10 caractères, au plus 72 octets, ni vide ni identique au nom d'utilisateur.
	 * Jamais d'espaces retirés : on garde exactement ce qui a été saisi.
	 */
	public static function motDePasse($v, $nomUtilisateur, $champ = 'mot_de_passe')
	{
		if (!is_string($v)) {
			throw new InventaireException('Le mot de passe est obligatoire.', $champ);
		}
		if (!mb_check_encoding($v, 'UTF-8') || preg_match('/[\x00-\x1F\x7F]/', $v)) {
			throw new InventaireException('Le mot de passe contient des caractères non permis.', $champ);
		}
		if (mb_strlen($v) < self::MDP_MIN) {
			throw new InventaireException('Le mot de passe doit contenir au moins ' . self::MDP_MIN . ' caractères.', $champ);
		}
		if (strlen($v) > self::MDP_MAX_OCTETS) {
			throw new InventaireException('Le mot de passe est trop long (' . self::MDP_MAX_OCTETS . ' caractères au maximum, les lettres accentuées comptent double).', $champ);
		}
		if (trim($v) === '') {
			throw new InventaireException('Le mot de passe ne peut pas être composé seulement d\'espaces.', $champ);
		}
		if (strcasecmp($v, (string) $nomUtilisateur) === 0) {
			throw new InventaireException('Le mot de passe ne doit pas être identique au nom d\'utilisateur.', $champ);
		}
		return $v;
	}

	/** « 1 pièce » / « 3 pièces ». */
	public static function pluriel($n, $singulier, $pluriel)
	{
		return (int) $n . ' ' . ((int) $n > 1 ? $pluriel : $singulier);
	}

	/** Liste d'identifiants d'entreprises envoyée par le navigateur : entiers positifs distincts (triés), tous existants. */
	public static function entreprisesIds($brut)
	{
		global $pdo;
		if ($brut === null || $brut === '') {
			return array();
		}
		if (!is_array($brut) || count($brut) > self::MAX_ENTREPRISES) {
			throw new InventaireException('Liste d\'entreprises invalide.', 'entreprise_ids');
		}
		$ids = array();
		foreach ($brut as $v) {
			$ids[] = self::entier($v, 'Entreprise invalide.', 'entreprise_ids');
		}
		$ids = array_values(array_unique($ids));
		sort($ids);
		if ($ids) {
			$in = implode(',', array_fill(0, count($ids), '?'));
			$st = $pdo->prepare("SELECT COUNT(*) FROM entreprises WHERE id IN ($in)");
			$st->execute($ids);
			if ((int) $st->fetchColumn() !== count($ids)) {
				throw new InventaireException('Entreprise introuvable.', 'entreprise_ids');
			}
		}
		return $ids;
	}

	/**
	 * Un gestionnaire ou un employé actif doit pouvoir travailler quelque part : au moins une de ses entreprises doit être active
	 * (sinon toutes ses pages sont vides). $ids = entreprises choisies.
	 */
	public static function exigerEntrepriseActive(array $ids)
	{
		global $pdo;
		if (!$ids) {
			return;
		}
		$in = implode(',', array_fill(0, count($ids), '?'));
		$st = $pdo->prepare("SELECT COUNT(*) FROM entreprises WHERE actif = 1 AND id IN ($in)");
		$st->execute(array_values($ids));
		if ((int) $st->fetchColumn() === 0) {
			throw new InventaireException('Les entreprises de ce compte sont toutes désactivées : il n\'aurait accès à rien. Ajoutez-lui une entreprise active (bouton « Modifier ») ou réactivez une entreprise dans « Entreprises ».', 'entreprise_ids');
		}
	}

	/** En-tête visible seulement à l'impression (le titre de la page est masqué par la coquille) : titre, date et personne qui imprime. */
	public static function enteteImpression($titre)
	{
		global $Ouser;
		$moi = $Ouser->courant();
		echo '<p class="d-none d-print-block adm-entete-impression"><strong>' . e($titre) . '</strong> — imprimé le ' . e(date('Y-m-d')) . ' par ' . e($moi ? $moi['nom_utilisateur'] : '') . '</p>';
	}

	/** Vrai si l'exception est une violation d'unicité (doublon) ; $cle = nom de l'index fautif s'il est donné. */
	public static function doublon(PDOException $ex, $cle = null)
	{
		if (!isset($ex->errorInfo[1]) || (int) $ex->errorInfo[1] !== 1062) {
			return false;
		}
		return $cle === null || (isset($ex->errorInfo[2]) && strpos((string) $ex->errorInfo[2], $cle) !== false);
	}

	/** Nom des entreprises par id : array(id => nom). */
	public static function nomsEntreprises()
	{
		global $pdo;
		$r = array();
		foreach ($pdo->query('SELECT id, nom FROM entreprises')->fetchAll() as $l) {
			$r[(int) $l['id']] = $l['nom'];
		}
		return $r;
	}
}

/** Gestion des comptes utilisateurs (administrateur seulement). */
final class AdminUtilisateur
{
	/** Création : nom_utilisateur, nom_complet, role, actif?, entreprise_ids[], mot_de_passe. */
	public static function creer($acteur, array $d)
	{
		global $pdo;
		$nom = Admin::nomUtilisateur($d);
		$complet = Admin::texte($d, 'nom_complet', 'Le nom complet', 100, true);
		$role = Admin::role(isset($d['role']) ? $d['role'] : null);
		$actif = Admin::booleen(isset($d['actif']) ? $d['actif'] : null, true);
		$entreprises = array();
		if ($role !== 'admin') {
			$entreprises = Admin::entreprisesIds(isset($d['entreprise_ids']) ? $d['entreprise_ids'] : null);
			if (!$entreprises) {
				throw new InventaireException('Un gestionnaire ou un employé doit avoir accès à au moins une entreprise.', 'entreprise_ids');
			}
			if ($actif) {
				Admin::exigerEntrepriseActive($entreprises);
			}
		}
		$mdp = Admin::motDePasse(isset($d['mot_de_passe']) ? $d['mot_de_passe'] : null, $nom);
		$hash = password_hash($mdp, PASSWORD_DEFAULT);
		unset($mdp, $d);

		return inventaire()->transaction(function () use ($pdo, $acteur, $nom, $complet, $role, $actif, $entreprises, $hash) {
			Admin::verrouillerAdmins($acteur);
			self::verifierNomLibre($nom, 0);
			try {
				$pdo->prepare('INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?)')
					->execute(array($nom, $complet, $hash, $role, $actif ? 1 : 0));
			} catch (PDOException $ex) {
				if (Admin::doublon($ex)) {
					throw new InventaireException('Ce nom d\'utilisateur est déjà utilisé (les majuscules et les minuscules ne comptent pas).', 'nom_utilisateur');
				}
				throw $ex;
			}
			$id = (int) $pdo->lastInsertId();
			foreach ($entreprises as $eid) {
				$pdo->prepare('INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES (?, ?)')->execute(array($id, $eid));
			}
			$noms = Admin::nomsEntreprises();
			Journal::ecrire($pdo, $acteur, 'utilisateur.cree', 'utilisateurs', $id, array(
				'nom_utilisateur' => $nom, 'nom_complet' => $complet, 'role' => $role, 'actif' => $actif,
				'entreprises' => ($role === 'admin') ? 'toutes' : self::noms($entreprises, $noms),
			));
			return array('id' => $id, 'nom_utilisateur' => $nom, 'cree' => true);
		});
	}

	/**
	 * Modification. $d ne contient que les champs à changer (nom_utilisateur, nom_complet, role, actif, entreprise_ids).
	 * Garde-fous : on ne se désactive pas et on ne se rétrograde pas soi-même ; on ne désactive pas et on ne rétrograde pas
	 * le dernier administrateur actif ; un gestionnaire ou un employé garde au moins une entreprise.
	 */
	public static function modifier($acteur, $id, array $d)
	{
		global $pdo;
		$nouveau = array();
		if (array_key_exists('nom_utilisateur', $d)) {
			$nouveau['nom_utilisateur'] = Admin::nomUtilisateur($d);
		}
		if (array_key_exists('nom_complet', $d)) {
			$nouveau['nom_complet'] = Admin::texte($d, 'nom_complet', 'Le nom complet', 100, true);
		}
		if (array_key_exists('role', $d)) {
			$nouveau['role'] = Admin::role($d['role']);
		}
		if (array_key_exists('actif', $d)) {
			$nouveau['actif'] = Admin::booleen($d['actif']);
		}
		$demandees = array_key_exists('entreprise_ids', $d) ? Admin::entreprisesIds($d['entreprise_ids']) : null;
		// Version de la fiche vue par l'administrateur (facultative pour les appels partiels, envoyée par le formulaire)
		$empreinte = null;
		if (array_key_exists('empreinte', $d)) {
			if (!is_string($d['empreinte']) || $d['empreinte'] === '') {
				throw new InventaireException('La version de la fiche est invalide : fermez-la, puis rouvrez-la.', 'empreinte');
			}
			$empreinte = $d['empreinte'];
		}

		return inventaire()->transaction(function () use ($pdo, $acteur, $id, $nouveau, $demandees, $empreinte) {
			$admins = Admin::verrouillerAdmins($acteur);
			$st = $pdo->prepare('SELECT id, nom_utilisateur, nom_complet, role, actif FROM utilisateurs WHERE id = ? FOR UPDATE');
			$st->execute(array($id));
			$u = $st->fetch();
			if (!$u) {
				throw new InventaireException('Utilisateur introuvable.');
			}
			$avant = array('nom_utilisateur' => $u['nom_utilisateur'], 'nom_complet' => $u['nom_complet'], 'role' => $u['role'], 'actif' => (bool) $u['actif']);
			$apres = array_merge($avant, $nouveau);
			$soi = ((int) $acteur === (int) $id);

			if ($soi && !$apres['actif']) {
				throw new InventaireException('Vous ne pouvez pas désactiver votre propre compte.', 'actif');
			}
			if ($soi && $apres['role'] !== 'admin') {
				throw new InventaireException('Vous ne pouvez pas retirer votre propre rôle d\'administrateur.', 'role');
			}
			if ($avant['role'] === 'admin' && $avant['actif'] && !($apres['role'] === 'admin' && $apres['actif'])
				&& count(array_diff($admins, array((int) $id))) === 0) {
				throw new InventaireException('« ' . $u['nom_utilisateur'] . ' » est le dernier administrateur actif : on ne peut ni le désactiver ni le rétrograder.', 'role');
			}

			$st = $pdo->prepare('SELECT entreprise_id FROM utilisateur_entreprises WHERE utilisateur_id = ? ORDER BY entreprise_id');
			$st->execute(array($id));
			$anciennes = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
			if ($empreinte !== null && !hash_equals(self::empreinte($u, $anciennes), $empreinte)) {
				throw new InventaireException('Cette fiche a été modifiée entre-temps (par un autre administrateur ou dans un autre onglet). Fermez-la, puis rouvrez-la pour voir les changements avant de recommencer.', 'empreinte');
			}
			if ($apres['role'] === 'admin') {
				$finales = array();        // un administrateur voit toutes les entreprises : aucune ligne
			} else {
				$finales = ($demandees !== null) ? $demandees : $anciennes;
				if (!$finales) {
					throw new InventaireException('Un gestionnaire ou un employé doit avoir accès à au moins une entreprise.', 'entreprise_ids');
				}
				// Une entreprise désactivée seule ne donne accès à rien : refusé quand ce changement-ci en est la cause
				if ($apres['actif'] && ($finales !== $anciennes || $apres['role'] !== $avant['role'] || !$avant['actif'])) {
					Admin::exigerEntrepriseActive($finales);
				}
			}
			if ($apres['nom_utilisateur'] !== $avant['nom_utilisateur']) {
				self::verifierNomLibre($apres['nom_utilisateur'], $id);
			}

			$champsModifies = ($apres !== $avant);
			if ($champsModifies) {
				try {
					$pdo->prepare('UPDATE utilisateurs SET nom_utilisateur = ?, nom_complet = ?, role = ?, actif = ? WHERE id = ?')
						->execute(array($apres['nom_utilisateur'], $apres['nom_complet'], $apres['role'], $apres['actif'] ? 1 : 0, $id));
				} catch (PDOException $ex) {
					if (Admin::doublon($ex)) {
						throw new InventaireException('Ce nom d\'utilisateur est déjà utilisé (les majuscules et les minuscules ne comptent pas).', 'nom_utilisateur');
					}
					throw $ex;
				}
			}
			$entreprisesChangees = ($finales !== $anciennes);
			if ($entreprisesChangees) {
				$pdo->prepare('DELETE FROM utilisateur_entreprises WHERE utilisateur_id = ?')->execute(array($id));
				foreach ($finales as $eid) {
					$pdo->prepare('INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES (?, ?)')->execute(array($id, $eid));
				}
			}

			// Journal (aucun secret) : un enregistrement pour les champs, un pour l'activation
			$noms = Admin::nomsEntreprises();
			$chg = array();
			foreach (array('nom_utilisateur', 'nom_complet', 'role') as $k) {
				if ($apres[$k] !== $avant[$k]) {
					$chg[$k] = array($avant[$k], $apres[$k]);
				}
			}
			$avantEnt = ($avant['role'] === 'admin') ? 'toutes' : self::noms($anciennes, $noms);
			$apresEnt = ($apres['role'] === 'admin') ? 'toutes' : self::noms($finales, $noms);
			if ($avantEnt !== $apresEnt) {
				$chg['entreprises'] = array($avantEnt, $apresEnt);
			}
			if ($chg) {
				Journal::ecrire($pdo, $acteur, 'utilisateur.modifie', 'utilisateurs', $id, array('nom_utilisateur' => $apres['nom_utilisateur'], 'changements' => $chg));
			}
			if ($apres['actif'] !== $avant['actif']) {
				Journal::ecrire($pdo, $acteur, $apres['actif'] ? 'utilisateur.reactive' : 'utilisateur.desactive', 'utilisateurs', $id, array('nom_utilisateur' => $apres['nom_utilisateur']));
			}
			return array('id' => $id, 'inchange' => !$chg && $apres['actif'] === $avant['actif'], 'actif' => $apres['actif'], 'soi' => $soi);
		});
	}

	/** Empreinte (version) d'une fiche : change dès qu'un champ éditable de l'utilisateur change. $u = ligne utilisateurs, $entreprises = ses id d'entreprises. */
	public static function empreinte(array $u, array $entreprises)
	{
		$e = array_map('intval', $entreprises);
		sort($e);
		return hash('sha256', json_encode(array((string) $u['nom_utilisateur'], (string) $u['nom_complet'], (string) $u['role'], (int) $u['actif'], $e)));
	}

	/** Remplace le mot de passe d'un utilisateur (et déverrouille son compte). Le mot de passe n'est ni journalisé ni renvoyé. */
	public static function reinitialiserMotDePasse($acteur, $id, $mdpBrut)
	{
		global $pdo, $Ouser;
		$st = $pdo->prepare('SELECT nom_utilisateur FROM utilisateurs WHERE id = ?');
		$st->execute(array($id));
		$nom = $st->fetchColumn();
		if ($nom === false) {
			throw new InventaireException('Utilisateur introuvable.');
		}
		$mdp = Admin::motDePasse($mdpBrut, $nom);
		$hash = password_hash($mdp, PASSWORD_DEFAULT);
		unset($mdp, $mdpBrut);
		return inventaire()->transaction(function () use ($pdo, $Ouser, $acteur, $id, $hash) {
			Admin::verrouillerAdmins($acteur);
			$st = $pdo->prepare('SELECT nom_utilisateur, (verrouille_jusqua IS NOT NULL AND verrouille_jusqua > NOW()) AS verrouille FROM utilisateurs WHERE id = ? FOR UPDATE');
			$st->execute(array($id));
			$u = $st->fetch();
			if (!$u) {
				throw new InventaireException('Utilisateur introuvable.');
			}
			$pdo->prepare('UPDATE utilisateurs SET mot_de_passe = ?, tentatives_echec = 0, verrouille_jusqua = NULL WHERE id = ?')->execute(array($hash, $id));
			Journal::ecrire($pdo, $acteur, 'utilisateur.mdp_reinitialise', 'utilisateurs', $id, array('nom_utilisateur' => $u['nom_utilisateur'], 'deverrouille' => (bool) $u['verrouille']));
			// Les connexions ouvertes avec l'ancien mot de passe sont coupées (sauf la session de l'administrateur lui-même s'il change le sien).
			$Ouser->invaliderSessions($id, (int) $id === (int) $acteur);
			return array('id' => $id, 'deverrouille' => (bool) $u['verrouille']);
		});
	}

	/** Remet à zéro les échecs de connexion et lève le verrou temporaire. */
	public static function deverrouiller($acteur, $id)
	{
		global $pdo;
		return inventaire()->transaction(function () use ($pdo, $acteur, $id) {
			Admin::verrouillerAdmins($acteur);
			$st = $pdo->prepare('SELECT nom_utilisateur, tentatives_echec, (verrouille_jusqua IS NOT NULL AND verrouille_jusqua > NOW()) AS verrouille FROM utilisateurs WHERE id = ? FOR UPDATE');
			$st->execute(array($id));
			$u = $st->fetch();
			if (!$u) {
				throw new InventaireException('Utilisateur introuvable.');
			}
			if (!$u['verrouille'] && (int) $u['tentatives_echec'] === 0) {
				throw new InventaireException('Le compte « ' . $u['nom_utilisateur'] . ' » n\'est pas verrouillé.');
			}
			$pdo->prepare('UPDATE utilisateurs SET tentatives_echec = 0, verrouille_jusqua = NULL WHERE id = ?')->execute(array($id));
			Journal::ecrire($pdo, $acteur, 'utilisateur.deverrouille', 'utilisateurs', $id, array('nom_utilisateur' => $u['nom_utilisateur'], 'etait_verrouille' => (bool) $u['verrouille']));
			return array('id' => $id, 'nom_utilisateur' => $u['nom_utilisateur']);
		});
	}

	/** Refuse un nom d'utilisateur déjà pris par un autre compte (sans égard à la casse : interclassement _ci). */
	private static function verifierNomLibre($nom, $sauf)
	{
		global $pdo;
		$st = $pdo->prepare('SELECT id FROM utilisateurs WHERE nom_utilisateur = ? AND id <> ? LIMIT 1');
		$st->execute(array($nom, (int) $sauf));
		if ($st->fetch()) {
			throw new InventaireException('Ce nom d\'utilisateur est déjà utilisé (les majuscules et les minuscules ne comptent pas).', 'nom_utilisateur');
		}
	}

	private static function noms(array $ids, array $noms)
	{
		$r = array();
		foreach ($ids as $i) {
			$r[] = isset($noms[$i]) ? $noms[$i] : ('n° ' . $i);
		}
		return $r;
	}
}
