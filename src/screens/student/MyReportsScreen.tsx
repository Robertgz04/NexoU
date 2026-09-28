import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import ScreenHeader from '../../components/ScreenHeader';
import StatTiles from '../../components/StatTiles';
import type { StatItem } from '../../components/StatTiles';
import { STATUSES, statusMeta } from '../../constants/catalog';
import { getReportsByOwner } from '../../data/reportRepository';
import { colors, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Filter = ReportStatus | 'todas';

/**
 * F06 – Consulta de los reportes propios del estudiante con su estado,
 * incluye filtros por estado y actualización al enfocar la pantalla.
 */
export default function MyReportsScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<Filter>('todas');
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

  const filtered =
    filter === 'todas' ? reports : reports.filter(r => r.estado === filter);

  const count = (status: ReportStatus) =>
    reports.filter(r => r.estado === status).length;

  const tiles: StatItem[] = [
    { icon: '📋', label: 'Totales', value: reports.length },
    ...STATUSES.map(s => ({
      icon: s.icon,
      label: s.label,
      value: count(s.value),
      color: s.color,
      soft: s.soft,
    })),
  ];

  const header = (
    <View>
      <StatTiles items={tiles} style={styles.tiles} />
      <View style={styles.filters}>
        <Chip
          label="Todas"
          selected={filter === 'todas'}
          onPress={() => setFilter('todas')}
        />
        {STATUSES.map(s => (
          <Chip
            key={s.value}
            label={s.label}
            color={s.color}
            selected={filter === s.value}
            onPress={() => setFilter(s.value)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mis reportes" />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() =>
              navigation.navigate('ReportDetail', { reportId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyList
            icon="🗂"
            title={
              filter === 'todas'
                ? 'Aún no has creado reportes'
                : `No hay reportes ${statusMeta(
                    filter as ReportStatus,
                  ).label.toLowerCase()}`
            }
            subtitle={
              filter === 'todas'
                ? 'Reporta un problema del campus con foto y recibe seguimiento de su estado.'
                : 'Prueba con otro filtro o crea un reporte nuevo.'
            }
            actionLabel="➕ Crear reporte"
            onAction={() =>
              navigation.navigate('StudentTabs', { screen: 'NewReport' })
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tiles: {
    marginTop: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
