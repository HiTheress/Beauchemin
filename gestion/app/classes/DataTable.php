<?php
/**
 * Réponse « server-side » pour DataTables 1.10 (recherche, tri, pagination) — sans injection SQL :
 * seuls les alias déclarés dans 'colonnes' peuvent servir au tri ; toutes les valeurs sont liées.
 *
 * DataTable::repondre($pdo, array(
 *   'from'      => 'pieces p LEFT JOIN categories c ON c.id = p.categorie_id',   // fixe, jamais issu de l'utilisateur
 *   'colonnes'  => array('id' => 'p.id', 'code' => 'p.code', 'nom' => 'p.nom', 'categorie' => 'c.nom'),   // alias => expression SQL
 *   'recherche' => array('p.code', 'p.nom', 'c.nom'),     // colonnes LIKE ; chaque mot doit être trouvé (ET)
 *   'where'     => array('p.actif = :actif'),             // conditions fixes (AND)
 *   'params'    => array(':actif' => 1),
 *   'group'     => 'p.id',                                // optionnel
 *   'tri_defaut'=> array('nom', 'asc'),
 *   'brut'      => array('actions'),                      // alias dont la valeur est du HTML déjà sûr (sinon tout est échappé)
 *   'formateurs'=> array('actions' => function ($ligne) { return '<a href="...">' . e($ligne['nom']) . '</a>'; }),
 * ));
 * Toute valeur texte est échappée (e()) sauf les alias de 'brut'. Les formateurs reçoivent la ligne NON échappée
 * et DOIVENT échapper eux-mêmes ce qu'ils insèrent. Les nombres décimaux restent des chaînes exactes.
 * La fonction envoie le JSON et termine le script.
 */
class DataTable
{
	public static function repondre(PDO $pdo, array $cfg)
	{
		$req = $_POST + $_GET;
		$colonnes = $cfg['colonnes'];
		$formateurs = isset($cfg['formateurs']) ? $cfg['formateurs'] : array();
		$brut = isset($cfg['brut']) ? $cfg['brut'] : array();
		$params = isset($cfg['params']) ? $cfg['params'] : array();
		$where = isset($cfg['where']) ? $cfg['where'] : array();
		$group = isset($cfg['group']) ? ' GROUP BY ' . $cfg['group'] : '';

		// Tri : alias demandé par le navigateur, accepté seulement s'il est déclaré (et si les types sont ceux attendus)
		list($triAlias, $triSens) = isset($cfg['tri_defaut']) ? $cfg['tri_defaut'] : array(key($colonnes), 'asc');
		$ord = isset($req['order'][0]) && is_array($req['order'][0]) ? $req['order'][0] : array();
		if (isset($ord['column']) && is_scalar($ord['column']) && isset($req['columns'][(int) $ord['column']]['data']) && is_scalar($req['columns'][(int) $ord['column']]['data'])) {
			$alias = (string) $req['columns'][(int) $ord['column']]['data'];
			if (isset($colonnes[$alias])) {
				$triAlias = $alias;
				$triSens = (isset($ord['dir']) && is_string($ord['dir']) && strtolower($ord['dir']) === 'desc') ? 'desc' : 'asc';
			}
		}
		$order = $colonnes[$triAlias] . ' ' . (strtolower($triSens) === 'desc' ? 'DESC' : 'ASC');
		if ($triAlias !== key($colonnes)) {
			$order .= ', ' . reset($colonnes) . ' ASC';
		}

		// Recherche : chaque mot doit apparaître dans au moins une colonne.
		// Un paramètre nommé DISTINCT par mot ET par colonne (PDO natif interdit de répéter un même nom).
		$wRech = array();
		$pRech = array();
		$terme = (isset($req['search']['value']) && is_string($req['search']['value'])) ? trim($req['search']['value']) : '';
		if ($terme !== '' && !mb_check_encoding($terme, 'UTF-8')) {
			$terme = '';   // octets invalides : on ignore la recherche plutôt que de planter
		}
		if ($terme !== '' && !empty($cfg['recherche'])) {
			$mots = preg_split('/\s+/u', $terme, -1, PREG_SPLIT_NO_EMPTY);
			foreach (array_slice($mots === false ? array() : $mots, 0, 6) as $i => $mot) {
				$ou = array();
				foreach (array_values($cfg['recherche']) as $j => $col) {
					$ph = ':__r' . $i . '_' . $j;
					$ou[] = $col . ' LIKE ' . $ph;
					$pRech[$ph] = '%' . Inventaire::likeEchapper($mot) . '%';
				}
				$wRech[] = '(' . implode(' OR ', $ou) . ')';
			}
		}

		$whereSql = $where ? ' WHERE ' . implode(' AND ', $where) : '';
		$whereRechSql = $whereSql . ($wRech ? ($where ? ' AND ' : ' WHERE ') . implode(' AND ', $wRech) : '');

		$compter = function ($w, $p) use ($pdo, $cfg, $group) {
			if ($group) {
				$st = $pdo->prepare('SELECT COUNT(*) FROM (SELECT 1 FROM ' . $cfg['from'] . $w . $group . ') t');
			} else {
				$st = $pdo->prepare('SELECT COUNT(*) FROM ' . $cfg['from'] . $w);
			}
			$st->execute($p);
			return (int) $st->fetchColumn();
		};
		$total = $compter($whereSql, $params);
		$filtre = $wRech ? $compter($whereRechSql, $params + $pRech) : $total;

		$debut = max(0, (isset($req['start']) && is_scalar($req['start'])) ? (int) $req['start'] : 0);
		$long = (isset($req['length']) && is_scalar($req['length'])) ? (int) $req['length'] : 25;
		$long = ($long < 1 || $long > 500) ? 500 : $long;

		$select = array();
		foreach ($colonnes as $alias => $expr) {
			$select[] = $expr . ' AS `' . $alias . '`';
		}
		$st = $pdo->prepare('SELECT ' . implode(', ', $select) . ' FROM ' . $cfg['from'] . $whereRechSql . $group . ' ORDER BY ' . $order . ' LIMIT ' . $long . ' OFFSET ' . $debut);
		$st->execute($params + $pRech);

		$data = array();
		foreach ($st->fetchAll() as $row) {
			$out = array();
			foreach ($row as $k => $v) {
				$out[$k] = (is_string($v) && !in_array($k, $brut, true)) ? e($v) : $v;
			}
			foreach ($formateurs as $k => $fn) {
				$out[$k] = $fn($row);
			}
			$data[] = $out;
		}

		header('Content-Type: application/json; charset=utf-8');
		header('Cache-Control: no-store');
		echo json_encode(array(
			'draw' => (isset($req['draw']) && is_scalar($req['draw'])) ? (int) $req['draw'] : 0,
			'recordsTotal' => $total,
			'recordsFiltered' => $filtre,
			'data' => $data,
		), JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
		exit;
	}
}
