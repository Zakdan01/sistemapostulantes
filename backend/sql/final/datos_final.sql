-- datos_final.sql � Sistema Postulantes v2 (DATOS FINALES, creacion de cero)
-- Ejecutar DESPUES de esquema_final.sql. Todo inventado. Password demo: Admin123!.
-- Incluye: catalogos + 12 tecnologias + config KPI (12 claves) + 17 usuarios (1 admin, 2 reclutadores, 13 postulantes activos + 1 pendiente), luego 14 personas + 19 eventos + 27 experiencias + 20 formaciones + 31 habilidades + 8 convocatorias + 14 requisitos (con nivel mínimo) + 20 postulaciones (snapshots calculados).

-- 02_seed_catalogos.sql — catalogos + 12 tecnologias + config KPI + 16 usuarios.
-- 1 admin + 2 reclutadores (empresa) + 13 postulantes (cuenta propia). Password demo: Admin123!

INSERT INTO catalogo_categoria_tecnologia (nombre) VALUES
 ('lenguaje'),('framework'),('base_datos'),('herramienta'),('otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_nivel_tecnologia (nombre) VALUES
 ('principiante'),('basico'),('intermedio'),('avanzado'),('experto')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_tipo_trabajo (nombre) VALUES
 ('tiempo_completo'),('medio_tiempo')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_nivel_formacion (nombre) VALUES
 ('secundaria'),('tecnico'),('licenciatura'),('diplomado'),('maestria'),
 ('doctorado'),('curso'),('certificacion'),('bootcamp'),('otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_instituciones (nombre) VALUES
 ('umsa'),('upea'),('udabol'),('univalle'),('emi'),
 ('udemy'),('coursera'),('platzi'),('cisco'),('microsoft'),('google'),('otra')
ON CONFLICT (nombre) DO NOTHING;

-- 12 tecnologias (categoria obligatoria)
INSERT INTO tecnologias (nombre, categoria_id) VALUES
 ('java',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('python',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('javascript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('typescript',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('html',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('css',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='lenguaje')),
 ('sql',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
 ('postgres',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='base_datos')),
 ('react',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='framework')),
 ('nodejs',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
 ('figma',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta')),
 ('git',(SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='herramienta'))
ON CONFLICT (nombre) DO NOTHING;

-- Config KPI perfil (5 pesos suman 100 + umbrales + referencia) + KPI convocatoria
INSERT INTO configuracion_kpi (clave, valor) VALUES
 ('peso_experiencia',25),
 ('peso_formacion',20),
 ('peso_tecnologias',25),
 ('peso_nivel',15),
 ('peso_actualidad',15),
 ('umbral_alto',80),
 ('umbral_medio',50),
 ('anios_referencia',5),
 ('mult_obligatorio',2),
 ('mult_deseable',1),
 ('peso_exp_afin',10),
 ('tope_anios_req',3)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor;

-- 17 usuarios demo (hash de Admin123!, costo 10). 1 admin + 2 reclutadores + 13 postulantes activos + 1 pendiente. Cambiar en produccion.
INSERT INTO usuarios (correo, password_hash, rol, estado_cuenta) VALUES
 ('admin@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','admin','activa'),
 ('reclutador1@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador','activa'),
 ('reclutador2@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador','activa'),
 ('postulante01@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante02@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante03@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante04@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante05@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante06@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante07@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante08@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante09@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante10@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante11@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante12@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante13@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','activa'),
 ('postulante14@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante','pendiente')
ON CONFLICT (correo) DO NOTHING;

-- 14 personas: 13 activas + Nina (pendiente, perfil mínimo para probar aprobación).

-- 03_seed_datos_ejemplo.sql — datos 100% inventados (volumen medio).
-- 13 personas (una por cuenta postulante) + 18 eventos + 26 experiencias + 20 formaciones
-- + 30 habilidades + 8 convocatorias (3 admin, 3 rec1, 2 rec2) + 14 requisitos + 20 postulaciones.

-- ===== 14 PERSONAS (13 activas + Nina pendiente) =====
INSERT INTO personas (usuario_id, nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url) VALUES
 ((SELECT id FROM usuarios WHERE correo='postulante01@test.com'),'Diego','Aguilar Rojas','postulante01@test.com','71011101','Av. 6 de Agosto #123, La Paz','linkedin.com/in/diegoaguilar','github.com/diegoaguilar','diegoaguilar.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante02@test.com'),'Camila','Torres Lima','postulante02@test.com','71011102','Calle Potosi #45, El Alto','linkedin.com/in/camilatorres','github.com/camilatorres','camilatorres.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante03@test.com'),'Mateo','Mamani Choque','postulante03@test.com','71011103','Av. Arce #210, La Paz','linkedin.com/in/mateomamani','github.com/mateomamani','mateomamani.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante04@test.com'),'Valeria','Paz Quispe','postulante04@test.com','71011104','Calle Jaen #10, La Paz','linkedin.com/in/valeriapaz','github.com/valeriapaz','valeriapaz.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante05@test.com'),'Santiago','Quispe Apaza','postulante05@test.com','71011105','Calle 21 Calacoto, La Paz','linkedin.com/in/santiagoquispe','github.com/santiagoquispe','santiagoquispe.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante06@test.com'),'Luciana','Vargas Flores','postulante06@test.com','71011106','Av. Ballivian #500, El Alto','linkedin.com/in/lucianavargas','github.com/lucianavargas','lucianavargas.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante07@test.com'),'Thiago','Rios Lopez','postulante07@test.com','71011107','Calle Murillo #77, La Paz','linkedin.com/in/thiagorios','github.com/thiagorios','thiagorios.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante08@test.com'),'Emilia','Fernandez Cruz','postulante08@test.com','71011108','Av. America #900, Cochabamba','linkedin.com/in/emiliafernandez','github.com/emiliafernandez','emiliafernandez.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante09@test.com'),'Benjamin','Gutierrez Poma','postulante09@test.com','71011109','Calle Junin #321, Santa Cruz','linkedin.com/in/benjamingutierrez','github.com/benjamingutierrez','benjamingutierrez.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante10@test.com'),'Antonia','Silva Condori','postulante10@test.com','71011110','Av. Pando #150, Oruro','linkedin.com/in/antoniasilva','github.com/antoniasilva','antoniasilva.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante11@test.com'),'Joaquin','Perez Huanca','postulante11@test.com','71011111','Calle Ayacucho #60, Potosi','linkedin.com/in/joaquinperez','github.com/joaquinperez','joaquinperez.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante12@test.com'),'Florencia','Ramos Ticona','postulante12@test.com','71011112','Av. Villazon #700, Cochabamba','linkedin.com/in/florenciaramos','github.com/florenciaramos','florenciaramos.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante13@test.com'),'Dante','Castro Nina','postulante13@test.com','71011113','Calle Lanza #88, Tarija','linkedin.com/in/dantecastro','github.com/dantecastro','dantecastro.dev'),
 ((SELECT id FROM usuarios WHERE correo='postulante14@test.com'),'Nina','Choque Mamani','postulante14@test.com','71011114','Av. América #321, La Paz','','','')
