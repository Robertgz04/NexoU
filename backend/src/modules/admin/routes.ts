import { Router } from 'express';
import { z } from 'zod';
import { rows, transaction } from '../../db/pool.js';
import { ApiError, notFound } from '../../middleware/errors.js';
import { catalogKind, catalogInput, institutionInput } from './validation.js';

export const administration = Router();
export const institution = Router();
institution.get('/', async (_req, res) => {
  const [value] = await rows(
    'SELECT nombre,correo_soporte,ubicacion_soporte FROM institucion WHERE id=1',
  );
  if (!value) throw notFound();
  res.json(value);
});
administration.put('/institution', async (req, res) => {
  const value = institutionInput.parse(req.body);
  await rows(
    'UPDATE institucion SET nombre=?,correo_soporte=?,ubicacion_soporte=? WHERE id=1',
    [value.nombre, value.correo_soporte, value.ubicacion_soporte],
  );
  res.json(value);
});
administration.get('/catalogs/:kind', async (req, res) => {
  const kind = catalogKind.parse(req.params.kind);
  const values = await rows(
    `SELECT id,nombre,orden,activo FROM ${kind} ORDER BY orden,id`,
  );
  res.json(values.map(value => ({ ...value, activo: Boolean(value.activo) })));
});
administration.post('/catalogs/:kind', async (req, res) => {
  const kind = catalogKind.parse(req.params.kind);
  const input = catalogInput(kind).parse(req.body);
  try {
    const value = await transaction(async c => {
      await rows(
        `INSERT INTO ${kind} (nombre,orden,activo) VALUES (?,?,?)`,
        [input.nombre, input.orden, Number(input.activo)],
        c,
      );
      const [created] = await rows(
        `SELECT id FROM ${kind} WHERE id=LAST_INSERT_ID()`,
        [],
        c,
      );
      return { id: created.id, ...input };
    });
    res.status(201).json(value);
  } catch (error) {
    duplicate(error);
  }
});
administration.put('/catalogs/:kind/:id', async (req, res) => {
  const kind = catalogKind.parse(req.params.kind);
  const id = z.coerce.number().int().positive().max(65535).parse(req.params.id);
  const input = catalogInput(kind).parse(req.body);
  try {
    await transaction(async c => {
      const [existing] = await rows(
        `SELECT id FROM ${kind} WHERE id=? FOR UPDATE`,
        [id],
        c,
      );
      if (!existing) throw notFound();
      await rows(
        `UPDATE ${kind} SET nombre=?,orden=?,activo=? WHERE id=?`,
        [input.nombre, input.orden, Number(input.activo), id],
        c,
      );
    });
    res.json({ id, ...input });
  } catch (error) {
    duplicate(error);
  }
});
function duplicate(error: unknown): never {
  if ((error as { code?: string }).code === 'ER_DUP_ENTRY')
    throw new ApiError(
      409,
      'DUPLICATE',
      'Ya existe una zona o categoría con ese nombre.',
    );
  throw error;
}
