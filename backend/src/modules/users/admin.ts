import { rows, pool } from '../../db/pool.js';
import { z } from 'zod';
// Uso: npm run staff:admin -- <id de personal> on|off
try {
  const id = z.string().min(1).max(40).parse(process.argv[2]);
  const enabled = z.enum(['on', 'off']).parse(process.argv[3]);
  const [account] = await rows(
    "SELECT id FROM usuarios WHERE id=? AND rol='personal' AND activo=1",
    [id],
  );
  if (!account) throw new Error('Cuenta no disponible.');
  await rows(
    "UPDATE usuarios SET es_admin=? WHERE id=? AND rol='personal' AND activo=1",
    [Number(enabled === 'on'), id],
  );
  console.log('Permiso de administración actualizado.');
} catch {
  console.error(
    'No se pudo actualizar el permiso. Usa: npm run staff:admin -- <id de personal activo> on|off',
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
