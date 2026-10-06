-- No reejecutar manualmente: usar scripts/migrate-mysql.mjs.
ALTER TABLE historial_estados ADD COLUMN nota VARCHAR(500) NOT NULL DEFAULT '';

DELIMITER $$
CREATE PROCEDURE cambiar_estado_reporte(
  IN p_reporte TEXT CHARACTER SET ascii,
  IN p_estado TEXT CHARACTER SET ascii,
  IN p_actor TEXT CHARACTER SET ascii,
  IN p_nota TEXT CHARACTER SET utf8mb4
)
SQL SECURITY DEFINER
MODIFIES SQL DATA
BEGIN
  DECLARE anterior VARCHAR(20) DEFAULT NULL;
  DECLARE evento BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  -- TEXT evita truncar los parametros antes de validarlos.
  IF p_reporte IS NULL OR CHAR_LENGTH(p_reporte) NOT BETWEEN 1 AND 40
    OR p_actor IS NULL OR CHAR_LENGTH(p_actor) NOT BETWEEN 1 AND 40 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Identificador invalido';
  END IF;
  IF p_estado IS NULL OR p_estado NOT IN ('pendiente','revision','solucionado') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado invalido';
  END IF;
  IF CHAR_LENGTH(TRIM(COALESCE(p_nota, ''))) > 500 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La nota no puede superar 500 caracteres';
  END IF;
  START TRANSACTION;
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id=p_actor AND rol='personal' AND activo=TRUE) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El cambio requiere personal activo';
  END IF;
  -- Serializa cambios sobre el mismo reporte; MAX(id) pertenece a esta transicion.
  SELECT estado_codigo INTO anterior FROM reportes WHERE id=p_reporte FOR UPDATE;
  IF anterior IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reporte no encontrado';
  END IF;
  IF anterior <> p_estado THEN
    UPDATE reportes SET estado_codigo=p_estado, actualizado_por=p_actor WHERE id=p_reporte;
    SELECT MAX(id) INTO evento FROM historial_estados WHERE reporte_id=p_reporte;
    UPDATE historial_estados SET nota=TRIM(COALESCE(p_nota, '')) WHERE id=evento AND reporte_id=p_reporte;
  END IF;
  COMMIT;
END$$
DELIMITER ;

-- CALL administra su propia transaccion: usar una conexion sin transaccion abierta.
-- El actor siempre se obtiene de la sesion autenticada en la API.
-- La API debe usar esta rutina para cambios; UPDATE directo no incluye notas.
