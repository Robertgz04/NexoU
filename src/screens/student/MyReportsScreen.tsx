import TouchableOpacity from '../../components/MotionTouchable';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyList from '../../components/EmptyList';
import ReportHistoryCard from '../../components/ReportHistoryCard';
import CampusListHeader from '../../components/CampusListHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STATUSES } from '../../constants/catalog';
import useReportList from '../../hooks/useReportList';
import { colors, radius, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Filter = ReportStatus | 'todas';

/** Nota de estado que se muestra al expandir una tarjeta. */
function notaDe(reporte: Report): {
  icon: string;
  title: string;
  text: string;
} {
  switch (reporte.estado) {
    case 'revision':
      return {
        icon: 'Wrench',
        title: 'Atendido por mantenimiento',
        text: 'Se ha asignado al equipo de mantenimiento para su revisión.',
      };
    case 'solucionado':
      return {
        icon: 'CircleCheck',
        title: 'Problema solucionado',
        text: 'Mantenimiento terminó el trabajo. ¡Gracias por reportar!',
      };
    default:
      return {
        icon: 'Clock',
        title: 'En espera de atención',
        text: 'Tu reporte fue recibido y pronto será revisado por mantenimiento.',
      };
  }
}

/** F06 – Consulta de los reportes propios del estudiante con filtros por estado. */
export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [filter, setFilter] = useState<Filter>('todas');
  const {
    reports,
    summary,
    loading,
    error: loadError,
    refreshing,
    load,
    refresh: onRefresh,
    loadMore,
    loadingMore,
    hasMore,
  } = useReportList({
    own: true,
    estado: filter === 'todas' ? undefined : filter,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = reports;

  const goProfile = () =>
    navigation.navigate('StudentTabs', { screen: 'Profile' });

  const goDetail = (reportId: string) =>
    navigation.navigate('ReportDetail', { reportId });

  const toggleNote = (reportId: string) =>
    setExpandedId(prev => (prev === reportId ? null : reportId));

  const avatar = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ir a mi perfil"
      activeOpacity={0.85}
      onPress={goProfile}
      style={styles.avatarButton}
    >
      <AppIcon name="UserRound" size={26} color={colors.primary} />
    </TouchableOpacity>
  );

  const header = (
    <CampusListHeader>
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Mis reportes</Text>
          {avatar}
        </View>
        <Text style={styles.subtitle}>
          Consulta tus incidencias y su seguimiento.
        </Text>
        <View style={styles.filters}>
          {[
            { value: 'todas' as Filter, label: 'Todos', icon: 'FolderOpen' },
            ...STATUSES,
          ].map(s => {
            const selected = filter === s.value;
            const count =
              s.value === 'todas' ? summary.total : summary[s.value];
            return (
              <TouchableOpacity
                key={s.value}
                accessibilityRole="button"
                accessibilityLabel={s.label + ', ' + count + ' reportes'}
                accessibilityState={{ selected }}
                onPress={() => setFilter(s.value)}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <AppIcon
                  name={s.icon}
                  size={20}
                  color={selected ? colors.surface : colors.primary}
                />
                <Text
                  style={[
                    styles.filterLabel,
                    selected && styles.filterLabelSelected,
                  ]}
                >
                  {s.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {loadError ? (
          <View style={styles.error}>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              {loadError}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.retry}
            >
              <Text style={styles.retryText}>
                {refreshing ? 'Actualizando…' : 'Reintentar'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </CampusListHeader>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity onPress={loadMore} accessibilityRole="button">
              <Text>{loadingMore ? 'Cargando…' : 'Cargar más'}</Text>
            </TouchableOpacity>
          ) : undefined
        }
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.xl + 20 + insets.bottom },
        ]}
        extraData={expandedId}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <ReportHistoryCard
            report={item}
            note={notaDe(item)}
            expanded={expandedId === item.id}
            onToggleNote={() => toggleNote(item.id)}
            onPress={() => goDetail(item.id)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={colors.primary}
                accessibilityLabel="Cargando reportes"
              />
              <Text style={styles.subtitle}>Cargando tus reportes…</Text>
            </View>
          ) : loadError ? undefined : (
            <EmptyList
              icon="FolderOpen"
              title={
                summary.total === 0
                  ? 'Aún no has creado reportes'
                  : 'No hay reportes con este estado'
              }
              subtitle={
                summary.total === 0
                  ? 'Crea tu primera incidencia y consulta aquí su seguimiento. La foto es opcional.'
                  : 'Selecciona Todos para volver a ver tu historial.'
              }
              actionLabel={
                summary.total === 0 ? 'Crear reporte' : 'Ver todos los reportes'
              }
              onAction={() =>
                summary.total === 0
                  ? navigation.navigate('StudentTabs', { screen: 'NewReport' })
                  : setFilter('todas')
              }
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.primary },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginTop: spacing.xs,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  filter: {
    flexDirection: 'row',
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 48,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  filterSelected: { backgroundColor: colors.primary },
  filterLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  filterLabelSelected: { color: colors.surface, fontWeight: '800' },
  list: { flexGrow: 1, backgroundColor: colors.surface },
  loading: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  error: {
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 15, lineHeight: 22, color: colors.text },
  retry: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  retryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
