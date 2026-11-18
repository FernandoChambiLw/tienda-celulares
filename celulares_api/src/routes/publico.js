import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { q } from '../db.js';
import { ah, notFound, toInt, pageParams, bad, HttpError } from '../utils.js';
import { tx } from '../db.js';

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

// GET /api/publico/catalogo?q=&tipo=&marca=&categoria=&min=&max=&orden=nombre|precio_asc|precio_desc
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
  // Orden elegido por el visitante: solo valores de esta lista (nunca texto libre en el SQL).
  const ORDEN = { nombre: 'p.nombre', precio_asc: 'p.precio_venta, p.nombre', precio_desc: 'p.precio_venta DESC, p.nombre' };
  const order = ORDEN[req.query.orden] ?? ORDEN.nombre;
  const { rows } = await q(
    `${BASE} ${where.length ? 'AND ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
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

// Foto de un producto (guardada en la base). El parámetro ?v= es solo para renovar la caché.
router.get('/foto/:id', ah(async (req, res) => {
  const f = (await q('SELECT tipo_mime, datos FROM producto_foto WHERE id_producto = $1', [toInt(req.params.id, 'id')])).rows[0];
  if (!f) throw notFound('Sin foto');
  res.set({ 'Content-Type': f.tipo_mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
  res.send(f.datos);
}));

// ---------- Pedidos desde el carrito de la web ----------
// Se registra el pedido con el precio vigente AHORA (el servidor lo calcula; nunca se confía en el
// precio que manda el navegador). El stock no se descuenta: eso ocurre cuando el vendedor registra la venta.
const limiterPedido = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Hiciste muchos pedidos seguidos, espera unos minutos' },
});

router.post('/pedidos', limiterPedido, ah(async (req, res) => {
  const b = req.body ?? {};
  const nombre = String(b.nombre ?? '').trim();
  const telefono = String(b.telefono ?? '').replace(/[\s\-()]/g, '');
  const ci = String(b.ci ?? '').trim() || null;
  const notas = String(b.notas ?? '').trim() || null;
  if (nombre.length < 2 || nombre.length > 100) throw bad('Escribe tu nombre (2 a 100 letras)');
  if (!/^\+?\d{7,15}$/.test(telefono)) throw bad('Escribe un teléfono válido, solo números (7 a 15 dígitos)');
  if (ci && ci.length > 20) throw bad('El CI es demasiado largo');
  if (notas && notas.length > 300) throw bad('Las notas admiten hasta 300 caracteres');
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 20) throw bad('El pedido debe tener entre 1 y 20 productos');

  const items = new Map();
  for (const it of b.items) {
    const id = Number.parseInt(it?.id_producto, 10);
    const cantidad = Number.parseInt(it?.cantidad, 10);
    if (!Number.isInteger(id) || id <= 0) throw bad('Producto inválido en el pedido');
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) throw bad('Cada producto admite de 1 a 10 unidades');
    items.set(id, (items.get(id) ?? 0) + cantidad);
  }
  const ids = [...items.keys()];

  const out = await tx(async (c) => {
    const prods = (await q(`${BASE} AND p.id_producto = ANY($1)`, [ids], c)).rows;
    const stock = new Map((await q('SELECT id_producto, stock_total FROM v_stock_producto WHERE id_producto = ANY($1)', [ids], c))
      .rows.map((r) => [r.id_producto, r.stock_total]));
    const byId = new Map(prods.map((p) => [p.id_producto, p]));
    for (const [id, cantidad] of items) {
      const p = byId.get(id);
      if (!p) throw new HttpError(409, 'Un producto del carrito ya no está disponible. Revisa tu carrito.');
      if (cantidad > stock.get(id)) throw new HttpError(409, `Solo quedan ${stock.get(id)} unidades de ${p.nombre}.`);
    }
    const ped = (await q(
      'INSERT INTO pedido (nombre_cliente, telefono, ci, notas) VALUES ($1,$2,$3,$4) RETURNING id_pedido, fecha_hora',
      [nombre, telefono, ci, notas], c)).rows[0];
    let total = 0;
    const lineas = [];
    for (const [id, cantidad] of items) {
      const p = byId.get(id);
      await q('INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)',
        [ped.id_pedido, id, cantidad, p.precio_final], c);
      total += cantidad * p.precio_final;
      lineas.push({ id_producto: id, nombre: p.nombre, cantidad, precio_unitario: p.precio_final });
    }
    return { id_pedido: ped.id_pedido, fecha_hora: ped.fecha_hora, total: Math.round(total * 100) / 100, items: lineas };
  });
  res.status(201).json(out);
}));

// Consulta pública del estado de una reparación: exige el N° de orden Y el CI del cliente,
// así nadie puede ver reparaciones ajenas probando números. Devuelve solo lo que le interesa al cliente.
const limiterReparacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas, espera unos minutos' },
});

router.get('/reparacion', limiterReparacion, ah(async (req, res) => {
  const id = Number.parseInt(req.query.codigo, 10);
  const ci = String(req.query.ci ?? '').trim();
  if (!Number.isInteger(id) || id <= 0 || !ci) throw notFound('No encontramos una reparación con esos datos');
  const { rows } = await q(
    `SELECT r.id_reparacion, r.estado, r.fecha_ingreso, r.fecha_entrega_estimada, r.fecha_entrega_real,
            r.falla_reportada, r.diagnostico, COALESCE(pc.modelo, ex.modelo) AS modelo, vt.a_cobrar
       FROM reparacion r
       JOIN cliente c ON c.id_cliente = r.id_cliente
       JOIN v_reparacion_total vt USING (id_reparacion)
       LEFT JOIN unidad_celular u ON u.id_unidad = r.id_unidad
       LEFT JOIN celular pc ON pc.id_producto = u.id_producto
       LEFT JOIN equipo_externo ex ON ex.id_equipo = r.id_equipo
      WHERE r.id_reparacion = $1 AND c.ci = $2`, [id, ci]);
  if (!rows[0]) throw notFound('No encontramos una reparación con esos datos');
  res.json(rows[0]);
}));

// Consulta pública de garantía por IMEI. Solo devuelve modelo y vigencia: nada del cliente ni de la venta.
router.get('/garantia', limiterReparacion, ah(async (req, res) => {
  const imei = String(req.query.imei ?? '').replace(/\D/g, '');
  if (imei.length < 14 || imei.length > 17) throw notFound('No encontramos un equipo vendido con ese IMEI');
  const { rows } = await q(
    `SELECT pc.modelo, p.nombre AS producto, g.fecha_inicio, g.fecha_fin, gv.dias_restantes, gv.estado_real AS estado, g.meses
       FROM unidad_celular u
       JOIN celular pc ON pc.id_producto = u.id_producto
       JOIN producto p ON p.id_producto = u.id_producto
       JOIN garantia g ON g.id_unidad = u.id_unidad
       JOIN v_garantia_vigencia gv ON gv.id_garantia = g.id_garantia
      WHERE u.imei = $1 ORDER BY g.fecha_fin DESC LIMIT 1`, [imei]);
  if (!rows[0]) throw notFound('No encontramos un equipo vendido con ese IMEI');
  res.json(rows[0]);
}));

export default router;
