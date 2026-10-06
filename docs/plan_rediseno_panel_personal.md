# Plan de rediseño del panel de personal · NexoU

Fecha: 6 de octubre de 2026. Plataforma: React Native para Android e iOS.

## 1. Objetivo y referencia

Extender al panel de personal el lenguaje visual de [la guía del panel de estudiante](guia_diseno_panel_estudiante.md), tomando en cuenta sus adaptaciones posteriores: campus compacto, curva de ancho completo, superficie blanca continua, iconos Lucide, jerarquía legible y movimiento ligado a la interacción.

El personal necesita encontrar incidencias, consultar su información y actualizar su estado. El diseño debe favorecer estas tareas y la lectura de datos. La ilustración aporta identidad, pero no debe reservar espacio permanentemente ni competir con filtros, reportes o gráficas.

Este documento propone trabajo futuro. No implica que las vistas ya estén rediseñadas o verificadas en dispositivos. Se conserva la navegación y el funcionamiento del repositorio local. La ampliación posterior de notas y transiciones se registra en la sección 10; no se añaden asignaciones, prioridades ni servicios remotos.

## 2. Alcance y diagnóstico actual

| Vista | Situación actual en el código | Trabajo propuesto |
|---|---|---|
| Reportes · `AllReportsScreen` | `ScreenBackground`, resumen de tres estados, filtros horizontales por estado y área, `FlatList` y tarjetas con reportante. No distingue carga, fallo y vacío. | Cabecera breve dentro de la lista, contenido blanco, filtros adaptables, tarjetas legibles y recuperación ante errores. |
| Estadísticas · `StatisticsScreen` | Fondo ilustrado, título fuera del scroll, cuatro indicadores, barras, dona, actividad de siete días y área principal. Distribución densa y colores de estado distintos del catálogo. | Composición desplazable, indicadores adaptables, gráficas con alternativas textuales y periodos explícitos. |
| Notificaciones · `NotificationsScreen` | `SectionList` por Hoy/Ayer/Anteriores, filtros Todas/Estado/Avisos. Cada aviso se deriva del estado actual de un reporte. El texto promete tiempo real. | Cabecera compacta, avisos legibles, orden por última actualización y texto acorde con los datos disponibles. |
| Perfil · `ProfileScreen` | Ya utiliza `CampusScrollScreen`, hoja blanca y navegación por rol. | Verificar su integración con personal; conservar el resumen actual del propietario, sin presentarlo como total institucional. |
| Detalle · `ReportDetailScreen` | Ya adaptado a blanco y regreso nativo. Permite gestionar estado al personal y bloquea solicitudes duplicadas. | Revisar continuidad desde Reportes y Notificaciones y recuperación al actualizar estado. |
| Datos personales, Configuración y Ayuda | Vistas compartidas ya adaptadas. | Regresión de navegación y comportamiento por rol. |

La guía contiene recomendaciones iniciales y actualizaciones posteriores. Para planificar se toma como vigente su estado final: `CampusScrollScreen` ya existe; Reportar, Mis reportes, Detalle y Perfil ya tienen adaptaciones implementadas, con revisión visual pendiente en varios casos.

## 3. Reglas visuales compartidas

