import type { RegisterInput, UpdatePersonalDataInput, User } from '../types';
import { getJSON, setJSON, StorageKeys } from './storage';
import { hashPassword } from '../utils/sha256';
import { uid, validateRequired, validateEmail } from '../utils/validators';

/**
 * Repositorio de usuarios (F01 Inicio de sesión, F02 Registro).
 * Implementación local sobre AsyncStorage.
 *
 * Para conectar Firebase Auth (plan de trabajo, Sprint 1–2) reemplaza el
 * interior de estas funciones por las llamadas de `firebase/auth`
 * manteniendo firmas y mensajes de error.
 */

export async function getUsers(): Promise<User[]> {
  return getJSON<User[]>(StorageKeys.users, []);
}

/** Crea una cuenta. Lanza Error con mensaje en español si hay conflicto. */
export async function register(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const users = await getUsers();

  if (users.some(u => u.email === email)) {
    throw new Error('El correo ya está registrado. Inicia sesión con él.');
  }

  const user: User = {
    id: uid('u_'),
    nombre: input.nombre.trim(),
    matricula: input.matricula.trim(),
    email,
    passwordHash: hashPassword(email, input.password),
    rol: input.rol,
    createdAt: new Date().toISOString(),
  };

  await setJSON(StorageKeys.users, [...users, user]);
  return user;
}

/** Valida credenciales (F01). Lanza Error si no coinciden. */
export async function login(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const users = await getUsers();
  const user = users.find(u => u.email === cleanEmail);

  if (!user || user.passwordHash !== hashPassword(cleanEmail, password)) {
    throw new Error('Correo o contraseña incorrectos.');
  }
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.id === id) ?? null;
}

/** Sesión persistente (se mantiene entre sesiones de la app). */
export async function saveSession(userId: string): Promise<void> {
  await setJSON(StorageKeys.session, { userId });
}

export async function getSessionUserId(): Promise<string | null> {
  const data = await getJSON<{ userId: string | null }>(StorageKeys.session, {
    userId: null,
  });
  return data.userId;
}

export async function clearSession(): Promise<void> {
  await setJSON(StorageKeys.session, { userId: null });
}

/** Updates the current account, rehashing credentials only after verification. */
export async function updatePersonalData(
  id: string,
  input: UpdatePersonalDataInput,
): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const validation =
    validateRequired(input.nombre, 'nombre') ||
    validateRequired(input.matricula, 'identificador') ||
    validateEmail(email);
  if (validation) throw new Error(validation);
  const users = await getUsers();
  const index = users.findIndex(user => user.id === id);
  if (index < 0) throw new Error('La cuenta ya no está disponible.');
  const current = users[index];
  if (users.some(user => user.id !== id && user.email.toLowerCase() === email))
    throw new Error('El correo ya está registrado en otra cuenta.');
  let passwordHash = current.passwordHash;
  if (email !== current.email) {
    if (
      !input.currentPassword ||
      hashPassword(current.email, input.currentPassword) !==
        current.passwordHash
    )
      throw new Error('La contraseña actual es incorrecta.');
    passwordHash = hashPassword(email, input.currentPassword);
  }
  const updated: User = {
    ...current,
    nombre: input.nombre.trim(),
    matricula: input.matricula.trim(),
    email,
    passwordHash,
  };
  users[index] = updated;
  await setJSON(StorageKeys.users, users);
  return updated;
}
