<?php
/**
 * Bibliothèque des étiquettes (module A2) : formats, code-barres SVG, troncature des noms.
 * Ce n'est PAS un endpoint : il est inclus par pages/etiquettes.php et par les endpoints etiquette*.
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
	http_response_code(404);
	exit;
}

final class Etiquettes
{
	const MAX_ELEMENTS = 500;     // lignes de la liste
	const MAX_COPIES = 200;       // copies par élément
	const MAX_ETIQUETTES = 1000;  // étiquettes par impression

	/** Largeurs de module (mm) essayées dans l'ordre : multiples de 10 mil (0,254 mm), exacts à 203, 300 et 600 ppp. */
	const MODULES_MM = array(0.508, 0.254);
	/** En dessous de cette largeur de module (≈ 7,5 mil), un lecteur ordinaire lit mal : le code est refusé. */
	const MODULE_MIN_MM = 0.19;

	/** Formats d'impression. Dimensions en mm, polices en points. */
	public static function formats()
	{
		return array(
			'feuille30' => array(
				'nom' => 'Feuille de 30 (type Avery 5160, 66,7 × 25,4 mm)',
				'aide' => 'Feuilles adhésives Lettre (8,5 × 11 po), 3 colonnes × 10 rangées.',
				'largeur' => 66.7, 'hauteur' => 25.4,
				'page_largeur' => 215.9, 'page_hauteur' => 279.4,
				'colonnes' => 3, 'rangees' => 10,
				'marge_gauche' => 4.75, 'marge_haut' => 12.7, 'ecart_x' => 3.15, 'ecart_y' => 0,
				'marge_interne' => 1.6, 'barre_hauteur' => 10.5,
				'police_code' => 8, 'police_nom' => 6.5, 'nom_max' => 64, 'zoom' => 1,
			),
			'rouleau' => array(
				'nom' => 'Rouleau 50 × 25 mm',
				'aide' => 'Imprimante d\'étiquettes : une étiquette par page.',
				'largeur' => 50.0, 'hauteur' => 25.0,
				'page_largeur' => 50.0, 'page_hauteur' => 25.0,
				'colonnes' => 1, 'rangees' => 1,
				'marge_gauche' => 0, 'marge_haut' => 0, 'ecart_x' => 0, 'ecart_y' => 0,
				'marge_interne' => 1.5, 'barre_hauteur' => 9.5,
				'police_code' => 8, 'police_nom' => 6.5, 'nom_max' => 54, 'zoom' => 2,
			),
			'grande' => array(
				'nom' => 'Grande 100 × 50 mm',
				'aide' => 'Grande étiquette (cube, tablette, bac) : une étiquette par page.',
				'largeur' => 100.0, 'hauteur' => 50.0,
				'page_largeur' => 100.0, 'page_hauteur' => 50.0,
				'colonnes' => 1, 'rangees' => 1,
				'marge_gauche' => 0, 'marge_haut' => 0, 'ecart_x' => 0, 'ecart_y' => 0,
				'marge_interne' => 2.5, 'barre_hauteur' => 19.0,
				'police_code' => 16, 'police_nom' => 11, 'nom_max' => 90, 'zoom' => 1.5,
			),
		);
	}

	public static function format($cle)
	{
		$f = self::formats();
		if (!is_string($cle) || !isset($f[$cle])) {
			throw new InventaireException('Format d\'étiquette inconnu.', 'format');
		}
		return $f[$cle] + array('cle' => $cle);
	}

	/** Typographie française : espace insécable dans « … » et avant : ; ? ! (jamais de « » ou de « : » seul en début de ligne). */
	public static function typo($t)
	{
		$nb = "\u{00A0}";
		$t = preg_replace('/« +/u', '«' . $nb, (string) $t);
		$t = preg_replace('/ +»/u', $nb . '»', $t);
		return preg_replace('/ +([:;?!])/u', $nb . '$1', $t);
	}

	/** Coupe un nom proprement (à la limite d'un mot, avec « … »). */
	public static function tronquer($s, $max)
	{
		$s = trim(preg_replace('/\s+/u', ' ', (string) $s));
		if (mb_strlen($s) <= $max) {
			return $s;
		}
		$coupe = mb_substr($s, 0, $max - 1);
		$esp = mb_strrpos($coupe, ' ');
		if ($esp !== false && $esp >= $max * 0.6) {
			$coupe = mb_substr($coupe, 0, $esp);
		}
		return preg_replace('/[\s,;:\-–—\/(]+$/u', '', $coupe) . '…';
	}

	/**
	 * Largeur de module (mm) retenue pour ce code sur ce format, ou null si le code est trop long pour être lu de façon fiable.
	 * @return array{0:?float,1:int,2:float} [module en mm ou null, nombre de modules (zones de silence comprises), largeur utile en mm]
	 */
	private static function moduleMm($code, array $fmt)
	{
		$modules = strlen(Code128::modules($code)) + 20;   // + zones de silence (10 modules de chaque côté)
		$utile = $fmt['largeur'] - 2 * $fmt['marge_interne'];
		foreach (self::MODULES_MM as $m) {
			if ($modules * $m <= $utile + 0.0001) {
				return array($m, $modules, $utile);
			}
		}
		$mm = $utile / $modules;
		return array($mm >= self::MODULE_MIN_MM ? $mm : null, $modules, $utile);
	}

	/** Nombre maximal de caractères (jeu B : 11 modules par caractère + 55 de départ, somme, arrêt et silences) lisibles sur ce format. */
	public static function longueurMax(array $fmt)
	{
		$utile = $fmt['largeur'] - 2 * $fmt['marge_interne'];
		return (int) floor(($utile / self::MODULE_MIN_MM - 55) / 11 + 0.0001);
	}

	/** Message de refus d'un code trop long : propose un format où il passe, ou dit de raccourcir le code (aucun format plus grand n'existe). */
	private static function messageTropLong($code, array $fmt)
	{
		$autres = array();
		$max = 0;
		foreach (self::formats() as $cle => $f) {
			$max = max($max, self::longueurMax($f));
			if ($cle !== $fmt['cle'] && self::moduleMm($code, $f)[0] !== null) {
				$autres[] = '« ' . $f['nom'] . ' »';
			}
		}
		if ($autres) {
			return 'Le code « ' . $code . ' » est trop long pour ce format : le code-barres serait illisible. Choisissez le format ' . implode(' ou ', $autres) . '.';
		}
		return 'Le code « ' . $code . ' » est trop long pour un code-barres lisible, même sur le plus grand format (' . $max . ' caractères au plus). Raccourcissez-le dans la fiche.';
	}

	/**
	 * Code-barres Code 128 prêt à imprimer : SVG de la classe Code128, dimensionné en millimètres.
	 * Lève InventaireException (message français) si le texte ne peut pas être imprimé en Code 128
	 * ou s'il est trop long pour être lu de façon fiable sur ce format.
	 * @return array{svg:string,module:float,code_pt:float}
	 */
	public static function codeBarres($code, array $fmt)
	{
		$code = (string) $code;
		if ($code === '') {
			throw new InventaireException('Le code est vide : impossible d\'imprimer un code-barres.');
		}
		if (!preg_match('/^[\x20-\x7E]+$/D', $code)) {   // D : un « \n » final ne passe pas pour la fin de texte
			$aff = trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', $code));   // un saut de ligne ne s'affiche pas dans un message
			throw new InventaireException('Le code « ' . $aff . ' » contient des caractères qui ne peuvent pas être imprimés en code-barres (accents, espaces spéciaux ou symboles). Corrigez le code de la fiche.');
		}
		if (strlen($code) > 40) {
			throw new InventaireException('Le code « ' . self::tronquer($code, 20) . ' » dépasse 40 caractères : impossible de l\'imprimer en code-barres.');
		}
		list($mm, $modules, $utile) = self::moduleMm($code, $fmt);
		if ($mm === null) {
			throw new InventaireException(self::messageTropLong($code, $fmt));
		}
		$svg = Code128::svg($code, array('module' => 1, 'hauteur' => 60, 'texte' => false));
		$largeur = rtrim(rtrim(number_format($modules * $mm, 3, '.', ''), '0'), '.');
		$hauteur = rtrim(rtrim(number_format($fmt['barre_hauteur'], 3, '.', ''), '0'), '.');
		$svg2 = preg_replace(
			'/^<svg xmlns="([^"]*)" width="\d+" height="\d+"/',
			'<svg xmlns="$1" width="' . $largeur . 'mm" height="' . $hauteur . 'mm" preserveAspectRatio="none"',
			$svg,
			1
		);
		// Taille du code en clair : au plus les 65 % de la largeur utile (le reste est pour l'unité / l'entreprise)
		$pt = min($fmt['police_code'], 0.65 * $utile / (strlen($code) * 0.602 * 0.3528));
		$pt = max(4.0, floor($pt * 10) / 10);
		return array('svg' => $svg2 !== null ? $svg2 : $svg, 'module' => $mm, 'code_pt' => $pt);
	}
}
