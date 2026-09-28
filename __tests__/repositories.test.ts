/**
 * Pruebas de los repositorios de datos (F01–F08):
 * registro, inicio de sesión, creación de reportes y cambio de estado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authRepository from '../src/data/authRepository';
import * as reportRepository from '../src/data/reportRepository';
import {StorageKeys} from '../src/data/storage';
import {seedIfEmpty} from '../src/data/seed';

jest.mock('@react-native-async-storage/async-storage', () => {
  // Mock en memoria (no depende de rutas internas del paquete).
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => (store.has(key) ? store.get(key) : null),
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
      getAllKeys: async () => Array.from(store.keys()),
    },
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('F02 – Registro de estudiantes', () => {
  it('crea una cuenta con contraseña hasheada', async () => {
    const user = await authRepository.register({
      nombre: 'Ana López',
      matricula: 'A00123456',
      email: 'ana@nexou.mx',
      password: 'Secreta123',
      rol: 'estudiante',
    });

    expect(user.id).toBeTruthy();
    expect(user.rol).toBe('estudiante');
    expect(user.email).toBe('ana@nexou.mx');
    expect(user.passwordHash).not.toBe('Secreta123');
    expect(user.passwordHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rechaza un correo duplicado', async () => {
    await authRepository.register({
      nombre: 'Ana López',
      matricula: 'A00123456',
      email: 'ana@nexou.mx',
      password: 'Secreta123',
      rol: 'estudiante',
    });

    await expect(
      authRepository.register({
        nombre: 'Otra Persona',
        matricula: 'A00999999',
        email: 'ANA@nexou.mx',
        password: 'Otra1234',
        rol: 'estudiante',
      }),
    ).rejects.toThrow('ya está registrado');
  });
});

describe('F01 – Inicio de sesión', () => {
  beforeEach(async () => {
    await authRepository.register({
      nombre: 'Ana López',
      matricula: 'A00123456',
      email: 'ana@nexou.mx',
      password: 'Secreta123',
      rol: 'estudiante',
    });
  });

  it('permite entrar con credenciales correctas', async () => {
    const user = await authRepository.login('ana@nexou.mx', 'Secreta123');
    expect(user.nombre).toBe('Ana López');
  });

  it('rechaza la contraseña incorrecta', async () => {
    await expect(
      authRepository.login('ana@nexou.mx', 'incorrecta'),
    ).rejects.toThrow('incorrectos');
  });

  it('rechaza un correo inexistente', async () => {
    await expect(
      authRepository.login('nadie@nexou.mx', 'Secreta123'),
    ).rejects.toThrow('incorrectos');
  });
});

describe('F03–F08 – Reportes', () => {
  const owner = {
    ownerId: 'u_1',
    ownerNombre: 'Ana López',
    titulo: 'Lámpara quemada',
    descripcion: 'No prende la luz del salón 101.',
    area: 'Edificio A',
    categoria: 'Electricidad' as const,
    photoBase64: null,
  };

  it('crea un reporte en estado pendiente (F03/F04)', async () => {
    const report = await reportRepository.createReport(owner);
    expect(report.estado).toBe('pendiente');
    expect(report.area).toBe('Edificio A');
    expect(report.categoria).toBe('Electricidad');
  });

  it('filtra los reportes por dueño (F06)', async () => {
    await reportRepository.createReport(owner);
    await reportRepository.createReport({...owner, ownerId: 'u_2'});

    const mine = await reportRepository.getReportsByOwner('u_1');
    expect(mine).toHaveLength(1);

    const all = await reportRepository.getAllReports();
    expect(all).toHaveLength(2);
  });

  it('actualiza el estado del reporte (F08)', async () => {
    const report = await reportRepository.createReport(owner);
    const updated = await reportRepository.updateReportStatus(
      report.id,
      'solucionado',
    );

    expect(updated.estado).toBe('solucionado');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(report.createdAt).getTime(),
    );

    const stored = await reportRepository.getReportById(report.id);
    expect(stored?.estado).toBe('solucionado');
  });

  it('falla al actualizar un reporte inexistente', async () => {
    await expect(
      reportRepository.updateReportStatus('no-existe', 'revision'),
    ).rejects.toThrow('ya no existe');
  });
});

describe('Datos de demostración', () => {
  it('siembra usuarios y reportes solo una vez', async () => {
    await seedIfEmpty();
    const users = await AsyncStorage.getItem(StorageKeys.users);
    expect(users).toBeTruthy();

    const firstUsers = users;
    await seedIfEmpty();
    expect(await AsyncStorage.getItem(StorageKeys.users)).toBe(firstUsers);
  });
});
