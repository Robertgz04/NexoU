import {
  enablePush,
  disablePush,
  isPushConfigured,
} from '../src/services/pushNotifications';
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
  getJSON: jest.fn(),
  setJSON: (...args: unknown[]) => mockWrite(...args),
}));
jest.mock('@react-native-firebase/app', () => ({
  getApps: () => mockApps(),
  getApp: () => ({}),
}));
jest.mock('@react-native-firebase/messaging', () => ({
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
