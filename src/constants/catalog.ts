import type {Category, ReportStatus} from '../types';

/**
 * Áreas/edificios de la universidad (F04).
 * La ubicación se elige de esta lista: no hay GPS (ver delimitación 2).
 */
export const AREAS: string[] = [
  'Edificio A',
  'Edificio B',
  'Biblioteca',
  'Laboratorios',
  'Cafetería',
  'Baños',
  'Pasillos y áreas comunes',
  'Canchas y áreas deportivas',
  'Jardín y patio central',
];

/** Categorías de incidencia (F04). */
export const CATEGORIES: Category[] = [
  'Mobiliario',
  'Electricidad',
  'Agua',
  'Limpieza',
  'Equipos',
  'Otros',
];

export interface StatusMeta {
  value: ReportStatus;
  label: string;
  color: string;
  soft: string;
}

/** Estados del reporte (F06/F08) con su semáforo visual. */
export const STATUSES: StatusMeta[] = [
  {value: 'pendiente', label: 'Pendiente', color: '#F59E0B', soft: '#FEF3C7'},
  {value: 'revision', label: 'En revisión', color: '#3B82F6', soft: '#DBEAFE'},
  {value: 'solucionado', label: 'Solucionado', color: '#10B981', soft: '#D1FAE5'},
];

export function statusMeta(status: ReportStatus): StatusMeta {
  return STATUSES.find(s => s.value === status) ?? STATUSES[0];
}

/** Límite de caracteres del formulario de reporte (F03). */
export const LIMITS = {
  titulo: 80,
  descripcion: 500,
  passwordMin: 6,
} as const;
