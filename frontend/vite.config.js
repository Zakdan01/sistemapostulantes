import os from 'node:os'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Avisa al arrancar a qué direcciones pueden conectarse las otras PC de la red.
// Vite ya muestra "Network", pero así queda explícito y con el nombre del adaptador.
function avisarRed() {
  return {
    name: 'avisar-red',
    configureServer(servidor) {
      const imprimir = () => {
        const addr = servidor.httpServer?.address()
        const puerto = addr && typeof addr === 'object' ? addr.port : servidor.config.server.port

        const ips = Object.entries(os.networkInterfaces())
          .flatMap(([nombre, lista]) => (lista || []).map((i) => ({ ...i, nombre })))
          .filter((i) => (i.family === 'IPv4' || i.family === 4) && !i.internal)

        console.log('')
        if (!ips.length) {
          console.log('  Sin red local: conectate a una Wi-Fi para que otras PC entren.')
          console.log('')
          return
        }
        console.log('  Otras PC en la misma red se conectan a:')
        for (const { address, nombre } of ips) {
          console.log(`  http://${address}:${puerto}   (${nombre})`)
        }
        console.log('')
      }

      if (servidor.httpServer?.listening) imprimir()
      else servidor.httpServer?.once('listening', imprimir)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), avisarRed()],
  server: {
    host: true,
    // El navegador de cualquier PC llama a /api en el mismo origen (5173) y
    // Vite lo reenvía al backend. Así el código no lleva IP y no hay CORS.
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
})
