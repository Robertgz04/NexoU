/**
 * Pruebas del hash de contraseñas (seguridad de F01/F02).
 * Se contrasta la implementación propia contra Node's crypto.
 */

// require() global no está declarado sin @types/node (no se usa en runtime RN).
declare const require: (id: string) => any;

const {createHash} = require('crypto') as {
  createHash: (algorithm: string) => {
    update: (
      data: string,
      encoding: string,
    ) => {digest: (encoding: string) => string};
  };
};

import {hashPassword, sha256} from '../src/utils/sha256';

describe('sha256', () => {
  const cases = [
    '',
    'abc',
    'NexoU',
    'hola mundo',
    'El equipo IDGS10 · 2026 ✓',
    'ñáéíóú con acentos y emojis 🚀📋',
    'a'.repeat(55), // caso límite antes de un segundo bloque
    'b'.repeat(56), // cruza al segundo bloque
    'c'.repeat(1000),
  ];

  it.each(cases)('coincide con Node crypto para %j', input => {
    const expected = createHash('sha256').update(input, 'utf8').digest('hex');
    expect(sha256(input)).toBe(expected);
  });

  it('devuelve 64 caracteres hexadecimales', () => {
    expect(sha256('nexou')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hashPassword', () => {
  it('es determinista y usa sal por correo', () => {
    const a = hashPassword('ana@nexou.mx', 'Secreta123');
    const b = hashPassword('ana@nexou.mx', 'Secreta123');
    const c = hashPassword('otro@nexou.mx', 'Secreta123');

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('no guarda la contraseña en claro', () => {
    const hash = hashPassword('ana@nexou.mx', 'Secreta123');
    expect(hash).not.toContain('Secreta123');
  });
});
