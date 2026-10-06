import { Router } from 'express';
import { rows, isoDate } from '../../db/pool.js';
import {
  pageQuery,
  decodeCursor,
  encodeCursor,
} from '../reports/pagination.js';
export const notices = Router();
notices.get('/', async (req, res) => {
  const q = pageQuery
    .pick({ limit: true, cursor: true, tipo: true, estado: true })
    .parse(req.query);
  const where = ['1=1'];
  const params: unknown[] = [];
  if (q.tipo && q.tipo !== 'todas') {
    where.push('tipo=?');
    params.push(q.tipo);
  }
  if (q.estado) {
    where.push('estado=?');
    params.push(q.estado);
  }
  const filter = JSON.stringify({
    user: res.locals.user.id,
    tipo: q.tipo,
    estado: q.estado,
  });
  const cursor = decodeCursor(q.cursor, filter);
  const [count] = await rows(
    `SELECT COUNT(*) AS total FROM v_avisos_personal WHERE ${where.join(
      ' AND ',
    )}`,
    params,
  );
  if (cursor) {
    where.push('(ocurrido_en<? OR (ocurrido_en=? AND reporte_id<?))');
    params.push(cursor.date, cursor.date, cursor.id);
  }
  const found = await rows(
    `SELECT * FROM v_avisos_personal WHERE ${where.join(
      ' AND ',
    )} ORDER BY ocurrido_en DESC,reporte_id DESC LIMIT ${q.limit + 1}`,
    params,
  );
  const items = found.slice(0, q.limit);
  const last = items.at(-1);
  res.json({
    items: items.map(r => ({
      id: r.reporte_id,
      reportId: r.reporte_id,
      folio: r.folio,
      titulo: r.titulo,
      ownerNombre: r.usuario_nombre,
      area: r.area,
      estado: r.estado,
      tipo: r.tipo,
      tituloAviso: r.titulo_aviso,
      occurredAt: isoDate(r.ocurrido_en),
    })),
    total: Number(count.total),
    nextCursor:
      found.length > q.limit && last
        ? encodeCursor(last.ocurrido_en, last.reporte_id, filter)
        : null,
  });
});
