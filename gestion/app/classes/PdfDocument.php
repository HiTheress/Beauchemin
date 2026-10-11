<?php
/**
 * Document PDF A4 (FPDF, polices de base Helvetica) : en-tête avec logos et filet de couleur, pied de page « Page n / N »,
 * filigrane « ANNULÉ », cellules à retour à la ligne, tableaux dont l'en-tête de colonnes se répète à chaque page.
 *
 * Tout le texte est reçu en UTF-8 et converti en Windows-1252 (l'encodage des polices de base) : les caractères que cet
 * encodage ne connaît pas sont remplacés par leur lettre de base (ł -> l) ou par « ? », jamais d'erreur ni de caractère corrompu.
 * Aucun calcul ici : les montants arrivent déjà formatés (fmt_argent, fmt_nombre…).
 */
require_once __DIR__ . '/../lib/fpdf/fpdf.php';
require_once __DIR__ . '/Marque.php';

class PdfDocument extends FPDF
{
	const MARGE = 14;               // marges gauche et droite (mm)
	const LARGEUR = 182;            // largeur utile : 210 - 2 x 14
	const HAUT_COMPLET = 41;        // début du contenu, première page
	const HAUT_COMPACT = 27;        // début du contenu, pages suivantes
	const BAS = 20;                 // zone réservée au pied de page

	const LOGICIEL = "Logiciel de gestion d'inventaire — Beauchemin / Boutique Chaleur";
	const ROUGE = array(189, 33, 48);
	const VERT = array(30, 126, 52);
	const GRIS = array(102, 101, 95);
	const TRAIT = array(210, 206, 191);
	const ZEBRE = array(246, 247, 245);

	/** @var array description de l'en-tête (voir __construct) */
	protected $entete;
	protected $imprimeLe;
	protected $alphas = array();

	/**
	 * @param array $entete marque (Marque::pour), marque_dest (ou null), symbole ('fleche'|'double'), titre, sous_titre, ligne3,
	 *                      statut (array('texte'=>…, 'ok'=>bool) ou null), filigrane (texte ou null), court (titre des pages suivantes)
	 * @param string $titreFichier titre des propriétés du PDF (UTF-8)
	 */
	public function __construct(array $entete, $titreFichier = '')
	{
		parent::__construct('P', 'mm', 'A4');
		$this->entete = $entete + array(
			'marque_dest' => null, 'symbole' => 'fleche', 'titre' => '', 'sous_titre' => '', 'ligne3' => '',
			'statut' => null, 'filigrane' => null, 'court' => '',
		);
		$this->SetMargins(self::MARGE, self::HAUT_COMPACT, self::MARGE);
		$this->SetAutoPageBreak(true, self::BAS);
		$this->cMargin = 0;                 // les marges internes des cellules sont gérées ici
		$this->AliasNbPages('{nb}');
		$this->PDFVersion = '1.4';          // transparence du filigrane
		$this->imprimeLe = date('Y-m-d H:i');
		$this->SetCreator('Logiciel de gestion d\'inventaire', true);
		$this->SetAuthor('Beauchemin / Boutique Chaleur', true);
		if ($titreFichier !== '') {
			$this->SetTitle($titreFichier, true);
		}
		$this->AddPage();
	}

	// ==================================================================================================================
	//  Texte : conversion UTF-8 -> Windows-1252, retours à la ligne
	// ==================================================================================================================

	/** Lettres de base de U+0100 à U+017F (les lettres propres à Windows-1252 sont traitées avant). */
	const BASE_LATIN_A = 'A,a,A,a,A,a,C,c,C,c,C,c,C,c,D,d,D,d,E,e,E,e,E,e,E,e,E,e,G,g,G,g,G,g,G,g,H,h,H,h,I,i,I,i,I,i,I,i,I,i,IJ,ij,J,j,K,k,k,L,l,L,l,L,l,L,l,L,l,N,n,N,n,N,n,n,N,n,O,o,O,o,O,o,OE,oe,R,r,R,r,R,r,S,s,S,s,S,s,S,s,T,t,T,t,T,t,U,u,U,u,U,u,U,u,U,u,U,u,W,w,Y,y,Y,Z,z,Z,z,Z,z,s';

	/** Caractères propres à Windows-1252 (zone 0x80-0x9F) : point de code Unicode => octet. */
	const CP1252 = array(
		0x20AC => 0x80, 0x201A => 0x82, 0x0192 => 0x83, 0x201E => 0x84, 0x2026 => 0x85, 0x2020 => 0x86, 0x2021 => 0x87, 0x02C6 => 0x88,
		0x2030 => 0x89, 0x0160 => 0x8A, 0x2039 => 0x8B, 0x0152 => 0x8C, 0x017D => 0x8E, 0x2018 => 0x91, 0x2019 => 0x92, 0x201C => 0x93,
		0x201D => 0x94, 0x2022 => 0x95, 0x2013 => 0x96, 0x2014 => 0x97, 0x02DC => 0x98, 0x2122 => 0x99, 0x0161 => 0x9A, 0x203A => 0x9B,
		0x0153 => 0x9C, 0x017E => 0x9E, 0x0178 => 0x9F,
	);

