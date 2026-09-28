import React, {useCallback, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import EmptyList from '../components/EmptyList';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {STATUSES, statusMeta} from '../constants/catalog';
import {getReportById, updateReportStatus} from '../data/reportRepository';
import {colors, radius, spacing} from '../theme';
import type {Report, ReportStatus} from '../types';
import type {RootStackParamList} from '../navigation/types';
import {formatFecha} from '../utils/dates';
import {photoUri} from '../utils/photo';

type DetailRoute = RouteProp<RootStackParamList, 'ReportDetail'>;

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/**
 * Detalle del reporte (F06 vista estudiante / F07 vista personal).
 * Si la sesión es de personal aparece el gestor de estado (F08).
 */
export default function ReportDetailScreen() {
  const route = useRoute<DetailRoute>();
  const {user} = useAuth();

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
      <View style={styles.container}>
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
      <View style={styles.container}>
        <EmptyList icon="⏳" title="Cargando reporte…" />
      </View>
    );
  }

  const uri = photoUri(report.photoBase64);
  const isStaff = user?.rol === 'personal';
  const meta = statusMeta(report.estado);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      {uri ? (
        <Image source={{uri}} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoEmoji}>📋</Text>
          <Text style={styles.photoText}>Sin evidencia fotográfica</Text>
        </View>
      )}

      <View style={styles.card}>
        <StatusBadge status={report.estado} />
        <Text style={styles.title}>{report.titulo}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>📍 {report.area}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🏷 {report.categoria}</Text>
          </View>
        </View>
        <Text style={styles.description}>{report.descripcion}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información</Text>
        <InfoRow label="Reportado por" value={report.ownerNombre} />
        <InfoRow label="Creado" value={formatFecha(report.createdAt)} />
        <InfoRow label="Última actualización" value={formatFecha(report.updatedAt)} />
        <InfoRow label="Estado actual" value={meta.label} />
      </View>

      {isStaff ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actualizar estado</Text>
          <Text style={styles.helper}>
            El estudiante verá este cambio de inmediato en su lista de
            reportes.
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
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seguimiento</Text>
          <Text style={styles.helper}>
            El personal universitario revisará tu reporte y actualizará su
            estado. Vuelve a esta pantalla para ver los cambios.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.md, paddingBottom: spacing.xl},
  photo: {
    width: '100%',
    height: 230,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoEmoji: {fontSize: 44},
  photoText: {fontSize: 13, color: colors.textMuted, marginTop: spacing.xs},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
  },
  tagText: {fontSize: 13, fontWeight: '600', color: colors.primaryDark},
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
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
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  infoLabel: {fontSize: 13.5, color: colors.textMuted, fontWeight: '600'},
  infoValue: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  statusButton: {marginTop: spacing.sm},
});

