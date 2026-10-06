<?php
/**
 * Journal d'activité (module E) : libellés français, détails lisibles, filtres communs au tableau et à l'export CSV.
 * Inclus par journal_data.php et journal_export.php ; appelé directement : 404.
 * Une action, une entité ou une clé inconnue est affichée telle quelle (jamais d'erreur, jamais de JSON brut pour les détails valides).
 */
require_once __DIR__ . '/../action/utilisateur_lib.php';
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
	http_response_code(404);
	header('Content-Type: text/plain; charset=utf-8');
	exit('Introuvable.');
}

final class JournalFr
{
	const ACTIONS = array(
		'connexion' => 'Connexion',
		'connexion.echec' => 'Échec de connexion',
		'connexion.verrouille' => 'Connexion refusée (compte verrouillé)',
		'connexion.ip_bloquee' => 'Connexion bloquée (trop d\'échecs depuis cette adresse)',
		'deconnexion' => 'Déconnexion',
		'utilisateur.cree' => 'Utilisateur créé',
		'utilisateur.modifie' => 'Utilisateur modifié',
		'utilisateur.desactive' => 'Utilisateur désactivé',
		'utilisateur.reactive' => 'Utilisateur réactivé',
		'utilisateur.mdp_reinitialise' => 'Mot de passe réinitialisé',
		'utilisateur.deverrouille' => 'Compte déverrouillé',
		'utilisateur.verrouille' => 'Compte verrouillé (trop d\'échecs de connexion)',
		'profil.mdp_change' => 'Mot de passe changé (profil)',
		'profil.mdp_echec' => 'Mot de passe actuel refusé (profil)',
		'entreprise.cree' => 'Entreprise créée',
		'entreprise.modifie' => 'Entreprise modifiée',
		'entreprise.desactive' => 'Entreprise désactivée',
		'entreprise.reactive' => 'Entreprise réactivée',
		'emplacement.cree' => 'Emplacement créé',
		'emplacement.modifie' => 'Emplacement modifié',
		'emplacement.desactive' => 'Emplacement désactivé',
		'emplacement.reactive' => 'Emplacement réactivé',
		'sauvegarde.telechargee' => 'Sauvegarde téléchargée',
		'journal.export' => 'Export du journal',
		'piece.cree' => 'Pièce créée',
		'piece.modifie' => 'Pièce modifiée',
		'piece.maj' => 'Pièce mise à jour (import)',
		'piece.desactive' => 'Pièce désactivée',
		'piece.reactive' => 'Pièce réactivée',
		'fournisseur.cree' => 'Fournisseur créé',
		'fournisseur.modifie' => 'Fournisseur modifié',
		'fournisseur.desactive' => 'Fournisseur désactivé',
		'fournisseur.reactive' => 'Fournisseur réactivé',
		'categorie.cree' => 'Catégorie créée',
		'categorie.modifie' => 'Catégorie modifiée',
		'categorie.supprime' => 'Catégorie supprimée',
		'prix.maj' => 'Prix fournisseur mis à jour',
		'prix.modifie' => 'Prix fournisseur modifié',
		'prix.supprime' => 'Prix fournisseur retiré',
		'prix.restaure' => 'Prix fournisseur rétabli (annulation d\'une réception)',
		'import.catalogue' => 'Import du catalogue',
		'document.annule' => 'Document annulé',
		'comptage.applique' => 'Comptage appliqué',
		'comptage.annule' => 'Comptage annulé',
		'facture_interne.creee' => 'Facture interne créée',
		'export.bilan' => 'Export du bilan mensuel',
		'export.valeur' => 'Export de la valeur de l\'inventaire',
		'export.historique' => 'Export de l\'historique',
		'export.stock' => 'Export du stock',
		'export.sous_minimum' => 'Export des pièces sous le minimum',
	);

	const ENTITES = array(
		'utilisateurs' => 'Utilisateur',
		'entreprises' => 'Entreprise',
		'emplacements' => 'Emplacement',
		'pieces' => 'Pièce',
		'fournisseurs' => 'Fournisseur',
		'categories' => 'Catégorie',
		'documents' => 'Document',
		'comptages' => 'Comptage',
		'journal' => 'Journal',
		'sauvegarde' => 'Sauvegarde',
	);

