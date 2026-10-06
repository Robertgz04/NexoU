import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SectionList, Text } from 'react-native';
import NotificationsScreen from '../src/screens/staff/NotificationsScreen';
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
    tree = renderer.create(<NotificationsScreen />);
  });
}

function data() {
  return tree.root.findByType(SectionList).props.sections;
}
function filter(value: string) {
  act(() => tree.root.findByType(SegmentedControl).props.onChange(value));
}
test('agrupa fechas y ordena por actualización, no por creación', async () => {
  jest.setSystemTime(new Date('2026-10-06T18:00:00Z'));
  mockGetReports.mockResolvedValue([
    report,
    {
      ...report,
      id: 'new-update',
      updatedAt: '2026-10-06T17:00:00Z',
      createdAt: '2026-09-01T12:00:00Z',
      estado: 'revision',
    },
    { ...report, id: 'yesterday', updatedAt: '2026-10-05T12:00:00Z' },
    { ...report, id: 'old', updatedAt: '2026-10-01T12:00:00Z' },
  ]);
  await mount();
  expect(data().map((s: { title: string }) => s.title)).toEqual([
    'Hoy',
    'Ayer',
    'Anteriores',
  ]);
  expect(data()[0].data.map((n: { reportId: string }) => n.reportId)).toEqual([
    'new-update',
    'report-1',
  ]);
  const list = tree.root.findByType(SectionList);
  const row = list.props.renderItem({ item: data()[0].data[0] });
  act(() => row.props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', {
    reportId: 'new-update',
  });
  expect(data()[0].data[0].texto).not.toContain('equipo de mantenimiento');
});
test('filtros conservan su significado y el vacío permite ver todas', async () => {
  await mount();
  filter('estado');
  expect(data()).toEqual([]);
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'No hay avisos con este filtro',
  );
  act(() => tree.root.findByType(EmptyList).props.onAction());
  expect(data()[0].data).toHaveLength(1);
  filter('avisos');
  expect(data()[0].data[0].estado).toBe('pendiente');
});
test('fallo inicial no es vacío, reintento recupera y actualización conserva el filtro', async () => {
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await mount();
  expect(tree.root.findAllByType(EmptyList)).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        n =>
          n.props.children ===
          'No pudimos actualizar las notificaciones. Intenta de nuevo.',
      ),
  ).toBe(true);
  mockGetReports.mockResolvedValue([report]);
  await act(async () => {
    await tree.root
      .findByType(SectionList)
      .props.refreshControl.props.onRefresh();
  });
  filter('avisos');
  mockGetReports.mockRejectedValueOnce(new Error('Storage'));
  await act(async () => {
    await tree.root
      .findByType(SectionList)
      .props.refreshControl.props.onRefresh();
  });
  expect(data()[0].data[0].reportId).toBe(report.id);
  expect(tree.root.findByType(SegmentedControl).props.value).toBe('avisos');
  expect(
    tree.root.findByType(SectionList).props.refreshControl.props.refreshing,
  ).toBe(false);
});
test('repositorio vacío tiene un mensaje independiente', async () => {
  mockGetReports.mockResolvedValue([]);
  await mount();
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'Sin notificaciones',
  );
});