- Usar `colors.surface` como superficie opaca detrás de títulos, filtros, indicadores, textos y acciones. Mantenerla hasta el final del contenido.
- Conservar azul marino institucional, turquesa de selección y fuente nativa. Reutilizar `spacing` y `radius`; margen horizontal de 16 unidades, sin aplicarlo a la curva.
- Proponer títulos de 28, secciones de 19 y cuerpo de 15, acordes con las vistas compartidas recientes. Permitir crecimiento con el tamaño de texto del sistema.
- Obtener texto, icono, color y fondo de cada estado desde `STATUSES`/`statusMeta`. Actualmente el catálogo usa rojo para Pendiente, ámbar para En revisión y verde para Solucionado; los tokens antiguos de `theme.ts` difieren. Adoptar el catálogo en indicadores y leyendas para evitar dos códigos visuales.
- Mantener `AppIcon`, `MotionTouchable`, `StatusBadge`, `MenuRow`, `SelectField` y los componentes existentes cuando correspondan. No usar emojis como iconos.
- Ofrecer controles de al menos 48 unidades y selección indicada mediante relleno, texto o forma, además de color. Incluir estado accesible de selección y etiquetas que expliquen el destino.
- Usar el campus aprobado mediante `SCREEN_BACKGROUNDS.login`. La proporción 0.32 pertenece a ese asset. Cualquier otro fondo requiere inspección y calibración propias.
- Mantener transiciones de pestañas y respuesta de pulsación existentes. Respetar `useReducedMotion`; no añadir entradas escalonadas ni animaciones que retrasen datos.

## 4. Composición por vista

### 4.1 Reportes: encontrar y atender una incidencia

Secuencia propuesta:

1. Campus breve y curva de ancho completo.
2. Título «Panel de incidencias», saludo breve y acceso a Perfil sobre blanco.
3. Resumen de Pendientes, En revisión y Solucionados con conteos globales reales.
4. Filtros de estado y área, resumen de resultados y acción para limpiar filtros cuando estén activos.
5. Lista de reportes, del más reciente al más antiguo, con acceso al detalle.

Mantener `FlatList` como único scroll vertical. Ubicar campus, título, resumen y filtros en `ListHeaderComponent` para que se desplacen y liberen espacio. Partir de la composición de Mis reportes; no envolver la lista en `CampusScrollScreen`, pues este componente ya contiene un scroll vertical.

Los filtros de estado tendrán icono, etiqueta y conteo. Sus conteos serán globales, como el resumen, y el total visible explicará el resultado de combinar estado y área. Permitir filas adaptables. Para las nueve áreas existentes, reutilizar `SelectField` si su selector soporta texto grande y selección accesible; evitar una fila horizontal extensa que oculte opciones.

Cada tarjeta mostrará estado, título de hasta dos líneas, reportante, ubicación, categoría y fecha de creación. La apertura del detalle será su acción principal. No incorporar notas de asignación ni acciones de cambio de estado dentro de la tarjeta.

Revisar `ReportCard` antes de ampliarlo: también tiene consumidores fuera de personal. Reutilizar su soporte `showOwner` y añadir solo variantes necesarias. `ReportHistoryCard` ofrece patrones de lectura útiles, pero no soporta reportante y exige una nota expandible; no sustituirlo directamente ni inventar contenido para satisfacer su API.

Estados requeridos: carga inicial, error inicial con reintento, error de actualización conservando datos, repositorio vacío y filtros sin coincidencias con «Limpiar filtros». La actualización manual debe finalizar incluso ante fallos. Conservar filtros al volver del detalle y refrescar los estados modificados.

### 4.2 Estadísticas: entender el volumen de incidencias

Secuencia propuesta:

1. Campus compacto, título «Estadísticas» y explicación breve.
2. Selector Semana/Mes/Año y descripción del intervalo seleccionado.
3. Total, Pendientes, En revisión y Solucionados en una cuadrícula adaptable.
4. Reportes por categoría.
5. Estado general con conteos y porcentajes legibles.
6. Actividad diaria con intervalo explícito.
7. Área con más incidencias y acceso al panel de reportes.

Reutilizar `CampusScrollScreen` para que título y contenido participen en un único desplazamiento. Proponer inicialmente 136 unidades de campus, como Perfil; ajustar el encuadre tras revisar dispositivos. Mantener los indicadores en dos columnas cuando haya espacio y apilarlos con letra grande o ancho reducido.

Apilar dona y actividad en teléfonos estrechos. Evitar categorías y leyendas truncadas a una línea; valorar barras horizontales para las seis categorías si las etiquetas no caben. Reutilizar `DonutChart` y `LineChart` sin añadir dependencias para animación.

