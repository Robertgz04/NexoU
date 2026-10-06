import { Platform } from 'react-native';
// Public configuration only. Use the computer's LAN IP for a physical phone.
// Set your HTTPS deployment URL before creating a release build.
export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1'
  : 'https://api.nexou.invalid/api/v1';
export const HTTP_TIMEOUT_MS = 15000;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
