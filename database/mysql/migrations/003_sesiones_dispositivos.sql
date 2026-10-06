-- Sesiones revocables: almacenar SHA-256 de tokens aleatorios, nunca el token original.
CREATE TABLE sesiones (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  usuario_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expira_en DATETIME(3) NOT NULL,
  revocado_en DATETIME(3) NULL,
  CONSTRAINT uq_sesiones_token UNIQUE (token_hash),
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT ck_sesiones_fechas CHECK (expira_en > creado_en AND (revocado_en IS NULL OR revocado_en >= creado_en)),
  CONSTRAINT ck_sesiones_hash CHECK (token_hash REGEXP '^[0-9a-f]{64}$'),
  INDEX ix_sesiones_usuario (usuario_id, revocado_en, expira_en),
  INDEX ix_sesiones_expiracion (expira_en)
) ENGINE=InnoDB;

-- Instalacion = UUID persistente del dispositivo. Reasociar en login autenticado.
-- Un token FCM solo puede pertenecer a una instalacion/usuario a la vez.
CREATE TABLE dispositivos_push (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  usuario_id VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  plataforma ENUM('android','ios') NOT NULL,
  token VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT uq_dispositivos_token UNIQUE (token),
  CONSTRAINT fk_dispositivos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT ck_dispositivos_token CHECK (CHAR_LENGTH(TRIM(token)) > 0),
  CONSTRAINT ck_dispositivos_habilitado CHECK (habilitado IN (0,1)),
  INDEX ix_dispositivos_usuario (usuario_id, habilitado)
) ENGINE=InnoDB;
