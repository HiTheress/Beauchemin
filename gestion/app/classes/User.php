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

	const MAX_ECHECS = 5;
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

		$st = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE nom_utilisateur = ? LIMIT 1");
		$st->execute(array($username));
		$u = $st->fetch();

		$utilisable = ($u && $u['actif']);
		$verrouille = ($utilisable && $u['verrouille_jusqua'] && strtotime($u['verrouille_jusqua']) > time());
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
			$_SESSION['user_name'] = $u['nom_utilisateur'];
			Journal::ecrire($this->pdo, (int) $u['id'], 'connexion', 'utilisateurs', (int) $u['id']);
			redirect("index.php");
		}

		if ($verrouille) {
			Journal::ecrire($this->pdo, (int) $u['id'], 'connexion.verrouille', 'utilisateurs', (int) $u['id']);
		} elseif ($utilisable) {
			$n = (int) $u['tentatives_echec'] + 1;
			$verrou = null;
			if ($n >= self::MAX_ECHECS) {
				$verrou = date('Y-m-d H:i:s', time() + self::VERROU_MINUTES * 60);
				$n = 0;
				Journal::ecrire($this->pdo, (int) $u['id'], 'utilisateur.verrouille', 'utilisateurs', (int) $u['id']);
			}
			$this->pdo->prepare("UPDATE utilisateurs SET tentatives_echec = ?, verrouille_jusqua = ? WHERE id = ?")
				->execute(array($n, $verrou, $u['id']));
		}
		Journal::ecrire($this->pdo, $u ? (int) $u['id'] : null, 'connexion.echec', 'utilisateurs', $u ? (int) $u['id'] : null, array('nom' => mb_substr($username, 0, 50)));
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
			$st = $this->pdo->prepare("SELECT id, nom_utilisateur, nom_complet, role, actif FROM utilisateurs WHERE id = ?");
			$st->execute(array($id));
			$u = $st->fetch();
			if ($u && $u['actif']) {
				if ($u['role'] === 'admin') {
					$ids = $this->pdo->query("SELECT id FROM entreprises WHERE actif = 1 ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
				} else {
					$s2 = $this->pdo->prepare("SELECT ue.entreprise_id FROM utilisateur_entreprises ue JOIN entreprises e ON e.id = ue.entreprise_id WHERE ue.utilisateur_id = ? AND e.actif = 1 ORDER BY ue.entreprise_id");
					$s2->execute(array($id));
					$ids = $s2->fetchAll(PDO::FETCH_COLUMN);
				}
				$u['entreprises'] = array_map('intval', $ids);
				$this->courant = $u;
			} else {
				unset($_SESSION['user_id'], $_SESSION['user_name']);
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

	public function peutAcces($entrepriseId) {
		return in_array((int) $entrepriseId, $this->entreprisesAutorisees(), true);
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
