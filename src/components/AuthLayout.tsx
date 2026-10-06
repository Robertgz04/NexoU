import TouchableOpacity from './MotionTouchable';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import Logo from '../assets/NexoU_Logo.png';
import { colors } from '../theme';

export default function AuthLayout({
  children,
  register = false,
  onBack,
}: {
  children: React.ReactNode;
  register?: boolean;
  onBack?: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingTop: height * 0.275,
            paddingBottom: Math.max(insets.bottom, 16) + 42,
          }}
        >
          <Image
            source={SCREEN_BACKGROUNDS[register ? 'register' : 'login'].source}
            style={[
              styles.background,
              { top: -height * 0.1, height: height * 1.1 },
            ]}
            resizeMode="stretch"
            pointerEvents="none"
          />
          <View style={styles.content}>
            <View style={[styles.logo, register && styles.registerLogo]}>
              <Image
                source={Logo}
                style={[styles.logoImage, register && styles.registerLogoImage]}
                resizeMode="contain"
                accessibilityLabel="NexoU"
              />
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {onBack && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver a iniciar sesión"
          onPress={onBack}
          style={[styles.back, { top: insets.top + 12 }]}
        >
          <ArrowLeft color={colors.primary} size={26} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  background: { position: 'absolute', left: 0, width: '100%' },
  root: { flex: 1, backgroundColor: '#F6FBFF' },
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  logo: { width: 264, height: 76, alignSelf: 'center', overflow: 'hidden' },
  registerLogo: { width: 224, height: 64 },
  logoImage: {
    position: 'absolute',
    width: 420,
    height: 140,
    left: -78,
    top: -31,
  },
  registerLogoImage: { width: 356, height: 119, left: -66, top: -26 },
  back: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
