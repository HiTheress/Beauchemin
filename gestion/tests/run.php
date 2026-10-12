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

// ---- prix fournisseur lié à la réception : l'annulation remet le prix précédent --------------------------------------
function prixF($piece, $four) { $v = val('SELECT prix FROM prix_fournisseurs WHERE piece_id = ? AND fournisseur_id = ?', array($piece, $four)); return $v === false ? null : $v; }
$inv->definirPrixFournisseur($gA, $P['T3'], 2, '4.00');
$rp = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 2, 'maj_prix' => true, 'lignes' => array(L($P['T3'], '1', '9.00'))));
egal('9.0000', prixF($P['T3'], 2), 'réception avec mise à jour des prix : le prix du fournisseur change');
$inv->annuler($gA, $rp['id'], 'erreur de frappe');
egal('4.0000', prixF($P['T3'], 2), 'annulation de la réception : le prix précédent revient');
// fournisseur sans prix : la réception en crée un, l'annulation le retire
$rp2 = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 1, 'maj_prix' => true, 'lignes' => array(L($P['T3'], '1', '5.50'))));
egal('5.5000', prixF($P['T3'], 1), 'réception : prix créé chez un fournisseur qui n\'en avait pas');
$inv->annuler($gA, $rp2['id'], 'doublon');
egal(null, prixF($P['T3'], 1), 'annulation : le prix créé par la réception est retiré');
// le prix a été changé par quelqu'un d'autre entre-temps : on n'y touche pas
$rp3 = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 2, 'maj_prix' => true, 'lignes' => array(L($P['T3'], '1', '7.00'))));
$inv->definirPrixFournisseur($gA, $P['T3'], 2, '6.25');
$inv->annuler($gA, $rp3['id'], 'erreur');
egal('6.2500', prixF($P['T3'], 2), 'annulation : un prix modifié depuis par quelqu\'un d\'autre est conservé');
// réception sans mise à jour des prix : l'annulation ne touche à aucun prix
$rp4 = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 2, 'lignes' => array(L($P['T3'], '1', '99.00'))));
$inv->annuler($gA, $rp4['id'], 'erreur');
egal('6.2500', prixF($P['T3'], 2), 'réception sans maj_prix : prix inchangé après annulation');

// ---- sessions : un changement de mot de passe coupe les autres sessions ---------------------------------------------------
$_SESSION = array('user_id' => $gA, 'auth_v' => (int) val('SELECT mdp_version FROM utilisateurs WHERE id = ?', array($gA)));
$ouA = new User($pdo);
ok($ouA->courant() !== null, 'session valide au départ');
$ancienneSession = $_SESSION;
$_SESSION = array('user_id' => $gA, 'auth_v' => $ancienneSession['auth_v']);          // « l'autre onglet » change le mot de passe
$ouB = new User($pdo); $ouB->courant();
$ouB->invaliderSessions($gA, true);
ok($ouB->courant() !== null && $_SESSION['auth_v'] !== $ancienneSession['auth_v'], 'la session qui change son mot de passe reste valable');
$_SESSION = $ancienneSession;
$ouC = new User($pdo);
egal(null, $ouC->courant(), 'l\'ancienne session de ce compte est invalidée');
ok(!isset($_SESSION['user_id']), 'la session invalidée est vidée');
$_SESSION = array('user_id' => $gA);   // session sans version (ancienne) : refusée
egal(null, (new User($pdo))->courant(), 'session sans version : refusée');
$_SESSION = array();

// ---- entreprise désactivée : son historique reste lisible, mais plus rien ne s'y écrit ------------------------------------
$docB = (int) val("SELECT id FROM documents WHERE entreprise_id = 2 OR entreprise_dest_id = 2 ORDER BY id DESC LIMIT 1");
$pdo->exec("UPDATE entreprises SET actif = 0 WHERE id = 2");
ok($inv->document($gB, $docB)['doc']['numero'] !== '', 'entreprise désactivée : un de ses utilisateurs lit encore ses documents');
ok($inv->document($adm, $docB)['doc']['numero'] !== '', 'entreprise désactivée : l\'administrateur lit encore ses documents');
egal(array(), $inv->utilisateur($gB)['entreprises'], 'entreprise désactivée : plus d\'entreprise « active » pour ses utilisateurs');
ok(in_array(2, $inv->utilisateur($gB)['consultables'], true), 'entreprise désactivée : elle reste consultable');
refuse(function () use ($inv, $gB, $E, $P) { $inv->sortir($gB, array('emplacement_id' => $E['BOUT'], 'motif' => 'service', 'lignes' => array(L($P['T1'], '1')))); }, 'introuvable', 'entreprise désactivée : aucune écriture (emplacement introuvable pour ses utilisateurs)');
refuse(function () use ($inv, $adm, $E, $P) { $inv->sortir($adm, array('emplacement_id' => $E['BOUT'], 'motif' => 'service', 'lignes' => array(L($P['T1'], '1')))); }, 'introuvable', 'entreprise désactivée : aucune écriture, même pour l\'administrateur');
ok(count($inv->valeurInventaire($adm)['entreprises']) >= 2, 'entreprise désactivée : encore dans la valeur d\'inventaire de l\'administrateur');
$pdo->exec("UPDATE entreprises SET actif = 1 WHERE id = 2");
// recherche de pièces : désactivées seulement sur demande
$pdo->exec("INSERT INTO pieces (code, nom, actif) VALUES ('INACT9','Pièce rangée',0)");
egal(0, count($inv->piecesRecherche($gA, 'INACT9')), 'piecesRecherche : une pièce désactivée n\'est pas proposée par défaut');
egal(1, count($inv->piecesRecherche($gA, 'INACT9', 20, true)), 'piecesRecherche : ... mais l\'est quand on la demande (historique)');

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

// ---- PDF : conversion du texte, un document de chaque type, employé sans montant, document long, bilan ---------------------------
groupe('PDF des documents et du bilan');
require_once __DIR__ . '/../app/classes/DocumentVue.php';
require_once __DIR__ . '/../app/classes/DocumentsPdf.php';
/** Utilisateur « connecté » (même chemin que les pages : session, rôle, entreprises). */
function user_pour($id) { global $pdo; $_SESSION = array('user_id' => $id, 'auth_v' => (int) val('SELECT mdp_version FROM utilisateurs WHERE id = ?', array($id))); return new User($pdo); }
/** Textes (octets Windows-1252, non compressés) des instructions « (texte) Tj » d'un PDF dont la compression est coupée. */
function pdf_textes($bin) {
	preg_match_all('/\(((?:[^()\\\\]|\\\\.)*)\)\s*Tj/s', $bin, $m);
	return array_map(function ($t) { return stripslashes($t); }, $m[1]);
}
function pdf_pages($bin) { return preg_match_all('/\/Type \/Page(?!s)/', $bin); }
/** « Page n / N » extrait des pieds de page (« Imprimé le … · Page n / N »). */
function pdf_pieds($textes) { return array_map(function ($t) { return preg_replace('/^.*\xB7 /s', '', $t); }, $textes); }
function cp($s) { return PdfDocument::cp1252($s); }
/** PDF d'un document pour un utilisateur, sans compression ; retourne array(binaire, textes, modèle). */
function pdf_document($inv, $uid, $docId, $masque = 'Autre entreprise') {
	global $pdo;
	$u = user_pour($uid);
	$m = DocumentVue::document($pdo, $u, $inv->document($uid, $docId), array('masque' => $masque));
	$pdf = DocumentsPdf::document($m);
	$pdf->SetCompression(false);
	$bin = $pdf->contenu();
	return array($bin, pdf_textes($bin), $m);
}
$nbsp = "\xc2\xa0";

