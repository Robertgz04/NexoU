import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import BrandRow from '../../components/BrandRow';
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import ScreenBackground from '../../components/ScreenBackground';
import StatTiles from '../../components/StatTiles';
import type { StatItem } from '../../components/StatTiles';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { AREAS, STATUSES } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import { colors, radius, shadow, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type EstadoFilter = ReportStatus | 'todas';

/** F07 – Panel con todos los reportes recibidos del personal universitario. */
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

  const goProfile = () =>
    navigation.navigate('StaffTabs', { screen: 'Profile' });

  const avatar = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ir a mi perfil"
      activeOpacity={0.85}
      onPress={goProfile}
      style={styles.avatarButton}
    >
      <Text style={styles.avatarIcon}>👤</Text>
    </TouchableOpacity>
  );

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>
        Hola, {user?.nombre?.split(' ')[0] ?? 'personal'}
      </Text>
      <Text style={styles.subtitle}>Panel de atención de incidencias</Text>

      <StatTiles items={tiles} style={styles.tiles} />

      <Text style={styles.filterLabel}>Filtrar por estado</Text>
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

      <Text style={styles.filterLabel}>Filtrar por ubicación o área</Text>
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

  const fondo = SCREEN_BACKGROUNDS.allReports;

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={<BrandRow right={avatar} />}
    >
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
            title="Sin reportes registrados"
            subtitle="No se encontraron reportes con la combinación de filtros seleccionada."
          />
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarIcon: { fontSize: 19 },
  tiles: {
    marginTop: spacing.md,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    gap: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl + 20,
    flexGrow: 1,
  },
});
