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
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import SelectField from '../../components/SelectField';
import { AREAS, CATEGORIES, LIMITS } from '../../constants/catalog';
import { createReport } from '../../data/reportRepository';
import ScreenBackground from '../../components/ScreenBackground';
import { SCREEN_BACKGROUNDS } from '../../constants/backgrounds';
import Logo from '../../assets/NexoU_Logo.png';
import { colors, radius, shadow, spacing } from '../../theme';
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
        Alert.alert('Imagen no disponible', 'No se pudo procesar la fotografía.');
      }
    } catch {
      Alert.alert(
        'Error',
        'Ocurrió un inconveniente al abrir la cámara o la galería.',
      );
    }
  };

  const onSubmit = async () => {
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
        'Reporte enviado correctamente ✅',
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
      setSaving(false);
    }
  };

  const fondo = SCREEN_BACKGROUNDS.newReport;

  const backButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver"
      activeOpacity={0.85}
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>←</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground
      source={fondo.source}
      artBottom={fondo.artBottom}
      sheet
      overArt={backButton}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Nuevo reporte de incidencia</Text>
          <Text style={styles.subtitle}>
            Ingresa la información detallada para que el área correspondiente pueda intervenir.
          </Text>

          <View style={styles.formCard}>
            <FormField
              label="Título del reporte"
              value={titulo}
              onChangeText={setTitulo}
              error={errors.titulo}
              placeholder="Ej. Silla rota o luminaria apagada en lab 3"
              maxLength={LIMITS.titulo}
            />

            <SelectField
              label="Ubicación o Área"
              icon="📍"
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
              label="Tipo o Cuestión"
              icon="💻"
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
              onChangeText={setDescripcion}
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
            <Text style={styles.sectionTitle}>
              Evidencia fotográfica{' '}
              <Text style={styles.sectionHint}>(Opcional pero recomendable)</Text>
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
                  <Text style={styles.removePhotoText}>✕ Eliminar evidencia</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.evidenceRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={() => pickImage('gallery')}
                  style={styles.dropzone}
                >
                  <Text style={styles.dropzoneIcon}>📷</Text>
                  <Text style={styles.dropzoneText}>Adjuntar foto</Text>
                </TouchableOpacity>

                <View style={styles.evidenceButtons}>
                  <PrimaryButton
                    title="📷 Tomar foto"
                    variant="outline"
                    onPress={() => pickImage('camera')}
                    style={styles.evidenceButton}
                  />
                  <PrimaryButton
                    title="🖼 Seleccionar galería"
                    variant="outline"
                    onPress={() => pickImage('gallery')}
                    style={styles.evidenceButton}
                  />
                </View>
              </View>
            )}
          </View>

          <PrimaryButton
            title="Enviar reporte a revisión"
            withArrow
            onPress={onSubmit}
            loading={saving}
            style={styles.submit}
          />

          <Text style={styles.footerHint}>
            El reporte quedará visible en tu historial para dar seguimiento en tiempo real.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  logo: {
    height: 44,
    width: 154,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 20,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  evidenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textMuted,
  },
  counter: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.md,
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropzone: {
    width: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  dropzoneIcon: {
    fontSize: 28,
  },
  dropzoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  evidenceButtons: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  evidenceButton: {
    minHeight: 44,
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
  removePhotoText: { color: colors.danger, fontWeight: '700', fontSize: 13.5 },
  submit: { marginTop: spacing.lg },
  footerHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