// conversion UTF-8 -> Windows-1252 (accents, œ, tirets, guillemets, espaces insécables) avec repli sûr
egal("\xE9\xE8\xE0\xE7\xEA\xF4 \xC9\xC0\xCA", PdfDocument::cp1252('éèàçêô ÉÀÊ'), 'cp1252 : lettres accentuées');
egal("\x9C\x8C \x97 \x96 \x92 \x93\x94 \xAB\xA0\xBB \x80 \x95", PdfDocument::cp1252("œŒ — – ’ “” «{$nbsp}» € •"), 'cp1252 : œ, tirets, apostrophe courbe, guillemets, espace insécable, euro, puce');
egal("a\xA0b c", PdfDocument::cp1252("a\u{202F}b\u{2009}c"), 'cp1252 : espace fine insécable -> espace insécable, espace fine -> espace');
egal('Lodz l a c e n s z z', PdfDocument::cp1252('Łodz ł ą ć ę ń ś ź ż'), 'cp1252 : lettres hors Windows-1252 -> lettre de base');
egal('a?b?c?', PdfDocument::cp1252("a😀b中c\u{0394}"), 'cp1252 : emoji, chinois, grec -> « ? » (un seul par caractère)');
egal('a->b <= c', PdfDocument::cp1252("a→b ≤ c"), 'cp1252 : flèche et inférieur ou égal en ASCII');
egal("ab cd\nef", PdfDocument::cp1252("a\x01b\tcd\r\nef\x7F"), 'cp1252 : caractères de contrôle retirés, tabulation -> espace, saut de ligne gardé');
egal('a?b', PdfDocument::cp1252("a\xFFb"), 'cp1252 : octet UTF-8 invalide -> « ? », jamais d\'erreur');
egal('', PdfDocument::cp1252(''), 'cp1252 : texte vide');
egal('ab', PdfDocument::cp1252("a\u{200B}\u{FEFF}b"), 'cp1252 : espace de largeur nulle et BOM retirés');
// nom de fichier : jamais de retour de ligne, de guillemet ni de barre dans l'en-tête Content-Disposition
egal('REC-2026-00001.pdf', PdfDocument::nomFichier('REC-2026-00001'), 'nom de fichier : numéro de document');
ok(preg_match('/^[A-Za-z0-9._-]+\.pdf$/', PdfDocument::nomFichier("a\r\nSet-Cookie: x=1\"/../é")) === 1, 'nom de fichier : assaini (aucun CR, LF, guillemet ni barre)');
egal('document.pdf', PdfDocument::nomFichier("\r\n/"), 'nom de fichier : jamais vide');

// un document de chaque type, vu par un gestionnaire
$pdo->exec("INSERT INTO pieces (code, nom, unite) VALUES ('PDF-A', 'Thermocouple à gaz — 1/2 po « œil » 3 µm ’test’', 'unité'), ('PDF-L', 'Tuyau', 'm')");
$pa = (int) val("SELECT id FROM pieces WHERE code = 'PDF-A'"); $pl = (int) val("SELECT id FROM pieces WHERE code = 'PDF-L'");
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($pa, '40', '3.10'), L($pl, '12.5', '2.3333'))));
$r1 = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'fournisseur_id' => 1, 'reference' => 'FAC-é-1', 'note' => "Ligne 1\nLigne 2 — œuvre 😀 中", 'lignes' => array(L($pa, '4', '3.10'), L($pl, '2.5', '2.3333'))));
$t1 = $inv->transferer($gA, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($pa, '2'))));
$s1 = $inv->sortir($gA, array('emplacement_id' => $E['A1'], 'motif' => 'service', 'reference' => 'BT-é', 'lignes' => array(L($pa, '1'))));
$a1 = $inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'comptage', 'lignes' => array(L($pa, '3'), L($pl, '-1'))));
$f1 = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['BOUT'], 'note' => 'Pièces pour la boutique', 'lignes' => array(L($pa, '2'), L($pl, '1.5'))));
$titres = array($r1['id'] => 'R' . "\xC9" . 'CEPTION', $t1['id'] => 'D' . "\xC9" . 'PLACEMENT', $s1['id'] => 'UTILISATION', $a1['id'] => 'CORRECTION DU STOCK', $f1['id'] => 'FACTURE INTERNE');
$numeros = array($r1['id'] => $r1['numero'], $t1['id'] => $t1['numero'], $s1['id'] => $s1['numero'], $a1['id'] => $a1['numero'], $f1['id'] => $f1['numero']);
foreach ($titres as $id => $titre) {
	list($bin, $textes, $m) = pdf_document($inv, $gA, $id, $id == $f1['id'] ? 'non communiqué' : 'Autre entreprise');
	$n = $numeros[$id];
	ok(strpos($bin, '%PDF-') === 0, "PDF $n : commence par %PDF-");
	ok(substr(rtrim($bin), -5) === '%%EOF', "PDF $n : se termine par %%EOF");
	egal(1, pdf_pages($bin), "PDF $n : une page");
	ok(in_array(cp('N° ' . $n), $textes, true), "PDF $n : le numéro du document (« N° … ») est dans le texte");
	ok(in_array($titre, $textes, true), "PDF $n : titre « $titre » dans l'en-tête");
	ok(in_array('Page 1 / 1', pdf_pieds($textes), true), "PDF $n : « Page 1 / 1 » dans le pied de page");
	ok(in_array("Logiciel de gestion d'inventaire \x97 Beauchemin / Boutique Chaleur", $textes, true), "PDF $n : mention du logiciel dans le pied de page");
	ok(in_array('Code', $textes, true) && in_array('Total', $textes, true) && in_array('Co' . "\xFB" . 't unitaire', $textes, true), "PDF $n : colonnes de coût pour un gestionnaire");
	ok(in_array(PdfDocument::cp1252(fmt_argent($m['total'] === null ? '0' : $inv->document($gA, $id)['doc']['total'])), $textes, true), "PDF $n : total du document (même texte que la page)");
	ok(strpos(implode(' ', $textes), "Thermocouple \xE0 gaz \x97 1/2 po \xAB \x9Cil \xBB 3 \xB5m \x92test\x92") !== false, "PDF $n : nom de pièce avec accents, œ, tiret long, guillemets, µ et apostrophes courbes");
	ok(!in_array('?', $textes, true) && strpos(implode('', $textes), "\xEF\xBF\xBD") === false, "PDF $n : aucun caractère corrompu");
}
list($bin, $textes) = pdf_document($inv, $gA, $r1['id']);
$plat = implode("\n", $textes);
ok(strpos($plat, 'Ligne 2 ' . "\x97" . ' ' . "\x9C" . 'uvre ? ?') !== false, 'PDF : note avec emoji et chinois -> « ? » (aucune erreur)');
ok(strpos($plat, "FAC-\xE9-1") !== false && strpos($plat, 'Fournisseur') === false && strpos($plat, 'FOURNISSEUR') !== false, 'PDF réception : fournisseur et n° de facture du fournisseur (accent)');
list($bin, $textes) = pdf_document($inv, $gA, $a1['id']);
ok(in_array('+3', $textes, true) && in_array("-1\xA0m", $textes, true), 'PDF correction du stock : quantités signées (+3 ; -1 m avec son unité)');
list($bin, $textes) = pdf_document($inv, $gA, $f1['id'], 'non communiqué');
$plat = implode("\n", $textes);
ok(strpos($plat, "Pr\xE9par\xE9 par \x97 Beauchemin") !== false && strpos($plat, "Re\xE7u par \x97 Boutique Chaleur") !== false, 'PDF facture interne : signatures « Préparé par » et « Reçu par »');
$nomA1 = val('SELECT nom FROM emplacements WHERE id = ?', array($E['A1']));
ok(strpos($plat, 'Emplacement source : ' . cp($nomA1)) !== false && strpos($plat, "Emplacement de destination : non communiqu\xE9") !== false && strpos($plat, "\xC9METTEUR") !== false && strpos($plat, 'DESTINATAIRE') !== false, 'PDF facture interne (gestionnaire de l\'émettrice) : émetteur et destinataire ; l\'emplacement de l\'autre entreprise n\'est pas communiqué');
ok(strpos($bin, '/Subtype /Image') !== false && substr_count($bin, '/Subtype /Image') === 2, 'PDF facture interne : les deux logos (émetteur et destinataire) sont dans le fichier');
// proportions des logos respectées : rapport largeur / hauteur placé dans la page = rapport du fichier PNG
preg_match_all('/q ([\d.]+) 0 0 ([\d.]+) [\d.]+ [\d.]+ cm \/I\d+ Do Q/', $bin, $ml);
$rapports = array();
foreach ($ml[1] as $i => $w) { $rapports[] = round($w / $ml[2][$i], 2); }
sort($rapports);
$attendus = array();
foreach (array('logo-beauchemin.png', 'logo-boutique-chaleur.png') as $f) { $d = getimagesize(Marque::racine() . '/assets/img/' . $f); $attendus[] = round($d[0] / $d[1], 2); }
sort($attendus);
ok(count($rapports) === 2 && abs($rapports[0] - $attendus[0]) < 0.03 && abs($rapports[1] - $attendus[1]) < 0.03, 'PDF : logos non déformés (rapport ' . implode(' et ', $rapports) . ' = ' . implode(' et ', $attendus) . ')');

