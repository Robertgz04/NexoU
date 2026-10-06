import TouchableOpacity from '../../components/MotionTouchable';
import AppIcon from '../../components/AppIcon';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import SelectField from '../../components/SelectField';
import { AREAS, CATEGORIES, LIMITS } from '../../constants/catalog';
import { createReport } from '../../data/reportRepository';
import CampusScrollScreen from '../../components/CampusScrollScreen';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import { colors, radius, spacing } from '../../theme';
import type { Category } from '../../types';
import type { RootStackParamList } from '../../navigation/types';
import { validateRequired } from '../../utils/validators';

type Errors = {
  titulo?: string | null;
  descripcion?: string | null;
  area?: string | null;
  categoria?: string | null;
};

/** Formulario para levantar un reporte de incidencia universitaria. */
export default function NewReportScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [area, setArea] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<Category | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const submissionLock = useRef(false);

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.5 as const,
      maxWidth: 1280,
      maxHeight: 1280,
      includeBase64: true,
    };

    try {
      if (source === 'camera' && Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso de cámara requerido',
            'Por favor habilita el permiso de cámara para capturar la evidencia fotográfica.',
          );
          return;
        }
      }

      const response =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert(
          'No se obtuvo la imagen',
          response.errorMessage ?? 'Intenta seleccionar la imagen de nuevo.',
        );
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.base64) {
        setPhoto(asset.base64);
      } else if (asset?.uri) {
        setPhoto(asset.uri);
      } else {
        Alert.alert(
          'Imagen no disponible',
          'No se pudo procesar la fotografía.',
        );
      }
    } catch {
      Alert.alert(
        'Error',
        'Ocurrió un inconveniente al abrir la cámara o la galería.',
      );
    }
  };

  const onSubmit = async () => {
    if (submissionLock.current) return;
    const nextErrors: Errors = {
      titulo: validateRequired(titulo, 'título del reporte'),
      descripcion: validateRequired(descripcion, 'descripción detallada'),
      area: area ? null : 'Selecciona el área donde ocurrió la incidencia.',
      categoria: categoria ? null : 'Selecciona el tipo de categoría.',
    };
    if (Object.values(nextErrors).some(v => v)) {
      setErrors(nextErrors);
      return;
    }
    if (!user || !area || !categoria) {
      return;
    }

    submissionLock.current = true;
    setSaving(true);
    try {
      await createReport({
        ownerId: user.id,
        ownerNombre: user.nombre,
        titulo,
        descripcion,
        area,
        categoria,
        photoBase64: photo,
      });

      setTitulo('');
      setDescripcion('');
      setArea(null);
      setCategoria(null);
      setPhoto(null);
      setErrors({});

      Alert.alert(
        'Reporte enviado correctamente',
        'Tu reporte ha sido registrado en estado "Pendiente". El personal universitario le dará seguimiento.',
        [
          {
            text: 'Ver mis reportes',
            onPress: () =>
              navigation.navigate('StudentTabs', { screen: 'MyReports' }),
          },
          { text: 'Aceptar', style: 'cancel' },
        ],
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo enviar el reporte.',
      );
    } finally {
      submissionLock.current = false;
      setSaving(false);
    }
  };

  const fondo = SCREEN_BACKGROUNDS.login;

  return (
    <CampusScrollScreen
      source={fondo.source}
      campusRatio={0.32}
      campusHeight={160}
      keyboard
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <AppIcon name="ArrowLeft" size={22} color={colors.primary} />
        <Text style={styles.backLabel}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Reportar una incidencia</Text>
      <Text style={styles.subtitle}>
        Cuéntanos qué ocurrió y dónde para que el personal pueda darle
        seguimiento.
      </Text>

      <View style={styles.formCard}>
        <FormField
          label="Título del reporte"
          value={titulo}
          onChangeText={value => {
            setTitulo(value);
            setErrors(prev => ({ ...prev, titulo: null }));
          }}
          error={errors.titulo}
          placeholder="Ej. Silla rota o luminaria apagada en lab 3"
          maxLength={LIMITS.titulo}
        />

        <SelectField
          label="Área o ubicación"
          icon="MapPin"
          value={area}
          placeholder="Selecciona el área universitaria"
          options={AREAS}
          error={errors.area}
          onSelect={value => {
            setArea(value);
            setErrors(prev => ({ ...prev, area: null }));
          }}
        />

        <SelectField
          label="Categoría"
          icon="Laptop"
          value={categoria}
          placeholder="Selecciona la categoría"
          options={CATEGORIES}
          error={errors.categoria}
          onSelect={value => {
            setCategoria(value as Category);
            setErrors(prev => ({ ...prev, categoria: null }));
          }}
        />

        <FormField
          label="Descripción de la incidencia"
          value={descripcion}
          onChangeText={value => {
            setDescripcion(value);
            setErrors(prev => ({ ...prev, descripcion: null }));
          }}
          error={errors.descripcion}
          placeholder="Describe lo ocurrido con el mayor detalle posible..."
          multiline
          maxLength={LIMITS.descripcion}
        />
        <Text style={styles.counter}>
          {descripcion.length}/{LIMITS.descripcion}
        </Text>
      </View>

      <View style={styles.evidenceCard}>
        <Text style={styles.sectionTitle}>Evidencia fotográfica</Text>
        <Text style={styles.sectionHint}>
          Opcional. Una foto ayuda a identificar y atender la incidencia.
        </Text>

        {photo ? (
          <View style={styles.previewBox}>
            <Image
              source={{
                uri:
                  photo.startsWith('data:') ||
                  photo.startsWith('file:') ||
                  photo.startsWith('content:')
                    ? photo
                    : `data:image/jpeg;base64,${photo}`,
              }}
              style={styles.preview}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setPhoto(null)}
              style={styles.removePhoto}
            >
              <Text style={styles.removePhotoText}>Eliminar evidencia</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.evidenceRow}>
            <View style={styles.evidenceButtons}>
              <PrimaryButton
                title="Tomar foto"
                variant="outline"
                onPress={() => pickImage('camera')}
                style={styles.evidenceButton}
              />
              <PrimaryButton
                title="Seleccionar galería"
                variant="outline"
                onPress={() => pickImage('gallery')}
                style={styles.evidenceButton}
              />
            </View>
          </View>
        )}
      </View>

      <PrimaryButton
        title="Enviar reporte"
        withArrow
        onPress={onSubmit}
        loading={saving}
        style={styles.submit}
      />

      <Text style={styles.footerHint}>
        El reporte quedará visible en tu historial para dar seguimiento en
        tiempo real.
      </Text>
    </CampusScrollScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  backLabel: { fontSize: 15, fontWeight: '700', color: colors.primary },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  formCard: { marginTop: spacing.lg },
  evidenceCard: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.primary },
  sectionHint: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  counter: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.sm,
  },
  evidenceRow: { gap: spacing.sm },
  evidenceButtons: { gap: spacing.sm },
  evidenceButton: { minHeight: 48, borderRadius: radius.md },
  previewBox: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: 200, resizeMode: 'cover' },
  removePhoto: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  removePhotoText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  submit: { marginTop: spacing.lg, borderRadius: radius.xl },
  footerHint: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
