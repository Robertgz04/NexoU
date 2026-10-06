import React, { useContext, useEffect, useRef, useState } from 'react';
import { getJSON, setJSON, StorageKeys } from '../data/storage';

import { PreferencesContext, DEFAULT_PREFERENCES } from './PreferencesState';
import type { Preferences } from './PreferencesState';
export type { Preferences } from './PreferencesState';
/** Device preferences persist independently of the signed-in account. */
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    getJSON<Partial<Preferences>>(StorageKeys.preferences, {}).then(stored => {
      if (!active) return;
      setPreferences({
        reduceMotion:
          typeof stored?.reduceMotion === 'boolean'
            ? stored.reduceMotion
            : false,
        showReportPhotos:
          typeof stored?.showReportPhotos === 'boolean'
            ? stored.showReportPhotos
            : true,
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const updatePreference = async (key: keyof Preferences, value: boolean) => {
    if (loading || lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      const next = { ...preferences, [key]: value };
      await setJSON(StorageKeys.preferences, next);
      setPreferences(next);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return (
    <PreferencesContext.Provider
      value={{ preferences, loading, saving, updatePreference }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('Configuración requiere PreferencesProvider.');
  return context;
}