// l'employé : aucun prix, coût ni total, comme à l'écran
foreach (array($r1['id'], $t1['id'], $s1['id']) as $id) {
	list($bin, $textes, $m) = pdf_document($inv, $emp, $id);
	$plat = implode("\n", $textes);
	ok($m['couts'] === false && $m['total'] === null && $m['lignes'][0]['cout'] === null && $m['lignes'][0]['total'] === null, 'modèle d\'un employé : aucun coût ni total');
	ok(strpos($plat, '$') === false && strpos($plat, 'Total') === false && strpos($plat, "Co\xFBt") === false && !preg_match('/\d,\d\d/', $plat), 'PDF ' . $numeros[$id] . ' d\'un employé : ni prix, ni coût, ni total');
	ok(in_array(cp('N° ' . $numeros[$id]), $textes, true), 'PDF ' . $numeros[$id] . ' d\'un employé : numéro présent');
}
// emplacement d'une entreprise inaccessible : masqué, comme à l'écran (l'employé voit la facture reçue sans le nom de l'emplacement source)
$m = DocumentVue::document($pdo, user_pour($gB), $inv->document($gB, $f1['id']), array('masque' => 'non communiqué'));
$nomBout = val('SELECT nom FROM emplacements WHERE id = ?', array($E['BOUT']));
ok($m['parties'][0]['emplacement'] === null && $m['parties'][1]['emplacement'] === $nomBout, 'facture vue par la destinataire : l\'emplacement source (autre entreprise) n\'est pas communiqué, le sien l\'est');
$pdf = DocumentsPdf::document($m); $pdf->SetCompression(false);
$plat = implode("\n", pdf_textes($pdf->contenu()));
ok(strpos($plat, "Emplacement source : non communiqu\xE9") !== false && strpos($plat, cp($nomA1)) === false && strpos($plat, 'Emplacement de destination : ' . cp($nomBout)) !== false, 'PDF de la destinataire : « non communiqué » à la place du nom de l\'emplacement de l\'émettrice, son propre emplacement visible');

// document annulé : « ANNULÉ » (ANNULÉE pour une facture), motif, filigrane
$inv->annuler($gA, $s1['id'], 'Erreur « de saisie » à 100 %');
list($bin, $textes) = pdf_document($inv, $gA, $s1['id']);
$plat = implode("\n", $textes);
ok(in_array("ANNUL\xC9", $textes, true) && substr_count($bin, "(ANNUL\xC9) Tj") >= 2 && strpos($plat, "Motif : \xAB\xA0Erreur \xAB de saisie \xBB \xE0 100 %\xA0\xBB") !== false, 'PDF d\'un document annulé : « ANNULÉ » (pastille et filigrane) et motif');
ok(strpos($bin, '/ca 0.160') !== false && strpos($bin, '/GS1 gs') !== false, 'PDF d\'un document annulé : filigrane translucide');
$inv->annuler($gA, $f1['id'], 'Erreur');
list($bin, $textes) = pdf_document($inv, $gA, $f1['id'], 'non communiqué');
ok(in_array("ANNUL\xC9E", $textes, true), 'PDF d\'une facture annulée : « ANNULÉE »');

// document long : plusieurs pages, en-tête des colonnes répété, pied « Page n / N », nom très long coupé sans rien perdre
$longNom = str_repeat('Raccord-laiton-filete-', 6) . 'FIN';
$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('PDF-LONG', '" . $longNom . "')");
$plong = (int) val("SELECT id FROM pieces WHERE code = 'PDF-LONG'");
$lignes = array(L($plong, '3', '1.00'));
for ($i = 1; $i <= 70; $i++) {
	$pdo->exec("INSERT INTO pieces (code, nom) VALUES ('PDF-N$i', 'Pièce numéro $i de la longue liste avec un nom assez long pour passer à la ligne dans la colonne')");
	$lignes[] = L((int) $pdo->lastInsertId(), (string) ($i % 4 + 1), '1.50');
}
$rl = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'note' => str_repeat('Note longue. ', 30), 'lignes' => $lignes));
list($bin, $textes, $m) = pdf_document($inv, $gA, $rl['id']);
$np = pdf_pages($bin);
ok($np >= 3, "document de 71 lignes : plusieurs pages ($np)");
egal($np, preg_match_all('/\(Code\) Tj/', $bin), 'document long : l\'en-tête de colonnes est répété sur chaque page');
ok(in_array("Page $np / $np", pdf_pieds($textes), true) && in_array('Page 1 / ' . $np, pdf_pieds($textes), true) && preg_match('/\/Count ' . $np . '\b/', $bin), 'document long : le pied dit « Page 1 / ' . $np . ' » puis « Page ' . $np . ' / ' . $np . ' » et le nombre de pages est celui du fichier');
egal(1, substr_count(implode("\n", $textes), 'TOTAL'), 'document long : le total n\'apparaît qu\'une fois, à la fin');
egal(1, substr_count($bin, "(Note) Tj"), 'document long : la note n\'apparaît qu\'une fois');
ok(strpos(str_replace(array(' ', "\n"), '', implode("\n", $textes)), $longNom) !== false, 'nom de pièce de ' . strlen($longNom) . ' caractères sans espace : coupé en plusieurs lignes, aucune lettre perdue');
$nbPieces = preg_match_all('/\(PDF-(N\d+|LONG)\) Tj/', $bin);
egal(71, $nbPieces, 'document long : les 71 lignes sont dans le PDF');
// le fichier compressé (par défaut) est plus petit et reste un PDF valide
$pdfC = DocumentsPdf::document($m);
$binC = $pdfC->contenu();
ok(strpos($binC, '%PDF-') === 0 && substr(rtrim($binC), -5) === '%%EOF' && strlen($binC) < strlen($bin), 'PDF compressé (réglage par défaut) : valide et plus petit');

