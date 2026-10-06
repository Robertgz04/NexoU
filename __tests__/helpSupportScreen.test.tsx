import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Linking, Text } from 'react-native';
import HelpSupportScreen from '../src/screens/HelpSupportScreen';
import MenuRow from '../src/components/MenuRow';
import MotionTouchable from '../src/components/MotionTouchable';
import PrimaryButton from '../src/components/PrimaryButton';
const mockNavigate = jest.fn();
let mockRole = 'estudiante';
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: mockRole } }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
let tree: renderer.ReactTestRenderer;
beforeEach(async () => {
  mockRole = 'estudiante';
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await act(async () => {
    tree = renderer.create(<HelpSupportScreen />);
  });
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
  mockNavigate.mockClear();
});
test('abre y cierra preguntas sin navegar', () => {
  const question = tree.root
    .findAllByType(MotionTouchable)
    .find(
      node =>
        node.props.accessibilityLabel === '¿Necesito una foto para reportar?',
    )!;
  act(() => question.props.onPress());
  expect(
    tree.root
      .findAllByType(MotionTouchable)
      .find(
        node =>
          node.props.accessibilityLabel === question.props.accessibilityLabel,
      )!.props.accessibilityState.expanded,
  ).toBe(true);
  expect(
    tree.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).startsWith('La foto es opcional.'),
      ),
  ).toBe(true);
  expect(mockNavigate).not.toHaveBeenCalled();
  act(() =>
    tree.root
      .findAllByType(MotionTouchable)
      .find(
        node =>
          node.props.accessibilityLabel === question.props.accessibilityLabel,
      )!
      .props.onPress(),
  );
  expect(
    tree.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).startsWith('La foto es opcional.'),
      ),
  ).toBe(false);
});
test('los accesos respetan el rol y permiten abrir configuración', async () => {
  act(() => tree.root.findAllByType(MenuRow)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('StudentTabs', {
    screen: 'MyReports',
  });
  mockRole = 'personal';
  await act(async () => {
    tree.update(<HelpSupportScreen />);
  });
  act(() => tree.root.findAllByType(MenuRow)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('StaffTabs', {
    screen: 'AllReports',
  });
  act(() => tree.root.findAllByType(MenuRow)[2].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('Settings');
});
test('abre un borrador y muestra recuperación si falla la app de correo', async () => {
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(Linking.openURL).toHaveBeenCalledWith(
    expect.stringContaining('mailto:soporte.nexou@universidad.edu?subject='),
  );
  (Linking.openURL as jest.Mock).mockRejectedValueOnce(
    new Error('No mail app'),
  );
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(
    tree.root
      .findAllByType(Text)
      .some(node =>
        String(node.props.children).startsWith(
          'No se pudo abrir tu aplicación de correo.',
        ),
      ),
  ).toBe(true);
});
