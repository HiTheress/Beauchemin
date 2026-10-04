<?php
// Données de DÉMONSTRATION (jamais en production) : pièces, fournisseurs, stock, quelques mouvements.
// Usage : php database/demo.php   (sur une base fraîche, après schema.sql et create_admin.php)
// Crée aussi les comptes gestionnaire1 et employe1 (mot de passe : Test-Beauchemin-1).
if (PHP_SAPI !== 'cli') { exit("Ligne de commande seulement.\n"); }
require __DIR__ . '/../app/init.php';

$admin = (int) $pdo->query("SELECT id FROM utilisateurs WHERE role = 'admin' ORDER BY id LIMIT 1")->fetchColumn();
if (!$admin) { exit("Créez d'abord un administrateur (create_admin.php).\n"); }
if ((int) $pdo->query("SELECT COUNT(*) FROM pieces")->fetchColumn() > 0) { exit("La base contient déjà des pièces : démo ignorée.\n"); }
$inv = new Inventaire($pdo);

$h = password_hash('Test-Beauchemin-1', PASSWORD_DEFAULT);
$pdo->prepare("INSERT INTO utilisateurs (nom_utilisateur, nom_complet, mot_de_passe, role) VALUES ('gestionnaire1', 'Gestionnaire Démo', ?, 'gestionnaire'), ('employe1', 'Employé Démo', ?, 'employe')")->execute(array($h, $h));
$g = (int) $pdo->lastInsertId();
$pdo->exec("INSERT INTO utilisateur_entreprises (utilisateur_id, entreprise_id) VALUES ($g, 1), ($g, 2), (" . ($g + 1) . ", 1)");

