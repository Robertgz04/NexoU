# NexoU — App Móvil 📱

Para iniciar la app Android, Metro, la API y MariaDB en este equipo: [guía de arranque local](docs/guia_arranque_local.md).

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
| **F02** | Registro público de estudiantes con correo coincidente con matrícula                                                        | `src/screens/RegisterScreen.tsx` + `src/data/authRepository.ts`    |
| **F03** | Levantar reporte (título + descripción con validaciones)                                                            | `src/screens/student/NewReportScreen.tsx`                          |
| **F04** | Selección de **área** (edificio/espacio) y **categoría** (mobiliario, electricidad, agua, limpieza, equipos, otros) | API `/catalogs` (IDs activos en el formulario)                |
| **F05** | Evidencia fotográfica desde **cámara o galería**                                                                    | `NewReportScreen.tsx` (`react-native-image-picker`)                |
| **F06** | "Mis reportes" con estado y filtros (pendiente / en revisión / solucionado)                                         | `src/screens/student/MyReportsScreen.tsx`                          |
| **F07** | Panel del personal con **todos** los reportes + filtros por estado y área                                           | `src/screens/staff/AllReportsScreen.tsx`                           |
| **F08** | Actualización de estado por el personal (reflejo inmediato en el estudiante)                                        | `src/screens/ReportDetailScreen.tsx`                               |

**Delimitaciones respetadas** (sección 6 del documento de proyecto): sin chat, sin GPS (ubicación por lista de áreas), sin asignación automática a técnicos, sin sistema administrativo, sin IA, sin red social.

## 2. Stack tecnológico

- **React Native 0.87** (TypeScript estricto) — CLI oficial, sin Expo
- **Navegación:** `@react-navigation/native` + `native-stack` + `bottom-tabs`
- **Persistencia:** API Express 5 + MariaDB; AsyncStorage solo para preferencias y metadatos locales
- **Fotos:** `react-native-image-picker` (cámara/galería, archivo multipart, hasta 5 MiB)
- **Autenticación:** bcrypt en servidor, sesiones opacas revocables y Keychain/Keystore en móvil
- **Arquitectura:** pantallas → repositorios HTTP → API → MariaDB; evidencia en almacenamiento privado
- **Pruebas:** Jest móvil + pruebas backend e integración SQL aislada; ESLint y TypeScript

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
│   ├── navigation/              # RootNavigator (por rol) + StudentTabs/StaffTabs
│   ├── screens/
│   │   ├── LoginScreen.tsx  RegisterScreen.tsx  ProfileScreen.tsx
│   │   ├── ReportDetailScreen.tsx               # Detalle + gestor de estado (F08)
│   │   ├── student/  HomeScreen · MyReportsScreen · NewReportScreen
│   │   └── staff/    AllReportsScreen
│   ├── theme.ts                 # Paleta y espaciados
│   ├── types/index.ts           # User, Report, Role, ReportStatus, Category
│   └── utils/                   # sha256 · validators · dates · photo
├── backend/                     # API, OpenAPI, pruebas, cola push
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
npm ci
npm --prefix backend ci
npm run db:migrate
npm run api:dev # mantener en otra terminal

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

### Cuentas iniciales e integración

Los correos son `nexou-e001@virtual.utsc.edu.mx` y `nexou-p001@virtual.utsc.edu.mx`.
Las contraseñas permanecen en `.local/cuentas-iniciales.json`; no se incluyen en Git.
El registro público permite solo estudiantes; personal se provisiona por comando administrativo.
No se importan automáticamente los usuarios/reportes locales anteriores.

Configurar la URL pública en [src/config/api.ts](src/config/api.ts). Android emulador
usa `10.0.2.2:3000`; teléfono físico usa IP LAN. Reconstruir la app por la nueva
dependencia Keychain/Keystore. En macOS instalar los pods para iOS.

Flujo de prueba: estudiante crea reporte → personal cambia estado con nota →
estudiante vuelve al detalle o actualiza la lista. Cada dispositivo consulta SQL
mediante la API, sin credenciales SQL en el bundle.

## 5. Comandos de calidad (Definition of Done)

```powershell
npx tsc --noEmit     # Tipos estrictos     → 0 errores
npm run lint         # Lint                → 0 errores
npx jest             # Pruebas móviles        → todas pasan
npm test             # alias de jest
```

Las pruebas cubren contratos HTTP, almacenamiento seguro de sesión, pantallas,
filtros/paginación, conservación del formulario y fallos de actualización.
El backend añade validación, ventanas temporales y una integración MariaDB aislada.

## 6. API y notificaciones

Arranque, configuración, alta administrativa, pruebas, mantenimiento y despliegue
en [backend/README.md](backend/README.md). Contrato en
[backend/openapi.json](backend/openapi.json).
Firebase se usa únicamente para mensajería: el backend tiene un outbox duradero,
reintentos y eliminación de tokens inválidos. El envío real requiere conectar las
credenciales Firebase/APNs. La app ofrece recarga manual; no hay cola offline.

## 7. Modelo de datos

La definición relacional para MySQL, con diccionario, relaciones y reglas, está en
[docs/modelo_datos_mysql.md](docs/modelo_datos_mysql.md). Los scripts están en
[database/mysql/](database/mysql/): esquema, catálogos, diez consultas de reportes
y validación de integridad. La aplicación utiliza esta base mediante la API HTTP.

```ts
User    { id, nombre, matricula, email, rol: 'estudiante'|'personal', createdAt }
Report  { id, folio, ownerId, ownerNombre, titulo, descripcion, area, categoria,
          estado: 'pendiente'|'revision'|'solucionado',
          evidenceUrl: string|null, createdAt, updatedAt }
```

AsyncStorage conserva preferencias e instalación; Keychain/Keystore guarda el token. Las claves históricas locales no se leen como credenciales ni se importan al servidor.

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
