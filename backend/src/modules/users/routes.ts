import { Router } from 'express';
import { personalData } from '../auth/validation.js';
import { publicUser, verifyPassword, type Account } from '../auth/service.js';
import { rows, transaction } from '../../db/pool.js';
import { ApiError } from '../../middleware/errors.js';
export const users = Router();
users.patch('/me', async (req, res) => {
  const input = personalData.parse(req.body);
  const updated = await transaction(async c => {
    const [u] = await rows<Account>(
      'SELECT * FROM usuarios WHERE id=? FOR UPDATE',
      [res.locals.user.id],
      c,
    );
    if (
      input.email !== u.email &&
      (!input.currentPassword ||
        !(await verifyPassword(u, input.currentPassword)))
    )
      throw new ApiError(
        403,
        'PASSWORD_REQUIRED',
        'La contraseña actual es incorrecta.',
      );
    await rows(
      'UPDATE usuarios SET nombre=?,matricula=?,email=? WHERE id=?',
      [input.nombre, input.matricula, input.email, u.id],
      c,
    );
    return (
      await rows<Account>('SELECT * FROM usuarios WHERE id=?', [u.id], c)
    )[0];
  });
  res.json(publicUser(updated));
});
