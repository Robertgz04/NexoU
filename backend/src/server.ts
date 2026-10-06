import { app } from './app.js';
import { env } from './config/env.js';
import { pool, rows } from './db/pool.js';
import { deliverOne } from './modules/devices/worker.js';
await rows('SELECT 1');
const server = app.listen(env.API_PORT, env.API_HOST, () =>
  console.log(`API disponible en puerto ${env.API_PORT}`),
);
server.requestTimeout = 30000;
server.headersTimeout = 15000;
let working: Promise<unknown> | null = null;
const timer = setInterval(() => {
  if (!working)
    working = deliverOne()
      .catch(() => console.error('No se pudo procesar la cola push.'))
      .finally(() => {
        working = null;
      });
}, 2000);
async function shutdown() {
  clearInterval(timer);
  server.close(async () => {
    if (working) await working;
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 30000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
