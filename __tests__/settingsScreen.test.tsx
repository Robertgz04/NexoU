jest.mock('../src/services/pushNotifications', () => ({
  isPushConfigured: async () => false,
  getPushRegistration: async () => ({ enabled: false, token: null }),
}));
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Switch, Text } from 'react-native';
import SettingsScreen from '../src/screens/SettingsScreen';
import { PreferencesProvider } from '../src/context/PreferencesContext';
import useReducedMotion from '../src/hooks/useReducedMotion';
import MenuRow from '../src/components/MenuRow';
const mockRead = jest.fn();
const mockWrite = jest.fn();
const mockNavigate = jest.fn();
jest.mock('../src/data/storage', () => ({
  StorageKeys: { preferences: 'preferences' },
  getJSON: (...args: unknown[]) => mockRead(...args),
  setJSON: (...args: unknown[]) => mockWrite(...args),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, []),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
function MotionProbe() {
  return <Text testID="motion">{String(useReducedMotion())}</Text>;
}
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  mockRead.mockResolvedValue({});
  mockWrite.mockResolvedValue(undefined);
});
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});
async function mount() {
  await act(async () => {
    tree = renderer.create(
      <PreferencesProvider>
        <SettingsScreen />
        <MotionProbe />
      </PreferencesProvider>,
    );
  });
}

test('guarda la preferencia y aplica movimiento reducido', async () => {
  await mount();
  await act(async () => {
    await tree.root.findAllByType(Switch)[0].props.onValueChange(true);
  });
  expect(mockWrite).toHaveBeenCalledWith('preferences', {
    reduceMotion: true,
    showReportPhotos: true,
  });
  expect(tree.root.findAllByType(Switch)[0].props.value).toBe(true);
  expect(tree.root.findByProps({ testID: 'motion' }).props.children).toBe(
    'true',
  );
});
test('restaura preferencias y mantiene acceso a datos personales', async () => {
  mockRead.mockResolvedValue({ reduceMotion: true, showReportPhotos: false });
  await mount();
  expect(tree.root.findAllByType(Switch)[1].props.value).toBe(false);
  act(() => tree.root.findByType(MenuRow).props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('PersonalData');
});
test('si falla el guardado conserva la preferencia anterior y permite reintentar', async () => {
  mockWrite.mockRejectedValueOnce(new Error('Sin espacio'));
  await mount();
  await act(async () => {
    await tree.root.findAllByType(Switch)[1].props.onValueChange(false);
  });
  expect(tree.root.findAllByType(Switch)[1].props.value).toBe(true);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No se pudo guardar la preferencia. Intenta cambiarla de nuevo.',
      ),
  ).toBe(true);
  await act(async () => {
    await tree.root.findAllByType(Switch)[1].props.onValueChange(false);
  });
  expect(tree.root.findAllByType(Switch)[1].props.value).toBe(false);
});
