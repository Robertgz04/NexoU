import type {CreateReportInput, Report, ReportStatus} from '../types';
import {getJSON, setJSON, StorageKeys} from './storage';
import {uid} from '../utils/validators';

/**
 * Repositorio de reportes (F03–F08).
 * Implementación local sobre AsyncStorage.
 *
 * Para conectar Firestore (plan de trabajo, Sprints 3–7) reemplaza el
 * interior de estas funciones por las llamadas de `firebase/firestore`
 * manteniendo firmas. La subida de la foto a Firebase Storage se haría
 * con `photoBase64` → `uploadBytes` y en su lugar se guardaría la URL.
 */

export async function getReports(): Promise<Report[]> {
  const reports = await getJSON<Report[]>(StorageKeys.reports, []);
  // Más recientes primero
  return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Reportes propios del estudiante (F06). */
export async function getReportsByOwner(ownerId: string): Promise<Report[]> {
  const all = await getReports();
  return all.filter(r => r.ownerId === ownerId);
}

/** Todos los reportes para el panel del personal (F07). */
export async function getAllReports(): Promise<Report[]> {
  return getReports();
}

export async function getReportById(id: string): Promise<Report | null> {
  const all = await getJSON<Report[]>(StorageKeys.reports, []);
  return all.find(r => r.id === id) ?? null;
}

/** Crea un reporte con título, descripción, área, categoría y foto (F03–F05). */
export async function createReport(input: CreateReportInput): Promise<Report> {
  const now = new Date().toISOString();
  const report: Report = {
    id: uid('r_'),
    ownerId: input.ownerId,
    ownerNombre: input.ownerNombre,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion.trim(),
    area: input.area,
    categoria: input.categoria,
    estado: 'pendiente',
    photoBase64: input.photoBase64,
    createdAt: now,
    updatedAt: now,
  };

  const all = await getJSON<Report[]>(StorageKeys.reports, []);
  await setJSON(StorageKeys.reports, [...all, report]);
  return report;
}

/** Cambia el estado de un reporte (F08). */
export async function updateReportStatus(
  id: string,
  estado: ReportStatus,
): Promise<Report> {
  const all = await getJSON<Report[]>(StorageKeys.reports, []);
  const index = all.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error('El reporte ya no existe.');
  }
  const updated: Report = {
    ...all[index],
    estado,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await setJSON(StorageKeys.reports, all);
  return updated;
}

/** Conteo rápido para el resumen de los paneles. */
export function countByStatus(
  reports: Report[],
  status: ReportStatus,
): number {
  return reports.filter(r => r.estado === status).length;
}