Todas las gráficas tendrán una alternativa textual con los mismos valores. Un resultado sin reportes debe indicar «Sin reportes en este periodo», en lugar de sugerir que los datos todavía cargan. Separar carga, fallo y resultado cero.

Aclarar el significado de los periodos existentes: Semana son los últimos siete días, Mes los últimos treinta y Año el último año, según fecha de creación. Los estados son los actuales de esos reportes, no un historial de cuándo fueron solucionados.

La actividad actual siempre presenta siete días. En esta etapa se conservará ese intervalo independiente, rotulado «Últimos 7 días», y se calculará sobre todos los reportes, sin sugerir que representa todo el periodo seleccionado. Verificar los límites de día y evitar que reportes del día en curso desaparezcan por la diferencia horaria del cálculo actual.

El acceso del área principal conservará su destino a Reportes. No anunciar que aplicará un filtro de área: `StaffTabParamList` no admite ese parámetro actualmente. Incorporarlo sería una ampliación funcional separada.

### 4.3 Notificaciones: consultar novedades de los reportes

Secuencia propuesta:

1. Campus breve, curva y título «Notificaciones».
2. Texto «Avisos según el estado actual de los reportes».
3. Filtros Todas, Estado y Avisos, con selección accesible.
4. Secciones Hoy, Ayer y Anteriores.
5. Avisos con icono, título, contexto, fecha relativa y acceso al detalle.

Mantener `SectionList` y ubicar la cabecera en `ListHeaderComponent`, sin otro scroll vertical. Ordenar los avisos por `updatedAt` descendente dentro de sus grupos; actualmente el repositorio ordena por creación.

Preservar la semántica de filtros existente: Estado incluye reportes en revisión o solucionados; Avisos incluye pendientes. Explicar esa distinción mediante texto de apoyo o etiquetas accesibles. Distinguir ausencia total de avisos y filtro sin resultados.

Eliminar la promesa de tiempo real y cualquier texto que afirme una asignación a mantenimiento que el repositorio no registra. Un aviso representa el estado actual, no cada transición: no añadir marcas de lectura, eventos históricos o contador de mensajes nuevos sin persistencia que los respalde.

Añadir carga, error con reintento y actualización manual, conservando datos ante fallos. Permitir saltos de línea en título, reportante y área; el horario no debe comprimir el texto principal.

## 5. Componentes y navegación

| Pieza | Decisión propuesta |
|---|---|
| `CampusScrollScreen` | Reutilizar en Estadísticas. Mantener su soporte de movimiento reducido y superficies continuas. |
| Cabecera de listas | Extraer la composición breve de campus y curva de Mis reportes para reutilizarla en `FlatList` y `SectionList`. Propuesta de nombre: `CampusListHeader`; todavía no existe. Separar ilustración de contenido para conservar ancho completo. |
| `StatTiles` e indicadores de Estadísticas | Revisar adaptación a ancho y fuente grande, evitando etiquetas recortadas. Usar catálogo de estados. Proteger consumidores del panel de estudiante. |
| `Chip` y `SegmentedControl` | Reutilizar si selección, tamaño táctil y crecimiento del texto cumplen los criterios; adaptar sin duplicar estilos locales. |
| `StaffTabs` | Conservar Reportes, Estadísticas, Notificaciones y Perfil, barra opaca y transición existente. Verificar etiquetas con letra grande. |
| Badge de Notificaciones | Sigue contando reportes pendientes, no avisos sin leer. Añadir descripción accesible explícita y manejo de errores; verificar actualización al regresar tras cambiar estado. |
| Vistas compartidas | Verificar Detalle, Perfil, Datos personales, Configuración y Ayuda para personal, sin reconstruirlas. |

La cabecera de listas tendrá una transición estática que sale de pantalla con el contenido, siguiendo Mis reportes. No se necesita copiar el paralaje de Inicio a todas las vistas para compartir su estilo.

## 6. Orden de implementación

