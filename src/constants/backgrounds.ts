import type { ImageSourcePropType } from 'react-native';

import FondoLogin from '../assets/NexoU_Fondo_Login.png';
import FondoRegistro from '../assets/NexoU_Fondo_Registro_Estudiante.png';
import FondoNuevoReporte from '../assets/NexoU_Fondo_Nuevo_Reporte.png';
import FondoInicio from '../assets/NexoU_Fondo_Inicio_Estudiante.png';
import FondoMisReportes from '../assets/NexoU_Fondo_Mis_Reportes.png';
import FondoDetalle from '../assets/NexoU_Fondo_Detalle_Reporte.png';
import FondoPerfil from '../assets/NexoU_Fondo_Perfil.png';
import FondoPanel from '../assets/NexoU_Fondo_Panel_Personal.png';
import FondoNotificaciones from '../assets/NexoU_Fondo_Notificaciones.png';
import FondoEstadisticas from '../assets/NexoU_Fondo_Estadisticas.png';

export type ScreenBackgroundKey =
  | 'login'
  | 'register'
  | 'newReport'
  | 'home'
  | 'myReports'
  | 'reportDetail'
  | 'profile'
  | 'allReports'
  | 'notifications'
  | 'statistics';

interface ScreenBackground {
  /** Imagen vertical a pantalla completa: campus, cuerpo claro y ondas. */
  source: ImageSourcePropType;
  /**
   * Fracción del alto de pantalla donde termina la ilustración del campus y
   * arranca el cuerpo claro (medido sobre los mockups de 941x1672).
   */
  artBottom: number;
  /** Los mockups de Login, Registro y Nuevo reporte usan una hoja blanca redondeada. */
  sheet: boolean;
}

/**
 * Fondo a pantalla completa de cada mockup. La imagen ya incluye la
 * ilustración del campus, la zona clara central y las ondas inferiores, por lo
 * que sustituye por completo a las antiguas bandas `Fondo_Header`,
 * `Fondo_Campus` y `Fondo_Ondas`.
 */
export const SCREEN_BACKGROUNDS: Record<ScreenBackgroundKey, ScreenBackground> = {
  login: { source: FondoLogin, artBottom: 0.25, sheet: true },
  register: { source: FondoRegistro, artBottom: 0.25, sheet: true },
  newReport: { source: FondoNuevoReporte, artBottom: 0.23, sheet: true },
  home: { source: FondoInicio, artBottom: 0.23, sheet: false },
  myReports: { source: FondoMisReportes, artBottom: 0.2, sheet: false },
  reportDetail: { source: FondoDetalle, artBottom: 0.16, sheet: false },
  profile: { source: FondoPerfil, artBottom: 0.23, sheet: false },
  allReports: { source: FondoPanel, artBottom: 0.19, sheet: false },
  notifications: { source: FondoNotificaciones, artBottom: 0.14, sheet: false },
  statistics: { source: FondoEstadisticas, artBottom: 0.14, sheet: false },
};
