-- 04_renombre_convocatorias.sql — vacantes -> convocatorias (conserva datos).
-- Ejecutar DESPUES de 01/02/03 en la base sistemapostulantes. Re-ejecutable.

ALTER TABLE IF EXISTS vacantes RENAME TO convocatorias;
ALTER TABLE IF EXISTS vacantes_requisitos RENAME TO convocatorias_requisitos;
ALTER TABLE IF EXISTS postulaciones_vacante RENAME TO postulaciones_convocatoria;

ALTER TABLE IF EXISTS convocatorias_requisitos RENAME COLUMN vacante_id TO convocatoria_id;
ALTER TABLE IF EXISTS postulaciones_convocatoria RENAME COLUMN vacante_id TO convocatoria_id;

COMMENT ON TABLE convocatorias IS 'Convocatorias: titulo + requisitos + estado. creada_por indica el dueno (admin o reclutador).';
COMMENT ON TABLE convocatorias_requisitos IS 'Que tecnologias pide cada convocatoria y si son obligatorias.';
COMMENT ON TABLE postulaciones_convocatoria IS 'Pipeline: quien se postulo a que convocatoria y en que estado va. El postulante solo ve las suyas.';