ON CONFLICT (correo) DO NOTHING;

-- ===== 19 EVENTOS (p01-p05 x2, p06-p13 x1, p14 x1) =====
INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),'2026-09-08','09:10:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),'2026-10-02','10:00:00','En 15 días'),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),'2026-09-08','09:40:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),'2026-10-03','11:00:00','Medio tiempo'),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),'2026-09-10','10:30:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),'2026-10-04','12:00:00','En 1 mes'),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),'2026-09-11','09:00:00','Medio tiempo'),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),'2026-10-05','15:00:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),'2026-09-12','11:00:00','En 1 mes'),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),'2026-10-06','09:30:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),'2026-09-13','14:00:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),'2026-09-14','10:00:00','En 15 días'),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),'2026-09-15','11:30:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),'2026-09-16','09:00:00','Medio tiempo'),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),'2026-09-17','16:00:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),'2026-09-18','10:00:00','En 1 mes'),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),'2026-09-19','12:00:00','Inmediata'),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),'2026-09-20','09:00:00','No disponible'),
 ((SELECT id FROM personas WHERE correo='postulante14@test.com'),'2026-10-07','10:00:00','Inmediata');

-- ===== 27 EXPERIENCIAS (2 por persona + 1 de Nina) =====
INSERT INTO experiencias_laborales (persona_id, empresa, cargo, descripcion, tipo_trabajo_id, fecha_inicio, fecha_fin, es_actual) VALUES
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),'AndinaSoft','Desarrollador Junior','APIs REST Node + Postgres',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-01-15','2024-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),'DataLab','Freelance Frontend','Dashboards React',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2025-01-10',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),'TecnoAndes','Soporte TI','Mesa de ayuda y redes',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2021-06-01','2024-05-31',0),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),'CloudBol','Operadora Cloud','Monitoreo y backups',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-06-01',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),'InnovaTI','QA Manual','Casos de prueba',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2022-03-01','2023-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),'InnovaTI','QA Semi-senior','Automatizacion basica',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-01-15',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),'DisenAndina','Disenadora UI','Prototipos Figma',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-08-01','2024-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),'Agencia Pixel','Disenadora UX','Research + design system',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2025-01-05',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),'UMSA','Pasantia Admin','Apoyo en almacen',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2026-09-02','2026-09-15',0),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),'LogiBol','Auxiliar Logistica','Inventarios',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2025-02-01','2025-07-31',0),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),'Banco Union','Analista Junior','Reportes SQL',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2022-07-01','2024-06-30',0),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),'FinTech Andina','Analista de Datos','Tableros y ETL',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-07-15',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),'SoftMarket','Dev Frontend','SPAs React',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-04-01',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),'Freelance','Maquetador','Landing pages',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2022-01-01','2023-03-31',0),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),'EduTech','Tutora Python','Clases y mentorías',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2023-02-01','2024-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),'DataSchool','Instructora','Curso analisis de datos',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2025-01-01',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),'NetBol','Tecnico Redes','Cableado y switches',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2021-01-10','2023-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),'CloudBol','DevOps Junior','CI/CD y Docker',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-01-15',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),'MinaLab','Asistente QA','Pruebas manuales',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-05-01','2024-04-30',0),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),'SoftMarket','QA Junior','Regresion y reportes',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-05-15',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),'Taller Byte','Reparacion PCs','Hardware y software',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2022-06-01','2023-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),'TecnoAndes','Soporte Jr','Atencion usuarios',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2024-01-10',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),'Estudio Creativo','Ilustradora','Piezas digitales',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2022-03-01','2024-02-29',0),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),'Agencia Pixel','Disenadora Jr','Redes sociales',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2024-03-01',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),'RepoBol','Almacenero','Control stock',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2023-01-01','2024-12-31',0),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),'LogiBol','Operario','Despachos',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='tiempo_completo'),'2025-01-15',NULL,1),
 ((SELECT id FROM personas WHERE correo='postulante14@test.com'),'Tienda Celeste','Vendedora','Atención al cliente',(SELECT id FROM catalogo_tipo_trabajo WHERE nombre='medio_tiempo'),'2025-01-10',NULL,1);

