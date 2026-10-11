<?php
/**
 * Modèle d'un document (réception, déplacement, utilisation, correction du stock, facture interne) et du bilan du mois, avec tout le
 * texte DÉJÀ formaté (dates, quantités, montants). Le même modèle sert à la page (écran et impression) et au PDF : ce que la page
 * montre à un utilisateur est exactement ce que son PDF contient. Les droits viennent du service Inventaire (document() ne renvoie
 * ni coût ni total à un employé, ni le nom d'un emplacement d'une entreprise inaccessible) ; ici on ne calcule rien :
 * les montants passent par fmt_argent / fmt_nombre (aucune extension bcmath requise).
 * Prérequis : init.php chargé (fmt_* , TYPES_DOCUMENT_FR, Inventaire) ; PDO et User fournis par l'appelant.
 */
require_once __DIR__ . '/Marque.php';

final class DocumentVue
{
	/** Type de document => libellé (le titre du document est ce libellé en majuscules). */
	const LIBELLES = array(
		'reception' => 'Réception', 'transfert' => 'Déplacement', 'sortie' => 'Utilisation',
		'ajustement' => 'Correction du stock', 'facture_interne' => 'Facture interne',
	);

	// ------------------------------------------------------------------
	//  Utilitaires
	// ------------------------------------------------------------------

	/** « 2026-03-05 14:30:12 » -> « 2026-03-05 14:30 ». */
	public static function moment($s)
	{
		return $s ? substr((string) $s, 0, 16) : '';
	}

	/** Coût unitaire : 2 à 4 décimales (« 14,50 $ », « 52,9714 $ »). */
	public static function cout($s)
	{
		if ($s === null || $s === '') {
			return '';
		}
		$x = fmt_nombre($s, 4);
		$x = preg_replace('/(,\d\d\d)0$/', '$1', $x);
		$x = preg_replace('/(,\d\d)0$/', '$1', $x);
		return $x . "\xc2\xa0$";
	}

	/** Texte entre guillemets français, avec espaces insécables. */
	public static function guill($t)
	{
		return "«\xc2\xa0" . $t . "\xc2\xa0»";
	}

	/** Libellé d'un motif de sortie ou de correction ; le motif brut s'il est inconnu. */
	private static function motif($type, $motif)
	{
		$liste = ($type === 'ajustement') ? Inventaire::MOTIFS_AJUSTEMENT : (($type === 'sortie') ? Inventaire::MOTIFS_SORTIE : array());
		return isset($liste[$motif]) ? $liste[$motif] : (string) $motif;
	}

