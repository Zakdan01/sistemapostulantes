# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from datetime import datetime

doc = Document()

# Márgenes
for section in doc.sections:
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

# PORTADA
doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("UNIVERSIDAD / CENTRO DE ESTUDIOS")
run.bold = True
run.font.size = Pt(14)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("CARRERA: INGENIERÍA EN SISTEMAS / DESARROLLO DE SOFTWARE")
run.font.size = Pt(12)

doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("PROYECTO: POSTULANTES V2")
run.bold = True
run.font.size = Pt(18)

doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("SISTEMA DE GESTIÓN OFICIAL POSTULANTES Y SELECCIÓN POR CONVOCATORIA")
run.font.size = Pt(14)

doc.add_paragraph()
doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("DOCUMENTACIÓN TÉCNICA Y FUNCIONAL")
run.font.size = Pt(12)

doc.add_paragraph()
doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
run.font.size = Pt(11)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Materia: Programación Web III")
run.font.size = Pt(11)

doc.add_page_break()

# ÍNDICE
doc.add_heading("ÍNDICE", level=1)
doc.add_paragraph()

indice = [
    "1. ASIGNACIÓN (CONTEXTO)",
    "2. DEFINICIÓN DEL PROBLEMA",
    "   2.1. Forma textual del problema",
    "   2.2. Política de la empresa",
    "   2.3. Subproblemas identificados",
    "3. DISEÑO DE LA BASE DE DATOS",
    "   3.1. Descripción general",
    "   3.2. Entidades principales",
    "   3.3. Reglas de integridad",
    "4. DESARROLLO E IMPLEMENTACIÓN",
    "   4.1. Arquitectura del sistema",
    "   4.2. Tecnologías utilizadas",
    "   4.3. Estructura del proyecto",
    "   4.4. Módulos principales",
    "   4.5. Cálculo de KPI",
    "   4.6. Pipeline de selección y control de cupos",
    "5. PRUEBAS DE CORRIDA",
    "   5.1. Objetivo",
    "   5.2. Suite de pruebas",
    "   5.3. Resultados",
    "6. ENTREGA FINAL",
    "   6.1. Componentes entregados",
    "   6.2. Instrucciones de despliegue",
    "   6.3. Credenciales de prueba",
    "7. CONCLUSIONES Y RECOMENDACIONES",
    "   7.1. Conclusions",
    "   7.2. Recommendations",
]

for item in indice:
    doc.add_paragraph(item)

doc.add_page_break()

# 1
doc.add_heading("1. ASIGNACIÓN (CONTEXTO)", level=1)
doc.add_paragraph(
    "El proyecto Postulantes v2 consiste en el desarrollo de una aplicación web para la gestión integral "
    "del proceso de reclutamiento y selección de personal por convocatoria. El sistema reemplaza el "
    "concepto tradicional de 'postulación' por un modelo basado en un padrón vivo de candidatos, donde "
    "estos actualizan su perfil profesional y son enlistados automáticamente para evaluación."
)
doc.add_paragraph("Objetivos principales:")
for b in [
    "Gestionar convocatorias con requisitos, cupos, umbral mínimo y responsable asignado.",
    "Mantener un padrón único de candidatos habilitados.",
    "Evaluar objetivamente mediante cálculo automatizado de KPI por convocatoria.",
    "Gestionar el pipeline de selección con transiciones validadas.",
    "Controlar vacantes con cierre automático.",
    "Implementar roles, permisos y aprobación de cuentas."
]:
    doc.add_paragraph(b, style='List Bullet')

doc.add_page_break()

# 2
doc.add_heading("2. DEFINICIÓN DEL PROBLEMA", level=1)
doc.add_heading("2.1. Forma textual del problema", level=2)
doc.add_paragraph(
    "Las consultoras de recursos humanos requieren gestionar múltiples convocatorias simultáneas, "
    "mantener seguimiento ordenado de candidatos y tomar decisiones basadas en criterios técnicos objetivos. "
    "El proceso manual genera demoras, inconsistencias y dificultad para auditar las decisiones."
)

doc.add_heading("2.2. Política de la empresa", level=2)
for ppol in [
    "No existe postulación activa: el candidato actualiza su perfil y es enlistado automáticamente.",
    "Evaluación objetiva mediante KPI ponderado por convocatoria.",
    "Solo forman parte del padrón candidatos habilitados (sin cuenta o con usuario postulante activo).",
    "Cuentas en estado pendiente requieren aprobación administrativa.",
    "El reclutador solo gestiona sus propias convocatorias.",
    "Transiciones en el pipeline son estrictamente validadas.",
    "Cierre automático al alcanzar cupos dentro de la misma transacción.",
    "Toda acción queda registrada en eventos_postulacion."
]:
    doc.add_paragraph(ppol, style='List Bullet')

