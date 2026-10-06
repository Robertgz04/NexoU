import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferencias y metadatos locales. Usuarios y reportes se consultan por HTTP;
 * los tokens de autenticación se guardan exclusivamente en Keychain/Keystore.
 * Las claves históricas se conservan para una posible importación explícita.
 */
export const StorageKeys = {
  users: '@nexou/users',
  reports: '@nexou/reports',
  session: '@nexou/session',
  pushRegistration: '@nexou/push-registration',
  preferences: '@nexou/preferences',
  seeded: '@nexou/seeded',
} as const;

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
