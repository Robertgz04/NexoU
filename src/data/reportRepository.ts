import type {
  CreateReportInput,
  Report,
  ReportStatus,
  ReportSummary,
  Statistics,
  Notice,
} from '../types';
import { request } from '../services/api';
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}
export interface ReportQuery {
  own?: boolean;
  estado?: ReportStatus;
  area?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}
export function queryString(params: Record<string, unknown>) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== '',
  );
  return entries.length
    ? '?' +
        entries
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          )
          .join('&')
    : '';
}
export function getReportPage(params: ReportQuery = {}) {
  return request<Page<Report>>('/reports' + queryString({ ...params }));
}
export async function getReports(): Promise<Report[]> {
  const all: Report[] = [];
  let cursor: string | undefined;
  do {
    const page = await getReportPage({ cursor });
    all.push(...page.items);
    cursor = page.nextCursor || undefined;
  } while (cursor);
  return all;
}
export async function getReportsByOwner(_ownerId: string) {
  return (await getReportPage({ own: true })).items;
}
export async function getAllReports() {
  return (await getReportPage()).items;
}
export function getReportById(id: string) {
  return request<Report>(`/reports/${encodeURIComponent(id)}`);
}
export function getSummary(own = false) {
  return request<ReportSummary>('/reports/summary' + queryString({ own }));
}
export function getStatistics(periodo: 'semana' | 'mes' | 'anio') {
  return request<Statistics>('/staff/statistics' + queryString({ periodo }));
}
export function getNotices(
  params: { tipo?: 'todas' | 'aviso' | 'estado'; cursor?: string } = {},
) {
  return request<Page<Notice>>('/staff/notices' + queryString(params));
}
export interface Catalogs {
  areas: { id: number; nombre: string }[];
  categorias: { id: number; nombre: string }[];
  estados: { codigo: ReportStatus; nombre: string }[];
}
export function getCatalogs() {
  return request<Catalogs>('/catalogs');
}
export async function createReport(input: CreateReportInput): Promise<Report> {
  const catalogs = await getCatalogs();
  const area = catalogs.areas.find(a => a.nombre === input.area);
  const categoria = catalogs.categorias.find(c => c.nombre === input.categoria);
  if (!area || !categoria)
    throw new Error(
      'El área o categoría ya no está disponible. Actualiza el formulario.',
    );
  const form = new FormData();
  form.append('titulo', input.titulo.trim());
  form.append('descripcion', input.descripcion.trim());
  form.append('areaId', String(area.id));
  form.append('categoriaId', String(categoria.id));
  if (input.photo)
    form.append('photo', {
      uri: input.photo.uri,
      type: input.photo.type,
      name: input.photo.name,
    } as unknown as Blob);
  return request<Report>('/reports', { method: 'POST', multipart: form });
}
export function updateReportStatus(
  id: string,
  estado: ReportStatus,
  note = '',
  _author?: { id: string; nombre: string },
) {
  return request<Report>(`/reports/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { estado, note },
  });
}
export function countByStatus(reports: Report[], status: ReportStatus) {
  return reports.filter(r => r.estado === status).length;
}
