# Guía de diseño del panel de estudiante · NexoU

Fecha: 6 de octubre de 2026. Plataforma: React Native para Android e iOS.

Esta guía toma el inicio aprobado como referencia visual y explica cómo extender su composición, legibilidad y movimiento a las demás vistas del estudiante. Documenta la implementación actual y distingue las adaptaciones propuestas: estas recomendaciones no significan que las demás pantallas ya se hayan rediseñado.

## 1. La experiencia que buscamos

El estudiante debe poder reportar una incidencia, consultar su estado y encontrar sus datos sin aprender una interfaz distinta en cada pantalla. El campus aporta identidad; la superficie blanca permite trabajar. La ilustración recibe al usuario y cede espacio al contenido cuando se desplaza.

Reglas compartidas:

- Mantener español claro, títulos concretos y una acción principal por tarea.
- Usar iconos vectoriales de Lucide mediante `AppIcon`. No usar emojis ni caracteres de texto como sustitutos de iconos.
- Colocar títulos, campos, estados y acciones sobre superficies opacas y legibles.
- Mantener la navegación: Inicio, Reportar, Mis reportes y Perfil. Detalle es una vista secundaria con regreso.
- Conservar datos reales, validación, repositorios y navegación existentes al cambiar el diseño.
- Mostrar información inmediatamente. La animación debe acompañar la interacción, sin retrasar el acceso a los controles.

## 2. Cómo se construyó el inicio

### De la referencia a una jerarquía funcional

Se conservó esta secuencia: campus, saludo y marca, acción «Levantar reporte», resumen de estados, categorías y actividad reciente. La acción principal es el elemento de mayor peso después del saludo. Los estados se distinguen por texto, icono y color; las categorías ofrecen accesos reconocibles y los reportes recientes llevan al detalle.

Se mantuvieron la carga de reportes del propietario, la actualización al entrar en la pantalla, el gesto para actualizar y las rutas existentes. La actividad reciente se ordena por fecha descendente y muestra hasta tres reportes; el historial completo vive en Mis reportes.

### Resolver la legibilidad antes de decorar

Los primeros ajustes dejaron texto sobre árboles y edificios porque el recorte y la altura de la imagen no coincidían con el inicio del contenido. Una hoja blanca recta solucionó el contraste, pero rompía la transición orgánica de la referencia. El resultado aprobado combina una superficie blanca opaca con un borde curvo independiente de la imagen.

No basta con cambiar de asset: hay que controlar el encuadre, el tamaño de la ilustración y el punto donde empieza la superficie del contenido.

### Selección y encuadre del asset

Se eligió `src/assets/NexoU_NewFondo_Login.png` de la galería existente. Aunque su nombre corresponde al acceso, su escena de campus funciona para el inicio. Actualmente se obtiene mediante `SCREEN_BACKGROUNDS.login`.

La imagen es una capa absoluta detrás del scroll, con ancho explícito del 100 %. No participa en el tamaño de los textos ni en el cálculo de las tarjetas. Su altura se calibra para mostrar la escena del campus antes de cubrir la zona inferior con la superficie blanca.

Valores actuales de `HomeScreen`:

```tsx
const campusHeight = Math.max(210, viewportHeight * 0.34);
const collapseDistance = Math.max(1, campusHeight - insets.top);
// Para este asset, el campus ocupa aproximadamente el 32 % de la imagen.
const artworkHeight = campusHeight / 0.32;
```

`viewportHeight` se obtiene de `onLayout` del contenedor; el alto de la ventana es el valor inicial. El cálculo usa el área real disponible con la barra de pestañas presente. La imagen usa `resizeMode="stretch"` en esta composición calibrada.

**Al cambiar de asset:** inspeccionar primero sus proporciones. El factor `0.32` pertenece a esta imagen, no es una constante universal. Ajustarlo para que se vean edificios, personas y paisaje. Revisar si `stretch` deforma la escena en el dispositivo objetivo; cuando ocurra, preferir un recorte controlado que conserve la proporción. No copiar los números sin comprobar el resultado.

### La curva ocupa todo el ancho

