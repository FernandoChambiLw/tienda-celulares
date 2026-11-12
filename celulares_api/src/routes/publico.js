import { Router } from 'express';
import { q } from '../db.js';
import { ah, notFound, toInt, pageParams } from '../utils.js';

const router = Router();

// Catálogo público: sin precio de compra ni datos internos; solo productos activos con stock.
const BASE = `
  SELECT p.id_producto, p.codigo, p.nombre, p.descripcion, p.tipo_producto, p.precio_venta, p.garantia_meses,
         p.foto_url, m.nombre AS marca, c.nombre AS categoria, s.stock_total > 0 AS disponible,
         pr.porcentaje_descuento AS promo_porcentaje, pr.nombre AS promo_nombre,
         ROUND(p.precio_venta * (1 - COALESCE(pr.porcentaje_descuento,0)/100), 2) AS precio_final
    FROM producto p
    JOIN marca m USING (id_marca) JOIN categoria c USING (id_categoria)
    JOIN v_stock_producto s USING (id_producto)
    LEFT JOIN LATERAL (
        SELECT nombre, porcentaje_descuento FROM promocion x
         WHERE x.id_producto = p.id_producto AND x.estado = 'Vigente'
           AND CURRENT_DATE BETWEEN x.fecha_inicio AND x.fecha_fin
         ORDER BY porcentaje_descuento DESC LIMIT 1) pr ON TRUE
   WHERE p.estado = 'Activo' AND s.stock_total > 0`;

// GET /api/publico/catalogo?q=&tipo=&marca=&categoria=&min=&max=
router.get('/catalogo', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replaceAll('{P}', `$${params.length}`)); };
  if (req.query.q) add('(p.nombre ILIKE {P} OR m.nombre ILIKE {P})', `%${req.query.q}%`);
  if (req.query.tipo) add('p.tipo_producto = {P}', req.query.tipo);
  if (req.query.marca) add('m.nombre ILIKE {P}', req.query.marca);
  if (req.query.categoria) add('c.nombre ILIKE {P}', req.query.categoria);
  if (req.query.min) add('p.precio_venta >= {P}', Number(req.query.min) || 0);
  if (req.query.max) add('p.precio_venta <= {P}', Number(req.query.max) || 0);
  params.push(limit, offset);
  const { rows } = await q(
    `${BASE} ${where.length ? 'AND ' + where.join(' AND ') : ''} ORDER BY p.nombre LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/catalogo/:id', ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const p = (await q(`${BASE} AND p.id_producto = $1`, [id])).rows[0];
  if (!p) throw notFound('Producto no disponible');
  const tabla = { Celular: 'celular', Accesorio: 'accesorio', Dispositivo: 'dispositivo_complementario' }[p.tipo_producto];
  p.detalle = (await q(`SELECT * FROM ${tabla} WHERE id_producto = $1`, [id])).rows[0] || null;
  res.json(p);
}));

router.get('/filtros', ah(async (_req, res) => {
  const [marcas, categorias] = await Promise.all([
    q(`SELECT DISTINCT m.nombre FROM marca m JOIN producto p USING (id_marca) WHERE p.estado='Activo' ORDER BY 1`),
    q(`SELECT DISTINCT c.nombre FROM categoria c JOIN producto p USING (id_categoria) WHERE p.estado='Activo' ORDER BY 1`),
  ]);
  res.json({ marcas: marcas.rows.map((r) => r.nombre), categorias: categorias.rows.map((r) => r.nombre) });
}));

export default router;
