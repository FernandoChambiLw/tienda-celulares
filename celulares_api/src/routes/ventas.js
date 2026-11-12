import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, notFound, toInt, toNum, bad, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';
import { resolverAlmacen, validarItems } from './_comun.js';

const router = Router();
const vende = requireRole('Vendedor');
const r2 = (n) => Math.round(n * 100) / 100;

const CABECERA = `
  SELECT vt.*, c.nombres || ' ' || c.apellido_paterno AS cliente, c.ci AS cliente_ci,
         e.nombres || ' ' || e.apellido_paterno AS vendedor, mp.nombre AS metodo_pago,
         f.numero_factura
    FROM v_venta_total vt
    JOIN cliente c USING (id_cliente)
    JOIN empleado e ON e.id_empleado = vt.id_empleado
    JOIN metodo_pago mp USING (id_metodo_pago)
    LEFT JOIN factura f ON f.id_venta = vt.id_venta`;

async function ventaCompleta(id, c) {
  const v = (await q(`${CABECERA} WHERE vt.id_venta = $1`, [id], c)).rows[0];
  if (!v) return null;
  v.items = (await q(
    `SELECT d.id_producto, p.codigo, p.nombre AS producto, d.cantidad, d.precio_unitario, d.descuento, d.subtotal,
            COALESCE((SELECT json_agg(u.imei ORDER BY u.imei) FROM detalle_venta_unidad du
                       JOIN unidad_celular u USING (id_unidad)
                      WHERE du.id_venta = d.id_venta AND du.id_producto = d.id_producto), '[]') AS imeis
       FROM detalle_venta d JOIN producto p USING (id_producto)
      WHERE d.id_venta = $1 ORDER BY p.nombre`, [id], c)).rows;
  v.garantias = (await q(
    'SELECT * FROM v_garantia_vigencia WHERE id_venta = $1 ORDER BY id_garantia', [id], c)).rows;
  return v;
}

