/**
 * NexoU – Modelo de datos compartido (F01–F08).
 */

/** Tipos de usuario (sección 3 del documento de proyecto). */
export type Role = 'estudiante' | 'personal';

/** Estados posibles de un reporte (F08). */
export type ReportStatus = 'pendiente' | 'revision' | 'solucionado';

/** Actualización registrada; no se reconstruyen eventos anteriores. */
export interface ReportStatusUpdate {
  id: string;
  from: ReportStatus;
  to: ReportStatus;
  note: string;
  createdAt: string;
  authorId?: string;
  authorName?: string;
}

/** Categorías de incidencia (F04). */
export type Category =
  | 'Mobiliario'
  | 'Electricidad'
  | 'Agua'
  | 'Limpieza'
  | 'Equipos'
  | 'Otros';

/** Usuario autenticado (F01/F02). */
export interface User {
  id: string;
  nombre: string;
  matricula: string;
  email: string;
  /** SHA-256 con sal derivada del correo. Nunca se guarda la contraseña en claro. */
  passwordHash: string;
  rol: Role;
  createdAt: string;
}

/** Reporte de incidencia (F03–F08). */
export interface Report {
  id: string;
  ownerId: string;
  ownerNombre: string;
  titulo: string;
  descripcion: string;
  /** Área/edificio seleccionado de la lista (F04). */
  area: string;
  /** Categoría de incidencia (F04). */
  categoria: Category;
  estado: ReportStatus;
  /** Evidencia fotográfica en base64 (F05). `null` si no se adjuntó. */
  photoBase64: string | null;
  createdAt: string;
  updatedAt: string;
  statusUpdates?: ReportStatusUpdate[];
}

/** Datos de entrada para registro (F02). */
export interface RegisterInput {
  nombre: string;
  matricula: string;
  email: string;
  password: string;
  rol: Role;
}

/** Datos de entrada para crear un reporte (F03–F05). */
export interface CreateReportInput {
  ownerId: string;
  ownerNombre: string;
  titulo: string;
  descripcion: string;
  area: string;
  categoria: Category;
  photoBase64: string | null;
}

/** Editable account data; role and identity remain unchanged. */
export interface UpdatePersonalDataInput {
  nombre: string;
  matricula: string;
  email: string;
  currentPassword?: string;
}
