<?php
// Enregistre une SORTIE de stock (employé+). POST JSON : emplacement_id, motif, reference? (no de bon de travail), date?, note?, jeton?, lignes[{piece_id, quantite}].
// Réponse : {ok:true, id, numero, lien, total (gestionnaire+ seulement), doublon? (le même jeton a déjà été enregistré)}
// Erreurs : 400 + message français (stock insuffisant, pièce désactivée…), 401 non connecté, 403 rôle ou entreprise refusés / jeton CSRF.
require_once __DIR__ . '/document_lib.php';
exiger_post();
Mouvements::enregistrer('sortie');
