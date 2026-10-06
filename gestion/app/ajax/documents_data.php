<?php
// Tableau serveur (DataTables) des documents : réceptions, transferts, sorties, ajustements, factures internes.
// Employé+. Seuls les documents d'une entreprise de l'utilisateur (émettrice OU destinataire) sont listés.
// La colonne « total » n'existe que pour un gestionnaire+ : pour un employé elle n'est ni calculée, ni triable, ni envoyée.
// POST : paramètres DataTables + type, entreprise_id, statut ('valide'|'annule'), du, au (AAAA-MM-JJ) + search[value]
//        (recherche par numéro, référence, fournisseur ou note).
// Colonnes (alias) : numero, type, date, entreprise, emplacements, utilisateur, total (gestionnaire+), statut — doivent
// correspondre à columns[].data côté JS.
require_once __DIR__ . '/../action/document_lib.php';
endpoint(function () {
	global $pdo, $Ouser;
	inventaire()->exiger(utilisateur_id(), 'consulter');
	$req = $_POST + $_GET;
	$lire = function ($cle) use ($req) {
		return (isset($req[$cle]) && is_scalar($req[$cle])) ? trim((string) $req[$cle]) : '';
	};
	$date_valide = function ($s) {
		return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
	};

	// Entreprises de l'utilisateur : entiers issus de ses droits (jamais du navigateur), donc insérés tels quels
	// (les expressions de colonnes ne peuvent pas porter de paramètres : elles ne figurent pas dans le comptage).
	$acc = array_map('intval', $Ouser->entreprisesConsultables());   // y compris une entreprise désactivée (historique)
	$liste = $acc ? implode(',', $acc) : '0';

	$where = array('(d.entreprise_id IN (' . $liste . ') OR d.entreprise_dest_id IN (' . $liste . '))');
	$params = array();

	$type = $lire('type');
	if ($type !== '') {
		if (!isset(TYPES_DOCUMENT_FR[$type])) {
			$where[] = '1 = 0';
		} else {
			$where[] = 'd.type = :type';
			$params[':type'] = $type;
		}
	}
	$statut = $lire('statut');
	if ($statut === 'valide' || $statut === 'annule') {
		$where[] = 'd.statut = :statut';
		$params[':statut'] = $statut;
	}
	$ent = $lire('entreprise_id');
	if ($ent !== '' && $ent !== '0') {
		if (ctype_digit($ent) && strlen($ent) < 10 && in_array((int) $ent, $acc, true)) {
			$where[] = '(d.entreprise_id = :ent_a OR d.entreprise_dest_id = :ent_b)';
			$params[':ent_a'] = (int) $ent;
			$params[':ent_b'] = (int) $ent;
		} else {
			$where[] = '1 = 0';
		}
	}
	$du = $lire('du');
	if ($du !== '') {
		if ($date_valide($du)) {
			$where[] = 'd.date_document >= :du';
			$params[':du'] = $du;
		} else {
			$where[] = '1 = 0';
		}
	}
	$au = $lire('au');
	if ($au !== '') {
		if ($date_valide($au)) {
			$where[] = 'd.date_document <= :au';
			$params[':au'] = $au;
		} else {
			$where[] = '1 = 0';
		}
	}

	$couts = $Ouser->peutVoirCouts();
	$colonnes = array(
		'ordre' => '(0 - CAST(d.id AS SIGNED))',          // tri de départ : le plus récent d'abord (id décroissant)
		'id' => 'd.id',
		'numero' => 'd.numero',
		'type' => 'd.type',
		'date' => 'd.date_document',
		'entreprise' => 'en.nom',
		'entreprise_dest' => 'end_.nom',
		// noms d'emplacements : masqués s'ils appartiennent à une entreprise que l'utilisateur ne peut pas voir
		'emplacements' => 'CASE WHEN d.entreprise_id IN (' . $liste . ') THEN e.nom END',
		'emplacement_dest' => 'CASE WHEN ed.entreprise_id IN (' . $liste . ') THEN ed.nom END',
		'utilisateur' => "COALESCE(NULLIF(u.nom_complet, ''), u.nom_utilisateur)",
	);
	if ($couts) {
		$colonnes['total'] = 'd.total';
	}
	$colonnes['statut'] = 'd.statut';

	$formateurs = array(
		'numero' => function ($l) {
			return '<a class="code font-weight-bold" href="index.php?page=document_voir&amp;id=' . (int) $l['id'] . '">' . e($l['numero']) . '</a>';
		},
		'type' => function ($l) {
			return e(isset(TYPES_DOCUMENT_FR[$l['type']]) ? TYPES_DOCUMENT_FR[$l['type']] : $l['type']);
		},
		'date' => function ($l) {
			return e(fmt_date($l['date']));
		},
		'entreprise' => function ($l) {
			return e($l['entreprise']) . ($l['entreprise_dest'] !== null ? ' → ' . e($l['entreprise_dest']) : '');
		},
		'emplacements' => function ($l) {
			$a = $l['emplacements'] !== null ? e($l['emplacements']) : '';
			if ($l['emplacement_dest'] !== null) {
				return ($a !== '' ? $a . ' → ' : '→ ') . e($l['emplacement_dest']);
			}
			return $a;
		},
		'statut' => function ($l) {
			return $l['statut'] === 'annule'
				? '<span class="badge badge-danger">ANNULÉ</span>'
				: '<span class="badge badge-success">Valide</span>';
		},
	);
	if ($couts) {
		$formateurs['total'] = function ($l) {
			return e(fmt_argent($l['total']));
		};
	}

	DataTable::repondre($pdo, array(
		'from' => 'documents d
			JOIN entreprises en ON en.id = d.entreprise_id
			JOIN emplacements e ON e.id = d.emplacement_id
			LEFT JOIN emplacements ed ON ed.id = d.emplacement_dest_id
			LEFT JOIN entreprises end_ ON end_.id = d.entreprise_dest_id
			LEFT JOIN fournisseurs f ON f.id = d.fournisseur_id
			LEFT JOIN utilisateurs u ON u.id = d.utilisateur_id',
		'colonnes' => $colonnes,
		// une seule expression (le même paramètre ne peut pas être répété) : numéro, référence, fournisseur, note
		'recherche' => array("CONCAT_WS(' ', d.numero, d.reference, f.nom, d.note)"),
		'where' => $where,
		'params' => $params,
		'tri_defaut' => array('ordre', 'asc'),
		'formateurs' => $formateurs,
	));
});
