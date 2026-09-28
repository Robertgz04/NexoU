import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {colors, spacing} from '../theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import StudentTabs from './StudentTabs';
import StaffTabs from './StaffTabs';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navegación raíz (F01): decide qué árbol mostrar según la sesión y el rol.
 */
export default function RootNavigator() {
  const {user, initializing} = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>N</Text>
        <Text style={styles.brand}>NexoU</Text>
        <ActivityIndicator color={colors.textOnPrimary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: colors.background},
      }}>
      {user ? (
        <>
          <Stack.Screen
            name={user.rol === 'estudiante' ? 'StudentTabs' : 'StaffTabs'}
            component={user.rol === 'estudiante' ? StudentTabs : StaffTabs}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
            options={{title: 'Detalle del reporte'}}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{headerShown: false}}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
