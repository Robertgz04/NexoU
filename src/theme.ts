/**
 * NexoU – Tema visual compartido por todas las pantallas.
 * Paleta derivada de los mockups: azul marino institucional + turquesa NexoU,
 * tarjetas blancas redondeadas sobre fondo claro y semáforo de estados.
 */
export const colors = {
  // Marca
  primary: '#0F3D62', // azul marino del logo y botones principales
  primaryDark: '#0A2C46',
  primarySoft: '#E7F0F8',
  accent: '#14B3A0', // turquesa de la "U" y elementos activos
  accentDark: '#0D8C7E',
  accentSoft: '#E4F7F4',
  // Superficies
  background: '#F4F7FA',
  surface: '#FFFFFF',
  text: '#0E2A3F',
  textMuted: '#6B7A8C',
  textOnPrimary: '#FFFFFF',
  border: '#E4EAF1',
  // Semáforo general
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
  xl: 22,
  pill: 999,
} as const;

/** Sombras suaves de tarjeta (mockups: elevación mínima, sin bordes duros). */
export const shadow = {
  card: {
    shadowColor: '#0E2A3F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0E2A3F',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.primary },
  subtitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
} as const;
