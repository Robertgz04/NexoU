import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import {LIMITS} from '../constants/catalog';
import {colors, spacing} from '../theme';
import {validateEmail, validatePassword} from '../utils/validators';

interface FieldErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

/** F01 – Inicio de sesión de estudiantes y personal universitario. */
export default function LoginScreen() {
  const navigation = useNavigation();
  const {login} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, LIMITS.passwordMin);
    if (emailError || passwordError) {
      setErrors({email: emailError, password: passwordError});
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Text style={styles.logo}>N</Text>
            <Text style={styles.brand}>NexoU</Text>
            <Text style={styles.tagline}>
              Reporta y da seguimiento a incidencias del campus
            </Text>
          </View>

          <Text style={styles.heading}>Iniciar sesión</Text>

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <FormField
            testID="login-email"
            label="Correo institucional"
            value={email}
            onChangeText={t => setEmail(t)}
            error={errors.email}
            placeholder="usuario@nexou.mx"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            testID="login-password"
            label="Contraseña"
            value={password}
            onChangeText={t => setPassword(t)}
            error={errors.password}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <PrimaryButton
            title="Ingresar"
            onPress={onSubmit}
            loading={loading}
          />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('Register')}
            style={styles.link}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.linkBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Cuentas de demostración</Text>
            <Text style={styles.demoText}>
              Estudiante: estudiante@nexou.mx {'\n'}
              Personal: personal@nexou.mx {'\n'}
              Contraseña: Demo1234
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  scroll: {padding: spacing.lg, paddingTop: spacing.xl},
  logoBox: {alignItems: 'center', marginBottom: spacing.lg},
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 76,
    overflow: 'hidden',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorText: {color: colors.danger, fontSize: 14},
  link: {marginTop: spacing.md, alignItems: 'center'},
  linkText: {fontSize: 14.5, color: colors.textMuted},
  linkBold: {color: colors.primary, fontWeight: '700'},
  demoBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  demoText: {fontSize: 13, color: colors.primaryDark, lineHeight: 20},
});