// GET /api/ventas?desde=&hasta=&id_cliente=&estado=
router.get('/', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('{P}', `$${params.length}`)); };
  if (req.query.desde) add('vt.fecha_hora >= {P}::date', req.query.desde);
  if (req.query.hasta) add("vt.fecha_hora < ({P}::date + 1)", req.query.hasta);
  if (req.query.id_cliente) add('vt.id_cliente = {P}', toInt(req.query.id_cliente, 'id_cliente'));
  if (req.query.estado) add('vt.estado = {P}', req.query.estado);
  // un vendedor solo ve sus propias ventas
  if (req.user.rol === 'Vendedor') add('vt.id_empleado = {P}', req.user.id_empleado);
  params.push(limit, offset);
  const { rows } = await q(
    `${CABECERA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY vt.fecha_hora DESC, vt.id_venta DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/:id', ah(async (req, res) => {
  const v = await ventaCompleta(toInt(req.params.id, 'id'));
  if (!v) throw notFound('Venta no encontrada');
  if (req.user.rol === 'Vendedor' && v.id_empleado !== req.user.id_empleado)
    throw notFound('Venta no encontrada');
  res.json(v);
}));

// POST /api/ventas
router.post('/', vende, ah(async (req, res) => {
  required(req.body, ['id_cliente', 'id_metodo_pago']);
  const items = validarItems(req.body.items);
  const descuento = toNum(req.body.descuento ?? 0, 'descuento');
  const impuesto = toNum(req.body.impuesto ?? 0, 'impuesto');

  const id = await tx(async (c) => {
    const { id_almacen, id_sucursal } = await resolverAlmacen(c, req.body.id_almacen, req.user.id_empleado);
    const cli = (await q("SELECT nit, razon_social, estado FROM cliente WHERE id_cliente = $1",
      [toInt(req.body.id_cliente, 'id_cliente')], c)).rows[0];
    if (!cli) throw bad('Cliente inexistente');
    if (cli.estado !== 'Activo') throw bad('El cliente está inactivo');

    const idVenta = (await q(
      `INSERT INTO venta (descuento, impuesto, id_cliente, id_empleado, id_sucursal, id_metodo_pago)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_venta`,
      [descuento, impuesto, req.body.id_cliente, req.user.id_empleado, id_sucursal,
       toInt(req.body.id_metodo_pago, 'id_metodo_pago')], c)).rows[0].id_venta;

    for (const it of items) {
      const p = (await q(
        `SELECT p.tipo_producto, p.precio_venta, p.garantia_meses, p.estado,
                (SELECT porcentaje_descuento FROM promocion pr
                  WHERE pr.id_producto = p.id_producto AND pr.estado = 'Vigente'
                    AND CURRENT_DATE BETWEEN pr.fecha_inicio AND pr.fecha_fin
                  ORDER BY porcentaje_descuento DESC LIMIT 1) AS promo
           FROM producto p WHERE p.id_producto = $1`, [it.id_producto], c)).rows[0];
      if (!p) throw bad(`Producto ${it.id_producto} inexistente`);
      if (p.estado !== 'Activo') throw bad(`El producto ${it.id_producto} no está activo`);

      const precio = it.precio_unitario !== undefined ? toNum(it.precio_unitario, 'precio_unitario') : p.precio_venta;
      let desc;
      if (it.descuento !== undefined) desc = toNum(it.descuento, 'descuento');
      else if (it.precio_unitario === undefined && p.promo) desc = r2(it.cantidad * precio * p.promo / 100);
      else desc = 0;

      await q(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento)
         VALUES ($1,$2,$3,$4,$5)`, [idVenta, it.id_producto, it.cantidad, precio, desc], c);

      let unidades = [];
      if (p.tipo_producto === 'Celular') {
        if (!Array.isArray(it.imeis) || it.imeis.length !== it.cantidad)
          throw bad(`El producto ${it.id_producto} es celular: envía ${it.cantidad} IMEI en "imeis"`);
        if (new Set(it.imeis.map(String)).size !== it.imeis.length) throw bad('IMEI repetido en la línea');
        for (const imei of it.imeis) {
          const u = (await q(
            `SELECT id_unidad FROM unidad_celular
              WHERE imei = $1 AND id_producto = $2 AND id_almacen = $3 AND estado IN ('Disponible','Reservado')
              FOR UPDATE`, [String(imei), it.id_producto, id_almacen], c)).rows[0];
          if (!u) throw bad(`El IMEI ${imei} no está disponible en este almacén para ese producto`);
          await q('INSERT INTO detalle_venta_unidad (id_unidad, id_venta, id_producto) VALUES ($1,$2,$3)',
            [u.id_unidad, idVenta, it.id_producto], c);
          unidades.push(u.id_unidad);
        }
      } else if (it.imeis?.length) throw bad(`El producto ${it.id_producto} no usa IMEI`);

      await q(
        `INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_origen, id_empleado, id_venta)
         VALUES ('Salida',$1,'Venta',$2,$3,$4,$5)`,
        [it.cantidad, it.id_producto, id_almacen, req.user.id_empleado, idVenta], c);

      if (p.garantia_meses > 0) {
        const objetivos = unidades.length ? unidades : [null];
        for (const idUnidad of objetivos)
          await q(
            `INSERT INTO garantia (fecha_inicio, meses, tipo_garantia, id_venta, id_producto, id_unidad)
             VALUES (CURRENT_DATE, $1, 'Fabricante', $2, $3, $4)`,
            [p.garantia_meses, idVenta, it.id_producto, idUnidad], c);
      }
    }

    const tot = (await q('SELECT total, subtotal FROM v_venta_total WHERE id_venta = $1', [idVenta], c)).rows[0];
    if (tot.total < 0) throw bad('El descuento general supera el total de la venta');

    if (req.body.facturar) {
      await q('LOCK TABLE factura IN EXCLUSIVE MODE', [], c);
      const n = (await q('SELECT COALESCE(MAX(id_factura),0) + 1 AS n FROM factura', [], c)).rows[0].n;
      await q(
        `INSERT INTO factura (numero_factura, nit_cliente, razon_social, id_venta) VALUES ($1,$2,$3,$4)`,
        [`FAC-${String(n).padStart(6, '0')}`, req.body.nit || cli.nit, req.body.razon_social || cli.razon_social, idVenta], c);
    }
    return idVenta;
  });
  res.status(201).json(await ventaCompleta(id));
}));

// PATCH /api/ventas/:id/anular  -> devuelve stock e IMEI, anula garantías
router.patch('/:id/anular', requireRole(), ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await tx(async (c) => {
    const v = (await q('SELECT estado FROM venta WHERE id_venta = $1 FOR UPDATE', [id], c)).rows[0];
    if (!v) throw notFound('Venta no encontrada');
    if (v.estado === 'Anulada') throw bad('La venta ya está anulada');

    const ocupadas = await q(
      `SELECT 1 FROM reparacion r JOIN garantia g USING (id_garantia) WHERE g.id_venta = $1 AND r.estado NOT IN ('Entregado','Cancelado')`,
      [id], c);
    if (ocupadas.rows[0]) throw bad('Hay reparaciones en curso con garantía de esta venta');

    const movs = (await q(
      `SELECT id_producto, cantidad, id_almacen_origen FROM movimiento_inventario
        WHERE id_venta = $1 AND tipo_movimiento = 'Salida'`, [id], c)).rows;
    for (const m of movs)
      await q(
        `INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_destino, id_empleado, id_venta)
         VALUES ('Entrada',$1,$2,$3,$4,$5,$6)`,
        [m.cantidad, `Anulación venta ${id}`, m.id_producto, m.id_almacen_origen, req.user.id_empleado, id], c);

    await q(`UPDATE unidad_celular SET estado = 'Disponible'
              WHERE id_unidad IN (SELECT id_unidad FROM detalle_venta_unidad WHERE id_venta = $1)`, [id], c);
    await q('DELETE FROM detalle_venta_unidad WHERE id_venta = $1', [id], c);
    await q("UPDATE garantia SET estado = 'Anulada' WHERE id_venta = $1", [id], c);
    await q("UPDATE venta SET estado = 'Anulada' WHERE id_venta = $1", [id], c);
  });
  res.json(await ventaCompleta(id));
}));

export default router;
