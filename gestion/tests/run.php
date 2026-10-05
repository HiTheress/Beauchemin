<?php
require __DIR__ . '/bootstrap.php';
global $pdo, $T_PASS, $T_FAIL;
$inv = new Inventaire($pdo);

// ---- Décor -----------------------------------------------------------------
$h = password_hash('x', PASSWORD_DEFAULT);
$pdo->exec("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES ('adm','$h','admin'),('gA','$h','gestionnaire'),('gB','$h','gestionnaire'),('emp','$h','employe'),('off','$h','gestionnaire')");
$U = array();
foreach (q("SELECT id, nom_utilisateur n FROM utilisateurs") as $r) { $U[$r['n']] = (int) $r['id']; }
$pdo->exec("INSERT INTO utilisateur_entreprises VALUES ({$U['gA']},1),({$U['gB']},2),({$U['emp']},1),({$U['off']},1)");
$pdo->exec("UPDATE utilisateurs SET actif = 0 WHERE id = {$U['off']}");
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type) VALUES (1,'Cube A','cube'),(2,'Boutique B','boutique'),(2,'Dépôt B2','entrepot')");
$E = array('A1' => 1, 'B1' => 2, 'CUBE' => 3, 'BOUT' => 4, 'B2' => 5); // emplacements
$pdo->exec("INSERT INTO fournisseurs (nom) VALUES ('Four 1'),('Four 2')");
$pdo->exec("INSERT INTO pieces (code, nom, unite) VALUES ('T1','Thermocouple','unité'),('T2','Gicleur','unité'),('T3','Tuyau cuivre','m'),('T4','Inactive','unité')");
$pdo->exec("UPDATE pieces SET actif = 0 WHERE code = 'T4'");
$P = array(); foreach (q("SELECT id, code FROM pieces") as $r) { $P[$r['code']] = (int) $r['id']; }
$adm = $U['adm']; $gA = $U['gA']; $gB = $U['gB']; $emp = $U['emp'];
function L($piece, $q, $c = null) { $l = array('piece_id' => $piece, 'quantite' => $q); if ($c !== null) { $l['cout_unitaire'] = $c; } return $l; }

// ---- Code-barres
groupe('Code 128');
egal('11010010000111011101101001101110010011101100100111011001001110110010011100110111011110101100011101011', Code128::modules('P-0001'), 'Code 128 identique à la référence JsBarcode (P-0001)');
ok(!Code128::valide('é') && !Code128::valide('') && Code128::valide('EMP-000001'), 'validation du texte du code-barres');
ok(strpos(Code128::svg('P-0001'), '<svg') === 0, 'SVG généré');

// ---- Réception et coût moyen ---------------------------------------------------
groupe('Réception et coût moyen pondéré');
$r = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 1, 'reference' => 'F-1', 'maj_prix' => true, 'lignes' => array(L($P['T1'], '10', '10.00'), L($P['T2'], '5', '2.50'))));
egal('REC-' . date('Y') . '-00001', $r['numero'], 'premier numéro de réception');
egal('112.50', $r['total'], 'total de la réception');
egal('10.000', stock($P['T1'], $E['A1']), 'stock après réception');
egal('10.0000', cout(1, $P['T1']), 'coût moyen initial');
$inv->recevoir($gA, array('emplacement_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '10', '20.00'))));
egal('15.0000', cout(1, $P['T1']), 'coût moyen pondéré (10@10 + 10@20)');
egal('10.000', stock($P['T1'], $E['CUBE']), 'stock du cube');
egal('10.0000', val('SELECT prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 1', array($P['T1'])), 'prix fournisseur mis à jour par la réception');
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T3'], '2,5', '4,3333'))));
egal('2.500', stock($P['T3'], $E['A1']), 'quantité décimale (virgule acceptée)');
egal('4.3333', cout(1, $P['T3']), 'coût à 4 décimales');
egal('10.83', val('SELECT total FROM documents ORDER BY id DESC LIMIT 1'), 'total arrondi à 2 décimales (2.5 x 4.3333 = 10.83325)');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T4'], '1', '1')))); }, 'désactivée', 'pièce désactivée');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '0', '1')))); }, 'supérieure à zéro', 'quantité zéro');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '-1', '1')))); }, 'supérieure à zéro', 'quantité négative');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '1', '-1')))); }, 'coût', 'coût négatif');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '1')))); }, 'requis', 'coût obligatoire');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], 'abc', '1')))); }, 'invalide', 'quantité non numérique');
refuse(function () use ($inv, $gA, $E, $P) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'date' => '2999-01-01', 'lignes' => array(L($P['T1'], '1', '1')))); }, 'futur', 'date future');
refuse(function () use ($inv, $gA, $E) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array())); }, 'au moins une', 'aucune ligne');
invariants('après réceptions');

