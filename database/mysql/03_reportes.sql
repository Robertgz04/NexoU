-- Consultas de referencia. La API debe usar parametros preparados.
-- Estas variables sirven para probar el archivo desde Workbench o mysql.
USE nexou;
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
SET @usuario_id = 'u_demo_estudiante';
SET @reporte_id = 'r_demo_01';
SET @estado = NULL;       -- NULL = todos; pendiente / revision / solucionado
SET @area_id = NULL;      -- NULL = todas
SET @categoria_id = NULL; -- NULL = todas
SET @tipo_aviso = NULL;   -- NULL = todos; aviso / estado
SET @zona = '-06:00';     -- Ejemplo: Mexico central, octubre de 2026
SET @desde_local = CAST('2026-10-01 00:00:00' AS DATETIME);
SET @hasta_local = CAST('2026-11-01 00:00:00' AS DATETIME);
SET @desde = CONVERT_TZ(@desde_local, @zona, '+00:00');
SET @hasta = CONVERT_TZ(@hasta_local, @zona, '+00:00');

-- R01. Mis reportes (F06). usuario_id se obtiene de la sesion autenticada.
SELECT * FROM v_reportes_detalle
WHERE usuario_id = @usuario_id AND (@estado IS NULL OR estado = @estado)
ORDER BY creado_en DESC, id DESC LIMIT 50;

-- R02. Panel del personal (F07), filtros y exportacion del detalle.
SELECT * FROM v_reportes_detalle
WHERE creado_en >= @desde AND creado_en < @hasta
  AND (@estado IS NULL OR estado = @estado)
  AND (@area_id IS NULL OR area_id = @area_id)
  AND (@categoria_id IS NULL OR categoria_id = @categoria_id)
ORDER BY creado_en DESC, id DESC LIMIT 50;

-- R03. Indicadores F09. Cohorte por fecha de creacion y estado ACTUAL.
SELECT COUNT(*) AS total,
  COALESCE(SUM(estado_codigo = 'pendiente'), 0) AS pendientes,
  COALESCE(SUM(estado_codigo = 'revision'), 0) AS en_revision,
  COALESCE(SUM(estado_codigo = 'solucionado'), 0) AS solucionados,
  COALESCE(ROUND(100.0 * SUM(estado_codigo = 'solucionado')
    / NULLIF(COUNT(*), 0), 2), 0) AS porcentaje_solucionados
FROM reportes WHERE creado_en >= @desde AND creado_en < @hasta;

-- R04. Barras por categoria: incluye categorias sin reportes.
SELECT c.id, c.nombre AS categoria, COUNT(r.id) AS total
FROM categorias c LEFT JOIN reportes r ON r.categoria_id = c.id
  AND r.creado_en >= @desde AND r.creado_en < @hasta
GROUP BY c.id, c.nombre, c.orden ORDER BY c.orden, c.id;

-- R05. Areas con mayor incidencia y categoria predominante.
-- Desempate estable: menor id de categoria; area por total y luego id.
WITH por_categoria AS (
  SELECT area_id, categoria_id, COUNT(*) AS total_categoria
  FROM reportes WHERE creado_en >= @desde AND creado_en < @hasta
  GROUP BY area_id, categoria_id
), ranking AS (
  SELECT area_id, categoria_id, total_categoria,
    SUM(total_categoria) OVER (PARTITION BY area_id) AS total_area,
    ROW_NUMBER() OVER (PARTITION BY area_id
      ORDER BY total_categoria DESC, categoria_id) AS posicion
  FROM por_categoria
)
SELECT a.id, a.nombre AS area, p.total_area,
  c.nombre AS categoria_predominante, p.total_categoria
FROM ranking p JOIN areas a ON a.id = p.area_id
JOIN categorias c ON c.id = p.categoria_id WHERE p.posicion = 1
ORDER BY p.total_area DESC, a.id;

-- R06. Serie diaria en hora local, incluye dias con cero incidencias.
-- Intervalo de dias completos; la API debe limitarlo a 366 dias como maximo.
WITH RECURSIVE dias AS (
  SELECT DATE(@desde_local) AS dia WHERE @desde_local < @hasta_local
  UNION ALL
  SELECT DATE_ADD(dia, INTERVAL 1 DAY) FROM dias
  WHERE DATE_ADD(dia, INTERVAL 1 DAY) < DATE(@hasta_local)
), conteos AS (
  SELECT DATE(CONVERT_TZ(creado_en, '+00:00', @zona)) AS dia, COUNT(*) AS total
  FROM reportes WHERE creado_en >= @desde AND creado_en < @hasta
  GROUP BY DATE(CONVERT_TZ(creado_en, '+00:00', @zona))
)
SELECT d.dia, COALESCE(c.total, 0) AS total
FROM dias d LEFT JOIN conteos c ON c.dia = d.dia ORDER BY d.dia;

-- R07. Incidencias abiertas y antiguedad desde creacion, sin filtro de periodo.
-- No hay SLA definido: antiguedad no significa incumplimiento.
SELECT id, folio, titulo, area, categoria, estado, creado_en,
  TIMESTAMPDIFF(HOUR, creado_en, UTC_TIMESTAMP(3)) AS horas_abierto
FROM v_reportes_detalle WHERE estado IN ('pendiente', 'revision')
ORDER BY creado_en, id;

-- R08. Tiempo medio hasta la ULTIMA solucion de reportes actualmente cerrados.
-- Sin datos, promedio NULL (no cero). Reaperturas se excluyen hasta cerrarse.
SELECT COUNT(*) AS reportes_solucionados,
  ROUND(AVG(TIMESTAMPDIFF(SECOND, creado_en, solucionado_en)) / 3600, 2)
    AS promedio_horas_hasta_ultima_solucion
FROM reportes WHERE estado_codigo = 'solucionado'
  AND creado_en >= @desde AND creado_en < @hasta;

-- R09. Trazabilidad. La API verifica propietario o rol personal antes de consultar.
SELECT h.id, h.estado_anterior, h.estado_nuevo,
  h.cambiado_por, u.nombre AS usuario_nombre, h.nota, h.cambiado_en
FROM historial_estados h JOIN usuarios u ON u.id = h.cambiado_por
WHERE h.reporte_id = @reporte_id ORDER BY h.cambiado_en, h.id;

-- R10. Avisos F10: ultimo estado por reporte, sin lecturas ni push persistidos.
SELECT * FROM v_avisos_personal
WHERE (@tipo_aviso IS NULL OR tipo = @tipo_aviso)
ORDER BY ocurrido_en DESC, reporte_id DESC LIMIT 50;

-- F08: la API toma actualizado_por de la sesion, nunca del cuerpo de la peticion.
-- Ejemplo (comentado para que este archivo sea de solo lectura):
-- CALL cambiar_estado_reporte(?, 'revision', ?, ?);
-- Parametros: reporte_id, actor autenticado, nota opcional.
-- Requiere migraciones; la rutina administra su propia transaccion.
-- Los triggers guardan el historial y las fechas en la misma transaccion.
