# Notificaciones push de NexoU

## Estado actual

La app registra/renueva/desvincula instalaciones mediante sesión de la API.
El backend usa Firebase Admin y un outbox SQL por evento/instalación creado
en la misma transacción del historial. Revalida actividad y asociación antes
de enviar; elimina tokens inválidos y reintenta fallos temporales.
Los mensajes son genéricos y llevan al detalle autorizado. La app deduplica
eventos en primer plano y atiende apertura desde segundo plano/inicio.
El registro y envío real requieren conectar Firebase y sus credenciales.

Ver [operación del backend](../backend/README.md). No hay envío desde el móvil
ni credenciales de cuenta de servicio en su bundle.

## Android

1. Crear un proyecto en Firebase Console y registrar la aplicación Android con applicationId com.nexou.
2. Descargar google-services.json y colocarlo en android/app/google-services.json. El plugin de Google Services solo se aplica cuando existe el archivo.
3. Recompilar con npm run android; una recarga de Metro no instala los módulos nativos nuevos.
4. En Configuración, activar Recibir notificaciones push y conceder el permiso del dispositivo. La instalación queda asociada a tu usuario autenticado.
5. Conectar Firebase Admin en el servidor, habilitar `PUSH_ENABLED` y probar creación/cambio de un reporte con los destinatarios autenticados. Verificar app abierta, en segundo plano y cerrada. La entrega requiere conexión y Google Play Services compatibles.

## iOS

1. Registrar en Firebase el bundle identifier real de NexoU.
2. Añadir GoogleService-Info.plist al target NexoU en Xcode y a sus recursos de bundle. AppDelegate configura Firebase solo si encuentra ese recurso.
3. Configurar la integración iOS de React Native Firebase siguiendo la documentación de la versión instalada; ejecutar instalación de dependencias iOS en macOS.
4. Activar las capacidades Push Notifications y Background Modes / Remote notifications en Xcode; ajustar firma y perfiles.
5. Configurar la clave APNs del proyecto en Firebase Cloud Messaging. Nunca agregar la clave privada al repositorio ni al bundle móvil.
6. Recompilar y comprobar entrega en un dispositivo compatible con APNs.

## Envío automático

Configurar `GOOGLE_APPLICATION_CREDENTIALS` y `PUSH_ENABLED=true` solo
en el servidor. Los reportes nuevos se avisan a personal asociado; los cambios
de estado, al estudiante propietario. Sin dispositivo asociado no se crea
un envío retroactivo. FCM es al menos una vez; no se promete entrega exacta.

## Verificación

Cuatro pruebas de servicio verifican ausencia de configuración, rechazo de permisos, persistencia y eliminación de token, y recuperación ante fallo de guardado. TypeScript y lint deben acompañarse con compilación nativa y entrega real tras configurar Firebase. No se ha certificado Android/iOS ni entrega real en esta etapa.

Referencias: [React Native Firebase](https://rnfirebase.io/), [Messaging](https://rnfirebase.io/messaging/usage), [Configuración iOS](https://rnfirebase.io/messaging/usage/ios-setup), [Envío con Firebase Admin SDK](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
