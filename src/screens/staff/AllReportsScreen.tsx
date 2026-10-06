import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import MotionTouchable from '../../components/MotionTouchable';
import CampusListHeader from '../../components/CampusListHeader';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import SelectField from '../../components/SelectField';
import { AREAS, STATUSES } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import { colors, radius, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Filter = ReportStatus | 'todas';

export default function AllReportsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<Filter>('todas');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  const load = useCallback(async () => {
    if (pending.current) {
      return;
    }
    pending.current = true;
    try {
      setReports(await getAllReports());
      setError(null);
    } catch {
      setError('No pudimos actualizar los reportes. Intenta de nuevo.');
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
  const onRefresh = useCallback(async () => {
    if (pending.current) {
      return;
    }
    setRefreshing(true);
    await load();
  }, [load]);
  const clearFilters = () => {
    setEstadoFilter('todas');
    setAreaFilter('Todas');
  };
  const filtered = reports.filter(
    r =>
      (estadoFilter === 'todas' || r.estado === estadoFilter) &&
      (areaFilter === 'Todas' || r.area === areaFilter),
  );
  const hasFilters = estadoFilter !== 'todas' || areaFilter !== 'Todas';
  const count = (status: Filter) =>
    status === 'todas'
      ? reports.length
      : reports.filter(r => r.estado === status).length;

  const header = (
    <CampusListHeader>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Panel de incidencias</Text>
          <MotionTouchable
            accessibilityRole="button"
            accessibilityLabel="Ir a mi perfil"
            onPress={() =>
              navigation.navigate('StaffTabs', { screen: 'Profile' })
            }
            style={styles.avatar}
          >
            <AppIcon name="UserRound" size={26} color={colors.primary} />
          </MotionTouchable>
        </View>
        <Text style={styles.body}>
          Hola, {user?.nombre?.split(' ')[0] ?? 'personal'}. Consulta y atiende
          los reportes del campus.
        </Text>
        {(!loading && !error) || reports.length > 0 ? (
          <View style={styles.summary}>
            {STATUSES.map(s => (
              <View
                key={s.value}
                style={[styles.tile, { backgroundColor: s.soft }]}
              >
                <AppIcon name={s.icon} size={22} color={s.color} />
                <Text style={styles.value}>{count(s.value)}</Text>
                <Text style={styles.tileLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.section}>Filtrar por estado</Text>
        <View style={styles.filters}>
          {[
            { value: 'todas' as Filter, label: 'Todos', icon: 'FolderOpen' },
            ...STATUSES,
          ].map(s => {
            const selected = estadoFilter === s.value;
            return (
              <MotionTouchable
                key={s.value}
                accessibilityRole="button"
                accessibilityLabel={
                  s.label + ', ' + count(s.value) + ' reportes'
                }
                accessibilityState={{ selected }}
                onPress={() => setEstadoFilter(s.value)}
                style={[styles.filter, selected && styles.selected]}
              >
                <AppIcon
                  name={s.icon}
                  size={20}
                  color={selected ? colors.surface : colors.primary}
                />
                <Text
                  style={[styles.filterLabel, selected && styles.selectedLabel]}
                >
                  {s.label} ({loading ? '…' : count(s.value)})
                </Text>
              </MotionTouchable>
            );
          })}
        </View>
        <SelectField
          label="Ubicación o área"
          value={areaFilter}
          placeholder="Todas"
          options={['Todas', ...AREAS]}
          onSelect={setAreaFilter}
          icon="MapPin"
        />
        {hasFilters ? (
          <MotionTouchable
            accessibilityRole="button"
            onPress={clearFilters}
            style={styles.textButton}
          >
            <Text style={styles.action}>Limpiar filtros</Text>
          </MotionTouchable>
        ) : null}
        {!loading && (!error || reports.length > 0) ? (
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {filtered.length} de {reports.length} reportes
          </Text>
        ) : null}
        {error ? (
          <View style={styles.error}>
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              {error}
            </Text>
            <MotionTouchable
              accessibilityRole="button"
              accessibilityState={{ disabled: refreshing }}
              disabled={refreshing}
              onPress={onRefresh}
              style={styles.textButton}
            >
              <Text style={styles.action}>
                {refreshing ? 'Actualizando…' : 'Reintentar'}
              </Text>
            </MotionTouchable>
          </View>
        ) : null}
      </View>
    </CampusListHeader>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.xl + 20 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ReportCard
              report={item}
              showOwner
              onPress={() =>
                navigation.navigate('ReportDetail', { reportId: item.id })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={colors.primary}
                accessibilityLabel="Cargando reportes"
              />
              <Text style={styles.body}>Cargando reportes…</Text>
            </View>
          ) : error ? undefined : (
            <EmptyList
              icon="FolderOpen"
              title={
                reports.length === 0
                  ? 'Sin reportes registrados'
                  : 'Ningún reporte coincide con los filtros'
              }
              subtitle={
                reports.length === 0
                  ? 'Las incidencias registradas aparecerán aquí.'
                  : 'Prueba otro estado o ubicación para encontrar una incidencia.'
              }
              actionLabel={hasFilters ? 'Limpiar filtros' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  list: { flexGrow: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 100,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  value: { fontSize: 24, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 15, color: colors.text },
  section: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filter: {
    flexBasis: '45%',
    flexGrow: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  selected: { backgroundColor: colors.primary },
  filterLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedLabel: { color: colors.surface, fontWeight: '800' },
  textButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  action: { fontSize: 15, fontWeight: '700', color: colors.primary },
  error: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  item: { paddingHorizontal: spacing.md },
  loading: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
});
