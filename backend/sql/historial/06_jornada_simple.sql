-- 06_jornada_simple.sql — catalogo_tipo_trabajo solo jornada: tiempo_completo / medio_tiempo.
-- Remapeo simple: medio -> medio_tiempo, todo lo demas -> tiempo_completo. Sin perdida.

UPDATE experiencias_laborales SET tipo_trabajo_id =
  (SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo')
WHERE tipo_trabajo_id = (SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio');

UPDATE experiencias_laborales SET tipo_trabajo_id =
  (SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo')
WHERE tipo_trabajo_id NOT IN (
  SELECT id FROM catalogo_tipo_trabajo WHERE nombre IN ('tiempo_completo','medio_tiempo')
);

DELETE FROM catalogo_tipo_trabajo WHERE nombre NOT IN ('tiempo_completo','medio_tiempo');

COMMENT ON TABLE catalogo_tipo_trabajo IS 'Jornada de la experiencia: tiempo_completo o medio_tiempo (lo que indico el pasante)';
