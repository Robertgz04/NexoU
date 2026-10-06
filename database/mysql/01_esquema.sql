-- NexoU: esquema inicial. MySQL 8.0.16+ / InnoDB / utf8mb4.
-- Ejecutar UNA VEZ en una base nueva. No borra ni reemplaza tablas existentes.
CREATE DATABASE IF NOT EXISTS nexou
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexou;
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE TABLE usuarios (
  id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  matricula VARCHAR(30) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  password_algoritmo ENUM('argon2id', 'bcrypt', 'sha256_legacy') NOT NULL,
  rol ENUM('estudiante', 'personal') NOT NULL DEFAULT 'estudiante',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT uq_usuarios_matricula UNIQUE (matricula),
  CONSTRAINT ck_usuarios_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT ck_usuarios_matricula CHECK (CHAR_LENGTH(TRIM(matricula)) > 0),
  CONSTRAINT ck_usuarios_email CHECK (CHAR_LENGTH(TRIM(email)) > 0),
  CONSTRAINT ck_usuarios_hash CHECK (CHAR_LENGTH(TRIM(password_hash)) > 0),
  CONSTRAINT ck_usuarios_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE areas (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_areas_nombre UNIQUE (nombre),
  CONSTRAINT ck_areas_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT ck_areas_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre),
  CONSTRAINT ck_categorias_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT ck_categorias_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE estados_reporte (
  codigo VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  orden TINYINT UNSIGNED NOT NULL,
  CONSTRAINT ck_estados_codigo
    CHECK (codigo IN ('pendiente', 'revision', 'solucionado')),
  CONSTRAINT uq_estados_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE reportes (
  id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  numero BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  titulo VARCHAR(80) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  area_id SMALLINT UNSIGNED NOT NULL,
  categoria_id SMALLINT UNSIGNED NOT NULL,
  estado_codigo VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin
    NOT NULL DEFAULT 'pendiente',
  actualizado_por VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  solucionado_en DATETIME(3) NULL,
  CONSTRAINT uq_reportes_numero UNIQUE (numero),
  CONSTRAINT fk_reportes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_reportes_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_reportes_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT fk_reportes_estado FOREIGN KEY (estado_codigo) REFERENCES estados_reporte(codigo),
  CONSTRAINT fk_reportes_actualizador FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
  CONSTRAINT ck_reportes_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0),
  CONSTRAINT ck_reportes_descripcion CHECK (CHAR_LENGTH(TRIM(descripcion)) > 0),
  CONSTRAINT ck_reportes_fechas CHECK (actualizado_en >= creado_en),
  CONSTRAINT ck_reportes_solucion CHECK (
    (estado_codigo = 'solucionado' AND solucionado_en IS NOT NULL
      AND solucionado_en >= creado_en)
    OR (estado_codigo <> 'solucionado' AND solucionado_en IS NULL)
  ),
  INDEX ix_reportes_usuario_fecha (usuario_id, creado_en, id),
  INDEX ix_reportes_estado_fecha (estado_codigo, creado_en, id),
  INDEX ix_reportes_area_estado_fecha (area_id, estado_codigo, creado_en),
  INDEX ix_reportes_categoria_fecha (categoria_id, creado_en),
  INDEX ix_reportes_fecha (creado_en, id)
) ENGINE=InnoDB;

-- Una foto opcional por reporte, de acuerdo con el formulario actual.
-- El archivo se almacena fuera de MySQL; aquí se guarda su clave y metadatos.
CREATE TABLE evidencias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporte_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  archivo_clave VARCHAR(512) NOT NULL,
  mime_type VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  tamano_bytes BIGINT UNSIGNED NOT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT uq_evidencias_reporte UNIQUE (reporte_id),
  CONSTRAINT fk_evidencias_reporte FOREIGN KEY (reporte_id) REFERENCES reportes(id),
  CONSTRAINT ck_evidencias_clave CHECK (CHAR_LENGTH(TRIM(archivo_clave)) > 0),
  CONSTRAINT ck_evidencias_mime CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT ck_evidencias_tamano CHECK (tamano_bytes > 0)
) ENGINE=InnoDB;

