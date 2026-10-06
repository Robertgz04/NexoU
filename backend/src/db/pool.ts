import mysql, { type PoolConnection, type RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';

export const strictMode =
  'STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  connectionLimit: env.DB_POOL_SIZE,
  waitForConnections: true,
  queueLimit: 100,
  connectTimeout: 5000,
  enableKeepAlive: true,
});
// Await initialization on every checkout, including newly created connections.
export async function connection(): Promise<PoolConnection> {
  const c = await pool.getConnection();
  try {
    await c.query('SET NAMES utf8mb4');
    await c.execute("SET SESSION time_zone = '+00:00'");
    await c.execute('SET SESSION sql_mode = ?', [strictMode]);
    return c;
  } catch (e) {
    c.destroy();
    throw e;
  }
}
export async function rows<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  c?: PoolConnection,
): Promise<T[]> {
  const own = c || (await connection());
  try {
    return (
      await own.execute<T[]>(
        { sql, timeout: 15000 },
        params as (string | number | null)[],
      )
    )[0];
  } finally {
    if (!c) own.release();
  }
}
export async function transaction<T>(
  fn: (c: PoolConnection) => Promise<T>,
): Promise<T> {
  const c = await connection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export const sqlDate = (date: Date) =>
  date.toISOString().slice(0, 23).replace('T', ' ');
export const isoDate = (date: string) =>
  new Date(date.replace(' ', 'T') + 'Z').toISOString();
