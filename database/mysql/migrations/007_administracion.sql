-- Una institución por instalación; no concede permisos a cuentas existentes.
ALTER TABLE usuarios ADD COLUMN es_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT ck_usuarios_admin CHECK (es_admin IN (0,1) AND (es_admin=0 OR rol='personal'));

CREATE TABLE institucion (
  id TINYINT UNSIGNED PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo_soporte VARCHAR(254) NOT NULL,
  ubicacion_soporte VARCHAR(300) NOT NULL,
  CONSTRAINT ck_institucion_unica CHECK (id=1)
) ENGINE=InnoDB;
INSERT INTO institucion VALUES
  (1,'Universidad','soporte.nexou@universidad.edu','Ventanilla de Atención Universitaria, Edificio Central.');
