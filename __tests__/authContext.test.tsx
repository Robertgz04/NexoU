import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
const mockRestore = jest.fn();
jest.mock('../src/data/authRepository', () => ({
  restoreSession: () => mockRestore(),
}));
jest.mock('../src/services/pushNotifications', () => ({
  getPushRegistration: jest.fn().mockResolvedValue({ enabled: false }),
}));
jest.mock('../src/services/deviceRegistration', () => ({
  linkDevice: jest.fn(),
}));
let current: ReturnType<typeof useAuth>;
function Probe() {
  current = useAuth();
  return null;
}
test('fallo de red al restaurar permite reintentar sin perder sesión segura', async () => {
  mockRestore.mockRejectedValueOnce(new Error('Sin conexión'));
  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
  expect(current!.initializing).toBe(false);
  expect(current!.initializationError).toContain('restaurar');
  mockRestore.mockResolvedValueOnce({ id: 'u1', rol: 'personal' });
  await act(async () => {
    await current!.retrySession();
  });
  expect(current!.user?.id).toBe('u1');
  expect(current!.initializationError).toBeNull();
  act(() => tree!.unmount());
});
