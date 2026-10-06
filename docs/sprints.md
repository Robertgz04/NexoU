# Sprints — NexoU

Este documento resume los 9 Sprints definidos en el plan de trabajo de **NexoU**.  
Cada Sprint tiene una duración de **1 semana** y busca producir un incremento verificable de la aplicación.

## Seguimiento del avance — corte al 6 de octubre de 2026

**Sprint actual por calendario: Sprint 2 (5–9 de octubre).** Su alcance funcional está implementado; queda pendiente documentar la aceptación y el cierre conforme a la Definition of Done del [plan de trabajo](fuentes/plan_de_trabajo.txt), sección 7. Las fechas originales se conservan aunque existan entregables adelantados.

### Estado por Sprint

| Sprint | Estado del entregable al corte | Pendiente para declarar cierre |
|---|---|---|
| 1 | Base técnica implementada: Git, arquitectura, pantallas de autenticación y modelo SQL documentado. | Vincular evidencias de aceptación, revisión de otro integrante y Review/Retrospective. |
| 2 | Alcance funcional implementado: registro, login, validaciones, sesiones, roles y navegación. APK debug disponible. | Registrar prueba manual de registro/login y navegación por ambos roles sobre la versión actual; revisión del equipo y cierre. |
| 3 | Implementación adelantada: formulario, catálogos, validaciones y persistencia mediante API/MariaDB. | Revalidar creación sin fotografía contra SQL y registrar el flujo en dispositivo/emulador. |
| 4 | Implementación adelantada: cámara/galería, carga privada de evidencia, Mis reportes y detalle. | Certificar cámara y galería en Android, subida al servidor y consulta posterior de la imagen/estado. |
| 5 | Consolidación parcial: suites automatizadas, sesiones revocables y autorización en API. | Revalidar integración SQL, demostrar el flujo completo con foto y adjuntar evidencia del primer hito. |
| 6 | Implementación adelantada: listado del personal, filtros, detalle y acceso por rol. | Registrar aceptación manual con personal y rechazo de acceso con estudiante. |
| 7 | Implementación adelantada: cambio de estado y nota, historial y recarga del estudiante al volver a la pantalla o actualizar. | Demostrar estudiante → personal → estudiante en dos sesiones; verificar el requisito de reflejo inmediato. No se ha acreditado sincronización automática en una pantalla abierta. |
| 8 | Estabilización iniciada: pruebas, tipos, lint y APK debug; todavía sin versión candidata certificada. | Completar regresión manual F01–F08, revisión de seguridad/permisos, defectos prioritarios y distribución. |
| 9 | Documentación técnica y despliegue de API presentes; liberación final pendiente. | Preparar versión final de distribución, presentación, paquete de evidencias, entrega y retrospectiva final. |

### Cómo interpretar el progreso

- **Cobertura de implementación: 8/8 funcionalidades F01–F08 (100 % con código integrado)**, identificables en [README](../README.md), pantallas, repositorios HTTP y módulos del backend. Este indicador no equivale a aceptación final ni certifica todos los criterios de cada función.
- **Avance respecto al calendario:** autenticación del Sprint 2 implementada y alcance funcional adelantado hasta el Sprint 7; el trabajo restante se concentra en validación, estabilización y entrega.
- **Cierre formal:** esta revisión no acredita ningún cierre completo con todas sus evidencias. No se calcula un porcentaje global de proyecto ni se cuentan Sprints cerrados a partir de código existente: el plan no asigna pesos a las tareas y faltan registros de aceptación/revisión.

### Evidencia de esta revisión

