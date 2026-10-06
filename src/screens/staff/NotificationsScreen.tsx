import TouchableOpacity from '../../components/MotionTouchable';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyList from '../../components/EmptyList';
import CampusListHeader from '../../components/CampusListHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SegmentedControl from '../../components/SegmentedControl';
import { statusMeta } from '../../constants/catalog';
import { getNotices } from '../../data/reportRepository';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import type { Notice, ReportStatus } from '../../types';
import { formatFechaRelativa } from '../../utils/dates';

type Filtro = 'todas' | 'estado' | 'avisos';

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'estado', label: 'Estado' },
  { value: 'avisos', label: 'Avisos' },
];

interface Notificacion {
  id: string;
  reportId: string;
  icon: string;
  color: string;
  soft: string;
  titulo: string;
  texto: string;
  hora: string;
  updatedAt: string;
  estado: ReportStatus;
}

/** Mensaje asociado a cada estado del reporte. */
function mensajeDe(report: Notice): { titulo: string; texto: string } {
  switch (report.estado) {
    case 'revision':
      return {
        titulo: 'Reporte en revisión',
        texto:
          `El reporte "${report.titulo}" de ${report.ownerNombre} ` +
          'ha sido marcado como en revisión por el personal universitario.',
      };
    case 'solucionado':
      return {
        titulo: 'Reporte solucionado',
        texto: `Se concluyó la atención de "${report.titulo}".`,
      };
    default:
      return {
        titulo: 'Nuevo reporte recibido',
        texto: `${report.ownerNombre} reportó "${report.titulo}" en ${report.area}.`,
      };
  }
}

/** Construye la lista de avisos a partir de los reportes existentes. */
function notificacionesDe(reports: Notice[]): Notificacion[] {
  return [...reports]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map(report => {
      const meta = statusMeta(report.estado);
      const { titulo, texto } = mensajeDe(report);
      return {
        id: `n_${report.id}`,
        reportId: report.id,
        icon: meta.icon,
        color: meta.color,
        soft: meta.soft,
        titulo,
        texto,
        hora: formatFechaRelativa(report.occurredAt),
        updatedAt: report.occurredAt,
        estado: report.estado,
      };
    });
}

