/**
 * NexoU – Tema visual compartido por todas las pantallas.
 * Paleta institucional: azul NexoU + semáforo de estados.
 */
export const colors = {
  primary: '#2D6CDF',
  primaryDark: '#1E4FA3',
  primarySoft: '#E8F0FE',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A2233',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  // Estados de reporte
  pendiente: '#F59E0B',
  pendienteSoft: '#FEF3C7',
  revision: '#3B82F6',
  revisionSoft: '#DBEAFE',
  solucionado: '#10B981',
  solucionadoSoft: '#D1FAE5',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: {fontSize: 24, fontWeight: '700' as const, color: colors.text},
  subtitle: {fontSize: 16, fontWeight: '600' as const, color: colors.text},
  body: {fontSize: 15, color: colors.text},
  muted: {fontSize: 13, color: colors.textMuted},
} as const;
