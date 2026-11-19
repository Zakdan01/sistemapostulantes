# Consultora de Convocatorias · Página web corporativa

Web institucional de la consultora, construida desde cero con **HTML, CSS y JavaScript puro** (sin dependencias ni pasos de compilación). Desde la sección **Plataforma** se enlaza el **sistema de convocatorias y postulantes** existente: los botones abren el sistema en una pestaña nueva, sin incrustarlo en la página.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Estructura de la página: inicio, servicios, proceso, convocatorias, plataforma, soluciones y contacto. |
| `styles.css` | Diseño responsive, tema claro/oscuro y tarjeta de accesos a la plataforma. |
| `app.js` | Navegación, tema, enlaces configurables al sistema, convocatorias de muestra y formulario de contacto. |
| `iniciar-web.cmd` | Levanta un servidor local estático y abre la página. |

## Arrancar la web

Doble clic en `iniciar-web.cmd`, o manualmente:

```powershell
python -m http.server 8080
```

Después abrir <http://localhost:8080>.

> Se recomienda servir con `python -m http.server` en lugar de abrir `index.html` con doble clic: así los enlaces y el guardado de la dirección del sistema funcionan de forma consistente.

## Enlazar la plataforma del sistema

La sección **Plataforma de gestión** apunta al frontend del sistema en <http://localhost:5173> por defecto. Para levantarlo:

```powershell
cd C:\Proyectos\sistemapostulantes\backend
npm start
```

```powershell
cd C:\Proyectos\sistemapostulantes\frontend
npm run dev
```

Si el sistema corre en otra PC, copiá la dirección de red que imprime Vite (por ejemplo `http://192.168.1.20:5173`) y pegala en el campo **Dirección del sistema** dentro de la sección Plataforma. Apretá **Aplicar**: todos los enlaces se actualizan y el valor queda guardado en el navegador.

### Accesos a la plataforma

Todos los accesos son enlaces reales con `target="_blank"`: el header (**Ingresar a la plataforma**), la sección **Plataforma** (**Ir al login**, atajos y tarjetas), **Convocatorias**, **Soluciones** y el footer. Cada uno abre la ruta correspondiente del sistema (`/login`, `/registro`, `/convocatorias`, `/mis-convocatorias`) en una pestaña nueva. No hay iframe ni verificación de conexión desde la web corporativa.

## Convocatorias

La sección **Convocatorias registradas** muestra tarjetas de muestra. Las convocatorias verdaderas se consultan dentro de la plataforma enlazada, en el acceso **Convocatorias** (o desde el botón **Ver en la plataforma**). El endpoint `/api/convocatorias` exige sesión iniciada, por lo que la web corporativa no lo consulta directamente.

## Cuentas de demostración del sistema enlazado

- Administrador: `admin@consultora.com`
- Reclutador: `reclutador1@consultora.com`
- Postulante: `postulante01@test.com`

Contraseña para todas: `Admin123!`

## Contacto

El formulario valida los datos y prepara un correo a `convocatorias@consultora.com` con el resumen de la convocatoria. No envía información a servidores de terceros.
