import { Component } from 'react';
import { Aviso, Boton } from './ui';
import { IconoAlerta } from './Iconos';

// Evita la pantalla en blanco cuando una pagina falla al renderizar: muestra el error
// real y deja seguir navegando. El menu (sidebar) queda FUERA del boundary (ver App.jsx),
// asi el usuario nunca se queda sin navegacion.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Queda en la consola del navegador para diagnostico.
    console.error('Error de render:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            <IconoAlerta className="h-5 w-5" />
          </span>
          <div>
            <h1 className="page-title text-xl sm:text-2xl">Algo salió mal en esta página</h1>
            <p className="help mt-1">
              El resto de la aplicación sigue funcionando. Podés volver al inicio o reintentar esta pantalla.
            </p>
          </div>
        </div>
        <Aviso tono="error" titulo="Detalle del error">
          {error.message || String(error)}
        </Aviso>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-primary px-4 py-2 text-sm" href="/">Volver al inicio</a>
          <Boton variante="secondary" onClick={() => this.setState({ error: null })}>Reintentar</Boton>
          <Boton variante="ghost" onClick={() => window.location.reload()}>Recargar</Boton>
        </div>
      </div>
    );
  }
}