La hoja y la curva viven fuera del contenedor que aporta el margen horizontal del contenido. Esa separación corrige el defecto en el que la curva terminaba antes del borde derecho.

Estructura conceptual:

```text
Contenedor raíz
  Ilustración absoluta del campus
  Capa blanca animada sobre la ilustración
  Scroll del contenido, respetando el área segura superior
    Espaciador de altura collapseDistance
    Hoja blanca de ancho completo
      Curva SVG animada de ancho completo
      Contenido con margen horizontal de 16
        Saludo y marca
        Acción principal
        Estados, categorías y actividad
```

La curva se dibuja con `react-native-svg`. Su relleno y el de la hoja deben coincidir exactamente:

```tsx
<Svg
  width="100%"
  height={50}
  viewBox="0 0 400 50"
  preserveAspectRatio="none"
>
  <Path
    d="M0 38 C105 -12 270 -12 400 38 L400 50 L0 50 Z"
    fill={colors.surface}
  />
</Svg>
```

El contenedor de la curva tiene posición absoluta, `top: -49`, `left: 0` y `right: 0`. El solapamiento de una unidad evita una separación visible entre SVG y hoja. No aplicar a esta capa el padding de 16 del panel ni recortarla con `overflow: 'hidden'` en su hoja. No añadir una sombra o borde a la unión: deben percibirse como una sola superficie.

### El scroll libera espacio

El campus deja de ser una cabecera que reserva espacio permanentemente. El espaciador y la hoja forman parte del contenido desplazable; al subir, la hoja llega a la parte superior y se aprovecha el área disponible. La barra inferior queda a cargo del navegador de pestañas.

El panel mantiene un alto mínimo de `viewportHeight - insets.top` para permitir la expansión incluso con pocos reportes. El padding inferior actual es `spacing.xl + 20` dentro de la hoja blanca; no colocar ese espacio fuera de la hoja, donde podría volver a verse la ilustración.

## 3. Movimiento del inicio

Se usa `Animated` de React Native, junto con SVG y las transiciones de React Navigation. No se instaló Motion ni Reanimated. Los efectos actuales se apoyan en transformaciones y opacidad ejecutadas con el controlador nativo.

### Una única señal de desplazamiento

```tsx
const scrollY = useRef(new Animated.Value(0)).current;

<Animated.ScrollView
  scrollEventThrottle={16}
  decelerationRate="normal"
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  )}
/>
```

No actualizar estado de React en cada evento de scroll. Los valores derivados comparten `scrollY`, evitando desincronización entre campus, curva y blanco.

### Tres cambios coordinados

| Capa | Valor al inicio | Valor al completar el colapso | Propósito |
|---|---|---|---|
| Campus | `translateY: 0` | `translateY: -24` | Desplazamiento leve que acompaña la subida |
| Curva | `scaleY: 1` | `scaleY: 0.01` | Aplanar progresivamente la transición |
| Capa blanca | Opacidad `0` | Opacidad `1` | Ocultar la ilustración cuando el contenido ocupa la pantalla |

Las interpolaciones usan `extrapolate: 'clamp'`: un gesto de actualización o un desplazamiento más largo no debe extender el efecto fuera de sus límites.

La escala de la curva se compensa con una traslación para mantener su base conectada a la hoja:

```tsx
const curveScale = scrollY.interpolate({
  inputRange: [0, collapseDistance],
  outputRange: [1, 0.01],
  extrapolate: 'clamp',
});

const curveTransform = [
  { translateY: Animated.multiply(Animated.subtract(1, curveScale), 25) },
  { scaleY: curveScale },
];
```

El blanco aparece gradualmente: `inputRange: [0, collapseDistance * 0.8, collapseDistance]` y `outputRange: [0, 0.35, 1]`. No cambia mediante un booleano que provoque un corte brusco. Es una relación con el gesto, no una animación con duración fija; al regresar arriba, se recupera la composición inicial.

### Respuesta compartida al tocar

`MotionTouchable` conserva la API de `TouchableOpacity` y añade una respuesta interrumpible:

