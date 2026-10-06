import PrimaryButton from '../src/components/PrimaryButton';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import ProfileScreen from '../src/screens/ProfileScreen';
import MenuRow from '../src/components/MenuRow';
import MotionTouchable from '../src/components/MotionTouchable';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockReports = jest.fn();
let mockRole = 'estudiante';
const mockUser = {
  id: 'student-1',
  nombre: 'Ana María López Hernández con un nombre largo',
  email: 'ana.maria.lopez.hernandez@universidad.example.edu',
  matricula: 'A123456',
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, []),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { ...mockUser, rol: mockRole }, logout: mockLogout }),
}));
jest.mock('../src/data/reportRepository', () => ({
  getSummary: async (...args: unknown[]) => {
    const reports = await mockReports(...args);
    return {
      total: reports.length,
      pendiente: reports.filter(
        (r: { estado: string }) => r.estado === 'pendiente',
      ).length,
      revision: reports.filter(
        (r: { estado: string }) => r.estado === 'revision',
      ).length,
      solucionado: reports.filter(
        (r: { estado: string }) => r.estado === 'solucionado',
      ).length,
    };
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  mockRole = 'estudiante';
  mockReports.mockResolvedValue([
    { estado: 'revision' },
    { estado: 'pendiente' },
  ]);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
async function mount() {
  await act(async () => {
    tree = renderer.create(<ProfileScreen />);
  });
}

test('mantiene nombre y correo completos y la navegación del estudiante', async () => {
  await mount();
  for (const value of [mockUser.nombre, mockUser.email]) {
    const text = tree.root
      .findAllByType(Text)
      .find(node => node.props.children === value)!;
    expect(text.props.numberOfLines).toBeUndefined();
  }
  expect(mockReports).toHaveBeenCalledWith(true);
  act(() =>
    tree.root
      .findAllByType(MenuRow)
      .find(node => node.props.title === 'Mis reportes')!
      .props.onPress(),
  );
  expect(mockNavigate).toHaveBeenCalledWith('StudentTabs', {
    screen: 'MyReports',
  });
});

test('mantiene el destino por rol y confirma antes de cerrar sesión', async () => {
  mockRole = 'personal';
  await mount();
  expect(
    tree.root
      .findAllByType(MenuRow)
      .some(node => node.props.title === 'Mis reportes'),
  ).toBe(false);
  act(() =>
    tree.root
      .findAllByType(MenuRow)
      .find(node => node.props.title === 'Panel de incidencias')!
      .props.onPress(),
  );
  expect(mockNavigate).toHaveBeenCalledWith('StaffTabs', {
    screen: 'AllReports',
  });
  act(() =>
    tree.root
      .findAllByType(MenuRow)
      .find(node => node.props.title === 'Cerrar sesión')!
      .props.onPress(),
  );
  expect(mockLogout).not.toHaveBeenCalled();
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(mockLogout).toHaveBeenCalledTimes(1);
});

test('un fallo del resumen no bloquea acciones de cuenta y permite reintentar', async () => {
  mockReports.mockRejectedValueOnce(new Error('Sin conexión'));
  await mount();
  expect(tree.root.findAllByType(MenuRow)).toHaveLength(5);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No pudimos actualizar el resumen de tus reportes.',
      ),
  ).toBe(true);
  const retry = tree.root
    .findAllByType(MotionTouchable)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Reintentar'),
    )!;
  await act(async () => {
    retry.props.onPress();
  });
  expect(mockReports).toHaveBeenCalledTimes(2);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No pudimos actualizar el resumen de tus reportes.',
      ),
  ).toBe(false);
});

test('cancelar la confirmación conserva la sesión', async () => {
  await mount();
  act(() =>
    tree.root
      .findAllByType(MenuRow)
      .find(node => node.props.title === 'Cerrar sesión')!
      .props.onPress(),
  );
  const cancel = tree.root
    .findAllByType(MotionTouchable)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Seguir en mi cuenta'),
    )!;
  act(() => cancel.props.onPress());
  expect(mockLogout).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(PrimaryButton)).toHaveLength(0);
});
test('un fallo de logout conserva el diálogo y permite reintentar', async () => {
  await mount();
  act(() =>
    tree.root
      .findAllByType(MenuRow)
      .find(node => node.props.title === 'Cerrar sesión')!
      .props.onPress(),
  );
  mockLogout.mockRejectedValueOnce(new Error('Sin espacio'));
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No se pudo cerrar la sesión. Intenta de nuevo.',
      ),
  ).toBe(true);
  expect(tree.root.findAllByType(PrimaryButton)).toHaveLength(1);
  mockLogout.mockResolvedValueOnce(undefined);
  await act(async () => {
    await tree.root.findByType(PrimaryButton).props.onPress();
  });
  expect(tree.root.findAllByType(PrimaryButton)).toHaveLength(0);
});
