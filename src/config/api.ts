// Configuración pública compartida por builds de desarrollo y producción.
// La app no necesita .env ni acceso directo a la base de datos.
export const API_BASE_URL = 'https://nexou-api.avorainc.com/api/v1';
export const HTTP_TIMEOUT_MS = 15000;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
