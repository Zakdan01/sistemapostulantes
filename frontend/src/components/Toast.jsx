import { useCallback, useState } from 'react';
import { ToastCtx } from '../lib/toast';
import { IconoAlerta, IconoCheck, IconoCerrar } from './Iconos';

let seq = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const quitar = useCallback((id) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((tipo, texto) => {
    const id = ++seq;
    setItems((xs) => [...xs, { id, tipo, texto }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4500);
  }, []);

  const toast = useCallback((texto, ok = true) => push(ok ? 'ok' : 'error', texto), [push]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tipo === 'ok' ? 'toast-ok' : 'toast-error'}`} role="status">
            <span className="toast-icon">
              {t.tipo === 'ok' ? <IconoCheck className="h-4 w-4" /> : <IconoAlerta className="h-4 w-4" />}
            </span>
            <p className="min-w-0 flex-1 pt-0.5">{t.texto}</p>
            <button
              type="button"
              className="btn btn-ghost -mr-1 -mt-0.5 p-1.5"
              onClick={() => quitar(t.id)}
              aria-label="Cerrar aviso"
            >
              <IconoCerrar className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
