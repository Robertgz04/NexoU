import { createContext } from 'react';
export interface Preferences {
  reduceMotion: boolean;
  showReportPhotos: boolean;
}
export const DEFAULT_PREFERENCES: Preferences = {
  reduceMotion: false,
  showReportPhotos: true,
};
interface Value {
  preferences: Preferences;
  loading: boolean;
  saving: boolean;
  updatePreference: (key: keyof Preferences, value: boolean) => Promise<void>;
}
export const PreferencesContext = createContext<Value | null>(null);
