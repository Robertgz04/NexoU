import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import {colors, radius, spacing} from '../theme';

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}

/** Perfil del usuario activo + cierre de sesión (compartido por ambos roles). */
export default function ProfileScreen() {
  const {user, logout} = useAuth();

  if (!user) {
    return null;
  }

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de NexoU?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Cerrar sesión', style: 'destructive', onPress: () => logout()},
    ]);
  };

  const rows: Array<{label: string; value: string}> = [
    {label: 'Correo', value: user.email},
    {
      label: user.rol === 'estudiante' ? 'Matrícula' : 'Código de personal',
      value: user.matricula,
    },
    {
      label: 'Rol',
      value: user.rol === 'estudiante' ? 'Estudiante' : 'Personal universitario',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(user.nombre)}</Text>
      </View>
      <Text style={styles.name}>{user.nombre}</Text>
      <View
        style={[
          styles.roleBadge,
          user.rol === 'personal' && {backgroundColor: colors.primarySoft},
        ]}>
        <Text
          style={[
            styles.roleText,
            user.rol === 'personal' && {color: colors.primaryDark},
          ]}>
          {user.rol === 'estudiante'
            ? '👁 Cuenta de estudiante'
            : '🛠 Cuenta de personal'}
        </Text>
      </View>

      <View style={styles.card}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.row, index > 0 && styles.rowBorder]}>
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

      <Text style={styles.version}>NexoU v0.1.0 · Desarrollo Móvil Integral</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: spacing.lg, alignItems: 'center'},
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  avatarText: {color: colors.textOnPrimary, fontSize: 30, fontWeight: '800'},
  name: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  roleText: {fontSize: 13.5, fontWeight: '700', color: '#15803D'},
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowBorder: {borderTopWidth: 1, borderTopColor: colors.border},
  rowLabel: {fontSize: 14, color: colors.textMuted, fontWeight: '600'},
  rowValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  logout: {width: '100%', marginTop: spacing.lg},
  version: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
