import { loadEnvFile } from 'node:process';
import { mkdtempSync, writeFileSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

loadEnvFile(resolve('.env'));
const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const key of required) {
  if (!process.env[key] || process.env[key] === 'CAMBIA_ESTA_CLAVE') {
    throw new Error(`Completa ${key} en .env`);
  }
}
if (process.env.DB_NAME !== 'nexou' && !/^nexou_test_[a-f0-9]{16}$/.test(process.env.DB_NAME)) throw new Error('Solo se permite nexou o una base aislada nexou_test_<16 hex>.');
if (!/^\d+$/.test(process.env.DB_PORT)) throw new Error('Puerto invalido.');

export const session = `SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
USE ${process.env.DB_NAME};\n`;
export const literal = value => "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'";

export function client(args = [], input = '', dump = false) {
  const dir = mkdtempSync(join(tmpdir(), 'nexou-db-'));
  const config = join(dir, 'client.cnf');
  // Las credenciales nunca van en argumentos ni en la salida del proceso.
  const option = value => '"' + String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r') + '"';
  writeFileSync(config, '[client]\n' + [
    ['host', process.env.DB_HOST], ['port', process.env.DB_PORT],
    ['user', process.env.DB_USER], ['password', process.env.DB_PASSWORD],
    ['protocol', 'TCP'], ['default-character-set', 'utf8mb4'],
  ].map(([key, value]) => `${key}=${option(value)}`).join('\n'), { mode: 0o600 });
  try {
    const executable = dump
      ? (process.env.MYSQLDUMP_BIN || 'C:/xampp/mysql/bin/mysqldump.exe')
      : (process.env.MYSQL_BIN || 'C:/xampp/mysql/bin/mysql.exe');
    const result = spawnSync(executable, [`--defaults-extra-file=${config}`, ...args], {
      input, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      // No imprimir SQL de entrada: puede contener hashes o datos privados.
      const detail = String(result.error?.message || result.stderr || 'Error SQL')
        .replaceAll(process.env.DB_PASSWORD, '[REDACTADO]');
      throw new Error(detail);
    }
    return result.stdout;
  } finally {
    rmSync(config, { force: true });
    rmdirSync(dir);
  }
}

export function sql(text) {
  return client(['--batch', '--skip-column-names', '--connect-timeout=5'], session + text);
}
