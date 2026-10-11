<?php
/**
 * Construit le PDF d'un document ou du bilan du mois à partir du modèle de DocumentVue (le même que celui de la page :
 * mêmes textes, mêmes montants, mêmes masques pour les employés). Aucun calcul ici.
 */
require_once __DIR__ . '/PdfDocument.php';

final class DocumentsPdf
{
	/** @param array $m modèle DocumentVue::document() */
	public static function document(array $m)
	{
		$pdf = new PdfDocument(array(
			'marque' => $m['marque'], 'marque_dest' => $m['marque_dest'], 'symbole' => 'fleche',
			'titre' => $m['titre'], 'sous_titre' => 'N° ' . $m['numero'], 'ligne3' => 'Date : ' . $m['date'],
			'statut' => array('texte' => $m['statut'], 'ok' => !$m['annule']),
			'filigrane' => $m['annule'] ? $m['statut'] : null, 'court' => 'N° ' . $m['numero'],
		), $m['libelle'] . ' ' . $m['numero']);

		if ($m['annule']) {
			$pdf->bloc('', DocumentVue::phraseAnnulation($m['annulation']), array(253, 236, 234), array(245, 194, 199), array(88, 21, 28));
		}
		if ($m['parties']) {
			$p = array();
			foreach ($m['parties'] as $x) {
				$p[] = array('etiquette' => $x['etiquette'], 'nom' => $x['nom'], 'detail' => $x['emplacement_libelle'] . ' : ' . ($x['emplacement'] !== null ? $x['emplacement'] : $x['masque']));
			}
			$pdf->parties($p[0], $p[1]);
		}
		if ($m['infos']) {
			$paires = array();
			foreach ($m['infos'] as $x) {
				$paires[] = array($x['libelle'], $x['valeur'], $x['discret']);
			}
			$pdf->paires($paires);
			$pdf->espace(2);
		}

		if ($m['couts']) {
			$cols = array(
				array('titre' => 'Code', 'w' => 27, 'style' => 'B'), array('titre' => 'Pièce', 'w' => 0),
				array('titre' => 'Quantité', 'w' => 27, 'align' => 'R'), array('titre' => 'Coût unitaire', 'w' => 28, 'align' => 'R'), array('titre' => 'Total', 'w' => 30, 'align' => 'R', 'style' => 'B'),
			);
		} else {
			$cols = array(array('titre' => 'Code', 'w' => 30, 'style' => 'B'), array('titre' => 'Pièce', 'w' => 0), array('titre' => 'Quantité', 'w' => 36, 'align' => 'R'));
		}
		$lignes = array();
		foreach ($m['lignes'] as $l) {
			$q = $l['quantite'] . ($l['unite'] !== '' ? "\xc2\xa0" . $l['unite'] : '');
			$lignes[] = $m['couts'] ? array($l['code'], $l['nom'], $q, $l['cout'], $l['total']) : array($l['code'], $l['nom'], $q);
		}
		$pdf->tableau($cols, $lignes, $m['couts'] ? 20 : 0);
		if ($m['couts']) {
			$pdf->boiteTotal('Total', $m['total']);
		}
		if ($m['note'] !== null) {
			$pdf->bloc('Note', $m['note'], array(250, 250, 248), array(226, 224, 214));
		}
		if ($m['signatures']) {
			$pdf->signatures(array('Préparé par — ' . $m['entreprise'], 'Reçu par — ' . $m['entreprise_dest']));
		}
		$pdf->legende('Saisi par ' . $m['saisi_par'] . ' · ' . $m['saisi_le']);
		return $pdf;
	}

	/** @param array $m modèle DocumentVue::bilan() */
	public static function bilan(array $m)
	{
		$pdf = new PdfDocument(array(
			'marque' => $m['marque'], 'marque_dest' => $m['marque_dest'], 'symbole' => 'double',
			'titre' => $m['titre'], 'sous_titre' => $m['periode'], 'ligne3' => $m['paire'],
			'statut' => null, 'filigrane' => null, 'court' => $m['periode'] . ' · ' . $m['paire'],
		), 'Bilan du mois — ' . $m['periode'] . ' — ' . $m['paire']);

		$s = $m['solde'];
		if ($s['nul']) {
			$pdf->soldeBloc('Aucun solde', '', $s['sous']);
		} else {
			$pdf->soldeBloc($s['debiteur'] . ' doit à ' . $s['creancier'], $s['montant'], '');
		}

		foreach ($m['sens'] as $sens) {
			$pdf->titreSens($sens['de'], $sens['vers'], $sens['total']);
			if (!$sens['documents']) {
				$pdf->legende('Aucune facture.');
				continue;
			}
			$pdf->etiquetteSection('Factures');
			$lignes = array();
			foreach ($sens['documents'] as $doc) {
				$ligne = array('cells' => array($doc['numero'], $doc['date'], $doc['de'], $doc['vers'], $doc['total']));
				if ($doc['note'] !== null) {
					$ligne['sous'] = $doc['note'];
				}
				$lignes[] = $ligne;
			}
			$pdf->tableau(array(
				array('titre' => 'Numéro', 'w' => 36, 'style' => 'B'), array('titre' => 'Date', 'w' => 24),
				array('titre' => 'Emplacement source', 'w' => 0), array('titre' => 'Emplacement de destination', 'w' => 46),
				array('titre' => 'Total', 'w' => 28, 'align' => 'R', 'style' => 'B'),
			), $lignes);
			$pdf->etiquetteSection('Pièces');
			$lignes = array();
			foreach ($sens['pieces'] as $p) {
				$lignes[] = array($p['code'], $p['nom'], $p['quantite'] . ($p['unite'] !== '' ? "\xc2\xa0" . $p['unite'] : ''), $p['cout_moyen'], $p['total']);
			}
			$pdf->tableau(array(
				array('titre' => 'Code', 'w' => 27, 'style' => 'B'), array('titre' => 'Pièce', 'w' => 0),
				array('titre' => 'Quantité', 'w' => 27, 'align' => 'R'), array('titre' => 'Coût moyen', 'w' => 28, 'align' => 'R'), array('titre' => 'Total', 'w' => 30, 'align' => 'R', 'style' => 'B'),
			), $lignes, 20);
			$pdf->boiteTotal('Total', $sens['total']);
		}
		return $pdf;
	}
}
