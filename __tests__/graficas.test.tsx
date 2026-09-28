/**
 * Pruebas de los componentes de gráficas y del control segmentado.
 * Verifican que renderizan sin errores y que reacting a las interacciones.
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import DonutChart from '../src/components/DonutChart';
import LineChart from '../src/components/LineChart';
import SegmentedControl from '../src/components/SegmentedControl';
import { colors } from '../src/theme';

const slices = [
  { value: 12, color: '#F59E0B', label: 'Pendiente', percent: 27 },
  { value: 8, color: '#3B82F6', label: 'En revisión', percent: 18 },
  { value: 24, color: '#10B981', label: 'Solucionado', percent: 55 },
];

describe('DonutChart', () => {
  it('renderiza el total y la etiqueta del centro', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DonutChart slices={slices} centerValue={44} centerLabel="reportes" />,
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('44');
    expect(json).toContain('reportes');
  });

  it('dibuja una barra radial por cada segmento angular', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DonutChart slices={slices} centerValue={44} centerLabel="reportes" />,
      );
    });

    // 360° / 2° = 180 barras, repartidas entre los tres estados.
    // Se cuentan sólo los elementos nativos (el `View` compuesto aparece
    // dos veces: como componente y como elemento host).
    const barras = tree.root
      .findAllByProps({ testID: 'donut-spoke' })
      .filter(n => typeof n.type === 'string');
    expect(barras.length).toBe(180);
  });

  it('no dibuja barras cuando no hay reportes', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DonutChart slices={[]} centerValue={0} centerLabel="reportes" />,
      );
    });

    expect(tree.root.findAllByProps({ testID: 'donut-spoke' }).length).toBe(0);
    expect(JSON.stringify(tree.toJSON())).toContain('reportes');
  });
});

describe('LineChart', () => {
  const data = [
    { label: '16 abr', value: 2 },
    { label: '17 abr', value: 4 },
    { label: '18 abr', value: 7 },
    { label: '19 abr', value: 5 },
    { label: '20 abr', value: 6 },
    { label: '21 abr', value: 9 },
    { label: '22 abr', value: 11 },
  ];

  it('muestra una etiqueta por cada día de la serie', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<LineChart data={data} />);
    });

    const json = JSON.stringify(tree.toJSON());
    data.forEach(point => {
      expect(json).toContain(point.label);
    });
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'anio', label: 'Año' },
  ];

  it('marca la opción activa y notifica el cambio', () => {
    const onChange = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SegmentedControl
          options={options}
          value="mes"
          onChange={onChange}
          testID="periodo"
        />,
      );
    });

    const activa = tree.root
      .findAllByType('Text' as never)
      .find(n => (n.props as { children?: string }).children === 'Mes');

    expect(activa).toBeDefined();
    expect((activa!.props as { style?: unknown }).style).toBeDefined();

    const semana = tree.root.findByProps({ testID: 'periodo-semana' });
    act(() => {
      (semana.props as { onPress: () => void }).onPress();
    });

    expect(onChange).toHaveBeenCalledWith('semana');
  });
});

describe('tema', () => {
  it('expone un color por cada categoría del catálogo', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CATEGORY_COLORS, CATEGORY_ICONS } = require('../src/theme');
    [
      'Mobiliario',
      'Electricidad',
      'Agua',
      'Limpieza',
      'Equipos',
      'Otros',
    ].forEach(categoria => {
      expect(CATEGORY_COLORS[categoria]).toBeDefined();
      expect(CATEGORY_ICONS[categoria]).toBeDefined();
    });
    expect(colors.accent).toBe('#14B3A0');
  });
});
