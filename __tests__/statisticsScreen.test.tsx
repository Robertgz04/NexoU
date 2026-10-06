import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import StatisticsScreen from '../src/screens/staff/StatisticsScreen';
import LineChart from '../src/components/LineChart';
import DonutChart from '../src/components/DonutChart';
import CampusScrollScreen from '../src/components/CampusScrollScreen';
import SegmentedControl from '../src/components/SegmentedControl';
import MotionTouchable from '../src/components/MotionTouchable';
import EmptyList from '../src/components/EmptyList';
import type { Report } from '../src/types';

const mockNavigate = jest.fn();
const mockGetReports = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, []),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'student-1' } }),
}));
jest.mock('../src/data/reportRepository', () => ({
  getAllReports: (...args: unknown[]) => mockGetReports(...args),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));

const report: Report = {
  id: 'report-1',
  ownerId: 'student-1',
  ownerNombre: 'Ana López',
  titulo: 'Silla rota',
  descripcion: 'Una silla rota en biblioteca',
  area: 'Biblioteca',
  categoria: 'Mobiliario',
  estado: 'pendiente',
  photoBase64: null,
  createdAt: '2026-10-06T12:00:00Z',
  updatedAt: '2026-10-06T12:00:00Z',
};
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  jest.useFakeTimers();
  mockGetReports.mockResolvedValue([report]);
});
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});
async function mount() {
  await act(async () => {
    tree = renderer.create(<StatisticsScreen />);
  });
}

test('incluye reportes de hoy, excluye futuros y respeta periodos', async () => {
  jest.setSystemTime(new Date('2026-10-06T18:00:00Z'));
  mockGetReports.mockResolvedValue([
    report,
    { ...report, id: 'old', createdAt: '2026-08-01T12:00:00Z' },
    { ...report, id: 'future', createdAt: '2027-01-01T12:00:00Z' },
  ]);
  await mount();
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(1);
  expect(
    tree.root
      .findByType(LineChart)
      .props.data.reduce(
        (sum: number, p: { value: number }) => sum + p.value,
        0,
      ),
  ).toBe(1);
  act(() => tree.root.findByType(SegmentedControl).props.onChange('anio'));
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(2);
  act(() => tree.root.findByType(SegmentedControl).props.onChange('semana'));
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(1);
});
test('distingue fallo inicial y vacío y permite recuperar datos', async () => {
  jest.setSystemTime(new Date('2026-10-06T18:00:00Z'));
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await mount();
  expect(tree.root.findAllByType(EmptyList)).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        n =>
          n.props.children ===
          'No pudimos actualizar las estadísticas. Intenta de nuevo.',
      ),
  ).toBe(true);
  mockGetReports.mockResolvedValue([]);
  await act(async () => {
    await tree.root
      .findByType(CampusScrollScreen)
      .props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'Sin reportes en este periodo',
  );
});
test('fallo al actualizar conserva indicadores y periodo', async () => {
  jest.setSystemTime(new Date('2026-10-06T18:00:00Z'));
  await mount();
  act(() => tree.root.findByType(SegmentedControl).props.onChange('semana'));
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await act(async () => {
    await tree.root
      .findByType(CampusScrollScreen)
      .props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(DonutChart).props.centerValue).toBe(1);
  expect(tree.root.findByType(SegmentedControl).props.value).toBe('semana');
  expect(
    tree.root.findByType(CampusScrollScreen).props.refreshControl.props
      .refreshing,
  ).toBe(false);
});
