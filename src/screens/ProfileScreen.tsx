import LogoutDialog from '../components/LogoutDialog';
import AppIcon from '../components/AppIcon';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import MenuRow from '../components/MenuRow';
import CampusScrollScreen from '../components/CampusScrollScreen';
import MotionTouchable from '../components/MotionTouchable';
import { statusMeta } from '../constants/catalog';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { getReportsByOwner } from '../data/reportRepository';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}

/** Perfil del usuario activo y cierre de sesión. */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [total, setTotal] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [solucionados, setSolucionados] = useState(0);
  const [revision, setRevision] = useState(0);

  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (!user) {
        return;
      }
      try {
        const reports = await getReportsByOwner(user.id);
        if (!isActive()) return;
        setTotal(reports.length);
        setPendientes(reports.filter(r => r.estado === 'pendiente').length);
        setSolucionados(reports.filter(r => r.estado === 'solucionado').length);
        setRevision(reports.filter(r => r.estado === 'revision').length);
        setLoadError(false);
      } catch {
        if (isActive()) setLoadError(true);
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  if (!user) {
    return null;
  }

  const isEstudiante = user.rol === 'estudiante';
  const idLabel = isEstudiante ? 'Matrícula' : 'Código';

  const tiles = [
    {
      icon: 'FileText',
      label: 'Reportes',
      value: total,
      color: colors.primary,
      soft: colors.revisionSoft,
    },
    {
      icon: 'FileText',
      label: 'Pendientes',
      value: pendientes,
      color: statusMeta('pendiente').color,
      soft: statusMeta('pendiente').soft,
    },
    {
      icon: 'Check',
      label: 'Solucionados',
      value: solucionados,
      color: statusMeta('solucionado').color,
      soft: statusMeta('solucionado').soft,
    },
    {
      icon: 'Clock',
      label: 'En revisión',
      value: revision,
      color: statusMeta('revision').color,
      soft: statusMeta('revision').soft,
    },
  ];

  const fondo = SCREEN_BACKGROUNDS.login;

  return (
    <>
      <CampusScrollScreen
        source={fondo.source}
        campusRatio={0.32}
        campusHeight={136}
      >
        <Text accessibilityRole="header" style={styles.screenTitle}>
          Mi perfil
        </Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.nombre)}</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text selectable style={styles.name}>
              {user.nombre}
            </Text>
            <View
              style={[
                styles.roleBadge,
                !isEstudiante && { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  !isEstudiante && { color: colors.primaryDark },
                ]}
              >
                {isEstudiante ? 'Estudiante' : 'Personal universitario'}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <AppIcon name="IdCard" size={20} color={colors.primary} />
              <Text selectable style={styles.metaText}>
                {idLabel}: {user.matricula}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <AppIcon name="Mail" size={20} color={colors.primary} />
              <Text selectable style={styles.metaText}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Resumen de tus reportes
          </Text>
          {loading ? (
            <ActivityIndicator
              accessibilityLabel="Cargando resumen de reportes"
              color={colors.primary}
            />
          ) : loadError ? (
            <View style={styles.summaryError}>
              <Text accessibilityLiveRegion="polite" style={styles.helper}>
                No pudimos actualizar el resumen de tus reportes.
              </Text>
              <MotionTouchable
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  load();
                }}
                style={styles.retry}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </MotionTouchable>
            </View>
          ) : (
            <View style={styles.tiles}>
              {tiles.map(tile => (
                <View key={tile.label} style={styles.tile}>
                  <AppIcon name={tile.icon} size={22} color={tile.color} />
                  <Text style={styles.tileValue}>{tile.value}</Text>
                  <Text style={styles.tileLabel}>{tile.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Cuenta y actividad
          </Text>

          <MenuRow
            icon="UserRound"
            title="Datos personales"
            subtitle="Consulta y edita la información de tu cuenta"
            color={colors.primary}
            soft={colors.revisionSoft}
            onPress={() => navigation.navigate('PersonalData')}
          />
          {isEstudiante ? (
            <MenuRow
              icon="ClipboardList"
              title="Mis reportes"
              subtitle="Consulta el historial y seguimiento de tus reportes"
              color={colors.primary}
              soft={colors.solucionadoSoft}
              onPress={() =>
                navigation.navigate('StudentTabs', { screen: 'MyReports' })
              }
            />
          ) : (
            <MenuRow
              icon="ChartColumn"
              title="Panel de incidencias"
              subtitle="Gestión de todos los reportes recibidos"
              color={colors.solucionado}
              soft={colors.solucionadoSoft}
              onPress={() =>
                navigation.navigate('StaffTabs', { screen: 'AllReports' })
              }
            />
          )}
        </View>
        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Preferencias y ayuda
          </Text>
          <MenuRow
            icon="Settings"
            title="Configuración"
            subtitle="Accesibilidad y preferencias de este dispositivo"
            color="#7C3AED"
            soft="#EDE9FE"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuRow
            icon="CircleHelp"
            title="Ayuda y soporte"
            subtitle="Soporte técnico y ventanilla de atención universitaria"
            color={colors.primary}
            soft={colors.pendienteSoft}
            onPress={() => navigation.navigate('HelpSupport')}
          />
        </View>
        <View style={styles.sessionGroup}>
          <MenuRow
            icon="LogOut"
            title="Cerrar sesión"
            subtitle="Salir de tu cuenta de forma segura"
            color={colors.danger}
            soft={colors.dangerSoft}
            onPress={() => setLogoutVisible(true)}
          />
        </View>
        <Text style={styles.version}>
          NexoU v0.1.0 · Sistema Universitario de Incidencias
        </Text>
      </CampusScrollScreen>
      <LogoutDialog
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={logout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.primary },
  profileCard: { marginTop: spacing.lg, gap: spacing.md },
  avatarBox: { alignSelf: 'flex-start' },
  avatar: {
    minWidth: 64,
    minHeight: 64,
    padding: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.surface, fontSize: 26, fontWeight: '800' },
  profileInfo: { gap: spacing.sm },
  name: { fontSize: 26, fontWeight: '800', color: colors.primary },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaText: { flex: 1, fontSize: 15, lineHeight: 23, color: colors.text },
  group: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexBasis: '45%',
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tileValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  tileLabel: {
    width: '100%',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  summaryError: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  helper: { fontSize: 15, lineHeight: 23, color: colors.text },
  retry: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  retryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  sessionGroup: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  version: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