	/** Page où ouvrir l'objet concerné (routes du §2 de la spécification), si elle existe. */
	const PAGES = array('pieces' => 'piece_voir', 'documents' => 'document_voir', 'comptages' => 'comptage_voir');

	const CLES = array(
		'nom' => 'Nom', 'nom_utilisateur' => 'Nom d\'utilisateur', 'nom_complet' => 'Nom complet', 'role' => 'Rôle',
		'actif' => 'Actif', 'entreprises' => 'Entreprises', 'entreprise' => 'Entreprise', 'entreprise_id' => 'Entreprise',
		'code' => 'Code', 'code_barres' => 'Code-barres', 'type' => 'Type', 'adresse' => 'Adresse',
		'numero' => 'Numéro', 'motif' => 'Motif', 'total' => 'Total', 'de' => 'De', 'vers' => 'Vers',
		'periode' => 'Période', 'source' => 'Source', 'champs' => 'Champs modifiés', 'fournisseur' => 'Fournisseur',
		'fournisseur_id' => 'Fournisseur', 'no_fournisseur' => 'N° du fournisseur', 'prix' => 'Prix', 'date' => 'Date',
		'document_id' => 'Document', 'document' => 'Document', 'ecarts' => 'Écarts', 'non_scannees_a_zero' => 'Pièces non comptées mises à zéro',
		'mode' => 'Mode', 'filtres' => 'Filtres', 'piece' => 'Pièce', 'emplacement' => 'Emplacement',
		'utilisateur' => 'Utilisateur', 'utilisateur_id' => 'Utilisateur (n°)', 'du' => 'Du', 'au' => 'Au',
		'deverrouille' => 'Compte déverrouillé', 'etait_verrouille' => 'Le compte était verrouillé',
		'tables' => 'Tables', 'nb_tables' => 'Nombre de tables', 'complete' => 'Sauvegarde complète', 'lignes' => 'Lignes', 'nb_lignes' => 'Nombre de lignes',
		'action' => 'Action', 'entite' => 'Objet concerné', 'recherche' => 'Recherche', 'statut' => 'Statut', 'note' => 'Note',
		'reference' => 'Référence', 'quantite' => 'Quantité', 'unite' => 'Unité', 'categorie' => 'Catégorie',
		'description' => 'Description', 'telephone' => 'Téléphone', 'courriel' => 'Courriel', 'contact' => 'Contact',
	);

	/** Clés dont la valeur est un montant (affichée « 27,30 $ »). */
	const MONTANTS = array('prix', 'total', 'montant', 'cout', 'cout_unitaire');

	/** Clés qui renvoient à un objet par son numéro : libellé affiché => table (le nom lisible est cherché dans la base). */
	const REFERENCES = array(
		'fournisseur_id' => array('Fournisseur', 'fournisseurs'), 'document_id' => array('Document', 'documents'),
		'entreprise_id' => array('Entreprise', 'entreprises'), 'utilisateur_id' => array('Utilisateur', 'utilisateurs'),
		'piece_id' => array('Pièce', 'pieces'), 'emplacement_id' => array('Emplacement', 'emplacements'),
	);

	/** Colonne donnant le nom lisible d'un objet, par table (liste blanche : jamais issue du navigateur). */
	const NOM_OBJET = array(
		'utilisateurs' => 'nom_utilisateur', 'entreprises' => 'nom', 'emplacements' => 'nom', 'pieces' => 'code',
		'fournisseurs' => 'nom', 'categories' => 'nom', 'documents' => 'numero', 'comptages' => 'numero',
	);

	/** Clés dont la valeur 0/1 se lit « Oui » / « Non ». */
	const BOOLEENNES = array('actif', 'deverrouille', 'etait_verrouille', 'non_scannees_a_zero');

	const MAX_TEXTE = 300;

	public static function action($code)
	{
		$code = (string) $code;
		return isset(self::ACTIONS[$code]) ? self::ACTIONS[$code] : $code;
	}

