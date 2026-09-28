/**
 * Pruebas de humo de las pantallas nuevas del panel de personal
 * (F09 Estadísticas y F10 Notificaciones). Verifican que renderizan
 * sin errores y que respetan el repositorio de reportes.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../src/context/AuthContext';
import StatisticsScreen from '../src/screens/staff/StatisticsScreen';
import NotificationsScreen from '../src/screens/staff/NotificationsScreen';
import { StorageKeys } from '../src/data/storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => (store.has(key) ? store.get(key) : null),
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
      getAllKeys: async () => Array.from(store.keys()),
    },
  };
});

// El preset de Jest no transforma los paquetes de @react-navigation,
// así que se sustituyen por dobles mínimos para poder montar las pantallas.
// `useFocusEffect` sí ejecuta el efecto para que las pantallas carguen datos.
jest.mock('@react-navigation/native', () => {
  const reactLocal = require('react');
  return {
    useFocusEffect: (efecto: () => void | (() => void)) =>
      reactLocal.useEffect(efecto, []),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: { reportId: 'r_1' } }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...rest }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(View, rest, children),
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const ahora = new Date().toISOString();
const reporte = {
  id: 'r_1',
  ownerId: 'u_1',
  ownerNombre: 'Ana López',
  titulo: 'Lámpara fundida',
  descripcion: 'No enciende',
  area: 'Biblioteca',
  categoria: 'Electricidad',
  estado: 'pendiente',
  photoBase64: null,
  createdAt: ahora,
  updatedAt: ahora,
};

const usuario = {
  id: 'u_1',
  nombre: 'María Ruiz',
  matricula: 'P0001',
  email: 'personal@nexou.mx',
  passwordHash: 'x',
  rol: 'personal',
  createdAt: ahora,
};

/**
 * Recolecta todo el texto renderizado. Se recorre el árbol en lugar de
 * usar `toJSON()` porque las pantallas incluyen contextos con referencias
 * circulares.
 */
function textos(tree: renderer.ReactTestRenderer): string {
  // Se usan los nodos de texto que ya devuelve el runner en vez de
  // `toJSON()`: las pantallas incluyen contextos con referencias
  // circulares que no se pueden serializar.
  return tree.root
    .findAllByType('Text' as never)
    .flatMap(n => {
      const hijos = (n.props as { children?: unknown }).children;
      return (Array.isArray(hijos) ? hijos : [hijos])
        .filter(c => typeof c === 'string' || typeof c === 'number')
        .map(String);
    })
    .join(' | ');
}

/** Monta una pantalla dentro de los proveedores que necesita. */
async function montar(Pantalla: React.ComponentType) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <AuthProvider>
        <Pantalla />
      </AuthProvider>,
    );
  });
  return tree;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(StorageKeys.reports, JSON.stringify([reporte]));
  await AsyncStorage.setItem(StorageKeys.users, JSON.stringify([usuario]));
  await AsyncStorage.setItem(StorageKeys.session, JSON.stringify('u_1'));
});

describe('F09 – Estadísticas', () => {
  it('renderiza los totales y las secciones del mockup', async () => {
    const tree = await montar(StatisticsScreen);
    const txt = textos(tree);

    expect(txt).toContain('Estadísticas');
    expect(txt).toContain('Reportes totales');
    expect(txt).toContain('Reportes por categoría');
    expect(txt).toContain('Estado general');
    expect(txt).toContain('Actividad reciente');
    expect(txt).toContain('Área con más incidencias');
  });

  it('muestra el área con más incidencias del reporte cargado', async () => {
    const tree = await montar(StatisticsScreen);
    const txt = textos(tree);

    expect(txt).toContain('Biblioteca');
    // React entrega el texto interpolado en nodos separados.
    expect(txt).toContain('Categoría principal:');
    expect(txt).toContain('Electricidad');
  });

  it('ofrece los tres periodos del selector', async () => {
    const tree = await montar(StatisticsScreen);
    const txt = textos(tree);

    ['Semana', 'Mes', 'Año'].forEach(periodo => {
      expect(txt).toContain(periodo);
    });
  });
});

describe('F10 – Notificaciones', () => {
  it('lista el aviso derivado del reporte', async () => {
    const tree = await montar(NotificationsScreen);
    const txt = textos(tree);

    expect(txt).toContain('Notificaciones');
    expect(txt).toContain('Nuevo reporte recibido');
    expect(txt).toContain('Lámpara fundida');
    expect(txt).toContain('Ana López');
  });

  it('ofrece los filtros Todas / Estado / Avisos', async () => {
    const tree = await montar(NotificationsScreen);
    const txt = textos(tree);

    ['Todas', 'Estado', 'Avisos'].forEach(filtro => {
      expect(txt).toContain(filtro);
    });
  });
});