$pdo->exec("INSERT INTO categories (nom) VALUES ('Brûleurs'), ('Contrôles'), ('Gicleurs et pompes'), ('Plomberie / gaz'), ('Cheminée et évacuation')");
$pdo->exec("INSERT INTO fournisseurs (nom, contact, telephone) VALUES ('Distribution Chauffage Plus', 'Marc Tremblay', '418-555-0101'), ('Grossiste Gaz du Nord', 'Julie Roy', '418-555-0102'), ('Pièces Mazout Express', NULL, '418-555-0103')");
$pdo->exec("INSERT INTO emplacements (entreprise_id, nom, type, code_barres) VALUES
	(1, 'Cube 12 — Marc', 'cube', 'EMP-000003'), (1, 'Cube 14 — Luc', 'cube', 'EMP-000004'), (2, 'Boutique Centre-ville', 'boutique', 'EMP-000005')");

$pieces = array(
	// code, nom, catégorie, unité, prix fournisseur (f1,f2,f3), coût réception, minimum BEA
	array('P-0001', 'Thermocouple 36 po', 2, 'unité', 14.50, 15.20, null, 14.50, 10),
	array('P-0002', 'Aquastat Honeywell L8148', 2, 'unité', 78.00, null, 81.40, 78.00, 4),
	array('P-0003', 'Gicleur Delavan 0.75 gph 80° B', 3, 'unité', 6.25, 6.10, 6.90, 6.10, 20),
	array('P-0004', 'Pompe à mazout Suntec A2VA', 3, 'unité', 112.35, null, 109.00, 109.00, 3),
	array('P-0005', 'Filtre à mazout 3/8 po', 3, 'unité', 9.80, null, 10.10, 9.80, 15),
	array('P-0006', 'Électrode d\'allumage (paire)', 1, 'paire', 11.40, null, 12.00, 11.40, 8),
	array('P-0007', 'Moteur de brûleur 1/7 HP', 1, 'unité', 168.00, null, 171.25, 168.00, 2),
	array('P-0008', 'Cellule photorésistive', 2, 'unité', 22.75, 23.10, null, 22.75, 6),
	array('P-0009', 'Régulateur propane 2 stades', 4, 'unité', 54.60, 52.90, null, 52.90, 5),
	array('P-0010', 'Boyau flexible gaz 3/8 po x 24 po', 4, 'unité', 18.35, 17.80, null, 17.80, 10),
	array('P-0011', 'Tuyau de cuivre 3/8 po', 4, 'm', 4.85, 5.10, null, 4.85, 30),
	array('P-0012', 'Thermostat programmable', 2, 'unité', 64.90, null, 66.00, 64.90, 4),
	array('P-0013', 'Coude de cheminée 6 po', 5, 'unité', 12.50, null, null, 12.50, 6),
	array('P-0014', 'Joint de porte de foyer (rouleau)', 5, 'unité', 27.30, null, null, 27.30, 3),
);
$pid = array();
foreach ($pieces as $p) {
	$pdo->prepare("INSERT INTO pieces (code, nom, categorie_id, unite) VALUES (?, ?, ?, ?)")->execute(array($p[0], $p[1], $p[2], $p[3]));
	$pid[$p[0]] = (int) $pdo->lastInsertId();
	foreach (array(4 => 1, 5 => 2, 6 => 3) as $i => $f) {
		if ($p[$i] !== null) { $inv->definirPrixFournisseur($admin, $pid[$p[0]], $f, $p[$i], 'F' . $f . '-' . substr($p[0], 2)); }
	}
	$pdo->prepare("INSERT INTO seuils (entreprise_id, piece_id, minimum) VALUES (1, ?, ?)")->execute(array($pid[$p[0]], $p[8]));
}
$pdo->exec("INSERT INTO pieces_codes (piece_id, code, type) VALUES ({$pid['P-0001']}, '012345678905', 'fabricant'), ({$pid['P-0003']}, '036000291452', 'fabricant')");

// Réceptions initiales (Beauchemin : entrepôt 1 ; Boutique Chaleur : entrepôt 2)
$lignes = array();
foreach ($pieces as $p) { $lignes[] = array('piece_id' => $pid[$p[0]], 'quantite' => ($p[3] === 'm' ? 120 : 12), 'cout_unitaire' => $p[7]); }
$inv->recevoir($admin, array('emplacement_id' => 1, 'fournisseur_id' => 1, 'reference' => 'FAC-88421', 'note' => 'Stock de départ (démo)', 'lignes' => $lignes));
$inv->recevoir($admin, array('emplacement_id' => 2, 'fournisseur_id' => 2, 'reference' => 'GN-5530', 'lignes' => array(
	array('piece_id' => $pid['P-0009'], 'quantite' => 6, 'cout_unitaire' => 53.40),
	array('piece_id' => $pid['P-0010'], 'quantite' => 8, 'cout_unitaire' => 18.10),
	array('piece_id' => $pid['P-0012'], 'quantite' => 5, 'cout_unitaire' => 65.00),
	array('piece_id' => $pid['P-0013'], 'quantite' => 10, 'cout_unitaire' => 12.75),
	array('piece_id' => $pid['P-0014'], 'quantite' => 4, 'cout_unitaire' => 27.50),
)));
// Charger un cube de service
$inv->transferer($admin, array('emplacement_id' => 1, 'emplacement_dest_id' => 3, 'note' => 'Plein de cube (démo)', 'lignes' => array(
	array('piece_id' => $pid['P-0001'], 'quantite' => 4), array('piece_id' => $pid['P-0003'], 'quantite' => 6),
	array('piece_id' => $pid['P-0005'], 'quantite' => 3), array('piece_id' => $pid['P-0011'], 'quantite' => 20),
)));
// Utilisation sur un appel de service
$inv->sortir($admin, array('emplacement_id' => 3, 'motif' => 'service', 'reference' => 'BT-20417', 'lignes' => array(
	array('piece_id' => $pid['P-0003'], 'quantite' => 2), array('piece_id' => $pid['P-0001'], 'quantite' => 1),
)));
// Facture interne : Beauchemin -> Boutique Chaleur, et un sens inverse
$inv->factureInterne($admin, array('emplacement_id' => 1, 'entreprise_dest_id' => 2, 'emplacement_dest_id' => 5, 'note' => 'Pièces pour la boutique (démo)', 'lignes' => array(
	array('piece_id' => $pid['P-0013'], 'quantite' => 2), array('piece_id' => $pid['P-0014'], 'quantite' => 1), array('piece_id' => $pid['P-0012'], 'quantite' => 2),
)));
$inv->factureInterne($admin, array('emplacement_id' => 2, 'entreprise_dest_id' => 1, 'emplacement_dest_id' => 4, 'lignes' => array(
	array('piece_id' => $pid['P-0009'], 'quantite' => 2), array('piece_id' => $pid['P-0010'], 'quantite' => 3),
)));
echo "Démo prête : " . count($pieces) . " pièces, 3 fournisseurs. Comptes : admin / gestionnaire1 / employe1.\n";
