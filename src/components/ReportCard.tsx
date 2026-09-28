import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Report } from '../types';
import { colors, radius, shadow, spacing } from '../theme';
import { formatFechaRelativa } from '../utils/dates';
import { photoUri } from '../utils/photo';
import StatusBadge from './StatusBadge';

interface Props {
  report: Report;
  onPress: () => void;
  /** Muestra el nombre del autor (panel del personal, F07). */
  showOwner?: boolean;
}

/**
 * Tarjeta de reporte usada en todas las listas (mockups F06/F07):
 * miniatura redondeada, título, filas con icono de ubicación/fecha y badge.
 */
export default function ReportCard({
  report,
  onPress,
  showOwner = false,
}: Props) {
  const uri = photoUri(report.photoBase64);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbEmoji}>📋</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {report.titulo}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={styles.metaIcon}>📍 </Text>
          {report.area} · {report.categoria}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.date}>
            <Text style={styles.metaIcon}>📅 </Text>
            {formatFechaRelativa(report.createdAt)}
          </Text>
          <StatusBadge status={report.estado} />
        </View>
        {showOwner ? (
          <Text style={styles.owner}>Por: {report.ownerNombre}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
    gap: spacing.md,
    ...shadow.card,
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
