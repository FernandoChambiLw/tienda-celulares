import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, notFound, toInt, toNum, bad, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';
import { audit } from '../bitacora.js';

const router = Router();
const opera = requireRole('Vendedor');

const LISTA = `
  SELECT cs.id_cuenta, cs.id_venta, cs.id_cliente, cs.total, cs.pagado, cs.saldo, cs.vence, cs.estado,
         v.fecha_hora, c.nombres || ' ' || c.apellido_paterno AS cliente, c.ci AS cliente_ci, (SELECT numero FROM telefono_cliente t WHERE t.id_cliente = c.id_cliente ORDER BY id_telefono LIMIT 1) AS cliente_telefono,
         (cs.estado = 'Pendiente' AND cs.vence IS NOT NULL AND cs.vence < CURRENT_DATE) AS vencida
    FROM v_cuenta_saldo cs JOIN venta v ON v.id_venta = cs.id_venta JOIN cliente c ON c.id_cliente = cs.id_cliente`;

// GET /api/cuentas?estado=&id_cliente=   (un vendedor solo ve las de sus ventas)
router.get('/', opera, ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = []; const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('{P}', `$${params.length}`)); };
  if (req.query.estado) add('cs.estado = {P}', req.query.estado);
  else where.push("cs.estado <> 'Anulada'");
  if (req.query.id_cliente) add('cs.id_cliente = {P}', toInt(req.query.id_cliente, 'id_cliente'));
  if (req.user.rol === 'Vendedor') add('v.id_empleado = {P}', req.user.id_empleado);
  params.push(limit, offset);
  const { rows } = await q(
    `${LISTA} WHERE ${where.join(' AND ')} ORDER BY (cs.estado = 'Pendiente') DESC, cs.vence NULLS LAST, cs.id_cuenta DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

// GET /api/cuentas/resumen  -> total por cobrar y por cliente
router.get('/resumen', opera, ah(async (_req, res) => {
  const tot = (await q(
    `SELECT COALESCE(SUM(saldo),0) AS por_cobrar, COUNT(*)::int AS cuentas,
            COUNT(*) FILTER (WHERE vence < CURRENT_DATE)::int AS vencidas
       FROM v_cuenta_saldo WHERE estado = 'Pendiente'`)).rows[0];
  const clientes = (await q(
    `SELECT c.id_cliente, c.nombres || ' ' || c.apellido_paterno AS cliente,
            (SELECT numero FROM telefono_cliente t WHERE t.id_cliente = c.id_cliente ORDER BY id_telefono LIMIT 1) AS telefono, SUM(cs.saldo) AS saldo, COUNT(*)::int AS cuentas
       FROM v_cuenta_saldo cs JOIN cliente c USING (id_cliente)
      WHERE cs.estado = 'Pendiente' GROUP BY c.id_cliente ORDER BY saldo DESC LIMIT 20`)).rows;
  res.json({ ...tot, clientes });
}));

router.get('/:id', opera, ah(async (req, res) => {
  const cu = (await q(`${LISTA} WHERE cs.id_cuenta = $1`, [toInt(req.params.id, 'id')])).rows[0];
  if (!cu) throw notFound('Cuenta no encontrada');
  cu.abonos = (await q(
    `SELECT a.id_abono, a.fecha_hora, a.monto, mp.nombre AS metodo_pago, e.nombres || ' ' || e.apellido_paterno AS cobrador
       FROM abono_cuenta a JOIN metodo_pago mp USING (id_metodo_pago) JOIN empleado e USING (id_empleado)
      WHERE a.id_cuenta = $1 ORDER BY a.fecha_hora, a.id_abono`, [cu.id_cuenta])).rows;
  res.json(cu);
}));

// POST /api/cuentas/:id/abonos { monto, id_metodo_pago }
router.post('/:id/abonos', opera, ah(async (req, res) => {
  required(req.body, ['monto', 'id_metodo_pago']);
  const id = toInt(req.params.id, 'id');
  const monto = toNum(req.body.monto, 'monto', { min: 0.01 });
  await tx(async (c) => {
    await q('SELECT 1 FROM cuenta_cobrar WHERE id_cuenta = $1 FOR UPDATE', [id], c);
    const cu = (await q('SELECT * FROM v_cuenta_saldo WHERE id_cuenta = $1', [id], c)).rows[0];
    if (!cu) throw notFound('Cuenta no encontrada');
    if (cu.estado !== 'Pendiente') throw bad(`La cuenta está ${cu.estado}`);
    if (monto > cu.saldo + 0.001) throw bad(`El abono supera el saldo (Bs ${cu.saldo})`);
    await q('INSERT INTO abono_cuenta (id_cuenta, monto, id_metodo_pago, id_empleado) VALUES ($1,$2,$3,$4)',
      [id, monto, toInt(req.body.id_metodo_pago, 'id_metodo_pago'), req.user.id_empleado], c);
    if (Math.abs(cu.saldo - monto) < 0.005) await q("UPDATE cuenta_cobrar SET estado = 'Pagada' WHERE id_cuenta = $1", [id], c);
    await audit(req, 'Abono', 'cuenta_cobrar', id, `Bs ${monto} (venta ${cu.id_venta})`, c);
  });
  const cu = (await q(`${LISTA} WHERE cs.id_cuenta = $1`, [id])).rows[0];
  res.status(201).json(cu);
}));

export default router;
