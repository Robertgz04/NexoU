import { Router } from 'express';
import { z } from 'zod';
import { transaction, rows } from '../../db/pool.js';
import { ApiError, notFound } from '../../middleware/errors.js';
export const devices = Router();
devices.put('/:installationId', async (req, res) => {
  const id = z.string().uuid().parse(req.params.installationId);
  const input = z
    .object({
      token: z
        .string()
        .trim()
        .min(1)
        .max(512)
        .regex(/^[\x21-\x7e]+$/),
      plataforma: z.enum(['android', 'ios']),
    })
    .strict()
    .parse(req.body);
  await transaction(async c => {
    const [existing] = await rows(
      'SELECT usuario_id FROM dispositivos_push WHERE id=? FOR UPDATE',
      [id],
      c,
    );
    if (existing && existing.usuario_id !== res.locals.user.id)
      throw new ApiError(
        403,
        'DEVICE_OWNER',
        'Desvincula el dispositivo de la cuenta anterior antes de asociarlo.',
      );
    // Firebase token possession permits transfer; stale associations are removed atomically.
    await rows(
      'DELETE FROM dispositivos_push WHERE token=? AND id<>?',
      [input.token, id],
      c,
    );
    await rows(
      `INSERT INTO dispositivos_push (id,usuario_id,plataforma,token) VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE token=VALUES(token),plataforma=VALUES(plataforma),habilitado=1`,
      [id, res.locals.user.id, input.plataforma, input.token],
      c,
    );
  });
  res.status(204).end();
});
devices.delete('/:installationId', async (req, res) => {
  const id = z.string().uuid().parse(req.params.installationId);
  await transaction(async c => {
    const [r] = await rows(
      'SELECT usuario_id FROM dispositivos_push WHERE id=? FOR UPDATE',
      [id],
      c,
    );
    if (r && r.usuario_id !== res.locals.user.id) throw notFound();
    await rows(
      'DELETE FROM dispositivos_push WHERE id=? AND usuario_id=?',
      [id, res.locals.user.id],
      c,
    );
  });
  res.status(204).end();
});
