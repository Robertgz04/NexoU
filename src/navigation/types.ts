import type { NavigatorScreenParams } from '@react-navigation/native';

/** Tabs del estudiante: inicio, reportes, alta y perfil (F03–F06). */
export type StudentTabParamList = {
  Home: undefined;
  MyReports: undefined;
  NewReport: undefined;
  Profile: undefined;
};

/** Tabs del personal: reportes, estadísticas, notificaciones y perfil (F07–F09). */
export type StaffTabParamList = {
  AllReports: undefined;
  Statistics: undefined;
  Notifications: undefined;
  Profile: undefined;
};

/**
 * Pila raíz. El contenido cambia según el rol:
 * sin sesión → Login/Register; estudiante → StudentTabs; personal → StaffTabs.
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  StudentTabs: NavigatorScreenParams<StudentTabParamList> | undefined;
  StaffTabs: NavigatorScreenParams<StaffTabParamList> | undefined;
  ReportDetail: { reportId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
