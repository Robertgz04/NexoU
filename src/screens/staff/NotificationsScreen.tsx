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
import BrandRow from '../../components/BrandRow';
import ScreenBackground from '../../components/ScreenBackground';
import SegmentedControl from '../../components/SegmentedControl';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
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
          'está siendo atendido por el equipo de mantenimiento.',
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

/** F10 – Notificaciones y avisos del panel del personal. */
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
    <View style={styles.headerBlock}>
      <Text style={styles.screenTitle}>Notificaciones</Text>
      <Text style={styles.screenSubtitle}>
        Avisos en tiempo real sobre incidencias de los estudiantes.
      </Text>

      <SegmentedControl
        testID="filtro-notificaciones"
        options={FILTROS}
        value={filtro}
        onChange={v => setFiltro(v as Filtro)}
        style={styles.filtros}
      />
    </View>
  );

  const fondo = SCREEN_BACKGROUNDS.notifications;

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={<BrandRow right={avatar} />}
    >
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
            activeOpacity={0.88}
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
            title="Sin notificaciones pendientes"
            subtitle="Aquí verás las alertas cuando los estudiantes registren nuevos reportes."
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
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
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
  filtros: {
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '800',
  },
  texts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  rowText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 17,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
