# API de NexoU

Express 5, TypeScript, mysql2, bcrypt y MariaDB. Contrato: [openapi.json](openapi.json). Decisiones originales: [plan](../docs/plan_implementacion_backend.md).

Para encender y apagar todo el entorno en Windows, sigue la [guía de arranque local](../docs/guia_arranque_local.md).

Desde la raíz del proyecto:

```powershell
npm ci
npm --prefix backend ci
npm run db:migrate
npm run api:build
npm run api:dev
```

La API escucha en `0.0.0.0:3000`, SQL en `127.0.0.1:3050`. `/health` y `/api/v1/health` son públicos; `/ready` comprueba SQL solo desde loopback. El arranque nunca ejecuta bootstrap ni cambia el esquema. Cada conexión se inicializa con UTF-8, UTC y modo estricto antes de usarla.

En desarrollo carga explícitamente el `.env` de la raíz. Para despliegue definir `API_ENV_FILE` como ruta absoluta de un archivo privado; también admite variables del proceso. Completar las variables de [.env.example](../.env.example). `UPLOAD_DIR` se resuelve respecto del archivo de configuración y debe estar fuera de cualquier directorio público. Producción requiere HTTPS mediante el proxy del despliegue; no activar trust proxy sin configurar sus direcciones reales. El límite HTTP en memoria es por proceso: para varias instancias usar un almacén compartido del limitador.

## Cuentas y móviles

El registro público crea únicamente estudiantes. Correo y matrícula se normalizan a minúsculas: `matricula@virtual.utsc.edu.mx`. Las dos cuentas iniciales conservan las claves privadas en `.local/cuentas-iniciales.json`; la migración 005 adapta sus correos, sin modificar hashes ni contraseñas. La API no importa los usuarios/reportes históricos del teléfono ni genera datos demo.

Tokens opacos de 32 bytes, siete días fijos por defecto; SQL almacena únicamente SHA-256. Cada solicitud verifica actividad, expiración y revocación. Cambiar un hash o desactivar una cuenta revoca todas sus sesiones y dispositivos mediante la migración 006. Las contraseñas nuevas admiten de 6 caracteres a 72 bytes UTF-8; el límite se aplica también al login para impedir truncamiento bcrypt. El correo solo se puede cambiar con contraseña actual. No hay refresh token.

Para crear personal, preparar un JSON privado con `nombre`, `matricula`, `email` y `password` (sin `rol`) y pasarlo por stdin, nunca por argumentos:

```powershell
Get-Content -Raw .local/personal-nuevo.json | npm --prefix backend run staff:create
```

La app usa [src/config/api.ts](../src/config/api.ts), exclusivamente configuración pública: `https://nexou-api.avorainc.com/api/v1` para debug y release en todos los dispositivos. No importar el `.env` SQL en Metro. Los tokens se guardan en Keychain/Keystore; reconstruir la app después de instalar estas dependencias. En macOS ejecutar `bundle exec pod install` dentro de `ios/`. Para pruebas con backend local, cambiar explícitamente esa URL. La configuración Docker de producción está en [deploy/README.md](../deploy/README.md).

## Reportes, fotos y estadísticas

Listados con cursor y máximo 100 elementos; resumen completo separado. El Perfil pide siempre `own=true`, incluso para personal. El detalle usa el folio SQL. El evento inicial se muestra como creación y no aparece en `statusUpdates`. Los cambios usan exclusivamente `cambiar_estado_reporte` en una conexión sin transacción externa, con hasta dos reintentos de deadlock.

Una foto opcional JPEG/PNG/WebP de hasta 5 MiB y 25 millones de píxeles. Se comprueba firma y decodificación; los archivos quedan privados con nombres aleatorios. Si falla SQL se elimina el archivo. La evidencia requiere Bearer y se sirve con `no-store`; los componentes móviles incluyen el encabezado. Desactivar miniaturas no modifica la evidencia. Una caída de proceso puede dejar archivos huérfanos: el mantenimiento elimina los de más de 24 horas sin referencia.

