import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Switch } from 'react-native';
import {
  AdministrationScreen,
  AdminCatalogScreen,
  AdminInstitutionScreen,
} from '../src/screens/admin/AdministrationScreens';
import FormField from '../src/components/FormField';
import MenuRow from '../src/components/MenuRow';
import PrimaryButton from '../src/components/PrimaryButton';
import {
  getAdminCatalog,
  getInstitution,
  saveCatalogEntry,
  saveInstitution,
} from '../src/data/adminRepository';
import { HttpError } from '../src/services/api';

let mockAdmin = true;
let mockRole = 'personal';
const mockNavigate = jest.fn();
const mockToast = jest.fn();
jest.mock('../src/components/ToastProvider', () => ({
  useToast: () => mockToast,
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: mockRole, isAdmin: mockAdmin } }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));
jest.mock('../src/data/adminRepository', () => ({
  getAdminCatalog: jest.fn(),
  getInstitution: jest.fn(),
  saveCatalogEntry: jest.fn(),
  saveInstitution: jest.fn(),
}));
const catalogItem = { id: 3, nombre: 'Biblioteca', orden: 2, activo: true };
const institution = {
  nombre: 'Escuela',
  correo_soporte: 'soporte@escuela.edu',
  ubicacion_soporte: 'Edificio B',
};
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  mockAdmin = true;
  mockRole = 'personal';
  jest.clearAllMocks();
  jest.mocked(getAdminCatalog).mockResolvedValue([catalogItem]);
  jest.mocked(getInstitution).mockResolvedValue(institution);
  jest.mocked(saveInstitution).mockImplementation(async value => value);
  jest
    .mocked(saveCatalogEntry)
    .mockImplementation(async (_kind, value, id) => ({
      id: id || 4,
      ...value,
    }));
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.restoreAllMocks();
});
async function mountCatalog() {
  await act(async () => {
    tree = renderer.create(
      <AdminCatalogScreen
        route={{ params: { kind: 'areas' } } as any}
        navigation={{} as any}
      />,
    );
  });
}
function button(title: string) {
  return tree.root
    .findAllByType(PrimaryButton)
    .find(node => node.props.title === title)!;
}
function field(label: string) {
  return tree.root
    .findAllByType(FormField)
    .find(node => node.props.label === label)!;
}

test('personal y estudiantes sin permiso no cargan datos administrativos', async () => {
  mockAdmin = false;
  await mountCatalog();
  expect(getAdminCatalog).not.toHaveBeenCalled();
  expect(tree.toJSON()).toBeNull();
  act(() => tree.unmount());
  mockAdmin = true;
  mockRole = 'estudiante';
  await mountCatalog();
  expect(getAdminCatalog).not.toHaveBeenCalled();
  expect(tree.toJSON()).toBeNull();
});
test('administración usa las rutas integradas al perfil', async () => {
  await act(async () => {
    tree = renderer.create(<AdministrationScreen />);
  });
  act(() => tree.root.findAllByType(MenuRow)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('AdminCatalog', { kind: 'areas' });
});
test('valida campos y permite agregar una zona sin reenviar durante el guardado', async () => {
  await mountCatalog();
  await act(async () => {
    button('Agregar opción').props.onPress();
  });
  expect(saveCatalogEntry).not.toHaveBeenCalled();
  expect(field('Nombre').props.error).toBeTruthy();
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: 'error',
      title: 'Revisa los campos indicados',
    }),
  );
  act(() => field('Nombre').props.onChangeText('Laboratorios'));
  await act(async () => {
    button('Agregar opción').props.onPress();
    button('Agregar opción').props.onPress();
  });
  expect(saveCatalogEntry).toHaveBeenCalledTimes(1);
  expect(saveCatalogEntry).toHaveBeenCalledWith(
    'areas',
    { nombre: 'Laboratorios', orden: 0, activo: true },
    undefined,
  );
  expect(button('Editar Laboratorios')).toBeTruthy();
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({ kind: 'success', title: 'Opción agregada' }),
  );
});
test('desactivar una zona requiere confirmación y conserva los datos ante un error', async () => {
  const confirm = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await mountCatalog();
  act(() => button('Editar Biblioteca').props.onPress());
  act(() => tree.root.findByType(Switch).props.onValueChange(false));
  act(() => button('Guardar cambios').props.onPress());
  expect(saveCatalogEntry).not.toHaveBeenCalled();
  jest
    .mocked(saveCatalogEntry)
    .mockRejectedValueOnce(new HttpError(409, 'DUPLICATE', 'Nombre duplicado'));
  const choices = confirm.mock.calls[0][2]!;
  await act(async () => {
    choices[1].onPress!();
  });
  expect(field('Nombre').props.value).toBe('Biblioteca');
  expect(field('Nombre').props.error).toBe('Nombre duplicado');
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({ kind: 'error', message: 'Nombre duplicado' }),
  );
});
test('una falla al cargar ofrece reintentar sin mostrar un catálogo vacío', async () => {
  jest.mocked(getAdminCatalog).mockRejectedValueOnce(new Error('Sin conexión'));
  await mountCatalog();
  expect(tree.root.findAllByType(FormField)).toHaveLength(0);
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: 'error',
      title: 'No se pudo cargar la información',
    }),
  );
  await act(async () => {
    button('Reintentar').props.onPress();
  });
  expect(button('Editar Biblioteca')).toBeTruthy();
});
test('guarda los datos institucionales y conserva la edición si el servidor falla', async () => {
  await act(async () => {
    tree = renderer.create(<AdminInstitutionScreen />);
  });
  act(() =>
    field('Nombre de la institución').props.onChangeText('Nueva escuela'),
  );
  jest.mocked(saveInstitution).mockRejectedValueOnce(new Error('Sin conexión'));
  await act(async () => {
    button('Guardar datos').props.onPress();
  });
  expect(field('Nombre de la institución').props.value).toBe('Nueva escuela');
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: 'error',
      title: 'No se pudieron guardar los cambios',
    }),
  );
  await act(async () => {
    button('Guardar datos').props.onPress();
  });
  expect(saveInstitution).toHaveBeenLastCalledWith({
    ...institution,
    nombre: 'Nueva escuela',
  });
  expect(mockToast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: 'success',
      title: 'Datos de la institución actualizados',
    }),
  );
});
