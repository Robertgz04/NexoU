import TouchableOpacity from '../../components/MotionTouchable';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import CampusScrollScreen from '../../components/CampusScrollScreen';
import EmptyList from '../../components/EmptyList';
import SegmentedControl from '../../components/SegmentedControl';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { CATEGORIES, STATUSES } from '../../constants/catalog';
import { getStatistics } from '../../data/reportRepository';
import type { RootStackParamList } from '../../navigation/types';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  colors,
  radius,
  spacing,
} from '../../theme';
import type { Statistics, ReportStatus } from '../../types';

type Periodo = 'semana' | 'mes' | 'anio';

const PERIODOS = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

/** F09 – Estadísticas e indicadores del panel de personal. */
export default function StatisticsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { width, fontScale } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  const version = useRef(0);
  const [data, setData] = useState<Statistics | null>(null);
  const confirmed = useRef<Statistics | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const load = useCallback(async () => {
    const current = ++version.current;
    pending.current = true;
    try {
      const result = await getStatistics(periodo);
      if (current !== version.current) return;
      confirmed.current = result;
      setData(result);
      setError(null);
    } catch {
      if (current !== version.current) return;
      setError('No pudimos actualizar las estadísticas. Intenta de nuevo.');
      if (confirmed.current) setPeriodo(confirmed.current.periodo);
    } finally {
      if (current === version.current) {
        pending.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [periodo]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const conteo = data?.counts || { pendiente: 0, revision: 0, solucionado: 0 };
  const total = data?.total || 0;
  const porCategoria =
    data?.categories || CATEGORIES.map(categoria => ({ categoria, value: 0 }));
  const maxCategoria = Math.max(...porCategoria.map(c => c.value), 1);
  const serie = data?.serie || [];
  const areaTop = data?.areaTop || null;
  const slices = STATUSES.map(s => ({
    value: conteo[s.value],
    color: s.color,
    label: s.label,
    percent: total > 0 ? Math.round((conteo[s.value] / total) * 100) : 0,
  }));

  const onRefresh = async () => {
    if (pending.current) return;
    setRefreshing(true);
    await load();
  };
  const interval =
    periodo === 'semana'
      ? 'Últimos 7 días'
      : periodo === 'mes'
      ? 'Últimos 30 días'
      : 'Último año';
  const showData = !loading && data !== null;
  return (
    <CampusScrollScreen
      source={SCREEN_BACKGROUNDS.login.source}
      campusRatio={0.32}
      campusHeight={136}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Estadísticas</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ir a mi perfil"
          style={styles.avatar}
          onPress={() =>
            navigation.navigate('StaffTabs', { screen: 'Profile' })
          }
        >
          <AppIcon name="UserRound" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.body}>
        Consulta el volumen y el estado de las incidencias del campus.
      </Text>
      <SegmentedControl
        testID="periodo"
        options={PERIODOS}
        value={periodo}
        onChange={v => setPeriodo(v as Periodo)}
        style={styles.periods}
      />
      <Text style={styles.body}>
        {interval} · Reportes según fecha de creación.
      </Text>
      <Text style={styles.body}>
        Los estados corresponden a la situación actual de esos reportes.
      </Text>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            accessibilityLabel="Cargando estadísticas"
            color={colors.primary}
          />
          <Text style={styles.body}>Cargando estadísticas…</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.error}>
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {error}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onRefresh}
            disabled={refreshing}
            style={styles.retry}
          >
            <Text style={styles.action}>
              {refreshing ? 'Actualizando…' : 'Reintentar'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {showData ? (
        <>
          <View style={styles.tiles}>
            {[
              {
                value: 'total',
                label: 'Reportes totales',
                icon: 'FileText',
                color: colors.primary,
                soft: colors.primarySoft,
              },
              ...STATUSES,
            ].map(item => (
              <View
                key={item.value}
                style={[
                  styles.tile,
                  (width < 360 || fontScale > 1.3) && styles.fullTile,
                  { backgroundColor: item.soft },
                ]}
              >
                <AppIcon name={item.icon} size={22} color={item.color} />
                <Text style={styles.value}>
                  {item.value === 'total'
                    ? total
                    : conteo[item.value as ReportStatus]}
                </Text>
                <Text style={styles.body}>{item.label}</Text>
              </View>
            ))}
          </View>
          {total === 0 ? (
            <EmptyList
              icon="ChartColumn"
              title="Sin reportes en este periodo"
              subtitle="Selecciona otro periodo para consultar las incidencias registradas."
            />
          ) : (
            <>
              <View style={styles.section}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Reportes por categoría
                </Text>
                {porCategoria.map(item => (
                  <View key={item.categoria} style={styles.category}>
                    <View style={styles.row}>
                      <AppIcon
                        name={CATEGORY_ICONS[item.categoria]}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.rowText}>
                        {item.categoria}: {item.value} reportes
                      </Text>
                    </View>
                    <View style={styles.track} accessible={false}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${(item.value / maxCategoria) * 100}%`,
                            backgroundColor: CATEGORY_COLORS[item.categoria],
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.section}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Estado general
                </Text>
                <View
                  style={styles.donut}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <DonutChart
                    slices={slices}
                    centerValue={total}
                    centerLabel="reportes"
                  />
                </View>
                {slices.map(slice => (
                  <View key={slice.label} style={styles.row}>
                    <AppIcon
                      name={STATUSES.find(x => x.label === slice.label)!.icon}
                      size={20}
                      color={slice.color}
                    />
                    <Text style={styles.rowText}>
                      {slice.label}: {slice.value} ({slice.percent} %)
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Actividad diaria
            </Text>
            <Text style={styles.body}>
              Últimos 7 días · Independiente del periodo seleccionado.
            </Text>
            <View
              style={styles.chart}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <LineChart data={serie} height={140} gridLines={3} />
            </View>
            {serie.map(point => (
              <Text key={point.label} style={styles.body}>
                {point.label}: {point.value} reportes
              </Text>
            ))}
          </View>
          {areaTop ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abrir panel de reportes"
              style={styles.section}
              onPress={() =>
                navigation.navigate('StaffTabs', { screen: 'AllReports' })
              }
            >
              <Text style={styles.sectionTitle}>Área con más incidencias</Text>
              <Text style={styles.area}>{areaTop.area}</Text>
              <Text style={styles.body}>{areaTop.total} reportes</Text>
              <Text style={styles.body}>
                Categoría principal: {areaTop.categoria}
              </Text>
              <Text style={styles.action}>Ver panel de reportes</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}
    </CampusScrollScreen>
  );
}
const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  title: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.primary },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginTop: spacing.xs,
  },
  periods: { marginTop: spacing.lg, marginBottom: spacing.sm },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tile: {
    flexBasis: '45%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  fullTile: { flexBasis: '100%' },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  category: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.text },
  track: {
    height: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.sm },
  donut: { alignItems: 'center', marginBottom: spacing.md },
  chart: { marginVertical: spacing.lg },
  area: { fontSize: 19, fontWeight: '700', color: colors.primary },
  action: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  loading: { alignItems: 'center', padding: spacing.lg },
  error: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    marginTop: spacing.md,
  },
  retry: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
});
