import { Router } from 'express';
import { rows } from '../../db/pool.js';
export const catalogs = Router();
catalogs.get('/', async (_req, res) => {
  const [areas, categorias, estados] = await Promise.all([
    rows('SELECT id,nombre FROM areas WHERE activo=1 ORDER BY orden,id'),
    rows('SELECT id,nombre FROM categorias WHERE activo=1 ORDER BY orden,id'),
    rows('SELECT codigo,nombre FROM estados_reporte ORDER BY orden'),
  ]);
  res.json({ areas, categorias, estados });
});