-- ===== 20 FORMACIONES (p01-p07 x2, p08-p13 x1) =====
INSERT INTO formaciones_academicas (persona_id, institucion_id, titulo, nivel_id, fecha_inicio, fecha_fin, certificado_url) VALUES
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='umsa'),'Ingenieria de Sistemas',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2020-02-01','2024-12-15','certs/p01-lic.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='udemy'),'Node desde cero',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2025-01-10','2025-03-10','certs/p01-node.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='upea'),'Tecnico en Sistemas',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='tecnico'),'2019-02-01','2021-11-30','certs/p02-tec.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='cisco'),'Redes CCNA',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='certificacion'),'2022-03-01','2022-09-01','certs/p02-ccna.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='platzi'),'Testing Manual',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2022-01-15','2022-06-15','certs/p03-qa.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='udabol'),'Ingenieria de Software',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2020-02-01','2024-11-30','certs/p03-lic.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='coursera'),'Diseno UX',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='certificacion'),'2023-03-01','2023-09-01','certs/p04-ux.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='univalle'),'Diseno Grafico',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2019-02-01','2023-12-15','certs/p04-lic.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='emi'),'Logistica basica',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2025-05-01','2025-08-01',''),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='otra'),'Gestion de almacenes',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='diplomado'),'2025-09-01','2026-02-01','certs/p05-dip.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='umsa'),'Economia',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='licenciatura'),'2018-02-01','2022-12-15','certs/p06-lic.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='platzi'),'SQL y tableros',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2023-04-01','2023-07-01','certs/p06-sql.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='udemy'),'React avanzado',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2023-06-01','2023-10-01','certs/p07-react.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='upea'),'Informatica',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='tecnico'),'2020-02-01','2022-11-30','certs/p07-tec.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='coursera'),'Python para datos',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='certificacion'),'2022-05-01','2022-11-01','certs/p08-py.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='cisco'),'DevOps con Docker',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2023-08-01','2024-01-15','certs/p09-docker.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='platzi'),'QA desde cero',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='bootcamp'),'2023-01-10','2023-06-10','certs/p10-qa.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='google'),'Soporte TI',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='certificacion'),'2022-02-01','2022-08-01','certs/p11-sup.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='udemy'),'Ilustracion digital',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='curso'),'2021-04-01','2021-09-01','certs/p12-ilus.pdf'),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),(SELECT id FROM catalogo_instituciones WHERE nombre='otra'),'Operador logistico',(SELECT id FROM catalogo_nivel_formacion WHERE nombre='tecnico'),'2021-02-01','2022-12-15','certs/p13-tec.pdf');