// ---- Transferts ----------------------------------------------------------------
groupe('Transferts internes');
$n0 = (int) val('SELECT COUNT(*) FROM mouvements');
$t = $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '3'), L($P['T1'], '2'))));
egal('15.000', stock($P['T1'], $E['CUBE']), 'lignes de la même pièce fusionnées (3 + 2 = 5, cube 10 -> 15)');
egal('5.000', stock($P['T1'], $E['A1']), 'source diminuée');
egal('15.0000', cout(1, $P['T1']), 'le transfert ne change pas le coût moyen');
egal($n0 + 2, (int) val('SELECT COUNT(*) FROM mouvements'), 'deux mouvements par ligne');
refuse(function () use ($inv, $emp, $E, $P) { $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '6')))); }, 'Stock insuffisant', 'transfert trop grand');
egal('5.000', stock($P['T1'], $E['A1']), 'rien n\'a bougé après un refus');
refuse(function () use ($inv, $emp, $E, $P) { $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['A1'], 'lignes' => array(L($P['T1'], '1')))); }, 'différentes', 'même emplacement');
refuse(function () use ($inv, $gA, $E, $P) { $inv->transferer($gA, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1')))); }, 'facture interne', 'transfert entre entreprises');
// un refus au milieu d'un document annule TOUT le document
$av = (int) val('SELECT COUNT(*) FROM documents');
refuse(function () use ($inv, $emp, $E, $P) { $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '1'), L($P['T2'], '999')))); }, 'Stock insuffisant', 'ligne 2 invalide');
egal('5.000', stock($P['T1'], $E['A1']), 'ligne 1 annulée avec la ligne 2 (tout ou rien)');
egal($av, (int) val('SELECT COUNT(*) FROM documents'), 'aucun document créé');
invariants('après transferts');

// ---- Sorties --------------------------------------------------------------------
groupe('Sorties');
$s = $inv->sortir($emp, array('emplacement_id' => $E['CUBE'], 'motif' => 'service', 'reference' => 'BT-1', 'lignes' => array(L($P['T1'], '4'))));
egal('11.000', stock($P['T1'], $E['CUBE']), 'stock du cube après sortie');
ok(!isset($s['total']), 'un employé ne reçoit pas la valeur (total) du document');
egal('60.00', val('SELECT total FROM documents WHERE id = ?', array($s['id'])), 'valeur de la sortie au coût moyen (4 x 15)');
refuse(function () use ($inv, $emp, $E, $P) { $inv->sortir($emp, array('emplacement_id' => $E['CUBE'], 'motif' => 'inconnu', 'lignes' => array(L($P['T1'], '1')))); }, 'motif', 'motif invalide');
refuse(function () use ($inv, $emp, $E, $P) { $inv->sortir($emp, array('emplacement_id' => $E['CUBE'], 'motif' => 'service', 'lignes' => array(L($P['T1'], '11.001')))); }, 'Stock insuffisant', 'sortie de plus que le stock (décimal)');
invariants('après sorties');

// ---- Facture interne ------------------------------------------------------------
groupe('Facture interne au coût');
$f = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'note' => 'Test', 'lignes' => array(L($P['T1'], '2'), L($P['T2'], '3'))));
egal('37.50', $f['total'], 'total au coût (2 x 15 + 3 x 2.50)');
egal('3.000', stock($P['T1'], $E['A1']), 'source diminuée');
egal('2.000', stock($P['T1'], $E['BOUT']), 'destination augmentée');
egal('15.0000', cout(2, $P['T1']), 'la destination reçoit au coût de la source');
$fid = $f['id'];
// la destination a déjà du stock à un autre coût : moyenne pondérée
$inv->recevoir($gB, array('emplacement_id' => $E['B1'], 'lignes' => array(L($P['T2'], '3', '4.00'))));
$f2 = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['B2'], 'lignes' => array(L($P['T2'], '1'))));
egal('2.5000', cout(1, $P['T2']), 'coût de la source inchangé par la vente');
egal('3.1429', cout(2, $P['T2']), 'coût moyen de la destination = ((3@2.50 + 3@4.00)/6 = 3.25 ; puis (6@3.25 + 1@2.50)/7)');
refuse(function () use ($inv, $gA, $E, $P) { $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 1, 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '1')))); }, 'deux entreprises différentes', 'facture vers la même entreprise');
refuse(function () use ($inv, $gA, $E, $P) { $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '100')))); }, 'Stock insuffisant', 'facture de plus que le stock');
refuse(function () use ($inv, $emp, $E, $P) { $inv->factureInterne($emp, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1')))); }, 'permission', 'un employé ne peut pas facturer');
refuse(function () use ($inv, $gB, $E, $P) { $inv->factureInterne($gB, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1')))); }, 'introuvable', 'facturer depuis une entreprise sans accès');
// pièce sans coût connu
$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('T5','Sans coût')"); $T5 = (int) $pdo->lastInsertId();
$inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'correction', 'lignes' => array(L($T5, '5'))));
refuse(function () use ($inv, $gA, $E, $T5) { $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($T5, '1')))); }, 'aucun coût', 'pièce sans coût');
$z = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'permettre_cout_zero' => true, 'lignes' => array(L($T5, '1'))));
egal('0.00', $z['total'], 'facture à 0 $ permise explicitement');
invariants('après factures internes');

