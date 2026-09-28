import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Logo from '../assets/NexoU_Logo.png';
import { spacing } from '../theme';

interface Props {
  /** Elemento a la derecha de la fila (avatar, botón de usuario). */
  right?: React.ReactNode;
  /** Elemento a la izquierda, sustituye al logo cuando se indica. */
  left?: React.ReactNode;
}

/**
 * Fila de marca del encabezado (mockups): logo NexoU a la izquierda y, cuando
 * la pantalla lo requiere, un avatar o botón circular a la derecha. Se dibuja
 * sobre la ilustración del campus mediante `ScreenBackground.overArt`.
 */
export default function BrandRow({ right, left }: Props) {
  return (
    <View style={styles.row}>
      {left ?? <Image source={Logo} style={styles.logo} resizeMode="contain" />}
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 34,
    width: 132,
    marginLeft: -spacing.xs,
  },
});
