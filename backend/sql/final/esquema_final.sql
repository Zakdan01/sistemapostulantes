-- esquema_final.sql � Sistema Postulantes v2 (ESQUEMA FINAL, creacion de cero)
-- Base: sistemapostulantes. 16 tablas + vista. Incluye: nombres finales (convocatorias), 4 estados + default pendiente, jornada de 2 valores.
-- Orden: DROP limpio -> catalogos -> usuarios/personas -> dependientes -> convocatorias -> vista.
-- Roles: admin todo; reclutador ve todo + crea/cierra/mueve pipeline (no borra ni toca config) + aprueba NO; postulante solo ve abiertas y se postula.
-- Dueno de convocatoria = convocatorias.creada_por (sin tabla empresas). Se ejecuta UNA vez en base nueva, luego datos_final.sql.

-- ===== LIMPIEZA (la base se recrea de cero) =====
DROP VIEW IF EXISTS v_perfil_completo;
DROP TABLE IF EXISTS postulaciones_convocatoria, convocatorias_requisitos, convocatorias CASCADE;
DROP TABLE IF EXISTS habilidades_postulante, tecnologias, formaciones_academicas, experiencias_laborales CASCADE;
DROP TABLE IF EXISTS eventos_postulacion, personas, usuarios CASCADE;
DROP TABLE IF EXISTS configuracion_kpi CASCADE;
DROP TABLE IF EXISTS catalogo_instituciones, catalogo_nivel_formacion, catalogo_tipo_trabajo, catalogo_nivel_tecnologia, catalogo_categoria_tecnologia CASCADE;

-- ===== CATALOGOS (todo lo repetido vive aqui) =====
CREATE TABLE catalogo_categoria_tecnologia (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_categoria_tecnologia IS 'Categorias de tecnologia: lenguaje, framework, base_datos, herramienta, otro';
COMMENT ON COLUMN catalogo_categoria_tecnologia.nombre IS 'Nombre unico en minusculas';

CREATE TABLE catalogo_nivel_tecnologia (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(30) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_nivel_tecnologia IS 'Nivel de dominio: principiante, basico, intermedio, avanzado, experto';

CREATE TABLE catalogo_tipo_trabajo (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_tipo_trabajo IS 'Jornada de la experiencia: tiempo_completo o medio_tiempo (lo que indico el pasante)';

CREATE TABLE catalogo_nivel_formacion (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_nivel_formacion IS 'Niveles academicos: tecnico, licenciatura, maestria, curso, etc.';

CREATE TABLE catalogo_instituciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(120) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_instituciones IS 'Instituciones educativas que otorgan formacion';

-- ===== CUENTAS DE ACCESO (1 admin + 2 reclutadores trabajan para la empresa; 13 postulantes con cuenta propia) =====
CREATE TABLE usuarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correo VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  rol VARCHAR(20) DEFAULT 'postulante' CHECK (rol IN ('admin','reclutador','postulante')),
  estado_cuenta VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_cuenta IN ('pendiente','activa','rechazada')),
  creado_en TIMESTAMP DEFAULT now()
);
COMMENT ON TABLE usuarios IS 'Cuentas de login: admin todo, reclutador operativo, postulante su perfil y postulaciones';
COMMENT ON COLUMN usuarios.correo IS 'Correo unico en minusculas, llave de login';
COMMENT ON COLUMN usuarios.estado_cuenta IS 'pendiente: entra limitado; activa: opera normal; rechazada: bloqueada';

-- ===== PERSONAS (quien se postula; correo = llave upsert, una fila por cuenta postulante) =====
CREATE TABLE personas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INT NULL UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) DEFAULT '',
  correo VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  direccion VARCHAR(200),
  linkedin VARCHAR(200),
  github VARCHAR(200),
  portafolio_url VARCHAR(200),
  creado_en TIMESTAMP DEFAULT now()
);
COMMENT ON TABLE personas IS 'Persona/postulante: una fila por correo unico. Su CV cuelga de aqui.';
COMMENT ON COLUMN personas.correo IS 'Unico, lower/trim. Upsert por este campo.';
CREATE INDEX idx_personas_correo ON personas (correo);
CREATE INDEX idx_usuarios_estado ON usuarios (estado_cuenta);

