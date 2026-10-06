import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registration,
  password,
  personalData,
} from '../src/modules/auth/validation.js';
import { windows } from '../src/modules/statistics/service.js';
import {
  decodeCursor,
  encodeCursor,
} from '../src/modules/reports/pagination.js';
test('correo coincide con matrícula y no admite alta pública de personal', () => {
  const value = {
    nombre: ' Ana ',
    matricula: ' A001 ',
    email: ' A001@VIRTUAL.UTSC.EDU.MX ',
    password: 'password',
  };
  assert.equal(registration.parse(value).email, 'a001@virtual.utsc.edu.mx');
  assert.equal(
    registration.safeParse({ ...value, email: 'otra@virtual.utsc.edu.mx' })
      .success,
    false,
  );
  assert.equal(
    registration.safeParse({ ...value, rol: 'personal' }).success,
    false,
  );
  assert.equal(
    personalData.safeParse({
      nombre: 'Ana',
      matricula: 'a001',
      email: 'otra@virtual.utsc.edu.mx',
    }).success,
    false,
  );
});
test('bcrypt limita bytes, también en Unicode', () => {
  assert.equal(password.safeParse('é'.repeat(36)).success, true);
  assert.equal(password.safeParse('é'.repeat(37)).success, false);
});
test('periodos usan medianoche mexicana y un solo asOf, incluyendo año bisiesto', () => {
  const before = windows('semana', new Date('2026-10-06T05:59:59Z'));
  const after = windows('semana', new Date('2026-10-06T06:00:00Z'));
  assert.equal(before.min, '2026-09-29 06:00:00.000');
  assert.equal(after.min, '2026-09-30 06:00:00.000');
  assert.equal(after.days.length, 7);
  assert.equal(
    windows('anio', new Date('2024-02-29T18:00:00Z')).min,
    '2023-02-28 06:00:00.000',
  );
});
test('cursor está ligado a filtros y usuario', () => {
  const value = encodeCursor(
    '2026-10-06 12:00:00.000',
    '94b987ce-c538-4d12-a6b7-c338cc83d094',
    'student',
  );
  assert.equal(decodeCursor(value, 'student')?.date, '2026-10-06 12:00:00.000');
  assert.throws(() => decodeCursor(value, 'other'));
  assert.throws(() => decodeCursor('invalid', 'student'));
});
