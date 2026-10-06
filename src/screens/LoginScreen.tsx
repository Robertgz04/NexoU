import TouchableOpacity from '../components/MotionTouchable';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mail, LockKeyhole, UserRoundPlus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AuthField from '../components/AuthField';
import AuthRoles from '../components/AuthRoles';
import PrimaryButton from '../components/PrimaryButton';
import { LIMITS } from '../constants/catalog';
import { colors } from '../theme';
import type { Role } from '../types';
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

  const [rol, setRol] = useState<Role>('estudiante');
  const [showDemo, setShowDemo] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const fillDemo = (role: 'estudiante' | 'personal') => {
    setRol(role);
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

  return (
    <AuthLayout>
      <Text style={styles.tagline}>
        Reporta y da seguimiento a{'\n'}incidencias universitarias
      </Text>
      <View style={styles.form}>
        {errors.general && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errors.general}
          </Text>
        )}
        <AuthField
          testID="login-email"
          label="Correo"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="tu.correo@universidad.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthField
          testID="login-password"
          label="Contraseña"
          icon={LockKeyhole}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Ingresa tu contraseña"
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={styles.label}>Selecciona tu rol</Text>
        <AuthRoles value={rol} onChange={setRol} />
        <PrimaryButton
          title="Iniciar sesión"
          withArrow
          onPress={onSubmit}
          loading={loading}
          style={styles.button}
        />
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.muted}>¿Aún no tienes una cuenta?</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('Register', { rol })}
          style={styles.create}
        >
          <UserRoundPlus size={23} color={'#08796E'} />
          <Text style={styles.createText}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: showDemo }}
        onPress={() => setShowDemo(!showDemo)}
        style={styles.demo}
      >
        <Text style={styles.demoText}>Probar cuentas de demostración</Text>
      </TouchableOpacity>
      {showDemo && (
        <View style={styles.demoOptions}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => fillDemo('estudiante')}
            style={styles.demo}
          >
            <Text style={styles.demoText}>Estudiante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => fillDemo('personal')}
            style={styles.demo}
          >
            <Text style={styles.demoText}>Personal</Text>
          </TouchableOpacity>
        </View>
      )}
    </AuthLayout>
  );
}
const styles = StyleSheet.create({
  tagline: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 23,
    color: '#536475',
    marginTop: 8,
    marginBottom: 22,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
  },
  label: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 9,
  },
  button: { minHeight: 54, borderRadius: 20, backgroundColor: '#063963' },
  error: { color: colors.danger, marginBottom: 16, fontSize: 14 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: '#CFD8E1' },
  muted: { fontSize: 12, color: '#596C80' },
  create: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: '#08796E',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { color: '#08796E', fontSize: 16, fontWeight: '700' },
  demo: {
    alignSelf: 'center',
    padding: 12,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  demoText: {
    color: colors.primary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  demoOptions: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
});
