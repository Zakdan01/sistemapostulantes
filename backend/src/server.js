require('dotenv').config();
const os = require('os');
const app = require('./app');

const PORT = Number(process.env.PORT || 3000);

// IPv4 de las interfaces activas (sin loopback): las direcciones por las que
// otras PC de la misma red pueden llegar al servidor.
function direccionesDeRed() {
  return Object.entries(os.networkInterfaces())
    .flatMap(([nombre, lista]) => (lista || []).map((i) => ({ ...i, nombre })))
    .filter((i) => (i.family === 'IPv4' || i.family === 4) && !i.internal);
}

app.listen(PORT, () => {
  console.log(`postulantes-v2 P1 en http://localhost:${PORT}`);

  const redes = direccionesDeRed();
  if (redes.length === 0) {
    console.log('Sin red: conectate a una Wi-Fi para que otras PC puedan entrar.');
    return;
  }
  console.log('API en la red (requiere abrir el puerto en el firewall):');
  for (const { address, nombre } of redes) {
    console.log(`  http://${address}:${PORT}   (${nombre})`);
  }
});
