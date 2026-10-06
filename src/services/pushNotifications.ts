import { PermissionsAndroid, Platform } from 'react-native';
import { getJSON, setJSON, StorageKeys } from '../data/storage';
import { linkDevice, unlinkDevice } from './deviceRegistration';

export interface PushRegistration {
  enabled: boolean;
  token: string | null;
}
const listeners = new Set<() => void>();
export function onPushRegistrationChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const OFF: PushRegistration = { enabled: false, token: null };

async function client() {
  const {
    getApps,
    getApp,
  }: typeof import('@react-native-firebase/app') = require('@react-native-firebase/app');
  if (!getApps().length)
    throw new Error('Falta conectar el proyecto Firebase y recompilar la app.');
  const api: typeof import('@react-native-firebase/messaging') = require('@react-native-firebase/messaging');
  return { api, messaging: api.getMessaging(getApp()) };
}
export async function isPushConfigured() {
  try {
    await client();
    return true;
  } catch {
    return false;
  }
}
export async function getPushRegistration(): Promise<PushRegistration> {
  return getJSON(StorageKeys.pushRegistration, OFF);
}
export async function enablePush(): Promise<PushRegistration> {
  const { api, messaging } = await client();
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED)
      throw new Error(
        'Permite las notificaciones en los ajustes del dispositivo para activarlas.',
      );
  }
  if (Platform.OS === 'ios') {
    const permission = await api.requestPermission(messaging);
    if (
      permission !== api.AuthorizationStatus.AUTHORIZED &&
      permission !== api.AuthorizationStatus.PROVISIONAL
    )
      throw new Error(
        'Permite las notificaciones en los ajustes del dispositivo para activarlas.',
      );
  }
  await api.setAutoInitEnabled(messaging, true);
  try {
    const token = await api.getToken(messaging);
    await linkDevice(token);
    const registration = { enabled: true, token };
    await setJSON(StorageKeys.pushRegistration, registration);
    listeners.forEach(listener => listener());
    return registration;
  } catch (error) {
    await api.setAutoInitEnabled(messaging, false);
    await api.deleteToken(messaging).catch(() => {});
    throw error;
  }
}
export async function disablePush() {
  await unlinkDevice();
  const { api, messaging } = await client();
  await api.setAutoInitEnabled(messaging, false);
  await api.deleteToken(messaging);
  await setJSON(StorageKeys.pushRegistration, OFF);
  listeners.forEach(listener => listener());
  return OFF;
}
/** Generic text; details are loaded through the authenticated API. */
export async function listenForPush(
  onMessage: (title: string, body: string, reportId?: string) => void,
  onOpen?: (reportId: string) => void,
) {
  const registration = await getPushRegistration();
  if (!registration.enabled || !(await isPushConfigured())) return () => {};
  const { api, messaging } = await client();
  const validReportId = (id: unknown): string | undefined =>
    typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id) ? id : undefined;
  const seen = new Set<string>();
  const messageSubscription = api.onMessage(messaging, async message => {
    const eventId =
      typeof message.data?.eventId === 'string'
        ? message.data.eventId
        : undefined;
    if (eventId) {
      const key = `nexou:push-events`;
      const previous = await getJSON<string[]>(key, []);
      if (seen.has(eventId) || previous.includes(eventId)) return;
      seen.add(eventId);
      await setJSON(key, [...previous, eventId].slice(-100)).catch(() => {});
    }
    if (message.notification)
      onMessage(
        message.notification.title ?? 'NexoU',
        message.notification.body ?? 'Tienes una nueva notificación.',
        validReportId(message.data?.reportId),
      );
  });
  const openedSubscription = api.onNotificationOpenedApp(messaging, message => {
    const id = validReportId(message.data?.reportId);
    if (id) onOpen?.(id);
  });
  const initial = await api.getInitialNotification(messaging).catch(() => null);
  const initialId = validReportId(initial?.data?.reportId);
  if (initialId) onOpen?.(initialId);
  const tokenSubscription = api.onTokenRefresh(messaging, async token => {
    const current = await getPushRegistration();
    if (current.enabled) {
      await linkDevice(token).catch(() => {});
      await setJSON(StorageKeys.pushRegistration, {
        enabled: true,
        token,
      }).catch(() => {});
    }
  });
  return () => {
    messageSubscription();
    tokenSubscription();
    openedSubscription();
  };
}
