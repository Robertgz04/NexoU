import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {Report} from '../types';
import {colors, radius, spacing} from '../theme';
import {formatFechaRelativa} from '../utils/dates';
import {photoUri} from '../utils/photo';
import StatusBadge from './StatusBadge';

interface Props {
  report: Report;
  onPress: () => void;
  /** Muestra el nombre del autor (panel del personal, F07). */
  showOwner?: boolean;
}

/** Tarjeta de reporte usada en todas las listas (F06/F07). */
export default function ReportCard({report, onPress, showOwner = false}: Props) {
  const uri = photoUri(report.photoBase64);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}>
      {uri ? (
        <Image source={{uri}} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbEmoji}>📋</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {report.titulo}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {report.area} • {report.categoria}
        </Text>
        {showOwner ? (
          <Text style={styles.owner}>Por: {report.ownerNombre}</Text>
        ) : null}
        <View style={styles.footer}>
          <StatusBadge status={report.estado} />
          <Text style={styles.date}>{formatFechaRelativa(report.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
    gap: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
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
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  owner: {
    fontSize: 12.5,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm - 2,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
