<?php
/**
 * Arithmétique décimale exacte avec des entiers (aucun float, aucune extension bcmath).
 *
 *   quantités : échelle 3  (1.500  -> 1500)
 *   coûts     : échelle 4  (12.3456 -> 123456)
 *   montants  : échelle 2  (cents)
 *
 * Les valeurs DECIMAL de MariaDB arrivent de PDO sous forme de chaînes ("12.3400") ;
 * Dec::parse() les convertit sans perte et Dec::fmt() les remet en chaîne à échelle fixe.
 */
final class Dec
{
	const QTE = 3;
	const COUT = 4;
	const TOTAL = 2;

	/**
	 * Convertit "1 234,5", "12.50", 12, 1.5 ... en entier mis à l'échelle $scale.
	 * Arrondit « demi vers le haut » (en valeur absolue) si plus de décimales que $scale.
	 */
	public static function parse($v, $scale, $champ = null)
	{
		if (is_int($v)) {
			$s = (string) $v;
		} elseif (is_float($v)) {
			if (!is_finite($v)) {
				throw new InventaireException('Valeur numérique invalide.', $champ);
			}
			$s = sprintf('%.' . ($scale + 2) . 'F', $v);
		} elseif (is_string($v)) {
			$s = trim(str_replace(array(' ', "\xc2\xa0", ','), array('', '', '.'), $v));
		} else {
			throw new InventaireException('Valeur numérique invalide.', $champ);
		}
		if (!preg_match('/^([+-]?)(\d*)(?:\.(\d*))?$/', $s, $m) || ($m[2] === '' && (!isset($m[3]) || $m[3] === ''))) {
			throw new InventaireException('Valeur numérique invalide.', $champ);
		}
		$neg = ($m[1] === '-');
		$int = ltrim($m[2], '0');
		$frac = isset($m[3]) ? $m[3] : '';
		if (strlen($int) > 12) {
			throw new InventaireException('Valeur numérique trop grande.', $champ);
		}
		$round = 0;
		if (strlen($frac) > $scale) {
			$round = ((int) $frac[$scale] >= 5) ? 1 : 0;
			$frac = substr($frac, 0, $scale);
		}
		$frac = str_pad($frac, $scale, '0');
		$n = (int) ($int . $frac) + $round;
		return $neg ? -$n : $n;
	}

	/** Entier mis à l'échelle -> chaîne à échelle fixe ("-12.340"). */
	public static function fmt($n, $scale)
	{
		$neg = $n < 0;
		$s = (string) abs($n);
		if ($scale > 0) {
			$s = str_pad($s, $scale + 1, '0', STR_PAD_LEFT);
			$s = substr($s, 0, -$scale) . '.' . substr($s, -$scale);
		}
		return ($neg ? '-' : '') . $s;
	}

	/** round(a * b / 10^p), arrondi demi vers le haut en valeur absolue. */
	public static function mulPow($a, $b, $p)
	{
		return self::divRound($a * $b, (int) pow(10, $p));
	}

	/** round(num / den), arrondi demi vers le haut en valeur absolue. den > 0. */
	public static function divRound($num, $den)
	{
		if ($den <= 0) {
			throw new LogicException('Division invalide.');
		}
		$neg = $num < 0;
		$n = abs($num);
		$q = intdiv($n, $den);
		$r = $n - $q * $den;
		if ($r * 2 >= $den) {
			$q++;
		}
		return $neg ? -$q : $q;
	}

	/** Total d'une ligne en cents : quantité (éch. 3) x coût (éch. 4). */
	public static function totalLigne($qte3, $cout4)
	{
		return self::mulPow($qte3, $cout4, self::QTE + self::COUT - self::TOTAL);
	}

	/**
	 * Nouveau coût moyen (éch. 4) après l'entrée de $q unités à $c, sur un stock de $Q unités à $avg.
	 */
	public static function coutMoyenEntree($Q, $avg, $q, $c)
	{
		$den = $Q + $q;
		if ($den <= 0) {
			return $c;
		}
		if ($Q <= 0) {
			return $c;
		}
		return self::divRound($Q * $avg + $q * $c, $den);
	}

	/**
	 * Nouveau coût moyen après le retrait de $q unités valorisées à $c (annulation d'une entrée).
	 * Si plus rien ne reste, on garde le dernier coût connu.
	 */
	public static function coutMoyenRetrait($Q, $avg, $q, $c)
	{
		$den = $Q - $q;
		if ($den <= 0) {
			return $avg;
		}
		$num = $Q * $avg - $q * $c;
		if ($num <= 0) {
			// Le lot retiré coûtait plus que ce que la moyenne actuelle peut « contenir » (d'autres sorties ont eu lieu depuis) :
			// on garde la moyenne actuelle plutôt que de rendre les pièces restantes « sans coût ».
			return $avg;
		}
		return self::divRound($num, $den);
	}
}
