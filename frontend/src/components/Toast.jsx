import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(() => {});

let seq = 0;

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((tipo, texto) => {
    const id = ++seq;
    setItems((xs) => [...xs, { id, tipo, texto }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4000);
  }, []);

  const toast = useCallback((texto, ok = true) => push(ok ? 'ok' : 'error', texto), [push]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-xs" aria-live="polite">
        {items.map((t) => (
          <div key={t.id}
            className={`p-3 rounded-xl shadow-lg text-sm font-semibold border ${
              t.tipo === 'ok'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-red-600 text-white border-red-700'
            }`}>
            {t.tipo === 'ok' ? '✓ ' : '✗ '}{t.texto}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
