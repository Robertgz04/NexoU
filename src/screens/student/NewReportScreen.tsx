import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../context/AuthContext';
import Chip from '../../components/Chip';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { AREAS, CATEGORIES, LIMITS } from '../../constants/catalog';
import { createReport } from '../../data/reportRepository';
import ScreenHeader from '../../components/ScreenHeader';
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

/**
 * F03 + F04 + F05 – Formulario para levantar un reporte:
 * título, descripción, área, categoría y evidencia fotográfica.
 */
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

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.5 as const,
      maxWidth: 1280,
      maxHeight: 1280,
      includeBase64: true,
    };

    try {
      if (source === 'camera') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso requerido',
            'Habilita el permiso de cámara para adjuntar la evidencia.',
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
          'No se pudo obtener la imagen',
          response.errorMessage ?? 'Intenta de nuevo.',
        );
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.base64) {
        setPhoto(asset.base64);
      } else if (asset?.uri) {
        // Respaldo: se guarda la URI local si el base64 no estuvo disponible.
        setPhoto(asset.uri);
      } else {
        Alert.alert('Imagen no disponible', 'No se pudo leer la fotografía.');
      }
    } catch {
      Alert.alert(
        'Error',
        'Ocurrió un problema al abrir la cámara o la galería.',
      );
    }
  };

  const onSubmit = async () => {
    const nextErrors: Errors = {
      titulo: validateRequired(titulo, 'título'),
      descripcion: validateRequired(descripcion, 'descripción'),
      area: area ? null : 'Selecciona el área donde ocurrió el problema.',
      categoria: categoria ? null : 'Selecciona el tipo de incidencia.',
    };
    if (Object.values(nextErrors).some(v => v)) {
      setErrors(nextErrors);
      return;
    }
    if (!user || !area || !categoria) {
      return;
    }

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
        'Reporte publicado ✅',
        'Tu reporte se envió con estado "Pendiente". El personal lo revisará.',
        [
          {
            text: 'Ver mis reportes',
            onPress: () =>
              navigation.navigate('StudentTabs', { screen: 'MyReports' }),
          },
          { text: 'Cerrar', style: 'cancel' },
        ],
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo crear el reporte.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        withImage
        title="Nuevo reporte"
        subtitle="Reporta una incidencia en tu universidad para que pueda ser atendida."
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label="Título del problema"
          value={titulo}
          onChangeText={setTitulo}
          error={errors.titulo}
          placeholder="Ej. Lámpara quemada en el aula 101"
          maxLength={LIMITS.titulo}
        />
        <Text style={styles.counter}>
          {titulo.length}/{LIMITS.titulo}
        </Text>
        <FormField
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          error={errors.descripcion}
          placeholder="¿Qué ocurrió? ¿Desde cuándo? ¿Por qué es un problema?"
          multiline
          maxLength={LIMITS.descripcion}
        />
        <Text style={styles.counter}>
          {descripcion.length}/{LIMITS.descripcion}
        </Text>

        <Text style={styles.sectionTitle}>Área</Text>
        <View style={styles.chipWrap}>
          {AREAS.map(a => (
            <Chip
              key={a}
              label={a}
              selected={area === a}
              onPress={() => {
                setArea(a);
                setErrors(prev => ({ ...prev, area: null }));
              }}
            />
          ))}
        </View>
        {errors.area ? <Text style={styles.error}>{errors.area}</Text> : null}

        <Text style={styles.sectionTitle}>Tipo de incidencia</Text>
        <View style={styles.chipWrap}>
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              label={c}
              selected={categoria === c}
              onPress={() => {
                setCategoria(c);
                setErrors(prev => ({ ...prev, categoria: null }));
              }}
            />
          ))}
        </View>
        {errors.categoria ? (
          <Text style={styles.error}>{errors.categoria}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Evidencia fotográfica</Text>
        <Text style={styles.hint}>
          Opcional: toma la foto o elígela de la galería.
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
              <Text style={styles.removePhotoText}>✕ Quitar foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <PrimaryButton
              title="📷 Cámara"
              variant="outline"
              onPress={() => pickImage('camera')}
              style={styles.photoButton}
            />
            <PrimaryButton
              title="🖼 Galería"
              variant="outline"
              onPress={() => pickImage('gallery')}
              style={styles.photoButton}
            />
          </View>
        )}

        <PrimaryButton
          title="Enviar reporte"
          withArrow
          onPress={onSubmit}
          loading={saving}
          style={styles.submit}
        />
        <Text style={styles.footerHint}>
          Al publicar, tu reporte queda en estado Pendiente y el personal lo
          verirá en su panel.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  counter: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.sm - 2,
    marginBottom: spacing.sm + 2,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  error: {
    fontSize: 12.5,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm + 2,
  },
  previewBox: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: 200, resizeMode: 'cover' },
  removePhoto: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  removePhotoText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  photoButtons: { flexDirection: 'row', gap: spacing.sm },
  photoButton: { flex: 1 },
  submit: { marginTop: spacing.lg },
  footerHint: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
