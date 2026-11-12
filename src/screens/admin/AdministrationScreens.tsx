import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import CampusScrollScreen from '../../components/CampusScrollScreen';
import MenuRow from '../../components/MenuRow';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { colors, radius, spacing } from '../../theme';
import { HttpError } from '../../services/api';
import {
  getAdminCatalog,
  getInstitution,
  saveCatalogEntry,
  saveInstitution,
} from '../../data/adminRepository';
import type { CatalogEntry, Institution } from '../../data/adminRepository';
import type { RootStackParamList } from '../../navigation/types';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useToast } from '../../components/ToastProvider';

function useAdministrator() {
  const { user } = useAuth();
  return user?.rol === 'personal' && user.isAdmin === true;
}
function Page({
  children,
  scrollRef,
}: {
  children: React.ReactNode;
  scrollRef?: React.RefObject<React.ComponentRef<
    typeof Animated.ScrollView
  > | null>;
}) {
  return (
    <CampusScrollScreen
      source={SCREEN_BACKGROUNDS.login.source}
      campusHeight={100}
      campusRatio={0.32}
      keyboard
      scrollRef={scrollRef}
    >
      <View style={styles.content}>{children}</View>
    </CampusScrollScreen>
  );
}
function Feedback({ error, message }: { error: string; message?: string }) {
  return error || message ? (
    <Text
      accessibilityLiveRegion="polite"
      style={error ? styles.error : styles.text}
    >
      {error || message}
    </Text>
  ) : null;
}
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No pudimos guardar los cambios.';

export function AdministrationScreen() {
  const navigation = useNavigation();
  const allowed = useAdministrator();
  if (!allowed) return null;
  return (
    <Page>
      <Text accessibilityRole="header" style={styles.title}>
        Tu institución
      </Text>
      <Text style={styles.text}>
        Configura las opciones que utiliza tu comunidad al reportar incidencias.
      </Text>
      <MenuRow
        icon="MapPin"
        title="Zonas de la institución"
        subtitle="Agrega, edita y desactiva áreas o edificios"
        onPress={() => navigation.navigate('AdminCatalog', { kind: 'areas' })}
      />
      <MenuRow
        icon="Tag"
        title="Categorías de incidencias"
        subtitle="Personaliza los tipos de incidencia disponibles"
        onPress={() =>
          navigation.navigate('AdminCatalog', { kind: 'categorias' })
        }
      />
      <MenuRow
        icon="Settings"
        title="Datos de la institución"
        subtitle="Nombre de la escuela y contacto de soporte"
        onPress={() => navigation.navigate('AdminInstitution')}
      />
    </Page>
  );
}

export function AdminCatalogScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, 'AdminCatalog'>) {
  const allowed = useAdministrator();
  const { kind } = route.params;
  const [items, setItems] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [editing, setEditing] = useState<number | undefined>();
  const scrollRef =
    useRef<React.ComponentRef<typeof Animated.ScrollView>>(null);
  const reducedMotion = useReducedMotion();
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState('0');
  const [activo, setActivo] = useState(true);
  const [fields, setFields] = useState<Record<string, string>>({});
  const lock = useRef(false);
  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (!allowed) return;
      setLoading(true);
      try {
        const data = await getAdminCatalog(kind);
        if (isActive()) {
          setItems(data);
          setReady(true);
          setError('');
        }
      } catch (e) {
        if (isActive()) {
          setReady(false);
          setError(errorMessage(e));
          toast({
            title: 'No se pudo cargar la información',
            message: errorMessage(e),
            kind: 'error',
          });
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [allowed, kind, toast],
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );
  const reset = () => {
    setEditing(undefined);
    setNombre('');
    setOrden('0');
    setActivo(true);
    setFields({});
  };
  const save = async () => {
    if (lock.current || !allowed) return;
    const invalid: Record<string, string> = {};
    if (!nombre.trim()) invalid.nombre = 'Escribe un nombre.';
    if (!/^\d+$/.test(orden) || Number(orden) > 65535)
      invalid.orden = 'Usa un entero entre 0 y 65535.';
    setFields(invalid);
    if (Object.keys(invalid).length) {
      setError('Revisa los campos indicados.');
      toast({
        title: 'Revisa los campos indicados',
        message: Object.values(invalid)[0],
        kind: 'error',
      });
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      const value = await saveCatalogEntry(
        kind,
        { nombre: nombre.trim(), orden: Number(orden), activo },
        editing,
      );
      setItems(previous =>
        [...previous.filter(item => item.id !== value.id), value].sort(
          (a, b) => a.orden - b.orden || a.id - b.id,
        ),
      );
      reset();
      toast({
        title: editing === undefined ? 'Opción agregada' : 'Cambios guardados',
        message: `${value.nombre}: ${
          value.activo ? 'disponible para nuevos reportes' : 'desactivada'
        }.`,
        kind: 'success',
      });
    } catch (e) {
      setError(errorMessage(e));
      toast({
        title: 'No se pudieron guardar los cambios',
        message: errorMessage(e),
        kind: 'error',
      });
      if (e instanceof HttpError)
        setFields(e.fields || (e.status === 409 ? { nombre: e.message } : {}));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const submit = () => {
    if (
      editing !== undefined &&
      !activo &&
      items.find(item => item.id === editing)?.activo
    )
      Alert.alert(
        '¿Desactivar esta opción?',
        'Dejará de aparecer en nuevos reportes. Los reportes existentes se conservarán.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desactivar', onPress: save },
        ],
      );
    else save();
  };
  if (!allowed) return null;
  return (
    <Page scrollRef={scrollRef}>
      <Text accessibilityRole="header" style={styles.title}>
        {kind === 'areas'
          ? 'Zonas de la institución'
          : 'Categorías de incidencias'}
      </Text>
      <Text style={styles.text}>
        Las opciones activas aparecen al crear un reporte. El orden menor
        aparece primero. Al renombrar una opción también se actualiza su nombre
        en los reportes existentes.
      </Text>
      <Feedback error={error} />
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando catálogo"
          color={colors.primary}
        />
      ) : !ready ? (
        <PrimaryButton title="Reintentar" onPress={() => load()} />
      ) : (
        <>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.heading}>
              {editing === undefined ? 'Agregar opción' : 'Editar opción'}
            </Text>
            <FormField
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              maxLength={kind === 'areas' ? 100 : 50}
              editable={!saving}
              error={fields.nombre}
            />
            <FormField
              label="Orden"
              value={orden}
              onChangeText={setOrden}
              keyboardType="number-pad"
              editable={!saving}
              error={fields.orden}
              maxLength={5}
            />
            <View style={styles.switchRow}>
              <Text style={styles.text}>Disponible para nuevos reportes</Text>
              <Switch
                accessibilityLabel="Disponible para nuevos reportes"
                value={activo}
                onValueChange={setActivo}
                disabled={saving}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <PrimaryButton
              title={
                editing === undefined ? 'Agregar opción' : 'Guardar cambios'
              }
              onPress={submit}
              loading={saving}
            />
            {editing !== undefined ? (
              <PrimaryButton
                title="Cancelar edición"
                variant="outline"
                onPress={reset}
                disabled={saving}
              />
            ) : null}
          </View>
          <Text accessibilityRole="header" style={styles.heading}>
            Opciones de la institución ({items.length})
          </Text>
          {!items.length ? (
            <Text style={styles.text}>
              Aún no hay opciones. Agrega la primera para que tu comunidad pueda
              seleccionarla.
            </Text>
          ) : (
            items.map(item => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.heading}>{item.nombre}</Text>
                <Text style={styles.text}>
                  {item.activo ? 'Activa' : 'Inactiva'} · Orden {item.orden}
                </Text>
                <PrimaryButton
                  title={`Editar ${item.nombre}`}
                  variant="outline"
                  disabled={saving}
                  onPress={() => {
                    setEditing(item.id);
                    scrollRef.current?.scrollTo({
                      y: 0,
                      animated: !reducedMotion,
                    });
                    setNombre(item.nombre);
                    setOrden(String(item.orden));
                    setActivo(item.activo);
                    setFields({});
                    setError('');
                  }}
                />
              </View>
            ))
          )}
        </>
      )}
    </Page>
  );
}

