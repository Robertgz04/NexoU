import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
/** Interruptible, native spring feedback shared by app controls. */
export default function MotionTouchable({
  style,
  onPressIn,
  onPressOut,
  ...props
}: TouchableOpacityProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const animate = (value: number) => {
    scale.stopAnimation();
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: value,
      stiffness: 420,
      damping: 32,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };
  return (
    <AnimatedTouchable
      {...props}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={event => {
        animate(0.975);
        onPressIn?.(event);
      }}
      onPressOut={event => {
        animate(1);
        onPressOut?.(event);
      }}
    />
  );
}
