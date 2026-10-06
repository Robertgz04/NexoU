-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-10-2026 a las 13:46:00
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `nexou`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`nexou_app`@`localhost` PROCEDURE `cambiar_estado_reporte` (IN `p_reporte` TEXT CHARACTER SET ascii, IN `p_estado` TEXT CHARACTER SET ascii, IN `p_actor` TEXT CHARACTER SET ascii, IN `p_nota` TEXT CHARACTER SET utf8mb4)  MODIFIES SQL DATA BEGIN
  DECLARE anterior VARCHAR(20) DEFAULT NULL;
  DECLARE evento BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `areas`
--

CREATE TABLE `areas` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `orden` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ;

--
-- Volcado de datos para la tabla `areas`
--

INSERT INTO `areas` (`id`, `nombre`, `orden`, `activo`) VALUES
(1, 'Edificio A', 1, 1),
(2, 'Edificio B', 2, 1),
(3, 'Biblioteca', 3, 1),
(4, 'Laboratorios', 4, 1),
(5, 'Cafetería', 5, 1),
(6, 'Baños', 6, 1),
(7, 'Pasillos y áreas comunes', 7, 1),
(8, 'Canchas y áreas deportivas', 8, 1),
(9, 'Jardín y patio central', 9, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `orden` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `orden`, `activo`) VALUES
(1, 'Mobiliario', 1, 1),
(2, 'Electricidad', 2, 1),
(3, 'Agua', 3, 1),
(4, 'Limpieza', 4, 1),
(5, 'Equipos', 5, 1),
(6, 'Otros', 6, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dispositivos_push`
--

CREATE TABLE `dispositivos_push` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `usuario_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `plataforma` enum('android','ios') NOT NULL,
  `token` varchar(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `habilitado` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `actualizado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados_reporte`
--

CREATE TABLE `estados_reporte` (
  `codigo` varchar(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `orden` tinyint(3) UNSIGNED NOT NULL
) ;

--
-- Volcado de datos para la tabla `estados_reporte`
--

INSERT INTO `estados_reporte` (`codigo`, `nombre`, `orden`) VALUES
('pendiente', 'Pendiente', 1),
('revision', 'En revisión', 2),
('solucionado', 'Solucionado', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evidencias`
--

CREATE TABLE `evidencias` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reporte_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `archivo_clave` varchar(512) NOT NULL,
  `mime_type` varchar(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `tamano_bytes` bigint(20) UNSIGNED NOT NULL,
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_estados`
--

CREATE TABLE `historial_estados` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reporte_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `estado_anterior` varchar(20) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `estado_nuevo` varchar(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `cambiado_por` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `cambiado_en` datetime(3) NOT NULL,
  `nota` varchar(500) NOT NULL DEFAULT ''
) ;

--
-- Disparadores `historial_estados`
--
DELIMITER $$
CREATE TRIGGER `ai_historial_push` AFTER INSERT ON `historial_estados` FOR EACH ROW BEGIN
  INSERT INTO push_outbox (historial_id,reporte_id,usuario_id,dispositivo_id,token)
  SELECT NEW.id,NEW.reporte_id,u.id,d.id,d.token
  FROM dispositivos_push d JOIN usuarios u ON u.id=d.usuario_id
  JOIN reportes r ON r.id=NEW.reporte_id
  WHERE d.habilitado=1 AND u.activo=1 AND
    ((NEW.estado_anterior IS NULL AND u.rol='personal') OR
     (NEW.estado_anterior IS NOT NULL AND u.id=r.usuario_id));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `push_outbox`
--

CREATE TABLE `push_outbox` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `historial_id` bigint(20) UNSIGNED NOT NULL,
  `reporte_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `usuario_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dispositivo_id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `token` varchar(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `estado` enum('pendiente','enviando','enviado','descartado') NOT NULL DEFAULT 'pendiente',
  `intentos` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `disponible_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `finalizado_en` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `numero` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `titulo` varchar(80) NOT NULL,
  `descripcion` varchar(500) NOT NULL,
  `area_id` smallint(5) UNSIGNED NOT NULL,
  `categoria_id` smallint(5) UNSIGNED NOT NULL,
  `estado_codigo` varchar(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'pendiente',
  `actualizado_por` varchar(40) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `actualizado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `solucionado_en` datetime(3) DEFAULT NULL
) ;

--
-- Disparadores `reportes`
--
DELIMITER $$
CREATE TRIGGER `ai_reportes` AFTER INSERT ON `reportes` FOR EACH ROW BEGIN
  INSERT INTO historial_estados
    (reporte_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en)
  VALUES (NEW.id, NULL, NEW.estado_codigo, NEW.usuario_id, NEW.creado_en);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `au_reportes` AFTER UPDATE ON `reportes` FOR EACH ROW BEGIN
  IF NEW.estado_codigo <> OLD.estado_codigo THEN
    INSERT INTO historial_estados
      (reporte_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en)
    VALUES (NEW.id, OLD.estado_codigo, NEW.estado_codigo,
      NEW.actualizado_por, NEW.actualizado_en);
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `bi_reportes` BEFORE INSERT ON `reportes` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `bu_reportes` BEFORE UPDATE ON `reportes` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `version` varchar(150) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `checksum` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `estado` enum('iniciada','aplicada') NOT NULL,
  `iniciado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `aplicado_en` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `schema_migrations`
--

INSERT INTO `schema_migrations` (`version`, `checksum`, `estado`, `iniciado_en`, `aplicado_en`) VALUES
('001_notas_estado.sql', '9655151d4163f83732a2a47cea1f0d21d13136c73924b09c542c34678bde13c0', 'aplicada', '2026-10-06 10:28:18.948', '2026-10-06 10:28:19.027'),
('002_triggers_estrictos.sql', '363aec322dccea380711e05962a23706f10ec315c479586b901dc36b1f23c841', 'aplicada', '2026-10-06 10:28:33.463', '2026-10-06 10:28:33.616'),
('003_sesiones_dispositivos.sql', 'fb1a215a9e5635d889a2186f3222a874cfd3cc5afc350f320d4a221e45dee928', 'aplicada', '2026-10-06 10:28:33.651', '2026-10-06 10:28:33.747'),
('004_push_outbox.sql', 'd7c6b887c676dcca9fa2b1f3c35ced213542faab411d0e0d3cb1fa66230f5db6', 'aplicada', '2026-10-06 10:48:21.698', '2026-10-06 10:48:21.785'),
('005_correos_institucionales.sql', '7743e0d4ae808dbc54ad56b5817679203928ed6bfe01d23ab67ec9157ef850eb', 'aplicada', '2026-10-06 10:50:26.683', '2026-10-06 10:50:26.750'),
('006_revocacion_cuentas.sql', 'f744efff830e70aa475acbcc827fce677e93bad3b6910ba2535981e3565e84bc', 'aplicada', '2026-10-06 10:52:07.780', '2026-10-06 10:52:07.879');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

CREATE TABLE `sesiones` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `usuario_id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expira_en` datetime(3) NOT NULL,
  `revocado_en` datetime(3) DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `sesiones`
--

INSERT INTO `sesiones` (`id`, `usuario_id`, `token_hash`, `creado_en`, `expira_en`, `revocado_en`) VALUES
('922111fe-1d3c-40a0-af38-b221d330ec43', '7a47ab5a-e95d-46af-ab5b-f63d2511ed0f', '65e7068ba682069d1406fa4e2b6d8103df01b046e35afc3c4cafdce1a649f2af', '2026-10-06 11:33:00.569', '2026-10-13 11:33:00.568', NULL),
('e09911c9-32bd-4d16-920f-dea48a9bcacd', 'u_inicial_estudiante', '8c269c80cf97b0cda670ef2099fdb5a4ef783e2be857f6776da237bb6ba4a717', '2026-10-06 11:28:55.403', '2026-10-13 11:28:55.398', '2026-10-06 11:29:30.527');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `matricula` varchar(30) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `password_algoritmo` enum('argon2id','bcrypt','sha256_legacy') NOT NULL,
  `rol` enum('estudiante','personal') NOT NULL DEFAULT 'estudiante',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `actualizado_en` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `matricula`, `email`, `password_hash`, `password_algoritmo`, `rol`, `activo`, `creado_en`, `actualizado_en`) VALUES
('7a47ab5a-e95d-46af-ab5b-f63d2511ed0f', 'Brayan David Casas Morales', '22607', '22607@virtual.utsc.edu.mx', '$2b$12$dtfZxuqA87G3z/thNlv0g.k3bproYotzLzL/gyIBdUW0Lb2nglkq.', 'bcrypt', 'estudiante', 1, '2026-10-06 11:33:00.563', '2026-10-06 11:33:00.563'),
('u_inicial_estudiante', 'Estudiante inicial', 'NEXOU-E001', 'nexou-e001@virtual.utsc.edu.mx', '$2y$12$iRZHAVgM/barxx2dx5Ci8.LqzJDCxFmicWzVo1uN1E8R/W4oC1sHe', 'bcrypt', 'estudiante', 1, '2026-10-06 10:29:55.072', '2026-10-06 10:50:26.717'),
('u_inicial_personal', 'Personal inicial', 'NEXOU-P001', 'nexou-p001@virtual.utsc.edu.mx', '$2y$12$O8FQ4ce4p0bYYuAgbiP.Z.hjwVN.srTiBldzahaKD1xfZcACQrtS6', 'bcrypt', 'personal', 1, '2026-10-06 10:29:55.072', '2026-10-06 10:50:26.717');

--
-- Disparadores `usuarios`
--
DELIMITER $$
CREATE TRIGGER `au_usuarios_revocar_sesiones` AFTER UPDATE ON `usuarios` FOR EACH ROW BEGIN
  IF (OLD.activo=1 AND NEW.activo=0)
    OR NOT (CAST(OLD.password_hash AS BINARY) <=> CAST(NEW.password_hash AS BINARY)) THEN
    UPDATE sesiones SET revocado_en=UTC_TIMESTAMP(3)
      WHERE usuario_id=NEW.id AND revocado_en IS NULL;
    DELETE FROM dispositivos_push WHERE usuario_id=NEW.id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_avisos_personal`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_avisos_personal` (
`reporte_id` varchar(40)
,`folio` varchar(23)
,`titulo` varchar(80)
,`usuario_nombre` varchar(150)
,`area` varchar(100)
,`estado` varchar(20)
,`tipo` varchar(6)
,`titulo_aviso` varchar(22)
,`ocurrido_en` datetime(3)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_reportes_detalle`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_reportes_detalle` (
`id` varchar(40)
,`folio` varchar(23)
,`usuario_id` varchar(40)
,`usuario_nombre` varchar(150)
,`matricula` varchar(30)
,`titulo` varchar(80)
,`descripcion` varchar(500)
,`area_id` smallint(5) unsigned
,`area` varchar(100)
,`categoria_id` smallint(5) unsigned
,`categoria` varchar(50)
,`estado` varchar(20)
,`estado_nombre` varchar(30)
,`evidencia_clave` varchar(512)
,`evidencia_mime` varchar(50)
,`creado_en` datetime(3)
,`actualizado_en` datetime(3)
,`solucionado_en` datetime(3)
,`actualizado_por` varchar(40)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_avisos_personal`
--
DROP TABLE IF EXISTS `v_avisos_personal`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY INVOKER VIEW `v_avisos_personal`  AS SELECT `v_reportes_detalle`.`id` AS `reporte_id`, `v_reportes_detalle`.`folio` AS `folio`, `v_reportes_detalle`.`titulo` AS `titulo`, `v_reportes_detalle`.`usuario_nombre` AS `usuario_nombre`, `v_reportes_detalle`.`area` AS `area`, `v_reportes_detalle`.`estado` AS `estado`, if(`v_reportes_detalle`.`estado` = 'pendiente','aviso','estado') AS `tipo`, CASE `v_reportes_detalle`.`estado` WHEN 'pendiente' THEN 'Nuevo reporte recibido' WHEN 'revision' THEN 'Reporte en revision' WHEN 'solucionado' THEN 'Reporte solucionado' END AS `titulo_aviso`, `v_reportes_detalle`.`actualizado_en` AS `ocurrido_en` FROM `v_reportes_detalle` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_reportes_detalle`
--
DROP TABLE IF EXISTS `v_reportes_detalle`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY INVOKER VIEW `v_reportes_detalle`  AS SELECT `r`.`id` AS `id`, concat('NX-',`r`.`numero`) AS `folio`, `r`.`usuario_id` AS `usuario_id`, `u`.`nombre` AS `usuario_nombre`, `u`.`matricula` AS `matricula`, `r`.`titulo` AS `titulo`, `r`.`descripcion` AS `descripcion`, `r`.`area_id` AS `area_id`, `a`.`nombre` AS `area`, `r`.`categoria_id` AS `categoria_id`, `c`.`nombre` AS `categoria`, `r`.`estado_codigo` AS `estado`, `s`.`nombre` AS `estado_nombre`, `e`.`archivo_clave` AS `evidencia_clave`, `e`.`mime_type` AS `evidencia_mime`, `r`.`creado_en` AS `creado_en`, `r`.`actualizado_en` AS `actualizado_en`, `r`.`solucionado_en` AS `solucionado_en`, `r`.`actualizado_por` AS `actualizado_por` FROM (((((`reportes` `r` join `usuarios` `u` on(`u`.`id` = `r`.`usuario_id`)) join `areas` `a` on(`a`.`id` = `r`.`area_id`)) join `categorias` `c` on(`c`.`id` = `r`.`categoria_id`)) join `estados_reporte` `s` on(`s`.`codigo` = `r`.`estado_codigo`)) left join `evidencias` `e` on(`e`.`reporte_id` = `r`.`id`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `areas`
--
ALTER TABLE `areas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_areas_nombre` (`nombre`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `dispositivos_push`
--
ALTER TABLE `dispositivos_push`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dispositivos_token` (`token`),
  ADD KEY `ix_dispositivos_usuario` (`usuario_id`,`habilitado`);

--
-- Indices de la tabla `estados_reporte`
--
ALTER TABLE `estados_reporte`
  ADD PRIMARY KEY (`codigo`),
  ADD UNIQUE KEY `uq_estados_nombre` (`nombre`);

--
-- Indices de la tabla `evidencias`
--
ALTER TABLE `evidencias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_evidencias_reporte` (`reporte_id`);

--
-- Indices de la tabla `historial_estados`
--
ALTER TABLE `historial_estados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_historial_anterior` (`estado_anterior`),
  ADD KEY `fk_historial_nuevo` (`estado_nuevo`),
  ADD KEY `fk_historial_usuario` (`cambiado_por`),
  ADD KEY `ix_historial_reporte_fecha` (`reporte_id`,`cambiado_en`,`id`);

--
-- Indices de la tabla `push_outbox`
--
ALTER TABLE `push_outbox`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_push_evento_dispositivo` (`historial_id`,`dispositivo_id`),
  ADD KEY `ix_push_pendientes` (`estado`,`disponible_en`,`id`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reportes_numero` (`numero`),
  ADD KEY `fk_reportes_actualizador` (`actualizado_por`),
  ADD KEY `ix_reportes_usuario_fecha` (`usuario_id`,`creado_en`,`id`),
  ADD KEY `ix_reportes_estado_fecha` (`estado_codigo`,`creado_en`,`id`),
  ADD KEY `ix_reportes_area_estado_fecha` (`area_id`,`estado_codigo`,`creado_en`),
  ADD KEY `ix_reportes_categoria_fecha` (`categoria_id`,`creado_en`),
  ADD KEY `ix_reportes_fecha` (`creado_en`,`id`);

--
-- Indices de la tabla `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`version`);

--
-- Indices de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sesiones_token` (`token_hash`),
  ADD KEY `ix_sesiones_usuario` (`usuario_id`,`revocado_en`,`expira_en`),
  ADD KEY `ix_sesiones_expiracion` (`expira_en`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`),
  ADD UNIQUE KEY `uq_usuarios_matricula` (`matricula`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `areas`
--
ALTER TABLE `areas`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `evidencias`
--
ALTER TABLE `evidencias`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_estados`
--
ALTER TABLE `historial_estados`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `push_outbox`
--
ALTER TABLE `push_outbox`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `numero` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `dispositivos_push`
--
ALTER TABLE `dispositivos_push`
  ADD CONSTRAINT `fk_dispositivos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `evidencias`
--
ALTER TABLE `evidencias`
  ADD CONSTRAINT `fk_evidencias_reporte` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`);

--
-- Filtros para la tabla `historial_estados`
--
ALTER TABLE `historial_estados`
  ADD CONSTRAINT `fk_historial_anterior` FOREIGN KEY (`estado_anterior`) REFERENCES `estados_reporte` (`codigo`),
  ADD CONSTRAINT `fk_historial_nuevo` FOREIGN KEY (`estado_nuevo`) REFERENCES `estados_reporte` (`codigo`),
  ADD CONSTRAINT `fk_historial_reporte` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`),
  ADD CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`cambiado_por`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `fk_reportes_actualizador` FOREIGN KEY (`actualizado_por`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `fk_reportes_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`),
  ADD CONSTRAINT `fk_reportes_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  ADD CONSTRAINT `fk_reportes_estado` FOREIGN KEY (`estado_codigo`) REFERENCES `estados_reporte` (`codigo`),
  ADD CONSTRAINT `fk_reportes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
