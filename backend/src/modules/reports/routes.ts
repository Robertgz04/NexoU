import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { rows, connection, transaction } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { role } from '../../middleware/session.js';
import { ApiError, notFound } from '../../middleware/errors.js';
import { savePhoto, removePhoto, filePath } from '../../storage/files.js';
import { detail, mapReport, scope } from './service.js';
import { pageQuery, decodeCursor, encodeCursor } from './pagination.js';

export const reports = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_PHOTO_BYTES,
    files: 1,
    fields: 4,
    fieldSize: 4096,
    parts: 5,
  },
});
const createSchema = z
  .object({
    titulo: z.string().trim().min(1).max(80),
    descripcion: z.string().trim().min(1).max(500),
    areaId: z.coerce.number().int().positive(),
    categoriaId: z.coerce.number().int().positive(),
  })
  .strict();
reports.post(
  '/',
  role('estudiante'),
  upload.single('photo'),
  async (req, res) => {
    const input = createSchema.parse(req.body);
    const photo = req.file
      ? await savePhoto(req.file.buffer, req.file.mimetype)
      : null;
    const id = randomUUID();
    try {
      await transaction(async c => {
        const [valid] = await rows(
          'SELECT (SELECT COUNT(*) FROM areas WHERE id=? AND activo=1) * (SELECT COUNT(*) FROM categorias WHERE id=? AND activo=1) AS valid',
          [input.areaId, input.categoriaId],
          c,
        );
        if (!valid.valid)
          throw new ApiError(
            400,
            'INVALID_CATALOG',
            'El área o categoría ya no está disponible.',
          );
        await rows(
          'INSERT INTO reportes (id,usuario_id,titulo,descripcion,area_id,categoria_id) VALUES (?,?,?,?,?,?)',
          [
            id,
            res.locals.user.id,
            input.titulo,
            input.descripcion,
            input.areaId,
            input.categoriaId,
          ],
          c,
        );
        if (photo)
          await rows(
            'INSERT INTO evidencias (reporte_id,archivo_clave,mime_type,tamano_bytes) VALUES (?,?,?,?)',
            [id, photo.key, photo.mime, photo.bytes],
            c,
          );
      });
    } catch (e) {
      if (photo) await removePhoto(photo.key);
      throw e;
    }
    res.status(201).json(await detail(id, res.locals.user));
  },
);
reports.get('/summary', async (req, res) => {
  const { own } = z
    .object({ own: z.enum(['true', 'false']).optional() })
    .strict()
    .parse(req.query);
  const s = scope(res.locals.user, own === 'true');
  const result = await rows(
    `SELECT estado_codigo,COUNT(*) AS total FROM reportes WHERE ${s.sql} GROUP BY estado_codigo`,
    s.params,
  );
  const counts = { pendiente: 0, revision: 0, solucionado: 0 };
  for (const r of result)
    counts[r.estado_codigo as keyof typeof counts] = Number(r.total);
  res.json({
    ...counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  });
});
reports.get('/', async (req, res) => {
  const q = pageQuery.omit({ tipo: true }).parse(req.query);
  const s = scope(res.locals.user, q.own === 'true');
  const where = [s.sql];
  const params: unknown[] = [...s.params];
  if (q.estado) {
    where.push('estado=?');
    params.push(q.estado);
  }
  if (q.areaId) {
    where.push('area_id=?');
    params.push(q.areaId);
  }
  if (q.area) {
    where.push('area=?');
    params.push(q.area);
  }
  if (q.categoriaId) {
    where.push('categoria_id=?');
    params.push(q.categoriaId);
  }
  if (q.search) {
    where.push(
      '(LOCATE(?,titulo)>0 OR LOCATE(?,descripcion)>0 OR LOCATE(?,folio)>0)',
    );
    params.push(q.search, q.search, q.search);
  }
  const filter = JSON.stringify({
    user: res.locals.user.id,
    ...q,
    cursor: undefined,
    limit: undefined,
  });
  const cursor = decodeCursor(q.cursor, filter);
  const [count] = await rows(
    `SELECT COUNT(*) AS total FROM v_reportes_detalle WHERE ${where.join(
      ' AND ',
    )}`,
    params,
  );
  if (cursor) {
    where.push('(creado_en<? OR (creado_en=? AND id<?))');
    params.push(cursor.date, cursor.date, cursor.id);
  }
  const found = await rows(
    `SELECT * FROM v_reportes_detalle WHERE ${where.join(
      ' AND ',
    )} ORDER BY creado_en DESC,id DESC LIMIT ${q.limit + 1}`,
    params,
  );
  const items = found.slice(0, q.limit);
  const last = items.at(-1);
  res.json({
    items: items.map(mapReport),
    total: Number(count.total),
    nextCursor:
      found.length > q.limit && last
        ? encodeCursor(last.creado_en, last.id, filter)
        : null,
  });
});
reports.get('/:id/evidence', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const s = scope(res.locals.user);
  const [r] = await rows(
    `SELECT evidencia_clave,evidencia_mime FROM v_reportes_detalle WHERE id=? AND ${s.sql}`,
    [id, ...s.params],
  );
  if (!r?.evidencia_clave) throw notFound();
  res.set({
    'Cache-Control': 'private, no-store',
    'Content-Type': r.evidencia_mime,
    'X-Content-Type-Options': 'nosniff',
  });
  res.sendFile(filePath(r.evidencia_clave), e => {
    if (e && !res.headersSent)
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'La evidencia no está disponible.',
        },
        requestId: res.locals.requestId,
      });
  });
});
reports.get('/:id', async (req, res) =>
  res.json(
    await detail(z.string().uuid().parse(req.params.id), res.locals.user),
  ),
);
reports.patch('/:id/status', role('personal'), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const input = z
    .object({
      estado: z.enum(['pendiente', 'revision', 'solucionado']),
      note: z.string().trim().max(500).default(''),
    })
    .strict()
    .parse(req.body);
  await detail(id, res.locals.user);
  for (let attempt = 0; ; attempt++) {
    const c = await connection();
    try {
      await c.execute('CALL cambiar_estado_reporte(?,?,?,?)', [
        id,
        input.estado,
        res.locals.user.id,
        input.note,
      ]);
      break;
    } catch (e) {
      if ((e as { code: string }).code !== 'ER_LOCK_DEADLOCK' || attempt >= 2)
        throw e;
      console.warn(
        JSON.stringify({
          requestId: res.locals.requestId,
          code: 'DEADLOCK_RETRY',
          attempt,
        }),
      );
    } finally {
      c.release();
    }
  }
  res.json(await detail(id, res.locals.user));
});