// bilan du mois
$u = user_pour($gA);
$an = (int) date('Y'); $mo = (int) date('n');
$rb = $inv->bilanMensuel($gA, $an, $mo, 1, 2);
$mb = DocumentVue::bilan($pdo, $rb, $an, $mo, 1, 2, MOIS_FR[$mo] . ' ' . $an);
$pdfB = DocumentsPdf::bilan($mb); $pdfB->SetCompression(false);
$bin = $pdfB->contenu();
$textes = pdf_textes($bin);
$plat = implode("\n", $textes);
ok(strpos($bin, '%PDF-') === 0 && substr(rtrim($bin), -5) === '%%EOF' && pdf_pages($bin) >= 1, 'PDF du bilan : fichier valide');
ok(in_array('BILAN DU MOIS', $textes, true) && strpos($plat, ucfirst(MOIS_FR[$mo]) . ' ' . $an) !== false && strpos($plat, 'Beauchemin et Boutique Chaleur') !== false, 'PDF du bilan : titre, mois et entreprises');
ok(strpos($plat, cp(fmt_argent($rb['a_vers_b']['total']))) !== false && strpos($plat, 'SOLDE DU MOIS') !== false, 'PDF du bilan : total du sens et solde');
foreach ($rb['a_vers_b']['documents'] as $d) { ok(in_array($d['numero'], $textes, true), 'PDF du bilan : la facture ' . $d['numero'] . ' est listée'); }
ok(substr_count($bin, '/Subtype /Image') === 2, 'PDF du bilan : logos des deux entreprises');
// employé : le bilan ne lui est pas offert (rôle) : le service refuse
refuse(function () use ($inv, $emp, $an, $mo) { $inv->bilanMensuel($emp, $an, $mo, 1, 2); }, '', 'bilan : refusé à un employé');
// bilan d'un mois vide
$mbv = DocumentVue::bilan($pdo, $inv->bilanMensuel($gA, 2020, 3, 1, 2), 2020, 3, 1, 2, 'mars 2020');
$pdfBv = DocumentsPdf::bilan($mbv); $pdfBv->SetCompression(false);
$pv = implode("\n", pdf_textes($pdfBv->contenu()));
ok(strpos($pv, 'Aucun solde') !== false && strpos($pv, 'Aucune facture en mars 2020.') !== false && substr_count($pv, 'Aucune facture.') === 2, 'PDF d\'un bilan vide : « Aucun solde », « Aucune facture »');

// entreprise sans logo (autre que BEA et BCH) : son nom en gros texte, jamais d'erreur
$pdo->exec("INSERT INTO entreprises (code, nom) VALUES ('XYZ', 'Entreprise Tierce Ł')");
$ent3 = (int) val("SELECT id FROM entreprises WHERE code = 'XYZ'");
$mq = Marque::pour('XYZ', 'Entreprise Tierce');
ok($mq['logo'] === null && $mq['slug'] === 'neutre', 'marque inconnue : pas de logo, couleurs neutres');
$mq2 = Marque::pour('bea', 'Beauchemin');
ok($mq2['logo'] === 'assets/img/logo-beauchemin.png' && $mq2['slug'] === 'bea' && $mq2['fort'] === '#044c92', 'marque BEA : logo et couleurs (code insensible à la casse)');
$mt = DocumentVue::bilan($pdo, array('periode' => array(), 'entreprises' => array(1 => 'Beauchemin', $ent3 => 'Entreprise Tierce Ł'), 'a_vers_b' => array('documents' => array(), 'pieces' => array(), 'total' => '0.00'), 'b_vers_a' => array('documents' => array(), 'pieces' => array(), 'total' => '0.00'),
	'solde' => array('montant' => '0.00', 'debiteur' => null, 'creancier' => null, 'debiteur_nom' => null, 'creancier_nom' => null)), $an, $mo, 1, $ent3, 'octobre');
$pdfT = DocumentsPdf::bilan($mt); $pdfT->SetCompression(false);
$bt = $pdfT->contenu();
ok(substr_count($bt, '/Subtype /Image') === 1 && strpos($bt, 'Entreprise Tierce L') !== false, 'PDF avec une entreprise sans logo : un seul logo, le nom de l\'autre en texte (Ł -> L)');
$pdo->exec("DELETE FROM entreprises WHERE id = $ent3");
$_SESSION = array();

