import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FondoHeader from '../assets/NexoU_Fondo_Header.png';
import Logo from '../assets/NexoU_Logo.png';
import { colors, shadow, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Muestra la banda ilustrada del campus detrás de la fila del logo. */
  withImage?: boolean;
  /** Banner alto a pantalla completa (mockups de Perfil y Nuevo reporte). */
  hero?: boolean;
  /** Centra logo, título y subtítulo (mockup de Nuevo reporte). */
  centered?: boolean;
  /** Al pulsarlo se muestra el botón circular de retroceso. */
  onBack?: () => void;
  /** Elemento a la derecha de la fila del logo (ej. botón de usuario). */
  right?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Encabezado compartido (mockups): banda de marca con el logo NexoU,
 * título grande en azul marino y subtítulo opcional.
 */
export default function ScreenHeader({
  title,
  subtitle,
  withImage = false,
  hero = false,
  centered = false,
  onBack,
  right,
  children,
}: Props) {
  const backButton = onBack ? (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver"
      activeOpacity={0.85}
      onPress={onBack}
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>←</Text>
    </TouchableOpacity>
  ) : null;

  const brand = (
    <Image source={Logo} style={styles.logo} resizeMode="contain" />
  );

  const showBanner = withImage || hero;

  if (hero) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ImageBackground
          source={FondoHeader}
          style={styles.heroBanner}
          imageStyle={styles.bannerImage}
        >
          <View style={styles.heroTopRow}>
            {backButton}
            {right ? <View>{right}</View> : null}
          </View>
          <View style={styles.heroBrand}>{brand}</View>
        </ImageBackground>
        <View
          style={[styles.titleBlock, centered && styles.titleBlockCentered]}
        >
          <Text
            style={[styles.title, centered && styles.titleCentered]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, centered && styles.subtitleCentered]}
            >
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>
      </SafeAreaView>
    );
  }

  const row = (
    <View style={styles.row}>
      {brand}
      {right ? <View>{right}</View> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {showBanner ? (
        <ImageBackground
          source={FondoHeader}
          style={styles.banner}
          imageStyle={styles.bannerImage}
        >
          {onBack ? <View style={styles.bannerBack}>{backButton}</View> : null}
          {row}
        </ImageBackground>
      ) : (
        <View style={styles.plainBanner}>
          {onBack ? <View style={styles.plainBack}>{backButton}</View> : null}
          {row}
        </View>
      )}
      <View style={[styles.titleBlock, centered && styles.titleBlockCentered]}>
        <Text
          style={[styles.title, centered && styles.titleCentered]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, centered && styles.subtitleCentered]}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
  },
  banner: {
    height: 96,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  bannerImage: {
    resizeMode: 'cover',
  },
  plainBanner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  bannerBack: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.sm,
    zIndex: 2,
  },
  plainBack: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.sm,
    zIndex: 2,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  heroBanner: {
    height: 300,
    width: '100%',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBrand: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 34,
    width: 132,
  },
  titleBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titleBlockCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 19,
    maxWidth: '85%',
  },
  subtitleCentered: {
    textAlign: 'center',
    maxWidth: '100%',
  },
});
