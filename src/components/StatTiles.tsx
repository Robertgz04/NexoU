import AppIcon from './AppIcon';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export interface StatItem {
  icon: string;
  label: string;
  value: number | string;
  /** Color de acento del mosaico (por defecto azul marino). */
  color?: string;
  /** Fondo tenue del icono (por defecto el tenue del acento). */
  soft?: string;
}

interface Props {
  items: StatItem[];
  style?: ViewStyle;
  /**
   * 'stacked' = tarjeta única con icono arriba (listas);
   * 'inline' = tarjetas sueltas con icono a la izquierda (mockup de Inicio).
   */
  variant?: 'stacked' | 'inline';
}

/**
 * Fila de mosaicos de estadísticas (mockups de Inicio y Panel personal):
 * icono sobre fondo tenue + cifra + etiqueta dentro de una tarjeta blanca.
 */
export default function StatTiles({
  items,
  style,
  variant = 'stacked',
}: Props) {
  if (variant === 'inline') {
    return (
      <View style={[styles.row, style]}>
        {items.map(item => {
          const color = item.color ?? colors.primary;
          const soft = item.soft ?? colors.primarySoft;
          return (
            <View
              key={item.label}
              style={[styles.inlineCard, { backgroundColor: soft }]}
            >
              <View style={[styles.iconBox, { backgroundColor: soft }]}>
                <AppIcon name={item.icon} size={20} color={color} />
              </View>
              <View style={styles.inlineTexts}>
                <Text style={styles.value}>{item.value}</Text>
                <Text
                  style={[styles.label, styles.inlineLabel]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {items.map(item => {
        const color = item.color ?? colors.primary;
        const soft = item.soft ?? colors.primarySoft;
        return (
          <View key={item.label} style={styles.item}>
            <View style={[styles.iconBox, { backgroundColor: soft }]}>
              <AppIcon name={item.icon} size={20} color={color} />
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadow.card,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 17,
  },
  value: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...shadow.card,
  },
  inlineTexts: {
    flexShrink: 1,
  },
  inlineLabel: {
    textAlign: 'left',
  },
});
