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
import Chip from '../../components/Chip';
import EmptyList from '../../components/EmptyList';
import ReportCard from '../../components/ReportCard';
import ScreenHeader from '../../components/ScreenHeader';
import { STATUSES, statusMeta } from '../../constants/catalog';
import { getReportsByOwner } from '../../data/reportRepository';
import { colors, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Filter = ReportStatus | 'todas';

/** Nota de estado que se muestra al expandir una tarjeta (mockup F06). */
function notaDe(reporte: Report): {
  icon: string;
  title: string;
  text: string;
} {
  switch (reporte.estado) {
    case 'revision':
      return {
        icon: '🔧',
        title: 'Atendido por mantenimiento',
        text: 'Se ha asignado al equipo de mantenimiento para su revisión.',
      };
    case 'solucionado':
      return {
        icon: '✅',
        title: 'Problema solucionado',
        text: 'Mantenimiento terminó el trabajo. ¡Gracias por reportar!',
      };
    default:
      return {
        icon: '🕐',
        title: 'En espera de atención',
        text: 'Tu reporte fue recibido y pronto será revisado por mantenimiento.',
      };
  }
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      <Text style={styles.avatarIcon}>👤</Text>
    </TouchableOpacity>
  );

  const header = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      <Chip
        label="Todos"
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
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mis reportes" right={avatar} />

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
            note={notaDe(item)}
            expanded={expandedId === item.id}
            onToggleNote={() => toggleNote(item.id)}
            onPress={() => goDetail(item.id)}
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
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 19 },
  filters: {
    paddingTop: spacing.md,
    paddingRight: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
