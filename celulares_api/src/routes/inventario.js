import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, notFound, toInt, bad, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
const roles = requireRole('Almacenero');

// GET /api/inventario?id_almacen=&id_producto=
router.get('/', ah(async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.id_almacen) { params.push(toInt(req.query.id_almacen, 'id_almacen')); where.push(`i.id_almacen = $${params.length}`); }
  if (req.query.id_producto) { params.push(toInt(req.query.id_producto, 'id_producto')); where.push(`i.id_producto = $${params.length}`); }
  const { rows } = await q(
    `SELECT i.id_inventario, i.id_almacen, a.nombre AS almacen, i.id_producto, p.codigo, p.nombre AS producto,
            p.tipo_producto, i.stock_actual, i.stock_minimo, i.stock_maximo, i.ubicacion_estante,
            i.fecha_ultima_actualizacion
       FROM inventario i JOIN almacen a USING (id_almacen) JOIN producto p USING (id_producto)
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY a.id_almacen, p.nombre`, params);
  res.json(rows);
}));

// Productos por debajo (o igual) del mínimo
router.get('/alertas', ah(async (_req, res) => {
  const { rows } = await q(
    `SELECT i.id_almacen, a.nombre AS almacen, i.id_producto, p.codigo, p.nombre AS producto,
            i.stock_actual, i.stock_minimo
       FROM inventario i JOIN almacen a USING (id_almacen) JOIN producto p USING (id_producto)
      WHERE i.stock_minimo > 0 AND i.stock_actual <= i.stock_minimo AND p.estado = 'Activo'
      ORDER BY i.stock_actual - i.stock_minimo, p.nombre`);
  res.json(rows);
}));

// Control de consistencia stock vs IMEI (debe venir vacío)
router.get('/conciliacion', roles, ah(async (_req, res) => {
  res.json((await q('SELECT * FROM v_conciliacion_celulares WHERE diferencia <> 0')).rows);
}));

