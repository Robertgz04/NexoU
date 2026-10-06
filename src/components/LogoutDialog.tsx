import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import MotionTouchable from './MotionTouchable';
import PrimaryButton from './PrimaryButton';
import useReducedMotion from '../hooks/useReducedMotion';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function LogoutDialog({ visible, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const close = () => {
    if (!lock.current) {
      setError(null);
      onClose();
    }
  };
  const confirm = async () => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError('No se pudo cerrar la sesión. Intenta de nuevo.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  if (!visible) return null;
  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View
          style={styles.dialog}
          accessibilityViewIsModal
          onAccessibilityEscape={close}
        >
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View style={styles.icon}>
              <AppIcon name="LogOut" size={28} color={colors.primary} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              ¿Cerrar sesión?
            </Text>
            <Text style={styles.description}>
              Saldrás de tu cuenta en NexoU. Podrás volver a iniciar sesión
              cuando lo necesites.
            </Text>
            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              title="Cerrar sesión"
              onPress={confirm}
              loading={saving}
              style={styles.confirm}
            />
            {saving ? (
              <Text accessibilityLiveRegion="polite" style={styles.progress}>
                Cerrando sesión…
              </Text>
            ) : null}
            <MotionTouchable
              accessibilityRole="button"
              disabled={saving}
              onPress={close}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>Seguir en mi cuenta</Text>
            </MotionTouchable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 42, 63, 0.48)',
    paddingHorizontal: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: { padding: spacing.lg },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    marginTop: spacing.sm,
  },
  confirm: { marginTop: spacing.lg, borderRadius: radius.lg },
  cancel: {
    minHeight: 48,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  error: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.danger,
    marginTop: spacing.md,
  },
  progress: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
});