doc.add_heading("2.3. Subproblemas identificados", level=2)
table = doc.add_table(rows=1, cols=2)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Subproblema'
hdr[1].text = 'Solución'
for s, sol in [
    ("Gestión de convocatorias", "Requisitos, cupos, kpi_minimo, estado, responsable."),
    ("Padrón vivo", "Filtrado por habilitación con cache 60s."),
    ("Cálculo de KPI", "Ponderado: requisitos 80 + experiencia afín + disponibilidad."),
    ("Pipeline", "Estados validados, snapshots, bitácora."),
    ("Control de cupos", "Transacción con FOR UPDATE y cierre automático."),
    ("Permisos y alcance", "Roles y scoping por creada_por."),
    ("Aprobación de cuentas", "Flujo pendiente/activa/rechazada."),
]:
    r = table.add_row().cells
    r[0].text = s
    r[1].text = sol

doc.add_page_break()

# 3
doc.add_heading("3. DISEÑO DE LA BASE DE DATOS", level=1)
doc.add_heading("3.1. Descripción general", level=2)
doc.add_paragraph("Base de datos PostgreSQL 18. Esquema en backend/sql/final/esquema_final.sql, datos en backend/sql/final/datos_final.sql.")

doc.add_heading("3.2. Entidades principales", level=2)
table = doc.add_table(rows=1, cols=2)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Entidad'
hdr[1].text = 'Descripción'
for e, d in [
    ("usuarios", "Cuentas con rol, estado_cuenta, correo único"),
    ("personas", "Perfil profesional, disponibilidad, actualizado_en, correo único"),
    ("tecnologias", "Catálogo de tecnologías"),
    ("convocatorias", "Convocatorias con kpi_minimo, cupos, estado, creada_por"),
    ("convocatorias_requisitos", "Requisitos (PK compuesta, sin id)"),
    ("candidatos_convocatoria", "Pipeline con estado, kpi_al_tomar, match_pct, kpi_perfil"),
    ("experiencias", "Experiencia laboral"),
    ("formaciones", "Formación académica"),
    ("habilidades", "Habilidades"),
    ("eventos_postulacion", "Bitácora de movimientos"),
    ("configuracion_kpi", "Parámetros KPI (pesos suman 100)"),
]:
    r = table.add_row().cells
    r[0].text = e
    r[1].text = d

doc.add_heading("3.3. Reglas de integridad", level=2)
for r in [
    "personas.correo y usuarios.correo únicos",
    "convocatorias_requisitos: PK compuesta (convocatoria_id, tecnologia_id)",
    "Transacciones con SELECT ... FOR UPDATE sobre convocatorias",
    "Pesos de configuracion_kpi suman 100, umbral_medio <= umbral_alto",
    "Transiciones válidas centralizadas en domain/catalogos.js",
    "Convocatorias cerradas/rechazadas son solo lectura → 409",
]:
    doc.add_paragraph(r, style='List Bullet')

doc.add_page_break()

# 4
doc.add_heading("4. DESARROLLO E IMPLEMENTACIÓN", level=1)
doc.add_heading("4.1. Arquitectura", level=2)
doc.add_paragraph("Flujo: routes → controller → service → model → BD. Lógica de negocio en services, SQL puro en models.")
doc.add_paragraph("Fuente única de verdad: backend/src/domain/catalogos.js")

doc.add_heading("4.2. Tecnologías", level=2)
table = doc.add_table(rows=1, cols=3)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Tecnología'
hdr[1].text = 'Versión'
hdr[2].text = 'Uso'
for t, v, u in [
    ("Node.js + Express", "5.x", "Backend API REST"),
    ("PostgreSQL", "18", "Base de datos"),
    ("React", "19", "Frontend"),
    ("Vite", "8", "Build tool"),
    ("Tailwind CSS", "4", "Estilos"),
    ("node:test", "-", "Pruebas"),
]:
    r = table.add_row().cells
    r[0].text = t
    r[1].text = v
    r[2].text = u

doc.add_heading("4.3. Estructura", level=2)
doc.add_paragraph("backend/ - API REST, services, models, routes, controllers, domain")
doc.add_paragraph("frontend/ - React SPA, components, hooks, lib, pages")

doc.add_heading("4.4. Módulos principales", level=2)
table = doc.add_table(rows=1, cols=2)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Módulo'
hdr[1].text = 'Funcionalidad'
for m, f in [
    ("Autenticación", "Login, roles, guards"),
    ("Catálogos", "Estados, transiciones, roles"),
    ("Personas/Perfil", "Gestión de perfil profesional"),
    ("Convocatorias", "CRUD, requisitos, umbral, cupos"),
    ("Padrón y Ranking", "Lista viva con kpi_conv, excluidos"),
    ("Pipeline", "Toma, transiciones, snapshots, bitácora"),
    ("Cuentas", "Registro, aprobación/rechazo"),
    ("KPI", "Cálculo ponderado"),
]:
    r = table.add_row().cells
    r[0].text = m
    r[1].text = f

doc.add_heading("4.5. Cálculo de KPI", level=2)
for k in [
    "kpi_conv = 80 (requisitos 50% cobertura + 50% calidad) + peso_exp_afin + 10 disponibilidad. Cap 100.",
    "Calidad: nivel mínimo, factor por nivel, años hasta tope_anios_req.",
    "Actualidad: actuales > 0 o actualizado_en últimos 180 días.",
    "Umbral: convocatorias.kpi_minimo (default 25).",
]:
    doc.add_paragraph(k, style='List Bullet')