// ---- Plan de l'entrepôt (page « Plan ») ------------------------------------------------------------------------------
groupe('Plan de l\'entrepôt : tuiles, cloisonnement, employé sans prix');
require_once __DIR__ . '/../app/classes/Plan.php';
$plan = new Plan($pdo, $inv);
$idsTuiles = function ($tuiles) { $r = array_map(function ($t) { return $t['id']; }, $tuiles); sort($r); return $r; };
$actifs = function (array $ents) { return array_map('intval', array_column(q('SELECT id FROM emplacements WHERE actif = 1 AND entreprise_id IN (' . implode(',', $ents) . ') ORDER BY id'), 'id')); };
$tuile = function ($donnees, $id) { foreach ($donnees['tuiles'] as $t) { if ($t['id'] === $id) { return $t; } } return null; };
egal($actifs(array(1)), $idsTuiles($plan->donnees($gA)['tuiles']), 'plan : le gestionnaire de l\'entreprise 1 ne voit que les emplacements actifs de l\'entreprise 1');
egal($actifs(array(2)), $idsTuiles($plan->donnees($gB)['tuiles']), 'plan : le gestionnaire de l\'entreprise 2 ne voit que ceux de l\'entreprise 2');
egal($actifs(array(1)), $idsTuiles($plan->donnees($emp)['tuiles']), 'plan : l\'employé de l\'entreprise 1 ne voit que l\'entreprise 1');
egal($actifs(array(1, 2)), $idsTuiles($plan->donnees($adm)['tuiles']), 'plan : l\'administrateur voit toutes les entreprises');
refuse(function () use ($plan, $U) { $plan->donnees($U['off']); }, 'désactivé', 'plan : un utilisateur désactivé est refusé');
ok($plan->donnees($adm)['admin'] === true && $plan->donnees($gA)['admin'] === false && $plan->donnees($emp)['admin'] === false, 'plan : seul l\'administrateur reçoit admin = vrai');
// nb de pièces et d'unités : comparés à un calcul indépendant sur la table stock
$tousOk = true;
foreach ($plan->donnees($adm)['tuiles'] as $t) {
	$lignes = q('SELECT quantite FROM stock WHERE emplacement_id = ? AND quantite > 0', array($t['id']));
	$somme = 0; foreach ($lignes as $l) { $somme += Dec::parse($l['quantite'], Dec::QTE); }
	if ($t['nb_pieces'] !== count($lignes) || $t['unites'] !== Dec::fmt($somme, Dec::QTE)) { $tousOk = false; echo "  tuile {$t['id']} : {$t['nb_pieces']} / {$t['unites']} au lieu de " . count($lignes) . ' / ' . Dec::fmt($somme, Dec::QTE) . "\n"; }
}
ok($tousOk, 'plan : nb_pieces et unites de chaque tuile = calcul indépendant sur le stock');
// résumé des cartes de la vue 3D : unités, pièces sous le minimum (une fois par entreprise), emplacements ; comparé à un calcul indépendant
$resumeSql = function (array $ents) use ($actifs) {
	$in = implode(',', $ents);
	$u = 0; foreach (q("SELECT s.quantite FROM stock s JOIN emplacements e ON e.id = s.emplacement_id WHERE s.quantite > 0 AND e.actif = 1 AND e.entreprise_id IN ($in)") as $l) { $u += Dec::parse($l['quantite'], Dec::QTE); }
	$bas = array();
	foreach (q("SELECT s.piece_id, e.entreprise_id, s.emplacement_id FROM stock s JOIN emplacements e ON e.id = s.emplacement_id AND e.actif = 1 AND e.entreprise_id IN ($in) JOIN pieces p ON p.id = s.piece_id AND p.actif = 1
	            JOIN seuils se ON se.entreprise_id = e.entreprise_id AND se.piece_id = s.piece_id AND se.minimum > 0 WHERE s.quantite > 0") as $l) {
		$tot = 0; foreach (q('SELECT s2.quantite FROM stock s2 JOIN emplacements e2 ON e2.id = s2.emplacement_id WHERE s2.piece_id = ? AND e2.entreprise_id = ?', array($l['piece_id'], $l['entreprise_id'])) as $x) { $tot += Dec::parse($x['quantite'], Dec::QTE); }
		$min = Dec::parse(val('SELECT minimum FROM seuils WHERE entreprise_id = ? AND piece_id = ?', array($l['entreprise_id'], $l['piece_id'])), Dec::QTE);
		if ($tot < $min) { $bas[$l['entreprise_id'] . ':' . $l['piece_id']] = true; }
	}
	return array('unites' => Dec::fmt($u, Dec::QTE), 'nb_bas' => count($bas), 'nb_emplacements' => count($actifs($ents)));
};
egal($resumeSql(array(1, 2)), $plan->donnees($adm)['resume'], 'plan : résumé (unités, pièces sous le minimum, emplacements) de l\'administrateur = calcul indépendant');
egal($resumeSql(array(1)), $plan->donnees($gA)['resume'], 'plan : le résumé du gestionnaire de l\'entreprise 1 ne compte que son entreprise');
egal(array('unites', 'nb_bas', 'nb_emplacements'), array_keys($plan->donnees($emp)['resume']), 'plan : le résumé ne contient que des quantités (aucun prix, coût ni valeur), pour un employé comme pour les autres');
ok($tuile($plan->donnees($adm), $E['A1'])['type_libelle'] === 'Entrepôt' && $tuile($plan->donnees($adm), $E['CUBE'])['type_libelle'] === 'Cube de service', 'plan : libellés de type en français');
// emplacement vide et emplacement désactivé
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Plan vide', 'boutique', 'EMP-PLAN-1')");
$vide = (int) $pdo->lastInsertId();
$t = $tuile($plan->donnees($gA), $vide);
ok($t !== null && $t['nb_pieces'] === 0 && $t['unites'] === '0.000' && $t['nb_bas'] === 0 && $t['pos'] === null && $t['code'] === 'EMP-PLAN-1' && $t['entreprise_code'] === 'BEA', 'plan : emplacement vide = 0 pièce, 0.000 unité, sans place enregistrée');
ok($tuile($plan->donnees($gB), $vide) === null, 'plan : cet emplacement vide de l\'entreprise 1 est invisible pour l\'entreprise 2');
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = $vide");
ok($tuile($plan->donnees($gA), $vide) === null && $tuile($plan->donnees($adm), $vide) === null, 'plan : un emplacement désactivé n\'est plus une tuile');
refuse(function () use ($plan, $gA, $vide) { $plan->contenu($gA, $vide); }, 'n\'existe pas', 'plan : le contenu d\'un emplacement désactivé est refusé');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = $vide");
// entreprise désactivée : comme la page Stock, ses emplacements restent consultables par ses utilisateurs
$pdo->exec('UPDATE entreprises SET actif = 0 WHERE id = 2');
ok(count($plan->donnees($gB)['tuiles']) === count($actifs(array(2))) && count($actifs(array(2))) > 0, 'plan : les emplacements d\'une entreprise désactivée restent visibles pour ses utilisateurs (même règle que Stock)');
$pdo->exec('UPDATE entreprises SET actif = 1 WHERE id = 2');
// un employé n'obtient aucun montant : ni dans les tuiles, ni dans le tiroir, ni dans la recherche (les mêmes champs pour tous les rôles)
$motsCout = '/"(cout|couts|cout_unitaire|cout_moyen|prix|prix_fournisseurs|valeur|valeur_totale|total|total_ligne|montant)"\s*:/';
$jsonEmp = json_encode($plan->donnees($emp, $P['T1'])) . json_encode($plan->contenu($emp, $E['A1'])) . json_encode($plan->contenu($emp, $E['CUBE']));
ok(!preg_match($motsCout, $jsonEmp) && strpos($jsonEmp, 'cout') === false && strpos($jsonEmp, 'prix') === false, 'plan : aucune clé de coût, prix ou valeur dans les réponses d\'un employé');
egal(array_keys($plan->contenu($emp, $E['A1'])), array_keys($plan->contenu($gA, $E['A1'])), 'plan : un employé et un gestionnaire reçoivent les mêmes champs (aucun montant pour personne)');

groupe('Plan : « sous le minimum », où est cette pièce, contenu d\'une tuile');
$pdo->exec("INSERT INTO pieces (code, nom, unite) VALUES ('PL1', 'Abeille de plan', 'unité'), ('PL2', 'mouche de plan', 'unité'), ('PL3', 'Zèbre de plan', 'm')");
$PL = array(); foreach (q("SELECT id, code FROM pieces WHERE code LIKE 'PL_'") as $r) { $PL[$r['code']] = (int) $r['id']; }
$avantBas = $tuile($plan->donnees($gA), $E['A1'])['nb_bas'];
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($PL['PL1'], '2', '1.00'), L($PL['PL2'], '5', '1.00'))));
egal($avantBas, $tuile($plan->donnees($gA), $E['A1'])['nb_bas'], 'plan : sans minimum, aucune pièce n\'est sous le minimum');
$pdo->exec("INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (1, {$PL['PL1']}, 10)");
egal($avantBas + 1, $tuile($plan->donnees($gA), $E['A1'])['nb_bas'], 'plan : une pièce sous le minimum de son entreprise est comptée sur la tuile');
$c = $plan->contenu($gA, $E['A1']);
$lAb = array_values(array_filter($c['lignes'], function ($l) use ($PL) { return $l['piece_id'] === $PL['PL1']; }));
ok(count($lAb) === 1 && $lAb[0]['bas'] === true && $lAb[0]['quantite'] === '2.000', 'plan : la ligne du tiroir porte la pastille « sous le minimum » et la bonne quantité');
// le minimum se compare au TOTAL de l'entreprise : du stock ailleurs dans l'entreprise 1 le règle
$inv->recevoir($gA, array('emplacement_id' => $E['CUBE'], 'lignes' => array(L($PL['PL1'], '9', '1.00'))));
egal($avantBas, $tuile($plan->donnees($gA), $E['A1'])['nb_bas'], 'plan : 2 + 9 en stock dans l\'entreprise (minimum 10) : plus sous le minimum');
$pdo->exec("UPDATE seuils SET minimum = 50 WHERE piece_id = {$PL['PL1']}");
$pdo->exec("UPDATE pieces SET actif = 0 WHERE id = {$PL['PL1']}");
egal($avantBas, $tuile($plan->donnees($gA), $E['A1'])['nb_bas'], 'plan : une pièce désactivée n\'est jamais sous le minimum (même règle que Stock)');
$pdo->exec("UPDATE pieces SET actif = 1 WHERE id = {$PL['PL1']}");
egal($avantBas + 1, $tuile($plan->donnees($gA), $E['A1'])['nb_bas'], 'plan : réactivée et toujours sous 50 : de nouveau comptée');
$pdo->exec("DELETE FROM seuils WHERE piece_id = {$PL['PL1']}");

