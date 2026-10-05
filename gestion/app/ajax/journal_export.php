<?php
// Export CSV du journal d'activité (administrateur seulement), mêmes filtres que le tableau :
// GET utilisateur_id, action, entite, du, au, q (recherche libre). Du plus récent au plus ancien, 100 000 lignes au plus.
// Format (SPEC §7.8) : UTF-8 avec BOM, séparateur « ; », formules neutralisées, Content-Disposition: attachment.
// Refus : JSON {ok:false, erreur} avec le code HTTP (400 / 403). L'export est lui-même inscrit au journal.
require_once __DIR__ . '/journal_lib.php';
$acteur = Admin::exiger();
const JOURNAL_EXPORT_MAX = 100000;

function jr_cellule($v)
{
	$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $v);
	if ($s !== '' && strpos("=+-@\t\r\n", $s[0]) !== false) {
		$s = "'" . $s;      // neutralise l'injection de formule (Excel / LibreOffice)
	}
	return preg_match('/[;"\r\n]/', $s) ? '"' . str_replace('"', '""', $s) . '"' : $s;
}

try {
	$in = $_GET;
	list($where, $params, $filtres) = JournalFr::filtres($in);
	$recherche = (isset($in['q']) && is_string($in['q'])) ? trim($in['q']) : '';
	if ($recherche !== '') {
		$i = 0;
		foreach (array_slice(preg_split('/\s+/u', $recherche, -1, PREG_SPLIT_NO_EMPTY), 0, 6) as $mot) {
			$ph = ':r' . $i++;      // un seul paramètre par mot (le même nom ne peut pas être répété), sur une expression unique
			$where[] = "CONCAT_WS(' ', j.action, u.nom_utilisateur, j.entite, j.details, j.ip) LIKE " . $ph;
			$params[$ph] = '%' . Inventaire::likeEchapper($mot) . '%';
		}
		$filtres['recherche'] = mb_substr($recherche, 0, 100);
	}
	$from = 'journal j LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id' . ($where ? ' WHERE ' . implode(' AND ', $where) : '');
	$st = $pdo->prepare('SELECT COUNT(*) FROM ' . $from);
	$st->execute($params);
	$n = (int) $st->fetchColumn();
	if ($n > JOURNAL_EXPORT_MAX) {
		throw new InventaireException('Il y a trop de lignes à exporter (' . number_format($n, 0, ',', "\xc2\xa0") . '). Réduisez la période avec les dates « Du » et « Au ».');
	}
	$st = $pdo->prepare('SELECT j.id, j.date_action, COALESCE(u.nom_utilisateur, \'\') AS utilisateur, j.action, j.entite, j.entite_id, j.details, COALESCE(j.ip, \'\') AS ip FROM ' . $from . ' ORDER BY j.id DESC');
	$st->execute($params);
} catch (InventaireException $ex) {
	json_fail($ex->getMessage(), 400);
} catch (Throwable $ex) {
	error_log('journal_export : ' . $ex);
	json_fail('Erreur inattendue. Réessayez ou contactez l\'administrateur.', 500);
}

Journal::ecrire($pdo, $acteur, 'journal.export', 'journal', null, array('lignes' => $n, 'filtres' => $filtres));
while (ob_get_level() > 0) {
	ob_end_clean();
}
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="journal-' . date('Y-m-d') . '.csv"');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
echo "\xEF\xBB\xBF";
echo implode(';', array('Date et heure', 'Utilisateur', 'Action', 'Code de l\'action', 'Élément', 'N° de l\'élément', 'Détails', 'Adresse IP')) . "\r\n";
while ($l = $st->fetch()) {
	echo implode(';', array_map('jr_cellule', array(
		$l['date_action'],
		$l['utilisateur'],
		JournalFr::action($l['action']),
		$l['action'],
		($l['entite'] === null || $l['entite'] === '') ? '' : JournalFr::entite($l['entite']),
		$l['entite_id'] === null ? '' : $l['entite_id'],
		JournalFr::detailsTexte($l['details']),
		$l['ip'],
	))) . "\r\n";
}
