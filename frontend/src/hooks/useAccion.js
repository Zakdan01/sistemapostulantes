// Hook para acciones async (botones que llaman a la API).
// Centraliza el patron repetido: ocupado -> ejecutar -> toast ok/error -> recargar.
import { useCallback, useState } from 'react';
import { useToast } from '../lib/toast';

//   const { ocupado, error, ejecutar, toast } = useAccion();
//   onClick={() => ejecutar('clave', async () => { await api(...); cargar(); }, { exito: 'Listo.' })}
export function useAccion() {
  const [ocupado, setOcupado] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const ejecutar = useCallback(async (clave, fn, { exito } = {}) => {
    setError('');
    setOcupado(clave);
    try {
      const r = await fn();
      if (exito) toast(typeof exito === 'function' ? exito(r) : exito);
      return r;
    } catch (ex) {
      setError(ex.message);
      toast(ex.message, false);
      return undefined;
    } finally {
      setOcupado(null);
    }
  }, [toast]);

  return { ocupado, error, setError, ejecutar, toast };
}
