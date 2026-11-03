-- ===== NUEVO SEED NUTRIDO Y AMPLIADO =====
-- Se borra todo lo anterior (o se reescribe el archivo).
-- Este seed incluye:
-- 1. Usuarios variados (admin, reclutadores, 30+ postulantes activos/pendientes).
-- 2. Postulantes con perfiles completos y diversos (Senior, Junior, Data, UX, DevOps, etc).
-- 3. Pipeline diverso y completo.-- 1. CATALOGOS
INSERT INTO catalogo_categoria_tecnologia (nombre) VALUES
('lenguaje'), ('base_datos'), ('framework'), ('herramienta'), ('diseno'), ('cloud')
ON CONFLICT (nombre) DO NOTHING;INSERT INTO catalogo_nivel_tecnologia (nombre) VALUES
('principiante'), ('basico'), ('intermedio'), ('avanzado'), ('experto')
ON CONFLICT (nombre) DO NOTHING;INSERT INTO catalogo_tipo_trabajo (nombre) VALUES
('tiempo_completo'), ('medio_tiempo'), ('freelance'), ('remoto')
ON CONFLICT (nombre) DO NOTHING;INSERT INTO catalogo_nivel_formacion (nombre) VALUES
('curso'), ('bootcamp'), ('tecnico'), ('licenciatura'), ('diplomado'), ('certificacion')
ON CONFLICT (nombre) DO NOTHING;INSERT INTO catalogo_instituciones (nombre) VALUES
('umsa'), ('upea'), ('platzi'), ('cisco'), ('google'), ('udemy'), ('emi'), ('aws'), ('otra')
ON CONFLICT (nombre) DO NOTHING;-- 2. TECNOLOGIAS
INSERT INTO tecnologias (nombre, categoria_id) VALUES
('java',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
('python',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
('javascript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
('typescript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
('react',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
('angular',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
('spring boot',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
('sql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
('postgresql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
('mongodb',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
('figma',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='diseno')),
('docker',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
('kubernetes',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
('aws',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='cloud')),
('git',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta'))
ON CONFLICT (nombre) DO NOTHING;-- 3. CONFIGURACION KPI
INSERT INTO configuracion_kpi (clave, valor) VALUES
('peso_experiencia',25), ('peso_formacion',20), ('peso_tecnologias',25),
('peso_nivel',15), ('peso_actualidad',15), ('umbral_alto',80),
('umbral_medio',50), ('anios_referencia',5), ('mult_obligatorio',2),
('mult_deseable',1), ('peso_exp_afin',10), ('tope_anios_req',3)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor;-- 4. USUARIOS (Admin, Reclutadores, 30 Postulantes)
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
('p09@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p10@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p11@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p12@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p13@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p14@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p15@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p16@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p17@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p18@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p19@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p20@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p21@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p22@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p23@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p24@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p25@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p26@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p27@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p28@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p29@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
('p30@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa')
ON CONFLICT (correo) DO NOTHING;-- 5. PERSONAS (30+ Perfiles enriquecidos)
INSERT INTO personas (usuario_id, nombres, apellidos, correo, disponibilidad, actualizado_en) VALUES
((SELECT id FROM usuarios WHERE correo='p01@test.com'),'Ana','Garcia','p01@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p02@test.com'),'Carlos','Lopez','p02@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p03@test.com'),'Beatriz','Ruiz','p03@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p04@test.com'),'Daniel','Perez','p04@test.com','Medio tiempo',now()),
((SELECT id FROM usuarios WHERE correo='p05@test.com'),'Elena','Gomez','p05@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p06@test.com'),'Fernando','Diaz','p06@test.com','No disponible',now()),
((SELECT id FROM usuarios WHERE correo='p07@test.com'),'Gabriela','Solares','p07@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p08@test.com'),'Hector','Vargas','p08@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p09@test.com'),'Isabel','Mamani','p09@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p10@test.com'),'Jorge','Quispe','p10@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p11@test.com'),'Karen','Rojas','p11@test.com','Medio tiempo',now()),
((SELECT id FROM usuarios WHERE correo='p12@test.com'),'Luis','Salazar','p12@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p13@test.com'),'Mariana','Torrez','p13@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p14@test.com'),'Nicolas','Chavez','p14@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p15@test.com'),'Olivia','Medrano','p15@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p16@test.com'),'Pablo','Espejo','p16@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p17@test.com'),'Quimey','Flores','p17@test.com','Medio tiempo',now()),
((SELECT id FROM usuarios WHERE correo='p18@test.com'),'Rodrigo','Miranda','p18@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p19@test.com'),'Sofia','Aliaga','p19@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p20@test.com'),'Tomas','Zalles','p20@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p21@test.com'),'Valeria','Cruz','p21@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p22@test.com'),'Walter','Condori','p22@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p23@test.com'),'Ximena','Paz','p23@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p24@test.com'),'Yamil','Justiniano','p24@test.com','Medio tiempo',now()),
((SELECT id FROM usuarios WHERE correo='p25@test.com'),'Zoe','Montaño','p25@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p26@test.com'),'Alejandro','Rios','p26@test.com','En 15 días',now()),
((SELECT id FROM usuarios WHERE correo='p27@test.com'),'Brenda','Nuñez','p27@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p28@test.com'),'Cristian','Valdez','p28@test.com','En 1 mes',now()),
((SELECT id FROM usuarios WHERE correo='p29@test.com'),'Daniela','Acosta','p29@test.com','Inmediata',now()),
((SELECT id FROM usuarios WHERE correo='p30@test.com'),'Ernesto','Pinto','p30@test.com','Medio tiempo',now())
ON CONFLICT (correo) DO NOTHING;-- 6. CONVOCATORIAS
INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, estado, kpi_minimo, cupos, creada_por) VALUES
('Sr Backend Engineer','Node.js / Python avanzado, arquitectura, microservicios, AWS.',3,'Inmediata','abierta',40,2,(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
('Jr Frontend Dev','React, CSS, Diseño responsive y control de versiones.',1,'Inmediata','abierta',20,3,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
('Data Analyst','SQL, Python, ETL, visualización de datos.',2,'En 15 días','abierta',30,1,(SELECT id FROM usuarios WHERE correo='rec1@consultora.com')),
('UX Designer','Figma, Prototipado, User Testing, wireframing.',2,'En 1 mes','abierta',25,1,(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
('DevOps Specialist','Docker, Kubernetes, AWS, pipelines CI/CD.',3,'Inmediata','abierta',45,1,(SELECT id FROM usuarios WHERE correo='rec2@consultora.com')),
('Fullstack Developer','Java, Spring Boot, React, PostgreSQL.',2,'Inmediata','abierta',35,2,(SELECT id FROM usuarios WHERE correo='rec2@consultora.com'))
ON CONFLICT (titulo) DO NOTHING;-- 7. REQUISITOS
INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM tecnologias WHERE nombre='docker'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='javascript'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM tecnologias WHERE nombre='react'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM tecnologias WHERE nombre='sql'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
((SELECT id FROM convocatorias WHERE titulo='DevOps Specialist'),(SELECT id FROM tecnologias WHERE nombre='docker'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado')),
((SELECT id FROM convocatorias WHERE titulo='DevOps Specialist'),(SELECT id FROM tecnologias WHERE nombre='aws'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'))
ON CONFLICT (convocatoria_id, tecnologia_id) DO UPDATE SET obligatorio=EXCLUDED.obligatorio;-- 8. Pipeline Ampliado (Múltiples candidatos en diferentes estados)
INSERT INTO candidatos_convocatoria (convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil) VALUES
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p01@test.com'),'postulado',85,100,90),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p02@test.com'),'consulta',60,100,70),
((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM personas WHERE correo='p03@test.com'),'entrevista',75,90,82),
((SELECT id FROM convocatorias WHERE titulo='UX Designer'),(SELECT id FROM personas WHERE correo='p04@test.com'),'postulado',55,80,68),
((SELECT id FROM convocatorias WHERE titulo='DevOps Specialist'),(SELECT id FROM personas WHERE correo='p05@test.com'),'seleccionado',92,95,94),
((SELECT id FROM convocatorias WHERE titulo='Fullstack Developer'),(SELECT id FROM personas WHERE correo='p06@test.com'),'rechazado',40,50,45),
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p07@test.com'),'entrevista',88,95,91),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p08@test.com'),'postulado',65,85,72),
((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM personas WHERE correo='p09@test.com'),'seleccionado',90,100,89),
((SELECT id FROM convocatorias WHERE titulo='UX Designer'),(SELECT id FROM personas WHERE correo='p10@test.com'),'consulta',50,75,60),
((SELECT id FROM convocatorias WHERE titulo='DevOps Specialist'),(SELECT id FROM personas WHERE correo='p11@test.com'),'postulado',78,88,80),
((SELECT id FROM convocatorias WHERE titulo='Fullstack Developer'),(SELECT id FROM personas WHERE correo='p12@test.com'),'entrevista',82,90,85),
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p13@test.com'),'consulta',70,80,75),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p14@test.com'),'seleccionado',85,95,88),
((SELECT id FROM convocatorias WHERE titulo='Data Analyst'),(SELECT id FROM personas WHERE correo='p15@test.com'),'postulado',68,75,70),
((SELECT id FROM convocatorias WHERE titulo='UX Designer'),(SELECT id FROM personas WHERE correo='p16@test.com'),'entrevista',72,85,79),
((SELECT id FROM convocatorias WHERE titulo='DevOps Specialist'),(SELECT id FROM personas WHERE correo='p17@test.com'),'consulta',60,70,65),
((SELECT id FROM convocatorias WHERE titulo='Fullstack Developer'),(SELECT id FROM personas WHERE correo='p18@test.com'),'postulado',79,88,82),
((SELECT id FROM convocatorias WHERE titulo='Sr Backend Engineer'),(SELECT id FROM personas WHERE correo='p19@test.com'),'seleccionado',95,100,96),
((SELECT id FROM convocatorias WHERE titulo='Jr Frontend Dev'),(SELECT id FROM personas WHERE correo='p20@test.com'),'entrevista',74,80,77)
ON CONFLICT (convocatoria_id, persona_id) DO NOTHING;