/** F10 – Notificaciones y avisos del panel del personal. */
export default function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [asOf, setAsOf] = useState(() => new Date());
  const pending = useRef(false);
  const [reports, setReports] = useState<Notice[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const version = useRef(0);

  const load = useCallback(async () => {
    const current = ++version.current;
    pending.current = true;
    try {
      const page = await getNotices({
        tipo: filtro === 'avisos' ? 'aviso' : filtro,
      });
      if (current !== version.current) return;
      setReports(page.items);
      setCursor(page.nextCursor);
      setTotal(page.total);
      setAsOf(new Date());
      setError(null);
    } catch {
      setError('No pudimos actualizar las notificaciones. Intenta de nuevo.');
    } finally {
      pending.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const todas = useMemo(() => notificacionesDe(reports), [reports]);

  const lista = useMemo(() => {
    if (filtro === 'estado') {
      return todas.filter(n => n.estado !== 'pendiente');
    }
    if (filtro === 'avisos') {
      return todas.filter(n => n.estado === 'pendiente');
    }
    return todas;
  }, [todas, filtro]);

  /** Agrupa por "Hoy" / "Ayer" / "Anteriores". */
  const secciones = useMemo(() => {
    const hoy = new Date(asOf);
    const ayer = new Date(asOf);
    ayer.setDate(ayer.getDate() - 1);

    const diaDe = (iso: string) => new Date(iso).toDateString();

    const grupos: { title: string; data: Notificacion[] }[] = [
      { title: 'Hoy', data: [] },
      { title: 'Ayer', data: [] },
      { title: 'Anteriores', data: [] },
    ];

    lista.forEach(item => {
      const dia = diaDe(item.updatedAt);
      if (dia === hoy.toDateString()) {
        grupos[0].data.push(item);
      } else if (dia === ayer.toDateString()) {
        grupos[1].data.push(item);
      } else {
        grupos[2].data.push(item);
      }
    });

    return grupos.filter(g => g.data.length > 0);
  }, [lista, asOf]);

  const onRefresh = async () => {
    if (pending.current) return;
    setRefreshing(true);
    await load();
  };
  const loadMore = async () => {
    if (!cursor || pending.current) return;
    pending.current = true;
    const current = version.current;
    try {
      const page = await getNotices({
        tipo: filtro === 'avisos' ? 'aviso' : filtro,
        cursor,
      });
      if (current !== version.current) return;
      setReports(previous => [
        ...previous,
        ...page.items.filter(n => !previous.some(p => p.id === n.id)),
      ]);
      setCursor(page.nextCursor);
      setError(null);
    } catch {
      setError('No pudimos cargar más avisos. Intenta de nuevo.');
    } finally {
      pending.current = false;
    }
  };
  const encabezado = (
    <CampusListHeader>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notificaciones</Text>
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
          Avisos según el estado actual de los reportes.
        </Text>
        <SegmentedControl
          testID="filtro-notificaciones"
          options={FILTROS}
          value={filtro}
          onChange={v => setFiltro(v as Filtro)}
          style={styles.filters}
        />
        <Text style={styles.body}>
          {filtro === 'estado'
            ? 'Reportes en revisión o solucionados.'
            : filtro === 'avisos'
            ? 'Reportes pendientes de atención.'
            : 'Estado incluye reportes en revisión o solucionados; Avisos incluye pendientes.'}
        </Text>
        {!loading && (!error || reports.length > 0) ? (
          <Text style={styles.body} accessibilityLiveRegion="polite">
            {total} avisos
          </Text>
        ) : null}
        {error ? (
          <View style={styles.error}>
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              {error}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={refreshing}
              onPress={onRefresh}
              style={styles.retry}
            >
              <Text style={styles.action}>
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
      <SectionList
        onEndReached={loadMore}
        ListFooterComponent={
          cursor ? (
            <TouchableOpacity onPress={loadMore}>
              <Text>Cargar más</Text>
            </TouchableOpacity>
          ) : undefined
        }
        sections={secciones}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + 20 + insets.bottom },
        ]}
        ListHeaderComponent={encabezado}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Abrir reporte: ${item.titulo}. ${item.texto}. ${item.hora}`}
            style={styles.row}
            onPress={() =>
              navigation.navigate('ReportDetail', { reportId: item.reportId })
            }
          >
            <View style={[styles.iconBox, { backgroundColor: item.soft }]}>
              <AppIcon name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.texts}>
              <Text style={styles.rowTitle}>{item.titulo}</Text>
              <Text style={styles.body}>{item.texto}</Text>
              <Text style={styles.date}>Última actualización: {item.hora}</Text>
            </View>
            <AppIcon name="ChevronRight" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={colors.primary}
                accessibilityLabel="Cargando notificaciones"
              />
              <Text style={styles.body}>Cargando notificaciones…</Text>
            </View>
          ) : error ? undefined : (
            <EmptyList
              icon="Bell"
              title={
                reports.length === 0
                  ? 'Sin notificaciones'
                  : 'No hay avisos con este filtro'
              }
              subtitle={
                reports.length === 0
                  ? 'Los avisos de los reportes registrados aparecerán aquí.'
                  : 'Selecciona Todas para consultar los avisos disponibles.'
              }
              actionLabel={filtro !== 'todas' ? 'Ver todas' : undefined}
              onAction={
                filtro !== 'todas' ? () => setFiltro('todas') : undefined
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
  content: { flexGrow: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
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
  filters: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  date: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  retry: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  action: { fontSize: 15, fontWeight: '700', color: colors.primary },
  loading: { alignItems: 'center', padding: spacing.lg },
});
