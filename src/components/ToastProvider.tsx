import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import { colors } from '../theme';

type Toast = {
  title: string;
  message?: string;
  kind?: 'success' | 'error' | 'info';
  action?: { label: string; onPress: () => void };
};
const ToastContext = createContext<(toast: Toast) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const show = useCallback((next: Toast) => {
    setToast({ ...next, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.action ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const tint = toast?.kind === 'error' ? colors.danger : colors.primary;
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.overlay, { top: insets.top + 12 }]}
        >
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.card, { borderLeftColor: tint }]}
          >
            <AppIcon
              name={
                toast.kind === 'error'
                  ? 'CircleAlert'
                  : toast.kind === 'info'
                  ? 'Bell'
                  : 'CircleCheck'
              }
              size={24}
              color={tint}
            />
            <View style={styles.body}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? (
                <Text style={styles.message}>{toast.message}</Text>
              ) : null}
              {toast.action ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setToast(null);
                    toast.action?.onPress();
                  }}
                  style={styles.action}
                >
                  <Text style={[styles.title, { color: tint }]}>
                    {toast.action.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar notificación"
              hitSlop={8}
              onPress={() => setToast(null)}
              style={styles.close}
            >
              <AppIcon name="X" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary },
  message: { fontSize: 14, lineHeight: 20, color: colors.text },
  action: { paddingVertical: 10, alignSelf: 'flex-start' },
  close: { padding: 4 },
});
