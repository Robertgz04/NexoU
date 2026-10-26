jest.mock('../src/services/deviceRegistration', () => ({
  linkDevice: jest.fn().mockResolvedValue(undefined),
  unlinkDevice: jest.fn().mockResolvedValue(undefined),
}));
import {
  enablePush,
  disablePush,
  isPushConfigured,
  listenForPush,
} from '../src/services/pushNotifications';
const mockMessage = jest.fn();
const mockOpened = jest.fn();
const mockRefresh = jest.fn();
const mockUnsubscribe = jest.fn();
const mockInitial = jest.fn().mockResolvedValue(null);
const mockRead = jest.fn();
const mockApps = jest.fn();
const mockWrite = jest.fn();
const mockToken = jest.fn();
const mockPermission = jest.fn();
const mockDelete = jest.fn();
const mockAutoInit = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33 },
  PermissionsAndroid: {
    PERMISSIONS: { POST_NOTIFICATIONS: 'notification' },
    RESULTS: { GRANTED: 'granted' },
    request: (...args: unknown[]) => mockPermission(...args),
  },
}));
jest.mock('../src/data/storage', () => ({
  StorageKeys: { pushRegistration: 'push' },
  getJSON: (...args: unknown[]) => mockRead(...args),
  setJSON: (...args: unknown[]) => mockWrite(...args),
}));
jest.mock('@react-native-firebase/app', () => ({
  getApps: () => mockApps(),
  getApp: () => ({}),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  onMessage: (...args: unknown[]) => mockMessage(...args),
  onNotificationOpenedApp: (...args: unknown[]) => mockOpened(...args),
  onTokenRefresh: (...args: unknown[]) => mockRefresh(...args),
  getInitialNotification: () => mockInitial(),
  getMessaging: () => ({}),
  getToken: () => mockToken(),
  deleteToken: () => mockDelete(),
  setAutoInitEnabled: (...args: unknown[]) => mockAutoInit(...args),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockApps.mockReturnValue([{}]);
  mockWrite.mockResolvedValue(undefined);
  mockToken.mockResolvedValue('device-token');
  mockPermission.mockResolvedValue('granted');
  mockDelete.mockResolvedValue(undefined);
  mockAutoInit.mockResolvedValue(undefined);
});
test('sin Firebase no registra ni solicita permiso', async () => {
  mockApps.mockReturnValue([]);
  expect(await isPushConfigured()).toBe(false);
  await expect(enablePush()).rejects.toThrow('Firebase');
  expect(mockPermission).not.toHaveBeenCalled();
});
test('denegar el permiso no genera un token', async () => {
  mockPermission.mockResolvedValue('denied');
  await expect(enablePush()).rejects.toThrow('Permite');
  expect(mockToken).not.toHaveBeenCalled();
  expect(mockWrite).not.toHaveBeenCalled();
});
test('persiste el token y lo revoca al desactivar', async () => {
  expect(await enablePush()).toEqual({ enabled: true, token: 'device-token' });
  expect(mockWrite).toHaveBeenCalledWith('push', {
    enabled: true,
    token: 'device-token',
  });
  await disablePush();
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockWrite).toHaveBeenLastCalledWith('push', {
    enabled: false,
    token: null,
  });
});
test('un fallo de persistencia revoca el token recién generado', async () => {
  mockWrite.mockRejectedValue(new Error('Sin espacio'));
  await expect(enablePush()).rejects.toThrow('Sin espacio');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

test('recibe mensajes de datos, elimina duplicados y libera los listeners', async () => {
  mockRead.mockImplementation((key: string) =>
    Promise.resolve(
      key === 'push' ? { enabled: true, token: 'device-token' } : [],
    ),
  );
  mockMessage.mockReturnValue(mockUnsubscribe);
  mockOpened.mockReturnValue(mockUnsubscribe);
  mockRefresh.mockReturnValue(mockUnsubscribe);
  const show = jest.fn();
  const open = jest.fn();
  const stop = await listenForPush(show, open);
  const receive = mockMessage.mock.calls[0][1];
  const reportId = '12345678-1234-1234-1234-123456789abc';
  await receive({ data: { eventId: 'event-1', reportId } });
  await receive({ data: { eventId: 'event-1', reportId } });
  expect(show).toHaveBeenCalledTimes(1);
  expect(show).toHaveBeenCalledWith(
    'NexoU',
    'Tienes una nueva notificación.',
    reportId,
  );
  mockOpened.mock.calls[0][1]({ data: { reportId } });
  expect(open).toHaveBeenCalledWith(reportId);
  stop();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
});
