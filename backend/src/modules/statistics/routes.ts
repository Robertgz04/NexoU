import { Router } from 'express';
import { z } from 'zod';
import { statistics } from './service.js';
export const stats = Router();
stats.get('/', async (req, res) => {
  const { periodo } = z
    .object({ periodo: z.enum(['semana', 'mes', 'anio']).default('mes') })
    .strict()
    .parse(req.query);
  res.json(await statistics(periodo));
});
