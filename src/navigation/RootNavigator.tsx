import React from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import FondoSplash from '../assets/NexoU_Fondo_Splash.png';
import Logo from '../assets/NexoU_Logo.png';
import { colors, spacing } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import StudentTabs from './StudentTabs';
import StaffTabs from './StaffTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navegación raíz (F01): decide qué árbol mostrar según la sesión y el rol.
 */
export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <ImageBackground source={FondoSplash} style={styles.splash}>
        <Image source={Logo} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.brand}>Reporta y da seguimiento</Text>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </ImageBackground>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800', color: colors.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name={user.rol === 'estudiante' ? 'StudentTabs' : 'StaffTabs'}
            component={user.rol === 'estudiante' ? StudentTabs : StaffTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
            options={{ title: 'Detalle del reporte' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 210,
    height: 68,
  },
  brand: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
