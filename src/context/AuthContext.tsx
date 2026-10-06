import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { RegisterInput, UpdatePersonalDataInput, User } from '../types';
import * as authRepository from '../data/authRepository';
import { HttpError, onSessionExpired } from '../services/api';
import { getPushRegistration } from '../services/pushNotifications';
import { linkDevice } from '../services/deviceRegistration';

/**
 * Estado global de autenticación (F01/F02).
 * Restaura la sesión guardada al abrir la app y redirige según el rol.
 */
interface AuthContextValue {
  user: User | null;
  /** true mientras se restaura la sesión inicial. */
  initializing: boolean;
  initializationError: string | null;
  retrySession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updatePersonalData: (input: UpdatePersonalDataInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionUser = await authRepository.restoreSession();
        if (!cancelled) setUser(sessionUser);
      } catch (error) {
        if (!cancelled && !(error instanceof HttpError && error.status === 401))
          setInitializationError(
            'No pudimos restaurar tu sesión. Revisa la conexión e intenta de nuevo.',
          );
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const retrySession = useCallback(async () => {
    setInitializing(true);
    setInitializationError(null);
    try {
      setUser(await authRepository.restoreSession());
    } catch (error) {
      if (!(error instanceof HttpError && error.status === 401))
        setInitializationError(
          'No pudimos restaurar tu sesión. Revisa la conexión e intenta de nuevo.',
        );
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);
  useEffect(() => {
    if (!user) return;
    getPushRegistration()
      .then(r => {
        if (r.enabled && r.token) return linkDevice(r.token);
      })
      .catch(() => {});
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const logged = await authRepository.login(email, password);
    setUser(logged);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await authRepository.register(input);
    setUser(created);
  }, []);

  const logout = useCallback(async () => {
    await authRepository.clearSession();
    setUser(null);
  }, []);

  const updatePersonalData = useCallback(
    async (input: UpdatePersonalDataInput) => {
      if (!user) throw new Error('Inicia sesión para editar tus datos.');
      const updated = await authRepository.updatePersonalData(user.id, input);
      setUser(current => (current?.id === updated.id ? updated : current));
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      initializing,
      initializationError,
      retrySession,
      login,
      register,
      logout,
      updatePersonalData,
    }),
    [
      user,
      initializing,
      initializationError,
      retrySession,
      login,
      register,
      logout,
      updatePersonalData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
