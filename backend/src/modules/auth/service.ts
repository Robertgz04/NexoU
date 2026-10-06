import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from 'node:crypto';
import bcrypt from 'bcryptjs';
import { rows, transaction, sqlDate, isoDate } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../middleware/errors.js';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

export interface Account extends RowDataPacket {
  id: string;
  nombre: string;
  matricula: string;
  email: string;
  password_hash: string;
  password_algoritmo: string;
  rol: 'estudiante' | 'personal';
  activo: number;
  creado_en: string;
}
export const publicUser = (u: Account) => ({
  id: u.id,
  nombre: u.nombre,
  matricula: u.matricula,
  email: u.email,
  rol: u.rol,
  createdAt: isoDate(u.creado_en),
});
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
export async function verifyPassword(
  u: Account,
  value: string,
): Promise<boolean> {
  if (Buffer.byteLength(value) > 72) return false;
  if (u.password_algoritmo === 'bcrypt')
    return bcrypt.compare(value, u.password_hash.replace(/^\$2y\$/, '$2b$'));
  if (u.password_algoritmo === 'sha256_legacy') {
    const hash = createHash('sha256')
      .update(`nexou:${u.email.toLowerCase()}:${value}`)
      .digest('hex');
    return (
      /^[a-f0-9]{64}$/.test(u.password_hash) &&
      timingSafeEqual(Buffer.from(hash), Buffer.from(u.password_hash))
    );
  }
  return false;
}
export async function issueSession(u: Account, c?: PoolConnection) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.SESSION_DAYS * 86400000);
  await rows(
    'INSERT INTO sesiones (id,usuario_id,token_hash,expira_en) VALUES (?,?,?,?)',
    [randomUUID(), u.id, tokenHash(token), sqlDate(expiresAt)],
    c,
  );
  return { token, expiresAt: expiresAt.toISOString(), user: publicUser(u) };
}
export async function createAccount(
  input: { nombre: string; matricula: string; email: string; password: string },
  rol: 'estudiante' | 'personal',
) {
  const hash = await bcrypt.hash(input.password, 12);
  return transaction(async c => {
    const id = randomUUID();
    await rows(
      'INSERT INTO usuarios (id,nombre,matricula,email,password_hash,password_algoritmo,rol) VALUES (?,?,?,?,?,?,?)',
      [id, input.nombre, input.matricula, input.email, hash, 'bcrypt', rol],
      c,
    );
    const [u] = await rows<Account>(
      'SELECT * FROM usuarios WHERE id=?',
      [id],
      c,
    );
    return issueSession(u, c);
  });
}
export async function authenticate(email: string, password: string) {
  const [u] = await rows<Account>('SELECT * FROM usuarios WHERE email=?', [
    email,
  ]);
  // Equal bcrypt work for missing accounts, without logging credentials.
  const valid = u
    ? await verifyPassword(u, password)
    : await bcrypt.compare(
        password,
        '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
      );
  if (!u || !valid || !u.activo)
    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Correo o contraseña incorrectos.',
    );
  return transaction(async c => {
    const [locked] = await rows<Account>(
      'SELECT * FROM usuarios WHERE id=? FOR UPDATE',
      [u.id],
      c,
    );
    if (
      !locked ||
      !locked.activo ||
      locked.email.toLowerCase() !== email ||
      (locked.password_hash !== u.password_hash &&
        !(await verifyPassword(locked, password)))
    )
      throw new ApiError(
        401,
        'INVALID_CREDENTIALS',
        'Correo o contraseña incorrectos.',
      );
    if (locked.password_algoritmo === 'sha256_legacy')
      await rows(
        "UPDATE usuarios SET password_hash=?,password_algoritmo='bcrypt' WHERE id=?",
        [await bcrypt.hash(password, 12), u.id],
        c,
      );
    return issueSession(locked, c);
  });
}