	/** Remplacements lisibles pour des caractères courants que Windows-1252 ne connaît pas. */
	const REMPLACEMENTS = array(
		0x202F => "\xA0", 0x2007 => "\xA0", 0x2009 => ' ', 0x2002 => ' ', 0x2003 => ' ', 0x2004 => ' ', 0x2005 => ' ', 0x2006 => ' ', 0x2008 => ' ', 0x200A => ' ',
		0x2010 => '-', 0x2011 => '-', 0x2012 => '-', 0x2015 => "\x97", 0x2212 => '-', 0x2032 => "'", 0x2033 => '"', 0x2044 => '/', 0x2215 => '/',
		0x2190 => '<-', 0x2192 => '->', 0x2194 => '<->', 0x21D2 => '=>', 0x2264 => '<=', 0x2265 => '>=', 0x2260 => '!=', 0x2248 => '~',
		0x25CF => "\x95", 0x25AA => "\x95", 0x2116 => 'No', 0x2713 => 'v', 0x2714 => 'v',
	);

	/** Caractères invisibles ou de composition : retirés (espace de largeur nulle, joiners, BOM, trait d'union conditionnel, accents isolés). */
	private static function invisible($cp)
	{
		return ($cp >= 0x200B && $cp <= 0x200F) || ($cp >= 0x202A && $cp <= 0x202E) || ($cp >= 0x2060 && $cp <= 0x2064)
			|| $cp === 0xFEFF || $cp === 0x00AD || ($cp >= 0x0300 && $cp <= 0x036F) || ($cp >= 0xFE00 && $cp <= 0xFE0F);
	}

	/**
	 * Texte UTF-8 -> octets Windows-1252 pour les polices de base. Sauts de ligne conservés (\n) ; autres caractères de contrôle
	 * retirés (tabulation -> espace) ; lettre inconnue -> lettre de base ; tout le reste (emoji, grec, chinois…) -> « ? ».
	 */
	public static function cp1252($s)
	{
		$s = (string) $s;
		if ($s === '') {
			return '';
		}
		if (!mb_check_encoding($s, 'UTF-8')) {
			$s = mb_convert_encoding($s, 'UTF-8', 'UTF-8');      // octets invalides -> « ? »
		}
		if (class_exists('Normalizer')) {
			$n = Normalizer::normalize($s, Normalizer::FORM_C);   // « e » + accent combiné -> « é » quand l'extension intl est là
			if (is_string($n)) {
				$s = $n;
			}
		}
		$base = null;
		$res = preg_replace_callback('/./us', function ($m) use (&$base) {
			$c = $m[0];
			$cp = mb_ord($c, 'UTF-8');
			if ($cp === 0x0A) {
				return "\n";
			}
			if ($cp === 0x09) {
				return ' ';
			}
			if ($cp < 0x20 || $cp === 0x7F || ($cp >= 0x80 && $cp < 0xA0)) {
				return '';
			}
			if ($cp < 0x80) {
				return $c;
			}
			if (self::invisible($cp)) {
				return '';
			}
			if ($cp >= 0xA0 && $cp <= 0xFF) {
				return chr($cp);
			}
			if (isset(self::CP1252[$cp])) {
				return chr(self::CP1252[$cp]);
			}
			if (isset(self::REMPLACEMENTS[$cp])) {
				return self::REMPLACEMENTS[$cp];
			}
			if ($cp >= 0x100 && $cp <= 0x17F) {
				if ($base === null) {
					$base = explode(',', self::BASE_LATIN_A);
				}
				return $base[$cp - 0x100];
			}
			return '?';
		}, $s);
		return $res === null ? '' : $res;
	}

	/** Largeur (mm) d'un texte UTF-8 dans la police courante. */
	public function largeurTexte($utf8)
	{
		return $this->GetStringWidth(self::cp1252($utf8));
	}

	/** Découpe un texte (déjà en Windows-1252) en lignes de $largeur mm au plus ; un mot trop long est coupé entre deux lettres. Jamais vide. */
	protected function couperLignes($texte, $largeur)
	{
		$res = array();
		foreach (explode("\n", $texte) as $para) {
			$ligne = '';
			foreach (explode(' ', $para) as $mot) {
				if ($mot === '') {
					continue;
				}
				$essai = ($ligne === '') ? $mot : $ligne . ' ' . $mot;
				if ($this->GetStringWidth($essai) <= $largeur) {
					$ligne = $essai;
					continue;
				}
				if ($ligne !== '') {
					$res[] = $ligne;
					$ligne = '';
				}
				while ($this->GetStringWidth($mot) > $largeur && strlen($mot) > 1) {
					$n = 1;
					$long = strlen($mot);
					while ($n < $long - 1 && $this->GetStringWidth(substr($mot, 0, $n + 1)) <= $largeur) {
						$n++;
					}
					$res[] = substr($mot, 0, $n);
					$mot = substr($mot, $n);
				}
				$ligne = $mot;
			}
			$res[] = $ligne;
		}
		return $res;
	}