// ---- Ajustements -----------------------------------------------------------------
groupe('Ajustements');
$a = $inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'bris', 'lignes' => array(L($P['T3'], '-1'))));
egal('1.500', stock($P['T3'], $E['A1']), 'ajustement négatif');
$inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'correction', 'lignes' => array(L($P['T3'], '1.5', '6.3333'))));
egal('3.000', stock($P['T3'], $E['A1']), 'ajustement positif avec coût');
egal('5.3333', cout(1, $P['T3']), 'le coût de l\'ajustement entre dans la moyenne ((1.5@4.3333 + 1.5@6.3333)/3)');
refuse(function () use ($inv, $emp, $E, $P) { $inv->ajuster($emp, array('emplacement_id' => $E['A1'], 'motif' => 'bris', 'lignes' => array(L($P['T3'], '-1')))); }, 'permission', 'un employé ne peut pas ajuster');
refuse(function () use ($inv, $gA, $E, $P) { $inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'bris', 'lignes' => array(L($P['T3'], '-50')))); }, 'Stock insuffisant', 'ajustement sous zéro');

// ---- Annulations -----------------------------------------------------------------
groupe('Annulations');
$inv->annuler($gA, $fid, 'Erreur de saisie');
egal('5.000', stock($P['T1'], $E['A1']), 'stock source revenu à 5');
egal('0.000', stock($P['T1'], $E['BOUT']), 'destination vidée');
egal('annule', val('SELECT statut FROM documents WHERE id = ?', array($fid)), 'statut annulé');
refuse(function () use ($inv, $gA, $fid) { $inv->annuler($gA, $fid, 'encore'); }, 'déjà annulé', 'double annulation');
refuse(function () use ($inv, $gA, $a) { $inv->annuler($gA, $a['id'], 'x'); }, 'ajustement', 'ajustement non annulable');
refuse(function () use ($inv, $emp, $f2) { $inv->annuler($emp, $f2['id'], 'x'); }, 'permission', 'employé ne peut pas annuler');
refuse(function () use ($inv, $gA, $f2) { $inv->annuler($gA, $f2['id'], ''); }, 'motif', 'motif d\'annulation requis');
// annulation impossible si la destination a déjà sorti la marchandise
$inv->sortir($gB, array('emplacement_id' => $E['B2'], 'motif' => 'service', 'lignes' => array(L($P['T2'], '1'))));
refuse(function () use ($inv, $gA, $f2) { $inv->annuler($gA, $f2['id'], 'trop tard'); }, 'Annulation impossible', 'annulation bloquée (marchandise déjà sortie) : message sans détail de l\'autre entreprise');
refuse(function () use ($inv, $gB, $f2) { $inv->annuler($gB, $f2['id'], 'trop tard'); }, 'accès', 'seule l\'entreprise émettrice peut annuler une facture interne (le destinataire en émet une en sens inverse)');
egal('valide', val('SELECT statut FROM documents WHERE id = ?', array($f2['id'])), 'document resté valide après refus');
// annulation d'une réception : rétablit le coût moyen
$c0 = cout(1, $P['T2']);
$rr = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T2'], '10', '9.00'))));
$inv->annuler($gA, $rr['id'], 'Mauvaise commande');
ok(abs(Dec::parse(cout(1, $P['T2']), 4) - Dec::parse($c0, 4)) <= 5, 'annulation d\'une réception : le coût moyen revient (à 0,0005 près, arrondi) — ' . $c0 . ' / ' . cout(1, $P['T2']));
// annulation d'un transfert et d'une sortie
$tr = $inv->transferer($gA, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '1'))));
$av5 = stock($P['T1'], $E['A1']);
$inv->annuler($gA, $tr['id'], 'Oups');
egal(bcsub_s($av5, '-1'), stock($P['T1'], $E['A1']), 'annulation d\'un transfert');
$so = $inv->sortir($gA, array('emplacement_id' => $E['A1'], 'motif' => 'perte', 'lignes' => array(L($P['T1'], '1'))));
$avS = stock($P['T1'], $E['A1']);
$inv->annuler($gA, $so['id'], 'Pas perdue');
egal(bcsub_s($avS, '-1'), stock($P['T1'], $E['A1']), 'annulation d\'une sortie');
function bcsub_s($a, $b) { return Dec::fmt(Dec::parse($a, 3) - Dec::parse($b, 3), 3); }
invariants('après annulations');

