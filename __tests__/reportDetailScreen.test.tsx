import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Image, Text } from 'react-native';
import ReportDetailScreen from '../src/screens/ReportDetailScreen';
import EmptyList from '../src/components/EmptyList';
import PrimaryButton from '../src/components/PrimaryButton';
import FormField from '../src/components/FormField';
import type { Report } from '../src/types';

const mockGetReport = jest.fn();
const mockUpdateStatus = jest.fn();
const mockGoBack = jest.fn();
let mockRole = 'estudiante';
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { reportId: 'report-1' } }),
  useNavigation: () => ({ goBack: mockGoBack }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, []),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: mockRole, id: 'staff-1', nombre: 'María' } }),
}));
jest.mock('../src/data/reportRepository', () => ({
  getReportById: (...args: unknown[]) => mockGetReport(...args),
  updateReportStatus: (...args: unknown[]) => mockUpdateStatus(...args),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));

const report: Report = {
  id: 'report-1',
  ownerId: 'student-1',
  ownerNombre: 'Ana López',
  titulo:
    'Una incidencia con un título completo que debe poder leerse sin truncado',
  descripcion:
    'Descripción completa de la incidencia y del lugar donde ocurrió.',
  area: 'Pasillos y áreas comunes del edificio universitario',
  categoria: 'Mobiliario',
  estado: 'revision',
  evidenceUrl: null,
  folio: 'NX-1',
  createdAt: '2026-10-05T12:00:00Z',
  updatedAt: '2026-10-06T12:00:00Z',
};
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  mockRole = 'estudiante';
  mockGetReport.mockResolvedValue(report);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
  mockGetReport.mockReset();
  mockUpdateStatus.mockReset();
  mockGoBack.mockClear();
});
async function mount() {
  await act(async () => {
    tree = renderer.create(<ReportDetailScreen />);
  });
}

test('muestra datos completos y no ofrece gestión al estudiante', async () => {
  await mount();
  expect(mockGetReport).toHaveBeenCalledWith('report-1');
  for (const value of [report.titulo, report.descripcion, report.area]) {
    const text = tree.root
      .findAllByType(Text)
      .find(node => node.props.children === value)!;
    expect(text).toBeDefined();
    expect(text.props.numberOfLines).toBeUndefined();
  }
  expect(tree.root.findAllByType(PrimaryButton)).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No se adjuntó evidencia fotográfica a este reporte.',
      ),
  ).toBe(true);
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Asignado a mantenimiento'),
  ).toBe(false);
});

test('permite reintentar una carga fallida', async () => {
  mockGetReport.mockRejectedValueOnce(new Error('Sin conexión'));
  await mount();
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'No pudimos cargar el reporte',
  );
  await act(async () => {
    tree.root.findByType(EmptyList).props.onAction();
  });
  expect(tree.root.findAllByType(EmptyList)).toHaveLength(0);
  expect(mockGetReport).toHaveBeenCalledTimes(2);
});

test('un reporte inexistente ofrece regreso', async () => {
  mockGetReport.mockResolvedValue(null);
  await mount();
  expect(tree.root.findByType(EmptyList).props.title).toBe(
    'Reporte no encontrado',
  );
  act(() => tree.root.findByType(EmptyList).props.onAction());
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test('la evidencia que no carga tiene alternativa legible', async () => {
  mockGetReport.mockResolvedValue({
    ...report,
    evidenceUrl: '/reports/report-1/evidence',
  });
  await mount();
  act(() => tree.root.findByType(Image).props.onError());
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'No se pudo mostrar la evidencia fotográfica.',
      ),
  ).toBe(true);
});

test('el personal actualiza el estado sin duplicar solicitudes', async () => {
  mockRole = 'personal';
  let resolveUpdate!: (report: Report) => void;
  mockUpdateStatus.mockReturnValue(
    new Promise(resolve => {
      resolveUpdate = resolve;
    }),
  );
  await mount();
  const submit = tree.root
    .findAllByType(PrimaryButton)
    .find(button => button.props.title === 'Cambiar a Solucionado')!.props
    .onPress;
  act(() => {
    submit();
    submit();
  });
  expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
  expect(mockUpdateStatus).toHaveBeenCalledWith('report-1', 'solucionado', '', {
    rol: 'personal',
    id: 'staff-1',
    nombre: 'María',
  });
  await act(async () => {
    resolveUpdate({ ...report, estado: 'solucionado' });
  });
  expect(
    tree.root
      .findAllByType(PrimaryButton)
      .some(
        button =>
          button.props.title === 'Solucionado (Actual)' &&
          button.props.disabled,
      ),
  ).toBe(true);
});

test('guarda la nota, la conserva ante errores y la limpia solo al guardar', async () => {
  mockRole = 'personal';
  await mount();
  act(() =>
    tree.root
      .findByType(FormField)
      .props.onChangeText('  Se cambió la silla.  '),
  );
  const submit = () =>
    tree.root
      .findAllByType(PrimaryButton)
      .find(b => b.props.title === 'Cambiar a Solucionado')!
      .props.onPress();
  mockUpdateStatus.mockRejectedValueOnce(new Error('No se pudo guardar'));
  await act(async () => {
    await submit();
  });
  expect(tree.root.findByType(FormField).props.value).toBe(
    '  Se cambió la silla.  ',
  );
  const update = {
    id: 's-1',
    from: 'revision',
    to: 'solucionado',
    note: 'Se cambió la silla.',
    createdAt: report.updatedAt,
    authorName: 'María',
  };
  mockUpdateStatus.mockResolvedValue({
    ...report,
    estado: 'solucionado',
    statusUpdates: [update],
  });
  await act(async () => {
    await submit();
  });
  expect(mockUpdateStatus.mock.calls[1][2]).toBe('Se cambió la silla.');
  expect(tree.root.findByType(FormField).props.value).toBe('');
  expect(
    tree.root.findAllByType(Text).some(n => n.props.children === update.note),
  ).toBe(true);
});
test('el estudiante consulta notas registradas sin poder editarlas', async () => {
  mockGetReport.mockResolvedValue({
    ...report,
    statusUpdates: [
      {
        id: 's-1',
        from: 'pendiente',
        to: 'revision',
        note: 'Se revisará mañana.',
        createdAt: report.updatedAt,
      },
    ],
  });
  await mount();
  expect(
    tree.root
      .findAllByType(Text)
      .some(n => n.props.children === 'Se revisará mañana.'),
  ).toBe(true);
  expect(tree.root.findAllByType(FormField)).toHaveLength(0);
});