- `npm test -- --runInBand`: **18 suites y 65 pruebas móviles aprobadas**.
- `npm --prefix backend test`: **6 pruebas aprobadas, 1 integración SQL omitida** en la ejecución normal.
- `npx tsc --noEmit` y `npm --prefix backend run build`: sin errores.
- `npm run lint`: **0 errores y 4 advertencias**.
- APK debug encontrada en `android/app/build/outputs/apk/debug/app-debug.apk`, con modificación del 6 de octubre de 2026. Su presencia no certifica los flujos manuales.
- Integración SQL intentada con `RUN_DB_TESTS=true`: **falló al preparar/limpiar la base aislada con el administrador local**. No se obtuvo una validación SQL satisfactoria en esta revisión; resolver acceso/disponibilidad del entorno y repetirla.
- [backend/README](../backend/README.md) registra verificaciones anteriores de login real, integración SQL y Android. Se conservan como antecedente; no sustituyen el resultado actual ni certifican cámara/galería.

### Criterio de actualización y cierre

Actualizar este archivo al terminar o revalidar un entregable, al detectar un impedimento y al cerrar cada Sprint. Para cada actualización registrar fecha, tareas completadas, pendientes y referencia a pruebas, capturas, commits o revisión. Mantener separados **implementado**, **verificado** y **cerrado**.

Antes de marcar un Sprint como **cerrado**, comprobar:

- [ ] Todos sus criterios de aceptación implementados e integrados.
- [ ] Ejecución sin errores críticos en dispositivo/emulador y pruebas manuales registradas.
- [ ] Pruebas automatizadas aplicables aprobadas y resultados vinculados.
- [ ] Código en rama principal o merge aprobado y revisión de otro integrante documentada.
- [ ] Sprint Backlog/tablero actualizado a Done.
- [ ] Evidencia del incremento y notas de Sprint Review/Retrospective vinculadas.

Las primeras cinco comprobaciones corresponden a la Definition of Done del plan; la última documenta su seguimiento Scrum. Al cerrar, agregar una entrada con este formato: `Fecha | Sprint | Entregable aceptado | Evidencias | Revisor | Pendientes (ninguno para el alcance comprometido)`.

---

## Sprint 1 — Semana 1
**Fechas:** 28 de septiembre – 2 de octubre de 2026

### Descripción
Establecer la base técnica del proyecto. Durante este Sprint se inicializa el repositorio, se define la arquitectura inicial de la aplicación, se diseñan y maquetan las pantallas de registro e inicio de sesión, se documenta el modelo de datos de usuarios y reportes, y se prepara la configuración inicial del servicio de autenticación.

### Meta de entregable
Contar con un **repositorio inicializado**, las **pantallas de login y registro navegables**, aunque todavía sin backend completo, y el **modelo de datos documentado**.

---

## Sprint 2 — Semana 2
**Fechas:** 5 – 9 de octubre de 2026

### Descripción
Completar la autenticación funcional de la aplicación. Se implementará el registro de estudiantes, el inicio de sesión con validaciones, el manejo de roles de estudiante y personal universitario, la redirección al panel correspondiente y la navegación principal de la app.

### Meta de entregable
Entregar una **aplicación ejecutable** con **registro e inicio de sesión funcionales**, manejo básico de roles y **navegación principal operativa**.

---

## Sprint 3 — Semana 3
**Fechas:** 12 – 16 de octubre de 2026

### Descripción
Implementar el flujo inicial para que el estudiante pueda levantar un reporte. Se desarrollará el formulario con título y descripción, los selectores de área y tipo de incidencia, las validaciones de campos obligatorios y la persistencia del reporte en la base de datos o servicio en la nube.

### Meta de entregable
Tener funcionando de extremo a extremo el **flujo de creación de reportes sin fotografía**, incluyendo el registro de título, descripción, área y tipo de incidencia.

---

## Sprint 4 — Semana 4
**Fechas:** 19 – 23 de octubre de 2026

### Descripción
Completar el flujo principal del estudiante incorporando evidencia fotográfica y consulta de reportes. Se añadirá la captura o selección de imágenes, su almacenamiento en la nube, la asociación de la imagen al reporte, la pantalla de “Mis reportes” y el detalle de cada reporte con su estado e imagen.

