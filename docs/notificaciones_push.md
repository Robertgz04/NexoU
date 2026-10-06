# Notificaciones push de NexoU

## Estado actual

Se añadieron React Native Firebase App y Messaging, permiso Android 13+, registro y eliminación de token, renovación de token y avisos en primer plano. Firebase no está configurado: el control permanece deshabilitado. La recepción en segundo plano usa mensajes FCM con payload notification y depende del permiso del sistema. Los mensajes data-only y la apertura automática de reportes no están implementados.

Las cuentas y los reportes siguen siendo locales. No existe un backend de dispositivos por usuario ni envío automático al cambiar de estado. Esta etapa permite preparar recepción y probar mensajes genéricos por token desde Firebase Console cuando se configure el proyecto. No enviar información de reportes personales a estos tokens hasta disponer de registro autenticado por usuario, desvinculación al cerrar sesión y autorización del remitente.

## Android

1. Crear un proyecto en Firebase Console y registrar la aplicación Android con applicationId com.nexou.
2. Descargar google-services.json y colocarlo en android/app/google-services.json. El plugin de Google Services solo se aplica cuando existe el archivo.
3. Recompilar con npm run android; una recarga de Metro no instala los módulos nativos nuevos.
4. En Configuración, activar Recibir notificaciones push y conceder el permiso del dispositivo. El token de prueba aparece en esa sección.
5. En Firebase Console, crear un mensaje de notificación y usar Enviar mensaje de prueba con ese token. Verificar app abierta, en segundo plano y cerrada. La entrega requiere conexión y Google Play Services compatibles.

## iOS

1. Registrar en Firebase el bundle identifier real de NexoU.
2. Añadir GoogleService-Info.plist al target NexoU en Xcode y a sus recursos de bundle. AppDelegate configura Firebase solo si encuentra ese recurso.
3. Configurar la integración iOS de React Native Firebase siguiendo la documentación de la versión instalada; ejecutar instalación de dependencias iOS en macOS.
4. Activar las capacidades Push Notifications y Background Modes / Remote notifications en Xcode; ajustar firma y perfiles.
5. Configurar la clave APNs del proyecto en Firebase Cloud Messaging. Nunca agregar la clave privada al repositorio ni al bundle móvil.
6. Recompilar y comprobar entrega en un dispositivo compatible con APNs.

## Envío automático pendiente

El envío de avisos de estado debe ejecutarse en un servidor de confianza mediante Firebase Admin SDK o FCM HTTP v1. Se requiere autenticación real compartida entre dispositivos, almacenamiento remoto de reportes y tokens vinculados al usuario, permisos de personal, eliminación de tokens inválidos, preferencias por destinatario y desvinculación al cerrar sesión. No incluir credenciales de servicio en la app ni enviar directamente desde el cliente móvil.

## Verificación

Cuatro pruebas de servicio verifican ausencia de configuración, rechazo de permisos, persistencia y eliminación de token, y recuperación ante fallo de guardado. TypeScript y lint deben acompañarse con compilación nativa y entrega real tras configurar Firebase. No se ha certificado Android/iOS ni entrega real en esta etapa.

Referencias: [React Native Firebase](https://rnfirebase.io/), [Messaging](https://rnfirebase.io/messaging/usage), [Configuración iOS](https://rnfirebase.io/messaging/usage/ios-setup), [Envío con Firebase Admin SDK](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
