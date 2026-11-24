const jwt = require('jsonwebtoken');

// Conjunto de clientes conectados: { id, res, usuario }
const clientes = new Set();
let contadorIds = 0;

function conectarCliente(req, res) {
  const token = (req.query.token || '').trim() ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    res.status(401).json({ error: 'Token requerido para conexión en tiempo real' });
    return;
  }

  let usuario;
  try {
    usuario = jwt.verify(token, process.env.JWT_SECRET || 'dev');
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  // Configuración de cabeceras SSE estándar
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  const id = ++contadorIds;
  const cliente = { id, res, usuario };
  clientes.add(cliente);
  console.log(`[SSE Backend] Cliente conectado: ID=${id}, usuarioId=${usuario.id}, rol=${usuario.rol}. Total conectados: ${clientes.size}`);

  // Mensaje de saludo inicial
  res.write(`event: conectado\ndata: ${JSON.stringify({ ok: true, usuarioId: usuario.id, rol: usuario.rol })}\n\n`);

  // Pulso periódico (heartbeat) cada 25 segundos para evitar desconexiones por timeout
  const ping = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(ping);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    clientes.delete(cliente);
    console.log(`[SSE Backend] Cliente desconectado: ID=${id}. Total conectados: ${clientes.size}`);
  });
}

/**
 * Emite un evento a los destinatarios correspondientes
 * @param {Object} param0
 * @param {string} param0.tipo - Nombre del evento (ej: 'POSTULANTE_REGISTRADO', 'CUENTA_APROBADA')
 * @param {any} param0.datos - Carga útil del evento
 * @param {string|number|Object} param0.destinatario - 'todos' | 'admin' | 'staff' | 'postulante' | usuarioId
 */
function emitirEvento({ tipo, datos, destinatario = 'todos' }) {
  const mensaje = `event: ${tipo}\ndata: ${JSON.stringify(datos)}\n\n`;
  let enviados = 0;

  for (const c of clientes) {
    try {
      let enviar = false;
      if (destinatario === 'todos') {
        enviar = true;
      } else if (destinatario === 'admin' && c.usuario.rol === 'admin') {
        enviar = true;
      } else if (destinatario === 'staff' && ['admin', 'reclutador'].includes(c.usuario.rol)) {
        enviar = true;
      } else if (destinatario === 'postulante' && c.usuario.rol === 'postulante') {
        enviar = true;
      } else if (Number(destinatario) > 0 && Number(c.usuario.id) === Number(destinatario)) {
        enviar = true;
      } else if (typeof destinatario === 'object' && destinatario.usuarioId && Number(c.usuario.id) === Number(destinatario.usuarioId)) {
        enviar = true;
      }

      if (enviar) {
        c.res.write(mensaje);
        enviados++;
      }
    } catch {
      clientes.delete(c);
    }
  }

  console.log(`[SSE Backend] Evento emitido [${tipo}] a destinatario [${JSON.stringify(destinatario)}]. Notificados: ${enviados} de ${clientes.size} clientes.`);
}

function totalConectados() {
  return clientes.size;
}

module.exports = {
  conectarCliente,
  emitirEvento,
  totalConectados
};