- Presionar: escala `0.975`.
- Soltar: volver a `1`.
- Resorte: `stiffness: 420`, `damping: 32`, `mass: 0.7`.
- Ejecutar con `useNativeDriver: true` y detener el movimiento anterior antes de iniciar otro.
- Conservar `onPressIn`, `onPressOut`, `onPress`, estados deshabilitados y propiedades de accesibilidad.

Reutilizarlo en botones, categorías, filtros y filas accionables. No animar tarjetas estáticas como si fueran controles. Si un componente necesita su propia transformación, combinarla explícitamente: el wrapper actual añade su propio `transform` y no debe sobrescribir una transformación necesaria del diseño.

### Navegación y movimiento reducido

Las pestañas usan un fundido de 180 ms. La navegación secundaria usa `slide_from_right` con duración configurada de 220 ms; verificar el comportamiento efectivo en Android e iOS, porque la transición depende del navegador nativo.

`useReducedMotion` consulta `AccessibilityInfo.isReduceMotionEnabled()` y escucha cambios. Con movimiento reducido, no hay escala al tocar, ni desplazamiento adicional del campus, ni aplanamiento animado de la curva; la transición de opacidad permanece. La navegación usa `animation: 'none'`.

Respetar este comportamiento en cualquier nuevo efecto. No introducir entradas escalonadas para cada sección ni animaciones que se repitan al navegar entre pestañas.

## 4. Sistema visual y legibilidad

Usar `src/theme.ts` para tokens, `src/constants/catalog.ts` para metadatos de estados y `AppIcon` para iconografía.

| Elemento | Base actual | Aplicación |
|---|---|---|
| Azul principal | `#0F3D62` | Títulos, iconos y acción principal |
| Texto | `#0E2A3F` | Contenido y etiquetas |
| Texto secundario | `#6B7A8C` | Fechas, ubicaciones y ayudas |
| Turquesa | `#14B3A0`; variante oscura `#0D8C7E` | Marca, selección y enlaces según contraste |
| Superficie | `#FFFFFF` | Hoja, campos y contenido legible |
| Fondo general | `#F4F7FA` | Áreas auxiliares |
| Espaciado | `4 / 8 / 16 / 24 / 32` | Ritmo compartido |
| Radios | `8 / 12 / 16 / 22`; pill `999` | Campos, tarjetas, acción principal y badges |

Valores tipográficos del inicio: saludo 28/800, subtítulo 16, sección 19/800, acción principal 16/800, categorías 12.5/700. Son referencias de jerarquía, no una obligación de reducir todos los textos al tamaño de las categorías. Para otras vistas, partir de `typography.body` de 15 y títulos de 26–28; permitir que ayudas y etiquetas crezcan con la configuración del sistema.

Criterios de lectura:

- Contraste mínimo objetivo: 4.5:1 en texto normal y 3:1 en texto grande. Comprobar cada combinación real; un token existente no garantiza accesibilidad.
- Mantener el texto de estados sobre un fondo tenue y acompañarlo de icono. Usar variantes más oscuras cuando verde o ámbar no alcancen el contraste necesario.
- Reservar el ancho de badges y acciones. Truncar un título en una lista solo si el detalle permite leerlo completo.
- No reducir automáticamente un nombre, estado o ayuda esencial hasta volverlo ilegible. En anchuras pequeñas o con letra grande, pasar a dos columnas o filas apiladas.
- Objetivo de área táctil: al menos 44×44 en iOS y 48×48 en Android; ampliar con espacio o `hitSlop` cuando corresponda.
- Respetar las áreas seguras y mantener visibles los indicadores del sistema. Ajustar el estilo de la barra de estado al fondo real.

Las tarjetas del inicio usan radio 16 y `shadow.card`: opacidad 0.08, radio de sombra 12, desplazamiento vertical 4 y elevación Android 2. La acción principal usa radio 22 y `shadow.floating`. Mantener sombras discretas; no añadir bordes gruesos para compensar una superficie poco legible.

### Estados e iconos coherentes

