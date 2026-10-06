import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SCREEN_BACKGROUNDS } from '../constants/backgrounds';
import { colors } from '../theme';

/** Header scrolls with its virtualized list; the sheet stays full width. */
export default function CampusListHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={styles.campus}>
        <Image
          source={SCREEN_BACKGROUNDS.login.source}
          resizeMode="stretch"
          accessible={false}
          style={styles.art}
        />
      </View>
      <View style={styles.sheet}>
        <Svg
          width="100%"
          height={50}
          viewBox="0 0 400 50"
          preserveAspectRatio="none"
          style={styles.curve}
          accessible={false}
          pointerEvents="none"
        >
          <Path
            d="M0 38 C105 -12 270 -12 400 38 L400 50 L0 50 Z"
            fill={colors.surface}
          />
        </Svg>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  campus: { height: 136, overflow: 'hidden' },
  art: { width: '100%', height: 136 / 0.32 },
  sheet: { backgroundColor: colors.surface },
  curve: { position: 'absolute', top: -49, left: 0, right: 0 },
});
