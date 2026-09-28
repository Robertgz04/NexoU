/** Tipos para los assets estáticos (imágenes PNG) importados desde el código. */
declare module '*.png' {
  const source: number;
  export default source;
}

declare module '*.jpg' {
  const source: number;
  export default source;
}
