import useReducedMotion from '../hooks/useReducedMotion';
import AppIcon from '../components/AppIcon';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/student/HomeScreen';
import MyReportsScreen from '../screens/student/MyReportsScreen';
import NewReportScreen from '../screens/student/NewReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';
import type { StudentTabParamList } from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

/** Icono de pestaña con pastilla turquesa cuando está activa (mockup). */
function tabIcon(icon: string) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
      <AppIcon name={icon} size={26} color={color} />
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
    backgroundColor: 'transparent',
  },
});

/**
 * Navegación principal del estudiante. Las ondas del mockup ya vienen
 * dibujadas en el fondo de cada pantalla, por lo que la barra es opaca.
 */
export default function StudentTabs() {
  const reducedMotion = useReducedMotion();
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
          tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Inicio',
            tabBarLabel: 'Inicio',
            tabBarIcon: tabIcon('House'),
          }}
        />
        <Tab.Screen
          name="NewReport"
          component={NewReportScreen}
          options={{
            title: 'Nuevo reporte',
            tabBarLabel: 'Reportar',
            tabBarIcon: tabIcon('CirclePlus'),
          }}
        />
        <Tab.Screen
          name="MyReports"
          component={MyReportsScreen}
          options={{
            title: 'Mis reportes',
            tabBarLabel: 'Mis reportes',
            tabBarIcon: tabIcon('ClipboardList'),
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
