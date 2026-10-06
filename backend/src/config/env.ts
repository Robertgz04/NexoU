import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const path = resolve(process.env.API_ENV_FILE || resolve(root, '../.env'));
if (existsSync(path)) loadEnvFile(path);
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z
    .string()
    .min(1)
    .refine(v => v !== 'CAMBIA_ESTA_CLAVE'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  TRUST_PROXY: z.string().default(''),
  APP_TIME_ZONE: z
    .literal('America/Mexico_City')
    .default('America/Mexico_City'),
  UPLOAD_DIR: z.string().default(resolve(root, '../.local/uploads')),
  MAX_PHOTO_BYTES: z.coerce.number().int().min(1).max(5242880).default(5242880),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(30).default(10),
  PUSH_ENABLED: z.enum(['true', 'false']).default('false'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success)
  throw new Error(
    `Configuración incompleta o inválida: ${parsed.error.issues
      .map(i => i.path.join('.'))
      .join(', ')}`,
  );
export const env = parsed.data;
env.UPLOAD_DIR = resolve(dirname(path), env.UPLOAD_DIR);
if (env.PUSH_ENABLED === 'true' && !env.GOOGLE_APPLICATION_CREDENTIALS)
  throw new Error('Falta GOOGLE_APPLICATION_CREDENTIALS para push.');
