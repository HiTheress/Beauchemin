<?php
/**
 * Fonctions communes du module « Mouvements » (réception, transfert, sortie, ajustement, documents).
 * Ce fichier n'est pas un endpoint : il est inclus par les endpoints et les pages (require_once).
 * Appelé directement, il répond 404 (après les gardes de init.php : connexion, jeton CSRF).
 *
 * Toute écriture de stock passe par le service Inventaire ; ici on ne fait que
 *   - contrôler le rôle et l'entreprise AVANT le service (réponse 403 plutôt que 400),
 *   - nettoyer et borner les champs texte (message clair plutôt que troncature silencieuse),
 *   - protéger contre le double envoi (jeton à usage unique par saisie, mémorisé dans la session),
 *   - ne jamais renvoyer un montant à un employé.
 */
require_once __DIR__ . '/../init.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class Mouvements
{
	/** type de document => méthode du service */
	const METHODES = array(
		'reception' => 'recevoir', 'transfert' => 'transferer', 'sortie' => 'sortir', 'ajustement' => 'ajuster',
	);
	const MAX_REFERENCE = 100;
	const MAX_NOTE = 2000;
	const MAX_MOTIF_ANNULATION = 255;
	const MAX_JETONS = 100;

	// ------------------------------------------------------------------
	//  Lecture et validation des champs envoyés par le navigateur
	// ------------------------------------------------------------------

	/** Texte facultatif : caractères de contrôle retirés, borné ; erreur claire si trop long. Retourne '' si vide. */
	public static function texte(array $d, $cle, $etiquette, $max, $multiligne = false)
	{
		$v = isset($d[$cle]) ? $d[$cle] : '';
		if ($v === null) {
			$v = '';
		}
		if (!is_scalar($v)) {
			throw new InventaireException('Valeur invalide : ' . $etiquette . '.', $cle);
		}
		$v = (string) $v;
		if (!mb_check_encoding($v, 'UTF-8')) {
			throw new InventaireException($etiquette . ' contient des caractères invalides.', $cle);
		}
		if ($multiligne) {
			$v = str_replace("\r\n", "\n", $v);
			$v = preg_replace('/[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F]/', '', $v);
		} else {
			$v = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $v);
		}
		$v = trim($v);
		if (mb_strlen($v) > $max) {
			throw new InventaireException($etiquette . ' ne peut pas dépasser ' . $max . ' caractères.', $cle);
		}
		return $v;
	}

	/** Identifiant entier positif (0 si absent ou invalide). */
	public static function identifiant(array $d, $cle)
	{
		if (!isset($d[$cle]) || !is_scalar($d[$cle]) || is_bool($d[$cle])) {
			return 0;
		}
		$s = (string) $d[$cle];
		return (ctype_digit($s) && strlen($s) < 10) ? (int) $s : 0;
	}

	// ------------------------------------------------------------------
	//  Droits : refus 403 avant même d'appeler le service (qui revérifie tout)
	// ------------------------------------------------------------------

	/** Rôle minimum de l'opération ($operation = clé de Inventaire::ROLE_MIN). */
	public static function exigerRole($operation)
	{
		global $Ouser;
		if (!$Ouser->aRole(Inventaire::ROLE_MIN[$operation])) {
			json_fail('Vous n\'avez pas la permission d\'effectuer cette opération.', 403);
		}
	}

	/** Chaque emplacement donné (s'il existe) doit appartenir à une entreprise de l'utilisateur. */
	public static function exigerEntreprises(array $emplacementIds)
	{
		global $Ouser, $pdo;
		foreach ($emplacementIds as $id) {
			if ((int) $id <= 0) {
				continue;
			}
			$st = $pdo->prepare('SELECT entreprise_id FROM emplacements WHERE id = ?');
			$st->execute(array((int) $id));
			$eid = $st->fetchColumn();
			if ($eid !== false && !$Ouser->peutAcces((int) $eid)) {
				json_fail('Vous n\'avez pas accès à cette entreprise.', 403);
			}
		}
	}

	// ------------------------------------------------------------------
	//  Enregistrement d'un mouvement (réception, transfert, sortie, ajustement)
	// ------------------------------------------------------------------

	/** Jeton de saisie valide (8 à 64 caractères sûrs) ou null. */
	private static function jeton(array $d)
	{
		if (isset($d['jeton']) && is_string($d['jeton']) && preg_match('/^[A-Za-z0-9_-]{8,64}$/', $d['jeton'])) {
			return $d['jeton'];
		}
		return null;
	}

	/**
	 * Point d'entrée commun des endpoints d'écriture. À appeler après exiger_post().
	 * Réponse : {ok, id, numero, lien, doublon?, total? (gestionnaire+ seulement)}.
	 */
	public static function enregistrer($type)
	{
		endpoint(function () use ($type) {
			global $Ouser;
			$d = entree();
			self::exigerRole($type);

			$emp = self::identifiant($d, 'emplacement_id');
			$dest = ($type === 'transfert') ? self::identifiant($d, 'emplacement_dest_id') : 0;
			self::exigerEntreprises(array($emp, $dest));

			// Double envoi : le même jeton ne crée jamais deux documents (les requêtes d'une même session s'exécutent à la file).
			$jeton = self::jeton($d);
			$cle = $type . ':' . $jeton;
			if ($jeton !== null && isset($_SESSION['mv_jetons'][$cle])) {
				$deja = $_SESSION['mv_jetons'][$cle];
				if (!$Ouser->peutVoirCouts()) {
					unset($deja['total']);
				}
				return array('doublon' => true) + $deja;
			}

			if ($emp <= 0) {
				throw new InventaireException($type === 'transfert' ? 'Choisissez l\'emplacement source.' : 'Choisissez l\'emplacement.', 'emplacement_id');
			}
			$in = array(
				'emplacement_id' => $emp,
				'date' => (isset($d['date']) && $d['date'] !== '') ? $d['date'] : null,
				'note' => self::texte($d, 'note', 'La note', self::MAX_NOTE, true),
				'lignes' => isset($d['lignes']) ? $d['lignes'] : null,
			);
			switch ($type) {
				case 'reception':
					$in['fournisseur_id'] = self::identifiant($d, 'fournisseur_id');
					if ($in['fournisseur_id'] === 0 && isset($d['fournisseur_id']) && $d['fournisseur_id'] !== '' && $d['fournisseur_id'] !== 0 && $d['fournisseur_id'] !== '0') {
						throw new InventaireException('Fournisseur introuvable ou désactivé.', 'fournisseur_id');     // valeur illisible : pas d'enregistrement « sans fournisseur » par erreur
					}
					$in['reference'] = self::texte($d, 'reference', 'Le numéro de facture du fournisseur', self::MAX_REFERENCE);
					$in['maj_prix'] = isset($d['maj_prix']) && filter_var($d['maj_prix'], FILTER_VALIDATE_BOOLEAN);
					break;
				case 'transfert':
					if ($dest <= 0) {
						throw new InventaireException('Choisissez l\'emplacement de destination.', 'emplacement_dest_id');
					}
					$in['emplacement_dest_id'] = $dest;
					break;
				case 'sortie':
					$in['motif'] = (isset($d['motif']) && is_string($d['motif'])) ? $d['motif'] : '';
					$in['reference'] = self::texte($d, 'reference', 'Le numéro de bon de travail', self::MAX_REFERENCE);
					break;
				case 'ajustement':
					$in['motif'] = (isset($d['motif']) && is_string($d['motif'])) ? $d['motif'] : '';
					break;
			}

			$methode = self::METHODES[$type];
			$r = inventaire()->$methode(utilisateur_id(), $in);

			$sortie = array(
				'id' => (int) $r['id'], 'numero' => $r['numero'],
				'lien' => 'index.php?page=document_voir&id=' . (int) $r['id'],
			);
			if ($Ouser->peutVoirCouts()) {          // un employé ne voit jamais un montant
				$sortie['total'] = $r['total'];
			}
			if ($jeton !== null) {
				$_SESSION['mv_jetons'][$cle] = $sortie;
				if (count($_SESSION['mv_jetons']) > self::MAX_JETONS) {
					$_SESSION['mv_jetons'] = array_slice($_SESSION['mv_jetons'], -self::MAX_JETONS, null, true);
				}
			}
			return $sortie;
		});
	}

	// ------------------------------------------------------------------
	//  Aides pour les pages
	// ------------------------------------------------------------------

	/** Libellé d'un motif (sortie ou ajustement) ; '' si aucun. */
	public static function libelleMotif($type, $motif)
	{
		$liste = ($type === 'ajustement') ? Inventaire::MOTIFS_AJUSTEMENT : (($type === 'sortie') ? Inventaire::MOTIFS_SORTIE : array());
		return isset($liste[$motif]) ? $liste[$motif] : (string) $motif;
	}

	/** Date du jour (fuseau du serveur : c'est celui qui valide la date du document). */
	public static function aujourdhui()
	{
		return date('Y-m-d');
	}

	/**
	 * Préremplissage par l'URL (contrat du §10) : &piece_id= (code de la pièce à ajouter, quantité 1) et &emplacement_id=.
	 * @return array{piece_code:string, piece_avert:string, emplacement_id:string}
	 */
	public static function prefill()
	{
		global $pdo;
		$r = array('piece_code' => '', 'piece_avert' => '', 'emplacement_id' => '');
		$p = (isset($_GET['piece_id']) && is_string($_GET['piece_id']) && ctype_digit($_GET['piece_id']) && strlen($_GET['piece_id']) < 10) ? (int) $_GET['piece_id'] : 0;
		if ($p > 0) {
			$st = $pdo->prepare('SELECT code, actif FROM pieces WHERE id = ?');
			$st->execute(array($p));
			$row = $st->fetch();
			if (!$row) {
				$r['piece_avert'] = 'La pièce demandée n\'existe pas.';
			} elseif (!$row['actif']) {
				$r['piece_avert'] = 'La pièce « ' . $row['code'] . ' » est désactivée : elle ne peut pas être ajoutée.';
			} else {
				$r['piece_code'] = $row['code'];
			}
		}
		if (isset($_GET['emplacement_id']) && is_string($_GET['emplacement_id']) && ctype_digit($_GET['emplacement_id']) && strlen($_GET['emplacement_id']) < 10) {
			$r['emplacement_id'] = $_GET['emplacement_id'];
		}
		return $r;
	}

	/** Attributs data-* communs de la racine d'une page de saisie (valeurs échappées). */
	public static function attributsSaisie($type, array $pre)
	{
		return 'data-mouvement="' . e($type) . '" data-aujourdhui="' . e(self::aujourdhui()) . '"'
			. ' data-piece-code="' . e($pre['piece_code']) . '" data-emplacement-id="' . e($pre['emplacement_id']) . '"';
	}

	/** Début commun d'une page de saisie : zones de message. */
	public static function zonesMessages(array $pre)
	{
		echo '<div id="mv-succes" class="alert alert-success mv-succes" role="status" aria-live="polite" hidden></div>';
		if ($pre['piece_avert'] !== '') {
			echo '<div class="alert alert-warning" role="alert">' . e($pre['piece_avert']) . '</div>';
		}
	}

	/** Bloc scan + recherche + lignes (identique sur les quatre écrans). */
	public static function blocLignes($aide = '')
	{
		?>
      <div class="scan-box mv-scan">
        <label for="scan" class="mv-scan-label"><i class="fas fa-barcode mr-1" aria-hidden="true"></i> Scannez une pièce (ou un emplacement), puis Entrée</label>
        <input id="scan" class="form-control scan-input" autocomplete="off" inputmode="none" maxlength="64" placeholder="Code-barres de la pièce…">
      </div>
      <div class="form-group mt-3 mb-2">
        <label for="recherche">Ou cherchez une pièce par son nom ou son code</label>
        <select id="recherche" class="form-control"></select>
      </div>
      <div id="lignes" class="mv-lignes table-responsive"></div>
      <?php if ($aide !== '') { ?><p class="text-muted small mt-2 mb-0"><?php echo e($aide); ?></p><?php } ?>
		<?php
	}

	/** Pied commun : note, message d'erreur persistant et bouton Enregistrer. */
	public static function blocFin($libelleBouton = 'Enregistrer')
	{
		?>
      <div class="form-group mt-3">
        <label for="note">Note (facultative)</label>
        <textarea id="note" class="form-control" rows="2" maxlength="2000" placeholder="Une précision utile pour la suite…"></textarea>
      </div>
      <div id="mv-erreur" class="alert alert-danger mv-erreur" role="alert" hidden></div>
      <div class="mv-actions">
        <button type="button" id="btn-enregistrer" class="btn btn-primary btn-lg"><i class="fas fa-check mr-1" aria-hidden="true"></i> <span><?php echo e($libelleBouton); ?></span></button>
        <span id="mv-resume" class="text-muted ml-3"></span>
      </div>
		<?php
	}
}
