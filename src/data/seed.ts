import type {Category, Report, User} from '../types';
import {getJSON, setJSON, StorageKeys} from './storage';
import {hashPassword} from '../utils/sha256';
import {uid} from '../utils/validators';

/**
 * Datos iniciales de demostración (solo en el primer arranque).
 * Permiten mostrar el flujo completo estudiante → personal sin crear
 * cuentas a mano. Se documentan en README.md.
 */

interface SeedReport {
  titulo: string;
  descripcion: string;
  area: string;
  categoria: Category;
  estado: Report['estado'];
}

const SEED_REPORTS: SeedReport[] = [
  {
    titulo: 'Lámpara quemada en el aula 101',
    descripcion:
      'La luminaria del centro del salón dejó de funcionar ayer. El salón queda muy oscuro por las tardes y cuesta leer en los pupitres del fondo.',
    area: 'Edificio A',
    categoria: 'Electricidad',
    estado: 'pendiente',
  },
  {
    titulo: 'Fuga de agua en los baños del segundo piso',
    descripcion:
      'El lavabo de la derecha está goteando constantemente y el piso se resbala. Ya hay una toalla colocada pero sigue acumulándose agua.',
    area: 'Baños',
    categoria: 'Agua',
    estado: 'revision',
  },
  {
    titulo: 'Silla rota en la zona de lectura',
    descripcion:
      'Una silla de la zona de lectura tiene la base suelta y se cae si se apoya el peso completo. Está junto a la ventana.',
    area: 'Biblioteca',
    categoria: 'Mobiliario',
    estado: 'solucionado',
  },
];

export async function seedIfEmpty(): Promise<void> {
  const done = await getJSON<boolean>(StorageKeys.seeded, false);
  if (done) {
    return;
  }

  const existingUsers = await getJSON<User[]>(StorageKeys.users, []);
  if (existingUsers.length === 0) {
    const student: User = {
      id: uid('u_'),
      nombre: 'Estudiante Demo',
      matricula: 'A00123456',
      email: 'estudiante@nexou.mx',
      passwordHash: hashPassword('estudiante@nexou.mx', 'Demo1234'),
      rol: 'estudiante',
      createdAt: new Date().toISOString(),
    };
    const staff: User = {
      id: uid('u_'),
      nombre: 'Personal Demo',
      matricula: 'P0001',
      email: 'personal@nexou.mx',
      passwordHash: hashPassword('personal@nexou.mx', 'Demo1234'),
      rol: 'personal',
      createdAt: new Date().toISOString(),
    };
    await setJSON(StorageKeys.users, [student, staff]);

    const now = Date.now();
    const reports: Report[] = SEED_REPORTS.map((seed, index) => {
      const createdAt = new Date(now - (index + 1) * 3600 * 1000).toISOString();
      return {
        id: uid('r_'),
        ownerId: student.id,
        ownerNombre: student.nombre,
        titulo: seed.titulo,
        descripcion: seed.descripcion,
        area: seed.area,
        categoria: seed.categoria,
        estado: seed.estado,
        photoBase64: null,
        createdAt,
        updatedAt: createdAt,
      };
    });
    await setJSON(StorageKeys.reports, reports);
  }

  await setJSON(StorageKeys.seeded, true);
}
