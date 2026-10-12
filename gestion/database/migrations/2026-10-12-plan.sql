-- Migration : page « Plan » (plan de l'entrepôt en temps réel).
--   1. table plan_emplacements : place libre de chaque tuile (une ligne par emplacement) ;
--   2. index (emplacement_id, id) sur mouvements : le jeton de version lit le dernier mouvement de chaque emplacement sans parcourir le registre.
-- IDEMPOTENTE : on peut la rejouer sans danger (installation neuve ou existante). Rien n'est supprimé ni modifié.
-- Application : php database/migrer.php   (le démarrage Docker le fait seul)   ou   mysql <base> < database/migrations/2026-10-12-plan.sql
-- (CREATE TABLE et ALTER TABLE exigent un compte qui a ces droits : l'administrateur de la base, comme pour schema.sql.)

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS plan_emplacements (
  emplacement_id  INT UNSIGNED      NOT NULL,
  x               SMALLINT UNSIGNED NOT NULL,
  y               SMALLINT UNSIGNED NOT NULL,
  largeur         SMALLINT UNSIGNED NOT NULL,
  hauteur         SMALLINT UNSIGNED NOT NULL,
  modifie_le      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modifie_par     INT UNSIGNED      NULL,
  PRIMARY KEY (emplacement_id),
  CONSTRAINT fk_plan_emplacement FOREIGN KEY (emplacement_id) REFERENCES emplacements (id) ON DELETE CASCADE,
  CONSTRAINT ck_plan_taille CHECK (largeur > 0 AND hauteur > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MariaDB sait « ADD KEY IF NOT EXISTS », pas MySQL : on teste donc l'index dans information_schema (valable sur les deux).
SET @ddl = (SELECT IF(COUNT(*) = 0,
                      'ALTER TABLE mouvements ADD KEY ix_mouv_emplacement_id (emplacement_id, id)',
                      'DO 0')
              FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'mouvements' AND index_name = 'ix_mouv_emplacement_id');
PREPARE ddl FROM @ddl;
EXECUTE ddl;
DEALLOCATE PREPARE ddl;
