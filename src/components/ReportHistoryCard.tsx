import React, { useContext } from 'react';
import { PreferencesContext } from '../context/PreferencesState';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import MotionTouchable from './MotionTouchable';
import StatusBadge from './StatusBadge';
import type { Report } from '../types';
import { colors, radius, shadow, spacing } from '../theme';
import { formatFechaRelativa } from '../utils/dates';
import { photoUri } from '../utils/photo';

interface Props {
  report: Report;
  onPress: () => void;
  expanded: boolean;
  onToggleNote: () => void;
  note: { icon: string; title: string; text: string };
}

/** Separate targets for opening a report and expanding its status note. */
export default function ReportHistoryCard({
  report,
  onPress,
  expanded,
  onToggleNote,
  note,
}: Props) {
  const preferences = useContext(PreferencesContext);
  const uri =
    preferences?.preferences.showReportPhotos === false
      ? null
      : photoUri(report.photoBase64);
  return (
    <View style={styles.card}>
      <MotionTouchable
        accessibilityRole="button"
        accessibilityLabel={`Abrir reporte: ${report.titulo}`}
        onPress={onPress}
        style={styles.content}
      >
        <View style={styles.heading}>
          <StatusBadge status={report.estado} />
          <AppIcon name="ChevronRight" size={22} color={colors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {report.titulo}
        </Text>
        <View style={styles.summary}>
          {uri ? (
            <Image source={{ uri }} style={styles.photo} accessible={false} />
          ) : null}
          <View style={styles.metadata}>
            <View style={styles.metaRow}>
              <AppIcon name="MapPin" size={20} color={colors.primary} />
              <Text style={styles.metaText}>{report.area}</Text>
            </View>
            <Text style={styles.category}>{report.categoria}</Text>
            <View style={styles.metaRow}>
              <AppIcon name="CalendarDays" size={20} color={colors.primary} />
              <Text style={styles.metaText}>
                {formatFechaRelativa(report.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </MotionTouchable>
      <MotionTouchable
        accessibilityRole="button"
        accessibilityLabel={`${
          expanded ? 'Ocultar' : 'Mostrar'
        } nota de estado de ${report.titulo}`}
        accessibilityState={{ expanded }}
        onPress={onToggleNote}
        style={styles.noteButton}
      >
        <AppIcon name="MessageSquare" size={20} color={colors.primary} />
        <Text style={styles.noteLabel}>
          {expanded ? 'Ocultar nota de estado' : 'Ver nota de estado'}
        </Text>
        <AppIcon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={20}
          color={colors.primary}
        />
      </MotionTouchable>
      {expanded ? (
        <View style={styles.note}>
          <AppIcon name={note.icon} size={22} color={colors.primary} />
          <View style={styles.metadata}>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteText}>{note.text}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  content: { padding: spacing.md, gap: spacing.sm },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary },
  summary: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  photo: { width: 64, height: 64, borderRadius: radius.md },
  metadata: { flex: 1, minWidth: 0, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
  category: { fontSize: 14, color: colors.text, marginLeft: 28 },
  noteButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: 0,
  },
  noteTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  noteText: { fontSize: 15, lineHeight: 22, color: colors.text },
});
