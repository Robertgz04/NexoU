import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { sql, literal } from './mysql-client.mjs';

const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
const student = `verify_e_${suffix}`;
const staff = `verify_p_${suffix}`;
const report = `verify_r_${suffix}`;
const sessionId = randomUUID();
const deviceId = randomUUID();
const sessionId2 = randomUUID();
const deviceId2 = randomUUID();
function assert(query, expected, description) {
  if (sql(query).trim() !== String(expected)) throw new Error(description);
}
function reject(query, description) {
  let rejected = false;
  try { sql(query); } catch { rejected = true; }
  if (!rejected) throw new Error(description);
}
try {
  console.log(sql(readFileSync('database/mysql/04_validacion.sql', 'utf8')).trim());
  sql(`INSERT INTO usuarios (id,nombre,matricula,email,password_hash,password_algoritmo,rol) VALUES
    (${literal(student)},'Validacion estudiante',${literal(student)},${literal(student+'@virtual.utsc.edu.mx')},'TEST_ONLY_NO_LOGIN','bcrypt','estudiante'),
    (${literal(staff)},'Validacion personal',${literal(staff)},${literal(staff+'@virtual.utsc.edu.mx')},'TEST_ONLY_NO_LOGIN','bcrypt','personal');
    INSERT INTO reportes (id,usuario_id,titulo,descripcion,area_id,categoria_id)
      SELECT ${literal(report)},${literal(student)},'Validacion','Validacion',a.id,c.id
      FROM areas a CROSS JOIN categorias c WHERE a.nombre='Edificio A' AND c.nombre='Electricidad';`);
  const call = (state, actor, note) => `CALL cambiar_estado_reporte(${literal(report)},${literal(state)},${literal(actor)},${literal(note)});`;
  sql(call('revision', staff, '  Se revisó la luminaria.  '));
  assert(`SELECT COUNT(*) FROM historial_estados WHERE reporte_id=${literal(report)} AND nota='Se revisó la luminaria.' AND cambiado_por=${literal(staff)};`, 1, 'Nota/actor incorrectos');
  sql(call('revision', staff, 'No debe sustituir la nota'));
  assert(`SELECT COUNT(*) FROM historial_estados WHERE reporte_id=${literal(report)};`, 2, 'Estado repetido genero evento');
  assert(`SELECT COUNT(*) FROM historial_estados WHERE reporte_id=${literal(report)} AND nota='Se revisó la luminaria.';`, 1, 'Estado repetido cambio la nota');
  reject(call('solucionado', student, 'No permitido'), 'Estudiante pudo cambiar estado');
  reject(call('solucionado', staff, 'a'.repeat(501)), 'Nota de 501 caracteres aceptada');
  assert(`SELECT estado_codigo FROM reportes WHERE id=${literal(report)};`, 'revision', 'Error no revirtio estado');
  sql(call('solucionado', staff, 'á'.repeat(500)));
  assert(`SELECT COUNT(*) FROM historial_estados WHERE reporte_id=${literal(report)} AND CHAR_LENGTH(nota)=500;`, 1, 'Nota Unicode de 500 caracteres no conservada');
  sql(call('pendiente', staff, 'Se reabre para comprobar el equipo.'));
  assert(`SELECT COUNT(*) FROM reportes WHERE id=${literal(report)} AND solucionado_en IS NULL;`, 1, 'Reapertura no limpio fecha');
  sql(`UPDATE usuarios SET activo=FALSE WHERE id=${literal(staff)};`);
  reject(call('pendiente', staff, ''), 'Personal inactivo paso autorizacion de estado repetido');
  reject(`CALL cambiar_estado_reporte('verify_no_existe','revision',${literal(student)},'');`, 'Se permitio actor estudiante');
  sql(`UPDATE usuarios SET activo=TRUE WHERE id=${literal(staff)};`);
  reject(`CALL cambiar_estado_reporte('verify_no_existe','revision',${literal(staff)},'');`, 'Se permitio reporte inexistente');
  reject(`INSERT INTO reportes (id,usuario_id,titulo,descripcion,area_id,categoria_id)
    SELECT 'verify_largo_${suffix}',${literal(student)},REPEAT('x',81),'Prueba',a.id,c.id FROM areas a CROSS JOIN categorias c LIMIT 1;`, 'Titulo largo no fue rechazado');
  sql(`INSERT INTO sesiones (id,usuario_id,token_hash,expira_en) VALUES (${literal(sessionId)},${literal(student)},SHA2(${literal(suffix)},256),UTC_TIMESTAMP(3)+INTERVAL 1 DAY);
    INSERT INTO dispositivos_push (id,usuario_id,plataforma,token) VALUES (${literal(deviceId)},${literal(student)},'android',${literal('verify_'+suffix)});`);
  reject(`INSERT INTO sesiones (id,usuario_id,token_hash,expira_en) VALUES (${literal(sessionId2)},${literal(student)},SHA2(${literal(suffix)},256),UTC_TIMESTAMP(3)+INTERVAL 1 DAY);`, 'Se duplico token de sesion');
  reject(`INSERT INTO sesiones (id,usuario_id,token_hash,expira_en) VALUES (${literal(sessionId2)},${literal(student)},SHA2('invalida',256),UTC_TIMESTAMP(3)-INTERVAL 1 DAY);`, 'Se permitio sesion expirada antes del alta');
  reject(`INSERT INTO dispositivos_push (id,usuario_id,plataforma,token) VALUES (${literal(deviceId2)},${literal(staff)},'ios',${literal('verify_'+suffix)});`, 'Token push duplicado entre usuarios');
  assert("SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA='nexou' AND TRIGGER_NAME IN ('bi_reportes','ai_reportes','bu_reportes','au_reportes','ai_historial_push','au_usuarios_revocar_sesiones') AND SQL_MODE LIKE '%STRICT_TRANS_TABLES%';", 6, 'Triggers ausentes o sin modo estricto');
  assert("SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='nexou' AND ROUTINE_NAME='cambiar_estado_reporte' AND SQL_MODE LIKE '%STRICT_TRANS_TABLES%';", 1, 'Rutina sin modo estricto');
  // Dos conexiones independientes cambian el mismo reporte al mismo tiempo.
  const concurrent = (state, note) => new Promise((resolve, rejectPromise) => {
    const code = `import {sql} from './scripts/mysql-client.mjs'; sql(${JSON.stringify(call(state, staff, note))});`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { windowsHide: true, stdio: 'ignore' });
    child.on('error', rejectPromise);
    child.on('exit', exitCode => exitCode === 0 ? resolve() : rejectPromise(new Error('Fallo cambio concurrente')));
  });
  await Promise.all([concurrent('revision', 'Nota concurrente revision'), concurrent('solucionado', 'Nota concurrente solucion')]);
  assert(`SELECT COUNT(*) FROM historial_estados WHERE reporte_id=${literal(report)} AND
    ((estado_nuevo='revision' AND nota='Nota concurrente revision') OR (estado_nuevo='solucionado' AND nota='Nota concurrente solucion'));`, 2, 'Concurrencia mezclo notas entre transiciones');
  assert(`SELECT COUNT(*) FROM push_outbox WHERE reporte_id=${literal(report)};`, 2, 'Outbox no se creó con el historial');
  sql(`UPDATE usuarios SET activo=FALSE WHERE id=${literal(student)};`);
  assert(`SELECT COUNT(*) FROM sesiones WHERE id=${literal(sessionId)} AND revocado_en IS NOT NULL;`, 1, 'Desactivacion no revoco sesion');
  assert(`SELECT COUNT(*) FROM dispositivos_push WHERE id=${literal(deviceId)};`, 0, 'Desactivacion no desvinculo dispositivo');
  console.log('OK: notas, Unicode, no-op, roles, reapertura, errores atomicos, sesiones, tokens, modo estricto, concurrencia, outbox y revocacion.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // CALL hace COMMIT: limpiar solo los IDs aleatorios de esta ejecucion, sin borrar datos reales.
  sql(`START TRANSACTION;
    DELETE FROM push_outbox WHERE reporte_id IN (${literal(report)},'verify_largo_${suffix}');
    DELETE FROM dispositivos_push WHERE id IN (${literal(deviceId)},${literal(deviceId2)});
    DELETE FROM sesiones WHERE id IN (${literal(sessionId)},${literal(sessionId2)});
    DELETE FROM evidencias WHERE reporte_id=${literal(report)};
    DELETE FROM historial_estados WHERE reporte_id IN (${literal(report)},'verify_largo_${suffix}');
    DELETE FROM reportes WHERE id IN (${literal(report)},'verify_largo_${suffix}');
    DELETE FROM usuarios WHERE id IN (${literal(student)},${literal(staff)});
    COMMIT;`);
}
