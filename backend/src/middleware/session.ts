import type { RequestHandler } from 'express';
import { rows } from '../db/pool.js';
import { tokenHash, type Account } from '../modules/auth/service.js';
import { ApiError } from './errors.js';

declare global {
  namespace Express {
    interface Locals {
      user: Account;
      sessionId: string;
      requestId: string;
    }
  }
}
export const session: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !/^Bearer [A-Za-z0-9_-]{43}$/.test(header))
    throw new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
  const [u] = await rows<Account>(
    `SELECT u.*,s.id AS session_id FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id
    WHERE s.token_hash=? AND s.revocado_en IS NULL AND s.expira_en>UTC_TIMESTAMP(3) AND u.activo=1`,
    [tokenHash(header.slice(7))],
  );
  if (!u)
    throw new ApiError(
      401,
      'SESSION_EXPIRED',
      'Tu sesión terminó. Inicia sesión de nuevo.',
    );
  res.locals.user = u;
  res.locals.sessionId = u.session_id;
  next();
};
export const role =
  (rol: string): RequestHandler =>
  (_req, res, next) => {
    if (res.locals.user.rol !== rol)
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Tu cuenta no tiene permiso para esta operación.',
      );
    next();
  };
