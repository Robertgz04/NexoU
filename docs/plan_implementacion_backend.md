# Plan de implementación del backend de NexoU

Fecha: 6 de octubre de 2026. Este documento conserva el plan original. La implementación y su estado de verificación se registran al final y en backend/README.md. La base sí fue migrada y validada con la cuenta del `.env`.

## 1. Punto de partida y objetivo

La app React Native guarda usuarios, sesiones, reportes, notas y fotos en AsyncStorage. Firebase Messaging prepara recepción, pero no registra dispositivos en un servidor ni envía avisos automáticamente. Implementar una API compartida para que un estudiante publique un reporte, personal lo atienda con notas y el estudiante consulte el estado real desde otro dispositivo.

La base actual es `nexou` en MariaDB 10.4.32, puerto 3050. Tiene siete tablas de negocio originales, sesiones, dispositivos push, dos vistas, cuatro triggers, el procedimiento de cambios con nota y control de migraciones. Contiene nueve áreas, seis categorías, tres estados y dos cuentas iniciales activas con bcrypt; no contiene incidencias ficticias ni datos de pruebas. Las contraseñas iniciales están en `.local/cuentas-iniciales.json`. No subir este archivo ni `.env` al repositorio.

La arquitectura será React Native → API HTTP/HTTPS → MariaDB, con archivos fuera de SQL. El puerto 3050 solo lo utiliza el backend para la base. Las credenciales SQL nunca llegan al cliente móvil. La cuenta `nexou_app` conserva los permisos completos solicitados para migraciones; separar una cuenta limitada de ejecución antes de desplegar y mantener la cuenta que define los triggers y el procedimiento.

## 2. Estructura y decisiones propuestas

