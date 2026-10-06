import TouchableOpacity from './MotionTouchable';
import AppIcon from './AppIcon';
import React, { useContext } from 'react';
import { PreferencesContext } from '../context/PreferencesState';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Report } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatFechaRelativa } from '../utils/dates';
import { evidenceSource } from '../services/api';
import StatusBadge from './StatusBadge';

interface Props {
  report: Report;
  onPress: () => void;
  /** Muestra el nombre del autor (panel del personal, F07). */
  showOwner?: boolean;
  /** Nota de estado ampliada bajo la tarjeta (mockup de Mis reportes). */
  note?: { icon: string; title: string; text: string } | null;
  /** La tarjeta está expandida: muestra el chevron hacia arriba y la nota. */
  expanded?: boolean;
  /** Plega/despliega la nota sin navegar al detalle. */
  onToggleNote?: () => void;
}

/**
 * Tarjeta de reporte usada en todas las listas (mockups F06/F07):
 * miniatura redondeada, título, filas con icono de ubicación/fecha y badge.
 * Con `note` reproduce la variante expandida del mockup "Mis reportes".
 */
export default function ReportCard({
  report,
  onPress,
  showOwner = false,
  note = null,
  expanded = false,
  onToggleNote,
}: Props) {
  const preferences = useContext(PreferencesContext);
  const uri =
    preferences?.preferences.showReportPhotos === false
      ? null
      : report.evidenceUrl
      ? evidenceSource(report.evidenceUrl)
      : null;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir reporte: ${report.titulo}`}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, expanded && styles.cardExpanded]}
    >
      {uri ? (
        <Image source={uri!} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <AppIcon name="ClipboardList" size={32} color={colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {report.titulo}
          </Text>
          {onToggleNote ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Ocultar detalle' : 'Ver detalle'}
              accessibilityState={{ expanded }}
              hitSlop={8}
              onPress={onToggleNote}
              style={styles.chevronButton}
            >
              <AppIcon
                name={expanded ? 'ChevronUp' : 'ChevronRight'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          ) : (
            <AppIcon name="ChevronRight" size={20} color={colors.primary} />
          )}
        </View>
        <Text style={styles.meta}>
          <AppIcon name="MapPin" size={20} color={colors.primary} />
          {report.area} · {report.categoria}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.date}>
            <AppIcon name="CalendarDays" size={20} color={colors.primary} />
            {formatFechaRelativa(report.createdAt)}
          </Text>
          <StatusBadge status={report.estado} />
        </View>
        {showOwner ? (
          <Text style={styles.owner}>Por: {report.ownerNombre}</Text>
        ) : null}
      </View>

      {expanded && note ? (
        <View style={styles.note}>
          <View style={styles.noteIconBox}>
            <AppIcon name={note.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.noteBody}>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteText}>{note.text}</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
    gap: spacing.md,
  },
  cardExpanded: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    width: '100%',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md + 2,
    padding: spacing.sm + 4,
    marginTop: spacing.xs,
  },
  noteIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: {
    fontSize: 19,
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primary,
  },
  noteText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 2,
  },
  thumb: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 26,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.primary,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chevronButton: {
    paddingLeft: spacing.sm,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  metaIcon: {
    fontSize: 12,
  },
  owner: {
    fontSize: 12.5,
    color: colors.accentDark,
    marginTop: 3,
    fontWeight: '600',
  },
  footer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm - 2,
    gap: spacing.sm,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
