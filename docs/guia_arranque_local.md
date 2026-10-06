# Encender y apagar NexoU en Windows

Esta guía corresponde al entorno local actual: proyecto en `C:\Users\bdavi\Documents\NexoU`, MariaDB de XAMPP en el puerto **3050**, API en **3000**, Metro en **8081** y emulador Android **Pixel_10**. Los comandos se ejecutan en PowerShell.

## 1. Encender la base de datos

Abre el panel de control de XAMPP (`C:\xampp\xampp-control.exe`) y pulsa **Start** junto a **MySQL**. La instalación usa MariaDB y está configurada en el puerto 3050. Apache no es necesario para NexoU.

Comprueba el puerto desde PowerShell:

```powershell
Test-NetConnection 127.0.0.1 -Port 3050
```

Debe mostrar `TcpTestSucceeded : True`. Conserva el `.env` de la raíz, que contiene la configuración privada de conexión. No necesitas recrear la base ni ejecutar el bootstrap para encender la aplicación.

## 2. Encender la API — terminal 1

```powershell
Set-Location C:\Users\bdavi\Documents\NexoU
npm run api:dev
```

Deja esta terminal abierta. Este comando inicia la API y la reinicia cuando cambias su código.

En otra terminal comprueba que responde y que puede acceder a SQL:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/ready
```

La ruta base usada por la app es `http://10.0.2.2:3000/api/v1` en el emulador Android. `10.0.2.2` permite acceder al equipo anfitrión desde el emulador; las comprobaciones anteriores se ejecutan en Windows con `127.0.0.1`.

Si prefieres ejecutar la API compilada, usa estos comandos **en lugar de** `api:dev`:

```powershell
npm run api:build
npm --prefix backend start
```

Solo debe haber una instancia de la API escuchando en el puerto 3000.

## 3. Encender el emulador Android

En Android Studio abre **Device Manager** y pulsa el botón de inicio del dispositivo **Pixel_10**. Espera a que Android termine de arrancar.

Comprueba que aparece como `device`:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

En este equipo normalmente aparece como `emulator-5554`. Si muestra `offline`, espera a que termine el arranque antes de continuar.

## 4. Encender Metro — terminal 2

```powershell
Set-Location C:\Users\bdavi\Documents\NexoU
npm start
```

Deja esta terminal abierta. Metro sirve el código JavaScript de la app de desarrollo en el puerto 8081.

## 5. Compilar y abrir la app — terminal 3

```powershell
Set-Location C:\Users\bdavi\Documents\NexoU
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android -- --no-packager
```

El comando compila, instala y abre NexoU en el dispositivo conectado. `--no-packager` usa el Metro de la terminal 2. La primera compilación puede tardar varios minutos; las siguientes aprovechan la caché. Estas variables de entorno se aplican únicamente a esa terminal: vuelve a definirlas cuando abras otra.

Si la app ya está instalada y no cambiaste dependencias ni configuración nativa, puedes abrirla sin recompilar:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb -s emulator-5554 reverse tcp:8081 tcp:8081
& $adb -s emulator-5554 shell am start -n com.nexou/.MainActivity
```

Cambia `emulator-5554` por el identificador mostrado por `adb devices` si es distinto. La API y Metro deben seguir encendidos.

## 6. Iniciar sesión

Las credenciales iniciales están en el archivo privado `.local/cuentas-iniciales.json`. Usa los correos y contraseñas guardados allí. El registro público crea estudiantes y exige que el correo coincida con la matrícula: `matricula@virtual.utsc.edu.mx`.

## Preparación tras clonar o actualizar dependencias

El equipo actual ya está preparado. Si haces una instalación nueva de dependencias, ejecuta desde la raíz:

```powershell
npm ci
npm --prefix backend ci
```

Si hay migraciones pendientes, inicia MariaDB y ejecútalas antes de iniciar la API y de usar la app:

```powershell
npm run db:migrate
```

Para crear la base en otro equipo, sigue [la guía de instalación de SQL](../database/mysql/README.md). No vuelvas a ejecutar `01_esquema.sql` ni `db:bootstrap` sobre la base existente. La configuración privada se describe en [backend/README.md](../backend/README.md) y las variables disponibles en [.env.example](../.env.example).

## Problemas habituales

| Problema | Qué revisar |
| --- | --- |
| La API no conecta a SQL | MySQL está iniciado en XAMPP, escucha en 3050 y el `.env` tiene las credenciales correctas. |
| La app no conecta a la API | Comprueba `/health` y `/ready`; en el emulador la URL debe usar `10.0.2.2:3000`, según `src/config/api.ts`. |
| La app no carga JavaScript | Mantén `npm start` abierto y ejecuta `adb reverse tcp:8081 tcp:8081` con la ruta de adb indicada arriba. |
| Puerto 3000 u 8081 ocupado | Revisa las otras terminales: puede haber otra API o Metro en ejecución. Detén esa instancia con `Ctrl+C` antes de iniciar otra. |
| Java o Android SDK no encontrados | Define `JAVA_HOME` y `ANDROID_HOME` en la terminal donde ejecutarás `npm run android`. |
| No aparece ningún dispositivo | Inicia Pixel_10 en Device Manager y vuelve a comprobar `adb devices`. |

Para un teléfono físico, configura en `src/config/api.ts` la IP local del equipo anfitrión, por ejemplo `http://192.168.1.20:3000/api/v1`. El teléfono y el equipo deben tener conectividad entre sí y acceso al puerto 3000. La dirección `10.0.2.2` corresponde al emulador Android.

## Apagar todo al terminar

1. Pulsa `Ctrl+C` en la terminal de la API y en la de Metro. Si aparece una pregunta para terminar el trabajo por lotes, confírmala.
2. Detén la app y cierra el emulador; con su identificador actual puedes usar:

   ```powershell
   $adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adb -s emulator-5554 shell am force-stop com.nexou
   & $adb -s emulator-5554 emu kill
   ```

3. Detén los procesos auxiliares de compilación y adb si ya no usarás Android:

   ```powershell
   Set-Location C:\Users\bdavi\Documents\NexoU
   $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
   & .\android\gradlew.bat --stop
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
   ```

4. Pulsa **Stop** en MySQL desde XAMPP para apagar MariaDB. Esto también detiene cualquier otro proyecto que use esa misma instancia SQL.

Los datos y las cuentas se conservan al apagar los servicios. Para volver a trabajar, sigue los pasos 1–5 en orden.