Crear `backend/` con su propio `package.json`, TypeScript, Express 5, `mysql2/promise`, validación de entradas y biblioteca bcrypt compatible con los hashes iniciales. Compartir únicamente contratos públicos con la app; no compartir entidades SQL que incluyan hashes. Fijar las versiones al implementar y conservar su lockfile. Express 5 y el pool/consultas preparadas de mysql2 están documentados en sus [fuentes oficiales](https://expressjs.com/en/guide/migrating-5/) y [guía mysql2](https://sidorares.github.io/node-mysql2/docs).

```text
backend/
  src/
    app.ts                    # App HTTP testeable
    server.ts                 # Arranque y cierre ordenado
    config/env.ts             # Validacion de configuracion
    db/pool.ts                # Pool, UTC, modo estricto
    middleware/               # Sesion, roles, errores, limites
    modules/auth/             # Registro, login, logout, sesiones
    modules/users/            # Datos personales y provision de personal
    modules/catalogs/         # Areas, categorias, estados
    modules/reports/          # Altas, listas, detalle, historial, cambios
    modules/statistics/       # Agregados para el panel
    modules/notices/          # Avisos actuales por reporte
    modules/devices/          # Vinculacion y desvinculacion FCM
    storage/                  # Archivos privados y limpieza
  tests/                      # Integracion con base de pruebas
database/mysql/migrations/    # Unico historial de cambios del esquema
```

Usar el `.env` local existente mediante una ruta explícita desde la raíz durante desarrollo; añadir una configuración propia del servidor para despliegue. Variables futuras: `API_PORT` (propuesta 3000), `APP_TIME_ZONE=America/Mexico_City`, `UPLOAD_DIR`, límite de foto, duración de sesión y configuración de Firebase Admin solo cuando se habilite push. Validar todo al arrancar. No modificar la contraseña SQL ni ponerla en logs o respuestas.

Inicializar **cada conexión** del pool con `utf8mb4`, `time_zone='+00:00'` y el mismo modo SQL estricto de los scripts. No basta inicializar una conexión de prueba. Usar fechas como cadenas SQL UTC y convertir a ISO en un mapper explícito; devolver BIGINT como cadenas para evitar pérdidas de precisión. Configurar límites del pool, tiempos de espera y cierre ordenado. El servidor global conserva su configuración anterior; las conexiones y rutinas propias ya deben usar modo estricto.

## 3. Contrato HTTP

Prefijo `/api/v1`. Respuestas de error `{ error: { code, message, fields? }, requestId }`, con mensajes en español y sin SQL interno. Usar 400 para entradas inválidas, 401 para sesión ausente/expirada, 403 para rol no autorizado, 404 para recurso inaccesible/inexistente, 409 para correo/matrícula duplicados, 413 para carga excesiva y 429 para límites de solicitudes.

| Método y ruta | Acceso | Resultado |
|---|---|---|
| `GET /health` | Público, respuesta mínima | Proceso disponible; readiness SQL separada para operación. |
| `POST /auth/register` | Público, limitado | Crear estudiante; ignorar/rechazar rol personal enviado por el cliente. |
| `POST /auth/login` | Público, limitado | Token de sesión y usuario público, sin hashes. |
| `POST /auth/logout` | Sesión | Revocar sesión actual y desvincular el dispositivo asociado si corresponde. |
| `GET /auth/me` | Sesión | Usuario activo de la sesión. |
| `PATCH /users/me` | Sesión | Nombre, matrícula y correo; contraseña actual para cambiar correo, igual que la UI. |
| `GET /catalogs` | Sesión | Áreas/categorías activas con IDs y nombres; estados ordenados. |
| `POST /reports` | Estudiante | Crear pendiente con foto opcional; autor desde sesión. |
| `GET /reports` | Sesión | Solo propios para estudiante; listado general para personal. Filtros y cursor. |
| `GET /reports/summary` | Sesión | Conteos completos por estado, propios o generales según rol. |
| `GET /reports/:id` | Propietario o personal | Detalle con folio, evidencia e historial. Registrar rutas estáticas antes de `:id`. |
| `PATCH /reports/:id/status` | Personal | Estado y nota opcional mediante `cambiar_estado_reporte`. |
| `GET /reports/:id/evidence` | Propietario o personal | Archivo privado con MIME validado. |
| `GET /staff/statistics` | Personal | Indicadores, categorías, estados, área principal y serie diaria. |
| `GET /staff/notices` | Personal | Un aviso por reporte según estado actual; filtro todas/estado/aviso y cursor. |
| `PUT /devices/:installationId` | Sesión | Asociar/renovar token FCM del dispositivo y plataforma. |
| `DELETE /devices/:installationId` | Sesión y propietario | Desvincular token al desactivar push o cerrar sesión. |

Los listados devuelven `{ items, nextCursor, total }`, con tamaño por defecto 50 y máximo propuesto 100. Cursor estable por `(creado_en,id)` descendentes; avisos por `(ocurrido_en,reporte_id)`. No calcular conteos institucionales a partir de una página. Las exportaciones, si se añaden, recorren todas las páginas con la misma autorización.

El reporte público usa `id`, `folio`, `ownerId`, `ownerNombre`, título, descripción, IDs/nombres de catálogos, `estado`, `evidenceUrl`, `createdAt`, `updatedAt` y `statusUpdates`. Cada transición incluye ID como cadena, `from`, `to`, `note`, fecha y autor. El evento inicial con `estado_anterior=NULL` representa creación; no convertirlo a una transición ficticia. La UI ya presenta la creación por separado: mapear únicamente los eventos con estado anterior a `statusUpdates`.

El usuario público no incluye `passwordHash`. El alta no acepta `ownerId`, `ownerNombre`, fechas ni folio decididos por el cliente. El cambio de estado solo acepta `{ estado, note }`. Validar longitudes de SQL y las de `LIMITS`; normalizar correo y espacios. El límite de contraseña compatible con bcrypt debe medirse también en bytes para evitar truncamiento silencioso; documentarlo en el formulario.

## 4. Fases de implementación y aceptación

### Fase 1: servidor, conexiones y contrato

Crear el paquete backend, configuración validada, pool y manejo de errores. Mantener el migrador existente como única vía para cambios de esquema; no usar sincronización automática que recree tablas. Preparar OpenAPI y una base de pruebas independiente. Usar consultas preparadas; prohibir nombres SQL arbitrarios recibidos del cliente.

Aceptación: arranca contra `127.0.0.1:3050`, readiness verifica SQL, cada conexión tiene UTC/modo estricto, falla claramente ante configuración incompleta y las respuestas/logs no exponen secretos. El backend no ejecuta `db:bootstrap` al arrancar.

### Fase 2: cuentas y sesiones

Usar bcrypt para cuentas nuevas y comparar los hashes iniciales. Generar tokens opacos con 32 bytes aleatorios; almacenar SHA-256 en `sesiones` y devolver el original solo al cliente autenticado. Propuesta inicial: expiración fija de siete días y nuevo login al expirar, sin inventar un flujo refresh. La API verifica revocación, expiración y `usuarios.activo` en cada solicitud. Revocar todas las sesiones ante desactivación o cambio futuro de contraseña. La generación aleatoria y hashing pueden usar [crypto de Node](https://nodejs.org/api/crypto.html).

Registro público solo de estudiantes. Provisionar personal mediante comando administrativo del backend o mecanismo de invitación posterior. La UI actual permite escoger personal al registrarse: adaptar ese selector para evitar prometer un alta pública no autorizada; el login mantiene acceso de ambos roles y navega según el rol real devuelto por el servidor.

Actualizar datos personales con unicidad tanto de correo como de matrícula. Exigir contraseña actual al cambiar correo. Si posteriormente se importan hashes `sha256_legacy`, verificarlos exclusivamente en el servidor y sustituirlos por bcrypt al autenticar; no importar ni admitir la sesión local `{ userId }` como credencial.

Aceptación: login de ambas cuentas iniciales, duplicados controlados, sesión que persiste tras reinicio móvil, logout revocado, cuenta inactiva rechazada y estudiante incapaz de convertirse en personal. El token se guarda en Keychain/Keystore mediante una biblioteca apropiada; AsyncStorage no conserva hashes ni tokens de autenticación.

### Fase 3: catálogos, reportes, detalle e historial

Resolver IDs de catálogos desde el endpoint; mostrar nombres conservados para reportes antiguos aunque un catálogo se desactive. Crear usuario y reporte con UUID de texto compatibles con `VARCHAR(40)`. Alta de reporte y metadatos de evidencia en una transacción, con historial inicial generado por trigger.

Aplicar autorización en consultas individuales, listados y archivos. Personal cambia estado mediante `CALL cambiar_estado_reporte(?,?,?,?)` en una conexión sin transacción previa; la rutina controla su transacción. Leer después el detalle confirmado y devolverlo. No realizar otra escritura a historial desde el handler, ni envolver la rutina en una transacción externa. Registrar y reintentar deadlocks de manera limitada cuando corresponda, manteniendo notas y resultado coherentes.

Aceptación: estudiante solo ve sus reportes; personal ve todos; los tres estados y reapertura funcionan; nota máxima de 500 caracteres, historial acumulado, misma transición sin evento extra y actor real de sesión. Dos cambios concurrentes conservan correctamente cada nota. El estudiante accede al seguimiento sin controles de gestión.

### Fase 4: evidencia fotográfica

Enviar formulario multipart con una foto opcional JPEG/PNG/WebP. Validar contenido real y tamaño antes de guardar; propuesta de límite inicial: 5 MiB, reflejado en app y servidor. Nombre de archivo generado por servidor y directorio privado fuera de rutas públicas. No almacenar base64, URI del teléfono ni URL firmada que caduque en SQL.

Si falla SQL, eliminar el archivo subido; añadir limpieza de archivos sin referencia tras interrupciones del proceso. `archivo_clave` identifica el archivo, y el endpoint de lectura comprueba propietario/personal. La estrategia móvil debe permitir descargar la foto con autorización: una URL que exige Bearer no funciona si `Image` no envía cabeceras. Adaptar `photoUri`, componentes y caché junto con `evidenceUrl`; usar cabeceras o URLs temporales emitidas tras autorización.

Aceptación: reporte con/sin foto, MIME falso y carga excesiva rechazados, evidencia de otro estudiante inaccesible, fallos de subida conservan el formulario y archivos huérfanos se limpian. El switch de miniaturas no elimina evidencia: continúa siendo una preferencia local.

### Fase 5: panel, estadísticas y avisos

Mover agregaciones al backend; no descargar todas las incidencias para estadísticas. `GET /reports/summary` provee conteos completos independientes de filtros de lista. Estadísticas usa una sola referencia `asOf`, calculada por servidor, y zona `America/Mexico_City`: semana desde inicio del día de hace seis días, mes desde hace 29 días, año desde inicio del día de hace un año; excluir fechas posteriores a `asOf`. La serie siempre abarca siete días naturales, incluyendo hoy parcial, y se calcula independientemente del periodo de los indicadores. Las consultas R03–R06 son una base y deben adaptar el límite superior a `asOf`.

Conservar categorías/días con cero, desempate de área principal determinista y estados actuales de reportes creados en el periodo. Avisos siguen siendo un elemento por reporte, sin marcas de lectura ni contador ficticio de mensajes nuevos. No convertir el historial en notificaciones diferentes a las que muestra la UI actual.

Aceptación: límites de medianoche, año y fechas futuras con reloj fijo; resumen global correcto con varias páginas; cero datos con conteos cero; filtros y orden de avisos equivalentes a la app; fallos de actualización conservan los datos y el periodo seleccionado.

### Fase 6: conectar React Native

Crear cliente HTTP con URL base configurable, timeout, Bearer y errores mapeados. Reemplazar el interior de repositorios sin mezclar silenciosamente escrituras locales y remotas. Adaptar `AuthContext`, el usuario público y persistencia de sesión; quitar `seedIfEmpty` del modo remoto. Añadir `folio` y evidencia remota a `Report` y sustituir `folioDe` en todos sus consumidores. El dispositivo no debe importar el `.env` SQL.

Adaptar listas a paginación y pull-to-refresh; usar endpoints de resumen para badges/Inicio/Perfil y estadísticas para gráficas. El resumen del Perfil conserva su semántica actual de reportes propios, incluso para personal; no sustituirlo por total institucional. El detalle recarga al entrar y el regreso actualiza la lista. Mantener carga, fallo inicial, actualización fallida con datos anteriores, vacío y filtros sin coincidencias.

Conservar preferencias visuales y ayuda estática locales: no requieren nuevas tablas. En Android emulador, la API del equipo se alcanza habitualmente mediante `10.0.2.2:3000`; para dispositivo físico usar dirección LAN y configuración de acceso local. Confirmar esa configuración en el entorno de pruebas y usar HTTPS al desplegar. `127.0.0.1` en el teléfono no es el equipo donde corre la base.

Aceptación: dos dispositivos comparten el mismo reporte/estado; sesión restaurada, expiración manejada, carga de fotos autorizada y ningún hash/credencial SQL en el bundle. TypeScript, lint y pruebas móviles actualizadas pasan; verificar Android e iOS con teclado, cámara, galería y conectividad interrumpida. La primera versión ofrece recarga y actualización manual; sincronización en segundo plano y modo offline con cola quedan para otro alcance.

### Fase 7: dispositivos y push

Después de autenticación y flujo remoto funcional, conectar `pushNotifications.ts` a los endpoints de dispositivos. Asociar token solo a usuario autenticado; renovación actualiza SQL; al cambiar de cuenta, logout o desactivar push, desvincular la instalación. Resolver colisiones de token sin dejarlo asociado a dos cuentas. Rechazar operaciones sobre dispositivos de otro usuario.

Configurar Firebase Admin exclusivamente en backend. Comprobar usuario activo y asociación vigente antes de enviar; borrar tokens inválidos y enviar mensajes genéricos que lleven al detalle autorizado, evitando datos personales en la pantalla bloqueada. Implementar reintentos e idempotencia de envío mediante una cola duradera/outbox y su migración cuando se desarrolle esta fase. Las tablas actuales de dispositivos no son una cola de entrega ni garantizan envío. Las credenciales Firebase y la entrega real siguen pendientes.

Aceptación: alta/rotación/desvinculación de token, cambio de cuenta sin recibir nuevos avisos destinados al usuario anterior, manejo de token inválido y pruebas reales en primer/segundo plano. Si falla FCM, el cambio de estado continúa confirmado y la cola permite reintentar; no presentar un error de guardado cuando SQL ya confirmó.

## 5. Migración local y operación

No importar automáticamente `seed.ts`: crea incidencias históricas sin trazabilidad suficiente y las contraseñas demo no corresponden a las nuevas cuentas. Los datos existentes de teléfonos siguen en AsyncStorage; elegir una importación explícita solo si deben conservarse. Revisar IDs, correo/matrícula únicos, catálogos, archivos y qué historial realmente existe. No fabricar notas, autores ni fechas de solución. Si se importa, diseñar otra migración que distinga historial desconocido y no desactive triggers informalmente.

Separar configuración y bases de desarrollo/pruebas/producción. Antes de publicar: cuenta SQL limitada, HTTPS, límites de login/subida, copias verificadas y restauración ensayada. Logs con requestId y sin tokens, contraseñas o cuerpos privados. Limpiar sesiones expiradas/revocadas según retención y revisar archivos huérfanos. No exponer el puerto SQL a los dispositivos.

## 6. Estado verificado y siguiente entrega

Ya aplicado: tres migraciones, notas transaccionales, triggers estrictos, sesiones y dispositivos; catálogos y dos cuentas bcrypt; datos temporales limpios. Las pruebas de SQL originales y ampliadas, concurrencia y consultas R01–R10 pasaron. Una segunda ejecución del migrador confirmó checksums y ausencia de pendientes.

Próxima entrega propuesta: fases 1 y 2, con servidor ejecutable, conexión real, contrato OpenAPI, login/registro de estudiante/logout/me/datos personales y pruebas contra una base aislada. Seguir con reportes e imágenes antes de cambiar la fuente de datos de todas las pantallas. El backend y la integración móvil se implementaron posteriormente según el registro siguiente.

## 7. Registro de implementación — 6 de octubre de 2026

Se implementaron fases 1–6 y el código de dispositivos/outbox/worker de fase 7.
API Express 5 y TypeScript, consultas preparadas, configuración validada,
OpenAPI, sesiones bcrypt/opacas, alta pública restringida, evidencia privada,
historial por procedimiento, paginación, agregados y cliente HTTP móvil.
La regla adicional es correo exactamente matrícula normalizada +
`@virtual.utsc.edu.mx`, también al editar datos y provisionar personal.
Las cuentas iniciales conservaron sus contraseñas y cambiaron sus correos mediante
migración 005. La migración 006 revoca sesiones/dispositivos al desactivar cuentas
o cambiar su hash. La 004 genera intención push en la transacción del historial.

Las pruebas SQL usan una base temporal creada y eliminada expresamente; el mismo
migrador admite únicamente `nexou` y nombres `nexou_test_<16 hex>`.
No se importaron datos demo ni históricos de AsyncStorage. Las preferencias siguen locales.

La entrega real de Firebase/APNs y la comprobación iOS/cámara/galería en dispositivos
requieren el entorno nativo y credenciales correspondientes. No se ha desplegado
el servicio, separado todavía la cuenta SQL de ejecución ni ensayado restauración
de producción. Ver [backend/README.md](../backend/README.md) para ejecución y operación.
