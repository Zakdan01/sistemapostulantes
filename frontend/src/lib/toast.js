// Contexto del toast, separado del componente para que Toast.jsx solo exporte
// componentes (React Fast Refresh).
import { createContext, useContext } from 'react';

export const ToastCtx = createContext(() => {});

// toast(texto, ok = true). Lo provee <ToastProvider>.
export function useToast() {
  return useContext(ToastCtx);
}
