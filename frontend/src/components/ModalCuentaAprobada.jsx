import { useNavigate } from 'react-router-dom';
import { Boton } from './ui';
import { IconoCheck, IconoX, IconoMaletin, IconoUsuario } from './Iconos';

export function ModalCuentaAprobada({ abierto, onCerrar }) {
  const nav = useNavigate();

  if (!abierto) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCerrar}>
      <div
        className="dialog card max-w-lg w-full text-center relative overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={onCerrar}
          aria-label="Cerrar"
        >
          <IconoX className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
          <IconoCheck className="h-8 w-8 stroke-[2.5]" />
        </div>

        <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          ¡Tu cuenta ha sido aprobada!
        </h3>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Un administrador ha verificado y habilitado tu registro. Ahora formas parte del padrón de candidatos activo: puedes completar tu perfil con tus tecnologías y experiencias para entrar automáticamente a las convocatorias compatibles.
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
          <Boton
            variante="secondary"
            icono={IconoMaletin}
            onClick={() => {
              onCerrar();
              nav('/mis-convocatorias');
            }}
            className="w-full sm:w-auto"
          >
            Ver mis convocatorias
          </Boton>
          <Boton
            variante="primary"
            icono={IconoUsuario}
            onClick={() => {
              onCerrar();
              nav('/mi-perfil');
            }}
            className="w-full sm:w-auto"
          >
            Completar mi perfil
          </Boton>
        </div>
      </div>
    </div>
  );
}
