import { rows, isoDate } from '../../db/pool.js';
import { notFound } from '../../middleware/errors.js';
import type { Account } from '../auth/service.js';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

export function scope(user: Account, own = false) {
  return user.rol === 'estudiante' || own
    ? { sql: 'usuario_id=?', params: [user.id] }
    : { sql: '1=1', params: [] };
}
export function mapReport(r: RowDataPacket) {
  return {
    id: r.id,
    folio: r.folio,
    ownerId: r.usuario_id,
    ownerNombre: r.usuario_nombre,
    titulo: r.titulo,
    descripcion: r.descripcion,
    areaId: String(r.area_id),
    area: r.area,
    categoriaId: String(r.categoria_id),
    categoria: r.categoria,
    estado: r.estado,
    evidenceUrl: r.evidencia_clave ? `/reports/${r.id}/evidence` : null,
    createdAt: isoDate(r.creado_en),
    updatedAt: isoDate(r.actualizado_en),
  };
}
export async function detail(id: string, user: Account, c?: PoolConnection) {
  const s = scope(user);
  const [r] = await rows(
    `SELECT * FROM v_reportes_detalle WHERE id=? AND ${s.sql}`,
    [id, ...s.params],
    c,
  );
  if (!r) throw notFound();
  const history = await rows(
    `SELECT h.*,u.nombre AS autor FROM historial_estados h JOIN usuarios u ON u.id=h.cambiado_por
    WHERE h.reporte_id=? AND h.estado_anterior IS NOT NULL ORDER BY h.cambiado_en,h.id`,
    [id],
    c,
  );
  return {
    ...mapReport(r),
    statusUpdates: history.map(h => ({
      id: String(h.id),
      from: h.estado_anterior,
      to: h.estado_nuevo,
      note: h.nota || '',
      createdAt: isoDate(h.cambiado_en),
      authorId: h.cambiado_por,
      authorName: h.autor,
    })),
  };
}
