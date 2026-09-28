import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {RegisterInput, User} from '../types';
import * as authRepository from '../data/authRepository';
import {seedIfEmpty} from '../data/seed';

/**
 * Estado global de autenticación (F01/F02).
 * Restaura la sesión guardada al abrir la app y redirige según el rol.
 */
interface AuthContextValue {
  user: User | null;
  /** true mientras se restaura la sesión inicial. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await seedIfEmpty();
        const sessionId = await authRepository.getSessionUserId();
        if (sessionId) {
          const sessionUser = await authRepository.getUserById(sessionId);
          if (!cancelled) {
            setUser(sessionUser);
          }
        }
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

  const login = useCallback(async (email: string, password: string) => {
    const logged = await authRepository.login(email, password);
    await authRepository.saveSession(logged.id);
    setUser(logged);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await authRepository.register(input);
    await authRepository.saveSession(created.id);
    setUser(created);
  }, []);

  const logout = useCallback(async () => {
    await authRepository.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({user, initializing, login, register, logout}),
    [user, initializing, login, register, logout],
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
