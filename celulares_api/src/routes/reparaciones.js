import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, pick, notFound, toInt, toNum, bad, insertSql, updateSql, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
const taller = requireRole('Tecnico');
const recepcion = requireRole('Tecnico', 'Vendedor');
const bodega = requireRole('Tecnico', 'Almacenero');
const ESTADOS = ['Recibido', 'Diagnostico', 'En reparacion', 'Listo', 'Entregado', 'Cancelado'];
const CERRADOS = ['Entregado', 'Cancelado'];

// ---------- Repuestos (catálogo) ----------
router.get('/repuestos', ah(async (req, res) => {
  const params = [];
  let w = '';
  if (req.query.q) { params.push(`%${req.query.q}%`); w = 'WHERE r.nombre ILIKE $1 OR r.compatibilidad ILIKE $1'; }
  const { rows } = await q(
    `SELECT r.*, p.razon_social AS proveedor FROM repuesto r JOIN proveedor p USING (id_proveedor) ${w} ORDER BY r.nombre`, params);
  res.json(rows);
}));
const REP = ['nombre', 'descripcion', 'precio', 'stock', 'compatibilidad', 'id_proveedor'];
router.post('/repuestos', bodega, ah(async (req, res) => {
  required(req.body, ['nombre', 'precio', 'id_proveedor']);
  const s = insertSql('repuesto', pick(req.body, REP));
  res.status(201).json((await q(s.text, s.values)).rows[0]);
}));
router.put('/repuestos/:id', bodega, ah(async (req, res) => {
  const s = updateSql('repuesto', 'id_repuesto', toInt(req.params.id, 'id'), pick(req.body, REP));
  const r = await q(s.text, s.values);
  if (!r.rows[0]) throw notFound('Repuesto no encontrado');
  res.json(r.rows[0]);
}));

// ---------- Reparaciones ----------
const CABECERA = `
  SELECT r.id_reparacion, r.fecha_ingreso, r.fecha_entrega_estimada, r.fecha_entrega_real, r.falla_reportada,
         r.diagnostico, r.estado, r.id_cliente, c.nombres || ' ' || c.apellido_paterno AS cliente,
         r.id_unidad, r.id_equipo, r.id_garantia, r.id_empleado_tecnico,
         t.nombres || ' ' || t.apellido_paterno AS tecnico,
         COALESCE(u.imei, ex.imei) AS imei,
         COALESCE(pc.modelo, ex.modelo) AS modelo,
         (r.id_unidad IS NULL) AS equipo_externo,
         vt.costo_mano_obra, vt.costo_repuestos, vt.costo_total, vt.a_cobrar
    FROM reparacion r
    JOIN v_reparacion_total vt USING (id_reparacion)
    JOIN cliente c ON c.id_cliente = r.id_cliente
    JOIN empleado t ON t.id_empleado = r.id_empleado_tecnico
    LEFT JOIN unidad_celular u ON u.id_unidad = r.id_unidad
    LEFT JOIN celular pc ON pc.id_producto = u.id_producto
    LEFT JOIN equipo_externo ex ON ex.id_equipo = r.id_equipo`;

async function completa(id, c) {
  const r = (await q(`${CABECERA} WHERE r.id_reparacion = $1`, [id], c)).rows[0];
  if (!r) return null;
  r.repuestos = (await q(
    `SELECT d.id_repuesto, rp.nombre, d.cantidad, d.precio_unitario, d.subtotal
       FROM detalle_reparacion d JOIN repuesto rp USING (id_repuesto) WHERE d.id_reparacion = $1 ORDER BY rp.nombre`,
    [id], c)).rows;
  return r;
}

