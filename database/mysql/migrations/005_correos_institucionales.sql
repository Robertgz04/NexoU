-- Preserve identifiers, passwords, roles and history. Normalize the email only.
UPDATE usuarios SET email=CONCAT(LOWER(TRIM(matricula)), '@virtual.utsc.edu.mx');
