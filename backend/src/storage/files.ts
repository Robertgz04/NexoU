import { mkdir, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errors.js';
import { rows } from '../db/pool.js';

export async function savePhoto(buffer: Buffer, declaredMime: string) {
  const type = await fileTypeFromBuffer(buffer);
  if (
    !type ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime) ||
    type.mime !== declaredMime
  )
    throw new ApiError(
      400,
      'INVALID_PHOTO',
      'Adjunta una foto JPEG, PNG o WebP válida.',
    );
  try {
    await sharp(buffer, { limitInputPixels: 25000000 }).stats();
  } catch {
    throw new ApiError(
      400,
      'INVALID_PHOTO',
      'La foto está dañada o sus dimensiones son excesivas.',
    );
  }
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const key = `${randomUUID()}.${type.ext}`;
  await writeFile(filePath(key), buffer, { flag: 'wx' });
  return { key, mime: type.mime, bytes: buffer.length };
}
export function filePath(key: string) {
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key))
    throw new Error('Clave de archivo inválida.');
  return resolve(env.UPLOAD_DIR, key);
}
export async function removePhoto(key: string) {
  await unlink(filePath(key)).catch(e => {
    if (e.code !== 'ENOENT') throw e;
  });
}
export async function cleanOrphans() {
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const referenced = new Set(
    (await rows('SELECT archivo_clave FROM evidencias')).map(
      r => r.archivo_clave,
    ),
  );
  for (const key of await readdir(env.UPLOAD_DIR)) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key) || referenced.has(key))
      continue;
    // Grace period protects uploads whose SQL transaction is in flight.
    if ((await stat(filePath(key))).mtimeMs < Date.now() - 86400000)
      await removePhoto(key);
  }
}