| Etapa | Entregable | Condición para avanzar |
|---|---|---|
| 1. Base visual | Cabecera reutilizable de listas, reglas de estado y ajustes mínimos de componentes compartidos. | Campus y curva correctos; ninguna regresión en Mis reportes ni controles compartidos. |
| 2. Reportes | Lista, resumen, filtros, tarjetas y recuperación completos. | Filtrado combinado correcto, navegación al detalle y retorno con datos actualizados. |
| 3. Estadísticas | Cabecera compacta, indicadores, gráficas y periodos claros. | Valores coherentes con fixtures conocidos; cero, carga y error distinguibles. |
| 4. Notificaciones | Secciones, filtros, orden por actualización y mensajes fieles al repositorio. | Cada aviso abre su reporte; fechas, filtros y recuperación correctos. |
| 5. Integración | Badge, navegación y regresión de pantallas compartidas. | Cambio de estado reflejado en Reportes, Estadísticas, Notificaciones y contador al recuperar foco. |
| 6. Aceptación visual | Revisión conjunta Android/iOS, correcciones y actualización de documentación. | Evidencia de tamaños, texto grande, lector de pantalla y movimiento reducido. |

Implementar una vista completa por etapa, incluyendo sus estados, antes de extender el patrón a la siguiente. Registrar resultados reales de verificación y pendientes en este documento; no copiar certificaciones de la guía del estudiante.

## 7. Verificación y criterios de aceptación

### Composición e interacción

- Campus bien encuadrado, curva de borde a borde y blanco continuo al iniciar, desplazar y llegar al final.
- Filtros, títulos y datos esenciales sobre superficies opacas. Ilustración y cabecera abandonan el área útil al desplazar.
- Reportes y avisos mantienen virtualización; no hay listas verticales anidadas.
- Estados reconocibles por texto e icono, con color consistente entre tarjetas, resumen, avisos y gráficas.
- Contenido útil con cero reportes, uno y muchas decenas, nombres largos y títulos de 80 caracteres.
- Texto grande sin pérdida de etiquetas, categorías, conteos o acciones; último elemento visible por encima de la barra inferior.
- Pulsaciones rápidas, cambios de filtro, regreso del detalle y gesto de actualización no dejan controles bloqueados ni descartan datos.
- Lector de pantalla anuncia selección, destino, carga y errores. Gráficas tienen información textual equivalente.
- Movimiento reducido mantiene todo el contenido disponible y evita desplazamientos espaciales adicionales.

### Pruebas funcionales previstas

- Reportes: filtros combinados, limpieza, vacío inicial, fallo inicial, actualización fallida con datos conservados y navegación por ID.
- Estadísticas: conteos por periodo/categoría/estado, límites de fecha, reportes de hoy, resultado cero y recuperación. Utilizar reloj fijo en pruebas.
- Notificaciones: semántica de filtros, orden por última actualización, Hoy/Ayer/Anteriores, enlace al detalle y recuperación.
- Integración: cambio de estado autorizado del personal, estudiante sin controles de gestión, regreso con datos refrescados y badge de pendientes coherente.
- Actualizar las dos expectativas de texto conocidas en `pantallasPersonal.test.tsx` a la composición final, conservando comprobaciones de datos y comportamiento. Esos fallos se reportan en la guía; no se ha ejecutado la suite como parte de este plan.

Durante la implementación ejecutar:

```powershell
npx tsc --noEmit
npx eslint src
npm test -- --runInBand
```

Revisar Android e iOS en tamaño pequeño y ancho, con letra normal y grande. Inspeccionar juntos estado inicial, desplazamiento y final; corregir los hallazgos en una ronda y confirmar. Observar el gesto continuo además de capturas. Medir en compilación de producción si se detectan tirones.

## 8. Archivos de trabajo

