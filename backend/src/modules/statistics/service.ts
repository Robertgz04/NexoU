import { DateTime } from 'luxon';
import type { PoolConnection } from 'mysql2/promise';
import { env } from '../../config/env.js';
import { rows, sqlDate, transaction } from '../../db/pool.js';

export function windows(periodo: 'semana' | 'mes' | 'anio', asOf = new Date()) {
  const now = DateTime.fromJSDate(asOf, { zone: env.APP_TIME_ZONE });
  const start = (
    periodo === 'anio'
      ? now.minus({ years: 1 })
      : now.minus({ days: periodo === 'semana' ? 6 : 29 })
  ).startOf('day');
  const days = Array.from({ length: 7 }, (_, i) =>
    now.minus({ days: 6 - i }).startOf('day'),
  );
  return {
    asOf: asOf.toISOString(),
    min: sqlDate(start.toJSDate()),
    max: sqlDate(asOf),
    days,
  };
}
export async function statistics(
  periodo: 'semana' | 'mes' | 'anio',
  asOf = new Date(),
) {
  const w = windows(periodo, asOf);
  // A single repeatable-read snapshot prevents disagreements between aggregates.
  return transaction(async (c: PoolConnection) => {
    const states = await rows(
      'SELECT estado_codigo,COUNT(*) AS total FROM reportes WHERE creado_en>=? AND creado_en<=? GROUP BY estado_codigo',
      [w.min, w.max],
      c,
    );
    const counts = { pendiente: 0, revision: 0, solucionado: 0 };
    for (const s of states)
      counts[s.estado_codigo as keyof typeof counts] = Number(s.total);
    const categories = await rows(
      `SELECT c.id,c.nombre AS categoria,COUNT(r.id) AS value FROM categorias c
      LEFT JOIN reportes r ON r.categoria_id=c.id AND r.creado_en>=? AND r.creado_en<=?
      GROUP BY c.id,c.nombre,c.orden ORDER BY c.orden,c.id`,
      [w.min, w.max],
      c,
    );
    const [top] = await rows(
      `SELECT a.id,a.nombre AS area,COUNT(*) AS total FROM reportes r JOIN areas a ON a.id=r.area_id
      WHERE r.creado_en>=? AND r.creado_en<=? GROUP BY a.id,a.nombre ORDER BY total DESC,a.id LIMIT 1`,
      [w.min, w.max],
      c,
    );
    let areaTop = null;
    if (top) {
      const [cat] = await rows(
        `SELECT c.nombre AS categoria,COUNT(*) AS total FROM reportes r JOIN categorias c ON c.id=r.categoria_id
        WHERE r.area_id=? AND r.creado_en>=? AND r.creado_en<=? GROUP BY c.id,c.nombre ORDER BY total DESC,c.id LIMIT 1`,
        [top.id, w.min, w.max],
        c,
      );
      areaTop = {
        area: top.area,
        total: Number(top.total),
        categoria: cat?.categoria,
      };
    }
    // UTC boundaries are calculated in application code; no SQL timezone tables required.
    const serie = [];
    for (const day of w.days) {
      const [count] = await rows(
        'SELECT COUNT(*) AS total FROM reportes WHERE creado_en>=? AND creado_en<? AND creado_en<=?',
        [
          sqlDate(day.toJSDate()),
          sqlDate(day.plus({ days: 1 }).toJSDate()),
          w.max,
        ],
        c,
      );
      serie.push({
        date: day.toISODate(),
        label: day.setLocale('es').toFormat('d LLL').replace('.', ''),
        value: Number(count.total),
      });
    }
    return {
      periodo,
      asOf: w.asOf,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      categories: categories.map(r => ({
        categoria: r.categoria,
        value: Number(r.value),
      })),
      areaTop,
      serie,
    };
  });
}
