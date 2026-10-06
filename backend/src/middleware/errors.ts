import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
export const notFound = () =>
  new ApiError(404, 'NOT_FOUND', 'El recurso no está disponible.');
export const errors: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500,
    code = 'INTERNAL_ERROR',
    message = 'No pudimos completar la solicitud.';
  let fields: Record<string, string> | undefined;
  if (err instanceof ApiError) ({ status, code, message } = err);
  else if (err instanceof ZodError) {
    status = 400;
    code = 'INVALID_INPUT';
    message = 'Revisa los campos enviados.';
    fields = Object.fromEntries(
      err.issues.map(i => [i.path.join('.'), i.message]),
    );
  } else if (err instanceof MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_UPLOAD';
    message =
      status === 413
        ? 'La foto supera el tamaño permitido.'
        : 'La carga de foto no es válida.';
  } else if (err?.code === 'ER_DUP_ENTRY') {
    status = 409;
    code = 'DUPLICATE';
    message = 'El correo, matrícula o dispositivo ya está registrado.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'La solicitud es demasiado grande.';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'El JSON no es válido.';
  } else if (err?.code === 'ER_SIGNAL_EXCEPTION') {
    status = 400;
    code = 'INVALID_OPERATION';
    message = 'No se puede aplicar este cambio.';
  }
  if (status === 500)
    console.error(
      JSON.stringify({
        requestId: res.locals.requestId,
        code: 'INTERNAL_ERROR',
      }),
    );
  res
    .status(status)
    .json({
      error: { code, message, ...(fields ? { fields } : {}) },
      requestId: res.locals.requestId,
    });
};
