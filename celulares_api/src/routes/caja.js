import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, notFound, toInt, toNum, bad, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';
import { audit } from '../bitacora.js';

const router = Router();
const opera = requireRole('Vendedor'); // Administrador siempre pasa

/**
 * Resumen de una caja: lo que entró por cada método de pago desde la apertura
 * (ventas al contado + abonos de créditos hechos por ese empleado) y los movimientos manuales.
 * Efectivo esperado = monto inicial + cobros en efectivo + ingresos - egresos.
 */
async function resumen(caja, c) {
  const hasta = caja.cierre ?? null;
  const cobros = (await q(
    `SELECT mp.nombre AS metodo, SUM(x.monto) AS total, COUNT(*)::int AS operaciones FROM (
        SELECT vt.id_metodo_pago, vt.total AS monto
          FROM v_venta_total vt
         WHERE vt.estado = 'Completada' AND vt.id_empleado = $1 AND vt.fecha_hora >= $2
           AND ($3::timestamp IS NULL OR vt.fecha_hora <= $3)
           AND NOT EXISTS (SELECT 1 FROM cuenta_cobrar cc WHERE cc.id_venta = vt.id_venta)
        UNION ALL
        SELECT a.id_metodo_pago, a.monto
          FROM abono_cuenta a JOIN cuenta_cobrar cc USING (id_cuenta)
         WHERE a.id_empleado = $1 AND a.fecha_hora >= $2 AND ($3::timestamp IS NULL OR a.fecha_hora <= $3)
           AND cc.estado <> 'Anulada'
     ) x JOIN metodo_pago mp USING (id_metodo_pago)
     GROUP BY mp.nombre ORDER BY mp.nombre`, [caja.id_empleado, caja.apertura, hasta], c)).rows;
  const movs = (await q('SELECT * FROM movimiento_caja WHERE id_caja = $1 ORDER BY fecha_hora, id_movimiento',
    [caja.id_caja], c)).rows;
  const efectivo = cobros.find((x) => x.metodo === 'Efectivo')?.total ?? 0;
  const ingresos = movs.filter((m) => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
  const egresos = movs.filter((m) => m.tipo === 'Egreso').reduce((s, m) => s + m.monto, 0);
  const esperado = Math.round((caja.monto_inicial + efectivo + ingresos - egresos) * 100) / 100;
  return { ...caja, cobros, movimientos: movs, efectivo_cobrado: efectivo, ingresos, egresos, esperado_calculado: esperado,
    total_cobrado: cobros.reduce((s, x) => s + x.total, 0) };
}

const SEL = `SELECT c.*, e.nombres || ' ' || e.apellido_paterno AS empleado
               FROM caja c JOIN empleado e USING (id_empleado)`;

// GET /api/caja/actual  -> caja abierta del usuario (o null)
router.get('/actual', opera, ah(async (req, res) => {
  const caja = (await q(`${SEL} WHERE c.id_empleado = $1 AND c.estado = 'Abierta'`, [req.user.id_empleado])).rows[0];
  res.json(caja ? await resumen(caja) : null);
}));

// GET /api/caja  -> historial (cada empleado ve las suyas; el administrador todas)
router.get('/', opera, ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const own = req.user.rol !== 'Administrador';
  const { rows } = await q(
    `${SEL} ${own ? 'WHERE c.id_empleado = $3' : ''} ORDER BY c.apertura DESC LIMIT $1 OFFSET $2`,
    own ? [limit, offset, req.user.id_empleado] : [limit, offset]);
  res.json(rows);
}));

// GET /api/caja/:id  (detalle de una caja, p. ej. para imprimir el cierre)
router.get('/:id', opera, ah(async (req, res) => {
  const caja = (await q(`${SEL} WHERE c.id_caja = $1`, [toInt(req.params.id, 'id')])).rows[0];
  if (!caja || (req.user.rol !== 'Administrador' && caja.id_empleado !== req.user.id_empleado)) throw notFound('Caja no encontrada');
  res.json(await resumen(caja));
}));

// POST /api/caja/abrir { monto_inicial }
router.post('/abrir', opera, ah(async (req, res) => {
  required(req.body, ['monto_inicial']);
  const monto = toNum(req.body.monto_inicial, 'monto_inicial');
  const id = await tx(async (c) => {
    if ((await q("SELECT 1 FROM caja WHERE id_empleado = $1 AND estado = 'Abierta'", [req.user.id_empleado], c)).rows[0])
      throw bad('Ya tienes una caja abierta');
    const id = (await q('INSERT INTO caja (id_empleado, monto_inicial) VALUES ($1,$2) RETURNING id_caja',
      [req.user.id_empleado, monto], c)).rows[0].id_caja;
    await audit(req, 'Apertura de caja', 'caja', id, `Monto inicial Bs ${monto}`, c);
    return id;
  });
  const caja = (await q(`${SEL} WHERE c.id_caja = $1`, [id])).rows[0];
  res.status(201).json(await resumen(caja));
}));

// POST /api/caja/movimiento { tipo, monto, concepto }
router.post('/movimiento', opera, ah(async (req, res) => {
  required(req.body, ['tipo', 'monto', 'concepto']);
  if (!['Ingreso', 'Egreso'].includes(req.body.tipo)) throw bad('Tipo inválido');
  const monto = toNum(req.body.monto, 'monto', { min: 0.01 });
  const caja = (await q("SELECT id_caja FROM caja WHERE id_empleado = $1 AND estado = 'Abierta'", [req.user.id_empleado])).rows[0];
  if (!caja) throw bad('Abre la caja primero');
  await q('INSERT INTO movimiento_caja (id_caja, tipo, monto, concepto) VALUES ($1,$2,$3,$4)',
    [caja.id_caja, req.body.tipo, monto, String(req.body.concepto).slice(0, 150)]);
  await audit(req, `${req.body.tipo} de caja`, 'caja', caja.id_caja, `Bs ${monto}: ${req.body.concepto}`);
  res.status(201).json(await resumen((await q(`${SEL} WHERE c.id_caja = $1`, [caja.id_caja])).rows[0]));
}));

// POST /api/caja/cerrar { monto_contado, observacion }
router.post('/cerrar', opera, ah(async (req, res) => {
  required(req.body, ['monto_contado']);
  const contado = toNum(req.body.monto_contado, 'monto_contado');
  const id = await tx(async (c) => {
    const caja = (await q(`${SEL} WHERE c.id_empleado = $1 AND c.estado = 'Abierta' FOR UPDATE OF c`, [req.user.id_empleado], c)).rows[0];
    if (!caja) throw bad('No tienes una caja abierta');
    caja.cierre = (await q('SELECT CURRENT_TIMESTAMP::timestamp AS t', [], c)).rows[0].t;
    const r = await resumen(caja, c);
    const dif = Math.round((contado - r.esperado_calculado) * 100) / 100;
    await q(`UPDATE caja SET estado = 'Cerrada', cierre = $2, monto_esperado = $3, monto_contado = $4, diferencia = $5, observacion = $6
              WHERE id_caja = $1`,
      [caja.id_caja, caja.cierre, r.esperado_calculado, contado, dif, req.body.observacion ? String(req.body.observacion).slice(0, 300) : null], c);
    await audit(req, 'Cierre de caja', 'caja', caja.id_caja, `Esperado ${r.esperado_calculado}, contado ${contado}, diferencia ${dif}`, c);
    return caja.id_caja;
  });
  res.json(await resumen((await q(`${SEL} WHERE c.id_caja = $1`, [id])).rows[0]));
}));

export default router;