// GET /api/inventario/unidades?id_producto=&id_almacen=&estado=&imei=
router.get('/unidades', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('{P}', `$${params.length}`)); };
  if (req.query.id_producto) add('u.id_producto = {P}', toInt(req.query.id_producto, 'id_producto'));
  if (req.query.id_almacen) add('u.id_almacen = {P}', toInt(req.query.id_almacen, 'id_almacen'));
  if (req.query.estado) add('u.estado = {P}', req.query.estado);
  if (req.query.imei) add('u.imei ILIKE {P}', `%${req.query.imei}%`);
  params.push(limit, offset);
  const { rows } = await q(
    `SELECT u.id_unidad, u.imei, u.numero_serie, u.estado, u.fecha_ingreso, u.id_producto, p.nombre AS producto,
            u.id_almacen, a.nombre AS almacen
       FROM unidad_celular u JOIN producto p USING (id_producto) JOIN almacen a USING (id_almacen)
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.id_unidad LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/movimientos', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  if (req.query.id_producto) { params.push(toInt(req.query.id_producto, 'id_producto')); where.push(`m.id_producto = $${params.length}`); }
  params.push(limit, offset);
  const { rows } = await q(
    `SELECT m.id_movimiento, m.fecha, m.tipo_movimiento, m.cantidad, m.motivo, m.id_producto, p.nombre AS producto,
            ao.nombre AS almacen_origen, ad.nombre AS almacen_destino, m.id_compra, m.id_venta,
            e.nombres || ' ' || e.apellido_paterno AS empleado
       FROM movimiento_inventario m
       JOIN producto p USING (id_producto) JOIN empleado e USING (id_empleado)
       LEFT JOIN almacen ao ON ao.id_almacen = m.id_almacen_origen
       LEFT JOIN almacen ad ON ad.id_almacen = m.id_almacen_destino
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.fecha DESC, m.id_movimiento DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

// POST /api/inventario/movimientos
// { tipo_movimiento: 'Traslado'|'Ajuste_entrada'|'Ajuste_salida', id_producto, cantidad, motivo,
//   id_almacen_origen?, id_almacen_destino?, imeis?: [..] }   (las Entradas y Salidas nacen de compras y ventas)
router.post('/movimientos', roles, ah(async (req, res) => {
  required(req.body, ['tipo_movimiento', 'id_producto', 'cantidad']);
  const tipo = req.body.tipo_movimiento;
  if (!['Traslado', 'Ajuste_entrada', 'Ajuste_salida'].includes(tipo))
    throw bad("Aquí solo se registran 'Traslado', 'Ajuste_entrada' o 'Ajuste_salida'");
  const cantidad = toInt(req.body.cantidad, 'cantidad');
  const idProd = toInt(req.body.id_producto, 'id_producto');
  const origen = req.body.id_almacen_origen ? toInt(req.body.id_almacen_origen, 'id_almacen_origen') : null;
  const destino = req.body.id_almacen_destino ? toInt(req.body.id_almacen_destino, 'id_almacen_destino') : null;

  const out = await tx(async (c) => {
    const p = (await q('SELECT tipo_producto FROM producto WHERE id_producto = $1', [idProd], c)).rows[0];
    if (!p) throw notFound('Producto no encontrado');

    if (p.tipo_producto === 'Celular') {
      if (tipo !== 'Traslado')
        throw bad('Para celulares dé de baja la unidad (PATCH /api/inventario/unidades/:id/baja)');
      const imeis = req.body.imeis;
      if (!Array.isArray(imeis) || imeis.length !== cantidad)
        throw bad('Para trasladar celulares envía la lista "imeis" con tantos IMEI como la cantidad');
      for (const imei of imeis) {
        const r = await q(
          `UPDATE unidad_celular SET id_almacen = $1
            WHERE imei = $2 AND id_producto = $3 AND id_almacen = $4 AND estado = 'Disponible' RETURNING 1`,
          [destino, String(imei), idProd, origen], c);
        if (!r.rows[0]) throw bad(`El IMEI ${imei} no está disponible en el almacén de origen`);
      }
    }
    const { rows } = await q(
      `INSERT INTO movimiento_inventario
         (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_origen, id_almacen_destino, id_empleado)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tipo, cantidad, req.body.motivo || null, idProd, origen, destino, req.user.id_empleado], c);
    return rows[0];
  });
  res.status(201).json(out);
}));

// PATCH /api/inventario/unidades/:id/baja  { motivo }   (celular dañado, robado, etc.)
router.patch('/unidades/:id/baja', roles, ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const out = await tx(async (c) => {
    const u = (await q(
      `UPDATE unidad_celular SET estado = 'Baja'
        WHERE id_unidad = $1 AND estado IN ('Disponible','Reservado') RETURNING id_producto, id_almacen`, [id], c)).rows[0];
    if (!u) throw bad('La unidad no existe o ya no está en el almacén');
    await q(
      `INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_origen, id_empleado)
       VALUES ('Ajuste_salida', 1, $1, $2, $3, $4)`,
      [req.body.motivo || 'Baja de unidad', u.id_producto, u.id_almacen, req.user.id_empleado], c);
    return { id_unidad: id, estado: 'Baja' };
  });
  res.json(out);
}));

// PUT /api/inventario/config  { id_almacen, id_producto, stock_minimo?, stock_maximo?, ubicacion_estante? }
router.put('/config', roles, ah(async (req, res) => {
  required(req.body, ['id_almacen', 'id_producto']);
  const { rows } = await q(
    `INSERT INTO inventario (id_almacen, id_producto, stock_minimo, stock_maximo, ubicacion_estante)
     VALUES ($1, $2, COALESCE($3, 0), $4, $5)
     ON CONFLICT (id_almacen, id_producto) DO UPDATE
        SET stock_minimo = COALESCE($3, inventario.stock_minimo),
            stock_maximo = COALESCE($4, inventario.stock_maximo),
            ubicacion_estante = COALESCE($5, inventario.ubicacion_estante)
     RETURNING *`,
    [toInt(req.body.id_almacen, 'id_almacen'), toInt(req.body.id_producto, 'id_producto'),
     req.body.stock_minimo ?? null, req.body.stock_maximo ?? null, req.body.ubicacion_estante ?? null]);
  res.json(rows[0]);
}));

export default router;
