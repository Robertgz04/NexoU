import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('OpenAPI publica los endpoints y resuelve todos los contratos referenciados', () => {
  const api = JSON.parse(
    readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'),
  );
  assert.equal(api.openapi, '3.1.0');
  assert.equal(
    Object.values(api.paths).reduce(
      (sum: number, p: any) => sum + Object.keys(p).length,
      0,
    ),
    17,
  );
  function walk(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if ('$ref' in value) {
      const path = String(value.$ref).slice(2).split('/');
      let resolved: any = api;
      for (const part of path) resolved = resolved?.[part];
      assert.ok(resolved, `Referencia sin resolver: ${value.$ref}`);
    }
    for (const child of Object.values(value)) walk(child);
  }
  walk(api);
  assert.equal('passwordHash' in api.components.schemas.User.properties, false);
});
