import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useCatalogos, invalidarCatalogos } from '../lib/catalogos';
import {
  Aviso,
  Boton,
  Campo,
  DialogoConfirmar,
  PageHeader,
  Pill,
  Seccion
} from '../components/ui';
import {
  IconoBasura,
  IconoBuscar,
  IconoCodigo,
  IconoEditar,
  IconoMas,
  IconoX
} from '../components/Iconos';

export function GestionTecnologias() {
  const catalogos = useCatalogos();
  const toast = useToast();

  const [tecnologias, setTecnologias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [catFiltro, setCatFiltro] = useState('todas');
  const [orden, setOrden] = useState('mas_nuevas');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  // Formulario Crear / Editar
  const [form, setForm] = useState({ nombre: '', categoria: 'otro' });
  const [guardando, setGuardando] = useState(false);
  const [errForm, setErrForm] = useState('');

  const categorias = useMemo(() => {
    return (catalogos && catalogos.categorias) || ['lenguajes', 'frameworks', 'bases_datos', 'devops', 'otro'];
  }, [catalogos]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await api('/api/admin/tecnologias');
      setTecnologias(data);
    } catch (err) {
      toast(err.message || 'Error al cargar tecnologías', false);
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    let activo = true;
    api('/api/admin/tecnologias')
      .then((data) => {
        if (activo) {
          setTecnologias(data);
          setCargando(false);
        }
      })
      .catch((err) => {
        if (activo) {
          toast(err.message || 'Error al cargar tecnologías', false);
          setCargando(false);
        }
      });
    return () => { activo = false; };
  }, [toast]);

  function abrirCrear() {
    setForm({ nombre: '', categoria: 'lenguajes' });
    setErrForm('');
    setModalCrear(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setForm({ nombre: item.nombre, categoria: item.categoria || 'otro' });
    setErrForm('');
  }

  async function guardarCrear(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrForm('El nombre es requerido');
      return;
    }
    setGuardando(true);
    setErrForm('');
    try {
      await api('/api/admin/tecnologias', {
        method: 'POST',
        body: { nombre: form.nombre.trim(), categoria: form.categoria }
      });
      toast(`Tecnología "${form.nombre.trim()}" agregada.`);
      invalidarCatalogos();
      setModalCrear(false);
      cargar();
    } catch (err) {
      setErrForm(err.message || 'Error al guardar');
      toast(err.message || 'Error al guardar', false);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEditar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrForm('El nombre es requerido');
      return;
    }
    setGuardando(true);
    setErrForm('');
    try {
      await api(`/api/admin/tecnologias/${editando.id}`, {
        method: 'PUT',
        body: { nombre: form.nombre.trim(), categoria: form.categoria }
      });
      toast(`Tecnología "${form.nombre.trim()}" actualizada.`);
      invalidarCatalogos();
      setEditando(null);
      cargar();
    } catch (err) {
      setErrForm(err.message || 'Error al actualizar');
      toast(err.message || 'Error al actualizar', false);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    setGuardando(true);
    try {
      await api(`/api/admin/tecnologias/${eliminando.id}`, { method: 'DELETE' });
      toast(`Tecnología "${eliminando.nombre}" eliminada.`);
      invalidarCatalogos();
      setEliminando(null);
      cargar();
    } catch (err) {
      toast(err.message || 'No se pudo eliminar la tecnología', false);
    } finally {
      setGuardando(false);
    }
  }

  const tecnologiasFiltradas = useMemo(() => {
    const f = filtro.toLowerCase().trim();
    const filtradas = tecnologias.filter((t) => {
      const coincideTexto = !f || t.nombre.toLowerCase().includes(f);
      const coincideCat = catFiltro === 'todas' || t.categoria === catFiltro;
      return coincideTexto && coincideCat;
    });

    return [...filtradas].sort((a, b) => {
      if (orden === 'mas_nuevas') {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      if (orden === 'mas_antiguas') {
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      }
      if (orden === 'az') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (orden === 'za') {
        return b.nombre.localeCompare(a.nombre);
      }
      if (orden === 'mas_usadas') {
        return ((Number(b.total_postulantes) || 0) + (Number(b.total_convocatorias) || 0)) -
               ((Number(a.total_postulantes) || 0) + (Number(a.total_convocatorias) || 0));
      }
      return 0;
    });
  }, [tecnologias, filtro, catFiltro, orden]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Gestión de Tecnologías"
        subtitulo="Administra el catálogo de lenguajes, frameworks y herramientas del sistema."
        icono={IconoCodigo}
      >
        <Boton icono={IconoMas} onClick={abrirCrear}>
          Nueva tecnología
        </Boton>
      </PageHeader>

      <Seccion>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <IconoBuscar className="h-4 w-4" />
              </span>
              <input
                type="text"
                className="input pl-9"
                placeholder="Buscar tecnología…"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <select
              className="input w-auto"
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="input w-auto"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              title="Ordenar por"
            >
              <option value="mas_nuevas">🕒 Más nuevas primero</option>
              <option value="mas_antiguas">📅 Más antiguas primero</option>
              <option value="az">🔤 Nombre (A - Z)</option>
              <option value="za">🔤 Nombre (Z - A)</option>
              <option value="mas_usadas">🔥 Más utilizadas</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando <b>{tecnologiasFiltradas.length}</b> de {tecnologias.length}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {cargando ? (
            <div className="py-12 text-center text-sm text-slate-500">Cargando catálogo…</div>
          ) : tecnologiasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No se encontraron tecnologías que coincidan con la búsqueda.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-16">#ID</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th className="text-center">Postulantes</th>
                  <th className="text-center">Convocatorias</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tecnologiasFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td className="text-xs font-mono text-slate-400">
                      #{t.id}
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-slate-100">
                      {t.nombre}
                    </td>
                    <td>
                      <Pill tono={t.categoria === 'otro' ? 'amber' : 'brand'}>
                        {t.categoria || 'otro'}
                      </Pill>
                    </td>
                    <td className="text-center text-slate-600 dark:text-slate-300">
                      {t.total_postulantes || 0}
                    </td>
                    <td className="text-center text-slate-600 dark:text-slate-300">
                      {t.total_convocatorias || 0}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Boton
                          variante="ghost"
                          tamano="sm"
                          icono={IconoEditar}
                          onClick={() => abrirEditar(t)}
                          title="Editar tecnología"
                        >
                          Editar
                        </Boton>
                        <Boton
                          variante="ghost"
                          tamano="sm"
                          icono={IconoBasura}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                          onClick={() => setEliminando(t)}
                          title="Eliminar tecnología"
                        >
                          Eliminar
                        </Boton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Seccion>

      {/* Modal Crear */}
      {modalCrear && (
        <div className="dialog-backdrop" role="presentation" onClick={() => !guardando && setModalCrear(false)}>
          <div className="dialog card max-w-md w-full" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="section-title">Nueva Tecnología</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => !guardando && setModalCrear(false)}
              >
                <IconoX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={guardarCrear} className="space-y-4 pt-4">
              {errForm && <Aviso tono="danger">{errForm}</Aviso>}
              <Campo etiqueta="Nombre de la tecnología">
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. flutter, kubernetes, rust…"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoFocus
                />
              </Campo>
              <Campo etiqueta="Categoría">
                <select
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <div className="flex justify-end gap-2 pt-2">
                <Boton
                  variante="secondary"
                  type="button"
                  onClick={() => setModalCrear(false)}
                  disabled={guardando}
                >
                  Cancelar
                </Boton>
                <Boton type="submit" cargando={guardando}>
                  Crear tecnología
                </Boton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {Boolean(editando) && (
        <div className="dialog-backdrop" role="presentation" onClick={() => !guardando && setEditando(null)}>
          <div className="dialog card max-w-md w-full" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="section-title">Editar Tecnología: {editando?.nombre}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => !guardando && setEditando(null)}
              >
                <IconoX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={guardarEditar} className="space-y-4 pt-4">
              {errForm && <Aviso tono="danger">{errForm}</Aviso>}
              <Campo etiqueta="Nombre">
                <input
                  type="text"
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoFocus
                />
              </Campo>
              <Campo etiqueta="Categoría">
                <select
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <div className="flex justify-end gap-2 pt-2">
                <Boton
                  variante="secondary"
                  type="button"
                  onClick={() => setEditando(null)}
                  disabled={guardando}
                >
                  Cancelar
                </Boton>
                <Boton type="submit" cargando={guardando}>
                  Guardar cambios
                </Boton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación Eliminar */}
      <DialogoConfirmar
        abierto={Boolean(eliminando)}
        titulo={`Eliminar Tecnología: ${eliminando ? eliminando.nombre : ''}`}
        texto={
          (eliminando?.total_postulantes > 0 || eliminando?.total_convocatorias > 0)
            ? `Atención: Esta tecnología está asignada a ${eliminando.total_postulantes} postulante(s) y ${eliminando.total_convocatorias} convocatoria(s). Al eliminarla, se removerá automáticamente de todos los perfiles de postulantes y convocatorias donde esté asignada, desvinculándola por completo del sistema. ¿Deseas continuar?`
            : `¿Estás seguro de que deseas eliminar permanentemente la tecnología "${eliminando ? eliminando.nombre : ''}"?`
        }
        confirmar="Sí, eliminar"
        tono="danger"
        ocupado={guardando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => !guardando && setEliminando(null)}
      />
    </div>
  );
}
