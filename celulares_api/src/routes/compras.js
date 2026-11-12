import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, notFound, toInt, toNum, bad, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';
import { resolverAlmacen, validarItems } from './_comun.js';

const router = Router();
const compra = requireRole('Almacenero');

const CABECERA = `
  SELECT ct.*, pr.razon_social AS proveedor
    FROM v_compra_total ct JOIN proveedor pr USING (id_proveedor)`;

async function compraCompleta(id, c) {
  const x = (await q(`${CABECERA} WHERE ct.id_compra = $1`, [id], c)).rows[0];
  if (!x) return null;
  x.items = (await q(
    `SELECT d.id_producto, p.codigo, p.nombre AS producto, d.cantidad, d.precio_unitario, d.subtotal,
            COALESCE((SELECT json_agg(u.imei ORDER BY u.imei) FROM unidad_celular u
                       WHERE u.id_compra = d.id_compra AND u.id_producto = d.id_producto), '[]') AS imeis
       FROM detalle_compra d JOIN producto p USING (id_producto)
      WHERE d.id_compra = $1 ORDER BY p.nombre`, [id], c)).rows;
  return x;
}

router.get('/', compra, ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  if (req.query.id_proveedor) { params.push(toInt(req.query.id_proveedor, 'id_proveedor')); where.push(`ct.id_proveedor = $${params.length}`); }
  params.push(limit, offset);
  const { rows } = await q(
    `${CABECERA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY ct.fecha_compra DESC, ct.id_compra DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/:id', compra, ah(async (req, res) => {
  const x = await compraCompleta(toInt(req.params.id, 'id'));
  if (!x) throw notFound('Compra no encontrada');
  res.json(x);
}));

// POST /api/compras { id_proveedor, numero_factura, id_metodo_pago?, id_almacen?, descuento?,
//   items:[{id_producto, cantidad, precio_unitario, imeis?:[ "..." | {imei, numero_serie} ]}] }
router.post('/', compra, ah(async (req, res) => {
  required(req.body, ['id_proveedor']);
  const items = validarItems(req.body.items, { conPrecio: true });
  const descuento = toNum(req.body.descuento ?? 0, 'descuento');

  const id = await tx(async (c) => {
    const { id_almacen } = await resolverAlmacen(c, req.body.id_almacen, req.user.id_empleado);
    const prov = (await q('SELECT estado FROM proveedor WHERE id_proveedor = $1',
      [toInt(req.body.id_proveedor, 'id_proveedor')], c)).rows[0];
    if (!prov) throw bad('Proveedor inexistente');
    if (prov.estado !== 'Activo') throw bad('El proveedor está inactivo');

    const idCompra = (await q(
      `INSERT INTO compra_proveedor (numero_factura, descuento, estado, id_proveedor, id_empleado, id_metodo_pago)
       VALUES ($1,$2,'Recibida',$3,$4,$5) RETURNING id_compra`,
      [req.body.numero_factura || null, descuento, req.body.id_proveedor, req.user.id_empleado,
       req.body.id_metodo_pago ? toInt(req.body.id_metodo_pago, 'id_metodo_pago') : null], c)).rows[0].id_compra;

    for (const it of items) {
      const p = (await q('SELECT tipo_producto FROM producto WHERE id_producto = $1', [it.id_producto], c)).rows[0];
      if (!p) throw bad(`Producto ${it.id_producto} inexistente`);
      const precio = toNum(it.precio_unitario, 'precio_unitario');

      await q('INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)',
        [idCompra, it.id_producto, it.cantidad, precio], c);

      if (p.tipo_producto === 'Celular') {
        if (!Array.isArray(it.imeis) || it.imeis.length !== it.cantidad)
          throw bad(`El producto ${it.id_producto} es celular: envía ${it.cantidad} IMEI en "imeis"`);
        for (const u of it.imeis) {
          const imei = String(typeof u === 'object' ? u.imei : u).trim();
          if (!/^\d{14,16}$/.test(imei)) throw bad(`IMEI inválido: ${imei} (14 a 16 dígitos)`);
          await q(
            `INSERT INTO unidad_celular (imei, numero_serie, id_producto, id_almacen, id_compra) VALUES ($1,$2,$3,$4,$5)`,
            [imei, (typeof u === 'object' && u.numero_serie) || null, it.id_producto, id_almacen, idCompra], c);
        }
      } else if (it.imeis?.length) throw bad(`El producto ${it.id_producto} no usa IMEI`);

      await q(
        `INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_destino, id_empleado, id_compra)
         VALUES ('Entrada',$1,'Compra a proveedor',$2,$3,$4,$5)`,
        [it.cantidad, it.id_producto, id_almacen, req.user.id_empleado, idCompra], c);
      await q('UPDATE producto SET precio_compra = $1 WHERE id_producto = $2', [precio, it.id_producto], c);
    }
    const t = (await q('SELECT total FROM v_compra_total WHERE id_compra = $1', [idCompra], c)).rows[0];
    if (t.total < 0) throw bad('El descuento supera el total de la compra');
    return idCompra;
  });
  res.status(201).json(await compraCompleta(id));
}));

export default router;
