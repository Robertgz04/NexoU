import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  readFileSync,
  mkdtempSync,
  rmSync,
  readdirSync,
  writeFileSync,
  utimesSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import supertest from 'supertest';
import sharp from 'sharp';

test(
  'API completa contra MariaDB aislada',
  { skip: process.env.RUN_DB_TESTS !== 'true' },
  async () => {
    const project = resolve('..');
    loadEnvFile(resolve(project, '.env'));
    const db = `nexou_test_${randomBytes(8).toString('hex')}`;
    assert.match(db, /^nexou_test_[a-f0-9]{16}$/);
    const mysql = process.env.MYSQL_BIN || 'C:/xampp/mysql/bin/mysql.exe';
    function admin(sql: string) {
      const r = spawnSync(
        mysql,
        [
          '--host=127.0.0.1',
          `--port=${process.env.DB_PORT}`,
          '--user=root',
          '--batch',
        ],
        { input: sql, encoding: 'utf8', windowsHide: true },
      );
      assert.equal(
        r.status,
        0,
        'No se pudo preparar la base aislada con el administrador local.',
      );
    }
    const upload = mkdtempSync(resolve(tmpdir(), 'nexou-test-'));
    process.env.DB_NAME = db;
    process.env.UPLOAD_DIR = upload;
    process.env.NODE_ENV = 'test';
    let dbPool: { end: () => Promise<void> } | undefined;
    let granted = false;
    try {
      admin(
        readFileSync(
          resolve(project, 'database/mysql/01_esquema.sql'),
          'utf8',
        ).replace(/\bnexou\b/g, db),
      );
      assert.match(process.env.DB_USER!, /^[a-zA-Z0-9_]+$/);
      admin(
        `GRANT ALL PRIVILEGES ON ${db}.* TO '${process.env.DB_USER}'@'localhost';`,
      );
      granted = true;
      admin(
        `USE ${db};\n` +
          readFileSync(
            resolve(project, 'database/mysql/02_catalogos.sql'),
            'utf8',
          ).replace(/\bnexou\b/g, db),
      );
      const migration = spawnSync(
        process.execPath,
        ['scripts/migrate-mysql.mjs'],
        { cwd: project, env: process.env, encoding: 'utf8', windowsHide: true },
      );
      assert.equal(migration.status, 0, 'Migrador de pruebas falló.');
      const { app } = await import('../src/app.js');
      const { pool, rows, connection, strictMode } = await import(
        '../src/db/pool.js'
      );
      dbPool = pool;
      const { createAccount } = await import('../src/modules/auth/service.js');
      const { deliverOne } = await import('../src/modules/devices/worker.js');
      const { statistics } = await import(
        '../src/modules/statistics/service.js'
      );
      const { cleanOrphans } = await import('../src/storage/files.js');
      const request = supertest(app);
      const conn = await Promise.all([
        connection(),
        connection(),
        connection(),
      ]);
      for (const c of conn) {
        const [settings] = await rows(
          'SELECT @@time_zone AS tz,@@sql_mode AS mode',
          [],
          c,
        );
        assert.equal(settings.tz, '+00:00');
        assert.deepEqual(
          new Set(settings.mode.split(',')),
          new Set(strictMode.split(',')),
        );
        c.release();
      }
      assert.equal((await request.get('/health')).status, 200);
      assert.equal((await request.get('/api/v1/reports')).status, 401);
      const input = {
        nombre: 'Estudiante uno',
        matricula: 'a001',
        email: 'a001@virtual.utsc.edu.mx',
        password: 'prueba-segura',
      };
      assert.equal(
        (
          await request
            .post('/api/v1/auth/register')
            .send({ ...input, rol: 'personal' })
        ).status,
        400,
      );
      assert.equal(
        (
          await request
            .post('/api/v1/auth/register')
            .send({ ...input, email: 'otra@virtual.utsc.edu.mx' })
        ).status,
        400,
      );
      const one = await request.post('/api/v1/auth/register').send(input);
      assert.equal(one.status, 201);
      const first = one.body;
      assert.ok(!('passwordHash' in first.user));
      assert.equal(first.token.length, 43);
      assert.equal(
        (await request.post('/api/v1/auth/register').send(input)).status,
        409,
      );
      const second = (
        await request.post('/api/v1/auth/register').send({
          ...input,
          matricula: 'a002',
          email: 'a002@virtual.utsc.edu.mx',
        })
      ).body;
      const staff = await createAccount(
        { ...input, matricula: 'p001', email: 'p001@virtual.utsc.edu.mx' },
        'personal',
      );
      const bearer = (token: string) => `Bearer ${token}`;
      const student = request
        .get('/api/v1/auth/me')
        .set('Authorization', bearer(first.token));
      assert.equal((await student).status, 200);
      const [hashed] = await rows(
        'SELECT token_hash FROM sesiones WHERE usuario_id=?',
        [first.user.id],
      );
      assert.notEqual(hashed.token_hash, first.token);
      assert.equal(hashed.token_hash.length, 64);
      assert.equal(
        (
          await request
            .patch('/api/v1/users/me')
            .set('Authorization', bearer(first.token))
            .send({
              nombre: 'Ana',
              matricula: 'a003',
              email: 'a003@virtual.utsc.edu.mx',
            })
        ).status,
        403,
      );
      assert.equal(
        (
          await request
            .patch('/api/v1/users/me')
            .set('Authorization', bearer(first.token))
            .send({
              nombre: 'Ana',
              matricula: 'a003',
              email: 'a003@virtual.utsc.edu.mx',
              currentPassword: input.password,
            })
        ).status,
        200,
      );
      const device = randomUUID();
      assert.equal(
        (
          await request
            .put(`/api/v1/devices/${device}`)
            .set('Authorization', bearer(first.token))
            .send({ token: 'test-fcm-token', plataforma: 'android' })
        ).status,
        204,
      );
      assert.equal(
        (
          await request
            .delete(`/api/v1/devices/${device}`)
            .set('Authorization', bearer(second.token))
        ).status,
        404,
      );
      assert.equal(
        (
          await request
            .put(`/api/v1/devices/${device}`)
            .set('Authorization', bearer(second.token))
            .send({ token: 'different', plataforma: 'android' })
        ).status,
        403,
      );
      const catalog = (
        await request
          .get('/api/v1/catalogs')
          .set('Authorization', bearer(first.token))
      ).body;
      const report = {
        titulo: 'Falla en equipo',
        descripcion: 'Revisar equipo del aula',
        areaId: catalog.areas[0].id,
        categoriaId: catalog.categorias[0].id,
      };
      const photo = await sharp({
        create: { width: 2, height: 2, channels: 3, background: 'red' },
      })
        .png()
        .toBuffer();
      const created = await request
        .post('/api/v1/reports')
        .set('Authorization', bearer(first.token))
        .field(report)
        .attach('photo', photo, 'foto.png');
      assert.equal(created.status, 201);
      const countBefore = readdirSync(upload).length;
      assert.equal(
        (
          await request
            .post('/api/v1/reports')
            .set('Authorization', bearer(first.token))
            .field({ ...report, areaId: 65534 })
            .attach('photo', photo, 'foto.png')
        ).status,
        400,
      );
      assert.equal(readdirSync(upload).length, countBefore);
      assert.equal(
        (
          await request
            .post('/api/v1/reports')
            .set('Authorization', bearer(first.token))
            .field(report)
            .attach('photo', photo, {
              filename: 'falso.jpg',
              contentType: 'image/jpeg',
            })
        ).status,
        400,
      );
      const orphan = resolve(upload, `${randomUUID()}.png`);
      writeFileSync(orphan, photo);
      const old = new Date(Date.now() - 172800000);
      utimesSync(orphan, old, old);
      await cleanOrphans();
      assert.equal(existsSync(orphan), false);
      assert.equal(readdirSync(upload).length, countBefore);
      const id = created.body.id;
      assert.match(created.body.folio, /^NX-\d+$/);
      assert.deepEqual(created.body.statusUpdates, []);
      assert.equal(
        (
          await request
            .get(`/api/v1/reports/${id}`)
            .set('Authorization', bearer(second.token))
        ).status,
        404,
      );
      assert.equal(
        (
          await request
            .get(`/api/v1/reports/${id}/evidence`)
            .set('Authorization', bearer(second.token))
        ).status,
        404,
      );
      assert.equal(
        (
          await request
            .get(`/api/v1/reports/${id}/evidence`)
            .set('Authorization', bearer(first.token))
        ).status,
        200,
      );
      assert.equal(
        (
          await request
            .post('/api/v1/reports')
            .set('Authorization', bearer(first.token))
            .field(report)
            .attach('photo', Buffer.from('fake'), 'fake.png')
        ).status,
        400,
      );
      assert.equal(
        (
          await request
            .post('/api/v1/reports')
            .set('Authorization', bearer(first.token))
            .field(report)
            .attach('photo', Buffer.alloc(5242881), 'large.png')
        ).status,
        413,
      );
      assert.equal(
        (
          await request
            .patch(`/api/v1/reports/${id}/status`)
            .set('Authorization', bearer(first.token))
            .send({ estado: 'revision' })
        ).status,
        403,
      );
      const changes = await Promise.all(
        ['revision', 'solucionado'].map((estado, i) =>
          request
            .patch(`/api/v1/reports/${id}/status`)
            .set('Authorization', bearer(staff.token))
            .send({ estado, note: `nota-${i}` }),
        ),
      );
      changes.forEach(r => assert.equal(r.status, 200));
      const history = (
        await request
          .get(`/api/v1/reports/${id}`)
          .set('Authorization', bearer(first.token))
      ).body;
      assert.equal(history.statusUpdates.length, 2);
      assert.deepEqual(
        new Set(history.statusUpdates.map((h: { note: string }) => h.note)),
        new Set(['nota-0', 'nota-1']),
      );
      const repeat = await request
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', bearer(staff.token))
        .send({ estado: history.estado, note: 'sin evento' });
      assert.equal(repeat.body.statusUpdates.length, 2);
      const [jobs] = await rows('SELECT COUNT(*) AS total FROM push_outbox');
      assert.equal(Number(jobs.total), 2);
      let sent = 0;
      assert.equal(
        await deliverOne(async message => {
          sent++;
          assert.ok(message.data?.eventId);
          assert.equal(
            message.notification?.body,
            'Hay una actualización disponible. Abre la app para consultarla.',
          );
          return 'sent';
        }),
        true,
      );
      assert.equal(sent, 1);
      await deliverOne(async () => {
        throw { code: 'messaging/server-unavailable' };
      });
      const [retry] = await rows(
        "SELECT * FROM push_outbox WHERE estado='pendiente'",
      );
      assert.ok(retry);
      assert.ok(Number(retry.intentos) > 0);
      await rows(
        'UPDATE push_outbox SET disponible_en=UTC_TIMESTAMP(3) WHERE id=?',
        [retry.id],
      );
      await deliverOne(async () => {
        throw { code: 'messaging/registration-token-not-registered' };
      });
      assert.equal(
        (await rows('SELECT * FROM dispositivos_push WHERE id=?', [device]))
          .length,
        0,
      );
      assert.equal(
        await deliverOne(async () => {
          sent++;
        }),
        false,
      );
      assert.equal(sent, 1);
      // Re-associate for the logout test; inactive account revokes every session/device.
      assert.equal(
        (
          await request
            .put(`/api/v1/devices/${device}`)
            .set('Authorization', bearer(first.token))
            .send({ token: 'rotated-token', plataforma: 'android' })
        ).status,
        204,
      );
      for (let i = 0; i < 3; i++)
        assert.equal(
          (
            await request
              .post('/api/v1/reports')
              .set('Authorization', bearer(first.token))
              .send(report)
          ).status,
          201,
        );
      const page = (
        await request
          .get('/api/v1/reports?limit=2')
          .set('Authorization', bearer(first.token))
      ).body;
      assert.equal(page.total, 4);
      assert.equal(page.items.length, 2);
      assert.ok(page.nextCursor);
      const next = (
        await request
          .get(
            '/api/v1/reports?limit=2&cursor=' +
              encodeURIComponent(page.nextCursor),
          )
          .set('Authorization', bearer(first.token))
      ).body;
      assert.equal(next.items.length, 2);
      assert.equal(next.nextCursor, null);
      assert.equal(
        new Set([...page.items, ...next.items].map(r => r.id)).size,
        4,
      );
      const summary = (
        await request
          .get('/api/v1/reports/summary')
          .set('Authorization', bearer(first.token))
      ).body;
      assert.equal(summary.total, 4);
      assert.equal(
        (
          await request
            .get('/api/v1/reports')
            .set('Authorization', bearer(second.token))
        ).body.total,
        0,
      );
      assert.equal(
        (
          await request
            .get('/api/v1/reports/summary?own=true')
            .set('Authorization', bearer(staff.token))
        ).body.total,
        0,
      );
      const stats = (
        await request
          .get('/api/v1/staff/statistics')
          .set('Authorization', bearer(staff.token))
      ).body;
      assert.equal(stats.total, 4);
      assert.equal(stats.serie.length, 7);
      assert.equal(stats.categories.length, 6);
      assert.equal(
        (
          await request
            .get('/api/v1/staff/notices')
            .set('Authorization', bearer(staff.token))
        ).body.total,
        4,
      );
      // Fixed-clock aggregation across Mexican midnight and year/month/week boundaries.
      const dates = [
        '2018-12-31 23:59:59.999',
        '2019-01-01 06:00:00.000',
        '2019-12-03 06:00:00.000',
        '2019-12-26 05:59:59.999',
        '2019-12-26 06:00:00.000',
        '2020-01-01 06:00:00.000',
        '2020-01-01 06:30:00.001',
      ];
      for (const [i, date] of dates.entries())
        await rows(
          'INSERT INTO reportes (id,usuario_id,titulo,descripcion,area_id,categoria_id,creado_en) VALUES (?,?,?,?,?,?,?)',
          [
            randomUUID(),
            first.user.id,
            'Reloj fijo',
            'Validación temporal',
            catalog.areas[i === 4 ? 1 : 0].id,
            catalog.categorias[0].id,
            date,
          ],
        );
      const reference = new Date('2020-01-01T06:30:00Z');
      const week = await statistics('semana', reference),
        month = await statistics('mes', reference),
        year = await statistics('anio', reference);
      assert.equal(week.total, 2);
      assert.equal(month.total, 4);
      assert.equal(year.total, 5);
      assert.equal(week.serie.length, 7);
      assert.equal(
        week.serie.reduce((s, d) => s + d.value, 0),
        2,
      );
      assert.equal(week.serie.filter(d => d.value === 0).length, 5);
      assert.equal(week.areaTop?.area, catalog.areas[0].nombre);
      assert.equal(week.categories.filter(c => c.value === 0).length, 5);
      assert.deepEqual(week.serie, year.serie);
      await rows('UPDATE usuarios SET activo=0 WHERE id=?', [second.user.id]);
      assert.equal(
        (
          await request
            .get('/api/v1/auth/me')
            .set('Authorization', bearer(second.token))
        ).status,
        401,
      );
      await rows(
        'UPDATE sesiones SET expira_en=DATE_ADD(creado_en,INTERVAL 1 SECOND) WHERE usuario_id=?',
        [staff.user.id],
      );
      await rows(
        'UPDATE sesiones SET revocado_en=UTC_TIMESTAMP(3) WHERE usuario_id=?',
        [staff.user.id],
      );
      assert.equal(
        (
          await request
            .get('/api/v1/auth/me')
            .set('Authorization', bearer(staff.token))
        ).status,
        401,
      );
      assert.equal(
        (
          await request
            .post('/api/v1/auth/logout')
            .set('Authorization', bearer(first.token))
            .send({ installationId: device })
        ).status,
        204,
      );
      assert.equal(
        (
          await request
            .get('/api/v1/auth/me')
            .set('Authorization', bearer(first.token))
        ).status,
        401,
      );
      assert.equal(
        (await rows('SELECT * FROM dispositivos_push WHERE id=?', [device]))
          .length,
        0,
      );
    } finally {
      if (dbPool) await dbPool.end();
      admin(
        `${
          granted
            ? `REVOKE ALL PRIVILEGES ON ${db}.* FROM '${process.env.DB_USER}'@'localhost';`
            : ''
        } DROP DATABASE IF EXISTS ${db};`,
      );
      rmSync(upload, { recursive: true, force: true });
    }
  },
);
