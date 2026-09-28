import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import {AREAS, STATUSES} from '../../constants/catalog';
import {getAllReports} from '../../data/reportRepository';
import {colors, radius, spacing} from '../../theme';
import type {Report, ReportStatus} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type EstadoFilter = ReportStatus | 'todas';

/**
 * F07 – Panel con todos los reportes recibidos, con filtros básicos
 * por estado y por área (Sprint 6 del plan de trabajo).
 */
export default function AllReportsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>Recibidos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, {color: colors.pendiente}]}>
            {pendientes}
          </Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, {color: colors.solucionado}]}>
            {reports.filter(r => r.estado === 'solucionado').length}
          </Text>
          <Text style={styles.summaryLabel}>Solucionados</Text>
        </View>
      </View>

      <Text style={styles.filterLabel}>Estado</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
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
        contentContainerStyle={styles.filterRow}>
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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({item}) => (
          <ReportCard
            report={item}
            showOwner
            onPress={() =>
              navigation.navigate('ReportDetail', {reportId: item.id})
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
  container: {flex: 1, backgroundColor: colors.background},
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
  },
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryNumber: {fontSize: 20, fontWeight: '800', color: colors.text},
  summaryLabel: {fontSize: 11.5, color: colors.textMuted, marginTop: 2},
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  filterRow: {paddingHorizontal: spacing.md},
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