// ---- Comptage -----------------------------------------------------------------------
groupe('Comptage d\'inventaire');
$stA1T1 = stock($P['T1'], $E['A1']);
$cp = $inv->creerComptage($emp, $E['A1'], 'Test');
refuse(function () use ($inv, $emp, $E) { $inv->creerComptage($emp, $E['A1']); }, 'déjà en cours', 'un seul comptage ouvert par emplacement');
$inv->comptageScanner($emp, $cp['id'], $P['T1'], '1', 'ajouter');
$inv->comptageScanner($emp, $cp['id'], $P['T1'], '1', 'ajouter');
$inv->comptageScanner($emp, $cp['id'], $P['T3'], '5', 'fixer');
$det = $inv->comptageDetail($emp, $cp['id']);
egal(2, count($det['lignes']), 'deux pièces comptées');
refuse(function () use ($inv, $emp, $cp) { $inv->comptageAppliquer($emp, $cp['id']); }, 'permission', 'seul un gestionnaire applique');
$res = $inv->comptageAppliquer($gA, $cp['id'], false);
egal('2.000', stock($P['T1'], $E['A1']), 'T1 compté 2 -> stock 2');
egal('5.000', stock($P['T3'], $E['A1']), 'T3 compté 5 -> stock 5');
ok($res['ecarts'] >= 2, 'écarts enregistrés');
ok($res['numero'] !== null && strpos($res['numero'], 'AJU-') === 0, 'document d\'ajustement créé');
refuse(function () use ($inv, $gA, $cp) { $inv->comptageAppliquer($gA, $cp['id']); }, 'terminé', 'comptage déjà appliqué');
$cp2 = $inv->creerComptage($emp, $E['A1']);
$inv->comptageScanner($emp, $cp2['id'], $P['T1'], '2', 'fixer');
$inv->comptageAppliquer($gA, $cp2['id'], true);
egal('0.000', stock($P['T3'], $E['A1']), 'pièces non comptées remises à 0 si demandé');
egal('0.000', stock($T5, $E['A1']), 'T5 aussi remise à 0');
$cp3 = $inv->creerComptage($emp, $E['A1']); $inv->comptageAnnuler($emp, $cp3['id']);
refuse(function () use ($inv, $emp, $cp3, $P) { $inv->comptageScanner($emp, $cp3['id'], $P['T1']); }, 'terminé', 'comptage annulé');
invariants('après comptages');