Estadísticas en una instantánea SQL y un solo `asOf`, días naturales en `America/Mexico_City`. La serie abarca siempre siete días, conserva ceros, excluye futuros y desempata área/categoría principal por ID. Los avisos representan un reporte por estado actual, sin contador de mensajes no leídos.

## Push y mantenimiento

La migración 004 añade un outbox transaccional por evento/instalación: reportes nuevos para personal, cambios de estado para el propietario. La cuenta debe estar activa y el dispositivo seguir asociado al mismo usuario/token al despachar. Tokens inválidos se eliminan; fallos temporales reintentan con espera exponencial hasta una hora. Una reserva vencida se recupera después de cinco minutos. `PUSH_ENABLED=false` evita conexiones a Firebase y conserva trabajos pendientes.

Para habilitar envío: configurar el proyecto móvil Firebase y `GOOGLE_APPLICATION_CREDENTIALS` en el servidor, después `PUSH_ENABLED=true`. No guardar la cuenta de servicio en Git. Los mensajes son genéricos y llevan `reportId` al detalle autorizado. El envío es **al menos una vez**: un fallo después de que FCM recibe el mensaje puede duplicarlo. El outbox tiene unicidad por evento/instalación; la app deduplica los últimos 100 `eventId` en primer plano y el mensaje incluye clave de colapso. FCM no garantiza entrega exactamente una vez. Credenciales y validación real de APNs/FCM quedan a cargo del entorno conectado.

Programar fuera del proceso HTTP:

```powershell
npm --prefix backend run maintenance
```

Elimina archivos huérfanos y sesiones vencidas/revocadas y trabajos terminales con más de 30 días. Antes de publicar separar una cuenta SQL de ejecución con SELECT en usuarios/catálogos/reportes/evidencias/historial/vistas, INSERT de usuarios/reportes/evidencias/sesiones/dispositivos, UPDATE de usuarios/sesiones/dispositivos/outbox, DELETE de sesiones/dispositivos/outbox y EXECUTE de la rutina. Mantener el definidor de triggers y rutinas; la cuenta de migraciones conserva sus permisos. Probar HTTPS, backups y restauración antes de despliegue.

## Verificación

```powershell
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm --prefix backend run build
npm --prefix backend test
$env:RUN_DB_TESTS='true'
npm --prefix backend run test:integration
```

La integración requiere el administrador local `root` de XAMPP sin contraseña en loopback para crear una base `nexou_test_<16 hex>` y otorgar permisos a la cuenta de `.env`. Usa el mismo migrador y limpia la base en `finally`; no ejecutarla contra producción. Si el administrador requiere otra autenticación, adaptar exclusivamente la preparación de pruebas. La prueba verifica cuentas, autorizaciones, conexiones, fotos, historial concurrente, páginas, agregados, logout y dispositivos. Las pruebas de ventanas temporales usan reloj fijo. La ejecución normal de `npm test` del backend omite integración SQL a menos que se habilite explícitamente.

Verificado el 6 de octubre de 2026: TypeScript móvil/backend y lint móvil; 65 pruebas móviles y 7 pruebas backend, incluida integración SQL aislada. Login real de ambas cuentas iniciales, validación SQL ampliada y segunda ejecución del migrador sin pendientes. Android `assembleDebug` completado, APK instalada en el emulador y conectividad `10.0.2.2:3000` comprobada. Bundle Android de producción generado y comprobado sin credenciales SQL ni hashes de usuario. No se certificaron todavía cámara/galería, dos dispositivos físicos, iOS ni entrega real FCM/APNs.

Referencias: [Express 5](https://expressjs.com/en/guide/migrating-5/), [mysql2](https://sidorares.github.io/node-mysql2/docs), [Keychain](https://oblador.github.io/react-native-keychain/docs/usage/), [interacción FCM móvil](https://rnfirebase.io/messaging/notifications), [Firebase Admin](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
