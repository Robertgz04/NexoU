import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
  /** Porcentaje que se muestra junto a la etiqueta (mockup). */
  percent: number;
}

interface Props {
  slices: DonutSlice[];
  /** Cifra grande del centro. */
  centerValue: string | number;
  centerLabel: string;
  size?: number;
  thickness?: number;
  surface?: string;
}

/** Resolución del anillo: barras más finas dan un arco más suave. */
const STEP_DEG = 2;

/**
 * Anillo de estados (mockup "Estado general" de Estadísticas).
 *
 * Se dibuja sin librerías de gráficas: el anillo se compone de barras
 * radiales muy finas (una cada 2°) coloreadas según el segmento al que
 * pertenece su ángulo. El contenedor recorta con su `borderRadius` y el
 * hueco central se tapa con un círculo del color de la tarjeta.
 */
export default function DonutChart({
  slices,
  centerValue,
  centerLabel,
  size = 128,
  thickness = 20,
  surface = colors.surface,
}: Props) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const barras: { key: string; deg: number; color: string }[] = [];

  if (total > 0) {
    // Acumulado en fracción del total (0–1) para saber a qué segmento
    // pertenece cada ángulo: los valores brutos no son ángulos.
    const limites: { hasta: number; color: string }[] = [];
    let acc = 0;
    slices.forEach(slice => {
      acc += slice.value;
      limites.push({ hasta: acc / total, color: slice.color });
    });

    const pasos = Math.round(360 / STEP_DEG);
    for (let i = 0; i < pasos; i += 1) {
      const centro = (i + 0.5) * STEP_DEG;
      // `centro` va de 0 a 360 en sentido horario desde las 12 en punto.
      const limite = limites.find(l => centro / 360 <= l.hasta);
      if (limite) {
        barras.push({ key: `b${i}`, deg: centro, color: limite.color });
      }
    }
  }

  const hole = size - thickness * 2;
  const spokeWidth = Math.max(size / 42, 2);

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.ring, { width: size, height: size }]}>
        {barras.map(barra => (
          <View
            key={barra.key}
            testID="donut-spoke"
            style={[
              styles.spoke,
              {
                width: spokeWidth,
                height: size / 2,
                left: '50%',
                marginLeft: -spokeWidth / 2,
                backgroundColor: barra.color,
                transform: [{ rotate: `${barra.deg}deg` }],
              },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.hole,
          {
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            top: thickness,
            left: thickness,
            backgroundColor: surface,
          },
        ]}
      >
        <Text style={styles.centerValue}>{centerValue}</Text>
        <Text style={styles.centerLabel} numberOfLines={1}>
          {centerLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  spoke: {
    position: 'absolute',
    top: 0,
    // El borde inferior de la barra queda en el centro del círculo, que es
    // el punto de rotación: así la barra barre el sector angular correcto.
    transformOrigin: 'bottom center',
  },
  hole: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.primary,
  },
  centerLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
