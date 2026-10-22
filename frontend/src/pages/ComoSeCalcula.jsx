import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Badge } from '../components/TablaKPI';
import { useCatalogos } from '../lib/catalogos';
import {
  Avatar,
  Aviso,
  Campo,
  EmptyState,
  PageHeader,
  Pill,
  Progress,
  Seccion,
  Skeleton,
  StatCard
} from '../components/ui';
import {
  IconoCalendario,
  IconoChispa,
  IconoDocumento,
  IconoMaletin,
  IconoObjetivo,
  IconoReloj,
  IconoTrofeo,
  IconoUsuarios
} from '../components/Iconos';

function aNumero(valor, defecto = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function fmt(valor, decimales = 2) {
  const n = Number(valor);
  return Number.isFinite(n) ? n.toFixed(decimales) : '—';
}

function pct(valor) {
  return `${Math.round(aNumero(valor) * 100)}%`;
}

export function ComoSeCalcula() {
  const catalogos = useCatalogos();
  const [cfg, setCfg] = useState(null);
  const [convs, setConvs] = useState([]);
  const [convId, setConvId] = useState('');
  const [demo, setDemo] = useState(null);
  const [err, setErr] = useState('');
  const [errDemo, setErrDemo] = useState('');
  const [cargandoDemo, setCargandoDemo] = useState(false);

  useEffect(() => {
    Promise.all([api('/api/configuracion'), api('/api/convocatorias')])
      .then(([config, lista]) => {
        setCfg(config);
        setConvs(lista);
        const conCandidatos = lista.find((c) => Number(c.total_candidatos) > 0 && c.requisitos);
        const conRequisitos = lista.find((c) => c.requisitos);
        const elegida = conCandidatos || conRequisitos || lista[0];
        if (elegida) {
          setCargandoDemo(true);
          setConvId(String(elegida.id));
        }
      })
      .catch((ex) => setErr(ex.message));
  }, []);

  useEffect(() => {
    if (!convId) return undefined;
    let activo = true;
    api(`/api/convocatorias/${convId}/ranking`)
      .then((r) => { if (activo) { setDemo(r); setErrDemo(''); } })
      .catch((ex) => {
        if (activo) {
          setDemo(null);
          setErrDemo(ex.message);
        }
      })
      .finally(() => { if (activo) setCargandoDemo(false); });
    return () => { activo = false; };
  }, [convId]);

  if (err) {
    return (
      <div className="space-y-4">
        <PageHeader titulo="Cómo se calcula el puntaje" icono={IconoChispa} />
        <Aviso tono="error" titulo="No se pudo cargar la configuración">{err}</Aviso>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="skeleton h-8 w-80 max-w-full" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="skeleton h-64" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  const multOb = aNumero(cfg.mult_obligatorio, 2);
  const multDe = aNumero(cfg.mult_deseable, 1);
  const tope = aNumero(cfg.tope_anios_req, 3) || 3;
  const pesoExp = aNumero(cfg.peso_exp_afin, 10);
  const maxReq = aNumero(catalogos && catalogos.puntos && catalogos.puntos.requisitos, 80);
  const maxDisp = aNumero(catalogos && catalogos.puntos && catalogos.puntos.disponibilidad, 10);
  const umbralPorDefecto = aNumero(catalogos && catalogos.kpi_minimo_por_defecto, 25);
  // Niveles con su factor: los manda el backend (GET /api/catalogos).
  const niveles = ((catalogos && catalogos.niveles_tecnologia) || []).slice().sort((a, b) => b.orden - a.orden);
  const denominadorEjemplo = multOb + multDe;
  const pesoObligatorioEjemplo = denominadorEjemplo ? (maxReq * multOb) / denominadorEjemplo : 0;
  const pesoDeseableEjemplo = denominadorEjemplo ? (maxReq * multDe) / denominadorEjemplo : 0;
  const aniosEjemplo = [...new Set([0, Math.min(1, tope), Math.min(2, tope), tope])];

  const pesosPerfil = [
    ['Experiencia', aNumero(cfg.peso_experiencia), 'tiene alguna experiencia o años máximos ≥ referencia'],
    ['Formación', aNumero(cfg.peso_formacion), 'tiene al menos una formación'],
    ['Tecnologías', aNumero(cfg.peso_tecnologias), 'tiene al menos una habilidad'],
    ['Nivel', aNumero(cfg.peso_nivel), 'tiene al menos una habilidad en intermedio o superior'],
    ['Actualidad', aNumero(cfg.peso_actualidad), 'tiene una experiencia actual o actualizó su perfil en los últimos 180 días']
  ];

  const reqsDemo = (demo && demo.convocatoria && demo.convocatoria.requisitos) || [];
  // El backend ya manda el peso maximo de cada requisito: la UI solo lo muestra.
  const reqsConPeso = reqsDemo.map((r) => ({ ...r, peso: aNumero(r.peso_maximo) }));

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Cómo se calcula el puntaje"
        subtitulo="El ranking de una convocatoria usa el KPI de convocatoria: se calcula contra los requisitos de esa convocatoria, no contra la calidad general del perfil."
        icono={IconoChispa}
      >
        <Pill tono="cyan" punto>Ranking en vivo</Pill>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={maxReq} etiqueta="Puntos por requisitos" hint="Bloque principal del KPI" icono={IconoObjetivo} tono="cyan" />
        <StatCard valor={fmt(pesoExp, 0)} etiqueta="Experiencia afín" hint="Máximo adicional" icono={IconoMaletin} tono="violet" />
        <StatCard valor={maxDisp} etiqueta="Disponibilidad" hint="Si coincide con la pedida" icono={IconoReloj} tono="emerald" />
        <StatCard valor={umbralPorDefecto} etiqueta="Umbral por defecto" hint="Se ajusta por convocatoria" icono={IconoTrofeo} tono="amber" />
      </div>

      <Seccion titulo="Fórmula general" icono={IconoChispa}>
        <pre className="formula">
          <code>KPI conv. = (puntos de requisitos × factor de años mínimos) + experiencia afín + disponibilidad</code>
        </pre>
        <div className="tbl-wrap mt-4">
          <table className="min-w-full tbl">
            <thead>
              <tr>
                <th className="text-left">Bloque</th>
                <th className="text-right">Máximo</th>
                <th className="text-left">Qué mide</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Requisitos</td><td className="text-right font-semibold tabular-nums">{maxReq}</td><td>Cobertura de lenguajes/frameworks + nivel y años de uso</td></tr>
              <tr><td>Experiencia afín</td><td className="text-right font-semibold tabular-nums">{fmt(pesoExp, 0)}</td><td>Si sus experiencias mencionan tecnologías pedidas</td></tr>
              <tr><td>Disponibilidad</td><td className="text-right font-semibold tabular-nums">{maxDisp}</td><td>Si coincide con la disponibilidad pedida</td></tr>
            </tbody>
          </table>
        </div>
        <Aviso tono="info" className="mt-3">
          El resultado se limita a 100 y se redondea a 2 decimales. No hay filtro duro: quien no cumple algún requisito sigue apareciendo, pero con menos puntos.
        </Aviso>
      </Seccion>

      <Seccion titulo="1. Requisitos: cobertura, nivel y años" icono={IconoObjetivo}>
        <p className="text-sm">
          Los requisitos reparten hasta <b>{maxReq} puntos</b>. El peso de cada requisito depende de si es obligatorio o deseable:
        </p>
        <pre className="formula mt-3">
          <code>{`peso del requisito = ${maxReq} × multiplicador / suma de multiplicadores
multiplicador = ${fmt(multOb)} si es obligatorio, ${fmt(multDe)} si es deseable`}</code>
        </pre>
        <div className="tbl-wrap mt-4">
          <table className="min-w-full tbl">
            <thead>
              <tr>
                <th className="text-left">Ejemplo: 1 obligatorio + 1 deseable</th>
                <th className="text-right">Multiplicador</th>
                <th className="text-right">Peso máximo</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Requisito obligatorio</td><td className="text-right tabular-nums">×{fmt(multOb)}</td><td className="text-right font-semibold tabular-nums">{fmt(pesoObligatorioEjemplo)} pts</td></tr>
              <tr><td>Requisito deseable</td><td className="text-right tabular-nums">×{fmt(multDe)}</td><td className="text-right font-semibold tabular-nums">{fmt(pesoDeseableEjemplo)} pts</td></tr>
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-sm">
          Cada requisito se divide en dos mitades. Esto es lo que hace que <b>no alcance solo con tener un nivel alto</b>: también hay que ir cumpliendo todos los lenguajes/frameworks pedidos.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Pill tono="cyan">50% del peso</Pill>
              <p className="font-bold">Cobertura</p>
            </div>
            <p className="mt-2 text-sm">Suma si el postulante tiene la tecnología, sin importar el nivel.</p>
            <p className="mt-1 text-sm">Si falta la tecnología, pierde esta mitad y también la calidad.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Pill tono="violet">50% del peso</Pill>
              <p className="font-bold">Calidad</p>
            </div>
            <p className="mt-2 text-sm">Suma solo si alcanza el nivel mínimo pedido. Luego se multiplica por el nivel y por los años de uso.</p>
            <p className="mt-1 text-sm">Si tiene la tecnología pero está por debajo del mínimo, conserva la cobertura y pierde la calidad.</p>
          </div>
        </div>
        <pre className="formula mt-3">
          <code>{`puntos del requisito = peso × [0.5 × tiene la tecnología
                              + 0.5 × (cumple nivel mínimo × factor nivel × factor años)]`}</code>
        </pre>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold">Factor por nivel</p>
            <div className="tbl-wrap">
              <table className="min-w-full tbl">
                <thead><tr><th className="text-left">Nivel</th><th className="text-right">Vale</th></tr></thead>
                <tbody>
                  {niveles.map((n) => (
                    <tr key={n.nombre}><td>{n.nombre}</td><td className="text-right font-semibold tabular-nums">{pct(n.factor)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Factor por años de uso (tope {fmt(tope, 0)} años)</p>
            <div className="tbl-wrap">
              <table className="min-w-full tbl">
                <thead><tr><th className="text-left">Años</th><th className="text-right">Vale</th></tr></thead>
                <tbody>
                  {aniosEjemplo.map((anios) => (
                    <tr key={anios}><td>{anios === tope ? `${anios} o más` : anios}</td><td className="text-right font-semibold tabular-nums">{pct(Math.min(anios, tope) / tope)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /><span><b>Falta la tecnología:</b> 0 puntos en ese requisito (cobertura y calidad).</span></li>
          <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /><span><b>La tiene bajo el nivel mínimo:</b> conserva la cobertura y la calidad vale 0 en ese requisito.</span></li>
          <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /><span><b>La tiene en el nivel mínimo o superior:</b> suma cobertura + calidad según nivel y años.</span></li>
          <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /><span><b>Cumple todos los requisitos:</b> obtiene los {maxReq} puntos completos del bloque.</span></li>
        </ul>
        <Aviso tono="info" className="mt-3">
          Por eso un postulante con todos los lenguajes en nivel básico puede superar a uno que solo tiene un lenguaje en nivel experto: la cobertura de todos los pedidos pesa tanto como la calidad.
        </Aviso>
      </Seccion>

      <Seccion titulo="2. Años mínimos de la convocatoria" icono={IconoCalendario}>
        <p className="text-sm">
          La convocatoria puede fijar <b>años mínimos</b>. Se busca el mayor año de uso declarado entre las tecnologías que pide la convocatoria y se calcula:
        </p>
        <pre className="formula mt-3">
          <code>factor de años mínimos = min(mejor año entre los requisitos / años mínimos, 1)</code>
        </pre>
        <p className="mt-3 text-sm">
          Ese factor multiplica todo el bloque de requisitos (cobertura + calidad), no la experiencia ni la disponibilidad. Si la convocatoria no pide años mínimos, o no tiene requisitos, el factor es 1.
        </p>
        <Aviso tono="info" className="mt-3">
          Se usan los años de uso declarados en las habilidades, no la duración de las experiencias laborales. Ejemplo: si el mínimo es 2 y el mejor año declarado es 1, el bloque de requisitos se reduce a la mitad.
        </Aviso>
      </Seccion>

      <div className="grid gap-5 md:grid-cols-2">
        <Seccion titulo="3. Experiencia afín" icono={IconoMaletin}>
          <p className="text-sm">
            Se revisan empresa, cargo y descripción de las experiencias. Si alguna menciona una tecnología pedida por la convocatoria, suma <b>+{fmt(pesoExp, 0)}</b>.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Menciona alguna tecnología pedida</span><b>+{fmt(pesoExp, 0)}</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Tiene experiencia pero no menciona ninguna</span><b>+{fmt(pesoExp / 2, 0)}</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>No tiene experiencias</span><b>0</b></li>
          </ul>
          <p className="help mt-3">Es una coincidencia de texto, no un análisis semántico.</p>
        </Seccion>

        <Seccion titulo="4. Disponibilidad" icono={IconoReloj}>
          <p className="text-sm">
            Se toma la disponibilidad que el postulante declara en su perfil (columna <b>personas.disponibilidad</b>) y se compara con la disponibilidad pedida por la convocatoria.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>La convocatoria no exige disponibilidad</span><b>+{maxDisp}</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Coincide con la pedida</span><b>+{maxDisp}</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>No coincide</span><b>0</b></li>
          </ul>
        </Seccion>
      </div>

      <Seccion titulo="5. Resultado y orden del ranking" icono={IconoTrofeo}>
        <p className="text-sm">
          El KPI final es la suma de los tres bloques, limitada a 100 y redondeada a 2 decimales. El ranking se arma <b>en vivo</b>: el sistema enlistan a todo el padrón de postulantes y muestra a los que pasan el umbral de la convocatoria, ordenados así:
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">1</span><span>Mayor KPI de convocatoria.</span></li>
          <li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">2</span><span>Si hay empate, mayor KPI de perfil (calidad general).</span></li>
          <li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">3</span><span>Si persiste el empate, menor ID de persona.</span></li>
        </ol>
        <p className="mt-3 text-sm">
          Cuando el staff toma a alguien de la lista se guarda una foto del puntaje (<b>kpi_al_tomar</b>), del perfil y del match. El ranking recalcula en vivo con el CV y la configuración actuales, por lo que puede diferir de esa foto histórica.
        </p>
        <Aviso tono="info" className="mt-3">
          No se descarta a nadie por no cumplir: los requisitos faltantes bajan el puntaje y mandan al postulante más abajo. Quien no llega al umbral aparece igual, en la lista de <b>excluidos</b>, con el motivo.
        </Aviso>
      </Seccion>

      <div className="grid gap-5 md:grid-cols-2">
        <Seccion titulo="Umbral de enlistado (kpi_minimo)" icono={IconoUsuarios}>
          <p className="text-sm">
            Cada convocatoria define un <b>umbral</b>: el KPI mínimo necesario para entrar en la lista de candidatos. El staff lo ajusta cuando quiere (botón «Candidatos» → «Guardar umbral») y la lista se recalcula al instante.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Por defecto</span><b>{umbralPorDefecto} puntos</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Si el KPI es igual o mayor al umbral</span><b>Entra en la lista</b></li>
            <li className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50"><span>Si es menor</span><b>Queda en excluidos</b></li>
          </ul>
          <p className="help mt-3">Nadie queda oculto: el postulante también ve en «Mis convocatorias» en qué no califica y por qué.</p>
        </Seccion>

        <Seccion titulo="Perfil % (solo desempate)" icono={IconoDocumento}>
          <p className="text-sm">
            El perfil es una medida general del CV. No suma al KPI de convocatoria: solo se usa si dos postulantes empatan en el puntaje de la convocatoria.
          </p>
          <div className="tbl-wrap mt-3">
            <table className="min-w-full tbl">
              <thead>
                <tr><th className="text-left">Criterio</th><th className="text-right">Peso</th><th className="text-left">Cumple si</th></tr>
              </thead>
              <tbody>
                {pesosPerfil.map(([nombre, peso, cumple]) => (
                  <tr key={nombre}><td>{nombre}</td><td className="text-right tabular-nums">{peso}</td><td>{cumple}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="help mt-3">
            Clasificación: ≥{cfg.umbral_alto} Alto · ≥{cfg.umbral_medio} Medio · si no, Bajo. Referencia de años: {cfg.anios_referencia}. Los cinco pesos suman 100.
          </p>
        </Seccion>
      </div>

      <Seccion titulo="Match (columna informativa)" icono={IconoObjetivo}>
        <p className="text-sm">
          Match es el porcentaje de requisitos <b>obligatorios</b> cuya tecnología aparece en el CV. No mira nivel ni años de uso y no se usa para ordenar el ranking; sirve como referencia rápida.
        </p>
        <pre className="formula mt-3">
          <code>match = obligatorios presentes / total de obligatorios × 100</code>
        </pre>
      </Seccion>

      <Seccion titulo="Ejemplo con una convocatoria real" icono={IconoUsuarios}>
        <p className="help">
          Selecciona una convocatoria para ver sus requisitos y el cálculo recalculado de sus candidatos. La lista es viva: incluye a todo el padrón y separa a quienes pasan el umbral de los excluidos.
        </p>

        {convs.length === 0 ? (
          <EmptyState
            className="mt-4"
            icono={IconoUsuarios}
            titulo="No hay convocatorias para mostrar"
            texto="Cuando exista al menos una convocatoria vas a poder ver acá el cálculo completo."
          />
        ) : (
          <div className="mt-4 max-w-2xl">
            <Campo etiqueta="Convocatoria">
              <select
                className="input"
                value={convId}
                onChange={(e) => { setCargandoDemo(true); setErrDemo(''); setConvId(e.target.value); }}
              >
                {convs.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.titulo} ({c.estado}) — {c.total_candidatos} candidato{c.total_candidatos === 1 ? '' : 's'} · umbral {c.kpi_minimo}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        )}

        {errDemo ? <Aviso tono="error" className="mt-3">{errDemo}</Aviso> : null}

        {cargandoDemo ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : null}

        {!cargandoDemo && demo ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="section-title">Requisitos de la convocatoria</h3>
                <Pill tono="slate">Años mínimos: {fmt(demo.convocatoria.anios_min, 1)}</Pill>
                <Pill tono="cyan">Disponibilidad: {demo.convocatoria.disponibilidad || 'no exigida'}</Pill>
              </div>
              {reqsConPeso.length === 0 ? (
                <Aviso tono="info" className="mt-3">Sin requisitos: el bloque de requisitos vale {maxReq} puntos neutrales.</Aviso>
              ) : (
                <div className="tbl-wrap mt-3">
                  <table className="min-w-full tbl">
                    <thead>
                      <tr>
                        <th className="text-left">Requisito</th>
                        <th className="text-left">Tipo</th>
                        <th className="text-left">Nivel mínimo</th>
                        <th className="text-right">Peso máximo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqsConPeso.map((r) => (
                        <tr key={r.nombre}>
                          <td className="font-medium">{r.nombre}</td>
                          <td>{r.obligatorio ? 'Obligatorio' : 'Deseable'}</td>
                          <td>{r.nivel_minimo || 'sin mínimo'}</td>
                          <td className="text-right font-semibold tabular-nums">{fmt(r.peso)} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="section-title">Cálculo de los candidatos</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tono="emerald">{demo.total} de {demo.total_patron} del padrón</Pill>
                  <Pill tono="amber">Umbral {demo.umbral}</Pill>
                </div>
              </div>

              {(demo.resultados || []).length === 0 ? (
                <EmptyState
                  className="mt-3"
                  icono={IconoUsuarios}
                  titulo="Nadie alcanza el umbral"
                  texto="Ninguna persona del padrón llega al KPI mínimo de esta convocatoria."
                />
              ) : (
                <div className="mt-3 space-y-3">
                  {(demo.resultados || []).map((p) => {
                    const d = p.desglose || {};
                    const etiquetaExp = aNumero(d.puntos_exp) === 0
                      ? 'sin experiencia'
                      : d.experiencia_afin ? 'afín' : 'general';
                    return (
                      <article key={p.id} className="card p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Avatar nombre={`${p.nombres} ${p.apellidos}`} tamano="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{p.nombres} {p.apellidos}</p>
                            <p className="help">Perfil {fmt(p.kpi)}% · Match {fmt(p.match)}%</p>
                          </div>
                          {p.clasificacion ? <Badge valor={p.clasificacion} /> : null}
                          <div className="text-right">
                            <p className="text-2xl font-extrabold leading-none tabular-nums">{fmt(p.kpi_conv)}</p>
                            <p className="help">KPI conv.</p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Progress valor={aNumero(d.cobertura) * 100} max={100} tono="cyan" etiqueta={`Cobertura ${pct(d.cobertura)}`} />
                          <Progress valor={aNumero(d.calidad) * 100} max={100} tono="violet" etiqueta={`Calidad ${pct(d.calidad)}`} />
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                          <div><dt className="help">Años mín.</dt><dd className="font-semibold">×{fmt(d.factor_anios_min)}</dd></div>
                          <div><dt className="help">Req. puntos</dt><dd className="font-semibold">{fmt(d.puntos_requisitos)} / {maxReq}</dd></div>
                          <div><dt className="help">Experiencia</dt><dd className="font-semibold">+{fmt(d.puntos_exp)} <span className="font-normal text-slate-500">({etiquetaExp})</span></dd></div>
                          <div><dt className="help">Disponibilidad</dt><dd className="font-semibold">+{fmt(d.puntos_disp)}</dd></div>
                          <div><dt className="help">Disponibilidad declarada</dt><dd className="font-semibold">{p.disponibilidad_persona || 'sin dato'}</dd></div>
                          <div><dt className="help">Mejor año en requisitos</dt><dd className="font-semibold">{fmt(d.mejor_anio, 1)}</dd></div>
                        </dl>

                        <p className="help mt-3">
                          {fmt(d.puntos_requisitos)} (requisitos ya ajustados) + {fmt(d.puntos_exp)} (experiencia) + {fmt(d.puntos_disp)} (disponibilidad) = <b>{fmt(p.kpi_conv)}</b>
                        </p>

                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-brand-700 dark:text-brand-300">
                            Ver desglose por requisito
                          </summary>
                          {(d.por_requisito || []).length === 0 ? (
                            <p className="help mt-2">Sin requisitos: se usa la base neutral de {maxReq}.</p>
                          ) : (
                            <div className="tbl-wrap mt-2">
                              <table className="min-w-full tbl">
                                <thead>
                                  <tr>
                                    <th className="text-left">Requisito</th>
                                    <th className="text-left">Nivel mínimo</th>
                                    <th className="text-left">Postulante</th>
                                    <th className="text-right">Cobertura</th>
                                    <th className="text-right">Calidad</th>
                                    <th className="text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.por_requisito.map((x) => (
                                    <tr key={x.nombre}>
                                      <td>{x.nombre} {x.obligatorio ? '★' : '○'}</td>
                                      <td>{x.nivel_minimo || 'sin mínimo'}</td>
                                      <td>{x.presente ? `${x.nivel || 'sin nivel'} · ${fmt(x.anios_uso, 1)} años` : 'No lo tiene'}</td>
                                      <td className="text-right tabular-nums">{fmt(x.puntos_cobertura)}</td>
                                      <td className="text-right tabular-nums">{fmt(x.puntos_calidad)}</td>
                                      <td className="text-right font-bold tabular-nums">{fmt(x.puntos)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <p className="help mt-2">
                            Los puntos por requisito son antes de aplicar el factor de años mínimos. La columna Calidad solo suma si se alcanza el nivel mínimo; la Cobertura suma por tener la tecnología.
                          </p>
                        </details>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Seccion>
    </div>
  );
}
