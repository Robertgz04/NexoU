import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import type { LinePoint } from '../../components/LineChart';
import BrandRow from '../../components/BrandRow';
import ScreenBackground from '../../components/ScreenBackground';
import SegmentedControl from '../../components/SegmentedControl';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { CATEGORIES, STATUSES } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  colors,
  radius,
  shadow,
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

/** Alto del área de las barras por categoría. */
const CHART_H = 120;

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
  const counts: number[] = new Array(dias).fill(0);
  const inicioHoy = new Date(now);
  inicioHoy.setHours(0, 0, 0, 0);

  reports.forEach(report => {
    const t = new Date(report.createdAt).getTime();
    const diff = Math.floor((inicioHoy.getTime() - t) / 86400000);
    // diff = 0 es hoy; diff = dias-1 es el día más antiguo de la serie.
    if (diff >= 0 && diff < dias) {
      counts[dias - 1 - diff] += 1;
    }
  });

  return counts.map((value, index) => {
    const dia = new Date(inicioHoy);
    dia.setDate(dia.getDate() - (dias - 1 - index));
    return { label: `${dia.getDate()} ${MESES_CORTOS[dia.getMonth()]}`, value };
  });
}

/**
 * F09 – Estadísticas del panel de personal (mockup "Estadísticas"):
 * selector de periodo, tarjetas de totales, barras por categoría,
 * anillo de estados, actividad reciente y área con más incidencias.
 */
export default function StatisticsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const load = useCallback(async () => {
    setReports(await getAllReports());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const diasSerie = 7; // el mockup siempre muestra "Últimos 7 días"

  const enPeriodo = useMemo(() => {
    const min = desde(periodo, new Date());
    return reports.filter(r => new Date(r.createdAt).getTime() >= min);
  }, [reports, periodo]);

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
  const maxEscala = Math.max(Math.ceil(maxCategoria / 5) * 5, 5);

  const serie = useMemo(
    () => serieDiaria(enPeriodo, diasSerie, new Date()),
    [enPeriodo, diasSerie],
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

  const avatar = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ir a mi perfil"
      activeOpacity={0.85}
      onPress={() => navigation.navigate('StaffTabs', { screen: 'Profile' })}
      style={styles.avatarButton}
    >
      <Text style={styles.avatarIcon}>👤</Text>
    </TouchableOpacity>
  );

  const fondo = SCREEN_BACKGROUNDS.statistics;

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={<BrandRow right={avatar} />}
    >
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Estadísticas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl
          testID="periodo"
          options={PERIODOS}
          value={periodo}
          onChange={v => setPeriodo(v as Periodo)}
          style={styles.periods}
        />

        <View style={styles.tilesRow}>
          <StatCard
            icon="📄"
            value={total}
            label="Reportes totales"
            color={colors.info}
            soft={colors.revisionSoft}
          />
          <StatCard
            icon="📄"
            value={conteo.pendiente}
            label="Pendientes"
            color={colors.danger}
            soft={colors.dangerSoft}
          />
          <StatCard
            icon="◷"
            value={conteo.revision}
            label="En revisión"
            color={colors.revision}
            soft={colors.revisionSoft}
          />
          <StatCard
            icon="✓"
            value={conteo.solucionado}
            label="Solucionados"
            color={colors.solucionado}
            soft={colors.solucionadoSoft}
          />
        </View>

        {/* Barras por categoría */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reportes por categoría</Text>
          <View style={styles.chartRow}>
            <View style={styles.barAxis}>
              {[1, 0.66, 0.33, 0].map(f => (
                <Text key={f} style={styles.barAxisLabel}>
                  {Math.round(maxEscala * f)}
                </Text>
              ))}
            </View>

            <View style={styles.barsArea}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={`bg-${index}`}
                  style={[
                    styles.barGrid,
                    { bottom: (index / 3) * (CHART_H - 4) },
                  ]}
                />
              ))}

              <View style={styles.bars}>
                {porCategoria.map(item => (
                  <View key={item.categoria} style={styles.barSlot}>
                    <Text style={styles.barValue}>{item.value}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(
                            (item.value / maxEscala) * (CHART_H - 4),
                            item.value > 0 ? 6 : 0,
                          ),
                          backgroundColor: CATEGORY_COLORS[item.categoria],
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.barLabels}>
            {porCategoria.map(item => (
              <View key={item.categoria} style={styles.barLabelSlot}>
                <Text style={styles.barIcon}>
                  {CATEGORY_ICONS[item.categoria]}
                </Text>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.categoria}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Estado general + actividad reciente */}
        <View style={styles.splitRow}>
          <View style={[styles.card, styles.splitCard]}>
            <Text style={styles.cardTitle}>Estado general</Text>
            <View style={styles.donutBox}>
              <DonutChart
                slices={slices}
                centerValue={total}
                centerLabel="reportes"
                size={104}
                thickness={17}
              />
            </View>
            <View style={styles.legend}>
              {slices.map(slice => (
                <View key={slice.label} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: slice.color }]}
                  />
                  <Text style={styles.legendValue}>{slice.value}</Text>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {slice.label}
                  </Text>
                  <Text style={styles.legendPercent}>{slice.percent}%</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.splitCard]}>
            <Text style={styles.cardTitle}>Actividad reciente</Text>
            <Text style={styles.cardSubtitle}>Últimos {diasSerie} días</Text>
            <LineChart data={serie} height={108} gridLines={3} />
          </View>
        </View>

        {/* Área con más incidencias */}
        {areaTop ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={styles.areaCard}
            onPress={() =>
              navigation.navigate('StaffTabs', { screen: 'AllReports' })
            }
          >
            <View style={styles.areaIconBox}>
              <Text style={styles.areaIcon}>🏛</Text>
            </View>
            <View style={styles.areaTexts}>
              <Text style={styles.areaLabel}>Área con más incidencias:</Text>
              <Text style={styles.areaName} numberOfLines={1}>
                {areaTop.area}
              </Text>
              <Text style={styles.areaMeta} numberOfLines={1}>
                Categoría principal: {areaTop.categoria}
              </Text>
            </View>
            <Text style={styles.areaChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.footer}>
          {user?.nombre?.split(' ')[0] ?? 'Personal'}, los datos se actualizan
          al abrir la pantalla.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

/** Tarjeta compacta de total (mockup de Estadísticas). */
function StatCard({
  icon,
  value,
  label,
  color,
  soft,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  soft: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: soft }]}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 19 },
  periods: {
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIcon: { fontSize: 15 },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.primary,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
    marginBottom: spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  barAxis: {
    width: 20,
    height: CHART_H,
    justifyContent: 'space-between',
  },
  barAxisLabel: {
    fontSize: 9,
    color: colors.chartAxis,
    marginTop: -6,
  },
  barsArea: {
    flex: 1,
    height: CHART_H,
  },
  barGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.chartGrid,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabels: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  barLabelSlot: {
    flex: 1,
    alignItems: 'center',
  },
  barIcon: {
    fontSize: 15,
    color: colors.primary,
  },
  barLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  splitCard: {
    flex: 1,
    padding: spacing.sm + 4,
  },
  donutBox: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  legend: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  legendLabel: {
    flex: 1,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  legendPercent: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  areaIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaIcon: { fontSize: 24 },
  areaTexts: { flex: 1 },
  areaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  areaName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  areaMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  areaChevron: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textMuted,
  },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
