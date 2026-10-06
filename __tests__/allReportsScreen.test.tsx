import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FlatList, Text } from 'react-native';
import AllReportsScreen from '../src/screens/staff/AllReportsScreen';
import MotionTouchable from '../src/components/MotionTouchable';
import SelectField from '../src/components/SelectField';
const mockPage = jest.fn(),
  mockSummary = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'staff' } }),
}));
jest.mock('../src/data/reportRepository', () => ({
  getReportPage: (...args: unknown[]) => mockPage(...args),
  getSummary: (...args: unknown[]) => mockSummary(...args),
  getCatalogs: jest
    .fn()
    .mockResolvedValue({ areas: [{ nombre: 'Biblioteca' }] }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
const report = {
  id: 'r1',
  folio: 'NX-100',
  ownerId: 'u1',
  ownerNombre: 'Ana',
  titulo: 'Silla',
  descripcion: 'Rota',
  area: 'Biblioteca',
  categoria: 'Mobiliario',
  estado: 'pendiente',
  evidenceUrl: null,
  createdAt: '2026-10-06T12:00:00Z',
  updatedAt: '2026-10-06T12:00:00Z',
};
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  mockPage.mockResolvedValue({
    items: [report],
    nextCursor: 'next',
    total: 101,
  });
  mockSummary.mockResolvedValue({
    total: 101,
    pendiente: 100,
    revision: 1,
    solucionado: 0,
  });
});
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});
async function mount() {
  await act(async () => {
    tree = renderer.create(<AllReportsScreen />);
  });
}
test('badges usan conteo completo y filtros se consultan en servidor', async () => {
  await mount();
  expect(
    tree.root
      .findAllByType(MotionTouchable)
      .some(n => n.props.accessibilityLabel === 'Pendiente, 100 reportes'),
  ).toBe(true);
  mockPage.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
  await act(async () => {
    tree.root.findByType(SelectField).props.onSelect('Biblioteca');
  });
  expect(mockPage).toHaveBeenLastCalledWith({ area: 'Biblioteca' });
  expect(tree.root.findByType(FlatList).props.data).toEqual([]);
});
test('carga la siguiente página sin repetir filas y conserva datos ante fallo', async () => {
  await mount();
  mockPage.mockResolvedValueOnce({
    items: [report, { ...report, id: 'r2' }],
    nextCursor: null,
    total: 101,
  });
  await act(async () => {
    await tree.root.findByType(FlatList).props.onEndReached();
  });
  expect(tree.root.findByType(FlatList).props.data).toHaveLength(2);
  mockPage.mockRejectedValueOnce(new Error('Sin red'));
  await act(async () => {
    await tree.root.findByType(FlatList).props.refreshControl.props.onRefresh();
  });
  expect(tree.root.findByType(FlatList).props.data).toHaveLength(2);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        n =>
          n.props.children ===
          'No pudimos actualizar los reportes. Intenta de nuevo.',
      ),
  ).toBe(true);
});