- Vistas propias: [Reportes](../src/screens/staff/AllReportsScreen.tsx), [Estadísticas](../src/screens/staff/StatisticsScreen.tsx) y [Notificaciones](../src/screens/staff/NotificationsScreen.tsx).
- Referencias: [Inicio](../src/screens/student/HomeScreen.tsx), [Mis reportes](../src/screens/student/MyReportsScreen.tsx), [Perfil](../src/screens/ProfileScreen.tsx) y [Detalle](../src/screens/ReportDetailScreen.tsx).
- Composición: [CampusScrollScreen](../src/components/CampusScrollScreen.tsx) y [ScreenBackground](../src/components/ScreenBackground.tsx).
- Tarjetas e indicadores: [ReportCard](../src/components/ReportCard.tsx), [ReportHistoryCard](../src/components/ReportHistoryCard.tsx), [StatTiles](../src/components/StatTiles.tsx), [DonutChart](../src/components/DonutChart.tsx) y [LineChart](../src/components/LineChart.tsx).
- Contratos: [tema](../src/theme.ts), [catálogo](../src/constants/catalog.ts), [repositorio](../src/data/reportRepository.ts), [pestañas](../src/navigation/StaffTabs.tsx) y [tipos de navegación](../src/navigation/types.ts).
- Verificación existente: [pantallas de personal](../__tests__/pantallasPersonal.test.tsx), [gráficas](../__tests__/graficas.test.tsx) y [detalle](../__tests__/reportDetailScreen.test.tsx).

## 9. Primera etapa implementada

Se implementaron la base de listas y la adaptación de Reportes. `CampusListHeader` extrae el campus compacto de 136 unidades y la curva de ancho completo de Mis reportes; ambas vistas lo reutilizan dentro de `ListHeaderComponent`, conservando la virtualización y una superficie blanca continua.

Reportes muestra título, saludo y acceso a Perfil sobre blanco, resumen adaptable con colores del catálogo, filtros de estado con conteos globales, selector de área, total de resultados y limpieza de filtros. Se separan carga, error inicial, actualización fallida con datos conservados, repositorio vacío y filtros sin resultados. Las consultas simultáneas se bloquean y la actualización termina también ante errores. Las tarjetas mantienen reportante y navegación por ID, admiten títulos de dos líneas y metadatos sin truncado; se retiró la sombra para conservar una sola definición de borde.

`SelectField` admite valores largos, anuncia etiqueta y valor, expone selección accesible de opciones y mantiene objetivos de al menos 48 unidades. Estos ajustes también alcanzan sus consumidores existentes.

Verificación técnica: TypeScript sin errores; lint sin errores y con las tres advertencias existentes de estilos inline. Las cuatro pruebas nuevas de Reportes pasan y cubren filtrado combinado, limpieza, navegación, vacío, reintento y conservación de datos ante errores. La suite completa obtuvo 68 pruebas correctas y los dos fallos conocidos de expectativas de texto en Estadísticas; también emitió avisos de actualizaciones de listas fuera de `act` en pruebas existentes.

La revisión visual en Android/iOS está pendiente: no se certifican todavía encuadre, texto grande o fluidez en dispositivo. Estadísticas, Notificaciones, badge e integración permanecen pendientes para las siguientes etapas. Los colores se unificaron en Reportes; su aplicación a indicadores de Estadísticas se hará al adaptar esa vista.

## 10. Notas al cambiar de estado

Por solicitud posterior, el detalle permite al personal escribir una nota opcional de hasta 500 caracteres antes de cambiar a Pendiente, En revisión o Solucionado. La nota se guarda junto con la transición, fecha e identidad del personal en `statusUpdates`, dentro del reporte local. Cada cambio conserva los anteriores; los reportes existentes admiten el campo ausente y no se reconstruyen eventos antiguos.

Seguimiento presenta creación, transiciones registradas con sus notas y estado actual. El estudiante consulta las notas sin controles de edición. Guardar bloquea solicitudes duplicadas y deshabilita el campo; éxito limpia la nota y error conserva el borrador. El formulario incorpora scroll y manejo del teclado.

