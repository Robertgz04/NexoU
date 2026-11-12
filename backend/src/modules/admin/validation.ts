import { z } from 'zod';

export const catalogKind = z.enum(['areas', 'categorias']);
export const catalogInput = (kind: 'areas' | 'categorias') =>
  z
    .object({
      nombre: z
        .string()
        .trim()
        .min(1, 'Escribe un nombre.')
        .max(kind === 'areas' ? 100 : 50),
      orden: z.number().int().min(0).max(65535),
      activo: z.boolean(),
    })
    .strict();
export const institutionInput = z
  .object({
    nombre: z.string().trim().min(1).max(150),
    correo_soporte: z.string().trim().email().max(254),
    ubicacion_soporte: z.string().trim().min(1).max(300),
  })
  .strict();
