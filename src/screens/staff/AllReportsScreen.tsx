import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import ScreenHeader from '../../components/ScreenHeader';
import StatTiles from '../../components/StatTiles';
import type { StatItem } from '../../components/StatTiles';
import { AREAS, STATUSES } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import { colors, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type EstadoFilter = ReportStatus | 'todas';

/**
 * F07 – Panel con todos los reportes recibidos, con filtros básicos
 * por estado y por área (Sprint 6 del plan de trabajo).
 */
export default function AllReportsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todas');
  const [areaFilter, setAreaFilter] = useState<string>('Todas');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllReports();
    setReports(data);
  }, []);

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

  const filtered = reports.filter(r => {
    const matchEstado = estadoFilter === 'todas' || r.estado === estadoFilter;
    const matchArea = areaFilter === 'Todas' || r.area === areaFilter;
    return matchEstado && matchArea;
  });

  const pendientes = reports.filter(r => r.estado === 'pendiente').length;
  const enRevision = reports.filter(r => r.estado === 'revision').length;
  const solucionados = reports.filter(r => r.estado === 'solucionado').length;

  const tiles: StatItem[] = [
    {
      icon: '📄',
      label: 'Pendientes',
      value: pendientes,
      color: colors.pendiente,
      soft: colors.pendienteSoft,
    },
    {
      icon: '↻',
      label: 'En revisión',
      value: enRevision,
      color: colors.revision,
      soft: colors.revisionSoft,
    },
    {
      icon: '✓',
      label: 'Solucionados',
      value: solucionados,
      color: colors.solucionado,
      soft: colors.solucionadoSoft,
    },
  ];

  const header = (
    <View>
      <StatTiles items={tiles} style={styles.tiles} />

      <Text style={styles.filterLabel}>Estado</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Chip
          label="Todos"
          selected={estadoFilter === 'todas'}
          onPress={() => setEstadoFilter('todas')}
        />
        {STATUSES.map(s => (
          <Chip
            key={s.value}
            label={s.label}
            color={s.color}
            selected={estadoFilter === s.value}
            onPress={() => setEstadoFilter(s.value)}
          />
        ))}
      </ScrollView>

      <Text style={styles.filterLabel}>Área</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Chip
          label="Todas"
          selected={areaFilter === 'Todas'}
          onPress={() => setAreaFilter('Todas')}
        />
        {AREAS.map(a => (
          <Chip
            key={a}
            label={a}
            selected={areaFilter === a}
            onPress={() => setAreaFilter(a)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        withImage
        title={`Hola, ${user?.nombre?.split(' ')[0] ?? 'personal'}`}
        subtitle="Revisa y administra los reportes de la comunidad universitaria."
      />

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
            showOwner
            onPress={() =>
              navigation.navigate('ReportDetail', { reportId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyList
            icon="🔍"
            title="No hay reportes con estos filtros"
            subtitle="Cambia el estado o el área para ver más reportes."
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
  filterLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterRow: {},
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
