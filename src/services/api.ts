import * as Keychain from 'react-native-keychain';
import { API_BASE_URL, HTTP_TIMEOUT_MS } from '../config/api';
const SERVICE = 'mx.edu.utsc.nexou.session';
let token: string | null = null;
const expired = new Set<() => void>();
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
export function onSessionExpired(listener: () => void) {
  expired.add(listener);
  return () => {
    expired.delete(listener);
  };
}
export async function restoreToken() {
  const value = await Keychain.getGenericPassword({ service: SERVICE });
  token = value ? value.password : null;
  return token;
}
export async function storeToken(value: string) {
  await Keychain.setGenericPassword('session', value, {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  token = value;
}
export async function forgetToken() {
  await Keychain.resetGenericPassword({ service: SERVICE });
  token = null;
}
export function evidenceSource(url: string) {
  return {
    uri: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
    headers: { Authorization: `Bearer ${token || ''}` },
    cache: 'reload' as const,
  };
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    multipart?: FormData;
    public?: boolean;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      signal: controller.signal,
      headers: {
        ...(options.multipart ? {} : { 'Content-Type': 'application/json' }),
        ...(!options.public && token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body:
        options.multipart ||
        (options.body === undefined ? undefined : JSON.stringify(options.body)),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 && !options.public) {
        await forgetToken();
        expired.forEach(listener => listener());
      }
      throw new HttpError(
        response.status,
        body.error?.code || 'HTTP_ERROR',
        body.error?.message || 'No pudimos completar la solicitud.',
        body.error?.fields,
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new Error(
      controller.signal.aborted
        ? 'La conexión tardó demasiado. Intenta de nuevo.'
        : 'No pudimos conectar con el servidor. Revisa tu conexión.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
