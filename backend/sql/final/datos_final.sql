-- =========================================================================
-- SEED NUTRIDO EXTENDIDO — Sistema Postulantes v2
-- =========================================================================

-- 1. CATALOGOS
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

-- 2. TECNOLOGIAS (Ampliadas con más lenguajes y herramientas)
INSERT INTO tecnologias (nombre, categoria_id) VALUES
  ('java',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('python',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('javascript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('typescript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
  ('react',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
  ('angular',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
  ('sql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
  ('postgresql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
  ('mongodb',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
  ('figma',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='diseno')),
  ('docker',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
  ('aws',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
  ('git',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta'))
ON CONFLICT (nombre) DO NOTHING;

-- 3. CONFIGURACION KPI
INSERT INTO configuracion_kpi (clave, valor) VALUES
  ('peso_experiencia',25), ('peso_formacion',20), ('peso_tecnologias',25),
  ('peso_nivel',15), ('peso_actualidad',15), ('umbral_alto',80),
  ('umbral_medio',50), ('anios_referencia',5), ('mult_obligatorio',2),
  ('mult_deseable',1), ('peso_exp_afin',10), ('tope_anios_req',3)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor;

-- 4. USUARIOS (Admin, Reclutadores y 15 Postulantes)
INSERT INTO usuarios (correo, password_hash, rol, estado_cuenta) VALUES
  ('admin@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','admin','activa'),
  ('rec1@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador','activa'),
  ('rec2@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador','activa'),
  ('p01@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p02@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p03@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p04@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p05@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p06@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p07@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p08@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p09@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','pendiente'),
  ('p10@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p11@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p12@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p13@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p14@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
  ('p15@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa')
ON CONFLICT (correo) DO NOTHING;

-- 5. PERSONAS (15 Perfiles completos con datos enriquecidos)
INSERT INTO personas (usuario_id, nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url, disponibilidad, actualizado_en) VALUES
  ((SELECT id FROM usuarios WHERE correo='p01@test.com'),'Ana','Garcia','p01@test.com','70123456','Zona Sur, La Paz','https://linkedin.com/in/ana-garcia','https://github.com/anagarcia','https://ana.dev','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p02@test.com'),'Carlos','Lopez','p02@test.com','71234567','Sopocachi, La Paz','https://linkedin.com/in/carlos-lopez','https://github.com/clopez','','En 15 días',now()),
  ((SELECT id FROM usuarios WHERE correo='p03@test.com'),'Beatriz','Ruiz','p03@test.com','72345678','Miraflores, La Paz','https://linkedin.com/in/beatriz-ruiz','https://github.com/bruiz','https://bruiz.design','En 1 mes',now()),
  ((SELECT id FROM usuarios WHERE correo='p04@test.com'),'Daniel','Perez','p04@test.com','73456789','Centro, La Paz','https://linkedin.com/in/daniel-perez','https://github.com/dperez','','Medio tiempo',now()),
  ((SELECT id FROM usuarios WHERE correo='p05@test.com'),'Elena','Gomez','p05@test.com','74567890','Calacoto, La Paz','https://linkedin.com/in/elena-gomez','https://github.com/egomez','https://elena.tech','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p06@test.com'),'Fernando','Diaz','p06@test.com','75678901','Obrajes, La Paz','https://linkedin.com/in/fernando-diaz','https://github.com/fdiaz','','No disponible',now()),
  ((SELECT id FROM usuarios WHERE correo='p07@test.com'),'Gabriela','Solares','p07@test.com','76789012','San Miguel, La Paz','https://linkedin.com/in/gabriela-solares','https://github.com/gsolares','https://gabriela.io','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p08@test.com'),'Héctor','Vargas','p08@test.com','77890123','Villa Fátima, La Paz','https://linkedin.com/in/hector-vargas','https://github.com/hvargas','','En 15 días',now()),
  ((SELECT id FROM usuarios WHERE correo='p09@test.com'),'Irene','Mamani','p09@test.com','78901234','El Alto','https://linkedin.com/in/irene-mamani','https://github.com/imamani','','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p10@test.com'),'Jorge','Quispe','p10@test.com','79012345','Achumani, La Paz','https://linkedin.com/in/jorge-quispe','https://github.com/jquispe','https://jorgeq.dev','En 1 mes',now()),
  ((SELECT id FROM usuarios WHERE correo='p11@test.com'),'Karla','Mendoza','p11@test.com','70111222','Centro, La Paz','https://linkedin.com/in/karla-mendoza','https://github.com/kmendoza','','Medio tiempo',now()),
  ((SELECT id FROM usuarios WHERE correo='p12@test.com'),'Luis','Flores','p12@test.com','71222333','Sopocachi, La Paz','https://linkedin.com/in/luis-flores','https://github.com/lflores','https://luisflores.dev','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p13@test.com'),'Mariana','Rojas','p13@test.com','72333444','Miraflores, La Paz','https://linkedin.com/in/mariana-rojas','https://github.com/mrojas','','En 15 días',now()),
  ((SELECT id FROM usuarios WHERE correo='p14@test.com'),'Nicolas','Torres','p14@test.com','73444555','Cota Cota, La Paz','https://linkedin.com/in/nicolas-torres','https://github.com/ntorres','https://nico.tech','Inmediata',now()),
  ((SELECT id FROM usuarios WHERE correo='p15@test.com'),'Paola','Vargas','p15@test.com','74555666','San Pedro, La Paz','https://linkedin.com/in/paola-vargas','https://github.com/pvargas','','No disponible',now())
ON CONFLICT (correo) DO NOTHING;

-- 6. CONVOCATORIAS
INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, estado, kpi_minimo, cupos, creada_por) VALUES
  ('Sr Backend Engineer','Node.js y Python avanzado, arquitectura de microservicios, AWS.',3,'Inmediata','abierta',40,2,(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
  ('Jr Frontend Dev','React, CSS moderno, diseño responsive y control de versiones.',1,'Inmediata','abierta',20,3,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
  ('Data Analyst','SQL avanzado, Python para análisis, modelado de datos y ETL.',2,'En 15 días','abierta',30,1,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
  ('UX Designer','Figma, Design Systems, Prototipado interactivo y User Testing.',2,'En 1 mes','abierta',25,1,(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
  ('Fullstack Developer','JavaScript, TypeScript, React y PostgreSQL.',2,'Inmediata','abierta',35,2,(SELECT id FROM usuarios WHERE correo='rec2@consultora.com'))
ON CONFLICT (titulo) DO NOTHING;

-- 7. REQUISITOS DE CONVOCATORIAS
INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='docker'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='javascript'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='react'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
  ((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM tecnologias WHERE nombre='sql'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
  ((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
  ((SELECT id FROM convocatorias WHERE titulo='UX Designer'),(SELECT id FROM tecnologias WHERE nombre='figma'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
  ((SELECT id FROM convocatorias WHERE titulo='Fullstack Developer'),(SELECT id FROM tecnologias WHERE nombre='typescript'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'))
ON CONFLICT (convocatoria_id, tecnologia_id) DO UPDATE SET obligatorio=EXCLUDED.obligatorio;

-- 8. EXPERIENCIAS LABORALES PARA POSTULANTES
INSERT INTO experiencias_laborales (persona_id, empresa, cargo, descripcion, tipo_trabajo_id, fecha_inicio, fecha_fin, es_actual) VALUES
  ((SELECT id FROM personas WHERE correo='p01@test.com'),'TechBolivia','Senior Backend Dev','Liderazgo de APIs y microservicios en Python.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2021-02-01',NULL,1),
  ((SELECT id FROM personas WHERE correo='p02@test.com'),'SoftWeb','Frontend Junior','Desarrollo de interfaces con React.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-01-15','2025-01-10',0),
  ((SELECT id FROM personas WHERE correo='p03@test.com'),'Agencia Creativa Pixel','UI/UX Designer','Creación de flujos de usuario y prototipos en Figma.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2022-06-01',NULL,1),
  ((SELECT id FROM personas WHERE correo='p04@test.com'),'DataCorp','Analista Junior de Datos','Consultas SQL complejas y reportes.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2024-03-01',NULL,1),
  ((SELECT id FROM personas WHERE correo='p05@test.com'),'CloudSolutions','DevOps & Backend Engineer','Manejo de Docker, AWS y Python.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2020-01-10',NULL,1),
  ((SELECT id FROM personas WHERE correo='p07@test.com'),'DevStudio','Fullstack Developer','Aplicaciones web con TypeScript y React.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2022-09-01',NULL,1),
  ((SELECT id FROM personas WHERE correo='p10@test.com'),'InnovaData','Data Engineer','Pipelines ETL y bases de datos PostgreSQL.',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2021-05-01',NULL,1);

-- 9. FORMACIONES ACADEMICAS
INSERT INTO formaciones_academicas (persona_id, institucion_id, titulo, nivel_id, fecha_inicio, fecha_fin) VALUES
  ((SELECT id FROM personas WHERE correo='p01@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='umsa'),'Licenciatura en Informática',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2015-02-01','2019-12-15'),
  ((SELECT id FROM personas WHERE correo='p02@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='platzi'),'Escuela de Desarrollo Web',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='bootcamp'),'2022-01-10','2022-12-20'),
  ((SELECT id FROM personas WHERE correo='p03@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='emi'),'Ingeniería Comercial con mención en Diseño',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2017-02-01','2021-11-30'),
  ((SELECT id FROM personas WHERE correo='p05@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='google'),'Certificación Cloud Architect',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='certificacion'),'2023-03-01','2023-08-01'),
  ((SELECT id FROM personas WHERE correo='p07@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='udemy'),'Master en TypeScript y React',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2023-02-01','2023-06-01');

-- 10. HABILIDADES DE LOS POSTULANTES
INSERT INTO habilidades_postulante (persona_id, tecnologia_id, nivel_id, anios_uso) VALUES
  ((SELECT id FROM personas WHERE correo='p01@test.com'),(SELECT id FROM tecnologias WHERE nombre='python'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),4.5),
  ((SELECT id FROM personas WHERE correo='p01@test.com'),(SELECT id FROM tecnologias WHERE nombre='docker'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),3.0),
  ((SELECT id FROM personas WHERE correo='p02@test.com'),(SELECT id FROM tecnologias WHERE nombre='javascript'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1.5),
  ((SELECT id FROM personas WHERE correo='p02@test.com'),(SELECT id FROM tecnologias WHERE nombre='react'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1.0),
  ((SELECT id FROM personas WHERE correo='p03@test.com'),(SELECT id FROM tecnologias WHERE nombre='figma'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3.0),
  ((SELECT id FROM personas WHERE correo='p04@test.com'),(SELECT id FROM tecnologias WHERE nombre='sql'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2.0),
  ((SELECT id FROM personas WHERE correo='p05@test.com'),(SELECT id FROM tecnologias WHERE nombre='python'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='experto'),6.0),
  ((SELECT id FROM personas WHERE correo='p05@test.com'),(SELECT id FROM tecnologias WHERE nombre='aws'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),4.0),
  ((SELECT id FROM personas WHERE correo='p07@test.com'),(SELECT id FROM tecnologias WHERE nombre='typescript'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3.0),
  ((SELECT id FROM personas WHERE correo='p07@test.com'),(SELECT id FROM tecnologias WHERE nombre='react'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3.5)
ON CONFLICT (persona_id, tecnologia_id) DO NOTHING;

-- 11. PIPELINE INICIAL AMPLIADO (Candidatos en diferentes estados)
INSERT INTO candidatos_convocatoria (convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil) VALUES
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p01@test.com'),'preseleccionado',85,100,90),
  ((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p05@test.com'),'postulado',92,100,95),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p02@test.com'),'consulta',60,100,70),
  ((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p07@test.com'),'preseleccionado',75,100,85),
  ((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM personas WHERE correo='p04@test.com'),'postulado',55,80,65),
  ((SELECT id FROM convocatorias WHERE titulo='UX Designer'),(SELECT id FROM personas WHERE correo='p03@test.com'),'preseleccionado',80,100,88),
  ((SELECT id FROM convocatorias WHERE titulo='Fullstack Developer'),(SELECT id FROM personas WHERE correo='p07@test.com'),'contratado',90,100,91)
ON CONFLICT (convocatoria_id, persona_id) DO NOTHING;