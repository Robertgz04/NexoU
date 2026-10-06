import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FlatList, Text } from 'react-native';
import MyReportsScreen from '../src/screens/student/MyReportsScreen';
import ReportHistoryCard from '../src/components/ReportHistoryCard';
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
  getReportsByOwner: (...args: unknown[]) => mockGetReports(...args),
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
    tree = renderer.create(<MyReportsScreen />);
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

test('consulta al propietario, filtra y permite recuperar el historial vacío', async () => {
  await mount();
  expect(mockGetReports).toHaveBeenCalledWith('student-1');
  select('En revisión, 0 reportes');
  expect(tree.root.findByType(FlatList).props.data).toEqual([]);
  const empty = tree.root.findByType(EmptyList);
  expect(empty.props.actionLabel).toBe('Ver todos los reportes');
  act(() => empty.props.onAction());
  expect(tree.root.findByType(FlatList).props.data).toEqual([report]);
});

test('expandir la nota no abre detalle y actualizar conserva el filtro', async () => {
  await mount();
  select('Pendiente, 1 reportes');
  act(() => tree.root.findByType(ReportHistoryCard).props.onToggleNote());
  expect(tree.root.findByType(ReportHistoryCard).props.expanded).toBe(true);
  expect(mockNavigate).not.toHaveBeenCalled();
  await act(async () => {
    await tree.root.findByType(FlatList).props.refreshControl.props.onRefresh();
  });
  expect(
    tree.root
      .findAllByType(MotionTouchable)
      .find(node => node.props.accessibilityLabel === 'Pendiente, 1 reportes')!
      .props.accessibilityState.selected,
  ).toBe(true);
  act(() => tree.root.findByType(ReportHistoryCard).props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', {
    reportId: 'report-1',
  });
});

test('no confunde una carga fallida con un historial sin reportes', async () => {
  mockGetReports.mockRejectedValue(new Error('Sin conexión'));
  await mount();
  expect(tree.root.findAllByType(EmptyList)).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No pudimos actualizar tus reportes. Intenta de nuevo.',
      ),
  ).toBe(true);
  expect(
    tree.root.findByType(FlatList).props.refreshControl.props.refreshing,
  ).toBe(false);
  mockGetReports.mockResolvedValue([report]);
  const retry = tree.root
    .findAllByType(MotionTouchable)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Reintentar'),
    )!;
  await act(async () => {
    await retry.props.onPress();
  });
  expect(tree.root.findByType(FlatList).props.data).toEqual([report]);
});
