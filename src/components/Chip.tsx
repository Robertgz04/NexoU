import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, radius, spacing} from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Color de acento (por defecto el azul NexoU). */
  color?: string;
  testID?: string;
}

/** Chip seleccionable: se usa para áreas, categorías y filtros (F04, F07). */
export default function Chip({
  label,
  selected,
  onPress,
  color = colors.primary,
  testID,
}: Props) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{selected}}
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.chip,
        selected && {backgroundColor: color, borderColor: color},
      ]}>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  textSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
