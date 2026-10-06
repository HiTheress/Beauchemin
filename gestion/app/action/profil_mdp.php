<?php
// Changement de SON mot de passe (tout utilisateur connecté). POST JSON : actuel, nouveau, confirmation.
// Le mot de passe actuel est vérifié côté serveur ; après trop d'essais ratés (même règle que la connexion) le compte est verrouillé
// temporairement. Au succès : identifiant de session régénéré et autres sessions du compte invalidées (User::invaliderSessions). Aucun mot de passe n'est journalisé ni renvoyé.
require_once __DIR__ . '/utilisateur_lib.php';
exiger_post();
endpoint(function () {
	global $pdo, $Ouser;
	$uid = utilisateur_id();
	$d = entree();
	$actuel = isset($d['actuel']) ? $d['actuel'] : null;
	$nouveau = isset($d['nouveau']) ? $d['nouveau'] : null;
	$confirmation = isset($d['confirmation']) ? $d['confirmation'] : null;
	if (!is_string($actuel) || $actuel === '') {
		throw new InventaireException('Saisissez votre mot de passe actuel.', 'actuel');
	}
	$moi = $Ouser->courant();
	$nouveau = Admin::motDePasse($nouveau, $moi['nom_utilisateur'], 'nouveau');
	if (!is_string($confirmation) || $confirmation !== $nouveau) {
		throw new InventaireException('La confirmation ne correspond pas au nouveau mot de passe.', 'confirmation');
	}
	if ($nouveau === $actuel) {
		throw new InventaireException('Le nouveau mot de passe doit être différent de l\'actuel.', 'nouveau');
	}
	$hash = password_hash($nouveau, PASSWORD_DEFAULT);
	unset($nouveau, $confirmation, $d);

	// Étape 1 : vérification du mot de passe actuel, avec compteur d'échecs (validé même si l'on refuse ensuite)
	$verdict = inventaire()->transaction(function () use ($pdo, $uid, $actuel) {
		$st = $pdo->prepare('SELECT mot_de_passe, tentatives_echec, verrouille_jusqua, (verrouille_jusqua IS NOT NULL AND verrouille_jusqua > NOW()) AS verrouille FROM utilisateurs WHERE id = ? FOR UPDATE');
		$st->execute(array($uid));
		$u = $st->fetch();
		if (!$u) {
			return 'inconnu';
		}
		if ($u['verrouille']) {
			return 'verrouille';
		}
		if (password_verify($actuel, $u['mot_de_passe'])) {
			return 'ok';
		}
		$n = (int) $u['tentatives_echec'] + 1;
		$verrou = null;
		if ($n >= User::MAX_ECHECS) {
			$verrou = date('Y-m-d H:i:s', time() + User::VERROU_MINUTES * 60);
			$n = 0;
		}
		$pdo->prepare('UPDATE utilisateurs SET tentatives_echec = ?, verrouille_jusqua = ? WHERE id = ?')->execute(array($n, $verrou, $uid));
		Journal::ecrire($pdo, $uid, 'profil.mdp_echec', 'utilisateurs', $uid);
		return 'refuse';
	});
	unset($actuel);
	if ($verdict === 'refuse') {
		sleep(1);       // ralentit les essais répétés (comme la connexion)
		throw new InventaireException('Le mot de passe actuel est incorrect.', 'actuel');
	}
	if ($verdict === 'verrouille') {
		throw new InventaireException('Trop d\'essais : le compte est verrouillé temporairement. Réessayez dans quelques minutes ou demandez à un administrateur de le déverrouiller.');
	}
	if ($verdict !== 'ok') {
		throw new InventaireException('Utilisateur introuvable.');
	}

	// Étape 2 : changement
	inventaire()->transaction(function () use ($pdo, $Ouser, $uid, $hash) {
		$pdo->prepare('UPDATE utilisateurs SET mot_de_passe = ?, tentatives_echec = 0, verrouille_jusqua = NULL WHERE id = ?')->execute(array($hash, $uid));
		Journal::ecrire($pdo, $uid, 'profil.mdp_change', 'utilisateurs', $uid);
		// Toutes les AUTRES connexions de ce compte sont coupées ; celle-ci reste ouverte.
		$Ouser->invaliderSessions($uid, true);
	});
	session_regenerate_id(true);
	return array('message' => 'Votre mot de passe a été changé.');
});
