import React, { useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';
import MenuRow from '../components/MenuRow';
import MotionTouchable from '../components/MotionTouchable';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../theme';

const SUPPORT_EMAIL = 'soporte.nexou@universidad.edu';
const QUESTIONS = [
  {
    id: 'photo',
    title: '¿Necesito una foto para reportar?',
    answer:
      'La foto es opcional. Ayuda a identificar la incidencia, pero puedes enviar el reporte con título, área, categoría y descripción.',
  },
  {
    id: 'status',
    title: '¿Qué significa cada estado?',
    answer:
      'Pendiente: el reporte está en espera de atención. En revisión: el personal lo ha marcado para revisión. Solucionado: el personal lo ha marcado como resuelto. Consulta el detalle para ver su última actualización.',
  },
  {
    id: 'account',
    title: '¿Cómo cambio mis datos personales?',
    answer:
      'Abre Datos personales desde Perfil o desde esta vista. Puedes editar nombre, matrícula o código y correo. Para cambiar el correo necesitas confirmar tu contraseña actual.',
  },
  {
    id: 'push',
    title: '¿Cómo activo las notificaciones?',
    answer:
      'Abre Configuración y revisa Recibir notificaciones push. Su activación requiere que Firebase esté conectado y que concedas el permiso del dispositivo. Si aparece pendiente de conectar, puedes consultar el seguimiento en el historial.',
  },
  {
    id: 'error',
    title: '¿Qué hago si no puedo enviar un reporte?',
    answer:
      'Revisa los mensajes junto a los campos y completa la información requerida. Si el envío falla, el formulario conserva tus datos: vuelve a intentarlo. Si el problema continúa, contacta a soporte e indica el mensaje de error.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openingMail, setOpeningMail] = useState(false);
  const [mailError, setMailError] = useState<string | null>(null);
  const mailLock = useRef(false);
  const student = user?.rol === 'estudiante';
  const contact = async () => {
    if (mailLock.current) return;
    mailLock.current = true;
    setOpeningMail(true);
    setMailError(null);
    const subject = encodeURIComponent('Solicitud de ayuda · NexoU');
    const body = encodeURIComponent(
      'Describe el problema:\n\nMensaje de error (si aparece):\n\nFolio del reporte (si corresponde):\n',
    );
    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
      );
    } catch {
      setMailError(
        'No se pudo abrir tu aplicación de correo. Puedes escribir a la dirección que aparece arriba o acudir a la ventanilla.',
      );
    } finally {
      mailLock.current = false;
      setOpeningMail(false);
    }
  };
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: spacing.xl + 20 + insets.bottom },
      ]}
    >
      <Text accessibilityRole="header" style={styles.title}>
        ¿En qué podemos ayudarte?
      </Text>
      <Text style={styles.intro}>
        Encuentra respuestas y contacta al equipo de soporte cuando lo
        necesites.
      </Text>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Accesos útiles
        </Text>
        <MenuRow
          icon="ClipboardList"
          title={student ? 'Consultar mis reportes' : 'Panel de incidencias'}
          subtitle="Abre una incidencia para consultar su estado y seguimiento"
          onPress={() =>
            student
              ? navigation.navigate('StudentTabs', { screen: 'MyReports' })
              : navigation.navigate('StaffTabs', { screen: 'AllReports' })
          }
        />
        <MenuRow
          icon="UserRound"
          title="Datos personales"
          subtitle="Consulta y edita la información de tu cuenta"
          onPress={() => navigation.navigate('PersonalData')}
        />
        <MenuRow
          icon="Settings"
          title="Configuración"
          subtitle="Accesibilidad y notificaciones del dispositivo"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Preguntas frecuentes
        </Text>
        {QUESTIONS.map(question => {
          const open = expanded === question.id;
          return (
            <View key={question.id} style={styles.question}>
              <MotionTouchable
                accessibilityRole="button"
                accessibilityLabel={question.title}
                accessibilityState={{ expanded: open }}
                onPress={() => setExpanded(open ? null : question.id)}
                style={styles.questionButton}
              >
                <Text style={styles.questionTitle}>{question.title}</Text>
                <AppIcon
                  name={open ? 'ChevronUp' : 'ChevronDown'}
                  size={22}
                  color={colors.primary}
                />
              </MotionTouchable>
              {open ? (
                <Text style={styles.answer}>{question.answer}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Contactar a soporte
        </Text>
        <View style={styles.contactRow}>
          <AppIcon name="Mail" size={24} color={colors.primary} />
          <View style={styles.contactBody}>
            <Text style={styles.contactTitle}>Correo de soporte</Text>
            <Text selectable style={styles.text}>
              {SUPPORT_EMAIL}
            </Text>
          </View>
        </View>
        <Text style={styles.text}>
          Incluye qué ocurrió, el mensaje de error y el folio si tu consulta
          trata de un reporte. No incluyas tu contraseña.
        </Text>
        <PrimaryButton
          title="Escribir a soporte"
          onPress={contact}
          loading={openingMail}
          style={styles.contactButton}
        />
        <Text style={styles.caption}>
          Se abrirá tu aplicación de correo para que revises y envíes el
          mensaje.
        </Text>
        {mailError ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {mailError}
          </Text>
        ) : null}
        <View style={styles.location}>
          <AppIcon name="MapPin" size={24} color={colors.primary} />
          <View style={styles.contactBody}>
            <Text style={styles.contactTitle}>Atención presencial</Text>
            <Text selectable style={styles.text}>
              Ventanilla de Atención Universitaria, Edificio Central.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  question: { borderBottomWidth: 1, borderBottomColor: colors.border },
  questionButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  questionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  answer: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    paddingBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactBody: { flex: 1, gap: spacing.xs },
  contactTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  text: { fontSize: 15, lineHeight: 23, color: colors.text },
  contactButton: { marginTop: spacing.md, borderRadius: radius.xl },
  caption: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginTop: spacing.sm,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.danger,
    marginTop: spacing.md,
  },
  location: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
});