-- ===== EVENTOS DE POSTULACION (cuando se postula; delgado, no copia CV) =====
CREATE TABLE eventos_postulacion (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NULL,
  disponibilidad VARCHAR(30) DEFAULT 'Inmediata'
    CHECK (disponibilidad IN ('Inmediata','En 15 días','En 1 mes','Medio tiempo','No disponible')),
  creado_en TIMESTAMP DEFAULT now()
);
COMMENT ON TABLE eventos_postulacion IS 'Cada vez que una persona se postula: fecha/hora/disponibilidad. No copia el CV.';
CREATE INDEX idx_eventos_persona ON eventos_postulacion (persona_id);

-- ===== EXPERIENCIAS LABORALES (cuelgan de la persona) =====
CREATE TABLE experiencias_laborales (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  empresa VARCHAR(150) NOT NULL,
  cargo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  tipo_trabajo_id INT REFERENCES catalogo_tipo_trabajo(id),
  fecha_inicio DATE,
  fecha_fin DATE NULL,
  es_actual SMALLINT DEFAULT 0 CHECK (es_actual IN (0,1)),
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_inicio <= fecha_fin)
);
COMMENT ON TABLE experiencias_laborales IS 'Historial laboral de la persona. fecha_fin NULL + es_actual=1 si sigue trabajando.';
CREATE INDEX idx_experiencias_persona ON experiencias_laborales (persona_id);

-- ===== FORMACIONES ACADEMICAS (cuelgan de la persona) =====
CREATE TABLE formaciones_academicas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  institucion_id INT REFERENCES catalogo_instituciones(id),
  titulo VARCHAR(200) NOT NULL,
  nivel_id INT REFERENCES catalogo_nivel_formacion(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  certificado_url VARCHAR(300),
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_inicio <= fecha_fin)
);
COMMENT ON TABLE formaciones_academicas IS 'Estudios de la persona: institucion + titulo + nivel + fechas.';
CREATE INDEX idx_formaciones_persona ON formaciones_academicas (persona_id);

-- ===== TECNOLOGIAS (catalogo unico de lo que saben) =====
CREATE TABLE tecnologias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  categoria_id INT NOT NULL REFERENCES catalogo_categoria_tecnologia(id)
);
COMMENT ON TABLE tecnologias IS 'Catalogo unico de tecnologias en minusculas. categoria obligatoria.';
CREATE INDEX idx_tecnologias_nombre ON tecnologias (nombre);

-- ===== HABILIDADES DEL POSTULANTE (puente N:M persona-tecnologia con nivel+anios) =====
CREATE TABLE habilidades_postulante (
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tecnologia_id INT NOT NULL REFERENCES tecnologias(id) ON DELETE CASCADE,
  nivel_id INT REFERENCES catalogo_nivel_tecnologia(id),
  anios_uso DECIMAL(4,1) DEFAULT 0 CHECK (anios_uso >= 0),
  PRIMARY KEY (persona_id, tecnologia_id)
);
COMMENT ON TABLE habilidades_postulante IS 'Que sabe cada persona: tecnologia + nivel + anios de uso.';
CREATE INDEX idx_hab_tecnologia ON habilidades_postulante (tecnologia_id);

-- ===== CONFIGURACION DEL KPI (pesos suman 100 + umbrales) =====
CREATE TABLE configuracion_kpi (
  clave VARCHAR(50) PRIMARY KEY,
  valor DECIMAL(8,2) NOT NULL
);
COMMENT ON TABLE configuracion_kpi IS 'Ponderacion de los indicadores KPI. Los 5 pesos deben sumar 100. Solo admin.';

