import {
  request,
  storeToken,
  restoreToken,
  onSessionExpired,
  evidenceSource,
  forgetToken,
} from '../src/services/api';
import * as Keychain from 'react-native-keychain';
const mockFetch = jest.fn();
beforeEach(async () => {
  globalThis.fetch = mockFetch;
  jest.clearAllMocks();
  await forgetToken();
});
test('Bearer y evidencia usan token seguro; no persiste en AsyncStorage', async () => {
  await storeToken('opaque');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'session',
    'opaque',
    expect.objectContaining({ service: 'mx.edu.utsc.nexou.session' }),
  );
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 'u1' }),
  });
  expect(await request('/auth/me')).toEqual({ id: 'u1' });
  expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
    'Bearer opaque',
  );
  expect(evidenceSource('/reports/r1/evidence').headers.Authorization).toBe(
    'Bearer opaque',
  );
});
test('401 borra token y notifica expiración; fallo de red conserva credencial', async () => {
  const listener = jest.fn(),
    stop = onSessionExpired(listener);
  await storeToken('opaque');
  mockFetch.mockRejectedValueOnce(new Error('offline'));
  await expect(request('/auth/me')).rejects.toThrow('conectar');
  expect(evidenceSource('/reports/r1/evidence').headers.Authorization).toBe(
    'Bearer opaque',
  );
  mockFetch.mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({
      error: { code: 'SESSION_EXPIRED', message: 'Sesión terminada' },
    }),
  });
  await expect(request('/auth/me')).rejects.toThrow('Sesión terminada');
  expect(listener).toHaveBeenCalledTimes(1);
  expect(evidenceSource('/reports/r1/evidence').headers.Authorization).toBe(
    'Bearer ',
  );
  stop();
});
test('restauración lee Keychain y login público no envía token anterior', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
    password: 'restored',
  });
  expect(await restoreToken()).toBe('restored');
  mockFetch.mockResolvedValue({ ok: true, status: 204 });
  await request('/auth/login', {
    method: 'POST',
    body: { email: 'a001@virtual.utsc.edu.mx', password: 'test' },
    public: true,
  });
  expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});
