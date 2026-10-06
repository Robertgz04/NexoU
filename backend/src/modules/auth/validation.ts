import { z } from 'zod';
export const matricula = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{0,29}$/, 'Matrícula inválida.');
export const password = z
  .string()
  .min(6, 'Usa al menos 6 caracteres.')
  .refine(
    v => Buffer.byteLength(v, 'utf8') <= 72,
    'La contraseña admite como máximo 72 bytes UTF-8.',
  );
export const personalData = z
  .object({
    nombre: z.string().trim().min(1).max(150),
    matricula,
    email: z.string().trim().toLowerCase().email().max(254),
    currentPassword: password.optional(),
  })
  .strict()
  .refine(v => v.email === `${v.matricula}@virtual.utsc.edu.mx`, {
    path: ['email'],
    message: 'El correo debe ser matrícula@virtual.utsc.edu.mx.',
  });
export const registration = z
  .object({
    nombre: z.string().trim().min(1).max(150),
    matricula,
    email: z.string().trim().toLowerCase().email().max(254),
    password,
    rol: z.literal('estudiante').optional(),
  })
  .strict()
  .refine(v => v.email === `${v.matricula}@virtual.utsc.edu.mx`, {
    path: ['email'],
    message:
      'El correo debe coincidir con la matrícula: matrícula@virtual.utsc.edu.mx.',
  });
