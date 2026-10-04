import React, { useCallback, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Logo from '../../assets/NexoU_Logo.png';
import EmptyList from '../../components/EmptyList';
import ScreenBackground from '../../components/ScreenBackground';
import StatTiles from '../../components/StatTiles';
import type { StatItem } from '../../components/StatTiles';
import StatusBadge from '../../components/StatusBadge';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { CATEGORIES } from '../../constants/catalog';
import { useAuth } from '../../context/AuthContext';
import { getReportsByOwner } from '../../data/reportRepository';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing } from '../../theme';
import type { Category, Report, ReportStatus } from '../../types';
import { formatFecha } from '../../utils/dates';

interface CatMeta {
  icon: string;
  soft: string;
}

/** Icono y fondo tenue por categoría para Inicio. */
const CATEGORY_META: Record<Category, CatMeta> = {
  Mobiliario: { icon: '🪑', soft: '#DBEAFE' },
  Electricidad: { icon: '⚡', soft: '#FEF3C7' },
  Agua: { icon: '💧', soft: '#E0F2FE' },
  Limpieza: { icon: '🧹', soft: '#D1FAE5' },
  Equipos: { icon: '💻', soft: '#EDE9FE' },
  Otros: { icon: '•••', soft: colors.border },
};

/**
 * F00 – Inicio del estudiante: saludo personal,
 * acceso rápido a "Levantar reporte", mosaicos por estado, categorías y
 * actividad reciente de los reportes propios.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await getReportsByOwner(user.id);
    setReports(data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goNewReport = () =>
    navigation.navigate('StudentTabs', { screen: 'NewReport' });
  const goMyReports = () =>
    navigation.navigate('StudentTabs', { screen: 'MyReports' });

  const count = (status: ReportStatus) =>
    reports.filter(r => r.estado === status).length;

  const tiles: StatItem[] = [
    {
      icon: '📄',
      label: 'Pendientes',
      value: count('pendiente'),
      color: colors.danger,
      soft: colors.dangerSoft,
    },
    {
      icon: '🕐',
      label: 'En revisión',
      value: count('revision'),
      color: colors.warning,
      soft: colors.pendienteSoft,
    },
    {
      icon: '✓',
      label: 'Solucionados',
      value: count('solucionado'),
      color: colors.success,
      soft: colors.solucionadoSoft,
    },
  ];

  const recent = [...reports]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const firstName = user?.nombre.trim().split(/\s+/)[0] ?? 'estudiante';
  const fondo = SCREEN_BACKGROUNDS.home;

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={
        <View style={styles.headerBar}>
          <View style={styles.greetBox}>
            <Text style={styles.hello}>Hola, {firstName}</Text>
            <Text style={styles.welcome}>Panel del estudiante</Text>
          </View>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.panel}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.88}
            style={styles.cta}
            onPress={goNewReport}
          >
            <View style={styles.ctaCircle}>
              <Text style={styles.ctaPlus}>＋</Text>
            </View>
            <Text style={styles.ctaLabel}>Levantar nuevo reporte</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>

          <StatTiles items={tiles} variant="inline" style={styles.tiles} />

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Categorías de incidencia</Text>
            <TouchableOpacity accessibilityRole="button" onPress={goNewReport}>
              <Text style={styles.sectionLink}>Reportar ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  style={styles.catCard}
                  onPress={goNewReport}
                >
                  <View
                    style={[styles.catIconBox, { backgroundColor: meta.soft }]}
                  >
                    <Text style={styles.catIcon}>{meta.icon}</Text>
                  </View>
                  <Text
                    style={styles.catLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            <TouchableOpacity accessibilityRole="button" onPress={goMyReports}>
              <Text style={styles.sectionLink}>Ver todos ({reports.length}) ›</Text>
            </TouchableOpacity>
          </View>

          {recent.length > 0 ? (
            recent.map(report => {
              const meta = CATEGORY_META[report.categoria];
              return (
                <TouchableOpacity
                  key={report.id}
                  accessibilityRole="button"
                  activeOpacity={0.88}
                  style={styles.activityCard}
                  onPress={() =>
                    navigation.navigate('ReportDetail', {
                      reportId: report.id,
                    })
                  }
                >
                  <View
                    style={[
                      styles.activityIconBox,
                      { backgroundColor: meta.soft },
                    ]}
                  >
                    <Text style={styles.activityIcon}>{meta.icon}</Text>
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {report.titulo}
                    </Text>
                    <Text style={styles.activityMeta} numberOfLines={1}>
                      {report.area} · {report.categoria}
                    </Text>
                    <Text style={styles.activityDate}>
                      {formatFecha(report.createdAt)}
                    </Text>
                  </View>
                  <View>
                    <StatusBadge status={report.estado} />
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <EmptyList
              icon="🗂"
              title="Aún no tienes reportes activos"
              subtitle="Si notas un problema en tu campus, repórtalo en segundos para su mantenimiento."
              actionLabel="➕ Levantar reporte"
              onAction={goNewReport}
            />
          )}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl + 20 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  greetBox: {
    flexShrink: 1,
  },
  hello: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  welcome: { fontSize: 13.5, color: colors.textMuted, marginTop: 1 },
  logo: { height: 34, width: 120 },
  panel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    ...shadow.floating,
  },
  ctaCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPlus: { fontSize: 20, fontWeight: '800', color: colors.primary },
  ctaLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  ctaArrow: { fontSize: 18, fontWeight: '700', color: colors.accent },
  tiles: { marginTop: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.primary },
  sectionLink: { fontSize: 13.5, fontWeight: '700', color: colors.accentDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    flexBasis: '31%',
    flexGrow: 1,
    ...shadow.card,
  },
  catIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: { fontSize: 15 },
  catLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    gap: spacing.sm,
    marginBottom: spacing.sm + 4,
    ...shadow.card,
  },
  activityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIcon: { fontSize: 17 },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 14.5, fontWeight: '800', color: colors.primary },
  activityMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  activityDate: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, fontWeight: '700', color: colors.textMuted },
});
