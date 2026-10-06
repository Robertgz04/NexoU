import PushSettings from '../components/PushSettings';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import MenuRow from '../components/MenuRow';
import { usePreferences } from '../context/PreferencesContext';
import type { Preferences } from '../context/PreferencesContext';
import { colors, radius, spacing } from '../theme';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { preferences, loading, saving, updatePreference } = usePreferences();
  const [error, setError] = useState<string | null>(null);
  const update = async (key: keyof Preferences, value: boolean) => {
    setError(null);
    try {
      await updatePreference(key, value);
    } catch {
      setError(
        'No se pudo guardar la preferencia. Intenta cambiarla de nuevo.',
      );
    }
  };
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: spacing.xl + 20 + insets.bottom },
      ]}
    >
      <Text accessibilityRole="header" style={styles.title}>
        Configura tu experiencia
      </Text>
      <Text style={styles.intro}>
        Estas preferencias se guardan en este dispositivo y se aplican a las
        cuentas que lo utilizan.
      </Text>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Accesibilidad
        </Text>
        <View style={styles.row}>
          <AppIcon name="Accessibility" size={24} color={colors.primary} />
          <View style={styles.body}>
            <Text style={styles.label}>Reducir movimiento</Text>
            <Text style={styles.help}>
              Reduce las animaciones al tocar y navegar. La preferencia de
              accesibilidad del sistema siempre se respeta.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Reducir movimiento"
            value={preferences.reduceMotion}
            disabled={loading || saving}
            onValueChange={value => update('reduceMotion', value)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Historial
        </Text>
        <View style={styles.row}>
          <AppIcon name="Image" size={24} color={colors.primary} />
          <View style={styles.body}>
            <Text style={styles.label}>Mostrar miniaturas</Text>
            <Text style={styles.help}>
              Muestra fotos en Mis reportes. La evidencia completa sigue
              disponible en el detalle.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Mostrar miniaturas en Mis reportes"
            value={preferences.showReportPhotos}
            disabled={loading || saving}
            onValueChange={value => update('showReportPhotos', value)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>
      {loading || saving ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityLiveRegion="polite" style={styles.help}>
            {loading ? 'Cargando preferencias…' : 'Guardando preferencia…'}
          </Text>
        </View>
      ) : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Notificaciones
        </Text>
        <PushSettings />
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Cuenta
        </Text>
        <MenuRow
          icon="UserRound"
          title="Datos personales"
          subtitle="Consulta y edita tu nombre, identificador y correo"
          onPress={() => navigation.navigate('PersonalData')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  body: { flex: 1, gap: spacing.xs },
  label: { fontSize: 16, fontWeight: '700', color: colors.primary },
  help: { fontSize: 15, lineHeight: 23, color: colors.text },
  feedback: { marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm },
  error: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.danger,
    marginTop: spacing.md,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noticeText: { flex: 1, fontSize: 15, lineHeight: 23, color: colors.text },
});
