/** Formateo de fechas en español sin dependencias externas. */

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "12 sep 2026, 14:05" */
export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${
    MESES[d.getMonth()]
  } ${d.getFullYear()}, ${hh}:${mm}`;
}

/** "12 abr. 2025" */
export function formatFechaCorta(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  return `${d.getDate()} ${MESES[d.getMonth()]}. ${d.getFullYear()}`;
}

/** "12 abr. 2025 • 10:24 a. m." (mockups de seguimiento) */
export function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const h24 = d.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ampm = h24 < 12 ? 'a. m.' : 'p. m.';
  return `${formatFechaCorta(iso)} • ${h}:${mm} ${ampm}`;
}

/** Fecha relata para listas: "hace 5 min", "ayer", o fecha completa. */
export function formatFechaRelativa(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) {
    return 'ahora mismo';
  }
  if (diffMin < 60) {
    return `hace ${diffMin} min`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `hace ${diffHours} h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'ayer';
  }
  if (diffDays < 7) {
    return `hace ${diffDays} días`;
  }
  return formatFecha(iso);
}
