import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import BrandRow from '../components/BrandRow';
import EmptyList from '../components/EmptyList';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import StatusBadge from '../components/StatusBadge';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { STATUSES, statusMeta } from '../constants/catalog';
import { getReportById, updateReportStatus } from '../data/reportRepository';
import { colors, radius, shadow, spacing } from '../theme';
import type { Report, ReportStatus } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatFechaCorta, formatFechaHora } from '../utils/dates';
import { folioDe } from '../utils/validators';
import { photoUri } from '../utils/photo';

type DetailRoute = RouteProp<RootStackParamList, 'ReportDetail'>;

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Paso de la línea de tiempo de "Seguimiento" (mockup). */
interface TimelineStep {
  icon: string;
  title: string;
  date: string;
  detail: string;
  tone: 'success' | 'info';
}

/** Construye la línea de tiempo a partir del estado actual del reporte. */
function timelineDe(report: Report): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      icon: '✓',
      title: 'Reporte enviado',
      date: formatFechaHora(report.createdAt),
      detail: 'Tu reporte ha sido recibido correctamente.',
      tone: 'success',
    },
  ];

  if (report.estado === 'pendiente') {
    steps.push({
      icon: '🕐',
      title: 'En espera de asignación',
      date: formatFechaHora(report.createdAt),
      detail: 'El personal universitario revisará tu reporte pronto.',
      tone: 'info',
    });
    return steps;
  }

  steps.push({
    icon: '🔧',
    title: 'Asignado a mantenimiento',
    date: formatFechaHora(report.updatedAt),
    detail: 'Se ha asignado al equipo de mantenimiento para su revisión.',
    tone: 'info',
  });

  if (report.estado === 'revision') {
    steps.push({
      icon: '◷',
      title: 'Actualmente en revisión',
      date: formatFechaHora(report.updatedAt),
      detail: 'El equipo de mantenimiento está revisando el problema.',
      tone: 'info',
    });
  } else {
    steps.push({
      icon: '✓',
      title: 'Problema solucionado',
      date: formatFechaHora(report.updatedAt),
      detail: 'Mantenimiento terminó el trabajo. ¡Gracias por reportar!',
      tone: 'success',
    });
  }

  return steps;
}

/**
 * Detalle del reporte (F06 vista estudiante / F07 vista personal).
 * Si la sesión es de personal aparece el gestor de estado (F08).
 */
export default function ReportDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await getReportById(route.params.reportId);
    if (data) {
      setReport(data);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }, [route.params.reportId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeStatus = async (estado: ReportStatus) => {
    if (!report || report.estado === estado) {
      return;
    }
    setSaving(true);
    try {
      const updated = await updateReportStatus(report.id, estado);
      setReport(updated);
      Alert.alert(
        'Estado actualizado',
        `El reporte ahora está: ${statusMeta(estado).label}.`,
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo actualizar el estado.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyList
          icon="😕"
          title="Reporte no encontrado"
          subtitle="Puede que haya sido eliminado."
        />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyList icon="⏳" title="Cargando reporte…" />
      </View>
    );
  }

  const uri = photoUri(report.photoBase64);
  const isStaff = user?.rol === 'personal';
  const fondo = SCREEN_BACKGROUNDS.reportDetail;

  const backButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver"
      activeOpacity={0.85}
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>←</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      overArt={
        <View>
          {backButton}
          <View style={styles.brandBlock}>
            <BrandRow />
            <Text style={styles.screenTitle}>Detalle del reporte</Text>
          </View>
        </View>
      }
    >
    <ScrollView contentContainerStyle={styles.content}>
      {uri ? (
        <Image source={{ uri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoEmoji}>🖼</Text>
          <Text style={styles.photoText}>Sin evidencia fotográfica</Text>
        </View>
      )}

      <View style={styles.titleRow}>
        <Text style={styles.title}>{report.titulo}</Text>
        <StatusBadge status={report.estado} />
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="📍" label="Área" value={report.area} />
        <InfoRow icon="🔌" label="Categoría" value={report.categoria} />
        <InfoRow
          icon="📅"
          label="Fecha de reporte"
          value={formatFechaCorta(report.createdAt)}
        />
        <InfoRow icon="🧾" label="Folio" value={folioDe(report.id)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descripción</Text>
        <Text style={styles.description}>{report.descripcion}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seguimiento</Text>
        {timelineDe(report).map((step, index, all) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepRail}>
              <View
                style={[
                  styles.stepIcon,
                  step.tone === 'success'
                    ? styles.stepIconSuccess
                    : styles.stepIconInfo,
                ]}
              >
                <Text style={styles.stepIconText}>{step.icon}</Text>
              </View>
              {index < all.length - 1 ? (
                <View
                  style={[
                    styles.stepLine,
                    step.tone === 'success'
                      ? styles.stepLineSuccess
                      : styles.stepLineInfo,
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDate}>{step.date}</Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      {isStaff ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actualizar estado</Text>
          <Text style={styles.helper}>
            El estudiante verá este cambio de inmediato en su lista de reportes.
          </Text>
          {STATUSES.map(s => {
            const isCurrent = report.estado === s.value;
            return (
              <PrimaryButton
                key={s.value}
                title={isCurrent ? `✓ ${s.label}` : `Cambiar a ${s.label}`}
                variant={isCurrent ? 'primary' : 'outline'}
                disabled={saving || isCurrent}
                onPress={() => changeStatus(s.value)}
                style={styles.statusButton}
              />
            );
          })}
        </View>
      ) : null}

      <PrimaryButton
        title="Ver evidencia completa"
        variant="outline"
        onPress={() =>
          Alert.alert(
            'Evidencia fotográfica',
            uri
              ? 'La imagen adjunta se muestra ampliada en esta pantalla.'
              : 'Este reporte no tiene evidencia fotográfica adjunta.',
          )
        }
        style={styles.evidenceButton}
      />
      <Text style={styles.version}>Reportado por: {report.ownerNombre}</Text>
    </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  emptyRoot: { flex: 1, backgroundColor: colors.background },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  brandBlock: {
    marginTop: spacing.md,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  photo: {
    width: '100%',
    height: 230,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  photoEmoji: { fontSize: 44 },
  photoText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  helper: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.sm + 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoIcon: {
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  infoLabel: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: '55%',
    textAlign: 'right',
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepRail: {
    alignItems: 'center',
    width: 40,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconSuccess: {
    backgroundColor: colors.solucionadoSoft,
  },
  stepIconInfo: {
    backgroundColor: colors.revisionSoft,
  },
  stepIconText: {
    fontSize: 16,
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    width: 2.5,
    marginVertical: 2,
  },
  stepLineSuccess: {
    backgroundColor: colors.solucionado,
  },
  stepLineInfo: {
    backgroundColor: colors.revision,
  },
  stepBody: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  stepDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepDetail: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 2,
  },
  evidenceButton: {
    marginTop: spacing.lg,
  },
  version: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  statusButton: { marginTop: spacing.sm },
});
