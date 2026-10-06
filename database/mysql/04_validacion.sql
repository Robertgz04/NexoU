-- Solo desarrollo. Requiere 01 y 02; revierte todos los datos de prueba.
-- Las rutinas auxiliares se crean antes de iniciar la transaccion.
USE nexou;
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';

DELIMITER $$
CREATE PROCEDURE nexou_validar_assert(IN condicion BOOLEAN, IN mensaje VARCHAR(128))
BEGIN
  IF condicion IS NULL OR condicion = FALSE THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = mensaje;
  END IF;
END$$

CREATE PROCEDURE nexou_validar()
BEGIN
  DECLARE n BIGINT DEFAULT 0;
  DECLARE rechazado BOOLEAN DEFAULT FALSE;
  DECLARE area SMALLINT UNSIGNED;
  DECLARE categoria SMALLINT UNSIGNED;
  DECLARE instante DATETIME(3);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT id INTO area FROM areas WHERE nombre = 'Edificio A';
  SELECT id INTO categoria FROM categorias WHERE nombre = 'Electricidad';
  CALL nexou_validar_assert(area IS NOT NULL AND categoria IS NOT NULL, 'Faltan catalogos');
  INSERT INTO usuarios
    (id, nombre, matricula, email, password_hash, password_algoritmo, rol, activo)
  VALUES
    ('__test_estudiante', 'Prueba Estudiante', '__test_e', '__test_e@example.invalid',
      'TEST_ONLY_NO_LOGIN', 'bcrypt', 'estudiante', TRUE),
    ('__test_personal', 'Prueba Personal', '__test_p', '__test_p@example.invalid',
      'TEST_ONLY_NO_LOGIN', 'bcrypt', 'personal', TRUE);

  INSERT INTO reportes (id, usuario_id, titulo, descripcion, area_id, categoria_id, creado_en)
  VALUES ('__test_reporte', '__test_estudiante', 'Luminaria sin funcionar',
    'Incidencia de validacion', area, categoria, UTC_TIMESTAMP(3) - INTERVAL 2 DAY);
  SELECT COUNT(*) INTO n FROM historial_estados
    WHERE reporte_id = '__test_reporte' AND estado_anterior IS NULL
      AND estado_nuevo = 'pendiente' AND cambiado_por = '__test_estudiante';
  CALL nexou_validar_assert(n = 1, 'Fallo historial inicial');

  UPDATE reportes SET estado_codigo = 'revision', actualizado_por = '__test_personal'
    WHERE id = '__test_reporte';
  UPDATE reportes SET estado_codigo = 'solucionado', actualizado_por = '__test_personal'
    WHERE id = '__test_reporte';
  SELECT COUNT(*) INTO n FROM reportes WHERE id = '__test_reporte'
    AND solucionado_en IS NOT NULL AND solucionado_en = actualizado_en;
  CALL nexou_validar_assert(n = 1, 'Fallo fecha de solucion');
  SELECT actualizado_en INTO instante FROM reportes WHERE id = '__test_reporte';
  UPDATE reportes SET estado_codigo = 'solucionado', actualizado_por = '__test_personal'
    WHERE id = '__test_reporte';
  SELECT COUNT(*) INTO n FROM historial_estados WHERE reporte_id = '__test_reporte';
  CALL nexou_validar_assert(n = 3, 'Estado repetido agrego un evento');
  SELECT COUNT(*) INTO n FROM reportes WHERE id = '__test_reporte' AND actualizado_en = instante;
  CALL nexou_validar_assert(n = 1, 'Estado repetido cambio fecha');
  UPDATE reportes SET estado_codigo = 'pendiente', actualizado_por = '__test_personal'
    WHERE id = '__test_reporte';
  SELECT COUNT(*) INTO n FROM reportes WHERE id = '__test_reporte' AND solucionado_en IS NULL;
  CALL nexou_validar_assert(n = 1, 'Reapertura no limpio fecha');
  SELECT COUNT(*) INTO n FROM historial_estados WHERE reporte_id = '__test_reporte';
  CALL nexou_validar_assert(n = 4, 'Fallo historial de reapertura');

  INSERT INTO evidencias (reporte_id, archivo_clave, mime_type, tamano_bytes)
    VALUES ('__test_reporte', 'test/foto.jpg', 'image/jpeg', 128);
  SELECT COUNT(*) INTO n FROM v_reportes_detalle WHERE id = '__test_reporte'
    AND evidencia_clave = 'test/foto.jpg' AND folio LIKE 'NX-%';
  CALL nexou_validar_assert(n = 1, 'Vista duplico u omitio reporte');
  SELECT COUNT(*) INTO n FROM v_avisos_personal
    WHERE reporte_id = '__test_reporte' AND tipo = 'aviso';
  CALL nexou_validar_assert(n = 1, 'Fallo vista de avisos');

  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    UPDATE reportes SET estado_codigo = 'revision', actualizado_por = '__test_estudiante'
      WHERE id = '__test_reporte';
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio cambio por estudiante');

  SET rechazado = FALSE;
  UPDATE usuarios SET activo = FALSE WHERE id = '__test_personal';
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    UPDATE reportes SET estado_codigo = 'revision', actualizado_por = '__test_personal'
      WHERE id = '__test_reporte';
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio cambio por personal inactivo');
  UPDATE usuarios SET activo = TRUE WHERE id = '__test_personal';

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    UPDATE reportes SET estado_codigo = 'invalido', actualizado_por = '__test_personal'
      WHERE id = '__test_reporte';
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio estado inexistente');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO reportes (id, usuario_id, titulo, descripcion, area_id, categoria_id)
    VALUES ('__test_invalido', '__test_personal', 'Prueba', 'Prueba', area, categoria);
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio alta por personal');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO reportes (id, usuario_id, titulo, descripcion, area_id, categoria_id)
    VALUES ('__test_invalido', '__test_estudiante', '   ', 'Prueba', area, categoria);
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio titulo vacio');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO usuarios (id, nombre, matricula, email, password_hash, password_algoritmo, rol)
    VALUES ('__test_duplicado', 'Duplicado', '__test_otro', '__test_e@example.invalid',
      'TEST_ONLY_NO_LOGIN', 'bcrypt', 'estudiante');
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio correo duplicado');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO usuarios (id, nombre, matricula, email, password_hash, password_algoritmo, rol)
    VALUES ('__test_duplicado', 'Duplicado', '__test_e', '__test_otro@example.invalid',
      'TEST_ONLY_NO_LOGIN', 'bcrypt', 'estudiante');
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio matricula duplicada');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO evidencias (reporte_id, archivo_clave, mime_type, tamano_bytes)
      VALUES ('__test_reporte', 'test/otra.jpg', 'image/jpeg', 128);
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitieron dos fotos por reporte');

  SET rechazado = FALSE;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO evidencias (reporte_id, archivo_clave, mime_type, tamano_bytes)
      VALUES ('__test_no_existe', 'test/otra.jpg', 'image/jpeg', 128);
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio evidencia sin reporte');

  SET rechazado = FALSE;
  UPDATE areas SET activo = FALSE WHERE id = area;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazado = TRUE;
    INSERT INTO reportes (id, usuario_id, titulo, descripcion, area_id, categoria_id)
    VALUES ('__test_invalido', '__test_estudiante', 'Prueba', 'Prueba', area, categoria);
  END;
  CALL nexou_validar_assert(rechazado, 'Se permitio area desactivada');
  ROLLBACK;
END$$
DELIMITER ;

CALL nexou_validar();
DROP PROCEDURE nexou_validar;
DROP PROCEDURE nexou_validar_assert;
SELECT 'OK: integridad, roles, historial, reapertura y vistas; datos revertidos' AS resultado;
