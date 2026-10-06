import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FlatList, Text } from 'react-native';
import AllReportsScreen from '../src/screens/staff/AllReportsScreen';
import ReportCard from '../src/components/ReportCard';
import SelectField from '../src/components/SelectField';
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
    tree = renderer.create(<AllReportsScreen />);
  });
}
function select(label: string) {
  act(() =>
    tree.root
      .findAllByType(MotionTouchable)
      .find(node => node.props.accessibilityLabel === label)!
      .props.onPress(),
  );
}

test('combina estado y área, limpia filtros y abre el detalle correcto', async () => {
  mockGetReports.mockResolvedValue([
    report,
    { ...report, id: 'report-2', area: 'Edificio A', estado: 'revision' },
  ]);
  await mount();
  select('Pendiente, 1 reportes');
  act(() => tree.root.findByType(SelectField).props.onSelect('Edificio A'));
  expect(tree.root.findByType(FlatList).props.data).toEqual([]);
  act(() => tree.root.findByType(EmptyList).props.onAction());
  expect(tree.root.findByType(FlatList).props.data).toHaveLength(2);
  act(() => tree.root.findAllByType(ReportCard)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', {
    reportId: 'report-1',
  });
});

test('un fallo inicial permite reintentar sin mostrar un falso vacío', async () => {
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await mount();
  expect(tree.root.findAllByType(EmptyList)).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        n =>
          n.props.children ===
          'No pudimos actualizar los reportes. Intenta de nuevo.',
      ),
  ).toBe(true);
  mockGetReports.mockResolvedValue([report]);
  await act(async () => {
    await tree.root.findByType(FlatList).props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(FlatList).props.data).toEqual([report]);
});

test('actualización fallida conserva datos y filtros y termina la carga', async () => {
  await mount();
  select('Pendiente, 1 reportes');
  act(() => tree.root.findByType(SelectField).props.onSelect('Biblioteca'));
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await act(async () => {
    await tree.root.findByType(FlatList).props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(FlatList).props.data).toEqual([report]);
  expect(tree.root.findByType(SelectField).props.value).toBe('Biblioteca');
  expect(
    tree.root.findByType(FlatList).props.refreshControl.props.refreshing,
  ).toBe(false);
});

test('repositorio vacío tiene un mensaje propio', async () => {
  mockGetReports.mockResolvedValue([]);
  await mount();
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'Sin reportes registrados',
  );
});
