-- Durable delivery intent is committed with the trigger-generated history event.
CREATE TABLE push_outbox (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  historial_id BIGINT UNSIGNED NOT NULL,
  reporte_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  usuario_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  dispositivo_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  estado ENUM('pendiente','enviando','enviado','descartado') NOT NULL DEFAULT 'pendiente',
  intentos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  disponible_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finalizado_en DATETIME(3) NULL,
  CONSTRAINT uq_push_evento_dispositivo UNIQUE (historial_id,dispositivo_id),
  INDEX ix_push_pendientes (estado,disponible_en,id)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER ai_historial_push AFTER INSERT ON historial_estados FOR EACH ROW
BEGIN
  INSERT INTO push_outbox (historial_id,reporte_id,usuario_id,dispositivo_id,token)
  SELECT NEW.id,NEW.reporte_id,u.id,d.id,d.token
  FROM dispositivos_push d JOIN usuarios u ON u.id=d.usuario_id
  JOIN reportes r ON r.id=NEW.reporte_id
  WHERE d.habilitado=1 AND u.activo=1 AND
    ((NEW.estado_anterior IS NULL AND u.rol='personal') OR
     (NEW.estado_anterior IS NOT NULL AND u.id=r.usuario_id));
END$$
DELIMITER ;
