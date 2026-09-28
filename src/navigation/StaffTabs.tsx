import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AllReportsScreen from '../screens/staff/AllReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {colors} from '../theme';
import type {StaffTabParamList} from './types';

const Tab = createBottomTabNavigator<StaffTabParamList>();

function tabIcon(icon: string) {
  return ({color}: {color: string}) => (
    <Text style={[styles.tabIcon, {color}]}>{icon}</Text>
  );
}

const styles = StyleSheet.create({tabIcon: {fontSize: 18}});

/** Panel del personal universitario (F07/F08). */
export default function StaffTabs() {
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
        name="AllReports"
        component={AllReportsScreen}
        options={{title: 'Panel de reportes', tabBarLabel: 'Reportes', tabBarIcon: tabIcon('📊')}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Perfil', tabBarIcon: tabIcon('👤')}}
      />
    </Tab.Navigator>
  );
}
