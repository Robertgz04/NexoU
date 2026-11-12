import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogKind,
  catalogInput,
  institutionInput,
} from '../src/modules/admin/validation.js';

test('catálogos limitan tablas, nombres, orden y campos desconocidos', () => {
  assert.equal(catalogKind.safeParse('usuarios').success, false);
  const input = { nombre: '  Laboratorios  ', orden: 1, activo: true };
  assert.equal(catalogInput('areas').parse(input).nombre, 'Laboratorios');
  for (const change of [
    { nombre: '' },
    { orden: -1 },
    { orden: 1.5 },
    { activo: 1 },
    { isAdmin: true },
  ])
    assert.equal(
      catalogInput('areas').safeParse({ ...input, ...change }).success,
      false,
    );
  assert.equal(
    catalogInput('categorias').safeParse({ ...input, nombre: 'x'.repeat(51) })
      .success,
    false,
  );
});
test('datos institucionales validan correo y rechazan ajustes de autenticación', () => {
  const input = {
    nombre: 'Escuela',
    correo_soporte: 'soporte@escuela.edu',
    ubicacion_soporte: 'Edificio B',
  };
  assert.equal(institutionInput.safeParse(input).success, true);
  assert.equal(
    institutionInput.safeParse({ ...input, correo_soporte: 'mailto:correo' })
      .success,
    false,
  );
  assert.equal(
    institutionInput.safeParse({ ...input, es_admin: true }).success,
    false,
  );
});
