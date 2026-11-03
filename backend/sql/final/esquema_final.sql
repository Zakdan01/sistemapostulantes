-- =========================================================================
-- esquema_final.sql — Sistema Postulantes v2 (ESQUEMA FINAL, creación de cero)
-- Base: sistemapostulantes. 17 tablas + 1 vista.
--
-- Ejecutar UNA sola vez sobre una base nueva:
--   CREATE DATABASE sistemapostulantes;
--   psql -U postgres -d sistemapostulantes -f backend/sql/final/esquema_final.sql
--   psql -U postgres -d sistemapostulantes -f backend/sql/final/datos_final.sql
--
-- Todo va en UNA transacción: si una sentencia falla, la base queda como estaba
-- y no a medio crear.
--
-- Modelo: el postulante NO se postula. Actualiza su perfil y el sistema lo
-- enlistan solo, según el KPI de la convocatoria (convocatorias.kpi_minimo).
-- =========================================================================

BEGIN;

-- ===== LIMPIEZA (la base se recrea de cero) =====
DROP VIEW IF EXISTS v_perfil_completo CASCADE;
DROP TABLE IF EXISTS candidatos_convocatoria CASCADE;
DROP TABLE IF EXISTS convocatorias_requisitos CASCADE;
DROP TABLE IF EXISTS convocatorias CASCADE;
DROP TABLE IF EXISTS habilidades_postulante CASCADE;
DROP TABLE IF EXISTS tecnologias CASCADE;
DROP TABLE IF EXISTS formaciones_academicas CASCADE;
DROP TABLE IF EXISTS experiencias_laborales CASCADE;
DROP TABLE IF EXISTS eventos_postulacion CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS configuracion_kpi CASCADE;
DROP TABLE IF EXISTS catalogo_instituciones CASCADE;
DROP TABLE IF EXISTS catalogo_nivel_formacion CASCADE;
DROP TABLE IF EXISTS catalogo_tipo_trabajo CASCADE;
DROP TABLE IF EXISTS catalogo_nivel_tecnologia CASCADE;
DROP TABLE IF EXISTS catalogo_categoria_tecnologia CASCADE;

