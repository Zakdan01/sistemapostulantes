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

-- Config KPI: 5 pesos suman 100 + umbrales + referencia
INSERT INTO configuracion_kpi (clave, valor) VALUES
 ('peso_experiencia',25),
 ('peso_formacion',20),
 ('peso_tecnologias',25),
 ('peso_nivel',15),
 ('peso_actualidad',15),
 ('umbral_alto',80),
 ('umbral_medio',50),
 ('anios_referencia',5)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor;

-- 16 usuarios demo (hash de Admin123!, costo 10). Cambiar en produccion.
INSERT INTO usuarios (correo, password_hash, rol) VALUES
 ('admin@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','admin'),
 ('reclutador1@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador'),
 ('reclutador2@consultora.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','reclutador'),
 ('postulante01@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante02@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante03@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante04@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante05@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante06@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante07@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante08@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante09@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante10@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante11@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante12@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante'),
 ('postulante13@test.com','$2a$10$R6fBhxQieaWsUEyuTSrTyuFKUCd.M.nokjH71iJkqvGJMN2MVGgzO','postulante')
ON CONFLICT (correo) DO NOTHING;
