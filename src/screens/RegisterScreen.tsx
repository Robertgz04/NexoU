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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { LIMITS } from '../constants/catalog';
import Logo from '../assets/NexoU_Logo.png';
import { colors, radius, shadow, spacing } from '../theme';
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

  const fondo = SCREEN_BACKGROUNDS.register;

  const backButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver"
      activeOpacity={0.85}
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>←</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      sheet
      overArt={backButton}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heading}>Crear cuenta en NexoU</Text>
          <Text style={styles.subtitle}>
            Selecciona tu perfil e ingresa tus datos para conectarte con tu universidad.
          </Text>

          {/* Selector de rol estilizado */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={[
                styles.roleCard,
                rol === 'estudiante' && styles.roleCardActive,
              ]}
              onPress={() => setRol('estudiante')}
            >
              <Text style={styles.roleIcon}>🎓</Text>
              <Text
                style={[
                  styles.roleTitle,
                  rol === 'estudiante' && styles.roleTitleActive,
                ]}
              >
                Estudiante
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={[
                styles.roleCard,
                rol === 'personal' && styles.roleCardActiveStaff,
              ]}
              onPress={() => setRol('personal')}
            >
              <Text style={styles.roleIcon}>🛠</Text>
              <Text
                style={[
                  styles.roleTitle,
                  rol === 'personal' && styles.roleTitleActiveStaff,
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>
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
            placeholder="Ej. Ana María López García"
            autoCapitalize="words"
          />
          <FormField
            label={rol === 'estudiante' ? 'Matrícula universitaria' : 'Código de personal'}
            value={matricula}
            onChangeText={setMatricula}
            error={errors.matricula}
            placeholder={rol === 'estudiante' ? 'A00123456' : 'P0001'}
            autoCapitalize="characters"
          />
          <FormField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="tu.correo@universidad.edu"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label={`Contraseña (mínimo ${LIMITS.passwordMin} caracteres)`}
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
            title="Crear mi cuenta"
            withArrow
            onPress={onSubmit}
            loading={loading}
            style={styles.submitButton}
          />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  logo: {
    height: 48,
    width: 168,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleCardActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  roleCardActiveStaff: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: 18,
  },
  roleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  roleTitleActive: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  roleTitleActiveStaff: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  submitButton: {
    marginTop: spacing.sm,
  },
  link: {
    marginTop: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  linkText: { fontSize: 14, color: colors.textMuted },
  linkBold: { color: colors.accentDark, fontWeight: '800' },
});
