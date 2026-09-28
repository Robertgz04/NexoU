import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { LIMITS } from '../constants/catalog';
import FondoLogin from '../assets/NexoU_Fondo_Login.png';
import FondoOndas from '../assets/NexoU_Fondo_Ondas.png';
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
      // Al iniciar sesión, RootNavigator cambia el árbol según el rol.
      await login(email, password);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo iniciar sesión.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={FondoLogin} style={styles.hero} />
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

              <View style={styles.demoBox}>
                <Text style={styles.demoTitle}>Cuentas de demostración</Text>
                <Text style={styles.demoText}>
                  Estudiante: estudiante@nexou.mx {'\n'}
                  Personal: personal@nexou.mx {'\n'}
                  Contraseña: Demo1234
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Image source={FondoOndas} style={styles.waves} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  safe: { flex: 1 },
  scroll: {
    paddingTop: 190,
    paddingBottom: spacing.xl + 40,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    ...shadow.floating,
  },
  logo: {
    height: 54,
    alignSelf: 'center',
    width: 190,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
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
  demoBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accentDark,
    marginBottom: spacing.xs,
  },
  demoText: { fontSize: 13, color: colors.accentDark, lineHeight: 20 },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 96,
  },
});