// ---- Droits et visibilité -----------------------------------------------------------
groupe('Droits, entreprises et masquage des coûts');
refuse(function () use ($inv, $U, $E, $P) { $inv->recevoir($U['emp'], array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '1', '1')))); }, 'permission', 'employé ne reçoit pas');
refuse(function () use ($inv, $gB, $E, $P) { $inv->recevoir($gB, array('emplacement_id' => $E['A1'], 'lignes' => array(L($P['T1'], '1', '1')))); }, 'introuvable', 'gestionnaire B ne reçoit pas chez A');
refuse(function () use ($inv, $U, $E, $P) { $inv->transferer($U['off'], array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '1')))); }, 'désactivé', 'utilisateur désactivé');
refuse(function () use ($inv, $emp, $E, $P) { $inv->transferer($emp, array('emplacement_id' => $E['B1'], 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1')))); }, 'introuvable', 'employé de A ne touche pas B');
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = {$E['B2']}");
refuse(function () use ($inv, $gA, $E, $P) { $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['B2'], 'lignes' => array(L($P['T1'], '1')))); }, 'désactivé', 'emplacement désactivé');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = {$E['B2']}");
$pe = $inv->pieceDetail($emp, $P['T1']);
ok(!isset($pe['prix_fournisseurs']) && !isset($pe['totaux'][0]['cout_moyen']), 'l\'employé ne voit aucun coût');
$pg = $inv->pieceDetail($gA, $P['T1']);
ok(isset($pg['prix_fournisseurs']) && isset($pg['totaux'][0]['cout_moyen']), 'le gestionnaire voit les coûts');
ok(count(array_filter($pe['stock'], function ($s) { return (int) $s['entreprise_id'] !== 1; })) === 0, 'l\'employé ne voit que le stock de son entreprise');
$dm = $inv->document($emp, $fid);
ok($dm['doc']['total'] === null && $dm['lignes'][0]['cout_unitaire'] === null, 'document : coûts masqués pour l\'employé');
ok($inv->document($gB, $fid)['doc']['numero'] !== '', 'le destinataire d\'une facture interne peut la consulter');
refuse(function () use ($inv, $gB, $t) { $inv->document($gB, $t['id']); }, 'accès', 'un transfert interne de A est invisible pour B');

// ---- Codes-barres, recherche, prix -----------------------------------------------------
groupe('Codes-barres, recherche et prix fournisseurs');
$pdo->exec("INSERT INTO pieces_codes (piece_id, code, type) VALUES ({$P['T1']}, '012345678905', 'fabricant')");
$r = $inv->trouverParCode($emp, 'T1');
ok($r && $r['type'] === 'piece' && (int) $r['piece']['id'] === $P['T1'], 'scan du code interne');
$r = $inv->trouverParCode($emp, '012345678905');
ok($r && $r['type'] === 'piece' && (int) $r['piece']['id'] === $P['T1'], 'scan d\'un code-barres fabricant');
$r = $inv->trouverParCode($emp, "  t1\r\n");
ok($r && $r['type'] === 'piece', 'espaces/fin de ligne ignorés, insensible à la casse');
$r = $inv->trouverParCode($emp, 'EMP-000001');
ok($r && $r['type'] === 'emplacement', 'scan du code d\'un emplacement');
egal(null, $inv->trouverParCode($emp, 'INCONNU'), 'code inconnu');
egal(null, $inv->trouverParCode($emp, str_repeat('9', 100)), 'code trop long');
$pdo->exec("UPDATE emplacements SET code_barres = 'EMP-B' WHERE id = {$E['BOUT']}");
egal(null, $inv->trouverParCode($emp, 'EMP-B'), 'emplacement d\'une autre entreprise invisible pour l\'employé');
ok(!$inv->codeDisponible('T1') && !$inv->codeDisponible('012345678905') && !$inv->codeDisponible('EMP-000001') && $inv->codeDisponible('LIBRE-1'), 'unicité des codes (interne, alias, emplacement)');
ok($inv->codeDisponible('T1', $P['T1']), 'une pièce peut garder son propre code');
$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('P%1','Cinquante % pur'),('PX1','Autre')");
egal(1, count($inv->piecesRecherche($emp, '%')), 'le caractère % est cherché littéralement');
egal(0, count($inv->piecesRecherche($emp, 'thermo gicleur')), 'recherche par mots (ET) : deux mots de pièces différentes ne trouvent rien');
egal(1, count($inv->piecesRecherche($emp, 'thermo')), 'recherche par un mot');
ok(count($inv->piecesRecherche($emp, '012345678905')) === 1, 'recherche par alias');
$inv->definirPrixFournisseur($gA, $P['T1'], 2, '11.5', 'X-99');
$inv->definirPrixFournisseur($gA, $P['T1'], 2, '11.5');
$inv->definirPrixFournisseur($gA, $P['T1'], 2, '12.25');
egal(2, (int) val('SELECT COUNT(*) FROM prix_fournisseurs_hist WHERE piece_id = ? AND fournisseur_id = 2', array($P['T1'])), 'historique : seulement les vrais changements de prix');
egal('X-99', val('SELECT no_fournisseur FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 2', array($P['T1'])), 'no fournisseur conservé');
refuse(function () use ($inv, $emp, $P) { $inv->definirPrixFournisseur($emp, $P['T1'], 2, '1'); }, 'permission', 'employé ne modifie pas les prix');

// ---- Valeur, minimums, bilan -------------------------------------------------------------
groupe('Valeur d\'inventaire, minimums et bilan mensuel');
$v = $inv->valeurInventaire($gA);
egal(1, count($v['entreprises']), 'gA ne voit que son entreprise');
$expected = val("SELECT ROUND(SUM(s.quantite * sc.cout_moyen), 2) FROM stock s JOIN emplacements e ON e.id = s.emplacement_id JOIN stock_couts sc ON sc.entreprise_id = e.entreprise_id AND sc.piece_id = s.piece_id WHERE e.entreprise_id = 1");
egal($expected, $v['entreprises'][0]['valeur'], 'valeur = somme(quantité x coût moyen)');
refuse(function () use ($inv, $emp) { $inv->valeurInventaire($emp); }, 'permission', 'employé : pas de valeur d\'inventaire');
$pdo->exec("INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (1, {$P['T1']}, 100)");
$sm = $inv->sousMinimum($emp);
ok(count($sm) === 1 && $sm[0]['code'] === 'T1', 'pièce sous le minimum détectée');
$mois = date('n'); $an = date('Y');
$b = $inv->bilanMensuel($gA, $an, $mois, 1, 2);
egal('2.50', $b['a_vers_b']['total'], 'bilan : total A -> B (factures annulées exclues)');
egal('0.00', $b['b_vers_a']['total'], 'bilan : rien de B -> A');
egal(2, $b['solde']['debiteur'], 'bilan : B doit à A');
egal('2.50', $b['solde']['montant'], 'bilan : montant du solde');
// facture rétroactive le mois précédent
$moisPrec = date('Y-m-d', strtotime('first day of last month'));
$inv->recevoir($gB, array('emplacement_id' => $E['B1'], 'lignes' => array(L($P['T3'], '4', '7.00'))));
$inv->factureInterne($gB, array('emplacement_id' => $E['B1'], 'entreprise_dest_id' => 1, 'emplacement_dest_id' => $E['A1'], 'date' => $moisPrec, 'lignes' => array(L($P['T3'], '2'))));
$bp = $inv->bilanMensuel($gB, (int) date('Y', strtotime($moisPrec)), (int) date('n', strtotime($moisPrec)), 1, 2);
egal('14.00', $bp['b_vers_a']['total'], 'bilan du mois précédent : B -> A = 2 x 7.00');
egal(1, $bp['solde']['debiteur'], 'bilan mois précédent : A doit à B');
egal('7.0000', $bp['b_vers_a']['pieces'][0]['cout_moyen'], 'coût moyen pondéré dans le bilan');
$b2 = $inv->bilanMensuel($gA, $an, $mois, 1, 2);
egal('2.50', $b2['a_vers_b']['total'], 'le bilan du mois courant ignore la facture du mois précédent');
refuse(function () use ($inv, $emp, $an, $mois) { $inv->bilanMensuel($emp, $an, $mois, 1, 2); }, 'permission', 'employé : pas de bilan');
$pdo->exec("INSERT INTO entreprises (id, code, nom) VALUES (9, 'XXX', 'Autre')");
refuse(function () use ($inv, $gA, $an, $mois) { $inv->bilanMensuel($gA, $an, $mois, 1, 1); }, 'invalides', 'même entreprise des deux côtés');
// ---- Corrections issues de la relecture -----------------------------------------------------
groupe('Pièces désactivées, fuites d\'information, prix, formats');
$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('D1','À désactiver')"); $D1 = (int) $pdo->lastInsertId();
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($D1, '10', '3.00'))));
$pdo->exec("UPDATE pieces SET actif = 0 WHERE id = $D1");
$inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($D1, '4'))));
egal('4.000', stock($D1, $E['CUBE']), 'on peut transférer une pièce désactivée (vider son stock)');
$inv->sortir($emp, array('emplacement_id' => $E['CUBE'], 'motif' => 'perte', 'lignes' => array(L($D1, '1'))));
$inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'bris', 'lignes' => array(L($D1, '-1'))));
egal('5.000', stock($D1, $E['A1']), 'ajustement négatif permis sur une pièce désactivée');
refuse(function () use ($inv, $gA, $E, $D1) { $inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'correction', 'lignes' => array(L($D1, '1')))); }, 'désactivée', 'ajustement positif refusé');
refuse(function () use ($inv, $gA, $E, $D1) { $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($D1, '1', '1')))); }, 'désactivée', 'réception refusée');
refuse(function () use ($inv, $gA, $E, $D1) { $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($D1, '1')))); }, 'désactivée', 'facture interne refusée');
$cpD = $inv->creerComptage($emp, $E['A1']);
$inv->comptageScanner($emp, $cpD['id'], $D1, '2', 'fixer');
$dd = $inv->comptageDetail($emp, $cpD['id']);
ok(count(array_filter($dd['lignes'], function ($l) use ($D1) { return (int) $l['piece_id'] === $D1 && (int) $l['actif'] === 0; })) === 1, 'comptage d\'une pièce désactivée possible, avec l\'indicateur « actif »');
$inv->comptageAnnuler($emp, $cpD['id']);

