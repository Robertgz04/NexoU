import { z } from 'zod';
import { createHash } from 'node:crypto';
import { ApiError } from '../../middleware/errors.js';
export const pageQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().max(500).optional(),
    estado: z.enum(['pendiente', 'revision', 'solucionado']).optional(),
    own: z.enum(['true', 'false']).optional(),
    search: z.string().trim().max(80).optional(),
    areaId: z.coerce.number().int().positive().optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
    area: z.string().trim().min(1).max(100).optional(),
    tipo: z.enum(['todas', 'aviso', 'estado']).optional(),
  })
  .strict();
const cursorSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/),
  id: z.string().uuid(),
  filter: z.string(),
});
const fingerprint = (filter: string) =>
  createHash('sha256').update(filter).digest('hex');
export const encodeCursor = (date: string, id: string, filter: string) =>
  Buffer.from(
    JSON.stringify({ date, id, filter: fingerprint(filter) }),
  ).toString('base64url');
export function decodeCursor(cursor: string | undefined, filter: string) {
  if (!cursor) return null;
  try {
    const value = cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString()),
    );
    if (value.filter !== fingerprint(filter)) throw new Error();
    return value;
  } catch {
    throw new ApiError(
      400,
      'INVALID_CURSOR',
      'El cursor no es válido para estos filtros.',
    );
  }
}
