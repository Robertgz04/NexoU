import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { validateEmail, validateRequired } from '../utils/validators';
import { colors, radius, spacing } from '../theme';

export default function PersonalDataScreen() {
  const { user, updatePersonalData } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [matricula, setMatricula] = useState(user?.matricula ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lock = useRef(false);
  const cleanEmail = email.trim().toLowerCase();
  const emailChanged = cleanEmail !== user?.email;
  const dirty =
    !!user &&
    (nombre.trim() !== user.nombre ||
      matricula.trim() !== user.matricula ||
      emailChanged);
  usePreventRemove(dirty || saving, ({ data }) => {
    if (lock.current) return;
    Alert.alert('¿Descartar cambios?', 'Los cambios sin guardar se perderán.', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const submit = async () => {
    if (!user || lock.current) return;
    const next = {
      nombre: validateRequired(nombre, 'nombre'),
      matricula: validateRequired(
        matricula,
        user.rol === 'estudiante' ? 'matrícula' : 'código',
      ),
      email: validateEmail(email),
      password: emailChanged
        ? validateRequired(password, 'contraseña actual')
        : null,
    };
    setErrors(next);
    setSaved(false);
    if (Object.values(next).some(Boolean)) return;
    lock.current = true;
    setSaving(true);
    try {
      await updatePersonalData({
        nombre,
        matricula,
        email: cleanEmail,
        currentPassword: emailChanged ? password : undefined,
      });
      setNombre(nombre.trim());
      setMatricula(matricula.trim());
      setEmail(cleanEmail);
      setPassword('');
      setSaved(true);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'No se pudieron guardar los datos. Intenta de nuevo.',
      });
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const clear = (key: string) => {
    setErrors(prev => ({ ...prev, [key]: null, submit: null }));
    setSaved(false);
  };
  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + 20 + insets.bottom },
        ]}
      >
        <Text accessibilityRole="header" style={styles.title}>
          Tu información
        </Text>
        <Text style={styles.intro}>
          Consulta tus datos y mantén actualizada la información de tu cuenta.
        </Text>
        <View style={styles.role}>
          <Text style={styles.label}>Rol de la cuenta</Text>
          <Text style={styles.roleValue}>
            {user.rol === 'estudiante'
              ? 'Estudiante'
              : 'Personal universitario'}
          </Text>
        </View>
        <View pointerEvents={saving ? 'none' : 'auto'} style={styles.form}>
          <FormField
            editable={!saving}
            label="Nombre completo"
            value={nombre}
            onChangeText={value => {
              setNombre(value);
              clear('nombre');
            }}
            error={errors.nombre}
            autoCapitalize="words"
          />
          <FormField
            editable={!saving}
            label={user.rol === 'estudiante' ? 'Matrícula' : 'Código'}
            value={matricula}
            onChangeText={value => {
              setMatricula(value);
              clear('matricula');
            }}
            error={errors.matricula}
            autoCapitalize="characters"
          />
          <FormField
            editable={!saving}
            label="Correo electrónico"
            value={email}
            onChangeText={value => {
              setEmail(value);
              clear('email');
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.help}>
            Este correo se utiliza para iniciar sesión.
          </Text>
          {emailChanged ? (
            <View style={styles.password}>
              <Text style={styles.passwordHelp}>
                Para cambiar el correo, confirma tu contraseña actual. Después
                podrás iniciar sesión con el nuevo correo y la misma contraseña.
              </Text>
              <FormField
                editable={!saving}
                label="Contraseña actual"
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  clear('password');
                }}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          ) : null}
        </View>
        {errors.submit ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errors.submit}
          </Text>
        ) : null}
        {saved ? (
          <Text accessibilityLiveRegion="polite" style={styles.success}>
            Tus datos se guardaron correctamente.
          </Text>
        ) : null}
        <PrimaryButton
          title="Guardar cambios"
          onPress={submit}
          loading={saving}
          disabled={!dirty}
          style={styles.save}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  role: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  label: { fontSize: 14, color: colors.text },
  roleValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  form: { marginTop: spacing.lg },
  help: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginTop: -spacing.sm,
  },
  password: { marginTop: spacing.lg },
  passwordHelp: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    marginBottom: spacing.md,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.danger,
    marginTop: spacing.md,
  },
  success: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.primary,
    marginTop: spacing.md,
  },
  save: { marginTop: spacing.lg, borderRadius: radius.xl },
});
