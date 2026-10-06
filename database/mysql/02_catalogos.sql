-- Catalogos de src/constants/catalog.ts. Ejecutar despues de 01_esquema.sql.
-- Reejecutable: mantiene registros existentes (no reactiva areas deshabilitadas).
USE nexou;
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO estados_reporte (codigo, nombre, orden) VALUES
  ('pendiente', 'Pendiente', 1),
  ('revision', 'En revisión', 2),
  ('solucionado', 'Solucionado', 3)
ON DUPLICATE KEY UPDATE codigo = estados_reporte.codigo;

INSERT INTO areas (nombre, orden) VALUES
  ('Edificio A', 1), ('Edificio B', 2), ('Biblioteca', 3),
  ('Laboratorios', 4), ('Cafetería', 5), ('Baños', 6),
  ('Pasillos y áreas comunes', 7), ('Canchas y áreas deportivas', 8),
  ('Jardín y patio central', 9)
ON DUPLICATE KEY UPDATE nombre = areas.nombre;

INSERT INTO categorias (nombre, orden) VALUES
  ('Mobiliario', 1), ('Electricidad', 2), ('Agua', 3),
  ('Limpieza', 4), ('Equipos', 5), ('Otros', 6)
ON DUPLICATE KEY UPDATE nombre = categorias.nombre;

COMMIT;
