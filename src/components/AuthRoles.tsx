import TouchableOpacity from './MotionTouchable';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react-native';
import type { Role } from '../types';
import { colors } from '../theme';
export default function AuthRoles({
  value,
  onChange,
  compact = false,
}: {
  value: Role;
  onChange: (role: Role) => void;
  compact?: boolean;
}) {
  if (compact) {
    const Icon = value === 'estudiante' ? GraduationCap : BriefcaseBusiness;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Rol: ${
          value === 'estudiante' ? 'Estudiante' : 'Personal'
        }`}
        accessibilityHint="Toca para cambiar entre estudiante y personal"
        onPress={() =>
          onChange(value === 'estudiante' ? 'personal' : 'estudiante')
        }
        style={styles.badge}
      >
        <Icon size={28} color={colors.primary} strokeWidth={1.8} />
        <Text style={[styles.text, styles.selectedText]}>
          Rol: {value === 'estudiante' ? 'Estudiante' : 'Personal'}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.row}>
      {(['estudiante', 'personal'] as const).map(role => {
        const selected = value === role;
        const Icon = role === 'estudiante' ? GraduationCap : BriefcaseBusiness;
        return (
          <TouchableOpacity
            key={role}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(role)}
            style={[
              styles.option,
              compact && styles.compact,
              selected && styles.selected,
            ]}
          >
            <Icon
              size={compact ? 22 : 26}
              color={colors.primary}
              strokeWidth={1.8}
            />
            <Text style={[styles.text, selected && styles.selectedText]}>
              {role === 'estudiante' ? 'Estudiante' : 'Personal'}
            </Text>
            {!compact && (
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.dot} />}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#E0F6F3',
    borderRadius: 14,
    paddingHorizontal: 26,
    minHeight: 48,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  option: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE2E9',
    backgroundColor: '#FFFFFF',
  },
  compact: { minHeight: 44 },
  selected: { backgroundColor: '#E0F6F3', borderColor: colors.accent },
  text: { color: colors.primaryDark, fontSize: 14, flexShrink: 1 },
  selectedText: { fontWeight: '700' },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#B8C3CD',
  },
  radioSelected: {
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