-- ===== convocatorias (convocatorias; dueno = creada_por. Reclutador ve todo, solo crea/cierra las suyas operativamente) =====
CREATE TABLE convocatorias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT,
  anios_min DECIMAL(4,1) DEFAULT 0 CHECK (anios_min >= 0),
  disponibilidad VARCHAR(30) NULL
    CHECK (disponibilidad IS NULL OR disponibilidad IN ('Inmediata','En 15 días','En 1 mes','Medio tiempo','No disponible')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','abierta','cerrada','rechazada')),
  creada_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creada_en TIMESTAMP DEFAULT now()
);
COMMENT ON TABLE convocatorias IS 'Convocatorias: titulo + requisitos + estado. creada_por indica el dueno (admin o reclutador).';
CREATE INDEX idx_convocatorias_estado ON convocatorias (estado);

CREATE TABLE convocatorias_requisitos (
  convocatoria_id INT NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  tecnologia_id INT NOT NULL REFERENCES tecnologias(id) ON DELETE RESTRICT,
  obligatorio BOOLEAN DEFAULT true,
  nivel_minimo INT NULL REFERENCES catalogo_nivel_tecnologia(id),
  PRIMARY KEY (convocatoria_id, tecnologia_id)
);
COMMENT ON TABLE convocatorias_requisitos IS 'Que tecnologias pide cada convocatoria, si son obligatorias y con qué nivel mínimo (NULL = sin mínimo).';
CREATE INDEX idx_requisitos_tecnologia ON convocatorias_requisitos (tecnologia_id);

CREATE TABLE postulaciones_convocatoria (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  convocatoria_id INT NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  evento_id INT NULL REFERENCES eventos_postulacion(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'postulado'
    CHECK (estado IN ('postulado','preseleccionado','descartado','contratado')),
  kpi_al_postular INT NULL,
  match_pct DECIMAL(5,2) NULL,
  kpi_perfil INT NULL,
  creada_en TIMESTAMP DEFAULT now(),
  UNIQUE (convocatoria_id, persona_id)
);
COMMENT ON TABLE postulaciones_convocatoria IS 'Pipeline: quien se postulo a que convocatoria y en que estado va. El postulante solo ve las suyas.';
CREATE INDEX idx_postulaciones_persona ON postulaciones_convocatoria (persona_id);
CREATE INDEX idx_postulaciones_convocatoria ON postulaciones_convocatoria (convocatoria_id);

-- ===== VISTA RESUMEN (solo lectura; el KPI se calcula en el servidor) =====
CREATE OR REPLACE VIEW v_perfil_completo AS
SELECT
  p.id AS persona_id, p.nombres, p.apellidos, p.correo,
  COALESCE(e.total_eventos,0) AS total_eventos,
  COALESCE(x.total_experiencias,0) AS total_experiencias,
  COALESCE(f.total_formaciones,0) AS total_formaciones,
  COALESCE(h.total_habilidades,0) AS total_habilidades,
  COALESCE(h.anios_max,0) AS anios_max_tecnologia
FROM personas p
LEFT JOIN (SELECT persona_id, COUNT(*) AS total_eventos FROM eventos_postulacion GROUP BY persona_id) e ON e.persona_id=p.id
LEFT JOIN (SELECT persona_id, COUNT(*) AS total_experiencias FROM experiencias_laborales GROUP BY persona_id) x ON x.persona_id=p.id
LEFT JOIN (SELECT persona_id, COUNT(*) AS total_formaciones FROM formaciones_academicas GROUP BY persona_id) f ON f.persona_id=p.id
LEFT JOIN (SELECT persona_id, COUNT(*) AS total_habilidades, MAX(anios_uso) AS anios_max FROM habilidades_postulante GROUP BY persona_id) h ON h.persona_id=p.id;