El catálogo de reportes distingue Pendiente con `FileText` y rosa, En revisión con `Clock` y ámbar, y Solucionado con `Check` y verde. `StatusBadge` consume esos metadatos.

Existe una diferencia pendiente de normalizar: algunos tokens antiguos de `theme.ts` todavía asignan ámbar a pendiente y azul a revisión, mientras que las tarjetas de inicio ya siguen rosa/ámbar/verde. Al adaptar otras vistas, tomar `statusMeta` como referencia del estado del reporte. No propagar esa discrepancia ni confundir un reporte pendiente con un error de formulario.

Categorías: `Armchair`, `Plug`, `Droplet`, `BrushCleaning`, `Laptop` y `Ellipsis`. `AppIcon` usa trazo 1.8. Tamaños habituales: 20–22 para controles, 26 para categorías y navegación, 28–32 para acciones destacadas.

## 5. Adaptación a las demás vistas

Estas son instrucciones para el siguiente trabajo de diseño. Mantener el lenguaje del inicio no exige repetir su gran ilustración en todas las tareas.

| Vista | Objetivo principal | Composición recomendada |
|---|---|---|
| Reportar | Enviar una incidencia sin perder datos | Campus compacto, título claro, formulario sobre blanco y envío visible |
| Mis reportes | Encontrar un reporte y conocer su estado | Cabecera breve, filtros y lista que aprovecha toda la pantalla |
| Detalle | Comprender el reporte y su seguimiento | Título completo, estado, evidencia, ubicación y actividad |
| Perfil | Consultar datos y acciones de cuenta | Identidad legible y grupos de opciones sobre blanco |

### Reportar · `NewReportScreen`

Ordenar los campos de forma natural: título, área, categoría, descripción y evidencia. Conservar validaciones y límites actuales. La foto sigue siendo opcional; explicar su utilidad sin convertirla en un bloqueo.

- Usar una ilustración más corta que en Inicio; la tarea requiere espacio para el formulario y el teclado.
- Mantener etiquetas visibles, incluso cuando el campo tenga valor. Un placeholder no reemplaza una etiqueta.
- Mostrar errores junto al campo y orientar la corrección. Evitar desplazar o borrar datos al aparecer un error.
- Reutilizar `FormField`, `SelectField`, `PrimaryButton` y `MotionTouchable`.
- Mantener separados «Tomar foto» y «Seleccionar galería», con vista previa y una acción clara para eliminar evidencia.
- Durante el envío, bloquear envíos duplicados y mostrar el estado de carga. Después del éxito, permitir continuar al seguimiento existente.
- Conservar scroll y manejo del teclado; probar el último campo y la acción de envío con teclado abierto. Evitar que la barra inferior o un botón fijo cubran los campos.

### Mis reportes · `MyReportsScreen`

La lista tiene prioridad sobre la ilustración. Mantener `FlatList` y su virtualización; colocar la cabecera en `ListHeaderComponent` en lugar de anidar la lista en un `ScrollView` vertical.

- Mantener «Todos» y los filtros de estado con sus conteos reales.
- Diferenciar selección con forma, relleno o peso además de color. Conservar `accessibilityState.selected`.
- Cada tarjeta debe permitir reconocer título, ubicación, fecha y estado en una mirada.
- La apertura del detalle y la expansión de una nota son acciones diferentes: mantener controles y etiquetas accesibles que expliquen cada una.
- Distinguir «no has creado reportes» de «ningún reporte coincide con este filtro» y ofrecer una recuperación pertinente.
- Preservar actualización manual, filtro y posición de lectura cuando la navegación lo permita.
- Si se incorpora cabecera colapsable, conectar su movimiento al scroll de `FlatList`; no envolverla en otra lista vertical.

### Detalle · `ReportDetailScreen`

Presentar el título completo y el estado primero. La evidencia aporta contexto, pero no debe ocultar folio, ubicación, categoría o fecha.

