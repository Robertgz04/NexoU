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
import Chip from '../components/Chip';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import {LIMITS} from '../constants/catalog';
import {colors, spacing} from '../theme';
import type {Role} from '../types';
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

/**
 * F02 – Registro de cuenta.
 * El rol (estudiante / personal) se elige aquí; con el rol del usuario
 * depende qué panel recibe al iniciar sesión (F01).
 */
export default function RegisterScreen() {
  const navigation = useNavigation();
  const {register} = useAuth();

  const [rol, setRol] = useState<Role>('estudiante');
  const [nombre, setNombre] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const nextErrors: FieldErrors = {
      nombre: validateRequired(nombre, 'nombre'),
      matricula: validateRequired(
        matricula,
        rol === 'estudiante' ? 'matrícula' : 'código',
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
      await register({nombre, matricula, email, password, rol});
      // La sesión queda activa: RootNavigator cambia al panel del rol.
    } catch (e) {
      setErrors({
        general:
          e instanceof Error ? e.message : 'No se pudo crear la cuenta.',
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
          <Text style={styles.heading}>Crear cuenta</Text>
          <Text style={styles.subheading}>
            Elige tu tipo de usuario para continuar.
          </Text>

          <View style={styles.roleRow}>
            <Chip
              testID="role-estudiante"
              label="Estudiante"
              selected={rol === 'estudiante'}
              onPress={() => setRol('estudiante')}
            />
            <Chip
              testID="role-personal"
              label="Personal universitario"
              selected={rol === 'personal'}
              onPress={() => setRol('personal')}
            />
          </View>

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <FormField
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
            placeholder="Ej. Ana López García"
            autoCapitalize="words"
          />
          <FormField
            label={rol === 'estudiante' ? 'Matrícula' : 'Código de personal'}
            value={matricula}
            onChangeText={setMatricula}
            error={errors.matricula}
            placeholder={rol === 'estudiante' ? 'A00123456' : 'P0001'}
            autoCapitalize="characters"
          />
          <FormField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="usuario@nexou.mx"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label={`Contraseña (mín. ${LIMITS.passwordMin} caracteres)`}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
          <FormField
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <PrimaryButton
            title="Crear cuenta"
            onPress={onSubmit}
            loading={loading}
          />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.link}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  scroll: {padding: spacing.lg, paddingTop: spacing.lg},
  heading: {fontSize: 24, fontWeight: '800', color: colors.text},
  subheading: {
    fontSize: 14.5,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  roleRow: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm},
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorText: {color: colors.danger, fontSize: 14},
  link: {marginTop: spacing.md, alignItems: 'center', marginBottom: spacing.lg},
  linkText: {fontSize: 14.5, color: colors.textMuted},
  linkBold: {color: colors.primary, fontWeight: '700'},
});
