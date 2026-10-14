import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FormularioPostulacion } from '../components/FormularioPostulacion';
import { useToast } from '../components/Toast';

// Vista previa para el admin: el formulario directo que llena el postulante, siempre visible.
export function Postular() {
  const toast = useToast();
  const [convs, setConvs] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/convocatorias?estado=abierta').then(setConvs).catch((ex) => setErr(ex.message));
  }, []);

  return (
    <div className="max-w-2xl mx-auto card p-6 space-y-3">
      <h2 className="text-2xl font-extrabold">Postular (vista previa postulante)</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Así lo ve y lo llena el postulante, directo el formulario con todos sus datos.</p>
      {err && <p className="err-msg">{err}</p>}
      {msg && <p className="ok-msg">{msg}</p>}
      <FormularioPostulacion
        convocatoriaOpciones={convs}
        soloVista
        onOk={(r) => { const m = `Vista previa enviada (id=${r.id})`; setMsg(m); toast(m); }}
        onErr={(m) => { setErr(m); toast(m, false); }}
      />
    </div>
  );
}
