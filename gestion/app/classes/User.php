<?php
ob_start();

/**
 * Utilisateur connecté : authentification, rôle, entreprises accessibles.
 * Rôles : employe < gestionnaire < admin. Le rôle et l'état « actif » sont relus dans la base à chaque requête,
 * donc un changement (ou une désactivation) prend effet immédiatement.
 */
class User {
	protected $pdo;
	private $courant = false; // false = pas encore chargé, null = personne

	const MAX_ECHECS = 20;            // échecs consécutifs (toutes adresses) avant de verrouiller le COMPTE : seuil volontairement élevé
	const MAX_ECHECS_COUPLE = 5;      // échecs d'une même adresse IP sur un même compte en 15 min : cette adresse seule est refusée
	const VERROU_MINUTES = 15;
	const RANG = array('employe' => 1, 'gestionnaire' => 2, 'admin' => 3);

	function __construct($pdo) {
		$this->pdo = $pdo;
	}

	/** Empreinte factice : on exécute toujours un password_verify, même si le compte n'existe pas (temps de réponse identique). */
	const EMPREINTE_FACTICE = '$2y$10$bUIy2BzwwgmYCWWWtH783e3Pv2J6UEu8bb.rJGr9xVAA5v6XunGvq';

	const MAX_ECHECS_IP = 30;      // échecs de connexion par adresse IP en 15 minutes, tous comptes confondus

