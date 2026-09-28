import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Capa de persistencia sobre AsyncStorage.
 *
 * IMPORTANTE (arquitectura): todas las pantallas y repositorios dependen
 * exclusivamente de esta capa. Para migrar a servicios en la nube (Firebase
 * Auth / Firestore, ver plan de trabajo) basta con reimplementar los
 * repositorios `authRepository` y `reportRepository` manteniendo las mismas
 * funciones; ninguna pantalla se modifica. Ver README.md → "Conexión a nube".
 */
export const StorageKeys = {
  users: '@nexou/users',
  reports: '@nexou/reports',
  session: '@nexou/session',
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