// pas de fuite d'emplacement d'une autre entreprise
refuse(function () use ($inv, $gA, $E, $P) { $inv->transferer($gA, array('emplacement_id' => $E['B1'], 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1')))); }, 'introuvable', 'source d\'une autre entreprise : indistinguable d\'un emplacement inexistant');
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = {$E['BOUT']}");
refuse(function () use ($inv, $emp, $E) { $inv->creerComptage($emp, $E['BOUT']); }, 'introuvable', 'emplacement désactivé d\'une autre entreprise : son nom n\'est pas révélé');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = {$E['BOUT']}");
$lf = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($P['T1'], '1'))));
$dv = $inv->document($gB, $lf['id']);
ok($dv['doc']['emplacement'] === null && $dv['doc']['emplacement_dest'] !== null, 'le destinataire voit son emplacement, pas celui de l\'émetteur');
$dg = $inv->document($gA, $lf['id']);
ok($dg['doc']['emplacement'] !== null && $dg['doc']['emplacement_dest'] === null, 'l\'émetteur voit le sien, pas celui du destinataire');
egal(true, isset($lf['total']), 'le gestionnaire reçoit le total');
$re = $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($P['T1'], '1'))));
ok(!isset($re['total']) && isset($re['numero']), 'transfert par un employé : numéro oui, valeur non');
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = {$E['CUBE']}");
$tr = $inv->trouverParCode($emp, 'EMP-B'); // BOUT (autre entreprise) invisible
egal(null, $tr, 'emplacement d\'une autre entreprise toujours invisible');
$pdo->exec("UPDATE emplacements SET code_barres = 'EMP-CUBE' WHERE id = {$E['CUBE']}");
$tr = $inv->trouverParCode($emp, 'EMP-CUBE');
ok($tr && $tr['emplacement']['actif'] == 0, 'trouverParCode indique si l\'emplacement est désactivé');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = {$E['CUBE']}");

