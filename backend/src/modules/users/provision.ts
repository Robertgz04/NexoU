import { registration } from '../auth/validation.js';
import { createAccount } from '../auth/service.js';
import { pool } from '../../db/pool.js';
// Read private input from stdin. Passwords never appear in command arguments.
let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const value = registration.parse(JSON.parse(input));
  const { user } = await createAccount(value, 'personal');
  console.log(JSON.stringify(user));
} catch {
  console.error('No se pudo crear personal. Revisa campos y duplicados.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
