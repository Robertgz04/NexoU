import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { sql, literal } from './mysql-client.mjs';

// Solo crea dos cuentas iniciales; no crea incidencias ni cambia cuentas existentes.
const path = resolve('.local/cuentas-iniciales.json');
try {
  if (Number(sql('SELECT COUNT(*) FROM usuarios;').trim()) !== 0 || existsSync(path)) {
    throw new Error('Bootstrap requiere cero usuarios y ausencia del archivo de credenciales; no se sobrescriben cuentas.');
  }
  const accounts = [
    { id: 'u_inicial_estudiante', nombre: 'Estudiante inicial', matricula: 'NEXOU-E001', email: 'estudiante@nexou.mx', rol: 'estudiante' },
    { id: 'u_inicial_personal', nombre: 'Personal inicial', matricula: 'NEXOU-P001', email: 'personal@nexou.mx', rol: 'personal' },
  ].map(account => ({ ...account, email: `${account.matricula.toLowerCase()}@virtual.utsc.edu.mx`, password: randomBytes(24).toString('base64url') }));
  const rows = accounts.map(account => {
    const result = spawnSync(process.env.PHP_BIN || 'C:/xampp/php/php.exe', ['-r', 'echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT, ["cost" => 12]);'], {
      input: account.password, encoding: 'utf8', windowsHide: true,
    });
    if (result.error || result.status !== 0 || !/^\$2[aby]\$12\$/.test(result.stdout)) throw new Error('No se pudo generar bcrypt con PHP local.');
    return `(${[account.id, account.nombre, account.matricula, account.email, result.stdout, 'bcrypt', account.rol].map(literal).join(',')})`;
  });
  mkdirSync(resolve('.local'), { recursive: true });
  // Guardar antes del INSERT evita perder las claves si falla la escritura del archivo.
  writeFileSync(path, JSON.stringify(accounts, null, 2)+'\n', { flag: 'wx', mode: 0o600 });
  sql(`START TRANSACTION; INSERT INTO usuarios (id,nombre,matricula,email,password_hash,password_algoritmo,rol) VALUES ${rows.join(',')}; COMMIT;`);
  console.log('Creadas dos cuentas iniciales con bcrypt. Credenciales en .local/cuentas-iniciales.json (ignorado por Git).');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
