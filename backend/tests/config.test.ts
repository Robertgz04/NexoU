import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('configuración incompleta falla con nombres de campos, sin secretos', () => {
  const secret = 'private-test-password-not-for-output';
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      "await import('./src/config/env.ts')",
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
      env: {
        ...process.env,
        API_ENV_FILE: '__missing_env_test__',
        DB_HOST: '',
        DB_PORT: 'invalid',
        DB_NAME: '',
        DB_USER: '',
        DB_PASSWORD: secret,
      },
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Configuración incompleta o inválida/);
  assert.match(result.stderr, /DB_HOST/);
  assert.equal((result.stdout + result.stderr).includes(secret), false);
});
