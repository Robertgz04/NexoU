import useReducedMotion from '../hooks/useReducedMotion';
import AppIcon from '../components/AppIcon';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AllReportsScreen from '../screens/staff/AllReportsScreen';
import NotificationsScreen from '../screens/staff/NotificationsScreen';
import StatisticsScreen from '../screens/staff/StatisticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { getAllReports } from '../data/reportRepository';
import { colors, shadow, spacing } from '../theme';
import type { StaffTabParamList } from './types';

const Tab = createBottomTabNavigator<StaffTabParamList>();

/** Icono de pestaña con pastilla turquesa cuando está activa (mockup). */
function tabIcon(icon: string) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
      <AppIcon name={icon} size={26} color={color} />
    </View>
  );
}

/** Icono de Notificaciones con contador de reportes pendientes (mockup). */
function notificationIcon(badge: number) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View>
      <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
        <AppIcon name="Bell" size={26} color={color} />
      </View>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  tabIcon: { fontSize: 16 },
  tabIconBox: {
    width: 46,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: colors.accentSoft,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});

/**
 * Panel del personal universitario (F07–F10). Las ondas del mockup ya vienen
 * dibujadas en el fondo de cada pantalla, por lo que la barra es opaca.
 */
export default function StaffTabs() {
  const reducedMotion = useReducedMotion();
  const [pendientes, setPendientes] = useState(0);

  const load = useCallback(async () => {
    const reports = await getAllReports();
    setPendientes(reports.filter(r => r.estado === 'pendiente').length);
  }, []);

  // El contador se refresca cada vez que el panel vuelve al primer plano.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          animation: reducedMotion ? 'none' : 'fade',
          transitionSpec: { animation: 'timing', config: { duration: 180 } },
          tabBarActiveTintColor: colors.accentDark,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
          tabBarItemStyle: { paddingVertical: spacing.xs },
        }}
      >
        <Tab.Screen
          name="AllReports"
          component={AllReportsScreen}
          options={{
            title: 'Panel de reportes',
            tabBarLabel: 'Reportes',
            tabBarIcon: tabIcon('LayoutDashboard'),
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            title: 'Estadísticas',
            tabBarLabel: 'Estadísticas',
            tabBarIcon: tabIcon('ChartColumn'),
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'Notificaciones',
            tabBarLabel: 'Notificaciones',
            tabBarIcon: notificationIcon(pendientes),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Perfil',
            tabBarLabel: 'Perfil',
            tabBarIcon: tabIcon('UserRound'),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
