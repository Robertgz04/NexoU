import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MyReportsScreen from '../screens/student/MyReportsScreen';
import NewReportScreen from '../screens/student/NewReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {colors} from '../theme';
import type {StudentTabParamList} from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

function tabIcon(icon: string) {
  return ({color}: {color: string}) => (
    <Text style={[styles.tabIcon, {color}]}>{icon}</Text>
  );
}

const styles = StyleSheet.create({tabIcon: {fontSize: 18}});

/** Navegación principal del estudiante (bottom bar, ver Sprint 2). */
export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {fontWeight: '700'},
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {backgroundColor: colors.surface},
      }}>
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{title: 'Mis reportes', tabBarLabel: 'Reportes', tabBarIcon: tabIcon('📋')}}
      />
      <Tab.Screen
        name="NewReport"
        component={NewReportScreen}
        options={{title: 'Nuevo reporte', tabBarLabel: 'Nuevo', tabBarIcon: tabIcon('➕')}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Perfil', tabBarIcon: tabIcon('👤')}}
      />
    </Tab.Navigator>
  );
}
