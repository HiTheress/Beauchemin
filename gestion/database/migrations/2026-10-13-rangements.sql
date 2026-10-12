-- Migration : rangements (où, dans un emplacement, se trouve physiquement chaque pièce : allée, étagère, niveau).
--   1. plan_emplacements : colonnes rayon_allees, rayon_etageres, rayon_niveaux (NULL = valeur par défaut du type, voir Plan::GEOMETRIE_DEFAUT) ;
--   2. plan_emplacements : x, y, largeur, hauteur deviennent NULL-ables (une ligne peut ne porter que les rayonnages, sans place enregistrée) ;
--   3. table rangements : une position par pièce et par emplacement (le stock, lui, reste compté par pièce et par emplacement).
-- IDEMPOTENTE : on peut la rejouer sans danger (installation neuve ou existante). Rien n'est supprimé ; les places déjà enregistrées sont conservées.
-- Application : php database/migrer.php   (le démarrage Docker le fait seul)   ou   mysql <base> < database/migrations/2026-10-13-rangements.sql
-- (CREATE TABLE et ALTER TABLE exigent un compte qui a ces droits : l'administrateur de la base, comme pour schema.sql.)
-- Compatible MariaDB ET MySQL : pas d'« ADD COLUMN IF NOT EXISTS » (MariaDB seulement), la présence est testée dans information_schema.

SET NAMES utf8mb4;

SET @ddl = (SELECT IF(COUNT(*) = 0,
                      'ALTER TABLE plan_emplacements ADD COLUMN rayon_allees TINYINT UNSIGNED NULL',
                      'DO 0')
              FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements' AND column_name = 'rayon_allees');
PREPARE ddl FROM @ddl;
EXECUTE ddl;
DEALLOCATE PREPARE ddl;

SET @ddl = (SELECT IF(COUNT(*) = 0,
                      'ALTER TABLE plan_emplacements ADD COLUMN rayon_etageres TINYINT UNSIGNED NULL',
                      'DO 0')
              FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements' AND column_name = 'rayon_etageres');
PREPARE ddl FROM @ddl;
EXECUTE ddl;
DEALLOCATE PREPARE ddl;

SET @ddl = (SELECT IF(COUNT(*) = 0,
                      'ALTER TABLE plan_emplacements ADD COLUMN rayon_niveaux TINYINT UNSIGNED NULL',
                      'DO 0')
              FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements' AND column_name = 'rayon_niveaux');
PREPARE ddl FROM @ddl;
EXECUTE ddl;
DEALLOCATE PREPARE ddl;

-- Une place NULL = « pas de place enregistrée » (la tuile garde sa place automatique) ; seulement si l'une des quatre colonnes est encore NOT NULL.
SET @ddl = (SELECT IF(COUNT(*) > 0,
                      'ALTER TABLE plan_emplacements MODIFY COLUMN x SMALLINT UNSIGNED NULL, MODIFY COLUMN y SMALLINT UNSIGNED NULL, MODIFY COLUMN largeur SMALLINT UNSIGNED NULL, MODIFY COLUMN hauteur SMALLINT UNSIGNED NULL',
                      'DO 0')
              FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'plan_emplacements'
               AND column_name IN ('x', 'y', 'largeur', 'hauteur') AND is_nullable = 'NO');
PREPARE ddl FROM @ddl;
EXECUTE ddl;
DEALLOCATE PREPARE ddl;

CREATE TABLE IF NOT EXISTS rangements (
  emplacement_id  INT UNSIGNED      NOT NULL,
  piece_id        INT UNSIGNED      NOT NULL,
  allee           SMALLINT UNSIGNED NOT NULL,
  etagere         SMALLINT UNSIGNED NOT NULL,
  niveau          SMALLINT UNSIGNED NOT NULL,
  modifie_le      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modifie_par     INT UNSIGNED      NULL,
  PRIMARY KEY (emplacement_id, piece_id),
  KEY ix_rangements_piece (piece_id),
  CONSTRAINT fk_rangements_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id) ON DELETE CASCADE,
  CONSTRAINT fk_rangements_piece FOREIGN KEY (piece_id) REFERENCES pieces (id) ON DELETE CASCADE,
  CONSTRAINT ck_rangements_positif CHECK (allee > 0 AND etagere > 0 AND niveau > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
