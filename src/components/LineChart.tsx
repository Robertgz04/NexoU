import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export interface LinePoint {
  label: string;
  value: number;
}

interface Props {
  data: LinePoint[];
  height?: number;
  color?: string;
  /** Número de divisiones de la rejilla (0, 5, 10, 15…). */
  gridLines?: number;
}

/**
 * Gráfica de línea con área (mockup "Actividad reciente" de Estadísticas).
 *
 * Se dibuja únicamente con Views: columnas con opacidad forman el área bajo
 * la curva, la rejilla horizontal da la escala y el último punto se marca
 * con un círculo. Así se evita depender de una librería de gráficas.
 */
export default function LineChart({
  data,
  height = 120,
  color = colors.accent,
  gridLines = 3,
}: Props) {
  const max = Math.max(...data.map(d => d.value), 1);
  const step = Math.ceil(max / gridLines);
  const top = step * gridLines;

  return (
    <View>
      <View style={styles.row}>
        {/* Escala vertical */}
        <View style={[styles.axis, { height }]}>
          {Array.from({ length: gridLines + 1 }).map((_, index) => (
            <Text key={`ax-${index}`} style={styles.axisLabel}>
              {top - step * index}
            </Text>
          ))}
        </View>

        {/* Área + rejilla */}
        <View style={[styles.plot, { height }]}>
          {Array.from({ length: gridLines + 1 }).map((_, index) => (
            <View
              key={`grid-${index}`}
              style={[styles.gridLine, { top: (index * height) / gridLines }]}
            />
          ))}

          <View style={styles.bars}>
            {data.map((point, index) => {
              const barHeight = Math.max((point.value / top) * height, 2);
              const isLast = index === data.length - 1;
              return (
                <View key={`${point.label}-${index}`} style={styles.slot}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: color,
                        opacity: isLast ? 1 : 0.2,
                      },
                    ]}
                  />
                  {isLast ? (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: color, bottom: barHeight - 5 },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Etiquetas de los días */}
      <View style={styles.days}>
        {data.map((point, index) => (
          <Text
            key={`${point.label}-lbl-${index}`}
            style={styles.dayLabel}
            numberOfLines={1}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  axis: {
    width: 20,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 9,
    color: colors.chartAxis,
    textAlign: 'left',
    marginTop: -6,
  },
  plot: {
    flex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.chartGrid,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  days: {
    flexDirection: 'row',
    marginTop: 6,
    paddingLeft: 20,
  },
  dayLabel: {
    flex: 1,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
