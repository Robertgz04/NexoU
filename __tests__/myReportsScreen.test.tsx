import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FlatList } from 'react-native';
import MyReportsScreen from '../src/screens/student/MyReportsScreen';
import MotionTouchable from '../src/components/MotionTouchable';
import EmptyList from '../src/components/EmptyList';
const mockPage = jest.fn(),
  mockSummary = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../src/data/reportRepository', () => ({
  getReportPage: (...args: unknown[]) => mockPage(...args),
  getSummary: (...args: unknown[]) => mockSummary(...args),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});
test('consulta solo propios; un filtro vacío conserva la opción de volver a todos', async () => {
  mockPage.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
  mockSummary.mockResolvedValue({
    total: 100,
    pendiente: 100,
    revision: 0,
    solucionado: 0,
  });
  await act(async () => {
    tree = renderer.create(<MyReportsScreen />);
  });
  expect(mockPage).toHaveBeenCalledWith({ own: true });
  expect(mockSummary).toHaveBeenCalledWith(true);
  await act(async () => {
    tree.root
      .findAllByType(MotionTouchable)
      .find(n => n.props.accessibilityLabel === 'En revisión, 0 reportes')!
      .props.onPress();
  });
  expect(mockPage).toHaveBeenLastCalledWith({ own: true, estado: 'revision' });
  expect(tree.root.findByType(FlatList).props.data).toEqual([]);
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'No hay reportes con este estado',
  );
});
