<?php
/**
 * Identité visuelle d'une entreprise sur les documents (écran, impression, PDF) : logo et couleurs, d'après le CODE de l'entreprise.
 * BEA = Beauchemin (vert + cyan, bleu marine pour le texte fort) ; BCH = Boutique Chaleur (rouge + or).
 * Toute autre entreprise, ou un logo absent : pas d'image, le nom de l'entreprise en gros texte, couleurs neutres.
 */
final class Marque
{
	const DEFINITIONS = array(
		'BEA' => array('slug' => 'bea', 'logo' => 'assets/img/logo-beauchemin.png', 'fort' => '#044c92', 'c1' => '#4aa84a', 'c2' => '#2db2d1'),
		'BCH' => array('slug' => 'bch', 'logo' => 'assets/img/logo-boutique-chaleur.png', 'fort' => '#9b1118', 'c1' => '#d0021b', 'c2' => '#c9a24d'),
	);
	const NEUTRE = array('slug' => 'neutre', 'logo' => null, 'fort' => '#1f1e1d', 'c1' => '#b5532f', 'c2' => '#d2cebf');

	/**
	 * @return array{code:string,nom:string,slug:string,fort:string,c1:string,c2:string,logo:?string,chemin:?string}
	 *   logo = chemin relatif à la racine du site (pour <img src>) ; chemin = chemin absolu du fichier (pour le PDF) ; null si le logo est absent.
	 */
	public static function pour($code, $nom = '')
	{
		$k = strtoupper(trim((string) $code));
		$d = isset(self::DEFINITIONS[$k]) ? self::DEFINITIONS[$k] : self::NEUTRE;
		$chemin = null;
		$logo = null;
		if ($d['logo'] !== null) {
			$abs = self::racine() . '/' . $d['logo'];
			if (is_file($abs) && is_readable($abs)) {
				$chemin = $abs;
				$logo = $d['logo'];
			}
		}
		return array(
			'code' => isset(self::DEFINITIONS[$k]) ? $k : '', 'nom' => (string) $nom, 'slug' => $d['slug'],
			'fort' => $d['fort'], 'c1' => $d['c1'], 'c2' => $d['c2'], 'logo' => $logo, 'chemin' => $chemin,
		);
	}

	/** Racine du site (dossier « gestion »). */
	public static function racine()
	{
		return dirname(__DIR__, 2);
	}

	/** « #044c92 » -> array(4, 76, 146) (gris foncé si la valeur est illisible). */
	public static function rgb($hex)
	{
		if (!preg_match('/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i', (string) $hex, $m)) {
			return array(31, 30, 29);
		}
		return array(hexdec($m[1]), hexdec($m[2]), hexdec($m[3]));
	}
}