- Mostrar una alternativa clara cuando no exista foto y estados separados de carga, error y reporte no encontrado.
- Mantener el seguimiento en orden comprensible con texto legible sobre blanco.
- Evitar aplicar el truncado de la lista al título o la descripción completa del detalle.
- El estudiante consulta seguimiento. Mantener los cambios de estado restringidos al rol que ya los tiene autorizados.
- La transición de navegación da continuidad; no volver a animar cada dato al entrar.

### Perfil · `ProfileScreen`

Usar nombre y rol como encabezado, seguidos de identificador y correo. Permitir saltos de línea en nombres o correos largos.

- Mantener un encabezado compacto y la lectura del contenido sobre superficie blanca.
- Reutilizar `MenuRow` para grupos de acciones, con icono y texto que expliquen el destino.
- Diferenciar datos de solo lectura de acciones editables. No convertir información estática en botones.
- Separar visualmente el cierre de sesión de las acciones frecuentes sin hacerlo competir con la acción principal de la vista.
- Conservar opciones por rol y comportamiento de cuenta; la guía no añade funciones que todavía no existan.

## 6. Procedimiento para implementar una vista

1. Identificar la tarea principal, el contenido real, los estados y los controles existentes.
2. Revisar el asset y su proporción antes de decidir la altura de la cabecera. Definir qué parte de la escena debe verse.
3. Crear las capas por separado: ilustración, transición de superficie y contenido. La curva va en ancho completo; el padding pertenece al contenido.
4. Resolver primero la legibilidad con blanco opaco y una jerarquía simple.
5. Elegir el contenedor adecuado: scroll para formularios cortos, lista virtualizada para historiales.
6. Integrar áreas seguras, barra inferior y teclado. Comprobar que el contenido pueda ocupar el espacio liberado al colapsar.
7. Reutilizar iconos y componentes compartidos. Evitar copias de paletas o animaciones con números distintos por pantalla.
8. Añadir movimiento que explique el gesto, la selección o la navegación. Usar transformaciones/opacidad y el controlador nativo cuando esas propiedades lo permitan.
9. Probar con datos reales y situaciones extremas. Corregir los problemas en una ronda conjunta y confirmar el resultado.

Antes de repetir el patrón en varias vistas, conviene extraer un contenedor compartido de cabecera colapsable con asset, proporción del campus y altura configurables. Todavía no existe ese componente: el inicio conserva su implementación específica. `ScreenBackground` tiene soporte de hoja curva estática, pero no reemplaza por sí solo el comportamiento colapsable de `HomeScreen`.

## 7. Verificación de aceptación

### Composición y lectura

- La curva llega a ambos extremos, sin huecos ni escalones, en pantalla pequeña y ancha.
- La ilustración muestra la parte elegida del campus; no queda reducida a árboles o cielo.
- Ningún título, campo o badge esencial se superpone a una escena con contraste variable.
- La superficie sigue siendo blanca durante el desplazamiento y al final del contenido.
- Nombres largos, títulos largos, cero reportes, muchos reportes y letra grande conservan una lectura útil.
- La última acción y el último elemento pueden verse sin quedar bajo la navegación o el teclado.

### Interacción y movimiento

- Subir transforma la cabecera de forma continua y libera el área de contenido; regresar recupera la vista inicial.
- Alternar rápidamente la dirección del scroll no provoca saltos ni desincronización.
- Actualizar mediante el gesto no rompe la interpolación ni bloquea la navegación.
- Pulsaciones sucesivas no acumulan resortes ni dejan controles encogidos.
- Movimiento reducido conserva todos los contenidos y controles y elimina el movimiento espacial adicional.
- Las pestañas y el regreso al detalle mantienen continuidad sin animaciones de entrada repetidas.

### Comprobaciones técnicas

```powershell
npx tsc --noEmit
npx eslint src
npm test -- --runInBand
```

Complementar los comandos con una revisión en emulador o dispositivo: inicio, desplazamiento intermedio, cabecera colapsada y retorno; teclado abierto en formularios; lector de pantalla y movimiento reducido. Una captura confirma composición, pero no demuestra fluidez: observar el gesto continuo y, si hay tirones, medir el rendimiento en una compilación de producción.

