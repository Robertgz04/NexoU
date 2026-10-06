import TouchableOpacity from './MotionTouchable';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { colors } from '../theme';
interface Props extends TextInputProps {
  label: string;
  icon: LucideIcon;
  error?: string | null;
  hint?: string;
  hideLabel?: boolean;
}
export default function AuthField({
  label,
  icon: Icon,
  error,
  hint,
  hideLabel,
  secureTextEntry,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, hideLabel && styles.compactField]}>
      {!hideLabel && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          hideLabel && styles.compactRow,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      >
        <Icon
          size={22}
          color={hideLabel ? colors.primary : '#596C80'}
          strokeWidth={1.8}
        />
        <TextInput
          {...props}
          accessibilityLabel={label}
          style={[styles.input, hideLabel && styles.compactInput]}
          placeholderTextColor={'#596C80'}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !visible}
          onFocus={() => setFocused(true)}
          onBlur={event => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            accessibilityState={{ checked: visible }}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            {visible ? (
              <Eye size={22} color={'#596C80'} />
            ) : (
              <EyeOff size={22} color={'#596C80'} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  compactField: { marginBottom: 10 },
  compactRow: { minHeight: 48 },
  compactInput: { paddingVertical: 9 },
  field: { marginBottom: 16 },
  label: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: '#DCE2E9',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 46,
  },
  focused: { borderColor: '#08796E' },
  invalid: { borderColor: colors.danger },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eye: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { color: '#596C80', fontSize: 12, marginTop: 5, marginLeft: 48 },
  error: { color: colors.danger, fontSize: 12, marginTop: 5 },
});
