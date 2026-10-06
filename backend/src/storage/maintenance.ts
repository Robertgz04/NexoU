import { rows, pool } from '../db/pool.js';
import { cleanOrphans } from './files.js';
try {
  await cleanOrphans();
  await rows(
    'DELETE FROM sesiones WHERE expira_en<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 30 DAY) OR revocado_en<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 30 DAY)',
  );
  await rows(
    "DELETE FROM push_outbox WHERE estado IN ('enviado','descartado') AND finalizado_en<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 30 DAY)",
  );
  console.log('Limpieza completada.');
} finally {
  await pool.end();
}