	/** Lignes d'un texte UTF-8 dans la largeur donnée, avec la police courante. */
	public function lignesDe($utf8, $largeur)
	{
		return $this->couperLignes(self::cp1252($utf8), $largeur);
	}

	/** Texte UTF-8 sur une ligne, au point (x, y du haut de la ligne), hauteur de ligne $h ; alignement L, R ou C dans la largeur $w. */
	public function ecrire($x, $y, $w, $h, $utf8, $align = 'L')
	{
		$t = self::cp1252($utf8);
		$t = str_replace("\n", ' ', $t);
		if ($t === '') {
			return;
		}
		$lt = $this->GetStringWidth($t);
		$dx = ($align === 'R') ? $w - $lt : (($align === 'C') ? ($w - $lt) / 2 : 0);
		$this->Text($x + $dx, $y + $h / 2 + 0.3 * $this->FontSizePt * 25.4 / 72, $t);
	}

	// ==================================================================================================================
	//  Couleurs, formes, transparence
	// ==================================================================================================================

	protected function texteCouleur($c)
	{
		$c = is_string($c) ? Marque::rgb($c) : $c;
		$this->SetTextColor($c[0], $c[1], $c[2]);
	}

	protected function remplirCouleur($c)
	{
		$c = is_string($c) ? Marque::rgb($c) : $c;
		$this->SetFillColor($c[0], $c[1], $c[2]);
	}

	protected function traitCouleur($c)
	{
		$c = is_string($c) ? Marque::rgb($c) : $c;
		$this->SetDrawColor($c[0], $c[1], $c[2]);
	}

	protected function police($style = '', $taille = 9)
	{
		$this->SetFont('Helvetica', $style, $taille);
	}

	protected function _arc($x1, $y1, $x2, $y2, $x3, $y3)
	{
		$h = $this->h;
		$this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c ', $x1 * $this->k, ($h - $y1) * $this->k, $x2 * $this->k, ($h - $y2) * $this->k, $x3 * $this->k, ($h - $y3) * $this->k));
	}

