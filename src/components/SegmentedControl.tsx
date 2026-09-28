import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export interface SegmentOption {
  value: string;
  label: string;
}

interface Props {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  style?: object;
  testID?: string;
}

/**
 * Control segmentado tipo píldora (mockups de Estadísticas y Notificaciones):
 * contenedor blanco redondeado donde la opción activa se rellena de turquesa.
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.container, style]}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            testID={`${testID ?? 'segment'}-${option.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            activeOpacity={0.85}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    padding: 4,
    gap: 4,
    ...shadow.card,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  segmentActive: {
    backgroundColor: colors.accent,
    ...shadow.floating,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
});