	/** Codes (BEA, BCH…) des entreprises données : id => code. */
	public static function codesEntreprises(PDO $pdo, array $ids)
	{
		$ids = array_values(array_unique(array_map('intval', $ids)));
		if (!$ids) {
			return array();
		}
		$st = $pdo->prepare('SELECT id, code FROM entreprises WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
		$st->execute($ids);
		$res = array();
		foreach ($st->fetchAll() as $r) {
			$res[(int) $r['id']] = (string) $r['code'];
		}
		return $res;
	}

	// ------------------------------------------------------------------
	//  Document
	// ------------------------------------------------------------------

	/**
	 * @param array $r résultat de inventaire()->document($userId, $id) : array('doc'=>…, 'lignes'=>…)
	 * @param array $opts 'masque' : texte d'un emplacement d'une autre entreprise (« Autre entreprise » par défaut)
	 */
	public static function document(PDO $pdo, User $user, array $r, array $opts = array())
	{
		$d = $r['doc'];
		$type = $d['type'];
		$masque = isset($opts['masque']) ? $opts['masque'] : 'Autre entreprise';
		$couts = $user->peutVoirCouts();
		$acc = array_map('intval', $user->entreprisesConsultables());
		$visible = function ($entrepriseId) use ($acc) { return in_array((int) $entrepriseId, $acc, true); };
		$annule = ($d['statut'] === 'annule');
		$feminin = ($type === 'facture_interne');
		$libelle = isset(self::LIBELLES[$type]) ? self::LIBELLES[$type] : (isset(TYPES_DOCUMENT_FR[$type]) ? TYPES_DOCUMENT_FR[$type] : (string) $type);

		$eid = (int) $d['entreprise_id'];
		$did = $d['entreprise_dest_id'] ? (int) $d['entreprise_dest_id'] : 0;
		$entre = ($did > 0 && $did !== $eid);                     // document d'une entreprise à une autre
		$codes = self::codesEntreprises($pdo, array($eid, $did));
		$marque = Marque::pour(isset($codes[$eid]) ? $codes[$eid] : '', $d['entreprise']);
		$marqueDest = $entre ? Marque::pour(isset($codes[$did]) ? $codes[$did] : '', $d['entreprise_dest']) : null;

		// Noms complets (et non les identifiants de connexion)
		$st = $pdo->prepare("SELECT COALESCE(NULLIF(u.nom_complet, ''), u.nom_utilisateur) AS saisi, COALESCE(NULLIF(ua.nom_complet, ''), ua.nom_utilisateur) AS annule
			FROM documents d LEFT JOIN utilisateurs u ON u.id = d.utilisateur_id LEFT JOIN utilisateurs ua ON ua.id = d.annule_par WHERE d.id = ?");
		$st->execute(array((int) $d['id']));
		$noms = $st->fetch();
		$nomSaisi = ($noms && $noms['saisi'] !== null) ? $noms['saisi'] : $d['utilisateur'];
		$nomAnnule = ($noms && $noms['annule'] !== null) ? $noms['annule'] : $d['annule_par_nom'];

		// Emplacements : jamais le nom d'un emplacement d'une entreprise à laquelle l'utilisateur n'a pas accès
		$nomSrc = $visible($eid) ? $d['emplacement'] : null;
		$nomDest = ($d['emplacement_dest'] !== null && $visible($did > 0 ? $did : $eid)) ? $d['emplacement_dest'] : null;

		$parties = null;
		$infos = array(array('libelle' => 'Entreprise', 'valeur' => (string) $d['entreprise'], 'discret' => false));
		if ($entre) {
			$parties = array(
				array('etiquette' => 'Émetteur', 'slug' => $marque['slug'], 'nom' => (string) $d['entreprise'], 'emplacement_libelle' => 'Emplacement source', 'emplacement' => $nomSrc, 'masque' => $masque),
				array('etiquette' => 'Destinataire', 'slug' => $marqueDest['slug'], 'nom' => (string) $d['entreprise_dest'], 'emplacement_libelle' => 'Emplacement de destination', 'emplacement' => $nomDest, 'masque' => $masque),
			);
			$infos = array();
		} elseif ($type === 'transfert') {
			$infos[] = array('libelle' => 'De', 'valeur' => $nomSrc !== null ? $nomSrc : $masque, 'discret' => $nomSrc === null);
			$infos[] = array('libelle' => 'Vers', 'valeur' => $nomDest !== null ? $nomDest : $masque, 'discret' => $nomDest === null);
		} else {
			$etiq = ($type === 'reception') ? 'Reçu à' : (($type === 'sortie') ? 'Sorti de' : 'Emplacement');
			$infos[] = array('libelle' => $etiq, 'valeur' => $nomSrc !== null ? $nomSrc : $masque, 'discret' => $nomSrc === null);
		}
		if ($d['fournisseur']) {
			$infos[] = array('libelle' => 'Fournisseur', 'valeur' => (string) $d['fournisseur'], 'discret' => false);
		}
		if ($d['reference'] !== null && $d['reference'] !== '') {
			$etiqRef = ($type === 'reception') ? 'N° de facture du fournisseur' : (($type === 'sortie') ? 'N° de bon de travail' : 'Référence');
			$infos[] = array('libelle' => $etiqRef, 'valeur' => (string) $d['reference'], 'discret' => false);
		}
		if ($d['motif'] !== null && $d['motif'] !== '') {
			$infos[] = array('libelle' => 'Motif', 'valeur' => self::motif($type, $d['motif']), 'discret' => false);
		}

		$lignes = array();
		foreach ($r['lignes'] as $l) {
			$q = (string) $l['quantite'];
			$lignes[] = array(
				'piece_id' => (int) $l['piece_id'], 'code' => (string) $l['code'], 'nom' => (string) $l['nom'],
				'quantite' => (($type === 'ajustement' && $q !== '' && $q[0] !== '-') ? '+' : '') . fmt_nombre($q),
				'unite' => ($l['unite'] && $l['unite'] !== 'unité') ? (string) $l['unite'] : '',
				'cout' => $couts ? self::cout($l['cout_unitaire']) : null,
				'total' => $couts ? fmt_argent($l['total_ligne']) : null,
			);
		}

		$statut = $annule ? ($feminin ? 'ANNULÉE' : 'ANNULÉ') : 'Valide';
		return array(
			'id' => (int) $d['id'], 'type' => $type, 'libelle' => $libelle, 'titre' => mb_strtoupper($libelle, 'UTF-8'),
			'numero' => (string) $d['numero'], 'date' => fmt_date($d['date_document']),
			'annule' => $annule, 'statut' => $statut,
			'marque' => $marque, 'marque_dest' => $marqueDest, 'symbole' => 'fleche',
			'entreprise' => (string) $d['entreprise'], 'entreprise_dest' => $entre ? (string) $d['entreprise_dest'] : null,
			'parties' => $parties, 'infos' => $infos,
			'couts' => $couts, 'lignes' => $lignes, 'total' => $couts ? fmt_argent($d['total']) : null,
			'note' => ($d['note'] !== null && $d['note'] !== '') ? (string) $d['note'] : null,
			'signatures' => $feminin,
			'saisi_par' => $nomSaisi !== null ? (string) $nomSaisi : '—', 'saisi_le' => self::moment($d['cree_le']),
			'annulation' => $annule ? array(
				'mot' => $feminin ? 'Annulée' : 'Annulé',
				'par' => $nomAnnule !== null ? (string) $nomAnnule : null,
				'le' => $d['annule_le'] ? self::moment($d['annule_le']) : null,
				'motif' => ($d['motif_annulation'] !== null && $d['motif_annulation'] !== '') ? (string) $d['motif_annulation'] : null,
			) : null,
			'meta' => array(
				array('Numéro', (string) $d['numero'], 'code'),
				array('Date', fmt_date($d['date_document']), ''),
				array('Statut', $statut, $annule ? 'annule' : 'ok'),
			),
		);
	}

	/** Phrase d'annulation : « Annulé par X le 2026-03-05 14:30. Motif : « … ». » */
	public static function phraseAnnulation(array $a)
	{
		$s = $a['mot'] . ($a['par'] !== null ? ' par ' . $a['par'] : '') . ($a['le'] !== null ? ' le ' . $a['le'] : '') . '.';
		if ($a['motif'] !== null) {
			$s .= ' Motif : ' . self::guill($a['motif']) . '.';
		}
		return $s;
	}

	// ------------------------------------------------------------------
	//  Bilan du mois
	// ------------------------------------------------------------------

	/**
	 * @param array $r résultat de inventaire()->bilanMensuel(…)
	 * @param string $periode « mars 2026 » (Interentreprise::libellePeriode)
	 */
	public static function bilan(PDO $pdo, array $r, $annee, $mois, $a, $b, $periode)
	{
		$noms = $r['entreprises'];
		$codes = self::codesEntreprises($pdo, array($a, $b));
		$marqueA = Marque::pour(isset($codes[$a]) ? $codes[$a] : '', $noms[$a]);
		$marqueB = Marque::pour(isset($codes[$b]) ? $codes[$b] : '', $noms[$b]);
		$sens = array();
		$nbFactures = 0;
		foreach (array(array($a, $b, 'a_vers_b'), array($b, $a, 'b_vers_a')) as $s) {
			$bloc = $r[$s[2]];
			$docs = array();
			foreach ($bloc['documents'] as $doc) {
				$docs[] = array(
					'id' => (int) $doc['id'], 'numero' => (string) $doc['numero'], 'date' => fmt_date($doc['date_document']),
					'de' => (string) $doc['emplacement'], 'vers' => (string) $doc['emplacement_dest'],
					'note' => ($doc['note'] !== null && $doc['note'] !== '') ? (string) $doc['note'] : null, 'total' => fmt_argent($doc['total']),
				);
			}
			$pieces = array();
			foreach ($bloc['pieces'] as $p) {
				$pieces[] = array(
					'piece_id' => (int) $p['piece_id'], 'code' => (string) $p['code'], 'nom' => (string) $p['nom'],
					'quantite' => fmt_nombre($p['quantite']), 'unite' => ($p['unite'] && $p['unite'] !== 'unité') ? (string) $p['unite'] : '',
					'cout_moyen' => self::cout($p['cout_moyen']), 'total' => fmt_argent($p['total']),
				);
			}
			$nbFactures += count($docs);
			$sens[] = array('de' => $noms[$s[0]], 'vers' => $noms[$s[1]], 'total' => fmt_argent($bloc['total']), 'documents' => $docs, 'pieces' => $pieces);
		}
		$solde = $r['solde'];
		$nul = ($solde['debiteur'] === null);
		$periodeCap = mb_strtoupper(mb_substr($periode, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($periode, 1, null, 'UTF-8');
		return array(
			'titre' => 'BILAN DU MOIS', 'periode' => $periodeCap, 'periode_min' => $periode,
			'marque' => $marqueA, 'marque_dest' => $marqueB, 'symbole' => 'double',
			'paire' => $noms[$a] . ' et ' . $noms[$b],
			'sens' => $sens, 'nb_factures' => $nbFactures,
			'solde' => array(
				'nul' => $nul,
				'montant' => $nul ? null : fmt_argent($solde['montant']),
				'debiteur' => $solde['debiteur_nom'], 'creancier' => $solde['creancier_nom'],
				'sous' => $nul ? ($nbFactures === 0 ? 'Aucune facture en ' . $periode . '.' : 'Les deux entreprises sont quittes.') : null,
			),
			'meta' => array(array('Période', $periodeCap, 'code'), array('Entreprises', $noms[$a] . ' et ' . $noms[$b], '')),
		);
	}

	// ------------------------------------------------------------------
	//  En-tête HTML (écran et impression)
	// ------------------------------------------------------------------

	/** Logo de l'entreprise (image), ou son nom en gros texte si elle n'a pas de logo. */
	public static function logoHtml(array $marque)
	{
		if ($marque['logo'] !== null) {
			return '<img class="doc-logo" src="' . e($marque['logo']) . '" alt="' . e($marque['nom']) . '">';
		}
		return '<span class="doc-nom-marque">' . e($marque['nom']) . '</span>';
	}

	/** Classe de l'identité visuelle d'un document : « doc-bea », « doc-bch » ou « doc-neutre ». */
	public static function classeMarque(array $m)
	{
		return 'doc-' . $m['marque']['slug'];
	}

	/**
	 * Bandeau d'en-tête : logo(s) à gauche (émetteur → destinataire), titre et informations à droite, puis le filet de couleur.
	 * $m : 'marque', 'marque_dest', 'symbole', 'titre', 'meta' (libellé, valeur, style : '', 'code', 'ok', 'annule').
	 */
	public static function enteteHtml(array $m)
	{
		echo '<header class="doc-entete">';
		echo '<div class="doc-logos' . ($m['marque_dest'] ? ' doc-logos-duo' : '') . '">' . self::logoHtml($m['marque']);
		if ($m['marque_dest']) {
			$icone = ($m['symbole'] === 'double') ? 'fa-exchange-alt' : 'fa-long-arrow-alt-right';
			echo '<i class="fas ' . $icone . ' doc-fleche" aria-hidden="true"></i><span class="sr-only">' . ($m['symbole'] === 'double' ? 'et' : 'vers') . '</span>' . self::logoHtml($m['marque_dest']);
		}
		echo '</div>';
		echo '<div class="doc-titre-bloc"><h2 class="doc-titre ie-titre">' . e($m['titre']) . '</h2><dl class="doc-meta ie-meta">';
		foreach ($m['meta'] as $x) {
			echo '<dt>' . e($x[0]) . '</dt><dd>';
			if ($x[2] === 'ok') {
				echo '<span class="badge badge-success">' . e($x[1]) . '</span>';
			} elseif ($x[2] === 'annule') {
				echo '<span class="badge badge-danger">' . e($x[1]) . '</span>';
			} else {
				echo '<span class="' . ($x[2] === 'code' ? 'code font-weight-bold' : '') . '">' . e($x[1]) . '</span>';
			}
			echo '</dd>';
		}
		echo '</dl></div></header><div class="doc-filet" aria-hidden="true"></div>';
	}

	/** Règle d'impression : « Imprimé le … · Page n / N » en bas de chaque page (navigateurs qui gèrent les marges de page). */
	public static function styleImpression()
	{
		return '<style>@page { @bottom-right { content: "Imprimé le ' . e(date('Y-m-d H:i')) . ' · Page " counter(page) " / " counter(pages); } }</style>';
	}

	/**
	 * Document complet (écran et impression) : en-tête, annulation, parties ou informations, pièces, total, note, signatures.
	 * Les identifiants (table-lignes, total-facture / total-document, bandeau-annule, facture) sont ceux dont dépendent les tests.
	 * $opts : 'id' (identifiant de l'article), 'classes', 'aria'.
	 */
	public static function documentHtml(array $m, array $opts = array())
	{
		$facture = ($m['type'] === 'facture_interne');
		$cols = $m['couts'] ? 5 : 3;
		echo self::styleImpression();
		echo '<article class="card doc ' . e(self::classeMarque($m)) . ($m['annule'] ? ' doc-annule' : '') . (isset($opts['classes']) ? ' ' . e($opts['classes']) : '') . '"'
			. (isset($opts['id']) ? ' id="' . e($opts['id']) . '"' : '') . ' aria-label="' . e($m['libelle'] . ' ' . $m['numero']) . '">';
		if ($m['annule']) {
			echo '<div class="doc-filigrane ie-filigrane" aria-hidden="true">' . e($m['statut']) . '</div>';
		}
		echo '<div class="card-body">';
		self::enteteHtml($m);

		if ($m['annule']) {
			echo '<div class="alert doc-bandeau-annule" role="status" id="bandeau-annule"><span class="badge badge-danger doc-badge-annule">' . e($m['statut']) . '</span><span class="ml-2">'
				. e(self::phraseAnnulation($m['annulation'])) . '</span></div>';
		}

		if ($m['parties']) {
			echo '<div class="doc-parties ie-parties">';
			foreach ($m['parties'] as $i => $p) {
				$id = ($i === 0) ? 'ie-emetteur' : 'ie-destinataire';
				echo '<section class="doc-partie doc-' . e($p['slug']) . ' ie-partie" aria-labelledby="' . $id . '"><h3 id="' . $id . '">' . e($p['etiquette']) . '</h3><p class="doc-partie-nom ie-partie-nom">' . e($p['nom']) . '</p>'
					. '<p class="mb-0">' . e($p['emplacement_libelle']) . ' : ' . ($p['emplacement'] === null ? '<span class="text-muted">' . e($p['masque']) . '</span>' : '<strong>' . e($p['emplacement']) . '</strong>') . '</p></section>';
			}
			echo '</div>';
		}
		if ($m['infos']) {
			echo '<dl class="doc-infos mv-entete">';
			foreach ($m['infos'] as $x) {
				echo '<div class="doc-info"><dt>' . e($x['libelle']) . '</dt><dd>' . ($x['discret'] ? '<span class="text-muted">' . e($x['valeur']) . '</span>' : e($x['valeur'])) . '</dd></div>';
			}
			echo '</dl>';
		}

		echo '<div class="table-responsive doc-table-wrap"><table class="table table-sm doc-table" id="table-lignes"><caption class="sr-only">Pièces du document ' . e($m['numero']) . '</caption><thead><tr>'
			. '<th scope="col">Code</th><th scope="col">Pièce</th><th scope="col" class="nombre">Quantité</th>';
		if ($m['couts']) {
			echo '<th scope="col" class="nombre">Coût unitaire</th><th scope="col" class="nombre">Total</th>';
		}
		echo '</tr></thead><tbody>';
		foreach ($m['lignes'] as $l) {
			echo '<tr><td class="code"><a href="index.php?page=piece_voir&amp;id=' . (int) $l['piece_id'] . '">' . e($l['code']) . '</a></td><td>' . e($l['nom']) . '</td>'
				. '<td class="nombre">' . e($l['quantite']) . ($l['unite'] !== '' ? ' <small class="text-muted">' . e($l['unite']) . '</small>' : '') . '</td>';
			if ($m['couts']) {
				echo '<td class="nombre">' . e($l['cout']) . '</td><td class="nombre">' . e($l['total']) . '</td>';
			}
			echo '</tr>';
		}
		echo '</tbody>';
		if ($m['couts']) {
			echo '<tfoot><tr class="doc-ligne-total"><th colspan="' . ($cols - 2) . '"></th><th class="doc-total-label">Total</th><th class="nombre doc-total-montant" id="' . ($facture ? 'total-facture' : 'total-document') . '">' . e($m['total']) . '</th></tr></tfoot>';
		}
		echo '</table></div>';

		if ($m['note'] !== null) {
			echo '<div class="doc-note ie-note"><strong>Note</strong><div class="doc-note-texte">' . e($m['note']) . '</div></div>';
		}
		if ($m['signatures']) {
			echo '<div class="doc-signatures ie-signatures">'
				. '<div class="doc-signature"><div class="doc-trait"></div><div>Préparé par — ' . e($m['entreprise']) . '</div></div>'
				. '<div class="doc-signature"><div class="doc-trait"></div><div>Reçu par — ' . e($m['entreprise_dest']) . '</div></div></div>';
		}
		echo '<footer class="doc-pied"><span>Saisi par ' . e($m['saisi_par']) . ' · ' . e($m['saisi_le']) . '</span>'
			. '<span class="doc-pied-logiciel">Logiciel de gestion d\'inventaire — Beauchemin / Boutique Chaleur</span></footer>';
		echo '</div></article>';
	}
}
