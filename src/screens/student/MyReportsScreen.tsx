import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../context/AuthContext';
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import {STATUSES, statusMeta} from '../../constants/catalog';
import {getReportsByOwner} from '../../data/reportRepository';
import {colors, radius, spacing} from '../../theme';
import type {Report, ReportStatus} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Filter = ReportStatus | 'todas';

/**
 * F06 – Consulta de los reportes propios del estudiante con su estado,
 * incluye filtros por estado y actualización al enfocar la pantalla.
 */
export default function MyReportsScreen() {
  const {user} = useAuth();
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

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>Totales</Text>
        </View>
        {STATUSES.map(s => (
          <View key={s.value} style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, {color: s.color}]}>
              {count(s.value)}
            </Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

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
            onPress={() =>
              navigation.navigate('ReportDetail', {reportId: item.id})
            }
          />
        )}
        ListEmptyComponent={
          <EmptyList
            icon="🗂"
            title={
              filter === 'todas'
                ? 'Aún no has creado reportes'
                : `No hay reportes ${statusMeta(filter as ReportStatus).label.toLowerCase()}`
            }
            subtitle={
              filter === 'todas'
                ? 'Reporta un problema del campus con foto y recibe seguimiento de su estado.'
                : 'Prueba con otro filtro o crea un reporte nuevo.'
            }
            actionLabel="➕ Crear reporte"
            onAction={() =>
              navigation.navigate('StudentTabs', {screen: 'NewReport'})
            }
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
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {fontSize: 11.5, color: colors.textMuted, marginTop: 2},
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
