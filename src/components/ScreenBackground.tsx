import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  /** Imagen vertical a pantalla completa (campus + cuerpo claro + ondas). */
  source: ImageSourcePropType;
  /** Fracción del alto donde termina la ilustración del campus. */
  artBottom: number;
  /** Use stretch for full-screen artwork whose vertical boundary is known. */
  resizeMode?: 'cover' | 'stretch';
  /** Envuelve el contenido en una hoja blanca con esquinas superiores redondeadas. */
  sheet?: boolean;
  /** Curved campus transition with an opaque surface for readable content. */
  curvedSheet?: boolean;
  /** Contenido que se dibuja sobre la ilustración (fila del logo, botón de vuelta). */
  overArt?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Fondo a pantalla completa de los mockups. La imagen cubre todo el contenedor
 * con `cover`, de modo que las proporciones verticales del mockup se conservan
 * y el contenido puede desplazarse por encima de ella.
 *
 * `artBottom` se expresa como fracción del alto real del contenedor (no del
 * ventana) para que el punto de corte entre la ilustración y el cuerpo claro
 * coincida con el mockup tanto en pantallas con barra de pestañas como sin ella.
 *
 * `overArt` se superpone a la ilustración respetando el área segura superior,
 * que es donde los mockups colocan el logo, el avatar y el botón de retroceso.
 */
export default function ScreenBackground({
  source,
  artBottom,
  sheet = false,
  curvedSheet = false,
  resizeMode = 'cover',
  overArt,
  children,
}: Props) {
  const [height, setHeight] = useState(0);
  const insets = useSafeAreaInsets();

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeight(prev => (Math.abs(prev - next) > 1 ? next : prev));
  };

  const artOffset = Math.round(height * artBottom);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode={resizeMode}
        pointerEvents="none"
      />
      {overArt ? (
        <View
          style={[styles.overArt, { paddingTop: insets.top + spacing.sm }]}
          pointerEvents="box-none"
        >
          {overArt}
        </View>
      ) : null}
      {sheet ? (
        <View
          style={[
            styles.sheet,
            curvedSheet && styles.curvedSheet,
            { marginTop: artOffset },
            height === 0 && styles.hidden,
          ]}
        >
          {curvedSheet ? (
            <Svg
              width="100%"
              height={50}
              viewBox="0 0 400 50"
              preserveAspectRatio="none"
              style={styles.sheetCurve}
              pointerEvents="none"
              accessible={false}
            >
              <Path
                d="M0 38 C105 -12 270 -12 400 38 L400 50 L0 50 Z"
                fill={colors.surface}
              />
            </Svg>
          ) : null}
          {children}
        </View>
      ) : (
        <View
          style={[
            styles.body,
            { paddingTop: artOffset },
            height === 0 && styles.hidden,
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hidden: {
    opacity: 0,
  },
  overArt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  body: {
    flex: 1,
  },
  curvedSheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  sheetCurve: {
    position: 'absolute',
    top: -49,
    left: 0,
    right: 0,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.floating,
  },
});
