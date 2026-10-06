# Despliegue en el servidor

API: https://nexou-api.avorainc.com/api/v1. Salud pública: /health.
Nginx termina HTTPS y comunica con 127.0.0.1:3000. /ready se bloquea en Nginx.
Node 24 y MariaDB 10.11 corren en contenedores independientes, con reinicio automático.
SQL no publica puertos. Red nexou-private: 172.30.80.0/24; el proxy confiable es 172.30.80.1.
Nginx sobrescribe X-Forwarded-For para evitar suplantación. No cambiar TRUST_PROXY sin revisar la red.

Configuración privada: /etc/nexou/api.env y /etc/nexou/db.env (root, 0600).
Datos SQL: volumen Docker nexou-db-data. Fotos: /var/lib/nexou/uploads.
El dump database/nexou.sql se importó una vez, conservando definidores y cuentas.
La API usa nexou_runtime con permisos de ejecución limitados; nexou_app@localhost
es el definidor de la rutina. Los triggers se importaron como root.

Actualizar API: sudo ./deploy/start.sh (compila y prueba antes de reemplazar el contenedor).
Estado: docker ps; docker logs --tail 100 nexou-api.
Verificar SQL: docker exec nexou-api node -e 'fetch("http://127.0.0.1:3000/ready").then(async r=>console.log(r.status,await r.text()))'.
Mantenimiento: docker exec nexou-api node dist/storage/maintenance.js.
Respaldar: sudo /usr/local/sbin/nexou-backup.
Cron /etc/cron.d/nexou: respaldo diario 08:15 UTC y limpieza 08:35 UTC.
Respaldos SQL privados: /var/lib/nexou/backups, retención 14 días.
Se respaldan también las fotos en archivos -uploads.tar.gz. Conviene copiar los respaldos fuera del servidor.
Certbot renueva automáticamente; hook valida y recarga Nginx.

Restaurar primero en una base aislada con mariadb como administrador: crear base,
importar el gzip descomprimido con rutinas y triggers, y verificar conteos.
Nunca sobrescribir la base activa sin respaldo y una ventana autorizada.

Push está deshabilitado hasta configurar credenciales Firebase privadas.

Auditoría al desplegar: npm audit --omit=dev encontró dos alertas moderadas,
en uuid (<11.1.1) y gaxios, transitivas de Firebase Admin. Push está deshabilitado.
Revisar una actualización compatible y repetir pruebas antes de activar Firebase.

## GitHub Actions

Cada push a `master` (también merges de PR) ejecuta `.github/workflows/deploy-api.yml`.
Un commit guardado solo en el equipo no dispara despliegue: hay que hacer push.
También admite ejecución manual desde Actions, seleccionando `master`.
La app compilada usa la API pública en debug y release; un cambio de código móvil
requiere compilar/distribuir la app de nuevo, no actualiza aplicaciones ya instaladas.

Preparación del servidor ya realizada:
- Clave exclusiva de Actions: `/etc/nexou/github-actions-key` (privada, no subir a Git).
- Su clave pública está autorizada con `restrict` y un comando forzado: no permite
  terminal interactiva, túneles ni comandos arbitrarios.
- Comando instalado: `/usr/local/sbin/nexou-deploy`, fuente en `deploy/remote-deploy.sh`.
- Identidad SSH del servidor fijada en `deploy/known_hosts`.
- Checkout de producción: `/opt/nexou/repository`; la carpeta de trabajo del IDE
  conserva los cambios locales. Último SHA publicado: `/opt/nexou/deployed-sha`.

Activación única por un administrador del repositorio:
1. Abrir https://github.com/Robertgz04/NexoU/settings/secrets/actions.
2. Crear el repository secret `NEXOU_DEPLOY_SSH_KEY`, cuyo valor es el contenido
   completo de `/etc/nexou/github-actions-key`, incluyendo BEGIN/END y saltos de línea.
3. Subir estos cambios a `master` y revisar el job `Deploy NexoU API` en Actions.

El servidor descarga `master` directamente del repositorio público por HTTPS.
Si el repo se vuelve privado, configurar una deploy key de lectura en el servidor.
Las ejecuciones se serializan; un SHA que ya fue superado se omite para no revertir
una versión reciente. Compilación, pruebas unitarias y readiness SQL ocurren antes
de parar la API anterior. El cambio de contenedor puede causar una pausa breve.
Si falla el arranque o la comprobación HTTPS, se restaura el contenedor anterior.
No reinicia MariaDB/Nginx ni importa de nuevo el dump, ni aplica migraciones SQL.
Una modificación de esquema requiere migración planificada por separado.
El contenedor anterior queda detenido como `nexou-api-previous` hasta el próximo despliegue.

El workflow puede ejecutar código de quienes tengan permiso para subir a `master`;
los cambios de la API y scripts deben revisarse como código de producción.
Si cambia `deploy/remote-deploy.sh`, actualizar también su copia instalada:
`sudo install -m 700 deploy/remote-deploy.sh /usr/local/sbin/nexou-deploy`.

## .env y acceso a SQL

`.env.example` describe el entorno **dentro de Docker en este servidor**.
El `.env` local del servidor contiene las mismas variables que `/etc/nexou/api.env`
y está excluido de Git; el contenedor usa el archivo privado de `/etc/nexou`.
Cambiar `.env` por sí solo no cambia el contenedor: editar `/etc/nexou/api.env`
y desplegar de nuevo. Credenciales y fotos no se sobrescriben con un push.

`DB_HOST=nexou-db`, `DB_PORT=3306`, `DB_NAME=nexou`, `DB_USER=nexou_runtime`.
La contraseña real solo está en archivos privados. Esta cuenta no puede migrar
el esquema. La base está en línea para la API, sin puerto MySQL público.
Fuera de esa red Docker el nombre `nexou-db` no resuelve. Quien compile la app
solo necesita el repo y acceso HTTPS, sin `.env` ni credenciales SQL.
Para desarrollar un backend local, usar SQL local y cambiar host/puerto/usuario,
`NODE_ENV=development`, `UPLOAD_DIR=.local/uploads` y `TRUST_PROXY=`.
No ejecutar las migraciones de desarrollo contra la base de producción.