router.get('/', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('{P}', `$${params.length}`)); };
  if (req.query.estado) add('r.estado = {P}', req.query.estado);
  if (req.query.id_cliente) add('r.id_cliente = {P}', toInt(req.query.id_cliente, 'id_cliente'));
  if (req.query.imei) add('COALESCE(u.imei, ex.imei) ILIKE {P}', `%${req.query.imei}%`);
  if (req.user.rol === 'Tecnico') add('r.id_empleado_tecnico = {P}', req.user.id_empleado);
  params.push(limit, offset);
  const { rows } = await q(
    `${CABECERA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY r.fecha_ingreso DESC, r.id_reparacion DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/:id', ah(async (req, res) => {
  const r = await completa(toInt(req.params.id, 'id'));
  if (!r) throw notFound('Reparación no encontrada');
  res.json(r);
}));

// POST /api/reparaciones { id_cliente, falla_reportada, (id_unidad | id_equipo | equipo:{imei?,modelo,color?,id_marca}),
//                          fecha_entrega_estimada?, id_empleado_tecnico? }
router.post('/', recepcion, ah(async (req, res) => {
  required(req.body, ['id_cliente', 'falla_reportada']);
  const origenes = ['id_unidad', 'id_equipo', 'equipo'].filter((k) => req.body[k]);
  if (origenes.length !== 1) throw bad('Indica exactamente uno: id_unidad, id_equipo o equipo');
  const idCliente = toInt(req.body.id_cliente, 'id_cliente');

  const id = await tx(async (c) => {
    let id_unidad = null, id_equipo = null, id_garantia = null;
    if (req.body.id_unidad) {
      id_unidad = toInt(req.body.id_unidad, 'id_unidad');
      const own = (await q(
        `SELECT v.id_cliente FROM detalle_venta_unidad du JOIN venta v USING (id_venta) WHERE du.id_unidad = $1`,
        [id_unidad], c)).rows[0];
      if (!own) throw bad('Esa unidad no ha sido vendida por la tienda; registre un equipo externo');
      if (own.id_cliente !== idCliente) throw bad('La unidad fue vendida a otro cliente');
      const g = (await q(
        `SELECT id_garantia FROM garantia WHERE id_unidad = $1 AND estado = 'Vigente' AND fecha_fin >= CURRENT_DATE
          ORDER BY fecha_fin DESC LIMIT 1`, [id_unidad], c)).rows[0];
      id_garantia = g?.id_garantia ?? null;
    } else if (req.body.id_equipo) {
      id_equipo = toInt(req.body.id_equipo, 'id_equipo');
      const e = (await q('SELECT id_cliente FROM equipo_externo WHERE id_equipo = $1', [id_equipo], c)).rows[0];
      if (!e) throw bad('Equipo inexistente');
      if (e.id_cliente !== idCliente) throw bad('El equipo pertenece a otro cliente');
    } else {
      required(req.body.equipo, ['modelo', 'id_marca']);
      const e = pick(req.body.equipo, ['imei', 'modelo', 'color', 'id_marca']);
      const s = insertSql('equipo_externo', { ...e, id_cliente: idCliente });
      id_equipo = (await q(s.text, s.values, c)).rows[0].id_equipo;
    }
    const tecnico = req.body.id_empleado_tecnico ? toInt(req.body.id_empleado_tecnico, 'id_empleado_tecnico') : req.user.id_empleado;
    const { rows } = await q(
      `INSERT INTO reparacion (falla_reportada, fecha_entrega_estimada, id_cliente, id_unidad, id_equipo, id_garantia, id_empleado_tecnico)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_reparacion`,
      [req.body.falla_reportada, req.body.fecha_entrega_estimada || null, idCliente, id_unidad, id_equipo, id_garantia, tecnico], c);
    return rows[0].id_reparacion;
  });
  res.status(201).json(await completa(id));
}));

// PATCH /api/reparaciones/:id { estado?, diagnostico?, costo_mano_obra?, fecha_entrega_estimada?, id_empleado_tecnico? }
router.patch('/:id', taller, ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const data = pick(req.body, ['estado', 'diagnostico', 'costo_mano_obra', 'fecha_entrega_estimada', 'id_empleado_tecnico']);
  if (data.estado && !ESTADOS.includes(data.estado)) throw bad(`estado debe ser: ${ESTADOS.join(', ')}`);
  if (data.costo_mano_obra !== undefined) data.costo_mano_obra = toNum(data.costo_mano_obra, 'costo_mano_obra');
  await tx(async (c) => {
    const cur = (await q('SELECT estado FROM reparacion WHERE id_reparacion = $1 FOR UPDATE', [id], c)).rows[0];
    if (!cur) throw notFound('Reparación no encontrada');
    if (CERRADOS.includes(cur.estado)) throw bad(`La reparación ya está ${cur.estado}`);
    if (data.estado === 'Entregado') data.fecha_entrega_real = new Date().toISOString().slice(0, 10);
    if (data.estado === 'Cancelado') {
      // los repuestos usados vuelven al stock
      await q(`UPDATE repuesto r SET stock = r.stock + d.cantidad FROM detalle_reparacion d
                WHERE d.id_reparacion = $1 AND d.id_repuesto = r.id_repuesto`, [id], c);
      await q('DELETE FROM detalle_reparacion WHERE id_reparacion = $1', [id], c);
    }
    const s = updateSql('reparacion', 'id_reparacion', id, data);
    await q(s.text, s.values, c);
  });
  res.json(await completa(id));
}));

// POST /api/reparaciones/:id/repuestos { id_repuesto, cantidad }
router.post('/:id/repuestos', taller, ah(async (req, res) => {
  required(req.body, ['id_repuesto', 'cantidad']);
  const id = toInt(req.params.id, 'id');
  const idRep = toInt(req.body.id_repuesto, 'id_repuesto');
  const cant = toInt(req.body.cantidad, 'cantidad');
  await tx(async (c) => {
    const cur = (await q('SELECT estado FROM reparacion WHERE id_reparacion = $1 FOR UPDATE', [id], c)).rows[0];
    if (!cur) throw notFound('Reparación no encontrada');
    if (CERRADOS.includes(cur.estado)) throw bad(`La reparación ya está ${cur.estado}`);
    const rp = (await q('SELECT precio, stock FROM repuesto WHERE id_repuesto = $1 FOR UPDATE', [idRep], c)).rows[0];
    if (!rp) throw notFound('Repuesto no encontrado');
    if (rp.stock < cant) throw bad(`Stock insuficiente del repuesto (disponible: ${rp.stock})`);
    await q('UPDATE repuesto SET stock = stock - $1 WHERE id_repuesto = $2', [cant, idRep], c);
    await q(
      `INSERT INTO detalle_reparacion (id_reparacion, id_repuesto, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id_reparacion, id_repuesto) DO UPDATE SET cantidad = detalle_reparacion.cantidad + EXCLUDED.cantidad`,
      [id, idRep, cant, rp.precio], c);
  });
  res.status(201).json(await completa(id));
}));

router.delete('/:id/repuestos/:idRepuesto', taller, ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const idRep = toInt(req.params.idRepuesto, 'idRepuesto');
  await tx(async (c) => {
    const cur = (await q('SELECT estado FROM reparacion WHERE id_reparacion = $1 FOR UPDATE', [id], c)).rows[0];
    if (!cur) throw notFound('Reparación no encontrada');
    if (CERRADOS.includes(cur.estado)) throw bad(`La reparación ya está ${cur.estado}`);
    const d = (await q('DELETE FROM detalle_reparacion WHERE id_reparacion = $1 AND id_repuesto = $2 RETURNING cantidad',
      [id, idRep], c)).rows[0];
    if (!d) throw notFound('Ese repuesto no está en la reparación');
    await q('UPDATE repuesto SET stock = stock + $1 WHERE id_repuesto = $2', [d.cantidad, idRep], c);
  });
  res.json(await completa(id));
}));

export default router;
