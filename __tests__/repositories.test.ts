import * as auth from '../src/data/authRepository';
import * as reports from '../src/data/reportRepository';
import {
  request,
  storeToken,
  restoreToken,
  forgetToken,
} from '../src/services/api';
jest.mock('../src/services/api', () => ({
  request: jest.fn(),
  storeToken: jest.fn(),
  restoreToken: jest.fn(),
  forgetToken: jest.fn(),
}));
jest.mock('../src/services/deviceRegistration', () => ({
  getInstallationId: jest.fn().mockResolvedValue('installation'),
}));
const mockedRequest = request as jest.Mock;
beforeEach(() => jest.clearAllMocks());
test('login almacena solo el token seguro y devuelve el usuario público', async () => {
  const user = { id: 'u1', rol: 'personal' };
  mockedRequest.mockResolvedValue({ user, token: 'opaque' });
  expect(await auth.login(' A001@VIRTUAL.UTSC.EDU.MX ', 'password')).toBe(user);
  expect(storeToken).toHaveBeenCalledWith('opaque');
  expect(mockedRequest).toHaveBeenCalledWith(
    '/auth/login',
    expect.objectContaining({
      public: true,
      body: { email: 'a001@virtual.utsc.edu.mx', password: 'password' },
    }),
  );
});
test('restaura sesión validada por servidor y revoca antes de borrar token', async () => {
  (restoreToken as jest.Mock).mockResolvedValue('opaque');
  mockedRequest.mockResolvedValue({ id: 'u1' });
  expect(await auth.restoreSession()).toEqual({ id: 'u1' });
  expect(mockedRequest).toHaveBeenCalledWith('/auth/me');
  mockedRequest.mockRejectedValueOnce(new Error('Sin red'));
  await expect(auth.clearSession()).rejects.toThrow('Sin red');
  expect(forgetToken).not.toHaveBeenCalled();
  mockedRequest.mockResolvedValue(undefined);
  await auth.clearSession();
  expect(mockedRequest).toHaveBeenLastCalledWith(
    '/auth/logout',
    expect.objectContaining({ body: { installationId: 'installation' } }),
  );
  expect(forgetToken).toHaveBeenCalledTimes(1);
});
test('alta multipart usa IDs del catálogo y excluye identidad y fechas del cliente', async () => {
  mockedRequest
    .mockResolvedValueOnce({
      areas: [{ id: 2, nombre: 'Biblioteca' }],
      categorias: [{ id: 4, nombre: 'Mobiliario' }],
    })
    .mockResolvedValueOnce({ id: 'r1' });
  await reports.createReport({
    ownerId: 'falso',
    ownerNombre: 'Falso',
    titulo: 'Silla',
    descripcion: 'Rota',
    area: 'Biblioteca',
    categoria: 'Mobiliario',
    photo: null,
  });
  const form = mockedRequest.mock.calls[1][1].multipart as FormData;
  const values = Object.fromEntries(
    (
      form as unknown as { entries: () => Iterable<[string, string]> }
    ).entries(),
  );
  expect(Object.keys(values)).toEqual([
    'titulo',
    'descripcion',
    'areaId',
    'categoriaId',
  ]);
  expect(values.areaId).toBe('2');
});
test('cambios aceptan únicamente estado y nota; exportación recorre páginas', async () => {
  mockedRequest.mockResolvedValue({ id: 'r1' });
  await reports.updateReportStatus('r1', 'revision', 'Nota', {
    id: 'falso',
    nombre: 'Falso',
  });
  expect(mockedRequest).toHaveBeenLastCalledWith('/reports/r1/status', {
    method: 'PATCH',
    body: { estado: 'revision', note: 'Nota' },
  });
  mockedRequest
    .mockResolvedValueOnce({
      items: [{ id: 'r1' }],
      nextCursor: 'next',
      total: 2,
    })
    .mockResolvedValueOnce({
      items: [{ id: 'r2' }],
      nextCursor: null,
      total: 2,
    });
  expect(await reports.getReports()).toEqual([{ id: 'r1' }, { id: 'r2' }]);
  expect(mockedRequest).toHaveBeenLastCalledWith('/reports?cursor=next');
});
