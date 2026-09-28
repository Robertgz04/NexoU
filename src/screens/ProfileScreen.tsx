import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import BrandRow from '../components/BrandRow';
import MenuRow from '../components/MenuRow';
import ScreenBackground from '../components/ScreenBackground';
import StatTiles from '../components/StatTiles';
import type { StatItem } from '../components/StatTiles';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { getReportsByOwner } from '../data/reportRepository';
import { colors, radius, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}

/** Perfil del usuario activo + cierre de sesión (compartido por ambos roles). */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [total, setTotal] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [solucionados, setSolucionados] = useState(0);
  const [revision, setRevision] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    const reports = await getReportsByOwner(user.id);
    setTotal(reports.length);
    setPendientes(reports.filter(r => r.estado === 'pendiente').length);
    setSolucionados(reports.filter(r => r.estado === 'solucionado').length);
    setRevision(reports.filter(r => r.estado === 'revision').length);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!user) {
    return null;
  }

  const isEstudiante = user.rol === 'estudiante';
  const idLabel = isEstudiante ? 'Matrícula' : 'Código';

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de NexoU?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const avisar = (titulo: string, mensaje: string) =>
    Alert.alert(titulo, mensaje);

  const tiles: StatItem[] = [
    {
      icon: '📄',
      label: 'Reportes',
      value: total,
      color: colors.info,
      soft: colors.revisionSoft,
    },
    {
      icon: '📄',
      label: 'Pendientes',
      value: pendientes,
      color: colors.danger,
      soft: colors.dangerSoft,
    },
    {
      icon: '✓',
      label: 'Solucionados',
      value: solucionados,
      color: colors.solucionado,
      soft: colors.solucionadoSoft,
    },
    {
      icon: '◷',
      label: 'En revisión',
      value: revision,
      color: colors.pendiente,
      soft: colors.pendienteSoft,
    },
  ];

  const fondo = SCREEN_BACKGROUNDS.profile;

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={
        <View>
          <BrandRow />
          <Text style={styles.screenTitle}>Mi perfil</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.nombre)}</Text>
            </View>
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✎</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.nombre}</Text>
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
                {isEstudiante ? '🎓 Estudiante' : '🛠 Personal universitario'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🪪</Text>
              <Text style={styles.metaText}>
                {idLabel}: {user.matricula}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>✉</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>

        <StatTiles items={tiles} style={styles.tiles} />

        <MenuRow
          icon="👤"
          title="Datos personales"
          subtitle="Tu información de cuenta y universidad"
          color={colors.info}
          soft={colors.revisionSoft}
          onPress={() =>
            avisar(
              'Datos personales',
              `Nombre: ${user.nombre}\n${idLabel}: ${user.matricula}\nCorreo: ${user.email}`,
            )
          }
        />
        <MenuRow
          icon="📋"
          title="Mis reportes"
          subtitle="Consulta el estado de tus reportes"
          color={colors.solucionado}
          soft={colors.solucionadoSoft}
          onPress={() =>
            navigation.navigate('StudentTabs', { screen: 'MyReports' })
          }
        />
        <MenuRow
          icon="⚙️"
          title="Configuración"
          subtitle="Notificaciones y preferencias"
          color="#7C3AED"
          soft="#EDE9FE"
          onPress={() =>
            avisar(
              'Configuración',
              'Las notificaciones de tus reportes están activas por defecto.',
            )
          }
        />
        <MenuRow
          icon="❓"
          title="Ayuda y soporte"
          subtitle="Preguntas frecuentes y contacto"
          color={colors.pendiente}
          soft={colors.pendienteSoft}
          onPress={() =>
            avisar(
              'Ayuda y soporte',
              'Escribe a soporte.nexou@universidad.edu o visita la Ventanilla de Atención Universitaria.',
            )
          }
        />
        <MenuRow
          icon="⏻"
          title="Cerrar sesión"
          subtitle="Salir de tu cuenta"
          color={colors.danger}
          soft={colors.dangerSoft}
          onPress={confirmLogout}
        />

        <Text style={styles.version}>
          NexoU v0.1.0 · Desarrollo Móvil Integral
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: -spacing.lg,
    ...shadow.card,
  },
  avatarBox: {
    width: 92,
    height: 92,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textOnPrimary, fontSize: 28, fontWeight: '800' },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    marginBottom: 2,
  },
  roleText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDark },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 13, color: colors.text, flexShrink: 1 },
  tiles: {
    marginTop: spacing.md,
  },
  version: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
