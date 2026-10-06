import TouchableOpacity from '../../components/MotionTouchable';
import useReducedMotion from '../../hooks/useReducedMotion';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Logo from '../../assets/NexoU_Logo.png';
import EmptyList from '../../components/EmptyList';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Mobiliario: { icon: 'Armchair', soft: '#DBEAFE' },
  Electricidad: { icon: 'Plug', soft: '#FEF3C7' },
  Agua: { icon: 'Droplet', soft: '#E0F2FE' },
  Limpieza: { icon: 'BrushCleaning', soft: '#D1FAE5' },
  Equipos: { icon: 'Laptop', soft: '#EDE9FE' },
  Otros: { icon: 'Ellipsis', soft: colors.border },
};

/**
 * F00 – Inicio del estudiante: saludo personal,
 * acceso rápido a "Levantar reporte", mosaicos por estado, categorías y
 * actividad reciente de los reportes propios.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [viewportHeight, setViewportHeight] = useState(windowHeight);
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
      icon: 'FileText',
      label: 'Pendientes',
      value: count('pendiente'),
      color: colors.danger,
      soft: colors.dangerSoft,
    },
    {
      icon: 'Clock',
      label: 'En revisión',
      value: count('revision'),
      color: colors.warning,
      soft: colors.pendienteSoft,
    },
    {
      icon: 'Check',
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
  const fondo = SCREEN_BACKGROUNDS.login;
  const campusHeight = Math.max(210, viewportHeight * 0.34);
  const collapseDistance = Math.max(1, campusHeight - insets.top);
  const curveScale = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [1, 0.01],
    extrapolate: 'clamp',
  });
  const whiteOpacity = scrollY.interpolate({
    inputRange: [0, collapseDistance * 0.8, collapseDistance],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.root}
      onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <StatusBar barStyle="dark-content" />
      <Animated.Image
        source={fondo.source}
        resizeMode="stretch"
        pointerEvents="none"
        style={[
          styles.campusArt,
          {
            height: campusHeight / 0.32,
            transform: [
              {
                translateY: reducedMotion
                  ? 0
                  : scrollY.interpolate({
                      inputRange: [0, collapseDistance],
                      outputRange: [0, -24],
                      extrapolate: 'clamp',
                    }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surface, opacity: whiteOpacity },
        ]}
      />
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        decelerationRate="normal"
        style={{ marginTop: insets.top }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={{ height: collapseDistance }} />
        <View style={styles.sheet}>
          <Animated.View
            style={[
              styles.sheetCurve,
              {
                transform: reducedMotion
                  ? []
                  : [
                      {
                        translateY: Animated.multiply(
                          Animated.subtract(1, curveScale),
                          25,
                        ),
                      },
                      { scaleY: curveScale },
                    ],
              },
            ]}
            pointerEvents="none"
          >
            <Svg
              width="100%"
              height={50}
              viewBox="0 0 400 50"
              preserveAspectRatio="none"
              pointerEvents="none"
              accessible={false}
            >
              <Path
                d="M0 38 C105 -12 270 -12 400 38 L400 50 L0 50 Z"
                fill={colors.surface}
              />
            </Svg>
          </Animated.View>
          <View
            style={[styles.panel, { minHeight: viewportHeight - insets.top }]}
          >
            <View style={styles.headerBar}>
              <View style={styles.greetBox}>
                <Text style={styles.hello}>Hola, {firstName}</Text>
                <Text style={styles.welcome}>Bienvenida a NexoU</Text>
              </View>
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.88}
              style={styles.cta}
              onPress={goNewReport}
            >
              <View style={styles.ctaCircle}>
                <AppIcon name="CirclePlus" size={28} color={colors.primary} />
              </View>
              <Text style={styles.ctaLabel}>Levantar reporte</Text>
              <AppIcon
                name="ArrowRight"
                size={24}
                color={colors.textOnPrimary}
              />
            </TouchableOpacity>

            <StatTiles items={tiles} variant="inline" style={styles.tiles} />

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Categorías</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={goNewReport}
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
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
                      style={[
                        styles.catIconBox,
                        { backgroundColor: meta.soft },
                      ]}
                    >
                      <AppIcon
                        name={meta.icon}
                        size={26}
                        color={colors.primary}
                      />
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
              <TouchableOpacity
                accessibilityRole="button"
                onPress={goMyReports}
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
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
                      <AppIcon
                        name={meta.icon}
                        size={26}
                        color={colors.primary}
                      />
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
                    <AppIcon
                      name="ChevronRight"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyList
                icon="FolderOpen"
                title="Aún no tienes reportes activos"
                subtitle="Si notas un problema en tu campus, repórtalo en segundos para su mantenimiento."
                actionLabel="Levantar reporte"
                onAction={goNewReport}
              />
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1 },
  campusArt: { position: 'absolute', top: 0, left: 0, width: '100%' },
  sheet: { backgroundColor: colors.surface },
  sheetCurve: { position: 'absolute', top: -49, left: 0, right: 0 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 18,
    minHeight: 56,
  },
  greetBox: {
    flexShrink: 1,
  },
  hello: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  welcome: { fontSize: 16, color: colors.textMuted, marginTop: 3 },
  logo: { height: 34, width: 120 },
  panel: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.xl + 20,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    ...shadow.floating,
  },
  ctaCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
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
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.primary },
  sectionLink: { fontSize: 13.5, fontWeight: '700', color: colors.accentDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 7,
    minHeight: 62,
    flexBasis: '31%',
    flexGrow: 1,
    ...shadow.card,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
