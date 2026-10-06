-- Recrear los cuatro triggers con modo estricto y definidor de migraciones.
-- El runner fija SQL_MODE antes de ejecutar este archivo.
DELIMITER $$
DROP TRIGGER IF EXISTS bi_reportes$$
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

DROP TRIGGER IF EXISTS ai_reportes$$
CREATE TRIGGER ai_reportes AFTER INSERT ON reportes FOR EACH ROW
BEGIN
  INSERT INTO historial_estados
    (reporte_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en)
  VALUES (NEW.id, NULL, NEW.estado_codigo, NEW.usuario_id, NEW.creado_en);
END$$

-- F08 permite cualquier cambio entre los tres estados, incluida reapertura.
-- La primera version solo permite modificar el estado de una incidencia.
DROP TRIGGER IF EXISTS bu_reportes$$
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

DROP TRIGGER IF EXISTS au_reportes$$
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
