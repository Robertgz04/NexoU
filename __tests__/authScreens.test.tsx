import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextInput, TouchableOpacity } from 'react-native';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import AuthField from '../src/components/AuthField';
import AuthRoles from '../src/components/AuthRoles';
import PrimaryButton from '../src/components/PrimaryButton';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Mail: View,
    LockKeyhole: View,
    UserRoundPlus: View,
    UserRound: View,
    IdCard: View,
    ArrowLeft: View,
    Eye: View,
    EyeOff: View,
    BriefcaseBusiness: View,
    GraduationCap: View,
  };
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { rol: 'personal' } }),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));

let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree.unmount());
  jest.clearAllMocks();
});

test('permite mostrar y volver a ocultar la contraseña', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen />);
  });
  const field = tree.root.findAllByType(AuthField)[1];
  expect(field.findByType(TextInput).props.secureTextEntry).toBe(true);
  act(() => field.findByType(TouchableOpacity).props.onPress());
  expect(field.findByType(TextInput).props.secureTextEntry).toBe(false);
  act(() => field.findByType(TouchableOpacity).props.onPress());
  expect(field.findByType(TextInput).props.secureTextEntry).toBe(true);
});

test('conserva el rol seleccionado al abrir registro', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen />);
  });
  act(() => tree.root.findByType(AuthRoles).props.onChange('personal'));
  const create = tree.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(require('react-native').Text)
        .some(text => text.props.children === 'Crear cuenta'),
    );
  act(() => create!.props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('Register', { rol: 'personal' });
});

test('registro usa el rol recibido y rechaza contraseñas distintas', async () => {
  await act(async () => {
    tree = renderer.create(<RegisterScreen />);
  });
  expect(tree.root.findByType(AuthRoles).props.value).toBe('personal');
  const values = [
    'Ana López',
    'P0001',
    'ana@universidad.edu',
    'Password123',
    'Diferente123',
  ];
  act(() =>
    tree.root
      .findAllByType(AuthField)
      .forEach((field, index) => field.props.onChangeText(values[index])),
  );
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockRegister).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(AuthField)[4].props.error).toBe(
    'Las contraseñas no coinciden.',
  );
  act(() =>
    tree.root.findAllByType(AuthField)[4].props.onChangeText('Password123'),
  );
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockRegister).toHaveBeenCalledWith(
    expect.objectContaining({
      rol: 'personal',
      nombre: 'Ana López',
      matricula: 'P0001',
    }),
  );
});
