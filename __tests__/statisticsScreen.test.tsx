import React from 'react';
import renderer, { act } from 'react-test-renderer';
import StatisticsScreen from '../src/screens/staff/StatisticsScreen';
import SegmentedControl from '../src/components/SegmentedControl';
import DonutChart from '../src/components/DonutChart';
import LineChart from '../src/components/LineChart';
import CampusScrollScreen from '../src/components/CampusScrollScreen';
const mockStats = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/data/reportRepository', () => ({
  getStatistics: (...args: unknown[]) => mockStats(...args),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
const data = {
  periodo: 'mes',
  asOf: '2026-10-06T18:00:00Z',
  total: 100,
  counts: { pendiente: 70, revision: 20, solucionado: 10 },
  categories: [{ categoria: 'Mobiliario', value: 100 }],
  areaTop: { area: 'Biblioteca', total: 100, categoria: 'Mobiliario' },
  serie: Array.from({ length: 7 }, (_, i) => ({ label: String(i), value: i })),
};
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});
test('usa agregados remotos; recarga periodo y conserva indicadores ante fallo', async () => {
  mockStats.mockResolvedValue(data);
  await act(async () => {
    tree = renderer.create(<StatisticsScreen />);
  });
  expect(mockStats).toHaveBeenCalledWith('mes');
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(100);
  expect(tree.root.findByType(LineChart).props.data).toEqual(data.serie);
  mockStats.mockResolvedValue({ ...data, periodo: 'semana', total: 40 });
  await act(async () => {
    tree.root.findByType(SegmentedControl).props.onChange('semana');
  });
  expect(mockStats).toHaveBeenLastCalledWith('semana');
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(40);
  mockStats.mockRejectedValueOnce(new Error('Sin red'));
  await act(async () => {
    await tree.root
      .findByType(CampusScrollScreen)
      .props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(40);
  expect(tree.root.findByType(SegmentedControl).props.value).toBe('semana');
});
