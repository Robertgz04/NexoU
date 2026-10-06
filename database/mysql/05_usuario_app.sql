-- Ejecutar como administrador en 127.0.0.1:3050.
-- Reemplazar CAMBIA_ESTA_CLAVE antes de ejecutar, en ambas cuentas.
-- Si la clave contiene una comilla simple, escribirla como dos comillas simples.
-- Creacion unica: si el usuario ya existe, detenerse y revisar sus permisos.
-- No ejecutar con opciones que ignoren errores.

CREATE USER 'nexou_app'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';
CREATE USER 'nexou_app'@'127.0.0.1' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';

-- Todos los permisos de base de datos, incluyendo migraciones, solo sobre nexou.
-- Sin permisos globales ni opcion para conceder permisos a otras cuentas.
GRANT ALL PRIVILEGES ON `nexou`.* TO 'nexou_app'@'localhost';
GRANT ALL PRIVILEGES ON `nexou`.* TO 'nexou_app'@'127.0.0.1';

SHOW GRANTS FOR 'nexou_app'@'localhost';
SHOW GRANTS FOR 'nexou_app'@'127.0.0.1';

-- No se necesita FLUSH PRIVILEGES despues de CREATE USER / GRANT.
-- La cuenta es para el servidor/API y migraciones, no para incluirla en React Native.