Esta ampliación modifica la limitación inicial de ausencia de historial: las transiciones nuevas sí quedan registradas. Notificaciones todavía deriva un aviso del estado actual y no consume este historial. No se modificaron asignaciones ni servicios push.

Verificación: TypeScript y lint sin errores, con tres advertencias existentes. Se añadieron pruebas de persistencia y acumulación de transiciones, límite de nota, reintento conservando texto y consulta del estudiante. Revisión visual con teclado en Android/iOS pendiente.

## 11. Adaptación de Estadísticas

Estadísticas reutiliza `CampusScrollScreen` con campus de 136 unidades y proporción 0.32. Título, periodos y contenido comparten un único scroll sobre blanco. Los cuatro indicadores usan el catálogo de estados, se distribuyen en dos columnas y se apilan en anchos pequeños o con escala de fuente superior a 1.3.

Las categorías se presentan con barras horizontales, etiquetas completas y conteos. Estado general mantiene la dona y ofrece conteos y porcentajes textuales. Actividad diaria conserva siete días independientes del periodo seleccionado y muestra los valores de cada día como alternativa textual; las representaciones gráficas duplicadas se ocultan al lector de pantalla. Área con más incidencias conserva navegación al panel sin prometer un filtro automático.

Semana, Mes y Año describen los últimos siete días, treinta días y año, según creación; los estados son los actuales. Se corrigió el cálculo diario para incluir reportes de hoy mediante límites de días naturales y se excluyen fechas futuras. La fecha de referencia se renueva al cargar datos. Se distinguen carga, fallo inicial, periodo vacío y fallo de actualización con datos conservados; se añade actualización manual.

Verificación: TypeScript y lint sin errores, con las tres advertencias existentes. Las tres pruebas nuevas cubren intervalos, datos de hoy, fechas futuras, vacío, recuperación y conservación del periodo ante errores. Se actualizaron las expectativas de texto anteriores de Estadísticas y se corrigió el desmontaje de sus pruebas para evitar actualizaciones de listas tras finalizar. Suite completa: 76 pruebas correctas en 15 suites, con salida correcta.

Revisión visual en Android/iOS pendiente. La siguiente etapa es Notificaciones; badge, integración y aceptación visual permanecen pendientes.

## 12. Adaptación de Notificaciones

Notificaciones reutiliza `CampusListHeader` dentro de `SectionList`, conservando la virtualización, campus compacto, curva de ancho completo y superficie blanca continua. Título y acceso a Perfil viven sobre blanco. Los avisos se ordenan por `updatedAt` descendente dentro de Hoy, Ayer y Anteriores; la fecha utiliza el dato ISO directamente, sin buscar de nuevo el reporte para agruparlo.

Los filtros Todas, Estado y Avisos conservan su significado: Estado incluye revisión y solucionado; Avisos incluye pendientes. La vista explica esa distinción, informa el número de avisos y ofrece volver a Todas ante filtros vacíos. Ausencia de reportes, carga y fallo de consulta tienen estados distintos. La actualización manual conserva datos y selección ante errores, bloquea consultas simultáneas y finaliza el indicador también si falla.

Los textos describen el estado actual sin prometer tiempo real ni asignaciones a mantenimiento. Se mantiene un aviso por reporte, sin marcas de lectura o eventos históricos. Las notas registradas siguen disponibles al abrir el detalle. Cada fila admite contenido sin truncado, coloca la fecha debajo del contexto y anuncia el destino mediante etiqueta accesible.

`SegmentedControl` incorpora controles de al menos 48 unidades, filas adaptables y selección azul marino con texto blanco. Este ajuste también se aplica al selector de periodos de Estadísticas.

Verificación: TypeScript y lint sin errores, con las tres advertencias existentes. Cuatro pruebas nuevas verifican agrupación y orden por actualización, destino por ID, significado de filtros, recuperación de vacío, reintento y conservación de datos ante fallos. Revisión visual Android/iOS pendiente. La siguiente etapa es badge e integración, seguida de aceptación visual.