	/**
	 * Tentative de connexion ; redirige toujours (accueil ou page de connexion).
	 * Le message d'échec est TOUJOURS le même (compte inexistant, désactivé, verrouillé ou mauvais mot de passe) :
	 * on ne révèle pas quels comptes existent. Les verrouillages sont visibles dans le journal et pour l'administrateur.
	 */
	public function login($username, $pass) {
		$username = trim((string) $username);
		$erreur = "Nom d'utilisateur ou mot de passe invalide";
		$ip = isset($_SERVER['REMOTE_ADDR']) ? substr($_SERVER['REMOTE_ADDR'], 0, 45) : '';

		// Limite par adresse IP (un tiers ne peut ni deviner à grande vitesse, ni bloquer le compte d'un collègue en boucle)
		$st = $this->pdo->prepare("SELECT COUNT(*) FROM journal WHERE action = 'connexion.echec' AND ip = ? AND date_action > ?");
		$st->execute(array($ip, date('Y-m-d H:i:s', time() - 900)));
		if ((int) $st->fetchColumn() >= self::MAX_ECHECS_IP) {
			Journal::ecrire($this->pdo, null, 'connexion.ip_bloquee', 'utilisateurs', null);
			sleep(2);
			$_SESSION['login_error'] = $erreur;
			redirect("login.php");
		}

		// Sérialise les tentatives d'un même couple (nom saisi, adresse IP) : le décompte des échecs ne peut pas être dépassé par des requêtes
		// parallèles. Le verrou est relâché automatiquement à la fin de la requête (connexion fermée).
		$this->pdo->query("SELECT GET_LOCK(" . $this->pdo->quote('bea_login_' . md5(mb_strtolower($username) . '|' . $ip)) . ", 5)");

		$st = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE nom_utilisateur = ? LIMIT 1");
		$st->execute(array($username));
		$u = $st->fetch();

		$utilisable = ($u && $u['actif']);
		$verrouille = ($utilisable && $u['verrouille_jusqua'] && strtotime($u['verrouille_jusqua']) > time());
		// Limite par COUPLE compte + adresse IP : une adresse qui échoue trop souvent sur ce compte est refusée, sans bloquer le compte
		// pour son vrai propriétaire (un tiers anonyme ne peut donc pas verrouiller le compte d'un collègue ni de l'administrateur).
		if ($utilisable && !$verrouille) {
			// Seuls comptent les échecs APRÈS la dernière remise à zéro du compte (déverrouillage, réinitialisation ou changement de mot de passe).
			$st = $this->pdo->prepare("SELECT COUNT(*) FROM journal j WHERE j.action = 'connexion.echec' AND j.entite = 'utilisateurs' AND j.entite_id = ? AND j.ip = ? AND j.date_action > ?
				AND j.id > (SELECT COALESCE(MAX(r.id), 0) FROM journal r WHERE r.entite = 'utilisateurs' AND r.entite_id = ? AND r.action IN ('utilisateur.deverrouille', 'utilisateur.mdp_reinitialise', 'profil.mdp_change'))");
			$st->execute(array($u['id'], $ip, date('Y-m-d H:i:s', time() - self::VERROU_MINUTES * 60), $u['id']));
			if ((int) $st->fetchColumn() >= self::MAX_ECHECS_COUPLE) {
				$verrouille = true;
			}
		}
		$hash = $utilisable ? $u['mot_de_passe'] : self::EMPREINTE_FACTICE;
		$bon = password_verify((string) $pass, $hash);   // toujours exécuté

		if ($utilisable && !$verrouille && $bon) {
			if (password_needs_rehash($u['mot_de_passe'], PASSWORD_DEFAULT)) {
				$this->pdo->prepare("UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?")
					->execute(array(password_hash($pass, PASSWORD_DEFAULT), $u['id']));
			}
			$this->pdo->prepare("UPDATE utilisateurs SET tentatives_echec = 0, verrouille_jusqua = NULL, derniere_connexion = ? WHERE id = ?")
				->execute(array(date('Y-m-d H:i:s'), $u['id']));
			session_regenerate_id(true);
			$_SESSION['user_id'] = (int) $u['id'];
			$_SESSION['auth_v'] = (int) $u['mdp_version'];
			$_SESSION['user_name'] = $u['nom_utilisateur'];
			Journal::ecrire($this->pdo, (int) $u['id'], 'connexion', 'utilisateurs', (int) $u['id']);
			redirect("index.php");
		}

		if ($verrouille) {
			Journal::ecrire($this->pdo, (int) $u['id'], 'connexion.verrouille', 'utilisateurs', (int) $u['id']);
		} elseif ($utilisable) {
			// Compteur ATOMIQUE (des tentatives parallèles ne doivent pas se « perdre ») : une seule instruction incrémente et verrouille.
			$verrou = date('Y-m-d H:i:s', time() + self::VERROU_MINUTES * 60);
			$this->pdo->prepare("UPDATE utilisateurs SET verrouille_jusqua = IF(tentatives_echec + 1 >= ?, ?, verrouille_jusqua), tentatives_echec = IF(tentatives_echec + 1 >= ?, 0, tentatives_echec + 1) WHERE id = ?")
				->execute(array(self::MAX_ECHECS, $verrou, self::MAX_ECHECS, $u['id']));
			if ((int) $u['tentatives_echec'] + 1 >= self::MAX_ECHECS) {
				Journal::ecrire($this->pdo, (int) $u['id'], 'utilisateur.verrouille', 'utilisateurs', (int) $u['id']);
			}
		}
		// Le nom saisi n'est journalisé QUE pour un compte qui existe (un mot de passe tapé par erreur dans ce champ ne doit pas rester en base).
		Journal::ecrire($this->pdo, $u ? (int) $u['id'] : null, 'connexion.echec', 'utilisateurs', $u ? (int) $u['id'] : null, $u ? array('nom' => mb_substr($username, 0, 50)) : null);
		sleep(1); // ralentit les essais répétés
		$_SESSION['login_error'] = $erreur;
		redirect("login.php");
	}

	/** Utilisateur courant (ligne de la base + entreprises), ou null. Désactivé/supprimé => déconnecté. */
	public function courant() {
		if ($this->courant !== false) {
			return $this->courant;
		}
		$this->courant = null;
		$id = (int) ($_SESSION['user_id'] ?? 0);
		if ($id) {
			$st = $this->pdo->prepare("SELECT id, nom_utilisateur, nom_complet, role, actif, mdp_version FROM utilisateurs WHERE id = ?");
			$st->execute(array($id));
			$u = $st->fetch();
			// La session n'est valable que tant que la « version » du mot de passe n'a pas changé (changement/réinitialisation ailleurs).
			if ($u && $u['actif'] && (int) ($_SESSION['auth_v'] ?? -1) === (int) $u['mdp_version']) {
				if ($u['role'] === 'admin') {
					$ids = $this->pdo->query("SELECT id FROM entreprises WHERE actif = 1 ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
				} else {
					$s2 = $this->pdo->prepare("SELECT ue.entreprise_id FROM utilisateur_entreprises ue JOIN entreprises e ON e.id = ue.entreprise_id WHERE ue.utilisateur_id = ? AND e.actif = 1 ORDER BY ue.entreprise_id");
					$s2->execute(array($id));
					$ids = $s2->fetchAll(PDO::FETCH_COLUMN);
				}
				$u['entreprises'] = array_map('intval', $ids);
				// consultables = actives OU NON (historique d'une entreprise désactivée) ; admin : toutes
				if ($u['role'] === 'admin') {
					$cons = $this->pdo->query("SELECT id FROM entreprises ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
				} else {
					$s3 = $this->pdo->prepare("SELECT entreprise_id FROM utilisateur_entreprises WHERE utilisateur_id = ? ORDER BY entreprise_id");
					$s3->execute(array($id));
					$cons = $s3->fetchAll(PDO::FETCH_COLUMN);
				}
				$u['consultables'] = array_map('intval', $cons);
				$this->courant = $u;
			} else {
				unset($_SESSION['user_id'], $_SESSION['user_name'], $_SESSION['auth_v']);
				$_SESSION['login_error'] = 'Votre session a pris fin. Veuillez vous reconnecter.';   // message neutre (compte désactivé, mot de passe changé ailleurs, ...)
			}
		}
		return $this->courant;
	}

	public function is_login() {
		return $this->courant() !== null;
	}

	public function role() {
		$u = $this->courant();
		return $u ? $u['role'] : null;
	}

	public function aRole($min) {
		$r = $this->role();
		return $r !== null && self::RANG[$r] >= self::RANG[$min];
	}

	public function is_admin() {
		return $this->role() === 'admin';
	}

	public function peutVoirCouts() {
		return $this->aRole(Inventaire::ROLE_MIN['voir_couts']);
	}

	/** @return int[] */
	public function entreprisesAutorisees() {
		$u = $this->courant();
		return $u ? $u['entreprises'] : array();
	}

	/** Entreprises consultables en lecture (actives ou non). @return int[] */
	public function entreprisesConsultables() {
		$u = $this->courant();
		return $u ? $u['consultables'] : array();
	}

	public function peutAcces($entrepriseId) {
		return in_array((int) $entrepriseId, $this->entreprisesAutorisees(), true);
	}

	/**
	 * Coupe toutes les sessions ouvertes d'un compte (à appeler après un changement ou une réinitialisation de mot de passe).
	 * $garderCourante : l'utilisateur change SON mot de passe — sa session actuelle reste valable.
	 */
	public function invaliderSessions($userId, $garderCourante = false) {
		$this->pdo->prepare("UPDATE utilisateurs SET mdp_version = mdp_version + 1 WHERE id = ?")->execute(array((int) $userId));
		if ($garderCourante && (int) ($_SESSION['user_id'] ?? 0) === (int) $userId) {
			$st = $this->pdo->prepare("SELECT mdp_version FROM utilisateurs WHERE id = ?");
			$st->execute(array((int) $userId));
			$_SESSION['auth_v'] = (int) $st->fetchColumn();
		}
		$this->courant = false;
	}

	public function logOut() {
		$u = $this->courant();
		if ($u) {
			Journal::ecrire($this->pdo, (int) $u['id'], 'deconnexion', 'utilisateurs', (int) $u['id']);
		}
		$_SESSION = array();
		if (ini_get('session.use_cookies')) {
			$p = session_get_cookie_params();
			setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
		}
		session_destroy();
		redirect("login.php");
	}
}
