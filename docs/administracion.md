# Administración de la institución

La misma sesión de personal admite el permiso `isAdmin`. El rol sigue siendo
`personal`, por lo que conserva reportes, estadísticas y notificaciones.
El acceso se encuentra en **Perfil → Administración de la institución** y solo
aparece para el personal administrador. No hay otro login.

## Preparación

1. Ejecutar `npm run db:migrate` antes de iniciar la nueva API. La migración 007
   añade `usuarios.es_admin` y la configuración institucional. No eleva cuentas
   existentes ni modifica contraseñas.
2. Con un ID de personal activo, ejecutar desde `backend`:
   `npm run staff:admin -- <id> on`. Para quitar el permiso usar `off`.
   La primera asignación requiere acceso operativo al servidor; el registro
   público y la edición de datos personales no pueden conceder este permiso.
3. Iniciar sesión de nuevo para actualizar el acceso visible en la app.
   La API consulta el permiso en cada petición y rechaza inmediatamente nuevas
   operaciones después de revocarlo, incluso con una sesión ya abierta.

## Opciones disponibles

- **Zonas:** crear, renombrar, ordenar, activar y desactivar áreas o edificios.
- **Categorías:** las mismas operaciones para los tipos de incidencia.
- **Institución:** nombre, correo de soporte y lugar de atención. Se muestran
  en Ayuda y soporte para la comunidad autenticada.

Los formularios utilizan las mismas alertas de la app (`ToastProvider`) para
confirmar guardados y avisar de errores de validación, carga o conexión. Los
errores junto a cada campo y las acciones de reintento permanecen visibles.

La desactivación pide confirmación y retira la opción de nuevos reportes;
conserva las referencias y el historial existentes. Renombrar una opción cambia
también su nombre mostrado en los reportes asociados. No se permite eliminar
catálogos desde la API. Los estados de reporte mantienen su flujo actual.

El alcance sigue el modelo existente: **una escuela por instalación/base de
datos**. No añade varias escuelas compartiendo la misma base. El dominio de
correo institucional y las reglas de matrícula existentes permanecen en la
configuración de autenticación del proyecto; no se editan en esta vista.
La identidad gráfica continúa usando los recursos y tokens actuales.

## Validación

- `npx tsc --noEmit`, `npm run lint`, `npm test -- --runInBand`.
- Desde `backend`: `npm run build`, `npm test`.
- Con MariaDB local disponible: `RUN_DB_TESTS=true npm run test:integration`
  (en PowerShell: `$env:RUN_DB_TESTS='true'; npm run test:integration`).
  La integración crea una base aislada y verifica autorización, revocación,
  configuración, duplicados, activación y conservación de referencias.
