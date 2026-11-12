import { request } from '../services/api';
export type CatalogKind = 'areas' | 'categorias';
export interface CatalogEntry {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}
export interface Institution {
  nombre: string;
  correo_soporte: string;
  ubicacion_soporte: string;
}
export const getInstitution = () => request<Institution>('/institution');
export const saveInstitution = (body: Institution) =>
  request<Institution>('/admin/institution', { method: 'PUT', body });
export const getAdminCatalog = (kind: CatalogKind) =>
  request<CatalogEntry[]>(`/admin/catalogs/${kind}`);
export const saveCatalogEntry = (
  kind: CatalogKind,
  body: Omit<CatalogEntry, 'id'>,
  id?: number,
) =>
  request<CatalogEntry>(
    `/admin/catalogs/${kind}${id === undefined ? '' : `/${id}`}`,
    { method: id === undefined ? 'POST' : 'PUT', body },
  );