// qui détient un code
$u1 = $inv->codeUtilisePar('T1'); $u2 = $inv->codeUtilisePar('012345678905'); $u3 = $inv->codeUtilisePar('EMP-000001');
ok($u1['type'] === 'piece' && $u2['type'] === 'alias' && $u3['type'] === 'emplacement' && $inv->codeUtilisePar('LIBRE-2') === null, 'codeUtilisePar : pièce, alias, emplacement, libre');
egal(null, $inv->codeUtilisePar('T1', $P['T1']), 'codeUtilisePar : une pièce garde son propre code');

// prix fournisseur : null = inchangé, chaîne vide = effacé ; pièce inconnue
$inv->definirPrixFournisseur($gA, $P['T2'], 1, '5', 'NO-77', null, 'une note');
$inv->definirPrixFournisseur($gA, $P['T2'], 1, '5.5');
egal('NO-77', val('SELECT no_fournisseur FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 1', array($P['T2'])), 'prix : numéro conservé quand il n\'est pas fourni');
egal('une note', val('SELECT note FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 1', array($P['T2'])), 'prix : note conservée quand elle n\'est pas fournie');
$inv->definirPrixFournisseur($gA, $P['T2'], 1, '5.5', '', null, '');
egal(null, val('SELECT no_fournisseur FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 1', array($P['T2'])), 'prix : numéro effacé par une chaîne vide');
egal(null, val('SELECT note FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = 1', array($P['T2'])), 'prix : note effacée par une chaîne vide');
refuse(function () use ($inv, $gA) { $inv->definirPrixFournisseur($gA, 99999, 1, '1'); }, 'Pièce introuvable', 'prix : pièce inconnue');

// bilan : coût moyen pondéré exact (12,5 x 4,85 = 60,625 -> 4,8500 et non 4,8504)
$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('B1','Pièce du bilan')"); $B1 = (int) $pdo->lastInsertId();
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($B1, '12,5', '4,85'))));
$inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'lignes' => array(L($B1, '12,5'))));
$bb = $inv->bilanMensuel($gA, date('Y'), date('n'), 1, 2);
$ligneB1 = array_values(array_filter($bb['a_vers_b']['pieces'], function ($p) use ($B1) { return (int) $p['piece_id'] === $B1; }));
egal('4.8500', $ligneB1[0]['cout_moyen'], 'bilan : coût moyen pondéré exact (somme des q x coût / somme des q)');

// valeur d'inventaire : un emplacement désactivé encore garni reste visible, la somme des lignes = le total
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = {$E['CUBE']}");
$vi = $inv->valeurInventaire($gA);
$somme = 0; foreach ($vi['emplacements'] as $le) { $somme += Dec::parse($le['valeur'], 2); }
egal(Dec::parse($vi['entreprises'][0]['valeur'], 2), $somme, 'valeur d\'inventaire : somme des emplacements = total de l\'entreprise (désactivés garnis inclus)');
ok(count(array_filter($vi['emplacements'], function ($le) use ($E) { return (int) $le['id'] === $E['CUBE'] && (int) $le['actif'] === 0; })) === 1, 'emplacement désactivé garni listé avec actif = 0');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = {$E['CUBE']}");

