import TouchableOpacity from '../components/MotionTouchable';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mail, LockKeyhole, UserRound, IdCard } from 'lucide-react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AuthField from '../components/AuthField';
import AuthRoles from '../components/AuthRoles';
import PrimaryButton from '../components/PrimaryButton';
import { LIMITS } from '../constants/catalog';
import { colors } from '../theme';
import type { Role } from '../types';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validators';

interface FieldErrors {
  nombre?: string | null;
  matricula?: string | null;
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
  general?: string | null;
}

/** F02 – Registro de cuenta para estudiante o personal universitario. */
export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();

  const route = useRoute<RouteProp<RootStackParamList, 'Register'>>();
  const [rol, setRol] = useState<Role>(route.params?.rol ?? 'estudiante');
  const [nombre, setNombre] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const nextErrors: FieldErrors = {
      nombre: validateRequired(nombre, 'nombre completo'),
      matricula: validateRequired(
        matricula,
        rol === 'estudiante' ? 'matrícula' : 'código de personal',
      ),
      email: validateEmail(email),
      password: validatePassword(password, LIMITS.passwordMin),
      confirm: confirm === password ? null : 'Las contraseñas no coinciden.',
    };
    if (Object.values(nextErrors).some(v => v)) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register({ nombre, matricula, email, password, rol });
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo crear la cuenta.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout register onBack={() => navigation.goBack()}>
      <Text style={styles.heading}>Crear cuenta</Text>
      <Text style={styles.subtitle}>
        Regístrate como {rol === 'estudiante' ? 'estudiante' : 'personal'} para
        {'\n'}comenzar a reportar incidencias.
      </Text>
      <AuthRoles value={rol} onChange={setRol} compact />
      <View style={styles.form}>
        {errors.general && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errors.general}
          </Text>
        )}
        <AuthField
          hideLabel
          label="Nombre completo"
          icon={UserRound}
          value={nombre}
          onChangeText={setNombre}
          error={errors.nombre}
          placeholder="Nombre completo"
          hint="Ej. María Fernanda López García"
          autoCapitalize="words"
        />
        <AuthField
          hideLabel
          label={rol === 'estudiante' ? 'Matrícula' : 'Código de personal'}
          icon={IdCard}
          value={matricula}
          onChangeText={setMatricula}
          error={errors.matricula}
          placeholder={
            rol === 'estudiante' ? 'Matrícula' : 'Código de personal'
          }
          hint={rol === 'estudiante' ? 'Ej. A01234567' : 'Ej. P0001'}
          autoCapitalize="characters"
        />
        <AuthField
          hideLabel
          label="Correo institucional"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="Correo institucional"
          hint="Ej. tu.correo@universidad.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthField
          hideLabel
          label="Contraseña"
          icon={LockKeyhole}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Contraseña"
          hint={`Mínimo ${LIMITS.passwordMin} caracteres`}
          secureTextEntry
          autoCapitalize="none"
        />
        <AuthField
          hideLabel
          label="Confirmar contraseña"
          icon={LockKeyhole}
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          placeholder="Confirmar contraseña"
          hint="Confirma tu contraseña"
          secureTextEntry
          autoCapitalize="none"
        />
        <PrimaryButton
          title="Crear cuenta"
          withArrow
          onPress={onSubmit}
          loading={loading}
          style={styles.button}
        />
      </View>
      <View style={styles.footer}>
        <View style={styles.line} />
        <Text style={styles.muted}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.link}
        >
          <Text style={styles.linkText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <View style={styles.line} />
      </View>
    </AuthLayout>
  );
}
const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    color: '#596C80',
    marginTop: 6,
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  button: { minHeight: 50, borderRadius: 18, backgroundColor: '#063963' },
  error: { color: colors.danger, marginBottom: 16, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: '#CFD8E1' },
  muted: { fontSize: 12, color: '#596C80' },
  link: { minHeight: 48, justifyContent: 'center' },
  linkText: {
    color: '#08796E',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
