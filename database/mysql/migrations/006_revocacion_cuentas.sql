DELIMITER $$
CREATE TRIGGER au_usuarios_revocar_sesiones AFTER UPDATE ON usuarios FOR EACH ROW
BEGIN
  IF (OLD.activo=1 AND NEW.activo=0)
    OR NOT (CAST(OLD.password_hash AS BINARY) <=> CAST(NEW.password_hash AS BINARY)) THEN
    UPDATE sesiones SET revocado_en=UTC_TIMESTAMP(3)
      WHERE usuario_id=NEW.id AND revocado_en IS NULL;
    DELETE FROM dispositivos_push WHERE usuario_id=NEW.id;
  END IF;
END$$
DELIMITER ;
