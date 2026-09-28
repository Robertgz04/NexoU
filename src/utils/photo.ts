/** Utilidades para la evidencia fotográfica (F05). */

/**
 * Convierte el valor guardado en la URI que entiende <Image/>.
 * Acepta base64 crudo, data URIs y rutas locales (file:/content:).
 * Devuelve `null` si el reporte no tiene foto.
 */
export function photoUri(photo: string | null): string | null {
  if (!photo) {
    return null;
  }
  if (
    photo.startsWith('data:') ||
    photo.startsWith('file:') ||
    photo.startsWith('content:') ||
    photo.startsWith('http')
  ) {
    return photo;
  }
  return `data:image/jpeg;base64,${photo}`;
}
