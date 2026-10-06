import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';
import EmptyList from '../components/EmptyList';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import { LIMITS, STATUSES, statusMeta } from '../constants/catalog';
import { getReportById, updateReportStatus } from '../data/reportRepository';
import { colors, radius, spacing } from '../theme';
import type { Report, ReportStatus } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatFechaHora } from '../utils/dates';
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
      <AppIcon name={icon} size={22} color={colors.primary} />
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text selectable style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Read-only student detail; status controls remain available only to staff. */
export default function ReportDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const savingLock = useRef(false);
  const isStaff = user?.rol === 'personal';

  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getReportById(route.params.reportId);
        if (isActive()) {
          setReport(data);
          setImageFailed(false);
        }
      } catch {
        if (isActive()) setLoadError(true);
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [route.params.reportId],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  const changeStatus = async (estado: ReportStatus) => {
    if (!isStaff || !report || report.estado === estado || savingLock.current)
      return;
    savingLock.current = true;
    setSaving(true);
    try {
      const updated = await updateReportStatus(
        report.id,
        estado,
        statusNote.trim(),
        user,
      );
      setReport(updated);
      setStatusNote('');
      Alert.alert(
        'Estado actualizado',
        'El reporte ahora está marcado como: ' + statusMeta(estado).label + '.',
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado.',
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  };

  if (loading || loadError || !report) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.stateContent,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
      >
        {loading ? (
          <View style={styles.loading} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.description}>Cargando reporte…</Text>
          </View>
        ) : (
          <EmptyList
            icon={loadError ? 'WifiOff' : 'FileSearch'}
            title={
              loadError
                ? 'No pudimos cargar el reporte'
                : 'Reporte no encontrado'
            }
            subtitle={
              loadError
                ? 'Intenta de nuevo para consultar su seguimiento.'
                : 'Es posible que haya sido eliminado. Regresa a tu historial para consultar los demás reportes.'
            }
            actionLabel={loadError ? 'Reintentar' : 'Volver'}
            onAction={
              loadError
                ? () => {
                    load();
                  }
                : () => navigation.goBack()
            }
          />
        )}
      </ScrollView>
    );
  }

  const uri = photoUri(report.photoBase64);
  const current = statusMeta(report.estado);
  const statusDescription =
    report.estado === 'pendiente'
      ? 'El reporte está pendiente de atención por el personal universitario.'
      : report.estado === 'revision'
      ? 'El personal universitario ha marcado el reporte como en revisión.'
      : 'El personal universitario ha marcado la incidencia como solucionada.';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + 20 + insets.bottom },
        ]}
      >
        <Text accessibilityRole="header" selectable style={styles.title}>
          {report.titulo}
        </Text>
        <View style={styles.status}>
          <StatusBadge status={report.estado} />
        </View>
        <Text selectable style={styles.folio}>
          Folio: {folioDe(report.id)}
        </Text>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Datos del reporte
          </Text>
          <InfoRow icon="MapPin" label="Área o ubicación" value={report.area} />
          <InfoRow icon="Tag" label="Categoría" value={report.categoria} />
          <InfoRow
            icon="CalendarDays"
            label="Fecha de reporte"
            value={formatFechaHora(report.createdAt)}
          />
          <InfoRow
            icon="UserRound"
            label="Reportante"
            value={report.ownerNombre}
          />
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Descripción
          </Text>
          <Text selectable style={styles.description}>
            {report.descripcion}
          </Text>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Evidencia fotográfica
          </Text>
          {uri && !imageFailed ? (
            <Image
              source={{ uri }}
              style={styles.photo}
              resizeMode="contain"
              accessibilityLabel="Evidencia fotográfica del reporte"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.noPhoto}>
              <AppIcon
                name={imageFailed ? 'ImageOff' : 'Image'}
                size={26}
                color={colors.primary}
              />
              <Text style={styles.noPhotoText}>
                {imageFailed
                  ? 'No se pudo mostrar la evidencia fotográfica.'
                  : 'No se adjuntó evidencia fotográfica a este reporte.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Seguimiento
          </Text>
          <View style={styles.step}>
            <View style={styles.rail}>
              <View style={styles.stepIcon}>
                <AppIcon name="FileText" size={22} color={colors.primary} />
              </View>
              <View style={styles.line} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>Reporte enviado</Text>
              <Text style={styles.stepDate}>
                {formatFechaHora(report.createdAt)}
              </Text>
              <Text style={styles.description}>
                El reporte fue registrado en el sistema.
              </Text>
            </View>
          </View>
          {(report.statusUpdates ?? []).map(update => {
            const meta = statusMeta(update.to);
            return (
              <View key={update.id} style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: meta.soft }]}>
                  <AppIcon name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>
                    {statusMeta(update.from).label} → {meta.label}
                  </Text>
                  <Text style={styles.stepDate}>
                    {formatFechaHora(update.createdAt)}
                  </Text>
                  {update.authorName ? (
                    <Text style={styles.description}>
                      Por: {update.authorName}
                    </Text>
                  ) : null}
                  {update.note ? (
                    <Text selectable style={styles.description}>
                      {update.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: current.soft }]}>
              <AppIcon name={current.icon} size={22} color={current.color} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>
                Estado actual: {current.label}
              </Text>
              <Text style={styles.stepDate}>
                Última actualización: {formatFechaHora(report.updatedAt)}
              </Text>
              <Text style={styles.description}>{statusDescription}</Text>
            </View>
          </View>
        </View>

        {isStaff ? (
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Gestión de estado del personal
            </Text>
            <Text style={styles.description}>
              Actualiza el estado para que el estudiante pueda consultar el
              progreso.
            </Text>
            <View style={styles.noteField}>
              <FormField
                label="Nota del cambio de estado (opcional)"
                value={statusNote}
                onChangeText={setStatusNote}
                multiline
                maxLength={LIMITS.statusNote}
                editable={!saving}
                placeholder="Describe el avance o el motivo del cambio."
                testID="status-note"
              />
              <Text style={styles.stepDate}>
                {statusNote.length}/{LIMITS.statusNote} caracteres. La nota será
                visible para el estudiante.
              </Text>
            </View>
            {saving ? (
              <Text accessibilityLiveRegion="polite" style={styles.saving}>
                Actualizando estado…
              </Text>
            ) : null}
            {STATUSES.map(status => {
              const isCurrent = report.estado === status.value;
              return (
                <PrimaryButton
                  key={status.value}
                  title={
                    isCurrent
                      ? status.label + ' (Actual)'
                      : 'Cambiar a ' + status.label
                  }
                  variant={isCurrent ? 'primary' : 'outline'}
                  disabled={saving || isCurrent}
                  onPress={() => changeStatus(status.value)}
                  style={styles.statusButton}
                />
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  stateContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  loading: { alignItems: 'center', gap: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary },
  status: { marginTop: spacing.md },
  folio: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoBody: { flex: 1, gap: spacing.xs },
  infoLabel: { fontSize: 14, color: colors.text },
  infoValue: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.text,
  },
  description: { fontSize: 15, lineHeight: 23, color: colors.text },
  photo: {
    width: '100%',
    height: 240,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
  },
  noPhoto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noPhotoText: { flex: 1, fontSize: 15, lineHeight: 23, color: colors.text },
  step: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 40 },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  stepBody: { flex: 1, gap: spacing.xs, paddingBottom: spacing.lg },
  stepTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  stepDate: { fontSize: 14, lineHeight: 21, color: colors.text },
  statusButton: { marginTop: spacing.sm, borderRadius: radius.md },
  saving: { fontSize: 15, color: colors.primary, marginTop: spacing.sm },
  noteField: { marginTop: spacing.md },
});
