import TouchableOpacity from './MotionTouchable';
import AppIcon from './AppIcon';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Color de acento del icono y del título (por defecto azul marino). */
  color?: string;
  soft?: string;
  testID?: string;
}

/**
 * Fila de menú con icono en círculo, título, descripción y chevron
 * (mockup de Mi perfil).
 */
export default function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  color = colors.primary,
  soft = colors.primarySoft,
  testID,
}: Props) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.iconBox, { backgroundColor: soft }]}>
        <AppIcon name={icon} size={20} color={color} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <AppIcon name="ChevronRight" size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 19,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '700',
  },
});