CREATE TABLE historial_estados (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporte_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  estado_anterior VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NULL,
  estado_nuevo VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  cambiado_por VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  cambiado_en DATETIME(3) NOT NULL,
  CONSTRAINT fk_historial_reporte FOREIGN KEY (reporte_id) REFERENCES reportes(id),
  CONSTRAINT fk_historial_anterior FOREIGN KEY (estado_anterior) REFERENCES estados_reporte(codigo),
  CONSTRAINT fk_historial_nuevo FOREIGN KEY (estado_nuevo) REFERENCES estados_reporte(codigo),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (cambiado_por) REFERENCES usuarios(id),
  CONSTRAINT ck_historial_cambio CHECK (
    estado_anterior IS NULL OR estado_anterior <> estado_nuevo
  ),
  INDEX ix_historial_reporte_fecha (reporte_id, cambiado_en, id)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER bi_reportes BEFORE INSERT ON reportes FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuarios
    WHERE id = NEW.usuario_id AND rol = 'estudiante' AND activo = TRUE) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El autor debe ser un estudiante activo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM areas WHERE id = NEW.area_id AND activo = TRUE)
    OR NOT EXISTS (SELECT 1 FROM categorias WHERE id = NEW.categoria_id AND activo = TRUE) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Area o categoria no disponible';
  END IF;
  IF NEW.estado_codigo <> 'pendiente' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El reporte debe iniciar pendiente';
  END IF;
  SET NEW.actualizado_por = NULL;
  SET NEW.actualizado_en = NEW.creado_en;
  SET NEW.solucionado_en = NULL;
END$$

CREATE TRIGGER ai_reportes AFTER INSERT ON reportes FOR EACH ROW
BEGIN
  INSERT INTO historial_estados
    (reporte_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en)
  VALUES (NEW.id, NULL, NEW.estado_codigo, NEW.usuario_id, NEW.creado_en);
END$$

-- F08 permite cualquier cambio entre los tres estados, incluida reapertura.
-- La primera version solo permite modificar el estado de una incidencia.
CREATE TRIGGER bu_reportes BEFORE UPDATE ON reportes FOR EACH ROW
BEGIN
  IF NEW.id <> OLD.id OR NEW.numero <> OLD.numero
    OR NEW.usuario_id <> OLD.usuario_id OR NEW.creado_en <> OLD.creado_en
    OR NOT (CAST(NEW.titulo AS BINARY) <=> CAST(OLD.titulo AS BINARY))
    OR NOT (CAST(NEW.descripcion AS BINARY) <=> CAST(OLD.descripcion AS BINARY))
    OR NEW.area_id <> OLD.area_id OR NEW.categoria_id <> OLD.categoria_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se permite actualizar el estado del reporte';
  END IF;
  IF NEW.estado_codigo <> OLD.estado_codigo THEN
    IF NEW.actualizado_por IS NULL OR NOT EXISTS (SELECT 1 FROM usuarios
      WHERE id = NEW.actualizado_por AND rol = 'personal' AND activo = TRUE) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El cambio requiere personal activo';
    END IF;
    SET NEW.actualizado_en = UTC_TIMESTAMP(3);
    SET NEW.solucionado_en = IF(NEW.estado_codigo = 'solucionado', NEW.actualizado_en, NULL);
  ELSE
    SET NEW.actualizado_por = OLD.actualizado_por;
    SET NEW.actualizado_en = OLD.actualizado_en;
    SET NEW.solucionado_en = OLD.solucionado_en;
  END IF;
END$$

CREATE TRIGGER au_reportes AFTER UPDATE ON reportes FOR EACH ROW
BEGIN
  IF NEW.estado_codigo <> OLD.estado_codigo THEN
    INSERT INTO historial_estados
      (reporte_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en)
    VALUES (NEW.id, OLD.estado_codigo, NEW.estado_codigo,
      NEW.actualizado_por, NEW.actualizado_en);
  END IF;
END$$
DELIMITER ;

-- Sin hashes de contrasena ni duplicacion del nombre del estudiante.
CREATE SQL SECURITY INVOKER VIEW v_reportes_detalle AS
SELECT r.id, CONCAT('NX-', r.numero) AS folio, r.usuario_id,
  u.nombre AS usuario_nombre, u.matricula,
  r.titulo, r.descripcion, r.area_id, a.nombre AS area,
  r.categoria_id, c.nombre AS categoria,
  r.estado_codigo AS estado, s.nombre AS estado_nombre,
  e.archivo_clave AS evidencia_clave, e.mime_type AS evidencia_mime,
  r.creado_en, r.actualizado_en, r.solucionado_en, r.actualizado_por
FROM reportes r
JOIN usuarios u ON u.id = r.usuario_id
JOIN areas a ON a.id = r.area_id
JOIN categorias c ON c.id = r.categoria_id
JOIN estados_reporte s ON s.codigo = r.estado_codigo
LEFT JOIN evidencias e ON e.reporte_id = r.id;

-- Replica los avisos actuales: uno por reporte segun su ultimo estado.
CREATE SQL SECURITY INVOKER VIEW v_avisos_personal AS
SELECT id AS reporte_id, folio, titulo, usuario_nombre, area, estado,
  IF(estado = 'pendiente', 'aviso', 'estado') AS tipo,
  CASE estado
    WHEN 'pendiente' THEN 'Nuevo reporte recibido'
    WHEN 'revision' THEN 'Reporte en revision'
    WHEN 'solucionado' THEN 'Reporte solucionado'
  END AS titulo_aviso,
  actualizado_en AS ocurrido_en
FROM v_reportes_detalle;