Estado de verificación al redactar esta guía: inicio y estado colapsado revisados en emulador Android; TypeScript y lint sin errores, con advertencias de estilos inline. La suite obtuvo 34 pruebas correctas y dos fallos existentes de expectativas de texto en pantallas de personal. No se ha verificado todavía el conjunto de tamaños ni iOS; no tomar la guía como certificación de accesibilidad o rendimiento en todos los dispositivos.

## 8. Archivos de referencia

- [Inicio y composición colapsable](../src/screens/student/HomeScreen.tsx).
- [Respuesta al tocar controles](../src/components/MotionTouchable.tsx).
- [Preferencia de movimiento reducido](../src/hooks/useReducedMotion.ts).
- [Iconos compartidos](../src/components/AppIcon.tsx).
- [Tema visual](../src/theme.ts) y [catálogo de estados](../src/constants/catalog.ts).
- [Fondos disponibles](../src/constants/backgrounds.ts) y [asset usado en Inicio](../src/assets/NexoU_NewFondo_Login.png).
- [Navegación del estudiante](../src/navigation/StudentTabs.tsx) y [navegación secundaria](../src/navigation/RootNavigator.tsx).
- [Formulario de reporte](../src/screens/student/NewReportScreen.tsx), [historial](../src/screens/student/MyReportsScreen.tsx), [detalle](../src/screens/ReportDetailScreen.tsx) y [perfil](../src/screens/ProfileScreen.tsx).

El criterio de aprobación es que cada vista conserve la identidad del inicio y haga su tarea más clara: campus bien encuadrado cuando aporte contexto, contenido legible y movimiento ligado a la interacción.

## 9. Primera etapa de reestructuración

Se inició la adaptación de Reportar en `NewReportScreen`. Ahora utiliza `CampusScrollScreen`, un contenedor compartido con asset, proporción del campus y altura configurables. La cabecera compacta mide 160 unidades y usa la misma escena que Inicio, con proporción 0.32. El scroll coordina campus, curva y superficie blanca y respeta movimiento reducido. Inicio conserva por ahora su implementación aprobada.

El formulario mantiene campos, límites, repositorio y navegación de seguimiento. Cámara y galería tienen controles separados apilados; la evidencia continúa siendo opcional. El envío incluye un bloqueo inmediato contra pulsaciones duplicadas y conserva los datos ante errores. La solicitud explícita del permiso de cámara se limita a Android.

Esta etapa no completa la adaptación de Mis reportes, Detalle ni Perfil. La composición nueva y el teclado requieren revisión visual en Android e iOS antes de aprobarse.

## 10. Adaptación de Mis reportes

La cabecera breve de campus y su curva viven en `ListHeaderComponent` de `FlatList`, de modo que se desplazan con el historial y liberan espacio. La superficie completa es blanca; no se añade un contenedor vertical de scroll ni movimiento espacial adicional. Los filtros se distribuyen en filas adaptables, con iconos, conteos reales, selección por relleno y `accessibilityState.selected`.

`ReportHistoryCard` separa abrir el reporte de expandir su nota de estado, con controles hermanos y etiquetas explícitas. Conserva título, ubicación, categoría, fecha y estado; admite títulos de dos líneas y metadatos que crecen con el texto. La foto solo aparece cuando existe evidencia.

La vista distingue carga, error con reintento, historial vacío y filtro sin resultados. La actualización mantiene el filtro y no descarta datos ante errores. Ámbar y verde del catálogo usan variantes oscuras para mejorar el contraste de badges.

Verificación técnica: TypeScript y lint sin errores (tres advertencias existentes); tres pruebas nuevas correctas para filtros, recuperación, nota, navegación y actualización. La suite completa obtuvo 39 pruebas correctas y los dos fallos conocidos de texto en personal. La revisión visual en dispositivo de esta adaptación sigue pendiente, al igual que Detalle y Perfil.

## 11. Adaptación del detalle de reporte

`ReportDetailScreen` presenta primero el título completo, el badge de estado y el folio. La vista utiliza una superficie blanca continua y conserva la cabecera y el regreso del navegador nativo; no repite la ilustración de campus ni añade animaciones de entrada. Ubicación, categoría, fecha y reportante permiten saltos de línea. La descripción se muestra completa y el contenido respeta el área segura inferior.