// verrou global des codes : une 2e connexion ne peut pas l'obtenir pendant que la 1re le tient ; ré-entrant ; relâché ensuite
$pdo2 = new PDO('mysql:host=' . DATABASE_HOST . ';dbname=' . DATABASE_NAME . ';charset=utf8mb4', DATABASE_USER, DATABASE_PASS, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
$nomVerrou = 'bea_codes_' . substr(md5(DATABASE_NAME), 0, 20);
$pendant = null;
$ret = $inv->avecVerrouCodes(function () use ($pdo2, $nomVerrou, &$pendant, $inv) {
	$pendant = (int) $pdo2->query("SELECT GET_LOCK('$nomVerrou', 0)")->fetchColumn();
	return $inv->avecVerrouCodes(function () { return 'imbriqué'; });   // ré-entrant
});
egal(0, $pendant, 'verrou des codes : une autre connexion ne peut pas le prendre pendant l\'opération');
egal('imbriqué', $ret, 'verrou des codes : ré-entrant et valeur de retour transmise');
egal(1, (int) $pdo2->query("SELECT GET_LOCK('$nomVerrou', 0)")->fetchColumn(), 'verrou des codes : relâché après l\'opération');
$pdo2->query("SELECT RELEASE_LOCK('$nomVerrou')");
refuse(function () use ($inv) { $inv->avecVerrouCodes(function () { throw new InventaireException('échec interne'); }); }, 'échec interne', 'une erreur dans le verrou est propagée');
egal(1, (int) $pdo2->query("SELECT GET_LOCK('$nomVerrou', 0)")->fetchColumn(), 'verrou des codes : relâché même après une exception');
$pdo2->query("SELECT RELEASE_LOCK('$nomVerrou')");

// Code128 : un saut de ligne final n'est pas valide ; types non texte refusés par le service
ok(!Code128::valide("ABC\n"), 'Code128 : texte terminé par un saut de ligne refusé');
egal(null, $inv->trouverParCode($gA, array('x')), 'trouverParCode : un tableau n\'est pas un code');
ok(is_array($inv->piecesRecherche($gA, array('x'))), 'piecesRecherche : un tableau comme terme ne plante pas (traité comme une recherche vide)');
ok(is_array($inv->piecesRecherche($gA, "\xff\xfe")), 'piecesRecherche : octets UTF-8 invalides ignorés sans erreur');

// coût moyen jamais remis à zéro par un retrait
egal(10000, Dec::coutMoyenRetrait(10000, 10000, 5000, 30000), 'Dec : un retrait trop « cher » garde la moyenne actuelle (pas de 0)');
egal(10000, Dec::coutMoyenRetrait(20000, 15000, 10000, 20000), 'Dec : retrait normal (20@1,50 moins 10@2,00 = 10@1,00)');

// comptage de plus de MAX_LIGNES écarts : plusieurs ajustements, tout ou rien
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type) VALUES (1,'Gros comptage','entrepot')"); $EG = (int) $pdo->lastInsertId();
$ids = array();
for ($i = 1; $i <= 650; $i++) { $pdo->exec("INSERT INTO pieces (code, nom) VALUES ('GC$i','Gros comptage $i')"); $ids[] = (int) $pdo->lastInsertId(); }
$cg = $inv->creerComptage($gA, $EG);
foreach ($ids as $pid) { $inv->comptageScanner($gA, $cg['id'], $pid, '2', 'fixer'); }
$rg = $inv->comptageAppliquer($gA, $cg['id']);
egal(650, $rg['ecarts'], 'comptage de 650 pièces : 650 écarts');
egal(3, count($rg['documents']), '650 écarts = 3 ajustements (300 + 300 + 50)');
egal('2.000', stock($ids[649], $EG), 'dernière pièce du comptage appliquée');
egal(650, (int) val('SELECT COUNT(*) FROM stock WHERE emplacement_id = ? AND quantite = 2', array($EG)), 'toutes les pièces comptées sont en stock');

// formats d'affichage (espace insécable des milliers, arrondi)
$nbsp = "\xc2\xa0";
egal("1{$nbsp}234{$nbsp}567,50{$nbsp}$", fmt_argent('1234567.5'), 'fmt_argent : milliers avec espace insécable valide en UTF-8');
ok(mb_check_encoding(fmt_argent('98765432.1'), 'UTF-8'), 'fmt_argent : UTF-8 valide');
egal("1{$nbsp}234,57", fmt_nombre('1234.5678', 2), 'fmt_nombre : arrondi (et non troncature)');
egal('1,00', fmt_nombre('0.995', 2), 'fmt_nombre : retenue');
egal('-1,50', fmt_nombre('-1.5', 2), 'fmt_nombre : négatif');
egal('0,00', fmt_nombre('-0.001', 2), 'fmt_nombre : pas de « -0,00 »');
egal('12', fmt_nombre('12.000'), 'fmt_nombre : zéros inutiles retirés');

invariants('fin des scénarios');

echo "\n" . ($T_FAIL === 0 ? "OK" : "ÉCHECS") . " — $T_PASS vérifications réussies, $T_FAIL échec(s)\n";
exit($T_FAIL === 0 ? 0 : 1);
