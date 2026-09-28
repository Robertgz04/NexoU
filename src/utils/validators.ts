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

export function validatePassword(password: string, minLength: number): string | null {
  if (isBlank(password)) {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres.`;
  }
  return null;
}

/** Genera un identificador único corto sin librerías externas. */
export function uid(prefix = ''): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}