-- ===== CATALOGOS =====
-- Son la fuente de datos de los formularios. El backend valida contra
-- domain/catalogos.js y estos catálogos viven en la BD.
CREATE TABLE catalogo_categoria_tecnologia (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_categoria_tecnologia IS 'Categorias de tecnologia: lenguaje, framework, base_datos, herramienta, diseno, cloud y otro (fallback al crear una tecnologia nueva)';

CREATE TABLE catalogo_nivel_tecnologia (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_nivel_tecnologia IS 'Nivel de dominio: principiante, basico, intermedio, avanzado, experto';

CREATE TABLE catalogo_tipo_trabajo (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_tipo_trabajo IS 'Jornada de la experiencia: tiempo_completo o medio_tiempo (exactamente 2 valores)';

CREATE TABLE catalogo_nivel_formacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(60) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_nivel_formacion IS 'Niveles academicos: secundaria, tecnico, licenciatura, diplomado, maestria, doctorado, curso, certificacion, bootcamp, otro';

CREATE TABLE catalogo_instituciones (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(120) UNIQUE NOT NULL
);
COMMENT ON TABLE catalogo_instituciones IS 'Instituciones educativas que otorgan formacion';

-- ===== CUENTAS DE ACCESO =====
CREATE TABLE usuarios (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'postulante' CHECK (rol IN ('admin','reclutador','postulante')),
    estado_cuenta VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_cuenta IN ('pendiente','activa','rechazada')),
    creado_en TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE usuarios IS 'Cuentas de login. Una cuenta pendiente puede entrar pero queda limitada a / y /mi-perfil';
CREATE INDEX idx_usuarios_estado ON usuarios (estado_cuenta);

-- ===== PERSONAS =====
-- Una persona puede no tener cuenta (la carga el staff) y sigue siendo candidata.
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
    disponibilidad VARCHAR(30) NOT NULL DEFAULT 'Inmediata'
        CHECK (disponibilidad IN ('Inmediata','En 15 días','En 1 mes','Medio tiempo','No disponible','Contratado')),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE personas IS 'Persona/postulante: una fila por correo unico. disponibilidad = dato vivo que usa el KPI de convocatoria';
COMMENT ON COLUMN personas.disponibilidad IS 'Contratado solo lo escribe el pipeline al contratar; saca a la persona del padron hasta que ella guarde otra disponibilidad';

-- ===== EVENTOS DE POSTULACION =====
-- Bitacora de actividad del perfil (ya no se lee para el KPI).
CREATE TABLE eventos_postulacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NULL,
    disponibilidad VARCHAR(30) DEFAULT 'Inmediata'
        CHECK (disponibilidad IN ('Inmediata','En 15 días','En 1 mes','Medio tiempo','No disponible','Contratado')),
    creado_en TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_eventos_persona ON eventos_postulacion (persona_id);
CREATE INDEX idx_eventos_fecha ON eventos_postulacion (fecha);

-- ===== EXPERIENCIAS LABORALES =====
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
CREATE INDEX idx_experiencias_persona ON experiencias_laborales (persona_id);

-- ===== FORMACIONES ACADEMICAS =====
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
CREATE INDEX idx_formaciones_persona ON formaciones_academicas (persona_id);

-- ===== TECNOLOGIAS =====
-- categoria_id es NOT NULL: al crear una tecnologia desconocida se usa 'otro'.
CREATE TABLE tecnologias (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    categoria_id INT NOT NULL REFERENCES catalogo_categoria_tecnologia(id)
);

-- ===== HABILIDADES DEL POSTULANTE =====
CREATE TABLE habilidades_postulante (
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    tecnologia_id INT NOT NULL REFERENCES tecnologias(id) ON DELETE CASCADE,
    nivel_id INT REFERENCES catalogo_nivel_tecnologia(id),
    anios_uso DECIMAL(4,1) DEFAULT 0 CHECK (anios_uso >= 0),
    PRIMARY KEY (persona_id, tecnologia_id)
);
CREATE INDEX idx_hab_tecnologia ON habilidades_postulante (tecnologia_id);

-- ===== CONFIGURACION DEL KPI =====
CREATE TABLE configuracion_kpi (
    clave VARCHAR(50) PRIMARY KEY,
    valor DECIMAL(8,2) NOT NULL
);

-- ===== CONVOCATORIAS =====
-- titulo NO es unico: dos convocatorias pueden llamarse igual.
CREATE TABLE convocatorias (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT,
    anios_min DECIMAL(4,1) DEFAULT 0 CHECK (anios_min >= 0),
    disponibilidad VARCHAR(30) NULL
        CHECK (disponibilidad IS NULL OR disponibilidad IN ('Inmediata','En 15 días','En 1 mes','Medio tiempo','No disponible','Contratado')),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','abierta','cerrada','rechazada')),
    kpi_minimo SMALLINT NOT NULL DEFAULT 25 CHECK (kpi_minimo BETWEEN 0 AND 100),
    cupos SMALLINT NOT NULL DEFAULT 1 CHECK (cupos BETWEEN 1 AND 999),
    creada_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN convocatorias.kpi_minimo IS 'Umbral de enlistado (0-100). Quien no lo supera aparece en excluidos[] con su motivo';
COMMENT ON COLUMN convocatorias.cupos IS 'Vacantes (1-999). Al contratar el ultimo cupo la convocatoria se cierra sola';
CREATE INDEX idx_convocatorias_estado ON convocatorias (estado);
CREATE INDEX idx_convocatorias_creada_por ON convocatorias (creada_por);

CREATE TABLE convocatorias_requisitos (
    convocatoria_id INT NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    tecnologia_id INT NOT NULL REFERENCES tecnologias(id) ON DELETE RESTRICT,
    obligatorio BOOLEAN DEFAULT true,
    nivel_minimo INT NULL REFERENCES catalogo_nivel_tecnologia(id),
    PRIMARY KEY (convocatoria_id, tecnologia_id)
);
COMMENT ON COLUMN convocatorias_requisitos.nivel_minimo IS 'NULL = sin minimo. Si se omite al crear, se guarda basico';
CREATE INDEX idx_requisitos_tecnologia ON convocatorias_requisitos (tecnologia_id);

-- ===== PIPELINE DE CANDIDATOS =====
-- La fila la crea el staff al TOMAR a alguien de la lista viva. Los snapshots
-- se congelan en la primera toma y no se recalculan al mover el estado.
CREATE TABLE candidatos_convocatoria (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    convocatoria_id INT NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'postulado'
        CHECK (estado IN ('postulado','consulta','preseleccionado','descartado','contratado')),
    kpi_al_tomar INT NULL CHECK (kpi_al_tomar IS NULL OR kpi_al_tomar BETWEEN 0 AND 100),
    match_pct DECIMAL(5,2) NULL CHECK (match_pct IS NULL OR match_pct BETWEEN 0 AND 100),
    kpi_perfil INT NULL CHECK (kpi_perfil IS NULL OR kpi_perfil BETWEEN 0 AND 100),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (convocatoria_id, persona_id)
);
CREATE INDEX idx_candidatos_persona ON candidatos_convocatoria (persona_id);
CREATE INDEX idx_candidatos_convocatoria ON candidatos_convocatoria (convocatoria_id);
CREATE INDEX idx_candidatos_conv_estado ON candidatos_convocatoria (convocatoria_id, estado);

-- ===== VISTA RESUMEN =====
-- Útil para consultas de verificación manual (no la consume el backend).
CREATE OR REPLACE VIEW v_perfil_completo AS
SELECT
    p.id AS persona_id, p.nombres, p.apellidos, p.correo, p.disponibilidad, p.actualizado_en,
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

COMMIT;