La evidencia aparece después de los datos y la descripción, con ajuste `contain` para mostrar la fotografía completa. Hay alternativas distintas para ausencia de foto y error al mostrarla. Carga, fallo de consulta con reintento y reporte no encontrado con regreso tienen estados separados.

El seguimiento muestra la creación y el estado actual con su última actualización. El repositorio no conserva un historial de transiciones ni asignaciones: no se presentan pasos intermedios como eventos registrados ni se reutiliza la última actualización como fecha de cada paso.

La gestión de estado se conserva para personal; el estudiante consulta. El manejador también verifica el rol y bloquea solicitudes duplicadas durante la actualización.

Verificación técnica: TypeScript y lint sin errores, con tres advertencias existentes; cinco pruebas nuevas correctas para contenido completo, consulta del estudiante, reintento, regreso, evidencia fallida y actualización del personal. La suite completa obtuvo 44 pruebas correctas y los dos fallos conocidos de texto en personal. La revisión visual en Android e iOS sigue pendiente. Perfil es la siguiente vista por adaptar.

## 12. Adaptación de Perfil

`ProfileScreen` reutiliza `CampusScrollScreen` con campus compacto de 136 unidades y proporción 0.32. Nombre, rol, identificador y correo viven sobre la hoja blanca; nombre y correo permiten saltos de línea y selección de texto. Se retiró el indicador de lápiz del avatar porque no existía una acción de edición asociada.

El resumen mantiene los conteos reales del propietario y se distribuye en dos columnas con iconos del catálogo, sin convertir los datos en botones. Incluye carga y error con reintento, manteniendo disponibles las opciones de cuenta. Los grupos Cuenta y actividad, Preferencias y ayuda reutilizan `MenuRow`. Cerrar sesión queda separado por espacio y divisor, conservando la confirmación existente.

Se conservan Datos personales, Configuración y Ayuda y soporte con sus comportamientos actuales, así como Mis reportes para estudiante y Panel de incidencias para personal. No se añadieron funciones de edición ni ajustes nuevos.

Verificación: tres pruebas nuevas correctas para datos largos, navegación por rol, confirmación de cierre de sesión y recuperación del resumen. La suite completa obtuvo 47 pruebas correctas y los dos fallos conocidos de personal. La revisión visual en dispositivo sigue pendiente; la implementación de Reportar, Mis reportes, Detalle y Perfil ya está adaptada, pero no constituye una certificación de tamaños, iOS o accesibilidad.

## 13. Consulta y edición de datos personales

Perfil abre la nueva ruta secundaria `PersonalData` para ambos roles. `PersonalDataScreen` utiliza la cabecera nativa con regreso, superficie blanca, título de 28, etiquetas visibles, formulario desplazable y manejo de teclado. Nombre, matrícula o código y correo son editables; el rol permanece de solo lectura.

Guardar cambios valida campos obligatorios y formato del correo. El repositorio rechaza correos de otras cuentas. Al cambiar el correo se requiere la contraseña actual: el sistema verifica el hash con el correo anterior y genera el nuevo hash con el correo actualizado, manteniendo la misma contraseña de acceso. Nombre e identificador pueden actualizarse sin cambiar las credenciales. El ID, rol y fecha de creación se conservan. Los reportes existentes mantienen su nombre de reportante registrado al crearse.

La actualización persiste en el repositorio de cuentas y actualiza el usuario del contexto de sesión. Los errores conservan el formulario; el envío bloquea solicitudes duplicadas y deshabilita campos. El regreso con cambios sin guardar ofrece seguir editando o descartar. El resultado correcto se anuncia en la vista.

Verificación técnica: cinco pruebas nuevas para validación, datos conservados ante errores, persistencia, correo duplicado, contraseña incorrecta y acceso con el correo actualizado; suite de 52 pruebas correctas y dos fallos conocidos de personal. TypeScript sin errores. La revisión visual con teclado, texto grande y dispositivos Android/iOS sigue pendiente.

