const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('===================================================');
console.log('   Iniciando Sistema Postulantes v2 (Consola Unica)');
console.log('===================================================\n');

function runProcess(name, command, args, cwd, colorPrefix) {
  const isWin = process.platform === 'win32';
  const child = spawn(command, args, {
    cwd,
    shell: isWin,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const prefix = `${colorPrefix}[${name}]\x1b[0m `;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.log(`${prefix}${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.error(`${prefix}\x1b[31m${line}\x1b[0m`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${prefix}Proceso finalizado (código ${code})`);
  });

  return child;
}

// 1. Iniciar Backend
console.log('[1/2] Iniciando Backend en puerto 3000...');
const backendProcess = runProcess('Backend', 'npm', ['start'], backendDir, '\x1b[36m');

// 2. Esperar 2.5s e iniciar Frontend
setTimeout(() => {
  console.log('\n[2/2] Iniciando Frontend en puerto 5173...');
  const frontendProcess = runProcess('Frontend', 'npm', ['run', 'dev'], frontendDir, '\x1b[32m');

  function shutdown() {
    console.log('\n\x1b[33mDeteniendo procesos...\x1b[0m');
    try {
      if (process.platform === 'win32') {
        if (backendProcess.pid) spawn('taskkill', ['/F', '/T', '/PID', backendProcess.pid]);
        if (frontendProcess.pid) spawn('taskkill', ['/F', '/T', '/PID', frontendProcess.pid]);
      } else {
        backendProcess.kill();
        frontendProcess.kill();
      }
    } catch {
      // Ignorar si ya estaban terminados
    }
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}, 2500);
