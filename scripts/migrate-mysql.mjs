import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { sql, client, literal } from './mysql-client.mjs';
const database = process.env.DB_NAME;

try {
  console.log(sql("SELECT VERSION(), @@port, CURRENT_USER();").trim());
  if (process.argv.includes('--inspect')) {
    console.log(sql(`SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA='nexou';
      SELECT 'usuarios', COUNT(*) FROM usuarios UNION ALL SELECT 'reportes', COUNT(*) FROM reportes;
      SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA='nexou';`));
  } else {
    // No ejecutar contra una base distinta ni recrear el esquema inicial.
    const count = Number(sql(`SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=${literal(database)} AND TABLE_NAME IN ('usuarios','reportes','historial_estados','areas','categorias','estados_reporte','evidencias');`).trim());
    if (count !== 7) throw new Error('Falta el esquema inicial completo. Revisar antes de migrar.');
    const directory = resolve('database/mysql/migrations');
    const files = readdirSync(directory).filter(name => /^\d+_.*\.sql$/.test(name)).sort();
    const hasLedger = Number(sql(`SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=${literal(database)} AND TABLE_NAME='schema_migrations';`).trim());
    const rows = hasLedger ? sql('SELECT version, checksum, estado FROM schema_migrations;').trim().split('\n').filter(Boolean) : [];
    const applied = new Map(rows.map(row => { const [name, checksum, status] = row.trim().split('\t'); return [name, { checksum, status }]; }));
    const pending = [];
    for (const name of files) {
      const body = readFileSync(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(body).digest('hex');
      const previous = applied.get(name);
      if (previous && (previous.checksum !== checksum || previous.status !== 'aplicada')) {
        throw new Error(`Migracion alterada o incompleta: ${name}. Revisar manualmente; no reintentar DDL parcial.`);
      }
      if (!previous) pending.push({ name, body, checksum });
    }
    if (pending.length) {
      mkdirSync(resolve('.local/database-backups'), { recursive: true });
      const stamp = new Date().toISOString().replaceAll(':', '-');
      const backup = resolve(`.local/database-backups/${database}-${stamp}.sql`);
      writeFileSync(backup, client(['--single-transaction', '--routines', '--triggers', '--skip-lock-tables', database], '', true));
      console.log('Respaldo previo guardado en .local/database-backups.');
      sql(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
        checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        estado ENUM('iniciada','aplicada') NOT NULL,
        iniciado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        aplicado_en DATETIME(3) NULL
      ) ENGINE=InnoDB;`);
      for (const migration of pending) {
        sql(`INSERT INTO schema_migrations (version, checksum, estado) VALUES (${literal(migration.name)}, ${literal(migration.checksum)}, 'iniciada');`);
        sql(migration.body);
        sql(`UPDATE schema_migrations SET estado='aplicada', aplicado_en=UTC_TIMESTAMP(3) WHERE version=${literal(migration.name)};`);
        console.log(`Aplicada: ${migration.name}`);
      }
    } else console.log('Sin migraciones pendientes; checksums correctos.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
