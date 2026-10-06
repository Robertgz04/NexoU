import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getMessaging, type Message } from 'firebase-admin/messaging';
import { env } from '../../config/env.js';
import { rows, transaction } from '../../db/pool.js';

export async function deliverOne(
  send?: (message: Message) => Promise<unknown>,
) {
  if (!send && env.PUSH_ENABLED !== 'true') return false;
  if (!send && !getApps().length)
    initializeApp({ credential: applicationDefault() });
  const dispatch = send || ((message: Message) => getMessaging().send(message));
  const job = await transaction(async c => {
    const [j] = await rows(
      `SELECT * FROM push_outbox WHERE estado IN ('pendiente','enviando') AND disponible_en<=UTC_TIMESTAMP(3) ORDER BY id LIMIT 1 FOR UPDATE`,
      [],
      c,
    );
    if (!j) return null;
    await rows(
      "UPDATE push_outbox SET estado='enviando',intentos=intentos+1,disponible_en=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE) WHERE id=?",
      [j.id],
      c,
    );
    return j;
  });
  if (!job) return false;
  const [valid] = await rows(
    `SELECT d.id FROM dispositivos_push d JOIN usuarios u ON u.id=d.usuario_id JOIN reportes r ON r.id=?
    WHERE d.id=? AND d.usuario_id=? AND d.token=? AND d.habilitado=1 AND u.activo=1 AND (u.rol='personal' OR r.usuario_id=u.id)`,
    [job.reporte_id, job.dispositivo_id, job.usuario_id, job.token],
  );
  if (!valid) {
    await rows(
      "UPDATE push_outbox SET estado='descartado',finalizado_en=UTC_TIMESTAMP(3) WHERE id=?",
      [job.id],
    );
    return true;
  }
  try {
    await dispatch({
      token: job.token,
      notification: {
        title: 'NexoU',
        body: 'Hay una actualización disponible. Abre la app para consultarla.',
      },
      data: { reportId: job.reporte_id, eventId: String(job.historial_id) },
      android: { collapseKey: String(job.historial_id) },
      apns: { headers: { 'apns-collapse-id': String(job.historial_id) } },
    });
    await rows(
      "UPDATE push_outbox SET estado='enviado',finalizado_en=UTC_TIMESTAMP(3) WHERE id=?",
      [job.id],
    );
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (
      [
        'messaging/registration-token-not-registered',
        'messaging/invalid-registration-token',
      ].includes(code || '')
    ) {
      await transaction(async c => {
        await rows(
          'DELETE FROM dispositivos_push WHERE id=? AND usuario_id=? AND token=?',
          [job.dispositivo_id, job.usuario_id, job.token],
          c,
        );
        await rows(
          "UPDATE push_outbox SET estado='descartado',finalizado_en=UTC_TIMESTAMP(3) WHERE id=?",
          [job.id],
          c,
        );
      });
    } else
      await rows(
        "UPDATE push_outbox SET estado='pendiente',disponible_en=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL ? SECOND) WHERE id=?",
        [
          Math.min(3600, 2 ** Math.min(12, Number(job.intentos) + 1) * 10),
          job.id,
        ],
      );
  }
  return true;
}
