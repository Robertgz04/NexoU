import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radius, shadow, spacing } from '../theme';

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}

/** Perfil del usuario activo + cierre de sesión (compartido por ambos roles). */
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de NexoU?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Correo', value: user.email },
    {
      label: user.rol === 'estudiante' ? 'Matrícula' : 'Código de personal',
      value: user.matricula,
    },
    {
      label: 'Rol',
      value:
        user.rol === 'estudiante' ? 'Estudiante' : 'Personal universitario',
    },
  ];

  return (
    <View style={styles.root}>
      <ScreenHeader withImage title="Mi perfil" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.nombre)}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user.nombre}</Text>
        <View
          style={[
            styles.roleBadge,
            user.rol === 'personal' && { backgroundColor: colors.primarySoft },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              user.rol === 'personal' && { color: colors.primaryDark },
            ]}
          >
            {user.rol === 'estudiante' ? '🎓 Estudiante' : '🛠 Personal'}
          </Text>
        </View>

        <View style={styles.card}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          title="Cerrar sesión"
          variant="danger"
          onPress={confirmLogout}
          style={styles.logout}
        />

        <Text style={styles.version}>
          NexoU v0.1.0 · Desarrollo Móvil Integral
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadow.card,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textOnPrimary, fontSize: 30, fontWeight: '800' },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  roleText: { fontSize: 13.5, fontWeight: '700', color: colors.accentDark },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  rowValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  logout: { width: '100%', marginTop: spacing.lg },
  version: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
