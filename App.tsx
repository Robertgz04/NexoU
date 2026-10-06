import PushListener from './src/components/PushListener';
/**
 * NexoU – Punto de entrada de la aplicación.
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';

function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <PushListener />
          <NavigationContainer ref={navigationRef}>
            <StatusBar barStyle="light-content" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

export default App;
