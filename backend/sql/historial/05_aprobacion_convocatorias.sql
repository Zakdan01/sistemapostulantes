-- 05_aprobacion_convocatorias.sql — flujo pendiente -> abierta/rechazada (+ cerrada).
-- Toda convocatoria nueva nace en 'pendiente'; solo admin aprueba/rechaza. Sin perdida.

ALTER TABLE convocatorias DROP CONSTRAINT IF EXISTS convocatorias_estado_check;
ALTER TABLE convocatorias DROP CONSTRAINT IF EXISTS vacantes_estado_check;
ALTER TABLE convocatorias
  ADD CONSTRAINT convocatorias_estado_check CHECK (estado IN ('pendiente','abierta','cerrada','rechazada'));
ALTER TABLE convocatorias ALTER COLUMN estado SET DEFAULT 'pendiente';

COMMENT ON COLUMN convocatorias.estado IS 'pendiente: espera aprobacion admin; abierta: publicada; cerrada: finalizada; rechazada: no aprobada';
