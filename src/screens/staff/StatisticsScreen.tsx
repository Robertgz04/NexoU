import TouchableOpacity from '../../components/MotionTouchable';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import type { LinePoint } from '../../components/LineChart';
import CampusScrollScreen from '../../components/CampusScrollScreen';
import EmptyList from '../../components/EmptyList';
import SegmentedControl from '../../components/SegmentedControl';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { CATEGORIES, STATUSES } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import type { RootStackParamList } from '../../navigation/types';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  colors,
  radius,
  spacing,
} from '../../theme';
import type { Report, ReportStatus } from '../../types';
import { MESES_CORTOS } from '../../utils/dates';

type Periodo = 'semana' | 'mes' | 'anio';

const PERIODOS = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

/** Fecha límite inferior del periodo seleccionado. */
function desde(periodo: Periodo, now: Date): number {
  const d = new Date(now);
  if (periodo === 'semana') {
    d.setDate(d.getDate() - 6);
  } else if (periodo === 'mes') {
    d.setDate(d.getDate() - 29);
  } else {
    d.setFullYear(d.getFullYear() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Cuenta los reportes creados en cada uno de los últimos `dias` días. */
function serieDiaria(reports: Report[], dias: number, now: Date): LinePoint[] {
  return Array.from({ length: dias }, (_, index) => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (dias - 1 - index));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      label: start.getDate() + ' ' + MESES_CORTOS[start.getMonth()],
      value: reports.filter(r => {
        const t = new Date(r.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime() && t <= now.getTime();
      }).length,
    };
  });
}

/** F09 – Estadísticas e indicadores del panel de personal. */
export default function StatisticsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { width, fontScale } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [asOf, setAsOf] = useState(() => new Date());
  const pending = useRef(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      setReports(await getAllReports());
      setAsOf(new Date());
      setError(null);
    } catch {
      setError('No pudimos actualizar las estadísticas. Intenta de nuevo.');
    } finally {
      pending.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const diasSerie = 7;

  const enPeriodo = useMemo(() => {
    const min = desde(periodo, asOf);
    return reports.filter(r => {
      const t = new Date(r.createdAt).getTime();
      return t >= min && t <= asOf.getTime();
    });
  }, [reports, periodo, asOf]);

  const conteo = useMemo(() => {
    const map: Record<ReportStatus, number> = {
      pendiente: 0,
      revision: 0,
      solucionado: 0,
    };
    enPeriodo.forEach(r => {
      map[r.estado] += 1;
    });
    return map;
  }, [enPeriodo]);

  const total = enPeriodo.length;

  const porCategoria = useMemo(
    () =>
      CATEGORIES.map(categoria => ({
        categoria,
        value: enPeriodo.filter(r => r.categoria === categoria).length,
      })),
    [enPeriodo],
  );

  const maxCategoria = Math.max(...porCategoria.map(c => c.value), 1);

  const serie = useMemo(
    () => serieDiaria(reports, diasSerie, asOf),
    [reports, diasSerie, asOf],
  );

  const areaTop = useMemo(() => {
    const mapa = new Map<
      string,
      { area: string; total: number; cats: Map<string, number> }
    >();
    enPeriodo.forEach(r => {
      const item = mapa.get(r.area) ?? {
        area: r.area,
        total: 0,
        cats: new Map<string, number>(),
      };
      item.total += 1;
      item.cats.set(r.categoria, (item.cats.get(r.categoria) ?? 0) + 1);
      mapa.set(r.area, item);
    });
    const top = [...mapa.values()].sort((a, b) => b.total - a.total)[0];
    if (!top) {
      return null;
    }
    const catTop = [...top.cats.entries()].sort((a, b) => b[1] - a[1])[0];
    return { area: top.area, total: top.total, categoria: catTop?.[0] };
  }, [enPeriodo]);

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
  const showData = !loading && (!error || reports.length > 0);
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
