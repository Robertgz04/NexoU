import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { LIMITS } from '../constants/catalog';
import Logo from '../assets/NexoU_Logo.png';
import { colors, radius, shadow, spacing } from '../theme';
import { validateEmail, validatePassword } from '../utils/validators';

interface FieldErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

/** F01 – Inicio de sesión de estudiantes y personal universitario. */
export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const fillDemo = (role: 'estudiante' | 'personal') => {
    if (role === 'estudiante') {
      setEmail('estudiante@nexou.mx');
    } else {
      setEmail('personal@nexou.mx');
    }
    setPassword('Demo1234');
    setErrors({});
  };

  const onSubmit = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, LIMITS.passwordMin);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo iniciar sesión.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fondo = SCREEN_BACKGROUNDS.login;

  return (
    <ScreenBackground source={fondo.source} artBottom={fondo.artBottom} sheet>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheet}>
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>
                Reporta y da seguimiento a{'\n'}incidencias universitarias
              </Text>

              <Text style={styles.heading}>Iniciar sesión</Text>

              {errors.general ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              ) : null}

              <FormField
                testID="login-email"
                label="Correo"
                value={email}
                onChangeText={t => setEmail(t)}
                error={errors.email}
                placeholder="tu.correo@universidad.edu"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormField
                testID="login-password"
                label="Contraseña"
                value={password}
                onChangeText={t => setPassword(t)}
                error={errors.password}
                placeholder="Ingresa tu contraseña"
                secureTextEntry
                autoCapitalize="none"
              />

              <PrimaryButton
                title="Iniciar sesión"
                withArrow
                onPress={onSubmit}
                loading={loading}
                style={styles.submitButton}
              />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>
                  ¿Aún no tienes una cuenta?
                </Text>
                <View style={styles.divider} />
              </View>

              <PrimaryButton
                title="Crear cuenta"
                variant="outline"
                onPress={() => navigation.navigate('Register')}
              />

              <View style={styles.demoCard}>
                <View style={styles.demoHeader}>
                  <Text style={styles.demoIcon}>💡</Text>
                  <Text style={styles.demoTitle}>Probar con cuentas de demostración</Text>
                </View>
                <Text style={styles.demoSub}>
                  Toca una opción para rellenar los datos automáticamente:
                </Text>

                <View style={styles.demoButtonsRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    style={styles.demoChip}
                    onPress={() => fillDemo('estudiante')}
                  >
                    <Text style={styles.demoChipIcon}>🎓</Text>
                    <Text style={styles.demoChipText}>Estudiante</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    style={[styles.demoChip, styles.demoChipStaff]}
                    onPress={() => fillDemo('personal')}
                  >
                    <Text style={styles.demoChipIcon}>🛠</Text>
                    <Text style={styles.demoChipTextStaff}>Personal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: spacing.xl + 20,
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  logo: {
    height: 52,
    alignSelf: 'center',
    width: 180,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  submitButton: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md + 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  demoCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  demoIcon: {
    fontSize: 16,
  },
  demoTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },
  demoSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginBottom: spacing.sm + 2,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  demoChipIcon: {
    fontSize: 16,
  },
  demoChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDark,
  },
  demoChipStaff: {
    backgroundColor: colors.primarySoft,
  },
  demoChipTextStaff: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
