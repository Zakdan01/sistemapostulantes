-- 07_cuentas_pendientes.sql — el registro nace pendiente; el admin aprueba cuentas.
-- Solo auto-registro de postulante. Sin perdida: los existentes quedan activos.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_cuenta VARCHAR(20)
  DEFAULT 'pendiente' CHECK (estado_cuenta IN ('pendiente','activa','rechazada'));
UPDATE usuarios SET estado_cuenta='activa' WHERE estado_cuenta IS NULL OR estado_cuenta='pendiente';
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios (estado_cuenta);
COMMENT ON COLUMN usuarios.estado_cuenta IS 'pendiente: registrado sin aprobar (entra limitado, no postula); activa: opera normal; rechazada: bloqueada';
