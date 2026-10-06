# Base de datos y migraciones de NexoU

Estado comprobado el 6 de octubre de 2026: MariaDB 10.4.32 de XAMPP en `127.0.0.1:3050`, base `nexou`. El esquema original apunta también a MySQL 8.0.16+, pero la nueva ejecución se verificó en MariaDB, no en una instancia MySQL independiente.

## Base actual

No ejecutar de nuevo `01_esquema.sql`. Desde la raíz del proyecto:

```powershell
npm run db:inspect
npm run db:migrate
npm run db:verify
```

El `.env` contiene `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Se carga con Node; se requiere Node 22.11 o superior. Los scripts usan los clientes de `C:/xampp/mysql/bin/`. Para otra instalación, definir `MYSQL_BIN` y `MYSQLDUMP_BIN` con rutas absolutas. El bootstrap usa `PHP_BIN` o `C:/xampp/php/php.exe` únicamente para generar bcrypt; la API no depende de PHP.

El migrador permite únicamente `DB_NAME=nexou`. Fija UTF-8, UTC y modo estricto, verifica el esquema inicial y compara checksums antes de aplicar archivos ordenados de `migrations/`. Guarda un respaldo SQL con datos, vistas, triggers y rutinas en `.local/database-backups/` antes de aplicar cambios pendientes. Las credenciales se pasan por un archivo temporal de opciones, que se elimina al terminar; no por argumentos de contraseña. Ejecutar una sola instancia del migrador a la vez y sin escrituras concurrentes de la aplicación durante cambios de esquema.

`schema_migrations` distingue `iniciada` de `aplicada`. El DDL tiene commits implícitos: si falla una migración puede haber cambios parciales. El runner se detiene ante un estado incompleto o checksum distinto. No borrar ese registro ni reejecutar a ciegas: inspeccionar el esquema, corregir explícitamente o restaurar el respaldo. Los respaldos conservan definidores; una restauración completa puede requerir una cuenta administradora. Los archivos aplicados son inmutables; usar una nueva migración para cambios posteriores.

## Instalación nueva

1. Ejecutar `01_esquema.sql` como administrador.
2. Ejecutar `02_catalogos.sql`.
3. Crear la cuenta mediante `05_usuario_app.sql` y completar `.env`.
4. Ejecutar `npm run db:migrate`.
5. En desarrollo, ejecutar `npm run db:verify`.
6. Si se necesitan las dos cuentas iniciales, ejecutar `npm run db:bootstrap` una sola vez sobre una tabla `usuarios` vacía.

`03_reportes.sql` contiene consultas de referencia; R09 requiere la migración de notas. `04_validacion.sql` verifica el flujo original. `db:verify` añade comprobaciones de notas, concurrencia, sesiones y dispositivos. Solo usar estas validaciones en desarrollo: insertan datos temporales, crean rutinas auxiliares y dejan huecos AUTO_INCREMENT aunque limpien los registros. No reiniciar contadores para esconder esos huecos.

## Datos iniciales

Los catálogos contienen 9 áreas, 6 categorías y 3 estados; `02_catalogos.sql` puede repetirse sin duplicarlos ni reactivar registros deshabilitados. El bootstrap crea un estudiante y un personal con contraseñas aleatorias y bcrypt de costo 12, sin reportes de muestra. No cambia cuentas existentes y rechaza una segunda ejecución. Las credenciales están en `.local/cuentas-iniciales.json`; tanto este archivo como los respaldos quedan excluidos de Git. La app consulta estas cuentas por la API. La migración 005 establece los correos matrícula@virtual.utsc.edu.mx conservando contraseñas.

## Cambios de estado con nota

```sql
CALL cambiar_estado_reporte('id_del_reporte', 'revision', 'id_del_personal', 'Se revisará el equipo.');
```

En la API, usar parámetros preparados y obtener el actor de su sesión. Ejecutar la llamada en una conexión dedicada que no tenga otra transacción abierta: la rutina controla `START TRANSACTION`, `COMMIT` y `ROLLBACK`. Bloquea la fila del reporte para que cada nota se guarde en su propio evento, incluso con cambios concurrentes. Un estado repetido no añade eventos ni reemplaza notas. La rutina valida personal activo, pero no autentica al usuario HTTP.

Los triggers siguen generando el historial; escribir estado mediante `UPDATE` directo conserva el flujo anterior con nota vacía. Para la API usar siempre la rutina. Una futura cuenta de ejecución debe tener SELECT en historial y EXECUTE sobre esta rutina, sin UPDATE/INSERT/DELETE directos en historial. Mantener la cuenta definidora para que funcionen los triggers y el procedimiento.

El backend está implementado: [arranque, contrato y verificación](../../backend/README.md). Las migraciones 004–006 añaden outbox push, correos institucionales y revocación por desactivación/cambio de hash.