### Meta de entregable
Disponer del **flujo completo del estudiante**:

`Login → Levantar reporte con fotografía → Consultar estado del reporte`

---

## Sprint 5 — Semana 5
**Fechas:** 26 – 30 de octubre de 2026  
**Hito:** Primer avance significativo

### Descripción
Consolidar y estabilizar las funcionalidades F01–F06. Se realizarán pruebas de integración, corrección de defectos, mecanismos iniciales de seguridad, revisión de reglas de acceso y validación de tokens. También se preparará la demostración del primer hito y su evidencia.

### Meta de entregable
Presentar una **aplicación ejecutable con el flujo del estudiante completo**, navegación principal, integración con servicios en la nube, pruebas realizadas y aproximadamente **50 % del alcance comprometido en condición demostrable**.

---

## Sprint 6 — Semana 6
**Fechas:** 2 – 6 de noviembre de 2026

### Descripción
Implementar el panel destinado al personal universitario. Se desarrollará la vista con todos los reportes registrados, mostrando área, categoría, estado y miniatura, además del detalle completo con fotografía, filtros básicos y control de acceso exclusivo para el rol de personal.

### Meta de entregable
Entregar un **panel del personal universitario funcional**, con listado, filtros básicos y detalle completo de los reportes.

---

## Sprint 7 — Semana 7
**Fechas:** 9 – 13 de noviembre de 2026

### Descripción
Cerrar el flujo completo entre estudiante y personal universitario. Se implementará la actualización del estado de los reportes entre pendiente, en revisión y solucionado, así como el reflejo inmediato de ese cambio en la vista del estudiante y la retroalimentación visual correspondiente.

### Meta de entregable
Tener operativo el flujo completo:

`Estudiante reporta → Personal actualiza estado → Estudiante consulta el cambio`

---

## Sprint 8 — Semana 8
**Fechas:** 16 – 20 de noviembre de 2026  
**Hito:** Versión candidata

### Descripción
Estabilizar la aplicación completa. Se ejecutarán pruebas de regresión de F01–F08, corrección de defectos prioritarios, revisión de seguridad y permisos, ajustes de usabilidad y rendimiento, y preparación de la versión de distribución.

### Meta de entregable
Generar una **versión candidata ejecutable** con **todas las funcionalidades comprometidas**, sin errores críticos y con el **APK o versión de distribución preparada**.

---

## Sprint 9 — Semana 9
**Fechas:** 23 – 27 de noviembre de 2026  
**Hito:** Liberación y cierre

### Descripción
Realizar la liberación final del proyecto. Se completarán los últimos ajustes menores, empaquetado, documentación técnica, preparación de la presentación final, entrega del código fuente, repositorio, APK y evidencias, además del cierre y retroalimentación del proyecto.

### Meta de entregable
Entregar formalmente la **aplicación final funcional**, incluyendo:

- Código fuente completo.
- Repositorio actualizado.
- Documentación técnica.
- APK o versión de distribución.
- Evidencias y resultados de pruebas.
- Todas las funcionalidades comprometidas F01–F08.

---

## Resumen de hitos

| Sprint | Objetivo principal | Meta de entregable |
|---|---|---|
| 1 | Base técnica | Repo + UI de autenticación + modelo de datos |
| 2 | Autenticación | Login, registro, roles y navegación funcional |
| 3 | Creación de reportes | Reporte sin fotografía funcionando |
| 4 | Flujo del estudiante | Reporte con foto + consulta de estado |
| 5 | Primer avance significativo | Flujo estudiante completo + ~50 % del alcance |
| 6 | Panel del personal | Consulta y detalle de reportes |
| 7 | Actualización de estado | Flujo estudiante–personal completo |
| 8 | Versión candidata | F01–F08 completas, pruebas y APK |
| 9 | Liberación | Aplicación final + código + documentación + distribución |
