import TouchableOpacity from './MotionTouchable';
import AppIcon from './AppIcon';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Nombre del icono a la izquierda del valor. */
  icon?: string;
  error?: string | null;
  testID?: string;
}

/**
 * Selector desplegable (mockup de Nuevo reporte): campo con icono, valor
 * seleccionado y chevron; al pulsarlo se abre la lista en un modal.
 */
export default function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  icon,
  error,
  testID,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        accessibilityState={{ expanded: open }}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={[styles.control, !!error && styles.controlError]}
      >
        {icon ? <AppIcon name={icon} size={20} color={colors.primary} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ?? placeholder}
        </Text>
        <AppIcon name="ChevronDown" size={20} color={colors.primary} />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          {/* evita que el toque interno cierre el modal */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              style={styles.sheetList}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    style={styles.option}
                  >
                    <Text
                      style={[styles.optionText, selected && styles.optionOn]}
                    >
                      {item}
                    </Text>
                    {selected ? (
                      <AppIcon name="Check" size={20} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs + 2,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md + 2,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    paddingVertical: 14,
  },
  controlError: {
    borderColor: colors.danger,
  },
  icon: {
    fontSize: 15,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  placeholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: 12.5,
    color: colors.danger,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 42, 63, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    maxHeight: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    ...shadow.floating,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  sheetList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 48,
    paddingVertical: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  optionOn: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  check: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },
});
