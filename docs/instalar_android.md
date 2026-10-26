# Compilar e instalar NexoU en Android

La app se conecta a `https://nexou.api.avorainc.com/api/v1`. Para usarla en el celular no necesitas `.env`, MySQL, backend local ni Metro.

## Descargar la APK de GitHub

Cada envío a `master` ejecuta el workflow **Android APK**. En GitHub, abre **Actions → Android APK → ejecución → Artifacts**, descarga `NexoU-android-…` y descomprime el ZIP. Copia `app-release.apk` al teléfono, ábrela y permite instalar aplicaciones desde esa fuente cuando Android lo solicite. Necesitas Android 7.0 o superior y conexión a Internet.

La APK usa la firma de desarrollo incluida en el repositorio para pruebas en dispositivos. Para publicar en Google Play hay que configurar una firma propia. Si tienes una instalación firmada con otra clave, Android no permitirá actualizarla: desinstalarla borra sus datos locales.

## Compilar desde Windows (PowerShell)

Instala Git, Node.js 22.11 o superior y Android Studio. En SDK Manager instala Android SDK Platform 37, Build-Tools 37.0.0, NDK 27.1.12297006 y Platform-Tools. Utiliza JDK 17 o superior.

```powershell
git clone https://github.com/Robertgz04/NexoU.git
cd NexoU
# Si ya lo clonaste: git pull --ff-only origin master
npm ci
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew.bat assembleRelease --no-daemon --max-workers=2
cd ..
```

La APK queda en `android\app\build\outputs\apk\release\app-release.apk`; incluye JavaScript y funciona sin el servidor Metro. En Linux/macOS ejecuta `./gradlew assembleRelease --no-daemon --max-workers=2` desde `android`, con Java y Android SDK configurados.

Para instalar por USB, activa **Opciones de desarrollador → Depuración USB**, conecta el celular y acepta la autorización:

```powershell
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
& $adb devices
& $adb install -r .\android\app\build\outputs\apk\release\app-release.apk
```

## Notificaciones push

Para compilar con Firebase coloca la configuración del proyecto para `com.nexou` en `android/app/google-services.json`. En GitHub Actions configura el secret `GOOGLE_SERVICES_JSON` con el contenido JSON completo. Sin este archivo la APK permite reportar y consultar información, pero no activar push. La cuenta de servicio de Firebase Admin permanece exclusivamente en el servidor; nunca debe incluirse en la APK o Git. La entrega push también requiere que el servidor tenga sus credenciales y `PUSH_ENABLED=true`, y que el usuario active las notificaciones y conceda el permiso en el celular.
