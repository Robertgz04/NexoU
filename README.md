# NexoU — App Móvil 📱

Aplicación móvil para **registrar y consultar reportes de problemas dentro de una universidad**. Desarrollada con **React Native + Android Studio** para la asignatura _Desarrollo Móvil Integral_ (Ingeniería en Desarrollo y Gestión de Software, UTM / Extensión de la UTSC).

|                 |                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Equipo**      | Brayan David Casas Morales · Roberto Carlos De La Cruz Gonzalez · Devany Guadalupe Zapata Chávez |
| **Docente**     | Ing. Mario Alberto Chacón Muñoz                                                                  |
| **Grupo**       | IDGS10 · Periodo 22 sep – 27 nov 2026                                                            |
| **Metodología** | Scrum (Sprints semanales, ver `docs/fuentes/`)                                                   |

---

## 1. Funcionalidades implementadas (F01–F08)

| ID      | Funcionalidad                                                                                                       | Dónde vive                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **F01** | Inicio de sesión con redirección según rol                                                                          | `src/screens/LoginScreen.tsx` + `src/navigation/RootNavigator.tsx` |
| **F02** | Registro (nombre, matrícula/código, correo, contraseña, rol)                                                        | `src/screens/RegisterScreen.tsx` + `src/data/authRepository.ts`    |
| **F03** | Levantar reporte (título + descripción con validaciones)                                                            | `src/screens/student/NewReportScreen.tsx`                          |
| **F04** | Selección de **área** (edificio/espacio) y **categoría** (mobiliario, electricidad, agua, limpieza, equipos, otros) | `src/constants/catalog.ts` (chips en el formulario)                |
| **F05** | Evidencia fotográfica desde **cámara o galería**                                                                    | `NewReportScreen.tsx` (`react-native-image-picker`)                |
| **F06** | "Mis reportes" con estado y filtros (pendiente / en revisión / solucionado)                                         | `src/screens/student/MyReportsScreen.tsx`                          |
| **F07** | Panel del personal con **todos** los reportes + filtros por estado y área                                           | `src/screens/staff/AllReportsScreen.tsx`                           |
| **F08** | Actualización de estado por el personal (reflejo inmediato en el estudiante)                                        | `src/screens/ReportDetailScreen.tsx`                               |

**Delimitaciones respetadas** (sección 6 del documento de proyecto): sin chat, sin GPS (ubicación por lista de áreas), sin asignación automática a técnicos, sin sistema administrativo, sin IA, sin red social.

## 2. Stack tecnológico

- **React Native 0.87** (TypeScript estricto) — CLI oficial, sin Expo
- **Navegación:** `@react-navigation/native` + `native-stack` + `bottom-tabs`
- **Persistencia:** `@react-native-async-storage/async-storage` detrás de una capa de repositorios
- **Fotos:** `react-native-image-picker` (cámara/galería, base64 comprimido a 1280 px / calidad 0.5)
- **Seguridad básica:** contraseñas con **SHA-256 + sal** (`src/utils/sha256.ts`, verificada contra Node crypto en pruebas)
- **Arquitectura:** pantallas → repositorios → storage (capa única, lista para Firebase, ver §6)
- **Pruebas:** Jest (22 pruebas) · **Calidad:** ESLint + `tsc --noEmit`

## 3. Estructura del proyecto

```
NexoU/
├── App.tsx                      # Proveedor de auth + navegación raíz
├── index.js                     # Registro del componente raíz
├── src/
│   ├── components/              # PrimaryButton, FormField, Chip, StatusBadge,
│   │                            # ReportCard, EmptyList
│   ├── constants/catalog.ts     # Áreas, categorías, estados, límites (F04/F08)
│   ├── context/AuthContext.tsx  # Sesión global: login/registro/logout (F01/F02)
│   ├── data/
│   │   ├── storage.ts           # Capa AsyncStorage (único punto de persistencia)
│   │   ├── authRepository.ts    # Usuarios + sesión (F01/F02)
│   │   ├── reportRepository.ts  # Reportes + estados (F03–F08)
│   │   └── seed.ts              # Usuarios/reportes de demostración
│   ├── navigation/              # RootNavigator (por rol) + StudentTabs/StaffTabs
│   ├── screens/
│   │   ├── LoginScreen.tsx  RegisterScreen.tsx  ProfileScreen.tsx
│   │   ├── ReportDetailScreen.tsx               # Detalle + gestor de estado (F08)
│   │   ├── student/  HomeScreen · MyReportsScreen · NewReportScreen
│   │   └── staff/    AllReportsScreen
│   ├── theme.ts                 # Paleta y espaciados
│   ├── types/index.ts           # User, Report, Role, ReportStatus, Category
│   └── utils/                   # sha256 · validators · dates · photo
├── android/                     # ← Proyecto nativo (ábrelo en Android Studio)
├── __tests__/                   # sha256.test.ts · repositories.test.ts
├── docs/fuentes/                # Texto de los PDFs de origen
└── package.json
```

## 4. Requisitos y puesta en marcha

1. **Node.js ≥ 22.11** y **npm**
2. **Android Studio** actualizado (con soporte de SDK 37 / NL o superior) con instalado:
   - Android SDK Platform 37
   - Android SDK Build-Tools
   - Emulador (Device Manager) o un celular con depuración USB
