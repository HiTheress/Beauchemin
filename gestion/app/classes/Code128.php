<?php
/**
 * Générateur de codes-barres Code 128 (jeu B : ASCII 32 à 126) en SVG, sans dépendance.
 * Les lecteurs de codes-barres usuels (USB/Bluetooth) lisent le Code 128 sans réglage.
 *
 *   Code128::svg('P-0001')                      -> chaîne SVG (largeur de module 2 px, hauteur 60 px)
 *   Code128::svg('P-0001', array('module' => 3, 'hauteur' => 80, 'texte' => false))
 *   Code128::modules('P-0001')                  -> chaîne de 0/1 (une par module), pour les tests
 */
final class Code128
{
	/** Largeurs barre/espace/barre/... des 107 symboles (0..105, puis STOP = 106). */
	private static $MOTIFS = array(
		'212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
		'221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
		'221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
		'212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
		'231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
		'231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
		'314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
		'112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
		'111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
		'214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
		'114131','311141','411131','211412','211214','211232','2331112',
	);

	const START_B = 104;
	const STOP = 106;

	/** Texte valide pour le jeu B : 1 à 40 caractères ASCII imprimables. */
	public static function valide($texte)
	{
		return is_string($texte) && $texte !== '' && strlen($texte) <= 40 && preg_match('/^[\x20-\x7E]+$/D', $texte) === 1;
	}

	public static function valeurs($texte)
	{
		if (!self::valide($texte)) {
			throw new InvalidArgumentException('Texte invalide pour un code-barres Code 128 (ASCII imprimable, 1 à 40 caractères).');
		}
		$v = array(self::START_B);
		$somme = self::START_B;
		for ($i = 0, $n = strlen($texte); $i < $n; $i++) {
			$val = ord($texte[$i]) - 32;
			$v[] = $val;
			$somme += $val * ($i + 1);
		}
		$v[] = $somme % 103;
		$v[] = self::STOP;
		return $v;
	}

	public static function modules($texte)
	{
		$bits = '';
		foreach (self::valeurs($texte) as $val) {
			$bar = true;
			foreach (str_split(self::$MOTIFS[$val]) as $largeur) {
				$bits .= str_repeat($bar ? '1' : '0', (int) $largeur);
				$bar = !$bar;
			}
		}
		return $bits;
	}

	public static function svg($texte, array $o = array())
	{
		$m = isset($o['module']) ? max(1, (int) $o['module']) : 2;
		$h = isset($o['hauteur']) ? max(10, (int) $o['hauteur']) : 60;
		$afficher = !isset($o['texte']) || $o['texte'];
		$marge = 10 * $m; // zone de silence
		$bits = self::modules($texte);
		$larg = strlen($bits) * $m + 2 * $marge;
		$hTexte = $afficher ? 16 : 0;
		$rects = '';
		for ($i = 0, $n = strlen($bits); $i < $n;) {
			if ($bits[$i] === '1') {
				$j = $i;
				while ($j < $n && $bits[$j] === '1') {
					$j++;
				}
				$rects .= '<rect x="' . ($marge + $i * $m) . '" y="0" width="' . (($j - $i) * $m) . '" height="' . $h . '"/>';
				$i = $j;
			} else {
				$i++;
			}
		}
		$t = $afficher
			? '<text x="' . ($larg / 2) . '" y="' . ($h + 13) . '" text-anchor="middle" font-family="monospace" font-size="13">' . htmlspecialchars($texte, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</text>'
			: '';
		return '<svg xmlns="http://www.w3.org/2000/svg" width="' . $larg . '" height="' . ($h + $hTexte) . '" viewBox="0 0 ' . $larg . ' ' . ($h + $hTexte) . '" role="img" aria-label="Code-barres ' . htmlspecialchars($texte, ENT_QUOTES, 'UTF-8') . '">'
			. '<rect width="100%" height="100%" fill="#fff"/><g fill="#000">' . $rects . '</g>' . $t . '</svg>';
	}
}
