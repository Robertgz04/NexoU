import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { errors, notFound } from './middleware/errors.js';
import { session, role } from './middleware/session.js';
import { auth } from './modules/auth/routes.js';
import { users } from './modules/users/routes.js';
import { catalogs } from './modules/catalogs/routes.js';
import { reports } from './modules/reports/routes.js';
import { stats } from './modules/statistics/routes.js';
import { notices } from './modules/notices/routes.js';
import { devices } from './modules/devices/routes.js';
import { rows } from './db/pool.js';
import { env } from './config/env.js';
export const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.locals.requestId = randomUUID();
  res.set('X-Request-Id', res.locals.requestId);
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.once('finish', () => {
    if (env.NODE_ENV !== 'test')
      console.log(
        JSON.stringify({
          requestId: res.locals.requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      );
  });
  next();
});
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.get(['/health', '/api/v1/health'], (_req, res) =>
  res.json({ status: 'ok' }),
);
// Bind operational readiness to loopback requests only.
app.get('/ready', async (req, res) => {
  if (
    !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
      req.socket.remoteAddress || '',
    )
  )
    throw notFound();
  try {
    await rows('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
app.use(
  '/api/v1',
  rateLimit({
    windowMs: 60000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT',
          message: 'Demasiadas solicitudes. Intenta más tarde.',
        },
        requestId: res.locals.requestId,
      }),
  }),
);
app.use('/api/v1/auth', auth);
app.use('/api/v1', session);
app.use('/api/v1/users', users);
app.use('/api/v1/catalogs', catalogs);
app.use('/api/v1/reports', reports);
app.use('/api/v1/staff/statistics', role('personal'), stats);
app.use('/api/v1/staff/notices', role('personal'), notices);
app.use('/api/v1/devices', devices);
app.use((_req, _res) => {
  throw notFound();
});
app.use(errors);
