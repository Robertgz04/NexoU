import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import useReducedMotion from '../hooks/useReducedMotion';
import { colors, spacing } from '../theme';

interface Props {
  source: ImageSourcePropType;
  /** Fraction of the asset occupied by the campus, measured for each image. */
  campusRatio: number;
  campusHeight: number;
  children: React.ReactNode;
  keyboard?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
}

/** Full-width campus and curved sheet driven by one native scroll signal. */
export default function CampusScrollScreen({
  source,
  campusRatio,
  campusHeight,
  children,
  keyboard = false,
  refreshControl,
}: Props) {
  const { height } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(height);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollY = useRef(new Animated.Value(0)).current;
  const collapseDistance = Math.max(1, campusHeight - insets.top);
  const curveScale = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [1, 0.01],
    extrapolate: 'clamp',
  });
  const opacity = scrollY.interpolate({
    inputRange: [0, collapseDistance * 0.8, collapseDistance],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.root}
      onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <StatusBar barStyle="dark-content" />
      <Animated.Image
        source={source}
        accessible={false}
        pointerEvents="none"
        resizeMode="stretch"
        style={[
          styles.art,
          {
            height: campusHeight / Math.max(0.01, campusRatio),
            transform: [
              {
                translateY: reducedMotion
                  ? 0
                  : scrollY.interpolate({
                      inputRange: [0, collapseDistance],
                      outputRange: [0, -24],
                      extrapolate: 'clamp',
                    }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.white, { opacity }]}
      />
      <KeyboardAvoidingView
        style={[styles.root, styles.transparent, { marginTop: insets.top }]}
        enabled={keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={refreshControl}
          scrollEventThrottle={16}
          decelerationRate="normal"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          <View style={{ height: collapseDistance }} />
          <View style={styles.sheet}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.curve,
                {
                  transform: reducedMotion
                    ? []
                    : [
                        {
                          translateY: Animated.multiply(
                            Animated.subtract(1, curveScale),
                            25,
                          ),
                        },
                        { scaleY: curveScale },
                      ],
                },
              ]}
            >
              <Svg
                width="100%"
                height={50}
                viewBox="0 0 400 50"
                preserveAspectRatio="none"
                accessible={false}
              >
                <Path
                  d="M0 38 C105 -12 270 -12 400 38 L400 50 L0 50 Z"
                  fill={colors.surface}
                />
              </Svg>
            </Animated.View>
            <View
              style={[
                styles.content,
                {
                  minHeight: viewportHeight - insets.top,
                  paddingBottom: spacing.xl + 20 + insets.bottom,
                },
              ]}
            >
              {children}
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  transparent: { backgroundColor: 'transparent' },
  art: { position: 'absolute', top: 0, left: 0, width: '100%' },
  white: { backgroundColor: colors.surface },
  sheet: { backgroundColor: colors.surface },
  curve: { position: 'absolute', top: -49, left: 0, right: 0 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
});
