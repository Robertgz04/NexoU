import React from 'react';
import renderer, { act } from 'react-test-renderer';
import PersonalDataScreen from '../src/screens/PersonalDataScreen';
import FormField from '../src/components/FormField';
import PrimaryButton from '../src/components/PrimaryButton';
const mockSave = jest.fn();
const mockUser = {
  nombre: 'Ana López',
  matricula: 'A001',
  email: 'a001@virtual.utsc.edu.mx',
  rol: 'estudiante',
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: jest.fn(),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updatePersonalData: mockSave }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
let tree: renderer.ReactTestRenderer;
beforeEach(async () => {
  await act(async () => {
    tree = renderer.create(<PersonalDataScreen />);
  });
});
afterEach(() => {
  act(() => tree.unmount());
  mockSave.mockReset();
});
test('presenta los datos existentes y valida antes de guardar', async () => {
  expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);
  expect(tree.root.findAllByType(FormField)[0].props.value).toBe(
    mockUser.nombre,
  );
  act(() => tree.root.findAllByType(FormField)[0].props.onChangeText(' '));
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockSave).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(FormField)[0].props.error).toBeTruthy();
});
test('requiere contraseña solo al cambiar correo y conserva valores ante error', async () => {
  act(() => tree.root.findAllByType(FormField)[1].props.onChangeText('A002'));
  act(() =>
    tree.root
      .findAllByType(FormField)[2]
      .props.onChangeText('a002@virtual.utsc.edu.mx'),
  );
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockSave).not.toHaveBeenCalled();
  act(() =>
    tree.root.findAllByType(FormField)[3].props.onChangeText('Secreta123'),
  );
  mockSave.mockRejectedValue(new Error('Sin conexión'));
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockSave).toHaveBeenCalledWith({
    nombre: mockUser.nombre,
    matricula: 'A002',
    email: 'a002@virtual.utsc.edu.mx',
    currentPassword: 'Secreta123',
  });
  expect(tree.root.findAllByType(FormField)[2].props.value).toBe(
    'a002@virtual.utsc.edu.mx',
  );
});