3. **JDK 17+**: no uses el JDK 11 del sistema; usa el que trae Android Studio (JBR 17/21). Si compilas desde terminal:
   `$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'`

```powershell
# 1) Dependencias (sólo la primera vez)
npm install

# 2) Metro, el bundler JavaScript (terminal 1)
npm start

# 3) App en el emulador/dispositivo (terminal 2)
npm run android
```

**Abrir en Android Studio:** `File → Open… → c:\xamppold\htdocs\NexoU`
(abra la **carpeta raíz**, no sólo `android/`; AS sincroniza Gradle y el botón ▶
instala la APK en el dispositivo/emulador).

Build de APK desde terminal:

```powershell
cd android
.\gradlew.bat assembleDebug
# Salida: android\app\build\outputs\apk\debug\app-debug.apk
```

> Nota para macOS/Linux: usa `./gradlew` en lugar de `gradlew.bat`.
> Compilación verificada el 27/09/2026: `BUILD SUCCESSFUL` (app-debug.apk, 147 MB).

### Cuentas de demostración (sembradas en el primer arranque)

| Rol                    | Correo                | Contraseña |
| ---------------------- | --------------------- | ---------- |
| Estudiante             | `estudiante@nexou.mx` | `Demo1234` |
| Personal universitario | `personal@nexou.mx`   | `Demo1234` |

Con la cuenta de estudiante verás 3 reportes de ejemplo (uno por estado); con la
de personal se prueba el panel completo y el cambio de estado (F08).

**Flujo completo recomendado para la demo:**

1. Entrar como estudiante → pestaña **Nuevo** → llenar título, descripción, área,
   categoría y tomar una foto → **Publicar reporte**.
2. Cerrar sesión → entrar como **personal** → abrir el reporte → cambiar estado a
   _En revisión_ / _Solucionado_.
3. Volver a la sesión del estudiante → el reporte muestra el nuevo estado (F08).

## 5. Comandos de calidad (Definition of Done)

```powershell
npx tsc --noEmit     # Tipos estrictos     → 0 errores
npx eslint .         # Lint                → 0 errores
npx jest             # Pruebas (22)        → todas pasan
npm test             # alias de jest
```

Las pruebas cubren: SHA-256 contra Node crypto, registro (correo duplicado),
login (credenciales inválidas), creación/filtrado/actualización de reportes
(F03–F08) y siembra única de los datos demo.

## 6. Conexión a servicios en la nube (Firebase) — ruta prevista en el plan

Hoy la app funciona **100 % offline** con almacenamiento local para que el equipo
pueda demorar F01–F08 sin depender de configuración externa (riesgo #1 del plan:
"retraso en configuración de servicios en la nube"). La arquitectura ya está
preparada: **sólo los dos repositorios conocen el storage**.

Para migrar a Firebase Auth + Firestore + Storage (Sprints 1–5):

1. `npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage`
2. Crear el proyecto en la consola de Firebase, registrar la app Android con
   `applicationId` **`com.nexou`** y descargar `google-services.json` a
   `android/app/`.
3. Reemplazar el interior de `src/data/authRepository.ts`:
   `register/login` → `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`;
   guardar el `uid` como sesión.
4. Reemplazar el interior de `src/data/reportRepository.ts`:
   colección `reports` en Firestore; `photoBase64` → subida a Storage y guardar la
   URL en el campo.
5. **Ninguna pantalla se modifica** — sólo se reimplementan las funciones con las
   mismas firmas (ver comentario de cada repositorio).

## 7. Modelo de datos

La definición relacional para MySQL, con diccionario, relaciones y reglas, está en
[docs/modelo_datos_mysql.md](docs/modelo_datos_mysql.md). Los scripts están en
[database/mysql/](database/mysql/): esquema, catálogos, diez consultas de reportes
y validación de integridad. La aplicación mantiene su persistencia local hasta
implementar la API que utilice esta base.

```ts
User    { id, nombre, matricula, email, passwordHash, rol: 'estudiante'|'personal', createdAt }
Report  { id, ownerId, ownerNombre, titulo, descripcion, area, categoria,
          estado: 'pendiente'|'revision'|'solucionado',
          photoBase64: string|null, createdAt, updatedAt }
```

Claves AsyncStorage: `@nexou/users`, `@nexou/reports`, `@nexou/session`, `@nexou/seeded`.

## 8. Notas para el equipo (Sprints)

- **Repositorio:** `git init` ya realizado; hacer commit por tarea con mensaje
  `feat(F0x): …` / `fix: …` y revisión entre pares (DoD, sección 7 del plan).
- **Roles rotativos:** cada integrante toca las tres capas
  (UI en `screens/`, lógica en `data/`, calidad en `__tests__/`).
- **Pruebas al hacer merge:** `npx tsc --noEmit && npx eslint . && npx jest`.
- Los textos de los PDF fuente están en `docs/fuentes/` como referencia rápida.
- Delimitaciones: al agregar funciones nuevas, revisar primero la sección 6 del
  documento de proyecto (no-chat, no-GPS, no-IA, no-red-social).

---

_Universidad Tecnológica Montemorelos · Desarrollo Móvil Integral · 2026_