-- ===== 31 HABILIDADES (p01-p04 x3, p05-p13 x2, p14 x1) =====
INSERT INTO habilidades_postulante (persona_id, tecnologia_id, nivel_id, anios_uso) VALUES
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),(SELECT id FROM tecnologias WHERE nombre='javascript'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3),
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),(SELECT id FROM tecnologias WHERE nombre='react'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante01@test.com'),(SELECT id FROM tecnologias WHERE nombre='sql'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),(SELECT id FROM tecnologias WHERE nombre='python'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),4),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),(SELECT id FROM tecnologias WHERE nombre='sql'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),2),
 ((SELECT id FROM personas WHERE correo='postulante02@test.com'),(SELECT id FROM tecnologias WHERE nombre='git'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),3),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),(SELECT id FROM tecnologias WHERE nombre='java'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1.5),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante03@test.com'),(SELECT id FROM tecnologias WHERE nombre='git'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),(SELECT id FROM tecnologias WHERE nombre='figma'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante04@test.com'),(SELECT id FROM tecnologias WHERE nombre='css'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1),
 ((SELECT id FROM personas WHERE correo='postulante05@test.com'),(SELECT id FROM tecnologias WHERE nombre='git'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='principiante'),0.5),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),(SELECT id FROM tecnologias WHERE nombre='sql'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),4),
 ((SELECT id FROM personas WHERE correo='postulante06@test.com'),(SELECT id FROM tecnologias WHERE nombre='python'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),(SELECT id FROM tecnologias WHERE nombre='react'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),3),
 ((SELECT id FROM personas WHERE correo='postulante07@test.com'),(SELECT id FROM tecnologias WHERE nombre='typescript'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),(SELECT id FROM tecnologias WHERE nombre='python'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),5),
 ((SELECT id FROM personas WHERE correo='postulante08@test.com'),(SELECT id FROM tecnologias WHERE nombre='postgres'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),(SELECT id FROM tecnologias WHERE nombre='nodejs'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante09@test.com'),(SELECT id FROM tecnologias WHERE nombre='git'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='avanzado'),4),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),(SELECT id FROM tecnologias WHERE nombre='java'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante10@test.com'),(SELECT id FROM tecnologias WHERE nombre='sql'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1.5),
 ((SELECT id FROM personas WHERE correo='postulante11@test.com'),(SELECT id FROM tecnologias WHERE nombre='css'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),1),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),(SELECT id FROM tecnologias WHERE nombre='figma'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='experto'),4),
 ((SELECT id FROM personas WHERE correo='postulante12@test.com'),(SELECT id FROM tecnologias WHERE nombre='css'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio'),2),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='principiante'),0.5),
 ((SELECT id FROM personas WHERE correo='postulante13@test.com'),(SELECT id FROM tecnologias WHERE nombre='git'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='principiante'),0.5),
 ((SELECT id FROM personas WHERE correo='postulante14@test.com'),(SELECT id FROM tecnologias WHERE nombre='html'),(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'),0.5)
ON CONFLICT (persona_id, tecnologia_id) DO UPDATE SET nivel_id=EXCLUDED.nivel_id, anios_uso=EXCLUDED.anios_uso;

-- ===== 8 CONVOCATORIAS (3 admin + 3 rec1 + 2 rec2; 7 abiertas + 1 cerrada) =====
INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, estado, creada_por) VALUES
 ('Desarrollador Junior','APIs Node + Postgres, frontend React basico',1,'Inmediata','abierta',(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
 ('Desarrollador Semi-senior','Node avanzado + diseno de BD + code review',3,'Inmediata','abierta',(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
 ('Soporte TI','Mesa de ayuda, redes y backups',1,'Medio tiempo','abierta',(SELECT id FROM usuarios WHERE correo='admin@consultora.com')),
 ('QA Manual','Casos de prueba y reportes de bugs',2,'Inmediata','abierta',(SELECT id FROM usuarios WHERE correo='reclutador1@consultora.com')),
 ('Diseno UI','Prototipos Figma + design system',2,'Medio tiempo','abierta',(SELECT id FROM usuarios WHERE correo='reclutador1@consultora.com')),
 ('Analista de Datos Junior','SQL + tableros + Python basico',1,'Inmediata','abierta',(SELECT id FROM usuarios WHERE correo='reclutador1@consultora.com')),
 ('DevOps Junior','CI/CD, Docker y monitoreo',1,'Inmediata','pendiente',(SELECT id FROM usuarios WHERE correo='reclutador2@consultora.com')),
 ('Pasantia Admin','Apoyo en almacen (convocatoria pasada)',0,'Medio tiempo','cerrada',(SELECT id FROM usuarios WHERE correo='reclutador2@consultora.com'));

-- ===== 14 REQUISITOS (con nivel mínimo; default básico, intermedio donde pesa) =====
INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM tecnologias WHERE nombre='javascript'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM tecnologias WHERE nombre='sql'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM tecnologias WHERE nombre='react'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Semi-senior'),(SELECT id FROM tecnologias WHERE nombre='nodejs'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Semi-senior'),(SELECT id FROM tecnologias WHERE nombre='postgres'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
 ((SELECT id FROM convocatorias WHERE titulo='Soporte TI'),(SELECT id FROM tecnologias WHERE nombre='python'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='Soporte TI'),(SELECT id FROM tecnologias WHERE nombre='git'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='QA Manual'),(SELECT id FROM tecnologias WHERE nombre='java'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='QA Manual'),(SELECT id FROM tecnologias WHERE nombre='sql'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
 ((SELECT id FROM convocatorias WHERE titulo='Diseno UI'),(SELECT id FROM tecnologias WHERE nombre='figma'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM tecnologias WHERE nombre='sql'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='intermedio')),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM tecnologias WHERE nombre='python'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='DevOps Junior'),(SELECT id FROM tecnologias WHERE nombre='nodejs'),false,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico')),
 ((SELECT id FROM convocatorias WHERE titulo='DevOps Junior'),(SELECT id FROM tecnologias WHERE nombre='git'),true,(SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'))
ON CONFLICT (convocatoria_id, tecnologia_id) DO UPDATE SET obligatorio=EXCLUDED.obligatorio, nivel_minimo=EXCLUDED.nivel_minimo;

-- ===== 20 POSTULACIONES (pipeline variado; DevOps pendiente queda en 0) =====
-- snapshots kpi_al_postular (KPI conv, INT) + kpi_perfil + match calculados con la calculadora real
INSERT INTO postulaciones_convocatoria (convocatoria_id, persona_id, estado, kpi_al_postular, match_pct, kpi_perfil) VALUES
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM personas WHERE correo='postulante01@test.com'),'preseleccionado',50,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM personas WHERE correo='postulante03@test.com'),'postulado',5,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Junior'),(SELECT id FROM personas WHERE correo='postulante07@test.com'),'postulado',22,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Semi-senior'),(SELECT id FROM personas WHERE correo='postulante01@test.com'),'postulado',10,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Semi-senior'),(SELECT id FROM personas WHERE correo='postulante09@test.com'),'preseleccionado',14,50,100),
 ((SELECT id FROM convocatorias WHERE titulo='Desarrollador Semi-senior'),(SELECT id FROM personas WHERE correo='postulante02@test.com'),'postulado',5,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='Soporte TI'),(SELECT id FROM personas WHERE correo='postulante02@test.com'),'contratado',55,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Soporte TI'),(SELECT id FROM personas WHERE correo='postulante11@test.com'),'postulado',5,0,85),
 ((SELECT id FROM convocatorias WHERE titulo='Soporte TI'),(SELECT id FROM personas WHERE correo='postulante09@test.com'),'descartado',55,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='QA Manual'),(SELECT id FROM personas WHERE correo='postulante03@test.com'),'postulado',8,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='QA Manual'),(SELECT id FROM personas WHERE correo='postulante10@test.com'),'contratado',24,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='QA Manual'),(SELECT id FROM personas WHERE correo='postulante01@test.com'),'descartado',23,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Diseno UI'),(SELECT id FROM personas WHERE correo='postulante04@test.com'),'preseleccionado',70,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Diseno UI'),(SELECT id FROM personas WHERE correo='postulante12@test.com'),'postulado',85,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM personas WHERE correo='postulante06@test.com'),'preseleccionado',63,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM personas WHERE correo='postulante08@test.com'),'postulado',50,50,100),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM personas WHERE correo='postulante02@test.com'),'postulado',25,100,100),
 ((SELECT id FROM convocatorias WHERE titulo='Analista de Datos Junior'),(SELECT id FROM personas WHERE correo='postulante09@test.com'),'postulado',5,0,100),
 ((SELECT id FROM convocatorias WHERE titulo='Pasantia Admin'),(SELECT id FROM personas WHERE correo='postulante05@test.com'),'contratado',85,100,85),
 ((SELECT id FROM convocatorias WHERE titulo='Pasantia Admin'),(SELECT id FROM personas WHERE correo='postulante13@test.com'),'postulado',85,100,85)
ON CONFLICT (convocatoria_id, persona_id) DO NOTHING;