// où est cette pièce ?
$r = $plan->donnees($gA, $PL['PL1'])['recherche'];
egal(array(array('emplacement_id' => $E['A1'], 'quantite' => '2.000'), array('emplacement_id' => $E['CUBE'], 'quantite' => '9.000')), $r['emplacements'], 'plan : où est la pièce : quantité exacte dans chaque emplacement');
egal('11.000', $r['somme'], 'plan : somme des quantités');
ok($r['piece']['code'] === 'PL1' && $r['piece']['nom'] === 'Abeille de plan' && $r['piece']['unite'] === 'unité', 'plan : la recherche nomme la pièce');
egal(array(), $plan->donnees($gA, $P['T4'])['recherche']['emplacements'], 'plan : pièce nulle part : aucun emplacement');
egal('0.000', $plan->donnees($gA, $P['T4'])['recherche']['somme'], 'plan : pièce nulle part : somme à zéro');
$inv->recevoir($gB, array('emplacement_id' => $E['B1'], 'lignes' => array(L($PL['PL3'], '7,5', '2.00'))));
egal(array(), $plan->donnees($emp, $PL['PL3'])['recherche']['emplacements'], 'plan : le stock de l\'autre entreprise est invisible dans la recherche d\'un employé');
egal(array(array('emplacement_id' => $E['B1'], 'quantite' => '7.500')), $plan->donnees($gB, $PL['PL3'])['recherche']['emplacements'], 'plan : l\'entreprise 2 voit son stock décimal');
egal('7.500', $plan->donnees($adm, $PL['PL3'])['recherche']['somme'], 'plan : l\'administrateur voit la somme');
refuse(function () use ($plan, $gA) { $plan->donnees($gA, 999999); }, 'introuvable', 'plan : pièce inconnue refusée');
egal(null, $plan->donnees($gA)['recherche'], 'plan : sans pièce demandée, pas de recherche');

// contenu d'une tuile
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Plan tri', 'cube', 'EMP-PLAN-2')");
$tri = (int) $pdo->lastInsertId();
$inv->recevoir($gA, array('emplacement_id' => $tri, 'lignes' => array(L($PL['PL2'], '3', '1.00'), L($PL['PL3'], '1,5', '1.00'), L($PL['PL1'], '4', '1.00'))));
$c = $plan->contenu($gA, $tri);
egal(array('Abeille de plan', 'mouche de plan', 'Zèbre de plan'), array_column($c['lignes'], 'nom'), 'plan : le contenu est trié par nom (sans égard à la casse ni aux accents)');
egal(3, $c['nb_pieces'], 'plan : nb de pièces du tiroir');
egal('8.500', $c['unites'], 'plan : unités du tiroir (3 + 1,5 + 4)');
ok($c['lignes'][2]['unite'] === 'm' && $c['lignes'][2]['quantite'] === '1.500' && $c['tronque'] === false && $c['emplacement']['nom'] === 'Plan tri' && $c['emplacement']['entreprise_code'] === 'BEA', 'plan : tiroir : unité, quantité décimale, emplacement et entreprise');
egal(array('mouche de plan'), array_column($plan->contenu($gA, $tri, 'MOUCHE')['lignes'], 'nom'), 'plan : recherche rapide par nom (sans égard à la casse)');
egal(array('Zèbre de plan'), array_column($plan->contenu($gA, $tri, 'PL3')['lignes'], 'nom'), 'plan : recherche rapide par code');
egal(array('Abeille de plan'), array_column($plan->contenu($gA, $tri, 'plan abe')['lignes'], 'nom'), 'plan : recherche rapide : chaque mot doit être trouvé');
egal(array(), $plan->contenu($gA, $tri, '%')['lignes'], 'plan : « % » dans la recherche rapide est un caractère, pas un joker');
egal(3, $plan->contenu($gA, $tri, "' OR 1=1 -- ") ['nb_pieces'], 'plan : recherche rapide piégée : aucune injection (le résumé reste celui de l\'emplacement)');
egal(array(), $plan->contenu($gA, $tri, "' OR 1=1 -- ")['lignes'], 'plan : recherche rapide piégée : aucune ligne');
refuse(function () use ($plan, $emp, $E) { $plan->contenu($emp, $E['B1']); }, 'n\'existe pas', 'plan : le contenu d\'un emplacement d\'une autre entreprise est refusé');
refuse(function () use ($plan, $emp) { $plan->contenu($emp, 999999); }, 'n\'existe pas', 'plan : emplacement inconnu : même refus (on ne révèle pas son existence)');
try { $plan->contenu($emp, $E['B1']); } catch (PlanRefus $e) { ok(true, 'plan : le refus d\'accès est un PlanRefus (HTTP 403)'); }
// plus de 400 pièces : le tiroir est tronqué et le serveur filtre à la demande
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES (1, 'Plan long', 'entrepot', 'EMP-PLAN-3')");
$long = (int) $pdo->lastInsertId();
$pdo->beginTransaction();
$insP = $pdo->prepare("INSERT INTO pieces (code, nom) VALUES (?, ?)");
$insS = $pdo->prepare('INSERT INTO stock (piece_id, emplacement_id, quantite) VALUES (?, ?, 1)');
for ($i = 1; $i <= Plan::MAX_LIGNES + 5; $i++) { $insP->execute(array('PLL' . $i, 'Longue ' . sprintf('%04d', $i))); $insS->execute(array((int) $pdo->lastInsertId(), $long)); }
$pdo->commit();
$cl = $plan->contenu($gA, $long);
ok($cl['tronque'] === true && count($cl['lignes']) === Plan::MAX_LIGNES && $cl['nb_pieces'] === Plan::MAX_LIGNES + 5, 'plan : plus de ' . Plan::MAX_LIGNES . ' pièces : liste tronquée, mais le résumé compte tout');
$cf = $plan->contenu($gA, $long, 'Longue 0' . (Plan::MAX_LIGNES + 3));
ok($cf['tronque'] === false && count($cf['lignes']) === 1, 'plan : le serveur retrouve une pièce au-delà de la limite quand on la cherche');
$pdo->exec("DELETE FROM stock WHERE emplacement_id = $long");        // données de test directes : on les retire (l'invariant stock = somme des mouvements reste vrai)
$pdo->exec("DELETE FROM pieces WHERE code LIKE 'PLL%'");

