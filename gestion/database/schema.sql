-- ============================================================================
--  Beauchemin / Boutique Chaleur — gestion d'inventaire de pièces
--  Schéma MariaDB 10.4+ / MySQL 8.0.16+ (InnoDB, utf8mb4)
--
--  Règles de conception
--   * Une seule installation, deux entreprises. Chaque entreprise possède ses
--     emplacements (entrepôt, boutique, cube de service) et donc son stock.
--   * `stock` = solde courant par (pièce, emplacement). `mouvements` = registre
--     (jamais modifié, seulement ajouté) qui explique chaque changement de solde.
--   * `stock_couts` = coût moyen pondéré par (entreprise, pièce). Une facture
--     interne facture toujours au coût moyen de l'entreprise émettrice.
--   * Quantités : DECIMAL(12,3). Coûts unitaires : DECIMAL(12,4). Totaux : (14,2).
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS entreprises (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(10)  NOT NULL,
  nom        VARCHAR(100) NOT NULL,
  adresse    VARCHAR(255) NULL,
  actif      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_entreprises_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emplacements (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entreprise_id  INT UNSIGNED NOT NULL,
  nom            VARCHAR(100) NOT NULL,
  type           ENUM('entrepot','boutique','cube') NOT NULL DEFAULT 'entrepot',
  code_barres    VARCHAR(64)  NULL,
  actif          TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_emplacements_nom (entreprise_id, nom),
  UNIQUE KEY uq_emplacements_code (code_barres),
  CONSTRAINT fk_emplacements_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom          VARCHAR(100) NOT NULL,
  description  VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fournisseurs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(150) NOT NULL,
  contact     VARCHAR(100) NULL,
  telephone   VARCHAR(40)  NULL,
  courriel    VARCHAR(150) NULL,
  adresse     VARCHAR(255) NULL,
  notes       TEXT NULL,
  actif       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fournisseurs_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogue commun aux deux entreprises (une même pièce a un seul code).
-- `code` = code interne (celui imprimé sur les étiquettes, en Code 128).
CREATE TABLE IF NOT EXISTS pieces (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code          VARCHAR(40)  NOT NULL,
  nom           VARCHAR(150) NOT NULL,
  description   TEXT NULL,
  categorie_id  INT UNSIGNED NULL,
  unite         VARCHAR(20)  NOT NULL DEFAULT 'unité',
  actif         TINYINT(1)   NOT NULL DEFAULT 1,
  cree_le       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifie_le    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pieces_code (code),
  KEY ix_pieces_nom (nom),
  KEY ix_pieces_categorie (categorie_id),
  CONSTRAINT fk_pieces_categorie FOREIGN KEY (categorie_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Codes-barres supplémentaires (UPC du fabricant, code du fournisseur, ...).
-- L'unicité entre pieces.code et pieces_codes.code est garantie par le service.
CREATE TABLE IF NOT EXISTS pieces_codes (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  piece_id  INT UNSIGNED NOT NULL,
  code      VARCHAR(64)  NOT NULL,
  type      ENUM('fabricant','fournisseur','autre') NOT NULL DEFAULT 'fabricant',
  PRIMARY KEY (id),
  UNIQUE KEY uq_pieces_codes_code (code),
  KEY ix_pieces_codes_piece (piece_id),
  CONSTRAINT fk_pieces_codes_piece FOREIGN KEY (piece_id) REFERENCES pieces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prix courant d'une pièce chez un fournisseur (un seul par pièce/fournisseur).
CREATE TABLE IF NOT EXISTS prix_fournisseurs (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  piece_id        INT UNSIGNED NOT NULL,
  fournisseur_id  INT UNSIGNED NOT NULL,
  prix            DECIMAL(12,4) NOT NULL,
  no_fournisseur  VARCHAR(60) NULL,
  date_prix       DATE NOT NULL,
  note            VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prix_piece_fournisseur (piece_id, fournisseur_id),
  KEY ix_prix_fournisseur (fournisseur_id),
  CONSTRAINT fk_prix_piece FOREIGN KEY (piece_id) REFERENCES pieces (id) ON DELETE CASCADE,
  CONSTRAINT fk_prix_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs (id),
  CONSTRAINT ck_prix_positif CHECK (prix >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prix_fournisseurs_hist (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  piece_id        INT UNSIGNED NOT NULL,
  fournisseur_id  INT UNSIGNED NOT NULL,
  prix            DECIMAL(12,4) NOT NULL,
  date_prix       DATE NOT NULL,
  utilisateur_id  INT UNSIGNED NULL,
  cree_le         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_hist_piece (piece_id, fournisseur_id, date_prix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solde courant par pièce et emplacement. Jamais négatif.
CREATE TABLE IF NOT EXISTS stock (
  piece_id        INT UNSIGNED NOT NULL,
  emplacement_id  INT UNSIGNED NOT NULL,
  quantite        DECIMAL(12,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (piece_id, emplacement_id),
  KEY ix_stock_emplacement (emplacement_id),
  CONSTRAINT fk_stock_piece FOREIGN KEY (piece_id) REFERENCES pieces (id),
  CONSTRAINT fk_stock_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id),
  CONSTRAINT ck_stock_non_negatif CHECK (quantite >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coût moyen pondéré par entreprise et pièce (conservé même à stock 0).
CREATE TABLE IF NOT EXISTS stock_couts (
  entreprise_id  INT UNSIGNED NOT NULL,
  piece_id       INT UNSIGNED NOT NULL,
  cout_moyen     DECIMAL(12,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (entreprise_id, piece_id),
  KEY ix_couts_piece (piece_id),
  CONSTRAINT fk_couts_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id),
  CONSTRAINT fk_couts_piece FOREIGN KEY (piece_id) REFERENCES pieces (id),
  CONSTRAINT ck_couts_positif CHECK (cout_moyen >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quantité minimale souhaitée, par entreprise (alertes « sous le minimum »).
CREATE TABLE IF NOT EXISTS seuils (
  entreprise_id  INT UNSIGNED NOT NULL,
  piece_id       INT UNSIGNED NOT NULL,
  minimum        DECIMAL(12,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (entreprise_id, piece_id),
  CONSTRAINT fk_seuils_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id),
  CONSTRAINT fk_seuils_piece FOREIGN KEY (piece_id) REFERENCES pieces (id) ON DELETE CASCADE,
  CONSTRAINT ck_seuils_positif CHECK (minimum >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Numérotation des documents : REC-2026-00001, TRF-..., SOR-..., AJU-..., FIN-...
CREATE TABLE IF NOT EXISTS sequences (
  type     VARCHAR(20)       NOT NULL,
  annee    SMALLINT UNSIGNED NOT NULL,
  dernier  INT UNSIGNED      NOT NULL DEFAULT 0,
  PRIMARY KEY (type, annee)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- En-tête de tous les documents qui touchent le stock.
--   reception        : fournisseur -> emplacement_id            (entrée, avec coûts)
--   transfert        : emplacement_id -> emplacement_dest_id    (même entreprise)
--   sortie           : emplacement_id -> (consommé / perdu / retourné)
--   ajustement       : correction de solde (lignes à quantité signée) ; issu d'un comptage ou manuel
--   facture_interne  : entreprise_id/emplacement_id -> entreprise_dest_id/emplacement_dest_id, au coût
CREATE TABLE IF NOT EXISTS documents (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero             VARCHAR(30)  NOT NULL,
  type               ENUM('reception','transfert','sortie','ajustement','facture_interne') NOT NULL,
  statut             ENUM('valide','annule') NOT NULL DEFAULT 'valide',
  date_document      DATE NOT NULL,
  entreprise_id      INT UNSIGNED NOT NULL,
  emplacement_id     INT UNSIGNED NOT NULL,
  emplacement_dest_id INT UNSIGNED NULL,
  entreprise_dest_id INT UNSIGNED NULL,
  fournisseur_id     INT UNSIGNED NULL,
  reference          VARCHAR(100) NULL,
  motif              VARCHAR(30)  NULL,
  note               TEXT NULL,
  total              DECIMAL(14,2) NOT NULL DEFAULT 0,
  utilisateur_id     INT UNSIGNED NULL,
  cree_le            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  annule_par         INT UNSIGNED NULL,
  annule_le          DATETIME NULL,
  motif_annulation   VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documents_numero (numero),
  KEY ix_documents_type_date (type, date_document),
  KEY ix_documents_entreprise (entreprise_id, date_document),
  KEY ix_documents_dest (entreprise_dest_id, date_document),
  CONSTRAINT fk_documents_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id),
  CONSTRAINT fk_documents_entreprise_dest FOREIGN KEY (entreprise_dest_id) REFERENCES entreprises (id),
  CONSTRAINT fk_documents_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id),
  CONSTRAINT fk_documents_emplacement_dest FOREIGN KEY (emplacement_dest_id) REFERENCES emplacements (id),
  CONSTRAINT fk_documents_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `quantite` est positive sauf pour un ajustement (variation signée).
CREATE TABLE IF NOT EXISTS document_lignes (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  document_id    INT UNSIGNED NOT NULL,
  piece_id       INT UNSIGNED NOT NULL,
  quantite       DECIMAL(12,3) NOT NULL,
  cout_unitaire  DECIMAL(12,4) NOT NULL DEFAULT 0,
  total_ligne    DECIMAL(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_lignes_document (document_id),
  KEY ix_lignes_piece (piece_id),
  CONSTRAINT fk_lignes_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
  CONSTRAINT fk_lignes_piece FOREIGN KEY (piece_id) REFERENCES pieces (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registre des mouvements (ajout seulement). `quantite` signée : + entrée, - sortie.
-- Une annulation de document ajoute des mouvements inverses (est_annulation = 1).
CREATE TABLE IF NOT EXISTS mouvements (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  document_id      INT UNSIGNED NOT NULL,
  date_mouvement   DATETIME NOT NULL,
  piece_id         INT UNSIGNED NOT NULL,
  emplacement_id   INT UNSIGNED NOT NULL,
  quantite         DECIMAL(12,3) NOT NULL,
  cout_unitaire    DECIMAL(12,4) NOT NULL DEFAULT 0,
  est_annulation   TINYINT(1) NOT NULL DEFAULT 0,
  utilisateur_id   INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY ix_mouv_piece_date (piece_id, date_mouvement),
  KEY ix_mouv_emplacement_date (emplacement_id, date_mouvement),
  KEY ix_mouv_document (document_id),
  CONSTRAINT fk_mouv_document FOREIGN KEY (document_id) REFERENCES documents (id),
  CONSTRAINT fk_mouv_piece FOREIGN KEY (piece_id) REFERENCES pieces (id),
  CONSTRAINT fk_mouv_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comptage d'inventaire (brouillon) : on scanne, puis on applique -> document « ajustement ».
CREATE TABLE IF NOT EXISTS comptages (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero          VARCHAR(30) NOT NULL,
  entreprise_id   INT UNSIGNED NOT NULL,
  emplacement_id  INT UNSIGNED NOT NULL,
  statut          ENUM('en_cours','applique','annule') NOT NULL DEFAULT 'en_cours',
  note            VARCHAR(255) NULL,
  cree_par        INT UNSIGNED NULL,
  cree_le         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applique_par    INT UNSIGNED NULL,
  applique_le     DATETIME NULL,
  document_id     INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comptages_numero (numero),
  KEY ix_comptages_emplacement (emplacement_id, statut),
  CONSTRAINT fk_comptages_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id),
  CONSTRAINT fk_comptages_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comptage_lignes (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  comptage_id        INT UNSIGNED NOT NULL,
  piece_id           INT UNSIGNED NOT NULL,
  quantite_comptee   DECIMAL(12,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comptage_piece (comptage_id, piece_id),
  CONSTRAINT fk_cl_comptage FOREIGN KEY (comptage_id) REFERENCES comptages (id) ON DELETE CASCADE,
  CONSTRAINT fk_cl_piece FOREIGN KEY (piece_id) REFERENCES pieces (id),
  CONSTRAINT ck_cl_positif CHECK (quantite_comptee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Utilisateurs et droits. Rôles : admin (tout), gestionnaire (opérations + coûts), employe (consultation + mouvements simples).
CREATE TABLE IF NOT EXISTS utilisateurs (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom_utilisateur     VARCHAR(50)  NOT NULL,
  nom_complet         VARCHAR(100) NOT NULL DEFAULT '',
  mot_de_passe        VARCHAR(255) NOT NULL,
  role                ENUM('admin','gestionnaire','employe') NOT NULL DEFAULT 'employe',
  actif               TINYINT(1) NOT NULL DEFAULT 1,
  tentatives_echec    INT UNSIGNED NOT NULL DEFAULT 0,
  verrouille_jusqua   DATETIME NULL,
  derniere_connexion  DATETIME NULL,
  cree_le             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_utilisateurs_nom (nom_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entreprises auxquelles un utilisateur a accès (un admin voit tout, sans ligne ici).
CREATE TABLE IF NOT EXISTS utilisateur_entreprises (
  utilisateur_id  INT UNSIGNED NOT NULL,
  entreprise_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (utilisateur_id, entreprise_id),
  CONSTRAINT fk_ue_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE,
  CONSTRAINT fk_ue_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal d'audit (connexions, changements de catalogue/prix/utilisateurs, annulations...).
CREATE TABLE IF NOT EXISTS journal (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_action     DATETIME NOT NULL,
  utilisateur_id  INT UNSIGNED NULL,
  action          VARCHAR(40) NOT NULL,
  entite          VARCHAR(40) NULL,
  entite_id       INT UNSIGNED NULL,
  details         TEXT NULL,
  ip              VARCHAR(45) NULL,
  PRIMARY KEY (id),
  KEY ix_journal_date (date_action),
  KEY ix_journal_entite (entite, entite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Données de départ ---------------------------------------------------------
INSERT INTO entreprises (id, code, nom) VALUES (1, 'BEA', 'Beauchemin'), (2, 'BCH', 'Boutique Chaleur')
  ON DUPLICATE KEY UPDATE nom = VALUES(nom);

INSERT IGNORE INTO emplacements (entreprise_id, nom, type, code_barres) VALUES
  (1, 'Entrepôt principal', 'entrepot', 'EMP-000001'),
  (2, 'Entrepôt principal', 'entrepot', 'EMP-000002');
