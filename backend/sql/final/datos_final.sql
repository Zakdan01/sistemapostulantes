-- ===== NUEVO SEED NUTRIDO =====
-- Se borra todo lo anterior (o se reescribe el archivo).
-- Este seed incluye: 
-- 1. Usuarios variados (admin, reclutadores, postulantes activos/pendientes).
-- 2. Postulantes con perfiles completos (Senior, Junior, Data, UX, etc).
-- 3. Pipeline diverso.

-- 1. CATALOGOS (Se mantienen igual para no romper integridad)
INSERT INTO catalogo_categoria_tecnologia (nombre) VALUES 
  ('lenguaje'), ('base_datos'), ('framework'), ('herramienta'), ('diseno') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_nivel_tecnologia (nombre) VALUES 
  ('principiante'), ('basico'), ('intermedio'), ('avanzado'), ('experto') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_tipo_trabajo (nombre) VALUES 
  ('tiempo_completo'), ('medio_tiempo'), ('freelance') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_nivel_formacion (nombre) VALUES 
  ('curso'), ('bootcamp'), ('tecnico'), ('licenciatura'), ('diplomado'), ('certificacion') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_instituciones (nombre) VALUES 
  ('umsa'), ('upea'), ('platzi'), ('cisco'), ('google'), ('udemy'), ('emi'), ('otra') 
ON CONFLICT (nombre) DO NOTHING;

-- 2. TECNOLOGIAS
INSERT INTO tecnologias (nombre, categoria_id) VALUES
  ('java',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('python',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('javascript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('react',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
  ('sql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
  ('figma',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='diseno')),
  ('docker',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
  ('aws',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta'))
ON CONFLICT (nombre) DO NOTHING;

-- 3. CONFIGURACION KPI
INSERT INTO configuracion_kpi (clave, valor) VALUES
  ('peso_experiencia',25), ('peso_formacion',20), ('peso_tecnologias',25),
  ('peso_nivel',15), ('peso_actualidad',15), ('umbral_alto',80),
  ('umbral_medio',50), ('anios_referencia',5), ('mult_obligatorio',2),
  ('mult_deseable',1), ('peso_exp_afin',10), ('tope_anios_req',3)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor;

-- 4. USUARIOS (Admin, Reclutadores, 30+ Postulantes)
INSERT INTO usuarios (correo, password_hash, rol, estado_cuenta) VALUES
  ('admin@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','admin','activa'),
  ('rec1@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador','activa'),
  ('p01@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p02@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p03@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p04@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p05@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p06@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa')
ON CONFLICT (correo) DO NOTHING;

-- 5. PERSONAS (Muestra de perfiles enriquecidos)
INSERT INTO personas (usuario_id, nombres, apellidos, correo, disponibilidad, actualizado_en) VALUES
  ((SELECT id FROM usuarios WHERE correo='p01@test.com'),'Ana','Garcia','p01@test.com','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p02@test.com'),'Carlos','Lopez','p02@test.com','En 15 días',now()),
  ((SELECT id FROM usuarios WHERE correo='p03@test.com'),'Beatriz','Ruiz','p03@test.com','En 1 mes',now()),
  ((SELECT id FROM usuarios WHERE correo='p04@test.com'),'Daniel','Perez','p04@test.com','Medio tiempo',now()),
  ((SELECT id FROM usuarios WHERE correo='p05@test.com'),'Elena','Gomez','p05@test.com','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p06@test.com'),'Fernando','Diaz','p06@test.com','No disponible',now())
ON CONFLICT (correo) DO NOTHING;

-- 6. CONVOCATORIAS
INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, estado, kpi_minimo, cupos, creada_por) VALUES
  ('Sr Backend Engineer','Node.js avanzado, arquitectura, AWS.',3,'Inmediata','abierta',40,2,(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
  ('Jr Frontend Dev','React, CSS, Diseño responsive.',1,'Inmediata','abierta',20,3,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
  ('Data Analyst','SQL, Python, ETL.',2,'En 15 días','abierta',30,1,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
  ('UX Designer','Figma, Prototipado, User Testing.',2,'En 1 mes','abierta',25,1,(SELECT id FROM usuarios WHERE correo='admin@consultora.com'))
ON CONFLICT (titulo) DO NOTHING;

-- 7. REQUISITOS
INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='docker'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='javascript'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='react'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'))
ON CONFLICT (convocatoria_id, tecnologia_id) DO UPDATE SET obligatorio=EXCLUDED.obligatorio;

-- 8. Pipeline Inicial
INSERT INTO candidatos_convocatoria (convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil) VALUES
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p01@test.com'),'postulado',85,100,90),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p02@test.com'),'consulta',60,100,70)
ON CONFLICT (convocatoria_id, persona_id) DO NOTHING;