groupe('Plan : disposition libre (administrateur), validation, journal');
$pos = function ($id, $x = 0, $y = 0, $l = 240, $h = 160) { return array('emplacement_id' => $id, 'x' => $x, 'y' => $y, 'largeur' => $l, 'hauteur' => $h); };
$nbPlan = function () { return (int) val('SELECT COUNT(*) FROM plan_emplacements'); };
$nbJournal = function () { return (int) val("SELECT COUNT(*) FROM journal WHERE action = 'plan.disposition'"); };
refuse(function () use ($plan, $gA, $pos, $E) { $plan->enregistrer($gA, array($pos($E['A1']))); }, 'administrateur', 'plan : un gestionnaire ne peut pas enregistrer la disposition');
refuse(function () use ($plan, $emp, $pos, $E) { $plan->enregistrer($emp, array($pos($E['A1']))); }, 'administrateur', 'plan : un employé ne peut pas enregistrer la disposition');
try { $plan->enregistrer($emp, array($pos($E['A1']))); } catch (PlanRefus $e) { ok(true, 'plan : le refus de rôle est un PlanRefus (HTTP 403)'); }
refuse(function () use ($plan, $U, $pos, $E) { $plan->enregistrer($U['off'], array($pos($E['A1']))); }, 'désactivé', 'plan : un utilisateur désactivé ne peut rien enregistrer');
egal(0, $nbPlan(), 'plan : rien n\'a été écrit par les refus');
$j0 = $nbJournal();
$r = $plan->enregistrer($adm, array($pos($E['A1'], 0, 0, 320, 200), $pos($E['B1'], 340, 0), $pos($E['CUBE'], 0, 220, 160, 140)));
egal(3, $r['modifies'], 'plan : trois tuiles enregistrées');
egal(3, $nbPlan(), 'plan : une ligne par emplacement');
egal($j0 + 1, $nbJournal(), 'plan : l\'enregistrement est journalisé (une entrée)');
$det = json_decode(val("SELECT details FROM journal WHERE action = 'plan.disposition' ORDER BY id DESC LIMIT 1"), true);
ok($det['nb_emplacements'] === 3 && strpos($det['emplacements'], 'Entrepôt principal (Beauchemin)') !== false && strpos($det['emplacements'], 'Entrepôt principal (Boutique Chaleur)') !== false && (int) val("SELECT utilisateur_id FROM journal WHERE action = 'plan.disposition' ORDER BY id DESC LIMIT 1") === $adm, 'plan : le journal dit qui et quelles tuiles (avec l\'entreprise)');
$d = $plan->donnees($adm);
egal(array('x' => 0, 'y' => 0, 'largeur' => 320, 'hauteur' => 200), $tuile($d, $E['A1'])['pos'], 'plan : la place enregistrée revient dans les données');
egal(array('x' => 340, 'y' => 0, 'largeur' => 240, 'hauteur' => 160), $tuile($d, $E['B1'])['pos'], 'plan : place d\'une tuile de l\'autre entreprise');
egal(null, $tuile($d, $E['BOUT'])['pos'], 'plan : une tuile jamais placée n\'a pas de place (rangement automatique)');
$r = $plan->enregistrer($adm, array($pos($E['A1'], 0, 0, 320, 200), $pos($E['B1'], 340, 0)));
egal(0, $r['modifies'], 'plan : rien n\'a changé : rien n\'est écrit');
egal($j0 + 1, $nbJournal(), 'plan : rien n\'a changé : rien n\'est journalisé');
$r = $plan->enregistrer($adm, array($pos($E['B1'], 360, 20, 300, 180)));
egal(1, $r['modifies'], 'plan : une tuile déplacée et agrandie');
egal(3, $nbPlan(), 'plan : toujours une seule ligne par emplacement après un nouvel enregistrement');
egal(array('x' => 360, 'y' => 20, 'largeur' => 300, 'hauteur' => 180), $tuile($plan->donnees($adm), $E['B1'])['pos'], 'plan : la nouvelle place remplace l\'ancienne');
egal(array('x' => 0, 'y' => 0, 'largeur' => 320, 'hauteur' => 200), $tuile($plan->donnees($adm), $E['A1'])['pos'], 'plan : les tuiles absentes de la liste gardent leur place');
egal(array('x' => 360, 'y' => 20, 'largeur' => 300, 'hauteur' => 180), $tuile($plan->donnees($gB), $E['B1'])['pos'], 'plan : la disposition est la même pour tous les rôles');
// positions refusées
$avantNb = $nbPlan();
$refus = array(
	array('grille', array($pos($E['A1'], 10)), 'x hors de la grille de 20 px'),
	array('grille', array($pos($E['A1'], 0, 30)), 'y hors de la grille'),
	array('grille', array($pos($E['A1'], 0, 0, 250)), 'largeur hors de la grille'),
	array('sort du plan', array($pos($E['A1'], -20)), 'x négatif'),
	array('sort du plan', array($pos($E['A1'], 0, -20)), 'y négatif'),
	array('sort du plan', array($pos($E['A1'], 0, 0, -240)), 'largeur négative'),
	array('grille', array($pos($E['A1'], 20.0)), 'x décimal'),
	array('grille', array($pos($E['A1'], '20.5')), 'x décimal en chaîne'),
	array('grille', array($pos($E['A1'], 'abc')), 'x non numérique'),
	array('grille', array($pos($E['A1'], array(20))), 'x en tableau'),
	array('grille', array($pos($E['A1'], true)), 'x booléen'),
	array('grille', array($pos($E['A1'], null)), 'x absent'),
	array('grille', array($pos($E['A1'], '1e3')), 'x en notation scientifique'),
	array('sort du plan', array($pos($E['A1'], 1500, 0, 240)), 'dépasse à droite'),
	array('sort du plan', array($pos($E['A1'], 0, 1100, 240, 160)), 'dépasse en bas'),
	array('Taille invalide', array($pos($E['A1'], 0, 0, 100)), 'trop étroite'),
	array('Taille invalide', array($pos($E['A1'], 0, 0, 240, 80)), 'trop basse'),
	array('Taille invalide', array($pos($E['A1'], 0, 0, 620)), 'trop large'),
	array('Taille invalide', array($pos($E['A1'], 0, 0, 240, 420)), 'trop haute'),
	array('Taille invalide', array($pos($E['A1'], 0, 0, 0, 0)), 'taille nulle'),
	array('Emplacement invalide', array(array('x' => 0, 'y' => 0, 'largeur' => 240, 'hauteur' => 160)), 'sans emplacement'),
	array('Emplacement invalide', array($pos(0)), 'emplacement 0'),
	array('Emplacement invalide', array($pos(-3)), 'emplacement négatif'),
	array('Emplacement invalide', array($pos('x')), 'emplacement non numérique'),
	array('Emplacement invalide', array($pos(array(1))), 'emplacement en tableau'),
	array('double', array($pos($E['A1']), $pos($E['A1'], 20)), 'emplacement en double'),
	array('n\'existe plus', array($pos(999999)), 'emplacement inconnu'),
	array('n\'existe plus', array($pos($E['A1']), $pos(999999, 400)), 'une bonne position + un emplacement inconnu : rien d\'écrit'),
	array('Position invalide', array('texte'), 'entrée qui n\'est pas une position'),
	array('Aucune position', array(), 'liste vide'),
	array('Aucune position', 'texte', 'positions qui n\'est pas une liste'),
	array('Aucune position', null, 'positions absentes'),
);
$tousRefuses = true;
foreach ($refus as $cas) {
	try { $plan->enregistrer($adm, $cas[1]); $tousRefuses = false; echo "  non refusé : {$cas[2]}\n"; }
	catch (InventaireException $e) { if (mb_stripos($e->getMessage(), $cas[0]) === false) { $tousRefuses = false; echo "  {$cas[2]} : message « {$e->getMessage()} »\n"; } }
}
ok($tousRefuses, 'plan : ' . count($refus) . ' positions invalides refusées avec un message en français');
egal($avantNb, $nbPlan(), 'plan : les positions refusées n\'ont rien écrit (tout ou rien)');
$enorme = array(); for ($i = 1; $i <= Plan::MAX_POSITIONS + 1; $i++) { $enorme[] = $pos($i); }
refuse(function () use ($plan, $adm, $enorme) { $plan->enregistrer($adm, $enorme); }, 'Trop', 'plan : plus de ' . Plan::MAX_POSITIONS . ' tuiles à la fois refusé');
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = $vide");
refuse(function () use ($plan, $adm, $pos, $vide) { $plan->enregistrer($adm, array($pos($vide))); }, 'n\'existe plus', 'plan : on ne place pas un emplacement désactivé');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = $vide");
ok($plan->enregistrer($adm, array($pos($E['A1'], 1360, 1040, 240, 160)))['modifies'] === 1, 'plan : une tuile au coin extrême du plan (1600 x 1200) est acceptée');
ok($plan->enregistrer($adm, array($pos($E['A1'], 0, 0, 140, 100), $pos($E['B1'], 0, 120, 600, 400)))['modifies'] === 2, 'plan : tailles minimale (140 x 100) et maximale (600 x 400) acceptées');
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type) VALUES (1, 'Plan éphémère', 'cube')");
$eph = (int) $pdo->lastInsertId();
$pdo->exec("INSERT INTO plan_emplacements (emplacement_id, x, y, largeur, hauteur) VALUES ($eph, 0, 0, 240, 160)");
$pdo->exec("DELETE FROM emplacements WHERE id = $eph");
egal(0, (int) val('SELECT COUNT(*) FROM plan_emplacements WHERE emplacement_id = ?', array($eph)), 'plan : la place d\'un emplacement supprimé disparaît avec lui (clé étrangère en cascade)');
$pdo->exec('DELETE FROM plan_emplacements');

