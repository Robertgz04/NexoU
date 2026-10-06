import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import NewReportScreen from '../src/screens/student/NewReportScreen';
import FormField from '../src/components/FormField';
import SelectField from '../src/components/SelectField';
import PrimaryButton from '../src/components/PrimaryButton';

const mockCreateReport = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'student-1', nombre: 'Ana López' } }),
}));
jest.mock('../src/data/reportRepository', () => ({
  getCatalogs: jest
    .fn()
    .mockResolvedValue({
      areas: [{ id: 1, nombre: 'Edificio A' }],
      categorias: [{ id: 1, nombre: 'Mobiliario' }],
      estados: [],
    }),
  createReport: (...args: unknown[]) => mockCreateReport(...args),
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));

let tree: renderer.ReactTestRenderer;
beforeEach(async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await act(async () => {
    tree = renderer.create(<NewReportScreen />);
  });
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
  mockCreateReport.mockReset();
});

function fillReport() {
  act(() => {
    const fields = tree.root.findAllByType(FormField);
    fields[0].props.onChangeText('Silla rota');
    fields[1].props.onChangeText('La silla está rota en el laboratorio.');
    const selects = tree.root.findAllByType(SelectField);
    selects[0].props.onSelect(selects[0].props.options[0]);
    selects[1].props.onSelect('Mobiliario');
  });
}

test('conserva el título cuando falla la validación de otros campos', async () => {
  act(() =>
    tree.root.findAllByType(FormField)[0].props.onChangeText('Silla rota'),
  );
  await act(async () => {
    await tree.root
      .findAllByType(PrimaryButton)
      .find(button => button.props.title === 'Enviar reporte')!
      .props.onPress();
  });
  expect(mockCreateReport).not.toHaveBeenCalled();
  const fields = tree.root.findAllByType(FormField);
  expect(fields[0].props.value).toBe('Silla rota');
  expect(fields[1].props.error).toBeTruthy();
});

test('bloquea pulsaciones duplicadas y conserva los datos si falla el envío', async () => {
  fillReport();
  let rejectReport!: (reason: Error) => void;
  mockCreateReport.mockReturnValue(
    new Promise((_, reject) => {
      rejectReport = reject;
    }),
  );
  const submit = tree.root
    .findAllByType(PrimaryButton)
    .find(button => button.props.title === 'Enviar reporte')!.props.onPress;
  let pending!: Promise<void>;
  act(() => {
    pending = submit();
    submit();
  });
  expect(mockCreateReport).toHaveBeenCalledTimes(1);
  expect(mockCreateReport.mock.calls[0][0]).toMatchObject({
    ownerId: 'student-1',
    titulo: 'Silla rota',
    photo: null,
  });
  await act(async () => {
    rejectReport(new Error('Sin conexión'));
    await pending;
  });
  expect(tree.root.findAllByType(FormField)[0].props.value).toBe('Silla rota');
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'Sin conexión');
});
