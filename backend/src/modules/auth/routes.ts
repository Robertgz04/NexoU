import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { registration, password } from './validation.js';
import { authenticate, createAccount, publicUser } from './service.js';
import { session } from '../../middleware/session.js';
import { rows, transaction } from '../../db/pool.js';

export const auth = Router();
const limit = rateLimit({
  windowMs: 900000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res
      .status(429)
      .json({
        error: {
          code: 'RATE_LIMIT',
          message: 'Demasiados intentos. Intenta más tarde.',
        },
        requestId: res.locals.requestId,
      }),
});
auth.post('/register', limit, async (req, res) =>
  res
    .status(201)
    .json(await createAccount(registration.parse(req.body), 'estudiante')),
);
auth.post('/login', limit, async (req, res) => {
  const input = z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      password,
    })
    .strict()
    .parse(req.body);
  res.json(await authenticate(input.email, input.password));
});
auth.get('/me', session, (_req, res) => res.json(publicUser(res.locals.user)));
auth.post('/logout', session, async (req, res) => {
  const { installationId } = z
    .object({ installationId: z.string().uuid().optional() })
    .strict()
    .parse(req.body || {});
  await transaction(async c => {
    await rows(
      'UPDATE sesiones SET revocado_en=UTC_TIMESTAMP(3) WHERE id=?',
      [res.locals.sessionId],
      c,
    );
    if (installationId)
      await rows(
        'DELETE FROM dispositivos_push WHERE id=? AND usuario_id=?',
        [installationId, res.locals.user.id],
        c,
      );
  });
  res.status(204).end();
});