groupe('Plan : jeton de version (temps réel)');
$jVersion = $nbJournal();
$vA = $plan->version($gA); $vB = $plan->version($gB);
ok(preg_match('/^\d+-\d+-\d+$/', $vA) === 1, 'plan : le jeton de version a la forme « mouvement-emplacements-empreinte »');
egal($vA, $plan->version($gA), 'plan : le jeton est stable tant que rien ne change');
egal($vA, $plan->version($emp), 'plan : même entreprises, même jeton (employé et gestionnaire de l\'entreprise 1)');
ok($vA !== $vB, 'plan : deux entreprises différentes, deux jetons');
$inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($PL['PL2'], '1', '1.00'))));
$vA1 = $plan->version($gA);
ok($vA1 !== $vA, 'plan : une réception change le jeton');
egal($vB, $plan->version($gB), 'plan : le jeton de l\'entreprise 2 ne bouge pas pour une réception de l\'entreprise 1 (pas de fuite entre entreprises)');
ok($plan->version($adm) !== $plan->versionPour(array(2)), 'plan : l\'administrateur a son propre jeton (toutes les entreprises)');
$tr = $inv->transferer($emp, array('emplacement_id' => $E['A1'], 'emplacement_dest_id' => $E['CUBE'], 'lignes' => array(L($PL['PL2'], '1'))));
$vA2 = $plan->version($gA); ok($vA2 !== $vA1, 'plan : un déplacement change le jeton');
$inv->sortir($emp, array('emplacement_id' => $E['CUBE'], 'motif' => 'service', 'lignes' => array(L($PL['PL2'], '1'))));
$vA3 = $plan->version($gA); ok($vA3 !== $vA2, 'plan : une utilisation change le jeton');
$aj = $inv->ajuster($gA, array('emplacement_id' => $E['A1'], 'motif' => 'correction', 'lignes' => array(L($PL['PL2'], '2'))));
$vA4 = $plan->version($gA); ok($vA4 !== $vA3, 'plan : une correction change le jeton');
$rc = $inv->recevoir($gA, array('emplacement_id' => $E['A1'], 'lignes' => array(L($PL['PL2'], '1', '1.00'))));
$vA4b = $plan->version($gA);
$inv->annuler($gA, $rc['id'], 'essai');
$vA5 = $plan->version($gA); ok($vA4b !== $vA4 && $vA5 !== $vA4b, 'plan : une réception, puis son annulation, changent chacune le jeton');
$cmp = $inv->creerComptage($emp, $E['CUBE']);
$inv->comptageScanner($emp, $cmp['id'], $PL['PL1'], '5', 'fixer');
$vA6a = $plan->version($gA);
$inv->comptageAppliquer($gA, $cmp['id'], false);
$vA6 = $plan->version($gA); ok($vA6 !== $vA5 && $vA6a === $vA5, 'plan : un comptage appliqué change le jeton (le brouillon, lui, ne change rien)');
$fi = $inv->factureInterne($gA, array('emplacement_id' => $E['A1'], 'entreprise_dest_id' => 2, 'emplacement_dest_id' => $E['B1'], 'lignes' => array(L($PL['PL2'], '1'))));
ok($plan->version($gA) !== $vA6 && $plan->version($gB) !== $vB, 'plan : une facture interne change le jeton des deux entreprises');
$vB2 = $plan->version($gB);
$pdo->exec("UPDATE emplacements SET nom = 'Plan tri renommé' WHERE id = $tri");
ok($plan->version($gA) !== $vA6 && $plan->version($gB) === $vB2, 'plan : renommer un emplacement change le jeton (de son entreprise seulement)');
$vR = $plan->version($gA);
$pdo->exec("UPDATE emplacements SET actif = 0 WHERE id = $tri");
$vD = $plan->version($gA); ok($vD !== $vR, 'plan : désactiver un emplacement change le jeton');
$pdo->exec("UPDATE emplacements SET actif = 1 WHERE id = $tri");
egal($vR, $plan->version($gA), 'plan : le réactiver rétablit le même jeton');
$plan->enregistrer($adm, array($pos($tri, 20, 20)));
ok($plan->version($gA) !== $vR && $plan->version($gB) === $vB2, 'plan : enregistrer la disposition change le jeton de l\'entreprise concernée seulement');
egal($jVersion + 1, $nbJournal(), 'plan : journal : une entrée de plus pour cet enregistrement qui a changé quelque chose');
$expl = q('EXPLAIN SELECT m.id FROM mouvements m FORCE INDEX (ix_mouv_emplacement_id) WHERE m.emplacement_id = 1 ORDER BY m.id DESC LIMIT 1');
ok($expl && $expl[0]['key'] === 'ix_mouv_emplacement_id' && strpos((string) $expl[0]['Extra'], 'filesort') === false, 'plan : le dernier mouvement d\'un emplacement se lit dans l\'index (emplacement_id, id), sans tri : ' . json_encode($expl[0]));
$pdo->exec('DELETE FROM plan_emplacements');

groupe('Migration : idempotente');
require_once __DIR__ . '/../database/migrer.php';
egal(array('SET @a = 1', 'CREATE TABLE t (x INT)', 'SELECT 2'), migration_instructions("-- commentaire\nSET @a = 1;\n\n-- autre\nCREATE TABLE t (x INT);   \nSELECT 2;"), 'migration : les instructions sont séparées, les commentaires retirés');
$faits1 = migrer($pdo, __DIR__ . '/../database/migrations');
$faits2 = migrer($pdo, __DIR__ . '/../database/migrations');
ok(in_array('2026-10-12-plan.sql', $faits1, true) && $faits1 === $faits2, 'migration : rejouée deux fois sans erreur : ' . implode(', ', $faits1));
egal(2, (int) val("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'mouvements' AND index_name = 'ix_mouv_emplacement_id'"), 'migration : l\'index (emplacement_id, id) existe une seule fois (deux colonnes)');
egal(1, (int) val("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements'"), 'migration : la table plan_emplacements existe');
$pdo->exec('DROP TABLE plan_emplacements');
$pdo->exec("ALTER TABLE mouvements DROP INDEX ix_mouv_emplacement_id");
migrer($pdo, __DIR__ . '/../database/migrations');
egal(1, (int) val("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements'") + (int) val("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'mouvements' AND index_name = 'ix_mouv_emplacement_id'") - 2, 'migration : sur une base de l\'ancien schéma (sans table ni index), elle crée les deux');
egal(2, (int) val("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'mouvements' AND index_name = 'ix_mouv_emplacement_id'"), 'migration : index recréé avec ses deux colonnes');

invariants('fin des scénarios');

echo "\n" . ($T_FAIL === 0 ? "OK" : "ÉCHECS") . " — $T_PASS vérifications réussies, $T_FAIL échec(s)\n";
exit($T_FAIL === 0 ? 0 : 1);