	/** Rectangle à coins arrondis (style : '', 'F' ou 'FD'). */
	public function rectArrondi($x, $y, $w, $h, $r, $style = '')
	{
		$k = $this->k;
		$hp = $this->h;
		$op = ($style === 'F') ? 'f' : (($style === 'FD' || $style === 'DF') ? 'B' : 'S');
		$r = min($r, $w / 2, $h / 2);
		$a = 4 / 3 * (sqrt(2) - 1);
		$this->_out(sprintf('%.2F %.2F m', ($x + $r) * $k, ($hp - $y) * $k));
		$xc = $x + $w - $r;
		$yc = $y + $r;
		$this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - $y) * $k));
		$this->_arc($xc + $r * $a, $yc - $r, $xc + $r, $yc - $r * $a, $xc + $r, $yc);
		$yc = $y + $h - $r;
		$this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - $yc) * $k));
		$this->_arc($xc + $r, $yc + $r * $a, $xc + $r * $a, $yc + $r, $xc, $yc + $r);
		$xc = $x + $r;
		$this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - ($y + $h)) * $k));
		$this->_arc($xc - $r * $a, $yc + $r, $xc - $r, $yc + $r * $a, $xc - $r, $yc);
		$yc = $y + $r;
		$this->_out(sprintf('%.2F %.2F l', $x * $k, ($hp - $yc) * $k));
		$this->_arc($xc - $r, $yc - $r * $a, $xc - $r * $a, $yc - $r, $xc, $yc - $r);
		$this->_out($op);
	}

	/** Flèche pleine, de gauche à droite, centrée verticalement sur $y (mm). $double : pointe aux deux bouts. */
	public function fleche($x1, $x2, $y, $couleur, $double = false)
	{
		$this->traitCouleur($couleur);
		$this->remplirCouleur($couleur);
		$this->SetLineWidth(0.7);
		$a = $double ? $x1 + 2.6 : $x1;
		$this->Line($a, $y, $x2 - 2.4, $y);
		$this->trianglePlein($x2, $y, $x2 - 3.4, $y - 2.1, $x2 - 3.4, $y + 2.1);
		if ($double) {
			$this->trianglePlein($x1, $y, $x1 + 3.4, $y - 2.1, $x1 + 3.4, $y + 2.1);
		}
		$this->SetLineWidth(0.2);
	}

	protected function trianglePlein($x1, $y1, $x2, $y2, $x3, $y3)
	{
		$k = $this->k;
		$h = $this->h;
		$this->_out(sprintf('%.2F %.2F m %.2F %.2F l %.2F %.2F l f', $x1 * $k, ($h - $y1) * $k, $x2 * $k, ($h - $y2) * $k, $x3 * $k, ($h - $y3) * $k));
	}

	/** Transparence des tracés qui suivent (0 à 1) ; à utiliser entre q et Q. */
	protected function transparence($alpha)
	{
		$cle = sprintf('%.3F', $alpha);
		if (!isset($this->alphas[$cle])) {
			$this->alphas[$cle] = array('i' => count($this->alphas) + 1, 'n' => 0);
		}
		$this->_out('/GS' . $this->alphas[$cle]['i'] . ' gs');
	}

	protected function _putresources()
	{
		foreach ($this->alphas as $cle => &$a) {
			$this->_newobj();
			$a['n'] = $this->n;
			$this->_put('<</Type /ExtGState /ca ' . $cle . ' /CA ' . $cle . '>>');
			$this->_put('endobj');
		}
		unset($a);
		parent::_putresources();
	}

	protected function _putresourcedict()
	{
		parent::_putresourcedict();
		$this->_put('/ExtGState <<');
		foreach ($this->alphas as $a) {
			$this->_put('/GS' . $a['i'] . ' ' . $a['n'] . ' 0 R');
		}
		$this->_put('>>');
	}

	/** Filigrane diagonal, translucide, par-dessus le contenu de la page. */
	protected function filigrane($texte)
	{
		$t = self::cp1252($texte);
		$this->police('B', 78);
		$l = $this->GetStringWidth($t);
		$cx = $this->w / 2;
		$cy = $this->h / 2;
		$ang = 38 * M_PI / 180;
		$c = cos($ang);
		$s = sin($ang);
		$ox = $cx * $this->k;
		$oy = ($this->h - $cy) * $this->k;
		$this->_out('q');
		$this->transparence(0.16);
		$this->_out(sprintf('%.5F %.5F %.5F %.5F %.2F %.2F cm', $c, $s, -$s, $c, $ox - $c * $ox + $s * $oy, $oy - $s * $ox - $c * $oy));
		$this->texteCouleur(self::ROUGE);
		$this->traitCouleur(self::ROUGE);
		$this->SetLineWidth(1.6);
		$hauteur = 78 * 25.4 / 72;
		$this->rectArrondi($cx - $l / 2 - 8, $cy - $hauteur * 0.5 - 3, $l + 16, $hauteur * 0.74 + 6, 4, '');
		$this->Text($cx - $l / 2, $cy + $hauteur * 0.24, $t);
		$this->_out('Q');
		$this->SetLineWidth(0.2);
	}

	// ==================================================================================================================
	//  En-tête et pied de page
	// ==================================================================================================================

	/** Logo de l'entreprise dans une boîte (proportions respectées), ou son nom en texte si le logo est absent. Retourne la largeur occupée. */
	public function logo(array $marque, $x, $y, $maxW, $maxH)
	{
		if ($marque['chemin'] !== null) {
			$dim = @getimagesize($marque['chemin']);
			if ($dim && $dim[0] > 0 && $dim[1] > 0) {
				$ratio = $dim[0] / $dim[1];
				$w = $maxW;
				$h = $w / $ratio;
				if ($h > $maxH) {
					$h = $maxH;
					$w = $h * $ratio;
				}
				$this->Image($marque['chemin'], $x, $y + ($maxH - $h) / 2, $w, $h);
				return $w;
			}
		}
		// Pas de logo : le nom en gros caractères, sur une ou deux lignes
		$nom = $marque['nom'] !== '' ? $marque['nom'] : 'Entreprise';
		$this->texteCouleur($marque['fort']);
		for ($taille = 17; $taille >= 8; $taille -= 1) {
			$this->police('B', $taille);
			$lignes = $this->lignesDe($nom, $maxW);
			$lh = $taille * 25.4 / 72 * 1.18;
			if (count($lignes) * $lh <= $maxH) {
				break;
			}
		}
		$total = count($lignes) * $lh;
		$yy = $y + ($maxH - $total) / 2;
		$largeur = 0;
		foreach ($lignes as $l) {
			$this->Text($x, $yy + $lh * 0.78, $l);
			$yy += $lh;
			$largeur = max($largeur, $this->GetStringWidth($l));
		}
		return $largeur;
	}

	/** Filet de couleur de l'entreprise émettrice. */
	protected function filet($y, $h = 1.5)
	{
		$m = $this->entete['marque'];
		$l1 = self::LARGEUR * 0.62;
		$this->remplirCouleur($m['c1']);
		$this->Rect(self::MARGE, $y, $l1, $h, 'F');
		$this->remplirCouleur($m['c2']);
		$this->Rect(self::MARGE + $l1, $y, self::LARGEUR - $l1, $h, 'F');
	}

	public function Header()
	{
		if ($this->PageNo() === 1) {
			$this->enteteComplet();
		} else {
			$this->enteteCompact();
		}
	}

	protected function enteteComplet()
	{
		$e = $this->entete;
		$droite = $this->w - self::MARGE;
		$haut = 11;
		// Logos à gauche : émetteur, flèche, destinataire
		if ($e['marque_dest']) {
			$bw = 43;
			$w1 = $this->logo($e['marque'], self::MARGE, $haut, $bw, 18);
			$xf = self::MARGE + $bw + 2;
			$this->fleche($xf, $xf + 11, $haut + 9, $e['marque']['fort'], $e['symbole'] === 'double');
			$this->logo($e['marque_dest'], $xf + 13, $haut, $bw, 18);
			$gauche = self::MARGE + $bw * 2 + 28;
		} else {
			$this->logo($e['marque'], self::MARGE, $haut, 66, 19);
			$gauche = self::MARGE + 72;
		}
		// Titre, numéro, date, statut à droite
		$largeurTitre = $droite - $gauche;
		$this->texteCouleur($e['marque']['fort']);
		for ($taille = 20; $taille >= 11; $taille -= 0.5) {
			$this->police('B', $taille);
			if ($this->largeurTexte($e['titre']) <= $largeurTitre) {
				break;
			}
		}
		$this->ecrire($gauche, $haut - 1, $largeurTitre, 8.5, $e['titre'], 'R');
		$y = $haut + 8.5;
		if ($e['sous_titre'] !== '') {
			$this->texteCouleur(array(31, 30, 29));
			$this->police('B', 11);
			$this->ecrire($gauche, $y, $largeurTitre, 5.5, $e['sous_titre'], 'R');
			$y += 5.8;
		}
		if ($e['ligne3'] !== '') {
			$this->texteCouleur(self::GRIS);
			$this->police('', 9.5);
			$this->ecrire($gauche, $y, $largeurTitre, 4.8, $e['ligne3'], 'R');
			$y += 5.2;
		}
		if ($e['statut']) {
			$this->police('B', 8.5);
			$wp = $this->largeurTexte($e['statut']['texte']) + 7;
			$this->remplirCouleur($e['statut']['ok'] ? self::VERT : self::ROUGE);
			$this->rectArrondi($droite - $wp, $y + 0.4, $wp, 5.6, 2.8, 'F');
			$this->SetTextColor(255, 255, 255);
			$this->ecrire($droite - $wp, $y + 0.4, $wp, 5.6, $e['statut']['texte'], 'C');
		}
		$this->filet(34);
		$this->SetY(self::HAUT_COMPLET);
		$this->SetX(self::MARGE);
	}

	protected function enteteCompact()
	{
		$e = $this->entete;
		$droite = $this->w - self::MARGE;
		$this->logo($e['marque'], self::MARGE, 8, 34, 9);
		$this->texteCouleur($e['marque']['fort']);
		$this->police('B', 11);
		$this->ecrire($droite - 110, 7.5, 110, 5.5, $e['titre'], 'R');
		$suite = $e['court'] !== '' ? $e['court'] : $e['sous_titre'];
		if ($suite !== '') {
			$this->texteCouleur(self::GRIS);
			$this->police('', 9);
			$this->ecrire($droite - 110, 13.2, 110, 4.5, $suite, 'R');
		}
		$this->filet(20, 1.1);
		$this->SetY(self::HAUT_COMPACT);
		$this->SetX(self::MARGE);
	}

	public function Footer()
	{
		if ($this->entete['filigrane']) {
			$this->filigrane($this->entete['filigrane']);
		}
		$y = $this->h - 12.5;
		$this->traitCouleur(self::TRAIT);
		$this->SetLineWidth(0.2);
		$this->Line(self::MARGE, $y, $this->w - self::MARGE, $y);
		$this->texteCouleur(self::GRIS);
		$this->police('', 7.5);
		$this->ecrire(self::MARGE, $y + 1.4, 112, 4, self::LOGICIEL, 'L');
		// « Page n / N » : N n'est connu qu'à la fin (alias {nb}) ; la largeur est calculée pour un nombre à un chiffre
		$droit = 'Imprimé le ' . $this->imprimeLe . ' · Page ' . $this->PageNo() . ' / ';
		$x = $this->w - self::MARGE - $this->largeurTexte($droit . '9');
		$this->Text($x, $y + 1.4 + 2 + 0.3 * 7.5 * 25.4 / 72, self::cp1252($droit) . '{nb}');
	}

	// ==================================================================================================================
	//  Mise en page du contenu
	// ==================================================================================================================

	/** Place restante (mm) sur la page, avant le pied de page. */
	public function placeRestante()
	{
		return $this->PageBreakTrigger - $this->GetY();
	}

	/** Nouvelle page si moins de $h mm restent. Retourne true si une page a été ajoutée. */
	public function reserver($h)
	{
		if ($this->GetY() + $h > $this->PageBreakTrigger) {
			$this->AddPage();
			return true;
		}
		return false;
	}

	public function espace($h)
	{
		$this->SetY($this->GetY() + $h, false);
	}

	/** Petit titre de section : majuscules grises. */
	public function etiquetteSection($texte)
	{
		$this->reserver(9);
		$this->texteCouleur($this->entete['marque']['fort']);
		$this->police('B', 9.5);
		$y = $this->GetY();
		$this->ecrire(self::MARGE, $y, self::LARGEUR, 5, $texte);
		$this->SetY($y + 6.4, false);
	}

	/**
	 * Grille « libellé / valeur » sur deux colonnes (ou $colonnes). $paires : array(array(libellé, valeur[, discret])), UTF-8.
	 * Les valeurs longues passent à la ligne ; une valeur « discrète » (nom non communiqué) est en gris.
	 */
	public function paires(array $paires, $colonnes = 2)
	{
		if (!$paires) {
			return;
		}
		$gouttiere = 6;
		$w = (self::LARGEUR - $gouttiere * ($colonnes - 1)) / $colonnes;
		$lh = 4.6;
		for ($i = 0; $i < count($paires); $i += $colonnes) {
			$rang = array_slice($paires, $i, $colonnes);
			$this->police('B', 10);
			$hauts = array();
			$cellules = array();
			foreach ($rang as $j => $p) {
				$lignes = $this->lignesDe($p[1], $w);
				$cellules[$j] = $lignes;
				$hauts[$j] = 4 + count($lignes) * $lh;
			}
			$h = max($hauts) + 1.8;
			$this->reserver($h);
			$y = $this->GetY();
			foreach ($rang as $j => $p) {
				$x = self::MARGE + $j * ($w + $gouttiere);
				$this->texteCouleur(self::GRIS);
				$this->police('', 7.8);
				$this->ecrire($x, $y, $w, 3.6, mb_strtoupper($p[0], 'UTF-8'));
				$this->police('B', 10);
				$this->texteCouleur(!empty($p[2]) ? self::GRIS : array(31, 30, 29));
				$yy = $y + 4;
				foreach ($cellules[$j] as $l) {
					$this->Text($x, $yy + $lh * 0.74, $l);
					$yy += $lh;
				}
			}
			$this->SetY($y + $h, false);
		}
	}

	/**
	 * Deux encadrés côte à côte (émetteur, destinataire). Chaque encadré : array('etiquette'=>, 'nom'=>, 'detail'=>) en UTF-8.
	 */
	public function parties(array $a, array $b)
	{
		$gouttiere = 8;
		$w = (self::LARGEUR - $gouttiere) / 2;
		$this->police('B', 12.5);
		$hauts = array();
		$noms = array();
		foreach (array($a, $b) as $i => $p) {
			$this->police('B', 12.5);
			$noms[$i] = $this->lignesDe($p['nom'], $w - 8);
			$this->police('', 9);
			$det[$i] = $this->lignesDe($p['detail'], $w - 8);
			$hauts[$i] = 5.6 + count($noms[$i]) * 5.6 + count($det[$i]) * 4.4 + 4.5;
		}
		$h = max($hauts);
		$this->reserver($h + 2);
		$y = $this->GetY();
		foreach (array($a, $b) as $i => $p) {
			$x = self::MARGE + $i * ($w + $gouttiere);
			$this->traitCouleur(self::TRAIT);
			$this->remplirCouleur(array(250, 250, 248));
			$this->SetLineWidth(0.3);
			$this->rectArrondi($x, $y, $w, $h, 2.5, 'FD');
			$this->remplirCouleur($this->entete[$i === 0 ? 'marque' : 'marque_dest'] ? ($this->entete[$i === 0 ? 'marque' : 'marque_dest']['c1']) : self::TRAIT);
			$this->Rect($x, $y + 2.5, 1.1, $h - 5, 'F');
			$this->texteCouleur(self::GRIS);
			$this->police('B', 7.8);
			$this->ecrire($x + 5, $y + 2.6, $w - 8, 3.6, mb_strtoupper($p['etiquette'], 'UTF-8'));
			$yy = $y + 7.2;
			$this->texteCouleur($this->entete[$i === 0 ? 'marque' : 'marque_dest'] ? $this->entete[$i === 0 ? 'marque' : 'marque_dest']['fort'] : array(31, 30, 29));
			$this->police('B', 12.5);
			foreach ($noms[$i] as $l) {
				$this->Text($x + 5, $yy + 4.2, $l);
				$yy += 5.6;
			}
			$this->texteCouleur(array(60, 60, 56));
			$this->police('', 9);
			foreach ($det[$i] as $l) {
				$this->Text($x + 5, $yy + 3.4, $l);
				$yy += 4.4;
			}
		}
		$this->SetLineWidth(0.2);
		$this->SetY($y + $h + 4, false);
	}

	/** Encadré de texte (note, bandeau « annulé ») : fond $fond, bordure $bordure, titre en gras puis texte. */
	public function bloc($titre, $texte, $fond, $bordure, $couleurTexte = array(31, 30, 29))
	{
		$w = self::LARGEUR;
		$this->police('', 9.5);
		$lignes = $this->lignesDe($texte, $w - 10);
		$lh = 4.6;
		$hauteurMax = $this->PageBreakTrigger - self::HAUT_COMPACT - 6;
		$h = 5 + ($titre !== '' ? 5.6 : 0) + count($lignes) * $lh;
		if ($h > $hauteurMax) {                 // texte extrêmement long : coupé pour tenir sur une page
			$nb = (int) floor(($hauteurMax - 5 - ($titre !== '' ? 5.6 : 0)) / $lh);
			$lignes = array_slice($lignes, 0, max(1, $nb));
			$h = $hauteurMax;
		}
		$this->reserver($h + 2);
		$y = $this->GetY();
		$this->remplirCouleur($fond);
		$this->traitCouleur($bordure);
		$this->SetLineWidth(0.3);
		$this->rectArrondi(self::MARGE, $y, $w, $h, 2.5, 'FD');
		$this->SetLineWidth(0.2);
		$yy = $y + 2.8;
		$this->texteCouleur($couleurTexte);
		if ($titre !== '') {
			$this->police('B', 9.5);
			$this->ecrire(self::MARGE + 5, $yy, $w - 10, 4.6, $titre);
			$yy += 5.6;
		}
		$this->police('', 9.5);
		foreach ($lignes as $l) {
			$this->Text(self::MARGE + 5, $yy + $lh * 0.74, $l);
			$yy += $lh;
		}
		$this->SetY($y + $h + 4, false);
	}

	/** Total encadré, aligné à droite : « Total   1 234,56 $ ». */
	public function boiteTotal($libelle, $montant, $largeur = 78)
	{
		$h = 12;
		$this->reserver($h + 2);
		$y = $this->GetY() + 1.5;
		$x = $this->w - self::MARGE - $largeur;
		$m = $this->entete['marque'];
		$this->remplirCouleur(array(247, 249, 248));
		$this->traitCouleur($m['fort']);
		$this->SetLineWidth(0.5);
		$this->rectArrondi($x, $y, $largeur, $h, 2.5, 'FD');
		$this->SetLineWidth(0.2);
		$this->texteCouleur(self::GRIS);
		$this->police('B', 9);
		$this->ecrire($x + 5, $y, $largeur / 2, $h, mb_strtoupper($libelle, 'UTF-8'));
		$this->texteCouleur($m['fort']);
		$this->police('B', 14);
		$this->ecrire($x + 5, $y, $largeur - 10, $h, $montant, 'R');
		$this->SetY($y + $h + 4, false);
	}

	/** Zones de signature : un trait et une légende sous chaque trait. */
	public function signatures(array $legendes)
	{
		$n = count($legendes);
		$gouttiere = 16;
		$w = (self::LARGEUR - $gouttiere * ($n - 1)) / $n;
		$this->espace(7);
		$this->reserver(24);
		$y = $this->GetY() + 14;
		$this->traitCouleur(array(52, 58, 64));
		$this->SetLineWidth(0.3);
		$this->texteCouleur(array(60, 60, 56));
		$this->police('', 8.5);
		foreach (array_values($legendes) as $i => $l) {
			$x = self::MARGE + $i * ($w + $gouttiere);
			$this->Line($x, $y, $x + $w, $y);
			$this->ecrire($x, $y + 1.2, $w, 4.5, $l);
		}
		$this->SetLineWidth(0.2);
		$this->SetY($y + 8, false);
	}

	/**
	 * Tableau. $cols : array(array('titre'=>, 'w'=>mm (0 = le reste), 'align'=>'L'|'R'|'C', 'style'=>''|'B')).
	 * $lignes : array de cellules (UTF-8), ou array('cells'=>[…], 'sous'=>texte gris sous la ligne). L'en-tête des colonnes se répète à chaque page ;
	 * une ligne n'est jamais coupée entre deux pages ; $reserve = hauteur à garder sous la dernière ligne (le total ne reste pas seul sur une page).
	 */
	public function tableau(array $cols, array $lignes, $reserve = 0)
	{
		$m = $this->entete['marque'];
		$taille = 8.8;
		$lh = 4.3;
		$px = 1.8;
		$py = 1.7;
		// Largeurs : la colonne « 0 » prend le reste
		$fixe = 0;
		$libre = null;
		foreach ($cols as $i => $c) {
			if ((float) $c['w'] > 0) {
				$fixe += $c['w'];
			} else {
				$libre = $i;
			}
		}
		if ($libre !== null) {
			$cols[$libre]['w'] = max(20, self::LARGEUR - $fixe);
		}
		// En-tête de colonnes (se répète)
		$enteteTableau = function () use ($cols, $m, $px) {
			$h = 7;
			$y = $this->GetY();
			$this->remplirCouleur($m['fort']);
			$this->Rect(self::MARGE, $y, self::LARGEUR, $h, 'F');
			$this->SetTextColor(255, 255, 255);
			$this->police('B', 8.3);
			$x = self::MARGE;
			foreach ($cols as $c) {
				$this->ecrire($x + $px, $y, $c['w'] - 2 * $px, $h, $c['titre'], isset($c['align']) ? $c['align'] : 'L');
				$x += $c['w'];
			}
			$this->SetY($y + $h, false);
		};
		$n = count($lignes);
		if ($n === 0) {
			return;
		}
		$premier = true;
		foreach ($lignes as $idx => $ligne) {
			$cells = isset($ligne['cells']) ? $ligne['cells'] : $ligne;
			$sous = isset($ligne['sous']) ? (string) $ligne['sous'] : '';
			// Hauteur de la ligne : le plus grand nombre de lignes de texte parmi les cellules
			$this->police('', $taille);
			$decoupe = array();
			$nl = 1;
			foreach ($cols as $i => $c) {
				$style = isset($c['style']) ? $c['style'] : '';
				$this->police($style, $taille);
				$decoupe[$i] = $this->lignesDe(isset($cells[$i]) ? $cells[$i] : '', $c['w'] - 2 * $px);
				$nl = max($nl, count($decoupe[$i]));
			}
			$lignesSous = array();
			if ($sous !== '') {
				$this->police('', 7.8);
				$lignesSous = $this->lignesDe($sous, self::LARGEUR - 2 * $px - 6);
			}
			$h = $py * 2 + $nl * $lh + count($lignesSous) * 3.6;
			$besoin = $h + ($premier ? 7 : 0) + (($idx === $n - 1) ? $reserve : 0);
			if ($this->GetY() + $besoin > $this->PageBreakTrigger) {
				$this->AddPage();
				$premier = true;
			}
			if ($premier) {
				$enteteTableau();
				$premier = false;
			}
			$y = $this->GetY();
			if ($idx % 2 === 1) {
				$this->remplirCouleur(self::ZEBRE);
				$this->Rect(self::MARGE, $y, self::LARGEUR, $h, 'F');
			}
			$x = self::MARGE;
			$this->texteCouleur(array(31, 30, 29));
			foreach ($cols as $i => $c) {
				$this->police(isset($c['style']) ? $c['style'] : '', $taille);
				$al = isset($c['align']) ? $c['align'] : 'L';
				$yy = $y + $py;
				foreach ($decoupe[$i] as $l) {
					$lt = $this->GetStringWidth($l);
					$dx = ($al === 'R') ? $c['w'] - 2 * $px - $lt : (($al === 'C') ? ($c['w'] - 2 * $px - $lt) / 2 : 0);
					$this->Text($x + $px + $dx, $yy + $lh * 0.74, $l);
					$yy += $lh;
				}
				$x += $c['w'];
			}
			if ($lignesSous) {
				$this->texteCouleur(self::GRIS);
				$this->police('', 7.8);
				$yy = $y + $py + $nl * $lh - 0.4;
				foreach ($lignesSous as $l) {
					$this->Text(self::MARGE + $px + 3, $yy + 2.7, $l);
					$yy += 3.6;
				}
			}
			$this->traitCouleur(array(226, 229, 226));
			$this->SetLineWidth(0.15);
			$this->Line(self::MARGE, $y + $h, self::MARGE + self::LARGEUR, $y + $h);
			$this->SetLineWidth(0.2);
			$this->SetY($y + $h, false);
		}
		$this->espace(2);
	}

	// ==================================================================================================================
	//  Sortie
	// ==================================================================================================================

	/** Le document PDF complet, en chaîne binaire. */
	public function contenu()
	{
		return $this->Output('S');
	}

	/** Nom de fichier sûr (lettres, chiffres, point, tiret, soulignement) avec l'extension .pdf. */
	public static function nomFichier($base)
	{
		$n = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) $base);
		$n = trim($n, '._');
		return ($n === '' ? 'document' : substr($n, 0, 80)) . '.pdf';
	}

	/**
	 * Envoie le PDF comme téléchargement et termine le script. En-têtes : application/pdf, attachment (nom assaini),
	 * nosniff, Cache-Control: private, no-store. Aucune donnée de l'utilisateur dans les en-têtes sans assainissement.
	 */
	public static function envoyer($contenu, $nomBase)
	{
		while (ob_get_level() > 0) {
			ob_end_clean();
		}
		header('Content-Type: application/pdf');
		header('Content-Disposition: attachment; filename="' . self::nomFichier($nomBase) . '"');
		header('Content-Length: ' . strlen($contenu));
		header('X-Content-Type-Options: nosniff');
		header('Cache-Control: private, no-store');
		echo $contenu;
		exit;
	}
}
