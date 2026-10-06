/** Validaciones de formularios (criterios de aceptación de F01–F03). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Devuelve el mensaje de error del campo o `null` si es válido. */
export function validateRequired(value: string, label: string): string | null {
  return isBlank(value) ? `El campo ${label} es obligatorio.` : null;
}

export function validateEmail(email: string): string | null {
  if (isBlank(email)) {
    return 'El correo es obligatorio.';
  }
  return isValidEmail(email) ? null : 'Ingresa un correo válido.';
}

export function validatePassword(
  password: string,
  minLength: number,
): string | null {
  if (isBlank(password)) {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres.`;
  }
  if (utf8Bytes(password) > 72)
    return 'La contraseña admite como máximo 72 bytes UTF-8.';
  return null;
}

function utf8Bytes(value: string): number {
  return Array.from(value).reduce((total, char) => {
    const code = char.codePointAt(0)!;
    return (
      total + (code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4)
    );
  }, 0);
}
export function institutionalEmail(matricula: string) {
  return `${matricula.trim().toLowerCase()}@virtual.utsc.edu.mx`;
}
export function validateInstitutionalEmail(
  email: string,
  matricula: string,
): string | null {
  return (
    validateEmail(email) ||
    (email.trim().toLowerCase() === institutionalEmail(matricula)
      ? null
      : 'El correo debe coincidir con tu matrícula: matrícula@virtual.utsc.edu.mx.')
  );
}

/** Folio corto y estable a partir del id del reporte (mockup: "NX-2031"). */
export function folioDe(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return `NX-${1000 + (hash % 9000)}`;
}

/** Genera un identificador único corto sin librerías externas. */
export function uid(prefix = ''): string {
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}