doc.add_heading("4.6. Pipeline y control de cupos", level=2)
for p in [
    "UPSERT al tomar candidato (PATCH /api/convocatorias/:id/candidatos/:persona_id/estado)",
    "Transiciones: postulado→consulta|descartado, consulta→preseleccionado|descartado, preseleccionado→contratado|descartado, descartado→consulta. contratado terminal.",
    "Snapshots al primer take (kpi_al_tomar, match_pct, kpi_perfil)",
    "SELECT ... FOR UPDATE para control transaccional",
    "Al contratar último cupo → cerrada con cierre_automatico: true",
    "Cupos editables si no cerrada; si quedan < contratados → cierra",
    "Cerrada/rechazada: solo lectura → 409",
]:
    doc.add_paragraph(p, style='List Bullet')

doc.add_page_break()

# 5
doc.add_heading("5. PRUEBAS DE CORRIDA", level=1)
doc.add_heading("5.1. Objetivo", level=2)
doc.add_paragraph("Validar API REST, reglas de negocio, permisos, KPI, pipeline y control de cupos.")

doc.add_heading("5.2. Suite", level=2)
table = doc.add_table(rows=1, cols=2)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Archivo'
hdr[1].text = 'Cobertura'
for t, d in [
    ("api.test.js", "Autenticación, health"),
    ("convocatorias.test.js", "CRUD, requisitos, umbral, cupos"),
    ("cuentas.test.js", "Registro, aprobación/rechazo"),
    ("scopes.test.js", "Alcance por rol"),
    ("kpiConv.test.js", "Unitarias KPI"),
]:
    r = table.add_row().cells
    r[0].text = t
    r[1].text = d

doc.add_heading("5.3. Resultados", level=2)
p = doc.add_paragraph()
run = p.add_run("84 pruebas ejecutadas - 84 aprobadas, 0 fallidas (70 integración + 14 unitarias)")
run.bold = True
run.font.size = Pt(12)
run.font.color.rgb = RGBColor(0, 128, 0)

doc.add_paragraph("Comando: cd backend && npm test")

doc.add_page_break()

# 6
doc.add_heading("6. ENTREGA FINAL", level=1)
doc.add_heading("6.1. Componentes", level=2)
for c in [
    "backend/ y frontend/",
    "backend/sql/final/esquema_final.sql y datos_final.sql",
    "backend/tools/seed-snapshots.js",
    "Suite de pruebas (84 tests)",
    "AGENTS.md",
    "Documentación .DOCX"
]:
    doc.add_paragraph(c, style='List Bullet')

doc.add_heading("6.2. Despliegue", level=2)
doc.add_paragraph("Instalación:")
doc.add_paragraph("cd backend && npm install", style='List Bullet')
doc.add_paragraph("cd frontend && npm install", style='List Bullet')
doc.add_paragraph("Base de datos:")
for d in [
    "Crear BD sistemapostulantes",
    "psql -U postgres -d sistemapostulantes -f backend/sql/final/esquema_final.sql",
    "psql -U postgres -d sistemapostulantes -f backend/sql/final/datos_final.sql",
    "Ejecutar backend desde backend/: npm start",
    "Frontend: npm run dev"
]:
    doc.add_paragraph(d, style='List Bullet')

doc.add_heading("6.3. Credenciales", level=2)
table = doc.add_table(rows=1, cols=3)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'Usuario'
hdr[1].text = 'Contraseña'
hdr[2].text = 'Rol'
for u, pw, r in [
    ("admin@consultora.com", "Admin123!", "Administrador"),
    ("reclutador1@consultora.com", "Admin123!", "Reclutador"),
    ("reclutador2@consultora.com", "Admin123!", "Reclutador"),
    ("postulante01@test.com", "Admin123!", "Postulante (activo)"),
    ("postulante14@test.com", "Admin123!", "Postulante (pendiente)"),
]:
    row = table.add_row().cells
    row[0].text = u
    row[1].text = pw
    row[2].text = r

doc.add_page_break()

# 7
doc.add_heading("7. CONCLUSIONES Y RECOMENDACIONES", level=1)
doc.add_heading("7.1. Conclusiones", level=2)
for c in [
    "Sistema robusto con padrón vivo y evaluación objetiva por KPI.",
    "Control transaccional garantiza integridad de cupos.",
    "Arquitectura por capas facilita mantenimiento.",
    "84 pruebas validan reglas críticas.",
    "Trazabilidad completa con bitácora y snapshots.",
]:
    doc.add_paragraph(c, style='List Bullet')

doc.add_heading("7.2. Recomendaciones", level=2)
for r in [
    "Sincronizar catálogos entre backend y frontend.",
    "Regenerar snapshots tras cambios en fórmula KPI.",
    "Usar BD limpia al ejecutar suite.",
    "Ejecutar backend desde directorio backend/.",
    "Validar configuración_kpi (suma 100)."
]:
    doc.add_paragraph(r, style='List Bullet')

doc.save("Documentación del Sistema Postulantes v2.docx")
print("CREADO")