## 14. Configuración

Perfil abre la ruta secundaria `Settings` para ambos roles. La pantalla mantiene cabecera nativa, superficie blanca, títulos de 28 y 19, texto legible y áreas seguras. Ofrece dos preferencias persistentes del dispositivo: Reducir movimiento y Mostrar miniaturas en Mis reportes. Ambas se aplican a las cuentas que utilizan el dispositivo.

`PreferencesProvider` restaura las preferencias al iniciar la app y persiste cada cambio antes de aplicarlo. Los controles se bloquean durante carga o guardado; ante un error se mantiene la preferencia anterior y se permite repetir el cambio. `useReducedMotion` combina la preferencia de la app con la del sistema; desactivar el ajuste de la app nunca anula la accesibilidad del sistema. Ocultar miniaturas no elimina fotografías ni cambia la evidencia disponible en detalle.

La sección Notificaciones informa que las notificaciones push aún no están implementadas, reemplazando el mensaje anterior de activación por defecto. Cuenta permite abrir Datos personales. No hay controles sin implementación.

Verificación: TypeScript y lint sin errores, con tres advertencias existentes. Tres pruebas nuevas verifican aplicación de movimiento reducido, persistencia/restauración, navegación a datos personales y recuperación ante fallo de guardado. Suite completa: 55 pruebas correctas y los dos fallos conocidos de personal. Revisión visual en dispositivo pendiente.

## 15. Preparación de notificaciones push

Configuración incluye Recibir notificaciones push, permisos del dispositivo y registro FCM. El control está deshabilitado cuando Firebase no está conectado. La app mantiene la inicialización automática de Messaging deshabilitada por defecto y registra el dispositivo solo tras activación explícita.

Estado: dependencias y código de recepción preparados; falta crear/configurar el proyecto Firebase, configurar APNs en iOS, recompilar y comprobar entrega real. No hay envío automático de reportes porque el repositorio sigue siendo local. Los pasos y límites se documentan en [notificaciones_push.md](notificaciones_push.md). Las credenciales administrativas pertenecen a un servidor de confianza.

## 16. Ayuda y soporte

Perfil abre la ruta secundaria HelpSupport para estudiante y personal. La vista usa regreso nativo, superficie blanca, título de 28, secciones de 19, textos de 15 y controles de al menos 48 unidades. Los accesos útiles reutilizan MenuRow y respetan el rol para abrir Mis reportes o Panel de incidencias, además de Datos personales y Configuración.

Las preguntas frecuentes se despliegan con MotionTouchable y accessibilityState.expanded: evidencia opcional, estados, edición de cuenta, notificaciones y errores de envío. El contenido describe las funciones implementadas y la configuración pendiente de Firebase.

Se conservan el correo y la ventanilla existentes en Perfil. Escribir a soporte abre un borrador mediante mailto con asunto y campos de consulta, sin enviar automáticamente ni adjuntar datos personales. El correo es seleccionable y se muestra una alternativa ante fallo de apertura. No se inventan teléfonos, horarios ni tiempos de respuesta.

Verificación: TypeScript y lint sin errores, con tres advertencias existentes. Tres pruebas nuevas verifican preguntas desplegables, navegación por rol, apertura de correo y recuperación ante fallos. La revisión visual y apertura de correo en dispositivos siguen pendientes.

## 17. Notas de seguimiento del personal

El detalle ahora permite al personal añadir una nota opcional de hasta 500 caracteres al cambiar el estado. Se persisten las nuevas transiciones con estado anterior, nuevo estado, nota, fecha y autor. El estudiante puede consultarlas en Seguimiento; no puede editarlas. Los reportes anteriores siguen siendo compatibles y no se inventa su historial previo. Esto actualiza la limitación descrita en la sección 11.

Si guardar falla, el borrador permanece disponible; solo se limpia tras persistir la actualización. Las pruebas cubren persistencia, sucesivos cambios, límite de texto, recuperación y lectura por el estudiante. TypeScript y lint sin errores; revisión visual con teclado pendiente.
