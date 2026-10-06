import { PreferencesContext } from '../context/PreferencesState';
import { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
export default function useReducedMotion() {
  const preferences = useContext(PreferencesContext);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced || (preferences?.preferences.reduceMotion ?? false);
}
