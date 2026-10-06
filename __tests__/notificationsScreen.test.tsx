import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SectionList } from 'react-native';
import NotificationsScreen from '../src/screens/staff/NotificationsScreen';
import SegmentedControl from '../src/components/SegmentedControl';
const mockNotices = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/data/reportRepository', () => ({
  getNotices: (...args: unknown[]) => mockNotices(...args),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
const notice = {
  id: 'r1',
  reportId: 'r1',
  folio: 'NX-1',
  titulo: 'Silla',
  ownerNombre: 'Ana',
  area: 'Biblioteca',
  estado: 'pendiente',
  tipo: 'aviso',
  occurredAt: '2026-10-06T12:00:00Z',
};
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});
test('consulta avisos actuales paginados y filtra en servidor', async () => {
  mockNotices.mockResolvedValue({
    items: [notice],
    nextCursor: 'next',
    total: 101,
  });
  await act(async () => {
    tree = renderer.create(<NotificationsScreen />);
  });
  expect(mockNotices).toHaveBeenCalledWith({ tipo: 'todas' });
  mockNotices.mockResolvedValueOnce({
    items: [{ ...notice, id: 'r2', reportId: 'r2' }],
    nextCursor: null,
    total: 101,
  });
  await act(async () => {
    await tree.root.findByType(SectionList).props.onEndReached();
  });
  expect(
    tree.root
      .findByType(SectionList)
      .props.sections.flatMap((s: { data: unknown[] }) => s.data),
  ).toHaveLength(2);
  mockNotices.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
  await act(async () => {
    tree.root.findByType(SegmentedControl).props.onChange('estado');
  });
  expect(mockNotices).toHaveBeenLastCalledWith({ tipo: 'estado' });
});