export function AdminInstitutionScreen() {
  const allowed = useAdministrator();
  const [value, setValue] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [fields, setFields] = useState<Record<string, string>>({});
  const lock = useRef(false);
  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (!allowed) return;
      setLoading(true);
      try {
        const data = await getInstitution();
        if (isActive()) {
          setValue(data);
          setError('');
        }
      } catch (e) {
        if (isActive()) {
          setError(errorMessage(e));
          toast({
            title: 'No se pudo cargar la información',
            message: errorMessage(e),
            kind: 'error',
          });
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [allowed, toast],
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );
  const save = async () => {
    if (!value || lock.current || !allowed) return;
    const invalid: Record<string, string> = {};
    if (!value.nombre.trim())
      invalid.nombre = 'Escribe el nombre de la institución.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.correo_soporte.trim()))
      invalid.correo_soporte = 'Ingresa un correo válido.';
    if (!value.ubicacion_soporte.trim())
      invalid.ubicacion_soporte = 'Escribe dónde solicitar atención.';
    setFields(invalid);
    if (Object.keys(invalid).length) {
      setError('Revisa los campos indicados.');
      toast({
        title: 'Revisa los campos indicados',
        message: Object.values(invalid)[0],
        kind: 'error',
      });
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      setValue(await saveInstitution(value));
      toast({
        title: 'Datos de la institución actualizados',
        message: 'La información se guardó correctamente.',
        kind: 'success',
      });
    } catch (e) {
      setError(errorMessage(e));
      toast({
        title: 'No se pudieron guardar los cambios',
        message: errorMessage(e),
        kind: 'error',
      });
      if (e instanceof HttpError) setFields(e.fields || {});
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  if (!allowed) return null;
  return (
    <Page>
      <Text accessibilityRole="header" style={styles.title}>
        Datos de la institución
      </Text>
      <Text style={styles.text}>
        Estos datos se muestran a tu comunidad en Ayuda y soporte.
      </Text>
      <Feedback error={error} />
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando institución"
          color={colors.primary}
        />
      ) : value ? (
        <>
          <FormField
            label="Nombre de la institución"
            value={value.nombre}
            onChangeText={nombre => setValue({ ...value, nombre })}
            maxLength={150}
            editable={!saving}
            error={fields.nombre}
          />
          <FormField
            label="Correo de soporte"
            value={value.correo_soporte}
            onChangeText={correo_soporte =>
              setValue({ ...value, correo_soporte })
            }
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
            editable={!saving}
            error={fields.correo_soporte}
          />
          <FormField
            label="Atención presencial"
            value={value.ubicacion_soporte}
            onChangeText={ubicacion_soporte =>
              setValue({ ...value, ubicacion_soporte })
            }
            multiline
            maxLength={300}
            editable={!saving}
            error={fields.ubicacion_soporte}
          />
          <PrimaryButton
            title="Guardar datos"
            onPress={save}
            loading={saving}
          />
        </>
      ) : (
        <PrimaryButton title="Reintentar" onPress={() => load()} />
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 19, fontWeight: '800', color: colors.primary },
  text: { fontSize: 15, lineHeight: 23, color: colors.text, flexShrink: 1 },
  error: { fontSize: 15, lineHeight: 23, color: colors.danger },
  section: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  card: {
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
  },
});
