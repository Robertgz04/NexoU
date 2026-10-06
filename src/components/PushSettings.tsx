import React, { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  disablePush,
  enablePush,
  getPushRegistration,
  isPushConfigured,
} from '../services/pushNotifications';
import PrimaryButton from './PrimaryButton';
import { colors, spacing } from '../theme';

export default function PushSettings() {
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([isPushConfigured(), getPushRegistration()])
        .then(([ready, registration]) => {
          if (!active) return;
          setConfigured(ready);
          setEnabled(registration.enabled);
          setBusy(false);
        })
        .catch(() => {
          if (active) {
            setError(
              'No se pudo consultar la configuración de notificaciones.',
            );
            setBusy(false);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const toggle = async (value: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = value ? await enablePush() : await disablePush();
      setEnabled(next.enabled);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudieron actualizar las notificaciones.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={styles.label}>Recibir notificaciones push</Text>
        <Switch
          accessibilityLabel="Recibir notificaciones push"
          value={enabled && configured}
          disabled={busy || !configured}
          onValueChange={toggle}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <Text style={styles.help}>
        {configured
          ? 'Activa las notificaciones de NexoU en este dispositivo.'
          : 'Pendiente de conectar Firebase. Las notificaciones todavía no pueden activarse.'}
      </Text>
      {busy ? (
        <Text accessibilityLiveRegion="polite" style={styles.help}>
          Actualizando notificaciones…
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {configured ? (
        <PrimaryButton
          title="Abrir ajustes del dispositivo"
          variant="outline"
          onPress={() => {
            Linking.openSettings().catch(() =>
              setError('No se pudieron abrir los ajustes.'),
            );
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  label: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.primary },
  help: { fontSize: 15, lineHeight: 23, color: colors.text },
  error: { fontSize: 15, lineHeight: 23, color: colors.danger },
});
