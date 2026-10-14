-- 08_nivel_minimo.sql — cada requisito puede exigir un nivel mínimo.
-- NULL = sin mínimo (conducta anterior). Sin perdida.

ALTER TABLE convocatorias_requisitos ADD COLUMN IF NOT EXISTS nivel_minimo INT NULL
  REFERENCES catalogo_nivel_tecnologia(id);
COMMENT ON COLUMN convocatorias_requisitos.nivel_minimo IS 'Nivel mínimo exigido; por debajo puntúa 0 en ese requisito (sin expulsar del ranking)';