	public static function entite($code)
	{
		$code = (string) $code;
		return isset(self::ENTITES[$code]) ? self::ENTITES[$code] : $code;
	}

	private static function cle($k)
	{
		if (isset(self::CLES[$k])) {
			return self::CLES[$k];
		}
		$t = str_replace('_', ' ', (string) $k);
		return mb_strtoupper(mb_substr($t, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($t, 1, null, 'UTF-8');
	}

	private static function court($s)
	{
		$s = (string) $s;
		return mb_strlen($s) > self::MAX_TEXTE ? mb_substr($s, 0, self::MAX_TEXTE) . '…' : $s;
	}

	/** Nom lisible d'un objet (code de la pièce, numéro du document, nom de l'utilisateur…) ; null s'il n'existe plus ou n'a pas de nom. */
	public static function nomObjet($table, $id)
	{
		global $pdo;
		static $memo = array();
		if (!isset(self::NOM_OBJET[$table]) || $id === null || $id === '' || !preg_match('/^[0-9]{1,10}\z/', (string) $id)) {
			return null;
		}
		$k = $table . '#' . (int) $id;
		if (!array_key_exists($k, $memo)) {
			$st = $pdo->prepare('SELECT ' . self::NOM_OBJET[$table] . ' FROM ' . $table . ' WHERE id = ?');
			$st->execute(array((int) $id));
			$v = $st->fetchColumn();
			$memo[$k] = ($v === false || $v === null || $v === '') ? null : (string) $v;
		}
		return $memo[$k];
	}

	/** Montant lisible : « 27,30 $ » ; 4 décimales seulement si elles servent (prix unitaire à 0,0425 $). */
	private static function montant($v)
	{
		$t = (string) $v;
		$frac = strpos($t, '.') !== false ? rtrim(substr($t, strpos($t, '.') + 1), '0') : '';
		return fmt_argent($t, strlen($frac) > 2 ? 4 : 2);
	}

	/** Valeur scalaire lisible. */
	private static function valeur($cle, $v)
	{
		if ($v === null || $v === '') {
			return '(vide)';
		}
		if (is_bool($v)) {
			return $v ? 'Oui' : 'Non';
		}
		if (in_array($cle, self::BOOLEENNES, true) && ($v === 0 || $v === 1 || $v === '0' || $v === '1')) {
			return ((string) $v === '1') ? 'Oui' : 'Non';
		}
		if (in_array($cle, self::MONTANTS, true) && (is_string($v) || is_int($v) || is_float($v)) && preg_match('/^-?[0-9]+(\.[0-9]+)?\z/', (string) $v)) {
			return self::montant($v);
		}
		if (is_string($v)) {
			if ($cle === 'role' && isset(ROLES_FR[$v])) {
				return ROLES_FR[$v];
			}
			if ($cle === 'type' && isset(TYPES_EMPLACEMENT_FR[$v])) {
				return TYPES_EMPLACEMENT_FR[$v];
			}
			if ($cle === 'type' && isset(TYPES_DOCUMENT_FR[$v])) {
				return TYPES_DOCUMENT_FR[$v];
			}
			if ($cle === 'source' && $v === 'import') {
				return 'Import';
			}
			return self::court($v);
		}
		if (is_float($v)) {
			return str_replace('.', ',', (string) $v);
		}
		return (string) $v;
	}

	/** Valeur quelconque (scalaire, liste, tableau associatif) sur une seule ligne. */
	private static function valeurComplexe($cle, $v, $profondeur)
	{
		if (!is_array($v)) {
			return self::valeur($cle, $v);
		}
		if (!$v) {
			return '(aucun)';
		}
		if ($profondeur >= 3) {
			return self::court(json_encode($v, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE));
		}
		$liste = (array_keys($v) === range(0, count($v) - 1));
		$parts = array();
		foreach ($v as $k => $x) {
			$txt = self::valeurComplexe(is_int($k) ? $cle : $k, $x, $profondeur + 1);
			$parts[] = $liste ? $txt : (self::cle($k) . ' : ' . $txt);
		}
		return $liste ? implode(', ', $parts) : ('(' . implode(' ; ', $parts) . ')');
	}

	/**
	 * Lignes « libellé / valeur / modification ? » à partir du JSON des détails. null si ce n'est pas un JSON objet (texte libre).
	 * $action et $entiteId servent au contexte : « Nom saisi » d'un échec de connexion, entreprises A et B d'un bilan.
	 */
	public static function lignes($json, $action = '', $entiteId = null)
	{
		if ($json === null || trim((string) $json) === '') {
			return array();
		}
		$d = json_decode((string) $json, true);
		if (!is_array($d)) {
			return null;
		}
		$out = array();
		$changes = (isset($d['changements']) && is_array($d['changements'])) ? $d['changements'] : array();
		foreach ($d as $k => $v) {
			if ($k === 'changements' && is_array($v)) {
				foreach ($v as $champ => $paire) {
					if (is_array($paire) && count($paire) === 2 && array_key_exists(0, $paire) && array_key_exists(1, $paire)) {
						$out[] = array(self::cle($champ), self::valeurComplexe($champ, $paire[0], 1) . ' → ' . self::valeurComplexe($champ, $paire[1], 1), true);
					} else {
						$out[] = array(self::cle($champ), self::valeurComplexe($champ, $paire, 1), true);
					}
				}
				continue;
			}
			if (array_key_exists($k, $changes)) {
				continue;       // déjà montré sous forme « ancien → nouveau » : pas deux fois la même information
			}
			if ($action === 'connexion.echec' && $k === 'nom') {
				// Le nom tapé n'est montré que s'il correspond à un compte : une personne qui tape son mot de passe dans ce champ par erreur ne doit pas le laisser lisible.
				$out[] = array('Nom saisi', ($entiteId !== null && $entiteId !== '') ? self::court((string) $v) : '(compte inexistant)', false);
				continue;
			}
			if ($action === 'export.bilan' && ($k === 'a' || $k === 'b') && is_scalar($v)) {
				$nom = self::nomObjet('entreprises', $v);
				$out[] = array('Entreprise ' . strtoupper($k), $nom !== null ? $nom : (string) $v, false);
				continue;
			}
			if (isset(self::REFERENCES[$k]) && is_scalar($v) && preg_match('/^[0-9]{1,10}\z/', (string) $v)) {
				$nom = self::nomObjet(self::REFERENCES[$k][1], $v);
				$out[] = array(self::REFERENCES[$k][0], $nom !== null ? $nom : 'n° ' . (int) $v, false);
				continue;
			}
			$out[] = array(self::cle($k), self::valeurComplexe($k, $v, 0), false);
		}
		return $out;
	}

	/** Détails pour l'affichage (HTML déjà échappé). */
	public static function detailsHtml($json, $action = '', $entiteId = null)
	{
		$l = self::lignes($json, $action, $entiteId);
		if ($l === null) {
			return e(self::court((string) $json));
		}
		$h = array();
		foreach ($l as $x) {
			$h[] = '<span class="jr-ligne"><span class="jr-cle">' . e($x[0]) . ' :</span> ' . ($x[2] ? '<span class="jr-chg">' : '<span>') . e($x[1]) . '</span></span>';
		}
		return implode('', $h);
	}

	/** Détails en texte brut (export CSV) : « Libellé : valeur | Libellé : valeur ». */
	public static function detailsTexte($json, $action = '', $entiteId = null)
	{
		$l = self::lignes($json, $action, $entiteId);
		if ($l === null) {
			return self::court((string) $json);
		}
		$t = array();
		foreach ($l as $x) {
			$t[] = $x[0] . ' : ' . $x[1];
		}
		return implode(' | ', $t);
	}

	/** Objet concerné en texte : « Pièce P-0014 », « Utilisateur employe1 », « Pièce n° 14 » si son nom est introuvable. */
	public static function objetTexte($entite, $id)
	{
		if ($entite === null || $entite === '') {
			return '';
		}
		$txt = self::entite($entite);
		if ($id === null || $id === '') {
			return $txt;
		}
		$nom = self::nomObjet((string) $entite, $id);
		return $txt . ' ' . ($nom !== null ? $nom : 'n° ' . (int) $id);
	}

	/** Objet concerné pour l'affichage (HTML déjà échappé), avec un lien vers lui s'il a une page. */
	public static function elementHtml($entite, $id)
	{
		if ($entite === null || $entite === '') {
			return '';
		}
		$txt = e(self::objetTexte($entite, $id));
		if ($id !== null && $id !== '' && isset(self::PAGES[$entite])) {
			return '<a href="index.php?page=' . self::PAGES[$entite] . '&amp;id=' . (int) $id . '">' . $txt . '</a>';
		}
		return $txt;
	}

	/**
	 * Expression SQL de recherche libre : le code d'action ET son libellé français, l'objet et son libellé, l'utilisateur, les détails, l'adresse IP.
	 * (L'administrateur tape ce qu'il lit à l'écran : « Échec de connexion », « Mot de passe »…) Les libellés viennent des constantes ci-dessus.
	 */
	public static function expressionRecherche()
	{
		global $pdo;
		static $expr = null;
		if ($expr === null) {
			$cas = function ($col, array $libelles) use ($pdo) {
				$w = '';
				foreach ($libelles as $code => $lib) {
					$w .= ' WHEN ' . $pdo->quote((string) $code) . ' THEN ' . $pdo->quote($lib);
				}
				return 'CASE ' . $col . $w . " ELSE '' END";
			};
			$expr = "CONCAT_WS(' ', j.action, " . $cas('j.action', self::ACTIONS) . ', u.nom_utilisateur, j.entite, ' . $cas('j.entite', self::ENTITES) . ', j.details, j.ip)';
		}
		return $expr;
	}

	/**
	 * Filtres communs (tableau et export) à partir de $_GET + $_POST :
	 *   utilisateur_id (n° ou « aucun »), action, entite, du, au (AAAA-MM-JJ).
	 * Retourne array(where[], params[], filtres[] (pour le journal de l'export)). Valeur invalide : exception (400).
	 */
	public static function filtres(array $in)
	{
		$where = array();
		$params = array();
		$f = array();
		$txt = function ($k) use ($in) {
			return (isset($in[$k]) && is_string($in[$k])) ? trim($in[$k]) : '';
		};
		$u = $txt('utilisateur_id');
		if ($u === 'aucun') {
			$where[] = 'j.utilisateur_id IS NULL';
			$f['utilisateur'] = 'Aucun (système ou inconnu)';
		} elseif ($u !== '') {
			if (!preg_match('/^[0-9]{1,10}\z/', $u)) {
				throw new InventaireException('Utilisateur invalide.', 'utilisateur_id');
			}
			$where[] = 'j.utilisateur_id = :f_user';
			$params[':f_user'] = (int) $u;
			$f['utilisateur_id'] = (int) $u;
		}
		$a = $txt('action');
		if ($a !== '') {
			if (mb_strlen($a) > 40) {
				throw new InventaireException('Action invalide.', 'action');
			}
			$where[] = 'j.action = :f_action';
			$params[':f_action'] = $a;
			$f['action'] = $a;
		}
		$en = $txt('entite');
		if ($en !== '') {
			if (mb_strlen($en) > 40) {
				throw new InventaireException('Objet concerné invalide.', 'entite');
			}
			$where[] = 'j.entite = :f_entite';
			$params[':f_entite'] = $en;
			$f['entite'] = $en;
		}
		foreach (array('du' => 'Date de début', 'au' => 'Date de fin') as $k => $lib) {
			$v = $txt($k);
			if ($v === '') {
				continue;
			}
			if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})\z/', $v, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
				throw new InventaireException($lib . ' invalide (format AAAA-MM-JJ).', $k);
			}
			if ($k === 'du') {
				$where[] = 'j.date_action >= :f_du';
				$params[':f_du'] = $v . ' 00:00:00';
			} else {
				$where[] = 'j.date_action < :f_au';
				$params[':f_au'] = date('Y-m-d', strtotime($v . ' +1 day')) . ' 00:00:00';
			}
			$f[$k] = $v;
		}
		return array($where, $params, $f);
	}
}
