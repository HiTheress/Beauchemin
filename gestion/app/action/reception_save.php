<?php
// Enregistre une RÉCEPTION de marchandise (gestionnaire+). POST JSON : emplacement_id, fournisseur_id?, date?, reference? (no de facture du fournisseur), note?, maj_prix?, jeton?, lignes[{piece_id, quantite, cout_unitaire}].
// Réponse : {ok:true, id, numero, lien, total (gestionnaire+ seulement), doublon? (le même jeton a déjà été enregistré)}
// Erreurs : 400 + message français (stock insuffisant, pièce désactivée…), 401 non connecté, 403 rôle ou entreprise refusés / jeton CSRF.
require_once __DIR__ . '/document_lib.php';
exiger_post();
Mouvements::enregistrer('reception');
