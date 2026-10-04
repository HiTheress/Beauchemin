<?php
ob_start();

class User extends Objects {
	protected $pdo;

	// construct $pdo
	function __construct($pdo) {
		$this->pdo = $pdo;
	}

	// user login method to dashboard
	public function login($username, $pass) {
		$stmt = $this->pdo->prepare("SELECT * FROM user WHERE username = :username LIMIT 1");
		$stmt->bindValue(":username", $username, PDO::PARAM_STR);
		$stmt->execute();
		$user = $stmt->fetch(PDO::FETCH_OBJ);

		$ok = false;
		if ($user) {
			if (password_verify($pass, $user->password)) {
				$ok = true;
			} elseif (strlen($user->password) === 32 && hash_equals($user->password, md5($pass))) {
				// ancien mot de passe MD5 : accepté une fois, puis remplacé par un hash sûr
				$ok = true;
				$up = $this->pdo->prepare("UPDATE user SET password = :p WHERE id = :id");
				$up->execute(array(':p' => password_hash($pass, PASSWORD_DEFAULT), ':id' => $user->id));
			}
		}

		if ($ok) {
			session_regenerate_id(true);
			$_SESSION['user_id'] = $user->id;
			$_SESSION['user_name'] = $user->username;
			$_SESSION['user_role'] = $user->user_role;
			redirect("index.php");
		} else {
			sleep(1); // ralentit les essais répétés
			$_SESSION['login_error'] = "Nom d'utilisateur ou mot de passe invalide";
			redirect("login.php");
		}
	}




	public function is_admin(){
		if ($_SESSION['user_role'] === 'admin') {
			return true;
		}else{
			return false;
		}
	}

	public function redirect_unauth_users($page){
		if ($_SESSION['user_role'] === 'admin') {
			return true;
		}else{
			redirect($page);
		}
	}


	//is user loged in or not
	public function is_login() {
		if (!empty($_SESSION['user_id'])) {
			return true;
		} else {
			return false;
		}
	}


	public function logOut() {
		$_SESSION = array();
		session_destroy();
		redirect("login.php");
	}

	public function checkUser($username)
	{
	  $stmt = $this->pdo->prepare("SELECT username FROM users WHERE username = :username AND deleted_at = ''");
	  $stmt->bindParam(":username", $username, PDO::PARAM_STR);
	  $stmt->execute();
	  $count = $stmt->rowCount();
	  return ($count > 0)? true : false;
	}


	//check email if it is alrady sign up
	public function checkEmail($email)
	{
	  $stmt = $this->pdo->prepare("SELECT email FROM users WHERE email = :email AND deleted_at = ''");
	  $stmt->bindParam(":email", $email, PDO::PARAM_STR);
	  $stmt->execute();
	  $count = $stmt->rowCount();
	  return ($count > 0)? true : false;
	}

	public function userLog(){
		$stmt = $this->pdo->prepare("SELECT * FROM logs ORDER BY id DESC LIMIT 5 ");
		$stmt->execute();
		return $stmt->fetchAll(PDO::FETCH_OBJ);
	}

	// check email if it is alrady sign up
	public function checkUsername($username)
	{
	  $stmt = $this->pdo->prepare("SELECT username FROM users WHERE username = :username");
	  $stmt->bindParam(":username", $username, PDO::PARAM_STR);
	  $stmt->execute();
	  $count = $stmt->rowCount();
	  return ($count > 0)? true : false;
	}

	// user resigstration method
	// public function register($screenName,$email,$password)
	// {
	//   $stmt = $this->pdo->prepare("INSERT INTO users(screenName,email,password,profileImage,profileCover) VALUES(:screenName, :email, :password , 'assets/images/defaultprofileimage.png','assets/images/defaultCoverImage.png')");
	//   $stmt->bindParam(":screenName", $screenName, PDO::PARAM_STR);
	//   $stmt->bindParam(":email", $email, PDO::PARAM_STR);
	//   $stmt->bindParam(":password", md5($password), PDO::PARAM_STR);
	//   $stmt->execute();
	//   $user_id = $this->pdo->lastInsertId();

	//   $_SESSION['user_id'] = $user_id;
	//   header("Location: home.php");
	// }

}

?>
