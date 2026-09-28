import React, { useCallback, useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyList from '../../components/EmptyList';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedControl from '../../components/SegmentedControl';
import { statusMeta } from '../../constants/catalog';
import { getAllReports } from '../../data/reportRepository';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing } from '../../theme';
import type { Report, ReportStatus } from '../../types';
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
  /** Estado del reporte que originó el aviso (para el filtro "Estado"). */
  estado: ReportStatus;
}

/** Mensaje asociado a cada estado del reporte. */
function mensajeDe(report: Report): { titulo: string; texto: string } {
  switch (report.estado) {
    case 'revision':
      return {
        titulo: 'Reporte en revisión',
        texto:
          `El reporte "${report.titulo}" de ${report.ownerNombre} ` +
          'ya está siendo revisado por mantenimiento.',
      };
    case 'solucionado':
      return {
        titulo: 'Reporte solucionado',
        texto: `Mantenimiento terminó "${report.titulo}". ¡Gracias por reportar!`,
      };
    default:
      return {
        titulo: 'Nuevo reporte recibido',
        texto: `${report.ownerNombre} reportó "${report.titulo}" en ${report.area}.`,
      };
  }
}

/** Construye la lista de avisos a partir de los reportes existentes. */
function notificacionesDe(reports: Report[]): Notificacion[] {
  return reports.map(report => {
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
      hora: formatFechaRelativa(report.updatedAt),
      estado: report.estado,
    };
  });
}

/**
 * F10 – Notificaciones del panel de personal (mockup "Notificaciones"):
 * segmented control (Todas / Estado / Avisos) y lista agrupada por día
 * con los avisos derivados de los reportes registrados.
 */
export default function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reports, setReports] = useState<Report[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const load = useCallback(async () => {
    setReports(await getAllReports());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const todas = useMemo(() => notificacionesDe(reports), [reports]);

  /**
   * "Estado" muestra sólo los cambios de estado; "Avisos" destaca los
   * reportes aún pendientes de atender.
   */
  const lista = useMemo(() => {
    if (filtro === 'estado') {
      return todas.filter(n => n.estado !== 'pendiente');
    }
    if (filtro === 'avisos') {
      return todas.filter(n => n.estado === 'pendiente');
    }
    return todas;
  }, [todas, filtro]);

  /** Agrupa por "Hoy" / "Ayer" / "Anteriores", como en el mockup. */
  const secciones = useMemo(() => {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    const diaDe = (iso: string) => new Date(iso).toDateString();

    const grupos: { title: string; data: Notificacion[] }[] = [
      { title: 'Hoy', data: [] },
      { title: 'Ayer', data: [] },
      { title: 'Anteriores', data: [] },
    ];

    lista.forEach(item => {
      const report = reports.find(r => r.id === item.reportId);
      const dia = diaDe(report?.updatedAt ?? item.hora);
      if (dia === hoy.toDateString()) {
        grupos[0].data.push(item);
      } else if (dia === ayer.toDateString()) {
        grupos[1].data.push(item);
      } else {
        grupos[2].data.push(item);
      }
    });

    return grupos.filter(g => g.data.length > 0);
  }, [lista, reports]);

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

  const encabezado = (
    <View>
      <SegmentedControl
        testID="filtro-notificaciones"
        options={FILTROS}
        value={filtro}
        onChange={v => setFiltro(v as Filtro)}
        style={styles.filtros}
      />
      <View style={styles.resumen}>
        <Text style={styles.resumenText}>
          {lista.length} {lista.length === 1 ? 'aviso' : 'avisos'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        withImage
        title="Notificaciones"
        subtitle="Avisos de los reportes del campus"
        right={avatar}
      />

      <SectionList
        sections={secciones}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={encabezado}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={styles.row}
            onPress={() =>
              navigation.navigate('ReportDetail', { reportId: item.reportId })
            }
          >
            <View style={[styles.iconBox, { backgroundColor: item.soft }]}>
              <Text style={[styles.icon, { color: item.color }]}>
                {item.icon}
              </Text>
            </View>
            <View style={styles.texts}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.rowText} numberOfLines={2}>
                {item.texto}
              </Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.hora}>{item.hora}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyList
            icon="🔔"
            title="Sin notificaciones"
            subtitle="Aquí verás los avisos de los nuevos reportes y sus cambios de estado."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
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
  filtros: {
    marginTop: -spacing.lg,
    marginBottom: spacing.sm,
  },
  resumen: {
    marginBottom: spacing.xs,
  },
  resumenText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 17,
    fontWeight: '800',
  },
  texts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primary,
  },
  rowText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  metaBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  hora: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
