// Catalogos de dominio: la fuente UNICA de verdad de los valores que el negocio
// reconoce. Antes estos valores vivian duplicados en controllers, services, models y
// en el frontend; ahora todos los importan de aqui.
//
// Regla: si agregas un estado, un rol o una clave nueva, se agrega SOLO aqui y el
// frontend lo consume por GET /api/catalogos (ver controllers/tecnologias.controller.js).

// --- Cuentas ---------------------------------------------------------------
const ROLES = ['admin', 'reclutador', 'postulante'];
const ESTADOS_CUENTA = ['activa', 'pendiente', 'rechazada'];

// --- Convocatorias ---------------------------------------------------------
const ESTADOS_CONVOCATORIA = ['pendiente', 'abierta', 'cerrada', 'rechazada'];

// --- Pipeline de candidatos ------------------------------------------------
// Estados por los que pasa un candidato que el staff ya tomo de la lista viva.
const ESTADOS_CANDIDATO = ['postulado', 'consulta', 'preseleccionado', 'descartado', 'contratado'];

// Transiciones validas. "contratado" es terminal.
// (postulado -> consulta | descartado, consulta -> preseleccionado | descartado,
//  preseleccionado -> contratado | descartado, descartado -> consulta)
const TRANSICIONES = {
  postulado: ['consulta', 'descartado'],
  consulta: ['preseleccionado', 'descartado'],
  preseleccionado: ['contratado', 'descartado'],
  descartado: ['consulta'],
  contratado: []
};

// --- Umbral de enlistado ---------------------------------------------------
const KPI_MINIMO = { POR_DEFECTO: 25, MIN: 0, MAX: 100 };

// --- Cupos de la convocatoria ----------------------------------------------
// Vacantes: al llegar a esa cantidad de candidatos 'contratado' la convocatoria
// se cierra sola y su pipeline queda en solo lectura.
const CUPOS = { POR_DEFECTO: 1, MIN: 1, MAX: 999 };

// --- Catalogs de formulario ------------------------------------------------
const DISPONIBILIDADES = ['Inmediata', 'En 15 días', 'En 1 mes', 'Medio tiempo', 'No disponible'];
const MODOS_FILTRO = ['cualquiera', 'todos', 'solo'];
const NIVELES_TECNOLOGIA = ['principiante', 'basico', 'intermedio', 'avanzado', 'experto'];

// Peso de cada nivel dentro de la mitad de "calidad" del bloque de requisitos.
const NIVEL_FACTOR = { principiante: 0.1, basico: 0.25, intermedio: 0.5, avanzado: 0.75, experto: 1 };
// Orden creciente de los niveles (para comparar contra el nivel minimo pedido).
const NIVEL_ORDEN = { principiante: 1, basico: 2, intermedio: 3, avanzado: 4, experto: 5 };

// --- Formula del KPI de convocatoria ---------------------------------------
const PUNTOS_REQUISITOS = 80;   // maximo del bloque de requisitos
const PUNTOS_DISPONIBILIDAD = 10; // si la disponibilidad coincide (o no se pide)
const PARTE_COBERTURA = 0.5;    // mitad del peso de cada requisito: cobertura

// --- Configuracion del KPI de perfil --------------------------------------
// Claves escribibles de configuracion_kpi. Los cinco pesos deben sumar 100.
const CLAVES_CONFIG_KPI = [
  'peso_experiencia', 'peso_formacion', 'peso_tecnologias', 'peso_nivel', 'peso_actualidad',
  'umbral_alto', 'umbral_medio', 'anios_referencia',
  'mult_obligatorio', 'mult_deseable', 'peso_exp_afin', 'tope_anios_req'
];
const PESOS_PERFIL = ['peso_experiencia', 'peso_formacion', 'peso_tecnologias', 'peso_nivel', 'peso_actualidad'];

// --- Helpers ---------------------------------------------------------------

function esEstadoCandidato(estado) {
  return ESTADOS_CANDIDATO.includes(estado);
}

// Transiciones permitidas desde un estado. Mismo estado = no-op (no es error).
function transicionesPermitidas(desde) {
  return TRANSICIONES[desde] || [];
}

// ¿Se puede pasar de `desde` a `hasta`? Repetir el mismo estado siempre se puede.
function puedeTransitar(desde, hasta) {
  if (desde === hasta) return true;
  return transicionesPermitidas(desde).includes(hasta);
}

// Niveles de tecnologia con su factor y su orden, para el frontend.
function nivelesTecnologia() {
  return NIVELES_TECNOLOGIA.map((nombre) => ({
    nombre,
    factor: NIVEL_FACTOR[nombre],
    orden: NIVEL_ORDEN[nombre]
  }));
}

module.exports = {
  ROLES, ESTADOS_CUENTA, ESTADOS_CONVOCATORIA, ESTADOS_CANDIDATO, TRANSICIONES,
  KPI_MINIMO, CUPOS, DISPONIBILIDADES, MODOS_FILTRO, NIVELES_TECNOLOGIA, NIVEL_FACTOR, NIVEL_ORDEN,
  PUNTOS_REQUISITOS, PUNTOS_DISPONIBILIDAD, PARTE_COBERTURA,
  CLAVES_CONFIG_KPI, PESOS_PERFIL,
  esEstadoCandidato, transicionesPermitidas, puedeTransitar, nivelesTecnologia
};
