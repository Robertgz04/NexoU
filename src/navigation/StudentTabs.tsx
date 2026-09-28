import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
      <Text style={[styles.tabIcon, { color }]}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

/** Navegación principal del estudiante (bottom bar, ver Sprint 2). */
export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{
          title: 'Mis reportes',
          tabBarLabel: 'Reportes',
          tabBarIcon: tabIcon('📋'),
        }}
      />
      <Tab.Screen
        name="NewReport"
        component={NewReportScreen}
        options={{
          title: 'Nuevo reporte',
          tabBarLabel: 'Reportar',
          tabBarIcon: tabIcon('＋'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarIcon: tabIcon('👤') }}
      />
    </Tab.Navigator>
  );
}
