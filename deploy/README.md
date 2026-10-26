# Despliegue en este servidor

API pública: https://nexou.api.avorainc.com/api/v1. Salud: `/health`.
DNS: registro A `nexou.api` → `13.140.225.51`.
Nginx termina HTTPS y reenvía a `127.0.0.1:4999`. `/ready` está bloqueado públicamente.
Certbot renueva el certificado automáticamente.

La API usa Node 24 en el contenedor `nexou-api`, con reinicio automático,
puerto interno 4999 y red `nexou-private` (`172.30.80.0/24`).
Nginx sobrescribe X-Forwarded-For; TRUST_PROXY es `172.30.80.1`.
Fotos privadas: `/var/lib/nexou/uploads`, montadas en `/uploads`.

## MySQL general del servidor

MySQL 8.4 está instalado como servicio `mysql`, independiente de la API y disponible
para otras bases del servidor. Solo escucha en loopback y en el gateway privado
Docker `172.30.80.1:3306`; no publica SQL en la interfaz de Internet.
El servicio arranca después de Docker para que exista esa interfaz.

Se importó `database/nexou.sql` una vez a `nexou`, conservando datos, rutinas,
triggers y vistas. No se reimporta durante despliegues.
La cuenta `nexou_runtime@172.30.80.0/255.255.255.0` tiene SELECT, INSERT, UPDATE,
DELETE y EXECUTE únicamente sobre `nexou.*`, sin permisos globales ni GRANT OPTION.
El definidor `nexou_app@localhost` tiene acceso SELECT/UPDATE a esa base y login
bloqueado. La administración local usa `sudo mysql` mediante socket.

Credenciales: `/etc/nexou/api.env`, root 0600; no se incluyen en Git ni en la app.
`.env.example` documenta los valores públicos de despliegue.
DB_HOST=`172.30.80.1`, DB_PORT=`3306`, DB_NAME=`nexou`, DB_USER=`nexou_runtime`.
Cambiar un archivo `.env` del checkout no modifica el contenedor.

## Actualización y verificación

Desde este checkout: `sudo ./deploy/start.sh`.
Compila y prueba antes de reemplazar la API, comprueba SQL y HTTPS, y restaura
el contenedor anterior si falla el reemplazo. No modifica el esquema.

```sh
docker ps
docker logs --tail 100 nexou-api
docker exec nexou-api node -e 'fetch("http://127.0.0.1:4999/ready").then(async r=>console.log(r.status,await r.text()))'
curl --fail https://nexou.api.avorainc.com/health
sudo /usr/local/sbin/nexou-backup
```

Los respaldos diarios quedan en `/var/lib/nexou/backups`, con retención de 14 días;
incluyen SQL con rutinas y triggers y fotos privadas. Cron: `/etc/cron.d/nexou`.
El respaldo debe copiarse fuera del servidor para recuperación ante pérdida del host.
Nunca restaurar sobre una base activa sin respaldo previo y autorización.
Push permanece deshabilitado hasta configurar Firebase.

## App móvil y GitHub Actions

`src/config/api.ts` apunta a la API pública para debug y release.
Es necesario recompilar y distribuir la app para actualizar instalaciones existentes.
No se incluyen credenciales MySQL en la app.

El workflow `.github/workflows/deploy-api.yml` comprueba el dominio nuevo.
La automatización SSH de Actions requiere configurar por separado su clave,
checkout y comando forzado en este servidor; ver `deploy/remote-deploy.sh`.
Los cambios locales no disparan Actions hasta publicarlos en el repositorio.
