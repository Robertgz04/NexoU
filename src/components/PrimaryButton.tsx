import TouchableOpacity from './MotionTouchable';
import AppIcon from './AppIcon';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  /** Muestra la flecha "→" al final del título (mockups). */
  withArrow?: boolean;
  style?: ViewStyle;
}

/**
 * Botón principal de la app (alto táctil, estados loading/deshabilitado).
 * Estilo de los mockups: píldora rellena en azul marino con sombra suave.
 */
export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  withArrow = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
      ? colors.danger
      : colors.surface;
  const textColor =
    variant === 'outline' ? colors.accent : colors.textOnPrimary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: background },
        variant === 'outline' && styles.outline,
        variant === 'primary' && styles.filled,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
      {!loading && withArrow ? (
        <AppIcon name="ArrowRight" color={textColor} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
  },
  filled: {
    ...shadow.floating,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
