/**
 * Pruebas de los repositorios de datos (F01–F08):
 * registro, inicio de sesión, creación de reportes y cambio de estado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authRepository from '../src/data/authRepository';
import * as reportRepository from '../src/data/reportRepository';
import { StorageKeys } from '../src/data/storage';
import { seedIfEmpty } from '../src/data/seed';

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
    await reportRepository.createReport({ ...owner, ownerId: 'u_2' });

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

  it('persiste notas y conserva todas las transiciones de un reporte anterior', async () => {
    const report = await reportRepository.createReport(owner);
    const author = { id: 'staff-1', nombre: 'María' };
    await reportRepository.updateReportStatus(
      report.id,
      'revision',
      '  Revisando equipo  ',
      author,
    );
    await reportRepository.updateReportStatus(
      report.id,
      'solucionado',
      'Equipo reparado',
      author,
    );
    const updated = await reportRepository.updateReportStatus(
      report.id,
      'pendiente',
    );
    expect(updated.statusUpdates).toHaveLength(3);
    expect(updated.statusUpdates![0]).toMatchObject({
      from: 'pendiente',
      to: 'revision',
      note: 'Revisando equipo',
      authorId: author.id,
      authorName: author.nombre,
    });
    expect(updated.statusUpdates![2]).toMatchObject({
      from: 'solucionado',
      to: 'pendiente',
      note: '',
    });
    expect(updated.statusUpdates![2].createdAt).toBe(updated.updatedAt);
    expect(await reportRepository.getReportById(report.id)).toEqual(updated);
    await expect(
      reportRepository.updateReportStatus(
        report.id,
        'revision',
        'x'.repeat(501),
      ),
    ).rejects.toThrow('500');
    expect(await reportRepository.getReportById(report.id)).toEqual(updated);
    expect(
      (await reportRepository.updateReportStatus(report.id, 'pendiente'))
        .statusUpdates,
    ).toHaveLength(3);
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

describe('Edición de datos personales', () => {
  const input = {
    nombre: 'Ana',
    matricula: 'A001',
    email: 'ana@nexou.mx',
    password: 'Secreta123',
    rol: 'estudiante' as const,
  };
  it('persiste nombre e identificador sin cambiar credenciales ni rol', async () => {
    const user = await authRepository.register(input);
    const updated = await authRepository.updatePersonalData(user.id, {
      nombre: ' Ana López ',
      matricula: ' A002 ',
      email: input.email,
    });
    expect(updated).toMatchObject({
      nombre: 'Ana López',
      matricula: 'A002',
      passwordHash: user.passwordHash,
      rol: user.rol,
      id: user.id,
    });
    expect(await authRepository.getUserById(user.id)).toEqual(updated);
    expect(
      (await authRepository.login(input.email, input.password)).nombre,
    ).toBe('Ana López');
  });
  it('cambia el correo verificando la contraseña y mantiene válido el acceso', async () => {
    const user = await authRepository.register(input);
    await expect(
      authRepository.updatePersonalData(user.id, {
        ...input,
        email: 'nuevo@nexou.mx',
        currentPassword: 'incorrecta',
      }),
    ).rejects.toThrow('contraseña actual');
    expect((await authRepository.getUserById(user.id))!.email).toBe(
      input.email,
    );
    await authRepository.updatePersonalData(user.id, {
      ...input,
      email: ' NUEVO@nexou.mx ',
      currentPassword: input.password,
    });
    expect(
      (await authRepository.login('nuevo@nexou.mx', input.password)).id,
    ).toBe(user.id);
    await expect(
      authRepository.login(input.email, input.password),
    ).rejects.toThrow('incorrectos');
  });
  it('rechaza correo duplicado y campos inválidos sin modificar la cuenta', async () => {
    const user = await authRepository.register(input);
    await authRepository.register({ ...input, email: 'otro@nexou.mx' });
    await expect(
      authRepository.updatePersonalData(user.id, {
        ...input,
        email: 'otro@nexou.mx',
        currentPassword: input.password,
      }),
    ).rejects.toThrow('otra cuenta');
    await expect(
      authRepository.updatePersonalData(user.id, { ...input, nombre: ' ' }),
    ).rejects.toThrow('obligatorio');
    await expect(
      authRepository.updatePersonalData(user.id, {
        ...input,
        email: 'incorrecto',
      }),
    ).rejects.toThrow('válido');
    expect(await authRepository.getUserById(user.id)).toEqual(user);
  });
});
